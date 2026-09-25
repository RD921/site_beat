/* =========================================================
   MARKETING — script.js
   Autenticação, Avatar Dropdown, Chat Bubble
   ========================================================= */

const DEV_ACCOUNTS = [
  { email: 'max@criativo.eft.com', password: 'Max_diretor.criativo@EFT', name: 'Max', role: 'dev' },
  { email: 'carlos@marketing.aluno.com', password: 'Carlos_marketing@aluno', name: 'Carlos', role: 'dev' },
  { email: 'rodrigo@ceo.com', password: 'Rodrigo_CEO_EFT', name: 'Rodrigo', role: 'dev' }
];

/* ---- Auth Modal ---- */
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
  if (!name || !email || !password) { showAuthFeedback('auth-register-form', 'Preencha todos os campos.', 'error'); return; }
  if (password.length < 6) { showAuthFeedback('auth-register-form', 'A senha deve ter pelo menos 6 caracteres.', 'error'); return; }
  if (isDevAccount(email)) { showAuthFeedback('auth-register-form', 'Este e-mail e reservado. Faca login diretamente.', 'error'); return; }
  const users = getStoredUsers();
  if (users.some(u => u.email === email)) { showAuthFeedback('auth-register-form', 'Este e-mail ja esta cadastrado. Faca login!', 'error'); return; }
  const newUser = { id: Date.now(), name, email, password, role: 'user', photo: null };
  users.push(newUser);
  saveStoredUsers(users);
  showAuthFeedback('auth-register-form', 'Cadastro realizado! Conectando...', 'success');
  setTimeout(() => { setCurrentUser({ id: newUser.id, name, email, role: 'user', photo: null }); closeAuthModal(); document.getElementById('auth-register-form').reset(); }, 1000);
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  if (!email || !password) { showAuthFeedback('auth-login-form', 'Informe seu e-mail e senha.', 'error'); return; }
  const devMatch = DEV_ACCOUNTS.find(d => d.email === email && d.password === password);
  if (devMatch) {
    showAuthFeedback('auth-login-form', 'Bem-vindo, ' + devMatch.name + '! (Conta Dev)', 'success');
    const savedPhoto = (getStoredUsers().find(u => u.email === email) || {}).photo || null;
    setTimeout(() => { setCurrentUser({ id: 'dev_' + email, name: devMatch.name, email, role: 'dev', photo: savedPhoto }); closeAuthModal(); document.getElementById('auth-login-form').reset(); }, 800);
    return;
  }
  const foundUser = getStoredUsers().find(u => u.email === email && u.password === password);
  if (!foundUser) { showAuthFeedback('auth-login-form', 'E-mail ou senha incorretos.', 'error'); return; }
  showAuthFeedback('auth-login-form', 'Bem-vindo de volta, ' + foundUser.name + '!', 'success');
  setTimeout(() => { setCurrentUser({ id: foundUser.id, name: foundUser.name, email, role: 'user', photo: foundUser.photo || null }); closeAuthModal(); document.getElementById('auth-login-form').reset(); }, 800);
}

function handleLogout() { localStorage.removeItem('current_user'); closeAvatarDropdown(); updateAuthUI(); }

/* ---- Avatar Dropdown ---- */
function toggleAvatarDropdown() { const d = document.getElementById('avatar-dropdown-menu'); if (d) d.classList.toggle('hidden'); }
function closeAvatarDropdown() { const d = document.getElementById('avatar-dropdown-menu'); if (d) d.classList.add('hidden'); }
document.addEventListener('click', function(e) { const w = document.getElementById('avatar-btn-wrapper'); if (w && !w.contains(e.target)) closeAvatarDropdown(); });

/* ---- Settings Modal ---- */
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
  const initials = user.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  const photoHtml = user.photo ? '<img src="' + user.photo + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">' : '<span style="font-size:22px;font-weight:700;color:#fff;">' + initials + '</span>';
  modal.innerHTML = '<div class="modal-card settings-card">' +
    '<span class="modal-close" onclick="closeSettingsModal()">&times;</span>' +
    '<h3 class="modal-title">Configuracoes da Conta</h3>' +
    '<div class="settings-avatar-section"><div class="settings-avatar-preview">' + photoHtml + '</div><div>' +
    '<div style="font-size:14px;font-weight:700;margin-bottom:4px;">' + user.name + '</div>' +
    '<div style="font-size:12px;color:#6e6e73;margin-bottom:10px;">' + user.email + '</div>' +
    (isDev ? '<span class="dev-badge-pill">Conta Desenvolvedor</span>' : '') + '</div></div>' +
    '<div class="settings-section"><label class="settings-label">Foto de Perfil</label>' +
    '<label class="upload-btn-label" for="upload-photo-input">Escolher Foto</label>' +
    '<input type="file" id="upload-photo-input" accept="image/*" style="display:none;" onchange="handlePhotoUpload(event)">' +
    '<div style="font-size:11px;color:#999;margin-top:6px;">JPG, PNG ou GIF — max. 2MB</div></div>' +
    '<button class="auth-submit-btn" onclick="closeSettingsModal()" style="margin-top:10px;">Fechar</button></div>';
  modal.classList.remove('hidden');
}

