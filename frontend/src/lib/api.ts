const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const inflightRequests = new Map<string, Promise<any>>();

export const api = {
    get: async (endpoint: string, token?: string) => {
        const cacheKey = `${endpoint}:${token || 'no-token'}`;

        if (inflightRequests.has(cacheKey)) {
            console.log(`📡 Merging inflight request for: ${endpoint}`);
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
                if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
                return await res.json();
            } finally {
                inflightRequests.delete(cacheKey);
            }
        })();

        inflightRequests.set(cacheKey, fetchPromise);
        return fetchPromise;
    },

    post: async (endpoint: string, body: any, token?: string, isFormData = false) => {
        const headers: HeadersInit = {};
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: isFormData ? body : JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        return res.json();
    },

    put: async (endpoint: string, body: any, token?: string, isFormData = false) => {
        const headers: HeadersInit = {};
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers,
            body: isFormData ? body : JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        return res.json();
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
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        return res.json();
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
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        return res.json();
    },
};
