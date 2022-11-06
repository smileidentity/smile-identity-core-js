const assert = require('assert');
const { getSdkVersionInfo, mapServerUri } = require('../src/helpers');

describe('helpers', () => {

  it('getSdkVersionInfo', () => {
    const sdkVersionInfo = getSdkVersionInfo();
    assert.equal(sdkVersionInfo.sdk, 'node');
    assert.ok(sdkVersionInfo.sdk_version.match(/^\d+\.\d+\.\d+$/));
    assert(Object.keys(sdkVersionInfo).length === 2);
  });

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
});
