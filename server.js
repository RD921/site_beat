/* ==========================================================================
   SERVIDOR LOCAL — WOAH COLLECTION
   Serve o site e guarda as contas no seu computador (pasta "dados").
   Não precisa instalar nada além do Node.js.

   Para ligar:   node server.js
   Para abrir:   http://localhost:3000
   Para desligar: Ctrl + C
   ========================================================================== */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORTA = 3000;
const PASTA_SITE = __dirname;
const PASTA_DADOS = path.join(__dirname, 'dados');
const ARQUIVO_USUARIOS = path.join(PASTA_DADOS, 'usuarios.json');
const ARQUIVO_SESSOES = path.join(PASTA_DADOS, 'sessoes.json');

// E-mails que viram conta de desenvolvedor (dev) ao se cadastrar.
// Coloque aqui os e-mails da equipe. Nenhuma senha fica no código.
const EMAILS_DEV = [
  'max@criativo.eft.com',
  'carlos@marketing.aluno.com',
  'rodrigo@ceo.com'
];

const DIAS_SESSAO = 30;
const TAMANHO_MAX_CORPO = 4 * 1024 * 1024; // 4 MB (foto de perfil de até 2 MB)

/* ---------- Arquivos de dados ---------- */

if (!fs.existsSync(PASTA_DADOS)) fs.mkdirSync(PASTA_DADOS, { recursive: true });

function lerJson(arquivo, padrao) {
  try {
    return JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  } catch (e) {
    return padrao;
  }
}

function salvarJson(arquivo, dados) {
  const temporario = arquivo + '.tmp';
  fs.writeFileSync(temporario, JSON.stringify(dados, null, 2), 'utf8');
  fs.renameSync(temporario, arquivo);
}

let usuarios = lerJson(ARQUIVO_USUARIOS, []);
let sessoes = lerJson(ARQUIVO_SESSOES, {});

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
  return {
    id: usuario.id,
    name: usuario.name,
    email: usuario.email,
    role: usuario.role,
    photo: usuario.photo || null
  };
}

/* ---------- Respostas ---------- */

function responderJson(res, status, dados) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS'
  });
  res.end(JSON.stringify(dados));
}

function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    let tamanho = 0;
    const partes = [];
    req.on('data', parte => {
      tamanho += parte.length;
      if (tamanho > TAMANHO_MAX_CORPO) {
        reject(new Error('muito_grande'));
        req.destroy();
        return;
      }
      partes.push(parte);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(partes).toString('utf8') || '{}'));
      } catch (e) {
        reject(new Error('json_invalido'));
      }
    });
    req.on('error', reject);
  });
}

const esperar = ms => new Promise(r => setTimeout(r, ms));

/* ---------- Rotas da API ---------- */

async function tratarApi(req, res, rota) {
  if (req.method === 'OPTIONS') return responderJson(res, 204, {});

  // Criar conta
  if (rota === '/api/cadastro' && req.method === 'POST') {
    const corpo = await lerCorpo(req);
    const name = String(corpo.name || '').trim().slice(0, 80);
    const email = String(corpo.email || '').trim().toLowerCase();
    const password = String(corpo.password || '');

    if (!name || !email || !password) return responderJson(res, 400, { erro: 'Preencha todos os campos.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return responderJson(res, 400, { erro: 'E-mail inválido.' });
    if (password.length < 6) return responderJson(res, 400, { erro: 'A senha deve ter pelo menos 6 caracteres.' });
    if (usuarios.some(u => u.email === email)) return responderJson(res, 409, { erro: 'Este e-mail já está cadastrado. Faça login!' });

    const novo = {
      id: crypto.randomUUID(),
      name,
      email,
      senha: gerarHashSenha(password),
      role: EMAILS_DEV.includes(email) ? 'dev' : 'user',
      photo: null,
      criadoEm: new Date().toISOString()
    };
    usuarios.push(novo);
    salvarJson(ARQUIVO_USUARIOS, usuarios);

    const token = criarSessao(novo.id);
    console.log(`Nova conta: ${email}${novo.role === 'dev' ? ' (dev)' : ''}`);
    return responderJson(res, 201, { token, user: dadosPublicos(novo) });
  }

  // Entrar
  if (rota === '/api/login' && req.method === 'POST') {
    const corpo = await lerCorpo(req);
    const email = String(corpo.email || '').trim().toLowerCase();
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

function servirArquivo(res, rota) {
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

  fs.readFile(caminho, (erro, conteudo) => {
    if (erro) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Página não encontrada');
    }
    const tipo = TIPOS[path.extname(caminho).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': tipo });
    res.end(conteudo);
  });
}

/* ---------- Servidor ---------- */

const servidor = http.createServer(async (req, res) => {
  const rota = new URL(req.url, 'http://localhost').pathname;
  try {
    if (rota.startsWith('/api/')) return await tratarApi(req, res, rota);
    return servirArquivo(res, rota);
  } catch (erro) {
    if (erro.message === 'muito_grande') return responderJson(res, 413, { erro: 'Arquivo muito grande.' });
    if (erro.message === 'json_invalido') return responderJson(res, 400, { erro: 'Dados inválidos.' });
    console.error(erro);
    return responderJson(res, 500, { erro: 'Erro no servidor.' });
  }
});

servidor.listen(PORTA, () => {
  console.log('');
  console.log('  Site rodando em:  http://localhost:' + PORTA);
  console.log('  Contas salvas em: ' + ARQUIVO_USUARIOS);
  console.log('  Para desligar:    Ctrl + C');
  console.log('');
});
