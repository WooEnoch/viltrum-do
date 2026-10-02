import { z } from 'zod';
import { createOrder, listOrders } from '@/lib/orders';
import { jsonError } from '@/lib/http';

const deliverySchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(30),
  address: z.string().trim().min(5).max(240),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  note: z.string().trim().max(1000).optional().default(''),
});

export async function GET() {
  try { return Response.json({ orders: await listOrders() }); }
  catch (error) { return jsonError(error, 'Orders could not be loaded.'); }
}

export async function POST(request) {
  try { return Response.json({ order: await createOrder(deliverySchema.parse(await request.json())) }, { status: 201 }); }
  catch (error) { return jsonError(error, 'The order could not be submitted.'); }
}
