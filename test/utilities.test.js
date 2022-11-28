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
      const mockApiKey = Buffer.from(pair.public).toString('base64');

      const timestamp = new Date().toISOString();
      const { signature } = new Signature('001', mockApiKey).generate_signature(timestamp);

      const jobStatusResponse = {
        job_complete: true,
        job_success: true,
        result: {
          ResultCode: '0810',
          ResultText: 'Awesome!',
        },
        signature,
        timestamp,
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

      const utilities = new Utilities('001', mockApiKey, 0);
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
        expect(body.signature).not.toEqual(undefined);
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
