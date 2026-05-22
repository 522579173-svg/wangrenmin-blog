// api/subscribe.js — Handle email subscriptions
const { addSubscriber, removeSubscriber } = require("../lib/subscribers.js");

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  let email, action;
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    email = (body.email || "").trim().toLowerCase();
    action = body.action || "subscribe";
  } catch (e) {
    return res.status(400).json({ ok: false, message: "请求格式错误" });
  }

  if (!email || !email.includes("@")) {
    return res.status(400).json({ ok: false, message: "请输入有效的邮箱地址" });
  }

  try {
    let result;
    if (action === "unsubscribe") {
      result = await removeSubscriber(email);
    } else {
      result = await addSubscriber(email);
    }
    return res.status(200).json(result);
  } catch (e) {
    console.error("Subscribe error:", e.message);
    return res.status(500).json({ ok: false, message: "服务器错误，请稍后再试" });
  }
};
