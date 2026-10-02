import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { GUEST_CART_COOKIE, mergeGuestCart } from '@/lib/cart';
import { getCurrentCustomer } from '@/lib/customer';

export async function GET(request) {
  const customer = await getCurrentCustomer();
  const url = new URL(request.url);
  if (!customer) return NextResponse.redirect(new URL('/#/signin', url.origin));
  const store = await cookies();
  await mergeGuestCart(customer.id, store.get(GUEST_CART_COOKIE)?.value);
  const target = url.searchParams.get('next') === 'checkout' ? '/#/checkout' : '/#/account';
  const response = NextResponse.redirect(new URL(target, url.origin));
  response.cookies.delete(GUEST_CART_COOKIE);
  return response;
}
