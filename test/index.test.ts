import * as smileIdentityCore from '..';

describe('smile-identity-core', () => {
  it('should export an object', () => {
    expect(typeof smileIdentityCore).toBe('object');
    expect(smileIdentityCore).not.toBeNull();
  });

  it('should export four classes', () => {
    expect(smileIdentityCore.Signature).toBeInstanceOf(Function);
    expect(smileIdentityCore.Utilities).toBeInstanceOf(Function);
    expect(smileIdentityCore.WebApi).toBeInstanceOf(Function);
    expect(smileIdentityCore.IDApi).toBeInstanceOf(Function);
    expect(smileIdentityCore.IMAGE_TYPE).toBeInstanceOf(Object);
    expect(smileIdentityCore.JOB_TYPE).toBeInstanceOf(Object);
    expect(Object.keys(smileIdentityCore)).toHaveLength(6);
    expect(Object.keys(smileIdentityCore.IMAGE_TYPE)).toHaveLength(8);
    expect(Object.keys(smileIdentityCore.JOB_TYPE)).toHaveLength(10);
  });

  it('should run in node and not in the browser', () => {
    expect(typeof process).toBe('object');
    expect(typeof window).toBe('undefined');
  });

  describe('smile-identity-core no browser support', () => {
    beforeAll(() => {
      jest.resetModules();
      global.window = {};
      console.warn = jest.fn();
      require('..'); // eslint-disable-line global-require
    });

    it('should throw an error when run in a browser', () => {
      expect(console.warn).toHaveBeenCalledWith(
        'This is a server-side library meant for a node.js (or compatible) runtime, and is not meant to work in the browser.',
      );
    });
  });
});
