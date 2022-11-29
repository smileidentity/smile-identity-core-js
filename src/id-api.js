const axios = require('axios');
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

const configurePayload = ({
  api_key, id_info, partner_id, partner_params,
}) => ({
  language: 'javascript',
  partner_id,
  partner_params: {
    ...partner_params,
    job_type: parseInt(partner_params.job_type, 10),
  },
  ...id_info,
  ...new Signature(partner_id, api_key).generate_signature(),
  ...sdkVersionInfo,
});

class IDApi {
  constructor(partner_id, api_key, sid_server) {
    this.partner_id = partner_id;
    this.sid_server = sid_server;
    this.api_key = api_key;
    this.url = mapServerUri(sid_server);
  }

  submit_job(partner_params, id_info) {
    try {
      validatePartnerParams(partner_params);

      if (parseInt(partner_params.job_type, 10) !== 5) {
        throw new Error('Please ensure that you are setting your job_type to 5 to query ID Api');
      }

      validateIdInfo(id_info);

      const data = {
        api_key: this.api_key,
        id_info,
        partner_id: this.partner_id,
        partner_params,
        sid_server: this.sid_server,
      };

      return axios.post(`https://${this.url}/id_verification`, configurePayload(data)).then((response) => response.data);
    } catch (err) {
      return Promise.reject(err);
    }
  }
}

module.exports = IDApi;
