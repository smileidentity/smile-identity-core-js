/**
 * See https://docs.smileidentity.com/server-to-server/javascript/products/biometric-kyc
 * for how to setup and retrieve configuration values for the WebApi class.
 */

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

/**
 * Create image list.
 *
 * image_type_id Integer
 * 0 - Selfie image jpg or png (if you have the full path of the selfie).
 * 2 - Selfie image jpg or png base64 encoded (if you have the base64image string of the selfie).
 * 4 - Liveness image jpg or png (if you have the full path of the liveness image).
 * 6 - Liveness image jpg or png base64 encoded (if you have the base64image string of the
 *     liveness image).
 *
 * You may use the recommended web sdk to capture the images, read more
 * here https://docs.smileidentity.com/web-mobile-web/javascript-sdk-beta
 */
const image_details = [
  {
    image_type_id: '<0 | 2>',
    image: '<full path to selfie image or base64image string>',
  },
  { // Not required if you don't require proof of life (note photo of photo check will still
    // be performed on the uploaded selfie)
    image_type_id: '<4 | 6>',
    image: '<full path to liveness image or base64 image string>',
  },
];

// Set fields required by the ID authority for a verification job.
const id_info = {
  first_name: '<first name>',
  last_name: '<surname>',
  country: '<2-letter country code>',
  id_type: '<id type>',
  id_number: '<valid id number>',
  dob: '<date of birth>', // yyyy-mm-dd
  entered: 'true', // must be a string
};

// Set the options for the job.
const options = {
  // Set to true if you want to get the job result in sync (in addition to the result been sent to
  // your callback). If set to false, result is sent to callback url only.
  return_job_status: '<true | false>',
  // Set to true to return results of all jobs you have ran for the user in addition to current job
  // result. You must set return_job_status to true to use this flag.
  return_history: '<true | false>',
  // Set to true to receive selfie and liveness images you uploaded. You must set return_job_status
  // to true to use this flag.
  return_image_links: '<true | false>',
  signature: true,
};

// Submit the job. This method returns a promise.
(async () => {
  try {
    const result = await connection.submit_job(partner_params, image_details, id_info, options);
    console.info(result);
  } catch (error) {
    console.error(error);
  }
})();
