const https = require('https');
const Signature = require('./signature');
const { mapServerUri } = require('./helpers');

const get_job_status = (
  partnerId,
  apiKey,
  url,
  userId,
  jobId,
  { return_history, return_images },
) => {
  const path = `/${url.split('/')[1]}/job_status`;
  const host = url.split('/')[0];
  const options = {
    hostname: host,
    path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const timestamp = new Date().toISOString();
  const reqBody = {
    user_id: userId,
    job_id: jobId,
    partner_id: partnerId,
    history: return_history,
    image_links: return_images,
    ...new Signature(
      partnerId,
      apiKey,
    ).generate_signature(timestamp),
  };
  let json = '';
  return new Promise((resolve, reject) => {
    const req = https.request(options, (resp) => {
      resp.on('data', (chunk) => {
        json += chunk;
      });
      resp.on('end', () => {
        const body = JSON.parse(json);
        if (resp.statusCode === 200) {
          const valid = new Signature(
            partnerId,
            apiKey,
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
    req.write(JSON.stringify(reqBody));
    req.end();
    req.on('error', (err) => {
      reject(new Error(err));
    });
  });
};

class Utilities {
  constructor(partner_id, api_key, sid_server) {
    this.partnerId = partner_id;
    this.apiKey = api_key;
    this.url = mapServerUri(sid_server);
  }

  get_job_status(userId, jobId, options = { return_history: false, return_images: false }) {
    return get_job_status(this.partnerId, this.apiKey, this.url, userId, jobId, options);
  }
}

module.exports = Utilities;
