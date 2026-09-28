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

// Na hospedagem (Render), os dados ficam no MongoDB Atlas: conecta primeiro e depois inicia o site
if (process.env.MONGODB_URI && !global.__WOAH_MONGO) {
  const store = require('./mongo-store');
  store.preparar(process.env.MONGODB_URI).then(() => {
    global.__WOAH_MONGO = store;
    delete require.cache[__filename];
    require(__filename);
  }).catch(erro => {
    console.error('Não foi possível conectar ao MongoDB:', erro.message);
    process.exit(1);
  });
  return;
}
const MONGO = global.__WOAH_MONGO || null;

// A hospedagem define a porta pela variável PORT; no seu computador usa 3000
const PORTA = parseInt(process.env.PORT, 10) || 3000;
const PASTA_SITE = __dirname;
// Pasta dos dados. Na hospedagem, aponte DADOS_DIR para o disco permanente (volume)
const PASTA_DADOS = process.env.DADOS_DIR ? path.resolve(process.env.DADOS_DIR) : path.join(__dirname, 'dados');
const PASTA_ARQUIVOS = path.join(PASTA_DADOS, 'arquivos'); // capas e áudios enviados pelo Painel
const ARQUIVO_USUARIOS = path.join(PASTA_DADOS, 'usuarios.json');
const ARQUIVO_SESSOES = path.join(PASTA_DADOS, 'sessoes.json');
const ARQUIVO_CATALOGO = path.join(PASTA_DADOS, 'catalogo.json');
const ARQUIVO_PEDIDOS = path.join(PASTA_DADOS, 'pedidos.json');

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
// Arquivo que o cliente recebe depois de pagar (fica privado, nunca aparece no catálogo)
const EXT_ENTREGA = ['.zip', '.rar', '.wav', '.mp3', '.flac', '.aiff', '.m4a'];
const TAMANHO_MAX_ENTREGA = 150 * 1024 * 1024;  // 150 MB

/* ---------- Mercado Pago (chaves só nas variáveis de ambiente, nunca no código) ---------- */
const MP_ACCESS_TOKEN = String(process.env.MP_ACCESS_TOKEN || '').trim();
const MP_PUBLIC_KEY = String(process.env.MP_PUBLIC_KEY || '').trim();
const MP_WEBHOOK_SECRET = String(process.env.MP_WEBHOOK_SECRET || '').trim();
const MP_API = String(process.env.MP_API_BASE || 'https://api.mercadopago.com').replace(/\/+$/, '');
const SITE_URL = String(process.env.SITE_URL || '').trim().replace(/\/+$/, '');
const pagamentoAtivo = () => !!(MP_ACCESS_TOKEN && MP_PUBLIC_KEY);

// Contato e redes sociais (editáveis pelo Painel)
const CONTATO_PADRAO = {
  whatsapp: '5527995055702',
  telefone: '',
  email: 'rodrigoarrezzimaciel17@gmail.com',
  instagram: 'https://www.instagram.com/rodrigo_arrezzi',
  spotify: ''
};

// Imagens do site que podem ser trocadas pelo Painel (vazio = imagem padrão)
const IMAGENS_PADRAO = { hero: '', promo: '', login: '', cadastro: '', logo: '' };

/* ---------- Arquivos de dados ---------- */

fs.mkdirSync(PASTA_ARQUIVOS, { recursive: true });

const chaveMongo = arquivo => path.basename(arquivo, '.json');

function lerJson(arquivo, padrao) {
  if (MONGO) {
    const valor = MONGO.ler(chaveMongo(arquivo));
    return valor === undefined ? padrao : valor;
  }
  try {
    return JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  } catch (e) {
    return padrao;
  }
}

