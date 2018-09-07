'use strict';

/**
 * Oauth.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

// Public dependencies.
const _ = require('lodash');
var oauth2orize = require('oauth2orize')
var jwt = require('jwt-simple');
const request = require('request');

var server = oauth2orize.createServer();


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

// Register serialialization function
server.serializeClient(function(client, callback) {
  return callback(null, client._id);
});

// Register deserialization function
server.deserializeClient(function(id, callback) {
  Client.findOne({ _id: id }, function (err, client) {
    if (err) { return callback(err); }
    return callback(null, client);
  });
});

// Register authorization code grant type
server.grant(oauth2orize.grant.code(function(client, redirectUri, user, ares, callback) {
  // Create a new authorization code
  var code = new Code({
    value: uid(16),
    clientId: client._id,
    redirectUri: redirectUri,
    userId: client.userId
  });

  // Save the auth code and check for errors
  code.save(function(err) {
    if (err) { return callback(err); }

    callback(null, code.value);
  });
}));

// Register exchange code grant type
server.exchange(oauth2orize.exchange.code(function(client, code, redirectUri, callback) {
  Code.findOne({ value: code }, function (err, authCode) {
    if (err) { return callback(err); }
    if (authCode === undefined) { return callback(null, false); }
    if (client._id.toString() !== authCode.clientId) { return callback(null, false); }
    if (redirectUri !== authCode.redirectUri) { return callback(null, false); }

    // Delete auth code now that it has been used
    authCode.remove(function (err) {
      if(err) { return callback(err); }

      // Create a new access token
      var token = new Token({
        value: uid(256),
        clientId: authCode.clientId,
        userId: authCode.userId
      });

      // Save the access token and check for errors
      token.save(function (err) {
        if (err) { return callback(err); }
        var enctoken = jwt.encode(token, config.secret);
        callback(null, enctoken);
      });
    });
  });
}));


function uid (len) {
  var buf = []
    , chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    , charlen = chars.length;

  for (var i = 0; i < len; ++i) {
    buf.push(chars[getRandomInt(0, charlen - 1)]);
  }

  return buf.join('');
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {

  /**
   * Promise for client authorization.
   * @param {clientId}
   * @param {redirectUri}
   * @return {Promise}
   */

  authorization: (clientId, redirectUri) => {
    Client.findOne({ id: clientId }, function (err, client) {
      if (err) {
        return { message: err, error: true };
      }

      return {client, redirectUri, error: false};
    });
  },

  /**
   * Promise to make a authorize oauth decision.
   *
   * @return {Promise}
   */

  decision: async () => {
    return server.decision();
  },

  /**
   * Promise to get a/an oauth token.
   *
   * @return {Promise}
   */

  token: async () => {
    return server.token();
  },

  /**
   * Retrieve access token and add script.
   *
   * @return {Promise}
   */

  access_token: async (body, params) => {
    const CampaignData = await Campaign.findOne({trackingId: body.trackingId});
    if(CampaignData.shopify) {
      return { message: 'You have already integrated with Shopify', error: false };
    } else {
      const requestBody = {
        code: body.requestBody.code,
        client_secret: body.requestBody.client_secret,
        client_id: body.requestBody.client_id
      };
      const data = await doRequest({method: 'POST', url: body.requestURL, form: requestBody});
      //retrieve auth token for new user
      if(!data.error) {
        const access_token = JSON.parse(data).access_token;

        var accessAPI = await doRequest({
          method: 'POST',
          url:`https://${body.shopLink}/admin/script_tags.json`,
          headers: {
            'X-Shopify-Access-Token': access_token,
            'Content-Type': 'application/json'
          },
          form: {
            "script_tag": {
              "event": "onload",
              "src": `https://storage.googleapis.com/influence-197607.appspot.com/influence-analytics.js?trackingId=${body.trackingId}`
            }
          }
        });

        const script_tag = JSON.parse(accessAPI);
        await Campaign.update(
          {
            trackingId: body.trackingId
          }, {
            $set:
            {
              shopify: {
                access_token,
                scriptId: script_tag.id
              }
            }
          }, {
            new: true
          }
        );
        return {error: false, message: 'Script added to Shopify'};
      } else {
        return {error: true, message: 'Invalid Access'}
      }
    }
  }
};
