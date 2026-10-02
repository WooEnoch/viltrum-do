import { appError } from './http';

export function validateOrderLines(lines) {
  if (!lines.length) throw appError('Your shopping bag is empty.', 409);
  for (const line of lines) {
    if (!line.product_active || !line.variant_active) throw appError(`${line.product_name} is no longer available.`, 409);
    if (line.quantity < 1 || line.quantity > 20) throw appError('An item quantity is invalid.', 409);
    if (line.available < line.quantity) throw appError(`Only ${line.available} of ${line.product_name} in size ${line.size} remain.`, 409);
    if (!Number.isInteger(line.price_cents) || line.price_cents < 0) throw appError('A product price is invalid.', 500);
  }
  return lines.reduce((total, line) => total + line.price_cents * line.quantity, 0);
}

export function paymentLabel(status) {
  return status === 'pending' ? 'Payment pending' : 'Payment pending';
}
