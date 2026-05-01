import { apiRequest } from './client';

export interface VerifyTelegramLinkPayload {
  code: string;
  wallet: string;
  signature: string;
  tgId?: string;
}

export function verifyTelegramLink(payload: VerifyTelegramLinkPayload) {
  return apiRequest<{ success: true }>('/api/link/verify', {
    method: 'POST',
    body: payload,
  });
}
