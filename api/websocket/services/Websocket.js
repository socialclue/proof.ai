'use strict';

/**
 * `Websocket` service.
 */
const fs = require('fs');

const webSocketStream = fs.createWriteStream('/tmp/log/websocket.log');
var Queue = require('bull');
var campaignQueue = new Queue('Data logger', 'redis://127.0.0.1:6379');
campaignQueue.process(function(job, done){

  // job.data contains the custom data passed when the job was created
  // job.id contains id of this job.
  console.log(job.data, '=======job');
  // transcode video asynchronously and report progress
  job.progress(42);

  // call done when finished
  done();

  // or give a error if error
  done(new Error('error transcoding'));

  // or pass it a result
  done(null, { framerate: 29.5 /* etc... */ });

  // If the job throws an unhandled exception it is also handled correctly
  throw new Error('some unexpected error');
});


module.exports =  {
  /**
   * We are logging data to filebeats and then sending it to logstash and to elasticsearch
   * @param msg
   */
  log : (msg) => {
    const formatter = msg;
    let message =  formatter + '\n';
    console.log(msg);
    if(msg.value && msg.value.event == 'formsubmit') {
      campaignQueue.add({value: msg.value}, {priority:1});
    }
    webSocketStream.write(message);
  },

  health: () => {
    if (strapi.websocket){
      return true;
    } else {
      return false;
    }
  }
};
