/* ==========================================================================
   WOAH COLLECTION — PAINEL DA EQUIPE
   Beats (capa + áudio), imagens do site e licenças, sem mexer no código.
   Só funciona com uma conta de desenvolvedor (criada com "node server.js criar-dev").
   ========================================================================== */

(function () {
  'use strict';

  const W = window.WOAH;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const { esc, fmt } = W;
  const API_URL = location.port === '3000' ? '' : 'http://localhost:3000';
  const url = u => W.assetUrl(u);

  let data = { beats: [], licencas: [], imagens: {} };   // catálogo "cru" do servidor
  let editing = null;                                    // beat sendo editado
  let form = { cover: '', audio: '' };                   // arquivos do formulário

  const IMAGE_SLOTS = [
    { key: 'hero', label: 'Imagem principal (topo da página inicial)', fallback: WOAH_IMAGES.hero },
    { key: 'promo', label: 'Card "Transforme sua ideia em realidade"', fallback: WOAH_IMAGES.promo },
    { key: 'login', label: 'Banner da tela de login', fallback: WOAH_IMAGES.login },
    { key: 'cadastro', label: 'Banner da tela de criar conta', fallback: WOAH_IMAGES.cadastro }
  ];
  const DEFAULT_IMAGES = Object.fromEntries(IMAGE_SLOTS.map(s => [s.key, s.fallback]));

  /* ---------- Envio de arquivos ---------- */
  function upload(file, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', API_URL + '/api/admin/upload');
      xhr.setRequestHeader('Authorization', 'Bearer ' + (localStorage.getItem('auth_token') || ''));
      xhr.setRequestHeader('X-Nome-Arquivo', encodeURIComponent(file.name));
      xhr.upload.onprogress = e => { if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)); };
      xhr.onload = () => {
        let res = {};
        try { res = JSON.parse(xhr.responseText); } catch (e) { /* vazio */ }
        if (xhr.status >= 200 && xhr.status < 300) resolve(res.url);
        else reject(new Error(res.erro || 'Não foi possível enviar o arquivo.'));
      };
      xhr.onerror = () => reject(new Error('Servidor desligado. Rode "node server.js" na pasta do site.'));
      xhr.send(file);
    });
  }

  function refresh(catalogo) {
    data = catalogo;
    W.applyCatalog(JSON.parse(JSON.stringify(catalogo)));
    renderBeats();
    renderImages();
    renderLicenses();
  }

  /* ---------- Abas ---------- */
  $$('.admin-tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.admin-tab').forEach(t => t.classList.toggle('active', t === tab));
    $$('.admin-panel').forEach(p => p.classList.toggle('hidden', p.dataset.panel !== tab.dataset.tab));
  }));

  /* ---------- Beats ---------- */
  function renderBeats() {
    const list = $('#beats-list');
    $('#beats-count').innerHTML = `<strong>${data.beats.length}</strong> ${data.beats.length === 1 ? 'beat cadastrado' : 'beats cadastrados'}`;
    if (!data.beats.length) {
      list.innerHTML = `
        <div class="empty-state">
          <h3>Nenhum beat ainda</h3>
          <p>Clique em “+ Novo beat” para colocar o primeiro beat à venda.</p>
        </div>`;
      return;
    }
    list.innerHTML = data.beats.map(b => `
      <div class="admin-row">
        <img src="${esc(url(b.cover) || WOAH_DEFAULT_COVER)}" alt="">
        <div class="admin-row-info">
          <strong>${esc(b.title)}</strong>
          <small>${[b.genre, b.duration !== '0:00' ? b.duration : '', b.bpm ? b.bpm + ' BPM' : ''].filter(Boolean).map(esc).join(' • ') || '—'}</small>
          <div class="admin-badges">
            ${b.audio ? '<span class="badge ok">Áudio</span>' : '<span class="badge warn">Sem áudio</span>'}
            ${b.highlight ? '<span class="badge red">Beat em destaque</span>' : ''}
            ${b.featured ? '<span class="badge">Destaques</span>' : ''}
          </div>
        </div>
        <span class="admin-price">${fmt(b.price)}</span>
        <div class="admin-actions">
          <button type="button" class="btn btn-outline btn-sm" data-edit="${b.id}">Editar</button>
          <button type="button" class="btn btn-ghost btn-sm danger" data-delete="${b.id}">Excluir</button>
        </div>
      </div>`).join('');
  }

  const modal = $('#beat-modal');
  const beatForm = $('#beat-form');

  function showFormMsg(text, type) {
    const box = $('.form-msg', beatForm);
    box.textContent = text;
    box.className = 'form-msg' + (type ? ' ' + type : '');
  }

  function renderMediaPreviews() {
    $('#cover-preview').innerHTML = `<img src="${esc(url(form.cover) || WOAH_DEFAULT_COVER)}" alt="Capa">`;
    $('#cover-remove').classList.toggle('hidden', !form.cover);
    const audioBox = $('#audio-preview');
    if (form.audio) {
      audioBox.innerHTML = `<audio controls preload="metadata" src="${esc(url(form.audio))}"></audio>`;
      const a = $('audio', audioBox);
      a.addEventListener('loadedmetadata', () => {
        const d = beatForm.duration;
        if (isFinite(a.duration) && (!d.value || d.value === '0:00')) {
          d.value = Math.floor(a.duration / 60) + ':' + String(Math.round(a.duration % 60)).padStart(2, '0');
        }
      });
    } else {
      audioBox.textContent = 'Nenhum áudio enviado';
    }
    $('#audio-remove').classList.toggle('hidden', !form.audio);
  }

  function openBeatForm(beat) {
    editing = beat || null;
    beatForm.reset();
    showFormMsg('');
    $('#cover-status').textContent = '';
    $('#audio-status').textContent = 'MP3, WAV, M4A ou OGG • até 80 MB';
    $('#beat-modal-title').textContent = beat ? 'Editar beat' : 'Novo beat';
    form = { cover: beat ? beat.cover : '', audio: beat ? beat.audio : '' };
    if (beat) {
      beatForm.title.value = beat.title;
      beatForm.price.value = String(beat.price).replace('.', ',');
      beatForm.genre.value = beat.genre || '';
      beatForm.producer.value = beat.producer || '';
      beatForm.tags.value = (beat.tags || []).join(', ');
      beatForm.duration.value = beat.duration !== '0:00' ? beat.duration : '';
      beatForm.bpm.value = beat.bpm || '';
      beatForm.key.value = beat.key || '';
      beatForm.featured.checked = !!beat.featured;
      beatForm.highlight.checked = !!beat.highlight;
    } else {
      beatForm.producer.value = 'Prod. Rodrigo Arrezzi';
      beatForm.featured.checked = true;
    }
    const genres = Array.from(new Set(data.beats.map(b => b.genre).filter(Boolean).concat(['Trap', 'Drill', 'Boom Bap', 'R&B', 'Phonk', 'Lo-fi', 'Afrobeat', 'Funk'])));
    $('#genre-list').innerHTML = genres.map(g => `<option value="${esc(g)}">`).join('');
    renderMediaPreviews();
    modal.classList.add('open');
    setTimeout(() => beatForm.title.focus(), 50);
  }

  function closeBeatForm() { modal.classList.remove('open'); }

  $('#new-beat').addEventListener('click', () => openBeatForm(null));
  $$('[data-close-beat]').forEach(b => b.addEventListener('click', closeBeatForm));
  modal.addEventListener('click', e => { if (e.target === modal) closeBeatForm(); });

  $('#beats-list').addEventListener('click', async e => {
    const edit = e.target.closest('[data-edit]');
    if (edit) { openBeatForm(data.beats.find(b => b.id === edit.dataset.edit)); return; }
    const del = e.target.closest('[data-delete]');
    if (del) {
      const beat = data.beats.find(b => b.id === del.dataset.delete);
      if (!beat || !confirm(`Excluir o beat "${beat.title}"? Ele sai do site na hora.`)) return;
      try {
        const res = await W.api('/api/admin/beats/' + beat.id, { method: 'DELETE' });
        refresh(res.catalogo);
        W.toast('Beat excluído.');
      } catch (err) { alert(err.message); }
    }
  });

  async function handleUpload(input, kind) {
    const file = input.files[0];
    input.value = '';
    if (!file) return;
    const status = $('#' + kind + '-status');
    const btn = $('#save-beat');
    btn.disabled = true;
    status.textContent = 'Enviando...';
    try {
      form[kind] = await upload(file, p => { status.textContent = 'Enviando... ' + p + '%'; });
      status.textContent = 'Enviado: ' + file.name;
      renderMediaPreviews();
    } catch (err) {
      status.textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  }

  $('#cover-input').addEventListener('change', e => handleUpload(e.target, 'cover'));
  $('#audio-input').addEventListener('change', e => handleUpload(e.target, 'audio'));
  $('#cover-remove').addEventListener('click', () => { form.cover = ''; $('#cover-status').textContent = ''; renderMediaPreviews(); });
  $('#audio-remove').addEventListener('click', () => { form.audio = ''; $('#audio-status').textContent = ''; renderMediaPreviews(); });

  beatForm.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      title: beatForm.title.value.trim(),
      price: beatForm.price.value.trim(),
      genre: beatForm.genre.value.trim(),
      producer: beatForm.producer.value.trim(),
      tags: beatForm.tags.value,
      duration: beatForm.duration.value.trim(),
      bpm: beatForm.bpm.value.trim(),
      key: beatForm.key.value.trim(),
      featured: beatForm.featured.checked,
      highlight: beatForm.highlight.checked,
      cover: form.cover,
      audio: form.audio
    };
    if (!payload.title) { showFormMsg('Dê um nome para o beat.', 'error'); beatForm.title.focus(); return; }
    const price = parseFloat(payload.price.replace(/\./g, '').replace(',', '.'));
    if (!isFinite(price) || price < 0) { showFormMsg('Informe um preço válido. Ex: 49,90', 'error'); beatForm.price.focus(); return; }
    payload.price = price;
    if (payload.duration && !/^\d{1,2}:\d{2}$/.test(payload.duration)) { showFormMsg('Duração no formato m:ss. Ex: 3:12', 'error'); beatForm.duration.focus(); return; }

    const btn = $('#save-beat');
    btn.disabled = true;
    btn.textContent = 'Salvando...';
    try {
      const res = editing
        ? await W.api('/api/admin/beats/' + editing.id, { method: 'PUT', body: payload })
        : await W.api('/api/admin/beats', { method: 'POST', body: payload });
      refresh(res.catalogo);
      closeBeatForm();
      W.toast(editing ? 'Beat atualizado.' : 'Beat publicado no site!');
    } catch (err) {
      showFormMsg(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Salvar beat';
    }
  });

  /* ---------- Imagens do site ---------- */
  function renderImages() {
    $('#images-grid').innerHTML = IMAGE_SLOTS.map(slot => {
      const custom = data.imagens && data.imagens[slot.key];
      return `
        <div class="image-slot">
          <div class="image-slot-preview"><img src="${esc(custom ? url(custom) : DEFAULT_IMAGES[slot.key])}" alt=""></div>
          <div class="image-slot-body">
            <strong>${esc(slot.label)}</strong>
            <small>${custom ? 'Imagem personalizada' : 'Imagem padrão'}</small>
            <div class="media-actions">
              <label class="btn btn-outline btn-sm">Trocar imagem<input type="file" accept="image/*" data-image-slot="${slot.key}" hidden></label>
              ${custom ? `<button type="button" class="btn btn-ghost btn-sm" data-image-reset="${slot.key}">Voltar ao padrão</button>` : ''}
            </div>
            <small class="upload-status" data-image-status="${slot.key}"></small>
          </div>
        </div>`;
    }).join('');
  }

  async function saveImage(key, value) {
    const res = await W.api('/api/admin/imagens', { method: 'PUT', body: { [key]: value } });
    refresh(res.catalogo);
  }

  $('#images-grid').addEventListener('change', async e => {
    const input = e.target.closest('[data-image-slot]');
    if (!input || !input.files[0]) return;
    const key = input.dataset.imageSlot;
    const status = $(`[data-image-status="${key}"]`);
    try {
      status.textContent = 'Enviando...';
      const newUrl = await upload(input.files[0], p => { status.textContent = 'Enviando... ' + p + '%'; });
      await saveImage(key, newUrl);
      W.toast('Imagem atualizada no site.');
    } catch (err) {
      status.textContent = err.message;
    }
  });

  $('#images-grid').addEventListener('click', async e => {
    const btn = e.target.closest('[data-image-reset]');
    if (!btn) return;
    try {
      await saveImage(btn.dataset.imageReset, '');
      W.toast('Imagem padrão restaurada.');
    } catch (err) { alert(err.message); }
  });

  /* ---------- Licenças ---------- */
  function renderLicenses() {
    $('#licenses-form').innerHTML = data.licencas.map(l => `
      <div class="license-edit" data-license-id="${esc(l.id)}">
        <div class="field">
          <label>Etiqueta</label>
          <input class="input" data-f="label" value="${esc(l.label)}" maxlength="40">
        </div>
        <div class="field">
          <label>Nome da licença</label>
          <input class="input" data-f="name" value="${esc(l.name)}" maxlength="60">
        </div>
        <div class="field">
          <label>Preço (R$)</label>
          ${l.exclusive
            ? '<input class="input" value="Sob consulta" disabled>'
            : `<input class="input" data-f="price" value="${esc(String(l.price).replace('.', ','))}" inputmode="decimal">`}
        </div>
        <div class="field">
          <label>Descrição</label>
          <textarea class="input" data-f="description" rows="3" maxlength="240">${esc(l.description)}</textarea>
        </div>
        <div class="field">
          <label>Itens inclusos (um por linha)</label>
          <textarea class="input" data-f="features" rows="5">${esc((l.features || []).join('\n'))}</textarea>
        </div>
        <div class="field">
          <label>Texto do botão</label>
          <input class="input" data-f="cta" value="${esc(l.cta)}" maxlength="40">
        </div>
      </div>`).join('');
  }

  $('#save-licenses').addEventListener('click', async () => {
    const status = $('#licenses-status');
    const licencas = $$('[data-license-id]').map(card => {
      const get = f => { const el = $(`[data-f="${f}"]`, card); return el ? el.value : undefined; };
      const price = get('price');
      return {
        id: card.dataset.licenseId,
        label: get('label'),
        name: get('name'),
        description: get('description'),
        price: price === undefined ? null : price.replace(/\./g, '').replace(',', '.'),
        features: get('features').split('\n'),
        cta: get('cta')
      };
    });
    const btn = $('#save-licenses');
    btn.disabled = true;
    status.textContent = 'Salvando...';
    try {
      const res = await W.api('/api/admin/licencas', { method: 'PUT', body: { licencas } });
      refresh(res.catalogo);
      status.textContent = 'Licenças salvas.';
      W.toast('Licenças atualizadas no site.');
    } catch (err) {
      status.textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });

  /* ---------- Início ---------- */
  async function start() {
    await W.ready;
    const user = W.getUser();
    if (!user) { location.replace('login.html?next=admin.html'); return; }
    // Confirma no servidor (a sessão pode ter mudado)
    try {
      const me = await W.api('/api/eu');
      if (me.user.role !== 'dev') throw new Error('restrito');
    } catch (err) {
      if (err.status === 401) { location.replace('login.html?next=admin.html'); return; }
      $('#admin-denied').classList.remove('hidden');
      return;
    }
    try {
      const res = await fetch(API_URL + '/api/catalogo', { cache: 'no-store' });
      data = await res.json();
    } catch (e) {
      alert('Servidor desligado. Rode "node server.js" na pasta do site.');
      return;
    }
    $('#admin-app').classList.remove('hidden');
    renderBeats();
    renderImages();
    renderLicenses();
  }

  start();
})();
