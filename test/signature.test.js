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
    it('should generate a signature with a default timestamp', () => {
      const mockApiKey = Buffer.from(pair.public).toString('base64');
      const timestamp = new Date().getTime();
      const result = new Signature('001', mockApiKey).generate_signature(timestamp);

      assert.equal(typeof result.signature, 'string');
      assert.equal(typeof result.timestamp, 'number');
      assert.ok(result.timestamp <= new Date().getTime());
    });

    it('should generate a signature for valid timestamps', (done) => {
      const validTimestampFormats = [
        '2018-01-01T00:00:00.000Z',
        '2018-01-01T00:00:00.000+00:00',
        '2018-01-01T00:00:00.000+0000',
        new Date().toISOString(),
        Date.now(),
        new Date().getTime(),
      ];

      validTimestampFormats.forEach((timestamp) => {
        const mockApiKey = Buffer.from(pair.public).toString('base64');
        const result = new Signature('001', mockApiKey).generate_signature(timestamp);
        const isoTimestamp = typeof timestamp === 'number' ? new Date(timestamp).toISOString() : timestamp;
        const hmac = crypto.createHmac('sha256', mockApiKey);
        hmac.update(isoTimestamp, 'utf8').update('001', 'utf8').update('sid_request', 'utf8');
        const output = hmac.digest().toString('base64');
        assert.equal(output, result.signature);
        assert.equal(timestamp, result.timestamp);
      });
      done();
    });

    it('should throw an error for invalid timestamps', (done) => {
      [NaN, '', '2018-00-01T00:00:00.000'].forEach((timestamp) => {
        const mockApiKey = Buffer.from(pair.public).toString('base64');
        let result;
        let error;

        try {
          result = new Signature('001', mockApiKey).generate_signature(timestamp);
        } catch (e) {
          error = e;
        }
        assert.equal(result, undefined);
        assert.equal(error.message, 'Invalid time value');
      });
      done();
    });

    it('should calculate a signature and use a timestamp if provided one', (done) => {
      const timestamp = new Date().toISOString();
      const hmac = crypto.createHmac('sha256', '1234');
      hmac.update(timestamp, 'utf8').update('002', 'utf8').update('sid_request', 'utf8');
      const output = hmac.digest().toString('base64');
      const result = new Signature('002', '1234').generate_signature(timestamp);
      assert.equal(output, result.signature);
      assert.equal(timestamp, result.timestamp);
      done();
    });
  });

  describe('#confirm_signature', () => {
    it('should confirm an incoming signature', (done) => {
      const timestamp = new Date().toISOString();
      const hmac = crypto.createHmac('sha256', '1234');
      hmac.update(timestamp, 'utf8').update('002', 'utf8').update('sid_request', 'utf8');
      const output = hmac.digest().toString('base64');
      assert.equal(true, new Signature('002', '1234').confirm_signature(timestamp, output));
      done();
    });
  });
});
