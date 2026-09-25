/* ==========================================================================
   WOAH COLLECTION — DADOS DO SITE
   Os beats, as licenças e as imagens agora são editados pelo Painel
   (entre com uma conta de desenvolvedor). Eles ficam salvos em
   dados/catalogo.json pelo servidor. Os valores abaixo são só o padrão,
   usados enquanto o servidor não responde.
   ========================================================================== */

// Preenchido automaticamente com os beats cadastrados no Painel
const WOAH_BEATS = [];

// Licenças padrão (o Painel pode alterar nomes, preços e itens)
const WOAH_LICENSES = [
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

// Imagens padrão do site (o Painel pode trocar cada uma)
const WOAH_IMAGES = {
  hero: 'images/artists/promo-studio.jpg',
  promo: 'images/artists/hero-producer.jpg',
  login: 'images/artists/hero-producer.jpg',
  cadastro: 'images/artists/promo-studio.jpg'
};

// Capa usada quando o beat ainda não tem imagem
const WOAH_DEFAULT_COVER = 'images/capa-padrao.svg';

const WOAH_CONTACT = {
  whatsapp: '5527995055702',
  email: 'rodrigoarrezzimaciel17@gmail.com',
  instagram: 'https://www.instagram.com/rodrigo_arrezzi',
  spotify: 'https://open.spotify.com'
};