function closeSettingsModal() { const m = document.getElementById('settings-modal'); if (m) m.classList.add('hidden'); }

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file || file.size > 2 * 1024 * 1024) { if (file) alert('Imagem muito grande! Max 2MB.'); return; }
  const reader = new FileReader();
  reader.onload = function(e) {
    const photoUrl = e.target.result;
    const preview = document.getElementById('settings-avatar-preview');
    if (preview) preview.innerHTML = '<img src="' + photoUrl + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
    const user = getCurrentUser();
    if (user) { user.photo = photoUrl; setCurrentUser(user); const users = getStoredUsers(); const idx = users.findIndex(u => u.email === user.email); if (idx !== -1) { users[idx].photo = photoUrl; saveStoredUsers(users); } }
  };
  reader.readAsDataURL(file);
}

/* ---- Chat Bubble ---- */
function toggleChatBox() {
  const chatBox = document.getElementById('chat-box');
  const chatBubble = document.getElementById('chat-bubble');
  if (chatBox.classList.contains('hidden')) { chatBox.classList.remove('hidden'); chatBubble.style.display = 'none'; }
  else { chatBox.classList.add('hidden'); chatBubble.style.display = 'flex'; }
}

/* ---- Seções internas de Marketing ---- */
function togglePortfolioView() {
  const marketingView = document.getElementById('marketing-main-view');
  const portfolioView = document.getElementById('portfolio-view');
  const btn = document.getElementById('toggle-view-btn');
  const homeLink = document.getElementById('home-link');
  const consultBtn = document.getElementById('consult-btn');

  if (marketingView.classList.contains('hidden')) {
    marketingView.classList.remove('hidden');
    portfolioView.classList.add('hidden');
    btn.textContent = 'Ver Portfólio';
    btn.style.background = '#3b82f6';
    if (homeLink) homeLink.classList.remove('hidden');
    if (consultBtn) consultBtn.classList.remove('hidden');
  } else {
    marketingView.classList.add('hidden');
    portfolioView.classList.remove('hidden');
    btn.textContent = 'Ver Marketing';
    btn.style.background = '#1d1d1f';
    if (homeLink) homeLink.classList.add('hidden');
    if (consultBtn) consultBtn.classList.add('hidden');
  }
}

function togglePortfolioTab(tabId) {
  const targetSection = document.getElementById(tabId);
  const otherTabId = tabId === 'mkt-projects-section' ? 'mkt-courses-section' : 'mkt-projects-section';
  const otherSection = document.getElementById(otherTabId);
  if (targetSection.classList.contains('hidden')) {
    targetSection.classList.remove('hidden');
    if (otherSection) otherSection.classList.add('hidden');
    setTimeout(() => { targetSection.scrollIntoView({ behavior: 'smooth' }); }, 100);
  } else {
    targetSection.classList.add('hidden');
  }
}

function toggleMktSection(sectionId) {
  const allSections = ['metrics-section', 'solucoes-section', 'plans-section'];
  allSections.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === sectionId) {
      if (el.classList.contains('hidden')) {
        el.classList.remove('hidden');
        setTimeout(() => { el.scrollIntoView({ behavior: 'smooth' }); }, 100);
      } else {
        el.classList.add('hidden');
      }
    } else {
      el.classList.add('hidden');
    }
  });
}

/* ---- Atualiza UI do nav com avatar ---- */
function updateAuthUI() {
  const user = getCurrentUser();
  document.querySelectorAll('#nav-auth-container').forEach(function(authContainer) {
    if (!authContainer) return;
    if (user) {
      const initials = user.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
      const isDev = user.role === 'dev';
      const photoHtml = user.photo ? '<img src="' + user.photo + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">' : '<span style="font-size:11px;font-weight:700;">' + initials + '</span>';
      authContainer.innerHTML = '<div id="avatar-btn-wrapper" style="position:relative;">' +
        '<button class="avatar-btn' + (isDev ? ' avatar-btn-dev' : '') + '" onclick="toggleAvatarDropdown()" title="' + user.name + '">' +
        '<div class="avatar-photo-circle">' + photoHtml + '</div>' +
        '<span style="font-size:12px;font-weight:600;">' + user.name.split(' ')[0] + '</span>' +
        (isDev ? '<span style="font-size:13px;">&#x1F451;</span>' : '') +
        '<span style="font-size:10px;opacity:0.6;">&#9660;</span></button>' +
        '<div id="avatar-dropdown-menu" class="avatar-dropdown hidden">' +
        '<div class="avatar-dropdown-header"><div style="font-size:13px;font-weight:700;">' + user.name + '</div>' +
        '<div style="font-size:11px;color:#888;">' + user.email + '</div>' +
        (isDev ? '<div class="dev-badge-small">Desenvolvedor</div>' : '') + '</div>' +
        (isDev ? '<a class="avatar-dropdown-item" href="https://wa.me/5527995055702" target="_blank">Suporte</a>' : '') +
        '<button class="avatar-dropdown-item" onclick="openSettingsModal()">Configuracoes</button>' +
        '<button class="avatar-dropdown-item avatar-dropdown-logout" onclick="handleLogout()">Sair da Conta</button>' +
        '</div></div>';
    } else {
      authContainer.innerHTML = '<button class="auth-nav-btn" onclick="openAuthModal(\'login\')" id="login-btn">Login / Nova Conta</button>';
    }
  });
}

document.addEventListener('DOMContentLoaded', function() { updateAuthUI(); });
