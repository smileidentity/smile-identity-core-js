/* eslint-disable import/no-unresolved */
const express = require('express');
const { json } = require('express');
const express_static = require('express').static;
const UUID = require('uuid').v4;
const { config } = require('dotenv');
const { WebApi } = require('smile-identity-core');
/* eslint-enable import/no-unresolved */

config();

const SIDWebAPI = WebApi;

const app = express();

app.use(json({ limit: '500kb' }));
app.use(express_static('public'));

app.post('/', async (req, res) => {
  try {
    const {
      PARTNER_ID, API_KEY, SID_SERVER, CALLBACK_URL,
    } = process.env;
    const connection = new SIDWebAPI(
      PARTNER_ID,
      CALLBACK_URL, // change call back URL as desired
      API_KEY,
      SID_SERVER,
    );

    const getJobType = (images) => {
      const hasIDImage = images.filter((image) => image.image_type_id === 3).length > 0;

      return hasIDImage ? 1 : 4;
    };

    const {
      images,
      partner_params: { libraryVersion },
    } = req.body;

    const partner_params_from_server = {
      user_id: `user-${UUID()}`,
      job_id: `job-${UUID()}`,
      // job_type is the simplest job we have which enrolls a user using their selfie.
      job_type: getJobType(images),
    };

    const options = {
      return_job_status: true,
      // signature: true
    };

    const partner_params = { ...partner_params_from_server, libraryVersion };

    const result = await connection.submit_job(
      partner_params,
      images,
      {},
      options,
    );

    res.json(result);
  } catch (e) {
    console.error(e);
  }
});

// NOTE: This can be used to process responses. Don't forget to add it as a
// callback option in the `connection` config on L22.
app.post('/callback');

app.listen(process.env.PORT || 4000);
