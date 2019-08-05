var assert = require('assert');
const WebApi = require("./../index.js");
const Signature = require("./../src/signature");
const crypto = require('crypto');

const keypair = require('keypair');

const pair = keypair();

// test that the sec key is generated correctly
describe('Signature', () => {
  describe('#new', () => {
    it('should set the partner_id and api_key values', (done) => {
      let instance = new Signature('001', Buffer.from(pair.public).toString('base64'));
      assert.equal(instance.partnerID, '001');
      assert.equal(instance.apiKey, Buffer.from(pair.public).toString('base64'));
      done();
    });
  });

  describe('#generate_sec_key', () => {
    it('should create a sec_key', function(done) {
      let timestamp = Date.now();
      let signature = new Signature('001', Buffer.from(pair.public).toString('base64')).generate_sec_key(timestamp);
      assert.equal(typeof(signature), 'object');
      assert.equal(timestamp, signature.timestamp);
      let hash = crypto.createHash('sha256').update(1 + ":" + timestamp).digest('hex');
      assert.equal(hash, signature.sec_key.split('|')[1]);
      let decrypted = crypto.privateDecrypt({
        key: Buffer.from(pair.private),
        padding: crypto.constants.RSA_PKCS1_PADDING
      }, Buffer.from(signature.sec_key.split('|')[0], 'base64')).toString();
      assert.equal(decrypted, hash);
      done();
    });
  });

  describe('#confirm_sec_key', () => {
    it('should be able to decode a valid sec_key', (done) => {
      let timestamp = Date.now();
      let hash = crypto.createHash('sha256').update(1 + ":" + timestamp).digest('hex');
      let encrypted = crypto.privateEncrypt({
        key: Buffer.from(pair.private),
        padding: crypto.constants.RSA_PKCS1_PADDING
      }, Buffer.from(hash)).toString('base64');
      let sec_key = [encrypted, hash].join('|');
      assert.equal(true, new Signature('001', Buffer.from(pair.public).toString('base64')).confirm_sec_key(timestamp, sec_key));
      done();
    });
  });
});

