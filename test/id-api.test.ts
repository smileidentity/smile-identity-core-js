import keypair from 'keypair';
import nock from 'nock';
import * as packageJson from '../package.json';
import businessVerificationResp from './fixtures/business_verification_response.json';

import { IDApi, Signature, JOB_TYPE } from '..';

const pair = keypair();

describe('IDapi', () => {
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

  describe('#new', () => {
    it('should instantiate and set the global variables', () => {
      expect.assertions(3);
      const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      expect(instance.partner_id).toEqual('001');
      expect(instance.api_key).toEqual(Buffer.from(pair.public).toString('base64'));
      expect(instance.url).toEqual('testapi.smileidentity.com/v1');
    });
  });

  describe('#submit_job', () => {
    it('should ensure that the partner_params are present', async () => {
      expect.assertions(1);
      const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      // @ts-ignore
      await expect(instance.submit_job(null, {})).rejects.toThrow(new Error('Please ensure that you send through partner params'));
    });

    it('should ensure that the partner_params are an object', async () => {
      expect.assertions(1);
      const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      // @ts-ignore
      await expect(instance.submit_job('not partner params', {})).rejects.toThrow(new Error('Partner params needs to be an object'));
    });

    ['user_id', 'job_id', 'job_type'].forEach((key) => {
      const partner_params = { user_id: '1', job_id: '1', job_type: 5 };
      partner_params[key] = '';

      it(`should ensure that partner_params contains ${key}`, async () => {
        expect.assertions(1);
        const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
        await expect(instance.submit_job(partner_params, {})).rejects.toThrow(new Error(`Please make sure that ${key} is included in the partner params`));
      });

      it(`should ensure that in partner_params, ${key} is not an empty string`, async () => {
        expect.assertions(1);
        const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
        await expect(instance.submit_job(partner_params, {})).rejects.toThrow(new Error(`Please make sure that ${key} is included in the partner params`));
      });
    });

    it('should ensure that the id_info is an object', async () => {
      expect.assertions(1);
      const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      // @ts-ignore
      await expect(instance.submit_job({ user_id: '1', job_id: '1', job_type: 5 }, '')).rejects.toThrow(new Error('ID Info needs to be an object'));
    });

    it('should ensure that the id_info object is not empty or nil', async () => {
      expect.assertions(1);
      const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      await expect(instance.submit_job({ user_id: '1', job_id: '1', job_type: 5 }, {})).rejects.toThrow(new Error('Please make sure that id_info not empty or nil'));
    });

    it('should ensure that the id_info object contains a valid id_number as a string', async () => {
      expect.assertions(1);
      const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      await expect(instance.submit_job({ user_id: '1', job_id: '1', job_type: 5 }, { id_number: '' })).rejects.toThrow(new Error('Please provide an id_number in the id_info payload'));
    });

    it('should ensure that the the job id is set to 5', async () => {
      expect.assertions(1);
      const instance = new IDApi('001', Buffer.from(pair.public).toString('base64'), 0);
      const partner_params = { user_id: '1', job_id: '1', job_type: 4 };
      // @ts-ignore
      await expect(instance.submit_job(partner_params, null)).rejects.toThrow(new Error('Please ensure that you are setting your job_type to 5 or 7 to query ID Api'));
    });

    it('should be able to send a job', async () => {
      expect.assertions(17);
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
      const timestamp = new Date().toISOString();
      const mockApiKey = Buffer.from(pair.public).toString('base64');

      const idApiResponse = {
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
        ...new Signature('001', mockApiKey).generate_signature(timestamp),
      };

      const scope = nock('https://testapi.smileidentity.com').post('/v1/id_verification', (body) => {
        expect(body.partner_id).toEqual('001');
        expect(typeof body.signature).toEqual('string');
        expect(typeof body.timestamp).toEqual('string');
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
        expect(body.source_sdk).toEqual('javascript');
        expect(body.source_sdk_version).toEqual(packageJson.version);
        return true;
      }).reply(200, idApiResponse);

      const instance = new IDApi('001', mockApiKey, 0);

      const response = await instance.submit_job(partner_params, id_info);
      expect(Object.keys(response).sort()).toEqual([
        'JSONVersion', 'SmileJobID', 'PartnerParams', 'ResultType',
        'ResultText', 'ResultCode', 'IsFinalResult', 'Actions',
        'Country', 'IDType', 'IDNumber', 'ExpirationDate',
        'FullName', 'DOB', 'Photo', 'signature', 'timestamp',
      ].sort());
      expect(scope.isDone()).toBe(true);
    });

    it('should raise an error when a network call fails', async () => {
      expect.assertions(3);
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

      const scope = nock('https://testapi.smileidentity.com').post('/v1/id_verification').replyWithError({
        code: '2204',
        error: 'unauthorized',
      });

      let response;
      let error;
      try {
        response = await instance.submit_job(partner_params, id_info);
      } catch (e) {
        error = e;
      }
      // todo: figure out how to get nook to act like an error response would in real life
      // err.message in this case should be '2204:unauthorized'
      expect(error.message).toBeUndefined();
      expect(response).toEqual(undefined);
      expect(scope.isDone()).toBe(true);
    });
  });

  describe('business_verification', () => {
    it('successfully sends a business verification job', async () => {
      expect.assertions(3);
      const instance = new IDApi('001', 'api_key', 0);
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

      const postMock = jest.fn(() => true);
      const scope = nock('https://testapi.smileidentity.com')
        .post('/v1/business_verification', postMock)
        .reply(200, businessVerificationResp.success);

      const resp = await instance.submit_job(partner_params, id_info);
      expect(resp.data).toEqual(businessVerificationResp.success);
      expect(scope.isDone()).toBe(true);
      expect(postMock).toHaveBeenCalledWith({
        api_key: 'api_key',
        business_type: id_info.business_type,
        country: id_info.country,
        id_number: id_info.id_number,
        id_type: id_info.id_type,
        partner_id: '001',
        timestamp: expect.any(String),
        signature: expect.any(String),
        partner_params,
      });
    });

    it('report an error on unsuccessfull business verification', async () => {
      expect.assertions(2);
      const instance = new IDApi('001', 'api_key', 0);
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

      const scope = nock('https://testapi.smileidentity.com')
        .post('/v1/business_verification', () => true)
        .reply(400, businessVerificationResp.unsupported_business_type);

      const promise = instance.submit_job(partner_params, id_info);
      await expect(promise).rejects.toThrow(new Error('Request failed with status code 400'));
      expect(scope.isDone()).toBe(true);
    });
  });
});
