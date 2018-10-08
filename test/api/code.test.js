/**
 * Test Code Services !
 * @type {"assert".internal | ((value: any, message?: string) => void)}
 */

let chai = require('chai');
let expect = chai.expect;
const request = require('co-supertest');
const uuid = require('uuid/v4');
const email = `${uuid()}@test.com`;
const password = uuid();
var Token, user, code;

/**
 * Test the login user
 **/
  describe('user sign up test', () => {
    it('it should sign user', function *() {
      yield request(strapi.config.url)
      .post('/auth/local/register')
      .send({
        email: email,
        password: password,
        username: email.match(/^(.+)@/)[1]
      })
      .expect(200)
      .then((res) => {
        if(!res)
          throw res.error
        Token = res.body.jwt;
        user = res.body.user;
      });
    });
  });

/**
  * Create User code
  **/
  describe('create user code', () => {
    it('it should create user`s code', function *() {
      yield request(strapi.config.url)
      .post('/code')
      .set('Authorization', `Bearer ${Token}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send({
        value: '1212121212',
        clientId: '23123123',
        userId: "2018-09-15-T-15-52-19-002Z",
        redirectUri: 'http://localhost:1337/redirect'
      })
      .expect(201)
      .expect('Content-Type', /json/)
      .then((data, err) => {
        if(data.error)
          throw data.error;
        code = data.body;
      });
    });
  });

/**
 * Test Get User Profile
 **/
  describe('find user`s code', () => {
    it('it should get user`s code', function *() {
      yield request(strapi.config.url)
      .get(`/code`)
      .set('Authorization', `Bearer ${Token}`)
      .expect(200)
      .expect('Content-Type', /json/)
      .then((data, err) => {
        if(data.error)
          throw data.error;
      });
    });
  });

/**
 * Test Get One Code
 **/
  describe('find one code test', () => {
    it('it should get one code', function *() {
      yield request(strapi.config.url)
      .get(`/code/${code._id}`)
      .set('Authorization', `Bearer ${Token}`)
      .expect(200)
      .expect('Content-Type', /json/)
      .then((data, err) => {
        if(data.error)
          throw data.error;
      });
    });
  });

/**
 * Test Edit User Code
 **/
  describe('code update test', () => {
    it('it should update user`s code', function *() {
      yield request(strapi.config.url)
      .put(`/code/${code._id}`)
      .set('Authorization', `Bearer ${Token}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send({
        status: 'completed',
        withdrawn: true
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then((data, err) => {
        if(data.error)
          throw data.error;
      });
    });
  });

/**
  * Test Delete Code
  **/
  describe('code deletion test', () => {
    it('it should delete code', function *() {
      yield request(strapi.config.url)
        .delete(`/code/${code._id}`)
        .set('Authorization', `Bearer ${Token}`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .then((data, err) => {
          if(data.error)
            throw data.error;
        });
    });
  });

/**
  * Delete the user
  **/
  describe('Should Delete User', function() {
    it("should delete user", function *() {
      yield request(strapi.config.url)
      .delete(`/user/${user._id}`)
      .set('Authorization', `Bearer ${Token}`)
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/)
      .then((data, err) => {
        if(data.error)
          throw data.error;
      });
    });
  });