// Salva com segurança. No Windows, o OneDrive ou o antivírus às vezes "seguram"
// o arquivo por um instante; então tenta de novo e, se precisar, grava direto.
function salvarJson(arquivo, dados) {
  if (MONGO) { MONGO.salvar(chaveMongo(arquivo), dados); return; }
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
let pedidos = lerJson(ARQUIVO_PEDIDOS, []);
const salvarPedidos = () => salvarJson(ARQUIVO_PEDIDOS, pedidos);
let catalogo = lerJson(ARQUIVO_CATALOGO, null) || { versao: 2, beats: [], licencas: [], imagens: IMAGENS_PADRAO };
catalogo.beats = catalogo.beats || [];
// Versão 2: as licenças começam vazias (a equipe cadastra as novas pelo Painel)
if ((catalogo.versao || 1) < 2) { catalogo.licencas = []; catalogo.versao = 2; if (MONGO || fs.existsSync(ARQUIVO_CATALOGO)) salvarJson(ARQUIVO_CATALOGO, catalogo); }
catalogo.licencas = catalogo.licencas || [];
catalogo.imagens = Object.assign({}, IMAGENS_PADRAO, catalogo.imagens || {});
catalogo.contato = Object.assign({}, CONTATO_PADRAO, catalogo.contato || {});

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

// Contas da equipe pela variável WOAH_DEVS (para hospedagens sem terminal).
// Formato: email|senha|Nome;email2|senha2|Nome2  — configure no painel da hospedagem, nunca no código.
if (process.env.WOAH_DEVS) {
  let mudou = false;
  process.env.WOAH_DEVS.split(';').map(x => x.trim()).filter(Boolean).forEach(item => {
    const [emailBruto, senha, nome] = item.split('|');
    const email = String(emailBruto || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !senha || senha.length < 6) return;
    let conta = usuarios.find(u => u.email === email);
    if (!conta) {
      conta = { id: crypto.randomUUID(), name: (nome || email.split('@')[0]).trim(), email, senha: gerarHashSenha(senha), role: 'dev', devCli: true, photo: null, criadoEm: new Date().toISOString() };
      usuarios.push(conta);
      mudou = true;
    } else if (!conta.devCli || conta.role !== 'dev' || !conferirSenha(senha, conta.senha)) {
      conta.senha = gerarHashSenha(senha);
      conta.role = 'dev';
      conta.devCli = true;
      mudou = true;
    }
  });
  if (mudou) salvarJson(ARQUIVO_USUARIOS, usuarios);
}

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
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Nome-Arquivo, X-Tipo-Arquivo',
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
const entregaValida = url => typeof url === 'string' && /^\/arquivos\/entrega-[a-f0-9-]+\.[a-z0-9]+$/.test(url) && EXT_ENTREGA.includes(path.extname(url));

// Catálogo que qualquer visitante vê: sem os arquivos de entrega (esses só depois de pagar)
function catalogoPublico() {
  return Object.assign({}, catalogo, { beats: catalogo.beats.map(b => { const { entrega, ...resto } = b; return resto; }) });
}

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
    entrega: dados.entrega === '' ? '' : (entregaValida(dados.entrega) ? dados.entrega : (anterior.entrega || '')),
    featured: !!dados.featured,
    highlight: !!dados.highlight,
    criadoEm: anterior.criadoEm || new Date().toISOString()
  };
  if (!beat.tags.length && beat.genre) beat.tags = [beat.genre];
  return beat;
}

function apagarArquivoSeSemUso(url) {
  if (!url || !url.startsWith('/arquivos/')) return;
  const emUso = catalogo.beats.some(b => b.cover === url || b.audio === url || b.entrega === url) ||
    Object.values(catalogo.imagens).includes(url);
  if (emUso) return;
  if (MONGO) MONGO.apagarArquivo(path.basename(url)).catch(() => {});
  else fs.unlink(path.join(PASTA_ARQUIVOS, path.basename(url)), () => {});
}


/* ---------- Pagamentos (Mercado Pago — Checkout Bricks) ---------- */

const STATUS_PEDIDO = {
  approved: 'pago',
  authorized: 'pendente',
  pending: 'pendente',
  in_process: 'pendente',
  in_mediation: 'pendente',
  rejected: 'recusado',
  cancelled: 'cancelado',
  refunded: 'reembolsado',
  charged_back: 'reembolsado'
};

const MENSAGENS_RECUSA = {
  cc_rejected_insufficient_amount: 'Saldo ou limite insuficiente.',
  cc_rejected_bad_filled_security_code: 'Código de segurança (CVV) incorreto.',
  cc_rejected_bad_filled_date: 'Data de validade incorreta.',
  cc_rejected_bad_filled_card_number: 'Número do cartão incorreto.',
  cc_rejected_bad_filled_other: 'Confira os dados do cartão.',
  cc_rejected_call_for_authorize: 'Autorize o pagamento com o banco do cartão e tente de novo.',
  cc_rejected_card_disabled: 'Cartão desativado. Ligue para o banco para ativá-lo.',
  cc_rejected_duplicated_payment: 'Você já fez um pagamento com esse valor. Use outro cartão ou forma de pagamento.',
  cc_rejected_high_risk: 'Pagamento recusado por segurança. Tente outro cartão ou o Pix.',
  cc_rejected_max_attempts: 'Limite de tentativas atingido. Tente outro cartão.',
  cc_rejected_blacklist: 'Pagamento recusado. Tente outro cartão ou o Pix.',
  cc_rejected_other_reason: 'O banco recusou o pagamento. Tente outro cartão ou o Pix.'
};

