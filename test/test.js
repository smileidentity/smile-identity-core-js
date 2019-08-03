var assert = require('assert');
const WebApi = require("./../index.js");
const Signature = require("./../src/signature");
const crypto = require('crypto');

const keypair = require('keypair');

const pair = keypair();
// describe('Array', function() {
//   describe('#indexOf()', function() {
//     it('should return -1 when the value is not present', function() {
//       assert.equal([1, 2, 3].indexOf(4), -1);
//     });
//   });
// });


// test that the validation is done correctly

// test that the sec key is generated correctly
describe('Signature', () => {
  describe('#generate_sec_key', () => {
    it('should create a sec_key', function() {
      let timestamp = Date.now();
      let signature = new Signature('001', Buffer.from(pair.public).toString('base64')).generate_sec_key(timestamp);
      assert.equal(timestamp, signature.timestamp);
      let hash = crypto.createHash('sha256').update(1 + ":" + timestamp).digest('hex');
      assert.equal(hash, signature.sec_key.split('|')[1]);
      let decrypted = crypto.privateDecrypt({
        key: Buffer.from(pair.private),
        padding: crypto.constants.RSA_PKCS1_PADDING
      }, Buffer.from(signature.sec_key.split('|')[0], 'base64')).toString();
      assert.equal(decrypted, hash);
    });
  });

  describe('#confirm_sec_key', () => {
    it('should be able to decode a valid sec_key', () => {
      let timestamp = Date.now();
      let hash = crypto.createHash('sha256').update(1 + ":" + timestamp).digest('hex');
      let encrypted = crypto.privateEncrypt({
        key: Buffer.from(pair.private),
        padding: crypto.constants.RSA_PKCS1_PADDING
      }, Buffer.from(hash)).toString('base64');
      let sec_key = [encrypted, hash].join('|')
      assert.equal(true, new Signature('001', Buffer.from(pair.public).toString('base64')).confirm_sec_key(timestamp, sec_key));
    });
  });
});

// test that the prep upload
  // test that the body is configured correctly
    // inputs ->
    // body =  {
    //   file_name: @file_details[:file_name],
    //   timestamp: @timestamp,
    //   sec_key: determine_sec_key,
    //   smile_client_id: @partner_id,
    //   partner_params: @partner_params,
    //   model_parameters: {}, # what is this for
    //   callback_url: @callback_url
    // }

// tests the correct behaviour of prep upload call when its a 200 vs an error
  // mock the request itself
  // outputs ->
  // response that says 200 with upload url
  // error

// test that the info.json is configured correctly

// test that the file gets zipped correctly
  // using the file size and name etc.

// test that the we check for success and error messages
// test that we respond wit an empty string when its a success

// test that we hit the job query method if return job status is true
// test what happens when the job query reaches its counter
//  test what happens when job status errors out
