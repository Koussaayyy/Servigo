const nodemailer = require("nodemailer");

const SMTP_HOST   = process.env.SMTP_HOST   || "smtp.gmail.com";
const SMTP_PORT   = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "true") === "true";
const SMTP_USER   = process.env.SMTP_USER   || process.env.GMAIL_USER;
const SMTP_PASS   = process.env.SMTP_PASS   || process.env.GMAIL_PASS;
const FROM_NAME   = process.env.MAIL_FROM_NAME  || "Servigo";
const FROM_EMAIL  = process.env.MAIL_FROM_EMAIL || SMTP_USER;
const MAIL_FROM   = `"${FROM_NAME}" <${FROM_EMAIL}>`;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

const allowDevBypass = () =>
  process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_EMAIL_BYPASS === "true";

const send = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({ from: MAIL_FROM, to, subject, html });
  } catch (err) {
    if (allowDevBypass()) {
      console.warn(`[mailer] send failed (${err.message}). Dev bypass active.`);
      return;
    }
    throw err;
  }
};

module.exports = { send };
