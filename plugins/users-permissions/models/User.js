'use strict';

/**
 * Lifecycle callbacks for the `User` model.
 */
 const crypto = require('crypto');
 const request = require('request');
 const uuidv4 = require('uuid/v4');
 const bcrypt = require('bcryptjs');
 const schedule = require('node-schedule');
 const moment = require('moment');


 /**
 * Function for http requests
 *
 *@param{{method, url, headers, form}}
 *@return {Promise}
 */
function doRequest(options) {
  return new Promise(function (resolve, reject) {
    request(options , function (error, res, body) {
      if(res && res.statusCode >= 400) {
        return resolve({error: true, message: body});
      }
      const response = typeof body === 'string'? JSON.parse(body) : body;
      if (!error && res.statusCode == 200 || (response && !response.error)) {
        resolve(body);
      } else {
        reject(error || (response && response.error?response.error:''));
      }
    });
  });
}

/**
* Function for campaign check
*
*@param{{user, callback}}
*@return {Promise}
*/
const campaignChecker = async (user, done) => {
  if(user && user._id) {
    const profile = await Profile.findOne({user: user?user._id:null});
    if(profile && profile._id) {
      const campaigns = await Campaign.find({profile: profile?profile._id:null});
      if(campaigns && campaigns.length) {
        let checkActive = 0;
        campaigns.map(async campaign => {
          await strapi.services.elasticsearch.query('filebeat-*', campaign.trackingId).then(res=>{
            if(res.hits && res.hits.hits && res.hits.hits.length)
              checkActive++;
          });
        });
        if(!checkActive) {
          await strapi.plugins.email.services.email.singlePointContact(user.email, user.username);
          done('No Campaign Found');
        } else {
          done(null);
        }
      } else {
        await strapi.plugins.email.services.email.singlePointContact('shankyrana@hotmail.com', user.username);
        done('Campaign Not Found');
      }
    } else {
      done('Profile Not Found');
    }
  } else {
    done('User Not Found');
  }
}

module.exports = {
  // Before saving a value.
  // Fired before an `insert` or `update` query.
  // beforeSave: async (model) => {
  // },

  // After saving a value.
  // Fired after an `insert` or `update` query.
  // afterSave: async (model, result) => {},

  // Before fetching all values.
  // Fired before a `fetchAll` operation.
  // beforeFetchAll: async (model) => {},

  // After fetching all values.
  // Fired after a `fetchAll` operation.
  // afterFetchAll: async (model, results) => {},

  // Fired before a `fetch` operation.
  // beforeFetch: async (model) => {},

  // After fetching a value.
  // Fired after a `fetch` operation.
  // afterFetch: async (model, result) => {},

  // Before creating a value.
  // Fired before `insert` query.
  beforeCreate: async (model) => {
    //create verification token for new customer
    const verificationToken = crypto.randomBytes(64).toString('hex');
    model.verificationToken = verificationToken
    model.verified = false;
    model.path = '/getting-started';
    model.status = 'running';
    let password = await bcrypt.hash(uuidv4(), 10);

    model.password = model.password?model.password:'mySecretPasswordInPlace';

    const user = {
      id: model._id,
      name: model.username || 'test',
      email: model.email,
      password: model.password,
      provider: 'local',
      customer_id: model._id,
    };
    try {
      //create new user in servicebot
      var data = await doRequest({method: 'POST', url:'https://servicebot.useinfluence.co/api/v1/users/register', form: user});
      //retrieve auth token for new user
      var token = await doRequest({method: 'POST', url:'https://servicebot.useinfluence.co/api/v1/auth/token', form: { email: model.email, password: user.password }});
      //retrieve new user's details from servicebot
      var userDetails = await doRequest({method: 'GET', url:'https://servicebot.useinfluence.co/api/v1/users/own', headers: {
        Authorization: 'JWT ' + JSON.parse(token).token,
        'Content-Type': 'application/json'
      }});
      //parse and save servicebot's new user's details to db
      userDetails = userDetails?JSON.parse(userDetails):[];
      if(userDetails.length)
        model.servicebot = {
          client_id: userDetails[0].id,
          status: userDetails[0].status
        }
    } catch(error) {
      const err = {
        message: "Email already taken"
      };
      return err;
    }
  },

  // After creating a value.
  // Fired after `insert` query.
  afterCreate: async (model, result) => {
    /**
    * send email verification mail to new user
    *
    *@param{{email, subject, name, verificationToken}}
    *@return {Promise}
    */
    const email = result.email;
    const name = result.username.charAt(0).toUpperCase() + result.username.substr(1);
    const verificationToken = result.verificationToken;
    strapi.plugins.email.services.email.accountCreated(email, name, verificationToken);

    var date = moment().add(5, 'hours');
    schedule.scheduleJob(date.format(), async function(user){
      // strapi.plugins.email.services.email.account(email, name, verificationToken);
      const findUser = await strapi.query('user', 'users-permissions').findOne({
        _id: user._id || user.id
      });
      if(findUser && (!findUser.payment || (findUser.payment && !findUser.payment.length)))
        console.log('User has not completed payment yet!');
    }.bind(null,result));

    const state = {
      past_state: {
        state: null,
        created_at: null,
        updated_at: null
      },
      present_state: {
        state: "User Created",
        created_at: new Date(),
        updated_at: new Date()
      },
      future_state: {
        state: "Create Profile",
        created_at: new Date(),
        updated_at: new Date()
      },
      user: result._id
    };
    //Create new state for new user
    strapi.api.state.services.state.add(state);
    let oldDate = new Date();
    await strapi.config.functions.kue.createJob(result.email, 'Campaign creation check', 'Checks whether the users has created campaign after two days or not and hits th mail.', result, 'medium', 1, new Date(oldDate.getTime() + .5*60000),function(err) {
      if(err)
        console.log(err);
      else
        strapi.config.functions.kue.processJobs(result.email, 1, campaignChecker);
    });
  },

  // Before updating a value.
  // Fired before an `update` query.
  // beforeUpdate: async (model) => {},

  // After updating a value.
  // Fired after an `update` query.
  // afterUpdate: async (model, result) => {},

  // Before destroying a value.
  // Fired before a `delete` query.
  // beforeDestroy: async (model) => {},

  // After destroying a value.
  // Fired after a `delete` query.
  // afterDestroy: async (model, result) => {}
};
