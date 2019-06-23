// // We define global methods here
//
// // We need to make sure that we have .env file before we start the server we start these services
// // Also ensuring that it should not delay.
//
//
// // A method to ensure that we have .env filebeat
//
//
//
// require('dotenv').load();
// const shell = require('shelljs');
//
//
// module.exports = async cb => {
// // We write test for every function we write or implement first hand .
// // This part stores only secret
// // This function will check the .env file and at some contents, and then if it does not exist, we create one with some default settings
//   checkEnvFile: async() =>{
//     if(process.env.enviornment != null){
//       //get enviorment type
//       getEnv()
//       // We move the settings from .env to config it happens when the server start.
//       setEnv()
//
//     }
//
//     createEnv()
//
//   }
//
//   checkDocker: async() => {
//     // We check docker wether its working
//     if(shell.exec('docker ps').code !== 0){
//       shell.echo('Error: docker is not working');
//       shell.exit(1);
//     }
//   }
//
//
//
//   getLatestCommit: async() =>{
//     const hash = shell
//     .exec('git rev-parse HEAD', {
//       silent: true
//     })
//     .stdout.trim()
//     .substr(0,7);
//     return hash;
//   }
//
//   getESClient: async() => {
//
//
//   }
//
//   getRedisClient: async() => {
//
//   }
//
//   function _getEnv(){
//     if(process.env.enviorment == 'development'){
//       // We set the whole development
//     }
//
//   }
//
//   createEnv: async() => {
//     const fs = require('fs');
//     //AS of now we define some settings inside the .env something sensitive
//     // ES, redisHost and port, serviceBot
//     envVariables = {
//
//     }
//     fs.writeFile('../../.env', envVariables) => {
//       if (err) throw err;
//       console.log("We were unable to create the env file")
//     }
//   }
//
//   const checkFile(){
//
//   }
//   // This creates the default ENV variables which we have right now, and as we increment , we put this in as part of configs.
//   const createDefault(){
//
//   }
//
//
//
//
// }
