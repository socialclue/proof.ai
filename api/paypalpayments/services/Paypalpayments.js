'use strict';

/**
 * Paypalpayments.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

// Public dependencies.
const _ = require('lodash');
const request = require('request');

/**
* Function for http requests
*
*@param{{method, url, headers, form}}
*@return {Promise}
*/
function doRequest(options) {
  return new Promise(function (resolve, reject) {
    request(options , function (error, res, body) {
      if(res.statusCode >= 400) {
        return resolve({error: true, message: body});
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
   * Promise to fetch all paypalpayments.
   *
   * @return {Promise}
   */

  createAggrement: async (user, body) => {
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

    const access_token = auth_response.access_token;

    var aggrement_create = await doRequest({
      method: 'POST',
      url:'https://api.sandbox.paypal.com/v1/payments/billing-agreements',
      headers: {
        Authorization: 'Bearer ' + access_token,
        'Content-Type': 'application/json'
      },
      json: body
    });

    return aggrement_create;
  },

  /**
   * Promise to fetch a/an paypalpayments.
   *
   * @return {Promise}
   */

  fetch: (params) => {
    return Paypalpayments
      .findOne(_.pick(params, _.keys(Paypalpayments.schema.paths)))
      .populate(_.keys(_.groupBy(_.reject(strapi.models.paypalpayments.associations, {autoPopulate: false}), 'alias')).join(' '));
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
