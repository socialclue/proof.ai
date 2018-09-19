'use strict';

/**
 * `Websocket` service.
 */
const fs = require('fs');
const elasticsearch = require('elasticsearch');
const moment = require('moment');
const uuidv1 = require('uuid/v1');

const client = elasticsearch.Client({
  host: '104.196.139.231:9200', // Remove this Should get it from the strapi.config.elasticsearchNode
  requestTimeout: Infinity, // Tested
  keepAlive: true, // Tested
  log: 'trace'
});

const webSocketStream = fs.createWriteStream('/var/lib/docker/containers/websocket.log');

// const bunyan = require('bunyan');
// const LoggingBunyan = require('@google-cloud/logging-bunyan').LoggingBunyan;
//
//
// const loggingBunyan = new LoggingBunyan();
//
// const logger = bunyan.createLogger({
//   name: 'websocket-logging',
//   streams: [
//     {stream: process.stdout, level: 'info'},
//     loggingBunyan.stream('info')
//   ],
// });

/**
*gets enrichment data of a user
**/
const getUser = async function(email, callback) {
  let userDetail;
  if(email)
    try {
      await strapi.services.enrichment.picasaWeb(email).then(res=>{
        callback(null, res);
      });
    } catch(err) {
      try {
        await strapi.services.enrichment.gravatr(email).then(res => {
          callback(null, res);
        });
      } catch(err) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        userDetail = {
          username: re.test(email)?email.replace(/@.*$/,""):'Anonymous'
        };
        callback(null, userDetail);
      }
    }
  else
    callback(null);
}

/**
*Kue job function to log new user into ES
**/
const campaignLogger = function(value, done) {
  console.log(value, '========value');
  Campaign.findOne(
    { trackingId: value.trackingId },
    { rule: 1, websiteUrl: 1 }
  )
  .exec()
  .then(async campaign => {

    let captureLeads = await strapi.api.notificationpath.services.notificationpath.findRulesPath({_id: campaign.rule, type: 'lead' });

    captureLeads = captureLeads.map(lead => lead.url);
    console.log(captureLeads.indexOf(value.source.url.pathname), '=======captureLeads');
    if(captureLeads.indexOf(value.source.url.pathname) >= 0 ) {
      console.log('===========inside');
      let form = value.form;
      let email = form.email || form.EMAIL || form.Email || form.your-email;
      let username = form.firstName || form.FirstName || form.firstname || form.FIRSTNAME ||
        form.username || form.USERNAME || form.UserName || form.Username ||
        form.FNAME || form.Fname || form.fname || form.FName || form['your-name'] ||
        form.lastName || form.lastname || form.LastName || form.LASTNAME || "Anonymous";
      let geo = value.geo;

      let userDetail = {
        email: email,
        username: username,
        timestamp: moment(value.timestamp).format(),
        city: geo?geo.city:null,
        country: geo?geo.country:null,
        latitude: geo?geo.latitude:null,
        longitude: geo?geo.longitude:null,
        trackingId: value.trackingId,
        host: value.source.url.host,
        path: value.source.url.pathname
      };

      await getUser(userDetail.email, (err, userInfo) => {
        if(err)
          done(err);
        else if(userDetail) {
          userDetail['username'] = userDetail.username ? userDetail.username : userInfo.username;
          userDetail['profile_pic'] = userInfo.profile_pic;

          console.log(userDetail, '============>userDetail');
          /**
          *log data to elasticsearch
          **/
          client.create({
            index: `signups`,
            type: 'user',
            id: uuidv1(),
            body: userDetail
          }, (err, res)=>{

            if(err)
              done(err);
            else
              done();
          });
        }
      });
    }
  })
  .catch(err => {
    done(err);
  });
};

module.exports =  {
  /**
   * We are logging data to google cloud stackdriver and then  filebeats can pull it  and then sending it to logstash and thus to elasticsearch
   * @param msg
   */
  log : async(msg) => {
    const formatter = msg;
    let message =  formatter + '\n';

    if(msg.value && msg.value.form) {
      console.log(msg.value.fingerprint, '==============fingerprint');
      await strapi.config.functions.kue.createJob(msg.value.fingerprint, 'Campaign Logger', 'Logs new form data into Signups index', msg.value, 'high', 3, function(err) {
        if(err)
          console.log(err);
        else
          strapi.config.functions.kue.processJobs(msg.value.fingerprint, 1, campaignLogger)
      });
    }

    webSocketStream.write(message);
  },

  health: () => {
    if (strapi.websocket){
      return true;
    } else {
      return false;
    }
  }
};
