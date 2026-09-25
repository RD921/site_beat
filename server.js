/* ==========================================================================
   SERVIDOR LOCAL — WOAH COLLECTION
   Serve o site, guarda as contas e o catálogo (beats, imagens e licenças)
   no seu computador, na pasta "dados". Não precisa instalar nada além do Node.js.

   Ligar o site:        node server.js
   Abrir no navegador:  http://localhost:3000
   Desligar:            Ctrl + C

   Criar/atualizar uma conta de desenvolvedor (acesso ao Painel):
     node server.js criar-dev "email@exemplo.com" "SenhaDaConta" "Nome"
   A senha fica salva criptografada em dados/usuarios.json (nunca no código).
   ========================================================================== */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORTA = 3000;
const PASTA_SITE = __dirname;
const PASTA_DADOS = path.join(__dirname, 'dados');
const PASTA_ARQUIVOS = path.join(PASTA_DADOS, 'arquivos'); // capas e áudios enviados pelo Painel
const ARQUIVO_USUARIOS = path.join(PASTA_DADOS, 'usuarios.json');
const ARQUIVO_SESSOES = path.join(PASTA_DADOS, 'sessoes.json');
const ARQUIVO_CATALOGO = path.join(PASTA_DADOS, 'catalogo.json');

// E-mails da equipe. Só podem ser criados pelo comando "criar-dev" (não pelo site).
const EMAILS_DEV = [
  'rodrigo@ceo.com',
  'max@produtor.eft.com'
];

const DIAS_SESSAO = 30;
const TAMANHO_MAX_JSON = 4 * 1024 * 1024;       // 4 MB
const TAMANHO_MAX_IMAGEM = 10 * 1024 * 1024;    // 10 MB
const TAMANHO_MAX_AUDIO = 80 * 1024 * 1024;     // 80 MB

const EXT_IMAGEM = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const EXT_AUDIO = ['.mp3', '.wav', '.m4a', '.ogg'];

// Licenças iniciais (podem ser alteradas pelo Painel)
const LICENCAS_PADRAO = [
  {
    id: 'basica', label: 'Básica', name: 'Licença MP3', price: 97.00,
    description: 'Ideal para singles independentes, prévias e testes de audiência.',
    features: ['Arquivo MP3 320kbps Master', 'Até 50.000 reproduções', 'Distribuição digital padrão', '1 vídeo musical não monetizado'],
    cta: 'Selecionar licença'
  },
  {
    id: 'premium', label: 'Premium', name: 'Premium (WAV + Stems)', price: 149.90, popular: true,
    description: 'Para lançamentos profissionais com mixagem detalhada de voz e instrumentos.',
    features: ['Arquivo WAV 24-bit + MP3 320kbps', 'Stems (pistas separadas de áudio)', 'Até 500.000 reproduções', 'Monetização autorizada no YouTube'],
    cta: 'Adquirir Premium'
  },
  {
    id: 'exclusiva', label: 'Exclusividade total', name: 'Direito Exclusivo', price: null, exclusive: true,
    description: 'O beat é seu exclusivamente e retirado permanentemente da loja.',
    features: ['Todos os direitos autorais e masters', 'Streams ilimitados no Spotify e Apple', 'Contrato jurídico de exclusividade', 'Remoção permanente do catálogo'],
    cta: 'Falar com o produtor'
  }
];

// Imagens do site que podem ser trocadas pelo Painel (vazio = imagem padrão)
const IMAGENS_PADRAO = { hero: '', promo: '', login: '', cadastro: '' };

/* ---------- Arquivos de dados ---------- */

fs.mkdirSync(PASTA_ARQUIVOS, { recursive: true });

function lerJson(arquivo, padrao) {
  try {
    return JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  } catch (e) {
    return padrao;
  }
}

