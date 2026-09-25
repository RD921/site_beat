/**
 * BEAT STORE — Store Configuration
 * Configuração da loja ativa. Troque este arquivo para alternar entre lojas.
 * A arquitetura permite múltiplas lojas sem duplicar o front-end.
 */

export const STORE_CONFIG = {
  id: 'woah-collection',
  name: 'Woah Collection',
  shortName: 'WOAH',
  tagline: 'Beats que Inspiram',
  description: 'Beats exclusivos, prontos para transformar suas ideias em hits. Qualidade profissional, compre segura e entrega imediata.',
  currency: 'BRL',
  currencySymbol: 'R$',
  locale: 'pt-BR',

  branding: {
    primaryColor: '#e63946',
    logoText: 'WOAH',
    logoSubText: 'COLLECTION',
    favicon: '/favicon.ico',
  },

  hero: {
    eyebrow: 'Beats que Inspiram',
    title: 'Sua Música,',
    titleHighlight: 'Sem Limites',
    description: 'Beats exclusivos, prontos para transformar suas ideias em hits. Qualidade profissional, compre segura e entrega imediata.',
    primaryCTA: { label: 'Explorar Beats', href: '/beats.html' },
    secondaryCTA: { label: 'Como Funciona', href: '/como-funciona.html' },
    image: '/src/assets/hero-studio.jpg',
    benefits: [
      { icon: '🎵', value: '+500', label: 'Beats Disponíveis' },
      { icon: '✅', value: '100%', label: 'Original' },
      { icon: '⚡', value: 'Entrega', label: 'Imediata' },
      { icon: '🎧', value: 'Suporte', label: 'Dedicado' },
    ],
  },

  nav: [
    { label: 'Início',         href: '/index.html',         exact: true },
    { label: 'Beats',          href: '/beats.html' },
    { label: 'Licenças',       href: '/licencas.html' },
    { label: 'Como Funciona',  href: '/como-funciona.html' },
    { label: 'Contato',        href: '/contato.html' },
  ],

  socials: {
    instagram: 'https://instagram.com/woahcollection',
    whatsapp: 'https://wa.me/5527995055702?text=Olá!%20Preciso%20de%20suporte%20na%20Woah%20Collection',
    youtube: null,
    tiktok: null,
  },

  contact: {
    email: 'contato@woahcollection.com',
    whatsapp: '5527995055702',
    supportMessage: 'Olá! Preciso de suporte na Woah Collection',
  },

  footer: {
    copyright: '© 2025 Woah Collection. Todos os direitos reservados.',
    links: [
      { label: 'Política de Privacidade', href: '#' },
      { label: 'Termos de Uso', href: '#' },
      { label: 'Licenças', href: '/licencas.html' },
    ],
  },

  features: {
    audioTest: true,
    autoplay: true,
    ratings: false,
    comments: false,
  },
};

export default STORE_CONFIG;
