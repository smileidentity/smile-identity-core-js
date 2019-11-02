## [1.0.0] - 2019-10-18
## Updated
Amend the success response when job status is false to be a JSON String containing {"success":true,"smile_job_id":"job_id"}
Add the ID API Class
Add the ability to query ID Api from the Web API class
Update the documentation to include Web Api (job type 5) and ID API
Change the way that we import the classes from the modules (not backward compatible) e.g require("smile-identity-core").WebAPI
Remove the id_info validations for Web API (only validate the id_number, id_type and country)

## [1.0.1] - 2019-11-02
## Updated
.git files are once again being ignored with an npm version bump
