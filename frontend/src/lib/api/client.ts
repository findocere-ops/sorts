import { API_URL } from '@/lib/constants';
import type { ApiEnvelope, ApiError } from '@/lib/types';

const DEFAULT_TIMEOUT_MS = 10000;

export class ApiClientError extends Error {
  readonly code: ApiError['code'];
  readonly status?: number;
  readonly details?: unknown;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiClientError';
    this.code = error.code;
    this.status = error.status;
    this.details = error.details;
  }

  toJSON(): ApiError {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
      details: this.details,
    };
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: BodyInit | object | null;
  query?: Record<string, string | number | boolean | null | undefined>;
  timeoutMs?: number;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, headers, query, timeoutMs = DEFAULT_TIMEOUT_MS, ...init } = options;
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildUrl(path, query), {
      ...init,
      body: serializeBody(body),
      headers: buildHeaders(headers, body),
      signal: controller.signal,
    });

    const payload = await parseJson(response);

    if (!response.ok) {
      throw new ApiClientError({
        code: 'http_error',
        message: getPayloadError(payload) ?? `Request failed with status ${response.status}.`,
        status: response.status,
        details: payload,
      });
    }

    if (isApiEnvelope<T>(payload)) {
      if (!payload.success) {
        throw new ApiClientError({
          code: 'api_error',
          message: normalizeErrorMessage(payload.error) ?? 'The SORTS API returned an error.',
          status: response.status,
          details: payload,
        });
      }

      return ('data' in payload ? payload.data : payload) as T;
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiClientError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiClientError({
        code: 'timeout',
        message: 'The SORTS backend took too long to respond. Try again in a moment.',
      });
    }

    throw new ApiClientError({
      code: 'backend_offline',
      message: 'The SORTS backend is not reachable. Check that it is running and that NEXT_PUBLIC_API_URL is correct.',
      details: error,
    });
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export function getApiBaseUrl(): string {
  return API_URL;
}

function buildUrl(path: string, query?: ApiRequestOptions['query']): string {
  const base = path.startsWith('http') ? path : `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const url = new URL(base);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== null && value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function serializeBody(body: ApiRequestOptions['body']): BodyInit | null | undefined {
  if (!body) return body;
  if (typeof body === 'string' || body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob) {
    return body;
  }
  return JSON.stringify(body);
}

function buildHeaders(headers: HeadersInit | undefined, body: ApiRequestOptions['body']): HeadersInit {
  if (!body || typeof body === 'string' || body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob) {
    return headers ?? {};
  }

  return {
    'Content-Type': 'application/json',
    ...headers,
  };
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new ApiClientError({
      code: 'invalid_json',
      message: 'The SORTS backend returned a response that was not valid JSON.',
      status: response.status,
      details: { text, error },
    });
  }
}

function isApiEnvelope<T>(payload: unknown): payload is ApiEnvelope<T> {
  return Boolean(payload && typeof payload === 'object' && 'success' in payload);
}

function getPayloadError(payload: unknown): string | null {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    return normalizeErrorMessage((payload as { error?: unknown }).error);
  }
  return null;
}

function normalizeErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (typeof error === 'string') return error;
  if (typeof error === 'object') return 'The SORTS API rejected the request. Check the highlighted fields and try again.';
  return String(error);
}
