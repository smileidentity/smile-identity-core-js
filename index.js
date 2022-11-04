const IDApi = require('./src/id-api');
const Signature = require('./src/signature');
const Utilities = require('./src/utilities');
const WebApi = require('./src/web-api');
const ENV = require('./src/constants/env');
const JOB_TYPE = require('./src/constants/job_type');
const IMAGE_TYPE = require('./src/constants/image_type');


if ((typeof process === 'undefined' && typeof process.versions.node === 'undefined') || typeof window !== 'undefined') {
  console.error('This is a server-side library meant for a node.js (or compatible) runtime, and is not meant to work in the browser.');
}

module.exports = {
  IDApi,
  Signature,
  Utilities,
  WebApi,
  ENV,
  JOB_TYPE,
  IMAGE_TYPE
};
