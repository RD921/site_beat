/**
 * BEAT STORE — Home Page Logic
 */

import STORE_CONFIG from '../config/store.config.js';
import { getFeaturedBeats } from '../services/catalog.service.js';
import { MOCK_LICENSES } from '../data/mock/mock-licenses.js';
import { renderBeatGrid, renderSkeletonCards } from '../components/beat-card.js';

export async function initHomePage() {
  _renderHero();
  _renderBenefits();
  await _renderFeaturedBeats();
  _renderHowItWorks();
  _renderLicensesPreview();
  _renderCTA();
  _renderFooter();
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function _renderHero() {
  const section = document.querySelector('#hero-section');
  if (!section) return;

  const { eyebrow, title, titleHighlight, description, primaryCTA, secondaryCTA, benefits, image } = STORE_CONFIG.hero;

  section.innerHTML = `
    <div class="container">
      <div class="hero-inner">
        <!-- Conteúdo -->
        <div class="hero-content">
          <span class="hero-eyebrow">${eyebrow}</span>

          <h1 class="hero-title">
            ${title}
            <span class="hero-title-highlight">${titleHighlight}</span>
          </h1>

          <p class="hero-description">${description}</p>

          <div class="hero-actions">
            <a href="${primaryCTA.href}" class="btn btn-primary btn-xl">
              ▶ ${primaryCTA.label}
            </a>
            <a href="${secondaryCTA.href}" class="btn btn-secondary btn-xl">
              ${secondaryCTA.label}
            </a>
          </div>

          <!-- Indicadores de confiança -->
          <div class="hero-trust" role="list">
            ${benefits.map(b => `
              <div class="hero-trust-item" role="listitem">
                <span class="hero-trust-icon" aria-hidden="true">${b.icon}</span>
                <div>
                  <strong class="hero-trust-value">${b.value}</strong>
                  <span class="hero-trust-label">${b.label}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Visual -->
        <div class="hero-visual">
          <img
            src="${image}"
            alt="Estúdio de produção musical"
            class="hero-image"
            loading="eager"
            fetchpriority="high"
          />
          <div class="hero-visual-tag">
            <span>Produção</span>
            <strong>${STORE_CONFIG.name}</strong>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ─── Benefits ─────────────────────────────────────────────────────────────────

function _renderBenefits() {
  const section = document.querySelector('#benefits-section');
  if (!section) return;

  const items = [
    { icon: '🎵', value: '+500', label: 'Beats Disponíveis', desc: 'Catálogo exclusivo' },
    { icon: '✅', value: '100%', label: 'Original',          desc: 'Produção própria' },
    { icon: '⚡', value: 'Imediata', label: 'Entrega',       desc: 'Download na hora' },
    { icon: '🎧', value: 'Suporte', label: 'Dedicado',       desc: 'Estamos online' },
  ];

  section.innerHTML = `
    <div class="container">
      <div class="benefits-inner" role="list">
        ${items.map(item => `
          <div class="benefit-item" role="listitem">
            <div class="benefit-icon" aria-hidden="true">${item.icon}</div>
            <div class="benefit-text">
              <div class="benefit-value">${item.value}</div>
              <div class="benefit-label">${item.label}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ─── Featured Beats ───────────────────────────────────────────────────────────

async function _renderFeaturedBeats() {
  const section = document.querySelector('#highlights-section');
  if (!section) return;

  section.innerHTML = `
    <div class="container">
      <div class="highlights-header">
        <div class="highlights-header-left">
          <span class="section-eyebrow">🎵 Em Destaque</span>
          <h2 class="section-title">Destaques</h2>
          <p class="section-description">Beats selecionados especialmente para você.</p>
        </div>
        <a href="/beats.html" class="btn btn-ghost">Ver todos os beats →</a>
      </div>

      <div class="highlights-grid-wrapper">
        <div class="highlights-beats-grid" id="featured-grid">
          <!-- Skeletons enquanto carrega -->
        </div>

        <!-- Card Promo -->
        <div class="promo-card">
          <span class="promo-card-eyebrow">Transforme</span>
          <h3 class="promo-card-title">
            sua ideia em <em>realidade</em>
          </h3>
          <p class="promo-card-desc">
            Beats prontos para gravação. Com qualidade profissional e entrega imediata.
          </p>
          <a href="/beats.html" class="btn btn-primary">Adquirir Beat →</a>
        </div>
      </div>
    </div>
  `;

  const grid = document.querySelector('#featured-grid');
  renderSkeletonCards(4, grid);

  try {
    const beats = await getFeaturedBeats(4);
    renderBeatGrid(beats, grid);
  } catch (err) {
    grid.innerHTML = `
      <div class="state-error">
        <span class="state-error-icon">⚠️</span>
        <h3>Não foi possível carregar os beats.</h3>
        <button class="btn btn-primary" onclick="location.reload()">Tentar novamente</button>
      </div>
    `;
  }
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function _renderHowItWorks() {
  const section = document.querySelector('#how-section');
  if (!section) return;

  const steps = [
    { icon: '🔍', title: 'Encontre seu Beat', desc: 'Navegue pelo catálogo e use os filtros para descobrir o beat ideal para o seu estilo.' },
    { icon: '🎧', title: 'Ouça o Preview',   desc: 'Reproduza o preview completo antes de comprar. Sem surpresas.' },
    { icon: '🎚', title: 'Teste com sua Música', desc: 'Use nosso estúdio de teste para ouvir o beat com sua própria voz ou instrumentação.' },
    { icon: '📄', title: 'Escolha a Licença',  desc: 'Basic, Premium ou Exclusive. Cada licença com seus direitos claramente definidos.' },
    { icon: '💳', title: 'Compre com Segurança', desc: 'Pagamento seguro e criptografado. Seus dados protegidos.' },
    { icon: '⬇️', title: 'Receba na Hora',     desc: 'Download imediato após a confirmação. Acesse na área do cliente quando quiser.' },
  ];

  section.innerHTML = `
    <div class="container">
      <div style="text-align: center; max-width: 600px; margin: 0 auto;">
        <span class="section-eyebrow">🚀 Simples e Rápido</span>
        <h2 class="section-title">Como Funciona</h2>
        <p class="section-description">Do descobrimento ao download em minutos.</p>
      </div>
      <div class="how-steps">
        ${steps.map((step, i) => `
          <div class="how-step">
            <span class="how-step-number" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
            <div class="how-step-icon" aria-hidden="true">${step.icon}</div>
            <h3 class="how-step-title">${step.title}</h3>
            <p class="how-step-desc">${step.desc}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ─── Licenses Preview ─────────────────────────────────────────────────────────

function _renderLicensesPreview() {
  const section = document.querySelector('#licenses-section');
  if (!section) return;

  section.innerHTML = `
    <div class="container">
      <div style="text-align: center; max-width: 600px; margin: 0 auto;">
        <span class="section-eyebrow">📄 Transparência Total</span>
        <h2 class="section-title">Escolha sua Licença</h2>
        <p class="section-description">Direitos claros, preços justos. Sem letras miúdas.</p>
      </div>
      <div class="licenses-grid" style="margin-top: 2.5rem;">
        ${MOCK_LICENSES.map(license => `
          <div class="license-card ${license.isPopular ? 'is-popular' : ''}">
            ${license.isPopular ? `<div class="license-card-badge-popular">${license.badge}</div>` : ''}
            <div class="license-card-name">${license.name}</div>
            <div class="license-card-price">
              <span>${STORE_CONFIG.currencySymbol}</span>${license.price.toFixed(2).replace('.', ',')}
            </div>
            <p class="license-card-desc">${license.description}</p>
            <ul class="license-features" aria-label="Recursos da licença ${license.name}">
              ${license.features.slice(0, 5).map(f => `
                <li class="license-feature ${f.included ? 'included' : 'excluded'}">
                  <span class="license-feature-icon" aria-hidden="true">${f.included ? '✓' : '✗'}</span>
                  <span class="license-feature-text">${f.text}</span>
                </li>
              `).join('')}
            </ul>
            <a href="/licencas.html" class="btn ${license.isPopular ? 'btn-primary' : 'btn-secondary'}">
              ${license.cta}
            </a>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ─── CTA Final ────────────────────────────────────────────────────────────────

function _renderCTA() {
  const section = document.querySelector('#cta-section');
  if (!section) return;

  section.innerHTML = `
    <div class="container">
      <div class="final-cta-inner">
        <h2 class="final-cta-title">
          Sua música merece<br>beats de <em>verdade</em>
        </h2>
        <p class="section-description" style="text-align: center;">
          Explore o catálogo completo e encontre o beat que vai transformar sua produção.
        </p>
        <div class="final-cta-actions">
          <a href="/beats.html" class="btn btn-primary btn-xl">▶ Explorar Beats</a>
          <a href="/como-funciona.html" class="btn btn-secondary btn-xl">Como Funciona</a>
        </div>
      </div>
    </div>
  `;
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function _renderFooter() {
  const footer = document.querySelector('#app-footer');
  if (!footer) return;

  const { socials, footer: footerConfig, name, branding } = STORE_CONFIG;

  footer.innerHTML = `
    <footer class="site-footer" role="contentinfo">
      <div class="container">
        <div class="footer-inner">
          <!-- Brand -->
          <div class="footer-brand">
            <a href="/index.html" class="header-logo" aria-label="${name}">
              <span class="logo-main">${branding.logoText}</span>
              <span class="logo-sub">${branding.logoSubText}</span>
            </a>
            <p class="footer-brand-desc">
              Beats exclusivos, prontos para transformar suas ideias em hits.
            </p>
            <div class="footer-socials">
              ${socials.instagram ? `<a href="${socials.instagram}" target="_blank" rel="noopener" class="footer-social-btn" aria-label="Instagram">📷</a>` : ''}
              ${socials.whatsapp ? `<a href="${socials.whatsapp}" target="_blank" rel="noopener" class="footer-social-btn" aria-label="WhatsApp">💬</a>` : ''}
              ${socials.youtube ? `<a href="${socials.youtube}" target="_blank" rel="noopener" class="footer-social-btn" aria-label="YouTube">▶️</a>` : ''}
            </div>
          </div>

          <!-- Links: Loja -->
          <div>
            <h3 class="footer-col-title">Loja</h3>
            <ul class="footer-links">
              <li><a href="/beats.html" class="footer-link">Beats</a></li>
              <li><a href="/licencas.html" class="footer-link">Licenças</a></li>
              <li><a href="/como-funciona.html" class="footer-link">Como Funciona</a></li>
              <li><a href="/contato.html" class="footer-link">Contato</a></li>
            </ul>
          </div>

          <!-- Links: Conta -->
          <div>
            <h3 class="footer-col-title">Conta</h3>
            <ul class="footer-links">
              <li><a href="/login.html" class="footer-link">Entrar</a></li>
              <li><a href="/register.html" class="footer-link">Criar Conta</a></li>
              <li><a href="/conta.html" class="footer-link">Minha Conta</a></li>
              <li><a href="/conta.html#downloads" class="footer-link">Downloads</a></li>
            </ul>
          </div>

          <!-- Links: Suporte -->
          <div>
            <h3 class="footer-col-title">Suporte</h3>
            <ul class="footer-links">
              ${footerConfig.links.map(l => `<li><a href="${l.href}" class="footer-link">${l.label}</a></li>`).join('')}
              ${socials.whatsapp ? `<li><a href="${socials.whatsapp}" target="_blank" rel="noopener" class="footer-link">WhatsApp</a></li>` : ''}
            </ul>
          </div>
        </div>

        <!-- Bottom -->
        <div class="footer-bottom">
          <p class="footer-copyright">${footerConfig.copyright}</p>
          <nav class="footer-legal" aria-label="Links legais">
            ${footerConfig.links.map(l => `<a href="${l.href}">${l.label}</a>`).join('')}
          </nav>
        </div>
      </div>
    </footer>
  `;
}
