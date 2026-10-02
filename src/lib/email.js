import 'server-only';
import { orderEmailContent, welcomeEmailContent } from './email-content';
import { sendMailgunMessage } from './mailgun';

export async function sendWelcomeEmail({ email, name }) {
  const content = welcomeEmailContent({ name });
  return sendMailgunMessage({ to: email, subject: 'Welcome to NikkiBee', ...content, tag: 'welcome' });
}

export async function sendOrderAcknowledgement(order) {
  const content = orderEmailContent({ order });
  return sendMailgunMessage({
    to: order.email,
    subject: `Order ${order.orderNumber} received — Payment pending`,
    ...content,
    tag: 'order-acknowledgement',
  });
}
