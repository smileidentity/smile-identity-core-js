const fs = require('fs');
const https = require('https');
const path = require('path');
const url = require('url');
const JSzip = require('jszip');
const Signature = require('./signature');
const Utilities = require('./utilities');
const IDApi = require('./id-api');
const { mapServerUri, sdkVersionInfo, validatePartnerParams } = require('./helpers');

/**
 * Gets an authorization token from Smile. Used in Hosted Web Integration.
 *
 * @param {string} partner_id - The partner ID.
 * @param {string} api_key - Your Smile API key.
 * @param {string} sidUrl - The URL to the Smile ID API.
 * @param {string|undefined} defaultCallback - Your default callback URL.
 * @param {{
 * callback_url: string,
 * user_id: string,
 * job_id: string,
 * product: string,
 * }} requestParams - parameters required to get an authorization token.
 * @returns {string} - The authorization token.
 * @throws {Error} - if the request fails.
 */
const getWebToken = (
  partner_id,
  api_key,
  sidUrl,
  defaultCallback,
  requestParams,
) => new Promise((resolve, reject) => {
  if (!requestParams) {
    reject(new Error('Please ensure that you send through request params'));
    return;
  }

  if (typeof requestParams !== 'object') {
    reject(new Error('Request params needs to be an object'));
    return;
  }
  const callbackUrl = requestParams.callback_url || defaultCallback;

  if (typeof callbackUrl !== 'string' || callbackUrl.length === 0) {
    reject(new Error('Callback URL is required for this method'));
    return;
  }

  ['user_id', 'job_id', 'product'].forEach((requiredParam) => {
    if (!requestParams[requiredParam]) {
      reject(new Error(`${requiredParam} is required to get a web token`));
      // NOTE: should return here
    }
  });

  const body = JSON.stringify({
    user_id: requestParams.user_id,
    job_id: requestParams.job_id,
    product: requestParams.product,
    callback_url: callbackUrl,
    partner_id: this.partner_id,
    ...new Signature(
      partner_id,
      api_key,
    ).generate_signature(),
  });

  let json = '';
  const options = {
    hostname: sidUrl.split('/')[0],
    path: `/${sidUrl.split('/')[1]}/token`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const req = https.request(options, (resp) => {
    resp.setEncoding('utf8');

    resp.on('data', (chunk) => {
      json += chunk;
    });

    resp.on('end', () => {
      if (resp.statusCode === 200) {
        const tokenResponse = JSON.parse(json);

        resolve(tokenResponse);
      } else {
        const err = JSON.parse(json);

        reject(new Error(`${err.code}: ${err.error}`));
      }
    });
  });

  req.write(body);
  req.end();

  req.on('error', (err) => {
    reject(new Error(`${err.code}:${err.error}`));
  });
});

/**
 * Validates if the information required to submit a job is present.
 *
 * @param {{
 * entered: boolean|string|undefined,
 * country: string|undefined,
 * id_type: string|undefined,
 * id_number: string|undefined,
 * }} idInfo - ID information required to create a job.
 * @param {number} jobType - Smile Job Type
 * @returns {string} value representing if `entered` is true or false.
 */
const validateIdInfo = (idInfo, jobType) => {
  if (!('entered' in idInfo) || idInfo.entered.toString() === 'false') {
    if (jobType === 6) { // NOTE: document verification does not check for `country` and `id_type`.
      ['country', 'id_type'].forEach((key) => {
        if (!idInfo[key] || idInfo[key].length === 0) {
          throw new Error(`Please make sure that ${key} is included in the id_info`);
        }
      });
    }
    return 'false';
  } if ('entered' in idInfo && idInfo.entered.toString() === 'true') {
    ['country', 'id_type', 'id_number'].forEach((key) => {
      if (!idInfo[key] || idInfo[key].length === 0) {
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
const checkBoolean = (key, value) => {
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
const validateBooleans = (options) => {
  const obj = {};
  const booleanKeys = ['return_job_status', 'return_history', 'return_images', 'use_enrolled_image'];
  booleanKeys.forEach((key) => {
    obj[key] = checkBoolean(key, options[key]);
  });
  return obj;
};

/**
 * Validates if the valid options were set to return data from the API.
 *
 * @param {string|undefined} callbackUrl - The callback URL.
 * @param {boolean} returnJobStatus - Whether to return job status.
 */
const validateReturnData = (callbackUrl, returnJobStatus) => {
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
const hasIdImage = ({ image_type_id }) => [1, 3].includes(image_type_id);

/**
 * Checks to see if an image is a selfie image.
 *
 * @param {object} image - image object
 * @param {number} image.image_type_id - smile image type.
 * @returns {boolean} - true if image is a ID card front image, false otherwise.
 */
const hasSelfieImage = ({ image_type_id }) => [0, 2].includes(image_type_id);

/**
 * Checks to ensure required images for job type 1 are present.
 *
 * @param {Array<{
 *  image_type_id: number
 * }>} images - Array of images to be uploaded to smile.
 * @param {boolean|undefined} entered - Whether to use a previously uploaded selfie image.
 * @returns {undefined}
 * @throws {Error} - if images does not contain an image of the front of an id card.
 */
const validateEnrollWithId = (images, entered) => {
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
 * @returns {undefined}
 * @throws {Error} - if images does not contain an image of the front of an id card.
 */
const validateDocumentVerification = (images) => {
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
 * @returns {undefined}
 * @throws {Error} - if images does not contain a selfie image.
 */
const validateImages = (images, useEnrolledImage, jobType) => {
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
 * image_type_id: number,
 * image: string,
 * image_file: string,
 * }>} - Array of images with image split by file_name and base64.
 */
const configureImagePayload = (images) => images.map(({ image, image_type_id }) => {
  const imageTypeId = parseInt(image_type_id, 10);
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
 * api_key: string,
 * callback_url: string,
 * partner_id: string,
 * partner_params: object,
 * timestamp: string|number,
 * use_enrolled_image: boolean,
 * }} options - The options object.
 * @returns {object} - formatted payload.
 */
const configurePrepUploadJson = ({
  api_key,
  callback_url,
  partner_id,
  partner_params,
  timestamp,
  use_enrolled_image,
}) => JSON.stringify({
  callback_url,
  file_name: 'selfie.zip',
  model_parameters: {},
  partner_params,
  smile_client_id: partner_id,
  use_enrolled_image,
  ...new Signature(partner_id, api_key).generate_signature(timestamp),
  ...sdkVersionInfo,
});

// create the json file sent as part of the zip file
const configureInfoJson = (data, serverInformation) => ({
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
  id_info: data.id_info,
  images: configureImagePayload(data.images),
  server_information: serverInformation,
});

const queryJobStatus = (data, options, counter = 0) => new Promise((resolve, reject) => {
  // call job status for the result of the job
  const timeout = counter < 4 ? 2000 : 4000;
  const updatedCounter = counter + 1;

  const retryFunc = (c) => {
    setTimeout(
      () => {
        queryJobStatus(data, options, c).then(resolve).catch(reject);
      },
      timeout,
    );
  };
  new Utilities(data.partner_id, data.api_key, data.url).get_job_status(
    data.partner_params.user_id,
    data.partner_params.job_id,
    {
      return_history: data.return_history,
      return_images: data.return_images,
    },
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

// upload zip file to s3 using the signed link obtained from the upload lambda
const uploadFile = (
  data,
  options,
  zipFile,
  signedUrl,
  SmileJobId,
) => new Promise((resolve, reject) => {
  const reqOptions = url.parse(signedUrl);
  reqOptions.headers = {
    'Content-Type': 'application/zip',
    'Content-Length': `${zipFile.length}`,
  };
  reqOptions.method = 'PUT';
  const req = https.request(reqOptions, (resp) => {
    resp.setEncoding('utf8');
    resp.on('data', () => {});

    resp.on('end', () => {
      if (resp.statusCode === 200) {
        if (data.return_job_status) {
          queryJobStatus(data, options).then(resolve).catch(reject);
          return;
        }
        resolve({ success: true, smile_job_id: SmileJobId });
        return;
      }
      reject(new Error(`Zip upload status code: ${resp.statusCode}`));
    });
  });
  req.write(Buffer.from(zipFile));
  req.end();
  req.on('error', (err) => {
    reject(err);
  });
});

const zipUpFile = (data, infoJson) => {
  // create zip file in memory
  const zip = new JSzip();
  zip.file('info.json', JSON.stringify(infoJson));
  data.images.filter((image) => [0, 1].includes(image.image_type_id)).forEach((image) => {
    zip.file(path.basename(image.image), fs.readFileSync(image.image));
  });
  return zip.generateAsync({ type: 'uint8array' });
};

const setupRequests = (data, options) => new Promise((resolve, reject) => {
  // make the first call to the upload lambda
  let json = '';
  const body = configurePrepUploadJson(data);
  const reqOptions = {
    hostname: data.url.split('/')[0],
    path: `/${data.url.split('/')[1]}/upload`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const req = https.request(reqOptions, (resp) => {
    resp.setEncoding('utf8');
    resp.on('data', (chunk) => {
      json += chunk;
    });
    resp.on('end', () => {
      if (resp.statusCode === 200) {
        const prepUploadResponse = JSON.parse(json);
        const infoJson = configureInfoJson(data, prepUploadResponse);
        zipUpFile(data, infoJson).then((zipFile) => uploadFile(
          data,
          options,
          zipFile,
          prepUploadResponse.upload_url,
          prepUploadResponse.smile_job_id,
        )).then(resolve).catch(reject);
      } else {
        const err = JSON.parse(json);
        reject(new Error(`${err.code}:${err.error}`));
      }
    });
  });

  req.write(body);
  req.end();

  req.on('error', (err) => {
    reject(new Error(`${err.code}:${err.error}`));
  });
});

class WebApi {
  /**
   * Creates an instance of WebApi.
   *
   * @param {string} partner_id - Your Smile Partner ID
   * @param {string} default_callback - The default callback url to use for all requests.
   * @param {string} api_key - Your Smile API Key
   * @param {string|number} sid_server - The server to use for the SID API. 0 for
   * staging and 1 for production.
   */
  constructor(partner_id, default_callback, api_key, sid_server) {
    this.partner_id = partner_id;
    this.default_callback = default_callback;
    this.api_key = api_key;
    this.url = mapServerUri(sid_server);
  }

  /**
   * Get the status of an existing job.
   *
   * @param {{
   * user_id: string,
   * job_id: string,
   * }} partner_params - the user_id and job_id of the job to check.
   * @param {{
   * return_history: boolean,
   * return_images: boolean,
   * }} options - indicates whether to return the history and/or images.
   * @returns {Promise<object>} A promise that resolves to the job status.
   * @throws {Error} If any of the required parameters are missing or if the request fails.
   * @memberof WebApi
   */
  get_job_status(partner_params, options) {
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
   * callback_url: string,
   * user_id: string,
   * job_id: string,
   * product: string,
   * }} requestParams - parameters required to get an authorization token.
   * @returns {Promise<string>} A promise that resolves to the authorization token.
   * @throws {Error} If any of the required parameters are missing or if the request fails.
   * @memberof WebApi
   */
  get_web_token(requestParams) {
    return getWebToken(
      this.partner_id,
      this.api_key,
      this.url,
      this.default_callback,
      requestParams,
    );
  }

  /**
   * Submit a job to Smile.
   *
   * @param {{
   * user_id: string,
   * job_id: string,
   * job_type: string|number,
   * }} partner_params - the user_id, job_id, and job_type of the job to submit.
   * Can additionally include optional parameters that Smile will return in the
   * job status.
   * @param {Array<{
   * image_type_id: string|number,
   * image: string,
   * }>} image_details - an array of image objects. Each image object must include an image_type_id
   * and an image. See constants.js for a list of valid image_type_ids.
   * @param {{
   * entered: boolean|string|undefined,
   * country: string|undefined,
   * id_type: string|undefined,
   * id_number: string|undefined,
   * }} id_info - ID information required to create a job.
   * return_job_status: boolean,
   * }} data - the job data to submit.
   * @param {{
   * optional_callback: string,
   * return_job_status: boolean,
   * return_images: boolean,
   * return_history: boolean,
   * use_enrolled_image: boolean
   * }} options - options to control the response.
   * @returns {Promise<object>} A promise that resolves to the job status.
   * @throws {Error} If any of the required parameters are missing or if the request fails.
   * @memberof WebApi
   */
  submit_job(partner_params, image_details, id_info, options = {}) {
    if (parseInt(partner_params && partner_params.job_type, 10) === 5) {
      return new IDApi(this.partner_id, this.api_key, this.url).submit_job(partner_params, id_info);
    }

    try {
      validatePartnerParams(partner_params);
      const callbackUrl = (options && options.optional_callback) || this.default_callback;
      const jobType = parseInt(partner_params.job_type, 10);
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

      return setupRequests(data, options);
    } catch (err) {
      return Promise.reject(err);
    }
  }
}

module.exports = WebApi;
