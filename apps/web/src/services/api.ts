const getAuthToken = () => localStorage.getItem('code-liner-token');

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('code-liner-token', token);
  } else {
    localStorage.removeItem('code-liner-token');
  }
};

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

  const response = await fetch(endpoint, {
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
