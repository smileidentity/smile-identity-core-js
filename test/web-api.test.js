const path = require('path');
const crypto = require('crypto');
const keypair = require('keypair');
const nock = require('nock');

const { WebApi, Signature } = require('..');

const pair = keypair();

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
      const instance = new WebApi('001', 'https://a_callback.com', Buffer.from(pair.public).toString('base64'), 0);
      expect(instance.partner_id).toEqual('001');
      expect(instance.api_key).toEqual(Buffer.from(pair.public).toString('base64'));
      expect(instance.default_callback).toEqual('https://a_callback.com');
      expect(instance.url).toEqual('testapi.smileidentity.com/v1');
    });
  });

  describe('#submit_job', () => {
    it('should ensure that a method of getting data back has been selected', async () => {
      expect.assertions(1);
      const instance = new WebApi('001', '', Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = { user_id: '1', job_id: '1', job_type: 1 };
      const promise = instance.submit_job(partner_params, [{ image_type_id: 0, image: 'path/to/image.jpg' }], {}, {});
      await expect(promise).rejects.toThrow(new Error('Please choose to either get your response via the callback or job status query'));
    });

    it('should ensure that the partner_params are present', async () => {
      expect.assertions(1);
      const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      const promise = instance.submit_job(null, {}, {}, { return_job_status: true });
      await expect(promise).rejects.toThrow(new Error('Please ensure that you send through partner params'));
    });

    it('should ensure that the partner_params are an object', async () => {
      expect.assertions(1);
      const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      const promise = instance.submit_job('not partner params', {}, {}, { return_job_status: true });
      await expect(promise).rejects.toThrow(new Error('Partner params needs to be an object'));
    });

    ['user_id', 'job_id', 'job_type'].forEach((key) => {
      const partner_params = { user_id: '1', job_id: '1', job_type: 1 };
      delete partner_params[key];
      it('should ensure that the partner_params contain user_id, job_id and job_type', async () => {
        expect.assertions(1);
        const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
        const promise = instance.submit_job(partner_params, {}, {}, { return_job_status: true });
        await expect(promise).rejects.toThrow(new Error(`Please make sure that ${key} is included in the partner params`));
      });

      it('should ensure that in partner_params, user_id, job_id, and job_type are not emptystrings', async () => {
        expect.assertions(1);
        const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
        const promise = instance.submit_job(partner_params, {}, {}, { return_job_status: true });
        await expect(promise).rejects.toThrow(new Error(`Please make sure that ${key} is included in the partner params`));
      });
    });

    it('should ensure that images exist', async () => {
      expect.assertions(1);
      const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = { user_id: '1', job_id: '1', job_type: 1 };
      const promise = instance.submit_job(partner_params, null, {}, { return_job_status: true });

      await expect(promise).rejects.toThrow(new Error('Please ensure that you send through image details'));
    });

    it('should ensure that images is an array', async () => {
      expect.assertions(1);
      const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = { user_id: '1', job_id: '1', job_type: 1 };
      const promise = instance.submit_job(partner_params, {}, {}, { return_job_status: true });
      await expect(promise).rejects.toThrow(new Error('Image details needs to be an array'));
    });

    it('should ensure that images is an array and that it is not empty', async () => {
      expect.assertions(1);
      const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = { user_id: '1', job_id: '1', job_type: 1 };
      const promise = instance.submit_job(partner_params, [], {}, { return_job_status: true });
      await expect(promise).rejects.toThrow(new Error('You need to send through at least one selfie image'));
    });

    it('should ensure that images is an array and that it has a selfie', async () => {
      expect.assertions(1);
      const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = { user_id: '1', job_id: '1', job_type: 1 };
      const promise = instance.submit_job(partner_params, [{ image_type_id: 1, image: 'path/to/image' }], {}, { return_job_status: true });
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
      it('should ensure that id_info is correctly filled out', async () => {
        expect.assertions(1);
        const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
        const partner_params = { user_id: '1', job_id: '1', job_type: 1 };
        const promise = instance.submit_job(partner_params, [{ image_type_id: 0, image: 'path/to/image.jpg' }], id_info, { return_job_status: true });
        await expect(promise).rejects.toThrow(new Error(`Please make sure that ${key} is included in the id_info`));
      });
    });

    it('should ensure that job type 1 has an id card image if there is no id_info', async () => {
      expect.assertions(1);
      const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = { user_id: '1', job_id: '1', job_type: 1 };
      const promise = instance.submit_job(partner_params, [{ image_type_id: 0, image: 'path/to/image.jpg' }], {}, { return_job_status: true });
      await expect(promise).rejects.toThrow(new Error('You are attempting to complete a job type 1 without providing an id card image or id info'));
    });

    ['return_job_status', 'return_images', 'return_history'].forEach((flag) => {
      const options = {};
      options[flag] = 'not a boolean';
      it('should ensure that optional fields are booleans', async () => {
        expect.assertions(1);
        const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
        const partner_params = { user_id: '1', job_id: '1', job_type: 4 };
        const promise = instance.submit_job(partner_params, [{ image_type_id: 0, image: 'path/to/image.jpg' }], {}, options);
        await expect(promise).rejects.toThrow(new Error(`${flag} needs to be a boolean`));
      });
    });

    it('should be able to send a job', async () => {
      expect.assertions(9);
      const instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = { user_id: '1', job_id: '1', job_type: 4 };

      const options = {};
      const smile_job_id = '0000000111';

      nock('https://testapi.smileidentity.com').post('/v1/upload', (body) => {
        expect(body.smile_client_id).toEqual('001');
        expect(body.sec_key).not.toEqual(undefined);
        expect(body.timestamp).not.toEqual(undefined);
        expect(body.file_name).toEqual('selfie.zip');
        expect(body.partner_params.user_id).toEqual(partner_params.user_id);
        expect(body.partner_params.job_id).toEqual(partner_params.job_id);
        expect(body.partner_params.job_type).toEqual(partner_params.job_type);
        expect(body.callback_url).toEqual('https://a_callback.cb');
        return true;
      }).reply(200, {
        upload_url: 'https://some_url.com',
        smile_job_id,
      }).isDone();
      // todo: find a way to unzip and test info.json
      nock('https://some_url.com').put('/').reply(200).isDone();

      const response = await instance.submit_job(partner_params, [{ image_type_id: 2, image: 'base6image' }], {}, options);
      expect(response).toEqual({ success: true, smile_job_id });
    });

    it('should be able to send a job with a signature', async () => {
      expect.assertions(9);
      const instance = new WebApi('001', 'https://a_callback.cb', '1234', 0);
      const partner_params = { user_id: '1', job_id: '1', job_type: 4 };

      const options = {
        signature: true,
      };
      const smile_job_id = '0000000111';

      nock('https://testapi.smileidentity.com').post('/v1/upload', (body) => {
        expect(body.smile_client_id).toEqual('001');
        expect(body.signature).not.toEqual(undefined);
        expect(body.timestamp).not.toEqual(undefined);
        expect(body.file_name).toEqual('selfie.zip');
        expect(body.partner_params.user_id).toEqual(partner_params.user_id);
        expect(body.partner_params.job_id).toEqual(partner_params.job_id);
        expect(body.partner_params.job_type).toEqual(partner_params.job_type);
        expect(body.callback_url).toEqual('https://a_callback.cb');
        return true;
      }).reply(200, {
        upload_url: 'https://some_url.com',
        smile_job_id,
      }).isDone();
      // todo: find a way to unzip and test info.json
      nock('https://some_url.com').put('/').reply(200).isDone();

      const response = await instance.submit_job(partner_params, [{ image_type_id: 2, image: 'base6image' }], {}, options);
      expect(response).toEqual({ success: true, smile_job_id });
    });

    it('should call IDApi.new().submit_job if the job type is 5', async () => {
      expect.assertions(1);
      const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = { user_id: '1', job_id: '1', job_type: 5 };
      const id_info = {
        first_name: 'John',
        last_name: 'Doe',
        middle_name: '',
        country: 'NG',
        id_type: 'BVN',
        id_number: '00000000000',
        phone_number: '0726789065',
      };
      const IDApiResponse = {
        JSONVersion: '1.0.0',
        SmileJobID: '0000001096',
        PartnerParams: {
          user_id: 'dmKaJazQCziLc6Tw9lwcgzLo',
          job_id: 'DeXyJOGtaACFFfbZ2kxjuICE',
          job_type: 5,
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
        sec_key: 'RKYX2ZVpvNTFW8oXdN3iTvQcefV93VMo18LQ/Uco0=|7f0b0d5ebc3e5499c224f2db478e210d1860f01368ebc045c7bbe6969f1c08ba',
        timestamp: 1570612182124,
      };

      nock('https://testapi.smileidentity.com').post('/v1/id_verification', () => true).reply(200, IDApiResponse).isDone();

      const response = await instance.submit_job(partner_params, null, id_info, null);
      expect(Object.keys(response).sort()).toEqual([
        'JSONVersion', 'SmileJobID', 'PartnerParams', 'ResultType',
        'ResultText', 'ResultCode', 'IsFinalResult', 'Actions',
        'Country', 'IDType', 'IDNumber', 'ExpirationDate',
        'FullName', 'DOB', 'Photo', 'sec_key', 'timestamp',
      ].sort());
    });

    it('should call IDApi.new().submit_job if the job type is 5 with the signature if requested', async () => {
      expect.assertions(1);
      const instance = new WebApi('001', null, '1234', 0);
      const partner_params = { user_id: '1', job_id: '1', job_type: 5 };
      const options = { signature: true };
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
          job_type: 5,
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
        signature: new Signature('001', '1234').generate_signature(timestamp).signature,
        timestamp,
      };

      nock('https://testapi.smileidentity.com').post('/v1/id_verification', () => true).reply(200, IDApiResponse).isDone();

      const response = await instance.submit_job(partner_params, null, id_info, options);
      expect(Object.keys(response).sort()).toEqual([
        'JSONVersion', 'SmileJobID', 'PartnerParams', 'ResultType',
        'ResultText', 'ResultCode', 'IsFinalResult', 'Actions',
        'Country', 'IDType', 'IDNumber', 'ExpirationDate',
        'FullName', 'DOB', 'Photo', 'signature', 'timestamp',
      ].sort());
    });

    it('should raise an error when a network call fails', async () => {
      expect.assertions(2);
      const instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = { user_id: '1', job_id: '1', job_type: 4 };
      const options = { signature: true };

      nock('https://testapi.smileidentity.com').post('/v1/upload').replyWithError(400, {
        code: '2204',
        error: 'unauthorized',
      }).isDone();

      // todo: find a way to unzip and test info.json
      nock('https://some_url.com').put('/').reply(200).isDone();

      const promise = instance.submit_job(partner_params, [{ image_type_id: 2, image: 'base6image' }], {}, options);

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
      expect(error).toBe('undefined:undefined');
    });

    it('should return a response from job_status if that flag is set to true', async () => {
      expect.assertions(1);
      const instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = { user_id: '1', job_id: '1', job_type: 4 };
      const options = { return_job_status: true };

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

      nock('https://testapi.smileidentity.com').post('/v1/upload').reply(200, {
        upload_url: 'https://some_url.com',
      }).isDone();
      // todo: find a way to unzip and test info.json
      nock('https://some_url.com').put('/').reply(200).isDone();
      nock('https://testapi.smileidentity.com').post('/v1/job_status').reply(200, jobStatusResponse).isDone();

      const response = await instance.submit_job(partner_params, [{ image_type_id: 2, image: 'base6image' }], {}, options);
      expect(response.sec_key).toBe(jobStatusResponse.sec_key);
    });

    it('should set all the job_status flags correctly', async () => {
      expect.assertions(7);
      const instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = { user_id: '1', job_id: '1', job_type: 4 };
      const options = {
        return_job_status: true,
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
        timestamp,
        signature: sec_key,
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
        expect(body.sec_key).not.toBe(undefined);
        expect(body.image_links).toBe(true);
        expect(body.history).toBe(true);
        return true;
      }).reply(200, jobStatusResponse).isDone();

      const response = await instance.submit_job(partner_params, [{ image_type_id: 2, image: 'base6image' }], {}, options);
      expect(response.sec_key).toBe(jobStatusResponse.sec_key);
    });

    it('should poll job_status until job_complete is true', async () => {
      expect.assertions(2);
      const instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = { user_id: '1', job_id: '1', job_type: 4 };
      const options = { return_job_status: true };

      const timestamp = Date.now();
      const hash = crypto.createHash('sha256').update(`${1}:${timestamp}`).digest('hex');
      const encrypted = crypto.privateEncrypt({
        key: Buffer.from(pair.private),
        padding: crypto.constants.RSA_PKCS1_PADDING,
      }, Buffer.from(hash)).toString('base64');
      const sec_key = [encrypted, hash].join('|');
      const jobStatusResponse = {
        job_success: false,
        job_complete: false,
        result: {
          ResultCode: '0810',
          ResultText: 'Awesome!',
        },
        timestamp,
        signature: sec_key,
      };

      nock('https://testapi.smileidentity.com').post('/v1/upload').reply(200, {
        upload_url: 'https://some_url.com',
      }).isDone();
      // todo: find a way to unzip and test info.json
      nock('https://some_url.com').put('/').reply(200).isDone();
      nock('https://testapi.smileidentity.com').post('/v1/job_status').reply(200, jobStatusResponse).isDone();
      jobStatusResponse.job_complete = true;
      nock('https://testapi.smileidentity.com').post('/v1/job_status').reply(200, jobStatusResponse).isDone();

      const response = await instance.submit_job(partner_params, [{ image_type_id: 2, image: 'base6image' }], {}, options);

      expect(response.sec_key).toBe(jobStatusResponse.sec_key);
      expect(response.job_complete).toBe(true);
    });

    describe('documentVerification - JT6', () => {
      it('should require the provision of ID Card images', async () => {
        expect.assertions(1);
        const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
        const partner_params = { user_id: '1', job_id: '1', job_type: 6 };

        const promise = instance.submit_job(
          partner_params,
          [{ image_type_id: 0, image: 'path/to/image.jpg' }],
          { country: 'NG', id_type: 'NIN' },
          { return_job_status: true, use_enrolled_image: true },
        );
        await expect(promise).rejects.toThrow(new Error('You are attempting to complete a Document Verification job without providing an id card image'));
      });

      it('should require the provision of country in id_info', async () => {
        expect.assertions(1);
        const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
        const partner_params = { user_id: '1', job_id: '1', job_type: 6 };

        const promise = instance.submit_job(
          partner_params,
          [
            { image_type_id: 0, image: 'path/to/image.jpg' },
            { image_type_id: 1, image: 'path/to/image.jpg' },
          ],
          { id_type: 'NIN' },
          { return_job_status: true, use_enrolled_image: true },
        );
        await expect(promise).rejects.toThrow(new Error('Please make sure that country is included in the id_info'));
      });

      it('should require the provision of id_type in id_info', async () => {
        expect.assertions(1);
        const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
        const partner_params = { user_id: '1', job_id: '1', job_type: 6 };

        const promise = instance.submit_job(
          partner_params,
          [
            { image_type_id: 0, image: 'path/to/image.jpg' },
            { image_type_id: 1, image: 'path/to/image.jpg' },
          ],
          { country: 'NG' },
          { return_job_status: true, use_enrolled_image: true },
        );
        await expect(promise).rejects.toThrow(new Error('Please make sure that id_type is included in the id_info'));
      });

      it('should send the `use_enrolled_image` field to the callback_url when option is provided', async () => {
        expect.assertions(9);
        const instance = new WebApi('001', 'https://fake-callback-url.com', Buffer.from(pair.public).toString('base64'), 0);
        const partner_params = { user_id: '1', job_id: '1', job_type: 6 };
        const postScope = nock('https://testapi.smileidentity.com').post('/v1/upload', (body) => {
          expect(body.use_enrolled_image).toBe(true);
          expect(body.smile_client_id).toBe('001');
          expect(body.partner_params).toStrictEqual(partner_params);
          expect(body.file_name).toBe('selfie.zip');
          expect(typeof body.sec_key).toBe('string');
          expect(typeof body.timestamp).toBe('number');
          return true;
        }).reply(200, { upload_url: 'https://some_url.com' });
        const fixturePath = path.join(__dirname, 'fixtures', '1pixel.jpg');
        // todo: find a way to unzip and test info.json
        const putScope = nock('https://some_url.com').put('/').once().reply(200);

        const response = await instance.submit_job(
          partner_params,
          [{ image_type_id: 0, image: fixturePath }, { image_type_id: 1, image: fixturePath }],
          { country: 'NG', id_type: 'NIN' },
          { return_job_status: false, use_enrolled_image: true },
        );
        expect(response).toEqual({ success: true });
        expect(postScope.isDone()).toBe(true);
        expect(putScope.isDone()).toBe(true);
      });

      it.only('should send the `use_enrolled_image` field when option is provided', async () => {
        //expect.assertions(4);
        const apiKey = Buffer.from(pair.public).toString('base64');
        const timestamp = new Date().toISOString();
        const instance = new WebApi('001', apiKey, 0);
        const partner_params = { user_id: '1', job_id: '1', job_type: 6 };
        const postScope = nock('https://testapi.smileidentity.com').post('/v1/upload', (body) => {
          expect(body.use_enrolled_image).toBe(true);
          expect(body.smile_client_id).toBe('001');
          expect(body.partner_params).toStrictEqual(partner_params);
          expect(body.file_name).toBe('selfie.zip');
          expect(typeof body.signature).toBe('string');
          expect(typeof body.timestamp).toBe('number');
          return true;
        }).reply(200, { upload_url: 'https://some_url.com' });
        const fixturePath = path.join(__dirname, 'fixtures', '1pixel.jpg');
        // todo: find a way to unzip and test info.json
        const putScope = nock('https://some_url.com').put('/').once().reply(200);

        const response = await instance.submit_job(
          partner_params,
          [{ image_type_id: 0, image: fixturePath }, { image_type_id: 1, image: fixturePath }],
          { country: 'NG', id_type: 'NIN' },
          { return_job_status: true, use_enrolled_image: true, signature: new Signature(apiKey, timestamp).generate_signature().signature },
        );
        expect(response).toEqual({ success: true });
        expect(postScope.isDone()).toBe(true);
        expect(putScope.isDone()).toBe(true);
        nock.abortPendingRequests();
      });

      it('should not require a selfie image when `use_enrolled_image` option is selected', async () => {
        expect.assertions(1);
        const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
        const partner_params = { user_id: '1', job_id: '1', job_type: 6 };

        /*
        const postScope = nock('https://testapi.smileidentity.com').post('/v1/upload', (body) => {
          expect(body.use_enrolled_image).toBe(true);
        }).reply(200, { upload_url: 'https://some_url.com' });
        */

        // todo: find a way to unzip and test info.json
        // const putScope = nock('https://some_url.com').put('/').reply(200);

        const response = await instance.submit_job(
          partner_params,
          [{ image_type_id: 1, image: 'path/to/image.jpg' }],
          { country: 'NG', id_type: 'NIN' },
          { return_job_status: true, use_enrolled_image: true },
        );

        expect(response).toEqual({ success: true });
        // expect(postScope.isDone()).toBe(true);
        // expect(putScope.isDone()).toBe(true);
      });
    });
  });

  describe('#get_job_status', () => {
    it('should call Utilities.new().get_job_status', async () => {
      expect.assertions(8);
      const instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);

      const partner_params = { user_id: '1', job_id: '1', job_type: 4 };
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
      nock('https://testapi.smileidentity.com').post('/v1/job_status', (body) => {
        expect(body.job_id).toEqual(partner_params.job_id);
        expect(body.user_id).toEqual(partner_params.user_id);
        expect(body.timestamp).not.toBeUndefined();
        expect(body.sec_key).not.toBeUndefined();
        expect(body.image_links).toBe(true);
        expect(body.history).toBe(true);
        return true;
      }).reply(200, jobStatusResponse).isDone();
      const response = await instance.get_job_status(partner_params, options);

      expect(response.sec_key).toEqual(jobStatusResponse.sec_key);
      expect(response.job_complete).toEqual(true);
    });
  });

  describe('#get_web_token', () => {
    it('should ensure it is called with params', async () => {
      expect.assertions(1);
      const instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
      await expect(instance.get_web_token()).rejects.toThrow(new Error('Please ensure that you send through request params'));
    });

    it('should ensure the params are in an object', async () => {
      expect.assertions(1);
      const instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
      await expect(instance.get_web_token('requestParams')).rejects.toThrow(new Error('Request params needs to be an object'));
    });

    ['user_id', 'job_id', 'product'].forEach((param) => {
      const requestParams = { user_id: '1', job_id: '1', product: 'biometric_kyc' };
      it(`should ensure the ${param} is provided`, async () => {
        expect.assertions(1);
        const instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
        delete requestParams[param];
        await expect(instance.get_web_token(requestParams)).rejects.toThrow(new Error(`${param} is required to get a web token`));
      });
    });

    it('should return a token when all required params are set', async () => {
      expect.assertions(4);
      const instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
      const requestParams = { user_id: '1', job_id: '1', product: 'biometric_kyc' };
      const tokenResponse = { token: '42' };

      nock('https://testapi.smileidentity.com').post('/v1/token', (body) => {
        expect(body.job_id).toEqual(requestParams.job_id);
        expect(body.user_id).toEqual(requestParams.user_id);
        expect(body.product).toEqual(requestParams.product);
        return true;
      }).reply(200, tokenResponse).isDone();

      const response = await instance.get_web_token(requestParams);
      expect(response.token).toEqual(tokenResponse.token);
    });

    describe('handle callback url', () => {
      it('should ensure that a callback URL exists', async () => {
        expect.assertions(1);
        const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
        await expect(instance.get_web_token({})).rejects.toThrow(new Error('Callback URL is required for this method'));
      });

      it('should work with a callback_url param', async () => {
        expect.assertions(5);
        const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
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
        const instance = new WebApi('001', defaultCallbackUrl, Buffer.from(pair.public).toString('base64'), 0);
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
