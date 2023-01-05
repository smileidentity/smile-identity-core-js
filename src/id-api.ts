import axios from 'axios';
import Signature from './signature';
import { mapServerUri, sdkVersionInfo, validatePartnerParams } from './helpers';
import { IdInfo, PartnerParams } from './shared';

const validateIdInfo = (idInfo: IdInfo) => {
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
}: { api_key: string, id_info: IdInfo, partner_id: string, partner_params: PartnerParams }) => ({
  language: 'javascript',
  partner_id,
  partner_params: {
    ...partner_params,
    job_type: partner_params.job_type,
  },
  ...id_info,
  ...new Signature(partner_id, api_key).generate_signature(),
  ...sdkVersionInfo,
});

export class IDApi {
  partner_id: string;

  sid_server: string | number;

  api_key: string;

  url: string;

  constructor(partner_id: string, api_key: string, sid_server: string | number) {
    this.partner_id = partner_id;
    this.sid_server = sid_server;
    this.api_key = api_key;
    this.url = mapServerUri(sid_server);
  }

  async submit_job(partner_params: PartnerParams, id_info: IdInfo) : Promise<any> {
    try {
      validatePartnerParams(partner_params);

      if (parseInt(partner_params.job_type.toString(), 10) !== 5) {
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

      const response = await axios.post(`https://${this.url}/id_verification`, configurePayload(data));
      return response.data;
    } catch (err) {
      return Promise.reject(err);
    }
  }
}
