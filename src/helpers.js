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

  if (typeof uriOrKey === 'string') {
    // validates that it is a valid URI. Throws an error if not. Because server addresses do
    // not have a protocol by default, we add a dummy protocol to the beginning of
    // the URI to validate it.
    // eslint-disable-next-line no-new
    new URL(uriOrKey.startsWith('https://') ? uriOrKey : `https://${uriOrKey}`);
    return uriOrKey;
  }
  throw new TypeError('Invalid URL');
};

module.exports = {
  mapServerUri,
};
