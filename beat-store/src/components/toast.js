/**
 * BEAT STORE — Toast Notification Component
 * Notificações não-bloqueantes com auto-dismiss.
 */

let _container = null;

function getContainer() {
  if (!_container) {
    _container = document.createElement('div');
    _container.className = 'toast-container';
    _container.setAttribute('role', 'status');
    _container.setAttribute('aria-live', 'polite');
    document.body.appendChild(_container);
  }
  return _container;
}

/**
 * Exibe um toast
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 * @param {number} duration - milliseconds
 */
export function showToast(message, type = 'info', duration = 3500) {
  const container = getContainer();
  const toast = document.createElement('div');

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };

  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span aria-hidden="true">${icons[type] ?? icons.info}</span>
    <span>${message}</span>
    <button type="button" class="btn-ghost btn-icon" aria-label="Fechar notificação" style="margin-left: auto; padding: 4px;">✕</button>
  `;

  toast.querySelector('button').addEventListener('click', () => dismiss(toast));
  container.appendChild(toast);

  setTimeout(() => dismiss(toast), duration);
}

function dismiss(toast) {
  if (!toast.isConnected) return;
  toast.classList.add('removing');
  toast.addEventListener('animationend', () => toast.remove(), { once: true });
  setTimeout(() => toast.remove(), 400); // fallback
}
