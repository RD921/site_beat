/* ==========================================================================
   ARMAZENAMENTO NO MONGODB ATLAS (usado só na hospedagem)
   Quando a variável MONGODB_URI existe, contas, sessões, catálogo e os
   arquivos enviados pelo Painel (capas e áudios) ficam no MongoDB, que não
   apaga nada quando o servidor reinicia. Sem MONGODB_URI, o site usa a
   pasta "dados" do computador, como antes.
   ========================================================================== */

const { MongoClient, GridFSBucket } = require('mongodb');

let cliente = null;
let colecao = null;
let bucket = null;
const cache = {};
const filas = {};

async function preparar(uri) {
  cliente = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
  await cliente.connect();
  const db = cliente.db(process.env.MONGODB_DB || 'woah');
  colecao = db.collection('estado');
  bucket = new GridFSBucket(db, { bucketName: 'arquivos' });
  const docs = await colecao.find({}).toArray();
  docs.forEach(d => { cache[d._id] = d.dados; });
  console.log('  Banco de dados:   MongoDB conectado (' + docs.length + ' registros)');
}

// Lê o que foi carregado na inicialização (undefined = ainda não existe)
function ler(chave) {
  return cache[chave];
}

// Salva em segundo plano, um de cada vez por chave, sempre a versão mais nova
function salvar(chave, dados) {
  cache[chave] = dados;
  const copia = JSON.parse(JSON.stringify(dados));
  filas[chave] = (filas[chave] || Promise.resolve())
    .then(() => colecao.replaceOne({ _id: chave }, { _id: chave, dados: copia }, { upsert: true }))
    .catch(erro => console.error('Erro ao salvar "' + chave + '" no MongoDB:', erro.message));
  return filas[chave];
}

function salvarArquivo(nome, conteudo, tipo) {
  return new Promise((resolve, reject) => {
    const envio = bucket.openUploadStream(nome, { metadata: { tipo } });
    envio.on('error', reject);
    envio.on('finish', resolve);
    envio.end(conteudo);
  });
}

async function infoArquivo(nome) {
  const [arquivo] = await bucket.find({ filename: nome }).limit(1).toArray();
  return arquivo || null;
}

// inicio/fim inclusivos (como no cabeçalho Range)
function lerArquivo(nome, inicio, fim) {
  const opcoes = {};
  if (inicio != null) opcoes.start = inicio;
  if (fim != null) opcoes.end = fim + 1; // no GridFS o fim não é incluído
  return bucket.openDownloadStreamByName(nome, opcoes);
}

async function apagarArquivo(nome) {
  const arquivos = await bucket.find({ filename: nome }).toArray();
  for (const a of arquivos) await bucket.delete(a._id);
}

module.exports = { preparar, ler, salvar, salvarArquivo, infoArquivo, lerArquivo, apagarArquivo };