async function chamarMercadoPago(metodo, caminho, corpo, idempotencia) {
  const cabecalhos = { 'Authorization': 'Bearer ' + MP_ACCESS_TOKEN, 'Content-Type': 'application/json' };
  if (idempotencia) cabecalhos['X-Idempotency-Key'] = idempotencia;
  const resposta = await fetch(MP_API + caminho, { method: metodo, headers: cabecalhos, body: corpo ? JSON.stringify(corpo) : undefined });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const erro = new Error('mercadopago');
    erro.status = resposta.status;
    erro.dados = dados;
    throw erro;
  }
  return dados;
}

// Monta os itens do pedido com os preços do SERVIDOR (nunca confia no preço vindo do navegador)
function montarItens(lista) {
  if (!Array.isArray(lista) || !lista.length || lista.length > 20) return { erro: 'Pedido vazio.' };
  const itens = [];
  for (const bruto of lista) {
    const beat = catalogo.beats.find(b => b.id === String(bruto && bruto.beatId || ''));
    if (!beat || beat.price == null) return { erro: 'Um dos beats não está mais à venda. Atualize a página.' };
    let licenca = null;
    if (bruto.licencaId) {
      licenca = catalogo.licencas.find(l => l.id === String(bruto.licencaId));
      if (!licenca || licenca.exclusive || licenca.price == null) return { erro: 'Essa licença não está disponível para compra online.' };
    }
    if (itens.some(i => i.beatId === beat.id)) continue;
    itens.push({
      beatId: beat.id,
      titulo: beat.title,
      capa: beat.cover || '',
      licencaId: licenca ? licenca.id : '',
      licencaNome: licenca ? licenca.name : 'Padrão',
      preco: licenca ? licenca.price : beat.price
    });
  }
  const total = Math.round(itens.reduce((soma, i) => soma + i.preco, 0) * 100) / 100;
  if (!(total > 0)) return { erro: 'O valor do pedido precisa ser maior que zero.' };
  return { itens, total };
}

function pedidoPublico(p) {
  const pg = p.pagamento || {};
  return {
    id: p.id,
    numero: p.numero,
    status: p.status,
    total: p.total,
    itens: p.itens.map(i => ({ beatId: i.beatId, titulo: i.titulo, capa: i.capa, licencaNome: i.licencaNome, preco: i.preco })),
    metodo: pg.metodo || '',
    detalhe: p.status === 'recusado' ? (MENSAGENS_RECUSA[pg.statusDetalhe] || 'Pagamento recusado. Tente outra forma de pagamento.') : '',
    pix: p.status === 'pendente' && pg.pix ? pg.pix : null,
    boleto: p.status === 'pendente' && pg.boleto ? pg.boleto : null,
    criadoEm: p.criadoEm,
    pagoEm: p.pagoEm || null
  };
}

// Atualiza o pedido com os dados de um pagamento do Mercado Pago
function aplicarPagamento(pedido, pg) {
  const antes = pedido.status;
  const dadosTx = (pg.point_of_interaction && pg.point_of_interaction.transaction_data) || {};
  pedido.pagamento = Object.assign(pedido.pagamento || {}, {
    id: String(pg.id),
    metodo: pg.payment_type_id === 'bank_transfer' ? 'pix' : (pg.payment_type_id || pg.payment_method_id || ''),
    bandeira: pg.payment_method_id || '',
    parcelas: pg.installments || 1,
    status: pg.status,
    statusDetalhe: pg.status_detail || '',
    atualizadoEm: new Date().toISOString()
  });
  if (dadosTx.qr_code) {
    pedido.pagamento.pix = { copiaECola: dadosTx.qr_code, qrBase64: dadosTx.qr_code_base64 || '', link: dadosTx.ticket_url || '', expira: pg.date_of_expiration || null };
  }
  if (pg.payment_type_id === 'ticket' && pg.transaction_details && pg.transaction_details.external_resource_url) {
    pedido.pagamento.boleto = { link: pg.transaction_details.external_resource_url, expira: pg.date_of_expiration || null };
  }
  // Só aceita como pago se o valor pago bate com o total do pedido
  let novo = STATUS_PEDIDO[pg.status] || 'pendente';
  if (novo === 'pago' && Math.abs(Number(pg.transaction_amount) - pedido.total) > 0.01) {
    console.error(`Pedido ${pedido.numero}: valor pago (${pg.transaction_amount}) diferente do total (${pedido.total}).`);
    novo = 'pendente';
  }
  pedido.status = novo;
  if (novo === 'pago' && !pedido.pagoEm) pedido.pagoEm = new Date().toISOString();
  if (antes !== novo) console.log(`Pedido ${pedido.numero}: ${antes} → ${novo}`);
  salvarPedidos();
}