describe('WebApi', () => {
  describe('#new', () => {
    it('should instantiate and set the global variables', (done) => {
      let instance = new WebApi('001', 'https://a_callback.com', Buffer.from(pair.public).toString('base64'), 0);
      assert.equal(instance.partner_id, '001');
      assert.equal(instance.api_key, Buffer.from(pair.public).toString('base64'));
      assert.equal(instance.default_callback, 'https://a_callback.com');
      assert.equal(instance.url, '3eydmgh10d.execute-api.us-west-2.amazonaws.com/test');
      done();
    });
  });

  describe('#submit_job', () => {
    it('should ensure that a method of getting data back has been selected', (done) => {
      let partner_params = {
          user_id: '1',
          job_id: '1',
          job_type: 1
        };
      let instance = new WebApi('001', '', Buffer.from(pair.public).toString('base64'), 0);
      instance.submit_job(partner_params, [{image_type_id: 0, image: 'path/to/image.jpg'}], {}, {}).catch((err) => {
        assert.equal(err.message, 'Please choose to either get your response via the callback or job status query')
        done();
      });
    });

    it('should ensure that the partner_params are present', (done) => {
      let instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      instance.submit_job(null, {}, {}, {return_job_status: true}).catch((err) => {
        assert.equal(err.message, 'Please ensure that you send through partner params')
        done();
      });
    });

    it('should ensure that the partner_params are an object', (done) => {
      let instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      instance.submit_job('not partner params', {}, {}, {return_job_status: true}).catch((err) => {
        assert.equal(err.message, 'Partner params needs to be an object')
        done();
      });
    });

    it('should ensure that the partner_params contain user_id, job_id and job_type', (done) => {
      let instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      ['user_id', 'job_id', 'job_type'].forEach((key) => {
        let partner_params = {
          user_id: '1',
          job_id: '1',
          job_type: 1
        };
        delete partner_params[key];
        instance.submit_job(partner_params, {}, {}, {return_job_status: true}).catch((err) => {
          assert.equal(err.message, `Please make sure that ${key} is included in the partner params`);
        });
      });
      done();
    });

    it('should ensure that images exist', (done) => {
      let instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 1
      };
      instance.submit_job(partner_params, null, {}, {return_job_status: true}).catch((err) => {
        assert.equal(err.message, 'Please ensure that you send through image details');
        done();
      });
    });

    it('should ensure that images is an array', (done) => {
      let instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 1
      };
      instance.submit_job(partner_params, {}, {}, {return_job_status: true}).catch((err) => {
        assert.equal(err.message, 'Image details needs to be an array');
        done();
      });
    });

    it('should ensure that images is an array and that it is not empty', (done) => {
      let instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 1
      };
      instance.submit_job(partner_params, [], {}, {return_job_status: true}).catch((err) => {
        assert.equal(err.message, 'You need to send through at least one selfie image');
        done();
      });
    });

    it('should ensure that images is an array and that it has a selfie', (done) => {
      let instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 1
      };
      instance.submit_job(partner_params, [{image_type_id: 1, image: 'path/to/image'}], {}, {return_job_status: true}).catch((err) => {
        assert.equal(err.message, 'You need to send through at least one selfie image');
        done();
      });
    });

    it('should ensure that images only contains valid image type ids', (done) => {
      let instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 1
      };
      instance.submit_job(partner_params, [{image_type_id: 5, image: 'path/to/image'}, {image_type_id: 2, image: 'path/to/image'}], {}, {return_job_status: true}).catch((err) => {
        assert.equal(err.message, 'Invalid image_type_id');
        done();
      });
    });

    it('should ensure that the image type id is correct', (done) => {
      let instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 1
      };
      [2, 3].forEach((val) => {
        instance.submit_job(partner_params, [{image_type_id: val, image: 'path/to/image.jpg'}, {image_type_id: 2, image: 'path/to/image'}], {}, {return_job_status: true}).catch((err) => {
          assert.equal(err.message, 'image_type_id mismatch');
        });
      });
      [0, 1].forEach((val) => {
        instance.submit_job(partner_params, [{image_type_id: val, image: 'path/to/image'}, {image_type_id: 2, image: 'path/to/image'}], {}, {return_job_status: true}).catch((err) => {
          assert.equal(err.message, 'image_type_id mismatch');
        });
      });
      done();
    });

    it('should ensure that id_info is correctly filled out', (done) => {
      let instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 1
      };
      ['first_name', 'last_name', 'country', 'id_type', 'id_number'].forEach((key) => {
        let id_info = {
          first_name: 'Some',
          last_name: 'Person',
          country: 'NG',
          id_type: 'BVN',
          id_number: '12345',
          entered: 'true'
        };
        delete id_info[key];
        instance.submit_job(partner_params, [{image_type_id: 0, image: 'path/to/image.jpg'}], id_info, {return_job_status: true}).catch((err) => {
          assert.equal(err.message, `Please make sure that ${key} is included in the id_info`);
        });
      });
      done();
    });

    it('should ensure that job type 1 has an id card image if there is no id_info', (done) => {
      let instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 1
      };
        
      instance.submit_job(partner_params, [{image_type_id: 0, image: 'path/to/image.jpg'}], {}, {return_job_status: true}).catch((err) => {
        assert.equal(err.message, "You are attempting to complete a job type 1 without providing an id card image or id info");
        done();
      });
    });

    it('should ensure that optional fields are booleans', (done) => {
      let instance = new WebApi('001', null, Buffer.from(pair.public).toString('base64'), 0);
      let partner_params = {
        user_id: '1',
        job_id: '1',
        job_type: 4
      };
      ['return_job_status', 'return_images', 'return_history'].forEach((flag) => {
        let options = {};
        options[flag] = 'not a boolean'
        instance.submit_job(partner_params, [{image_type_id: 0, image: 'path/to/image.jpg'}], {}, options).catch((err) => {
          assert.equal(err.message, `${flag} needs to be a boolean`);
        });
      });
      done();
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
