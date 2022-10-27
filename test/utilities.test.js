const assert = require('assert');
const crypto = require('crypto');
const keypair = require('keypair');
const nock = require('nock');

const { Utilities, Signature } = require('..');

const pair = keypair();

describe('Utilities', function () {
  describe('#get_job_status', function () {
    it('should be able to check job_status successfully', function (done) {
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 4,
      };
      const options = {
        return_images: true,
        return_history: true,
      };

      const timestamp = Date.now();
      const hash = crypto.createHash('sha256').update(`${1}:${timestamp}`).digest('hex');
      const encrypted = crypto.privateEncrypt({
        key: Buffer.from(pair.private),
        padding: crypto.constants.RSA_PKCS1_PADDING,
      }, Buffer.from(hash)).toString('base64');
      const sec_key = [encrypted, hash].join('|');
      const jobStatusResponse = {
        job_success: true,
        job_complete: true,
        result: {
          ResultCode: '0810',
          ResultText: 'Awesome!',
        },
        timestamp: timestamp,
        signature: sec_key,
      };
      nock('https://testapi.smileidentity.com')
        .post('/v1/job_status', (body) => {
          assert.equal(body.job_id, partner_params.job_id);
          assert.equal(body.user_id, partner_params.user_id);
          assert.notEqual(body.timestamp, undefined);
          assert.notEqual(body.sec_key, undefined);
          assert.equal(body.image_links, true);
          assert.equal(body.history, true);
          return true;
        })
        .reply(200, jobStatusResponse)
        .isDone();
      new Utilities('001', Buffer.from(pair.public).toString('base64'), 0)
        .get_job_status(partner_params.user_id, partner_params.job_id, options)
        .then((job_status) => {
          assert.equal(job_status.sec_key, jobStatusResponse.sec_key);
          assert.equal(job_status.job_complete, true);
          done();
        }).catch((err) => {
          assert.equal(null, err);
          console.error(err);
        });
    });

    it('should be able to use the signature instead of the sec_key when provided an option flag', function (done) {
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 4,
      };
      const options = {
        return_images: true,
        return_history: true,
        signature: true,
      };

      const timestamp = new Date().toISOString();
      const signature = new Signature('001', '1234').generate_signature(timestamp).signature;

      const jobStatusResponse = {
        job_success: true,
        job_complete: true,
        result: {
          ResultCode: '0810',
          ResultText: 'Awesome!',
        },
        timestamp: timestamp,
        signature: signature,
      };
      nock('https://testapi.smileidentity.com')
        .post('/v1/job_status', (body) => {
          assert.equal(body.job_id, partner_params.job_id);
          assert.equal(body.user_id, partner_params.user_id);
          assert.notEqual(body.timestamp, undefined);
          assert.notEqual(body.signature, undefined);
          assert.equal(body.image_links, true);
          assert.equal(body.history, true);
          return true;
        })
        .reply(200, jobStatusResponse)
        .isDone();
      new Utilities('001', '1234', 0)
        .get_job_status(partner_params.user_id, partner_params.job_id, options)
        .then((job_status) => {
          assert.equal(job_status.signature, jobStatusResponse.signature);
          assert.equal(job_status.job_complete, true);
          done();
        }).catch((err) => {
          assert.equal(null, err);
          console.error(err);
        });
    });

    it('should raise an error if one occurs', function (done) {
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 4,
      };
      const options = {
        return_images: true,
        return_history: true,
      };

      const timestamp = Date.now();
      const hash = crypto.createHash('sha256').update(`${1}:${timestamp}`).digest('hex');
      const encrypted = crypto.privateEncrypt({
        key: Buffer.from(pair.private),
        padding: crypto.constants.RSA_PKCS1_PADDING,
      }, Buffer.from(hash)).toString('base64');
      const sec_key = [encrypted, hash].join('|');
      const jobStatusResponse = {
        error: 'oops',
      };
      nock('https://testapi.smileidentity.com')
        .post('/v1/job_status', (body) => {
          assert.equal(body.job_id, partner_params.job_id);
          assert.equal(body.user_id, partner_params.user_id);
          assert.notEqual(body.timestamp, undefined);
          assert.notEqual(body.sec_key, undefined);
          assert.equal(body.image_links, true);
          assert.equal(body.history, true);
          return true;
        })
        .replyWithError(400, {
          code: '2204',
          error: 'unauthorized',
        })
        .isDone();
      new Utilities('001', Buffer.from(pair.public).toString('base64'), 0)
        .get_job_status(partner_params.user_id, partner_params.job_id, options)
        .then((job_status) => {
          assert.equal(null, job_status);
        }).catch((err) => {
          assert.equal(err.message, 'Error: 400');
          done();
        });
    });
  });
});
