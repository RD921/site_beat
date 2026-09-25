/* ==========================================================================
   WOAH COLLECTION — SCRIPT PRINCIPAL
   Header, footer, contas (servidor local), carrinho, busca, player e páginas.
   Depende de js/data.js (WOAH_BEATS, WOAH_LICENSES, WOAH_CONTACT).
   ========================================================================== */

(function () {
  'use strict';

  /* ======================================================================
     UTILIDADES
     ====================================================================== */
  const page = document.body.dataset.page || '';
  const params = new URLSearchParams(location.search);

  const fmt = n => 'R$ ' + Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const beatById = id => WOAH_BEATS.find(b => b.id === id);
  const toSeconds = t => { const [m, s] = String(t || '0:00').split(':').map(Number); return (m || 0) * 60 + (s || 0); };
  const fmtTime = sec => Math.floor(sec / 60) + ':' + String(Math.floor(sec % 60)).padStart(2, '0');
  const waLink = text => 'https://wa.me/' + WOAH_CONTACT.whatsapp + (text ? '?text=' + encodeURIComponent(text) : '');

  // Aceita só caminhos internos (evita redirecionar para outro site)
  function safeNext(value, fallback) {
    if (!value || /^[a-z]+:|^\/\/|\\/i.test(value)) return fallback;
    return value;
  }

  const ICON = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4.2-4.2"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20.5" r="1.2"/><circle cx="18.5" cy="20.5" r="1.2"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.5L22 7H6"/></svg>',
    cartPlus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20.5" r="1.2"/><circle cx="18.5" cy="20.5" r="1.2"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.5L22 7H6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="5.5" y="4" width="4.5" height="16" rx="1.2"/><rect x="14" y="4" width="4.5" height="16" rx="1.2"/></svg>',
    volume: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35M12.05 21.79a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41z"/></svg>',
    spotify: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm5.52 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.3 1.02zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14C9.6 9.9 15 10.56 18.72 12.84c.36.18.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.6-1.56.3z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>'
  };

  const NAV = [
    { id: 'home', label: 'Início', href: 'index.html' },
    { id: 'beats', label: 'Beats', href: 'beats.html' },
    { id: 'licencas', label: 'Licenças', href: 'licencas.html' },
    { id: 'como-funciona', label: 'Como Funciona', href: 'como-funciona.html' },
    { id: 'contato', label: 'Contato', href: 'contato.html' }
  ];

  /* ======================================================================
     CONTAS (servidor local — server.js)
     ====================================================================== */
  const API_URL = location.port === '3000' ? '' : 'http://localhost:3000';

  async function api(path, opts = {}) {
    const token = localStorage.getItem('auth_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    let res;
    try {
      res = await fetch(API_URL + path, {
        method: opts.method || 'GET',
        headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined
      });
    } catch (e) {
      throw new Error('Servidor desligado. Rode "node server.js" na pasta do site.');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.erro || 'Algo deu errado. Tente novamente.');
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function getUser() {
    try { return JSON.parse(localStorage.getItem('current_user') || 'null'); } catch (e) { return null; }
  }

  function setSession(token, user) {
    if (token) localStorage.setItem('auth_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));
    refreshAuthUI();
  }

  function clearSession() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    localStorage.removeItem('registered_users'); // resto do sistema antigo
    refreshAuthUI();
  }

  async function logout() {
    try { await api('/api/logout', { method: 'POST' }); } catch (e) { /* servidor desligado: sai assim mesmo */ }
    clearSession();
    toast('Você saiu da sua conta.');
    if (['carrinho', 'checkout'].includes(page)) location.href = 'index.html';
  }

  async function checkSession() {
    if (!localStorage.getItem('auth_token')) {
      if (getUser()) clearSession();
      return;
    }
    try {
      const data = await api('/api/eu');
      localStorage.setItem('current_user', JSON.stringify(data.user));
      refreshAuthUI();
    } catch (err) {
      if (err.status === 401) clearSession();
    }
  }

  // Leva para o login e volta para a página atual depois
  function requireLogin(next) {
    if (getUser()) return true;
    location.href = 'login.html?next=' + encodeURIComponent(next || (location.pathname.split('/').pop() + location.search));
    return false;
  }

  /* ======================================================================
     CARRINHO (salvo por usuário neste navegador)
     ====================================================================== */
  const cartKey = () => { const u = getUser(); return u ? 'woah_cart_' + u.id : null; };

  function getCart() {
    const key = cartKey();
    if (!key) return [];
    try {
      return JSON.parse(localStorage.getItem(key) || '[]').filter(id => beatById(id));
    } catch (e) { return []; }
  }

  function saveCart(ids) {
    const key = cartKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(ids));
    updateCartUI();
  }

  function addToCart(id) {
    if (!requireLogin()) return;
    const cart = getCart();
    const beat = beatById(id);
    if (!beat) return;
    if (!cart.includes(id)) {
      cart.push(id);
      saveCart(cart);
      toast(`<span><strong>${esc(beat.title)}</strong> foi para o carrinho.</span> <a href="carrinho.html">Ver carrinho</a>`, true);
    } else {
      toast(`<span><strong>${esc(beat.title)}</strong> já está no carrinho.</span> <a href="carrinho.html">Ver carrinho</a>`, true);
    }
  }

  function removeFromCart(id) {
    saveCart(getCart().filter(x => x !== id));
  }

  function clearCart() { saveCart([]); }

  function updateCartUI() {
    const cart = getCart();
    $$('[data-cart-count]').forEach(el => {
      el.textContent = cart.length;
      el.classList.toggle('hidden', cart.length === 0);
    });
    $$('[data-cart-add]').forEach(btn => {
      const inCart = cart.includes(btn.dataset.cartAdd);
      btn.classList.toggle('in-cart', inCart);
      btn.innerHTML = inCart ? ICON.check : ICON.cartPlus;
      btn.title = inCart ? 'No carrinho' : 'Adicionar ao carrinho';
    });
    if (page === 'carrinho') renderCartPage();
  }

  /* ======================================================================
     COMPRA
     ====================================================================== */
  function checkoutUrl(beat, extra = {}) {
    const q = new URLSearchParams({ beat: beat.id, ...extra });
    return 'checkout.html?' + q.toString();
  }

  function buyBeat(id, extra) {
    const beat = beatById(id);
    if (!beat) return;
    const url = checkoutUrl(beat, extra);
    if (!getUser()) { location.href = 'login.html?next=' + encodeURIComponent(url); return; }
    location.href = url;
  }

  /* ======================================================================
     TOAST
     ====================================================================== */
  function toast(html, isHtml) {
    let stack = $('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      stack.setAttribute('role', 'status');
      document.body.appendChild(stack);
    }
    const el = document.createElement('div');
    el.className = 'toast';
    if (isHtml) el.innerHTML = html; else el.textContent = html;
    stack.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 3200);
    setTimeout(() => el.remove(), 3600);
  }

  /* ======================================================================
     HEADER E FOOTER
     ====================================================================== */
  function logoHTML() {
    return '<a href="index.html" class="logo" aria-label="Woah Collection — início"><span class="logo-word">WOAH</span><span class="logo-sub">COLLECTION</span></a>';
  }

  function renderHeader() {
    const holder = $('#site-header');
    if (!holder) return;
    const links = NAV.map(n => `<a href="${n.href}" class="nav-link${n.id === page ? ' active' : ''}">${n.label}</a>`).join('');
    const q = page === 'beats' ? esc(params.get('q') || '') : '';

    holder.innerHTML = `
      <header class="site-header">
        <div class="container header-inner">
          ${logoHTML()}
          <nav class="main-nav" aria-label="Principal">${links}</nav>
          <div class="header-actions">
            <form class="header-search" role="search" data-search-form>
              ${ICON.search}
              <input type="search" name="q" placeholder="Buscar beats..." aria-label="Buscar beats" value="${q}" autocomplete="off" data-search-input>
            </form>
            <button type="button" class="icon-btn search-toggle" aria-label="Buscar" data-search-toggle>${ICON.search}</button>
            <div data-header-auth style="display:flex;align-items:center;gap:12px"></div>
            <button type="button" class="icon-btn menu-toggle" aria-label="Abrir menu" data-menu-open>${ICON.menu}</button>
          </div>
        </div>
        <div class="mobile-search" data-mobile-search>
          <form class="header-search" role="search" data-search-form>
            ${ICON.search}
            <input type="search" name="q" placeholder="Buscar beats..." aria-label="Buscar beats" value="${q}" autocomplete="off" data-search-input>
          </form>
        </div>
      </header>
      <div class="mobile-menu" data-mobile-menu aria-hidden="true">
        <div class="mobile-menu-backdrop" data-menu-close></div>
        <div class="mobile-menu-panel" role="dialog" aria-label="Menu">
          <div class="mobile-menu-top">
            ${logoHTML()}
            <button type="button" class="icon-btn" aria-label="Fechar menu" data-menu-close>${ICON.close}</button>
          </div>
          <nav>${NAV.map(n => `<a href="${n.href}"${n.id === page ? ' class="active"' : ''}>${n.label}</a>`).join('')}</nav>
          <div class="mobile-menu-foot" data-mobile-auth></div>
        </div>
      </div>`;

    // Busca
    $$('[data-search-form]').forEach(form => {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const value = form.q.value.trim();
        if (page === 'beats') { setCatalogQuery(value); return; }
        location.href = 'beats.html' + (value ? '?q=' + encodeURIComponent(value) : '');
      });
      if (page === 'beats') {
        form.q.addEventListener('input', () => setCatalogQuery(form.q.value));
      }
    });
    const toggle = $('[data-search-toggle]');
    const mobileSearch = $('[data-mobile-search]');
    toggle.addEventListener('click', () => {
      mobileSearch.classList.toggle('open');
      if (mobileSearch.classList.contains('open')) $('input', mobileSearch).focus();
    });
    if (q) mobileSearch.classList.add('open');

    // Menu mobile
    const menu = $('[data-mobile-menu]');
    const openMenu = () => { menu.classList.add('open'); menu.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; };
    const closeMenu = () => { menu.classList.remove('open'); menu.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; };
    $('[data-menu-open]').addEventListener('click', openMenu);
    $$('[data-menu-close]', menu).forEach(el => el.addEventListener('click', closeMenu));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenu(); closeAccountMenu(); } });

    // Fecha o menu da conta ao clicar fora
    document.addEventListener('click', e => {
      const acc = $('.account.open');
      if (acc && !acc.contains(e.target)) closeAccountMenu();
    });
  }

  function closeAccountMenu() {
    const acc = $('.account.open');
    if (acc) { acc.classList.remove('open'); $('.account-btn', acc).setAttribute('aria-expanded', 'false'); }
  }

  function initials(name) {
    return String(name || '?').trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
  }

  function renderHeaderAuth() {
    const box = $('[data-header-auth]');
    const mobile = $('[data-mobile-auth]');
    if (!box) return;
    const user = getUser();
    const next = encodeURIComponent(location.pathname.split('/').pop() + location.search);
    const skipNext = ['login', 'criar-conta'].includes(page);
    const loginHref = 'login.html' + (skipNext ? '' : '?next=' + next);

    if (!user) {
      box.innerHTML = `
        <a href="${loginHref}" class="btn btn-outline-red btn-sm desktop-only">Entrar</a>`;
      mobile.innerHTML = `
        <a href="${loginHref}" class="btn btn-primary btn-block">Entrar</a>`;
      return;
    }

    const avatar = user.photo ? `<img src="${esc(user.photo)}" alt="">` : esc(initials(user.name));
    const firstName = esc(String(user.name).split(' ')[0]);
    const devBadge = user.role === 'dev' ? '<span class="badge-dev">DEV</span>' : '';

    box.innerHTML = `
      <a href="carrinho.html" class="icon-btn" aria-label="Carrinho" title="Carrinho">
        ${ICON.cart}<span class="cart-badge hidden" data-cart-count>0</span>
      </a>
      <div class="account desktop-only">
        <button type="button" class="account-btn" aria-haspopup="true" aria-expanded="false" data-account-btn>
          <span class="avatar">${avatar}</span><span class="hide-lg">${firstName}</span>
        </button>
        <div class="account-menu" role="menu">
          <div class="account-menu-head"><strong>${esc(user.name)}</strong><span>${esc(user.email)}</span>${devBadge}</div>
          ${user.role === 'dev' ? '<a href="admin.html" role="menuitem"><strong style="color:var(--red)">Painel</strong></a>' : ''}
          <a href="carrinho.html" role="menuitem">Meu carrinho</a>
          <a href="beats.html" role="menuitem">Explorar beats</a>
          <button type="button" role="menuitem" data-logout>Sair da conta</button>
        </div>
      </div>`;
    mobile.innerHTML = `
      <div class="mobile-user"><span class="avatar">${avatar}</span><div><strong>${esc(user.name)}</strong><span>${esc(user.email)}</span>${devBadge}</div></div>
      ${user.role === 'dev' ? '<a href="admin.html" class="btn btn-primary btn-block">Painel</a>' : ''}
      <a href="carrinho.html" class="btn btn-outline btn-block">Meu carrinho</a>
      <button type="button" class="btn btn-ghost btn-block" data-logout>Sair da conta</button>`;

    const accBtn = $('[data-account-btn]', box);
    accBtn.addEventListener('click', e => {
      e.stopPropagation();
      const acc = accBtn.parentElement;
      const open = !acc.classList.contains('open');
      acc.classList.toggle('open', open);
      accBtn.setAttribute('aria-expanded', String(open));
    });
    $$('[data-logout]').forEach(b => b.addEventListener('click', logout));
  }

  function renderFooter() {
    const holder = $('#site-footer');
    if (!holder) return;
    holder.innerHTML = `
      <footer class="site-footer">
        <div class="container footer-inner">
          <div class="footer-brand">${logoHTML()}<p>Beats que inspiram.</p></div>
          <div class="footer-social">
            <a href="${WOAH_CONTACT.instagram}" target="_blank" rel="noopener" aria-label="Instagram">${ICON.instagram}</a>
            <a href="${waLink()}" target="_blank" rel="noopener" aria-label="WhatsApp">${ICON.whatsapp}</a>
            <a href="${WOAH_CONTACT.spotify}" target="_blank" rel="noopener" aria-label="Spotify">${ICON.spotify}</a>
            <a href="mailto:${WOAH_CONTACT.email}" aria-label="E-mail">${ICON.mail}</a>
          </div>
        </div>
      </footer>`;
  }

  function refreshAuthUI() {
    const logged = !!getUser();
    document.body.classList.toggle('is-logged', logged);
    renderHeaderAuth();
    updateCartUI();
  }

  /* ======================================================================
     PLAYER (sintetizador Web Audio + waveform)
     ====================================================================== */
  const player = {
    beat: null,
    playing: false,
    progress: 0,       // 0 a 1
    volume: 0.8,
    ctx: null,
    master: null,
    chordTimer: null,
    lastTick: 0,
    raf: null,
    audio: null        // <audio> usado quando o beat tem arquivo de áudio real
  };

  function audioEl() {
    if (!player.audio) {
      player.audio = new Audio();
      player.audio.preload = 'metadata';
      player.audio.addEventListener('ended', () => { player.progress = 0; pause(); });
      player.audio.addEventListener('error', () => {
        if (player.beat && player.beat.audio) toast('Não foi possível tocar o áudio deste beat.');
      });
    }
    return player.audio;
  }

  // Duração real (arquivo de áudio) ou a informada no cadastro
  function totalSeconds(b) {
    if (b && b.audio && player.audio && player.beat && player.beat.id === b.id && isFinite(player.audio.duration)) return player.audio.duration;
    return toSeconds(b && b.duration) || 180;
  }

  const CHORDS = [
    [146.83, 220, 261.63], // Dm
    [130.81, 196, 261.63], // C
    [116.54, 174.61, 220], // Bb
    [110.0, 164.81, 220]   // Am
  ];

  function ensureAudio() {
    if (player.ctx) {
      if (player.ctx.state === 'suspended') player.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    player.ctx = new Ctx();
    player.master = player.ctx.createGain();
    player.master.gain.value = player.volume;
    player.master.connect(player.ctx.destination);
  }

  function startSynth() {
    ensureAudio();
    if (!player.ctx) return;
    clearInterval(player.chordTimer);
    let idx = 0;
    const playChord = () => {
      const chord = CHORDS[idx++ % CHORDS.length];
      const t = player.ctx.currentTime;
      chord.forEach(freq => {
        const osc = player.ctx.createOscillator();
        const gain = player.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
        osc.connect(gain);
        gain.connect(player.master);
        osc.start(t);
        osc.stop(t + 1.2);
      });
    };
    playChord();
    player.chordTimer = setInterval(playChord, 450);
  }

  function stopSynth() {
    clearInterval(player.chordTimer);
    player.chordTimer = null;
  }

  // Waveform: barras "aleatórias" fixas para cada beat
  function waveShape(seedText, count) {
    let seed = 0;
    for (const ch of String(seedText)) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const bars = [];
    for (let i = 0; i < count; i++) {
      const env = 0.35 + 0.65 * Math.sin((i / count) * Math.PI);
      bars.push(Math.max(0.12, env * (0.35 + rand() * 0.65)));
    }
    return bars;
  }

  function drawWave(canvas) {
    const beat = beatById(canvas.dataset.wave) || player.beat;
    if (!beat) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const gap = 2;
    const barW = 3;
    const count = Math.max(20, Math.floor(rect.width / (barW + gap)));
    const bars = waveShape(beat.id, count);
    const isCurrent = player.beat && player.beat.id === beat.id;
    const progress = isCurrent ? player.progress : 0;
    const now = performance.now() / 180;

    bars.forEach((v, i) => {
      let amp = v;
      if (isCurrent && player.playing) amp *= 0.85 + 0.15 * Math.sin(now + i * 0.7);
      const h = Math.max(3, amp * rect.height);
      const x = i * (barW + gap);
      const y = (rect.height - h) / 2;
      ctx.fillStyle = (i / count) <= progress ? '#E91E3F' : '#3A3A3A';
      ctx.fillRect(x, y, barW, h);
    });
  }

  function drawAllWaves() {
    $$('canvas[data-wave]').forEach(drawWave);
  }

  function updatePlayerUI() {
    const beat = player.beat;
    $$('[data-play]').forEach(btn => {
      const active = beat && btn.dataset.play === beat.id && player.playing;
      btn.innerHTML = active ? ICON.pause : ICON.play;
      btn.classList.toggle('is-playing', !!active);
      btn.setAttribute('aria-label', (active ? 'Pausar ' : 'Ouvir ') + (beatById(btn.dataset.play) || {}).title);
    });
    $$('[data-time]').forEach(el => {
      const b = beatById(el.dataset.time);
      if (!b) return;
      const total = totalSeconds(b);
      const cur = beat && beat.id === b.id ? player.progress * total : 0;
      el.textContent = fmtTime(cur) + ' / ' + (b.duration && b.duration !== '0:00' ? b.duration : fmtTime(total));
    });
    drawAllWaves();
  }

  function renderPlayerBar() {
    if (['login', 'criar-conta', 'checkout', 'admin'].includes(page)) return;
    const bar = document.createElement('aside');
    bar.className = 'player-bar';
    bar.setAttribute('aria-label', 'Player');
    bar.innerHTML = `
      <div class="container player-inner">
        <div class="player-track">
          <img src="" alt="" data-pb-cover>
          <div><strong data-pb-title></strong><small data-pb-meta></small></div>
        </div>
        <div class="player-center">
          <button type="button" class="round-play" data-pb-toggle aria-label="Play">${ICON.play}</button>
          <div class="wave-wrap">
            <canvas class="wave-canvas" data-pb-wave></canvas>
            <span class="time-label" data-pb-time>0:00</span>
          </div>
        </div>
        <div class="player-right">
          <div class="volume">${ICON.volume}<input type="range" min="0" max="1" step="0.01" value="${player.volume}" aria-label="Volume" data-pb-volume></div>
          <span class="price" data-pb-price></span>
          <button type="button" class="btn btn-primary btn-sm" data-pb-buy>Adquirir Beat</button>
        </div>
      </div>`;
    document.body.appendChild(bar);

    $('[data-pb-toggle]', bar).addEventListener('click', () => player.beat && togglePlay(player.beat.id));
    $('[data-pb-buy]', bar).addEventListener('click', () => player.beat && buyBeat(player.beat.id));
    $('[data-pb-volume]', bar).addEventListener('input', e => {
      player.volume = parseFloat(e.target.value);
      if (player.master) player.master.gain.value = player.volume;
      if (player.audio) player.audio.volume = player.volume;
    });
    const wave = $('[data-pb-wave]', bar);
    wave.addEventListener('click', e => seek(e, wave));
  }

  function syncPlayerBar() {
    const bar = $('.player-bar');
    if (!bar || !player.beat) return;
    const b = player.beat;
    bar.classList.add('visible');
    document.body.classList.add('has-player');
    $('[data-pb-cover]', bar).src = b.cover;
    $('[data-pb-cover]', bar).alt = b.title;
    $('[data-pb-title]', bar).textContent = b.title;
    $('[data-pb-meta]', bar).textContent = [b.producer, b.genre].filter(Boolean).join(' • ');
    $('[data-pb-price]', bar).textContent = fmt(b.price);
    const wave = $('[data-pb-wave]', bar);
    wave.dataset.wave = b.id;
    $('[data-pb-time]', bar).dataset.time = b.id;
    $('[data-pb-toggle]', bar).dataset.play = b.id;
  }

  function seek(e, canvas) {
    const id = canvas.dataset.wave;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (!player.beat || player.beat.id !== id) {
      togglePlay(id);
    }
    player.progress = ratio;
    if (player.beat && player.beat.audio && isFinite(audioEl().duration)) audioEl().currentTime = ratio * audioEl().duration;
    updatePlayerUI();
  }

  function loop(ts) {
    if (!player.playing) return;
    const dt = player.lastTick ? (ts - player.lastTick) / 1000 : 0;
    player.lastTick = ts;
    if (player.beat.audio) {
      const a = audioEl();
      if (isFinite(a.duration) && a.duration > 0) player.progress = a.currentTime / a.duration;
    } else {
      player.progress += dt / totalSeconds(player.beat);
    }
    if (player.progress >= 1) {
      player.progress = 0;
      pause();
      return;
    }
    updatePlayerUI();
    player.raf = requestAnimationFrame(loop);
  }

  function play() {
    player.playing = true;
    player.lastTick = 0;
    if (player.beat.audio) {
      const a = audioEl();
      if (a.dataset.beat !== player.beat.id) {
        a.src = player.beat.audio;
        a.dataset.beat = player.beat.id;
        a.addEventListener('loadedmetadata', () => { a.currentTime = player.progress * a.duration; }, { once: true });
      }
      a.volume = player.volume;
      a.play().catch(() => {});
    } else {
      startSynth();
    }
    cancelAnimationFrame(player.raf);
    player.raf = requestAnimationFrame(loop);
    updatePlayerUI();
  }

  function pause() {
    player.playing = false;
    stopSynth();
    if (player.audio) player.audio.pause();
    cancelAnimationFrame(player.raf);
    updatePlayerUI();
  }

  function togglePlay(id) {
    const beat = beatById(id);
    if (!beat) return;
    if (player.beat && player.beat.id === id) {
      player.playing ? pause() : play();
      return;
    }
    if (player.playing) pause();
    player.beat = beat;
    player.progress = 0;
    syncPlayerBar();
    play();
  }

  /* ======================================================================
     CARDS DE BEAT
     ====================================================================== */
  function beatCardHTML(b) {
    return `
      <article class="beat-card">
        <div class="beat-cover">
          <img src="${b.cover}" alt="Capa do beat ${esc(b.title)}" loading="lazy">
          <button type="button" class="play-btn" data-play="${b.id}" aria-label="Ouvir ${esc(b.title)}">${ICON.play}</button>
        </div>
        <div class="beat-body">
          <h3 class="beat-title">${esc(b.title)}</h3>
          <div class="beat-meta"><span class="genre">${esc(b.genre)}</span>${b.duration && b.duration !== '0:00' ? ' • ' + esc(b.duration) : ''}</div>
          <div class="beat-foot">
            <span class="beat-price">${fmt(b.price)}</span>
            <div class="beat-actions auth-only">
              <button type="button" class="mini-btn" data-cart-add="${b.id}" aria-label="Adicionar ${esc(b.title)} ao carrinho">${ICON.cartPlus}</button>
              <button type="button" class="mini-btn buy" data-buy="${b.id}">Comprar</button>
            </div>
          </div>
        </div>
      </article>`;
  }

  // Cliques em qualquer lugar da página (play, carrinho, comprar)
  document.addEventListener('click', e => {
    const playBtn = e.target.closest('[data-play]');
    if (playBtn && !playBtn.hasAttribute('data-pb-toggle')) { e.preventDefault(); togglePlay(playBtn.dataset.play); return; }
    const addBtn = e.target.closest('[data-cart-add]');
    if (addBtn) { e.preventDefault(); addToCart(addBtn.dataset.cartAdd); return; }
    const buyBtn = e.target.closest('[data-buy]');
    if (buyBtn) {
      e.preventDefault();
      const extra = {};
      if (buyBtn.dataset.license) extra.license = buyBtn.dataset.license;
      buyBeat(buyBtn.dataset.buy, extra);
    }
    const waveCanvas = e.target.closest('canvas[data-wave]:not([data-pb-wave])');
    if (waveCanvas) seek(e, waveCanvas);
  });

  /* ======================================================================
     PÁGINA: INÍCIO
     ====================================================================== */
  function initHome() {
    const grid = $('#featured-grid');
    if (grid) {
      let featured = WOAH_BEATS.filter(b => b.featured);
      if (!featured.length) featured = WOAH_BEATS;
      featured = featured.slice(0, 4);
      const promo = grid.querySelector('.promo-card');
      grid.querySelectorAll('.beat-card, .soon-card').forEach(el => el.remove());
      const html = featured.length
        ? featured.map(beatCardHTML).join('')
        : '<div class="soon-card"><strong>Novos beats em breve</strong><span>Estamos preparando o catálogo. Volte logo para ouvir os lançamentos.</span></div>';
      grid.insertAdjacentHTML('afterbegin', html);
      grid.classList.toggle('is-empty', !featured.length);
      if (promo) grid.appendChild(promo);
    }
    const hl = WOAH_BEATS.find(b => b.highlight) || WOAH_BEATS[0];
    const box = $('#highlight-player');
    const section = box && box.closest('section');
    if (section) section.classList.toggle('hidden', !hl);
    if (box && hl) {
      box.innerHTML = `
        <div class="feature-left">
          <img src="${hl.cover}" alt="Capa do beat ${esc(hl.title)}">
          <div><strong>${esc(hl.title)}</strong><small>${esc(hl.producer)}</small><span class="genre">${esc((hl.tags || [hl.genre]).join(' • '))}</span></div>
        </div>
        <div class="feature-center">
          <button type="button" class="round-play" data-play="${hl.id}" aria-label="Ouvir ${esc(hl.title)}">${ICON.play}</button>
          <div class="wave-wrap">
            <canvas class="wave-canvas" data-wave="${hl.id}" aria-label="Linha do tempo do beat"></canvas>
            <span class="time-label" data-time="${hl.id}">0:00 / ${esc(hl.duration)}</span>
          </div>
        </div>
        <div class="feature-right">
          <span class="price-lg">${fmt(hl.price)}</span>
          <button type="button" class="btn btn-primary" data-buy="${hl.id}">Adquirir Beat</button>
        </div>`;
    }
  }

  /* ======================================================================
     PÁGINA: BEATS (catálogo, busca, filtros e paginação)
     ====================================================================== */
  const PER_PAGE = 8;
  const PRICE_RANGES = [
    { id: 'all', label: 'Todos os preços', test: () => true },
    { id: 'ate-50', label: 'Até R$ 50', test: p => p <= 50 },
    { id: '50-100', label: 'R$ 50 a R$ 100', test: p => p > 50 && p <= 100 },
    { id: '100-mais', label: 'Acima de R$ 100', test: p => p > 100 }
  ];
  const SORTS = [
    { id: 'relevancia', label: 'Relevância' },
    { id: 'menor', label: 'Menor preço' },
    { id: 'maior', label: 'Maior preço' },
    { id: 'az', label: 'A–Z' }
  ];
  const catalog = { q: '', genre: 'todos', price: 'all', sort: 'relevancia', page: 1 };
  let draft = null;

  function setCatalogQuery(value) {
    catalog.q = value.trim();
    catalog.page = 1;
    $$('[data-search-input]').forEach(i => { if (i.value !== value) i.value = value; });
    const url = new URL(location.href);
    if (catalog.q) url.searchParams.set('q', catalog.q); else url.searchParams.delete('q');
    history.replaceState(null, '', url);
    renderCatalog();
  }

  function filteredBeats() {
    const q = catalog.q.toLowerCase();
    const range = PRICE_RANGES.find(r => r.id === catalog.price) || PRICE_RANGES[0];
    let list = WOAH_BEATS.filter(b => {
      const text = (b.title + ' ' + b.genre + ' ' + (b.tags || []).join(' ') + ' ' + b.producer).toLowerCase();
      return (!q || text.includes(q)) &&
        (catalog.genre === 'todos' || b.genre.toLowerCase().includes(catalog.genre)) &&
        range.test(b.price);
    });
    if (catalog.sort === 'menor') list = list.slice().sort((a, b) => a.price - b.price);
    if (catalog.sort === 'maior') list = list.slice().sort((a, b) => b.price - a.price);
    if (catalog.sort === 'az') list = list.slice().sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }

  function renderCatalog() {
    const grid = $('#catalog-grid');
    if (!grid) return;
    const list = filteredBeats();
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    catalog.page = Math.min(catalog.page, pages);
    const slice = list.slice((catalog.page - 1) * PER_PAGE, catalog.page * PER_PAGE);

    $('#result-count').innerHTML = `<strong>${list.length}</strong> ${list.length === 1 ? 'beat encontrado' : 'beats encontrados'}${catalog.q ? ` para “${esc(catalog.q)}”` : ''}`;

    if (!list.length) {
      grid.classList.add('hidden');
      $('#catalog-empty').classList.remove('hidden');
      const vazio = !WOAH_BEATS.length;
      $('#catalog-empty h3').textContent = vazio ? 'Novos beats em breve' : 'Nenhum beat encontrado';
      $('#catalog-empty p').textContent = vazio ? 'Estamos preparando o catálogo. Volte logo para ouvir os lançamentos.' : 'Tente outra busca ou limpe os filtros.';
      $('#clear-all').classList.toggle('hidden', vazio);
    } else {
      grid.classList.remove('hidden');
      $('#catalog-empty').classList.add('hidden');
      grid.innerHTML = slice.map(beatCardHTML).join('');
    }

    // Filtros ativos
    const chips = [];
    if (catalog.genre !== 'todos') chips.push({ key: 'genre', label: genreLabel(catalog.genre) });
    if (catalog.price !== 'all') chips.push({ key: 'price', label: PRICE_RANGES.find(r => r.id === catalog.price).label });
    if (catalog.sort !== 'relevancia') chips.push({ key: 'sort', label: SORTS.find(s => s.id === catalog.sort).label });
    $('#active-chips').innerHTML = chips.map(c => `<span class="chip">${esc(c.label)}<button type="button" aria-label="Remover filtro" data-chip="${c.key}">×</button></span>`).join('');
    const count = chips.length;
    const badge = $('#filter-count');
    badge.textContent = count;
    badge.classList.toggle('hidden', !count);

    // Paginação só quando há mais de uma página
    const pag = $('#pagination');
    if (pages <= 1) {
      pag.classList.add('hidden');
      pag.innerHTML = '';
    } else {
      pag.classList.remove('hidden');
      let html = `<button type="button" class="page-btn" data-page="${catalog.page - 1}" ${catalog.page === 1 ? 'disabled' : ''} aria-label="Página anterior">‹</button>`;
      for (let i = 1; i <= pages; i++) html += `<button type="button" class="page-btn${i === catalog.page ? ' active' : ''}" data-page="${i}" aria-label="Página ${i}">${i}</button>`;
      html += `<button type="button" class="page-btn" data-page="${catalog.page + 1}" ${catalog.page === pages ? 'disabled' : ''} aria-label="Próxima página">›</button>`;
      pag.innerHTML = html;
    }
    updateCartUI();
    updatePlayerUI();
  }

  function genres() {
    const set = new Map();
    WOAH_BEATS.forEach(b => set.set(b.genre.toLowerCase(), b.genre));
    return Array.from(set, ([id, label]) => ({ id, label }));
  }
  const genreLabel = id => (genres().find(g => g.id === id) || { label: id }).label;

  function renderFilterOptions() {
    const opt = (group, id, label, active) => `<button type="button" class="option${active ? ' active' : ''}" data-opt-group="${group}" data-opt="${esc(id)}">${esc(label)}</button>`;
    $('#opt-genre').innerHTML = opt('genre', 'todos', 'Todos', draft.genre === 'todos') + genres().map(g => opt('genre', g.id, g.label, draft.genre === g.id)).join('');
    $('#opt-price').innerHTML = PRICE_RANGES.map(r => opt('price', r.id, r.label, draft.price === r.id)).join('');
    $('#opt-sort').innerHTML = SORTS.map(s => opt('sort', s.id, s.label, draft.sort === s.id)).join('');
  }

  function initBeats() {
    catalog.q = (params.get('q') || '').trim();
    const modal = $('#filters-modal');
    const open = () => { draft = { genre: catalog.genre, price: catalog.price, sort: catalog.sort }; renderFilterOptions(); modal.classList.add('open'); };
    const close = () => modal.classList.remove('open');

    $('#open-filters').addEventListener('click', open);
    $$('[data-filters-close]').forEach(b => b.addEventListener('click', close));
    modal.addEventListener('click', e => {
      if (e.target === modal) close();
      const o = e.target.closest('[data-opt]');
      if (o) { draft[o.dataset.optGroup] = o.dataset.opt; renderFilterOptions(); }
    });
    $('#apply-filters').addEventListener('click', () => { Object.assign(catalog, draft, { page: 1 }); close(); renderCatalog(); });
    $('#clear-filters').addEventListener('click', () => { draft = { genre: 'todos', price: 'all', sort: 'relevancia' }; renderFilterOptions(); });
    $('#clear-all').addEventListener('click', () => { Object.assign(catalog, { genre: 'todos', price: 'all', sort: 'relevancia', page: 1 }); setCatalogQuery(''); });

    $('#active-chips').addEventListener('click', e => {
      const c = e.target.closest('[data-chip]');
      if (!c) return;
      const defaults = { genre: 'todos', price: 'all', sort: 'relevancia' };
      catalog[c.dataset.chip] = defaults[c.dataset.chip];
      catalog.page = 1;
      renderCatalog();
    });
    $('#pagination').addEventListener('click', e => {
      const b = e.target.closest('[data-page]');
      if (!b) return;
      catalog.page = parseInt(b.dataset.page, 10);
      renderCatalog();
      $('#catalog-top').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    renderCatalog();
  }

  /* ======================================================================
     PÁGINA: LICENÇAS
     ====================================================================== */
  function initLicencas() {
    const beat = beatById(params.get('beat')) || WOAH_BEATS.find(b => b.highlight) || WOAH_BEATS[0];
    const grid = $('#license-grid');
    grid.innerHTML = WOAH_LICENSES.map(l => {
      const price = l.price == null ? 'Sob consulta' : fmt(l.price);
      const btn = l.exclusive
        ? `<a href="${waLink('Olá! Gostaria de consultar a licença exclusiva' + (beat ? ' do beat ' + beat.title : ''))}" target="_blank" rel="noopener" class="btn btn-outline btn-block">${esc(l.cta)}</a>`
        : beat
          ? `<button type="button" class="btn ${l.popular ? 'btn-primary' : 'btn-outline'} btn-block" data-buy="${beat.id}" data-license="${l.id}">${esc(l.cta)}</button>`
          : `<a href="beats.html" class="btn ${l.popular ? 'btn-primary' : 'btn-outline'} btn-block">Escolher um beat</a>`;
      return `
        <article class="license-card${l.popular ? ' popular' : ''}${l.exclusive ? ' exclusive' : ''}">
          ${l.popular ? '<span class="license-flag">Mais popular</span>' : ''}
          <span class="license-label">${esc(l.label)}</span>
          <h2 class="license-name">${esc(l.name)}</h2>
          <p class="license-desc">${esc(l.description)}</p>
          <div class="license-price">${price}</div>
          <ul class="check-list">${(l.features || []).map(f => `<li>${ICON.check}<span>${esc(f)}</span></li>`).join('')}</ul>
          ${btn}
        </article>`;
    }).join('');
  }

  /* ======================================================================
     PÁGINAS: LOGIN E CRIAR CONTA
     ====================================================================== */
  function showMsg(form, text, type) {
    const box = $('.form-msg', form);
    box.textContent = text;
    box.className = 'form-msg ' + type;
  }

  function setBusy(form, busy, label) {
    const btn = $('button[type="submit"]', form);
    if (busy) { btn.dataset.label = btn.textContent; btn.textContent = label; btn.disabled = true; }
    else { btn.textContent = btn.dataset.label || btn.textContent; btn.disabled = false; }
  }

  function initPasswordToggles() {
    $$('.toggle-pass').forEach(btn => {
      btn.innerHTML = ICON.eye;
      btn.addEventListener('click', () => {
        const input = btn.parentElement.querySelector('input');
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
      });
    });
  }

  function authNext() { return safeNext(params.get('next'), 'index.html'); }

  function keepNextOnLinks() {
    const next = params.get('next');
    if (!next) return;
    $$('[data-keep-next]').forEach(a => { a.href = a.getAttribute('href') + '?next=' + encodeURIComponent(next); });
  }

  function initLogin() {
    if (getUser()) { location.replace(authNext()); return; }
    initPasswordToggles();
    keepNextOnLinks();
    const forgot = $('#forgot-link');
    if (forgot) forgot.href = waLink('Olá! Esqueci a senha da minha conta na Woah Collection.');
    const form = $('#login-form');
    const step = $('#password-step');
    const arrow = $('#email-next');
    const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    const isOpen = () => step.classList.contains('open');

    // Seta ao lado do e-mail: confere o e-mail e desliza o campo de senha
    function openPasswordStep() {
      const email = form.email.value.trim();
      if (!validEmail(email)) {
        showMsg(form, 'Digite um e-mail válido para continuar.', 'error');
        form.email.focus();
        return;
      }
      $('.form-msg', form).className = 'form-msg';
      step.classList.add('open');
      step.removeAttribute('inert');
      arrow.classList.add('done');
      arrow.setAttribute('aria-label', 'E-mail confirmado');
      setTimeout(() => form.password.focus(), 250);
    }
    arrow.addEventListener('click', openPasswordStep);

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!isOpen()) { openPasswordStep(); return; }
      const email = form.email.value.trim().toLowerCase();
      const password = form.password.value;
      if (!email || !password) { showMsg(form, 'Informe seu e-mail e senha.', 'error'); return; }
      setBusy(form, true, 'Entrando...');
      try {
        const data = await api('/api/login', { method: 'POST', body: { email, password } });
        setSession(data.token, data.user);
        showMsg(form, 'Bem-vindo de volta, ' + data.user.name.split(' ')[0] + '!', 'success');
        setTimeout(() => location.replace(data.user.role === 'dev' ? 'admin.html' : authNext()), 500);
      } catch (err) {
        showMsg(form, err.message, 'error');
        setBusy(form, false);
      }
    });
  }

  function initRegister() {
    if (getUser()) { location.replace(authNext()); return; }
    initPasswordToggles();
    keepNextOnLinks();
    const form = $('#register-form');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const name = form.name.value.trim();
      const email = form.email.value.trim().toLowerCase();
      const password = form.password.value;
      const confirm = form.confirm.value;
      if (!name || !email || !password) { showMsg(form, 'Preencha todos os campos.', 'error'); return; }
      if (password.length < 6) { showMsg(form, 'A senha deve ter pelo menos 6 caracteres.', 'error'); return; }
      if (password !== confirm) { showMsg(form, 'As senhas não são iguais.', 'error'); form.confirm.focus(); return; }
      setBusy(form, true, 'Criando conta...');
      try {
        const data = await api('/api/cadastro', { method: 'POST', body: { name, email, password } });
        setSession(data.token, data.user);
        showMsg(form, 'Conta criada! Bem-vindo, ' + data.user.name.split(' ')[0] + '.', 'success');
        setTimeout(() => location.replace(authNext()), 600);
      } catch (err) {
        showMsg(form, err.message, 'error');
        setBusy(form, false);
      }
    });
  }

  /* ======================================================================
     PÁGINA: CARRINHO
     ====================================================================== */
  function renderCartPage() {
    const wrap = $('#cart-content');
    if (!wrap) return;
    const items = getCart().map(beatById);
    if (!items.length) {
      wrap.innerHTML = `
        <div class="empty-state" style="margin-top:32px">
          <h3>Seu carrinho está vazio</h3>
          <p>Ouça os beats do catálogo e adicione os que combinam com o seu projeto.</p>
          <a href="beats.html" class="btn btn-primary">Explorar beats</a>
        </div>`;
      return;
    }
    const total = items.reduce((s, b) => s + b.price, 0);
    wrap.innerHTML = `
      <div class="cart-layout">
        <div class="cart-list">
          ${items.map(b => `
            <div class="cart-item">
              <img src="${b.cover}" alt="Capa do beat ${esc(b.title)}">
              <div class="cart-item-info"><strong>${esc(b.title)}</strong><small>${[b.producer, b.genre, b.duration !== '0:00' ? b.duration : ''].filter(Boolean).map(esc).join(' • ')}</small></div>
              <span class="cart-item-price">${fmt(b.price)}</span>
              <button type="button" class="icon-btn remove-btn" data-remove="${b.id}" aria-label="Remover ${esc(b.title)}">${ICON.trash}</button>
            </div>`).join('')}
        </div>
        <aside class="summary-card">
          <h2>Resumo</h2>
          <div class="sum-row"><span>${items.length} ${items.length === 1 ? 'beat' : 'beats'}</span><span>${fmt(total)}</span></div>
          <div class="sum-row"><span>Desconto</span><span>${fmt(0)}</span></div>
          <div class="sum-total"><span>Total</span><strong>${fmt(total)}</strong></div>
          <a href="checkout.html?cart=1" class="btn btn-primary btn-lg btn-block" style="margin-top:20px">Finalizar compra</a>
          <a href="beats.html" class="btn btn-ghost btn-block" style="margin-top:8px">Continuar comprando</a>
          <div class="secure-note">${ICON.lock} Pagamento seguro • Entrega imediata</div>
        </aside>
      </div>`;
  }

  function initCarrinho() {
    if (!requireLogin('carrinho.html')) return;
    document.addEventListener('click', e => {
      const r = e.target.closest('[data-remove]');
      if (r) removeFromCart(r.dataset.remove);
    });
    renderCartPage();
  }

  /* ======================================================================
     PÁGINA: CONTATO
     ====================================================================== */
  function initContato() {
    $$('[data-wa]').forEach(a => { a.href = waLink(a.dataset.wa); });
    const form = $('#contact-form');
    if (!form) return;
    const user = getUser();
    if (user) { form.name.value = user.name; }
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = form.name.value.trim();
      const subject = form.subject.value.trim();
      const message = form.message.value.trim();
      if (!name || !message) { showMsg(form, 'Preencha seu nome e a mensagem.', 'error'); return; }
      const text = `Olá! Sou ${name}.${subject ? ' Assunto: ' + subject + '.' : ''}\n\n${message}`;
      window.open(waLink(text), '_blank', 'noopener');
      showMsg(form, 'Abrimos o WhatsApp com a sua mensagem. É só enviar!', 'success');
    });
  }

  /* ======================================================================
     INICIALIZAÇÃO
     ====================================================================== */
  // Expõe o necessário para o checkout
  /* ---------- Catálogo (beats, licenças e imagens vindos do Painel) ---------- */
  const assetUrl = u => (u && u.startsWith('/arquivos/') ? API_URL + u : u);

  function applyCatalog(data) {
    if (!data) return;
    if (Array.isArray(data.beats)) {
      WOAH_BEATS.length = 0;
      data.beats.forEach(b => WOAH_BEATS.push(Object.assign({}, b, {
        cover: assetUrl(b.cover) || WOAH_DEFAULT_COVER,
        audio: assetUrl(b.audio) || '',
        genre: b.genre || '',
        tags: b.tags && b.tags.length ? b.tags : (b.genre ? [b.genre] : [])
      })));
    }
    if (Array.isArray(data.licencas) && data.licencas.length) {
      WOAH_LICENSES.length = 0;
      data.licencas.forEach(l => WOAH_LICENSES.push(l));
    }
    if (data.imagens) {
      Object.keys(data.imagens).forEach(k => { if (data.imagens[k]) WOAH_IMAGES[k] = assetUrl(data.imagens[k]); });
    }
  }

  function applySiteImages() {
    $$('[data-site-img]').forEach(img => {
      const src = WOAH_IMAGES[img.dataset.siteImg];
      if (src && img.getAttribute('src') !== src) img.src = src;
    });
  }

  async function loadCatalog() {
    try {
      const res = await fetch(API_URL + '/api/catalogo', { cache: 'no-store' });
      if (res.ok) applyCatalog(await res.json());
    } catch (e) { /* servidor desligado: usa o padrão */ }
    applySiteImages();
  }

  const ready = loadCatalog();
  window.WOAH = { getUser, getCart, clearCart, beatById, requireLogin, fmt, esc, api, ready, applyCatalog, assetUrl, toast };

  renderHeader();
  renderFooter();
  renderPlayerBar();
  refreshAuthUI();
  applySiteImages();

  const inits = {
    home: initHome,
    beats: initBeats,
    licencas: initLicencas,
    login: initLogin,
    'criar-conta': initRegister,
    carrinho: initCarrinho,
    contato: initContato
  };
  checkSession();
  ready.then(() => {
    if (inits[page]) inits[page]();
    updateCartUI();
    updatePlayerUI();
  });

  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(drawAllWaves, 100); });

  // Mantém login/carrinho sincronizados entre abas
  window.addEventListener('storage', e => {
    if (e.key === 'current_user' || e.key === 'auth_token' || (e.key || '').startsWith('woah_cart_')) refreshAuthUI();
  });
})();
