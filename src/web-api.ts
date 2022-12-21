import fs from 'fs';
import path from 'path';
import axios from 'axios';
import JSzip from 'jszip';
import Signature from './signature';
import { Utilities } from './utilities';
import { IDApi } from './id-api';
import { mapServerUri, sdkVersionInfo, validatePartnerParams } from './helpers';
import { getWebToken } from './web-token';
import { IdInfo, PartnerParams, OptionsParam, TokenRequestParams } from "./shared";

/**
 * Validates if the information required to submit a job is present.
 *
 * @param {{
 *  entered: boolean|string|undefined,
 *  country: string|undefined,
 *  id_type: string|undefined,
 *  id_number: string|undefined,
 * }} idInfo - ID information required to create a job.
 * @param {number} jobType - Smile Job Type
 * @returns {string} value representing if `entered` is true or false.
 */
const validateIdInfo = (idInfo: IdInfo, jobType: number) => {
  idInfo.entered = idInfo.entered === undefined ? 'false' : idInfo.entered;
  if (!('entered' in idInfo) || idInfo.entered.toString() === 'false') {
    if (jobType === 6) { // NOTE: document verification does not check for `country` and `id_type`.
      ['country', 'id_type'].forEach((key) => {
        const idKey = key as keyof IdInfo;
        if (!idInfo[idKey] || (idInfo[idKey] as string).length === 0) {
          throw new Error(`Please make sure that ${key} is included in the id_info`);
        }
      });
    }
    return 'false';
  } if ('entered' in idInfo && idInfo.entered.toString() === 'true') {
    ['country', 'id_type', 'id_number'].forEach((key) => {
      const idKey = key as keyof IdInfo;
      if (!idInfo[idKey] || (idInfo[idKey] as string).length === 0) {
        throw new Error(`Please make sure that ${key} is included in the id_info`);
      }
    });
    return 'true';
  }
  throw new Error('Please make sure that idInfo.entered is either true, false, or undefined');
};

/**
 * Type checks boolean value, throws error if not a boolean or falsy, and returns coerced boolean.
 *
 * @param {string} key - The name of the boolean key.
 * @param {boolean|undefined|null} value - The boolean value.
 * @returns {boolean} - true if bool is true, false if bool is falsy.
 * @throws {Error} - if bool is not a boolean.
 */
const checkBoolean = (key: string, value: boolean | null): boolean => {
  if (!value) {
    return false;
  }
  if (typeof value !== 'boolean') {
    throw new Error(`${key} needs to be a boolean`);
  }
  return true;
};

/**
 * Coerces keys in an object to booleans. Throws error if any keys are not booleans.
 *
 * @param {object} options - The object to coerce.
 * @param {boolean|undefined|null} options.return_job_status - Whether to return job status.
 * @param {boolean|undefined|null} options.return_images - Whether to return images.
 * @param {boolean|undefined|null} options.return_history - Whether to return job history.
 * @param {boolean|undefined|null} options.use_enrolled_image - Whether to use a previously
 * uploaded selfie image.
 * @returns {{
 *  return_job_status: boolean,
 *  return_images: boolean,
 *  return_history: boolean,
 *  use_enrolled_image: boolean
 * }} The options object with each key value coerced to a boolean.
 * @throws {Error} - if any keys are not booleans.
 */
const validateBooleans = (options: OptionsParam): OptionsParam => {
  const obj: OptionsParam = {};
  const booleanKeys = ['return_job_status', 'return_history', 'return_images', 'use_enrolled_image'];
  booleanKeys.forEach((key) => {
    const optionKey = key as keyof OptionsParam;
    obj[key] = checkBoolean(key, options[optionKey] as boolean);
  });
  return obj;
};

/**
 * Validates if the valid options were set to return data from the API.
 *
 * @param {string|undefined} callbackUrl - The callback URL.
 * @param {boolean} returnJobStatus - Whether to return job status.
 */
const validateReturnData = (callbackUrl: string | undefined, returnJobStatus: boolean) => {
  if ((typeof callbackUrl !== 'string' || callbackUrl.length === 0) && !returnJobStatus) {
    throw new Error('Please choose to either get your response via the callback or job status query');
  }
};

/**
 * Checks to see if an image is an ID card front image.
 *
 * @param {object} image - image object
 * @param {number} image.image_type_id - smile image type.
 * @returns {boolean} - true if image is a ID card front image, false otherwise.
 */
const hasIdImage = ({ image_type_id }: {
  image_type_id: number;
  image: string;
}): boolean => [1, 3].includes(image_type_id);

/**
 * Checks to see if an image is a selfie image.
 *
 * @param {object} image - image object
 * @param {number} image.image_type_id - smile image type.
 * @returns {boolean} - true if image is a ID card front image, false otherwise.
 */
