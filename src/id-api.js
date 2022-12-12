const axios = require('axios');
const Signature = require('./signature');
const { mapServerUri, sdkVersionInfo, validatePartnerParams } = require('./helpers');
/**
 * 
 * @param  {{
 * entered: boolean|string|undefined,
*  country: string|undefined,
*  id_type: string|undefined,
*  id_number: string|undefined,
*  business_type: string|undefined,
*  postal_code: string|undefined,
*  postal_address: string|undefined,
* }} idInfo 
 */
const validateIdInfo = (idInfo) => {
  if (typeof idInfo !== 'object') {
    throw new Error('ID Info needs to be an object');
  }

  if (!idInfo || Object.keys(idInfo).length === 0) {
    throw new Error('Please make sure that id_info not empty or nil');
  }

  if (!idInfo.id_number || idInfo.id_number.length === 0) {
    throw new Error('Please provide an id_number in the id_info payload');
  }
};

/**
 * Formats upload payload.
 *
 * @param {{
*  api_key: string,
*  id_info: {
* entered: boolean|string|undefined,
*  country: string|undefined,
*  id_type: string|undefined,
*  id_number: string|undefined,
*  business_type: string|undefined,
*  postal_code: string|undefined,
*  postal_address: string|undefined,
* },
*  callback_url?: string,
*  partner_id: string,
*  partner_params: {job_type: string | number, [k: string]: any},
*  timestamp?: string|number,
*  use_enrolled_image?: boolean,
* }} options - The options object.
* @returns {object} - formatted payload.
*/
const configurePayload = ({
  api_key, id_info, partner_id, partner_params,
}) => ({
  language: 'javascript',
  partner_id,
  partner_params: {
    ...partner_params,
    job_type: parseInt(partner_params.job_type.toString(), 10),
  },
  ...id_info,
  ...new Signature(partner_id, api_key).generate_signature(),
  ...sdkVersionInfo,
});

class IDApi {
  /**
 * Creates an instance of WebApi.
 *
 * @param {string} partner_id - Your Smile Partner ID
 * @param {string} api_key - Your Smile API Key
 * @param {string|number} sid_server - The server to use for the SID API. 0 for
 * staging and 1 for production.
 */
  constructor(partner_id, api_key, sid_server) {
    this.partner_id = partner_id;
    this.sid_server = sid_server;
    this.api_key = api_key;
    this.url = mapServerUri(sid_server);
  }

  /**
   * Submit a job to Smile.
   *
   * @param {{
  *  user_id: string,
  *  job_id: string,
  *  job_type: string|number,
  * [k:string|number]:any,
  * }} partner_params - the user_id, job_id, and job_type of the job to submit.
  * Can additionally include optional parameters that Smile will return in the
  * job status.
  * @param {{
  * entered: boolean|string|undefined,
  *  country: string|undefined,
  *  id_type: string|undefined,
  *  id_number: string|undefined,
  *  business_type: string|undefined,
  *  postal_code: string|undefined,
  *  postal_address: string|undefined,
  * }} id_info - ID information required to create a job.
  * @returns {Promise<object>} A promise that resolves to the job status.
  * @throws {Error} If any of the required parameters are missing or if the request fails.
  * @memberof WebApi
  */
  submit_job(partner_params, id_info) {
    try {
      validatePartnerParams(partner_params);

      if (parseInt(partner_params.job_type.toString(), 10) !== 5) {
        throw new Error('Please ensure that you are setting your job_type to 5 to query ID Api');
      }

      validateIdInfo(id_info);

      const data = {
        api_key: this.api_key,
        id_info,
        partner_id: this.partner_id,
        partner_params,
        sid_server: this.sid_server,
      };

      return axios.post(`https://${this.url}/id_verification`, configurePayload(data)).then((response) => response.data);
    } catch (err) {
      return Promise.reject(err);
    }
  }
}

module.exports = IDApi;
