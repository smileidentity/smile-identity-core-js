import { IDApi } from 'smile-identity-core'; // eslint-disable-line import/no-unresolved

// Initialize
// login to the Smile Identity Portal to view your partner id.
const partner_id = '<Your partner ID>';
// copy your API key from the Smile Identity portal.
const api_key = '<Your API key>';
// Use '0' for the sandbox server, use '1' for production server.
const sid_server = '<0 or 1>';

const connection = new IDApi(partner_id, api_key, sid_server);

// Create required tracking parameters
const partner_params = {
  job_id: '<put your unique job ID here>',
  user_id: '<put your unique ID for the user here>',
  job_type: 5,
};

// Create ID info
const id_info = {
  first_name: '<first name>',
  last_name: '<surname>',
  country: '<ISO 3166 Alpha-2 (2-letter) country code>',
  id_type: '<id type>',
  id_number: '<valid id number>',
  dob: '<date of birth>', // yyyy-mm-dd
  phone_number: '<phone number>',
};

// Set the options for the job
const options = {
  signature: true,
};

// Submit the job. This method returns a promise.
(async () => {
  try {
    const result = await connection.submit_job(partner_params, id_info, options);
    console.info(result);
  } catch (error) {
    console.error(error);
  }
})();
