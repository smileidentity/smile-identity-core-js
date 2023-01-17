const https = require('https');
const JOBTYPE = require('./constants/job-type');

class BusinessVerification {
  constructor() {
    this.id_types = ['BASIC_BUSINESS_REGISTRATION', 'BUSINESS_REGISTRATION','TAX_INFORMATION'];
    this.business_types = ['co', 'bn', 'it'];
  }

  submit_job(url, body) {
    const path = `/${url.split('/')[1]}/business_verification`;
    const host = url.split('/')[0];
    const options = {
      hostname: host,
      path,
      method: 'POST',
      headers: {
        'Content-Type': "application/json"
      }
    };

    return new Promise((resolve, reject) => {
      let json = '';
      const req = https.request(options, function(resp) {
        resp.setEncoding('utf8');
        resp.on('data', function(chunk) {
          console.log(host, path);
          json += chunk;
        });

        resp.on('end', function() {
          if(resp.statusCode === 200) {
            resolve(JSON.parse(json));
          } else {
            const error = JSON.parse(json);
            reject(new Error(`${error.code}:${error.error}`));
          }
        });

      });

      req.write(JSON.stringify(body));
      req.end();

      req.on('error', error => {
        reject(new Error(`${error.code}:${error.error}`));
      });
    });
  }

  validate(id_info) {
    const required_fields = ['country', 'id_type', 'id_number']
    required_fields.forEach(key => {
      if (!id_info[key] || id_info[key].length === 0) {
        throw new Error(`Please make sure that ${key} is included in the id_info`);
      }
    });

    if(id_info.business_type && !this.business_types.includes(id_info.business_type)) {
      throw new Error(`Invalid business_type. Please provide business_type as one of (${this.business_types.toString()})`);
    }

    if(!this.id_types.includes(id_info.id_type)) {
      throw new Error(`Invalid id_type. Please provide id_types as one of (${this.id_types.toString()})`);
    }
  }
}


module.exports = BusinessVerification
