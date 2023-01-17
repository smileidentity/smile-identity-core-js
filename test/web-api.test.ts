import path from 'path';
import keypair from 'keypair';
import nock from 'nock';
import packageJson from '../package.json';
import businessVerificationResp from './fixtures/business_verification_response.json';

import {
  WebApi, Signature, IMAGE_TYPE, JOB_TYPE,
} from '..';

const pair = keypair();
const fixturePath = path.join(__dirname, 'fixtures', '1pixel.jpg');
const mockApiKey = Buffer.from(pair.public).toString('base64');

describe('WebApi', () => {
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

  describe('#new', () => {
    it('should instantiate and set the global variables', () => {
      expect.assertions(4);
      const instance = new WebApi('001', 'https://a_callback.com', mockApiKey, 0);
      expect(instance.partner_id).toEqual('001');
      expect(instance.api_key).toEqual(mockApiKey);
      expect(instance.default_callback).toEqual('https://a_callback.com');
      expect(instance.url).toEqual('testapi.smileidentity.com/v1');
    });
  });

  describe('#submit_job', () => {
    it('should ensure that a method of getting data back has been selected', async () => {
      expect.assertions(1);
      const instance = new WebApi('001', '', mockApiKey, 0);
      const partner_params = { user_id: '1', job_id: '1', job_type: JOB_TYPE.BIOMETRIC_KYC };
      const promise = instance.submit_job(
        partner_params,
        [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_FILE, image: fixturePath }],
        {},
        {},
      );
      await expect(promise).rejects.toThrow(new Error('Please choose to either get your response via the callback or job status query'));
    });

    it('should ensure that the partner_params are present', async () => {
      expect.assertions(1);
      const instance = new WebApi('001', null, mockApiKey, 0);
      const promise = instance.submit_job(null, {}, {}, { return_job_status: true });
      await expect(promise).rejects.toThrow(new Error('Please ensure that you send through partner params'));
    });

    it('should ensure that the partner_params are an object', async () => {
      expect.assertions(1);
      const instance = new WebApi('001', null, mockApiKey, 0);
      const promise = instance.submit_job('not partner params', {}, {}, { return_job_status: true });
      await expect(promise).rejects.toThrow(new Error('Partner params needs to be an object'));
    });

    ['user_id', 'job_id', 'job_type'].forEach((key) => {
      const partner_params = { user_id: '1', job_id: '1', job_type: JOB_TYPE.BIOMETRIC_KYC };
      delete partner_params[key];

      it(`should ensure that the partner_params contain ${key}`, async () => {
        expect.assertions(1);
        const instance = new WebApi('001', null, mockApiKey, 0);
        const promise = instance.submit_job(partner_params, {}, {}, { return_job_status: true });
        await expect(promise).rejects.toThrow(new Error(`Please make sure that ${key} is included in the partner params`));
      });

      it(`should ensure that in partner_params, ${key} is not an empty string`, async () => {
        expect.assertions(1);
        const instance = new WebApi('001', null, mockApiKey, 0);
        const promise = instance.submit_job(partner_params, {}, {}, { return_job_status: true });
        await expect(promise).rejects.toThrow(new Error(`Please make sure that ${key} is included in the partner params`));
      });
    });

    it('should ensure that images exist', async () => {
      expect.assertions(1);
      const instance = new WebApi('001', null, mockApiKey, 0);
      const partner_params = { user_id: '1', job_id: '1', job_type: JOB_TYPE.BIOMETRIC_KYC };
      const promise = instance.submit_job(partner_params, null, {}, { return_job_status: true });

      await expect(promise).rejects.toThrow(new Error('Please ensure that you send through image details'));
    });

    it('should ensure that images is an array', async () => {
      expect.assertions(1);
      const instance = new WebApi('001', null, mockApiKey, 0);
      const partner_params = { user_id: '1', job_id: '1', job_type: JOB_TYPE.BIOMETRIC_KYC };
      const promise = instance.submit_job(partner_params, {}, {}, { return_job_status: true });
      await expect(promise).rejects.toThrow(new Error('Image details needs to be an array'));
    });

    it('should ensure that images is an array and that it is not empty', async () => {
      expect.assertions(1);
      const instance = new WebApi('001', null, mockApiKey, 0);
      const partner_params = { user_id: '1', job_id: '1', job_type: JOB_TYPE.BIOMETRIC_KYC };
      const promise = instance.submit_job(partner_params, [], {}, { return_job_status: true });
      await expect(promise).rejects.toThrow(new Error('You need to send through at least one selfie image'));
    });

    it('should ensure that images is an array and that it has a selfie', async () => {
      expect.assertions(1);
      const instance = new WebApi('001', null, mockApiKey, 0);
      const partner_params = { user_id: '1', job_id: '1', job_type: JOB_TYPE.BIOMETRIC_KYC };
      const promise = instance.submit_job(partner_params, [{ image_type_id: IMAGE_TYPE.ID_CARD_IMAGE_FILE, image: 'path/to/image' }], {}, { return_job_status: true });
      await expect(promise).rejects.toThrow(new Error('You need to send through at least one selfie image'));
    });

    ['country', 'id_type', 'id_number'].forEach((key) => {
      const id_info = {
        country: 'NG',
        id_type: 'BVN',
        id_number: '12345',
        entered: 'true',
      };
      delete id_info[key];
      it(`should ensure that id_info contains ${key}`, async () => {
        expect.assertions(1);
        const instance = new WebApi('001', null, mockApiKey, 0);
        const partner_params = { user_id: '1', job_id: '1', job_type: JOB_TYPE.BIOMETRIC_KYC };
        const promise = instance.submit_job(
          partner_params,
          [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_FILE, image: fixturePath }],
          id_info,
          { return_job_status: true },
        );
        await expect(promise).rejects.toThrow(new Error(`Please make sure that ${key} is included in the id_info`));
      });
    });

    it('should ensure that job type 1 has an id card image if there is no id_info', async () => {
      expect.assertions(1);
      const instance = new WebApi('001', null, mockApiKey, 0);
      const partner_params = { user_id: '1', job_id: '1', job_type: JOB_TYPE.BIOMETRIC_KYC };
      const promise = instance.submit_job(
        partner_params,
        [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_FILE, image: fixturePath }],
        {},
        { return_job_status: true },
      );
      await expect(promise).rejects.toThrow(new Error('You are attempting to complete a job type 1 without providing an id card image or id info'));
    });

    ['return_job_status', 'return_images', 'return_history'].forEach((flag) => {
      const options = {};
      options[flag] = 'not a boolean';
      it(`should ensure that optional field ${flag} is boolean`, async () => {
        expect.assertions(1);
        const instance = new WebApi('001', null, mockApiKey, 0);
        const partner_params = { user_id: '1', job_id: '1', job_type: JOB_TYPE.SMART_SELFIE_AUTHENTICATION };
        const promise = instance.submit_job(
          partner_params,
          [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_FILE, image: fixturePath }],
          {},
          options,
        );
        await expect(promise).rejects.toThrow(new Error(`${flag} needs to be a boolean`));
      });
    });

    it('should be able to send a job', async () => {
      expect.assertions(2);
      const instance = new WebApi('001', 'https://a_callback.cb', mockApiKey, 0);
      const partner_params = {
        job_id: '1',
        job_type: JOB_TYPE.SMART_SELFIE_AUTHENTICATION,
        user_id: '1',
      };
      const options = {};
      const smileJobId = '0000000111';
      const postBody = jest.fn(() => true);
      nock('https://testapi.smileidentity.com').post('/v1/upload', postBody).reply(200, {
        upload_url: 'https://some_url.com',
        smile_job_id: smileJobId,
      });
      // todo: find a way to unzip and test info.json
      nock('https://some_url.com').put('/').reply(200);

      const response = await instance.submit_job(partner_params, [{
        image_type_id: IMAGE_TYPE.SELFIE_IMAGE_BASE64,
        image: 'base6image',
      }], {}, options);
      expect(response).toEqual({ success: true, smile_job_id: smileJobId });
      expect(postBody).toHaveBeenNthCalledWith(1, expect.objectContaining({
        smile_client_id: '001',
        signature: expect.any(String),
        timestamp: expect.any(String),
        file_name: 'selfie.zip',
        partner_params: {
          user_id: '1',
          job_id: '1',
          job_type: 2,
        },
        callback_url: 'https://a_callback.cb',
        source_sdk: 'javascript',
        source_sdk_version: packageJson.version,
      }));
    });

    it('should be able to send a job with a signature', async () => {
      expect.assertions(2);
      const instance = new WebApi('001', 'https://a_callback.cb', '1234', 0);
      const partner_params = {
        job_id: '1',
        job_type: JOB_TYPE.SMART_SELFIE_AUTHENTICATION,
        user_id: '1',
      };
      const options = {
        signature: true,
      };
      const smileJobId = '0000000111';
      const postBody = jest.fn(() => true);
      nock('https://testapi.smileidentity.com').post('/v1/upload', postBody).reply(200, {
        upload_url: 'https://some_url.com',
        smile_job_id: smileJobId,
      }).isDone();
      // todo: find a way to unzip and test info.json
      nock('https://some_url.com').put('/').reply(200).isDone();

      const response = await instance.submit_job(partner_params, [{
        image_type_id: IMAGE_TYPE.SELFIE_IMAGE_BASE64,
        image: 'base6image',
      }], {}, options);
      expect(response).toEqual({ success: true, smile_job_id: smileJobId });
      expect(postBody).toHaveBeenNthCalledWith(1, expect.objectContaining({
        smile_client_id: '001',
        signature: expect.any(String),
        timestamp: expect.any(String),
        file_name: 'selfie.zip',
        partner_params: {
          job_id: '1',
          job_type: 2,
          user_id: '1',
        },
        callback_url: 'https://a_callback.cb',
        source_sdk: 'javascript',
        source_sdk_version: packageJson.version,
      }));
    });

    it('should call IDApi.new().submit_job if the job type is 5', async () => {
      expect.assertions(2);
      const instance = new WebApi('001', null, mockApiKey, 0);
      const partner_params = { user_id: '1', job_id: '1', job_type: JOB_TYPE.ENHANCED_KYC };
      const consent_information = {
        consented: {
          contact_information: true,
          document_information: false,
          personal_details: false,
        },
      };
      const id_info = {
        consent_information,
        country: 'NG',
        entered: true,
        first_name: 'John',
        id_number: '00000000000',
        id_type: 'BVN',
        last_name: 'Doe',
        middle_name: '',
        phone_number: '0726789065',
      };
      const timestamp = new Date().toISOString();
      const iDApiResponse = {
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
      const postBody = jest.fn(() => true);
      nock('https://testapi.smileidentity.com').post('/v1/id_verification', postBody).reply(200, iDApiResponse).isDone();

      const response = await instance.submit_job(partner_params, null, id_info, null);
      expect(Object.keys(response).sort()).toEqual([
        'JSONVersion', 'SmileJobID', 'PartnerParams', 'ResultType',
        'ResultText', 'ResultCode', 'IsFinalResult', 'Actions',
        'Country', 'IDType', 'IDNumber', 'ExpirationDate',
        'FullName', 'DOB', 'Photo', 'signature', 'timestamp',
      ].sort());

      expect(postBody).toHaveBeenNthCalledWith(1, expect.objectContaining({
        ...id_info,
        language: 'javascript',
        partner_params: { job_id: '1', job_type: 5, user_id: '1' },
        signature: expect.any(String),
        source_sdk_version: packageJson.version,
        source_sdk: 'javascript',
        timestamp: expect.any(String),
      }));
    });

    it('should call IDApi.new().submit_job if the job type is 5 with the signature if requested', async () => {
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

      nock('https://testapi.smileidentity.com').post('/v1/id_verification', () => true).reply(200, IDApiResponse).isDone();

      const response = await instance.submit_job(partner_params, null, id_info);
      expect(Object.keys(response).sort()).toEqual([
        'JSONVersion', 'SmileJobID', 'PartnerParams', 'ResultType',
        'ResultText', 'ResultCode', 'IsFinalResult', 'Actions',
        'Country', 'IDType', 'IDNumber', 'ExpirationDate',
        'FullName', 'DOB', 'Photo', 'signature', 'timestamp',
      ].sort());
    });

    it('should raise an error when a network call fails', async () => {
      expect.assertions(4);
      const instance = new WebApi('001', 'https://a_callback.cb', mockApiKey, 0);
      const partner_params = { user_id: '1', job_id: '1', job_type: JOB_TYPE.SMART_SELFIE_AUTHENTICATION };

      nock('https://testapi.smileidentity.com').post('/v1/upload').replyWithError({
        code: '2204',
        error: 'unauthorized',
      }).isDone();

      // todo: find a way to unzip and test info.json
      nock('https://some_url.com').put('/').reply(200).isDone();

      const promise = instance.submit_job(partner_params, [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_BASE64, image: 'base6image' }], {});

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
      expect(error.message).toBeUndefined();
      expect(error.code).toBe('2204');
      expect(error.error).toBe('unauthorized');
    });

    it('should return a response from job_status if that flag is set to true', async () => {
      expect.assertions(1);
      const instance = new WebApi('001', 'https://a_callback.cb', mockApiKey, 0);
      const partner_params = { user_id: '1', job_id: '1', job_type: JOB_TYPE.SMART_SELFIE_AUTHENTICATION };
      const options = { return_job_status: true };

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

      nock('https://testapi.smileidentity.com').post('/v1/upload').reply(200, {
        upload_url: 'https://some_url.com',
      }).isDone();
      // todo: find a way to unzip and test info.json
      nock('https://some_url.com').put('/').reply(200).isDone();
      nock('https://testapi.smileidentity.com').post('/v1/job_status').reply(200, jobStatusResponse).isDone();

      const response = await instance.submit_job(partner_params, [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_BASE64, image: 'base6image' }], {}, options);
      expect(response.signature).toBe(jobStatusResponse.signature);
    });

    it('should set all the job_status flags correctly', async () => {
      expect.assertions(7);
      const instance = new WebApi('001', 'https://a_callback.cb', mockApiKey, 0);
      const partner_params = { user_id: '1', job_id: '1', job_type: JOB_TYPE.SMART_SELFIE_AUTHENTICATION };
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

      nock('https://testapi.smileidentity.com').post('/v1/upload').reply(200, {
        upload_url: 'https://some_url.com',
      }).isDone();
      // todo: find a way to unzip and test info.json
      nock('https://some_url.com').put('/').reply(200).isDone();
      nock('https://testapi.smileidentity.com').post('/v1/job_status', (body) => {
        expect(body.job_id).toBe(partner_params.job_id);
        expect(body.user_id).toBe(partner_params.user_id);
        expect(body.timestamp).not.toBe(undefined);
        expect(body.signature).not.toBe(undefined);
        expect(body.image_links).toBe(true);
        expect(body.history).toBe(true);
        return true;
      }).reply(200, jobStatusResponse).isDone();

      const response = await instance.submit_job(partner_params, [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_BASE64, image: 'base6image' }], {}, options);
      expect(response.signature).toBe(jobStatusResponse.signature);
    });

    it('should poll job_status until job_complete is true', async () => {
      expect.assertions(2);
      const instance = new WebApi('001', 'https://a_callback.cb', mockApiKey, 0);
      const partner_params = { user_id: '1', job_id: '1', job_type: JOB_TYPE.SMART_SELFIE_AUTHENTICATION };
      const options = { return_job_status: true };

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
      }).isDone();
      // todo: find a way to unzip and test info.json
      nock('https://some_url.com').put('/').reply(200).isDone();
      nock('https://testapi.smileidentity.com').post('/v1/job_status').reply(200, jobStatusResponse).isDone();
      jobStatusResponse.job_complete = true;
      nock('https://testapi.smileidentity.com').post('/v1/job_status').reply(200, jobStatusResponse).isDone();

      const response = await instance.submit_job(partner_params, [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_BASE64, image: 'base6image' }], {}, options);

      expect(response.signature).toBe(jobStatusResponse.signature);
      expect(response.job_complete).toBe(true);
    });

    describe('documentVerification - JT6', () => {
      it('should require the provision of ID Card images', async () => {
        expect.assertions(1);
        const instance = new WebApi('001', null, mockApiKey, 0);
        const partner_params = { user_id: '1', job_id: '1', job_type: JOB_TYPE.DOCUMENT_VERIFICATION };

        const promise = instance.submit_job(
          partner_params,
          [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_FILE, image: fixturePath }],
          { country: 'NG', id_type: 'NIN' },
          { return_job_status: true, use_enrolled_image: true },
        );
        await expect(promise).rejects.toThrow(new Error('You are attempting to complete a Document Verification job without providing an id card image'));
      });

      it('should require the provision of country in id_info', async () => {
        expect.assertions(1);
        const instance = new WebApi('001', null, mockApiKey, 0);
        const partner_params = { user_id: '1', job_id: '1', job_type: JOB_TYPE.DOCUMENT_VERIFICATION };

        const promise = instance.submit_job(
          partner_params,
          [
            { image_type_id: IMAGE_TYPE.SELFIE_IMAGE_FILE, image: fixturePath },
            { image_type_id: IMAGE_TYPE.ID_CARD_IMAGE_FILE, image: fixturePath },
          ],
          { id_type: 'NIN' },
          { return_job_status: true, use_enrolled_image: true },
        );
        await expect(promise).rejects.toThrow(new Error('Please make sure that country is included in the id_info'));
      });

      it('should require the provision of id_type in id_info', async () => {
        expect.assertions(1);
        const instance = new WebApi('001', null, mockApiKey, 0);
        const partner_params = { user_id: '1', job_id: '1', job_type: JOB_TYPE.DOCUMENT_VERIFICATION };

        const promise = instance.submit_job(
          partner_params,
          [
            { image_type_id: IMAGE_TYPE.SELFIE_IMAGE_FILE, image: fixturePath },
            { image_type_id: IMAGE_TYPE.ID_CARD_IMAGE_FILE, image: fixturePath },
          ],
          { country: 'NG' },
          { return_job_status: true, use_enrolled_image: true },
        );
        await expect(promise).rejects.toThrow(new Error('Please make sure that id_type is included in the id_info'));
      });

      it('should send the `use_enrolled_image` field to the callback_url when option is provided', async () => {
        expect.assertions(9);
        const instance = new WebApi('001', 'https://fake-callback-url.com', mockApiKey, 0);
        const partner_params = { user_id: '1', job_id: '1', job_type: JOB_TYPE.DOCUMENT_VERIFICATION };
        const smile_job_id = '0000000111';
        const postScope = nock('https://testapi.smileidentity.com').post('/v1/upload', (body) => {
          expect(body.use_enrolled_image).toBe(true);
          expect(body.smile_client_id).toBe('001');
          expect(body.partner_params).toStrictEqual(partner_params);
          expect(body.file_name).toBe('selfie.zip');
          expect(typeof body.signature).toBe('string');
          expect(typeof body.timestamp).toBe('string');
          return true;
        }).reply(200, { upload_url: 'https://some_url.com', smile_job_id });

        // todo: find a way to unzip and test info.json
        const putScope = nock('https://some_url.com').put('/').once().reply(200);

        const response = await instance.submit_job(
          partner_params,
          [
            { image_type_id: IMAGE_TYPE.SELFIE_IMAGE_FILE, image: fixturePath },
            { image_type_id: IMAGE_TYPE.ID_CARD_IMAGE_FILE, image: fixturePath },
          ],
          { country: 'NG', id_type: 'NIN' },
          { return_job_status: false, use_enrolled_image: true },
        );
        expect(response).toEqual({ success: true, smile_job_id });
        expect(postScope.isDone()).toBe(true);
        expect(putScope.isDone()).toBe(true);
      });

      it('should send the `use_enrolled_image` field when option is provided', async () => {
        expect.assertions(7);
        const { signature, timestamp } = new Signature('001', mockApiKey).generate_signature();
        const instance = new WebApi('001', '', mockApiKey, 0);
        const partner_params = { user_id: '1', job_id: '1', job_type: JOB_TYPE.DOCUMENT_VERIFICATION };
        const jobStatusResponse = {
          job_success: true,
          job_complete: true,
          result: {
            ResultCode: '0810',
            ResultText: 'Awesome!',
          },
          ...new Signature('001', mockApiKey).generate_signature(timestamp),
        };

        nock('https://testapi.smileidentity.com').post('/v1/upload', (body) => {
          expect(body.use_enrolled_image).toBe(true);
          expect(body.smile_client_id).toBe('001');
          expect(body.partner_params).toStrictEqual(partner_params);
          expect(body.file_name).toBe('selfie.zip');
          expect(typeof body.signature).toBe('string');
          expect(typeof body.timestamp).toBe('string');
          return true;
        }).reply(200, { upload_url: 'https://some_url.com' });

        // todo: find a way to unzip and test info.json
        nock('https://some_url.com')
          .put('/') // todo: find a way to unzip and test info.json
          .reply(200);
        nock('https://testapi.smileidentity.com')
          .post('/v1/job_status')
          .reply(200, jobStatusResponse);

        const response = await instance.submit_job(
          partner_params,
          [
            { image_type_id: IMAGE_TYPE.SELFIE_IMAGE_FILE, image: fixturePath },
            { image_type_id: IMAGE_TYPE.ID_CARD_IMAGE_FILE, image: fixturePath },
          ],
          { country: 'NG', id_type: 'NIN' },
          { return_job_status: true, use_enrolled_image: true, signature },
        );
        expect(response).toEqual(jobStatusResponse);
        // expect(postScope.isDone()).toBe(true);
        // expect(putScope.isDone()).toBe(true);
      });

      it('should not require a selfie image when `use_enrolled_image` option is selected', async () => {
        expect.assertions(1);
        const instance = new WebApi('001', 'default', mockApiKey, 0);
        const partner_params = { user_id: '1', job_id: '1', job_type: JOB_TYPE.DOCUMENT_VERIFICATION };

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
          .post('/v1/job_status')
          .reply(200, jobStatusResponse);
        nock('https://testapi.smileidentity.com')
          .post('/v1/job_status')
          .reply(200, { ...jobStatusResponse, job_complete: true });

        nock('https://testapi.smileidentity.com').post('/v1/upload').reply(200, {
          upload_url: 'https://some_url.com',
        });
        // todo: find a way to unzip and test info.json
        nock('https://some_url.com').put('/').reply(200);
        nock('https://testapi.smileidentity.com').post('/v1/job_status').reply(200, jobStatusResponse);
        const response = await instance.submit_job(
          partner_params,
          [{ image_type_id: IMAGE_TYPE.ID_CARD_IMAGE_FILE, image: fixturePath }],
          { country: 'NG', id_type: 'NIN' },
          { return_job_status: true, use_enrolled_image: true },
        );

        expect(response).toEqual(jobStatusResponse);
      });
    });
  });

  describe('business_verification', () => {
    it('successfully sends a business verification job', async () => {
      const instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.BUSINESS_VERIFICATION,
      };
      const id_info = {
        country: 'NG',
        id_type: 'BUSINESS_REGISTRATION',
        id_number: 'A000000',
        business_type: 'co',
      };

      nock('https://testapi.smileidentity.com')
        .post('/v1/business_verification', (body) => {
          expect(body.partner_id).toEqual('001');
          expect(body.country).toEqual(id_info.country);
          expect(body.id_type).toEqual(id_info.id_type);
          expect(body.id_number).toEqual(id_info.id_number);
          expect(body.business_type).toEqual(id_info.business_type);
          expect(body.partner_params.job_type).toEqual(JOB_TYPE.BUSINESS_VERIFICATION);
          return true;
        })
        .reply(200, businessVerificationResp.success)
        .isDone();

      const resp = await instance.submit_job(partner_params, null, id_info, { signature: true });
      expect(resp.data).toEqual(businessVerificationResp.success);
    });

    it('report an error on unsuccessfull business verification', async () => {
      const instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.BUSINESS_VERIFICATION,
      };
      const id_info = {
        country: 'NG',
        id_type: 'BUSINESS_REGISTRATION',
        id_number: 'A000000',
        business_type: '',
      };

      nock('https://testapi.smileidentity.com')
        .post('/v1/business_verification', (body) => {
          expect(body.partner_id).toEqual('001');
          expect(body.country).toEqual(id_info.country);
          expect(body.id_type).toEqual(id_info.id_type);
          expect(body.id_number).toEqual(id_info.id_number);
          expect(body.business_type).toEqual(id_info.business_type);
          expect(body.partner_params.job_type).toEqual(JOB_TYPE.BUSINESS_VERIFICATION);
          return true;
        })
        .reply(400, businessVerificationResp.unsupported_business_type)
        .isDone();

      const promise = instance.submit_job(partner_params, null, id_info, { signature: true });
      await expect(promise).rejects.toThrow(new Error('Request failed with status code 400'));
    });
  });

  describe('#get_job_status', () => {
    it('should call Utilities.new().get_job_status', async () => {
      expect.assertions(8);
      const instance = new WebApi('001', 'https://a_callback.cb', mockApiKey, 0);

      const partner_params = { user_id: '1', job_id: '1', job_type: JOB_TYPE.SMART_SELFIE_AUTHENTICATION };
      const options = { return_images: true, return_history: true };
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
      nock('https://testapi.smileidentity.com').post('/v1/job_status', (body) => {
        expect(body.job_id).toEqual(partner_params.job_id);
        expect(body.user_id).toEqual(partner_params.user_id);
        expect(body.timestamp).not.toBeUndefined();
        expect(body.signature).not.toBeUndefined();
        expect(body.image_links).toBe(true);
        expect(body.history).toBe(true);
        return true;
      }).reply(200, jobStatusResponse).isDone();
      const response = await instance.get_job_status(partner_params, options);

      expect(response.signature).toEqual(jobStatusResponse.signature);
      expect(response.job_complete).toEqual(true);
    });
  });

  describe('#get_web_token', () => {
    it('should ensure it is called with params', async () => {
      expect.assertions(1);
      const instance = new WebApi('001', 'https://a_callback.cb', mockApiKey, 0);
      await expect(instance.get_web_token()).rejects.toThrow(new Error('Please ensure that you send through request params'));
    });

    it('should ensure the params are in an object', async () => {
      expect.assertions(1);
      const instance = new WebApi('001', 'https://a_callback.cb', mockApiKey, 0);
      await expect(instance.get_web_token('requestParams')).rejects.toThrow(new Error('Request params needs to be an object'));
    });

    ['user_id', 'job_id', 'product'].forEach((param) => {
      const requestParams = { user_id: '1', job_id: '1', product: 'biometric_kyc' };
      it(`should ensure the ${param} is provided`, async () => {
        expect.assertions(1);
        const instance = new WebApi('001', 'https://a_callback.cb', mockApiKey, 0);
        delete requestParams[param];
        await expect(instance.get_web_token(requestParams)).rejects.toThrow(new Error(`${param} is required to get a web token`));
      });
    });

    it('should return a token when all required params are set', async () => {
      expect.assertions(4);
      const instance = new WebApi('001', 'https://a_callback.cb', mockApiKey, 0);
      const requestParams = { user_id: '1', job_id: '1', product: 'biometric_kyc' };
      const tokenResponse = { token: '42' };

      nock('https://testapi.smileidentity.com').post('/v1/token', (body) => {
        expect(body.job_id).toEqual(requestParams.job_id);
        expect(body.user_id).toEqual(requestParams.user_id);
        expect(body.product).toEqual(requestParams.product);
        return true;
      }).reply(200, tokenResponse).isDone();
      nock('https://some_url.com').put('/').reply(200).isDone();
      const response = await instance.get_web_token(requestParams);
      expect(response.token).toEqual(tokenResponse.token);
    });

    describe('handle callback url', () => {
      it('should ensure that a callback URL exists', async () => {
        expect.assertions(1);
        const instance = new WebApi('001', null, mockApiKey, 0);
        await expect(instance.get_web_token({})).rejects.toThrow(new Error('Callback URL is required for this method'));
      });

      it('should work with a callback_url param', async () => {
        expect.assertions(5);
        const instance = new WebApi('001', null, mockApiKey, 0);
        const requestParams = {
          user_id: '1',
          job_id: '1',
          product: 'ekyc_smartselfie',
          callback_url: 'https://a.callback.url/',
        };

        const tokenResponse = { token: '42' };

        nock('https://testapi.smileidentity.com').post('/v1/token', (body) => {
          expect(body.job_id).toEqual(requestParams.job_id);
          expect(body.user_id).toEqual(requestParams.user_id);
          expect(body.product).toEqual(requestParams.product);
          expect(body.callback_url).toEqual(requestParams.callback_url);
          return true;
        }).reply(200, tokenResponse).isDone();

        const response = await instance.get_web_token(requestParams);
        expect(response.token).toEqual(tokenResponse.token);
      });

      it('should fallback to the default callback URL', async () => {
        expect.assertions(5);
        const defaultCallbackUrl = 'https://smileidentity.com/callback';
        const instance = new WebApi('001', defaultCallbackUrl, mockApiKey, 0);
        const requestParams = { user_id: '1', job_id: '1', product: 'ekyc_smartselfie' };

        const tokenResponse = { token: 42 };

        nock('https://testapi.smileidentity.com').post('/v1/token', (body) => {
          expect(body.job_id).toEqual(requestParams.job_id);
          expect(body.user_id).toEqual(requestParams.user_id);
          expect(body.product).toEqual(requestParams.product);
          expect(body.callback_url).toEqual(defaultCallbackUrl);
          return true;
        }).reply(200, tokenResponse).isDone();

        const response = await instance.get_web_token(requestParams);
        expect(response.token).toEqual(tokenResponse.token);
      });
    });
  });
});
