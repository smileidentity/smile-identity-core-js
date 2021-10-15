var assert = require('assert');
const SmileIdentity = require("./../index.js");
const WebApi = SmileIdentity.WebApi;
const Signature = SmileIdentity.Signature;
const Utilities = SmileIdentity.Utilities;
const IDApi = SmileIdentity.IDApi;

const crypto = require('crypto');
const https = require('https');
const jszip = require('jszip');
const keypair = require('keypair');
const nock = require('nock');
const sinon = require('sinon');

const pair = keypair();

// test that the sec key is generated correctly
describe('Signature', () => {
  describe('#new', () => {
    it('should set the partner_id and api_key values', (done) => {
      let instance = new Signature('001', Buffer.from(pair.public).toString('base64'));
      assert.equal(instance.partnerID, '001');
      assert.equal(instance.apiKey, Buffer.from(pair.public).toString('base64'));
      done();
    });
  });

  describe('#generate_sec_key', () => {
    it('should create a sec_key', function(done) {
      let timestamp = Date.now();
      let signature = new Signature('001', Buffer.from(pair.public).toString('base64')).generate_sec_key(timestamp);
      assert.equal(typeof(signature), 'object');
      assert.equal(timestamp, signature.timestamp);
      let hash = crypto.createHash('sha256').update(1 + ":" + timestamp).digest('hex');
      assert.equal(hash, signature.sec_key.split('|')[1]);
      let decrypted = crypto.privateDecrypt({
        key: Buffer.from(pair.private),
        padding: crypto.constants.RSA_PKCS1_PADDING
      }, Buffer.from(signature.sec_key.split('|')[0], 'base64')).toString();
      assert.equal(decrypted, hash);
      done();
    });
  });

  describe('#confirm_sec_key', () => {
    it('should be able to decode a valid sec_key', (done) => {
      let timestamp = Date.now();
      let hash = crypto.createHash('sha256').update(1 + ":" + timestamp).digest('hex');
      let encrypted = crypto.privateEncrypt({
        key: Buffer.from(pair.private),
        padding: crypto.constants.RSA_PKCS1_PADDING
      }, Buffer.from(hash)).toString('base64');
      let sec_key = [encrypted, hash].join('|');
      assert.equal(true, new Signature('001', Buffer.from(pair.public).toString('base64')).confirm_sec_key(timestamp, sec_key));
      done();
    });
  });

  describe('#generate_signature', () => {
    it('should calculate a signature and use a timestamp if provided one', (done) => {
      let timestamp = new Date().toISOString();
      let hmac = crypto.createHmac('sha256', '1234');
      hmac.update(timestamp, 'utf8');
      hmac.update('002', 'utf8');
      hmac.update("sid_request", 'utf8');
      let output = hmac.digest().toString('base64');
      let result = new Signature('002', '1234').generate_signature(timestamp)
      assert.equal(output, result.signature);
      assert.equal(timestamp, result.timestamp);
      done();
    });
  });

  describe('#confirm_signature', () => {
    it('should confirm an incoming signaute', (done) => {
      let timestamp = new Date().toISOString();
      let hmac = crypto.createHmac('sha256', '1234');
      hmac.update(timestamp, 'utf8');
      hmac.update('002', 'utf8');
      hmac.update("sid_request", 'utf8');
      let output = hmac.digest().toString('base64');
      assert.equal(true, new Signature('002', '1234').confirm_signature(timestamp, output));
      done();
    });
  });
});

