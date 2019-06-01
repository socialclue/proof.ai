'use strict';

/**
 * `Websocket` service.
 */
const fs = require('fs');
const elasticsearch = require('elasticsearch');
const moment = require('moment');
const uuidv1 = require('uuid/v1');

const client = elasticsearch.Client({
  host: 'localhost:9200', // Remove this Should get it from the strapi.config.elasticsearchNode
  requestTimeout: Infinity, // Tested
  keepAlive: true, // Tested
  log: 'trace'
});

const webSocketStream = fs.createWriteStream('/tmp/websocket/websocket.log');

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
  Campaign.findOne(
    { trackingId: value.trackingId },
    { rule: 1, websiteUrl: 1 }
  )
  .exec()
  .then(async campaign => {
    let captureLeads = await strapi.api.notificationpath.services.notificationpath.findRulesPath({_id: campaign.rule, type: 'lead' });

    captureLeads = captureLeads.map(lead => lead.url);
    const pattern = value.source.url.pathname;
    if(captureLeads.findIndex(value => pattern.match(value)) >= 0 || captureLeads.findIndex(value => value.match(pattern)) >= 0) {
      let form = value.form;
      let email = form.email || form.EMAIL || form.Email || form['your-email'];
      if(!email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        Object.keys(form).map(function(key, index) {
          if(re.test(String(form[key]).toLowerCase()))
           email = form[key];
        });
      }

      let username = form.name || form.Name || form.NAME || form.firstName || form.FirstName || form.firstname || form.FIRSTNAME ||
        form.username || form.USERNAME || form.UserName || form.Username ||
        form.Un || form.UN || form.uN ||
        form.FNAME || form.Fname || form.fname || form.FName || form['your-name'] ||
        form['First Name'] || form['first name'] ||
        form.lastName || form.lastname || form.LastName || form.LASTNAME ||
        form.LN || form.ln || form.lN ||
        form['Last Name'] || form['last name'] ||
        email.match(/^([^@]*)@/)[1] || "Someone";

      let geo = value.geo;

      let userDetail = {
        email: email,
        username: username?username.replace(/[0-9]/g, '').toLowerCase().split('.').join(' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '):username,
        timestamp: moment(value.timestamp).format(),
        city: geo?geo.city:null,
        country: geo?geo.country:null,
        latitude: geo?geo.latitude:null,
        longitude: geo?geo.longitude:null,
        trackingId: value.trackingId,
        host: value.source.url.host,
        path: value.source.url.pathname
      };
      if(userDetail.email)
        await getUser(userDetail.email, (err, userInfo) => {
          if(err)
            done(err);
          else if(userDetail) {
            userDetail['username'] = userDetail.username ? userDetail.username : userInfo.username;
            userDetail['profile_pic'] = userInfo.profile_pic;

            /**
            *log data to elasticsearch
            **/
            client.create({
              index: `signups`,
              type: 'user',
              id: uuidv1(),
              body: userDetail
            }, (err, res)=> {
              if(err)
                done(err);
              else
                done();
            });
          }
        });
      else
        client.create({
          index: `signups`,
          type: 'user',
          id: uuidv1(),
          body: userDetail
        }, (err, res)=> {
          if(err)
            done(err);
          else
            done();
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

    webSocketStream.write(message);

    let testJSON = JSON.parse(msg);
    if(testJSON.value && testJSON.value.event == 'formsubmit') {
      await strapi.config.functions.kue.createJob(testJSON.value.fingerprint, 'Campaign Logger', 'Logs new form data into Signups index', testJSON.value, 'high', 3, 0, function(err) {
        if(err)
          console.log(err);
        else
          strapi.config.functions.kue.processJobs(testJSON.value.fingerprint, 1, campaignLogger)
      });
    }
  },

  health: () => {
    if (strapi.websocket){
      return true;
    } else {
      return false;
    }
  }
};
