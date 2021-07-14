"use strict";
const crypto = require('crypto');

class Signature {

	constructor(partnerID, apiKey) {
		this.partnerID = partnerID;
		this.apiKey = apiKey;
	}

	generate_sec_key(timestamp=Date.now()) {
    var hash = crypto.createHash('sha256').update(parseInt(this.partnerID, 10) + ":" + timestamp).digest('hex');
    var encrypted = crypto.publicEncrypt({
      key: Buffer.from(this.apiKey, 'base64'),
      padding: crypto.constants.RSA_PKCS1_PADDING
    }, Buffer.from(hash)).toString('base64');
    return {sec_key: [encrypted, hash].join('|'), timestamp: timestamp};
  }

  confirm_sec_key(timestamp, sec_key) {
    var hash = crypto.createHash('sha256').update(parseInt(this.partnerID, 10) + ":" + timestamp).digest('hex');
    var encrypted = sec_key.split('|')[0];
    var decrypted = crypto.publicDecrypt({
      key: Buffer.from(this.apiKey, 'base64'),
      padding: crypto.constants.RSA_PKCS1_PADDING
    }, Buffer.from(encrypted, 'base64')).toString();
    return decrypted === hash;
  }

  generate_signature(timestamp=new Date().toISOString()) {
    let hmac = crypto.createHmac('sha256', this.apiKey);
    hmac.update(timestamp, 'utf8');
    hmac.update(this.partnerID, 'utf8');
    hmac.update("sid_request", 'utf8');
    let output = hmac.digest().toString('base64');
    return {signature: output, timestamp: timestamp};
  }

  confirm_signature(timestamp, signature) {
    return signature === this.generate_signature(timestamp).signature;
  }

};

module.exports = Signature;