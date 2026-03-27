/**
 * ISS-048: API Client Interceptor
 * Fetch wrapper with JWT injection, 401 intercept → token refresh → retry.
 * Child tokens are never refreshed — session is cleared on 401.
 */
import { useAuthStore } from '../store/auth';
const BASE_URL = '/api/v1';
export class ApiRequestError extends Error {
    constructor(message, code, status, details) {
        super(message);
        this.code = code;
        this.status = status;
        this.details = details;
        this.name = 'ApiRequestError';
    }
}
class ApiClient {
    constructor() {
        this.refreshPromise = null;
    }
    getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = useAuthStore.getState().token;
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }
    /** Deduplicated refresh — concurrent callers share a single refresh attempt. */
    tryRefresh() {
        if (this.refreshPromise)
            return this.refreshPromise;
        this.refreshPromise = (async () => {
            try {
                const res = await fetch(`${BASE_URL}/auth/refresh`, {
                    method: 'POST',
                    credentials: 'include',
                });
                if (!res.ok)
                    return false;
                const body = await res.json();
                const store = useAuthStore.getState();
                store.setAuth(body.data.accessToken, store.role, store.userId, store.parentId ?? undefined);
                return true;
            }
            catch {
                return false;
            }
            finally {
                this.refreshPromise = null;
            }
        })();
        return this.refreshPromise;
    }
    async request(path, options = {}) {
        const url = `${BASE_URL}${path}`;
        const headers = { ...this.getHeaders(), ...options.headers };
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
                    ...options.headers,
                };
                res = await fetch(url, { ...options, headers: retryHeaders, credentials: 'include' });
            }
            else {
                useAuthStore.getState().clearAuth();
                throw new ApiRequestError('Session expired', 'UNAUTHORIZED', 401);
            }
        }
        const body = await res.json();
        if (!body.success) {
            throw new ApiRequestError(body.error?.message || 'Request failed', body.error?.code || 'UNKNOWN_ERROR', res.status, body.error?.details);
        }
        return body.data;
    }
    get(path) {
        return this.request(path, { method: 'GET' });
    }
    post(path, data) {
        return this.request(path, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }
    put(path, data) {
        return this.request(path, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }
    delete(path) {
        return this.request(path, { method: 'DELETE' });
    }
}
export const apiClient = new ApiClient();
