export type VendorApplicationRejectedEmailProps = {
  applicantName?: string | null;
  rejectionReason?: string | null;
  resubmissionUrl?: string;
};

export function renderVendorApplicationRejectedEmail(props: VendorApplicationRejectedEmailProps) {
  const { applicantName, rejectionReason, resubmissionUrl } = props;
  const greeting = applicantName ? `Hi ${applicantName},` : 'Hi there,';

  const html = `
    <div style="background-color:#fef2f2;padding:32px;font-family:'Helvetica Neue',Arial,sans-serif;color:#111827;">
      <div style="max-width:560px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px rgba(239,68,68,0.18);">
        <div style="background:linear-gradient(135deg,#dc2626 0%,#b91c1c 100%);padding:28px 32px 24px;">
          <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;">Update on your vendor application</h1>
          <p style="margin:10px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">We’re sorry, but we can’t approve it right now</p>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;">${greeting}</p>
          <p style="margin:0 0 16px;font-size:15px;color:#4b5563;">
            Thank you for your interest in becoming a vendor. After reviewing your submission we’re unable to approve it at this time.
          </p>
          ${rejectionReason ? `<div style="margin:24px 0;padding:16px;border-radius:10px;background-color:#fef3c7;border:1px solid #facc15;color:#92400e;"><strong style="display:block;margin-bottom:8px;">Reason provided:</strong><span>${rejectionReason}</span></div>` : ''}
          <p style="margin:0 0 16px;font-size:15px;color:#4b5563;">
            We encourage you to review the details above and submit an updated application once you’re ready.
          </p>
          ${resubmissionUrl ? `<div style="margin-top:24px;text-align:center;"><a href="${resubmissionUrl}" style="display:inline-block;padding:12px 22px;background:linear-gradient(135deg,#f97316 0%,#ea580c 100%);color:#ffffff;text-decoration:none;font-weight:600;border-radius:999px;">Review application requirements</a></div>` : ''}
        </div>
        <div style="padding:16px 32px;background-color:#f9fafb;color:#6b7280;font-size:12px;text-align:center;">
          <p style="margin:0;">Have questions? Reply to this email and our team will help out.</p>
        </div>
      </div>
    </div>
  `;

  const textLines = [
    greeting,
    'Thank you for your interest in becoming a vendor. After reviewing your submission we’re unable to approve it at this time.',
    rejectionReason ? `Reason: ${rejectionReason}` : undefined,
    'We encourage you to review the details above and submit an updated application once you’re ready.',
    resubmissionUrl ? `Review requirements: ${resubmissionUrl}` : undefined,
    'Have questions? Reply to this email and our team will help out.',
  ].filter(Boolean) as string[];

  return {
    subject: 'Vendor application decision',
    html,
    text: textLines.join('\n'),
  };
}
