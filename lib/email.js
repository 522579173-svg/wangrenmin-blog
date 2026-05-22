// lib/email.js — Send emails via QQ SMTP
const nodemailer = require("nodemailer");

const SMTP_USER = process.env.QQ_EMAIL || "522579173@qq.com";
const SMTP_PASS = process.env.QQ_SMTP_CODE || "";

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.qq.com",
      port: 465,
      secure: true,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

async function sendNewsletter(subscribers, article) {
  const transporter = getTransporter();
  const results = { sent: 0, failed: 0 };

  for (const email of subscribers) {
    try {
      await transporter.sendMail({
        from: '"老王的健康指南" <' + SMTP_USER + ">",
        to: email,
        subject: article.title,
        html: newsletterHTML(article),
      });
      results.sent++;
      console.log("Sent to:", email);
    } catch (e) {
      results.failed++;
      console.error("Failed to send to", email, ":", e.message);
    }
    // Small delay between sends to avoid rate limiting
    await new Promise((r) => setTimeout(r, 2000));
  }

  return results;
}

function newsletterHTML(article) {
  return (
    '<div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;padding:20px;">' +
    '<div style="text-align:center;padding:30px 0;border-bottom:2px solid #5B7B5E;">' +
    '<h1 style="color:#5B7B5E;margin:0;">老王的健康指南</h1>' +
    '<p style="color:#888;font-size:14px;">用简单的方式讲靠谱的健康</p>' +
    "</div>" +
    '<div style="padding:30px 0;">' +
    '<h2 style="color:#333;">' +
    article.title +
    "</h2>" +
    '<p style="color:#666;line-height:1.8;">' +
    (article.description || "") +
    "</p>" +
    '<p style="margin-top:24px;">' +
    '<a href="' +
    article.link +
    '" style="background:#5B7B5E;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:16px;">阅读全文 →</a>' +
    "</p>" +
    "</div>" +
    '<div style="border-top:1px solid #eee;padding:20px 0;text-align:center;color:#aaa;font-size:12px;">' +
    "<p>每周一篇健康科普，不卖产品、不刷屏。</p>" +
    '<p>如需退订，请访问 <a href="https://wangrenmin.com/#subscribe" style="color:#aaa;">wangrenmin.com</a> 点击页面底部的"退订"链接。</p>' +
    "</div>" +
    "</div>"
  );
}

module.exports = { sendNewsletter };
