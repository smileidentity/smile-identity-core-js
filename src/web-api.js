const fs = require('fs');
const https = require('https');
const path = require('path');
const url = require('url');
const JSzip = require('jszip');
const Signature = require('./signature');
const Utilities = require('./utilities');
const IDApi = require('./id-api');
const { mapServerUri, sdkVersionInfo, validatePartnerParams } = require('./helpers');

const getWebToken = (
  partner_id,
  api_key,
  sidUrl,
  requestParams,
  defaultCallback,
) => new Promise((resolve, reject) => {
  if (!requestParams) {
    reject(new Error('Please ensure that you send through request params'));
  }

  if (typeof requestParams !== 'object') {
    reject(new Error('Request params needs to be an object'));
  }

  if (!(requestParams.callback_url || defaultCallback)) {
    reject(new Error('Callback URL is required for this method'));
  }

  ['user_id', 'job_id', 'product'].forEach((requiredParam) => {
    if (!requestParams[requiredParam]) {
      reject(new Error(`${requiredParam} is required to get a web token`));
    }
  });

  const timestamp = new Date().toISOString();

  const body = JSON.stringify({
    user_id: requestParams.user_id,
    job_id: requestParams.job_id,
    product: requestParams.product,
    callback_url: requestParams.callback_url || defaultCallback,
    partner_id: this.partner_id,
    ...new Signature(
      partner_id,
      api_key,
    ).generate_signature(timestamp),
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

const hasSelfieImage = (imageData) => [0, 2].includes(imageData.image_type_id);

const validateImages = (images, useEnrolledImage, jobType) => {
  if (!images) {
    throw new Error('Please ensure that you send through image details');
  }

  if (!Array.isArray(images)) {
    throw new Error('Image details needs to be an array');
  }

  // most job types require at least a selfie,
  // JT6 does not when `use_enrolled_image` flag is passed
  if (images.length === 0 || !(
    images.some(hasSelfieImage) || (useEnrolledImage && jobType === 6))
  ) {
    throw new Error('You need to send through at least one selfie image');
  }
};

const validateIdInfo = (idInfo, jobType) => {
  if (!('entered' in idInfo) || idInfo.entered.toString() === 'false') {
    idInfo.entered = 'false';

    // ACTION: document verification jobs do not check for `country` and `id_type`
    if (jobType === 6) {
      ['country', 'id_type'].forEach((key) => {
        if (!idInfo[key] || idInfo[key].length === 0) {
          throw new Error(`Please make sure that ${key} is included in the id_info`);
        }
      });
    }
  }

  if ('entered' in idInfo && idInfo.entered.toString() === 'true') {
    ['country', 'id_type', 'id_number'].forEach((key) => {
      if (!idInfo[key] || idInfo[key].length === 0) {
        throw new Error(`Please make sure that ${key} is included in the id_info`);
      }
    });
  }
  return idInfo;
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
    value = false;
  }
  if (typeof value !== 'boolean') {
    throw new Error(`${key} needs to be a boolean`);
  }
  return value;
};

const validateReturnData = (callbackUrl, returnJobStatus) => {
  if ((typeof callbackUrl !== 'string' || callbackUrl.length === 0) && !returnJobStatus) {
    throw new Error('Please choose to either get your response via the callback or job status query');
  }
};

const hasImage = (imageData) => [1, 3].includes(imageData.image_type_id);
const hasIDImage = (imageData) => [1, 3].includes(imageData.image_type_id);

const validateEnrollWithId = (images, idInfo) => {
  if (!images.some(hasImage) && (!idInfo.entered || idInfo.entered.toString() !== 'true')) {
    throw new Error('You are attempting to complete a job type 1 without providing an id card image or id info');
  }
};

const validateDocumentVerification = (images) => {
  if (!images.some(hasIDImage)) {
    throw new Error('You are attempting to complete a Document Verification job without providing an id card image');
  }
};

// calculate an outgoing signature
const determineSignature = (data, timestamp) => new Signature(
  data.partner_id,
  data.api_key,
).generate_signature(timestamp || data.timestamp);

const configureImagePayload = (data) => {
  // differentiate between image files and base64 images based on the image_type_id
  const images = [];
  data.images.forEach((i) => {
    if ([0, 1].includes(parseInt(i.image_type_id, 10))) {
      images.push({
        image_type_id: i.image_type_id,
        image: '',
        file_name: path.basename(i.image),
      });
    } else {
      images.push({
        image_type_id: i.image_type_id,
        image: i.image,
        file_name: '',
      });
    }
  });
  return images;
};

const configurePrepUploadJson = (data) => JSON.stringify({
  callback_url: data.callback_url,
  file_name: 'selfie.zip',
  model_parameters: {},
  partner_params: data.partner_params,
  signature: determineSignature(data).signature,
  smile_client_id: data.partner_id,
  timestamp: data.timestamp,
  use_enrolled_image: data.use_enrolled_image,
  ...sdkVersionInfo,
});

const configureInfoJson = (data, serverInformation) => {
  // create the json file sent as part of the zip file
  const info = {
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
    images: configureImagePayload(data),
    server_information: serverInformation,
  };
  return info;
};

const queryJobStatus = (data, options, counter = 0) => {
  // call job status for the result of the job
  const timeout = counter < 4 ? 2000 : 4000;
  counter += 1;
  new Utilities(data.partner_id, data.api_key, data.url).get_job_status(
    data.partner_params.user_id,
    data.partner_params.job_id,
    {
      return_history: data.return_history,
      return_images: data.return_images,
      signature: options.signature,
    },
  ).then((body) => {
    if (!body.job_complete) {
      if (counter > 21) {
        data.reject(new Error('Timeout waiting for job status response.'));
        return;
      }
      setTimeout(() => { queryJobStatus(data, options, counter); }, timeout);
    } else {
      data.resolve(body);
    }
  }).catch(() => {
    setTimeout(() => { queryJobStatus(data, options, counter); }, timeout);
  });
};

const uploadFile = (data, options, signedUrl, SmileJobId) => {
  // upload zip file to s3 using the signed link obtained from the upload lambda
  const reqOptions = url.parse(signedUrl);
  reqOptions.headers = {
    'Content-Type': 'application/zip',
    'Content-Length': `${data.zip.length}`,
  };
  reqOptions.method = 'PUT';
  const req = https.request(reqOptions, (resp) => {
    resp.setEncoding('utf8');
    resp.on('data', () => {});

    resp.on('end', () => {
      if (resp.statusCode === 200) {
        if (data.return_job_status) {
          queryJobStatus(data, options);
          return;
        }
        data.resolve({ success: true, smile_job_id: SmileJobId });
        return;
      }
      data.reject(new Error(`Zip upload status code: ${resp.statusCode}`));
    });
  });
  req.write(Buffer.from(data.zip));
  req.end();
  req.on('error', (err) => {
    data.reject(err);
  });
};

const zipUpFile = (data, infoJson, callback) => {
  // create zip file in memory
  const zip = new JSzip();
  zip.file('info.json', JSON.stringify(infoJson));
  data.images.forEach((image) => {
    if ([0, 1].indexOf(parseInt(image.image_type_id, 10)) > -1) {
      zip.file(path.basename(image.image), fs.readFileSync(image.image));
    }
  });
  zip.generateAsync({ type: 'uint8array' }).then((zipFile) => {
    data.zip = zipFile;
    callback();
  });
};

const setupRequests = (data, options) => {
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
  return new Promise((resolve, reject) => {
    data.resolve = resolve;
    data.reject = reject;
    const req = https.request(reqOptions, (resp) => {
      resp.setEncoding('utf8');
      resp.on('data', (chunk) => {
        json += chunk;
      });

      resp.on('end', () => {
        if (resp.statusCode === 200) {
          const prepUploadResponse = JSON.parse(json);
          const infoJson = configureInfoJson(data, prepUploadResponse);

          const cb = () => uploadFile(
            data,
            options,
            prepUploadResponse.upload_url,
            prepUploadResponse.smile_job_id,
          );

          zipUpFile(data, infoJson, cb);
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
};

class WebApi {
  constructor(partner_id, default_callback, api_key, sid_server) {
    this.partner_id = partner_id;
    this.default_callback = default_callback;
    this.api_key = api_key;
    this.url = mapServerUri(sid_server);
  }

  submit_job(partner_params, image_details, id_info, options = {}) {
    try {
      validatePartnerParams(partner_params);
    } catch (err) {
      return Promise.reject(err);
    }

    const jobType = parseInt(partner_params.job_type, 10);

    if (jobType === 5) {
      return new IDApi(this.partner_id, this.api_key, this.url).submit_job(partner_params, id_info);
    }

    // define the data and functions we will need
    const data = {
      partner_id: this.partner_id,
      api_key: this.api_key,
      url: this.url,
      callback_url: (options && options.optional_callback) || this.default_callback,
      timestamp: new Date().toISOString(),
      images: image_details,
      partner_params: {
        ...partner_params,
        job_type: jobType,
      },
    };

    try {
      const idInfo = validateIdInfo(id_info, jobType);
      data.idInfo = idInfo;
      validateImages(image_details, options.use_enrolled_image, jobType);
      const booleanKeys = ['return_job_status', 'return_history', 'return_images', 'use_enrolled_image'];
      booleanKeys.forEach((key) => {
        data[key] = checkBoolean(key, options[key]);
      });
      validateReturnData(data.callback_url, data.return_job_status);
      if (jobType === 1) {
        validateEnrollWithId(image_details, idInfo);
      } else if (jobType === 6) {
        validateDocumentVerification(image_details);
      }
    } catch (err) {
      return Promise.reject(err);
    }
    return setupRequests(data, options);
  }

  get_job_status(partner_params, options) {
    return new Utilities(
      this.partner_id,
      this.api_key,
      this.url,
    ).get_job_status(partner_params.user_id, partner_params.job_id, options);
  }

  get_web_token(requestParams) {
    return getWebToken(
      this.partner_id,
      this.api_key,
      this.url,
      requestParams,
      this.default_callback,
    );
  }
}

module.exports = WebApi;
