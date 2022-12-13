# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
-  Add JSDocs to `WebApi` class.
- Define `sidServerMapping` in constants.
- Add BASIC_KYC, UPDATE_PHOTO and COMPARE_USER_INFO to JOB_TYPE

### Changed
- Refactor `WebApi` class. Eliminate `_private`.
- Refactor `Utilities` class.
- Refactor `get_web_token` code, move from `WebApi` class into `web-token` file. Improve test coverage.
- Use jest for tests

## [2.0.0] - 2022-11-11
### Added
- Add support for Node 18.
- Adds `examples/` directory with examples for each job type.
- Exports maps for `JOB_TYPE` and `IMAGE_TYPE`.
- Add `source_sdk` and `source_sdk_version` fields on submit_job requests.
- Run tests and linter in CI for every supported version of node.

### Changed
- Removes `options` argument from `IDApi.submit_job`. This argument is no longer used now that `sec_key` is no longer supported.
- Improves test coverage.
- Lints codebase.
- Updated documentation in README.md to reflect other smile SDK docs.
- Created `src/helpers.js`. Refactored common code into a separate file and increased test coverage.
- Refactor IDApi class.

### Removed
- Remove `sec_key` based authentication. Functions `Signature.generate_sec_key` and `Signature.confirm_sec_key` should be replaced with `Signature.generate_signature` and `Signature.confirm_signature` respectively.
- Drop support for Node 10.

## [1.0.1] - 2019-11-02
### Fixed
- .git files are once again being ignored with an npm version bump.

## [1.0.0] - 2019-10-18
### Added
- Added ID API class.
- Add the ability to query ID Api from the Web API class.
- Update the documentation to include Web Api (job type 5) and ID API.

### Changed
- Amend the success response when job status is false to be a JSON String containing {"success":true,"smile_job_id":"job_id"}

### Removed
- Remove the id_info validations for Web API (only validate the id_number, id_type and country)
- Change the way that we import the classes from the modules (not backward compatible) e.g `require("smile-identity-core").WebAPI`.
