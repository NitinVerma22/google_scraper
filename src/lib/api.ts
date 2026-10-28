import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isAuthenticating = false;

// Ensure we have a valid session token
export async function ensureAuthenticated() {
  if (typeof window === 'undefined') return null;

  let token = localStorage.getItem('leadgen_token');
  if (token) return token;

  if (isAuthenticating) return null;
  isAuthenticating = true;

  try {
    const res = await axios.post(`${API_BASE}/api/v1/auth/login`, {
      email: 'admin@leadgen.com',
      password: 'AdminPassword123!',
    });

    if (res.data?.accessToken) {
      token = res.data.accessToken;
      localStorage.setItem('leadgen_token', token);
      localStorage.setItem('leadgen_user', JSON.stringify(res.data.user || { name: 'Executive Administrator', role: 'ADMIN' }));
      return token;
    }
  } catch (err) {
    console.error('Auto-auth failed', err);
  } finally {
    isAuthenticating = false;
  }
  return null;
}

// Request interceptor: attach token or auto-authenticate
apiClient.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    let token = localStorage.getItem('leadgen_token');
    if (!token && !config.url?.includes('/auth/login')) {
      token = await ensureAuthenticated();
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor: on 401 Unauthorized, automatically renew token and retry once
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      typeof window !== 'undefined' &&
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      originalRequest._retry = true;
      localStorage.removeItem('leadgen_token');
      const token = await ensureAuthenticated();
      if (token) {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      }
    }
    return Promise.reject(error);
  },
);
