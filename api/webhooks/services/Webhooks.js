'use strict';

/**
 * Webhooks.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

// Public dependencies.
const _ = require('lodash');
const genGuid = function() {
    var s4 = function() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    };

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
};

const addWebhook = async function(trackingId, thirdParty) {

  const campaignInfo = await Campaign.findOne({ trackingId: trackingId?trackingId:null });
  let campaignLead;
  if(campaignInfo)
    campaignLead = await Notificationpath.findOne({
      campaignName: campaignInfo.campaignName,
      domain: campaignInfo.websiteUrl,
      type: 'lead',
      url: '/webhooks'
    });

  if(!campaignLead && campaignInfo) {
    const rule = await Rules.findOne({ campaign: campaignInfo?campaignInfo._id:null });

    const lead = {
      "url" : "/webhooks",
    	"status" : "verified",
    	"class" : "primary",
    	"type" : "lead",
    	"rule" : rule?rule._id:'',
    	"domain" : campaignInfo.websiteUrl,
    	"campaignName" : campaignInfo.campaignName,
      "thirdParty" : thirdParty?thirdParty:''
    };

    if(!campaignInfo.zapier || (campaignInfo.zapier && !campaignInfo.zapier.isActive))
      Campaign.update({trackingId: trackingId?trackingId:null}, {$set: {zapier: {isActive: true} } }, {new: true});

    await Notificationpath.create(lead);
  }
  return campaignInfo;
};

module.exports = {

  /**
   * Promise to fetch all webhooks.
   *
   * @return {Promise}
   */

  fetchAll: (params) => {
    return Webhooks.find({user: params});
  },

  /**
   * Promise to fetch a/an webhooks.
   *
   * @return {Promise}
   */

  fetch: (params) => {
    return Webhooks
      .findOne(_.pick(params, _.keys(Webhooks.schema.paths)))
      .populate(_.keys(_.groupBy(_.reject(strapi.models.webhooks.associations, {autoPopulate: false}), 'alias')).join(' '));
  },

  /**
   * Promise to add a/an webhooks.
   *
   * @return {Promise}
   */

  add: async (user, values) => {
    if(!user)
      return { message: 'User not defined', error: true };
    values['user'] = user._id;
    const data = await Webhooks.create(values);
    return data;
  },

  /**
   * Promise to add a/an log to es.
   *
   * @return {Promise}
   */

  log: async (query, values) => {
    let campaigns = [];
    if(values.type === 'zapier') {
      let campaignInfo = await addWebhook(query.trackingId, { type: 'zapier', application: values.thirdParty });
      if(campaignInfo) {
        values['trackingId'] = campaignInfo.trackingId;
        values['host'] = campaignInfo.websiteUrl;
      }
      campaigns.push(values);
    } else {
      const webhook = await Webhooks.findOne({secretId: query.secretId});
      const campaignsInfo = await Campaign.find({webhooks: webhook._id});
      await campaignsInfo.map(async(campaign, index) => {
        await addWebhook(campaign.trackingId);
        campaigns.push(Object.assign({trackingId: campaign.trackingId, host: campaign.websiteUrl}, values));
      });
    }
    await campaigns.map(async campaign => {
      const data = {
        "path": "/visitors/events/",
        "value": {
          "fingerprint": "a425aff7a248d252b013ac983a6320e6",
          "sessionId": genGuid(),
          "visitorId": genGuid(),
          "trackingId": campaign.trackingId,
          "userId": null,
          "userProfile": null,
          "form": {
            "email": campaign.email,
            "name": campaign.name || campaign.username || campaign.firstname || campaign.firstName || campaign.lastName
          },
          "geo": {
            "latitude": campaign.latitude,
            "longitude": campaign.longitude,
            "city": campaign.city,
            "country": campaign.country,
            "ip": campaign.ip
          },
          "timestamp": Date.now(),
          "event": "formsubmit",
          "source": {
            "url": {
              "host": campaign.host,
              "hostname": campaign.host,
              "pathname": "/webhooks"
            }
          },
          "target": {
            "url": {
              "host": campaign.host,
              "hostname": campaign.host
            }
          }
        }
      };

      await strapi.api.websocket.services.websocket.log(JSON.stringify(data));
    });

    return { message: 'logs added', error: false };
  },

  /**
   * Promise to edit a/an webhooks.
   *
   * @return {Promise}
   */

  edit: async (params, values) => {
    // Note: The current method will return the full response of Mongo.
    // To get the updated object, you have to execute the `findOne()` method
    // or use the `findOneOrUpdate()` method with `{ new:true }` option.
    //await strapi.hook.mongoose.manageRelations('webhooks', _.merge(_.clone(params), { values }));
    return Webhooks.update(params, values, { multi: true });
  },

  /**
   * Promise to remove a/an webhooks.
   *
   * @return {Promise}
   */

  remove: async params => {
    // Note: To get the full response of Mongo, use the `remove()` method
    // or add spent the parameter `{ passRawResult: true }` as second argument.
    const data = await Webhooks.findOneAndRemove(params, {})
      .populate(_.keys(_.groupBy(_.reject(strapi.models.webhooks.associations, {autoPopulate: false}), 'alias')).join(' '));

    _.forEach(Webhooks.associations, async association => {
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