const hasSelfieImage = ({ image_type_id }: {
  image_type_id: number,
  image: string
}) => [0, 2].includes(image_type_id);

/**
 * Checks to ensure required images for job type 1 are present.
 *
 * @param {Array<{
 *  image_type_id: number
 * }>} images - Array of images to be uploaded to smile.
 * @param {boolean} entered - Whether to use a previously uploaded selfie image.
 * @returns {void}
 * @throws {Error} - if images does not contain an image of the front of an id card.
 */
const validateEnrollWithId = (images: Array<{
  image_type_id: number;
  image: string;
}>, entered?: boolean | string): void => {
  if (!images.some(hasIdImage) && (!entered || entered.toString() !== 'true')) {
    throw new Error('You are attempting to complete a job type 1 without providing an id card image or id info');
  }
};

/**
 * Checks to ensure if images contains an id card image.
 *
 * @param {Array<{
 *  image_type_id: number
 * }>} images - Array of images to be uploaded to smile.
 * @returns {void}
 * @throws {Error} - if images does not contain an image of the front of an id card.
 */
const validateDocumentVerification = (images: Array<{
  image_type_id: number;
  image: string;
}>): void => {
  if (!images.some(hasIdImage)) {
    throw new Error('You are attempting to complete a Document Verification job without providing an id card image');
  }
};

/**
 * Checks to ensure if images is an array and contains a selfie image, or
 * if we can use an enrolled image instead.
 *
 * @param {Array<{
 * image_type_id: number
 * }>} images - Array of images to be uploaded to smile.
 * @param {boolean|undefined} useEnrolledImage - Whether to use a previously uploaded selfie image.
 * @param {number} jobType - The job type.
 * @returns {void}
 * @throws {Error} - if images does not contain a selfie image.
 */
const validateImages = (images: Array<{
  image_type_id: number,
  image: string
}>, useEnrolledImage: boolean | undefined, jobType: number): void => {
  if (!images) {
    throw new Error('Please ensure that you send through image details');
  }

  if (!Array.isArray(images)) {
    throw new Error('Image details needs to be an array');
  }

  // most job types require at least a selfie,
  // JT6 does not when `use_enrolled_image` flag is passed
  if (
    (!images.some(hasSelfieImage) || images.length === 0)
    && (!useEnrolledImage || jobType !== 6)
  ) {
    throw new Error('You need to send through at least one selfie image');
  }
};

/**
 * Differentiates between image files and base64 images based on the image_type_id.
 *
 * @param {Array<{
 *  image_type_id: number
 *  image: string
 * }>} images - Array of images to be uploaded to smile.
 * @returns {Array<{
 *  image_type_id: number,
 *  image: string,
 *  file_name: string,
 * }>} - Array of images with image split by file_name and base64.
 */
const configureImagePayload = (images: Array<{
  image_type_id: number;
  image: string;
}>): Array<{
  image_type_id: number;
  image: string;
  file_name: string;
}> => images.map(({ image, image_type_id }) => {
  const imageTypeId = parseInt(image_type_id.toString(), 10);
  if ([0, 1].includes(image_type_id)) {
    return {
      image_type_id: imageTypeId,
      image: '',
      file_name: path.basename(image),
    };
  }
  return {
    image_type_id: imageTypeId,
    image,
    file_name: '',
  };
});

/**
 * Formats upload payload.
 *
 * @param {{
 *  api_key: string,
 *  callback_url: string,
 *  idInfo: object,
 *  partner_id: string,
 *  partner_params: object,
 *  timestamp: string|number,
 *  use_enrolled_image: boolean,
 * }} options - The options object.
 * @returns {object} - formatted payload.
 */
const configurePrepUploadPayload = ({
  api_key,
  callback_url,
  idInfo,
  partner_id,
  partner_params,
  timestamp,
  use_enrolled_image,
}: {[k:string]:string}): object => ({
  callback_url,
  file_name: 'selfie.zip',
  model_parameters: {},
  partner_params,
  smile_client_id: partner_id,
  use_enrolled_image,
  ...idInfo,
  ...new Signature(partner_id, api_key).generate_signature(timestamp),
  ...sdkVersionInfo,
});

/**
 * Creates the json file sent as part of the zip file
 *
 * @param {object} data - data to be sent to smile.
 * @param {object} serverInformation - server information.
 * @returns {object} - formatted payload.
 */
