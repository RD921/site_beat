/* ==========================================================================
   WOAH COLLECTION — CATÁLOGO DE BEATS E LICENÇAS
   Para adicionar um beat novo, copie um bloco { ... } e mude os dados.
   Para mudar preço de licença, altere em WOAH_LICENSES.
   ========================================================================== */

const WOAH_BEATS = [
  {
    id: 'midnight-flow',
    title: 'Midnight Flow',
    producer: 'Prod. Rodrigo Arrezzi',
    genre: 'Trap',
    duration: '3:24',
    price: 49.90,
    cover: 'images/covers/cover-midnight-flow.jpg',
    featured: true
  },
  {
    id: 'satans-vibes',
    title: "Satan's Vibes",
    producer: 'Prod. Rodrigo Arrezzi',
    genre: 'Drill',
    duration: '2:12',
    price: 49.90,
    cover: 'images/covers/cover-satans-vibes.jpg',
    featured: true
  },
  {
    id: 'real-talk',
    title: 'Real Talk',
    producer: 'Prod. Rodrigo Arrezzi',
    genre: 'Boom Bap',
    duration: '2:50',
    price: 49.90,
    cover: 'images/covers/cover-real-talk.jpg',
    featured: true
  },
  {
    id: 'night-drive',
    title: 'Night Drive',
    producer: 'Prod. Rodrigo Arrezzi',
    genre: 'Phonk',
    duration: '3:05',
    price: 49.90,
    cover: 'images/covers/cover-night-drive.jpg',
    featured: true
  },
  {
    id: 'lost-thoughts',
    title: 'Lost Thoughts',
    producer: 'Prod. Rodrigo Arrezzi',
    genre: 'R&B',
    duration: '3:45',
    price: 69.90,
    cover: 'images/covers/cover-impacto-real.jpg'
  },
  {
    id: 'dark-side',
    title: 'Dark Side',
    producer: 'Prod. Rodrigo Arrezzi',
    genre: 'Trap',
    duration: '2:40',
    price: 49.90,
    cover: 'images/covers/cover-midnight-flow.jpg'
  },
  {
    id: 'impacto-real',
    title: 'Impacto Real',
    producer: 'Prod. Rodrigo Arrezzi',
    genre: 'Trap Melódico',
    tags: ['Trap', 'Hip Hop', 'Melódico'],
    duration: '3:12',
    bpm: 90,
    key: 'Cm',
    price: 149.90,
    cover: 'images/covers/cover-impacto-real.jpg',
    highlight: true
  }
];

const WOAH_LICENSES = [
  {
    id: 'basica',
    label: 'Básica',
    name: 'Licença MP3',
    description: 'Ideal para singles independentes, prévias e testes de audiência.',
    price: 97.00,
    features: [
      'Arquivo MP3 320kbps Master',
      'Até 50.000 reproduções',
      'Distribuição digital padrão',
      '1 vídeo musical não monetizado'
    ],
    cta: 'Selecionar licença'
  },
  {
    id: 'premium',
    label: 'Premium',
    name: 'Premium (WAV + Stems)',
    description: 'Para lançamentos profissionais com mixagem detalhada de voz e instrumentos.',
    price: 149.90,
    popular: true,
    features: [
      'Arquivo WAV 24-bit + MP3 320kbps',
      'Stems (pistas separadas de áudio)',
      'Até 500.000 reproduções',
      'Monetização autorizada no YouTube'
    ],
    cta: 'Adquirir Premium'
  },
  {
    id: 'exclusiva',
    label: 'Exclusividade total',
    name: 'Direito Exclusivo',
    description: 'O beat é seu exclusivamente e retirado permanentemente da loja.',
    price: null, // sob consulta
    exclusive: true,
    features: [
      'Todos os direitos autorais e masters',
      'Streams ilimitados no Spotify e Apple',
      'Contrato jurídico de exclusividade',
      'Remoção permanente do catálogo'
    ],
    cta: 'Falar com o produtor'
  }
];

const WOAH_CONTACT = {
  whatsapp: '5527995055702',
  email: 'rodrigoarrezzimaciel17@gmail.com',
  instagram: 'https://www.instagram.com/rodrigo_arrezzi',
  spotify: 'https://open.spotify.com'
};
