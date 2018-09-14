'use strict';

/**
 * Paypalpayments.js controller
 *
 * @description: A set of functions called "actions" for managing `Paypalpayments`.
 */

module.exports = {

  /**
   * Retrieve paypalpayments records.
   *
   * @return {Object|Array}
   */

  agreement: async (ctx) => {
    const data = await strapi.services.paypalpayments.createAgreement(ctx.state.user, ctx.request.body);

    // Send 200 `ok`
    ctx.send(data);
  },

  /**
   * Retrieve a paypalpayments record.
   *
   * @return {Object}
   */

  payment: async (ctx) => {
    const data = await strapi.services.paypalpayments.payment(ctx.state.user, ctx.request.body);

    // Send 200 `ok`
    ctx.send(data);
  },

  /**
   * Create a/an paypalpayments record.
   *
   * @return {Object}
   */

  create: async (ctx) => {
    const data = await strapi.services.paypalpayments.add(ctx.request.body);

    // Send 201 `created`
    ctx.created(data);
  },

  /**
   * Update a/an paypalpayments record.
   *
   * @return {Object}
   */

  update: async (ctx, next) => {
    const data = await strapi.services.paypalpayments.edit(ctx.params, ctx.request.body) ;

    // Send 200 `ok`
    ctx.send(data);
  },

  /**
   * Destroy a/an paypalpayments record.
   *
   * @return {Object}
   */

  destroy: async (ctx, next) => {
    const data = await strapi.services.paypalpayments.remove(ctx.params);

    // Send 200 `ok`
    ctx.send(data);
  }
};
