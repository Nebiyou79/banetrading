// services/emailService.js
// ── Nodemailer-based email service with OTP templates ──

const nodemailer = require('nodemailer');

const BRAND = process.env.BRAND_NAME || 'PrimeBitTrade Clone';
const FROM_NAME = process.env.SMTP_FROM_NAME || BRAND;
const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || 'no-reply@primebittrade.local';

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return _transporter;
}

// ── HTML templates ──
function otpTemplate({ otp, purpose, minutes }) {
  const title = purpose === 'password_reset'
    ? 'Reset your password'
    : 'Verify your email address';
  const intro = purpose === 'password_reset'
    ? `We received a request to reset the password for your ${BRAND} account. Use the code below to continue.`
    : `Welcome to ${BRAND}. Use the code below to verify your email address and activate your account.`;

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#0B0E11;font-family:Inter,Arial,sans-serif;color:#EAECEF;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B0E11;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#161A1E;border:1px solid #2B3139;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 8px 32px;">
                <div style="font-size:14px;color:#F0B90B;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">${BRAND}</div>
                <h1 style="margin:12px 0 0 0;font-size:22px;color:#EAECEF;">${title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0 32px;">
                <p style="margin:16px 0;color:#848E9C;font-size:14px;line-height:1.6;">${intro}</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:16px 32px;">
                <div style="display:inline-block;padding:18px 28px;background:#1E2329;border:1px solid #2B3139;border-radius:10px;">
                  <div style="font-size:32px;letter-spacing:10px;font-weight:700;color:#F0B90B;font-family:'Courier New',monospace;">${otp}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px 32px;">
                <p style="margin:16px 0 0 0;color:#848E9C;font-size:13px;line-height:1.6;">
                  This code expires in <strong style="color:#EAECEF;">${minutes} minutes</strong>. If you didn't request this, you can safely ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 28px 32px;border-top:1px solid #2B3139;">
                <p style="margin:0;color:#5E6673;font-size:12px;line-height:1.6;">
                  For your security, never share this code with anyone. ${BRAND} staff will never ask for it.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// ── Public API ──
async function sendOtpEmail(email, otp, purpose) {
  const minutes = 10;
  const subject = purpose === 'password_reset'
    ? `[${BRAND}] Your password reset code`
    : `[${BRAND}] Your email verification code`;

  try {
    const info = await getTransporter().sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: email,
      subject,
      html: otpTemplate({ otp, purpose, minutes }),
      text: `Your ${BRAND} code is ${otp}. It expires in ${minutes} minutes.`,
    });
    return { messageId: info.messageId };
  } catch (err) {
    console.error('[emailService] sendOtpEmail failed:', err);
    throw err;
  }
}

module.exports = { sendOtpEmail };