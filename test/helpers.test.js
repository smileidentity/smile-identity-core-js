const assert = require('assert');
const { mapServerUri, sdkVersionInfo } = require('../src/helpers');

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
    assert.ok(sdkVersionInfo.source_sdk_version.match(/^1\./)); // assert that we are at version 1
    assert(Object.keys(sdkVersionInfo).length === 2);
  });
});
