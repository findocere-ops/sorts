export interface ProtectContentParams {
  contentId: string;
  data: string | Uint8Array;
  mimeType: string;
  requiredTier: 1 | 2 | 3;
  authorWallet: string;
}

export interface AccessContentParams {
  encryptedRef: string;
  requestingWallet: string;
  communityAddress: string;
  requiredTier: 1 | 2 | 3;
}

export interface IContentService {
  /** Encrypt content and return an opaque ref stored in the DB. */
  protectContent(params: ProtectContentParams): Promise<{ encryptedRef: string }>;

  /** Grant access to a verified member. */
  grantAccess(encryptedRef: string, memberWallet: string, iAppAddress: string): Promise<void>;

  /** Revoke access when membership expires. */
  revokeAccess(encryptedRef: string, memberWallet: string): Promise<void>;

  /** Decrypt and return content for a verified member. */
  accessContent(params: AccessContentParams): Promise<{ data: string; mimeType: string } | null>;
}
