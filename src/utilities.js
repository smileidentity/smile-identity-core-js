"use strict";
const https = require('https');
const Signature = require('./signature');

class Utilities {

  constructor(partner_id, api_key, sid_server) {
    this.partner_id = partner_id;
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

  get_job_status(user_id, job_id, optionFlags = {}) {
    return new Promise((resolve, reject) => {
      let json = '';
      const path = `/${this.url.split('/')[1]}/job_status`;
      const host = this.url.split('/')[0];
      const options = {
        hostname: host,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': "application/json"
        }
      };
      const req = https.request(options, (resp) => {
        resp.on('data', (chunk) => {
          json += chunk;
        });

        resp.on('end', () => {
          const body = JSON.parse(json);
          if (resp.statusCode === 200) {
            const valid = new Signature(this.partner_id, this.api_key).confirm_signature(body['timestamp'], body['signature']);
            if (!valid) {
              return reject(new Error("Unable to confirm validity of the job_status response"));
            }
            resolve(body);
          } else {
            const err = JSON.parse(json);
            reject(new Error(`${err.code}:${err.error}`));
          }
        });

      });
      const timestamp = new Date().toISOString();
      let reqBody = {
        user_id: user_id,
        job_id: job_id,
        partner_id: this.partner_id,
        timestamp: timestamp,
        history: optionFlags.return_history,
        image_links: optionFlags.return_images,
        signature: new Signature(this.partner_id, this.api_key).generate_signature(timestamp).signature,
        source_sdk: "javascript",
        source_sdk_version: "2.0.0"
      }
      req.write(JSON.stringify(reqBody));
      req.end();

      req.on("error", (err) => {
        reject(new Error(err));
      });
    });
  }
};

module.exports = Utilities;