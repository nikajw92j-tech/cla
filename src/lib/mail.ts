import "server-only";
import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;
function getTransport() {
  if (!process.env.SMTP_HOST) return null;
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
}

const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ENTITIES[c]);

function layout(title: string, body: string, cta?: { label: string; url: string }) {
  return `<!doctype html><html><body style="margin:0;background:#0b0c12;font-family:Inter,Segoe UI,Arial,sans-serif;color:#e8e9f0">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
<div style="font-weight:800;font-size:20px;letter-spacing:-.02em;margin-bottom:28px">nexora<span style="color:#8b7bff">.</span></div>
<div style="background:#141623;border:1px solid #23263a;border-radius:16px;padding:28px">
<h1 style="font-size:20px;margin:0 0 12px">${escape(title)}</h1>
<p style="line-height:1.6;color:#b7b9c9;margin:0 0 20px">${escape(body)}</p>
${
  cta
    ? `<a href="${escape(cta.url)}" style="display:inline-block;background:linear-gradient(135deg,#6d5dfc,#22d3ee);color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">${escape(cta.label)}</a>`
    : ""
}
</div><p style="font-size:12px;color:#6b6e85;margin-top:24px">Nexora Studio · Tbilisi</p></div></body></html>`;
}

/** Sends an email via SMTP, or logs it to the console when SMTP isn't configured. Never throws. */
export async function sendMail(to: string, subject: string, body: string, cta?: { label: string; url: string }) {
  const t = getTransport();
  if (!t) {
    console.info(`\n[mail:dev] to=${to}\n  subject: ${subject}\n  ${body}${cta ? `\n  -> ${cta.url}` : ""}\n`);
    return;
  }
  try {
    await t.sendMail({
      from: process.env.MAIL_FROM || "Nexora <no-reply@nexora.ge>",
      to,
      subject,
      text: `${body}${cta ? `\n\n${cta.label}: ${cta.url}` : ""}`,
      html: layout(subject, body, cta),
    });
  } catch (e) {
    console.error("[mail] failed", e);
  }
}
