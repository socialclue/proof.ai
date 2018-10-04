const kue = require( "kue" );
var Redis = require('ioredis');

/**
 * Make a global operator which can be used as like strapi.Kue.methods()
 */


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


kue.app.listen(3002);


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
  createJob: async (jobName, jobTitle, jobDescription, jobValue, priority, attempts, done) => {
    q.create(jobName,{
        title: jobTitle,
        description: jobDescription,
        value: jobValue
    }).priority(priority).attempts(attempts).save(function( err ) {
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
