const assert = require('assert');
const crypto = require('crypto');
const keypair = require('keypair');

const { Signature } = require('..');

const pair = keypair();

// test that the sec key is generated correctly
describe('Signature', () => {
  describe('#new', () => {
    it('should set the partner_id and api_key values', (done) => {
      const instance = new Signature('001', Buffer.from(pair.public).toString('base64'));
      assert.equal(instance.partnerID, '001');
      assert.equal(instance.apiKey, Buffer.from(pair.public).toString('base64'));
      done();
    });
  });

  describe('#generate_sec_key', () => {
    it('should create a sec_key', (done) => {
      const timestamp = Date.now();
      const signature = new Signature('001', Buffer.from(pair.public).toString('base64')).generate_sec_key(timestamp);
      assert.equal(typeof (signature), 'object');
      assert.equal(timestamp, signature.timestamp);
      const hash = crypto.createHash('sha256').update(`${1}:${timestamp}`).digest('hex');
      assert.equal(hash, signature.sec_key.split('|')[1]);
      const decrypted = crypto.privateDecrypt({
        key: Buffer.from(pair.private),
        padding: crypto.constants.RSA_PKCS1_PADDING,
      }, Buffer.from(signature.sec_key.split('|')[0], 'base64')).toString();
      assert.equal(decrypted, hash);
      done();
    });
  });

  describe('#confirm_sec_key', () => {
    it('should be able to decode a valid sec_key', (done) => {
      const timestamp = Date.now();
      const hash = crypto.createHash('sha256').update(`${1}:${timestamp}`).digest('hex');
      const encrypted = crypto.privateEncrypt({
        key: Buffer.from(pair.private),
        padding: crypto.constants.RSA_PKCS1_PADDING,
      }, Buffer.from(hash)).toString('base64');
      const sec_key = [encrypted, hash].join('|');
      assert.equal(true, new Signature('001', Buffer.from(pair.public).toString('base64')).confirm_sec_key(timestamp, sec_key));
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
