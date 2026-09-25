const barsEl = document.getElementById('bars');
const heights = [40,55,35,70,50,85,60,90,65,75,80,95];
const colors = ['#e5e5e5','#e5e5e5','#e5e5e5','#e5e5e5','#e5e5e5','#e5e5e5','#e5e5e5','#e5e5e5','#e5e5e5','#e5e5e5','#e5e5e5','#1d1d1f'];
heights.forEach((h, i) => {
  const bar = document.createElement('div');
  bar.className = 'bar';
  bar.style.height = '0px';
  bar.style.background = colors[i];
  barsEl.appendChild(bar);
  setTimeout(() => { bar.style.height = h + 'px'; }, 500 + i * 60);
});

function animCount(el, target, suffix, duration) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start = Math.min(start + step, target);
    el.textContent = Math.round(start) + suffix;
    if (start >= target) clearInterval(timer);
  }, 16);
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const id = entry.target.id;
    if (id === 'dashboard') {
      setTimeout(() => {
        animCount(document.getElementById('c1'), 47, '', 1000);
        animCount(document.getElementById('c2'), 128, '', 1200);
        animCount(document.getElementById('c3'), 89, '', 1000);
        document.getElementById('c4').textContent = 'R$ 24.8k';
      }, 400);
    }
    observer.unobserve(entry.target);
  });
}, { threshold: 0.3 });

observer.observe(document.getElementById('dashboard'));

const msgs = [
  'Olá! Identifiquei 3 produtos com estoque baixo. Deseja criar uma campanha de reposição?',
  'Seus pedidos aumentaram 23% esta semana. Veja o relatório completo no Dashboard.',
  'Dica: seus clientes mais ativos estão no período noturno. Ajuste seus envios!',
  'Nova integração disponível: conecte seu Bling em menos de 2 minutos.',
  'Lead scoring concluído: 12 clientes com alta probabilidade de compra identificados!'
];
let msgIdx = 0;
setInterval(() => {
  msgIdx = (msgIdx + 1) % msgs.length;
  const el = document.getElementById('aria-msg');
  el.style.opacity = '0';
  setTimeout(() => { el.textContent = msgs[msgIdx]; el.style.opacity = '1'; }, 300);
}, 3000);

function toggleView() {
  const ecomflowView = document.getElementById('ecomflow-view');
  const portfolioView = document.getElementById('portfolio-view');
  const btn = document.getElementById('toggle-view-btn');
  const navLinks = document.querySelector('.nav-links');
  const historyBtn = document.getElementById('history-btn');
  const alignBtn = document.getElementById('align-btn');

  if (ecomflowView.classList.contains('hidden')) {
    ecomflowView.classList.remove('hidden');
    portfolioView.classList.add('hidden');
    btn.textContent = 'Ver Portfólio';
    btn.style.background = '#3b82f6';
    if (historyBtn) historyBtn.classList.remove('hidden');
    if (alignBtn) alignBtn.classList.remove('hidden');
    if (navLinks) {
      navLinks.innerHTML = `
        <a href="#features" id="nav-link-1">Funcionalidades</a>
        <a href="#dashboard" id="nav-link-2">Dashboard</a>
        <a href="#stack" id="nav-link-3">Stack</a>
        <a href="#stats" id="nav-link-4">Resultados</a>
      `;
    }
  } else {
    ecomflowView.classList.add('hidden');
    portfolioView.classList.remove('hidden');
    btn.textContent = 'Ver Projeto Apollo';
    btn.style.background = '#1d1d1f';
    if (historyBtn) historyBtn.classList.add('hidden');
    if (alignBtn) alignBtn.classList.add('hidden');
    if (navLinks) {
      navLinks.innerHTML = `
        <a href="#projects-section" id="nav-link-1">Projetos</a>
        <a href="#courses-section" id="nav-link-2">Educação</a>
      `;
    }
  }
}

