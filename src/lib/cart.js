import 'server-only';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { getSql } from '@/db/client';
import { getCurrentCustomer } from '@/lib/customer';
import { appError } from '@/lib/http';

export const GUEST_CART_COOKIE = 'nikkibee_guest_cart';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

async function owner(createGuest = false) {
  const customer = await getCurrentCustomer();
  if (customer) return { customerId: customer.id, guestTokenHash: null };
  const store = await cookies();
  let token = store.get(GUEST_CART_COOKIE)?.value;
  if (!token && createGuest) {
    token = crypto.randomUUID();
    store.set(GUEST_CART_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 90 });
  }
  return { customerId: null, guestTokenHash: token ? hashToken(token) : null };
}

async function findCartId(sql, cartOwner) {
  if (cartOwner.customerId) {
    const rows = await sql`SELECT id FROM carts WHERE customer_id = ${cartOwner.customerId} AND status = 'active' LIMIT 1`;
    return rows[0]?.id;
  }
  if (cartOwner.guestTokenHash) {
    const rows = await sql`SELECT id FROM carts WHERE guest_token_hash = ${cartOwner.guestTokenHash} AND status = 'active' LIMIT 1`;
    return rows[0]?.id;
  }
  return null;
}

async function ensureCartId(sql, cartOwner) {
  let id = await findCartId(sql, cartOwner);
  if (id) return id;
  if (cartOwner.customerId) await sql`INSERT INTO carts (customer_id) VALUES (${cartOwner.customerId}) ON CONFLICT DO NOTHING`;
  else await sql`INSERT INTO carts (guest_token_hash) VALUES (${cartOwner.guestTokenHash}) ON CONFLICT DO NOTHING`;
  id = await findCartId(sql, cartOwner);
  if (!id) throw appError('Unable to create a shopping bag.', 500);
  return id;
}

export async function getCart() {
  const sql = getSql();
  const cartId = await findCartId(sql, await owner(false));
  if (!cartId) return { items: [], count: 0, subtotal: 0 };
  const rows = await sql`
    SELECT ci.id, ci.quantity, i.id AS inventory_id, s.label AS size,
           p.slug AS product_id, p.name, p.image_path AS image, pv.color,
           pv.price_cents, (i.on_hand - i.reserved) AS available
    FROM cart_items ci
    JOIN inventory i ON i.id = ci.inventory_id
    JOIN sizes s ON s.id = i.size_id
    JOIN product_variants pv ON pv.id = i.variant_id
    JOIN products p ON p.id = pv.product_id
    WHERE ci.cart_id = ${cartId}
    ORDER BY ci.created_at ASC
  `;
  const items = rows.map((row) => ({
    id: row.id, inventoryId: row.inventory_id, productId: row.product_id,
    name: row.name, image: row.image, color: row.color, size: row.size,
    quantity: row.quantity, price: row.price_cents / 100,
    lineTotal: row.price_cents * row.quantity / 100, available: row.available,
  }));
  return { items, count: items.reduce((sum, item) => sum + item.quantity, 0), subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0) };
}

export async function addCartItem({ productId, size, quantity = 1 }) {
  const sql = getSql();
  const cartOwner = await owner(true);
  const cartId = await ensureCartId(sql, cartOwner);
  const matches = await sql`
    SELECT i.id, (i.on_hand - i.reserved) AS available
    FROM products p
    JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = true
    JOIN inventory i ON i.variant_id = pv.id
    JOIN sizes s ON s.id = i.size_id
    WHERE p.slug = ${productId} AND p.is_active = true AND s.label = ${size}
    ORDER BY pv.created_at ASC LIMIT 1
  `;
  if (!matches[0]) throw appError('That size is no longer available.', 409);
  const current = await sql`SELECT id, quantity FROM cart_items WHERE cart_id = ${cartId} AND inventory_id = ${matches[0].id}`;
  const nextQuantity = (current[0]?.quantity || 0) + quantity;
  if (nextQuantity > matches[0].available) throw appError(`Only ${matches[0].available} available in this size.`, 409);
  if (current[0]) await sql`UPDATE cart_items SET quantity = ${nextQuantity}, updated_at = now() WHERE id = ${current[0].id}`;
  else await sql`INSERT INTO cart_items (cart_id, inventory_id, quantity) VALUES (${cartId}, ${matches[0].id}, ${quantity})`;
  return getCart();
}

export async function setCartItemQuantity(itemId, quantity) {
  const sql = getSql();
  const cartId = await findCartId(sql, await owner(false));
  if (!cartId) throw appError('Shopping bag not found.', 404);
  if (quantity <= 0) {
    await sql`DELETE FROM cart_items WHERE id = ${itemId} AND cart_id = ${cartId}`;
    return getCart();
  }
  const rows = await sql`SELECT ci.id, (i.on_hand - i.reserved) AS available FROM cart_items ci JOIN inventory i ON i.id = ci.inventory_id WHERE ci.id = ${itemId} AND ci.cart_id = ${cartId}`;
  if (!rows[0]) throw appError('Bag item not found.', 404);
  if (quantity > rows[0].available) throw appError(`Only ${rows[0].available} available in this size.`, 409);
  await sql`UPDATE cart_items SET quantity = ${quantity}, updated_at = now() WHERE id = ${itemId} AND cart_id = ${cartId}`;
  return getCart();
}

export async function removeCartItem(itemId) {
  return setCartItemQuantity(itemId, 0);
}

export async function mergeGuestCart(customerId, token) {
  if (!token) return;
  const tokenHash = hashToken(token);
  const sql = getSql();
  await sql.begin(async (tx) => {
    const guest = await tx`SELECT id FROM carts WHERE guest_token_hash = ${tokenHash} AND status = 'active' FOR UPDATE`;
    if (!guest[0]) return;
    await tx`INSERT INTO carts (customer_id) VALUES (${customerId}) ON CONFLICT DO NOTHING`;
    const customerCart = await tx`SELECT id FROM carts WHERE customer_id = ${customerId} AND status = 'active' FOR UPDATE`;
    await tx`
      INSERT INTO cart_items (cart_id, inventory_id, quantity)
      SELECT ${customerCart[0].id}, ci.inventory_id, LEAST(ci.quantity, i.on_hand - i.reserved)
      FROM cart_items ci JOIN inventory i ON i.id = ci.inventory_id
      WHERE ci.cart_id = ${guest[0].id} AND i.on_hand > i.reserved
      ON CONFLICT (cart_id, inventory_id) DO UPDATE
      SET quantity = LEAST(20, (SELECT on_hand - reserved FROM inventory WHERE id = EXCLUDED.inventory_id), cart_items.quantity + EXCLUDED.quantity), updated_at = now()
    `;
    await tx`UPDATE carts SET status = 'converted', updated_at = now() WHERE id = ${guest[0].id}`;
  });
}
