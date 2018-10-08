/**
 * Test Subdomain Services !
 * @type {"assert".internal | ((value: any, message?: string) => void)}
 */

let chai = require('chai');
let expect = chai.expect;
const request = require('co-supertest');
const uuid = require('uuid/v4');
const email = `${uuid()}@test.com`;
const password = uuid();
var Token, user, campaign, profile, subdomain;

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
 * Test Get User Profile
 **/
  describe('find user`s profile test', () => {
    it('it should get user`s profile', function *() {
      yield request(strapi.config.url)
      .get(`/profile`)
      .set('Authorization', `Bearer ${Token}`)
      .expect(200)
      .expect('Content-Type', /json/)
      .then((data, err) => {
        if(data.error)
          throw data.error;
        profile = data.body;
      });
    });
  });

/**
 * Test Create Campaign
 **/
  describe('campaign creation test', () => {
      it('it should create campaign with configuration and rules', function *() {
        yield request(strapi.config.url)
        .post('/campaign')
        .set('Authorization', `Bearer ${Token}`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
          campaign: {
            websiteUrl: 'servicebot.useinfluence.co',
            campaignName: 'Acme1',
            profile: profile._id
          }
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .then((data, err) => {
          if(data.error)
            throw data.error;
          campaign = data.body.data;
        });
      });
    });


/**
  * Create User subdomain
  **/
  describe('create user subdomain', () => {
    it('it should create user`s subdomain', function *() {
      yield request(strapi.config.url)
      .post('/subdomain')
      .set('Authorization', `Bearer ${Token}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send({
        type: 'subdomain',
        trackingId: campaign.trackingId,
        campaign: campaign._id,
        domainUrl: 'http://localhost:1337/',
      })
      .expect(201)
      .expect('Content-Type', /json/)
      .then((data, err) => {
        if(data.error)
          throw data.error;
        subdomain = data.body[0];
        console.log(subdomain);
      });
    });
  });

/**
 * Test Get User Profile
 **/
  describe('find user`s subdomain', () => {
    it('it should get user`s subdomain', function *() {
      yield request(strapi.config.url)
      .get(`/subdomain`)
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
 * Test Get One Subdomain
 **/
  describe('find one subdomain test', () => {
    it('it should get one subdomain', function *() {
      yield request(strapi.config.url)
      .get(`/subdomain/${subdomain._id}`)
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
 * Test Edit User Subdomain
 **/
  describe('subdomain update test', () => {
    it('it should update user`s subdomain', function *() {
      yield request(strapi.config.url)
      .put(`/subdomain/${subdomain._id}`)
      .set('Authorization', `Bearer ${Token}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send({
        productName: 'New Product'
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
  * Test Delete Subdomain
  **/
  describe('subdomain deletion test', () => {
    it('it should delete subdomain', function *() {
      yield request(strapi.config.url)
        .delete(`/subdomain/${subdomain._id}`)
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
  * Test Delete Campaign
  **/
  describe('campaign deletion test', () => {
    it('it should delete campaign with configuration and rules', function *() {
      yield request(strapi.config.url)
        .delete(`/campaign/${campaign._id}`)
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
  * Test Delete Profile
  **/
  describe('profile deletion test', () => {
    it('it should delete profile', function *() {
      yield request(strapi.config.url)
        .delete(`/profile/${profile._id}`)
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