describe('WebApi', () => {
  describe('#new', () => {
    it('should instantiate and set the global variables', (done) => {
      let instance = new WebApi('001', 'https://a_callback.com', Buffer.from(pair.public).toString('base64'), 0);
      assert.equal(instance.partner_id, '001');
      assert.equal(instance.api_key, Buffer.from(pair.public).toString('base64'));
      assert.equal(instance.default_callback, 'https://a_callback.com');
      assert.equal(instance.url, 'testapi.smileidentity.com/v1');
      done();
    });
  });

  describe('#submit_job', () => {
    it('should ensure that a method of getting data back has been selected', (done) => {
      let partner_params = {
          user_id: '1',
          job_id: '1',
          job_type: 1
        };
      let instance = new WebApi('001', '', Buffer.from(pair.public).toString('base64'), 0);
      instance.submit_job(partner_params, [{image_type_id: 0, image: 'path/to/image.jpg'}], {}, {}).catch((err) => {
        assert.equal(err.message, 'Please choose to either get your response via the callback or job status query')
        done();
      });
    });

    it('should ensure that the partner_params are present', (done) => {
      let instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      instance.submit_job(null, {}, {}, {return_job_status: true}).catch((err) => {
        assert.equal(err.message, 'Please ensure that you send through partner params')
        done();
      });
    });

    it('should ensure that the partner_params are an object', (done) => {
      let instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      instance.submit_job('not partner params', {}, {}, {return_job_status: true}).catch((err) => {
        assert.equal(err.message, 'Partner params needs to be an object')
        done();
      });
    });

    it('should ensure that the partner_params contain user_id, job_id and job_type', (done) => {
      let instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      ['user_id', 'job_id', 'job_type'].forEach((key) => {
        let partner_params = {
          user_id: '1',
          job_id: '1',
          job_type: 1
        };
        delete partner_params[key];
        instance.submit_job(partner_params, {}, {}, {return_job_status: true}).catch((err) => {
          assert.equal(err.message, `Please make sure that ${key} is included in the partner params`);
        });
      });
      done();
    });

    it('should ensure that in partner_params, user_id, job_id, and job_type are not emptystrings', (done) => {
      let instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      ['user_id', 'job_id', 'job_type'].forEach((key) => {
        let partner_params = {
          user_id: '1',
          job_id: '1',
          job_type: 1
        };
        partner_params[key] = '';
        instance.submit_job(partner_params, {}, {}, {return_job_status: true}).catch((err) => {
          assert.equal(err.message, `Please make sure that ${key} is included in the partner params`);
        });
      });
      done();
    });

    it('should ensure that images exist', (done) => {
      let instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 1
      };
      instance.submit_job(partner_params, null, {}, {return_job_status: true}).catch((err) => {
        assert.equal(err.message, 'Please ensure that you send through image details');
        done();
      });
    });

    it('should ensure that images is an array', (done) => {
      let instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 1
      };
      instance.submit_job(partner_params, {}, {}, {return_job_status: true}).catch((err) => {
        assert.equal(err.message, 'Image details needs to be an array');
        done();
      });
    });

    it('should ensure that images is an array and that it is not empty', (done) => {
      let instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 1
      };
      instance.submit_job(partner_params, [], {}, {return_job_status: true}).catch((err) => {
        assert.equal(err.message, 'You need to send through at least one selfie image');
        done();
      });
    });

    it('should ensure that images is an array and that it has a selfie', (done) => {
      let instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 1
      };
      instance.submit_job(partner_params, [{image_type_id: 1, image: 'path/to/image'}], {}, {return_job_status: true}).catch((err) => {
        assert.equal(err.message, 'You need to send through at least one selfie image');
        done();
      });
    });

    it('should ensure that id_info is correctly filled out', (done) => {
      let instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 1
      };
      ['country', 'id_type', 'id_number'].forEach((key) => {
        let id_info = {
          country: 'NG',
          id_type: 'BVN',
          id_number: '12345',
          entered: 'true'
        };
        delete id_info[key];
        instance.submit_job(partner_params, [{image_type_id: 0, image: 'path/to/image.jpg'}], id_info, {return_job_status: true}).catch((err) => {
          assert.equal(err.message, `Please make sure that ${key} is included in the id_info`);
        });
      });
      done();
    });

    it('should ensure that job type 1 has an id card image if there is no id_info', (done) => {
      let instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 1
      };

      instance.submit_job(partner_params, [{image_type_id: 0, image: 'path/to/image.jpg'}], {}, {return_job_status: true}).catch((err) => {
        assert.equal(err.message, "You are attempting to complete a job type 1 without providing an id card image or id info");
        done();
      });
    });

    it('should ensure that optional fields are booleans', (done) => {
      let instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 4
      };
      ['return_job_status', 'return_images', 'return_history'].forEach((flag) => {
        let options = {};
        options[flag] = 'not a boolean'
        instance.submit_job(partner_params, [{image_type_id: 0, image: 'path/to/image.jpg'}], {}, options).catch((err) => {
          assert.equal(err.message, `${flag} needs to be a boolean`);
        });
      });
      done();
    });

    it('should be able to send a job', (done) => {
      let instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 4
      };
      let options = {};
      let smile_job_id = '0000000111';

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
          smile_job_id: smile_job_id
        })
        .isDone();
      nock('https://some_url.com')
        .put('/') // todo: find a way to unzip and test info.json
        .reply(200)
        .isDone();

      instance.submit_job(partner_params, [{image_type_id: 2, image: 'base6image'}], {}, options).then((resp) => {
        assert.deepEqual(resp, {success: true, smile_job_id: smile_job_id});
      });

      done();
    });

    it('should be able to send a job with a signature', (done) => {
      let instance = new WebApi('001', 'https://a_callback.cb', '1234', 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 4
      };
      let options = {
        signature: true
      };
      let smile_job_id = '0000000111';

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
          smile_job_id: smile_job_id
        })
        .isDone();
      nock('https://some_url.com')
        .put('/') // todo: find a way to unzip and test info.json
        .reply(200)
        .isDone();

      instance.submit_job(partner_params, [{image_type_id: 2, image: 'base6image'}], {}, options).then((resp) => {
        assert.deepEqual(resp, {success: true, smile_job_id: smile_job_id});
      });

      done();
    });

    it('should call IDApi.new().submit_job if the job type is 5', (done) => {
      let instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 5
      };
      let id_info = {
        first_name: 'John',
        last_name: 'Doe',
        middle_name: '',
        country: 'NG',
        id_type: 'BVN',
        id_number: '00000000000',
        phone_number: '0726789065'
      };
      let IDApiResponse = {
        "JSONVersion": "1.0.0",
        "SmileJobID": "0000001096",
        "PartnerParams": {
            "user_id": "dmKaJazQCziLc6Tw9lwcgzLo",
            "job_id": "DeXyJOGtaACFFfbZ2kxjuICE",
            "job_type": 5
        },
        "ResultType": "ID Verification",
        "ResultText": "ID Number Validated",
        "ResultCode": "1012",
        "IsFinalResult": "true",
        "Actions": {
          "Verify_ID_Number": "Verified",
          "Return_Personal_Info": "Returned"
        },
        "Country": "NG",
        "IDType": "BVN",
        "IDNumber": "00000000000",
        "ExpirationDate": "NaN-NaN-NaN",
        "FullName": "some  person",
        "DOB": "NaN-NaN-NaN",
        "Photo": "Not Available",
        "sec_key": "RKYX2ZVpvNTFW8oXdN3iTvQcefV93VMo18LQ/Uco0=|7f0b0d5ebc3e5499c224f2db478e210d1860f01368ebc045c7bbe6969f1c08ba",
        "timestamp": 1570612182124
      };
      let smile_job_id = '0000000111';

      nock('https://testapi.smileidentity.com')
        .post('/v1/id_verification', (body) => {
          return true;
        })
        .reply(200, IDApiResponse)
        .isDone()

      let promise = instance.submit_job(partner_params, null, id_info, null);
      promise.then((resp) => {
        assert.deepEqual(Object.keys(resp).sort(), [
          'JSONVersion', 'SmileJobID', 'PartnerParams', 'ResultType', 'ResultText', 'ResultCode', 'IsFinalResult', 'Actions', 'Country', 'IDType', 'IDNumber', 'ExpirationDate', 'FullName', 'DOB', 'Photo', 'sec_key', 'timestamp'
        ].sort());
        done();
      });
    });

    it('should call IDApi.new().submit_job if the job type is 5 with the signature if requested', (done) => {
      let instance = new WebApi('001', null, '1234', 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 5
      };
      let id_info = {
        first_name: 'John',
        last_name: 'Doe',
        middle_name: '',
        country: 'NG',
        id_type: 'BVN',
        id_number: '00000000000',
        phone_number: '0726789065'
      };
      let timestamp = new Date().toISOString();
      let IDApiResponse = {
        "JSONVersion": "1.0.0",
        "SmileJobID": "0000001096",
        "PartnerParams": {
            "user_id": "dmKaJazQCziLc6Tw9lwcgzLo",
            "job_id": "DeXyJOGtaACFFfbZ2kxjuICE",
            "job_type": 5
        },
        "ResultType": "ID Verification",
        "ResultText": "ID Number Validated",
        "ResultCode": "1012",
        "IsFinalResult": "true",
        "Actions": {
          "Verify_ID_Number": "Verified",
          "Return_Personal_Info": "Returned"
        },
        "Country": "NG",
        "IDType": "BVN",
        "IDNumber": "00000000000",
        "ExpirationDate": "NaN-NaN-NaN",
        "FullName": "some  person",
        "DOB": "NaN-NaN-NaN",
        "Photo": "Not Available",
        "signature": new Signature('001', '1234').generate_signature(timestamp).signature,
        "timestamp": timestamp
      };
      let smile_job_id = '0000000111';

      nock('https://testapi.smileidentity.com')
        .post('/v1/id_verification', (body) => {
          return true;
        })
        .reply(200, IDApiResponse)
        .isDone()

      let promise = instance.submit_job(partner_params, null, id_info, {signature: true});
      promise.then((resp) => {
        assert.deepEqual(Object.keys(resp).sort(), [
          'JSONVersion', 'SmileJobID', 'PartnerParams', 'ResultType', 'ResultText', 'ResultCode', 'IsFinalResult', 'Actions', 'Country', 'IDType', 'IDNumber', 'ExpirationDate', 'FullName', 'DOB', 'Photo', 'signature', 'timestamp'
        ].sort());
        done();
      });
    });

    it('should raise an error when a network call fails', (done) => {
      let instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 4
      };
      let options = {
        signature: true
      };

      nock('https://testapi.smileidentity.com')
        .post('/v1/upload')
        .replyWithError(400, {
          code: '2204',
          error: 'unauthorized'
        })
        .isDone();
      nock('https://some_url.com')
        .put('/') // todo: find a way to unzip and test info.json
        .times(0)
        .reply(200);

      instance.submit_job(partner_params, [{image_type_id: 2, image: 'base6image'}], {}, options).then((resp) => {
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
      let instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 4
      };
      let options = {
        return_job_status: true
      };

      let timestamp = Date.now();
      let hash = crypto.createHash('sha256').update(1 + ":" + timestamp).digest('hex');
      let encrypted = crypto.privateEncrypt({
        key: Buffer.from(pair.private),
        padding: crypto.constants.RSA_PKCS1_PADDING
      }, Buffer.from(hash)).toString('base64');
      let sec_key = [encrypted, hash].join('|');
      let jobStatusResponse = {
        job_success: true,
        job_complete: true,
        result: {
          ResultCode: '0810',
          ResultText: 'Awesome!'
        },
        timestamp: timestamp,
        signature: sec_key
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

      instance.submit_job(partner_params, [{image_type_id: 2, image: 'base6image'}], {}, options).then((resp) => {
        assert.equal(resp.sec_key, jobStatusResponse.sec_key);
        done();
      });

    });

    it('should set all the job_status flags correctly', (done) => {
      let instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 4
      };
      let options = {
        return_job_status: true,
        return_images: true,
        return_history: true
      };

      let timestamp = Date.now();
      let hash = crypto.createHash('sha256').update(1 + ":" + timestamp).digest('hex');
      let encrypted = crypto.privateEncrypt({
        key: Buffer.from(pair.private),
        padding: crypto.constants.RSA_PKCS1_PADDING
      }, Buffer.from(hash)).toString('base64');
      let sec_key = [encrypted, hash].join('|');
      let jobStatusResponse = {
        job_success: true,
        job_complete: true,
        result: {
          ResultCode: '0810',
          ResultText: 'Awesome!'
        },
        timestamp: timestamp,
        signature: sec_key
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
        .post('/v1/job_status',(body) => {
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

      instance.submit_job(partner_params, [{image_type_id: 2, image: 'base6image'}], {}, options).then((resp) => {
        assert.equal(resp.sec_key, jobStatusResponse.sec_key);
        done();
      }).catch((e) => console.log(e));

    });

    it('should poll job_status until job_complete is true', (done) => {
      let instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 4
      };
      let options = {
        return_job_status: true
      };

      let timestamp = Date.now();
      let hash = crypto.createHash('sha256').update(1 + ":" + timestamp).digest('hex');
      let encrypted = crypto.privateEncrypt({
        key: Buffer.from(pair.private),
        padding: crypto.constants.RSA_PKCS1_PADDING
      }, Buffer.from(hash)).toString('base64');
      let sec_key = [encrypted, hash].join('|');
      let jobStatusResponse = {
        job_success: false,
        job_complete: false,
        result: {
          ResultCode: '0810',
          ResultText: 'Awesome!'
        },
        timestamp: timestamp,
        signature: sec_key
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

      let promise = instance.submit_job(partner_params, [{image_type_id: 2, image: 'base6image'}], {}, options)
      promise.then((resp) => {
        assert.equal(resp.sec_key, jobStatusResponse.sec_key);
        assert.equal(resp.job_complete, true);
        done();
      }).catch((err) => console.log(err));
    }).timeout(5000);
  });

  describe('#get_job_status', () => {
    it("should call Utilities.new().get_job_status", (done) => {
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 4
      };
      let options = {
        return_images: true,
        return_history: true
      };
      let timestamp = Date.now();
      let hash = crypto.createHash('sha256').update(1 + ":" + timestamp).digest('hex');
      let encrypted = crypto.privateEncrypt({
        key: Buffer.from(pair.private),
        padding: crypto.constants.RSA_PKCS1_PADDING
      }, Buffer.from(hash)).toString('base64');
      let sec_key = [encrypted, hash].join('|');
      let jobStatusResponse = {
        job_success: true,
        job_complete: true,
        result: {
          ResultCode: '0810',
          ResultText: 'Awesome!'
        },
        timestamp: timestamp,
        signature: sec_key
      };
      nock('https://testapi.smileidentity.com')
        .post('/v1/job_status',(body) => {
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
      let instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
      let promise = instance.get_job_status(partner_params, options);
      promise.then((resp) => {
        assert.equal(resp.sec_key, jobStatusResponse.sec_key);
        assert.equal(resp.job_complete, true);
        done();
      });
    });
  });

	describe('#get_web_token', () => {
		it('should ensure it is called with params', (done) => {
			const tokenResponse = new Error('Please ensure that you send through request params');

			let instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
			let promise = instance.get_web_token();
			promise.catch(err => {
				assert.equal(err.message, 'Please ensure that you send through request params');
				done();
			});
		});

		it('should ensure the params are in an object', (done) => {
			const tokenResponse = new Error('Request params needs to be an object');

			let instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
			let promise = instance.get_web_token('requestParams');
			promise.catch(err => {
				assert.equal(err.message, 'Request params needs to be an object');
				done();
			});
		});

		it("should ensure that all required params are sent", (done) => {
			const requestParams = {
				user_id: '1',
				job_id: '1',
			};

			const tokenResponse = new Error('product is required to get a web token');

			nock('https://testapi.smileidentity.com')
				.post('/v1/token',(body) => {
					assert.equal(body.job_id, requestParams.job_id);
					assert.equal(body.user_id, requestParams.user_id);
					assert.equal(body.product, undefined);
					return true;
				})
				.reply(412, tokenResponse)
				.isDone();

			let instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
			let promise = instance.get_web_token(requestParams);
			promise.catch(err => {
				assert.equal(err.message, 'product is required to get a web token');
				done();
			});
		});

		it("should return a token when all required params are set", (done) => {
			const requestParams = {
				user_id: '1',
				job_id: '1',
				product: 'ekyc_smartselfie',
			};

			const tokenResponse = {
				token: "42"
			};

			nock('https://testapi.smileidentity.com')
				.post('/v1/token',(body) => {
					assert.equal(body.job_id, requestParams.job_id);
					assert.equal(body.user_id, requestParams.user_id);
					assert.equal(body.product, requestParams.product);
					return true;
				})
				.reply(200, tokenResponse)
				.isDone();

			let instance = new WebApi('001', 'https://a_callback.cb', Buffer.from(pair.public).toString('base64'), 0);
			let promise = instance.get_web_token(requestParams);
			promise.then(resp => {
				assert.equal(resp.token, '42');
				done();
			});
		});

		describe("handle callback url", () => {
			it('should ensure that a callback URL exists', (done) => {
				const tokenResponse = new Error('Callback URL is required for this method');

				let instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
				let promise = instance.get_web_token({});
				promise.catch(err => {
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
					token: "42"
				};

				nock('https://testapi.smileidentity.com')
					.post('/v1/token',(body) => {
						assert.equal(body.job_id, requestParams.job_id);
						assert.equal(body.user_id, requestParams.user_id);
						assert.equal(body.product, requestParams.product);
						assert.equal(body.callback_url, requestParams.callback_url);
						return true;
					})
					.reply(200, tokenResponse)
					.isDone();

				let instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
				let promise = instance.get_web_token(requestParams);
				promise.then(resp => {
					assert.equal(resp.token, '42');
					done();
				});
			});

			it('should fallback to the default callback URL', (done) => {
				const defaultCallbackURL = 'https://smileidentity.com/callback';
				const requestParams = {
					user_id: '1',
					job_id: '1',
					product: 'ekyc_smartselfie'
				};

				const tokenResponse = {
					token: 42
				};

				nock('https://testapi.smileidentity.com')
					.post('/v1/token',(body) => {
						assert.equal(body.job_id, requestParams.job_id);
						assert.equal(body.user_id, requestParams.user_id);
						assert.equal(body.product, requestParams.product);
						assert.equal(body.callback_url, defaultCallbackURL);
						return true;
					})
					.reply(200, tokenResponse)
					.isDone();

				let instance = new WebApi('001', defaultCallbackURL, Buffer.from(pair.public).toString('base64'), 0);
				let promise = instance.get_web_token(requestParams);
				promise.then(resp => {
					assert.equal(resp.token, '42');
					done();
				});
			});
		});
	});
});

describe('Utilities', () => {
  describe('#get_job_status', () => {
    it('should be able to check job_status successfully', (done) => {
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 4
      };
      let options = {
        return_images: true,
        return_history: true
      };

      let timestamp = Date.now();
      let hash = crypto.createHash('sha256').update(1 + ":" + timestamp).digest('hex');
      let encrypted = crypto.privateEncrypt({
        key: Buffer.from(pair.private),
        padding: crypto.constants.RSA_PKCS1_PADDING
      }, Buffer.from(hash)).toString('base64');
      let sec_key = [encrypted, hash].join('|');
      let jobStatusResponse = {
        job_success: true,
        job_complete: true,
        result: {
          ResultCode: '0810',
          ResultText: 'Awesome!'
        },
        timestamp: timestamp,
        signature: sec_key
      };
      nock('https://testapi.smileidentity.com')
        .post('/v1/job_status',(body) => {
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
      new Utilities('001', Buffer.from(pair.public).toString('base64'), 0)
        .get_job_status(partner_params.user_id, partner_params.job_id, options)
        .then((job_status, err) => {
          assert.equal(job_status.sec_key, jobStatusResponse.sec_key);
          assert.equal(job_status.job_complete, true);
          done();
        }).catch((err) => {
          assert.equal(null, err);
          console.log(err)
        });
    });

    it('should be able to use the signature instead of the sec_key when provided an option flag', (done) => {
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 4
      };
      let options = {
        return_images: true,
        return_history: true,
        signature: true
      };

      let timestamp = new Date().toISOString();
      let signature = new Signature('001', '1234').generate_signature(timestamp).signature;
      
      let jobStatusResponse = {
        job_success: true,
        job_complete: true,
        result: {
          ResultCode: '0810',
          ResultText: 'Awesome!'
        },
        timestamp: timestamp,
        signature: signature
      };
      nock('https://testapi.smileidentity.com')
        .post('/v1/job_status',(body) => {
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
        .then((job_status, err) => {
          assert.equal(job_status.signature, jobStatusResponse.signature);
          assert.equal(job_status.job_complete, true);
          done();
        }).catch((err) => {
          assert.equal(null, err);
          console.log(err)
        });
    });

    it('should raise an error if one occurs', (done) => {
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 4
      };
      let options = {
        return_images: true,
        return_history: true
      };

      let timestamp = Date.now();
      let hash = crypto.createHash('sha256').update(1 + ":" + timestamp).digest('hex');
      let encrypted = crypto.privateEncrypt({
        key: Buffer.from(pair.private),
        padding: crypto.constants.RSA_PKCS1_PADDING
      }, Buffer.from(hash)).toString('base64');
      let sec_key = [encrypted, hash].join('|');
      let jobStatusResponse = {
        error: 'oops'
      };
      nock('https://testapi.smileidentity.com')
        .post('/v1/job_status',(body) => {
          assert.equal(body.job_id, partner_params.job_id);
          assert.equal(body.user_id, partner_params.user_id);
          assert.notEqual(body.timestamp, undefined);
          assert.notEqual(body.sec_key, undefined);
          assert.equal(body.image_links, true);
          assert.equal(body.history, true);
          return true;
        })
        .replyWithError(400, {
          code: '2204',
          error: 'unauthorized'
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

describe('IDapi', () => {
  describe('#new', () => {
    it('should instantiate and set the global variables', (done) => {
      let instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      assert.equal(instance.partner_id, '001');
      assert.equal(instance.api_key, Buffer.from(pair.public).toString('base64'));
      assert.equal(instance.url, 'testapi.smileidentity.com/v1');
      done();
    });
  });

  describe('#submit_job', () => {
    it('should ensure that the partner_params are present', (done) => {
      let instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      instance.submit_job(null, {}).catch((err) => {
        assert.equal(err.message, 'Please ensure that you send through partner params')
        done();
      });
    });

    it('should ensure that the partner_params are an object', (done) => {
      let instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      instance.submit_job('not partner params', {}).catch((err) => {
        assert.equal(err.message, 'Partner params needs to be an object')
        done();
      });
    });

    it('should ensure that the partner_params contain user_id, job_id and job_type', (done) => {
      let instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      ['user_id', 'job_id', 'job_type'].forEach((key) => {
        let partner_params = {
          user_id: '1',
          job_id: '1',
          job_type: 5
        };
        delete partner_params[key];
        instance.submit_job(partner_params, {}, {}, {return_job_status: true}).catch((err) => {
          assert.equal(err.message, `Please make sure that ${key} is included in the partner params`);
        });
      });
      done();
    });

    it('should ensure that in partner_params, user_id, job_id, and job_type are not emptystrings', (done) => {
      let instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      ['user_id', 'job_id', 'job_type'].forEach((key) => {
        let partner_params = {
          user_id: '1',
          job_id: '1',
          job_type: 5
        };
        partner_params[key] = '';
        instance.submit_job(partner_params, {}, {}, {return_job_status: true}).catch((err) => {
          assert.equal(err.message, `Please make sure that ${key} is included in the partner params`);
        });
      });
      done();
    });

    it('should ensure that the id_info is an object', (done) => {
      let instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      instance.submit_job({user_id: '1', job_id: '1', job_type: 5}, '').catch((err) => {
        assert.equal(err.message, 'ID Info needs to be an object')
        done();
      });
    });

    it('should ensure that the id_info object is not empty or nil', (done) => {
      let instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      instance.submit_job({user_id: '1', job_id: '1', job_type: 5}, {}).catch((err) => {
        assert.equal(err.message, 'Please make sure that id_info not empty or nil')
        done();
      });
    });

    it('should ensure that the id_info object is not empty or nil', (done) => {
      let instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      instance.submit_job({user_id: '1', job_id: '1', job_type: 5}, {id_number: ''}).catch((err) => {
        assert.equal(err.message, 'Please provide an id_number in the id_info payload')
        done();
      });
    });

    it('should ensure that the the job id is set to 5', (done) => {
      let instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 4
      };
      instance.submit_job(partner_params, null).catch((err) => {
        assert.equal(err.message, 'Please ensure that you are setting your job_type to 5 to query ID Api')
        done();
      });
    });

    it('should be able to send a job', (done) => {
      let instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 5
      };
      let id_info = {
        first_name: 'John',
        last_name: 'Doe',
        middle_name: '',
        country: 'NG',
        id_type: 'BVN',
        id_number: '00000000000',
        phone_number: '0726789065'
      };
      let IDApiResponse = {
        "JSONVersion": "1.0.0",
        "SmileJobID": "0000001096",
        "PartnerParams": {
            "user_id": "dmKaJazQCziLc6Tw9lwcgzLo",
            "job_id": "DeXyJOGtaACFFfbZ2kxjuICE",
            "job_type": 5
        },
        "ResultType": "ID Verification",
        "ResultText": "ID Number Validated",
        "ResultCode": "1012",
        "IsFinalResult": "true",
        "Actions": {
          "Verify_ID_Number": "Verified",
          "Return_Personal_Info": "Returned"
        },
        "Country": "NG",
        "IDType": "BVN",
        "IDNumber": "00000000000",
        "ExpirationDate": "NaN-NaN-NaN",
        "FullName": "some  person",
        "DOB": "NaN-NaN-NaN",
        "Photo": "Not Available",
        "sec_key": "RKYX2ZVpvNTFW8oXdN3iTvQcefV93VMo18LQ/Uco0=|7f0b0d5ebc3e5499c224f2db478e210d1860f01368ebc045c7bbe6969f1c08ba",
        "timestamp": 1570612182124
      };

      nock('https://testapi.smileidentity.com')
        .post('/v1/id_verification', (body) => {
          assert.equal(body.partner_id, '001');
          assert.notEqual(body.sec_key, undefined);
          assert.notEqual(body.timestamp, undefined);
          assert.equal(body.partner_params.user_id, partner_params.user_id);
          assert.equal(body.partner_params.job_id, partner_params.job_id);
          assert.equal(body.partner_params.job_type, partner_params.job_type);
          assert.equal(body.first_name, id_info.first_name);
          assert.equal(body.last_name, id_info.last_name);
          assert.equal(body.middle_name, id_info.middle_name);
          assert.equal(body.country, id_info.country);
          assert.equal(body.id_type, id_info.id_type);
          assert.equal(body.id_number, id_info.id_number);
          assert.equal(body.phone_number, id_info.phone_number);
          return true;
        })
        .reply(200, IDApiResponse)
        .isDone();

      let promise = instance.submit_job(partner_params, id_info);
      promise.then((resp) => {
        assert.deepEqual(Object.keys(resp).sort(), ['JSONVersion', 'SmileJobID', 'PartnerParams', 'ResultType', 'ResultText', 'ResultCode', 'IsFinalResult', 'Actions', 'Country', 'IDType', 'IDNumber', 'ExpirationDate', 'FullName', 'DOB', 'Photo', 'sec_key', 'timestamp'].sort());
        done();
      });
    });

    it('should raise an error when a network call fails', (done) => {
      let instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 5
      };
      let id_info = {
        first_name: 'John',
        last_name: 'Doe',
        middle_name: '',
        country: 'NG',
        id_type: 'BVN',
        id_number: '00000000000',
        phone_number: '0726789065'
      };

      nock('https://testapi.smileidentity.com')
        .post('/v1/id_verification')
        .replyWithError(400, {
          code: '2204',
          error: 'unauthorized'
        })
        .isDone();

      instance.submit_job(partner_params, id_info).then((resp) => {
        assert.equal(false);
      }).catch((err) => {
        // todo: figure out how to get nook to act like an error response would in real life
        // err.message in this case should be '2204:unauthorized'
        assert.equal(err.message, undefined);
      });

      done();
    });

    it('should use the signature instead of sec_key when provided an optional parameter', (done) => {
      let instance = new IDApi('001', '1234', 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 5
      };
      let id_info = {
        first_name: 'John',
        last_name: 'Doe',
        middle_name: '',
        country: 'NG',
        id_type: 'BVN',
        id_number: '00000000000',
        phone_number: '0726789065'
      };
      let IDApiResponse = {
        "JSONVersion": "1.0.0",
        "SmileJobID": "0000001096",
        "PartnerParams": {
            "user_id": "dmKaJazQCziLc6Tw9lwcgzLo",
            "job_id": "DeXyJOGtaACFFfbZ2kxjuICE",
            "job_type": 5
        },
        "ResultType": "ID Verification",
        "ResultText": "ID Number Validated",
        "ResultCode": "1012",
        "IsFinalResult": "true",
        "Actions": {
          "Verify_ID_Number": "Verified",
          "Return_Personal_Info": "Returned"
        },
        "Country": "NG",
        "IDType": "BVN",
        "IDNumber": "00000000000",
        "ExpirationDate": "NaN-NaN-NaN",
        "FullName": "some  person",
        "DOB": "NaN-NaN-NaN",
        "Photo": "Not Available",
        "signature": "RKYX2ZVpvNTFW8oXdN3iTvQcefV93VMo18LQ/Uco0=",
        "timestamp": 1570612182124
      };

      nock('https://testapi.smileidentity.com')
        .post('/v1/id_verification', (body) => {
          assert.equal(body.partner_id, '001');
          assert.notEqual(body.signature, undefined);
          assert.notEqual(body.timestamp, undefined);
          assert.equal(body.partner_params.user_id, partner_params.user_id);
          assert.equal(body.partner_params.job_id, partner_params.job_id);
          assert.equal(body.partner_params.job_type, partner_params.job_type);
          assert.equal(body.first_name, id_info.first_name);
          assert.equal(body.last_name, id_info.last_name);
          assert.equal(body.middle_name, id_info.middle_name);
          assert.equal(body.country, id_info.country);
          assert.equal(body.id_type, id_info.id_type);
          assert.equal(body.id_number, id_info.id_number);
          assert.equal(body.phone_number, id_info.phone_number);
          return true;
        })
        .reply(200, IDApiResponse)
        .isDone();

      let promise = instance.submit_job(partner_params, id_info, {signature: true});
      promise.then((resp) => {
        assert.deepEqual(Object.keys(resp).sort(), ['JSONVersion', 'SmileJobID', 'PartnerParams', 'ResultType', 'ResultText', 'ResultCode', 'IsFinalResult', 'Actions', 'Country', 'IDType', 'IDNumber', 'ExpirationDate', 'FullName', 'DOB', 'Photo', 'signature', 'timestamp'].sort());
        done();
      });
    });

  });

});
