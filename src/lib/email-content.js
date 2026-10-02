function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character]);
}

function shell(content, preview) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(preview)}</title></head><body style="margin:0;background:#f8f8fa;font-family:Arial,sans-serif;padding:32px 12px"><div style="background:#ffffff;color:#2d2929;margin:0 auto;max-width:560px;padding:36px">${content}</div></body></html>`;
}

export function welcomeEmailContent({ name }) {
  const greeting = escapeHtml(name || 'there');
  return {
    html: shell(`<h1 style="font-weight:500">Welcome to NikkiBee</h1><p>Hello ${greeting},</p><p>Your account is ready. Your saved pieces, shopping bag and orders will follow you across devices whenever you sign in.</p><p style="color:#135bec">Where style meets your story.</p>`, 'Welcome to NikkiBee'),
    text: `Welcome to NikkiBee\n\nHello ${name || 'there'},\n\nYour account is ready. Your saved pieces, shopping bag and orders will follow you across devices whenever you sign in.\n\nWhere style meets your story.`,
  };
}

export function orderEmailContent({ order }) {
  const itemsHtml = order.items.map((item) => `<p>${escapeHtml(item.productName)} · ${escapeHtml(item.size)} × ${Number(item.quantity)} — ₦${(item.lineTotalCents / 100).toLocaleString('en-NG')}</p>`).join('');
  const itemsText = order.items.map((item) => `${item.productName} · ${item.size} × ${item.quantity} — ₦${(item.lineTotalCents / 100).toLocaleString('en-NG')}`).join('\n');
  const total = `₦${(order.totalCents / 100).toLocaleString('en-NG')}`;
  return {
    html: shell(`<h1 style="font-weight:500">Order received</h1><p>Hello ${escapeHtml(order.firstName)},</p><p>We received order <strong>${escapeHtml(order.orderNumber)}</strong>. <strong>Payment pending.</strong> This acknowledgement does not confirm payment or fulfilment.</p>${itemsHtml}<p><strong>Total: ${total}</strong></p><p style="color:#135bec">We will contact you separately about payment and delivery.</p>`, `We received order ${order.orderNumber}`),
    text: `Order received\n\nHello ${order.firstName},\n\nWe received order ${order.orderNumber}. Payment pending. This acknowledgement does not confirm payment or fulfilment.\n\n${itemsText}\n\nTotal: ${total}\n\nWe will contact you separately about payment and delivery.`,
  };
}
