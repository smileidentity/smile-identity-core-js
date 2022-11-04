const https = require('https');
const Signature = require('./signature');

const validatePartnerParams = (partnerParams) => {
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

  if (parseInt(partnerParams.job_type, 10) !== 5) {
    throw new Error('Please ensure that you are setting your job_type to 5 to query ID Api');
  }
};

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

const configureJson = (data, options) => {
  const body = {
    timestamp: data.timestamp,
    partner_id: data.partner_id,
    partner_params: data.partner_params,
    language: 'javascript',
  };
  const signature = new Signature(data.partner_id, data.api_key);

  if (options && options.signature) {
    body.signature = signature.generate_signature(data.timestamp).signature;
  } else {
    body.sec_key = signature.generate_sec_key(data.timestamp).sec_key;
  }
  return JSON.stringify({ ...body, ...data.id_info });
};

const setupRequests = (data, options) => new Promise((resolve, reject) => {
  let json = '';
  const path = `/${data.url.split('/')[1]}/id_verification`;
  const host = data.url.split('/')[0];
  const body = configureJson(data, options);
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

    if (['0', '1'].includes(sid_server.toString())) {
      const sid_server_mapping = {
        0: 'testapi.smileidentity.com/v1',
        1: 'api.smileidentity.com/v1',
      };
      this.url = sid_server_mapping[sid_server.toString()];
    } else {
      this.url = sid_server;
    }
  }

  submit_job(partner_params, id_info, options = {}) {
    const data = {
      timestamp: options.signature ? new Date().toISOString() : Date.now(),
      url: this.url,
      partner_id: this.partner_id,
      api_key: this.api_key,
      sid_server: this.sid_server,
      partner_params,
      id_info,
    };

    try {
      validatePartnerParams(partner_params);
      validateIdInfo(id_info);
      data.partner_params.job_type = parseInt(partner_params.job_type, 10);
      return setupRequests(data, options);
    } catch (err) {
      return Promise.reject(err);
    }
  }
}

module.exports = IDApi;
