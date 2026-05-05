const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const inflightRequests = new Map<string, Promise<any>>();
let unauthorizedHandler: (() => void) | null = null;

/**
 * Registers a callback to be executed when a 401 or 403 error is encountered.
 */
export const setUnauthorizedHandler = (handler: () => void) => {
    unauthorizedHandler = handler;
};

const handleResponse = async (res: Response) => {
    if (res.status === 401 || res.status === 403) {
        console.warn(`[API] 🛑 Unauthorized access (${res.status}) on ${res.url}`);
        if (unauthorizedHandler) {
            unauthorizedHandler();
        }
    }

    if (!res.ok) {
        const text = await res.text();
        let message = text;
        try {
            const json = JSON.parse(text);
            message = json.detail || text;
        } catch { }
        throw new Error(`${res.status}: ${message}`);
    }
    
    // For 204 No Content, return null
    if (res.status === 204) return null;
    
    return res.json();
};

export const api = {
    get: async (endpoint: string, token?: string) => {
        const cacheKey = `${endpoint}:${token || 'no-token'}`;

        if (inflightRequests.has(cacheKey)) {
            return inflightRequests.get(cacheKey);
        }

        const fetchPromise = (async () => {
            try {
                const headers: HeadersInit = {
                    'Content-Type': 'application/json',
                };
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
                const res = await fetch(`${API_URL}${endpoint}`, { headers });
                return await handleResponse(res);
            } finally {
                inflightRequests.delete(cacheKey);
            }
        })();

        inflightRequests.set(cacheKey, fetchPromise);
        return fetchPromise;
    },

    post: async (endpoint: string, body: any, token?: string, isFormData = false) => {
        const headers: HeadersInit = {};
        let finalBody = body;

        if (isFormData) {
            // If body is a plain object, convert to URLSearchParams for application/x-www-form-urlencoded
            if (!(body instanceof FormData) && !(body instanceof URLSearchParams) && typeof body === 'object') {
                finalBody = new URLSearchParams();
                for (const key in body) {
                    finalBody.append(key, body[key]);
                }
            }
            // Note: fetch automatically sets the correct Content-Type for FormData and URLSearchParams
        } else {
            headers['Content-Type'] = 'application/json';
            finalBody = JSON.stringify(body);
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: finalBody,
        });
        return handleResponse(res);
    },

    /**
     * Standardized login method for OAuth2 Password Flow
     */
    login: async (username: string, password: string) => {
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);

        const res = await fetch(`${API_URL}/auth/access-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });
        return handleResponse(res);
    },

    put: async (endpoint: string, body: any, token?: string, isFormData = false) => {
        const headers: HeadersInit = {};
        let finalBody = body;

        if (isFormData) {
            if (!(body instanceof FormData) && !(body instanceof URLSearchParams) && typeof body === 'object') {
                finalBody = new URLSearchParams();
                for (const key in body) {
                    finalBody.append(key, body[key]);
                }
            }
        } else {
            headers['Content-Type'] = 'application/json';
            finalBody = JSON.stringify(body);
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers,
            body: finalBody,
        });
        return handleResponse(res);
    },

    patch: async (endpoint: string, body: any, token?: string) => {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(body),
        });
        return handleResponse(res);
    },

    delete: async (endpoint: string, token?: string) => {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers,
        });
        return handleResponse(res);
    },
};
