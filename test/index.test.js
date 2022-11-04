const assert = require('assert');
const smileIdentityCore = require('..');

describe('smile-identity-core', () => {
  it('should export an object', () => {
    assert.equal(typeof smileIdentityCore, 'object');
  });

  it('should export four classes and three objects', () => {
    assert.equal(typeof smileIdentityCore.Signature, 'function');
    assert.equal(typeof smileIdentityCore.Utilities, 'function');
    assert.equal(typeof smileIdentityCore.WebApi, 'function');
    assert.equal(typeof smileIdentityCore.IDApi, 'function');
    assert.equal(typeof smileIdentityCore.ENV, 'object');
    assert.equal(typeof smileIdentityCore.IMAGE_TYPE, 'object');
    assert.equal(typeof smileIdentityCore.JOB_TYPE, 'object');
    assert.equal(Object.keys(smileIdentityCore).length, 7);
  });

  it('should run in node and not in the browser', () => {
    assert.equal(typeof process, 'object');
    assert.equal(typeof window, 'undefined');
  });
});
