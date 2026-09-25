/**
 * BEAT STORE — Catalog Service
 * Camada de serviço para catálogo de beats.
 * Atualmente usa mock data. Para conectar à API real:
 *   1. Substitua as funções abaixo por chamadas fetch/axios
 *   2. Os componentes não precisam ser alterados
 */

import { MOCK_BEATS } from '../data/mock/mock-beats.js';

// Simula latência de rede (remover em produção)
const simulateDelay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Busca todos os beats do catálogo
 * @returns {Promise<Beat[]>}
 */
export async function getBeats() {
  await simulateDelay();
  // TODO: return await fetch('/api/beats').then(r => r.json());
  return [...MOCK_BEATS];
}

/**
 * Busca beats em destaque (para a Home)
 * @param {number} limit
 * @returns {Promise<Beat[]>}
 */
export async function getFeaturedBeats(limit = 4) {
  await simulateDelay(300);
  const featured = MOCK_BEATS.filter(b => b.isFeatured);
  return featured.slice(0, limit);
}

/**
 * Busca um beat pelo slug
 * @param {string} slug
 * @returns {Promise<Beat|null>}
 */
export async function getBeatBySlug(slug) {
  await simulateDelay(300);
  return MOCK_BEATS.find(b => b.slug === slug) ?? null;
}

/**
 * Busca um beat pelo ID
 * @param {string} id
 * @returns {Promise<Beat|null>}
 */
export async function getBeatById(id) {
  await simulateDelay(200);
  return MOCK_BEATS.find(b => b.id === id) ?? null;
}

/**
 * Filtra beats por critérios
 * @param {FilterOptions} options
 * @returns {Promise<Beat[]>}
 */
export async function filterBeats({ query = '', genre = '', minBpm = 0, maxBpm = 999, maxPrice = Infinity, sort = 'default' } = {}) {
  await simulateDelay(200);

  let results = [...MOCK_BEATS];

  // Busca textual
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.genre.toLowerCase().includes(q) ||
      b.producer.toLowerCase().includes(q) ||
      b.tags.some(t => t.includes(q))
    );
  }

  // Filtro por gênero
  if (genre) {
    results = results.filter(b => b.genre === genre);
  }

  // Filtro por BPM
  results = results.filter(b => b.bpm >= minBpm && b.bpm <= maxBpm);

  // Filtro por preço
  results = results.filter(b => b.price <= maxPrice);

  // Ordenação
  if (sort === 'price-asc')  results.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') results.sort((a, b) => b.price - a.price);
  if (sort === 'newest')     results.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));

  return results;
}

/**
 * Busca beats relacionados (por gênero, excluindo o atual)
 * @param {string} beatId
 * @param {number} limit
 * @returns {Promise<Beat[]>}
 */
export async function getRelatedBeats(beatId, limit = 4) {
  await simulateDelay(200);
  const beat = MOCK_BEATS.find(b => b.id === beatId);
  if (!beat) return [];
  return MOCK_BEATS
    .filter(b => b.id !== beatId && b.genre === beat.genre)
    .slice(0, limit);
}
