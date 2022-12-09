const axios = require('axios');
const Signature = require('./signature');
const { mapServerUri } = require('./helpers');

/**
 * 
 * @param {string} partnerId 
 * @param {string} apiKey 
 * @param {string} url 
 * @param {string|number} userId 
 * @param {string|number} jobId 
 * @param {*} option
 * @returns 
 */
const get_job_status = (
  partnerId,
  apiKey,
  url,
  userId,
  jobId,
  { return_history, return_images },
) => axios.post(`https://${url}/job_status`, {
  user_id: userId,
  job_id: jobId,
  partner_id: partnerId,
  history: return_history,
  image_links: return_images,
  ...new Signature(
    partnerId,
    apiKey,
  ).generate_signature(),
}).then(({ data }) => {
  const valid = new Signature(
    partnerId,
    apiKey,
  ).confirm_signature(data.timestamp, data.signature);
  if (!valid) {
    throw new Error('Unable to confirm validity of the job_status response');
  }
  return data;
});

class Utilities {
  /**
   * 
   * @param {string} partner_id partner id from the portal
   * @param {string} api_key apid key from the portal
   * @param {string|number} sid_server the server to use
   */
  constructor(partner_id, api_key, sid_server) {
    this.partnerId = partner_id;
    this.apiKey = api_key;
    this.url = mapServerUri(sid_server);
  }

  /**
   * 
   * @param {string|number} userId a unique id generated to track the user
   * @param {string|number} jobId a unique id generated to track the job
   * @param {*} options
   * @returns Promise<object>
   */
  get_job_status(userId, jobId, options = { return_history: false, return_images: false }) {
    return get_job_status(this.partnerId, this.apiKey, this.url, userId, jobId, options);
  }
}

module.exports = Utilities;
