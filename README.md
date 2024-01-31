# Smile Identity Node.js Server Side SDK

Smile Identity provides the best solutions for real-time Digital KYC, KYB, Identity Verification, User Onboarding, and User Authentication across Africa. Our server-side libraries make it easy to integrate with our services. Since the library is server-side, you will need to pass the images (if required) to the library.

If you haven’t already, [sign up for a free Smile Identity account](https://www.usesmileid.com/schedule-a-demo/), which comes with Sandbox access.

Please see [CHANGELOG.md](CHANGELOG.md) for release versions and changes.

## Features

The library exposes four classes: the `WebApi` class, the `IDApi` class, the `Signature` class, and the `Utilities` class.

- The `WebApi` class provides public methods:
  - `submit_job` - Handles the submission of Smile Identity products that require an image, such as [Biometric KYC](https://docs.usesmileid.com/products/biometric-kyc), [Document Verification](https://docs.usesmileid.com/products/document-verification), and [SmartSelfie™ Authentication](https://docs.usesmileid.com/products/biometric-authentication).
  - `get_job_status` - Retrieves information & results of a job. Learn more about job status in the [Smile Identity documentation](https://docs.usesmileid.com/further-reading/job-status).
  - `get_web_token` - Generates a web token for use with the [Hosted Web Integration](https://docs.usesmileid.com/web-mobile-web/web-integration-beta).

- The `IDApi` class provides a public method:
  - `submit_job` - Handles the submission of [Enhanced KYC](https://docs.usesmileid.com/products/identity-lookup), [Basic KYC](https://docs.usesmileid.com/products/id-verification), and [Business Verification](https://docs.usesmileid.com/products/for-businesses-kyb/business-verification).

- The `Signature` class offers public methods:
  - `generate_signature` - Generates a signature to be passed as a parameter when making requests to the Smile Identity server.
  - `confirm_signature` - Confirms the authenticity of a response from the Smile Identity server by verifying the incoming signature.

- The `Utilities` Class provides access to Smile Identity's general utility functions. It includes:
  - `get_job_status` - Retrieves information & results of a job. More details on job status can be found in the [Smile Identity documentation](https://docs.usesmileid.com/further-reading/job-status).

For examples of how to use these classes, please see the [examples](/examples/) directory in this repository.

## Installation

**Note:** This package **requires Node.js version 14.x or higher**.

View the package on [npm](https://www.npmjs.com/package/smile-identity-core).

To add this package to your project, run:

```shell
npm install --save smile-identity-core
```

## Documentation

This package requires specific input parameters. For more details on these parameters, please refer to our [Web API documentation](https://docs.usesmileid.com/server-to-server/javascript).

Note that querying our services requires Smile Identity Partner status, obtainable by signing up on the [Portal](https://portal.usesmileid.com/signup).

## Getting Help

For usage questions, consult [our official documentation](https://docs.usesmileid.com). If you require further assistance, you can file a [support ticket via our portal](https://portal.usesmileid.com/partner/support/tickets) or visit our [contact us page](https://www.usesmileid.com/contact-us).

## Contributing

Bug reports and pull requests are welcome on GitHub at [this repository](https://github.com/smileidentity/smile-identity-core-js).

## License

MIT License