async function atualizarDoMercadoPago(pedido) {
  if (!pedido.pagamento || !pedido.pagamento.id || !pagamentoAtivo()) return;
  const pg = await chamarMercadoPago('GET', '/v1/payments/' + encodeURIComponent(pedido.pagamento.id));
  aplicarPagamento(pedido, pg);
}

// Links de download temporários (10 minutos), para o botão funcionar até no celular
const linksDownload = new Map();
function criarLinkDownload(pedido, indice) {
  const token = crypto.randomBytes(24).toString('hex');
  linksDownload.set(token, { pedidoId: pedido.id, indice, expira: Date.now() + 10 * 60 * 1000 });
  for (const [t, l] of linksDownload) if (l.expira < Date.now()) linksDownload.delete(t);
  return '/api/download/' + token;
}

function nomeParaArquivo(textoLivre) {
  return String(textoLivre).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w\s.-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80) || 'beat';
}

async function enviarDownload(req, res, pedido, indice) {
  const item = pedido.itens[indice];
  const beat = item && catalogo.beats.find(b => b.id === item.beatId);
  const arquivo = beat && (beat.entrega || beat.audio);
  if (!arquivo) return responderJson(res, 404, { erro: 'O arquivo deste beat ainda não foi enviado. Fale com o suporte.' });
  const nomeInterno = path.basename(arquivo);
  const ext = path.extname(nomeInterno);
  const nomeFinal = nomeParaArquivo(item.titulo + ' - ' + item.licencaNome) + ext;
  const cabecalhos = {
    'Content-Type': TIPOS[ext] || 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${nomeFinal}"; filename*=UTF-8''${encodeURIComponent(nomeFinal)}`,
    'Cache-Control': 'no-store'
  };
  if (MONGO) {
    const info = await MONGO.infoArquivo(nomeInterno);
    if (!info) return responderJson(res, 404, { erro: 'Arquivo não encontrado. Fale com o suporte.' });
    res.writeHead(200, Object.assign(cabecalhos, { 'Content-Length': info.length }));
    const fluxo = MONGO.lerArquivo(nomeInterno);
    fluxo.on('error', () => res.destroy());
    return fluxo.pipe(res);
  }
  const caminho = path.join(PASTA_ARQUIVOS, nomeInterno);
  if (!fs.existsSync(caminho)) return responderJson(res, 404, { erro: 'Arquivo não encontrado. Fale com o suporte.' });
  res.writeHead(200, Object.assign(cabecalhos, { 'Content-Length': fs.statSync(caminho).size }));
  fs.createReadStream(caminho).pipe(res);
}

// Confere a assinatura do aviso do Mercado Pago (quando MP_WEBHOOK_SECRET está configurado)
function avisoAutentico(req, idPagamento) {
  if (!MP_WEBHOOK_SECRET) return true;
  const assinatura = String(req.headers['x-signature'] || '');
  const partes = Object.fromEntries(assinatura.split(',').map(x => x.trim().split('=')));
  if (!partes.ts || !partes.v1) return false;
  const manifesto = `id:${String(idPagamento).toLowerCase()};request-id:${req.headers['x-request-id'] || ''};ts:${partes.ts};`;
  const esperado = crypto.createHmac('sha256', MP_WEBHOOK_SECRET).update(manifesto).digest('hex');
  return esperado.length === partes.v1.length && crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(partes.v1));
}

