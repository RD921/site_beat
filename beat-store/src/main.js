/**
 * BEAT STORE — Main Entry Point (Home Page)
 * Inicializa: Header, CartDrawer, MiniPlayer, e lógica da Home.
 */

// Styles
import './styles/design-system.css';
import './styles/layout.css';
import './styles/home.css';

// Components
import { renderHeader } from './components/header.js';
import { renderMiniPlayer } from './components/mini-player.js';
import { renderCartDrawer } from './components/cart-drawer.js';

// Home Page
import { initHomePage } from './pages/home.js';

// ─── Bootstrap ────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  renderHeader('#app-header');
  renderCartDrawer('#cart-drawer-container');
  renderMiniPlayer('#mini-player-container');
  initHomePage();
});
