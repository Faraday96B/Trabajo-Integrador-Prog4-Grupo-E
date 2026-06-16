const AUTH_TOKEN_KEY = 'token';
const AUTH_USER_KEY = 'usuario';

function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1];
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(normalizedPayload)
        .split('')
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getStoredUser() {
  const storedUser = localStorage.getItem(AUTH_USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  const now = Math.floor(Date.now() / 1000);

  return Boolean(payload?.exp && payload.exp <= now);
}

function setLoginLoading(isLoading) {
  const button = document.querySelector('#loginButton');

  if (!button) {
    return;
  }

  button.disabled = isLoading;
  button.textContent = isLoading ? 'Ingresando...' : 'Ingresar';
}

function showLoginMessage(message, type = 'error') {
  const messageElement = document.querySelector('#loginMessage');

  if (!messageElement) {
    return;
  }

  messageElement.textContent = message;
  messageElement.className = `login-message ${type}`;
  messageElement.hidden = !message;
}

async function handleLogin(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const nombreUsuario = form.nombreUsuario.value.trim();
  const contrasenia = form.contrasenia.value;

  if (!nombreUsuario || !contrasenia) {
    showLoginMessage('Ingrese usuario y contraseña.');
    return;
  }

  setLoginLoading(true);
  showLoginMessage('');

  try {
    const result = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nombreUsuario, contrasenia }),
    }).then(async (response) => {
      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.ok) {
        throw new Error(body?.message || `Error HTTP ${response.status}`);
      }

      return body;
    });

    localStorage.setItem(AUTH_TOKEN_KEY, result.data.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(result.data.usuario));
    window.location.href = '/pages/dashboard.html';
  } catch (error) {
    showLoginMessage(error.message || 'No se pudo iniciar sesión.');
  } finally {
    setLoginLoading(false);
  }
}

function logout(event) {
  event?.preventDefault();

  if (window.clearAuthSession) {
    window.clearAuthSession();
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }

  window.location.href = '/pages/login.html';
}

function requireAuth() {
  const isLoginPage = window.location.pathname.endsWith('/login.html');
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (isLoginPage) {
    if (token && !isTokenExpired(token)) {
      window.location.href = '/pages/dashboard.html';
    }

    return;
  }

  if (!token || isTokenExpired(token)) {
    logout();
  }
}

function updateAuthenticatedUserUI() {
  const usuario = getStoredUser();

  if (!usuario) {
    return;
  }

  document.querySelectorAll('[data-auth-user]').forEach((element) => {
    element.textContent = `${usuario.nombre} ${usuario.apellido}`;
  });

  document.querySelectorAll('.admin-user').forEach((element) => {
    const labels = element.querySelectorAll('span');
    const label = labels[labels.length - 1];

    if (label && !label.classList.contains('admin-avatar')) {
      label.textContent = usuario.nombreUsuario;
    }
  });
}

document.querySelector('#loginForm')?.addEventListener('submit', handleLogin);
document.querySelectorAll('[data-auth-logout], .admin-logout, a[href="login.html"]').forEach((element) => {
  element.addEventListener('click', logout);
});

requireAuth();
updateAuthenticatedUserUI();

window.Auth = {
  decodeJwtPayload,
  getStoredUser,
  logout,
  requireAuth,
};
