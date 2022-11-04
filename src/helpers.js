/**
 * Converts a numeric key to a smile server URI, or
 * returns the URI if it is  parsable.
 *
 * @param {string|number} uriOrKey - The URI of a Smile ID server or a
 * numeric key that represents it.
 * @returns {string} URI of smile server if in map, original input if URI.
 * @throws {TypeError} If the input is not a valid URI or key.
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
    // Because server addresses do not have a protocol by default in our class
    // constructors, we add a https to the beginning of the URI to validate it.
    // new URL() will throw an error if it is unable to parse the URI.
    // eslint-disable-next-line no-new
    new URL(uriOrKey.startsWith('https://') ? uriOrKey : `https://${uriOrKey}`);
    return uriOrKey;
  }
  throw new TypeError('Invalid URL');
};

module.exports = {
  mapServerUri,
};
