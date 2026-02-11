const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = {
    get: async (endpoint: string, token?: string) => {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${API_URL}${endpoint}`, { headers });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
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
        if (!res.ok) throw new Error(await res.text());
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
        if (!res.ok) throw new Error(await res.text());
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
        if (!res.ok) throw new Error(await res.text());
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
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },
};
