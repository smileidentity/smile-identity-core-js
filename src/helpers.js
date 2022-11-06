const packageJson = require('../package.json');

/** @type {{sdk: string, sdk_version: string}} */
const sdkVersionInfo = {
  sdk: 'javascript',
  sdk_version: packageJson.version,
};

/**
 * Converts a numeric key to a smile server URI, or
 * returns the original URI.
 *
 * @param {string|number} uriOrKey - The URI of a Smile ID server or a
 * numeric key that represents it.
 * @returns {string} URI of smile server if in map, original input if URI.
 */
const mapServerUri = (uriOrKey) => {
  const sidServerMapping = {
    0: 'testapi.smileidentity.com/v1',
    1: 'api.smileidentity.com/v1',
  };
  if (uriOrKey in sidServerMapping) {
    return sidServerMapping[uriOrKey];
  }
  return uriOrKey;
};

module.exports = {
  sdkVersionInfo,
  mapServerUri,
};
