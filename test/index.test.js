const smileIdentityCore = require('..');

describe('smile-identity-core', () => {
  it('should export an object', () => {
    expect(smileIdentityCore).toBeInstanceOf(Object);
  });

  it('should export four classes', () => {
    expect(smileIdentityCore.Signature).toBeInstanceOf(Function);
    expect(smileIdentityCore.Utilities).toBeInstanceOf(Function);
    expect(smileIdentityCore.WebApi).toBeInstanceOf(Function);
    expect(smileIdentityCore.IDApi).toBeInstanceOf(Function);
    expect(Object.keys(smileIdentityCore)).toHaveLength(4);
  });

  it('should run in node and not in the browser', () => {
    expect(typeof process).toBe('object');
    expect(typeof window).toBe('undefined');
  });
});
