export type VendorApplicationApprovedEmailProps = {
  applicantName?: string | null;
  dashboardUrl?: string;
};

export function renderVendorApplicationApprovedEmail(props: VendorApplicationApprovedEmailProps) {
  const { applicantName, dashboardUrl } = props;

  const greeting = applicantName ? `Hi ${applicantName},` : 'Hi there,';

  const html = `
    <div style="background-color:#f3f4f6;padding:32px;font-family:'Helvetica Neue',Arial,sans-serif;color:#111827;">
      <div style="max-width:560px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px rgba(15,23,42,0.12);">
        <div style="background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);padding:28px 32px 24px;">
          <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;">Your vendor application has been approved</h1>
          <p style="margin:10px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Welcome to the marketplace!</p>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;">${greeting}</p>
          <p style="margin:0 0 16px;font-size:15px;color:#4b5563;">
            Great news! Our team has reviewed and approved your vendor application. You can now access your vendor dashboard, finish setting up your shop, and start listing products.
          </p>
          <ul style="margin:0 0 24px;padding-left:18px;color:#4b5563;font-size:14px;">
            <li style="margin-bottom:8px;">Complete any remaining onboarding steps.</li>
            <li style="margin-bottom:8px;">Create or update your shop details.</li>
            <li style="margin-bottom:8px;">Publish products to start selling.</li>
          </ul>
          ${dashboardUrl ? `<div style="margin-top:24px;text-align:center;"><a href="${dashboardUrl}" style="display:inline-block;padding:12px 22px;background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);color:#ffffff;text-decoration:none;font-weight:600;border-radius:999px;">Go to vendor dashboard</a></div>` : ''}
        </div>
        <div style="padding:16px 32px;background-color:#f9fafb;color:#6b7280;font-size:12px;text-align:center;">
          <p style="margin:0;">Need help? Reply to this email and our team will assist you.</p>
        </div>
      </div>
    </div>
  `;

  const textLines = [
    greeting,
    'Great news! Your vendor application has been approved.',
    'You can now access your vendor dashboard, finish setting up your shop, and start listing products.',
    dashboardUrl ? `Vendor dashboard: ${dashboardUrl}` : undefined,
    'Need help? Reply to this email and our team will assist you.',
  ].filter(Boolean) as string[];

  return {
    subject: 'Vendor application approved',
    html,
    text: textLines.join('\n'),
  };
}
