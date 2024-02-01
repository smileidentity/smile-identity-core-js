# Smile Identity Node.js Server Side SDK

Smile Identity provides the best solutions for real-time Digital KYC, KYB, Identity Verification, User Onboarding, and User Authentication across Africa. Our server-side libraries make it easy to integrate with our services. Since the library is server-side, you will need to pass the images (if required) to the library.

If you haven’t already, [sign up for a free Smile Identity account](https://www.usesmileid.com/schedule-a-demo/), which comes with Sandbox access.

Please see [CHANGELOG.md](CHANGELOG.md) for release versions and changes.

## Features

The library exposes four classes: the `WebApi` class, the `IDApi` class, the `Signature` class, and the `Utilities` class.

- The `WebApi` class is a central component of the Smile Identity SDK, offering a variety of methods to interact with Smile Identity services. Designed for server-side integration, it provides the following public methods:
  - `submit_job` - This method is the primary means of interacting with Smile Identity products that require an image. It handles the submission of various job types, including [Biometric KYC](https://docs.usesmileid.com/products/biometric-kyc), [Document Verification](https://docs.usesmileid.com/products/document-verification), and [SmartSelfie™ Authentication](https://docs.usesmileid.com/products/biometric-authentication). The method requires parameters such as user ID, job ID, job type, image details, and optional ID information. It supports various job types and caters to different requirements based on the specified job type.
  - `get_job_status` - This method retrieves information and results of submitted jobs. It is essential for tracking the progress and outcomes of Smile Identity jobs. Learn more about job status and its significance in the [Smile Identity documentation](https://docs.usesmileid.com/further-reading/job-status).
  - `get_web_token` - This method generates a web token necessary for [Hosted Web Integration](https://docs.usesmileid.com/integration-options/web-mobile-web/web-integration). The token authenticates and authorizes requests from client-side integrations, ensuring secure communication with Smile Identity services.
- The `IDApi` class focuses on ID verification and KYC (Know Your Customer) processes. It provides a robust interface for submitting various types of verification jobs to Smile Identity, including:
  - `submit_job` - This method is essential for handling ID verification jobs. It supports:
    - [Enhanced KYC](https://docs.usesmileid.com/products/identity-lookup): Used for advanced identity verification and user authentication, this job type requires specific ID information and is ideal for situations where a thorough identity check is necessary.
    - [Basic KYC](https://docs.usesmileid.com/products/id-verification): Suitable for basic identity verification processes, this job type is designed for quick and straightforward ID checks, often used in scenarios requiring fast user validation.
    - [Business Verification](https://docs.usesmileid.com/products/for-businesses-kyb/business-verification): This job type is tailored to business-related identity verification, ensuring accurate and efficient verification of businesses.
- The `Signature` class secures communication with the Smile Identity server by generating and confirming cryptographic signatures. It plays a crucial role in ensuring the integrity and authenticity of data exchanged between your application and Smile Identity. It includes the following public methods:
  - `generate_signature` - Generates a secure signature using the Smile Partner ID, API Key, and a timestamp. This signature is critical for authenticating requests to the Smile Identity server, ensuring they come from a verified source and preventing unauthorized access. The method optionally takes a timestamp; if not provided, the current time is used. The generated signature, along with the timestamp, is returned.
  - `confirm_signature` - Validates the authenticity of responses from the Smile Identity server. It takes a timestamp and a signature, comparing the generated signature with the received one. This comparison is vital for confirming that the response is genuinely from Smile Identity and has not been altered during transmission, thereby enhancing your application's security.
- The `Utilities` class serves as a helpful toolkit for interacting with Smile Identity's services. It simplifies common tasks and provides utility functions often used in Smile Identity integrations. The class includes:
  - `get_job_status` - Crucial for tracking the progress and outcome of jobs submitted to Smile Identity. It retrieves detailed information and results for a specific job, identified by the user ID and job ID. The method accepts optional parameters to control the response, such as whether to return job history and image links. It confirms the response's authenticity by verifying the signature received from the Smile Identity server, adding an extra layer of security by ensuring the data is genuine and unaltered. More information about job status and its importance can be found in the [Smile Identity documentation](https://docs.usesmileid.com/further-reading/job-status).

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

For usage questions, consult [our official documentation](https://docs.usesmileid.com). If you require further assistance, you can file a [support ticket via our portal](https://portal.usesmileid.com/partner/support/tickets) or visit our [contact us page](https://usesmileid.com/contact-us).

## Contributing

Bug reports and pull requests are welcome on GitHub at [this repository](https://github.com/smileidentity/smile-identity-core-js).

## License

MIT License
