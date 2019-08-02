# SmileIdentityCore

The official Smile Identity gem exposes two classes namely, the WebApi and Signature class.

The Web API allows you as the Partner to validate a user’s identity against the relevant Identity Authorities/Third Party databases that Smile Identity has access to using ID information provided by your customer/user (including photo for compare).

The Signature class allows you as the Partner to generate a sec key to interact with our servers.

## Documentation

This package requires specific input parameters, for more detail on these parameters please refer to our [documentation for Web API](https://docs-smileid.herokuapp.com/docs#web-api-introduction).

Please note that you will have to be a Smile Identity Partner to be able to query our services.
## Usage


Install it to your system as:

```
  $ npm install smile-identity-core
```

#### Calculating your Signature

```
$ connection = new Signature(partner_id, api_key);

$ sec_key = connection.generate_sec_key(timestamp);
// where timestamp is optional

```

The response will be an object:

```
{
  sec_key: "<the generated sec key>",
  timestamp: 1563283420
}
```

#### Web api
```
$ let WebApi = require('WebApi');
$ connection = new WebApi(partner_id, default_callback, api_key, sid_server);

$ response = connection.submit_job(partner_params, image_details, id_info, options);
```

The response will be a promise. It will return undefined if you chose to set return_job_status to false, however if you have set options.return_job_status to true then you will receive a response like below:

```
{
  "timestamp": "2018-03-13T21:04:11.193Z",
  "signature": "<your signature>",
  "job_complete": true,
  "job_success": true,
  "result": {
    "ResultText": "Enroll User",
    "ResultType": "SAIA",
    "SmileJobID": "0000001897",
    "JSONVersion": "1.0.0",
    "IsFinalResult": "true",
    "PartnerParams": {
      "job_id": "52d0de86-be3b-4219-9e96-8195b0018944",
      "user_id": "e54e0e98-8b8c-4215-89f5-7f9ea42bf650",
      "job_type": 4
    },
    "ConfidenceValue": "100",
    "IsMachineResult": "true",
  }
  "code": "2302"
}
```
You can also view your response asynchronously at the callback that you have set, it will look as follows:
```
{
  "ResultCode": "1220",
  "ResultText": "Authenticated",
  "ResultType": "DIVA",
  "SmileJobID": "0000000001",
  "JSONVersion": "1.0.0",
  "IsFinalResult": "true",
  "PartnerParams": {
    "job_id": "e7ca3e6c-e527-7165-b0b5-b90db1276378",
    "user_id": "07a0c120-98d7-4fdc-bc62-3c6bfd16c60e",
    "job_type": 2
  },
  "ConfidenceValue": "100.000000",
  "IsMachineResult": "true"
}
```
If an error occurs, the Web Api package will throw an error. Be sure to catch any error that occurs as in this example:
```
const connection = new webApi(partner_id, default_callback, api_key, sid_server);
const response = connection.submit_job(partner_params, image_details, id_info, options);
response.then((result) => {
  // evaluate result if options.return_job_status was true
}).catch((error) => {
  // figure out what went wrong
});
```

## Development

After checking out the repo, run `npm install` to install dependencies. Then, run `npm test` to run the tests. 

To release a new version, update the version number in `package.json`, and then run `git tag -a <new version number>`, which will create a git tag for the version, push git commits and tags, and push the changes to github for review.

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/smileidentity/smile-identity-core-js