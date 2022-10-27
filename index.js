const IDApi = require('./src/id-api');
const Signature = require('./src/signature');
const Utilities = require('./src/utilities');
const WebApi = require('./src/web-api');

module.exports = {
  IDApi,
  Signature,
  Utilities,
  WebApi,
};

if ((typeof process === 'undefined' && typeof process.versions.node === 'undefined') || typeof window !== 'undefined') {
  console.error('This is a server-side library meant for a node.js (or compatible) runtime, and is not meant to work in the browser.');
}
