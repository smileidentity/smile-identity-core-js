const crypto = require('crypto');
const keypair = require('keypair');
const nock = require('nock');

const { Utilities, Signature } = require('..');

const pair = keypair();

describe('Utilities', () => {

  beforeAll(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    jest.clearAllMocks();
    nock.cleanAll();
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  describe('#get_job_status', () => {
    it('should be able to check job_status successfully', async () => {
      expect.assertions(9);
      const partnerParams = { user_id: '1', job_id: '1', job_type: 4 };
      const options = { return_images: true, return_history: true };

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
        timestamp,
        signature: sec_key,
      };
      const scope = nock('https://testapi.smileidentity.com').post('/v1/job_status', (body) => {
        expect(body.job_id).toEqual(partnerParams.job_id);
        expect(body.user_id).toEqual(partnerParams.user_id);
        expect(body.timestamp).not.toEqual(undefined);
        expect(body.sec_key).not.toEqual(undefined);
        expect(body.image_links).toEqual(true);
        expect(body.history).toEqual(true);
        return true;
      }).reply(200, jobStatusResponse);

      const utilities = new Utilities('001', Buffer.from(pair.public).toString('base64'), 0);
      const jobStatus = await utilities.get_job_status(
        partnerParams.user_id,
        partnerParams.job_id,
        options,
      );
      expect(jobStatus.sec_key).toEqual(jobStatusResponse.sec_key);
      expect(jobStatus.job_complete).toEqual(true);
      expect(scope.isDone()).toEqual(true);
    });

    it('should be able to use the signature instead of the sec_key when provided an option flag', async () => {
      expect.assertions(9);
      const partnerParams = { user_id: '1', job_id: '1', job_type: 4 };
      const options = { return_images: true, return_history: true, signature: true };

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

      const scope = nock('https://testapi.smileidentity.com').post('/v1/job_status', (body) => {
        expect(body.job_id).toEqual(partnerParams.job_id);
        expect(body.user_id).toEqual(partnerParams.user_id);
        expect(body.timestamp).not.toEqual(undefined);
        expect(body.signature).not.toEqual(undefined);
        expect(body.image_links).toEqual(true);
        expect(body.history).toEqual(true);
        return true;
      }).reply(200, jobStatusResponse);

      const utilities = new Utilities('001', '1234', 0);
      const jobStatus = await utilities.get_job_status(
        partnerParams.user_id,
        partnerParams.job_id,
        options,
      );
      expect(jobStatus.signature).toEqual(jobStatusResponse.signature);
      expect(jobStatus.job_complete).toEqual(true);
      expect(scope.isDone()).toEqual(true);
    });

    it('should raise an error if one occurs', async () => {
      expect.assertions(8);
      const partnerParams = { user_id: '1', job_id: '1', job_type: 4 };
      const options = { return_images: true, return_history: true };

      const scope = nock('https://testapi.smileidentity.com').post('/v1/job_status', (body) => {
        expect(body.job_id).toEqual(partnerParams.job_id);
        expect(body.user_id).toEqual(partnerParams.user_id);
        expect(body.timestamp).not.toEqual(undefined);
        expect(body.sec_key).not.toEqual(undefined);
        expect(body.image_links).toEqual(true);
        expect(body.history).toEqual(true);
        return true;
      }).replyWithError(400, { code: '2204', error: 'unauthorized' });

      const utilities = new Utilities('001', Buffer.from(pair.public).toString('base64'), 0);
      const jobStatus = utilities.get_job_status(
        partnerParams.user_id,
        partnerParams.job_id,
        options,
      );
      await expect(jobStatus).rejects.toThrow(new Error('Error: 400'));
      expect(scope.isDone()).toEqual(true);
    });
  });
});
