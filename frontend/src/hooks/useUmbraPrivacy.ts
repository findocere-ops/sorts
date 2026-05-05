'use client';

import { useEffect, useState } from 'react';
import type { PrivacyMode, RegistrationStatus } from '@sorts/shared';

/** Frontend privacy-state hook. Talks to the backend `/api/privacy/status`
 *  endpoint that wraps the Day-4 UmbraPrivacyService.
 *
 *  The hook exposes the current privacy mode and registration status. It
 *  NEVER returns a tier number, ciphertext, or seed. It NEVER persists the
 *  identity to localStorage; everything flows through the backend so the
 *  authoritative privacy mode is whatever the server reports. */
export interface UmbraPrivacyState {
  loading: boolean;
  registered: boolean;
  privacyMode: PrivacyMode;
  /** True when the backend reported the cut-line fallback mode. UI should
   *  render the "encrypted membership state coming via Umbra in v2" label. */
  isFallback: boolean;
  error: string | null;
}

const FALLBACK_MODE: PrivacyMode = 'on-chain-commitment-fallback';

export function useUmbraPrivacy(subscriber?: string | null): UmbraPrivacyState {
  const [state, setState] = useState<UmbraPrivacyState>({
    loading: Boolean(subscriber),
    registered: false,
    privacyMode: 'none',
    isFallback: false,
    error: null,
  });

  useEffect(() => {
    if (!subscriber) {
      setState({ loading: false, registered: false, privacyMode: 'none', isFallback: false, error: null });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/privacy/status?subscriber=${encodeURIComponent(subscriber)}`);
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = (await res.json()) as { success: boolean; data?: RegistrationStatus; error?: string };
        if (cancelled) return;
        if (!json.success || !json.data) {
          setState({ loading: false, registered: false, privacyMode: FALLBACK_MODE, isFallback: true, error: json.error ?? 'failed' });
          return;
        }
        setState({
          loading: false,
          registered: json.data.registered,
          privacyMode: json.data.privacyMode,
          isFallback: json.data.privacyMode === FALLBACK_MODE,
          error: null,
        });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'failed';
        // Default to fallback semantics when the backend is unreachable so
        // the UI can still render an honest "encrypted membership coming in
        // v2" label rather than claiming Umbra is active.
        setState({ loading: false, registered: false, privacyMode: FALLBACK_MODE, isFallback: true, error: message });
      }
    })();
    return () => { cancelled = true; };
  }, [subscriber]);

  return state;
}
