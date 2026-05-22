// api/unsubscribe.js — Auto-unsubscribe: removes email from SUBSCRIBERS env var
const { removeSubscriber } = require("../lib/subscribers.js");

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
    const result = await removeSubscriber(email);
    return res.status(200).json(result);
  } catch (e) {
    console.error("Unsubscribe error:", e.message);
    return res.status(500).json({ ok: false, message: "服务器错误，请稍后再试" });
  }
};
