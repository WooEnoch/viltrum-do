import { describe, expect, it } from 'vitest';
import { orderEmailContent, welcomeEmailContent } from './email-content';

describe('transactional email content', () => {
  it('preserves the welcome message in HTML and text', () => {
    const content = welcomeEmailContent({ name: 'Ada' });
    expect(content.html).toContain('Welcome to NikkiBee');
    expect(content.text).toContain('saved pieces, shopping bag and orders');
  });

  it('states Payment pending in both order formats', () => {
    const content = orderEmailContent({ order: {
      firstName: 'Ada', orderNumber: 'NBTEST', totalCents: 3200000,
      items: [{ productName: 'Chain Sandals', size: '38', quantity: 1, lineTotalCents: 3200000 }],
    } });
    expect(content.html).toContain('Payment pending');
    expect(content.text).toContain('Payment pending');
    expect(content.html).toContain('does not confirm payment or fulfilment');
  });

  it('escapes customer-controlled values in HTML', () => {
    const content = welcomeEmailContent({ name: '<script>alert(1)</script>' });
    expect(content.html).not.toContain('<script>');
    expect(content.html).toContain('&lt;script&gt;');
  });
});
