/**
 * Test Subcampaign Services !
 * @type {"assert".internal | ((value: any, message?: string) => void)}
 */

let chai = require('chai');
let expect = chai.expect;
const request = require('co-supertest');
const uuid = require('uuid/v4');
const email = `${uuid()}@test.com`;
const password = uuid();
var Token, user, campaign, profile, subcampaign;

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
  * Create User subcampaign
  **/
  describe('create user subcampaign', () => {
    it('it should create user`s subcampaign', function *() {
      yield request(strapi.config.url)
      .post('/subcampaign')
      .set('Authorization', `Bearer ${Token}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send({
        campaign: campaign._id,
        name: 'Name',
        productName: "Product",
        productUrl: 'http://localhost:1337/',
        captureUrl: 'http://localhost:1337/'
      })
      .expect(201)
      .expect('Content-Type', /json/)
      .then((data, err) => {
        if(data.error)
          throw data.error;
        subcampaign = data.body;
      });
    });
  });

/**
 * Test Get User Profile
 **/
  describe('find user`s subcampaign', () => {
    it('it should get user`s subcampaign', function *() {
      yield request(strapi.config.url)
      .get(`/subcampaign`)
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
 * Test Get One Subcampaign
 **/
  describe('find one subcampaign test', () => {
    it('it should get one subcampaign', function *() {
      yield request(strapi.config.url)
      .get(`/subcampaign/${subcampaign._id}`)
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
 * Test Edit User Subcampaign
 **/
  describe('subcampaign update test', () => {
    it('it should update user`s subcampaign', function *() {
      yield request(strapi.config.url)
      .put(`/subcampaign/${subcampaign._id}`)
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
  * Test Delete Subcampaign
  **/
  describe('subcampaign deletion test', () => {
    it('it should delete subcampaign', function *() {
      yield request(strapi.config.url)
        .delete(`/subcampaign/${subcampaign._id}`)
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
