const getAuthToken = () => localStorage.getItem('code-liner-token');

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('code-liner-token', token);
  } else {
    localStorage.removeItem('code-liner-token');
  }
};

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers || {}),
  } as any;

  // Let browser attach form boundaries automatically if upload payload is FormData
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.statusText}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};
