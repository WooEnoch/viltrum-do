import { z } from 'zod';
import { addCartItem, getCart, removeCartItem, setCartItemQuantity } from '@/lib/cart';
import { jsonError } from '@/lib/http';
import { isDatabaseConfigured } from '@/db/client';

const addSchema = z.object({ productId: z.string().min(1).max(120), size: z.string().min(1).max(12), quantity: z.number().int().min(1).max(20).default(1) });
const updateSchema = z.object({ itemId: z.string().uuid(), quantity: z.number().int().min(0).max(20) });

export async function GET() {
  try {
    if (!isDatabaseConfigured() && process.env.NODE_ENV === 'development') return Response.json({ items: [], count: 0, subtotal: 0, preview: true });
    return Response.json(await getCart());
  }
  catch (error) { return jsonError(error, 'Your shopping bag could not be loaded.'); }
}

export async function POST(request) {
  try { return Response.json(await addCartItem(addSchema.parse(await request.json())), { status: 201 }); }
  catch (error) { return jsonError(error, 'This item could not be added.'); }
}

export async function PATCH(request) {
  try { const input = updateSchema.parse(await request.json()); return Response.json(await setCartItemQuantity(input.itemId, input.quantity)); }
  catch (error) { return jsonError(error, 'The shopping bag could not be updated.'); }
}

export async function DELETE(request) {
  try {
    const itemId = new URL(request.url).searchParams.get('itemId');
    if (!z.string().uuid().safeParse(itemId).success) return Response.json({ error: 'A valid bag item is required.' }, { status: 400 });
    return Response.json(await removeCartItem(itemId));
  } catch (error) { return jsonError(error, 'The item could not be removed.'); }
}