// Devolve false quando a rota não é de pagamento
async function tratarPagamentos(req, res, rota) {
  // Chave pública para o formulário de pagamento
  if (rota === '/api/pagamento/config' && req.method === 'GET') {
    return responderJson(res, 200, { ativo: pagamentoAtivo(), publicKey: pagamentoAtivo() ? MP_PUBLIC_KEY : '', teste: MP_PUBLIC_KEY.startsWith('TEST-') });
  }

  // Aviso automático do Mercado Pago (webhook)
  if (rota === '/api/mercadopago/webhook' && req.method === 'POST') {
    const corpo = await lerCorpo(req).catch(() => ({}));
    const url = new URL(req.url, 'http://localhost');
    const tipo = corpo.type || corpo.topic || url.searchParams.get('type') || url.searchParams.get('topic');
    const idPagamento = (corpo.data && corpo.data.id) || url.searchParams.get('data.id') || url.searchParams.get('id');
    responderJson(res, 200, { ok: true });
    if (tipo !== 'payment' || !idPagamento || !pagamentoAtivo()) return;
    if (!avisoAutentico(req, url.searchParams.get('data.id') || idPagamento)) { console.error('Aviso do Mercado Pago com assinatura inválida.'); return; }
    try {
      // Nunca confia no conteúdo do aviso: busca o pagamento direto no Mercado Pago
      const pg = await chamarMercadoPago('GET', '/v1/payments/' + encodeURIComponent(idPagamento));
      const pedido = pedidos.find(p => p.id === pg.external_reference);
      if (pedido) aplicarPagamento(pedido, pg);
    } catch (erro) {
      console.error('Erro ao consultar pagamento do aviso:', erro.status || erro.message);
    }
    return;
  }

  // Download por link temporário
  const matchLink = rota.match(/^\/api\/download\/([a-f0-9]{48})$/);
  if (matchLink && req.method === 'GET') {
    const link = linksDownload.get(matchLink[1]);
    if (!link || link.expira < Date.now()) return responderJson(res, 410, { erro: 'Link expirado. Volte em "Minhas compras" e clique em baixar de novo.' });
    const pedido = pedidos.find(p => p.id === link.pedidoId);
    if (!pedido || pedido.status !== 'pago') return responderJson(res, 403, { erro: 'Pedido não liberado.' });
    return enviarDownload(req, res, pedido, link.indice);
  }

  const ehRotaDePedido = rota === '/api/pagamentos' || rota === '/api/meus-pedidos' || rota.startsWith('/api/pedidos/');
  if (!ehRotaDePedido) return false;

  const sessao = usuarioDaRequisicao(req);
  if (!sessao) return responderJson(res, 401, { erro: 'Sessão expirada. Faça login novamente.' });
  const usuario = sessao.usuario;

  // Pagar (cria o pedido e envia o pagamento ao Mercado Pago)
  if (rota === '/api/pagamentos' && req.method === 'POST') {
    if (!pagamentoAtivo()) return responderJson(res, 503, { erro: 'Pagamentos ainda não configurados. Fale com o suporte.' });
    const corpo = await lerCorpo(req);
    const montagem = montarItens(corpo.itens);
    if (montagem.erro) return responderJson(res, 400, { erro: montagem.erro });
    const dados = corpo.formData || {};
    const metodo = texto(dados.payment_method_id, 40);
    if (!metodo) return responderJson(res, 400, { erro: 'Escolha uma forma de pagamento.' });

    const pedido = {
      id: crypto.randomUUID(),
      numero: 'W' + Date.now().toString(36).toUpperCase().slice(-6) + crypto.randomBytes(1).toString('hex').toUpperCase(),
      usuarioId: usuario.id,
      email: usuario.email,
      itens: montagem.itens,
      total: montagem.total,
      status: 'aguardando',
      criadoEm: new Date().toISOString()
    };
    pedidos.push(pedido);
    salvarPedidos();

    const pagadorBruto = dados.payer || {};
    const pagador = { email: texto(pagadorBruto.email, 120) || usuario.email };
    if (pagadorBruto.identification && pagadorBruto.identification.number) {
      pagador.identification = { type: texto(pagadorBruto.identification.type, 10) || 'CPF', number: texto(pagadorBruto.identification.number, 20).replace(/\D/g, '') };
    }
    if (pagadorBruto.first_name) pagador.first_name = texto(pagadorBruto.first_name, 60);
    if (pagadorBruto.last_name) pagador.last_name = texto(pagadorBruto.last_name, 60);
    if (pagadorBruto.address && typeof pagadorBruto.address === 'object') {
      const e = pagadorBruto.address;
      pagador.address = { zip_code: texto(e.zip_code, 12), street_name: texto(e.street_name, 120), street_number: texto(e.street_number, 12), neighborhood: texto(e.neighborhood, 80), city: texto(e.city, 80), federal_unit: texto(e.federal_unit, 2) };
    }

    const base = SITE_URL || ('https://' + String(req.headers['x-forwarded-host'] || req.headers.host || ''));
    const envio = {
      transaction_amount: pedido.total,
      description: ('Woah Collection — ' + pedido.itens.map(i => i.titulo).join(', ')).slice(0, 250),
      payment_method_id: metodo,
      payer: pagador,
      external_reference: pedido.id,
      statement_descriptor: 'WOAHCOLLECTION',
      metadata: { pedido: pedido.numero }
    };
    if (/^https:\/\/[^/]+\.[^/]+/.test(base) && !/localhost|127\.0\.0\.1/.test(base)) envio.notification_url = base + '/api/mercadopago/webhook';
    if (dados.token) envio.token = texto(dados.token, 100);
    if (dados.issuer_id) envio.issuer_id = texto(dados.issuer_id, 20);
    if (dados.installments) envio.installments = Math.max(1, Math.min(12, parseInt(dados.installments, 10) || 1));

    try {
      const pg = await chamarMercadoPago('POST', '/v1/payments', envio, pedido.id);
      aplicarPagamento(pedido, pg);
      return responderJson(res, 200, { pedido: pedidoPublico(pedido) });
    } catch (erro) {
      pedido.status = 'recusado';
      pedido.pagamento = { statusDetalhe: 'erro_envio' };
      salvarPedidos();
      console.error('Erro do Mercado Pago:', erro.status || '', JSON.stringify(erro.dados || erro.message));
      const causa = erro.dados && Array.isArray(erro.dados.cause) && erro.dados.cause[0] ? erro.dados.cause[0].description : '';
      return responderJson(res, 502, { erro: 'Não foi possível processar o pagamento' + (causa ? ': ' + causa : '.') + ' Confira os dados e tente de novo.' });
    }
  }

  // Minhas compras
  if (rota === '/api/meus-pedidos' && req.method === 'GET') {
    const meus = pedidos.filter(p => p.usuarioId === usuario.id && !['aguardando', 'recusado', 'cancelado'].includes(p.status)).slice(-100).reverse();
    return responderJson(res, 200, { pedidos: meus.map(pedidoPublico) });
  }

  const matchPedido = rota.match(/^\/api\/pedidos\/([a-f0-9-]{36})(?:\/itens\/(\d{1,2})\/download)?$/);
  if (matchPedido) {
    const pedido = pedidos.find(p => p.id === matchPedido[1]);
    if (!pedido || (pedido.usuarioId !== usuario.id && usuario.role !== 'dev')) return responderJson(res, 404, { erro: 'Pedido não encontrado.' });

    // Situação do pedido (o site pergunta a cada poucos segundos enquanto o Pix não é pago)
    if (!matchPedido[2] && req.method === 'GET') {
      const ultima = pedido.pagamento && pedido.pagamento.atualizadoEm ? Date.parse(pedido.pagamento.atualizadoEm) : 0;
      if (pedido.status === 'pendente' && Date.now() - ultima > 8000) {
        try { await atualizarDoMercadoPago(pedido); } catch (e) { /* tenta de novo na próxima */ }
      }
      return responderJson(res, 200, { pedido: pedidoPublico(pedido) });
    }

    // Gerar link de download de um item pago
    if (matchPedido[2] && req.method === 'POST') {
      if (pedido.status !== 'pago') return responderJson(res, 403, { erro: 'O download é liberado assim que o pagamento for confirmado.' });
      const indice = parseInt(matchPedido[2], 10);
      if (!pedido.itens[indice]) return responderJson(res, 404, { erro: 'Item não encontrado.' });
      return responderJson(res, 200, { url: criarLinkDownload(pedido, indice) });
    }
  }

  return responderJson(res, 404, { erro: 'Rota não encontrada.' });
}

