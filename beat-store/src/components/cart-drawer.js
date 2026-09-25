/**
 * BEAT STORE — Cart Drawer Component
 */

import { getCart, getCartTotal, removeFromCart } from '../state/cart.state.js';
import STORE_CONFIG from '../config/store.config.js';

let _isOpen = false;

export function renderCartDrawer(containerSelector = '#cart-drawer-container') {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.innerHTML = `
    <div class="cart-drawer-backdrop" id="cart-backdrop" aria-hidden="true">
      <aside class="cart-drawer" role="dialog" aria-label="Carrinho de compras" aria-modal="true">
        <div class="cart-drawer-header">
          <h2 class="cart-drawer-title">Carrinho</h2>
          <button type="button" class="header-icon-btn" id="close-cart-btn" aria-label="Fechar carrinho">✕</button>
        </div>

        <div class="cart-drawer-body" id="cart-drawer-body">
          ${renderCartItems()}
        </div>

        <div class="cart-drawer-footer">
          <div class="cart-total-row">
            <span>Total</span>
            <span id="cart-drawer-total">${STORE_CONFIG.currencySymbol} ${getCartTotal().toFixed(2).replace('.', ',')}</span>
          </div>
          <a href="/carrinho.html" class="btn btn-secondary">Ver Carrinho</a>
          <a href="/checkout.html" class="btn btn-primary btn-lg">Finalizar Compra</a>
        </div>
      </aside>
    </div>
  `;

  _bindEvents(container);
  _listenToCartUpdates();
}

function renderCartItems() {
  const cart = getCart();

  if (!cart.length) {
    return `
      <div class="state-empty" style="padding: 3rem 1rem;">
        <span class="state-empty-icon">🛒</span>
        <h3>Carrinho vazio</h3>
        <p>Adicione beats para continuar.</p>
        <a href="/beats.html" class="btn btn-primary" style="margin-top: 1rem;">Explorar Beats</a>
      </div>
    `;
  }

  return cart.map(item => `
    <div class="cart-item" data-item-id="${item.id}">
      <img src="${item.beatCover}" alt="${item.beatTitle}" class="cart-item-cover" loading="lazy" />
      <div class="cart-item-info">
        <div class="cart-item-title">${item.beatTitle}</div>
        <div class="cart-item-license">Licença ${item.licenseName}</div>
      </div>
      <span class="cart-item-price">${item.priceLabel}</span>
      <button
        type="button"
        class="cart-item-remove"
        data-item-id="${item.id}"
        aria-label="Remover ${item.beatTitle} do carrinho"
      >✕</button>
    </div>
  `).join('');
}

function _bindEvents(container) {
  const backdrop = container.querySelector('#cart-backdrop');
  const closeBtn = container.querySelector('#close-cart-btn');

  // Fechar ao clicar no backdrop
  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) closeCartDrawer();
  });

  closeBtn?.addEventListener('click', closeCartDrawer);

  // Tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && _isOpen) closeCartDrawer();
  });

  // Toggle global
  window.addEventListener('cart:toggle', toggleCartDrawer);

  // Remover itens
  container.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('[data-item-id]');
    if (removeBtn && removeBtn.tagName === 'BUTTON') {
      removeFromCart(removeBtn.dataset.itemId);
    }
  });
}

function _listenToCartUpdates() {
  window.addEventListener('cart:updated', () => {
    const body = document.querySelector('#cart-drawer-body');
    if (body) body.innerHTML = renderCartItems();

    const total = document.querySelector('#cart-drawer-total');
    if (total) {
      const STORE_CONFIG_module = { currencySymbol: 'R$' };
      total.textContent = `R$ ${getCartTotal().toFixed(2).replace('.', ',')}`;
    }
  });
}

export function openCartDrawer() {
  const backdrop = document.querySelector('#cart-backdrop');
  if (!backdrop) return;
  backdrop.classList.add('is-open');
  backdrop.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  _isOpen = true;
}

export function closeCartDrawer() {
  const backdrop = document.querySelector('#cart-backdrop');
  if (!backdrop) return;
  backdrop.classList.remove('is-open');
  backdrop.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  _isOpen = false;
}

export function toggleCartDrawer() {
  _isOpen ? closeCartDrawer() : openCartDrawer();
}
