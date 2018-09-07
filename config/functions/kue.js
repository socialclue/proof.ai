const kue = require( "kue" );

/**
 * Make a global operator which can be used as like strapi.Kue.methods()
 */


/**
 * Method for the redis setting with docker/production.
 * @type {{}}
 */

const q = kue.createQueue({
  prefix: 'q',
  redis: {
    port: strapi.config.redisPort,
    host: strapi.config.redisHost,
    auth: strapi.config.redisPassword,
    db: strapi.config.redisDb, // if provided select a non-default redis db
    options: {
      // see https://github.com/mranney/node_redis#rediscreateclient
    }
  }
});


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
  createJob: async (jobName, jobTitle, jobDescription, priority, attempts) => {
    q.create(jobName,{
        title: jobTitle,
        description: jobDescription
    }).priority(priority).attempts(attempts).save(function( err ) {
      if (!err) console.log( err);
    });
  },


  processJobs: async (jobName, values, number, fn) => {
    q.process(jobName, number, function(values, done ) {
      fn(values,done);
    })
  }


};



