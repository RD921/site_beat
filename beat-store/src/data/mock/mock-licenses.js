/**
 * BEAT STORE — Mock Data: Licenses
 */

export const MOCK_LICENSES = [
  {
    id: 'license-basic',
    name: 'Basic',
    badge: null,
    price: 49.90,
    priceLabel: 'R$ 49,90',
    description: 'Ideal para artistas iniciantes e projetos independentes.',
    isPopular: false,
    features: [
      { text: 'Distribuição em streaming', included: true },
      { text: 'Uso comercial limitado', included: true },
      { text: '50.000 streams', included: true },
      { text: 'Shows ao vivo', included: false },
      { text: 'Uso em vídeo monetizado', included: false },
      { text: 'Crédito obrigatório ao produtor', included: true },
      { text: 'Exclusividade', included: false },
    ],
    formats: ['MP3 (320kbps)'],
    rights: 'Uso não exclusivo para fins musicais com até 50.000 streams.',
    restrictions: 'Não inclui uso em comerciais, sincronização em vídeo ou mais de 50.000 streams.',
    cta: 'Selecionar Basic',
  },
  {
    id: 'license-premium',
    name: 'Premium',
    badge: 'Mais Popular',
    price: 149.90,
    priceLabel: 'R$ 149,90',
    description: 'Para artistas em crescimento com mais liberdade de uso.',
    isPopular: true,
    features: [
      { text: 'Distribuição em streaming', included: true },
      { text: 'Uso comercial amplo', included: true },
      { text: 'Streams ilimitados', included: true },
      { text: 'Shows ao vivo', included: true },
      { text: 'Uso em vídeo monetizado', included: true },
      { text: 'Crédito obrigatório ao produtor', included: true },
      { text: 'Exclusividade', included: false },
    ],
    formats: ['MP3 (320kbps)', 'WAV (24-bit)'],
    rights: 'Uso não exclusivo ilimitado, incluindo streaming, shows e YouTube monetizado.',
    restrictions: 'Não inclui uso em comerciais de TV/rádio ou exclusividade total.',
    cta: 'Selecionar Premium',
  },
  {
    id: 'license-exclusive',
    name: 'Exclusive',
    badge: 'Pro',
    price: 799.90,
    priceLabel: 'R$ 799,90',
    description: 'Direitos exclusivos completos. O beat sai do catálogo após a venda.',
    isPopular: false,
    features: [
      { text: 'Distribuição em streaming', included: true },
      { text: 'Uso comercial completo', included: true },
      { text: 'Streams ilimitados', included: true },
      { text: 'Shows ao vivo', included: true },
      { text: 'Uso em vídeo monetizado', included: true },
      { text: 'Sem crédito obrigatório', included: true },
      { text: 'Exclusividade total', included: true },
    ],
    formats: ['MP3 (320kbps)', 'WAV (24-bit)', 'Stems (ZIP)'],
    rights: 'Direitos exclusivos e completos. Beat removido do catálogo após a compra.',
    restrictions: 'Nenhuma restrição. Uso total e exclusivo.',
    cta: 'Adquirir Exclusividade',
  },
];

export default MOCK_LICENSES;
