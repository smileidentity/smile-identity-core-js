const assert = require('assert');
const keypair = require('keypair');
const nock = require('nock');

const {
  getWebToken,
} = require('../src/web-token');

const pair = keypair();

const mockApiKey = Buffer.from(pair.public).toString('base64');

describe('web-token', () => {
  describe('#get_web_token', () => {
    it('should ensure it is called with params', (done) => {
      const promise = getWebToken('001', mockApiKey, 0, undefined, 'https://a_callback.cb');
      promise.catch((err) => {
        assert.equal(err.message, 'Please ensure that you send through request params');
        done();
      });
    });

    it('should ensure the params are in an object', (done) => {
      const promise = getWebToken('001', mockApiKey, 0, 'requestParams', 'https://a_callback.cb');
      promise.catch((err) => {
        assert.equal(err.message, 'Request params needs to be an object');
        done();
      });
    });

    it('should ensure that all required params are sent', (done) => {
      const requestParams = {
        user_id: '1',
        job_id: '1',
      };

      const tokenResponse = new Error('product is required to get a web token');

      nock('https://testapi.smileidentity.com')
        .post('/v1/token', (body) => {
          assert.equal(body.job_id, requestParams.job_id);
          assert.equal(body.user_id, requestParams.user_id);
          assert.equal(body.product, undefined);
          return true;
        })
        .reply(412, tokenResponse)
        .isDone();

      const promise = getWebToken('001', mockApiKey, 0, requestParams, 'https://a_callback.cb');
      promise.catch((err) => {
        assert.equal(err.message, 'product is required to get a web token');
        done();
      });
    });

    it('should return a token when all required params are set', (done) => {
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
          assert.equal(body.job_id, requestParams.job_id);
          assert.equal(body.user_id, requestParams.user_id);
          assert.equal(body.product, requestParams.product);
          return true;
        })
        .reply(200, tokenResponse)
        .isDone();

      const promise = getWebToken('001', mockApiKey, 0, requestParams, 'https://a_callback.cb');
      promise.then((resp) => {
        assert.equal(resp.token, '42');
        done();
      });
    });

    it('should throw an error when the server token authorization server is down', async () => {
      const requestParams = {
        user_id: '1',
        job_id: '1',
        product: 'biometric_kyc',
      };

      const scope = nock('https://testapi.smileidentity.com').post('/v1/token', (body) => {
        assert.equal(body.job_id, requestParams.job_id);
        assert.equal(body.user_id, requestParams.user_id);
        assert.equal(body.product, requestParams.product);
        return true;
      }).replyWithError({
        status: 400,
      });

      let error;
      await getWebToken('001', mockApiKey, 0, requestParams, 'https://a_callback.cb').then(() => {
        assert.fail('should not have gotten here');
      }).catch((err) => {
        error = err;
      });
      assert.ok(error instanceof Error);
      assert.ok(scope.isDone());
    });
  });

  describe('handle callback url', () => {
    it('should ensure that a callback URL exists', (done) => {
      const promise = getWebToken('001', mockApiKey, 0, {});

      promise.catch((err) => {
        assert.equal(err.message, 'Callback URL is required for this method');

        done();
      });
    });

    it('should work with a callback_url param', (done) => {
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
          assert.equal(body.job_id, requestParams.job_id);
          assert.equal(body.user_id, requestParams.user_id);
          assert.equal(body.product, requestParams.product);
          assert.equal(body.callback_url, requestParams.callback_url);
          return true;
        })
        .reply(200, tokenResponse)
        .isDone();

      const promise = getWebToken('001', mockApiKey, 0, requestParams, 'https://a_callback.cb');

      promise.then((resp) => {
        assert.equal(resp.token, '42');
        done();
      });
    });

    it('should fallback to the default callback URL', (done) => {
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
          assert.equal(body.job_id, requestParams.job_id);
          assert.equal(body.user_id, requestParams.user_id);
          assert.equal(body.product, requestParams.product);
          assert.equal(body.callback_url, defaultCallbackURL);
          return true;
        })
        .reply(200, tokenResponse)
        .isDone();

      const promise = getWebToken('001', mockApiKey, 0, requestParams, defaultCallbackURL);

      promise.then((resp) => {
        assert.equal(resp.token, '42');
        done();
      });
    });
  });
});
