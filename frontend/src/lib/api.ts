//export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api' || 'http://localhost:5000/api';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}

async function fetchAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { headers, ...rest } = options;

    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const config = {
        ...rest,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...headers,
        },
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        if (response.status === 401) {
            // Optional: Redirect to login or clear token
            if (typeof window !== 'undefined') localStorage.removeItem('token');
            // location.href = '/login'; // Use with caution to avoid loops
        }
        // Try to parse error message from JSON response
        try {
            const errorData = await response.json();
            throw new Error(errorData.message || errorData.error || 'Something went wrong');
        } catch (e) {
            if (e instanceof Error) throw e;
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}

export const api = {
    get: <T>(endpoint: string, options?: FetchOptions) => fetchAPI<T>(endpoint, { ...options, method: 'GET' }),
    post: <T>(endpoint: string, body: any, options?: FetchOptions) => fetchAPI<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
    put: <T>(endpoint: string, body: any, options?: FetchOptions) => fetchAPI<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    delete: <T>(endpoint: string, options?: FetchOptions) => fetchAPI<T>(endpoint, { ...options, method: 'DELETE' }),
};
