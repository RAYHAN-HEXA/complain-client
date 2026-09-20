import axios, { type AxiosError } from 'axios';
import type { ApiEnvelope } from '../types';
import { API_BASE_URL } from '../config';
import { currentToken, isDevMode } from './tokenProvider';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Single interceptor — no duplicated token logic across API calls (PRD §6).
api.interceptors.request.use(async (cfg) => {
  const token = await currentToken();
  if (token) {
    if (isDevMode()) {
      cfg.headers['X-Dev-UID'] = token;
    } else {
      cfg.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return cfg;
});

export class ApiError extends Error {
  code: string;
  fields?: Record<string, string>;
  status?: number;
  constructor(message: string, code = 'ERROR', fields?: Record<string, string>, status?: number) {
    super(message);
    this.code = code;
    this.fields = fields;
    this.status = status;
  }
}

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<ApiEnvelope>) => {
    const body = err.response?.data;
    const message =
      body?.message ??
      (err.code === 'ECONNABORTED' ? 'Request timed out' : 'Network error — is the API running?');
    return Promise.reject(
      new ApiError(message, body?.error?.code ?? 'ERROR', body?.error?.fields, err.response?.status),
    );
  },
);

/** Unwrap the standard envelope; throws ApiError on failure. */
export async function request<T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<ApiEnvelope<T>> {
  const res = await promise;
  return res.data;
}

/** Download an evidence file with auth (returns a blob URL). */
export async function fetchFileBlob(evidenceId: string): Promise<string> {
  const res = await api.get(`/api/v1/files/${evidenceId}`, { responseType: 'blob' });
  return URL.createObjectURL(res.data);
}
