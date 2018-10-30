/**
 * Test Affiliate Services !
 * @type {"assert".internal | ((value: any, message?: string) => void)}
 */

let chai = require('chai');
let expect = chai.expect;
const request = require('co-supertest');
const uuid = require('uuid/v4');
const email = `${uuid()}@test.com`;
const password = uuid();
var Token, user, affiliate;

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
  * Create User affiliate
  **/
  describe('create user affiliate', () => {
    it('it should create user`s affiliate', function *() {
      yield request(strapi.config.url)
      .post('/affiliate')
      .set('Authorization', `Bearer ${Token}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send({
        amount: '20',
        withdrawn: false,
        expiry: "2018-09-15T15:52:19.002Z",
        affiliatedUser: user._id,
        affiliatedByUser: user._id,
        status: 'active'
      })
      .expect(201)
      .expect('Content-Type', /json/)
      .then((data, err) => {
        if(data.error)
          throw data.error;
        affiliate = data.body;
      });
    });
  });

/**
 * Test Get User Profile
 **/
  describe('find user`s affiliate', () => {
    it('it should get user`s affiliate', function *() {
      yield request(strapi.config.url)
      .get(`/affiliate`)
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
 * Test Get One Affiliate
 **/
  describe('find one affiliate test', () => {
    it('it should get one affiliate', function *() {
      yield request(strapi.config.url)
      .get(`/affiliate/${affiliate._id}`)
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
 * Test Edit User Affiliate
 **/
  describe('affiliate update test', () => {
    it('it should update user`s affiliate', function *() {
      yield request(strapi.config.url)
      .put(`/affiliate/${affiliate._id}`)
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
  * Test Delete Affiliate
  **/
  describe('affiliate deletion test', () => {
    it('it should delete affiliate', function *() {
      yield request(strapi.config.url)
        .delete(`/affiliate/${affiliate._id}`)
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
