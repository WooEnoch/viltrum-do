import { listProducts } from '@/lib/catalog';
import { jsonError } from '@/lib/http';
import { isDatabaseConfigured } from '@/db/client';
import { products as previewProducts } from '@/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!isDatabaseConfigured() && process.env.NODE_ENV === 'development') return Response.json({ products: previewProducts, preview: true });
    return Response.json({ products: await listProducts() });
  }
  catch (error) { return jsonError(error, 'The catalogue is temporarily unavailable.'); }
}
