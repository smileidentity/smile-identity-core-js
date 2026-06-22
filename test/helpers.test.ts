import {
  mapServerUri,
  sdkVersionInfo,
  validatePartnerParams,
} from '../src/helpers.js';

describe('helpers', () => {
  it('mapServerUri', () => {
    const testCases = [
      { input: '0', expected: 'https://testapi.smileidentity.com/v1' },
      { input: '1', expected: 'https://api.smileidentity.com/v1' },
      { input: 0, expected: 'https://testapi.smileidentity.com/v1' },
      { input: 1, expected: 'https://api.smileidentity.com/v1' },
      { input: 2, expected: 'https://2' },
      {
        input: 'testapi.smileidentity.com/v1',
        expected: 'https://testapi.smileidentity.com/v1',
      },
      {
        input: 'api.smileidentity.com/v1',
        expected: 'https://api.smileidentity.com/v1',
      },
      {
        input: 'https://testapi.smileidentity.com/v1',
        expected: 'https://testapi.smileidentity.com/v1',
      },
      { input: '10.0.0.1', expected: 'https://10.0.0.1' },
      { input: undefined, expected: undefined },
      { input: null, expected: null },
    ];

    testCases.forEach((testCase) => {
      // @ts-ignore
      expect(mapServerUri(testCase.input)).toEqual(testCase.expected);
    });
  });

  it('sdkVersionInfo', () => {
    expect(typeof sdkVersionInfo).toEqual('object');
    expect(sdkVersionInfo.source_sdk).toEqual('javascript');
    expect(sdkVersionInfo.source_sdk_version).toMatch(
      /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
    );
    expect(sdkVersionInfo.source_sdk_version).toMatch(/^3\./); // assert that we are at version 3
    expect(Object.keys(sdkVersionInfo).length).toEqual(2);
  });

  it('validatePartnerParams', () => {
    const testCases = [
      {
        input: null,
        expected: 'Please ensure that you send through partner params',
      },
      {
        input: undefined,
        expected: 'Please ensure that you send through partner params',
      },
      {
        input: '{ "user_id": "123" }',
        expected: 'Partner params needs to be an object',
      },
      {
        input: {},
        expected:
          'Please make sure that user_id is included in the partner params',
      },
      {
        input: { job_id: '123' },
        expected:
          'Please make sure that user_id is included in the partner params',
      },
      {
        input: { user_id: '123' },
        expected:
          'Please make sure that job_id is included in the partner params',
      },
      {
        input: { user_id: '123', job_id: '123' },
        expected:
          'Please make sure that job_type is included in the partner params',
      },
      {
        input: { user_id: '123', job_id: '123', job_type: '123' },
        expected: null,
      },
    ];

    testCases.forEach((testCase) => {
      let error = { message: null };
      try {
        // @ts-ignore
        validatePartnerParams(testCase.input);
      } catch (err) {
        error = err;
      }
      expect(error.message).toEqual(testCase.expected);
    });
  });
});
