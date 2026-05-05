/**
 * PrivyService — bearer-token verification tests.
 *
 * The upstream `@privy-io/server-auth` PrivyClient is mocked. We assert that:
 *   - Valid tokens with linked wallets project to PrivyVerifiedIdentity.
 *   - Invalid / missing / wrong-format tokens return null.
 *   - The raw token is never returned in any code path.
 *   - Errors from the upstream client never bubble to the caller as exceptions.
 */

jest.mock('@privy-io/server-auth', () => {
  return {
    PrivyClient: jest.fn().mockImplementation(() => ({
      verifyAuthToken: jest.fn(),
      getUserById: jest.fn(),
    })),
  };
});

import { PrivyClient } from '@privy-io/server-auth';
import { PrivyService } from '../services/wallet/PrivyService';

const MockedClient = PrivyClient as unknown as jest.MockedClass<typeof PrivyClient>;

function freshService() {
  MockedClient.mockClear();
  const svc = new PrivyService('test-app-id', 'test-app-secret');
  // Pull the underlying mock instance so individual tests can program responses.
  const instance = MockedClient.mock.results[0].value as {
    verifyAuthToken: jest.Mock;
    getUserById: jest.Mock;
  };
  return { svc, instance };
}

describe('PrivyService.verifyBearerToken', () => {
  it('returns null for missing or empty tokens', async () => {
    const { svc } = freshService();
    expect(await svc.verifyBearerToken('')).toBeNull();
    expect(await svc.verifyBearerToken(' ')).toBeNull();
    expect(await svc.verifyBearerToken('Bearer ')).toBeNull();
    // @ts-expect-error - exercising runtime guard
    expect(await svc.verifyBearerToken(undefined)).toBeNull();
  });

  it('returns null when verifyAuthToken throws', async () => {
    const { svc, instance } = freshService();
    instance.verifyAuthToken.mockRejectedValue(new Error('expired'));
    const out = await svc.verifyBearerToken('Bearer expired-token-xyz');
    expect(out).toBeNull();
  });

  it('returns null when claims have no userId', async () => {
    const { svc, instance } = freshService();
    instance.verifyAuthToken.mockResolvedValue({});
    const out = await svc.verifyBearerToken('Bearer x');
    expect(out).toBeNull();
  });

  it('returns null when getUserById throws', async () => {
    const { svc, instance } = freshService();
    instance.verifyAuthToken.mockResolvedValue({ userId: 'did:privy:abc' });
    instance.getUserById.mockRejectedValue(new Error('upstream'));
    const out = await svc.verifyBearerToken('Bearer x');
    expect(out).toBeNull();
  });

  it('projects linked wallets to PrivyVerifiedIdentity', async () => {
    const { svc, instance } = freshService();
    instance.verifyAuthToken.mockResolvedValue({ userId: 'did:privy:abc' });
    instance.getUserById.mockResolvedValue({
      id: 'did:privy:abc',
      linkedAccounts: [
        { type: 'wallet', address: '0xAaa', chainType: 'ethereum' },
        { type: 'wallet', address: '2hbt2arr3D7S6A3jkfbT5cJ2se19TBAPuuXJ48yiBATQ', chainType: 'solana' },
        { type: 'email', address: 'user@example.com' },
      ],
    });

    const out = await svc.verifyBearerToken('Bearer good-token');
    expect(out).not.toBeNull();
    expect(out!.privyUserId).toBe('did:privy:abc');
    expect(out!.email).toBe('user@example.com');
    expect(out!.linkedWallets).toEqual([
      { chain: 'evm', address: '0xAaa' },
      { chain: 'solana', address: '2hbt2arr3D7S6A3jkfbT5cJ2se19TBAPuuXJ48yiBATQ' },
    ]);
  });

  it('strips a leading "Bearer " prefix transparently', async () => {
    const { svc, instance } = freshService();
    instance.verifyAuthToken.mockResolvedValue({ userId: 'u1' });
    instance.getUserById.mockResolvedValue({ id: 'u1', linkedAccounts: [] });
    await svc.verifyBearerToken('Bearer abc-123');
    expect(instance.verifyAuthToken).toHaveBeenCalledWith('abc-123');
  });

  it('NEVER includes the raw token in the returned identity', async () => {
    const { svc, instance } = freshService();
    instance.verifyAuthToken.mockResolvedValue({ userId: 'u1' });
    instance.getUserById.mockResolvedValue({ id: 'u1', linkedAccounts: [] });
    const token = 'Bearer my-secret-token-xyz';
    const out = await svc.verifyBearerToken(token);
    expect(JSON.stringify(out)).not.toContain('my-secret-token-xyz');
  });

  it('throws if appId or appSecret is missing', () => {
    expect(() => new PrivyService('', 'secret')).toThrow();
    expect(() => new PrivyService('id', '')).toThrow();
  });
});
