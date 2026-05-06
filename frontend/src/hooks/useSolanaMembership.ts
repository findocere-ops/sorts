'use client';

import { useEffect, useState } from 'react';
import { useChain } from '@/lib/chain/useChain';
import { useUmbraPrivacy } from './useUmbraPrivacy';
import type { PrivateEntitlementResult } from '@sorts/shared';

/** Combined access + privacy state for a community feed.
 *
 *  Talks to the backend `/api/privacy/entitlement` route (Day 4), which
 *  delegates to UmbraPrivacyService. The hook NEVER exposes the tier, the
 *  commitment, or the salt — only `{ active, expiresAt, privacyMode }`. */
export interface SolanaMembershipState {
  loading: boolean;
  entitlement: PrivateEntitlementResult | null;
  isFallback: boolean;
  error: string | null;
}

const FALLBACK: PrivateEntitlementResult = {
  active: false,
  privacyMode: 'on-chain-commitment-fallback',
};

export function useSolanaMembership(communityAddress: string | null): SolanaMembershipState {
  const adapter = useChain();
  const subscriber = adapter.address ?? null;
  const privacy = useUmbraPrivacy(subscriber);

  const [entitlement, setEntitlement] = useState<PrivateEntitlementResult | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(communityAddress && subscriber));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!communityAddress || !subscriber) {
      setEntitlement(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
        const url = new URL(`${apiUrl}/api/privacy/entitlement`);
        url.searchParams.set('community', communityAddress);
        url.searchParams.set('subscriber', subscriber);
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = (await res.json()) as { success: boolean; data?: PrivateEntitlementResult };
        if (cancelled) return;
        if (json.success && json.data) {
          setEntitlement(json.data);
          setError(null);
        } else {
          setEntitlement({ ...FALLBACK, privacyMode: privacy.privacyMode });
          setError('entitlement check failed');
        }
      } catch (err) {
        if (cancelled) return;
        // Default to inactive when the privacy backend is unreachable — never
        // unlock content on a soft failure.
        setEntitlement({ ...FALLBACK, privacyMode: privacy.privacyMode });
        setError(err instanceof Error ? err.message : 'failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [communityAddress, subscriber, privacy.privacyMode]);

  return {
    loading: loading || privacy.loading,
    entitlement,
    isFallback: privacy.isFallback,
    error,
  };
}
