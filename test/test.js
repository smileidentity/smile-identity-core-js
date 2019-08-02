var assert = require('assert');
const webApi = require("../../smile-identity-core");

// describe('Array', function() {
//   describe('#indexOf()', function() {
//     it('should return -1 when the value is not present', function() {
//       assert.equal([1, 2, 3].indexOf(4), -1);
//     });
//   });
// });


// test that the validation is done correctly

// test that the sec key is generated correctly
describe('WebApi', () => {
  describe('#determineSecKey', () => {
    it('should create a sec key', function() {
      let api_key = "LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlHZk1BMEdDU3FHU0liM0RR RUJBUVVBQTRHTkFEQ0JpUUtCZ1FEdlpTL0ljS3k0OE5xbEc3TTJpdDV3YnJB TAp5M2dJa0E2NFV1UzI5djhpaTV6RzBFVmxUL2dOL3phbGxhdktoTm1zT3JM TjFXTEFieU54UjhOYkZSdjFIeWVYCjdkb2dDbWkzSC9FUCtPdWZENVFjbldX WUtkbG9xMG42Z1hYTkhNbzRCNnJOVXR4SFpEYnZ2OTF0QVR5YkwrSjYKS0Z3 SWE0czlic2hWM0NaYlR3SURBUUFCCi0tLS0tRU5EIFBVQkxJQyBLRVktLS0t LQo=";
      assert.notEqual(new webApi('125', '', api_key, 2, '/tmp').determineSecKey().indexOf('|'), -1);
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
