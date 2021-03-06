'use strict';

/**
 * Elasticsearch.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
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



module.exports = {

  health : async () => {
    return new Promise((resolve, reject)=> {
      client.cluster.health({}, function (err,resp,status) {
        if(err) reject(err);
        else resolve(resp);
        strapi.log.info('-- Client Health --',resp);
      });
    });
  },


  query: async (index,q) => {
    return new Promise((resolve, reject)=> {
      client.search(
        {
          "index": index,
          "body": {
            "sort" : [
                { "@timestamp" : {"order" : "desc" } }
            ],
            "query" : {
              "bool": {
                "must": [
                  { "match": { "json.value.trackingId" : q } }
                ]
              }
            }
          }
        }
        , function (err,resp,status) {
        if (err) reject(err);
        else resolve(resp);
        strapi.log.info('---Client Search Returned--- ',resp);
      });
    });
  },

  notification: async (index, trackingId, type, limit, host) => {
    let query;
    let configurations = [];

    const rule = await Campaign.findOne(
      {
        trackingId: trackingId
      },
      {
        log: 1,
        campaignName: 1,
        logTime: 1,
        rule: 1,
        promote: 1,
        createdAt: 1
      }
    )
    .populate({
      path: 'rule',
      select: {
        hideNotification: 1,
        loopNotification: 1,
        delayNotification: 1,
        closeNotification: 1,
        hideAnonymous: 1,
        displayNotifications: 1,
        initialDelay: 1,
        displayTime: 1,
        delayBetween: 1,
        displayPosition: 1,
        campaign: 1,
        popupAnimationIn: 1,
        popupAnimationOut: 1,
        displayOnAllPages: 1
      }
    })
    .lean()
    .exec()
    .then(result => {
      if(result) {
        let newRule = result.rule;
        newRule['companyName'] = result.campaignName;
        newRule['createdAt'] = result.createdAt;
        newRule['logTime'] = result.logTime;
        return newRule;
      } else {
        return null;
      }
    });

    let notificationType = () => {
      if(type == 'live')
        return 'Live Visitor Count';
      else if(type == 'identification')
        return 'Bulk Activity';
      else if(type == 'journey')
        return 'Recent Activity';
      else if(type == 'review')
        return 'Review Notification';
    }

    const notification = await Notificationtypes.findOne(
      {
        notificationName: notificationType()
      },
      {
        _id: 1
      }
    )
    .exec()
    .then(data => data?data.id:null);

    const configuration = await Configuration.findOne(
      {
        notificationType: notification,
        campaign: rule?rule.campaign:null
      },
      {
        contentText: 1,
        panelStyle: 1,
        activity: 1,
        visitorText: 1,
        notificationUrl: 1,
        toggleMap: 1,
        otherText: 1,
        liveVisitorText: 1,
        channel: 1
      }
    )
    .exec()
    .then(result => result);

    let subcampaigns = await Subcampaign.find({campaign: rule?rule.campaign:null});

    let captureLeads = await strapi.api.notificationpath.services.notificationpath.findRulesPath({_id: rule._id, type: 'lead', domain: host});
    let displayLeads = await strapi.api.notificationpath.services.notificationpath.findRulesPath({_id: rule._id, type: 'display', domain: host});

    const defaultLeads = displayLeads.filter(display => display.campaignName === rule.companyName);

    await configurations.push({
      paths: defaultLeads.map(lead => lead.url),
      configuration: configuration
    });

    await subcampaigns.map(subcampaign => {
      configurations.push({
        paths: [subcampaign.productUrl],
        configuration: subcampaign[type]
      });
    });

    captureLeads = captureLeads.map(lead => lead.url);

    switch(type) {
      case 'live' :
        query = {
          index: index,
          body: {
            query: {
              "bool": {
                "must": [
                  {
                    "bool": {
                      "should": [
                        { "match": { "json.value.source.url.hostname": host }},
                        { "match": { "json.value.source.url.hostname": `www.${host}` }},
                      ],
                    }
                  },
                  // { "match": { "json.value.source.url.hostname": host }},
                  { "match": { "json.value.trackingId":  trackingId }},
                  { "range": { "@timestamp": { "gte": moment().subtract(60, 'minutes').format(), "lt": moment().format() }}}
                ]
              }
            },
            "size": 0,
            "aggs" : {
              "users" : {
                "composite" : {
                  "sources" : [
                    {
                      "visitorId": {
                        "terms" : { "field" : "json.value.visitorId" }
                      }
                    },
                    {
                      "path": {
                        "terms" : { "field" : "json.value.source.url.pathname" }
                      }
                    }

                  ]
                }
              }
            }
          }
        };
        break;
      case 'identification' :
        let identificationQuery = !limit ?
          [
            {
              "bool": {
                "should": [
                  { "match": { "host.keyword": host }},
                  { "match": { "host.keyword": `www.${host}` }},
                ],
              }
            },
            // { "match": { "host.keyword": host }},
            { "match": { "trackingId.keyword":  trackingId }},
            { "range":
              { "timestamp":
                { "gte": `now-${Number(configuration.panelStyle.bulkData)}${configuration.panelStyle.selectDurationData==='days'?'d':'h'}`,
                  "lt" :  "now+1d"
                }
              }
            }
          ]
        :
          [
            { "match": { "trackingId.keyword":  trackingId }},
            { "range":
              { "timestamp":
                { "gte": "now-365d",
                  "lt" :  "now+1d"
                }
              }
            }
          ];
        query = {
          index: 'signups',
          body: {
            query: {
              "bool": {
                "must": identificationQuery
              }
            },
            "sort" : [
              { "timestamp" : {"order" : "desc", "mode" : "max"}}
            ],
            "size": 10000
          }
        };
        break;
      case 'journey' :
        let mustQuery = !limit ?
          [
            {
              "bool": {
                "should": [
                  { "match": { "host.keyword": host }},
                  { "match": { "host.keyword": `www.${host}` }},
                ],
              }
            },
            // { "match": { "host.keyword": host }},
            { "match": { "trackingId.keyword":  trackingId }},
            { "range":
              { "timestamp":
                { "gte": `now-${Number(configuration.panelStyle.recentConv)}${configuration.panelStyle.selectLastDisplayConversation==='days'?'d':'h'}`,
                  "lt" :  "now+1d"
                }
              }
            }
          ]
        :
          [
            { "match": { "trackingId.keyword":  trackingId }},
            { "range":
              { "timestamp":
                { "gte": "now-365d",
                  "lt" :  "now+1d"
                }
              }
            }
          ];
        query = {
          index: 'signups',
          body: {
            query: {
              "bool": {
                "must": mustQuery
              }
            },
            "sort" : [
              { "timestamp" : {"order" : "desc", "mode" : "max"}}
            ],
            "size": 10000
          }
        };
        break;
      default:
        break;
    }

    if(rule) {
      let userDetails = [];
      const response = await new Promise((resolve, reject) => {
        client.search(query, function (err, resp, status) {
          if (err) reject(err);
          else resolve(resp);
        });
      });

      /**
      *arrange and sort userdetails
      **/
      if(type == 'journey' || type == 'identification') {
        if(response.hits && response.hits.hits.length) {
          await response.hits.hits.map(details => {
            let source = details._source;
            source['_id'] = details._id;
            source['type'] = details._type;
            userDetails.push(source);
          });

          /**
          *sort according to timeStamp
          **/
          var sortByDateAsc = await function (lhs, rhs)  {
            return moment(lhs.timestamp) < moment(rhs.timestamp) ? 1 : moment(lhs.timestamp) > moment(rhs.timestamp) ? -1 : 0;
          }

          userDetails = await userDetails.filter(user => user.trackingId === trackingId);
          userDetails = await userDetails.filter((user, index, self) => self.findIndex(t => t.email && user.email?t.email === user.email:t.username === user.username) === index);

          if(type == 'journey' && !limit)
            userDetails = userDetails.slice(0, Number(configuration.panelStyle.recentNumber));

          userDetails.sort(sortByDateAsc);

          if(!userDetails.length)
            return { response, rule, configurations };
          return { response, rule, configurations, userDetails };
        } else {
          return { response, rule, configurations };
        }
      } else
        return { response, rule, configurations };
    } else {
      return { error: "Tracking Id Not Found" };
    }
  },

  uniqueUsersWeekly: async (index, trackingId) => {
    const query = {
      index: index,
      body: {
        query: {
          "bool": {
            "must": [
              { "match": { "json.value.trackingId":  trackingId }},
              {
                "range": {
                  "@timestamp": {
                    "gte": 'now-365d',
                    "lt" : moment().endOf('week')
                  }
                }
              },
            ]
          }
        },
        "size": 0,
        "aggs" : {
          "users" : {
            "date_histogram" : {
                "field" : "@timestamp",
                "interval" : "day"
            },
            "aggs" : {
              "visitors" : {
                  "terms" : {
                      "field" : "json.value.visitorId"
                  }
              }
            }
          }
        }
      }
    };

    const response = await new Promise((resolve, reject) => {
      client.search(query, function (err, resp, status) {
        if (err) reject(err);
        else resolve(resp);
      });
    });

    return response;
  },

  getAllUniqueUsers: async (index, trackingId) => {
    const query = {
      index: index,
      body: {
        query: {
          "bool": {
            "must": [
              { "match": { "json.value.trackingId":  trackingId }}
            ]
          }
        },
        "size": 0,
        "aggs" : {
          "users" : {
            "date_histogram" : {
              "field" : "@timestamp",
              "interval" : "day"
            },
            "aggs" : {
              "visitors" : {
                "terms" : {
                  "field" : "json.value.visitorId"
                }
              }
            }
          }
        }
      }
    };

    const response = await new Promise((resolve, reject) => {
     client.search(query, function (err, resp, status) {
        if (err) reject(err);
        else resolve(resp);
      });
    });
    return response;
  },

  getAllUniqueClick: async (index, trackingId) => {
    const query = {
      index: index,
      body: {
        query: {
          "bool": {
            "must": [
              { "match": { "json.value.trackingId":  trackingId }},
              { "match": { "json.value.event":  'click' }}
            ]
          }
        },
        "size": 0
      }
    };

    const response = await new Promise((resolve, reject) => {
     client.search(query, function (err, resp, status) {
        if (err) reject(err);
        else resolve(resp);
      });
    });

    return response.hits?response.hits.total:0;
  },

  validatePath: async (index, trackingId, path) => {
    path = path.split('/').join('*');
    const query = {
      index: index,
      body: {
        query: {
          "bool": {
            "must": [
              { "match": { "json.value.trackingId":  trackingId }},
              {
                "query_string" : {
                  "default_field" : "json.value.source.url.pathname",
                  "query" : `*${path}*`
                }
              },
              {
                "range": {
                  "@timestamp": {
                    "gte": 'now-365d',
                    "lt" : 'now+1d'
                  }
                }
              },
            ]
          }
        },
        "sort" : [
            { "@timestamp" : {"order" : "desc" } }
        ],
        "size": 1
      }
    };

    const response = await new Promise((resolve, reject) => {
      client.search(query, function (err, resp, status) {
        if (err) reject(err);
        else resolve(resp);
      });
    });

    return response;
  },

  mapGraph: async (index, trackingIds) => {
    const query = {
      index: index,
      body: {
      	"size":0,
      	"_source":{
      	  "excludes":[]
      	},
      	"aggs":{
      	  "body":{
      	    "terms":{
      	      "field":"json.value.geo.country",
      	      "size":100,
      	      "order":{
      	        "_term":"asc"
      	      }
      	    }
      	  }
      	},
      	"stored_fields":["*"],
      	"script_fields":{},
      	"docvalue_fields":["@timestamp"],
      	"query":{
          "bool":{
            "must":[{
              "terms": {
                "json.value.trackingId":  trackingIds
              }
            },{
              "range":{
                "@timestamp":{
                  "gte":"now-7d",
                  "lte":"now",
                  "format":"epoch_millis"
                }
              }
            }],
            "filter":[],
            "should":[],
            "must_not":[]
          }
        }
      }
    };

    const response = await new Promise((resolve, reject) => {
      client.search(query, function (err, resp, status) {
        if (err) reject(err);
        else resolve(resp);
      });
    });

    let mapArray = [['Country', 'traffic']];
    response.aggregations.body.buckets.map(country => mapArray.push(Object.values(country)));

    return mapArray;
  },

  heatMapGraph: async (index, trackingIds) => {
    const query = {
      index: index,
      body: {
      	"size": 0,
      	"query":{
        	"bool":{
            	"must":[{
            		"terms": {
                		"json.value.trackingId":  trackingIds
            		}
        		},{
              "range":{
                "@timestamp":{
                  "gte":"now-7d",
                  "lte":"now",
                  "format":"epoch_millis"
                }
              }
            }]
        	}
      	},
      	"aggs": {
      		"hour": {
            "date_histogram": {
      				"field": "@timestamp",
      				"interval": "hour",
      				"min_doc_count": 0
      			}
      		}
      	}
      }
    };

    let response = await new Promise((resolve, reject) => {
      client.search(query, function (err, resp, status) {
        if (err) reject(err);
        else resolve(resp);
      });
    });
    let data = [];
    const sortedBucket = await response.aggregations.hour.buckets.sort((a, b) => {
      return moment(b.key_as_string).diff(moment(a.key_as_string))
    });
    await sortedBucket.map(info => {
      let hour = moment(info.key_as_string).hour();
      data[hour] = data[hour]?data[hour]:[];
      data[hour].push(info.doc_count);
    });
    return data;
  },

  conversionGraph: async (index, profile, host) => {
    const queryModel = (trackingId, captureLeads) =>  {
      return {
        index: 'signups',
        body: {
          "query":{
            "bool":{
              "must":[
              {
                "match": {
                  "trackingId":  trackingId,
                }
              },{
                "terms": {
                  "path": captureLeads
                }
              },{
                  "range":{
                    "timestamp":{
                      "gte":"now-7d",
                      "lte":"now",
                      "format":"epoch_millis"
                    }
                  }
                }
              ]
            }
          },
        	"size":0,
          "aggs":{
            "email": {
              "terms" : { "field" : "email.keyword" }
            }
          }
        }
      }
    };
    let campaignConversionDetails = [];
    let campaignData = await Campaign.find({profile: profile},{rule: 1, trackingId: 1})

    await campaignData.map(async campaign => {
      let captureLeads = await strapi.api.notificationpath.services.notificationpath.findRulesPath({_id: campaign.rule, type: 'lead', domain: host});
      captureLeads = captureLeads.map(lead => lead.url);
      const query = queryModel(campaign.trackingId, captureLeads);
      let response = await new Promise((resolve, reject) => {
        client.search(query, function (err, resp, status) {
          if (err) reject(err);
          else resolve(resp);
        });
      });
      await campaignConversionDetails.push(response);
    });

    return await campaignConversionDetails;
  },

  deleteESUser: async (index, _id, _type) => {
    const response =  await client.delete({
      index: index,
      type: _type,
      id: _id
    });

    if(response && response.result == 'deleted')
      return response;
    else
      return { error: true, message: 'User not found' };
  }

}
