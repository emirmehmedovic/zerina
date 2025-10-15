type OrderItemLine = {
  title: string;
  quantity: number;
  price: string;
};

export type OrderConfirmedEmailProps = {
  orderId: string;
  buyerName?: string | null;
  shopName?: string | null;
  items: OrderItemLine[];
  total: string;
  orderUrl?: string;
};

export function renderOrderConfirmedEmail(props: OrderConfirmedEmailProps) {
  const { orderId, buyerName, shopName, items, total, orderUrl } = props;

  const title = shopName ? `${shopName} order confirmation` : 'Order confirmation';

  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;color:#111827;font-size:14px;">${item.title}</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;">${item.price}</td>
        </tr>
      `
    )
    .join('');

  const html = `
    <div style="background-color:#f3f4f6;padding:32px;font-family:'Helvetica Neue',Arial,sans-serif;color:#111827;">
      <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.12);">
        <div style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:32px 32px 28px;">
          <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;">${title}</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Order #${orderId}</p>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;">Hi ${buyerName ?? 'there'},</p>
          <p style="margin:0 0 24px;font-size:15px;color:#4b5563;">Thank you for shopping with ${shopName ?? 'our marketplace'}! Here is a summary of your order.</p>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr>
                <th style="text-align:left;padding-bottom:8px;color:#6b7280;font-size:12px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;">Item</th>
                <th style="text-align:center;padding-bottom:8px;color:#6b7280;font-size:12px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;">Qty</th>
                <th style="text-align:right;padding-bottom:8px;color:#6b7280;font-size:12px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>
          <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;">
            <span style="color:#6b7280;font-weight:500;text-transform:uppercase;font-size:12px;letter-spacing:0.08em;">Total</span>
            <span style="font-size:18px;font-weight:600;color:#111827;">${total}</span>
          </div>
          ${orderUrl ? `<div style="margin-top:32px;text-align:center;"><a href="${orderUrl}" style="display:inline-block;padding:12px 20px;background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);color:#ffffff;text-decoration:none;font-weight:600;border-radius:999px;">View order</a></div>` : ''}
        </div>
        <div style="padding:16px 32px;background-color:#f9fafb;color:#6b7280;font-size:12px;text-align:center;">
          <p style="margin:0;">You will receive an update when your order ships.</p>
        </div>
      </div>
    </div>
  `;

  const textLines = [
    `Hi ${buyerName ?? 'there'},`,
    `Thank you for shopping with ${shopName ?? 'our marketplace'}!`,
    'Items:',
    ...items.map((item) => `- ${item.quantity} × ${item.title} — ${item.price}`),
    `Total: ${total}`,
    orderUrl ? `View order: ${orderUrl}` : undefined,
    'You will receive an update when your order ships.',
  ].filter(Boolean) as string[];

  return {
    subject: `Order ${orderId} confirmation`,
    html,
    text: textLines.join('\n'),
  };
}
