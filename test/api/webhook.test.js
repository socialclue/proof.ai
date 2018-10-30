/**
 * Test Campaign Services !
 * @type {"assert".internal | ((value: any, message?: string) => void)}
 */

let chai = require('chai');
let expect = chai.expect;
const request = require('co-supertest');
const uuid = require('uuid/v4');
const email = `${uuid()}@test.com`;
const password = uuid();
var Token, profile, user, campaign, webhook;

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
 * Test Create Campaign for webhook
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
          websiteUrl: 'github.useinfluence.co',
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
  * Create campaign webhooks
  **/
  describe('create campaign webhooks', () => {
    it('it should create campaign webhooks', function *() {
      yield request(strapi.config.url)
      .post('/webhooks')
      .set('Authorization', `Bearer ${Token}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send({
        name: 'webhook',
        type: 'custom',
        trackingId: campaign.trackingId,
        campaign: campaign
      })
      .expect(201)
      .expect('Content-Type', /json/)
      .then((data, err) => {
        if(data.error)
          throw data.error;
        webhook = data.body;
      });
    });
  });

/**
 * Test Get Campaign Webhook
 **/
  describe('find campaign webhook test', () => {
    it('it should get campaign`s webhook', function *() {
      yield request(strapi.config.url)
      .get(`/webhooks/campaign/${campaign._id}`)
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
   * Test Log data using Webhook
   **/
    describe('log data using webhook test', () => {
      it('it should log data using webhook', function *() {
        yield request(strapi.config.url)
        .post(`/webhooks/custom/${campaign.trackingId}/2121`)
        .send({
            email: 'test@test.com',
            name: 'Test',
            latitude: '12.11',
            longitude: '12.34',
            city: 'New Delhi',
            country: 'India',
            ip: '23.23.2.3',
            host: 'localhost'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .then((data, err) => {
          if(data.error)
            throw data.error;
        });
      });
    });

/**
 * Test Get One Webhook
 **/
  describe('find one webhook test', () => {
    it('it should get one webhook', function *() {
      yield request(strapi.config.url)
      .get(`/webhooks/${webhook._id}`)
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
 * Test Edit Campaigns webhook
 **/
  describe('webhook update test', () => {
    it('it should update webhook', function *() {
      yield request(strapi.config.url)
      .put(`/webhooks/${webhook._id}`)
      .set('Authorization', `Bearer ${Token}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send({
        name: 'DEF',
        type: 'ABC'
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
  * Test Delete Webhook
  **/
  describe('webhook deletion test', () => {
    it('it should delete webhook', function *() {
      yield request(strapi.config.url)
        .delete(`/webhooks/${webhook._id}`)
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
  * Delete the User
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
