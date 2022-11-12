const https = require('https');
const Signature = require('./signature');
const { mapServerUri } = require('./helpers');

/**
 * Gets an authorization token from Smile. Used in Hosted Web Integration.
 *
 * @param {string} partner_id - The partner ID.
 * @param {string} api_key - Your Smile API key.
 * @param {string} url - The URL to the Smile ID API.
 * @param {{
 * callback_url: string,
 * user_id: string,
 * job_id: string,
 * product: string,
 * }} requestParams - parameters required to get an authorization token.
 * @param {string|undefined} defaultCallback - Your default callback URL.
 * @returns {string} - The authorization token.
 * @throws {Error} - if the request fails.
 */
const getWebToken = (
  partner_id,
  api_key,
  url,
  requestParams,
  defaultCallback,
) => new Promise((resolve, reject) => {
  if (!requestParams) {
    reject(new Error('Please ensure that you send through request params'));
    return;
  }

  if (typeof requestParams !== 'object') {
    reject(new Error('Request params needs to be an object'));
    return;
  }
  const callbackUrl = requestParams.callback_url || defaultCallback;

  if (typeof callbackUrl !== 'string' || callbackUrl.length === 0) {
    reject(new Error('Callback URL is required for this method'));
    return;
  }

  ['user_id', 'job_id', 'product'].forEach((requiredParam) => {
    if (!requestParams[requiredParam]) {
      reject(new Error(`${requiredParam} is required to get a web token`));
      // NOTE: should return here
    }
  });

  const body = JSON.stringify({
    user_id: requestParams.user_id,
    job_id: requestParams.job_id,
    product: requestParams.product,
    callback_url: callbackUrl,
    partner_id: this.partner_id,
    ...new Signature(
      partner_id,
      api_key,
    ).generate_signature(),
  });

  let json = '';

  const sidUrl = mapServerUri(url);

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

module.exports = { getWebToken };
