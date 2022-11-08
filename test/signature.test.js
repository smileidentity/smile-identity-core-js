const assert = require('assert');
const crypto = require('crypto');
const keypair = require('keypair');

const { Signature } = require('..');

const pair = keypair();

describe('Signature', () => {
  describe('#new', () => {
    it('should set the partner_id and api_key values', (done) => {
      const instance = new Signature('001', Buffer.from(pair.public).toString('base64'));
      assert.equal(instance.partnerID, '001');
      assert.equal(instance.apiKey, Buffer.from(pair.public).toString('base64'));
      done();
    });
  });

  describe('#generate_signature', () => {
    it('should calculate a signature and use a timestamp if provided one', (done) => {
      const timestamp = new Date().toISOString();
      const hmac = crypto.createHmac('sha256', '1234');
      hmac.update(timestamp, 'utf8');
      hmac.update('002', 'utf8');
      hmac.update('sid_request', 'utf8');
      const output = hmac.digest().toString('base64');
      const result = new Signature('002', '1234').generate_signature(timestamp);
      assert.equal(output, result.signature);
      assert.equal(timestamp, result.timestamp);
      done();
    });
  });

  describe('#confirm_signature', () => {
    it('should confirm an incoming signaute', (done) => {
      const timestamp = new Date().toISOString();
      const hmac = crypto.createHmac('sha256', '1234');
      hmac.update(timestamp, 'utf8');
      hmac.update('002', 'utf8');
      hmac.update('sid_request', 'utf8');
      const output = hmac.digest().toString('base64');
      assert.equal(true, new Signature('002', '1234').confirm_signature(timestamp, output));
      done();
    });
  });
});
