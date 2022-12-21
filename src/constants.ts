/**
 * The type of image submitted in the job request
 *
 * @readonly
 * @enum {number}
 */
export const IMAGE_TYPE = {
  /** SELFIE_IMAGE_FILE Selfie image in .png or .jpg file format */
  SELFIE_IMAGE_FILE: 0,
  /** ID_CARD_IMAGE_FILE ID card image in .png or .jpg file format */
  ID_CARD_IMAGE_FILE: 1,
  /** SELFIE_IMAGE_BASE64 Base64 encoded selfie image (.png or .jpg) */
  SELFIE_IMAGE_BASE64: 2,
  /** ID_CARD_IMAGE_BASE64 Base64 encoded ID card image (.png or .jpg) */
  ID_CARD_IMAGE_BASE64: 3,
  /** LIVENESS_IMAGE_FILE Liveness image in .png or .jpg file format */
  LIVENESS_IMAGE_FILE: 4,
  /** ID_CARD_BACK_IMAGE_FILE Back of ID card image in .png or .jpg file format */
  ID_CARD_BACK_IMAGE_FILE: 5,
  /** LIVENESS_IMAGE_BASE64 Base64 encoded liveness image (.jpg or .png) */
  LIVENESS_IMAGE_BASE64: 6,
  /** ID_CARD_BACK_IMAGE_BASE64 Base64 encoded back of ID card image (.jpg or .png) */
  ID_CARD_BACK_IMAGE_BASE64: 7,
};

/**
 * The type of verification job to be performed
 *
 * @readonly
 * @enum {number}
 */
export const JOB_TYPE = {
  /** BIOMETRIC_KYC Verify the ID information of your users using facial biometrics */
  BIOMETRIC_KYC: 1,
  /** SMART_SELFIE_AUTHENTICATION Used to identify your existing users. */
  SMART_SELFIE_AUTHENTICATION: 2,
  /** SMART_SELFIE_REGISTRATION Used to verify and register a user for future authentication. */
  SMART_SELFIE_REGISTRATION: 4,
  /**
   * Verifies identity information of a person with their personal
   * information and ID number from one of our supported ID Types.
   */
  BASIC_KYC: 5,
  /**
   * ENHANCED_KYC query the Identity Information for an individual using their
   * ID number from one of our supported.
   */
  ENHANCED_KYC: 5,
  /** DOCUMENT_VERIFICATION Detailed user information retrieved from the ID issuing authority. */
  DOCUMENT_VERIFICATION: 6,
  /**
   * BUSINESS_VERIFICATION Verify the authenticity of Document IDs of your users
   * and confirm it belongs to the user using facial biometrics.
   */
  BUSINESS_VERIFICATION: 7,
  /** Updates the photo on file for an enrolled user */
  UPDATE_PHOTO: 8,
  /** Compares document verification to an id check */
  COMPARE_USER_INFO: 9,
};

export const sidServerMapping : {[k:string | number]: string} = {
  0: 'testapi.smileidentity.com/v1',
  1: 'api.smileidentity.com/v1',
};
