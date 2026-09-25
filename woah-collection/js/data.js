/* ==========================================================================
   WOAH COLLECTION — DADOS DO SITE
   Os beats, as licenças, as imagens e os contatos são editados pelo Painel
   (entre com uma conta de desenvolvedor). Eles ficam salvos em
   dados/catalogo.json pelo servidor. Os valores abaixo são só o padrão,
   usados enquanto o servidor não responde.
   ========================================================================== */

// Preenchido automaticamente com os beats cadastrados no Painel
const WOAH_BEATS = [];

// Licenças: cadastradas pelo Painel (começa vazio)
const WOAH_LICENSES = [];

// Imagens padrão do site (o Painel pode trocar cada uma)
const WOAH_IMAGES = {
  hero: 'images/artists/promo-studio.jpg',
  promo: 'images/artists/hero-producer.jpg',
  login: 'images/artists/hero-producer.jpg',
  cadastro: 'images/artists/promo-studio.jpg',
  logo: '' // vazio = logo em texto
};

// Capa usada quando o beat ainda não tem imagem
const WOAH_DEFAULT_COVER = 'images/capa-padrao.svg';

// Contato e redes (o Painel pode trocar tudo)
const WOAH_CONTACT = {
  whatsapp: '5527995055702',
  telefone: '',
  email: 'rodrigoarrezzimaciel17@gmail.com',
  instagram: 'https://www.instagram.com/rodrigo_arrezzi',
  spotify: ''
};
