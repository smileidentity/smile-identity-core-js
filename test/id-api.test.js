const keypair = require('keypair');
const nock = require('nock');

const { IDApi } = require('..');

const pair = keypair();

describe('IDapi', () => {
  describe('#new', () => {
    it('should instantiate and set the global variables', () => {
      const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      expect(instance.partner_id).toEqual('001');
      expect(instance.api_key).toEqual(Buffer.from(pair.public).toString('base64'));
      expect(instance.url).toEqual('testapi.smileidentity.com/v1');
    });
  });

  describe('#submit_job', () => {
    it('should ensure that the partner_params are present', async () => {
      const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      await expect(instance.submit_job(null, {})).rejects.toThrow(new Error('Please ensure that you send through partner params'));
    });

    it('should ensure that the partner_params are an object', async () => {
      const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      await expect(instance.submit_job('not partner params', {})).rejects.toThrow(new Error('Partner params needs to be an object'));
    });

    ['user_id', 'job_id', 'job_type'].forEach((key) => {
      const partner_params = { user_id: '1', job_id: '1', job_type: 5 };
      partner_params[key] = '';

      it(`should ensure that partner_params contains ${key}`, async () => {
        const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
        await expect(instance.submit_job(partner_params, {}, {}, { return_job_status: true })).rejects.toThrow(new Error(`Please make sure that ${key} is included in the partner params`));
      });

      it(`should ensure that in partner_params, ${key} is not an empty string`, async () => {
        const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
        await expect(instance.submit_job(partner_params, {}, {}, { return_job_status: true })).rejects.toThrow(new Error(`Please make sure that ${key} is included in the partner params`));
      });
    });

    it('should ensure that the id_info is an object', async () => {
      const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      await expect(instance.submit_job({ user_id: '1', job_id: '1', job_type: 5 }, '')).rejects.toThrow(new Error('ID Info needs to be an object'));
    });

    it('should ensure that the id_info object is not empty or nil', async () => {
      const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      await expect(instance.submit_job({ user_id: '1', job_id: '1', job_type: 5 }, {})).rejects.toThrow(new Error('Please make sure that id_info not empty or nil'));
    });

    it('should ensure that the id_info object contains a valid id_number as a string', async () => {
      const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      await expect(instance.submit_job({ user_id: '1', job_id: '1', job_type: 5 }, { id_number: '' })).rejects.toThrow(new Error('Please provide an id_number in the id_info payload'));
    });

    it('should ensure that the the job id is set to 5', async () => {
      const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = { user_id: '1', job_id: '1', job_type: 4 };
      await expect(instance.submit_job(partner_params, null)).rejects.toThrow(new Error('Please ensure that you are setting your job_type to 5 to query ID Api'));
    });

    it('should be able to send a job', async () => {
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

      nock('https://testapi.smileidentity.com').post('/v1/id_verification', (body) => {
        expect(body.partner_id).toEqual('001');
        expect(body.sec_key).not.toEqual(undefined);
        expect(body.timestamp).not.toEqual(undefined);
        expect(body.partner_params.user_id).toEqual(partner_params.user_id);
        expect(body.partner_params.job_id).toEqual(partner_params.job_id);
        expect(body.partner_params.job_type).toEqual(partner_params.job_type);
        expect(body.first_name).toEqual(id_info.first_name);
        expect(body.last_name).toEqual(id_info.last_name);
        expect(body.middle_name).toEqual(id_info.middle_name);
        expect(body.country).toEqual(id_info.country);
        expect(body.id_type).toEqual(id_info.id_type);
        expect(body.id_number).toEqual(id_info.id_number);
        expect(body.phone_number).toEqual(id_info.phone_number);
        return true;
      }).reply(200, IDApiResponse).isDone();

      const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);

      const response = await instance.submit_job(partner_params, id_info);
      expect(Object.keys(response).sort()).toEqual([
        'JSONVersion', 'SmileJobID', 'PartnerParams', 'ResultType',
        'ResultText', 'ResultCode', 'IsFinalResult', 'Actions',
        'Country', 'IDType', 'IDNumber', 'ExpirationDate',
        'FullName', 'DOB', 'Photo', 'sec_key', 'timestamp',
      ].sort());
      expect.assertions(14);
    });

    it('should raise an error when a network call fails', async () => {
      const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
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

      nock('https://testapi.smileidentity.com').post('/v1/id_verification').replyWithError(400, {
        code: '2204',
        error: 'unauthorized',
      }).isDone();

      let response;
      let error;
      try {
        response = await instance.submit_job(partner_params, id_info);
      } catch (e) {
        error = e;
      }
      // todo: figure out how to get nook to act like an error response would in real life
      // err.message in this case should be '2204:unauthorized'
      expect(error).toEqual('undefined:undefined');
      expect(response).toEqual(undefined);
      expect.assertions(2);
    });

    it('should use the signature instead of sec_key when provided an optional parameter', async () => {
      const instance = new IDApi('001', '1234', 0);
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
        signature: 'RKYX2ZVpvNTFW8oXdN3iTvQcefV93VMo18LQ/Uco0=',
        timestamp: 1570612182124,
      };

      nock('https://testapi.smileidentity.com').post('/v1/id_verification', (body) => {
        expect(body.partner_id).toEqual('001');
        expect(body.signature).not.toEqual(undefined);
        expect(body.timestamp).not.toEqual(undefined);
        expect(body.partner_params.user_id).toEqual(partner_params.user_id);
        expect(body.partner_params.job_id).toEqual(partner_params.job_id);
        expect(body.partner_params.job_type).toEqual(partner_params.job_type);
        expect(body.first_name).toEqual(id_info.first_name);
        expect(body.last_name).toEqual(id_info.last_name);
        expect(body.middle_name).toEqual(id_info.middle_name);
        expect(body.country).toEqual(id_info.country);
        expect(body.id_type).toEqual(id_info.id_type);
        expect(body.id_number).toEqual(id_info.id_number);
        expect(body.phone_number).toEqual(id_info.phone_number);
        return true;
      }).reply(200, IDApiResponse).isDone();

      const response = await instance.submit_job(partner_params, id_info, { signature: true });

      expect(Object.keys(response).sort()).toEqual([
        'JSONVersion', 'SmileJobID', 'PartnerParams', 'ResultType',
        'ResultText', 'ResultCode', 'IsFinalResult', 'Actions',
        'Country', 'IDType', 'IDNumber', 'ExpirationDate', 'FullName',
        'DOB', 'Photo', 'signature', 'timestamp',
      ].sort());

      expect.assertions(14);
    });
  });
});
