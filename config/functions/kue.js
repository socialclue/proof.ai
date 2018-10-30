const kue = require( "kue" );
var Redis = require('ioredis');
var cluster = require('cluster');

var clusterWorkerSize = require('os').cpus().length;

/**
 * Make a global operator which can be used as like strapi.Kue.methods()
 */

 // Public dependencies.
 const elasticsearch = require('elasticsearch');
 const moment = require('moment');
 const uuidv1 = require('uuid/v1');

 const client = elasticsearch.Client({
   host: '104.196.139.231:9200', // Remove this Should get it from the strapi.config.elasticsearchNode
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
            { "match": { "json.value.trackingId":  campaign.trackingId }}
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


/**
 * Method for the redis setting with docker/production.
 * @type {{}}
 */

const redisStruct =
  process.env.NODE_ENV == 'production' ?
    {
      createClientFactory: function () {
        return new Redis.Cluster([{
          port: 6379,
          host: process.env.NODE_ENV == 'production' ?'redis-cluster':strapi.config.redisHost

        }, {
          port: 16379,
          host: process.env.NODE_ENV == 'production' ?'redis-cluster':strapi.config.redisHost
        }]);
      }
    }
  :
    {
      port: strapi.config.redisPort,
      host: process.env.NODE_ENV == 'production' ?'redis-cluster':strapi.config.redisHost,
      auth: strapi.config.redisPassword,
      db: strapi.config.redisDb, // if provided select a non-default redis db
      options: {
        // see https://github.com/mranney/node_redis#rediscreateclient
      }
    };

const q = kue.createQueue({
  prefix: 'q',
  redis: redisStruct
});


// kue.app.listen(3002);


module.exports = {

  queue: async () => {
    return q;
  },

  /**
   * Normal Job Creation
   * @param jobName
   * @param jobTitle
   * @param jobDescription
   * @param priority
   * @param attempts
   * @returns {Promise<void>}
   */
  createJob: async (jobName, jobTitle, jobDescription, jobValue, priority, attempts, milliseconds, done) => {
    q.create(jobName,{
        title: jobTitle,
        description: jobDescription,
        value: jobValue
    }).delay(milliseconds).priority(priority).attempts(attempts).save(function( err ) {
      if (!err) done(err);
      else done();
    });
  },


  processJobs: async (jobName, number, fn) => {
    q.process(jobName, number, function(values, done ) {
      fn(values.data.value, done);
    });
  }

};


if (cluster.isMaster) {
  for (var i = 0; i < clusterWorkerSize; i++) {
    cluster.fork();
  }
} else if(process.env.NODE_ENV != 'development') {

    async function updateUsers(campaignId, done) {
      // console.log(campaignId);
      const campaign = await strapi.services.campaign.fetchCampaignAndUser({_id: campaignId._id});
      // console.log(campaign);
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
      // console.log(campaignOption, '====campaignOption' ,profileOption, '====profileOption' ,campaignUniqueVisitors, '====campaignUniqueVisitors' , '===========');
      if(response && response.aggregations.users.buckets.length)
        response.aggregations.users.buckets.map(bucket => {
          campaignUniqueVisitors = campaignUniqueVisitors + bucket.visitors.buckets.length + bucket.visitors.sum_other_doc_count;
        });
      else
        campaignUniqueVisitors = 0;

      // console.log(usersUniqueVisitors,  '------usersUniqueVisitors', campaign.uniqueVisitors, '------campaign.uniqueVisitors', campaignUniqueVisitors, '------campaignUniqueVisitors',  '===========');

      usersUniqueVisitors = (usersUniqueVisitors - campaign.uniqueVisitors?campaign.uniqueVisitors:0) + campaignUniqueVisitors;
      uniqueVisitorsQoutaLeft = uniqueVisitorQouta - usersUniqueVisitors;

      // console.log(usersUniqueVisitors, '-=-=-=-=-usersUniqueVisitors', uniqueVisitorsQoutaLeft,'======>uniqueVisitorsQoutaLeft');

      if(uniqueVisitorsQoutaLeft <= 0) {
        campaignOption = { uniqueVisitors: campaignUniqueVisitors, isActive: false };
        profileOption = { uniqueVisitors: usersUniqueVisitors, uniqueVisitorsQoutaLeft: 0  };
        console.log(campaignOption, 'campaignOption', profileOption, 'profileOption');
        const email = user.email;
        const name = user.username.charAt(0).toUpperCase() + user.username.substr(1);
        strapi.plugins.email.services.email.limitExceeded(email, name, uniqueVisitorQouta);
      } else {
        campaignOption = { uniqueVisitors: campaignUniqueVisitors }
        profileOption = { uniqueVisitors: usersUniqueVisitors, uniqueVisitorsQoutaLeft: uniqueVisitorsQoutaLeft  };
      }

      await strapi.services.campaign.edit({ _id: campaign._id }, campaignOption );
      await strapi.services.profile.edit({ _id: profile._id }, profileOption );
      // console.log(testCamp, '=--=-=-=-=-=-=-=-', testProfile, 'testProfile');
      let Leads = await strapi.api.notificationpath.services.notificationpath.findRulesPath({_id: campaign.rule});
      let displayLeads, captureLeads;
      displayLeads = Leads.filter(lead => lead.type == 'display');
      displayLeads = displayLeads.map(lead => lead.url);
      captureLeads = Leads.filter(lead => lead.type == 'lead');
      captureLeads = captureLeads.map(lead => lead.url);
      await healthTest(campaign, displayLeads, captureLeads);

      done();
    }

    async function create() {
      // console.log('==========create=========');
      if(strapi.config.functions.kue) {
        // console.log('==---------==');
        await strapi.services.campaign.GetActiveCampaigns((campaigns) => {
          // console.log(campaigns);
          if(campaigns && campaigns.length)
            campaigns.map(campaign => {
              strapi.config.functions.kue.createJob('check campaign', 'converting', 'checking campaign visitors', campaign, 'medium', 2, 500, function(err) {
                // console.log('============cool');
                if(err)
                  console.log(err);
                else
                  strapi.config.functions.kue.processJobs('check campaign', 1, updateUsers);
              });
            });
        });
      }

      setTimeout( create, 100000 );
    }

    create();

  } else if(process.env.NODE_ENV == 'development') {
    q.process('check campaign', function(job, ctx, done){
      ctx.pause( 5000, function(err){
        console.log("Worker is paused... ");
      });
    });
  }
