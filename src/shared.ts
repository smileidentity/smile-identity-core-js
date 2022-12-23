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
  entered?: boolean | string;
  country?: string,
  id_type?: string,
  id_number?: string,
  first_name?: string,
  middle_name?: string,
  last_name?: string,
  dob?: string,
  phone_number?: string,
}

export type TokenRequestParams = {
  user_id: string;
  job_id: string;
  product: string;
  callback_url: string;
};
