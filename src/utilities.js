const https = require('https');
const Signature = require('./signature');
const ENV = require('./constants/env');

class Utilities {
  constructor(partner_id, api_key, sid_server) {
    this.partner_id = partner_id;
    this.api_key = api_key;
    if (Object.keys(ENV.SID_SERVER_MAPPING).includes(sid_server.toString())) {
      this.url = ENV.SID_SERVER_MAPPING[sid_server.toString()];
    } else {
      this.url = sid_server;
    }
  }

  get_job_status(user_id, job_id, optionFlags = {}) {
    return new Promise((resolve, reject) => {
      let json = '';
      const path = `/${this.url.split('/')[1]}/job_status`;
      const host = this.url.split('/')[0];
      const options = {
        hostname: host,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const req = https.request(options, (resp) => {
        resp.on('data', (chunk) => {
          json += chunk;
        });

        resp.on('end', () => {
          const body = JSON.parse(json);
          if (resp.statusCode === 200) {
            let valid;
            if (optionFlags.signature) {
              valid = new Signature(
                this.partner_id,
                this.api_key,
              ).confirm_signature(body.timestamp, body.signature);
            } else {
              valid = new Signature(
                this.partner_id,
                this.api_key,
              ).confirm_sec_key(body.timestamp, body.signature);
            }
            if (!valid) {
              reject(new Error('Unable to confirm validity of the job_status response'));
              return;
            }
            resolve(body);
          } else {
            const err = JSON.parse(json);
            reject(new Error(`${err.code}:${err.error}`));
          }
        });
      });
      let timestamp;
      if (optionFlags.signature) {
        timestamp = new Date().toISOString();
      } else {
        timestamp = Date.now();
      }
      const reqBody = {
        user_id,
        job_id,
        partner_id: this.partner_id,
        timestamp,
        history: optionFlags.return_history,
        image_links: optionFlags.return_images,
      };
      if (optionFlags.signature) {
        reqBody.signature = new Signature(
          this.partner_id,
          this.api_key,
        ).generate_signature(timestamp).signature;
      } else {
        reqBody.sec_key = new Signature(
          this.partner_id,
          this.api_key,
        ).generate_sec_key(timestamp).sec_key;
      }
      req.write(JSON.stringify(reqBody));
      req.end();

      req.on('error', (err) => {
        reject(new Error(err));
      });
    });
  }
}

module.exports = Utilities;
