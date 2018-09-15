'use strict';

/**
 * Affiliate.js controller
 *
 * @description: A set of functions called "actions" for managing `Affiliate`.
 */

module.exports = {

  /**
   * Share affiliate link.
   *
   * @return {Object|Array}
   */

  share: async (ctx) => {
    const data = await strapi.services.affiliate.share(ctx.state.user, ctx.request.body);

    // Send 200 `ok`
    ctx.send(data);
  },

  /**
   * Retrieve affiliate records.
   *
   * @return {Object|Array}
   */

  find: async (ctx) => {
    const data = await strapi.services.affiliate.fetchAll(ctx.query);

    // Send 200 `ok`
    ctx.send(data);
  },

  /**
   * Retrieve a affiliate record.
   *
   * @return {Object}
   */

  findOne: async (ctx) => {
    if (!ctx.params._id.match(/^[0-9a-fA-F]{24}$/)) {
      return ctx.notFound();
    }

    const data = await strapi.services.affiliate.fetch(ctx.params);

    // Send 200 `ok`
    ctx.send(data);
  },

  /**
   * Create a/an affiliate record.
   *
   * @return {Object}
   */

  create: async (ctx) => {
    const data = await strapi.services.affiliate.add(ctx.request.body);

    // Send 201 `created`
    ctx.created(data);
  },

  /**
   * Update a/an affiliate record.
   *
   * @return {Object}
   */

  update: async (ctx, next) => {
    const data = await strapi.services.affiliate.edit(ctx.params, ctx.request.body) ;

    // Send 200 `ok`
    ctx.send(data);
  },

  /**
   * Destroy a/an affiliate record.
   *
   * @return {Object}
   */

  destroy: async (ctx, next) => {
    const data = await strapi.services.affiliate.remove(ctx.params);

    // Send 200 `ok`
    ctx.send(data);
  }
};
