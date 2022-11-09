const https = require('https');
const Signature = require('./signature');
const { mapServerUri } = require('./helpers');

class Utilities {
  constructor(partner_id, api_key, sid_server) {
    this.partner_id = partner_id;
    this.api_key = api_key;
    this.url = mapServerUri(sid_server);
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
            const valid = new Signature(
              this.partner_id,
              this.api_key,
            ).confirm_signature(body.timestamp, body.signature);
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
      const timestamp = new Date().toISOString();
      const reqBody = {
        user_id,
        job_id,
        partner_id: this.partner_id,
        timestamp,
        history: optionFlags.return_history,
        image_links: optionFlags.return_images,
      };
      reqBody.signature = new Signature(
        this.partner_id,
        this.api_key,
      ).generate_signature(timestamp).signature;
      req.write(JSON.stringify(reqBody));
      req.end();

      req.on('error', (err) => {
        reject(new Error(err));
      });
    });
  }
}

module.exports = Utilities;