function toggleDashboard() {
  const dashboard = document.getElementById('dashboard');
  if (dashboard.classList.contains('hidden')) {
    dashboard.classList.remove('hidden');
    setTimeout(() => {
      dashboard.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  } else {
    dashboard.classList.add('hidden');
  }
}

const explanations = {
  'programing-history': {
    title: 'História da Programação',
    text: 'A história da programação começa há mais de 200 anos, quando inventores ainda tentavam automatizar processos repetitivos. Em 1801, o tear de Jacquard usava cartões perfurados para controlar padrões têxteis, um conceito inovador para época. Em 1837, Charles Babbage idealizou a máquina analítica, depois, em 1843, Ada Lovelace escreveu o primeiro programa de computador, prevendo que máquinas poderiam manipular símbolos além de números, algo extraordinário para o século 19. Em 1890, Herman Hollerith usou cartões perfurados para automatizar o censo americano. reduzindo anos de trabalho para poucos meses e dando origem à empresa que viraria a IBM. Na década de 1930, Alan Turing formulou a máquina de Turing, base teórica da computação. Entre 1941 e 1946, surgiram os primeiros computadores eletrônicos como o Z3 e o ENIAC. Programá-los significava praticamente religar fios e chaves manualmente. Nos anos 50, programava-se em linguagem de máquina e Assembly. Difícil e fácil de errar. Em 1957, veio o Fortran, primeira linguagem de alto nível, seguida pelo Cobol, em 1959, usado até hoje em sistemas bancários. Depois, vieram C, em 1972, e a era dos PCs, anos 80. Em 1991, surgem a web e a linguagem Python. Em 1995, chegam Java e JavaScript. A partir dos anos 2000, vemos frameworks, APIs, cloud e metodologias ágeis mudando o desenvolvimento. Em 2008, Git e GitHub popularizam o controle de versão. Em 2009, Node.js leva o JavaScript para o backend. Nos anos 2010, computação em nuvem muda a infraestrutura. Já na década de 2020, IA generativa começa a auxiliar na escrita de código e documentação, marcando mais uma virada na área. Hoje, programar é um dos pilares da transformação digital, presente em web, dispositivos móveis, IA, IoT e nuvem. Construindo sistemas cada vez mais complexos, mas também mais acessíveis.'
  },
  'project-ecomflow': {
    title: 'Projeto Apollo — EcomFlow',
    text: 'O EcomFlow é um ecossistema SaaS completo para gerenciamento de lojas virtuais. Ele centraliza o estoque de múltiplos canais de venda (como Bling e Mercado Livre), analisa faturamento em tempo real e fornece uma assistente de inteligência artificial baseada no Gemini para ajudar o lojista com insights automatizados sobre reposição de estoque e campanhas de marketing.'
  },
  'project-n8n': {
    title: 'Chatbot n8n Inteligente',
    text: 'Este projeto automatiza o atendimento ao cliente e a qualificação de leads integrando n8n com APIs de chat. Ele analisa as intenções do usuário em tempo real, executa ações no banco de dados da empresa e responde de forma humanizada usando IA generativa.'
  },
  'project-saas': {
    title: 'Dashboard Multi-tenant',
    text: 'Um painel administrativo de alta performance desenvolvido para soluções de Software as a Service (SaaS). Ele implementa isolamento completo de banco de dados por cliente (tenant), autenticação robusta via tokens JWT com tempo de expiração e rotas de API otimizadas.'
  },
  'cert-fullstack': {
    title: 'Arquitetura Web — Alura',
    text: 'Certificação em Arquitetura Web, cobrindo de forma abrangente a estrutura, organização e funcionamento de aplicações web modernas. Inclui arquitetura cliente-servidor, protocolos HTTP/HTTPS, DNS, APIs REST, comunicação entre serviços, modelagem e normalização de bancos de dados relacionais, integração de sistemas, autenticação, autorização, segurança de aplicações, gerenciamento de sessões, escalabilidade horizontal e vertical, balanceamento de carga, cache, desempenho, monitoramento, infraestrutura em nuvem, versionamento, boas práticas de desenvolvimento e padrões de arquitetura voltados à criação de aplicações web de alta disponibilidade, alta performance e fácil manutenção.'
  },
  'cert-ia': {
    title: 'Introdução à Análise de Dados com Power BI — Suzano',
    text: 'Certificação em Introdução à Análise de Dados com Power BI, abordando de forma abrangente os fundamentos da análise e visualização de dados para suporte à tomada de decisões. Inclui coleta, importação e transformação de dados (ETL), modelagem de dados, relacionamentos entre tabelas, criação de dashboards e relatórios interativos, desenvolvimento de indicadores de desempenho (KPIs), utilização de gráficos e visualizações estratégicas, filtros e segmentações, fundamentos de Business Intelligence (BI), interpretação de métricas, organização de informações, análise exploratória de dados e boas práticas na apresentação de resultados para geração de insights e apoio à gestão orientada por dados.'
  },
  'cert-n8n': {
    title: 'Introdução ao Desenvolvimento Full Stack — Akad',
    text: 'Certificação em Introdução ao Desenvolvimento Full Stack, abordando de forma abrangente os fundamentos da construção de aplicações web completas para o desenvolvimento de soluções modernas. Inclui desenvolvimento de interfaces frontend responsivas com HTML, CSS e JavaScript, programação lógica e regras de negócio no backend, criação e consumo de APIs RESTful, integração entre diferentes sistemas e serviços, manipulação de bancos de dados relacionais e não-relacionais, controle de versão avançado com Git e GitHub, organização estruturada de projetos, adoção de padrões de projeto e boas práticas de codificação para garantir o desenvolvimento de soluções web eficientes, seguras, escaláveis e de fácil manutenção.'
  },
  'cert-gemini': {
    title: 'Imersão Dev com Google Gemini – Alura + Google',
    text: 'Certificação em Imersão Dev com Google Gemini, abordando de forma abrangente o desenvolvimento de aplicações utilizando Inteligência Artificial Generativa integrada ao processo de programação. Inclui fundamentos de IA generativa, utilização do Google Gemini para criação e otimização de código, engenharia de prompts (Prompt Engineering), integração de modelos de IA em aplicações, consumo de APIs, desenvolvimento de soluções inteligentes, automação de tarefas, prototipação rápida, boas práticas na utilização de assistentes de programação, otimização de fluxos de desenvolvimento, resolução de problemas com apoio de IA e aplicação de tecnologias modernas para aumentar a produtividade, a qualidade e a eficiência no desenvolvimento de software.'
  }
};

function openExplanation(key) {
  const modal = document.getElementById('explanation-modal');
  const titleEl = document.getElementById('modal-title');
  const descEl = document.getElementById('modal-desc');

  if (explanations[key]) {
    titleEl.textContent = explanations[key].title;
    descEl.textContent = explanations[key].text;
    modal.classList.remove('hidden');
  }
}

function closeModal() {
  const modal = document.getElementById('explanation-modal');
  modal.classList.add('hidden');
}

function closeModalOnOutsideClick(event) {
  const modal = document.getElementById('explanation-modal');
  if (event.target === modal) {
    closeModal();
  }
}

function togglePortfolioTab(tabId) {
  const targetSection = document.getElementById(tabId);
  const otherTabId = tabId === 'projects-section' ? 'courses-section' : 'projects-section';
  const otherSection = document.getElementById(otherTabId);

  if (targetSection.classList.contains('hidden')) {
    targetSection.classList.remove('hidden');
    otherSection.classList.add('hidden');
    setTimeout(() => {
      targetSection.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  } else {
    targetSection.classList.add('hidden');
  }
}

// Controla a abertura/fechamento do chat flutuante
function toggleChatBox() {
  const chatBox = document.getElementById('chat-box');
  const chatBubble = document.getElementById('chat-bubble');
  if (chatBox.classList.contains('hidden')) {
    chatBox.classList.remove('hidden');
    chatBubble.style.display = 'none';
  } else {
    chatBox.classList.add('hidden');
    chatBubble.style.display = 'flex';
  }
}

/* =========================================================
   SISTEMA DE AUTENTICAÇÃO — LOGIN, CADASTRO E CONTAS DEV
   ========================================================= */

// Contas fixas de desenvolvedor
const DEV_ACCOUNTS = [
  { email: 'max@criativo.eft.com', password: 'Max_diretor.criativo@EFT', name: 'Max', role: 'dev' },
  { email: 'carlos@marketing.aluno.com', password: 'Carlos_marketing@aluno', name: 'Carlos', role: 'dev' },
  { email: 'rodrigo@ceo.com', password: 'Rodrigo_CEO_EFT', name: 'Rodrigo', role: 'dev' }
];

function openAuthModal(tab = 'login') {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  switchAuthTab(tab);
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.add('hidden');
  clearAuthFeedback();
}

function closeAuthModalOnOutsideClick(event) {
  const modal = document.getElementById('auth-modal');
  if (event.target === modal) closeAuthModal();
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('auth-login-form');
  const registerForm = document.getElementById('auth-register-form');
  const loginTab = document.getElementById('tab-login');
  const registerTab = document.getElementById('tab-register');
  clearAuthFeedback();
  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    loginTab.classList.remove('active');
    registerTab.classList.add('active');
  }
}

function showAuthFeedback(formId, message, type = 'error') {
  const form = document.getElementById(formId);
  if (!form) return;
  let feedback = form.querySelector('.auth-feedback');
  if (!feedback) {
    feedback = document.createElement('div');
    feedback.className = 'auth-feedback ' + type;
    form.prepend(feedback);
  }
  feedback.className = 'auth-feedback ' + type;
  feedback.textContent = message;
  feedback.style.display = 'block';
}

function clearAuthFeedback() {
  document.querySelectorAll('.auth-feedback').forEach(fb => {
    fb.style.display = 'none';
    fb.textContent = '';
  });
}

function getStoredUsers() {
  return JSON.parse(localStorage.getItem('registered_users') || '[]');
}

function saveStoredUsers(users) {
  localStorage.setItem('registered_users', JSON.stringify(users));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('current_user') || 'null');
}

function setCurrentUser(user) {
  localStorage.setItem('current_user', JSON.stringify(user));
  updateAuthUI();
}

function isDevAccount(email) {
  return DEV_ACCOUNTS.some(d => d.email === email.toLowerCase());
}

function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const password = document.getElementById('reg-password').value;

  if (!name || !email || !password) {
    showAuthFeedback('auth-register-form', 'Preencha todos os campos.', 'error');
    return;
  }
  if (password.length < 6) {
    showAuthFeedback('auth-register-form', 'A senha deve ter pelo menos 6 caracteres.', 'error');
    return;
  }
  if (isDevAccount(email)) {
    showAuthFeedback('auth-register-form', 'Este e-mail e reservado. Faca login diretamente.', 'error');
    return;
  }
  const users = getStoredUsers();
  if (users.some(u => u.email === email)) {
    showAuthFeedback('auth-register-form', 'Este e-mail ja esta cadastrado. Faca login!', 'error');
    return;
  }
  const newUser = { id: Date.now(), name, email, password, role: 'user', photo: null };
  users.push(newUser);
  saveStoredUsers(users);
  showAuthFeedback('auth-register-form', 'Cadastro realizado! Conectando...', 'success');
  setTimeout(() => {
    setCurrentUser({ id: newUser.id, name, email, role: 'user', photo: null });
    closeAuthModal();
    document.getElementById('auth-register-form').reset();
  }, 1000);
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    showAuthFeedback('auth-login-form', 'Informe seu e-mail e senha.', 'error');
    return;
  }

  // Verifica contas dev
  const devMatch = DEV_ACCOUNTS.find(d => d.email === email && d.password === password);
  if (devMatch) {
    showAuthFeedback('auth-login-form', 'Bem-vindo, ' + devMatch.name + '! (Conta Dev)', 'success');
    const stored = getStoredUsers();
    const savedPhoto = (stored.find(u => u.email === email) || {}).photo || null;
    setTimeout(() => {
      setCurrentUser({ id: 'dev_' + email, name: devMatch.name, email, role: 'dev', photo: savedPhoto });
      closeAuthModal();
      document.getElementById('auth-login-form').reset();
    }, 800);
    return;
  }

  // Verifica usuarios normais
  const users = getStoredUsers();
  const foundUser = users.find(u => u.email === email && u.password === password);
  if (!foundUser) {
    showAuthFeedback('auth-login-form', 'E-mail ou senha incorretos.', 'error');
    return;
  }
  showAuthFeedback('auth-login-form', 'Bem-vindo de volta, ' + foundUser.name + '!', 'success');
  setTimeout(() => {
    setCurrentUser({ id: foundUser.id, name: foundUser.name, email, role: 'user', photo: foundUser.photo || null });
    closeAuthModal();
    document.getElementById('auth-login-form').reset();
  }, 800);
}

