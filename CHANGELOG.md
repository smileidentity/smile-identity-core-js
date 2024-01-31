# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added support for Node 20.

## [3.1.0] - 2024-01-31

### Added

- Added support for asynchronous jobs for ID and Business verifications.

## [3.0.2] - 2023-09-29

### Added

- Added Enhanced Document Verification to the SmileIdentityCore class.

## [3.0.1] - 2023-09-01

### Changed

- Updated `WebApi` to remove the `id_type` as a required field for DocV Job Type.

## [3.0.0]

### Added

- Added JSDocs to the `WebApi` class.
- Added `BASIC_KYC`, `UPDATE_PHOTO`, and `COMPARE_USER_INFO` to `JOB_TYPE`.
- Defined `sidServerMapping` in constants.
- Added TypeScript support.
- Added support for running business verification jobs through `IDApi`.

### Changed

- Allowed `WebApi` to submit `consent_information` as part of `id_info`.
- Refactored `get_web_token` code, moved from `WebApi` class into `web-token` file. Improved test coverage.
- Refactored `Utilities` class.
- Refactored `WebApi` class. Eliminated `_private`.
- Switched to using Jest for tests.

## [2.0.0] - 2022-11-11

### Added

- Added support for Node 18.
- Added `examples/` directory with examples for each job type.
- Exported maps for `JOB_TYPE` and `IMAGE_TYPE`.
- Added `source_sdk` and `source_sdk_version` fields on submit_job requests.
- Ran tests and linter in CI for every supported version of Node.

### Changed

- Removed `options` argument from `IDApi.submit_job`. This argument is no longer used now that `sec_key` is no longer supported.
- Improved test coverage.
- Linted the codebase.
- Updated documentation in README.md to reflect other Smile SDK docs.
- Created `src/helpers.js`. Refactored common code into a separate file and increased test coverage.
- Refactored IDApi class.

### Removed

- Removed `sec_key` based authentication. Functions `Signature.generate_sec_key` and `Signature.confirm_sec_key` should be replaced with `Signature.generate_signature` and `Signature.confirm_signature` respectively.
- Dropped support for Node 10.

## [1.0.1] - 2019-11-02

### Fixed

- .git files are once again being ignored with an npm version bump.

## [1.0.0] - 2019-10-18

### Added

- Added ID API class.
- Added the ability to query ID Api from the Web API class.
- Updated the documentation to include Web Api (job type 5) and ID API.

### Changed

- Amended the success response when job status is false to be a JSON String containing {"success":true,"smile_job_id":"job_id"}

### Removed

- Removed the id_info validations for Web API (only validate the id_number, id_type, and country).
- Changed the way that we import the classes from the modules (not backward compatible) e.g., `require("smile-identity-core").WebAPI`.