// Salva com segurança. No Windows, o OneDrive ou o antivírus às vezes "seguram"
// o arquivo por um instante; então tenta de novo e, se precisar, grava direto.
function salvarJson(arquivo, dados) {
  const conteudo = JSON.stringify(dados, null, 2);
  const temporario = arquivo + '.tmp';
  fs.writeFileSync(temporario, conteudo, 'utf8');
  for (let tentativa = 0; tentativa < 10; tentativa++) {
    try {
      fs.renameSync(temporario, arquivo);
      return;
    } catch (erro) {
      if (!['EPERM', 'EBUSY', 'EACCES'].includes(erro.code)) throw erro;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100); // espera 0,1 s
    }
  }
  fs.writeFileSync(arquivo, conteudo, 'utf8');
  try { fs.unlinkSync(temporario); } catch (e) { /* ignora */ }
}

let usuarios = lerJson(ARQUIVO_USUARIOS, []);
let sessoes = lerJson(ARQUIVO_SESSOES, {});
let catalogo = lerJson(ARQUIVO_CATALOGO, null) || { beats: [], licencas: LICENCAS_PADRAO, imagens: IMAGENS_PADRAO };
catalogo.beats = catalogo.beats || [];
catalogo.licencas = catalogo.licencas || LICENCAS_PADRAO;
catalogo.imagens = Object.assign({}, IMAGENS_PADRAO, catalogo.imagens || {});

const salvarCatalogo = () => salvarJson(ARQUIVO_CATALOGO, catalogo);

// Só é dev quem foi criado pelo comando "criar-dev" (contas dev antigas viram contas normais)
if (usuarios.some(u => u.role === 'dev' && !u.devCli)) {
  usuarios.forEach(u => { if (u.role === 'dev' && !u.devCli) u.role = 'user'; });
  salvarJson(ARQUIVO_USUARIOS, usuarios);
}

/* ---------- Senhas (criptografadas com scrypt) ---------- */

function gerarHashSenha(senha) {
  const sal = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(senha, sal, 64).toString('hex');
  return sal + ':' + hash;
}

function conferirSenha(senha, salvo) {
  const [sal, hash] = String(salvo).split(':');
  if (!sal || !hash) return false;
  const tentativa = crypto.scryptSync(senha, sal, 64);
  const original = Buffer.from(hash, 'hex');
  return original.length === tentativa.length && crypto.timingSafeEqual(original, tentativa);
}

/* ---------- Comando: criar conta de desenvolvedor ---------- */

if (process.argv[2] === 'criar-dev') {
  const email = String(process.argv[3] || '').trim().toLowerCase();
  const senha = String(process.argv[4] || '');
  const nome = String(process.argv[5] || email.split('@')[0] || 'Dev').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || senha.length < 6) {
    console.log('\n  Uso: node server.js criar-dev "email@exemplo.com" "Senha (mín. 6)" "Nome"\n');
    process.exit(1);
  }
  let conta = usuarios.find(u => u.email === email);
  if (conta) {
    conta.senha = gerarHashSenha(senha);
    conta.role = 'dev';
    conta.devCli = true;
    if (process.argv[5]) conta.name = nome;
    console.log(`\n  Conta atualizada como desenvolvedor: ${email}\n`);
  } else {
    conta = { id: crypto.randomUUID(), name: nome, email, senha: gerarHashSenha(senha), role: 'dev', devCli: true, photo: null, criadoEm: new Date().toISOString() };
    usuarios.push(conta);
    console.log(`\n  Conta de desenvolvedor criada: ${email}\n`);
  }
  // Encerra sessões antigas dessa conta
  Object.keys(sessoes).forEach(t => { if (sessoes[t].usuarioId === conta.id) delete sessoes[t]; });
  salvarJson(ARQUIVO_USUARIOS, usuarios);
  salvarJson(ARQUIVO_SESSOES, sessoes);
  process.exit(0);
}

/* ---------- Sessões ---------- */

function criarSessao(usuarioId) {
  const token = crypto.randomBytes(32).toString('hex');
  sessoes[token] = { usuarioId, expira: Date.now() + DIAS_SESSAO * 24 * 60 * 60 * 1000 };
  salvarJson(ARQUIVO_SESSOES, sessoes);
  return token;
}

