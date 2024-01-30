import axios, { AxiosResponse, AxiosInstance } from 'axios';
import Signature from './signature';
import { mapServerUri, sdkVersionInfo, validatePartnerParams } from './helpers';
import { IdInfo, PartnerParams, SignatureInfo } from './shared';
import { JOB_TYPE } from './constants';

interface VerificationRequest extends IdInfo, SignatureInfo {
  partner_id: string;
  partner_params: PartnerParams;
  callback_url?: string;
}

/**
 * Validates the provided id info
 * @param {IdInfo} idInfo Contains info needed for the verification job
 * @returns {void}
 * @throws {Error} - If the id info is invalid.
 */
const validateIdInfo = (idInfo: IdInfo): void => {
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

export class IDApi {
  private partner_id: string;

  private api_key: string;

  private axiosInstance: AxiosInstance;

  constructor(
    partner_id: string,
    api_key: string,
    sid_server: string | number,
  ) {
    this.partner_id = partner_id;
    this.api_key = api_key;
    const url = mapServerUri(sid_server);

    this.axiosInstance = axios.create({
      baseURL: `https://${url}`,
    });
  }

  private static createVerificationRequest(
    api_key: string,
    id_info: IdInfo,
    partner_id: string,
    partner_params: PartnerParams,
    callbackUrl: string | undefined = undefined,
  ): VerificationRequest {
    const request = {
      partner_id,
      partner_params: {
        ...partner_params,
        job_type: partner_params.job_type,
      },
      ...id_info,
      ...new Signature(partner_id, api_key).generate_signature(),
      ...sdkVersionInfo,
    };
    if (callbackUrl) {
      return {
        ...request,
        callback_url: callbackUrl,
      };
    }
    return request;
  }

  private static validateParams(
    id_info: IdInfo,
    partner_params: PartnerParams,
  ): number {
    validatePartnerParams(partner_params);
    const jobType = parseInt(partner_params.job_type.toString(), 10);

    if (
      jobType !== JOB_TYPE.BASIC_KYC &&
      jobType !== JOB_TYPE.BUSINESS_VERIFICATION
    ) {
      throw new Error(
        `Please ensure that you are setting your job_type to ${JOB_TYPE.BASIC_KYC} or ${JOB_TYPE.BUSINESS_VERIFICATION} to query ID Api`,
      );
    }

    validateIdInfo(id_info);
    return jobType;
  }

  /**
   * Submit a synchronous job to Smile.
   * @template T
   * @param {PartnerParams} partner_params - the user_id, job_id, and job_type of the job to submit.
   * Can additionally include optional parameters that Smile will return in the
   * job status.
   * @param {IdInfo} id_info - ID information required to create a job.
   * @returns {Promise<T>} A promise that resolves to type T.
   * @throws {Error} If any of the required parameters are missing or if the request fails.
   */
  async submit_job<T>(
    partner_params: PartnerParams,
    id_info: IdInfo,
  ): Promise<T> {
    try {
      const jobType = IDApi.validateParams(id_info, partner_params);
      const request = IDApi.createVerificationRequest(
        this.api_key,
        id_info,
        this.partner_id,
        partner_params,
      );

      const endpoint =
        jobType === JOB_TYPE.BUSINESS_VERIFICATION
          ? '/business_verification'
          : '/id_verification';

      const response: AxiosResponse<T> = await this.axiosInstance.request<T>({
        method: 'post',
        url: endpoint,
        data: request,
      });
      return response.data;
    } catch (err) {
      return Promise.reject<any>(err);
    }
  }

  /**
   * Submit an asynchronous job to Smile.
   * @template T
   * @param {PartnerParams} partner_params - the user_id, job_id, and job_type of the job to submit.
   * Can additionally include optional parameters that Smile will return in the
   * job status.
   * @param {IdInfo} id_info - ID information required to create a job.
   * @param {string} callbackUrl callback url to send job status response to.
   * @returns {Promise<T>} A promise that resolves to the job status.
   * @throws {Error} If any of the required parameters are missing or if the request fails.
   */
  async submitAsyncjob<T>(
    partner_params: PartnerParams,
    id_info: IdInfo,
    callbackUrl: string,
  ): Promise<T> {
    try {
      const jobType = IDApi.validateParams(id_info, partner_params);
      const request = IDApi.createVerificationRequest(
        this.api_key,
        id_info,
        this.partner_id,
        partner_params,
        callbackUrl,
      );

      const endpoint =
        jobType === JOB_TYPE.BUSINESS_VERIFICATION
          ? '/async_business_verification'
          : '/async_id_verification';

      const response: AxiosResponse<T> = await this.axiosInstance.request<T>({
        method: 'post',
        url: endpoint,
        data: request,
      });
      return response.data;
    } catch (err) {
      return Promise.reject<any>(err);
    }
  }

  /**
   * Poll job status from Smile.
   * @template T
   * @param {PartnerParams} partner_params - the user_id, job_id, and job_type of the job to submit.
   * Can additionally include optional parameters that Smile will return in the
   * job status.
   * @param {number} maxRetries - Number of times to retry the request.
   * @param {number} timeout  Polling timeout in milliseconds.
   * @param {number} return_history  whether to return history.
   * @param {number} return_images  Whether to return images.
   * @returns {Promise<any>} A promise that resolves to the job status.
   * @throws {Error} If any of the required parameters are missing or if the request fails.
   */
  async pollJobStatus(
    partner_params: PartnerParams,
    maxRetries: number = 4,
    timeout: number = 5000,
    return_history: boolean = false,
    return_images: boolean = false,
  ): Promise<any> {
    try {
      validatePartnerParams(partner_params);
      const data = {
        user_id: partner_params.user_id,
        job_id: partner_params.job_id,
        partner_id: this.partner_id,
        history: return_history,
        image_links: return_images,
        ...new Signature(this.partner_id, this.api_key).generate_signature(),
      };

      const pollEndpoint = (retries: number): Promise<any> => {
        return new Promise((resolve, reject) => {
          this.axiosInstance
            .post('/job_status', data)
            .then((response: AxiosResponse) => {
              if (response.data.job_complete || retries === 0) {
                return resolve(response.data);
              }
              // throw an error to force a retry in the catch
              // block
              throw new Error('Force a retry...');
            })
            .catch(() => {
              if (retries > 0) {
                setTimeout(() => {
                  pollEndpoint(retries - 1)
                    .then(resolve)
                    .catch(reject);
                }, timeout);
              } else {
                // Max retries reached, reject with the error
                reject(
                  new Error('Max retries reached. unable to poll job status.'),
                );
              }
            });
        });
      };
      return await pollEndpoint(maxRetries);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
