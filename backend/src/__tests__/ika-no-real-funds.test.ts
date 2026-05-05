/**
 * t6 — IkaDWalletService refuses real-funds methods unless the explicit
 *      `ENABLE_IKA_REAL_FUNDS=true` flag is set. The pre-alpha build
 *      never silently signs real-money payloads.
 */

import { IkaDWalletService } from '../services/wallet/IkaDWalletService';

describe('IkaDWalletService — no real funds without explicit opt-in (t6)', () => {
  let originalFlag: string | undefined;

  beforeEach(() => {
    originalFlag = process.env.ENABLE_IKA_REAL_FUNDS;
  });
  afterEach(() => {
    if (originalFlag === undefined) delete process.env.ENABLE_IKA_REAL_FUNDS;
    else process.env.ENABLE_IKA_REAL_FUNDS = originalFlag;
  });

  it('throws when the real-funds method runs without the flag', () => {
    delete process.env.ENABLE_IKA_REAL_FUNDS;
    const svc = new IkaDWalletService();
    expect(() => svc.signRealFundsPayload({})).toThrow(/real-funds method blocked/);
  });

  it('explicit opt-in via constructor option still throws — pre-alpha never signs', () => {
    const svc = new IkaDWalletService({ enableRealFunds: true });
    expect(() => svc.signRealFundsPayload({})).toThrow(/not implemented in pre-alpha/);
  });

  it('default surface (status, capabilities) is pre-alpha and canSign:false', async () => {
    const svc = new IkaDWalletService();
    const status = await svc.getStatus();
    expect(status.status).toBe('pre-alpha');
    expect(status.canSign).toBe(false);

    const caps = await svc.getCapabilities();
    expect(caps.length).toBeGreaterThan(0);
    for (const c of caps) {
      expect(c.status).toBe('pre-alpha');
    }
  });
});
