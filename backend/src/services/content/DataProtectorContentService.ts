import type {
  AccessContentParams,
  IContentService,
  ProtectContentParams,
} from '@sorts/shared';

type DataProtectorModule = typeof import('@iexec/dataprotector');

export interface ProtectedContentMetadata {
  encryptedRef: string;
  protectedDataName: string;
  protectionProvider: 'iexec-dataprotector';
  iappAddress: string | null;
  transactionHash?: string;
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export class DataProtectorContentService implements IContentService {
  private modulePromise: Promise<DataProtectorModule> | null = null;

  isConfigured(): boolean {
    return Boolean(this.privateKey());
  }

  iAppAddress(): string | null {
    return process.env.IEXEC_SORTS_IAPP_ADDRESS || process.env.IEXEC_IAPP_ADDRESS || null;
  }

  async protectTextContent(params: ProtectContentParams): Promise<ProtectedContentMetadata> {
    if (!this.isConfigured()) {
      throw new Error('iExec DataProtector is not configured. Set IEXEC_PRIVATE_KEY or PRIVATE_KEY.');
    }

    const core = await this.core();
    const protectedDataName = `sorts-${params.contentId}`;
    const data = {
      contentId: params.contentId,
      content: typeof params.data === 'string'
        ? params.data
        : Buffer.from(params.data).toString('utf8'),
      mimeType: params.mimeType,
      requiredTier: params.requiredTier,
      authorWallet: params.authorWallet.toLowerCase(),
    };

    const protectedData = await core.protectData({
      name: protectedDataName,
      data,
    });

    const iappAddress = this.iAppAddress();
    if (iappAddress) {
      await core.grantAccess({
        protectedData: protectedData.address,
        authorizedApp: iappAddress,
        authorizedUser: ZERO_ADDRESS,
        pricePerAccess: 0,
      });
    }

    return {
      encryptedRef: protectedData.address,
      protectedDataName,
      protectionProvider: 'iexec-dataprotector',
      iappAddress,
      transactionHash: protectedData.transactionHash,
    };
  }

  async protectContent(params: ProtectContentParams): Promise<{ encryptedRef: string }> {
    const protectedContent = await this.protectTextContent(params);
    return { encryptedRef: protectedContent.encryptedRef };
  }

  async grantAccess(encryptedRef: string, memberWallet: string, iAppAddress: string): Promise<void> {
    if (!this.isConfigured()) return;
    const core = await this.core();
    await core.grantAccess({
      protectedData: encryptedRef,
      authorizedApp: iAppAddress,
      authorizedUser: memberWallet,
      pricePerAccess: 0,
    });
  }

  async revokeAccess(encryptedRef: string, memberWallet: string): Promise<void> {
    if (!this.isConfigured()) return;
    const core = await this.core();
    await core.revokeAllAccess({
      protectedData: encryptedRef,
      authorizedUser: memberWallet,
      authorizedApp: this.iAppAddress() ?? undefined,
    });
  }

  async accessContent(params: AccessContentParams): Promise<{ data: string; mimeType: string } | null> {
    if (!this.isConfigured()) return null;

    const iappAddress = this.iAppAddress();
    if (!iappAddress) return null;

    const core = await this.core();
    const result = await core.processProtectedData({
      protectedData: params.encryptedRef,
      app: iappAddress,
      args: JSON.stringify({
        requester: params.requestingWallet.toLowerCase(),
        communityAddress: params.communityAddress.toLowerCase(),
        requiredTier: params.requiredTier,
      }),
      waitForResult: true,
    });

    return {
      data: new TextDecoder().decode(result.result),
      mimeType: 'text/plain',
    };
  }

  private privateKey(): string | null {
    return process.env.IEXEC_PRIVATE_KEY || process.env.PRIVATE_KEY || null;
  }

  private async core() {
    const mod = await this.loadModule();
    const provider = mod.getWeb3Provider(this.privateKey() as string);
    const protector = new mod.IExecDataProtector(provider, {
      allowExperimentalNetworks: true,
    });
    return protector.core;
  }

  private async loadModule(): Promise<DataProtectorModule> {
    if (!this.modulePromise) {
      const dynamicImport = new Function('specifier', 'return import(specifier)') as
        (specifier: string) => Promise<DataProtectorModule>;
      this.modulePromise = dynamicImport('@iexec/dataprotector');
    }
    return this.modulePromise;
  }
}
