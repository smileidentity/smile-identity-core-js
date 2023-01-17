// Change to smile-identity-core if you're using this snippet in your project.
/* eslint-disable import/no-relative-packages */
import { WebApi } from '..';

// Initialize
// Login to the Smile Identity Portal to view your partner id.
const partner_id = '<Your partner ID>';
// Copy your API key from the Smile Identity portal.
const api_key = '<Your API key>';
// Use '0' for the sandbox server, use '1' for production server.
const sid_server = '<0 or 1>';
const default_callback = '<Put your default callback url here>';

const connection = new WebApi(partner_id, default_callback, api_key, sid_server);

// Create required tracking parameters
const partner_params = {
  job_id: '<put your unique job ID here>',
  user_id: '<put your unique ID for the user here>',
  job_type: 1,
};

// Set fields required by the ID authority for a verification job.
const id_info = {
  country: '<2-letter country code>',
  id_type: '<id type>',
  id_number: '<valid id number>',
  entered: 'true', // must be a string
  busines_type: '<valid business type>', // this is optional
};

// Set the options for the job.
const options = {
  signature: true,
};

// Submit the job. This method returns a promise.
(async () => {
  try {
    const result = await connection.submit_job(partner_params, null, id_info, options);
    console.info(result);
  } catch (error) {
    console.error(error);
  }
})();
