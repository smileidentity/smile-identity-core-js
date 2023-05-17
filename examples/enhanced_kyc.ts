// Change to smile-identity-core if you're using this snippet in your project.
/* eslint-disable import/no-relative-packages */
import { IDApi } from '..';

// Initialize
// login to the Smile Identity Portal to view your partner id.
const partner_id = '<Your partner ID>';
// copy your API key from the Smile Identity portal.
const api_key = '<Your API key>';
// sid_server should be a string with value '0' or '1'.
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
  // Replace '<first name>' with the individual's first name
  first_name: '<first name>',
  // Replace '<surname>' with the individual's last name
  last_name: '<surname>',
  // REQUIRED: Replace '<ISO 3166 Alpha-2 (2-letter) country code>' with the
  // country code. For example: 'US' for United States
  country: '<ISO 3166 Alpha-2 (2-letter) country code>',
  // REQUIRED: Replace '<id type>' with the type of ID being used
  id_type: '<id type>',
  // REQUIRED: Replace '<valid id number>' with the individual's valid ID number
  id_number: '<valid id number>',
  // Replace '<date of birth>' with the individual's date of birth in
  // 'yyyy-mm-dd' format. For example: '1980-01-01'
  dob: '<date of birth>',
  // Replace '<phone number>' with the individual's phone number
  phone_number: '<phone number>',
};

// Submit the job. This method returns a promise.
(async () => {
  try {
    const result = await connection.submit_job(partner_params, id_info);
    console.info(result);
  } catch (error) {
    console.error(error);
  }
})();
