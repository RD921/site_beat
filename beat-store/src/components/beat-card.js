/**
 * BEAT STORE — BeatCard Component
 * Componente factory que cria o HTML de um card de beat.
 * Não contém lógica de negócio — apenas apresenta dados e dispara eventos.
 */

import { isBeatPlaying } from '../state/audio.state.js';
import { isBeatInCart } from '../state/cart.state.js';
import STORE_CONFIG from '../config/store.config.js';

/**
 * Cria o elemento HTML de um BeatCard
 * @param {Beat} beat
 * @param {object} options
 * @returns {HTMLElement}
 */
export function createBeatCard(beat, options = {}) {
  const { compact = false, showWaveform = true } = options;

  const playing = isBeatPlaying(beat.id);
  const inCart  = isBeatInCart(beat.id);

  const card = document.createElement('article');
  card.className = `beat-card${playing ? ' is-playing' : ''}${compact ? ' beat-card--compact' : ''}`;
  card.dataset.beatId = beat.id;
  card.setAttribute('aria-label', `Beat: ${beat.title} - ${beat.genre} - ${beat.priceLabel}`);

  card.innerHTML = `
    <!-- Capa -->
    <div class="beat-card-cover">
      <img
        src="${beat.cover}"
        alt="Capa do beat ${beat.title}"
        loading="lazy"
        decoding="async"
      />

      <!-- Overlay de reprodução -->
      <div class="beat-card-overlay" aria-hidden="true">
        <button
          type="button"
          class="beat-card-play-btn"
          data-action="play"
          aria-label="${playing ? 'Pausar' : 'Reproduzir'} ${beat.title}"
          title="${playing ? 'Pausar' : 'Reproduzir'}"
        >
          ${playing ? '⏸' : '▶'}
        </button>
      </div>

      <!-- Badge -->
      ${beat.isExclusive ? `<span class="beat-card-badge beat-card-badge--exclusive">Exclusivo</span>` : ''}
      ${beat.isNew && !beat.isExclusive ? `<span class="beat-card-badge beat-card-badge--new">Novo</span>` : ''}

      <!-- Waveform animado (quando tocando) -->
      ${showWaveform ? `
        <div class="beat-card-waveform" aria-hidden="true">
          <span class="waveform-bar"></span>
          <span class="waveform-bar"></span>
          <span class="waveform-bar"></span>
          <span class="waveform-bar"></span>
          <span class="waveform-bar"></span>
        </div>
      ` : ''}
    </div>

    <!-- Corpo do card -->
    <div class="beat-card-body">
      <h3 class="beat-card-title" title="${beat.title}">${beat.title}</h3>

      <div class="beat-card-meta">
        <span class="beat-card-genre">${beat.genre}</span>
        <span aria-hidden="true">·</span>
        <span>${beat.durationLabel}</span>
        <span aria-hidden="true">·</span>
        <span>${beat.bpm} BPM</span>
      </div>

      <div class="beat-card-footer">
        <span class="beat-card-price">${beat.priceLabel}</span>
        <button
          type="button"
          class="beat-card-cart-btn ${inCart ? 'is-in-cart' : ''}"
          data-action="cart"
          aria-label="${inCart ? 'Remover do carrinho' : 'Adicionar ao carrinho'}: ${beat.title}"
          title="${inCart ? 'No carrinho' : 'Adicionar ao carrinho'}"
        >
          ${inCart ? '✓' : '🛒'}
        </button>
      </div>
    </div>
  `;

  _bindCardEvents(card, beat);
  _listenToAudioState(card, beat);
  _listenToCartState(card, beat);

  return card;
}

/**
 * Renderiza múltiplos BeatCards em um container
 * @param {Beat[]} beats
 * @param {HTMLElement} container
 * @param {object} options
 */
export function renderBeatGrid(beats, container, options = {}) {
  container.innerHTML = '';

  if (!beats.length) {
    container.innerHTML = `
      <div class="state-empty">
        <span class="state-empty-icon">🎵</span>
        <h3>Nenhum beat encontrado</h3>
        <p>Tente outros filtros ou termos de busca.</p>
      </div>
    `;
    return;
  }

  beats.forEach(beat => {
    container.appendChild(createBeatCard(beat, options));
  });
}

/**
 * Renderiza skeletons de carregamento
 * @param {number} count
 * @param {HTMLElement} container
 */
export function renderSkeletonCards(count, container) {
  container.innerHTML = Array.from({ length: count }, () => `
    <div class="skeleton-beat-card">
      <div class="skeleton-beat-cover skeleton"></div>
      <div class="skeleton-beat-body">
        <div class="skeleton skeleton-line skeleton-line-title"></div>
        <div class="skeleton skeleton-line skeleton-line-meta"></div>
        <div class="skeleton skeleton-line skeleton-line-price"></div>
      </div>
    </div>
  `).join('');
}

// ─── Event Binding ────────────────────────────────────────────────────────────

function _bindCardEvents(card, beat) {
  card.addEventListener('click', async (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;

    if (action === 'play') {
      e.stopPropagation();
      const { play } = await import('../state/audio.state.js');
      await play(beat);
      return;
    }

    if (action === 'cart') {
      e.stopPropagation();
      _handleCartAction(card, beat);
      return;
    }

    // Clique no card → ir para a página do beat
    window.location.href = `/beat-detail.html?slug=${beat.slug}`;
  });
}

function _handleCartAction(card, beat) {
  import('../state/cart.state.js').then(({ addToCart, isBeatInCart, removeFromCart, getCart }) => {
    if (isBeatInCart(beat.id)) {
      // Já está no carrinho → abrir drawer
      window.dispatchEvent(new CustomEvent('cart:toggle'));
      return;
    }

    // Licença padrão = Basic (id: 'license-basic')
    import('../data/mock/mock-licenses.js').then(({ MOCK_LICENSES }) => {
      const defaultLicense = MOCK_LICENSES.find(l => l.id === 'license-basic') || MOCK_LICENSES[0];
      const result = addToCart(beat, defaultLicense);

      if (result.success) {
        import('./toast.js').then(({ showToast }) => {
          showToast(`"${beat.title}" adicionado ao carrinho!`, 'success');
        });
      }
    });
  });
}

// ─── Reactive Updates ─────────────────────────────────────────────────────────

function _listenToAudioState(card, beat) {
  window.addEventListener('audio:statechange', ({ detail }) => {
    const isThis = detail.beat?.id === beat.id;
    const isPlaying = isThis && detail.isPlaying;

    card.classList.toggle('is-playing', isPlaying);

    const playBtn = card.querySelector('[data-action="play"]');
    if (playBtn) {
      playBtn.textContent = isPlaying ? '⏸' : '▶';
      playBtn.setAttribute('aria-label', `${isPlaying ? 'Pausar' : 'Reproduzir'} ${beat.title}`);
    }
  });
}

function _listenToCartState(card, beat) {
  window.addEventListener('cart:updated', () => {
    import('../state/cart.state.js').then(({ isBeatInCart }) => {
      const inCart = isBeatInCart(beat.id);
      const cartBtn = card.querySelector('[data-action="cart"]');
      if (cartBtn) {
        cartBtn.classList.toggle('is-in-cart', inCart);
        cartBtn.textContent = inCart ? '✓' : '🛒';
        cartBtn.setAttribute('aria-label', `${inCart ? 'Remover do carrinho' : 'Adicionar ao carrinho'}: ${beat.title}`);
      }
    });
  });
}
