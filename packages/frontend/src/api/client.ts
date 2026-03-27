/**
 * ISS-048: API Client Interceptor
 * Fetch wrapper with JWT injection, 401 intercept → token refresh → retry.
 * Child tokens are never refreshed — session is cleared on 401.
 */

import { useAuthStore } from '../store/auth';

const BASE_URL = '/api/v1';

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

class ApiClient {
  private refreshPromise: Promise<boolean> | null = null;

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = useAuthStore.getState().token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /** Deduplicated refresh — concurrent callers share a single refresh attempt. */
  private tryRefresh(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) return false;

        const body = await res.json();
        const store = useAuthStore.getState();
        store.setAuth(
          body.data.accessToken,
          store.role!,
          store.userId!,
          store.parentId ?? undefined,
        );
        return true;
      } catch {
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const headers = { ...this.getHeaders(), ...(options.headers as Record<string, string>) };

    let res = await fetch(url, { ...options, headers, credentials: 'include' });

    if (res.status === 401) {
      const role = useAuthStore.getState().role;

      // Children have no refresh token — clear session immediately
      if (role === 'child') {
        useAuthStore.getState().clearAuth();
        throw new ApiRequestError('Session expired', 'UNAUTHORIZED', 401);
      }

      const refreshed = await this.tryRefresh();
      if (refreshed) {
        const retryHeaders = {
          ...this.getHeaders(),
          ...(options.headers as Record<string, string>),
        };
        res = await fetch(url, { ...options, headers: retryHeaders, credentials: 'include' });
      } else {
        useAuthStore.getState().clearAuth();
        throw new ApiRequestError('Session expired', 'UNAUTHORIZED', 401);
      }
    }

    const body = await res.json();

    if (!body.success) {
      throw new ApiRequestError(
        body.error?.message || 'Request failed',
        body.error?.code || 'UNKNOWN_ERROR',
        res.status,
        body.error?.details,
      );
    }

    return body.data as T;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  post<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
