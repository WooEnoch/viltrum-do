import 'server-only';
import { getSql } from '@/db/client';

export async function listProducts() {
  const sql = getSql();
  const rows = await sql`
    SELECT p.slug, p.name, p.description, p.category, p.collection, p.image_path,
           p.is_new, v.id AS variant_id, v.color, v.price_cents,
           s.label AS size, (i.on_hand - i.reserved) AS available
    FROM products p
    JOIN LATERAL (
      SELECT * FROM product_variants pv
      WHERE pv.product_id = p.id AND pv.is_active = true
      ORDER BY pv.created_at ASC LIMIT 1
    ) v ON true
    JOIN inventory i ON i.variant_id = v.id
    JOIN sizes s ON s.id = i.size_id
    WHERE p.is_active = true
    ORDER BY p.created_at ASC, s.sort_order ASC, s.label ASC
  `;
  const grouped = new Map();
  for (const row of rows) {
    if (!grouped.has(row.slug)) grouped.set(row.slug, {
      id: row.slug,
      variantId: row.variant_id,
      name: row.name,
      description: row.description,
      category: row.category,
      collection: row.collection,
      image: row.image_path,
      isNew: row.is_new,
      color: row.color,
      price: row.price_cents / 100,
      sizes: [],
    });
    if (row.available > 0) grouped.get(row.slug).sizes.push(row.size);
  }
  return [...grouped.values()];
}
