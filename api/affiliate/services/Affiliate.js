'use strict';

/**
 * Affiliate.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

// Public dependencies.
const _ = require('lodash');

module.exports = {

  /**
    * @api {post} /affiliate/share Share Affiliate link with other users
    * @apiVersion 0.0.1
    * @apiName share
    * @apiGroup Affiliate
    * @apiPermission Customer
    *
    *
    * @apiParam {Object} user User's information.
    * @apiParam {Object} body Affiliate mail body.
    *
    * @apiSuccess HTTP/1.1 200 Sucess.
    *
    * @apiError Unauthorized Only authenticated customer can share affiliate link.
    * @apiError NotFound   The <code>id</code> of the User was not found.
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

  share: async(user, body) => {
    return await strapi.plugins.email.services.email.affiliateRequest(body.email, user.username, {affiliateId: user.affiliateId});
  },

  /**
    * @api {get} /affiliate Fetch user's affiliate details
    * @apiVersion 0.0.1
    * @apiName fetchAll
    * @apiGroup Affiliate
    * @apiPermission Customer
    *
    *
    * @apiParam {Object} user User's information.
    *
    * @apiExample Example usage:
    * curl -i http://localhost:1337/affiliate
    *
    * @apiSuccess {Array}      affiliateObjects         The Array of affiliate objects.
    * @apiSuccess {ObjectId}   _id                      Object Id of Affiliate.
    * @apiSuccess {Integer}    amount                   Affiliate amount.
    * @apiSuccess {Boolean}    withdrawn                Whether Affiliate amount withdraw or not.
    * @apiSuccess {Date}       expiry                   Maturity period of affiliate.
    * @apiSuccess {Object}     affiliatedUser           User that has been affiliated.
    * @apiSuccess {Object}     affiliatedByUser         User that affiliated.
    * @apiSuccess {String}     status                   Affiliate status.
    * @apiSuccess {Date}       createdAt                Affiliate creation date.
    * @apiSuccess {Date}       updatedAt                Affiliate updation date.
    *
    * @apiError Unauthorized Only authenticated customer can fetch their all affiliates.
    * @apiError NotFound   The <code>id</code> of the User was not found.
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

  fetchAll: (user) => {
    const query = {
      affiliatedByUser: user?user._id:null
    };
    const convertedParams = strapi.utils.models.convertParams('affiliate', query);

    return Affiliate
      .find()
      .where(convertedParams.where)
      .sort(convertedParams.sort)
      .skip(convertedParams.start)
      .limit(convertedParams.limit)
      .populate(_.keys(_.groupBy(_.reject(strapi.models.affiliate.associations, {autoPopulate: false}), 'alias')).join(' '));
  },

  /**
    * @api {get} /affiliate/:_id Fetch user's affiliate details
    * @apiVersion 0.0.1
    * @apiName fetch
    * @apiGroup Affiliate
    * @apiPermission Customer
    *
    *
    * @apiParam {Object} params Id of affiliate requested.
    *
    * @apiExample Example usage:
    * curl -i http://localhost:1337/affiliate/:id
    *
    * @apiSuccess {ObjectId}   _id                      Object Id of Affiliate.
    * @apiSuccess {Integer}    amount                   Affiliate amount.
    * @apiSuccess {Boolean}    withdrawn                Whether Affiliate amount withdraw or not.
    * @apiSuccess {Date}       expiry                   Maturity period of affiliate.
    * @apiSuccess {Object}     affiliatedUser           User that has been affiliated.
    * @apiSuccess {Object}     affiliatedByUser         User that affiliated.
    * @apiSuccess {String}     status                   Affiliate status.
    * @apiSuccess {Date}       createdAt                Affiliate creation date.
    * @apiSuccess {Date}       updatedAt                Affiliate updation date.
    *
    * @apiError Unauthorized Only authenticated customer can fetch single affiliate.
    * @apiError NotFound   The <code>id</code> of the User was not found.
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


  fetch: (params) => {
    return Affiliate
      .findOne(_.pick(params, _.keys(Affiliate.schema.paths)))
      .populate(_.keys(_.groupBy(_.reject(strapi.models.affiliate.associations, {autoPopulate: false}), 'alias')).join(' '));
  },

  /**
    * @api {post} /affiliate Creates user's affiliate
    * @apiVersion 0.0.1
    * @apiName add
    * @apiGroup Affiliate
    * @apiPermission Customer
    *
    *
    * @apiParam {Object} values Object defining values for new Affiliate.
    *
    * @apiSuccess {ObjectId}   _id                      Object Id of Affiliate.
    * @apiSuccess {Integer}    amount                   Affiliate amount.
    * @apiSuccess {Boolean}    withdrawn                Whether Affiliate amount withdraw or not.
    * @apiSuccess {Date}       expiry                   Maturity period of affiliate.
    * @apiSuccess {Object}     affiliatedUser           User that has been affiliated.
    * @apiSuccess {Object}     affiliatedByUser         User that affiliated.
    * @apiSuccess {String}     status                   Affiliate status.
    * @apiSuccess {Date}       createdAt                Affiliate creation date.
    * @apiSuccess {Date}       updatedAt                Affiliate updation date.
    *
    * @apiError Unauthorized Only authenticated customer can fetch single affiliate.
    * @apiError NotFound   The <code>id</code> of the User was not found.
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

  add: async (values) => {
    const data = await Affiliate.create(_.omit(values, _.keys(_.groupBy(strapi.models.affiliate.associations, 'alias'))));
    return data;
  },

  /**
    * @api {put} /affiliate Updates affiliate with new info
    * @apiVersion 0.0.1
    * @apiName edit
    * @apiGroup Affiliate
    * @apiPermission Customer
    *
    *
    * @apiParam {Object} params Object defining Affiliate Id.
    * @apiParam {Object} values Object defining values for update.
    *
    * @apiSuccess {string}   ok            Found data.
    * @apiSuccess {string}   nModified     Number of modified docs.
    * @apiSuccess {string}   n             Number of not modified docs.
    *
    * @apiError Unauthorized Only authenticated customer can update single affiliate.
    * @apiError NotFound   The <code>id</code> of the User was not found.
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

  edit: async (params, values) => {
    // Note: The current method will return the full response of Mongo.
    // To get the updated object, you have to execute the `findOne()` method
    // or use the `findOneOrUpdate()` method with `{ new:true }` option.
    return Affiliate.update(params, values, { multi: true });
  },

  /**
    * @api {delete} /affiliate Delete affiliate
    * @apiVersion 0.0.1
    * @apiName remove
    * @apiGroup Affiliate
    * @apiPermission Customer
    *
    *
    * @apiParam {Object} params Object defining Affiliate Id.
    *
    * @apiSuccess {Object}   data           Deleted doc gets returned.
    *
    * @apiError Unauthorized Only authenticated customer can delete affiliate.
    * @apiError NotFound   The <code>id</code> of the User was not found.
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

  remove: async params => {
    // Note: To get the full response of Mongo, use the `remove()` method
    // or add spent the parameter `{ passRawResult: true }` as second argument.
    const data = await Affiliate.findOneAndRemove(params, {})
      .populate(_.keys(_.groupBy(_.reject(strapi.models.affiliate.associations, {autoPopulate: false}), 'alias')).join(' '));

    _.forEach(Affiliate.associations, async association => {
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
