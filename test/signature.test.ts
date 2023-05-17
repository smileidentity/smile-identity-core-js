import crypto from 'crypto';
import keypair from 'keypair';

import { Signature } from '..';

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

  describe('#generate_signature', () => {
    it('should calculate a signature and use a timestamp if provided one', () => {
      expect.assertions(1);
      const timestamp = new Date().toISOString();
      const hmac = crypto.createHmac('sha256', mockApiKey);
      hmac
        .update(timestamp, 'utf8')
        .update('001', 'utf8')
        .update('sid_request', 'utf8');
      const output = hmac.digest().toString('base64');
      const result = signer.generate_signature(timestamp);
      expect(result).toEqual({ signature: output, timestamp });
    });
  });

  it('should generate a signature with a default timestamp', () => {
    const timestamp = new Date().getTime();
    const result = signer.generate_signature(timestamp);
    expect(result.signature).toEqual(expect.any(String));
    expect(result.timestamp).toEqual(expect.any(Number));
    expect(result.timestamp).toBeLessThanOrEqual(new Date().getTime());
  });

  const validTimestampFormats = [
    '2018-01-01T00:00:00.000Z',
    '2018-01-01T00:00:00.000+00:00',
    '2018-01-01T00:00:00.000+0000',
    new Date().toISOString(),
    Date.now(),
    new Date().getTime(),
  ];

  validTimestampFormats.forEach((timestamp) => {
    it(`should generate a signature for valid timestamp ${timestamp}`, () => {
      expect.assertions(1);
      const result = signer.generate_signature(timestamp);
      const isoTimestamp =
        typeof timestamp === 'number'
          ? new Date(timestamp).toISOString()
          : timestamp;
      const hmac = crypto.createHmac('sha256', mockApiKey);
      hmac
        .update(isoTimestamp, 'utf8')
        .update('001', 'utf8')
        .update('sid_request', 'utf8');
      const output = hmac.digest().toString('base64');
      expect(result).toEqual({ signature: output, timestamp });
    });
  });

  const invalidTimestampFormats = [NaN, '', '2018-00-01T00:00:00.000'];

  invalidTimestampFormats.forEach((timestamp) => {
    it(`should throw an error for invalid timestamp ${timestamp}`, () => {
      expect.assertions(2);
      let error;
      let result;

      try {
        result = signer.generate_signature(timestamp);
      } catch (e) {
        error = e;
      }
      expect(result).toBeUndefined();
      expect(error).toEqual(new Error('Invalid time value'));
    });
  });

  describe('#confirm_signature', () => {
    it('should confirm an incoming signature', () => {
      expect.assertions(1);
      const timestamp = new Date().toISOString();
      const hmac = crypto.createHmac('sha256', mockApiKey);
      hmac
        .update(timestamp, 'utf8')
        .update('001', 'utf8')
        .update('sid_request', 'utf8');
      const output = hmac.digest().toString('base64');
      expect(signer.confirm_signature(timestamp, output)).toEqual(true);
    });
  });
});
