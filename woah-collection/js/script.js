/* ==========================================================================
   WOAH COLLECTION — SCRIPT PRINCIPAL (HOME, CATÁLOGO, PLAYER & AUTH)
   Design Minimalista, Dark & Cinematográfico
   ========================================================================== */

// Endereço do servidor local (server.js), onde as contas ficam salvas.
// Se o site já estiver aberto pelo servidor (porta 3000), usa o mesmo endereço.
const API_URL = location.port === '3000' ? '' : 'http://localhost:3000';

/* ---- Estado Global do Player & Carrinho ---- */
const appState = {
  currentTrack: {
    title: 'Impacto Real',
    producer: 'Prod. Rodrigo Arrezzi',
    genre: 'Trap • Hip Hop • Melódico',
    price: '149,90',
    cover: 'images/covers/cover-impacto-real.jpg',
    duration: 192 // 3:12 em segundos
  },
  isPlaying: true,
  waveProgress: 0.36, // 1:09 de 3:12
  cartItems: [
    { id: 'impacto-real', title: 'Impacto Real', price: 149.90, cover: 'images/covers/cover-impacto-real.jpg' }
  ]
};

/* ==========================================================================
   NAVEGAÇÃO SUAVE & MOBILE MENU
   ========================================================================== */
function toggleMobileMenu() {
  const drawer = document.getElementById('mobile-nav-drawer');
  if (drawer) {
    drawer.classList.toggle('open');
  }
}

