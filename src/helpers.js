const packageJson = require('../package.json');

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

/** @type {{source_sdk: string, source_sdk_version: string}} */
const sdkVersionInfo = {
  source_sdk: 'javascript',
  source_sdk_version: packageJson.version,
};

const validatePartnerParams = (partnerParams) => {
  if (!partnerParams) {
    throw new Error('Please ensure that you send through partner params');
  }

  if (typeof partnerParams !== 'object') {
    throw new Error('Partner params needs to be an object');
  }

  ['user_id', 'job_id', 'job_type'].forEach((key) => {
    if (!partnerParams[key]) {
      throw new Error(`Please make sure that ${key} is included in the partner params`);
    }
  });
};

module.exports = {
  mapServerUri,
  sdkVersionInfo,
  validatePartnerParams,
};
