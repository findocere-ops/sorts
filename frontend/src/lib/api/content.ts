import { apiRequest } from './client';
import type { ContentItem } from '@/lib/types';

export interface ListContentOptions {
  wallet?: string;
  creatorWallet?: string;
  signature?: string;
  message?: string;
}

export interface CreateContentPayload {
  title: string;
  body?: string;
  contentType?: ContentItem['content_type'];
  tierRequired?: ContentItem['tier_required'];
  pinned?: boolean;
  protectWithDataProtector?: boolean;
  creatorWallet: string;
}

export type UpdateContentPayload = Partial<Omit<CreateContentPayload, 'creatorWallet' | 'protectWithDataProtector'>> & {
  creatorWallet: string;
};

export function listContent(communityId: string, options: ListContentOptions = {}) {
  return apiRequest<ContentItem[]>(`/api/content/${communityId}`, {
    query: {
      wallet: options.wallet,
      creatorWallet: options.creatorWallet,
      signature: options.signature,
      message: options.message,
    },
  });
}

export function getContentItem(communityId: string, postId: string, options: ListContentOptions = {}) {
  return apiRequest<ContentItem>(`/api/content/${communityId}/${postId}`, {
    query: {
      wallet: options.wallet,
      creatorWallet: options.creatorWallet,
      signature: options.signature,
      message: options.message,
    },
  });
}

export function createContent(communityId: string, payload: CreateContentPayload) {
  return apiRequest<{ id: string }>(`/api/content/${communityId}`, {
    method: 'POST',
    body: payload,
  });
}

export function updateContent(communityId: string, postId: string, payload: UpdateContentPayload) {
  return apiRequest<{ success: true }>(`/api/content/${communityId}/${postId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export function deleteContent(communityId: string, postId: string, creatorWallet: string) {
  return apiRequest<{ success: true }>(`/api/content/${communityId}/${postId}`, {
    method: 'DELETE',
    body: { creatorWallet },
  });
}
