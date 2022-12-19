import axios from 'axios';
import Signature from './signature';
import { mapServerUri } from './helpers';
import { TokenRequestParams } from "./shared";

/**
 * Gets an authorization token from Smile. Used in Hosted Web Integration.
 *
 * @param {string} partner_id - The partner ID.
 * @param {string} api_key - Your Smile API key.
 * @param {string} url - The URL to the Smile ID API.
 * @param {{
 *  callback_url: string,
 *  user_id: string,
 *  job_id: string,
 *  product: string,
 * }} requestParams - parameters required to get an authorization token.
 * @param {string|undefined} defaultCallback - Your default callback URL.
 * @returns {Promise<{
 *  token: string,
 * }>} - The authorization token.
 * @throws {Error} - if the request fails.
 */
export const getWebToken = (
  partner_id: string,
  api_key: string,
  url: string,
  requestParams: TokenRequestParams,
  defaultCallback: string,
): Promise<{
  token: string;
}> => {
  if (!requestParams) {
    return Promise.reject(new Error('Please ensure that you send through request params'));
  }

  if (typeof requestParams !== 'object') {
    return Promise.reject(new Error('Request params needs to be an object'));
  }
  const callbackUrl = requestParams.callback_url || defaultCallback;

  if (typeof callbackUrl !== 'string' || callbackUrl.length === 0) {
    return Promise.reject(new Error('Callback URL is required for this method'));
  }

  const missingKey = ['user_id', 'job_id', 'product'].find((key) => !requestParams[key as keyof TokenRequestParams]);
  if (missingKey) {
    return Promise.reject(new Error(`${missingKey} is required to get a web token`));
  }

  const body = {
    user_id: requestParams.user_id,
    job_id: requestParams.job_id,
    product: requestParams.product,
    callback_url: callbackUrl,
    partner_id: partner_id,
    ...new Signature(
      partner_id,
      api_key,
    ).generate_signature(),
  };

  return axios.post(`https://${mapServerUri(url)}/token`, body).then((response) => response.data);
};

module.exports = { getWebToken };