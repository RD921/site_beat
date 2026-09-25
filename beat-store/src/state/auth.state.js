/**
 * BEAT STORE — Auth State
 * Estado de autenticação persistido em localStorage.
 * Emite evento 'auth:changed' sempre que o estado muda.
 */

const STORAGE_KEY = 'bs_auth_user';

function emit(eventName, detail = {}) {
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
}

/**
 * Retorna o usuário logado ou null
 * @returns {User|null}
 */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Salva o usuário como logado
 * @param {User} user
 */
export function setCurrentUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  emit('auth:changed', { user });
}

/**
 * Desloga o usuário
 */
export function logout() {
  localStorage.removeItem(STORAGE_KEY);
  emit('auth:changed', { user: null });
}

/**
 * Verifica se há usuário logado
 * @returns {boolean}
 */
export function isAuthenticated() {
  return getCurrentUser() !== null;
}

/**
 * Retorna as iniciais do usuário logado
 * @returns {string}
 */
export function getUserInitials() {
  const user = getCurrentUser();
  if (!user || !user.name) return '?';
  return user.name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
}
