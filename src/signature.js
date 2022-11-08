const crypto = require('crypto');

const generate_signature = (partnerID, apiKey, timestamp) => {
  if (typeof timestamp === 'number') {
    timestamp = new Date(timestamp).toISOString();
  }
  const hmac = crypto.createHmac('sha256', apiKey);
  hmac.update(timestamp, 'utf8');
  hmac.update(partnerID, 'utf8');
  hmac.update('sid_request', 'utf8');
  return hmac.digest().toString('base64');
};

class Signature {
  /**
   *
   * @param {string} partnerID
   * @param {string} apiKey
   */
  constructor(partnerID, apiKey) {
    this.partnerID = partnerID;
    this.apiKey = apiKey;
  }

  /**
   *
   * @param {string|number|undefined} timestamp
   * @returns
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
