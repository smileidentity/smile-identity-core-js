const assert = require('assert');
const keypair = require('keypair');
const nock = require('nock');

const { Utilities, Signature, JOB_TYPE } = require('..');

const pair = keypair();
const mockApiKey = Buffer.from(pair.public).toString('base64');

describe('Utilities', () => {
  before(() => {
    nock.disableNetConnect();
  });

  after(() => {
    nock.enableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('#get_job_status', () => {
    it('should be able to check job_status successfully', async () => {
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
      const { signature } = new Signature('001', mockApiKey).generate_signature(timestamp);

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
      const scope = nock('https://testapi.smileidentity.com').post('/v1/job_status', (body) => {
        assert.equal(body.job_id, partner_params.job_id);
        assert.equal(body.user_id, partner_params.user_id);
        assert.notEqual(body.timestamp, undefined);
        assert.notEqual(body.signature, undefined);
        assert.equal(body.image_links, true);
        assert.equal(body.history, true);
        return true;
      }).reply(200, jobStatusResponse);
      const utilities = new Utilities('001', mockApiKey, 0);
      const jobStatus = await utilities.get_job_status(
        partner_params.user_id,
        partner_params.job_id,
        options,
      );
      assert.equal(jobStatus.signature, jobStatusResponse.signature);
      assert.equal(jobStatus.job_success, true);
      assert.equal(jobStatus.job_complete, true);
      assert.ok(scope.isDone());
    });

    it('should raise an error if one occurs', async () => {
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.SMART_SELFIE_AUTHENTICATION,
      };
      const options = {
        return_images: true,
        return_history: true,
      };

      const scope = nock('https://testapi.smileidentity.com').post('/v1/job_status', (body) => {
        assert.equal(body.job_id, partner_params.job_id);
        assert.equal(body.user_id, partner_params.user_id);
        assert.notEqual(body.timestamp, undefined);
        assert.notEqual(body.signature, undefined);
        assert.equal(body.image_links, true);
        assert.equal(body.history, true);
        return true;
      }).replyWithError(400, {
        code: '2204',
        error: 'unauthorized',
      });
      const utilities = new Utilities('001', mockApiKey, 0);

      let jobStatus;
      let error;
      try {
        jobStatus = await utilities.get_job_status(
          partner_params.user_id,
          partner_params.job_id,
          options,
        );
      } catch (err) {
        error = err;
      }
      assert.equal(jobStatus, undefined);
      assert.notEqual(error, undefined);
      assert.equal(error.cause.message, 400);
      assert.ok(scope.isDone());
    });
  });
});
