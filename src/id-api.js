const https = require('https');
const Signature = require('./signature');
const { mapServerUri, sdkVersionInfo, validatePartnerParams } = require('./helpers');

const validateIdInfo = (idInfo) => {
  if (typeof idInfo !== 'object') {
    throw new Error('ID Info needs to be an object');
  }

  if (!idInfo || Object.keys(idInfo).length === 0) {
    throw new Error('Please make sure that id_info not empty or nil');
  }

  if (!idInfo.id_number || idInfo.id_number.length === 0) {
    throw new Error('Please provide an id_number in the id_info payload');
  }
};

const configureJson = ({
  api_key, id_info, partner_id, partner_params, timestamp,
}) => JSON.stringify({
  language: 'javascript',
  partner_id,
  partner_params: {
    ...partner_params,
    job_type: parseInt(partner_params.job_type, 10),
  },
  ...id_info,
  ...new Signature(partner_id, api_key).generate_signature(timestamp),
  ...sdkVersionInfo,
});

const setupRequests = (data) => new Promise((resolve, reject) => {
  let json = '';
  const path = `/${data.url.split('/')[1]}/id_verification`;
  const host = data.url.split('/')[0];
  const body = configureJson(data);
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
        resolve(JSON.parse(json));
        return;
      }
      const err = JSON.parse(json);
      reject(new Error(`${err.code}:${err.error}`));
    });
  });
  req.write(body);
  req.end();

  req.on('error', (err) => {
    reject(new Error(`${err.code}:${err.error}`));
  });
});

class IDApi {
  constructor(partner_id, api_key, sid_server) {
    this.partner_id = partner_id;
    this.sid_server = sid_server;
    this.api_key = api_key;
    this.url = mapServerUri(sid_server);
  }

  submit_job(partner_params, id_info) {
    const data = {
      api_key: this.api_key,
      id_info,
      partner_id: this.partner_id,
      partner_params,
      sid_server: this.sid_server,
      timestamp: new Date().toISOString(),
      url: this.url,
    };

    try {
      validatePartnerParams(partner_params);

      if (parseInt(partner_params.job_type, 10) !== 5) {
        throw new Error('Please ensure that you are setting your job_type to 5 to query ID Api');
      }

      validateIdInfo(id_info);
      return setupRequests(data);
    } catch (err) {
      return Promise.reject(err);
    }
  }
}

module.exports = IDApi;
