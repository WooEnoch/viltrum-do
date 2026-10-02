import 'server-only';
import crypto from 'node:crypto';
import { getSql } from '@/db/client';
import { requireCustomer } from '@/lib/customer';
import { appError } from '@/lib/http';
import { sendOrderAcknowledgement } from '@/lib/email';
import { paymentLabel, validateOrderLines } from '@/lib/order-rules';

const orderNumber = () => `NB${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

function serializeOrder(order, items = []) {
  return {
    id: order.id,
    orderNumber: order.order_number,
    createdAt: order.placed_at,
    total: order.total_cents / 100,
    currency: order.currency,
    paymentStatus: order.payment_status,
    paymentLabel: paymentLabel(order.payment_status),
    fulfilmentStatus: order.fulfilment_status,
    items: items.map((item) => ({ ...item, unitPrice: item.unit_price_cents / 100, lineTotal: item.line_total_cents / 100 })),
  };
}

export async function listOrders() {
  const customer = await requireCustomer();
  const sql = getSql();
  const rows = await sql`SELECT * FROM orders WHERE customer_id = ${customer.id} ORDER BY placed_at DESC`;
  if (!rows.length) return [];
  const itemRows = await sql`SELECT order_id, product_name, color, size, quantity, unit_price_cents, line_total_cents FROM order_items WHERE order_id = ANY(${rows.map((row) => row.id)}::uuid[]) ORDER BY id`;
  return rows.map((row) => serializeOrder(row, itemRows.filter((item) => item.order_id === row.id)));
}

export async function createOrder(delivery) {
  const customer = await requireCustomer();
  const sql = getSql();
  let emailPayload;
  const created = await sql.begin(async (tx) => {
    const carts = await tx`SELECT id FROM carts WHERE customer_id = ${customer.id} AND status = 'active' FOR UPDATE`;
    if (!carts[0]) throw appError('Your shopping bag is empty.', 409);
    const lines = await tx`
      SELECT ci.inventory_id, ci.quantity, i.on_hand - i.reserved AS available,
             s.label AS size, pv.id AS variant_id, pv.sku, pv.color, pv.price_cents,
             pv.is_active AS variant_active, p.id AS product_id, p.name AS product_name,
             p.image_path, p.is_active AS product_active
      FROM cart_items ci
      JOIN inventory i ON i.id = ci.inventory_id
      JOIN sizes s ON s.id = i.size_id
      JOIN product_variants pv ON pv.id = i.variant_id
      JOIN products p ON p.id = pv.product_id
      WHERE ci.cart_id = ${carts[0].id}
      ORDER BY ci.id
      FOR UPDATE OF i
    `;
    const totalCents = validateOrderLines(lines);
    const number = orderNumber();
    const orders = await tx`
      INSERT INTO orders (order_number, customer_id, subtotal_cents, total_cents, first_name, last_name, email, phone, address, city, state, note)
      VALUES (${number}, ${customer.id}, ${totalCents}, ${totalCents}, ${delivery.firstName}, ${delivery.lastName}, ${delivery.email.toLowerCase()}, ${delivery.phone}, ${delivery.address}, ${delivery.city}, ${delivery.state}, ${delivery.note || null})
      RETURNING *
    `;
    for (const line of lines) {
      const lineTotal = line.price_cents * line.quantity;
      await tx`
        INSERT INTO order_items (order_id, product_id, inventory_id, sku, product_name, color, size, image_path, unit_price_cents, quantity, line_total_cents)
        VALUES (${orders[0].id}, ${line.product_id}, ${line.inventory_id}, ${line.sku}, ${line.product_name}, ${line.color}, ${line.size}, ${line.image_path}, ${line.price_cents}, ${line.quantity}, ${lineTotal})
      `;
      await tx`UPDATE inventory SET on_hand = on_hand - ${line.quantity}, updated_at = now() WHERE id = ${line.inventory_id}`;
    }
    await tx`UPDATE carts SET status = 'ordered', updated_at = now() WHERE id = ${carts[0].id}`;
    emailPayload = {
      ...orders[0], firstName: delivery.firstName, email: delivery.email,
      orderNumber: orders[0].order_number, totalCents,
      items: lines.map((line) => ({ sku: line.sku, productName: line.product_name, size: line.size, quantity: line.quantity, lineTotalCents: line.price_cents * line.quantity })),
    };
    return serializeOrder(orders[0], lines.map((line) => ({ product_name: line.product_name, color: line.color, size: line.size, quantity: line.quantity, unit_price_cents: line.price_cents, line_total_cents: line.price_cents * line.quantity })));
  });
  try { await sendOrderAcknowledgement(emailPayload); } catch (error) { console.error('Order acknowledgement failed', error); }
  return created;
}