/* ---------- Rotas da API ---------- */

async function tratarApi(req, res, rota) {
  if (req.method === 'OPTIONS') return responderJson(res, 204, {});

  // Catálogo público (beats, licenças e imagens do site)
  if (rota === '/api/catalogo' && req.method === 'GET') {
    return responderJson(res, 200, catalogoPublico());
  }

  // Pagamentos, pedidos e downloads (Mercado Pago)
  const pagamento = await tratarPagamentos(req, res, rota);
  if (pagamento !== false) return;

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
      // Arquivo de entrega (o que o cliente baixa depois de pagar)
      if (String(req.headers['x-tipo-arquivo'] || '') === 'entrega') {
        if (!EXT_ENTREGA.includes(ext)) return responderJson(res, 400, { erro: 'Formato não aceito. Use ZIP, RAR, WAV, MP3, FLAC, AIFF ou M4A.' });
        const conteudo = await lerBruto(req, TAMANHO_MAX_ENTREGA);
        if (!conteudo.length) return responderJson(res, 400, { erro: 'Arquivo vazio.' });
        const arquivo = 'entrega-' + crypto.randomUUID() + ext;
        if (MONGO) await MONGO.salvarArquivo(arquivo, conteudo, TIPOS[ext] || 'application/octet-stream');
        else fs.writeFileSync(path.join(PASTA_ARQUIVOS, arquivo), conteudo);
        return responderJson(res, 201, { url: '/arquivos/' + arquivo, nome: nome.slice(0, 120) });
      }
      const ehImagem = EXT_IMAGEM.includes(ext);
      const ehAudio = EXT_AUDIO.includes(ext);
      if (!ehImagem && !ehAudio) return responderJson(res, 400, { erro: 'Formato não aceito. Use JPG, PNG, WEBP, MP3, WAV, M4A ou OGG.' });
      const conteudo = await lerBruto(req, ehAudio ? TAMANHO_MAX_AUDIO : TAMANHO_MAX_IMAGEM);
      if (!conteudo.length) return responderJson(res, 400, { erro: 'Arquivo vazio.' });
      const arquivo = crypto.randomUUID() + (ext === '.jpeg' ? '.jpg' : ext);
      if (MONGO) await MONGO.salvarArquivo(arquivo, conteudo, TIPOS[path.extname(arquivo)]);
      else fs.writeFileSync(path.join(PASTA_ARQUIVOS, arquivo), conteudo);
      return responderJson(res, 201, { url: '/arquivos/' + arquivo });
    }

    // Catálogo completo (com os arquivos de entrega) para o Painel
    if (rota === '/api/admin/catalogo' && req.method === 'GET') {
      return responderJson(res, 200, catalogo);
    }

    // Vendas
    if (rota === '/api/admin/pedidos' && req.method === 'GET') {
      const lista = pedidos.slice(-300).reverse().map(p => Object.assign(pedidoPublico(p), { cliente: p.email }));
      return responderJson(res, 200, { pedidos: lista, pagamentoAtivo: pagamentoAtivo(), modoTeste: MP_PUBLIC_KEY.startsWith('TEST-') });
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
        if (anterior.entrega !== beat.entrega) apagarArquivoSeSemUso(anterior.entrega);
        return responderJson(res, 200, { beat, catalogo });
      }
      if (req.method === 'DELETE') {
        catalogo.beats.splice(idx, 1);
        salvarCatalogo();
        apagarArquivoSeSemUso(anterior.cover);
        apagarArquivoSeSemUso(anterior.audio);
        apagarArquivoSeSemUso(anterior.entrega);
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

    // Licenças (lista completa: criar, editar, remover)
    if (rota === '/api/admin/licencas' && req.method === 'PUT') {
      const corpo = await lerCorpo(req);
      if (!Array.isArray(corpo.licencas)) return responderJson(res, 400, { erro: 'Dados inválidos.' });
      const lista = corpo.licencas.slice(0, 12).map(l => {
        const consulta = !!l.exclusive;
        return {
          id: /^[a-z0-9-]{1,40}$/.test(String(l.id || '')) ? l.id : crypto.randomUUID().slice(0, 8),
          label: texto(l.label, 40),
          name: texto(l.name, 60),
          description: texto(l.description, 240),
          price: consulta ? null : numero(l.price),
          exclusive: consulta,
          popular: !!l.popular,
          features: (Array.isArray(l.features) ? l.features : []).map(f => texto(f, 80)).filter(Boolean).slice(0, 10),
          cta: texto(l.cta, 40) || (consulta ? 'Falar com o produtor' : 'Selecionar licença')
        };
      });
      const semNome = lista.find(l => !l.name);
      if (semNome) return responderJson(res, 400, { erro: 'Toda licença precisa de um nome.' });
      const semPreco = lista.find(l => !l.exclusive && l.price == null);
      if (semPreco) return responderJson(res, 400, { erro: `Informe o preço da licença "${semPreco.name}" ou marque "Sob consulta".` });
      catalogo.licencas = lista;
      salvarCatalogo();
      return responderJson(res, 200, { catalogo });
    }

    // Contato e redes sociais
    if (rota === '/api/admin/contato' && req.method === 'PUT') {
      const corpo = await lerCorpo(req);
      const link = v => { const t = texto(v, 200); return t === '' || /^https?:\/\/[^\s]+$/i.test(t) ? t : null; };
      const whatsapp = texto(corpo.whatsapp, 20).replace(/\D/g, '');
      const email = texto(corpo.email, 120);
      const instagram = link(corpo.instagram);
      const spotify = link(corpo.spotify);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return responderJson(res, 400, { erro: 'E-mail de contato inválido.' });
      if (whatsapp && (whatsapp.length < 10 || whatsapp.length > 15)) return responderJson(res, 400, { erro: 'WhatsApp inválido. Use DDI + DDD + número, ex: 5527999999999.' });
      if (instagram === null || spotify === null) return responderJson(res, 400, { erro: 'Os links precisam começar com https://' });
      catalogo.contato = { whatsapp, telefone: texto(corpo.telefone, 30), email, instagram, spotify };
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
  '.m4a': 'audio/mp4',
  '.zip': 'application/zip',
  '.rar': 'application/vnd.rar',
  '.flac': 'audio/flac',
  '.aiff': 'audio/aiff'
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

// Mesmo que enviarArquivo, mas lendo do MongoDB (com suporte a Range para o player)
async function enviarArquivoMongo(req, res, nome) {
  try {
    const info = await MONGO.infoArquivo(nome);
    if (!info) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Arquivo não encontrado'); }
    const tamanho = info.length;
    const tipo = TIPOS[path.extname(nome).toLowerCase()] || 'application/octet-stream';
    const cabecalhos = { 'Content-Type': tipo, 'Accept-Ranges': 'bytes', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=31536000, immutable' };
    const faixa = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    let fluxo;
    if (faixa && tamanho > 0) {
      const inicio = faixa[1] ? parseInt(faixa[1], 10) : 0;
      const fim = faixa[2] ? Math.min(parseInt(faixa[2], 10), tamanho - 1) : tamanho - 1;
      if (inicio >= tamanho || inicio > fim) {
        res.writeHead(416, { 'Content-Range': `bytes */${tamanho}` });
        return res.end();
      }
      res.writeHead(206, Object.assign(cabecalhos, { 'Content-Range': `bytes ${inicio}-${fim}/${tamanho}`, 'Content-Length': fim - inicio + 1 }));
      fluxo = MONGO.lerArquivo(nome, inicio, fim);
    } else {
      res.writeHead(200, Object.assign(cabecalhos, { 'Content-Length': tamanho }));
      fluxo = MONGO.lerArquivo(nome);
    }
    fluxo.on('error', () => res.destroy());
    fluxo.pipe(res);
  } catch (erro) {
    console.error(erro);
    if (!res.headersSent) res.writeHead(500);
    res.end();
  }
}

function servirArquivo(req, res, rota) {
  // Arquivos enviados pelo Painel
  if (rota.startsWith('/arquivos/')) {
    const nome = path.basename(rota);
    if (!/^[a-f0-9-]+\.[a-z0-9]+$/.test(nome)) { res.writeHead(404); return res.end(); }
    if (MONGO) return enviarArquivoMongo(req, res, nome);
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
  console.log('  Site rodando na porta ' + PORTA + (process.env.PORT ? '' : '  →  http://localhost:' + PORTA));
  console.log('  Dados salvos em:  ' + (MONGO ? 'MongoDB Atlas' : PASTA_DADOS));
  console.log('  Contas dev:       ' + (devs.length ? devs.join(', ') : 'nenhuma (use: node server.js criar-dev ...)'));
  console.log('  Mercado Pago:     ' + (pagamentoAtivo() ? (MP_PUBLIC_KEY.startsWith('TEST-') ? 'ativo (MODO TESTE)' : 'ativo (produção)') : 'desligado (faltam MP_PUBLIC_KEY e MP_ACCESS_TOKEN)'));
  console.log('  Para desligar:    Ctrl + C');
  console.log('');
});
