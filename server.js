'use strict';

/**
 * Use `server.js` to run your application without `$ strapi start`.
 * To start the server, run: `$ npm start`.
 *
 * This is handy in situations where the Strapi CLI is not relevant or useful.
 */
const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'https://7407261372c046d5a1331d2aa3f85a31@sentry.io/1291908' });
require('newrelic');
process.chdir(__dirname);

(() => {

  const strapi = require('strapi');
  strapi.start();
})();
