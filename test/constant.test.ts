import { JOB_TYPE } from '..';

describe('Constant', () => {
  it('should have correct jobtypes', () => {
    expect(JOB_TYPE.BIOMETRIC_KYC).toEqual(1);
    expect(JOB_TYPE.SMART_SELFIE_AUTHENTICATION).toEqual(2);
    expect(JOB_TYPE.SMART_SELFIE_REGISTRATION).toEqual(4);
    expect(JOB_TYPE.BASIC_KYC).toEqual(5);
    expect(JOB_TYPE.ENHANCED_KYC).toEqual(5);
    expect(JOB_TYPE.DOCUMENT_VERIFICATION).toEqual(6);
    expect(JOB_TYPE.BUSINESS_VERIFICATION).toEqual(7);
    expect(JOB_TYPE.UPDATE_PHOTO).toEqual(8);
    expect(JOB_TYPE.COMPARE_USER_INFO).toEqual(9);
  });
});
