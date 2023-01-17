export interface OptionsParam {
  return_history?: boolean;
  return_images?: boolean;
  return_image_links?: boolean;
  return_job_status?: boolean;
  use_enrolled_image?: boolean;
  optional_callback?: string
}

export interface PartnerParams {
  user_id: string | number;
  job_id: string | number;
  job_type: number;
}

export interface IdInfo {
  business_type?: string;
  country?: string;
  dob?: string;
  entered?: boolean | string;
  first_name?: string;
  id_type?: string;
  last_name?: string;
  id_number?: string;
  middle_name?: string;
  phone_number?: string;
}

export type TokenRequestParams = {
  user_id: string;
  job_id: string;
  product: string;
  callback_url: string;
};
