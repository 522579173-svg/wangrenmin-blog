// api/unsubscribe.js — Handle email unsubscription
// Sends notification to admin, who manually removes from data/subscribers.json
const nodemailer = require("nodemailer");

const SMTP_USER = process.env.QQ_EMAIL || "522579173@qq.com";
const SMTP_PASS = process.env.QQ_SMTP_CODE || "";
const ADMIN_EMAIL = "522579173@qq.com";

function getTransporter() {
  return nodemailer.createTransport({
    host: "smtp.qq.com",
    port: 465,
    secure: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, message: "Method not allowed" });

  let email;
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    email = (body.email || "").trim().toLowerCase();
  } catch (e) {
    return res.status(400).json({ ok: false, message: "请求格式错误" });
  }

  if (!email || !email.includes("@")) {
    return res.status(400).json({ ok: false, message: "请输入有效的邮箱地址" });
  }

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: '"老王的健康指南" <' + SMTP_USER + ">",
      to: ADMIN_EMAIL,
      subject: "退订请求: " + email,
      html: '<div style="font-family:sans-serif;padding:20px;">'
        + '<h2>退订请求</h2>'
        + '<p>邮箱: <strong>' + email + '</strong></p>'
        + '<p>时间: ' + new Date().toLocaleString("zh-CN") + '</p>'
        + '<p style="color:#666;">请将此邮箱从 <code>data/subscribers.json</code> 文件中删除。</p>'
        + "</div>",
    });

    return res.status(200).json({
      ok: true,
      message: "退订请求已提交，我们会尽快处理。",
    });
  } catch (e) {
    console.error("Unsubscribe error:", e.message);
    return res.status(500).json({ ok: false, message: "服务器错误，请稍后再试" });
  }
};
