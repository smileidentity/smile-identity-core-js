import { IDApi } from './id-api';
interface OptionsParam {
  return_history?: boolean;
  return_images?: boolean;
  return_image_links?: boolean;
  return_job_status?: boolean;
  use_enrolled_image?: boolean;
  optional_callback?: string
}

interface PartnerParams {
  user_id: string | number;
  job_id: string | number;
  job_type: number;
}

interface IdInfo {
  entered?: boolean | string | undefined,
  country?: string | undefined,
  id_type?: string | undefined,
  id_number?: string | undefined,
}

type TokenRequestParams = {
  user_id: string;
  job_id: string;
  product: string;
  callback_url: string;
}

export { type PartnerParams, type IdInfo, type OptionsParam, type TokenRequestParams };