const assert = require('assert');
const { mapServerUri } = require('../src/helpers');

describe('helpers', () => {
  it('mapServerUri', () => {
    const validTestCases = [
      { input: 0, expected: 'testapi.smileidentity.com/v1' },
      { input: 1, expected: 'api.smileidentity.com/v1' },
      { input: '0', expected: 'testapi.smileidentity.com/v1' },
      { input: '1', expected: 'api.smileidentity.com/v1' },
      { input: 'testapi.smileidentity.com/v1', expected: 'testapi.smileidentity.com/v1' },
      { input: 'api.smileidentity.com/v1', expected: 'api.smileidentity.com/v1' },
      { input: 'https://testapi.smileidentity.com/v1', expected: 'https://testapi.smileidentity.com/v1' },
      { input: '10.0.0.1', expected: '10.0.0.1' },
    ];

    validTestCases.forEach((testCase) => {
      assert.equal(mapServerUri(testCase.input), testCase.expected);
    });

    const invalidTestCases = [
      '',
      ' ',
      'https://',
      null,
      undefined,
      2,
    ];
    invalidTestCases.forEach((testCase) => {
      assert.throws(() => mapServerUri(testCase), TypeError('Invalid URL'), testCase);
    });
  });
});
