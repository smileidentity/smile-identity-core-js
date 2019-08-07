"use strict";
const crypto = require('crypto');

class Signature {

	constructor(partnerID, apiKey) {
		this.partnerID = parseInt(partnerID, 10);
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

};

module.exports = Signature;