import { z } from 'zod';
import { addFavourite, listFavourites, removeFavourite } from '@/lib/favourites';
import { jsonError } from '@/lib/http';

const schema = z.object({ productId: z.string().min(1).max(120) });

export async function GET() {
  try { return Response.json({ favourites: await listFavourites() }); }
  catch (error) { return jsonError(error, 'Saved pieces could not be loaded.'); }
}

export async function POST(request) {
  try { const { productId } = schema.parse(await request.json()); return Response.json({ favourites: await addFavourite(productId) }, { status: 201 }); }
  catch (error) { return jsonError(error, 'The piece could not be saved.'); }
}

export async function DELETE(request) {
  try { const { productId } = schema.parse(await request.json()); return Response.json({ favourites: await removeFavourite(productId) }); }
  catch (error) { return jsonError(error, 'The saved piece could not be removed.'); }
}
