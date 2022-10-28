import { IDApi } from 'smile-identity-core';

// Initialize
const partner_id = '<Your partner ID>'; // login to the Smile Identity portal to view your partner id
const api_key = '<Your API key>'; // copy your API key from the Smile Identity portal
const sid_server = '<0 or 1>'; // Use '0' for the sandbox server, use '1' for production server

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
  country: '<2-constter country code>',
  id_type: '<id type>',
  id_number: '<valid id number>',
  dob: '<date of birth>', // yyyy-mm-dd
  phone_number: '<phone number>',
};

// Set the options for the job
const options = {
  signature: true,
};

// Submit the job
// This method returns a promise
connection.submit_job(partner_params, id_info, options);
