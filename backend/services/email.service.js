const nodemailer = require('nodemailer');
const logger = require('../config/logger');

function getAppUrl() {
  return process.env.FRONTEND_URL || 'http://localhost:5173';
}

let transporter = null;

// Initialize the SMTP Transporter
function initMailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const missingVars = [];
  if (!host) missingVars.push('SMTP_HOST');
  if (!port) missingVars.push('SMTP_PORT');
  if (!process.env.SMTP_SECURE) missingVars.push('SMTP_SECURE');
  if (!user) missingVars.push('SMTP_USER');
  if (!pass) missingVars.push('SMTP_PASS');
  if (!process.env.EMAIL_FROM) missingVars.push('EMAIL_FROM');

  if (missingVars.length > 0) {
    if (!host || !port) {
      logger.warn(`Missing critical SMTP variables: ${missingVars.join(', ')}. Email provider is not configured.`);
    } else {
      logger.warn(`Missing SMTP variables: ${missingVars.join(', ')}`);
    }
  }

  if (!host || !port) {
    logger.info('SMTP initialization: Email provider is not configured. Falling back to log-only mode for local testing.');
    transporter = null;
    return null;
  }

  logger.info(`SMTP initialization: Configuring SMTP connection to ${host}:${port} (Secure: ${secure})`);

  const transporterOpts = {
    host,
    port: parseInt(port, 10),
    secure,
  };

  if (user || pass) {
    if (!user) logger.warn('Missing SMTP_USER environment variable');
    if (!pass) logger.warn('Missing SMTP_PASS environment variable');
    transporterOpts.auth = {
      user: user || '',
      pass: pass || '',
    };
  }

  transporter = nodemailer.createTransport(transporterOpts);
  return transporter;
}

// Verify connection
async function verifyMailConnection() {
  if (transporter === null) {
    initMailTransporter();
  }

  if (!transporter) {
    logger.warn('SMTP verification: Transporter not configured. Email verification links will be logged to console.');
    return false;
  }

  try {
    await transporter.verify();
    logger.info('SMTP connection verified');
    return true;
  } catch (error) {
    logger.error('SMTP connection verification failed. SMTP authentication failed or connection error.', {
      error: error.message,
      code: error.code,
    });
    return false;
  }
}

async function sendVerificationEmail({ to, firstName, token }) {
  const verificationUrl = `${getAppUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  const subject = 'Verify your PeopleFlow account';
  const text = `Hi ${firstName || 'there'}, verify your PeopleFlow account by opening this link: ${verificationUrl}`;
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#0f172a">
      <h2 style="margin:0 0 12px">Verify your PeopleFlow account</h2>
      <p>Hi ${firstName || 'there'},</p>
      <p>Confirm your email address to activate your PeopleFlow account.</p>
      <p>
        <a href="${verificationUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:700">
          Verify email
        </a>
      </p>
      <p style="color:#64748b;font-size:13px">This link expires in 24 hours. If you did not create this account, you can ignore this email.</p>
    </div>
  `;

  if (transporter === null) {
    initMailTransporter();
  }

  if (!transporter) {
    logger.warn('Email provider is not configured. Verification link generated for local testing.', {
      to,
      verificationUrl,
    });
    return { sent: false, verificationUrl };
  }

  try {
    const from = process.env.EMAIL_FROM || 'PeopleFlow <onboarding@resend.dev>';
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    logger.info(`Verification email sent to ${to}`, { messageId: info.messageId });
    return { sent: true, verificationUrl };
  } catch (error) {
    logger.error(`Failed to send verification email to ${to}`, {
      error: error.message,
      code: error.code,
    });
    throw error;
  }
}

module.exports = {
  sendVerificationEmail,
  verifyMailConnection,
};
