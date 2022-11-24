const keypair = require('keypair');
const nock = require('nock');

const {
  getWebToken,
} = require('../src/web-token');

const pair = keypair();

const mockApiKey = Buffer.from(pair.public).toString('base64');

describe('web-token', () => {
  beforeAll(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    jest.clearAllMocks();
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  describe('#get_web_token', () => {
    it('should ensure it is called with params', async () => {
      const promise = getWebToken('001', mockApiKey, 0, undefined, 'https://a_callback.cb');

      await expect(promise).rejects.toThrow(new Error('Please ensure that you send through request params'));
    });

    it('should ensure the params are in an object', async () => {
      const promise = getWebToken('001', mockApiKey, 0, 'requestParams', 'https://a_callback.cb');
      await expect(promise).rejects.toThrow(new Error('Request params needs to be an object'));
    });

    it('should ensure that all required params are sent', async () => {
      const requestParams = {
        user_id: '1',
        job_id: '1',
      };

      const tokenResponse = new Error('product is required to get a web token');

      nock('https://testapi.smileidentity.com')
        .post('/v1/token', (body) => {
          expect(body.job_id).toEqual(requestParams.job_id);
          expect(body.user_id).toEqual(requestParams.user_id);
          expect(body.product).toEqual(undefined);
          return true;
        })
        .reply(412, tokenResponse);

      const promise = getWebToken('001', mockApiKey, 0, requestParams, 'https://a_callback.cb');

      await expect(promise).rejects.toThrow(new Error('product is required to get a web token'));
    });

    it('should return a token when all required params are set', () => {
      const requestParams = {
        user_id: '1',
        job_id: '1',
        product: 'biometric_kyc',
      };

      const tokenResponse = {
        token: '42',
      };

      nock('https://testapi.smileidentity.com')
        .post('/v1/token', (body) => {
          expect(body.job_id).toEqual(requestParams.job_id);
          expect(body.user_id).toEqual(requestParams.user_id);
          expect(body.product).toEqual(requestParams.product);
          return true;
        })
        .reply(200, tokenResponse);

      const promise = getWebToken('001', mockApiKey, 0, requestParams, 'https://a_callback.cb');
      return promise.then((resp) => {
        expect(resp.token).toEqual('42');
      });
    });

    it('should throw an error when the server token authorization server is down', async () => {
      const requestParams = {
        user_id: '1',
        job_id: '1',
        product: 'biometric_kyc',
      };

      const scope = nock('https://testapi.smileidentity.com').post('/v1/token', (body) => {
        expect(body.job_id).toEqual(requestParams.job_id);
        expect(body.user_id).toEqual(requestParams.user_id);
        expect(body.product).toEqual(requestParams.product);
        return true;
      }).replyWithError({
        status: 400,
      });

      const promise = getWebToken('001', mockApiKey, 0, requestParams, 'https://a_callback.cb');

      let response;
      let error;

      try {
        response = await promise;
      } catch (err) {
        error = err;
      }

      // make sure this test fails if the job goes through
      expect(response).toBeUndefined();

      // todo: figure out how to get nook to act like an error response would in real life
      // err.message in this case should be '2204:unauthorized'
      expect(error.message).toBe('undefined:undefined');
      expect(scope.isDone()).toEqual(true);
    });
  });

  describe('handle callback url', () => {
    it('should ensure that a callback URL exists', async () => {
      const promise = getWebToken('001', mockApiKey, 0, {});
      let response;
      let error;

      try {
        response = await promise;
      } catch (err) {
        error = err;
      }

      // make sure this test fails if the job goes through
      expect(response).toBeUndefined();

      // todo: figure out how to get nook to act like an error response would in real life
      // err.message in this case should be '2204:unauthorized'
      expect(error.message).toBe('Callback URL is required for this method');
    });

    it('should work with a callback_url param', () => {
      const requestParams = {
        user_id: '1',
        job_id: '1',
        product: 'ekyc_smartselfie',
        callback_url: 'https://a.callback.url/',
      };

      const tokenResponse = {
        token: '42',
      };

      nock('https://testapi.smileidentity.com')
        .post('/v1/token', (body) => {
          expect(body.job_id).toEqual(requestParams.job_id);
          expect(body.user_id).toEqual(requestParams.user_id);
          expect(body.product).toEqual(requestParams.product);
          expect(body.callback_url).toEqual(requestParams.callback_url);
          return true;
        })
        .reply(200, tokenResponse);

      const promise = getWebToken('001', mockApiKey, 0, requestParams, 'https://a_callback.cb');

      return promise.then((resp) => {
        expect(resp.token).toEqual('42');
      });
    });

    it('should fallback to the default callback URL', () => {
      const defaultCallbackURL = 'https://smileidentity.com/callback';
      const requestParams = {
        user_id: '1',
        job_id: '1',
        product: 'ekyc_smartselfie',
      };

      const tokenResponse = {
        token: 42,
      };

      nock('https://testapi.smileidentity.com')
        .post('/v1/token', (body) => {
          expect(body.job_id).toEqual(requestParams.job_id);
          expect(body.user_id).toEqual(requestParams.user_id);
          expect(body.product).toEqual(requestParams.product);
          expect(body.callback_url).toEqual(defaultCallbackURL);
          return true;
        }).reply(200, tokenResponse);

      const promise = getWebToken('001', mockApiKey, 0, requestParams, defaultCallbackURL);

      return promise.then((resp) => {
        expect(resp.token).toEqual(42);
      });
    });
  });
});