const configureInfoJson = (data: { [k: string]: string | number | Array<{ [k: string]: number | string }> }, serverInformation: { [k: string]: string | number }) => ({
  package_information: {
    apiVersion: {
      buildNumber: 0,
      majorVersion: 2,
      minorVersion: 0,
    },
    language: 'javascript',
  },
  misc_information: {
    signature: data.signature,
    retry: 'false',
    partner_params: data.partner_params,
    timestamp: data.timestamp,
    file_name: 'selfie.zip',
    smile_client_id: data.partner_id,
    callback_url: data.callback_url,
    userData: { // TO ASK what goes here
      isVerifiedProcess: false,
      name: '',
      fbUserID: '',
      firstName: 'Bill',
      lastName: '',
      gender: '',
      email: '',
      phone: '',
      countryCode: '+',
      countryName: '',
    },
  },
  id_info: data.idInfo,
  images: configureImagePayload(data.images as Array<{
    image_type_id: number,
    image: string
  }>),
  server_information: serverInformation,
});

/**
 * Polls the smile server for the result of the job.
 *
 * @param {{
 *  api_key: string,
 *  partner_id: string,
 *  partner_params: object,
 *  url: string,
 *  return_history: boolean,
 *  return_images: boolean,
 * }} data - data required to check the status of the job.
 * @param {number|undefined} counter - The number of times the function has been called.
 * @returns {Promise<object>} - the response from the smile server.
 * @throws {Error} - if the request fails or times out.
 */
const queryJobStatus = ({
  api_key,
  partner_id,
  partner_params,
  url: sidUrl,
  return_history,
  return_images,
}: {
  api_key: string;
  partner_id: string;
  partner_params: PartnerParams;
  url: string;
  return_history: boolean;
  return_images: boolean;
}, counter: number | undefined = 0): Promise<object> => new Promise((resolve, reject) => {
  // call job status for the result of the job
  const timeout = counter < 4 ? 2000 : 4000;
  const updatedCounter = counter + 1;

  const retryFunc = (currentCounter: number) => {
    setTimeout(
      () => {
        queryJobStatus({
          api_key,
          partner_id,
          partner_params,
          url: sidUrl,
          return_history,
          return_images,
        }, currentCounter).then(resolve).catch(reject);
      },
      timeout,
    );
  };
  new Utilities(partner_id, api_key, sidUrl).get_job_status(
    partner_params.user_id,
    partner_params.job_id,
    { return_history, return_images },
  ).then((body) => {
    if (!body.job_complete) {
      if (updatedCounter > 21) {
        reject(new Error('Timeout waiting for job status response.'));
        return;
      }
      retryFunc(updatedCounter);
    } else {
      resolve(body);
    }
  }).catch(() => { retryFunc(updatedCounter); });
});

/**
 * Upload zip file to s3 using the signed link obtained from the upload lambda
 *
 * @param {object} data - data required to upload the zip file to s3.
 * @param {string} zipFile - the zip file to be uploaded in base64.
 * @param {string} signedUrl - the signed url to upload the zip file to.
 * @param {string} smile_job_id - the smile job id returned from the upload response.
 * @returns {Promise<void>} - resolves when the file has been uploaded.
 * @throws {Error} - if the request fails or times out.
 */
const uploadFile = (
  data: { [k: string]: string | number | Array<{}> },
  zipFile: Uint8Array,
  signedUrl: string,
  smile_job_id: string,
): Promise<object> => axios.put(
  signedUrl,
  zipFile,
  {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Length': `${zipFile.length}`,
    },
  },
).then((resp) => {
  if (resp.status === 200) {
    if (data.return_job_status) {
      return queryJobStatus(data);
    }
    return Promise.resolve({ success: true, smile_job_id });
  }
  return Promise.reject(new Error(`Zip upload status code: ${resp.status}`));
});

/**
 * Creates a zip file containing the images and the json file.
 *
 * @param {Array<{
 *  image_type_id: number
 *  image: string
 *  file_name: string
 * }>} images - images to be zipped.
 * @param {object} infoJson - metadata associated with the job.
 * @returns {Promise<Uint8Array>} - the zip file.
 */
const zipUpFile = (images: Array<{
  image_type_id: number;
  image: string;
  file_name: string;
}>, infoJson: object): Promise<Uint8Array> => {
  // create zip file in memory
  const zip = new JSzip();
  zip.file('info.json', JSON.stringify(infoJson));
  images.filter((image) => [0, 1].includes(image.image_type_id)).forEach((image) => {
    zip.file(path.basename(image.image), fs.readFileSync(image.image));
  });
  return zip.generateAsync({ type: 'uint8array' });
};

/**
 * Make the first call to the upload lambda to get the url, then pack the zip, then upload the zip.
 *
 * @param {object} payload - data required to upload the zip file to s3.
 * @returns {Promise<object>} the job status response.
 */
const setupRequests = (payload: { [k: string]: any }): Promise<object> => axios.post(
  `https://${payload.url}/upload`,
  configurePrepUploadPayload(payload),
).then(({ data }) => Promise.all([
  zipUpFile(payload.images, configureInfoJson(payload, data)),
  Promise.resolve(data),
])).then(([zipFile,
  { upload_url, smile_job_id }]) => uploadFile(payload, zipFile, upload_url, smile_job_id));

