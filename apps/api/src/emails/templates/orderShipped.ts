export type OrderShippedEmailProps = {
  orderId: string;
  buyerName?: string | null;
  shopName?: string | null;
  items: string[];
  trackingUrl?: string | null;
  orderUrl?: string | null;
};

export function renderOrderShippedEmail(props: OrderShippedEmailProps) {
  const { orderId, buyerName, shopName, items, trackingUrl, orderUrl } = props;

  const itemsHtml = items
    .map((line) => `<li style="margin-bottom:6px;">${line}</li>`)
    .join('');

  const html = `
    <div style="background-color:#f3f4f6;padding:32px;font-family:'Helvetica Neue',Arial,sans-serif;color:#111827;">
      <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.12);">
        <div style="background:linear-gradient(135deg,#0ea5e9 0%,#6366f1 100%);padding:32px 32px 28px;">
          <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;">Your order is on the way!</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Order #${orderId}</p>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;">Hi ${buyerName ?? 'there'},</p>
          <p style="margin:0 0 16px;font-size:15px;color:#4b5563;">${shopName ?? 'Your seller'} just marked your order as shipped. The following items are on their way:</p>
          <ul style="padding-left:18px;color:#111827;font-size:14px;line-height:1.6;">
            ${itemsHtml}
          </ul>
          ${trackingUrl ? `<p style="margin-top:24px;"><a href="${trackingUrl}" style="color:#2563eb;font-weight:600;">Track your shipment</a></p>` : ''}
          ${orderUrl ? `<p style="margin-top:12px;color:#4b5563;font-size:14px;">View order details: <a href="${orderUrl}" style="color:#2563eb;">${orderUrl}</a></p>` : ''}
          <p style="margin-top:24px;font-size:14px;color:#6b7280;">Thank you for choosing ${shopName ?? 'our marketplace'}!</p>
        </div>
        <div style="padding:16px 32px;background-color:#f9fafb;color:#6b7280;font-size:12px;text-align:center;">
          <p style="margin:0;">We will notify you again once the package is delivered.</p>
        </div>
      </div>
    </div>
  `;

  const textLines = [
    `Hi ${buyerName ?? 'there'},`,
    `${shopName ?? 'Your seller'} just marked order ${orderId} as shipped.`,
    'Items:',
    ...items.map((line) => `- ${line}`),
    trackingUrl ? `Track shipment: ${trackingUrl}` : undefined,
    orderUrl ? `Order details: ${orderUrl}` : undefined,
  ].filter(Boolean) as string[];

  return {
    subject: `Order ${orderId} shipped`,
    html,
    text: textLines.join('\n'),
  };
}
