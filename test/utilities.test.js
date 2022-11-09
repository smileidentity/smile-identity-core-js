const assert = require('assert');
const keypair = require('keypair');
const nock = require('nock');

const { Utilities, Signature, JOB_TYPE } = require('..');

const pair = keypair();

describe('Utilities', () => {
  describe('#get_job_status', () => {
    it('should be able to check job_status successfully', (done) => {
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.SMART_SELFIE_AUTHENTICATION,
      };
      const options = {
        return_images: true,
        return_history: true,
        signature: true,
      };

      const timestamp = new Date().toISOString();
      const { signature } = new Signature('001', '1234').generate_signature(timestamp);

      const jobStatusResponse = {
        job_success: true,
        job_complete: true,
        result: {
          ResultCode: '0810',
          ResultText: 'Awesome!',
        },
        timestamp,
        signature,
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

    it('should raise an error if one occurs', (done) => {
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.SMART_SELFIE_AUTHENTICATION,
      };
      const options = {
        return_images: true,
        return_history: true,
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
