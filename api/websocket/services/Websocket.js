'use strict';

/**
 * `Websocket` service.
 */
const fs = require('fs');

const webSocketStream = fs.createWriteStream('/tmp/log/websocket.log');


module.exports =  {
  /**
   * We are logging data to filebeats and then sending it to logstash and to elasticsearch
   * @param msg
   */
  log : (msg) => {
    const formatter = msg;
    let message =  formatter + '\n';
    console.log(msg);
    // if(msg.value && msg.value.event == 'formsubmit') {
      // campaignQueue.add({value: msg.value}, {priority:1});
    // }
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
