const assert = require('assert');
const keypair = require('keypair');
const nock = require('nock');

const { IDApi } = require('..');

const pair = keypair();

describe('IDapi', () => {
  describe('#new', () => {
    it('should instantiate and set the global variables', (done) => {
      const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      assert.equal(instance.partner_id, '001');
      assert.equal(instance.api_key, Buffer.from(pair.public).toString('base64'));
      assert.equal(instance.url, 'testapi.smileidentity.com/v1');
      done();
    });
  });

  describe('#submit_job', () => {
    it('should ensure that the partner_params are present', (done) => {
      const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      instance.submit_job(null, {}).catch((err) => {
        assert.equal(err.message, 'Please ensure that you send through partner params');
        done();
      });
    });

    it('should ensure that the partner_params are an object', (done) => {
      const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      instance.submit_job('not partner params', {}).catch((err) => {
        assert.equal(err.message, 'Partner params needs to be an object');
        done();
      });
    });

    it('should ensure that the partner_params contain user_id, job_id and job_type', (done) => {
      const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      ['user_id', 'job_id', 'job_type'].forEach((key) => {
        const partner_params = {
          user_id: '1',
          job_id: '1',
          job_type: JOB_TYPE.BASIC_KYC,
        };
        delete partner_params[key];
        instance.submit_job(partner_params, {}, {}, { return_job_status: true }).catch((err) => {
          assert.equal(err.message, `Please make sure that ${key} is included in the partner params`);
        });
      });
      done();
    });

    it('should ensure that in partner_params, user_id, job_id, and job_type are not emptystrings', (done) => {
      const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      ['user_id', 'job_id', 'job_type'].forEach((key) => {
        const partner_params = {
          user_id: '1',
          job_id: '1',
          job_type: JOB_TYPE.BASIC_KYC,
        };
        partner_params[key] = '';
        instance.submit_job(partner_params, {}, {}, { return_job_status: true }).catch((err) => {
          assert.equal(err.message, `Please make sure that ${key} is included in the partner params`);
        });
      });
      done();
    });

    it('should ensure that the id_info is an object', (done) => {
      const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      instance.submit_job({ user_id: '1', job_id: '1', job_type: 5 }, '').catch((err) => {
        assert.equal(err.message, 'ID Info needs to be an object');
        done();
      });
    });

    it('should ensure that the id_info object is not empty or nil', (done) => {
      const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      instance.submit_job({ user_id: '1', job_id: '1', job_type: 5 }, {}).catch((err) => {
        assert.equal(err.message, 'Please make sure that id_info not empty or nil');
        done();
      });
    });

    it('should ensure that the id_info object contains a valid id_number as a string', (done) => {
      const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      instance.submit_job({ user_id: '1', job_id: '1', job_type: 5 }, { id_number: '' }).catch((err) => {
        assert.equal(err.message, 'Please provide an id_number in the id_info payload');
        done();
      });
    });

    it('should ensure that the the job id is set to 5', (done) => {
      const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: JOB_TYPE.SMART_SELFIE_AUTHENTICATION,
      };
      instance.submit_job(partner_params, null).catch((err) => {
        assert.equal(err.message, 'Please ensure that you are setting your job_type to 5 to query ID Api');
        done();
      });
    });

    it('should be able to send a job', (done) => {
      const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
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

      const promise = instance.submit_job(partner_params, id_info);
      promise.then((resp) => {
        assert.deepEqual(Object.keys(resp).sort(), ['JSONVersion', 'SmileJobID', 'PartnerParams', 'ResultType', 'ResultText', 'ResultCode', 'IsFinalResult', 'Actions', 'Country', 'IDType', 'IDNumber', 'ExpirationDate', 'FullName', 'DOB', 'Photo', 'sec_key', 'timestamp'].sort());
        done();
      });
    });

    it('should raise an error when a network call fails', (done) => {
      const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
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

      nock('https://testapi.smileidentity.com')
        .post('/v1/id_verification')
        .replyWithError(400, {
          code: '2204',
          error: 'unauthorized',
        })
        .isDone();

      instance.submit_job(partner_params, id_info).then(() => {
        assert.equal(false);
      }).catch((err) => {
        // todo: figure out how to get nook to act like an error response would in real life
        // err.message in this case should be '2204:unauthorized'
        assert.equal(err.message, undefined);
      });

      done();
    });

    it('should use the signature instead of sec_key when provided an optional parameter', (done) => {
      const instance = new IDApi('001', '1234', 0);
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
        signature: 'RKYX2ZVpvNTFW8oXdN3iTvQcefV93VMo18LQ/Uco0=',
        timestamp: 1570612182124,
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

      const promise = instance.submit_job(partner_params, id_info, { signature: true });
      promise.then((resp) => {
        assert.deepEqual(Object.keys(resp).sort(), ['JSONVersion', 'SmileJobID', 'PartnerParams', 'ResultType', 'ResultText', 'ResultCode', 'IsFinalResult', 'Actions', 'Country', 'IDType', 'IDNumber', 'ExpirationDate', 'FullName', 'DOB', 'Photo', 'signature', 'timestamp'].sort());
        done();
      });
    });
  });
});
