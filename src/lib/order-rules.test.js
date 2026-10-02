import { describe, expect, it } from 'vitest';
import { paymentLabel, validateOrderLines } from './order-rules';

const line = {
  product_name: 'Casa Shirt', size: 'M', quantity: 2, available: 4,
  price_cents: 2750000, product_active: true, variant_active: true,
};

describe('server order rules', () => {
  it('calculates the total from server catalogue prices', () => {
    expect(validateOrderLines([line, { ...line, product_name: 'Chain Sandals', quantity: 1, price_cents: 3200000 }])).toBe(8700000);
  });

  it('rejects an order when stock changed after an item entered the cart', () => {
    expect(() => validateOrderLines([{ ...line, available: 1 }])).toThrow('Only 1 of Casa Shirt in size M remain.');
  });

  it('rejects inactive catalogue items', () => {
    expect(() => validateOrderLines([{ ...line, product_active: false }])).toThrow('Casa Shirt is no longer available.');
  });

  it('never represents an order as paid', () => {
    expect(paymentLabel('pending')).toBe('Payment pending');
    expect(paymentLabel('unexpected')).toBe('Payment pending');
  });
});
