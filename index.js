const WebApi = require("./src/web-api.js");
const Signature = require("./src/signature.js");
const IDApi = require("./src/id-api.js");
const Utilities = require("./src/utilities.js");

module.exports = {
  WebApi,
  IDApi,
  Signature,
  Utilities
}

if ((typeof(process) === 'undefined' && typeof(process.versions.node) === 'undefined') || typeof(window) !== 'undefined') {
	console.error('This is a server-side library meant for a node.js (or compatible) runtime, and is not meant to work in the browser.');
}
