/**
 * BEAT STORE — Cart State
 * Carrinho persistido em localStorage.
 * Emite 'cart:updated' ao modificar.
 */

const STORAGE_KEY = 'bs_cart';

function emit() {
  window.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart: getCart() } }));
}

function saveCart(cart) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  emit();
}

/**
 * Retorna todos os itens do carrinho
 * @returns {CartItem[]}
 */
export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

/**
 * Retorna o total de itens no carrinho
 * @returns {number}
 */
export function getCartCount() {
  return getCart().length;
}

/**
 * Retorna o subtotal do carrinho
 * @returns {number}
 */
export function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price, 0);
}

/**
 * Adiciona um item ao carrinho
 * @param {Beat} beat
 * @param {License} license
 */
export function addToCart(beat, license) {
  const cart = getCart();

  // Verifica se já existe o mesmo beat + licença
  const exists = cart.some(
    item => item.beatId === beat.id && item.licenseId === license.id
  );
  if (exists) return { success: false, reason: 'already_in_cart' };

  cart.push({
    id: `${beat.id}-${license.id}`,
    beatId: beat.id,
    beatTitle: beat.title,
    beatCover: beat.cover,
    licenseId: license.id,
    licenseName: license.name,
    price: license.price,
    priceLabel: license.priceLabel,
    addedAt: Date.now(),
  });

  saveCart(cart);
  return { success: true };
}

/**
 * Remove um item do carrinho
 * @param {string} itemId
 */
export function removeFromCart(itemId) {
  const cart = getCart().filter(item => item.id !== itemId);
  saveCart(cart);
}

/**
 * Limpa o carrinho
 */
export function clearCart() {
  localStorage.removeItem(STORAGE_KEY);
  emit();
}

/**
 * Verifica se um beat já está no carrinho
 * @param {string} beatId
 * @returns {boolean}
 */
export function isBeatInCart(beatId) {
  return getCart().some(item => item.beatId === beatId);
}
