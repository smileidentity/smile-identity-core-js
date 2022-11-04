const fs = require('fs');
const https = require('https');
const path = require('path');
const url = require('url');
const JSzip = require('jszip');
const Signature = require('./signature');
const Utilities = require('./utilities');
const IDApi = require('./id-api');

class WebApi {
  constructor(partner_id, default_callback, api_key, sid_server) {
    this.partner_id = partner_id;
    this.default_callback = default_callback;
    this.sid_server = sid_server;
    this.api_key = api_key;
    if (['0', '1'].includes(sid_server.toString())) {
      const sid_server_mapping = {
        0: 'testapi.smileidentity.com/v1',
        1: 'api.smileidentity.com/v1',
      };
      this.url = sid_server_mapping[sid_server.toString()];
    } else {
      this.url = sid_server;
    }
  }

  submit_job(partner_params, image_details, id_info, options = {}) {
    // define the data and functions we will need
    const _private = {
      data: {
        callback_url: (options && options.optional_callback) || this.default_callback,
        timestamp: (options && options.signature) ? new Date().toISOString() : Date.now(),
        url: this.url,
        partner_id: this.partner_id,
        api_key: this.api_key,
        sid_server: this.sid_server,
      },
      validateInputs() {
        // validate inputs and add them to our data store
        _private.partnerParams(partner_params);
        _private.idInfo(id_info);

        if (parseInt(partner_params.job_type, 10) !== 5) {
          _private.images(image_details);
          _private.checkBoolean('return_job_status', options.return_job_status);
          _private.checkBoolean('return_history', options.return_history);
          _private.checkBoolean('return_images', options.return_images);
          _private.checkBoolean('use_enrolled_image', options.use_enrolled_image);
        }
      },
      validateReturnData() {
        if (
          (!_private.data.callback_url || _private.data.callback_url.length === 0)
          && !_private.data.return_job_status
        ) {
          throw new Error('Please choose to either get your response via the callback or job status query');
        }
      },
      validateEnrollWithID() {
        const hasImage = (imageData) => [1, 3].includes(imageData.image_type_id);
        if (!_private.data.images.some(hasImage) && (!_private.data.id_info.entered || _private.data.id_info.entered.toString() !== 'true')) {
          throw new Error('You are attempting to complete a job type 1 without providing an id card image or id info');
        }
      },
      validateDocumentVerification() {
        const hasIDImage = (imageData) => [1, 3].includes(imageData.image_type_id);
        if (!_private.data.images.some(hasIDImage)) {
          throw new Error('You are attempting to complete a Document Verification job without providing an id card image');
        }
      },
      partnerParams(partnerParams) {
        if (!partnerParams) {
          throw new Error('Please ensure that you send through partner params');
        }

        if (typeof partnerParams !== 'object') {
          throw new Error('Partner params needs to be an object');
        }

        ['user_id', 'job_id', 'job_type'].forEach((key) => {
          if (!partnerParams[key]) {
            throw new Error(`Please make sure that ${key} is included in the partner params`);
          }
        });
        partnerParams.job_type = parseInt(partnerParams.job_type, 10);
        _private.data.partner_params = partnerParams;
      },
      images(images) {
        const hasSelfieImage = (imageData) => [0, 2].includes(imageData.image_type_id);
        if (!images) {
          throw new Error('Please ensure that you send through image details');
        }

        if (!Array.isArray(images)) {
          throw new Error('Image details needs to be an array');
        }

        // most job types require at least a selfie,
        // JT6 does not when `use_enrolled_image` flag is passed
        if (images.length === 0
          || !(
            images.some(hasSelfieImage)
            || (options.use_enrolled_image && parseInt(partner_params.job_type, 10) === 6)
          )
        ) {
          throw new Error('You need to send through at least one selfie image');
        }

        _private.data.images = images;
      },
      idInfo(idInfo) {
        if (!('entered' in idInfo) || idInfo.entered.toString() === 'false') {
          idInfo.entered = 'false';

          // ACTION: document verification jobs do not check for `country` and `id_type`
          if (_private.data.partner_params.job_type === 6) {
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

        _private.data.id_info = idInfo;
      },
      checkBoolean(key, bool) {
        if (!bool) {
          bool = false;
        }
        if (!!bool !== bool) {
          throw new Error(`${key} needs to be a boolean`);
        }

        _private.data[key] = bool;
      },
      determineSecKey(timestamp) {
        // calculate an outgoing signature
        return new Signature(
          _private.data.partner_id,
          _private.data.api_key,
        ).generate_sec_key(timestamp || _private.data.timestamp);
      },
      determineSignature(timestamp) {
        // calculate an outgoing signature
        return new Signature(
          _private.data.partner_id,
          _private.data.api_key,
        ).generate_signature(timestamp || _private.data.timestamp);
      },
      configurePrepUploadJson() {
        const body = {
          file_name: 'selfie.zip',
          use_enrolled_image: _private.data.use_enrolled_image,
          timestamp: _private.data.timestamp,
          smile_client_id: _private.data.partner_id,
          partner_params: _private.data.partner_params,
          model_parameters: {},
          callback_url: _private.data.callback_url,
        };
        if (options && options.signature) {
          body.signature = _private.determineSignature().signature;
        } else {
          body.sec_key = _private.determineSecKey().sec_key;
        }
        return JSON.stringify(body);
      },
      setupRequests() {
        // make the first call to the upload lambda
        let json = '';
        const body = _private.configurePrepUploadJson();
        const reqOptions = {
          hostname: _private.data.url.split('/')[0],
          path: `/${_private.data.url.split('/')[1]}/upload`,
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
              const infoJson = _private.configureInfoJson(prepUploadResponse);

              _private.zipUpFile(
                infoJson,
                () => _private.uploadFile(
                  prepUploadResponse.upload_url,
                  infoJson,
                  prepUploadResponse.smile_job_id,
                ),
              );
            } else {
              const err = JSON.parse(json);
              _private.data.reject(new Error(`${err.code}:${err.error}`));
            }
          });
        });

        req.write(body);
        req.end();

        req.on('error', (err) => {
          _private.data.reject(`${err.code}:${err.error}`);
        });
      },
      configureInfoJson(serverInformation) {
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
            sec_key: _private.data.sec_key,
            retry: 'false',
            partner_params: _private.data.partner_params,
            timestamp: _private.data.timestamp,
            file_name: 'selfie.zip',
            smile_client_id: _private.data.partner_id,
            callback_url: _private.data.callback_url,
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
          id_info: _private.data.id_info,
          images: _private.configureImagePayload(),
          server_information: serverInformation,
        };
        return info;
      },
      configureImagePayload() {
        // differentiate between image files and base64 images based on the image_type_id
        const images = [];
        _private.data.images.forEach((i) => {
          if ([0, 1].indexOf(parseInt(i.image_type_id, 10)) > -1) {
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
      },
      zipUpFile(info_json, callback) {
        // create zip file in memory
        const zip = new JSzip();
        zip.file('info.json', JSON.stringify(info_json));
        _private.data.images.forEach((image) => {
          if ([0, 1].indexOf(parseInt(image.image_type_id, 10)) > -1) {
            zip.file(path.basename(image.image), fs.readFileSync(image.image));
          }
        });
        zip.generateAsync({ type: 'uint8array' }).then((zipFile) => {
          _private.data.zip = zipFile;
          callback();
        });
      },
      QueryJobStatus(counter = 0) {
        // call job status for the result of the job
        const timeout = counter < 4 ? 2000 : 4000;
        counter += 1;
        new Utilities(_private.data.partner_id, _private.data.api_key, _private.data.sid_server)
          .get_job_status(
            _private.data.partner_params.user_id,
            _private.data.partner_params.job_id,
            {
              return_history: _private.data.return_history,
              return_images: _private.data.return_images,
              signature: options ? options.signature : false,
            },
          ).then((body) => {
            if (!body.job_complete) {
              if (counter > 21) {
                _private.data.reject(new Error('Timeout waiting for job status response.'));
                return;
              }
              setTimeout(() => {
                _private.QueryJobStatus(counter);
              }, timeout);
            } else {
              _private.data.resolve(body);
            }
          }).catch(() => {
            setTimeout(() => {
              _private.QueryJobStatus(counter);
            }, timeout);
          });
      },
      uploadFile(signedUrl, info_json, SmileJobID) {
        // upload zip file to s3 using the signed link obtained from the upload lambda
        const reqOptions = url.parse(signedUrl);
        reqOptions.headers = {
          'Content-Type': 'application/zip',
          'Content-Length': `${_private.data.zip.length}`,
        };
        reqOptions.method = 'PUT';
        const req = https.request(reqOptions, (resp) => {
          resp.setEncoding('utf8');
          resp.on('data', () => {});

          resp.on('end', () => {
            if (resp.statusCode === 200) {
              if (_private.data.return_job_status) {
                _private.QueryJobStatus();
                return;
              }
              _private.data.resolve({ success: true, smile_job_id: SmileJobID });
              return;
            }
            _private.data.reject(new Error(`Zip upload status code: ${resp.statusCode}`));
          });
        });
        req.write(Buffer.from(_private.data.zip));
        req.end();
        req.on('error', (err) => {
          _private.data.reject(err);
        });
      },
      setupIDApiRequest() {
        const idapiOptions = options || {};
        const promise = new IDApi(
          _private.data.partner_id,
          _private.data.api_key,
          _private.data.sid_server,
          {},
        ).submit_job(_private.data.partner_params, _private.data.id_info, idapiOptions);

        promise.then((idApiResp) => _private.data.resolve(idApiResp)).catch((err) => {
          throw _private.data.reject(err);
        });
      },
    };
    // this section kicks everything off
    const result = new Promise((resolve, reject) => {
      try {
        _private.data.resolve = resolve;
        _private.data.reject = reject;
        _private.validateInputs();

        if (parseInt(_private.data.partner_params.job_type, 10) === 5) {
          _private.setupIDApiRequest();
        } else {
          _private.validateReturnData();
          if (parseInt(_private.data.partner_params.job_type, 10) === 1) {
            _private.validateEnrollWithID();
          }
          if (parseInt(_private.data.partner_params.job_type, 10) === 6) {
            _private.validateDocumentVerification();
          }
          _private.setupRequests();
        }
      } catch (err) {
        reject(err);
      }
    });
    return result;
  }

  get_job_status(partner_params, options) {
    return new Utilities(this.partner_id, this.api_key, this.sid_server)
      .get_job_status(partner_params.user_id, partner_params.job_id, options);
  }

  get_web_token(requestParams) {
    return new Promise((resolve, reject) => {
      if (!requestParams) {
        reject(new Error('Please ensure that you send through request params'));
      }

      if (typeof requestParams !== 'object') {
        reject(new Error('Request params needs to be an object'));
      }

      if (!(requestParams.callback_url || this.default_callback)) {
        reject(new Error('Callback URL is required for this method'));
      }

      ['user_id', 'job_id', 'product'].forEach((requiredParam) => {
        if (!requestParams[requiredParam]) {
          reject(new Error(`${requiredParam} is required to get a web token`));
        }
      });

      const timestamp = new Date().toISOString();
      const { signature } = new Signature(
        this.partner_id,
        this.api_key,
      ).generate_signature(timestamp);

      const body = JSON.stringify({
        user_id: requestParams.user_id,
        job_id: requestParams.job_id,
        product: requestParams.product,
        callback_url: requestParams.callback_url || this.default_callback,
        partner_id: this.partner_id,
        signature,
        timestamp,
      });

      let json = '';
      const options = {
        hostname: this.url.split('/')[0],
        path: `/${this.url.split('/')[1]}/token`,
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
  }
}

module.exports = WebApi;

// configure prep upload payload (determine the sec key)
// send prep upload request
// get prep upload response (new link)
// set the info.json
// zip up the file
// upload the file
// query the job status