export class WebApi {
  /**
   * Creates an instance of WebApi.
   *
   * @param {string} partner_id - Your Smile Partner ID
   * @param {string} default_callback - The default callback url to use for all requests.
   * @param {string} api_key - Your Smile API Key
   * @param {string|number} sid_server - The server to use for the SID API. 0 for
   * staging and 1 for production.
   */
  partner_id: string
  default_callback: string
  api_key: string
  url: string
  constructor(partner_id: string, default_callback: string, api_key: string, sid_server: string | number) {
    this.partner_id = partner_id;
    this.default_callback = default_callback;
    this.api_key = api_key;
    this.url = mapServerUri(sid_server);
  }

  /**
   * Get the status of an existing job.
   *
   * @param {{
   *  user_id: string,
   *  job_id: string,
   * }} partner_params - the user_id and job_id of the job to check.
   * @param {{
   *  return_history: boolean,
   *  return_images: boolean,
   * }} options - indicates whether to return the history and/or images.
   * @returns {Promise<object>} A promise that resolves to the job status.
   * @throws {Error} If any of the required parameters are missing or if the request fails.
   * @memberof WebApi
   */
  get_job_status(partner_params: PartnerParams, options: OptionsParam) {
    return new Utilities(this.partner_id, this.api_key, this.url).get_job_status(
      partner_params.user_id,
      partner_params.job_id,
      options,
    );
  }

  /**
   * Get a authorization token for the hosted web integration.
   *
   * @param {{
   *  callback_url: string,
   *  user_id: string,
   *  job_id: string,
   *  product: string,
   * }} requestParams - parameters required to get an authorization token.
   * @returns {Promise<{
   *  token: string,
   * }>} - The authorization token.
   * @throws {Error} If any of the required parameters are missing or if the request fails.
   * @memberof WebApi
   */
  get_web_token(requestParams: TokenRequestParams) {
    return getWebToken(
      this.partner_id,
      this.api_key,
      this.url,
      requestParams,
      this.default_callback,
    );
  }

  /**
   * Submit a job to Smile.
   *
   * @param {{
   *  user_id: string,
   *  job_id: string,
   *  job_type: string|number,
   * }} partner_params - the user_id, job_id, and job_type of the job to submit.
   * Can additionally include optional parameters that Smile will return in the
   * job status.
   * @param {Array<{
   *  image_type_id: string|number,
   *  image: string,
   * }>} image_details - an array of image objects. Each image object must include an image_type_id
   * and an image. See constants.js for a list of valid image_type_ids.
   * @param {{
   *  entered: boolean|string|undefined,
   *  country: string|undefined,
   *  id_type: string|undefined,
   *  id_number: string|undefined,
   * }} id_info - ID information required to create a job.
   * @param {{
   *  optional_callback: string,
   *  return_job_status: boolean,
   *  return_images: boolean,
   *  return_history: boolean,
   *  use_enrolled_image: boolean
   * }} options - options to control the response.
   * @returns {Promise<object>} A promise that resolves to the job status.
   * @throws {Error} If any of the required parameters are missing or if the request fails.
   * @memberof WebApi
   */
  submit_job(partner_params: PartnerParams, image_details: Array<{
    image_type_id: number;
    image: string;
  }>, id_info: IdInfo, options: OptionsParam = {}): Promise<object> {
    if (parseInt(partner_params && partner_params.job_type.toString(), 10) === 5) {
      return new IDApi(this.partner_id, this.api_key, this.url).submit_job(partner_params, id_info);
    }

    try {
      validatePartnerParams(partner_params);
      const callbackUrl = (options && options.optional_callback) || this.default_callback;
      const jobType = parseInt(partner_params.job_type.toString(), 10);
      const data = {
        partner_id: this.partner_id,
        api_key: this.api_key,
        url: this.url,
        callback_url: callbackUrl,
        timestamp: new Date().toISOString(),
        images: image_details,
        partner_params: {
          ...partner_params,
          job_type: jobType,
        },
        idInfo: {
          ...id_info,
          entered: validateIdInfo(id_info, jobType),
        },
        ...validateBooleans(options),
      };

      validateImages(image_details, options.use_enrolled_image, jobType);
      validateReturnData(callbackUrl, data.return_job_status);

      if (jobType === 1) {
        validateEnrollWithId(image_details, data.idInfo.entered);
      } else if (jobType === 6) {
        validateDocumentVerification(image_details);
      }

      return setupRequests(data);
    } catch (err) {
      return Promise.reject(err);
    }
  }
}

module.exports = WebApi;
export {}