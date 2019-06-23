'use strict';

/**
 * Use `server.js` to run your application without `$ strapi start`.
 * To start the server, run: `$ npm start`.
 *
 * This is handy in situations where the Strapi CLI is not relevant or useful.
 */
const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'https://24c4f7fcf8744cb5ae17d1bd4c51b885@sentry.io/1306558' });
require('newrelic');
process.chdir(__dirname);

(() => {

  const strapi = require('strapi');
  strapi.start();
})();
