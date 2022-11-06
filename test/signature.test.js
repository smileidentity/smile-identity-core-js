const crypto = require('crypto');
const keypair = require('keypair');

const { Signature } = require('..');

const pair = keypair();

const mockApiKey = Buffer.from(pair.public).toString('base64');

// test that the sec key is generated correctly
describe('Signature', () => {
  let signer;

  beforeEach(() => {
    signer = new Signature('001', mockApiKey);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#new', () => {
    it('should set the partner_id and api_key values', () => {
      expect.assertions(2);
      expect(signer.partnerID).toEqual('001');
      expect(signer.apiKey).toEqual(mockApiKey);
    });
  });

  describe('#generate_sec_key', () => {
    it('should create a sec_key', () => {
      expect.assertions(4);
      const timestamp = Date.now();
      const signature = signer.generate_sec_key(timestamp);
      const hash = crypto.createHash('sha256').update(`${1}:${timestamp}`).digest('hex');
      const decrypted = crypto.privateDecrypt({
        key: Buffer.from(pair.private),
        padding: crypto.constants.RSA_PKCS1_PADDING,
      }, Buffer.from(signature.sec_key.split('|')[0], 'base64')).toString();

      expect(hash).toEqual(signature.sec_key.split('|')[1]);
      expect(typeof signature).toEqual('object');
      expect(timestamp).toEqual(signature.timestamp);
      expect(decrypted).toEqual(hash);
    });
  });

  describe('#confirm_sec_key', () => {
    it('should be able to decode a valid sec_key', () => {
      expect.assertions(1);
      const timestamp = Date.now();
      const hash = crypto.createHash('sha256').update(`${1}:${timestamp}`).digest('hex');
      const encrypted = crypto.privateEncrypt({
        key: Buffer.from(pair.private),
        padding: crypto.constants.RSA_PKCS1_PADDING,
      }, Buffer.from(hash)).toString('base64');
      const secKey = [encrypted, hash].join('|');
      expect(signer.confirm_sec_key(timestamp, secKey)).toEqual(true);
    });
  });

  describe('#generate_signature', () => {
    it('should calculate a signature and use a timestamp if provided one', () => {
      expect.assertions(1);
      const timestamp = new Date().toISOString();
      const hmac = crypto.createHmac('sha256', mockApiKey);
      hmac.update(timestamp, 'utf8').update('001', 'utf8').update('sid_request', 'utf8');
      const output = hmac.digest().toString('base64');
      const result = signer.generate_signature(timestamp);
      expect(result).toEqual({ signature: output, timestamp });
    });
  });

  describe('#confirm_signature', () => {
    it('should confirm an incoming signature', () => {
      expect.assertions(1);
      const timestamp = new Date().toISOString();
      const hmac = crypto.createHmac('sha256', mockApiKey);
      hmac.update(timestamp, 'utf8').update('001', 'utf8').update('sid_request', 'utf8');
      const output = hmac.digest().toString('base64');
      expect(signer.confirm_signature(timestamp, output)).toEqual(true);
    });
  });
});
