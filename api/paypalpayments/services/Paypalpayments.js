'use strict';

/**
 * Paypalpayments.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

// Public dependencies.
const _ = require('lodash');
const request = require('request');
var uniqid = require('uniqid');

/**
* Function for http requests
*
*@param{{method, url, headers, form}}
*@return {Promise}
*/
function doRequest(options) {
  return new Promise(function (resolve, reject) {
    request(options , function (error, res, body) {
      if(error || res.statusCode >= 400) {
        return resolve({error: true, message: body || error.code});
      }
      const response = typeof body === 'string'? JSON.parse(body) : body;
      if (!error && res.statusCode == 200 || !response.error) {
        resolve(body);
      } else {
        reject(response.error);
      }
    });
  });
}

module.exports = {

  /**
   * Create Agreement for customers approval.
   *
   * @return {Promise}
   */

  createAgreement: async (user, body) => {
    var auth = new Buffer(strapi.config.PAYPAL_CLIENT_ID + ':' + strapi.config.PAYPAL_SECRET).toString('base64');
    var auth_response = await doRequest({
      method: 'POST',
      url:'https://api.sandbox.paypal.com/v1/oauth2/token',
      headers: {
        Authorization: 'Basic ' + auth
      },
      form: {
        grant_type: 'client_credentials'
      }
    });
    auth_response = JSON.parse(auth_response);
    if(auth_response.access_token) {
      const access_token = auth_response.access_token;

      var agreement_create = await doRequest({
        method: 'POST',
        url:'https://api.sandbox.paypal.com/v1/payments/billing-agreements',
        headers: {
          Authorization: 'Bearer ' + access_token,
          'Content-Type': 'application/json'
        },
        json: body
      });

      return agreement_create;
    } else {
      return { error: true, msg: auth_response.error };
    }
  },

  /**
   * Make payment after agreement is approved by customer.
   *
   * @return {Promise}
   */

  payment: async (user, body) => {
    var auth = new Buffer(strapi.config.PAYPAL_CLIENT_ID + ':' + strapi.config.PAYPAL_SECRET).toString('base64');
    var auth_response = await doRequest({
      method: 'POST',
      url:'https://api.sandbox.paypal.com/v1/oauth2/token',
      headers: {
        Authorization: 'Basic ' + auth
      },
      form: {
        grant_type: 'client_credentials'
      }
    });
    auth_response = JSON.parse(auth_response);

    if(auth_response.access_token) {
      const access_token = auth_response.access_token;
      var payment_create = await doRequest({
        method: 'POST',
        url:`https://api.sandbox.paypal.com/v1/payments/billing-agreements/${body.token}/agreement-execute`,
        headers: {
          Authorization: 'Bearer ' + access_token,
          'Content-Type': 'application/json'
        },
        json: body
      });
      if(payment_create && payment_create.plan) {
        var plan_details = await doRequest({
          method: 'GET',
          url: `https://api.sandbox.paypal.com/v1/payments/billing-plans/${body.planId}`,
          headers: {
            Authorization: 'Bearer ' + access_token,
            'Content-Type': 'application/json'
          },
          json: body
        });
        const plan = payment_create.plan;
        const planDefination = plan.payment_definitions[0];
        const agreement = payment_create.agreement_details;
        const planDetails = {
          id: payment_create.id,
          name: plan_details.name,
          details: planDefination.details,
          description: plan_details.description,
          published: payment_create.start_date,
          statement_descriptor: payment_create.state,
          trial_period_days: 0,
          amount: planDefination.amount.value,
          currency: plan.currency_code,
          interval: planDefination.frequency,
          interval_count: planDefination.frequency_interval,
          type: 'subscription',
          created_at: agreement.next_billing_date,
          updated_at: agreement.next_billing_date,
        };
        let profileData = await Profile.findOne({user: user._id});
        const profile = await Profile.findOneAndUpdate(
          {user: user._id},
          {$set:
            {
              plan: planDetails,
              uniqueVisitorQouta: profileData.uniqueVisitorQouta + Number(body.description),
              uniqueVisitorsQoutaLeft: profileData.uniqueVisitorsQoutaLeft + Number(body.description)
            }
          },
          {new: true}
        );
        await strapi.plugins.email.services.email.planUpgrade(
          user.email,
          user.username,
          {
            name: planDetails.name,
            uniqueVisitorQouta: profileData.uniqueVisitorQouta,
            uniqueVisitorsQoutaLeft: profileData.uniqueVisitorsQoutaLeft + Number(body.description)
          }
        );
        return profile;
      } else {
        return payment_create;
      }

    } else {
      return { error: true, msg: auth_response.error };
    }
  },

  /**
   * Affiliate withdraw request by customer.
   *
   * @return {Promise}
   */

  withdraw: async (user, body) => {
    var auth = new Buffer(strapi.config.PAYPAL_CLIENT_ID + ':' + strapi.config.PAYPAL_SECRET).toString('base64');
    var auth_response = await doRequest({
      method: 'POST',
      url:'https://api.sandbox.paypal.com/v1/oauth2/token',
      headers: {
        Authorization: 'Basic ' + auth
      },
      form: {
        grant_type: 'client_credentials'
      }
    });

    auth_response = JSON.parse(auth_response);
    if(auth_response.access_token) {
      const access_token = auth_response.access_token;
      var payment_create = await doRequest({
        method: 'POST',
        url: `https://api.sandbox.paypal.com/v1/payments/payouts?sync_mode=false`,
        headers: {
          'Authorization': 'Bearer ' + access_token,
          'Content-Type': 'application/json'
        },
        json: {
          "sender_batch_header": {
            "sender_batch_id": uniqid(),
            "email_subject": "You have a payout!",
            "email_message": "You have received a payout! Thanks for using our service!"
          },
          "items": [
            {
              "recipient_type": "EMAIL",
              "amount": {
                "value": body.amount,
                "currency": "USD"
              },
              "note": "Thanks for your patronage!",
              "sender_item_id": "201803190001",
              "receiver": body.email
            }
          ]
        }
      });
      if(payment_create) {
        return payment_create;
      } else {
        return payment_create;
      }

    } else {
      return { error: true, msg: auth_response.error };
    }
  },

  /**
   * Promise to add a/an paypalpayments.
   *
   * @return {Promise}
   */

  add: async (values) => {
    const data = await Paypalpayments.create(_.omit(values, _.keys(_.groupBy(strapi.models.paypalpayments.associations, 'alias'))));
    await strapi.hook.mongoose.manageRelations('paypalpayments', _.merge(_.clone(data), { values }));
    return data;
  },

  /**
   * Promise to edit a/an paypalpayments.
   *
   * @return {Promise}
   */

  edit: async (params, values) => {
    // Note: The current method will return the full response of Mongo.
    // To get the updated object, you have to execute the `findOne()` method
    // or use the `findOneOrUpdate()` method with `{ new:true }` option.
    await strapi.hook.mongoose.manageRelations('paypalpayments', _.merge(_.clone(params), { values }));
    return Paypalpayments.update(params, values, { multi: true });
  },

  /**
   * Promise to remove a/an paypalpayments.
   *
   * @return {Promise}
   */

  remove: async params => {
    // Note: To get the full response of Mongo, use the `remove()` method
    // or add spent the parameter `{ passRawResult: true }` as second argument.
    const data = await Paypalpayments.findOneAndRemove(params, {})
      .populate(_.keys(_.groupBy(_.reject(strapi.models.paypalpayments.associations, {autoPopulate: false}), 'alias')).join(' '));

    _.forEach(Paypalpayments.associations, async association => {
      const search = (_.endsWith(association.nature, 'One')) ? { [association.via]: data._id } : { [association.via]: { $in: [data._id] } };
      const update = (_.endsWith(association.nature, 'One')) ? { [association.via]: null } : { $pull: { [association.via]: data._id } };

      await strapi.models[association.model || association.collection].update(
        search,
        update,
        { multi: true });
    });

    return data;
  }
};
