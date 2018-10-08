/**
 * Test Client Services !
 * @type {"assert".internal | ((value: any, message?: string) => void)}
 */

let chai = require('chai');
let expect = chai.expect;
const request = require('co-supertest');
const uuid = require('uuid/v4');
const email = `${uuid()}@test.com`;
const password = uuid();
var Token, user, client;

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
  * Create User client
  **/
  describe('create user client', () => {
    it('it should create user`s client', function *() {
      yield request(strapi.config.url)
      .post('/client')
      .set('Authorization', `Bearer ${Token}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send({
        name: 'FB',
        clientId: '23123123',
        secret: "2018-09-15-T-15-52-19-002Z",
        redirectUri: 'http://localhost:1337/redirect',
        origin: 'http://localhost:1337'
      })
      .expect(201)
      .expect('Content-Type', /json/)
      .then((data, err) => {
        if(data.error)
          throw data.error;
        client = data.body;
      });
    });
  });

/**
 * Test Get User Profile
 **/
  describe('find user`s client', () => {
    it('it should get user`s client', function *() {
      yield request(strapi.config.url)
      .get(`/client`)
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
 * Test Get One Client
 **/
  describe('find one client test', () => {
    it('it should get one client', function *() {
      yield request(strapi.config.url)
      .get(`/client/${client._id}`)
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
 * Test Edit User Client
 **/
  describe('client update test', () => {
    it('it should update user`s client', function *() {
      yield request(strapi.config.url)
      .put(`/client/${client._id}`)
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
  * Test Delete Client
  **/
  describe('client deletion test', () => {
    it('it should delete client', function *() {
      yield request(strapi.config.url)
        .delete(`/client/${client._id}`)
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
