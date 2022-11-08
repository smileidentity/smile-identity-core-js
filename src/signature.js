const crypto = require('crypto');

class Signature {
  constructor(partnerID, apiKey) {
    this.partnerID = partnerID;
    this.apiKey = apiKey;
  }

  generate_signature(timestamp = new Date().toISOString()) {
    const hmac = crypto.createHmac('sha256', this.apiKey);
    hmac.update(timestamp, 'utf8');
    hmac.update(this.partnerID, 'utf8');
    hmac.update('sid_request', 'utf8');
    const output = hmac.digest().toString('base64');
    return { signature: output, timestamp };
  }

  confirm_signature(timestamp, signature) {
    return signature === this.generate_signature(timestamp).signature;
  }
}

module.exports = Signature;
