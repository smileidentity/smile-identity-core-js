const assert = require('assert');
const { mapServerUri, sdkVersionInfo, validatePartnerParams } = require('../src/helpers');

describe('helpers', () => {
  it('mapServerUri', () => {
    const testCases = [
      { input: '0', expected: 'testapi.smileidentity.com/v1' },
      { input: '1', expected: 'api.smileidentity.com/v1' },
      { input: 0, expected: 'testapi.smileidentity.com/v1' },
      { input: 1, expected: 'api.smileidentity.com/v1' },
      { input: 2, expected: 2 }, // pass through values not in map.
      { input: 'testapi.smileidentity.com/v1', expected: 'testapi.smileidentity.com/v1' },
      { input: 'api.smileidentity.com/v1', expected: 'api.smileidentity.com/v1' },
      { input: 'https://testapi.smileidentity.com/v1', expected: 'https://testapi.smileidentity.com/v1' },
      { input: '10.0.0.1', expected: '10.0.0.1' },
      { input: undefined, expected: undefined },
      { input: null, expected: null },
    ];

    testCases.forEach((testCase) => {
      assert.equal(mapServerUri(testCase.input), testCase.expected);
    });
  });

  it('sdkVersionInfo', () => {
    assert.equal(typeof sdkVersionInfo, 'object');
    assert.equal(sdkVersionInfo.source_sdk, 'javascript');
    assert.ok(sdkVersionInfo.source_sdk_version.match(/^\d+\.\d+\.\d+$/));
    assert.ok(sdkVersionInfo.source_sdk_version.match(/^2\./)); // assert that we are at version 1
    assert(Object.keys(sdkVersionInfo).length === 2);
  });

  it('validatePartnerParams', () => {
    const testCases = [
      { input: null, expected: 'Please ensure that you send through partner params' },
      { input: undefined, expected: 'Please ensure that you send through partner params' },
      { input: '{ "user_id": "123" }', expected: 'Partner params needs to be an object' },
      { input: {}, expected: 'Please make sure that user_id is included in the partner params' },
      { input: { job_id: '123' }, expected: 'Please make sure that user_id is included in the partner params' },
      { input: { user_id: '123' }, expected: 'Please make sure that job_id is included in the partner params' },
      { input: { user_id: '123', job_id: '123' }, expected: 'Please make sure that job_type is included in the partner params' },
      { input: { user_id: '123', job_id: '123', job_type: '123' }, expected: null },
    ];

    testCases.forEach((testCase) => {
      let error = { message: null };
      try {
        validatePartnerParams(testCase.input);
      } catch (err) {
        error = err;
      }
      assert.equal(error.message, testCase.expected, JSON.stringify(testCase.input));
    });
  });
});
