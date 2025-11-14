export type ShopCreatedEmailProps = {
  shopName: string;
  vendorName?: string | null;
  dashboardUrl: string;
};

export function renderShopCreatedEmail(props: ShopCreatedEmailProps) {
  const { shopName, vendorName, dashboardUrl } = props;

  const greeting = vendorName ? `Hi ${vendorName},` : 'Hi there,';

  const html = `
    <div style="background-color:#f3f4f6;padding:32px;font-family:'Helvetica Neue',Arial,sans-serif;color:#111827;">
      <div style="max-width:560px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px rgba(15,23,42,0.12);">
        <div style="background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);padding:28px 32px 24px;">
          <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;">Your shop has been created!</h1>
          <p style="margin:10px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Welcome to the marketplace</p>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;">${greeting}</p>
          <p style="margin:0 0 16px;font-size:15px;color:#4b5563;">
            Congratulations! Your shop <strong>"${shopName}"</strong> has been successfully created.
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#4b5563;">
            Your shop is now pending admin review. Once approved, you'll be able to start selling and listing products. In the meantime, you can:
          </p>
          <ul style="margin:0 0 24px;padding-left:18px;color:#4b5563;font-size:14px;">
            <li style="margin-bottom:8px;">Complete your vendor application</li>
            <li style="margin-bottom:8px;">Set up your shop details and branding</li>
            <li style="margin-bottom:8px;">Prepare your product listings</li>
          </ul>
          <div style="margin-top:24px;text-align:center;">
            <a href="${dashboardUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);color:#ffffff;text-decoration:none;font-weight:600;border-radius:8px;font-size:15px;">Go to Dashboard</a>
          </div>
        </div>
        <div style="padding:16px 32px;background-color:#f9fafb;color:#6b7280;font-size:12px;text-align:center;">
          <p style="margin:0;">Need help? Reply to this email and our team will assist you.</p>
        </div>
      </div>
    </div>
  `;

  const textLines = [
    greeting,
    `Congratulations! Your shop "${shopName}" has been successfully created.`,
    'Your shop is now pending admin review. Once approved, you\'ll be able to start selling and listing products.',
    'In the meantime, you can:',
    '- Complete your vendor application',
    '- Set up your shop details and branding',
    '- Prepare your product listings',
    `Dashboard: ${dashboardUrl}`,
    'Need help? Reply to this email and our team will assist you.',
  ];

  return {
    subject: `Your shop "${shopName}" has been created`,
    html,
    text: textLines.join('\n'),
  };
}
