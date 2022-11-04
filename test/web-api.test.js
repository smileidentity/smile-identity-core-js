const assert = require('assert');
const crypto = require('crypto');
const keypair = require('keypair');
const nock = require('nock');

const { WebApi, Signature, IMAGE_TYPE, JOB_TYPE } = require('..');

const pair = keypair();

describe('WebApi', () => {
  describe('#new', () => {
    it('should instantiate and set the global variables', (done) => {
      const instance = new WebApi('001', 'https://a_callback.com', Buffer.from(pair.public).toString('base64'), 0);
      assert.equal(instance.partner_id, '001');
      assert.equal(instance.api_key, Buffer.from(pair.public).toString('base64'));
      assert.equal(instance.default_callback, 'https://a_callback.com');
      assert.equal(instance.url, 'testapi.smileidentity.com/v1');
      done();
    });
  });

  describe('#submit_job', () => {
    it('should ensure that a method of getting data back has been selected', (done) => {
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.BIOMETRIC_KYC,
      };
      const instance = new WebApi('001', '', Buffer.from(pair.public).toString('base64'), 0);
      instance.submit_job(partner_params, [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_FILE, image: 'path/to/image.jpg' }], {}, {}).catch((err) => {
        assert.equal(err.message, 'Please choose to either get your response via the callback or job status query');
        done();
      });
    });

    it('should ensure that the partner_params are present', (done) => {
      const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      instance.submit_job(null, {}, {}, { return_job_status: true }).catch((err) => {
        assert.equal(err.message, 'Please ensure that you send through partner params');
        done();
      });
    });

    it('should ensure that the partner_params are an object', (done) => {
      const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      instance.submit_job('not partner params', {}, {}, { return_job_status: true }).catch((err) => {
        assert.equal(err.message, 'Partner params needs to be an object');
        done();
      });
    });

    it('should ensure that the partner_params contain user_id, job_id and job_type', (done) => {
      const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      ['user_id', 'job_id', 'job_type'].forEach((key) => {
        const partner_params = {
          user_id: '1',
          job_id: '1',
          job_type: JOB_TYPE.BIOMETRIC_KYC,
        };
        delete partner_params[key];
        instance.submit_job(partner_params, {}, {}, { return_job_status: true }).catch((err) => {
          assert.equal(err.message, `Please make sure that ${key} is included in the partner params`);
        });
      });
      done();
    });

    it('should ensure that in partner_params, user_id, job_id, and job_type are not emptystrings', (done) => {
      const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      ['user_id', 'job_id', 'job_type'].forEach((key) => {
        const partner_params = {
          user_id: '1',
          job_id: '1',
          job_type: JOB_TYPE.BIOMETRIC_KYC,
        };
        partner_params[key] = '';
        instance.submit_job(partner_params, {}, {}, { return_job_status: true }).catch((err) => {
          assert.equal(err.message, `Please make sure that ${key} is included in the partner params`);
        });
      });
      done();
    });

    it('should ensure that images exist', (done) => {
      const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.BIOMETRIC_KYC,
      };
      instance.submit_job(partner_params, null, {}, { return_job_status: true }).catch((err) => {
        assert.equal(err.message, 'Please ensure that you send through image details');
        done();
      });
    });

    it('should ensure that images is an array', (done) => {
      const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.BIOMETRIC_KYC,
      };
      instance.submit_job(partner_params, {}, {}, { return_job_status: true }).catch((err) => {
        assert.equal(err.message, 'Image details needs to be an array');
        done();
      });
    });

    it('should ensure that images is an array and that it is not empty', (done) => {
      const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.BIOMETRIC_KYC,
      };
      instance.submit_job(partner_params, [], {}, { return_job_status: true }).catch((err) => {
        assert.equal(err.message, 'You need to send through at least one selfie image');
        done();
      });
    });

    it('should ensure that images is an array and that it has a selfie', (done) => {
      const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.BIOMETRIC_KYC,
      };
      instance.submit_job(partner_params, [{ image_type_id: IMAGE_TYPE.ID_CARD_IMAGE_FILE, image: 'path/to/image' }], {}, { return_job_status: true }).catch((err) => {
        assert.equal(err.message, 'You need to send through at least one selfie image');
        done();
      });
    });

    it('should ensure that id_info is correctly filled out', (done) => {
      const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.BIOMETRIC_KYC,
      };
      ['country', 'id_type', 'id_number'].forEach((key) => {
        const id_info = {
          country: 'NG',
          id_type: 'BVN',
          id_number: '12345',
          entered: 'true',
        };
        delete id_info[key];
        instance.submit_job(partner_params, [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_FILE, image: 'path/to/image.jpg' }], id_info, { return_job_status: true }).catch((err) => {
          assert.equal(err.message, `Please make sure that ${key} is included in the id_info`);
        });
      });
      done();
    });

    it('should ensure that job type 1 has an id card image if there is no id_info', (done) => {
      const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.BIOMETRIC_KYC,
      };

      instance.submit_job(partner_params, [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_FILE, image: 'path/to/image.jpg' }], {}, { return_job_status: true }).catch((err) => {
        assert.equal(err.message, 'You are attempting to complete a job type 1 without providing an id card image or id info');
        done();
      });
    });

    it('should ensure that optional fields are booleans', (done) => {
      const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.SMART_SELFIE_AUTHENTICATION,
      };
      ['return_job_status', 'return_images', 'return_history'].forEach((flag) => {
        const options = {};
        options[flag] = 'not a boolean';
        instance.submit_job(partner_params, [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_FILE, image: 'path/to/image.jpg' }], {}, options).catch((err) => {
          assert.equal(err.message, `${flag} needs to be a boolean`);
        });
      });
      done();
    });

    it('should be able to send a job', (done) => {
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
          assert.notEqual(body.sec_key, undefined);
          assert.notEqual(body.timestamp, undefined);
          assert.equal(body.file_name, 'selfie.zip');
          assert.equal(body.partner_params.user_id, partner_params.user_id);
          assert.equal(body.partner_params.job_id, partner_params.job_id);
          assert.equal(body.partner_params.job_type, partner_params.job_type);
          assert.equal(body.callback_url, 'https://a_callback.cb');
          return true;
        })
        .reply(200, {
          upload_url: 'https://some_url.com',
          smile_job_id,
        })
        .isDone();
      nock('https://some_url.com')
        .put('/') // todo: find a way to unzip and test info.json
        .reply(200)
        .isDone();

      instance.submit_job(partner_params, [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_BASE64, image: 'base6image' }], {}, options).then((resp) => {
        assert.deepEqual(resp, { success: true, smile_job_id });
      });

      done();
    });

    it('should be able to send a job with a signature', (done) => {
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
          return true;
        })
        .reply(200, {
          upload_url: 'https://some_url.com',
          smile_job_id,
        })
        .isDone();
      nock('https://some_url.com')
        .put('/') // todo: find a way to unzip and test info.json
        .reply(200)
        .isDone();

      instance.submit_job(partner_params, [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_BASE64, image: 'base6image' }], {}, options).then((resp) => {
        assert.deepEqual(resp, { success: true, smile_job_id });
      });

      done();
    });

    it('should call IDApi.new().submit_job if the job type is 5', (done) => {
      const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.BASIC_KYC,
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
      const IDApiResponse = {
        JSONVersion: '1.0.0',
        SmileJobID: '0000001096',
        PartnerParams: {
          user_id: 'dmKaJazQCziLc6Tw9lwcgzLo',
          job_id: 'DeXyJOGtaACFFfbZ2kxjuICE',
          job_type: JOB_TYPE.BASIC_KYC,
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

      nock('https://testapi.smileidentity.com')
        .post('/v1/id_verification', () => true)
        .reply(200, IDApiResponse)
        .isDone();

      const promise = instance.submit_job(partner_params, null, id_info, null);
      promise.then((resp) => {
        assert.deepEqual(Object.keys(resp).sort(), [
          'JSONVersion', 'SmileJobID', 'PartnerParams', 'ResultType', 'ResultText', 'ResultCode', 'IsFinalResult', 'Actions', 'Country', 'IDType', 'IDNumber', 'ExpirationDate', 'FullName', 'DOB', 'Photo', 'sec_key', 'timestamp',
        ].sort());
        done();
      });
    });

    it('should call IDApi.new().submit_job if the job type is 5 with the signature if requested', (done) => {
      const instance = new WebApi('001', null, '1234', 0);
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.BASIC_KYC,
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
          job_type: JOB_TYPE.BASIC_KYC,
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

      nock('https://testapi.smileidentity.com')
        .post('/v1/id_verification', () => true)
        .reply(200, IDApiResponse)
        .isDone();

      const promise = instance.submit_job(partner_params, null, id_info, { signature: true });
      promise.then((resp) => {
        assert.deepEqual(Object.keys(resp).sort(), [
          'JSONVersion', 'SmileJobID', 'PartnerParams', 'ResultType', 'ResultText', 'ResultCode', 'IsFinalResult', 'Actions', 'Country', 'IDType', 'IDNumber', 'ExpirationDate', 'FullName', 'DOB', 'Photo', 'signature', 'timestamp',
        ].sort());
        done();
      });
    });

    it('should raise an error when a network call fails', (done) => {
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
        .replyWithError(400, {
          code: '2204',
          error: 'unauthorized',
        })
        .isDone();
      nock('https://some_url.com')
        .put('/') // todo: find a way to unzip and test info.json
        .times(0)
        .reply(200);

      instance.submit_job(partner_params, [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_BASE64, image: 'base6image' }], {}, options).then(() => {
        // make sure this test fails if the job goes through
        assert.equal(false);
      }).catch((err) => {
        // todo: figure out how to get nook to act like an error response would in real life
        // err.message in this case should be '2204:unauthorized'
        assert.equal(err.message, undefined);
      });

      done();
    });

    it('should return a response from job_status if that flag is set to true', (done) => {
      const instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.SMART_SELFIE_AUTHENTICATION,
      };
      const options = {
        return_job_status: true,
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

      nock('https://testapi.smileidentity.com')
        .post('/v1/upload')
        .reply(200, {
          upload_url: 'https://some_url.com',
        })
        .isDone();
      nock('https://some_url.com')
        .put('/') // todo: find a way to unzip and test info.json
        .reply(200)
        .isDone();
      nock('https://testapi.smileidentity.com')
        .post('/v1/job_status')
        .reply(200, jobStatusResponse)
        .isDone();

      instance.submit_job(partner_params, [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_BASE64, image: 'base6image' }], {}, options).then((resp) => {
        assert.equal(resp.sec_key, jobStatusResponse.sec_key);
        done();
      });
    });

    it('should set all the job_status flags correctly', (done) => {
      const instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
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

      nock('https://testapi.smileidentity.com')
        .post('/v1/upload')
        .reply(200, {
          upload_url: 'https://some_url.com',
        })
        .isDone();
      nock('https://some_url.com')
        .put('/') // todo: find a way to unzip and test info.json
        .reply(200)
        .isDone();
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

      instance.submit_job(partner_params, [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_BASE64, image: 'base6image' }], {}, options).then((resp) => {
        assert.equal(resp.sec_key, jobStatusResponse.sec_key);
        done();
      }).catch(console.error);
    });

    it('should poll job_status until job_complete is true', (done) => {
      const instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.SMART_SELFIE_AUTHENTICATION,
      };
      const options = {
        return_job_status: true,
      };

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

      nock('https://testapi.smileidentity.com')
        .post('/v1/upload')
        .reply(200, {
          upload_url: 'https://some_url.com',
        })
        .isDone();
      nock('https://some_url.com')
        .put('/') // todo: find a way to unzip and test info.json
        .reply(200)
        .isDone();
      nock('https://testapi.smileidentity.com')
        .post('/v1/job_status')
        .reply(200, jobStatusResponse)
        .isDone();
      jobStatusResponse.job_complete = true;
      nock('https://testapi.smileidentity.com')
        .post('/v1/job_status')
        .reply(200, jobStatusResponse)
        .isDone();

      const promise = instance.submit_job(partner_params, [{ image_type_id: IMAGE_TYPE.SELFIE_IMAGE_BASE64, image: 'base6image' }], {}, options);
      promise.then((resp) => {
        assert.equal(resp.sec_key, jobStatusResponse.sec_key);
        assert.equal(resp.job_complete, true);
        done();
      }).catch(console.error);
    }).timeout(5000);

    describe('documentVerification - JT6', () => {
      it('should require the provision of ID Card images', (done) => {
        const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
        const partner_params = {
          user_id: '1',
          job_id: '1',
          job_type: JOB_TYPE.DOCUMENT_VERIFICATION,
        };

        instance.submit_job(
          partner_params,
          [
            { image_type_id: IMAGE_TYPE.SELFIE_IMAGE_FILE, image: 'path/to/image.jpg' },
          ],
          { country: 'NG', id_type: 'NIN' },
          { return_job_status: true, use_enrolled_image: true },
        )
          .catch((err) => {
            assert.equal(err.message, 'You are attempting to complete a Document Verification job without providing an id card image');
            done();
          });
      });

      it('should require the provision of country in id_info', (done) => {
        const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
        const partner_params = {
          user_id: '1',
          job_id: '1',
          job_type: JOB_TYPE.DOCUMENT_VERIFICATION,
        };

        instance.submit_job(
          partner_params,
          [
            { image_type_id: IMAGE_TYPE.SELFIE_IMAGE_FILE, image: 'path/to/image.jpg' },
            { image_type_id: IMAGE_TYPE.ID_CARD_IMAGE_FILE, image: 'path/to/image.jpg' },
          ],
          { id_type: 'NIN' },
          { return_job_status: true, use_enrolled_image: true },
        )
          .catch((err) => {
            assert.equal(err.message, 'Please make sure that country is included in the id_info');
            done();
          });
      });

      it('should require the provision of id_type in id_info', (done) => {
        const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
        const partner_params = {
          user_id: '1',
          job_id: '1',
          job_type: JOB_TYPE.DOCUMENT_VERIFICATION,
        };

        instance.submit_job(
          partner_params,
          [
            { image_type_id: IMAGE_TYPE.SELFIE_IMAGE_FILE, image: 'path/to/image.jpg' },
            { image_type_id: IMAGE_TYPE.ID_CARD_IMAGE_FILE, image: 'path/to/image.jpg' },
          ],
          { country: 'NG' },
          { return_job_status: true, use_enrolled_image: true },
        )
          .catch((err) => {
            assert.equal(err.message, 'Please make sure that id_type is included in the id_info');
            done();
          });
      });

      it('should send the `use_enrolled_image` field when option is provided', (done) => {
        const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
        const partner_params = {
          user_id: '1',
          job_id: '1',
          job_type: JOB_TYPE.DOCUMENT_VERIFICATION,
        };

        nock('https://testapi.smileidentity.com')
          .post('/v1/upload', (body) => {
            assert.equal(body.use_enrolled_image, true);
          })
          .reply(200, {
            upload_url: 'https://some_url.com',
          })
          .isDone();
        nock('https://some_url.com')
          .put('/') // todo: find a way to unzip and test info.json
          .reply(200)
          .isDone();

        instance.submit_job(
          partner_params,
          [
            { image_type_id: IMAGE_TYPE.SELFIE_IMAGE_FILE, image: 'path/to/image.jpg' },
            { image_type_id: IMAGE_TYPE.ID_CARD_IMAGE_FILE, image: 'path/to/image.jpg' },
          ],
          { country: 'NG', id_type: 'NIN' },
          { return_job_status: true, use_enrolled_image: true },
        )
          .then((resp) => {
            assert.deepEqual(resp, { success: true });
          })
          .catch((e) => console.error(e.message));

        done();
      });

      it('should not require a selfie image when `use_enrolled_image` option is selected', (done) => {
        const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
        const partner_params = {
          user_id: '1',
          job_id: '1',
          job_type: JOB_TYPE.DOCUMENT_VERIFICATION,
        };

        nock('https://testapi.smileidentity.com')
          .post('/v1/upload', (body) => {
            assert.equal(body.use_enrolled_image, true);
          })
          .reply(200, {
            upload_url: 'https://some_url.com',
          })
          .isDone();
        nock('https://some_url.com')
          .put('/') // todo: find a way to unzip and test info.json
          .reply(200)
          .isDone();

        instance.submit_job(
          partner_params,
          [
            { image_type_id: IMAGE_TYPE.ID_CARD_IMAGE_FILE, image: 'path/to/image.jpg' },
          ],
          { country: 'NG', id_type: 'NIN' },
          { return_job_status: true, use_enrolled_image: true },
        )
          .then((resp) => {
            assert.deepEqual(resp, { success: true });
          })
          .catch((e) => console.error(e.message));

        done();
      });
    });
  });

  describe('#get_job_status', () => {
    it('should call Utilities.new().get_job_status', (done) => {
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.SMART_SELFIE_AUTHENTICATION,
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
        timestamp,
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
      const instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
      const promise = instance.get_job_status(partner_params, options);
      promise.then((resp) => {
        assert.equal(resp.sec_key, jobStatusResponse.sec_key);
        assert.equal(resp.job_complete, true);
        done();
      });
    });
  });

  describe('#get_web_token', () => {
    it('should ensure it is called with params', (done) => {
      const instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
      const promise = instance.get_web_token();
      promise.catch((err) => {
        assert.equal(err.message, 'Please ensure that you send through request params');
        done();
      });
    });

    it('should ensure the params are in an object', (done) => {
      const instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
      const promise = instance.get_web_token('requestParams');
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

      const instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
      const promise = instance.get_web_token(requestParams);
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

      const instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
      const promise = instance.get_web_token(requestParams);
      promise.then((resp) => {
        assert.equal(resp.token, '42');
        done();
      });
    });

    describe('handle callback url', () => {
      it('should ensure that a callback URL exists', (done) => {
        const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
        const promise = instance.get_web_token({});
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

        const instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
        const promise = instance.get_web_token(requestParams);
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

        const instance = new WebApi('001', defaultCallbackURL, Buffer.from(pair.public).toString('base64'), 0);
        const promise = instance.get_web_token(requestParams);
        promise.then((resp) => {
          assert.equal(resp.token, '42');
          done();
        });
      });
    });
  });
});
