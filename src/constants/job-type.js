const JOBTYPE = {
  // Compares a selfie to a selfie on file.
  BIOMETRIC_KYC: 1,
  // Compares a selfie to a selfie on file.
  SMART_SELFIE_AUTHENTICATION: 2,
  // Creates an enrollee, associates a selfie with a partner_id, user_id
  SMART_SELFIE_REGISTRATION: 4,
  // Verifies identity information of a person with their personal
  // information and ID number from one of our supported ID Types.
  BASIC_KYC: 5,
  // Queries Identity Information of user using ID_number.
  ENHANCED_KYC: 5,
  // Verifies user info retrieved from the ID issuing authority.
  DOCUMENT_VERIFICATION: 6,
  // Verifies authenticity of Document IDs, confirms it's linked to the user
  // using facial biometrics.
  BUSINESS_VERIFICATION: 7,
  // Updates the photo on file for an enrolled user
  UPDATE_PHOTO: 8,
  // Compares document verification to an id check
  COMPARE_USER_INFO: 9
}

module.exports = JOBTYPE;
