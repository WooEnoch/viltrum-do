import 'server-only';
import { getSql } from '@/db/client';
import { requireCustomer } from '@/lib/customer';
import { appError } from '@/lib/http';

export async function listFavourites() {
  const customer = await requireCustomer();
  const sql = getSql();
  const rows = await sql`SELECT p.slug FROM favourites f JOIN products p ON p.id = f.product_id WHERE f.customer_id = ${customer.id} ORDER BY f.created_at DESC`;
  return rows.map((row) => row.slug);
}

export async function addFavourite(slug) {
  const customer = await requireCustomer();
  const sql = getSql();
  const products = await sql`SELECT id FROM products WHERE slug = ${slug} AND is_active = true`;
  if (!products[0]) throw appError('Product not found.', 404);
  await sql`INSERT INTO favourites (customer_id, product_id) VALUES (${customer.id}, ${products[0].id}) ON CONFLICT DO NOTHING`;
  return listFavourites();
}

export async function removeFavourite(slug) {
  const customer = await requireCustomer();
  const sql = getSql();
  await sql`DELETE FROM favourites USING products WHERE favourites.customer_id = ${customer.id} AND favourites.product_id = products.id AND products.slug = ${slug}`;
  return listFavourites();
}
