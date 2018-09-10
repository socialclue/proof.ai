'use strict';

/**
 * Cron config that gives you an opportunity
 * to run scheduled jobs.
 *
 * The cron format consists of:
 * [MINUTE] [HOUR] [DAY OF MONTH] [MONTH OF YEAR] [DAY OF WEEK] [YEAR (optional)]
 */

 // Public dependencies.
 const elasticsearch = require('elasticsearch');
 const moment = require('moment');
 const uuidv1 = require('uuid/v1');

 const client = elasticsearch.Client({
   host: '10.15.254.94:9200', // Remove this Should get it from the strapi.config.elasticsearchNode
   requestTimeout: Infinity, // Tested
   keepAlive: true, // Tested
   log: 'trace'
 });

 let getUniqueUsers = async function(index, trackingId, callback) {
  try {
    await strapi.services.elasticsearch.getAllUniqueUsers(index, trackingId).then(res=>{
      callback(null, res);
    });
  } catch(err) {
    callback(err);
  }
}

/**
*Tetsing health of users campaign
**/
let healthTest = async function(campaign, displayLeads, captureLeads) {
  let health;
  let query = {
    index: 'filebeat-*',
    body: {
      query: {
        "bool": {
          "must": [
            { "match": { "json.value.trackingId":  trackingId }}
          ]
        }
      },
      "size": 1
    }
  };

  const response = await new Promise((resolve, reject) => {
    client.search(query, function (err, resp, status) {
      if (err) reject(err);
      else resolve(resp);
    });
  });

  if(response.hits && response.hits.hits.length) {
    health = 'good';
  } else {
    health = 'bad';
  }

  await Campaign.update({_id: campaign._id}, {$set: { health: health}});
}

module.exports = {

  /**
   * Cron for updating users unique visitors
   * Every minute.
  **/
  '1 * * * * *': () => {
    Campaign
    .find({ isActive: true })
    .populate({
      path: 'profile',
      select: '_id user uniqueVisitorQouta uniqueVisitors uniqueVisitorsQoutaLeft',
      populate: {
        path: 'user',
        select: 'email username'
      }
    })
    .lean()
    .exec()
    .then(async data => {
      await data.map(async campaign => {
        const profile = campaign.profile;
        const user = profile.user;
        let usersUniqueVisitors = profile.uniqueVisitors;
        let uniqueVisitorQouta = profile.uniqueVisitorQouta;
        let uniqueVisitorsQoutaLeft = profile.uniqueVisitorsQoutaLeft;
        let response;
        //'INF-406jkjiji00uszj' for testing
        //campaign.trackingId original
        await getUniqueUsers('filebeat-*', campaign.trackingId, (err, usersUnique) => {
					if(!err)
						response = usersUnique;
				});

        let campaignOption, profileOption, campaignUniqueVisitors = 0;
        if(response && response.aggregations.users.buckets.length)
          response.aggregations.users.buckets.map(bucket => {
            campaignUniqueVisitors = campaignUniqueVisitors + bucket.visitors.buckets.length + bucket.visitors.sum_other_doc_count;
          });
        else
          campaignUniqueVisitors = 0;

        usersUniqueVisitors = usersUniqueVisitors - campaign.uniqueVisitors?campaign.uniqueVisitors:0 + campaignUniqueVisitors;
        uniqueVisitorsQoutaLeft = uniqueVisitorQouta - usersUniqueVisitors;

        if(uniqueVisitorsQoutaLeft <= 0) {
          campaignOption = { uniqueVisitors: campaignUniqueVisitors, isActive: false };
          profileOption = { uniqueVisitors: usersUniqueVisitors, uniqueVisitorsQoutaLeft: 0  };
          const email = result.email;
          const name = result.username.charAt(0).toUpperCase() + result.username.substr(1);
          await strapi.plugins.email.services.email.limitExceeded(email, name, uniqueVisitorQouta);
        } else {
          campaignOption = { uniqueVisitors: campaignUniqueVisitors }
          profileOption = { uniqueVisitors: usersUniqueVisitors, uniqueVisitorsQoutaLeft: uniqueVisitorsQoutaLeft  };
        }

        await Campaign.update({_id: campaign._id}, {$set: campaignOption });
        await Profile.update({_id: profile._id}, {$set: profileOption });
      });
    });
  },

  /**
   * Corn for logging new users
   * Runs every minute
  **/
  '1 * * * * *': () => {
    Campaign.find(
      {},
      {
        log: 1,
        campaignName: 1,
        websiteUrl: 1,
        logTime: 1,
        rule: 1,
        trackingId: 1,
        health: 1
      }
    )
    .lean()
    .exec()
    .then(async campaigns => {
      await campaigns.map(async campaign => {
        let Leads = await strapi.api.notificationpath.services.notificationpath.findRulesPath({_id: campaign.rule});
        let displayLeads, captureLeads;
        displayLeads = Leads.filter(lead => lead.type == 'display');
        displayLeads = displayLeads.map(lead => lead.url);
        captureLeads = Leads.filter(lead => lead.type == 'lead');
        captureLeads = captureLeads.map(lead => lead.url);

        /**
        *Mail support if campaign id in active/not logging data
        **/
        // if(!campaign.isActive)
        //   await strapi.plugins.email.services.email.campaignIssue(email, name, campaign);

        /**
        *Health test
        **/
        await healthTest(campaign, displayLeads, captureLeads);

      });
    });
  }

};
