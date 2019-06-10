/**
 * Test Global Method Services !
 * @type {"assert".internal | ((value: any, message?: string) => void)}
 */

let chai = require('chai');
let expect = chai.expect;;
const global = require('../config/functions/global');


describe('Should Check If Env Exist', function() {
  describe('#checkIfEnvFileExist()', function() {
    it('should check if env exist', function() {
      global.checkEnvFile().then(function (data) {
        expect(data).to.equal(null);
      });
    });
  });
});
