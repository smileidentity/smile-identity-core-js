# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
- Run tests in github actions against multiple node versions.
- Remove travis.
- disable npm publish trigger on push to master.

## [1.0.1] - 2019-11-02
### Fixed
.git files are once again being ignored with an npm version bump

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