function handleLogout() {
  localStorage.removeItem('current_user');
  closeAvatarDropdown();
  updateAuthUI();
}

/* ---- Avatar Dropdown ---- */
function toggleAvatarDropdown() {
  const dropdown = document.getElementById('avatar-dropdown-menu');
  if (!dropdown) return;
  dropdown.classList.toggle('hidden');
}

function closeAvatarDropdown() {
  const dropdown = document.getElementById('avatar-dropdown-menu');
  if (dropdown) dropdown.classList.add('hidden');
}

document.addEventListener('click', function(e) {
  const wrapper = document.getElementById('avatar-btn-wrapper');
  if (wrapper && !wrapper.contains(e.target)) closeAvatarDropdown();
});

/* ---- Modal de Configuracoes ---- */
function getStoredMusicName() {
  return localStorage.getItem('featured_music_name') || '';
}

function openSettingsModal() {
  closeAvatarDropdown();
  const user = getCurrentUser();
  if (!user) return;
  let modal = document.getElementById('settings-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'settings-modal';
    modal.className = 'modal-overlay';
    modal.onclick = function(e) { if (e.target === modal) closeSettingsModal(); };
    document.body.appendChild(modal);
  }
  const isDev = user.role === 'dev';
  const photoUrl = user.photo || '';
  const initials = user.name.split(' ').map(function(n){ return n[0]; }).join('').substring(0,2).toUpperCase();
  const photoHtml = photoUrl
    ? '<img src="' + photoUrl + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">'
    : '<span style="font-size:22px;font-weight:700;color:#fff;">' + initials + '</span>';

  modal.innerHTML =
    '<div class="modal-card settings-card">' +
      '<span class="modal-close" onclick="closeSettingsModal()">&times;</span>' +
      '<h3 class="modal-title">Configuracoes da Conta</h3>' +
      '<div class="settings-avatar-section">' +
        '<div class="settings-avatar-preview" id="settings-avatar-preview">' + photoHtml + '</div>' +
        '<div>' +
          '<div style="font-size:14px;font-weight:700;color:#1d1d1f;margin-bottom:4px;">' + user.name + '</div>' +
          '<div style="font-size:12px;color:#6e6e73;margin-bottom:10px;">' + user.email + '</div>' +
          (isDev ? '<span class="dev-badge-pill">Conta Desenvolvedor</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="settings-section">' +
        '<label class="settings-label">Foto de Perfil</label>' +
        '<label class="upload-btn-label" for="upload-photo-input">Escolher Foto</label>' +
        '<input type="file" id="upload-photo-input" accept="image/*" style="display:none;" onchange="handlePhotoUpload(event)">' +
        '<div style="font-size:11px;color:#999;margin-top:6px;">JPG, PNG ou GIF — max. 2MB</div>' +
      '</div>' +
      (isDev ?
        '<div class="settings-section">' +
          '<label class="settings-label">Upload de Musica (Dev)</label>' +
          '<p style="font-size:12px;color:#6e6e73;margin-bottom:10px;">Adicione um audio para o Lancamento em Destaque da Loja de Beats.</p>' +
          '<label class="upload-btn-label upload-btn-music" for="upload-music-input">Escolher Audio</label>' +
          '<input type="file" id="upload-music-input" accept="audio/*" style="display:none;" onchange="handleMusicUpload(event)">' +
          '<div id="music-upload-status" style="font-size:12px;margin-top:8px;color:#6e6e73;">' +
            (getStoredMusicName() ? 'Musica atual: ' + getStoredMusicName() : 'Nenhuma musica enviada ainda.') +
          '</div>' +
        '</div>'
      : '') +
      '<button class="auth-submit-btn" onclick="closeSettingsModal()" style="margin-top:10px;">Fechar</button>' +
    '</div>';

  modal.classList.remove('hidden');
}

function closeSettingsModal() {
  const modal = document.getElementById('settings-modal');
  if (modal) modal.classList.add('hidden');
}

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { alert('Imagem muito grande! Max 2MB.'); return; }
  const reader = new FileReader();
  reader.onload = function(e) {
    const photoUrl = e.target.result;
    const preview = document.getElementById('settings-avatar-preview');
    if (preview) preview.innerHTML = '<img src="' + photoUrl + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
    const user = getCurrentUser();
    if (user) {
      user.photo = photoUrl;
      setCurrentUser(user);
      const users = getStoredUsers();
      const idx = users.findIndex(function(u){ return u.email === user.email; });
      if (idx !== -1) { users[idx].photo = photoUrl; saveStoredUsers(users); }
    }
  };
  reader.readAsDataURL(file);
}

function handleMusicUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const statusEl = document.getElementById('music-upload-status');
  if (statusEl) statusEl.innerHTML = 'Carregando musica...';
  const reader = new FileReader();
  reader.onload = function(e) {
    localStorage.setItem('featured_music_data', e.target.result);
    const musicName = file.name.replace(/\.[^.]+$/, '');
    localStorage.setItem('featured_music_name', musicName);
    if (statusEl) statusEl.innerHTML = 'Musica enviada: <strong>' + musicName + '</strong>';
    if (typeof applyUploadedMusic === 'function') applyUploadedMusic();
  };
  reader.readAsDataURL(file);
}

/* ---- Atualiza UI do nav com avatar ---- */
function updateAuthUI() {
  const user = getCurrentUser();
  const containers = document.querySelectorAll('#nav-auth-container');
  containers.forEach(function(authContainer) {
    if (!authContainer) return;
    if (user) {
      const initials = user.name.split(' ').map(function(n){ return n[0]; }).join('').substring(0,2).toUpperCase();
      const isDev = user.role === 'dev';
      const photoHtml = user.photo
        ? '<img src="' + user.photo + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">'
        : '<span style="font-size:11px;font-weight:700;">' + initials + '</span>';

      authContainer.innerHTML =
        '<div id="avatar-btn-wrapper" style="position:relative;">' +
          '<button class="avatar-btn' + (isDev ? ' avatar-btn-dev' : '') + '" onclick="toggleAvatarDropdown()" title="' + user.name + '">' +
            '<div class="avatar-photo-circle">' + photoHtml + '</div>' +
            '<span style="font-size:12px;font-weight:600;">' + user.name.split(' ')[0] + '</span>' +
            (isDev ? '<span style="font-size:13px;">&#x1F451;</span>' : '') +
            '<span style="font-size:10px;opacity:0.6;">&#9660;</span>' +
          '</button>' +
          '<div id="avatar-dropdown-menu" class="avatar-dropdown hidden">' +
            '<div class="avatar-dropdown-header">' +
              '<div style="font-size:13px;font-weight:700;">' + user.name + '</div>' +
              '<div style="font-size:11px;color:#888;">' + user.email + '</div>' +
              (isDev ? '<div class="dev-badge-small">Desenvolvedor</div>' : '') +
            '</div>' +
            (isDev ? '<a class="avatar-dropdown-item" href="https://wa.me/5527995055702" target="_blank">Suporte</a>' : '') +
            '<button class="avatar-dropdown-item" onclick="openSettingsModal()">Configuracoes</button>' +
            '<button class="avatar-dropdown-item avatar-dropdown-logout" onclick="handleLogout()">Sair da Conta</button>' +
          '</div>' +
        '</div>';
    } else {
      authContainer.innerHTML =
        '<button class="auth-nav-btn" onclick="openAuthModal(\'login\')" id="login-btn">' +
          'Login / Nova Conta' +
        '</button>';
    }
  });
}

// Inicializa a UI ao carregar
document.addEventListener('DOMContentLoaded', function() {
  updateAuthUI();
});