function usuarioDaRequisicao(req) {
  const cabecalho = req.headers['authorization'] || '';
  const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : '';
  const sessao = sessoes[token];
  if (!sessao) return null;
  if (sessao.expira < Date.now()) {
    delete sessoes[token];
    salvarJson(ARQUIVO_SESSOES, sessoes);
    return null;
  }
  const usuario = usuarios.find(u => u.id === sessao.usuarioId);
  return usuario ? { usuario, token } : null;
}

function dadosPublicos(usuario) {
  return { id: usuario.id, name: usuario.name, email: usuario.email, role: usuario.role, photo: usuario.photo || null };
}

/* ---------- Respostas ---------- */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Nome-Arquivo',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

function responderJson(res, status, dados) {
  res.writeHead(status, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, CORS));
  res.end(JSON.stringify(dados));
}

function lerBruto(req, limite) {
  return new Promise((resolve, reject) => {
    let tamanho = 0;
    const partes = [];
    req.on('data', parte => {
      tamanho += parte.length;
      if (tamanho > limite) {
        reject(new Error('muito_grande'));
        req.destroy();
        return;
      }
      partes.push(parte);
    });
    req.on('end', () => resolve(Buffer.concat(partes)));
    req.on('error', reject);
  });
}

async function lerCorpo(req) {
  const bruto = await lerBruto(req, TAMANHO_MAX_JSON);
  try {
    return JSON.parse(bruto.toString('utf8') || '{}');
  } catch (e) {
    throw new Error('json_invalido');
  }
}

const esperar = ms => new Promise(r => setTimeout(r, ms));
const texto = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
const numero = v => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? Math.round(n * 100) / 100 : null; };

// Só aceita arquivos enviados pelo Painel (ou vazio = padrão)
const arquivoValido = (url, exts) => url === '' || (typeof url === 'string' && /^\/arquivos\/[a-f0-9-]+\.[a-z0-9]+$/.test(url) && exts.includes(path.extname(url)));

function limparBeat(dados, anterior = {}) {
  const tags = Array.isArray(dados.tags) ? dados.tags : String(dados.tags || '').split(',');
  const beat = {
    id: anterior.id || crypto.randomUUID().slice(0, 8),
    title: texto(dados.title, 80),
    producer: texto(dados.producer, 80) || 'Prod. Rodrigo Arrezzi',
    genre: texto(dados.genre, 40),
    tags: tags.map(t => texto(t, 30)).filter(Boolean).slice(0, 6),
    duration: /^\d{1,2}:\d{2}$/.test(texto(dados.duration, 5)) ? texto(dados.duration, 5) : '0:00',
    bpm: numero(dados.bpm) ? Math.round(numero(dados.bpm)) : null,
    key: texto(dados.key, 10) || null,
    price: numero(dados.price),
    cover: arquivoValido(dados.cover, EXT_IMAGEM) ? dados.cover : (anterior.cover || ''),
    audio: arquivoValido(dados.audio, EXT_AUDIO) ? dados.audio : (anterior.audio || ''),
    featured: !!dados.featured,
    highlight: !!dados.highlight,
    criadoEm: anterior.criadoEm || new Date().toISOString()
  };
  if (!beat.tags.length && beat.genre) beat.tags = [beat.genre];
  return beat;
}

function apagarArquivoSeSemUso(url) {
  if (!url || !url.startsWith('/arquivos/')) return;
  const emUso = catalogo.beats.some(b => b.cover === url || b.audio === url) ||
    Object.values(catalogo.imagens).includes(url);
  if (!emUso) fs.unlink(path.join(PASTA_ARQUIVOS, path.basename(url)), () => {});
}

/* ---------- Rotas da API ---------- */

