// https:requestdotdev.co/how-to-use-classes-in-node-js-with-no-pre-compilers-and-why-you-should-ad9ffd63817d
"use strict";
const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const jszip = require('jszip');
const path = require('path');
const Signature = require('./signature');
const Utilities = require('./utilities');
const IDApi = require('./id-api');

const url = require('url');

class WebApi {

  constructor(partner_id, default_callback, api_key, sid_server) {
    this.partner_id = partner_id;
    this.default_callback = default_callback;
    this.sid_server = sid_server;
    this.api_key = api_key;
    if (['0', '1'].indexOf(sid_server.toString()) > -1) {
      var sid_server_mapping = {
        '0': '3eydmgh10d.execute-api.us-west-2.amazonaws.com/test',
        '1': 'la7am6gdm8.execute-api.us-west-2.amazonaws.com/prod'
      };
      this.url = sid_server_mapping[sid_server.toString()];
    } else {
      this.url = sid_server;
    }

  }

  submit_job(partner_params, image_details, id_info, options) {
    // define the data and functions we will need
    var _private = {
      data: {
        callback_url: options && options.optional_callback || this.default_callback,
        timestamp: Date.now(),
        url: this.url,
        partner_id: this.partner_id,
        api_key: this.api_key,
        sid_server: this.sid_server
      },
      validateInputs: function() {
        // validate inputs and add them to our data store
        _private.partnerParams(partner_params);
        _private.idInfo(id_info);

        if(parseInt(partner_params.job_type, 10) !== 5) {
          _private.images(image_details);
          _private.checkBoolean('return_job_status', options.return_job_status);
          _private.checkBoolean('return_history', options.return_history);
          _private.checkBoolean('return_images', options.return_images);
        }
      },
      validateReturnData: function() {
        if ((!_private.data.callback_url || _private.data.callback_url.length === 0) && !_private.data.return_job_status) {
          throw new Error("Please choose to either get your response via the callback or job status query");
        }
      },
      validateEnrollWithID: function() {
        var hasImage = function(imageData) {
          return imageData['image_type_id'] === 1 || imageData['image_type_id'] === 3;
        }
        if(!_private.data.images.some(hasImage) && (!_private.data.id_info['entered'] || _private.data.id_info['entered'].toString() !== 'true')) {
          throw new Error("You are attempting to complete a job type 1 without providing an id card image or id info");
        }
      },
      partnerParams: function(partnerParams) {
        if (!partnerParams) {
          throw new Error('Please ensure that you send through partner params');
        }

        if (typeof partnerParams !== 'object') {
          throw new Error('Partner params needs to be an object');
        }

        ['user_id', 'job_id', 'job_type'].forEach((key) => {
          if (!partnerParams[key] || (typeof partnerParams === 'string' && partnerParams[key].length === 0)) {
            throw new Error(`Please make sure that ${key} is included in the partner params`);
          }
        });
        partnerParams['job_type'] = parseInt(partnerParams['job_type'], 10);
        _private.data.partner_params = partnerParams;
      },
      images: function(images) {
        var hasImage = function(imageData) {
          return imageData['image_type_id'] === 0 || imageData['image_type_id'] === 2;
        }
        if (!images) {
          throw new Error('Please ensure that you send through image details');
        }

        if (!Array.isArray(images)) {
          throw new Error('Image details needs to be an array');
        }

        // all job types require at least a selfie
        if (images.length === 0 || !images.some(hasImage)) {
          throw new Error('You need to send through at least one selfie image');
        }

        _private.data.images = images;
      },
      idInfo: function(id_info) {

        if(!('entered' in id_info) || id_info['entered'].toString() === 'false') {
          id_info['entered'] = 'false';
        }

        if ('entered' in id_info && id_info['entered'].toString() === 'true') {
          ['country', 'id_type', 'id_number'].forEach((key) => {
            if (!id_info[key] || id_info[key].length === 0) {
              throw new Error(`Please make sure that ${key} is included in the id_info`);
            }
          });
        }

        _private.data.id_info = id_info;
      },
      checkBoolean: function(key, bool) {
        if (!bool) {
          bool = false;
        }
        if (!!bool !== bool) {
          throw new Error(`${key} needs to be a boolean`);
        }

        _private.data[key] = bool;
      },
      determineSecKey: function(timestamp) {
        // calculate an outgoing signature
        return new Signature(_private.data.partner_id, _private.data.api_key).generate_sec_key(timestamp || _private.data.timestamp);
      },
      configurePrepUploadJson: function() {
        var body =  {
          file_name: 'selfie.zip',
          timestamp: _private.data.timestamp,
          sec_key: _private.determineSecKey().sec_key,
          smile_client_id: _private.data.partner_id,
          partner_params: _private.data.partner_params,
          model_parameters: {},
          callback_url: _private.data.callback_url
        };
        return JSON.stringify(body);
      },
      setupRequests: function() {
        // make the first call to the upload lambda
        var json = '';
        var path = `/${_private.data.url.split('/')[1]}/upload`;
        var host = _private.data.url.split('/')[0];
        var body = _private.configurePrepUploadJson();
        var options = {
          hostname: host,
          path: path,
          method: 'POST',
          headers: {
            'Content-Type': "application/json"
          }
        };
        const req = https.request(options, function(resp) {
          resp.setEncoding('utf8');
          resp.on('data', function(chunk) {
            json += chunk;
          });

          resp.on('end', function() {
            if (resp.statusCode === 200) {
              var prepUploadResponse = JSON.parse(json);
              var infoJson = _private.configureInfoJson(prepUploadResponse);

              _private.zipUpFile(infoJson, () => {
                return _private.uploadFile(prepUploadResponse['upload_url'], infoJson, prepUploadResponse['smile_job_id']);
              });
            } else {
              var err = JSON.parse(json);
              _private.data.reject(new Error(`${err.code}:${err.error}`));
            }
          });
        });

        req.write(body);
        req.end();

        req.on("error", function(err) {
          _private.data.reject(`${err.code}:${err.error}`);
        });

      },
      configureInfoJson: function(serverInformation) {
        // create the json file sent as part of the zip file
        var info = {
          "package_information": {
            "apiVersion": {
              "buildNumber": 0,
              "majorVersion": 2,
              "minorVersion": 0
            },
            "language": "javascript"
          },
          "misc_information": {
            "sec_key": _private.data.sec_key,
            "retry": "false",
            "partner_params": _private.data.partner_params,
            "timestamp": _private.data.timestamp,
            "file_name": "selfie.zip",
            "smile_client_id": _private.data.partner_id,
            "callback_url": _private.data.callback_url,
            "userData": { // TO ASK what goes here
              "isVerifiedProcess": false,
              "name": "",
              "fbUserID": "",
              "firstName": "Bill",
              "lastName": "",
              "gender": "",
              "email": "",
              "phone": "",
              "countryCode": "+",
              "countryName": ""
            }
          },
          "id_info": _private.data.id_info,
          "images": _private.configureImagePayload(),
          "server_information": serverInformation
        };
        return info;
      },
      configureImagePayload: function() {
        // differentiate between image files and base64 images bbased on the image_type_id
        var images = [];
        _private.data.images.forEach((i) => {
          if ([0, 1].indexOf(parseInt(i['image_type_id'], 10)) > -1) {
            images.push({
              image_type_id: i['image_type_id'],
              image: '',
              file_name: path.basename(i['image'])
            });
          } else {
            images.push({
              image_type_id: i['image_type_id'],
              image: i['image'],
              file_name: ''
            });
          }
        });
        return images;
      },
      zipUpFile: function(info_json, callback) {
        // create zip file in memory
        var zip = new jszip();
        zip.file('info.json', JSON.stringify(info_json));
        _private.data.images.forEach((image) => {
          if ([0, 1].indexOf(parseInt(image['image_type_id'], 10)) > -1) {
            zip.file(path.basename(image['image']), fs.readFileSync(image['image']));
          }
        });
        zip.generateAsync({ type: "uint8array" }).then(function(zip) {
          _private.data.zip = zip;
          callback();
        });
      },
      QueryJobStatus: function(counter=0) {
        // call job status for the result of the job
        var timeout = counter < 4 ? 2000 : 4000;
        counter++;
        new Utilities(_private.data.partner_id, _private.data.api_key, _private.data.sid_server)
          .get_job_status(
            _private.data.partner_params.user_id,
            _private.data.partner_params.job_id,
            {
              return_history: _private.data.return_history,
              return_images: _private.data.return_images
          }).then((body) => {
            if (!body['job_complete']) {
              if (counter > 21) {
                return _private.data.reject(new Error("Timeout waiting for job status response."));
              }
              setTimeout(function() {
                _private.QueryJobStatus(counter);
              }, timeout);
            } else {
              return _private.data.resolve(body);
            }
          }).catch((err) => {
            setTimeout(function() {
              _private.QueryJobStatus(counter);
            }, timeout);
          });
      },
      uploadFile: function(signedUrl, info_json, SmileJobID) {
        // upload zip file to s3 using the signed link obtained from the upload lambda
        var json = '';
        var options = url.parse(signedUrl);
        options.headers = {
          'Content-Type': "application/zip",
          'Content-Length': `${_private.data.zip.length}`
        };
        options.method = 'PUT'
        const req = https.request(options, (resp) => {
          resp.setEncoding('utf8');
          resp.on('data', (chunk) => {
            json += chunk;
          });

          resp.on('end', () => {
            if (resp.statusCode === 200) {
              if (_private.data.return_job_status) {
                return _private.QueryJobStatus();
              } else {
                return _private.data.resolve({success: true, smile_job_id: SmileJobID});
              }
            } else {
              _private.data.reject(new Error(`Zip upload status code: ${resp.statusCode}`));
            }
          });

        });
        req.write(Buffer.from(_private.data.zip));
        req.end();
        req.on("error", (err) => {
          _private.data.reject(err);
        });
      },
      setupIDApiRequest: function() {
        let promise = new IDApi(_private.data.partner_id, _private.data.api_key, _private.data.sid_server).submit_job(_private.data.partner_params, _private.data.id_info);

        promise.then((idApiResp) => {
          return _private.data.resolve(idApiResp);
        }).catch((err) => {
          throw _private.data.reject(err);
        });
      }
    };
    // this section kicks everything off
    var result = new Promise((resolve, reject) => {
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
          _private.setupRequests();
        }

      } catch (err) {
        reject(err);
      }
    });
    return result;
    result.then((resp) => {
      return resp;
    }).catch((err) => {
      throw err;
    });
  }

  get_job_status(partner_params, options) {
    return new Utilities(this.partner_id, this.api_key, this.sid_server)
      .get_job_status(partner_params.user_id, partner_params.job_id, options);
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