function scrollToSection(sectionId) {
  const el = document.getElementById(sectionId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function openHowItWorks() {
  const modal = document.getElementById('how-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeHowModal() {
  const modal = document.getElementById('how-modal');
  if (modal) modal.classList.add('hidden');
}

function closeHowModalOnOutsideClick(e) {
  const modal = document.getElementById('how-modal');
  if (e.target === modal) closeHowModal();
}

/* ==========================================================================
   SISTEMA DE CARRINHO (CART DRAWER)
   ========================================================================== */
function toggleCartDrawer() {
  const overlay = document.getElementById('cart-drawer-overlay');
  if (overlay) overlay.classList.toggle('open');
}

function closeCartOnOutsideClick(e) {
  const overlay = document.getElementById('cart-drawer-overlay');
  if (e.target === overlay) toggleCartDrawer();
}

function updateCartUI() {
  const badge = document.getElementById('cart-count-badge');
  const itemsContainer = document.getElementById('cart-drawer-items-list');
  const subtotalEl = document.getElementById('cart-subtotal-amount');

  if (badge) badge.textContent = appState.cartItems.length;

  if (itemsContainer) {
    if (appState.cartItems.length === 0) {
      itemsContainer.innerHTML = '<div style="color: #666; font-size: 13px; text-align: center; padding: 24px 0;">Seu carrinho está vazio.</div>';
    } else {
      itemsContainer.innerHTML = appState.cartItems.map((item, idx) => `
        <div class="cart-item-row" data-index="${idx}">
          <img src="${item.cover}" alt="${item.title}" class="cart-item-thumb" onerror="this.src='images/covers/cover-impacto-real.jpg'" />
          <div class="cart-item-info">
            <div class="cart-item-name">${item.title}</div>
            <div class="cart-item-price">R$ ${item.price.toFixed(2).replace('.', ',')}</div>
          </div>
          <button type="button" class="cart-item-remove" onclick="removeCartItemByIndex(${idx})" title="Remover item">✕</button>
        </div>
      `).join('');
    }
  }

  if (subtotalEl) {
    const total = appState.cartItems.reduce((acc, item) => acc + item.price, 0);
    subtotalEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
  }
}

function addToCart(title, price, cover) {
  const exists = appState.cartItems.some(i => i.title.toLowerCase() === title.toLowerCase());
  if (!exists) {
    appState.cartItems.push({
      id: title.toLowerCase().replace(/\s+/g, '-'),
      title,
      price: parseFloat(price),
      cover: cover || 'images/covers/cover-impacto-real.jpg'
    });
    updateCartUI();
  }
  toggleCartDrawer();
}

function removeCartItemByIndex(index) {
  appState.cartItems.splice(index, 1);
  updateCartUI();
}

function removeCartItem(btn) {
  const row = btn.closest('.cart-item-row');
  if (row) {
    const idx = parseInt(row.dataset.index, 10);
    if (!isNaN(idx)) {
      removeCartItemByIndex(idx);
    } else {
      row.remove();
    }
  }
}

/* ==========================================================================
   BUSCA E FILTROS DO CATÁLOGO
   ========================================================================== */
function handleSearchBeats(query) {
  const q = query.trim().toLowerCase();
  const field = document.getElementById('catalog-search-field');
  if (field && field.value !== query) field.value = query;
  applyCatalogFilters();
}

function handleCatalogSearch(query) {
  const headField = document.getElementById('header-search-input');
  if (headField && headField.value !== query) headField.value = query;
  applyCatalogFilters();
}

let activeGenre = 'todos';
let activePriceRange = 'all';

function filterByGenre(genre, btn) {
  activeGenre = genre.toLowerCase();
  document.querySelectorAll('.genre-pill-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  applyCatalogFilters();
}

function filterByPriceRange(range) {
  activePriceRange = range;
  applyCatalogFilters();
}

function toggleFilterTag(tag) {
  applyCatalogFilters();
}

function sortBeats(order) {
  const container = document.getElementById('catalog-beats-container');
  if (!container) return;
  const cards = Array.from(container.querySelectorAll('.catalog-beat-card'));

  cards.sort((a, b) => {
    const priceA = parseFloat(a.dataset.price || '0');
    const priceB = parseFloat(b.dataset.price || '0');
    const titleA = a.querySelector('.card-title')?.textContent || '';
    const titleB = b.querySelector('.card-title')?.textContent || '';

    if (order === 'price-asc') return priceA - priceB;
    if (order === 'price-desc') return priceB - priceA;
    if (order === 'recent') return titleB.localeCompare(titleA);
    return titleA.localeCompare(titleB);
  });

  cards.forEach(card => container.appendChild(card));
}

function applyCatalogFilters() {
  const searchInput = document.getElementById('catalog-search-field') || document.getElementById('header-search-input');
  const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const cards = document.querySelectorAll('.catalog-beat-card');

  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    const genre = (card.dataset.genre || '').toLowerCase();
    const price = parseFloat(card.dataset.price || '0');

    let matchesSearch = q === '' || text.includes(q);
    let matchesGenre = activeGenre === 'todos' || genre.includes(activeGenre);
    let matchesPrice = true;

    if (activePriceRange === 'under-50') matchesPrice = price <= 50;
    else if (activePriceRange === '50-100') matchesPrice = price > 50 && price <= 100;
    else if (activePriceRange === '100-150') matchesPrice = price > 100 && price <= 150;
    else if (activePriceRange === 'above-150') matchesPrice = price > 150;

    if (matchesSearch && matchesGenre && matchesPrice) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

/* ==========================================================================
   15 — WEB AUDIO API ENGINE & WAVEFORM VISUALIZER (BOTTOM PLAYER)
   ========================================================================== */
let audioCtx = null;
let synthTimer = null;
const bottomWaveCanvas = document.getElementById('bottom-waveform-canvas');
let bottomWaveCtx = bottomWaveCanvas ? bottomWaveCanvas.getContext('2d') : null;

function initAudioEngine() {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const chords = [
      [146.83, 220, 261.63], // Dm
      [130.81, 196, 261.63], // C
      [116.54, 174.61, 220], // Bb
      [110.00, 164.81, 220]  // Am
    ];
    let chordIdx = 0;

    if (synthTimer) clearInterval(synthTimer);

    synthTimer = setInterval(() => {
      if (!appState.isPlaying || !audioCtx) return;

      const chord = chords[chordIdx % chords.length];
      chord.forEach(freq => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 1.2);
      });

      chordIdx++;

      // Atualiza progresso da waveform
      appState.waveProgress = (appState.waveProgress + 0.004) % 1;
      updateTimeDisplay();
      drawBottomWaveformBars();
    }, 450);
  } catch (err) {
    console.log("Aguardando interação para reproduzir sintetizador:", err);
  }
}

function updateTimeDisplay() {
  const currentSec = Math.floor(appState.waveProgress * appState.currentTrack.duration);
  const m = Math.floor(currentSec / 60);
  const s = currentSec % 60;
  const timeEl = document.getElementById('player-time-display');
  if (timeEl) {
    timeEl.textContent = `${m}:${s.toString().padStart(2, '0')} / 3:12`;
  }
}

function drawBottomWaveformBars() {
  const canvas = document.getElementById('bottom-waveform-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  ctx.clearRect(0, 0, w, h);

  const barsCount = 65;
  const barWidth = w / barsCount;

  for (let i = 0; i < barsCount; i++) {
    const ratio = i / barsCount;
    const played = ratio <= appState.waveProgress;
    const envelope = Math.sin(ratio * Math.PI);
    const wave = (Math.sin(i * 0.42) * 0.35 + Math.cos(i * 0.78) * 0.35 + 0.5);
    const barH = Math.max(3, h * 0.85 * envelope * wave);
    const x = i * barWidth;
    const y = (h - barH) / 2;

    if (played) {
      ctx.fillStyle = '#E91E3F';
      ctx.globalAlpha = 1.0;
    } else {
      ctx.fillStyle = '#383838';
      ctx.globalAlpha = 0.55;
    }

    ctx.fillRect(x, y, barWidth - 1.5, barH);
  }
  ctx.globalAlpha = 1.0;
}

function seekBottomWaveform(event) {
  const canvas = document.getElementById('bottom-waveform-canvas');
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  appState.waveProgress = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  updateTimeDisplay();
  drawBottomWaveformBars();
}

function toggleBottomPlayerAudio() {
  const icon = document.getElementById('player-play-icon');
  if (appState.isPlaying) {
    appState.isPlaying = false;
    if (icon) icon.textContent = '▶';
    if (synthTimer) clearInterval(synthTimer);
  } else {
    appState.isPlaying = true;
    if (icon) icon.textContent = '⏸';
    initAudioEngine();
  }
}

function playSelectedTrack(title, producer, genre, price, cover, btn) {
  appState.currentTrack = {
    title,
    producer: producer || 'Prod. Rodrigo Arrezzi',
    genre: genre || 'Trap • Melódico',
    price: price || '149,90',
    cover: cover || 'images/covers/cover-impacto-real.jpg',
    duration: 192
  };
  appState.isPlaying = true;
  appState.waveProgress = 0;

  // Atualiza Bottom Player UI
  const titleEl = document.getElementById('player-track-title');
  const prodEl = document.getElementById('player-track-producer');
  const genreEl = document.getElementById('player-track-genre');
  const priceEl = document.getElementById('player-price-display');
  const coverEl = document.getElementById('player-cover-img');
  const buyBtnLink = document.getElementById('player-buy-btn-link');
  const playIcon = document.getElementById('player-play-icon');

  if (titleEl) titleEl.textContent = title;
  if (prodEl) prodEl.textContent = appState.currentTrack.producer;
  if (genreEl) genreEl.textContent = genre;
  if (priceEl) priceEl.textContent = `R$ ${price}`;
  if (coverEl) coverEl.src = appState.currentTrack.cover;
  if (buyBtnLink) buyBtnLink.href = `checkout.html?beat=${encodeURIComponent(title)}&price=${price}`;
  if (playIcon) playIcon.textContent = '⏸';

  initAudioEngine();
  drawBottomWaveformBars();

  // Animação suave no botão clicado
  if (btn) {
    const prevIcon = btn.textContent;
    btn.textContent = '✓';
    setTimeout(() => { btn.textContent = '▶'; }, 1000);
  }
}

/* ==========================================================================
   AUTENTICAÇÃO & MODAIS DE USUÁRIO
   ========================================================================== */
async function chamarApi(caminho, opcoes = {}) {
  const token = localStorage.getItem('auth_token');
  const cabecalhos = { 'Content-Type': 'application/json' };
  if (token) cabecalhos['Authorization'] = 'Bearer ' + token;
  let resposta;
  try {
    resposta = await fetch(API_URL + caminho, {
      method: opcoes.method || 'GET',
      headers: cabecalhos,
      body: opcoes.body ? JSON.stringify(opcoes.body) : undefined
    });
  } catch (e) {
    throw new Error('Servidor desligado. Rode "node server.js" na pasta do site.');
  }
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const erro = new Error(dados.erro || 'Algo deu errado. Tente novamente.');
    erro.status = resposta.status;
    throw erro;
  }
  return dados;
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('current_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem('current_user', JSON.stringify(user));
  updateAuthUI();
}

function limparSessaoLocal() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('current_user');
  localStorage.removeItem('registered_users'); // contas antigas do sistema anterior
}

function openAuthModal(tab = 'login') {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  switchAuthTab(tab);
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.add('hidden');
}

function closeAuthModalOnOutsideClick(e) {
  const modal = document.getElementById('auth-modal');
  if (e.target === modal) closeAuthModal();
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('auth-login-form');
  const regForm = document.getElementById('auth-register-form');
  const loginTab = document.getElementById('tab-login');
  const regTab = document.getElementById('tab-register');

  if (tab === 'login') {
    if (loginForm) loginForm.classList.remove('hidden');
    if (regForm) regForm.classList.add('hidden');
    if (loginTab) loginTab.classList.add('active');
    if (regTab) regTab.classList.remove('active');
  } else {
    if (loginForm) loginForm.classList.add('hidden');
    if (regForm) regForm.classList.remove('hidden');
    if (loginTab) loginTab.classList.remove('active');
    if (regTab) regTab.classList.add('active');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;

  try {
    const dados = await chamarApi('/api/login', { method: 'POST', body: { email, password } });
    localStorage.setItem('auth_token', dados.token);
    setCurrentUser(dados.user);
    closeAuthModal();
    document.getElementById('auth-login-form').reset();
    alert(`Bem-vindo de volta, ${dados.user.name}!`);
  } catch (erro) {
    alert(erro.message);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const password = document.getElementById('reg-password').value;

  if (password.length < 6) {
    alert('A senha deve ter pelo menos 6 caracteres.');
    return;
  }

  try {
    const dados = await chamarApi('/api/cadastro', { method: 'POST', body: { name, email, password } });
    localStorage.setItem('auth_token', dados.token);
    setCurrentUser(dados.user);
    closeAuthModal();
    document.getElementById('auth-register-form').reset();
    alert(`Conta criada com sucesso! Bem-vindo, ${dados.user.name}.`);
  } catch (erro) {
    alert(erro.message);
  }
}

async function handleLogout() {
  try {
    await chamarApi('/api/logout', { method: 'POST' });
  } catch (e) {
    // Mesmo com o servidor desligado, sai da conta neste navegador
  }
  limparSessaoLocal();
  updateAuthUI();
}

// Confere com o servidor se a sessão salva ainda vale
async function verificarSessao() {
  if (!localStorage.getItem('auth_token')) {
    limparSessaoLocal();
    updateAuthUI();
    return;
  }
  try {
    const dados = await chamarApi('/api/eu');
    setCurrentUser(dados.user);
  } catch (erro) {
    if (erro.status === 401) {
      limparSessaoLocal();
      updateAuthUI();
    }
  }
}

function updateAuthUI() {
  const container = document.getElementById('nav-auth-container');
  if (!container) return;
  const user = getCurrentUser();

  if (user) {
    const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="width: 36px; height: 36px; border-radius: 50%; background: #181818; border: 1px solid #2B2B2B; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #FFF;" title="${user.name}">
          ${initials}
        </div>
        <button type="button" onclick="handleLogout()" style="background: none; border: none; color: #888; font-size: 12px; cursor: pointer;">Sair</button>
      </div>
    `;
  } else {
    container.innerHTML = `<button type="button" class="btn-header-login" onclick="openAuthModal('login')">Entrar</button>`;
  }
}

/* ==========================================================================
   INICIALIZAÇÃO NO CARREGAMENTO
   ========================================================================== */
window.addEventListener('DOMContentLoaded', () => {
  updateCartUI();
  updateAuthUI();
  verificarSessao();
  drawBottomWaveformBars();
  initAudioEngine();

  window.addEventListener('resize', drawBottomWaveformBars);

  // Resume AudioContext na primeira interação do usuário
  window.addEventListener('click', () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }, { once: true });
});
