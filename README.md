# Smile Identity Node.js Server Side SDK

Smile Identity provides the best solutions for real time Digital KYC, Identity Verification, User Onboarding, and User Authentication across Africa. Our server side libraries make it easy to integrate us on the server-side. Since the library is server-side, you will be required to pass the images (if required) to the library.

If you haven’t already, [sign up for a free Smile Identity account](https://www.smileidentity.com/schedule-a-demo/), which comes with Sandbox access.

Please see [CHANGELOG.md](CHANGELOG.md) for release versions and changes.

## Features

The library exposes four classes; the `WebApi` class, the `IDApi` class, the `Signature` class, and the `Utilities` class.

The `WebApi` class has the following public methods:

- `submit_job` - handles submission of any of Smile Identity products that requires an image i.e. [Biometric KYC](https://docs.smileidentity.com/products/biometric-kyc), [Document Verification](https://docs.smileidentity.com/products/document-verification) and [SmartSelfieTM Authentication](https://docs.smileidentity.com/products/biometric-authentication).
- `get_job_status` - retrieve information & results of a job. Read more on job status in the [Smile Identity documentation](https://docs.smileidentity.com/further-reading/job-status).
- `get_web_token` - handles generation of web token, if you are using the [Hosted Web Integration](https://docs.smileidentity.com/web-mobile-web/web-integration-beta).

The `IDApi` class has the following public method:

- `submit_job` - handles submission of [Enhanced KYC](https://docs.smileidentity.com/products/identity-lookup), [Basic KYC](https://docs.smileidentity.com/products/id-verification) and [Business Verification](https://docs.smileidentity.com/products/for-businesses-kyb/business-verification).

The `Signature` class has the following public methods:

- `generate_signature` - generate a signature which is then passed as a signature param when making requests to the Smile Identity server.
- `confirm_signature` - ensure a response is truly from the Smile Identity server by confirming the incoming signature.

The `Utilities` Class allows you as the Partner to have access to our general Utility functions to gain access to your data. It has the following public methods:

- `get_job_status` - retrieve information & results of a job. Read more on job status in the [Smile Identity documentation](https://docs.smileidentity.com/further-reading/job-status).

For examples of how to use these classes, please see the [examples](/examples/) directory of this repository.

## Installation

**Note** This package **requires node 12.x or higher**.

View the package on [npm](https://www.npmjs.com/package/smile-identity-core).

This package can be added to your project as:

```shell
npm install --save smile-identity-core
```

## Documentation

This package requires specific input parameters, for more detail on these parameters please refer to our [documentation for Web API](https://docs.smileidentity.com/server-to-server/javascript).

Please note that you will have to be a Smile Identity Partner to be able to query our services. You can sign up on the [Portal](https://portal.smileidentity.com/signup).

## Getting Help

For usage questions, the best resource is [our official documentation](https://docs.smileidentity.com). However, if you require further assistance, you can file a [support ticket via our portal](https://portal.smileidentity.com/partner/support/tickets) or visit the [contact us page](https://portal.smileidentity.com/partner/support/tickets) on our website.

## Contributing

Bug reports and pull requests are welcome on GitHub [here](https://github.com/smileidentity/smile-identity-core-js).

## License

MIT License
