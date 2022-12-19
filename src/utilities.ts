import axios from 'axios';
import Signature from './signature';
import { OptionsParam } from "./shared";

import { mapServerUri } from './helpers';

export const get_job_status = (
  partnerId: string,
  apiKey: string,
  url: string,
  userId: string | number,
  jobId: string | number,
  { return_history, return_images } : OptionsParam,
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

export class Utilities {
  partnerId: string
  apiKey: string
  url: string
  constructor(partner_id: string, api_key: string, sid_server: string | number) {
    this.partnerId = partner_id;
    this.apiKey = api_key;
    this.url = mapServerUri(sid_server);
  }

  get_job_status(userId: string|number, jobId: string|number, options: OptionsParam = { return_history: false, return_images: false }) {
    return get_job_status(this.partnerId, this.apiKey, this.url, userId, jobId, options);
  }
}

module.exports = Utilities;
