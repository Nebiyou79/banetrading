// types/kyc.ts
// ── KYC types ──

export type KycStatusValue = 'not_submitted' | 'pending' | 'approved' | 'rejected';
export type KycLevel = 1 | 2 | 3;
export type IdType = 'passport' | 'national_id' | 'drivers_license';

export interface KycLevel2 {
  status: KycStatusValue;
  fullName?: string;
  dateOfBirth?: string;       // ISO
  country?: string;
  idType?: IdType;
  idNumber?: string;
  expiryDate?: string;        // ISO
  idFrontPath?: string;
  idBackPath?: string;
  selfiePath?: string;
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

export interface KycLevel3 {
  status: KycStatusValue;
  fullName?: string;
  addressLine?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  documentPath?: string;
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

export interface KycStatusResponse {
  tier: number;
  level2: KycLevel2;
  level3: KycLevel3;
  updatedAt?: string;
}

export interface KycSubmitLevel2Input {
  fullName: string;
  dateOfBirth: string;        // YYYY-MM-DD
  country: string;
  idType: IdType;
  idNumber: string;
  expiryDate?: string;
  idFront: File;              // required
  idBack?: File;
  selfie?: File;
}

export interface KycSubmitLevel2Response {
  message: string;
  level2: KycLevel2;
}

export interface KycSubmitLevel3Input {
  fullName: string;
  addressLine: string;
  city: string;
  postalCode: string;
  country: string;
  document: File;             // required
}

export interface KycSubmitLevel3Response {
  message: string;
  level3: KycLevel3;
}