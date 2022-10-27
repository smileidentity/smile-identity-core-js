# Smile Identity Node.js Server SDK

The official Smile Identity gem exposes four classes namely; the Web Api class, the ID Api class, the Signature class and the Utilities class.

## Note: This is a server-side library

The **Web Api Class** allows you as the Partner to validate a user’s identity against the relevant Identity Authorities/Third Party databases that Smile Identity has access to using ID information provided by your customer/user (including photo for compare). It has the following public methods:

- `submit_job`
- `get_job_status`
- `get_web_token`

The **ID Api Class** lets you performs basic KYC Services including verifying an ID number as well as retrieve a user's Personal Information. It has the following public methods:

- `submit_job`

The **Signature Class** allows you as the Partner to generate a sec_key or a signature to interact with our servers. It has the following public methods:

- `generate_sec_key`
- `confirm_sec_key`
- `generate_signature`
- `confirm_signature`

The **Utilities Class** allows you as the Partner to use our general Utility functions to gain access to your data. It has the following public methods:

- `get_job_status`


## Documentation

This package requires specific input parameters, for more detail on these parameters please refer to our [documentation for Web API](https://docs.smileidentity.com/products/web-api/javascript).

Please note that you will have to be a Smile Identity Partner to be able to query our services. You can sign up on the [Portal](https://portal.smileidentity.com/signup).

## Usage

> **Note**
> This package **requires node 6.x or higher**

Install it on your system as:

```shell
npm install smile-identity-core
```

Require the package:

```javascript
const smileIdentityCore = require("smile-identity-core");
```

and pull in any of the necessary class that you'd be using:

```javascript
const WebApi = smileIdentityCore.WebApi;
const IDApi = smileIdentityCore.IDApi;
const Signature = smileIdentityCore.Signature;
const Utilities = smileIdentityCore.Utilities;
```

## Security

We accept 2 forms of security to communicate with our servers. The `sec_key` is the legacy means of communicating with our servers. This uses the v1 api key. The `signature` field is our new improved means of signing requests. To calculate a signature you need to generate a v2 api key. _Generating a v2
api key does not invalidate existing v1 keys so you can safely upgrade._ The library will default to calculating the legacy `sec_key` so your existing code will continue to behave as expected. To use the new `signature` form of security pass the boolean `signature: true` in the options object to any of our classes except Signature, where you would instead call the `generate_signature` function instead of the `generate_sec_key` function.

## Web Api Class

### submit_job method

```javascript
const connection = new WebApi(partner_id, default_callback, api_key, sid_server);
const response = connection.submit_job(partner_params, image_details, id_info, options);
```

The **response will be a promise**. Please note that both  **id_info** and **options** are optional. You may omit them by passing null as the values in submit_job, as follows:

```javascript
const response = connection.submit_job(partner_params, images, null, null);
```

or

```javascript
const response = connection.submit_job(partner_params, images, {}, {});
```

In the case of a Job Type 5 you can simply omit the the images and options keys. Remember that the response is immediate, so there is no need to query the job_status. There is also no enrollment so no images are required. The response for a job type 5 can be found in the response section below.

```javascript
const response = connection.submit_job(partner_params, null, id_info, null);
```

**Response:**

Should you choose to _set return_job_status to false_, the response will be a JSON containing:

```json
{"success": true, "smile_job_id": smile_job_id}
```

However, if you have _set return_job_status to true (with image_links and history)_ then you will receive a promise that will return a JSON Object response like below:

```json
{
   "job_success":true,
   "result":{
      "ConfidenceValue":"99",
      "JSONVersion":"1.0.0",
      "Actions":{
         "Verify_ID_Number":"Verified",
         "Return_Personal_Info":"Returned",
         "Human_Review_Update_Selfie":"Not Applicable",
         "Human_Review_Compare":"Not Applicable",
         "Update_Registered_Selfie_On_File":"Not Applicable",
         "Liveness_Check":"Not Applicable",
         "Register_Selfie":"Approved",
         "Human_Review_Liveness_Check":"Not Applicable",
         "Selfie_To_ID_Authority_Compare":"Completed",
         "Selfie_To_ID_Card_Compare":"Not Applicable",
         "Selfie_To_Registered_Selfie_Compare":"Not Applicable"
      },
      "ResultText":"Enroll User",
      "IsFinalResult":"true",
      "IsMachineResult":"true",
      "ResultType":"SAIA",
      "PartnerParams":{
         "job_type":"1",
         "optional_info":"we are one",
         "user_id":"HBBBBBBH57g",
         "job_id":"HBBBBBBHg"
      },
      "Source":"WebAPI",
      "ResultCode":"0810",
      "SmileJobID":"0000001111"
   },
   "code":"2302",
   "job_complete":true,
   "signature":"HKBhxcv+1qaLy\C7PjVtk257dE=|1577b051a4313ed5e3e4d29893a66f966e31af0a2d2f6bec2a7f2e00f2701259",
   "history":[
      {
         "ConfidenceValue":"99",
         "JSONVersion":"1.0.0",
         "Actions":{
            "Verify_ID_Number":"Verified",
            "Return_Personal_Info":"Returned",
            "Human_Review_Update_Selfie":"Not Applicable",
            "Human_Review_Compare":"Not Applicable",
            "Update_Registered_Selfie_On_File":"Not Applicable",
            "Liveness_Check":"Not Applicable",
            "Register_Selfie":"Approved",
            "Human_Review_Liveness_Check":"Not Applicable",
            "Selfie_To_ID_Authority_Compare":"Completed",
            "Selfie_To_ID_Card_Compare":"Not Applicable",
            "Selfie_To_Registered_Selfie_Compare":"Not Applicable"
         },
         "ResultText":"Enroll User",
         "IsFinalResult":"true",
         "IsMachineResult":"true",
         "ResultType":"SAIA",
         "PartnerParams":{
            "job_type":"1",
            "optional_info":"we are one",
            "user_id":"HBBBBBBH57g",
            "job_id":"HBBBBBBHg"
         },
         "Source":"WebAPI",
         "ResultCode":"0810",
         "SmileJobID":"0000001111"
      }
   ],
   "image_links":{
      "selfie_image":"image_link"
   },
   "timestamp":"2019-10-10T12:32:04.622Z"
}
```

You can also _view your response asynchronously at the callback_ that you have set, it will look as follows:

```json
{
   "job_success":true,
   "result":{
      "ConfidenceValue":"99",
      "JSONVersion":"1.0.0",
      "Actions":{
         "Verify_ID_Number":"Verified",
         "Return_Personal_Info":"Returned",
         "Human_Review_Update_Selfie":"Not Applicable",
         "Human_Review_Compare":"Not Applicable",
         "Update_Registered_Selfie_On_File":"Not Applicable",
         "Liveness_Check":"Not Applicable",
         "Register_Selfie":"Approved",
         "Human_Review_Liveness_Check":"Not Applicable",
         "Selfie_To_ID_Authority_Compare":"Completed",
         "Selfie_To_ID_Card_Compare":"Not Applicable",
         "Selfie_To_Registered_Selfie_Compare":"Not Applicable"
      },
      "ResultText":"Enroll User",
      "IsFinalResult":"true",
      "IsMachineResult":"true",
      "ResultType":"SAIA",
      "PartnerParams":{
         "job_type":"1",
         "optional_info":"we are one",
         "user_id":"HBBBBBBH57g",
         "job_id":"HBBBBBBHg"
      },
      "Source":"WebAPI",
      "ResultCode":"0810",
      "SmileJobID":"0000001111"
   },
   "code":"2302",
   "job_complete":true,
   "signature":"HKBhxcv+1qaLy\C7PjVtk257dE=|1577b051a4313ed5e3e4d29893a66f966e31af0a2d2f6bec2a7f2e00f2701259",
   "history":[
      {
         "ConfidenceValue":"99",
         "JSONVersion":"1.0.0",
         "Actions":{
            "Verify_ID_Number":"Verified",
            "Return_Personal_Info":"Returned",
            "Human_Review_Update_Selfie":"Not Applicable",
            "Human_Review_Compare":"Not Applicable",
            "Update_Registered_Selfie_On_File":"Not Applicable",
            "Liveness_Check":"Not Applicable",
            "Register_Selfie":"Approved",
            "Human_Review_Liveness_Check":"Not Applicable",
            "Selfie_To_ID_Authority_Compare":"Completed",
            "Selfie_To_ID_Card_Compare":"Not Applicable",
            "Selfie_To_Registered_Selfie_Compare":"Not Applicable"
         },
         "ResultText":"Enroll User",
         "IsFinalResult":"true",
         "IsMachineResult":"true",
         "ResultType":"SAIA",
         "PartnerParams":{
            "job_type":"1",
            "optional_info":"we are one",
            "user_id":"HBBBBBBH57g",
            "job_id":"HBBBBBBHg"
         },
         "Source":"WebAPI",
         "ResultCode":"0810",
         "SmileJobID":"0000001111"
      }
   ],
   "image_links":{
      "selfie_image":"image_link"
   },
   "timestamp":"2019-10-10T12:32:04.622Z"
}
```

If you have queried a job type 5, your response be a promise that will return JSON that will contain the following:

```json
{
   "JSONVersion":"1.0.0",
   "SmileJobID":"0000001105",
   "PartnerParams":{
      "user_id":"T6yzdOezucdsPrY0QG9LYNDGOrC",
      "job_id":"FS1kd1dd15JUpd87gTBDapvFxv0",
      "job_type":5
   },
   "ResultType":"ID Verification",
   "ResultText":"ID Number Validated",
   "ResultCode":"1012",
   "IsFinalResult":"true",
   "Actions":{
      "Verify_ID_Number":"Verified",
      "Return_Personal_Info":"Returned"
   },
   "Country":"NG",
   "IDType":"PASSPORT",
   "IDNumber":"A12345678",
   "ExpirationDate":"2023-01-28",
   "FullName":"JOHN LEO DOE",
   "DOB":"1980-08-21",
   "Photo":"SomeBase64Image",
   "sec_key":"pjxsxEY69zEHjSPFvPEQTqu17vpZbw+zTNqaFxRWpYDiO+7wzKc9zvPU2lRGiKg7rff6nGPBvQ6rA7/wYkcLrlD2SuR2Q8hOcDFgni3PJHutij7j6ThRdpTwJRO2GjLXN5HHDB52NjAvKPyclSDANHrG1qb/tloO7x4bFJ7tKYE=|8faebe00b317654548f8b739dc631431b67d2d4e6ab65c6d53539aaad1600ac7",
   "timestamp":1570698930193
}
```

You will receive undefined if chose to set return_job_status to false, however if you set options return_job_status to true then you will receive a response like below:

```json
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
  },
  "code": "2302"
}
```

You can also view your response asynchronously at the callback that you have set, it will look as follows:

```json
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

```javascript
const connection = new webApi(partner_id, default_callback, api_key, sid_server);
const response = connection.submit_job(partner_params, image_details, id_info, options);
response.then((result) => {
  // evaluate result if options.return_job_status was true
}).catch((error) => {
  // figure out what went wrong
});
```

### get_job_status method

Sometimes, you may want to get a particular job status at a later time. You may use the get_job_status function to do this:

Initialized the Web Api class as follows:

```javascript
const connection = new WebApi(partner_id, default_callback, api_key, sid_server);
```

Thereafter, simply call get_job_status with the correct parameters:

```javascript
// NOTE: options is { return_history: true | false, return_image_links: true | false}
const response = connection.get_job_status(partner_params, options)

```

Please note that the options parameter is optional you may omit it by passing in an empty hash or null:

```javascript
// NOTE: options is {return_history: true | false, return_images: true | false}
response = connection.get_job_status(partner_params, options);
```

**Response**

Your response will return a promise that contains a JSON Object (with image_links and history included). Below is a sample response:

```json
{
   "job_success":true,
   "result":{
      "ConfidenceValue":"99",
      "JSONVersion":"1.0.0",
      "Actions":{
         "Verify_ID_Number":"Verified",
         "Return_Personal_Info":"Returned",
         "Human_Review_Update_Selfie":"Not Applicable",
         "Human_Review_Compare":"Not Applicable",
         "Update_Registered_Selfie_On_File":"Not Applicable",
         "Liveness_Check":"Not Applicable",
         "Register_Selfie":"Approved",
         "Human_Review_Liveness_Check":"Not Applicable",
         "Selfie_To_ID_Authority_Compare":"Completed",
         "Selfie_To_ID_Card_Compare":"Not Applicable",
         "Selfie_To_Registered_Selfie_Compare":"Not Applicable"
      },
      "ResultText":"Enroll User",
      "IsFinalResult":"true",
      "IsMachineResult":"true",
      "ResultType":"SAIA",
      "PartnerParams":{
         "job_type":"1",
         "optional_info":"we are one",
         "user_id":"HBBBBBBH57g",
         "job_id":"HBBBBBBHg"
      },
      "Source":"WebAPI",
      "ResultCode":"0810",
      "SmileJobID":"0000001111"
   },
   "code":"2302",
   "job_complete":true,
   "signature":"HKBhxcv+1qaLy\C7PjVtk257dE=|1577b051a4313ed5e3e4d29893a66f966e31af0a2d2f6bec2a7f2e00f2701259",
   "history":[
      {
         "ConfidenceValue":"99",
         "JSONVersion":"1.0.0",
         "Actions":{
            "Verify_ID_Number":"Verified",
            "Return_Personal_Info":"Returned",
            "Human_Review_Update_Selfie":"Not Applicable",
            "Human_Review_Compare":"Not Applicable",
            "Update_Registered_Selfie_On_File":"Not Applicable",
            "Liveness_Check":"Not Applicable",
            "Register_Selfie":"Approved",
            "Human_Review_Liveness_Check":"Not Applicable",
            "Selfie_To_ID_Authority_Compare":"Completed",
            "Selfie_To_ID_Card_Compare":"Not Applicable",
            "Selfie_To_Registered_Selfie_Compare":"Not Applicable"
         },
         "ResultText":"Enroll User",
         "IsFinalResult":"true",
         "IsMachineResult":"true",
         "ResultType":"SAIA",
         "PartnerParams":{
            "job_type":"1",
            "optional_info":"we are one",
            "user_id":"HBBBBBBH57g",
            "job_id":"HBBBBBBHg"
         },
         "Source":"WebAPI",
         "ResultCode":"0810",
         "SmileJobID":"0000001111"
      }
   ],
   "image_links":{
      "selfie_image":"image_link"
   },
   "timestamp":"2019-10-10T12:32:04.622Z"
}
```

##### get_web_token method

You may want to use our hosted web integration, and create a session. The `get_web_token` function enables this.

You have your Web Api class initialised as follows:

```javascript
connection = new WebApi(partner_id, default_callback, api_key, sid_server);
```

Next, you'll need to create your request object. This should take the following
structure:

```json
{
 // String: required
 "user_id": 'user-1',
 // String: required
 "job_id": 'job-1',
 // String: required one of 'authentication', 'basic_kyc', 'smartselfie', 'biometric_kyc', 'enhanced_kyc', 'document_verification'
 "product": 'authentication',
 // String: required, optional if callback url was set during instantiation of the class
 "callback_url": "https://smileidentity.com/callback"
}
```

Thereafter, call `get_web_token` with the correct parameters:

```javascript
  response = connection.get_web_token(requestParams)
```

**Response**

Your response will return a promise that contains a JSON Object below:

```json
{
 "token": <token_string>
}
```

## ID Api Class

### submit_job method

```javascript
const connection = new IDApi(partner_id, api_key, sid_server);
const response = connection.submit_job(partner_params, id_info, options);
```

**Response**

Your response will return a promise with JSON containing the below:

```json
{
   "JSONVersion":"1.0.0",
   "SmileJobID":"0000001105",
   "PartnerParams":{
      "user_id":"T6yzdOezucdsPrY0QG9LYNDGOrC",
      "job_id":"FS1kd1dd15JUpd87gTBDapvFxv0",
      "job_type":5
   },
   "ResultType":"ID Verification",
   "ResultText":"ID Number Validated",
   "ResultCode":"1012",
   "IsFinalResult":"true",
   "Actions":{
      "Verify_ID_Number":"Verified",
      "Return_Personal_Info":"Returned"
   },
   "Country":"NG",
   "IDType":"PASSPORT",
   "IDNumber":"A12345678",
   "ExpirationDate":"2023-1-28",
   "FullName":"JOHN LEO DOE",
   "DOB":"1980-08-21",
   "Photo":"SomeBase64Image",
   "sec_key":"pjxsxEY69zEHjSPFvPEQTqu17vpZbw+zTNqaFxRWpYDiO+7wzKc9zvPU2lRGiKg7rff6nGPBvQ6rA7/wYkcLrlD2SuR2Q8hOcDFgni3PJHutij7j6ThRdpTwJRO2GjLXN5HHDB52NjAvKPyclSDANHrG1qb/tloO7x4bFJ7tKYE=|8faebe00b317654548f8b739dc631431b67d2d4e6ab65c6d53539aaad1600ac7",
   "timestamp":1570698930193
}
```

## Signature Class

### generate_sec_key method

```javascript
const connection = new Signature(partner_id, api_key);
const sec_key = connection.generate_sec_key(timestamp)
// where timestamp is optional
```

The response will be an object:

```json
{
  "sec_key": "<the generated sec key>",
  "timestamp": 1563283420
}
```

### confirm_sec_key method

You can also confirm the signature that you receive when you interact with our servers. Simply use the confirm_sec_key method which returns a boolean:

```javascript
const connection = new Signature(partner_id, api_key);
const sec_key = connection.confirm_sec_key(sec_key, timestamp)
```

### Utilities Class

You may want to receive more information about a job. This is built into Web Api if you choose to set return_job_status as true in the options hash. However, you also have the option to build the functionality yourself by using the Utilities class. Please note that if you are querying a job immediately after submitting it, you will need to poll it for the duration of the job.

```javascript
// NOTE: options is {return_history: true | false, return_image_links: true | false}
const utilities_connection = new Utilities('partner_id', 'api_key' , sid_server)
utilities_connection.get_job_status('user_id', 'job_id', options)
```

## Development

After checking out the repo, run `npm install` to install dependencies. Then, run `npm test` to run the tests.

To release a new version, update the version number in `package.json`, and then run `git tag -a <new version number>`, which will create a git tag for the version, push git commits and tags, and push the changes to github for review.

## Contributing

Bug reports and pull requests are welcome on GitHub at <https://github.com/smileidentity/smile-identity-core-js>

## Deploying

Ask a Smile Identity team member to add you to the npm team organisation. Provide them with your npm username.

Once you are added to the organisation, login to npm on the command line using ``npm login``.

To publish a new version, first update the version number in the package.json file following the semantic versioning spec found [here](https://docs.npmjs.com/about-semantic-versioning).

We strongly suggest updating the github tag to match the npm published version. You can do this as follows:

```bash
git tag -a <tagname which is the npm version number> -m '<message>'
git push origin <tag>
```

The gist of it is as follows:

| Code status | Stage | Rule      |  Example version |
|----------|:-------------:|:------|------:|
|First release|New product|Start with 1.0.0|1.0.0|
|Backward compatible bug fixes|Patch release|Increment the third digit|1.0.1|
|Backward compatible new features|Minor release|Increment the middle digit and reset last digit to zero|1.1.0|
|Changes that break backward compatibility|Major release|Increment the first digit and reset middle and last digits to zero|2.0.0|

Thereafter, run ```npm publish``` and follow the section to install and use the library in your external app.