async function tratarApi(req, res, rota) {
  if (req.method === 'OPTIONS') return responderJson(res, 204, {});

  // Catálogo público (beats, licenças e imagens do site)
  if (rota === '/api/catalogo' && req.method === 'GET') {
    return responderJson(res, 200, catalogo);
  }

  // Criar conta
  if (rota === '/api/cadastro' && req.method === 'POST') {
    const corpo = await lerCorpo(req);
    const name = texto(corpo.name, 80);
    const email = texto(corpo.email, 120).toLowerCase();
    const password = String(corpo.password || '');

    if (!name || !email || !password) return responderJson(res, 400, { erro: 'Preencha todos os campos.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return responderJson(res, 400, { erro: 'E-mail inválido.' });
    if (password.length < 6) return responderJson(res, 400, { erro: 'A senha deve ter pelo menos 6 caracteres.' });
    if (EMAILS_DEV.includes(email)) return responderJson(res, 403, { erro: 'Este e-mail é reservado. Use outro e-mail.' });
    if (usuarios.some(u => u.email === email)) return responderJson(res, 409, { erro: 'Este e-mail já está cadastrado. Faça login!' });

    const novo = { id: crypto.randomUUID(), name, email, senha: gerarHashSenha(password), role: 'user', photo: null, criadoEm: new Date().toISOString() };
    usuarios.push(novo);
    salvarJson(ARQUIVO_USUARIOS, usuarios);
    const token = criarSessao(novo.id);
    console.log(`Nova conta: ${email}`);
    return responderJson(res, 201, { token, user: dadosPublicos(novo) });
  }

  // Entrar
  if (rota === '/api/login' && req.method === 'POST') {
    const corpo = await lerCorpo(req);
    const email = texto(corpo.email, 120).toLowerCase();
    const password = String(corpo.password || '');
    const usuario = usuarios.find(u => u.email === email);

    if (!usuario || !conferirSenha(password, usuario.senha)) {
      await esperar(800); // dificulta quem tenta adivinhar senhas
      return responderJson(res, 401, { erro: 'E-mail ou senha incorretos.' });
    }
    const token = criarSessao(usuario.id);
    return responderJson(res, 200, { token, user: dadosPublicos(usuario) });
  }

  // Quem está logado
  if (rota === '/api/eu' && req.method === 'GET') {
    const sessao = usuarioDaRequisicao(req);
    if (!sessao) return responderJson(res, 401, { erro: 'Sessão expirada. Faça login novamente.' });
    return responderJson(res, 200, { user: dadosPublicos(sessao.usuario) });
  }

  // Trocar foto de perfil
  if (rota === '/api/eu/foto' && req.method === 'PUT') {
    const sessao = usuarioDaRequisicao(req);
    if (!sessao) return responderJson(res, 401, { erro: 'Sessão expirada. Faça login novamente.' });
    const corpo = await lerCorpo(req);
    const photo = String(corpo.photo || '');
    if (!photo.startsWith('data:image/')) return responderJson(res, 400, { erro: 'Imagem inválida.' });
    sessao.usuario.photo = photo;
    salvarJson(ARQUIVO_USUARIOS, usuarios);
    return responderJson(res, 200, { user: dadosPublicos(sessao.usuario) });
  }

  // Sair
  if (rota === '/api/logout' && req.method === 'POST') {
    const sessao = usuarioDaRequisicao(req);
    if (sessao) {
      delete sessoes[sessao.token];
      salvarJson(ARQUIVO_SESSOES, sessoes);
    }
    return responderJson(res, 200, { ok: true });
  }

  /* ----- Painel (somente contas de desenvolvedor) ----- */
  if (rota.startsWith('/api/admin/')) {
    const sessao = usuarioDaRequisicao(req);
    if (!sessao) return responderJson(res, 401, { erro: 'Sessão expirada. Faça login novamente.' });
    if (sessao.usuario.role !== 'dev') return responderJson(res, 403, { erro: 'Acesso restrito à equipe.' });

    // Enviar arquivo (capa, imagem do site ou áudio)
    if (rota === '/api/admin/upload' && req.method === 'POST') {
      const nome = decodeURIComponent(String(req.headers['x-nome-arquivo'] || ''));
      const ext = path.extname(nome).toLowerCase();
      const ehImagem = EXT_IMAGEM.includes(ext);
      const ehAudio = EXT_AUDIO.includes(ext);
      if (!ehImagem && !ehAudio) return responderJson(res, 400, { erro: 'Formato não aceito. Use JPG, PNG, WEBP, MP3, WAV, M4A ou OGG.' });
      const conteudo = await lerBruto(req, ehAudio ? TAMANHO_MAX_AUDIO : TAMANHO_MAX_IMAGEM);
      if (!conteudo.length) return responderJson(res, 400, { erro: 'Arquivo vazio.' });
      const arquivo = crypto.randomUUID() + (ext === '.jpeg' ? '.jpg' : ext);
      fs.writeFileSync(path.join(PASTA_ARQUIVOS, arquivo), conteudo);
      return responderJson(res, 201, { url: '/arquivos/' + arquivo });
    }

    // Criar beat
    if (rota === '/api/admin/beats' && req.method === 'POST') {
      const beat = limparBeat(await lerCorpo(req));
      if (!beat.title || beat.price == null) return responderJson(res, 400, { erro: 'Informe pelo menos o nome e o preço do beat.' });
      if (beat.highlight) catalogo.beats.forEach(b => { b.highlight = false; });
      catalogo.beats.unshift(beat);
      salvarCatalogo();
      console.log(`Beat adicionado: ${beat.title}`);
      return responderJson(res, 201, { beat, catalogo });
    }

    // Editar ou apagar beat
    const matchBeat = rota.match(/^\/api\/admin\/beats\/([a-z0-9-]+)$/);
    if (matchBeat) {
      const idx = catalogo.beats.findIndex(b => b.id === matchBeat[1]);
      if (idx === -1) return responderJson(res, 404, { erro: 'Beat não encontrado.' });
      const anterior = catalogo.beats[idx];

      if (req.method === 'PUT') {
        const beat = limparBeat(await lerCorpo(req), anterior);
        if (!beat.title || beat.price == null) return responderJson(res, 400, { erro: 'Informe pelo menos o nome e o preço do beat.' });
        if (beat.highlight) catalogo.beats.forEach(b => { b.highlight = false; });
        catalogo.beats[idx] = beat;
        salvarCatalogo();
        if (anterior.cover !== beat.cover) apagarArquivoSeSemUso(anterior.cover);
        if (anterior.audio !== beat.audio) apagarArquivoSeSemUso(anterior.audio);
        return responderJson(res, 200, { beat, catalogo });
      }
      if (req.method === 'DELETE') {
        catalogo.beats.splice(idx, 1);
        salvarCatalogo();
        apagarArquivoSeSemUso(anterior.cover);
        apagarArquivoSeSemUso(anterior.audio);
        console.log(`Beat removido: ${anterior.title}`);
        return responderJson(res, 200, { ok: true, catalogo });
      }
    }

    // Imagens do site
    if (rota === '/api/admin/imagens' && req.method === 'PUT') {
      const corpo = await lerCorpo(req);
      const antigas = Object.assign({}, catalogo.imagens);
      Object.keys(IMAGENS_PADRAO).forEach(chave => {
        if (chave in corpo && arquivoValido(corpo[chave], EXT_IMAGEM)) catalogo.imagens[chave] = corpo[chave];
      });
      salvarCatalogo();
      Object.values(antigas).forEach(apagarArquivoSeSemUso);
      return responderJson(res, 200, { catalogo });
    }

    // Licenças
    if (rota === '/api/admin/licencas' && req.method === 'PUT') {
      const corpo = await lerCorpo(req);
      if (!Array.isArray(corpo.licencas)) return responderJson(res, 400, { erro: 'Dados inválidos.' });
      catalogo.licencas = catalogo.licencas.map(atual => {
        const nova = corpo.licencas.find(l => l.id === atual.id);
        if (!nova) return atual;
        return Object.assign({}, atual, {
          name: texto(nova.name, 60) || atual.name,
          label: texto(nova.label, 40) || atual.label,
          description: texto(nova.description, 240),
          price: atual.exclusive ? null : (numero(nova.price) ?? atual.price),
          features: (Array.isArray(nova.features) ? nova.features : []).map(f => texto(f, 80)).filter(Boolean).slice(0, 8),
          cta: texto(nova.cta, 40) || atual.cta
        });
      });
      salvarCatalogo();
      return responderJson(res, 200, { catalogo });
    }

    return responderJson(res, 404, { erro: 'Rota não encontrada.' });
  }

  return responderJson(res, 404, { erro: 'Rota não encontrada.' });
}

/* ---------- Arquivos do site ---------- */

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4'
};

function enviarArquivo(req, res, caminho) {
  fs.stat(caminho, (erro, info) => {
    if (erro || !info.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Página não encontrada');
    }
    const tipo = TIPOS[path.extname(caminho).toLowerCase()] || 'application/octet-stream';
    const cabecalhos = { 'Content-Type': tipo, 'Accept-Ranges': 'bytes', 'Access-Control-Allow-Origin': '*' };
    const faixa = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');

    // Suporte a "Range" para o player de áudio poder avançar/voltar
    if (faixa) {
      const inicio = faixa[1] ? parseInt(faixa[1], 10) : 0;
      const fim = faixa[2] ? Math.min(parseInt(faixa[2], 10), info.size - 1) : info.size - 1;
      if (inicio >= info.size || inicio > fim) {
        res.writeHead(416, { 'Content-Range': `bytes */${info.size}` });
        return res.end();
      }
      res.writeHead(206, Object.assign(cabecalhos, { 'Content-Range': `bytes ${inicio}-${fim}/${info.size}`, 'Content-Length': fim - inicio + 1 }));
      return fs.createReadStream(caminho, { start: inicio, end: fim }).pipe(res);
    }
    res.writeHead(200, Object.assign(cabecalhos, { 'Content-Length': info.size }));
    fs.createReadStream(caminho).pipe(res);
  });
}

function servirArquivo(req, res, rota) {
  // Arquivos enviados pelo Painel
  if (rota.startsWith('/arquivos/')) {
    const nome = path.basename(rota);
    if (!/^[a-f0-9-]+\.[a-z0-9]+$/.test(nome)) { res.writeHead(404); return res.end(); }
    return enviarArquivo(req, res, path.join(PASTA_ARQUIVOS, nome));
  }

  let caminho = path.normalize(path.join(PASTA_SITE, decodeURIComponent(rota)));

  // Bloqueia acesso fora da pasta do site, aos dados das contas e a pastas ocultas (.git)
  const relativo = path.relative(PASTA_SITE, caminho);
  const partes = relativo.split(path.sep);
  if (relativo.startsWith('..') || path.isAbsolute(relativo) ||
      partes[0] === 'dados' || partes.some(p => p.startsWith('.'))) {
    res.writeHead(403);
    return res.end('Acesso negado');
  }

  if (fs.existsSync(caminho) && fs.statSync(caminho).isDirectory()) {
    caminho = path.join(caminho, 'index.html');
  }
  enviarArquivo(req, res, caminho);
}

/* ---------- Servidor ---------- */

const servidor = http.createServer(async (req, res) => {
  const rota = new URL(req.url, 'http://localhost').pathname;
  try {
    if (rota.startsWith('/api/')) return await tratarApi(req, res, rota);
    return servirArquivo(req, res, rota);
  } catch (erro) {
    if (erro.message === 'muito_grande') return responderJson(res, 413, { erro: 'Arquivo muito grande.' });
    if (erro.message === 'json_invalido') return responderJson(res, 400, { erro: 'Dados inválidos.' });
    console.error(erro);
    return responderJson(res, 500, { erro: 'Erro no servidor.' });
  }
});

servidor.listen(PORTA, () => {
  const devs = usuarios.filter(u => u.role === 'dev').map(u => u.email);
  console.log('');
  console.log('  Site rodando em:  http://localhost:' + PORTA);
  console.log('  Dados salvos em:  ' + PASTA_DADOS);
  console.log('  Contas dev:       ' + (devs.length ? devs.join(', ') : 'nenhuma (use: node server.js criar-dev ...)'));
  console.log('  Para desligar:    Ctrl + C');
  console.log('');
});
