const https = require('https');
const Signature = require('./signature');
const { mapServerUri } = require('./helpers');

class IDApi {
  constructor(partner_id, api_key, sid_server) {
    this.partner_id = partner_id;
    this.sid_server = sid_server;
    this.api_key = api_key;
    this.url = mapServerUri(sid_server);
  }

  submit_job(partner_params, id_info, options = {}) {
    const _private = {
      data: {
        timestamp: options.signature ? new Date().toISOString() : Date.now(),
        url: this.url,
        partner_id: this.partner_id,
        api_key: this.api_key,
        sid_server: this.sid_server,
      },
      validateInputs() {
        _private.partnerParams(partner_params);
        _private.idInfo(id_info);
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
        if (parseInt(partnerParams.job_type, 10) !== 5) {
          throw new Error('Please ensure that you are setting your job_type to 5 to query ID Api');
        }

        _private.data.partner_params = partnerParams;
      },
      idInfo(idInfo) {
        if (typeof idInfo !== 'object') {
          throw new Error('ID Info needs to be an object');
        }

        if (!idInfo || Object.keys(idInfo).length === 0) {
          throw new Error('Please make sure that id_info not empty or nil');
        }

        if (!idInfo.id_number || idInfo.id_number.length === 0) {
          throw new Error('Please provide an id_number in the id_info payload');
        }

        _private.data.id_info = idInfo;
      },
      determineSignature() {
        return new Signature(
          _private.data.partner_id,
          _private.data.api_key,
        ).generate_signature(_private.data.timestamp);
      },
      configureJson() {
        const body = {
          timestamp: _private.data.timestamp,
          partner_id: _private.data.partner_id,
          partner_params: _private.data.partner_params,
          language: 'javascript',
          signature: _private.determineSignature().signature,
        };
        return JSON.stringify({ ...body, ..._private.data.id_info });
      },
      setupRequests() {
        let json = '';
        const path = `/${_private.data.url.split('/')[1]}/id_verification`;
        const host = _private.data.url.split('/')[0];
        const body = _private.configureJson();
        const reqOptions = {
          hostname: host,
          path,
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
              _private.data.resolve(JSON.parse(json));
              return;
            }
            const err = JSON.parse(json);
            _private.data.reject(new Error(`${err.code}:${err.error}`));
          });
        });
        req.write(body);
        req.end();

        req.on('error', (err) => {
          _private.data.reject(`${err.code}:${err.error}`);
        });
      },
    };

    // this section kicks everything off
    const result = new Promise((resolve, reject) => {
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
  }
}

module.exports = IDApi;
