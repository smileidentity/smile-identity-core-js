/* eslint-disable import/no-unresolved */

const express = require('express');
const { v4: UUID } = require('uuid');

if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line global-require
  const dotenv = require('dotenv');

  dotenv.config();
}

const SIDCore = require('smile-identity-core');

const SIDWebAPI = SIDCore.WebApi;

const app = express();

app.use(express.json({ limit: '500kb' }));
app.use(express.static('public'));

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
      // eslint-disable-next-line max-len
      job_type: getJobType(images), // job_type is the simplest job we have which enrolls a user using their selfie
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

// eslint-disable-next-line max-len
// NOTE: This can be used to process responses. don't forget to add it as a callback option in the `connection` config on L22
// eslint-disable-next-line no-unused-vars
app.post('/callback', (_req, _res, _next) => { });

app.listen(process.env.PORT || 4000);
