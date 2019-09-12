"use strict";
const https = require('https');
const Signature = require('./signature');

class Utilities {

  constructor(partner_id, api_key, sid_server) {
    this.partner_id = partner_id;
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

  get_job_status(user_id, job_id, optionFlags = {}) {
    return new Promise((resolve, reject) => {
      var json = '';
      var path = `/${this.url.split('/')[1]}/job_status`;
      var host = this.url.split('/')[0];
      var options = {
        hostname: host,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': "application/json"
        }
      };
      var data = this.data;
      var req = https.request(options, (resp) => {
        resp.on('data', (chunk) => {
          json += chunk;
        });

        resp.on('end', () => {
          var body = JSON.parse(json);
          if (resp.statusCode === 200) {
            var valid = new Signature(this.partner_id, this.api_key).confirm_sec_key(body['timestamp'], body['signature']);
            if (!valid) {
              return reject(new Error("Unable to confirm validity of the job_status response"));
            }
            resolve(body);
          } else {
            var err = JSON.parse(json);
            reject(new Error(`${err.code}:${err.error}`));
          }
        });

      });
      var timestamp = Date.now();
      var signature = new Signature(this.partner_id, this.api_key).generate_sec_key();
      req.write(JSON.stringify({
        user_id: user_id,
        job_id: job_id,
        partner_id: this.partner_id,
        timestamp: signature.timestamp,
        sec_key: signature.sec_key,
        history: optionFlags.return_history,
        image_links: optionFlags.return_images
      }));
      req.end();

      req.on("error", (err) => {
        reject(new Error(err));
      });
    });
  }
};

module.exports = Utilities;