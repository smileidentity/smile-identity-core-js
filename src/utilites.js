class Utilities {

  constructor(partner_id, api_key, sid_server) {
    this.partner_id = partner_id;
    this.default_callback = default_callback;
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

  get_job_status(user_id, job_id, options = {}) {
    var json = '';
    var path = `/${this.url}/job_status`;
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
        var valid = new Signature(data.partner_id, data.api_key).confirm_sec_key(body['timestamp'], body['signature']);
        if (!valid) {
          throw new Error("Unable to confirm validity of the job_status response");
        }
        return body;
      });

    });
    var timestamp = Date.now();
    req.write(JSON.stringify({
      user_id: user_id,
      job_id: job_id,
      partner_id: partner_id,
      timestamp: timestamp,
      sec_key: _private.determineSecKey(timestamp).sec_key,
      history: options.return_history,
      image_links: options.return_images
    }));
    req.end();

    req.on("error", (err) => {
      throw err;
    });
  }
};

module.exports = Utilities