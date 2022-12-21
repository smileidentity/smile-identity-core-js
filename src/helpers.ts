import * as packageJson from "../package.json"
import { sidServerMapping } from './constants';
import { PartnerParams } from "./shared";

/**
 * Converts a numeric key to a smile server URI, or
 * returns the original URI.
 *
 * @param {string|number} uriOrKey - The URI of a Smile ID server or a
 * numeric key that represents it.
 * @returns {string} URI of smile server if in map, original input if URI.
 */
export const mapServerUri = (uriOrKey: string | number): string => {
  if (uriOrKey in sidServerMapping) {
    return sidServerMapping[uriOrKey];
  }
  return uriOrKey as string;
};

/** @type {{source_sdk: string, source_sdk_version: string}} */
export const sdkVersionInfo: { source_sdk: string; source_sdk_version: string; } = {
  source_sdk: 'javascript',
  source_sdk_version: packageJson.version,
};

/**
 * Validates that partner params contains required fields.
 *
 * @param {object} partnerParams - required parameters for each job.
 * @param {string} partnerParams.user_id - your unique identifier for the user.
 * @param {string} partnerParams.job_id - your unique identifier for the job.
 * @param {string|number} partnerParams.job_type - type of job.
 * @throws {Error} if partnerParams is not an object or is missing required keys.
 * @returns {void}
 */
export const validatePartnerParams = (partnerParams: PartnerParams): void => {
  if (!partnerParams) {
    throw new Error('Please ensure that you send through partner params');
  }

  if (typeof partnerParams !== 'object') {
    throw new Error('Partner params needs to be an object');
  }

  ['user_id', 'job_id', 'job_type'].forEach((key) => {
    let partnerKey = key as keyof PartnerParams;
    if (!partnerParams[partnerKey]) {
      throw new Error(`Please make sure that ${key} is included in the partner params`);
    }
  });
};
