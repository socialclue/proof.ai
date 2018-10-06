'use strict';

/**
 * Campaign.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

// Public dependencies.
const _ = require('lodash');
const domainPing = require("domain-ping");

let ruleDefault = {
	"hideNotification" : true,
	"loopNotification" : true,
	"delayNotification" : false,
	"closeNotification" : false,
	"initialDelay" : 1,
	"displayTime" : 5,
	"delayBetween" : 3,
	"displayPosition" : "Bottom Left",
	"popupAnimationIn" : "fadeInUp",
	"popupAnimationOut" : "fadeOutDown",
	"displayOnAllPages" : true
};

let configurationDefault = {
  "activity" : true,
  "panelStyle" : {
    "radius" : 0,
    "borderWidth" : 0,
    "borderColor" : {
      "r" : 200,
      "g" : 200,
      "b" : 200,
      "a" : 0.80
    },
    "shadow" : {
	    r: 0,
	    g: 0,
	    b: 0,
	    color: 'lightgrey'
	  },
    "blur" : 0,
    "color" : {
      "r" : 0,
      "g" : 0,
      "b" : 0,
			"a" : 1
    },
		"linkColor": {
	    "r": 0,
	    "g": 137,
	    "b": 216,
	    "a": 1
	  },
    "backgroundColor" : {
      "r" : 255,
      "g" : 255,
      "b" : 255,
      "a" : 1
    },
    "fontFamily" : "inherit",
    "fontWeight" : "normal",
		"linkFontFamily": "inherit",
	  "linkFontWeight": "normal",
		"selectDurationData": "hours",
	  "selectLastDisplayConversation": "hours",
		"bulkData" : 5,
	  "recentNumber" : 5,
	  "recentConv" : 5,
	  "hideAnonymousConversion" : true,
	  "onlyDisplayNotification" : false,
		"liveVisitorCount": 0
  },
  "contentText" : "Company Name",
	"visitorText" : "people",
	"notificationUrl" : "",
	"toggleMap" : true,
	"liveVisitorCount": 0,
	"otherText": "signed up for"
};

let getUniqueUsers = async function(index, trackingId, callback) {
  try {
    await strapi.services.elasticsearch.getAllUniqueUsers(index, trackingId).then(res=>{
      callback(null, res);
    });
  } catch(err) {
    callback(err);
  }
}

let getSignUps = async function(index, trackingId, type, host, callback) {
  try {
    await strapi.services.elasticsearch.notification(index, trackingId, type, true, host).then(res=>{
      callback(null, res);
    });
  } catch(err) {
    callback(err);
  }
}

module.exports = {

	/**
		* @api {get} /campaign Fetch user's campaigns details
		* @apiVersion 0.0.1
		* @apiName fetchUserCampaigns
		* @apiGroup Campaign
		* @apiPermission Customer
		*
		*
		* @apiParam {Object} params Id of user requesting the details.
		*
		* @apiExample Example usage:
		* curl -H "Authorization: Bearer {Token}" -i http://localhost:1337/campaign
		*
		* @apiSuccess {ObjectId}   _id                      Object Id of Affiliate.
		* @apiSuccess {String}     campaignName             Campaign name.
		* @apiSuccess {String}     websiteUrl               Campaign website URL.
		* @apiSuccess {Integer}    averageCustomer          Number of average customer visits before campaign creation.
		* @apiSuccess {Object}     profile           				User's profile.
		* @apiSuccess {Boolean}    isActive         				Campaign active status.
		* @apiSuccess {String}     trackingId               Campaign Tracking Id.
		* @apiSuccess {Object}     rule               			Rule connected to the campaign.
		* @apiSuccess {Date}     	 logTime               		Time when users details were logged.
		* @apiSuccess {Integer}    uniqueVisitors           Uniques visitors on the website.
		* @apiSuccess {Object}     webhooks               	Webhook connected to the campaign.
		* @apiSuccess {Object}     shopify               		Shopify connected to the campaign.
		* @apiSuccess {String}     health               		Health of the campaign.
		* @apiSuccess {String}     campaignType             Type of campaign.
		* @apiSuccess {String}     promote               		Whether the page campaign have promotion pages.
		* @apiSuccess {Date}       createdAt                Affiliate creation date.
		* @apiSuccess {Date}       updatedAt                Affiliate updation date.
		*
		* @apiError Unauthorized Only authenticated customer can fetch single campaign.
		* @apiError NotFound   The <code>id</code> of the Campaign was not found.
		*
		* @apiErrorExample Response (example):
		*     HTTP/1.1 401 Unauthorized
		*     Vary: Origin
		*     Content-Type: application/json; charset=utf-8
		*     X-Powered-By: Strapi <strapi.io>
		*     Content-Length: 66
		*     Date: Tue, 02 Oct 2018 14:14:54 GMT
		*     Connection: keep-alive
		*     {
		*       "statusCode":401,"error":"Unauthorized","message":"Unauthorized"
		*     }
	*/


  fetchUserCampaigns: async (params) => {

    const profile = await Profile.findOne({user: params?params:null})
      .exec()
      .then(data => data?data._id:null);

    const query = {
      profile: profile?profile:null
    };
    const convertedParams = strapi.utils.models.convertParams('campaign', query);

    return Campaign
      .find()
      .where(convertedParams.where)
      .sort(convertedParams.sort)
      .skip(convertedParams.start)
      .limit(convertedParams.limit)
      .populate(_.keys(_.groupBy(_.reject(strapi.models.campaign.associations, {autoPopulate: false}), 'alias')).join(' '));
  },

	/**
   * Zapier requests for campaigns.
   *
   * @return {Promise}
   */

	findZapierCampaigns: async (apiKey) => {
		const user = await strapi.plugins['users-permissions'].services.user.fetch({apiKey: apiKey});
		const profile = await Profile.findOne({user: user?user._id:null});

		if(user && profile) {
			const campaign = await Campaign.find({ profile: profile._id });
			return { campaign: campaign };
		} else {
			return { error: 'Invalid API key', message: 'Invalid API key' };
		}

	},

  /**
   * Promise to fetch all campaigns.
   *
   * @return {Promise}
   */

  fetchAll: (params) => {

    const convertedParams = strapi.utils.models.convertParams('campaign', params);

    return Campaign
      .find()
      .where(convertedParams.where)
      .sort(convertedParams.sort)
      .skip(convertedParams.start)
      .limit(convertedParams.limit)
      .populate(_.keys(_.groupBy(_.reject(strapi.models.campaign.associations, {autoPopulate: false}), 'alias')).join(' '));
  },

  /**
   * Promise to fetch a/an campaign.
   *
   * @return {Promise}
   */

  fetch: (params) => {
    return Campaign
      .findOne(_.pick(params, _.keys(Campaign.schema.paths)))
      .populate(_.keys(_.groupBy(_.reject(strapi.models.campaign.associations, {autoPopulate: false}), 'alias')).join(' '));
  },


	/**
   * Promise to fetch a campaign with Tracking Id.
   *
   * @return {Promise}
   */

  fetchTrackingId: (params) => {
		return Campaign
      .findOne(
				{
					trackingId: params?params.trackingId:null
				},
				{
					isActive: 1,
					websiteUrl: 1,
					_id: 0
				}
			)
			.exec()
			.then(data => data);
		},

  /**
   * Promise to add a/an new campaign with default configuration and rules.
   *
   * @return {Promise}
   */
  add: async (values) => {
		let campaignValue = values.campaign;
		let pagesValues = values.pages;
		campaignValue.websiteUrl = campaignValue.websiteUrl.toLowerCase().replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
		campaignValue.isActive = true;
		campaignValue.health = 'bad';

    var checkDomain = new Promise((resolve, reject) => {
      domainPing(campaignValue.websiteUrl)
       .then((res) => {
           resolve(res);
       })
       .catch((error) => {
         reject(error)
       });
    });

		/**
		*	Calls checkDomain function
		*
		*@return {Promise}
		*/
    var dom = await checkDomain
    .then((result) => {
      return result;
    })
    .catch(err => {
      return {error: true, message: "Invalid domain"};
    });

    if(dom.error) {
      return dom;
    } else {
			const data = await Campaign.create(campaignValue);

			/**
			* Find Notificationtypes and create new configuration for campaign related to notificationType
			*
			*@return {Null}
			*/
			await Notificationtypes.find()
      .exec()
      .then(async notifications => {
        await notifications.map(notification => {
          let newConfiguration = Object.assign({}, configurationDefault);
          newConfiguration['campaign'] = data._id;
          newConfiguration['notificationType'] = notification._id;
					if(notification.notificationName == 'Bulk Activity') {
						newConfiguration['panelStyle'] = {
					    "radius" : 3,
					    "borderWidth" : 0,
					    "borderColor" : {
					      "r" : 200,
					      "g" : 200,
					      "b" : 200,
					      "a" : 0.80
					    },
					    "shadow" : {
						    r: 0,
						    g: 0,
						    b: 0,
						    color: 'lightgrey'
						  },
					    "blur" : 0,
					    "color" : { "r" : 0, "g" : 149, "b" : 247, "a" : 1 },
							"linkColor": {
						    "r": 0,
						    "g": 137,
						    "b": 216,
						    "a": 1
						  },
					    "backgroundColor" : {
					      "r" : 255,
					      "g" : 255,
					      "b" : 255,
					      "a" : 1
					    },
					    "fontFamily" : "inherit",
					    "fontWeight" : "normal",
							"linkFontFamily": "inherit",
						  "linkFontWeight": "normal",
							"selectDurationData": "days",
						  "selectLastDisplayConversation": "days",
							"bulkData" : 5,
						  "recentNumber" : 5,
						  "recentConv" : 5,
						  "hideAnonymousConversion" : true,
						  "onlyDisplayNotification" : false,
							"liveVisitorCount": 0,
							"otherText": "signed up for"
					  };
						newConfiguration['otherText'] = 'signed up for',
						newConfiguration['contentText'] = 'Company';
					}
					if(notification.notificationName == 'Recent Activity') {
						newConfiguration['panelStyle'] = {
					    "radius" : 50,
					    "borderWidth" : 0,
					    "borderColor" : {
					      "r" : 200,
					      "g" : 200,
					      "b" : 200,
					      "a" : 0.80
					    },
					    "shadow" : {
						    r: 0,
						    g: 0,
						    b: 0,
						    color: 'lightgrey'
						  },
					    "blur" : 0,
					    "color" : {
					      "r" : 0,
					      "g" : 0,
					      "b" : 0,
								"a" : 1
					    },
							"linkColor": {
						    "r": 0,
						    "g": 137,
						    "b": 216,
						    "a": 1
						  },
					    "backgroundColor" : {
					      "r" : 255,
					      "g" : 255,
					      "b" : 255,
					      "a" : 1
					    },
					    "fontFamily" : "inherit",
					    "fontWeight" : "normal",
							"linkFontFamily": "inherit",
						  "linkFontWeight": "normal",
							"selectDurationData": "days",
						  "selectLastDisplayConversation": "days",
							"bulkData" : 5,
						  "recentNumber" : 5,
						  "recentConv" : 5,
						  "hideAnonymousConversion" : true,
						  "onlyDisplayNotification" : false,
							"liveVisitorCount": 0,
							"otherText": "signed up for"
					  };
						newConfiguration['otherText'] = 'Recently signed up for',
						newConfiguration['contentText'] = 'Company Name';
					}
					if(notification.notificationName == 'Live Visitor Count') {
						newConfiguration['panelStyle'] = {
					    "radius" : 50,
					    "borderWidth" : 0,
					    "borderColor" : {
					      "r" : 200,
					      "g" : 200,
					      "b" : 200,
					      "a" : 0.80
					    },
					    "shadow" : {
						    r: 0,
						    g: 0,
						    b: 0,
						    color: 'lightgrey'
						  },
					    "blur" : 0,
					    "color" : { "r" : 102, "g" : 102, "b" : 102, "a" : 1 },
							"linkColor": {
						    "r": 0,
						    "g": 137,
						    "b": 216,
						    "a": 1
						  },
					    "backgroundColor" : {
					      "r" : 255,
					      "g" : 255,
					      "b" : 255,
					      "a" : 1
					    },
					    "fontFamily" : "inherit",
					    "fontWeight" : "normal",
							"linkFontFamily": "inherit",
						  "linkFontWeight": "normal",
							"selectDurationData": "days",
						  "selectLastDisplayConversation": "days",
							"bulkData" : 5,
						  "recentNumber" : 5,
						  "recentConv" : 5,
						  "hideAnonymousConversion" : true,
						  "onlyDisplayNotification" : false,
							"liveVisitorCount": 1,
							"liveVisitorText":'are viewing this site'
					  };

						newConfiguration['liveVisitorText'] = 'are viewing this site';
						newConfiguration['contentText'] = 'Influence';
					}
					// if(notification.notificationName == 'Review Notification') {
					// 	newConfiguration['panelStyle'] = {
					//     "radius" : 50,
					//     "borderWidth" : 0,
					//     "borderColor" : {
					//       "r" : 200,
					//       "g" : 200,
					//       "b" : 200,
					//       "a" : 0.80
					//     },
					//     "shadow" : {
					// 	    r: 0,
					// 	    g: 0,
					// 	    b: 0,
					// 	    color: 'lightgrey'
					// 	  },
					//     "blur" : 0,
					//     "color" : { "r" : 0, "g" : 149, "b" : 247, "a" : 1 },
					// 		"linkColor": {
					// 	    "r": 0,
					// 	    "g": 137,
					// 	    "b": 216,
					// 	    "a": 1
					// 	  },
					//     "backgroundColor" : {
					//       "r" : 255,
					//       "g" : 255,
					//       "b" : 255,
					//       "a" : 1
					//     },
					//     "fontFamily" : "inherit",
					//     "fontWeight" : "normal",
					// 		"linkFontFamily": "inherit",
					// 	  "linkFontWeight": "normal",
					// 		"selectDurationData": "hours",
					// 	  "selectLastDisplayConversation": "hours",
					// 		"bulkData" : 5,
					// 	  "recentNumber" : 5,
					// 	  "recentConv" : 5,
					// 	  "hideAnonymousConversion" : true,
					// 	  "onlyDisplayNotification" : false,
					// 		liveVisitorCount: 0
					//   };
					// 	// newConfiguration['panelStyle'].color = { "r" : 0, "g" : 149, "b" : 247, "a" : 1 },
					// 	newConfiguration['visitorText'] = 'marketor';
					// 	newConfiguration['contentText'] = 'Us';
					// }

          Configuration.create(newConfiguration, (err, result) => {
            if(err)
              return err;
          });
        });
      });
      let newRules = ruleDefault;
			newRules['campaign'] = data._id;
			await Rules.create(newRules, async (err, result) => {
				if(err)
          return err;
				else {
					if(pagesValues)
						await pagesValues.map(async page => {
							let productUrl = page.productUrl.toLowerCase().replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/');
							productUrl = productUrl.join('/').replace(campaignValue.websiteUrl,'');
							let captureUrl = page.captureUrl.toLowerCase().replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/');
							captureUrl = captureUrl.join('/').replace(campaignValue.websiteUrl,'');

							const pages = {
					      name: page.productName,
					      productName: page.productName,
					      productUrl: productUrl,
					      captureUrl: captureUrl,
					      campaign: data._id,
					      domain: data.websiteUrl,
					      rule: result._id,
					      isActive: true
					    };
							const savedPage = await strapi.services.subcampaign.add(pages);
						});
				}
      });

			return data; // return new campaign
    }
  },

  /**
   * Promise to edit a/an campaign.
   *
   * @return {Promise}
   */

  edit: async (params, values) => {
    // Note: The current method will return the full response of Mongo.
    // To get the updated object, you have to execute the `findOne()` method
    // or use the `findOneOrUpdate()` method with `{ new:true }` option.
	  try {
			return Campaign.findOneAndUpdate(params, values, { upsert: false, multi: true, new: true }).populate('webhooks').populate('profile');
		} catch(err) {
			console.log(err);
		}
  },

  /**
   * Promise to remove a/an campaign.
   *
   * @return {Promise}
   */

  remove: async params => {
    // Note: To get the full response of Mongo, use the `remove()` method
    // or add spent the parameter `{ passRawResult: true }` as second argument.
    try {
			const data = await Campaign.findOneAndRemove(params, {})
      .populate(_.keys(_.groupBy(_.reject(strapi.models.campaign.associations, {autoPopulate: false}), 'alias')).join(' '));

	    _.forEach(Campaign.associations, async association => {
	      const search = (_.endsWith(association.nature, 'One')) ? { [association.via]: data._id } : { [association.via]: { $in: [data._id] } };
	      const update = (_.endsWith(association.nature, 'One')) ? { [association.via]: null } : { $pull: { [association.via]: data._id } };

	      await strapi.models[association.model || association.collection].remove(
	        search
	     	);
    	});
			return data;
		} catch(err) {
			console.log(err);
			return {err: true};
		}

  },

  /**
   * Promise to fetch user's campaigns info.
   *
   * @return {Promise}
   */

  fetchUserCampaignsInfo: async (params, host) => {
    let countConfig = 0;

    const profile = await Profile.findOne({user: params?params:null})
      .exec()
      .then(data => data?data._id:null);

    const query = {
      profile: profile?profile:null
    };

    const convertedParams = strapi.utils.models.convertParams('campaign', query);

    const campaign = await Campaign
      .find()
			.lean()
      .where(convertedParams.where)
      .sort(convertedParams.sort)
      .skip(convertedParams.start)
      .limit(convertedParams.limit);

    const campaignFilter = await campaign.filter(camp => camp.trackingId);
    const campaignWebsites = await campaignFilter.map(camp => camp);
    const campaignIds = await campaignFilter.map(camp => camp._id);

    await Configuration.count({ campaign: {$in: campaignIds}, activity: true})
        .exec()
        .then(counts => {
          countConfig = counts;
        });

		let uniqueUsers = [];
    let pica = campaignWebsites.map(async camp => {
        await getUniqueUsers('filebeat-*', camp.trackingId, (err, usersUnique) => {
					if(!err) {
						uniqueUsers.push(usersUnique);
						camp['uniqueUsers'] = usersUnique;
					}
					return camp;
				});
				return camp;
		});

		await Promise.all(pica);

		// let userSignUps = [];
		let signedUpUsers = campaignWebsites.map(async camp => {
			await getSignUps('filebeat-*', camp.trackingId, 'journey', host, (err, response) => {
				if(!err) {
					camp['signups'] = response;
				}
				return camp;
			});
			return camp;
		});

		await Promise.all(signedUpUsers);

    return {websiteLive: campaignWebsites, notificationCount: countConfig, uniqueUsers: uniqueUsers };
  },
};
