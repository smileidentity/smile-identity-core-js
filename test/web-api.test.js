const assert = require('assert');
const keypair = require('keypair');
const nock = require('nock');
const packageJson = require('../package.json');

const {
  WebApi, Signature, IMAGE_TYPE, JOB_TYPE,
} = require('..');

const pair = keypair();

describe('WebApi', () => {
  describe('#new', () => {
    it('should instantiate and set the global variables', () => {
      const instance = new WebApi('001', 'https://a_callback.com', Buffer.from(pair.public).toString('base64'), 0);
      assert.equal(instance.partner_id, '001');
      assert.equal(instance.api_key, Buffer.from(pair.public).toString('base64'));
      assert.equal(instance.default_callback, 'https://a_callback.com');
      assert.equal(instance.url, 'testapi.smileidentity.com/v1');
    });
  });

  describe('#submit_job', () => {
    it('should ensure that a method of getting data back has been selected', async () => {
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.BIOMETRIC_KYC,
      };
      const instance = new WebApi('001', '', Buffer.from(pair.public).toString('base64'), 0);
      let error;
      try {
        await instance.submit_job(partner_params, [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_FILE, image: 'test/fixtures/1pixel.jpeg' }], {}, {});
      } catch (err) {
        error = err;
      }
      assert.equal(error.message, 'Please choose to either get your response via the callback or job status query');
    });

    it('should ensure that the partner_params are present', async () => {
      const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      let error;
      try {
        await instance.submit_job(null, {}, {}, { return_job_status: true });
      } catch (err) {
        error = err;
      }
      assert.equal(error.message, 'Please ensure that you send through partner params');
    });

    it('should ensure that the partner_params are an object', async () => {
      const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      let error;
      try {
        await instance.submit_job('not partner params', {}, {}, { return_job_status: true });
      } catch (err) {
        error = err;
      }
      assert.equal(error.message, 'Partner params needs to be an object');
    });

    // eslint-disable-next-line mocha/no-setup-in-describe
    ['user_id', 'job_id', 'job_type'].forEach((key) => {
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.BIOMETRIC_KYC,
      };
      delete partner_params[key];

      it(`should ensure that the partner_params contain ${key}`, async () => {
        const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
        let error;
        try {
          await instance.submit_job(partner_params, {}, {}, { return_job_status: true });
        } catch (err) {
          error = err;
        }
        assert.equal(error.message, `Please make sure that ${key} is included in the partner params`);
      });

      it(`should ensure that in partner_params, ${key} is not an empty string`, async () => {
        const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
        let error;
        try {
          await instance.submit_job(partner_params, {}, {}, { return_job_status: true });
        } catch (err) {
          error = err;
        }
        assert.equal(error.message, `Please make sure that ${key} is included in the partner params`);
      });
    });

    it('should ensure that images exist', async () => {
      const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.BIOMETRIC_KYC,
      };
      let error;
      try {
        await instance.submit_job(partner_params, null, {}, { return_job_status: true });
      } catch (err) {
        error = err;
      }
      assert.equal(error.message, 'Please ensure that you send through image details');
    });

    it('should ensure that images is an array', async () => {
      const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.BIOMETRIC_KYC,
      };
      let error;
      try {
        await instance.submit_job(partner_params, {}, {}, { return_job_status: true });
      } catch (err) {
        error = err;
      }
      assert.equal(error.message, 'Image details needs to be an array');
    });

    it('should ensure that images is an array and that it is not empty', async () => {
      const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.BIOMETRIC_KYC,
      };
      let error;
      let response;
      try {
        response = await instance.submit_job(partner_params, [], {}, { return_job_status: true });
      } catch (err) {
        error = err;
      }
      assert.equal(error.message, 'You need to send through at least one selfie image');
      assert.equal(response, undefined);
    });

    it('should ensure that images is an array and that it has a selfie', async () => {
      const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.BIOMETRIC_KYC,
      };
      let error;
      try {
        await instance.submit_job(
          partner_params,
          [{ image_type_id: IMAGE_TYPE.ID_CARD_IMAGE_FILE, image: 'path/to/image' }],
          {},
          { return_job_status: true },
        );
      } catch (err) {
        error = err;
      }
      assert.equal(error.message, 'You need to send through at least one selfie image');
    });

    // eslint-disable-next-line mocha/no-setup-in-describe
    ['country', 'id_type', 'id_number'].forEach((key) => {
      const id_info = {
        country: 'NG',
        id_type: 'BVN',
        id_number: '12345',
        entered: 'true',
      };
      delete id_info[key];
      it(`should ensure that id_info contains ${key}`, async () => {
        const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
        const partner_params = {
          user_id: '1',
          job_id: '1',
          job_type: JOB_TYPE.BIOMETRIC_KYC,
        };

        let error;
        try {
          await instance.submit_job(partner_params, [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_FILE, image: 'test/fixtures/1pixel.jpeg' }], id_info, { return_job_status: true });
        } catch (err) {
          error = err;
        }
        assert.equal(error.message, `Please make sure that ${key} is included in the id_info`);
      });
    });

    it('should ensure that job type 1 has an id card image if there is no id_info', async () => {
      const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.BIOMETRIC_KYC,
      };
      let error;
      try {
        await instance.submit_job(partner_params, [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_FILE, image: 'test/fixtures/1pixel.jpeg' }], {}, { return_job_status: true });
      } catch (err) {
        error = err;
      }
      assert.equal(error.message, 'You are attempting to complete a job type 1 without providing an id card image or id info');
    });

    // eslint-disable-next-line mocha/no-setup-in-describe
    ['return_job_status', 'return_images', 'return_history'].forEach((flag) => {
      const options = {};
      options[flag] = 'not a boolean';
      it(`should ensure that optional field ${flag} is boolean`, async () => {
        const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
        const partner_params = {
          user_id: '1',
          job_id: '1',
          job_type: JOB_TYPE.SMART_SELFIE_AUTHENTICATION,
        };
        let error;
        try {
          await instance.submit_job(partner_params, [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_FILE, image: 'test/fixtures/1pixel.jpeg' }], {}, options);
        } catch (err) {
          error = err;
        }
        assert.equal(error.message, `${flag} needs to be a boolean`);
      });
    });

    it('should be able to send a job', async () => {
      const instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.SMART_SELFIE_AUTHENTICATION,
      };
      const options = {};
      const smile_job_id = '0000000111';

      nock('https://testapi.smileidentity.com')
        .post('/v1/upload', (body) => {
          assert.equal(body.smile_client_id, '001');
          assert.notEqual(body.signature, undefined);
          assert.notEqual(body.timestamp, undefined);
          assert.equal(body.file_name, 'selfie.zip');
          assert.equal(body.partner_params.user_id, partner_params.user_id);
          assert.equal(body.partner_params.job_id, partner_params.job_id);
          assert.equal(body.partner_params.job_type, partner_params.job_type);
          assert.equal(body.callback_url, 'https://a_callback.cb');
          assert.equal(body.source_sdk, 'javascript');
          assert.equal(body.source_sdk_version, packageJson.version);
          return true;
        })
        .reply(200, {
          upload_url: 'https://some_url.com',
          smile_job_id,
        });
      nock('https://some_url.com')
        .put('/') // todo: find a way to unzip and test info.json
        .reply(200);

      const response = await instance.submit_job(partner_params, [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_BASE64, image: 'base6image' }], {}, options);

      assert.deepEqual(response, { success: true });
      return true;
    });

    it('should be able to send a job with a signature', async () => {
      const instance = new WebApi('001', 'https://a_callback.cb', '1234', 0);
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.SMART_SELFIE_AUTHENTICATION,
      };
      const options = {
        signature: true,
      };
      const smile_job_id = '0000000111';

      nock('https://testapi.smileidentity.com')
        .post('/v1/upload', (body) => {
          assert.equal(body.smile_client_id, '001');
          assert.notEqual(body.signature, undefined);
          assert.notEqual(body.timestamp, undefined);
          assert.equal(body.file_name, 'selfie.zip');
          assert.equal(body.partner_params.user_id, partner_params.user_id);
          assert.equal(body.partner_params.job_id, partner_params.job_id);
          assert.equal(body.partner_params.job_type, partner_params.job_type);
          assert.equal(body.callback_url, 'https://a_callback.cb');
          assert.equal(body.source_sdk, 'javascript');
          assert.equal(body.source_sdk_version, packageJson.version);
          return true;
        })
        .reply(200, {
          upload_url: 'https://some_url.com',
          smile_job_id,
        });
      nock('https://some_url.com')
        .put('/') // todo: find a way to unzip and test info.json
        .reply(200);

      await instance.submit_job(partner_params, [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_BASE64, image: 'base6image' }], {}, options).then((resp) => {
        assert.deepEqual(resp, { success: true });
      });
    });

    it('should call IDApi.new().submit_job if the job type is 5', async () => {
      const mockApiKey = Buffer.from(pair.public).toString('base64');
      const instance = new WebApi('001', null, mockApiKey, 0);
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.ENHANCED_KYC,
      };
      const id_info = {
        first_name: 'John',
        last_name: 'Doe',
        middle_name: '',
        country: 'NG',
        id_type: 'BVN',
        id_number: '00000000000',
        phone_number: '0726789065',
      };
      const timestamp = new Date().toISOString();
      const IDApiResponse = {
        JSONVersion: '1.0.0',
        SmileJobID: '0000001096',
        PartnerParams: {
          user_id: 'dmKaJazQCziLc6Tw9lwcgzLo',
          job_id: 'DeXyJOGtaACFFfbZ2kxjuICE',
          job_type: JOB_TYPE.ENHANCED_KYC,
        },
        ResultType: 'ID Verification',
        ResultText: 'ID Number Validated',
        ResultCode: '1012',
        IsFinalResult: 'true',
        Actions: {
          Verify_ID_Number: 'Verified',
          Return_Personal_Info: 'Returned',
        },
        Country: 'NG',
        IDType: 'BVN',
        IDNumber: '00000000000',
        ExpirationDate: 'NaN-NaN-NaN',
        FullName: 'some  person',
        DOB: 'NaN-NaN-NaN',
        Photo: 'Not Available',
        ...new Signature('001', mockApiKey).generate_signature(timestamp),
      };

      nock('https://testapi.smileidentity.com')
        .post('/v1/id_verification', () => true)
        .reply(200, IDApiResponse);

      const promise = instance.submit_job(partner_params, null, id_info, null);
      await promise.then((resp) => {
        assert.deepEqual(Object.keys(resp).sort(), [
          'JSONVersion', 'SmileJobID', 'PartnerParams', 'ResultType', 'ResultText', 'ResultCode', 'IsFinalResult', 'Actions', 'Country', 'IDType', 'IDNumber', 'ExpirationDate', 'FullName', 'DOB', 'Photo', 'signature', 'timestamp',
        ].sort());
      });
    });

    it('should call IDApi.new().submit_job if the job type is 5 with the signature if requested', async () => {
      const mockApiKey = '1234';
      const instance = new WebApi('001', null, mockApiKey, 0);
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.ENHANCED_KYC,
      };
      const id_info = {
        first_name: 'John',
        last_name: 'Doe',
        middle_name: '',
        country: 'NG',
        id_type: 'BVN',
        id_number: '00000000000',
        phone_number: '0726789065',
      };
      const timestamp = new Date().toISOString();
      const IDApiResponse = {
        JSONVersion: '1.0.0',
        SmileJobID: '0000001096',
        PartnerParams: {
          user_id: 'dmKaJazQCziLc6Tw9lwcgzLo',
          job_id: 'DeXyJOGtaACFFfbZ2kxjuICE',
          job_type: JOB_TYPE.ENHANCED_KYC,
        },
        ResultType: 'ID Verification',
        ResultText: 'ID Number Validated',
        ResultCode: '1012',
        IsFinalResult: 'true',
        Actions: {
          Verify_ID_Number: 'Verified',
          Return_Personal_Info: 'Returned',
        },
        Country: 'NG',
        IDType: 'BVN',
        IDNumber: '00000000000',
        ExpirationDate: 'NaN-NaN-NaN',
        FullName: 'some  person',
        DOB: 'NaN-NaN-NaN',
        Photo: 'Not Available',
        ...new Signature('001', mockApiKey).generate_signature(timestamp),
      };

      nock('https://testapi.smileidentity.com')
        .post('/v1/id_verification', () => true)
        .reply(200, IDApiResponse);

      const promise = instance.submit_job(partner_params, null, id_info, { signature: true });
      await promise.then((resp) => {
        assert.deepEqual(Object.keys(resp).sort(), [
          'JSONVersion', 'SmileJobID', 'PartnerParams', 'ResultType', 'ResultText', 'ResultCode', 'IsFinalResult', 'Actions', 'Country', 'IDType', 'IDNumber', 'ExpirationDate', 'FullName', 'DOB', 'Photo', 'signature', 'timestamp',
        ].sort());
      });
    });

    it('should raise an error when a network call fails', async () => {
      const instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.SMART_SELFIE_AUTHENTICATION,
      };
      const options = {
        signature: true,
      };

      nock('https://testapi.smileidentity.com')
        .post('/v1/upload')
        .replyWithError({
          code: '2204',
          error: 'unauthorized',
        });
      nock('https://some_url.com')
        .put('/') // todo: find a way to unzip and test info.json
        .times(0)
        .reply(200);

      let error;
      let response;
      try {
        response = await instance.submit_job(partner_params, [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_BASE64, image: 'base6image' }], {}, options);
      } catch (err) {
        error = err;
      }
      // todo: figure out how to get nook to act like an error response would in real life
      // err.message in this case should be '2204:unauthorized'
      assert.equal(error.code, 2204);
      assert.equal(error.error, 'unauthorized');
      assert.equal(response, undefined);
      return true
    });

    it('should return a response from job_status if that flag is set to true', async () => {
      const mockApiKey = Buffer.from(pair.public).toString('base64');
      const instance = new WebApi('001', 'https://a_callback.cb', mockApiKey, 0);
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.SMART_SELFIE_AUTHENTICATION,
      };
      const options = {
        return_job_status: true,
      };

      const timestamp = new Date().toISOString();

      const jobStatusResponse = {
        job_success: true,
        job_complete: true,
        result: {
          ResultCode: '0810',
          ResultText: 'Awesome!',
        },
        ...new Signature('001', mockApiKey).generate_signature(timestamp),
      };

      nock('https://testapi.smileidentity.com')
        .post('/v1/upload')
        .reply(200, {
          upload_url: 'https://some_url.com',
        });
      nock('https://some_url.com')
        .put('/') // todo: find a way to unzip and test info.json
        .reply(200);
      nock('https://testapi.smileidentity.com')
        .post('/v1/job_status')
        .reply(200, jobStatusResponse);

      const response = await instance.submit_job(partner_params, [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_BASE64, image: 'base6image' }], {}, options);
      assert.equal(response.signature, jobStatusResponse.signature);
      assert.equal(response.timestamp, jobStatusResponse.timestamp);
    });

    it('should set all the job_status flags correctly', async () => {
      const mockApiKey = Buffer.from(pair.public).toString('base64');
      const instance = new WebApi('001', 'https://a_callback.cb', mockApiKey, 0);
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.SMART_SELFIE_AUTHENTICATION,
      };
      const options = {
        return_job_status: true,
        return_images: true,
        return_history: true,
      };

      const timestamp = new Date().toISOString();

      const jobStatusResponse = {
        job_success: true,
        job_complete: true,
        result: {
          ResultCode: '0810',
          ResultText: 'Awesome!',
        },
        ...new Signature('001', mockApiKey).generate_signature(timestamp),
      };

      nock('https://testapi.smileidentity.com')
        .post('/v1/upload')
        .reply(200, {
          upload_url: 'https://some_url.com',
        });
      nock('https://some_url.com')
        .put('/') // todo: find a way to unzip and test info.json
        .reply(200);
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
        .reply(200, jobStatusResponse);

      await instance.submit_job(partner_params, [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_BASE64, image: 'base6image' }], {}, options).then((resp) => {
        assert.equal(resp.signature, jobStatusResponse.signature);
      });
    });

    it('should poll job_status until job_complete is true', async () => {
      const mockApiKey = Buffer.from(pair.public).toString('base64');
      const instance = new WebApi('001', 'https://a_callback.cb', mockApiKey, 0);
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.SMART_SELFIE_AUTHENTICATION,
      };
      const options = {
        return_job_status: true,
      };

      const timestamp = new Date().toISOString();
      const jobStatusResponse = {
        job_success: false,
        job_complete: false,
        result: {
          ResultCode: '0810',
          ResultText: 'Awesome!',
        },
        ...new Signature('001', mockApiKey).generate_signature(timestamp),
      };

      nock('https://testapi.smileidentity.com').post('/v1/upload').reply(200, {
        upload_url: 'https://some_url.com',
      });
      // todo: find a way to unzip and test info.json
      nock('https://some_url.com').put('/').reply(200);
      nock('https://testapi.smileidentity.com').post('/v1/job_status').reply(200, jobStatusResponse);

      nock('https://testapi.smileidentity.com').post('/v1/job_status').reply(200, {
        ...jobStatusResponse,
        job_complete: true,
      });

      const resp = await instance.submit_job(
        partner_params,
        [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_BASE64, image: 'base6image' }],
        {},
        options,
      );
      assert.equal(resp.signature, jobStatusResponse.signature);
      assert.equal(resp.job_complete, true);
    }).timeout(5000);

    describe('documentVerification - JT6', () => {
      it('should require the provision of ID Card images', async () => {
        const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
        const partner_params = {
          user_id: '1',
          job_id: '1',
          job_type: JOB_TYPE.DOCUMENT_VERIFICATION,
        };

        await instance.submit_job(
          partner_params,
          [
            { image_type_id: IMAGE_TYPE.SELFIE_IMAGE_FILE, image: 'test/fixtures/1pixel.jpeg' },
          ],
          { country: 'NG', id_type: 'NIN' },
          { return_job_status: true, use_enrolled_image: true },
        ).catch((err) => {
          assert.equal(err.message, 'You are attempting to complete a Document Verification job without providing an id card image');
        });
      });

      it('should require the provision of country in id_info', async () => {
        const mockApiKey = Buffer.from(pair.public).toString('base64');
        const instance = new WebApi('001', null, mockApiKey, 0);
        const partner_params = {
          user_id: '1',
          job_id: '1',
          job_type: JOB_TYPE.DOCUMENT_VERIFICATION,
        };

        await instance.submit_job(
          partner_params,
          [
            { image_type_id: IMAGE_TYPE.SELFIE_IMAGE_FILE, image: 'test/fixtures/1pixel.jpeg' },
            { image_type_id: IMAGE_TYPE.ID_CARD_IMAGE_FILE, image: 'test/fixtures/1pixel.jpeg' },
          ],
          { id_type: 'NIN' },
          { return_job_status: true, use_enrolled_image: true },
        ).catch((err) => {
          assert.equal(err.message, 'Please make sure that country is included in the id_info');
        });
      });

      it('should require the provision of id_type in id_info', async () => {
        const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
        const partner_params = {
          user_id: '1',
          job_id: '1',
          job_type: JOB_TYPE.DOCUMENT_VERIFICATION,
        };

        await instance.submit_job(
          partner_params,
          [
            { image_type_id: IMAGE_TYPE.SELFIE_IMAGE_FILE, image: 'test/fixtures/1pixel.jpeg' },
            { image_type_id: IMAGE_TYPE.ID_CARD_IMAGE_FILE, image: 'test/fixtures/1pixel.jpeg' },
          ],
          { country: 'NG' },
          { return_job_status: true, use_enrolled_image: true },
        ).catch((err) => {
          assert.equal(err.message, 'Please make sure that id_type is included in the id_info');
        });
      });

      it('should send the `use_enrolled_image` field when option is provided', async () => {
        const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
        const partner_params = {
          user_id: '1',
          job_id: '1',
          job_type: JOB_TYPE.DOCUMENT_VERIFICATION,
        };

        const options = {};
        const smile_job_id = '0000000111';

        const timestamp = new Date().toISOString();
        const mockApiKey = Buffer.from(pair.public).toString('base64');
        const jobStatusResponse = {
          job_success: true,
          job_complete: false,
          result: {
            ResultCode: '0810',
            ResultText: 'Awesome!',
          },
          ...new Signature('001', mockApiKey).generate_signature(timestamp),
        };
        nock('https://testapi.smileidentity.com')
          .post('/v1/job_status')
          .reply(200, jobStatusResponse);
        nock('https://testapi.smileidentity.com')
          .post('/v1/job_status')
          .reply(200, { ...jobStatusResponse, job_complete: true });

        nock('https://testapi.smileidentity.com')
          .post('/v1/upload', (body) => {
            assert.equal(body.use_enrolled_image, true);
            return true;
          })
          .reply(200, {
            upload_url: 'https://some_url.com',
            smile_job_id,
          });
        nock('https://some_url.com')
          .put('/') // todo: find a way to unzip and test info.json
          .reply(200);

        const resp = await instance.submit_job(
          partner_params,
          [
            { image_type_id: IMAGE_TYPE.SELFIE_IMAGE_FILE, image: 'test/fixtures/1pixel.jpeg' },
            { image_type_id: IMAGE_TYPE.ID_CARD_IMAGE_FILE, image: 'test/fixtures/1pixel.jpeg' },
          ],
          { country: 'NG', id_type: 'NIN' },
          { return_job_status: true, use_enrolled_image: true },
        )

        assert.deepEqual(resp, {...jobStatusResponse, job_complete: true});
      }).timeout(3000);

      it('should not require a selfie image when `use_enrolled_image` option is selected', async () => {
        const mockApiKey = Buffer.from(pair.public).toString('base64');
        const instance = new WebApi('001', null, mockApiKey, 0);
        const partner_params = {
          user_id: '1',
          job_id: '1',
          job_type: JOB_TYPE.DOCUMENT_VERIFICATION,
        };
        const timestamp = new Date().toISOString();
        const jobStatusResponse = {
          job_success: true,
          job_complete: false,
          result: {
            ResultCode: '0810',
            ResultText: 'Awesome!',
          },
          ...new Signature('001', mockApiKey).generate_signature(timestamp),
        };
        nock('https://testapi.smileidentity.com')
          .post('/v1/job_status')
          .reply(200, jobStatusResponse);
        nock('https://testapi.smileidentity.com')
          .post('/v1/job_status')
          .reply(200, { ...jobStatusResponse, job_complete: true });

        nock('https://testapi.smileidentity.com')
          .post('/v1/upload', (body) => {
            assert.equal(body.use_enrolled_image, true);
            return true;
          })
          .reply(200, {
            upload_url: 'https://some_url.com',
          });
        nock('https://some_url.com')
          .put('/') // todo: find a way to unzip and test info.json
          .reply(200);

        const response = await instance.submit_job(
          partner_params,
          [
            { image_type_id: IMAGE_TYPE.ID_CARD_IMAGE_FILE, image: 'test/fixtures/1pixel.jpeg' },
          ],
          { country: 'NG', id_type: 'NIN' },
          { return_job_status: true, use_enrolled_image: true },
        )
        assert.deepEqual(response, { ...jobStatusResponse, job_complete: true });
      }).timeout(3000);
    });
  });

  describe('#get_job_status', () => {
    it('should call Utilities.new().get_job_status', async () => {
      const timestamp = new Date().toISOString();
      const mockApiKey = Buffer.from(pair.public).toString('base64');
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.SMART_SELFIE_AUTHENTICATION,
      };
      const options = {
        return_images: true,
        return_history: true,
      };
      const jobStatusResponse = {
        job_success: true,
        job_complete: true,
        result: {
          ResultCode: '0810',
          ResultText: 'Awesome!',
        },
        ...new Signature('001', mockApiKey).generate_signature(timestamp),
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
        .reply(200, jobStatusResponse);
      const instance = new WebApi('001', 'https://a_callback.cb', mockApiKey, 0);
      const promise = instance.get_job_status(partner_params, options);
      await promise.then((resp) => {
        assert.equal(resp.signature, jobStatusResponse.signature);
        assert.equal(resp.job_complete, true);
      });
    });
  });

  describe('#get_web_token', () => {
    it('should call web-token.getWebToken', async () => {
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
        .reply(200, tokenResponse);

      const instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
      const promise = instance.get_web_token(requestParams);
      await promise.then((resp) => {
        assert.equal(resp.token, '42');
      });
    });
  });
});
