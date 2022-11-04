/**
 * Converts a numeric key to a smile server URI, or
 * returns the URI if it is already a URI.
 *
 * @param {string|number} uriOrKey - The URI of a Smile ID server
 *  or a numeric key that represents it.
 * @returns {string} URI of smile server if in map, otherwise the original input.
 */
const mapServerUri = (uriOrKey) => {
  const sidServerMapping = {
    0: 'testapi.smileidentity.com/v1',
    1: 'api.smileidentity.com/v1',
  };
  if (String(uriOrKey) in sidServerMapping) {
    return sidServerMapping[uriOrKey];
  }
  return uriOrKey;
};

module.exports = {
  mapServerUri,
};
