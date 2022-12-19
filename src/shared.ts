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

type TokenRequestParams = {
  user_id: string;
  job_id: string;
  product: string;
  callback_url: string;
}

export { type PartnerParams,type OptionsParam, type TokenRequestParams };