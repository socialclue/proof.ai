// We define global methods here

// We need to make sure that we have .env file before we start the server we start these services
// Also ensuring that it should not delay.


// A method to ensure that we have .env filebeat



require('dotenv').load();

module.exports = async cb => {
// We write test for every function we write or implement first hand .

// This function will check the .env file and at some contents, and then if it does not exist, we create one with some default settings
  const checkEnvFile = function() {
    if (process.env != null){
      console.log("No env file")
    }

  }

  const setElasticClient = function (){

  }

  const setRedisClient = function() {

  }

  const getClient(name){
    // It should get the client with respective names say "ES" so get es.client or say redis so we get redis.clients

  }

  const createEnvFile(){

  }

  const checkFile(){

  }
  // This creates the default ENV variables which we have right now, and as we increment , we put this in as part of configs.
  const createDefault(){

  }




}
