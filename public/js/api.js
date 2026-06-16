function getAuthToken() {
  return localStorage.getItem('token');
}

function clearAuthSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
}

function redirectToLogin() {
  if (!window.location.pathname.endsWith('/login.html')) {
    window.location.href = '/pages/login.html';
  }
}

async function apiRequest(url, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });
  const result = await response.json().catch(() => null);

  if (response.status === 401) {
    clearAuthSession();
    redirectToLogin();
    throw new Error(result?.message || 'Sesión expirada.');
  }

  if (!response.ok || !result?.ok) {
    throw new Error(result?.message || `Error HTTP ${response.status}`);
  }

  return result;
}

window.apiRequest = apiRequest;
window.clearAuthSession = clearAuthSession;
window.redirectToLogin = redirectToLogin;
