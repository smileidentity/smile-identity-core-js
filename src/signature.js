const crypto = require('crypto');

/**
 * Generate a signature for the given input.
 *
 * @param {string} partnerID - Smile partner ID. This is a unique identifier
 * for your Smile account.
 * @param {string} apiKey - Smile API Key. Found in the Smile Dashboard.
 * @param {string|number} timestamp - ISO 8601 timestamp or unix timestamp.
 * @returns {string} the calculated signature.
 */
const generate_signature = (partnerID, apiKey, timestamp) => {
  const isoTimestamp = typeof timestamp === 'number' ? new Date(timestamp).toISOString() : timestamp;
  // validates that the timestamp is a valid ISO 8601 timestamp.
  new Date(isoTimestamp).toISOString(); // eslint-disable-line no-new
  const hmac = crypto.createHmac('sha256', apiKey);
  hmac.update(isoTimestamp, 'utf8');
  hmac.update(partnerID, 'utf8');
  hmac.update('sid_request', 'utf8');
  return hmac.digest().toString('base64');
};

/* A class to generate signatures for a given partner ID and API key. */
class Signature {
  /**
   * Instantiates a new Signature object.
   *
   * @param {string} partnerID - Smile Partner ID. This is a unique identifier
   * for your Smile account.
   * @param {string} apiKey - Smile API Key. Found in the Smile Dashboard.
   */
  constructor(partnerID, apiKey) {
    this.partnerID = partnerID;
    this.apiKey = apiKey;
  }

  /**
   * Generates a signature for a given timestamp.
   *
   * @param {string|number|undefined} timestamp - A valid ISO 8601 timestamp or unix time in
   * milliseconds. If undefined, the current time will be used.
   * @returns {{
   *  signature: string,
   *  timestamp: number,
   * }} - An object containing the signature and timestamp.
   * @throws {Error} - If the timestamp is invalid.
   */
  generate_signature(timestamp = new Date().toISOString()) {
    return {
      signature: generate_signature(this.partnerID, this.apiKey, timestamp),
      timestamp,
    };
  }

  confirm_signature(timestamp, signature) {
    return generate_signature(this.partnerID, this.apiKey, timestamp) === signature;
  }
}

module.exports = Signature;
