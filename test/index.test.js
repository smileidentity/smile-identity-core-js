const assert = require('assert');
const smileIdentityCore = require('..');

describe('smile-identity-core', () => {
  it('should export a function that returns an object', () => {
    assert.equal(typeof smileIdentityCore, 'object');
  });

  it('should export four classes', () => {
    assert.equal(typeof smileIdentityCore.Signature, 'function');
    assert.equal(typeof smileIdentityCore.Utilities, 'function');
    assert.equal(typeof smileIdentityCore.WebApi, 'function');
    assert.equal(typeof smileIdentityCore.IDApi, 'function');
    assert.equal(Object.keys(smileIdentityCore).length, 4);
  });

  it('should not run in the browser', () => {
    assert.equal(typeof window, 'undefined');
  });

  it('should run in node', () => {
    assert.equal(typeof process, 'object');
  });
});
