const profileName = document.querySelector('#profileName');
const profileLastName = document.querySelector('#profileLastName');
const profileUsername = document.querySelector('#profileUsername');
const profileUserId = document.querySelector('#profileUserId');
const profileMessage = document.querySelector('#profileMessage');

function setValue(element, value) {
  if (element) {
    element.value = value ?? '-';
  }
}

function showProfileMessage(message) {
  if (!profileMessage) {
    return;
  }

  profileMessage.textContent = message;
  profileMessage.hidden = !message;
}

function renderProfile(usuario) {
  setValue(profileName, usuario?.nombre);
  setValue(profileLastName, usuario?.apellido);
  setValue(profileUsername, usuario?.nombreUsuario);
  setValue(profileUserId, usuario?.idUsuario);
}

async function loadProfile() {
  try {
    const result = await window.apiRequest('/api/auth/me');
    renderProfile(result.data?.usuario);
    showProfileMessage('');
  } catch (error) {
    console.error(error);
    renderProfile(null);
    showProfileMessage(error.message || 'No se pudieron cargar los datos del perfil.');
  }
}

loadProfile();
