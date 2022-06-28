"use strict";
const Signature = require('./signature');
const Constants = require('./constants');
const https = require('https');

class IDApi {

  constructor(partner_id, api_key, sid_server) {
    this.partner_id = partner_id;
    this.sid_server = sid_server;
    this.api_key = api_key;

    if (['0', '1'].indexOf(sid_server.toString()) > -1) {
      var sid_server_mapping = {
        '0': 'testapi.smileidentity.com/v1',
        '1': 'api.smileidentity.com/v1'
      };
      this.url = sid_server_mapping[sid_server.toString()];
    } else {
      this.url = sid_server;
    }
  }

  submit_job(partner_params, id_info, options={}) {
    var _private = {
      data: {
        timestamp: new Date().toISOString(),
        url: this.url,
        partner_id: this.partner_id,
        api_key: this.api_key,
        sid_server: this.sid_server
      },
      validateInputs: function() {
        _private.partnerParams(partner_params);
        _private.idInfo(id_info);
      },
      partnerParams: function(partnerParams) {
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

        partnerParams['job_type'] = parseInt(partnerParams['job_type'], 10);
        if (parseInt(partnerParams['job_type'], 10) !== 5) {
          throw new Error('Please ensure that you are setting your job_type to 5 to query ID Api');
        }

        _private.data.partner_params = partnerParams;
      },
      idInfo: function(idInfo) {
        if (typeof idInfo !== 'object') {
          throw new Error('ID Info needs to be an object');
        }

        if (!idInfo ||  Object.keys(idInfo).length == 0) {
          throw new Error("Please make sure that id_info not empty or nil");
        }

        if(!idInfo.id_number || idInfo.id_number.length === 0) {
          throw new Error("Please provide an id_number in the id_info payload");
        }

        _private.data.id_info = idInfo;
      },
      determineSignature: function() {
        return new Signature(_private.data.partner_id, _private.data.api_key).generate_signature(_private.data.timestamp);
      },
      configureJson: function() {
        const body = {
          timestamp: _private.data.timestamp,
          partner_id: _private.data.partner_id,
          partner_params: _private.data.partner_params,
          language: "javascript",
          source_sdk: Constants.SOURCE_SDK,
          source_sdk_version: Constants.SOURCE_SDK_VERSION,
          signature: _private.determineSignature().signature
        };
        return JSON.stringify({...body, ..._private.data.id_info});
      },
      setupRequests: function() {
        var json = '';
        var path = `/${_private.data.url.split('/')[1]}/id_verification`;
        var host = _private.data.url.split('/')[0];
        var body = _private.configureJson();
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
              return _private.data.resolve(JSON.parse(json));
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

      }
    }

    // this section kicks everything off
    var result = new Promise((resolve, reject) => {
      try {
        _private.data.resolve = resolve;
        _private.data.reject = reject;
        _private.validateInputs();
        _private.setupRequests();
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
};

module.exports = IDApi;
