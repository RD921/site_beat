/**
 * BEAT STORE — Header Component
 * Renderiza o header dinamicamente a partir da store config.
 * Gerencia: menu mobile, busca, badge do carrinho, avatar/auth.
 */

import STORE_CONFIG from '../config/store.config.js';
import { getCurrentUser, getUserInitials, isAuthenticated } from '../state/auth.state.js';
import { getCartCount } from '../state/cart.state.js';

// ─── Render ──────────────────────────────────────────────────────────────────

export function renderHeader(containerSelector = '#app-header') {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.innerHTML = `
    <header class="site-header" role="banner">
      <!-- Logo -->
      <a href="/index.html" class="header-logo" aria-label="${STORE_CONFIG.name}">
        <span class="logo-main">${STORE_CONFIG.branding.logoText}</span>
        <span class="logo-sub">${STORE_CONFIG.branding.logoSubText}</span>
      </a>

      <!-- Navegação Desktop -->
      <nav class="header-nav" aria-label="Navegação principal">
        ${STORE_CONFIG.nav.map(item => `
          <a href="${item.href}"
             class="header-nav-link ${isCurrentPage(item.href, item.exact) ? 'is-active' : ''}"
             aria-current="${isCurrentPage(item.href, item.exact) ? 'page' : 'false'}">
            ${item.label}
          </a>
        `).join('')}
      </nav>

      <!-- Ações à direita -->
      <div class="header-actions">
        <!-- Busca -->
        <div class="header-search" role="search">
          <span class="header-search-icon" aria-hidden="true">🔍</span>
          <input
            type="search"
            id="header-search-input"
            class="header-search-input"
            placeholder="Buscar beats..."
            aria-label="Buscar beats"
            autocomplete="off"
          />
        </div>

        <!-- Carrinho -->
        <button
          type="button"
          class="header-icon-btn"
          id="cart-toggle-btn"
          aria-label="Abrir carrinho"
          title="Carrinho"
        >
          🛒
          <span class="cart-badge" id="cart-badge" aria-live="polite">${getCartCount() || ''}</span>
        </button>

        <!-- Auth: Entrar ou Avatar -->
        <div id="header-auth-area">
          ${renderAuthArea()}
        </div>

        <!-- Hambúrguer Mobile -->
        <button
          type="button"
          class="header-hamburger"
          id="mobile-menu-toggle"
          aria-label="Abrir menu"
          aria-expanded="false"
          aria-controls="mobile-menu"
        >
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>
      </div>
    </header>

    <!-- Menu Mobile -->
    <nav class="mobile-menu" id="mobile-menu" aria-label="Navegação mobile" hidden>
      <!-- Busca Mobile -->
      <div class="mobile-menu-search">
        <span aria-hidden="true">🔍</span>
        <input type="search" id="mobile-search-input" placeholder="Buscar beats..." aria-label="Buscar beats" />
      </div>

      <!-- Links -->
      ${STORE_CONFIG.nav.map(item => `
        <a href="${item.href}"
           class="mobile-menu-link ${isCurrentPage(item.href, item.exact) ? 'is-active' : ''}">
          ${item.label}
        </a>
      `).join('')}

      <!-- Ações Mobile -->
      <div class="mobile-menu-actions">
        ${isAuthenticated()
          ? `<a href="/conta.html" class="btn btn-secondary btn-lg">Minha Conta</a>`
          : `<a href="/login.html" class="btn btn-primary btn-lg">Entrar</a>
             <a href="/register.html" class="btn btn-secondary btn-lg">Criar Conta</a>`
        }
      </div>
    </nav>
  `;

  _bindEvents(container);
}

function renderAuthArea() {
  if (isAuthenticated()) {
    const initials = getUserInitials();
    return `
      <div class="dropdown" id="user-dropdown">
        <button
          type="button"
          class="header-avatar"
          id="avatar-btn"
          aria-label="Menu do usuário"
          aria-haspopup="true"
          aria-expanded="false"
        >${initials}</button>
        <div class="dropdown-menu" id="user-dropdown-menu" role="menu">
          <a href="/conta.html" class="dropdown-item" role="menuitem">👤 Minha Conta</a>
          <a href="/conta.html#orders" class="dropdown-item" role="menuitem">📋 Pedidos</a>
          <a href="/conta.html#downloads" class="dropdown-item" role="menuitem">⬇️ Downloads</a>
          <div class="dropdown-divider"></div>
          <button type="button" class="dropdown-item" id="logout-btn" role="menuitem">🚪 Sair</button>
        </div>
      </div>
    `;
  }

  return `<a href="/login.html" class="btn btn-primary btn-sm">Entrar</a>`;
}

function isCurrentPage(href, exact = false) {
  const path = window.location.pathname;
  if (exact) return path === href || path === href.replace('/index.html', '/');
  return path.startsWith(href.replace('/index.html', '/').replace('.html', ''));
}

// ─── Event Binding ────────────────────────────────────────────────────────────

function _bindEvents(container) {
  // Hambúrguer
  const hamburger = container.querySelector('#mobile-menu-toggle');
  const mobileMenu = container.querySelector('#mobile-menu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('is-open');
      mobileMenu.classList.toggle('is-open', isOpen);
      mobileMenu.hidden = !isOpen;
      hamburger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Fechar ao clicar em link do menu mobile
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('is-open');
        mobileMenu.classList.remove('is-open');
        mobileMenu.hidden = true;
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // Busca com debounce
  const searchInput = container.querySelector('#header-search-input');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const query = searchInput.value.trim();
        if (query.length >= 2) {
          window.dispatchEvent(new CustomEvent('search:query', { detail: { query } }));
        }
      }, 300);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = searchInput.value.trim();
        if (q) window.location.href = `/beats.html?q=${encodeURIComponent(q)}`;
      }
    });
  }

  // Dropdown do usuário
  const avatarBtn = container.querySelector('#avatar-btn');
  const userDropdown = container.querySelector('#user-dropdown');
  if (avatarBtn && userDropdown) {
    avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = userDropdown.classList.toggle('is-open');
      avatarBtn.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', () => {
      userDropdown.classList.remove('is-open');
      avatarBtn?.setAttribute('aria-expanded', 'false');
    });
  }

  // Logout
  const logoutBtn = container.querySelector('#logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      const { logout } = await import('../state/auth.state.js');
      logout();
      window.location.href = '/index.html';
    });
  }

  // Carrinho toggle
  const cartBtn = container.querySelector('#cart-toggle-btn');
  if (cartBtn) {
    cartBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('cart:toggle'));
    });
  }
}

// ─── Atualizações Reativas ────────────────────────────────────────────────────

export function updateCartBadge() {
  const badge = document.querySelector('#cart-badge');
  if (badge) {
    const count = getCartCount();
    badge.textContent = count > 0 ? count : '';
  }
}

export function refreshHeaderAuth() {
  const authArea = document.querySelector('#header-auth-area');
  if (authArea) authArea.innerHTML = renderAuthArea();
}

// Atualiza badge ao modificar carrinho
window.addEventListener('cart:updated', updateCartBadge);

// Atualiza área auth ao logar/deslogar
window.addEventListener('auth:changed', refreshHeaderAuth);
