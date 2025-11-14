export type EmailVerificationEmailProps = {
  userName?: string | null;
  verificationLink: string;
};

export function renderEmailVerificationEmail(props: EmailVerificationEmailProps) {
  const { userName, verificationLink } = props;

  const greeting = userName ? `Hi ${userName},` : 'Hi there,';

  const html = `
    <div style="background-color:#f3f4f6;padding:32px;font-family:'Helvetica Neue',Arial,sans-serif;color:#111827;">
      <div style="max-width:560px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px rgba(15,23,42,0.12);">
        <div style="background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);padding:28px 32px 24px;">
          <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;">Verify your email address</h1>
          <p style="margin:10px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Complete your account setup</p>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;">${greeting}</p>
          <p style="margin:0 0 24px;font-size:15px;color:#4b5563;">
            Thank you for creating an account with us. To complete your registration and start selling, please verify your email address by clicking the button below.
          </p>
          <div style="margin:28px 0;text-align:center;">
            <a href="${verificationLink}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:#ffffff;text-decoration:none;font-weight:600;border-radius:8px;font-size:15px;">Verify Email Address</a>
          </div>
          <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">
            Or copy and paste this link in your browser:
          </p>
          <p style="margin:8px 0;font-size:12px;color:#3b82f6;word-break:break-all;">
            ${verificationLink}
          </p>
          <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">
            This link will expire in 24 hours. If you didn't create this account, you can safely ignore this email.
          </p>
        </div>
        <div style="padding:16px 32px;background-color:#f9fafb;color:#6b7280;font-size:12px;text-align:center;">
          <p style="margin:0;">Need help? Reply to this email and our team will assist you.</p>
        </div>
      </div>
    </div>
  `;

  const textLines = [
    greeting,
    'Thank you for creating an account with us.',
    'To complete your registration, please verify your email address:',
    verificationLink,
    'This link will expire in 24 hours.',
    'If you didn\'t create this account, you can safely ignore this email.',
    'Need help? Reply to this email and our team will assist you.',
  ];

  return {
    subject: 'Verify your email address',
    html,
    text: textLines.join('\n'),
  };
}
