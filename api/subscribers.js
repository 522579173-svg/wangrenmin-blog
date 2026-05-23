// api/subscribers.js — Single function: subscribe, unsubscribe, and send newsletter
// Uses /tmp for storage (persists while Lambda is warm)
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

const TMP_FILE = "/tmp/subscribers.json";
const DEFAULT_LIST = ["522579173@qq.com", "843991851@qq.com"];
const SMTP_USER = process.env.QQ_EMAIL || "522579173@qq.com";
const SMTP_PASS = process.env.QQ_SMTP_CODE || "";
const CRON_SECRET = process.env.CRON_SECRET || "19730117Cba";
const SITE_URL = "https://wangrenmin.com";

// ---- Subscriber storage ----

function readList() {
  try {
    if (fs.existsSync(TMP_FILE)) {
      return JSON.parse(fs.readFileSync(TMP_FILE, "utf-8"));
    }
  } catch (e) { /* ignore */ }
  return null;
}

function writeList(list) {
  fs.writeFileSync(TMP_FILE, JSON.stringify(list), "utf-8");
}

function getList() {
  const disk = readList();
  if (disk && disk.length > 0) return disk;
  try {
    const env = process.env.SUBSCRIBERS;
    if (env) { const p = JSON.parse(env); if (p.length > 0) { writeList(p); return p; } }
  } catch (e) { /* ignore */ }
  writeList(DEFAULT_LIST);
  return DEFAULT_LIST.slice();
}

// ---- Email ----

function getTransporter() {
  return nodemailer.createTransport({
    host: "smtp.qq.com", port: 465, secure: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

// ---- RSS ----

async function getLatestArticle() {
  try {
    const res = await fetch(SITE_URL + "/rss.xml");
    const xml = await res.text();
    const itemMatch = xml.match(/<item>([\s\S]*?)<\/item>/);
    if (!itemMatch) return null;
    const item = itemMatch[1];
    const titleMatch = item.match(/<title>([^<]+)<\/title>/);
    const linkMatch = item.match(/<link>([^<]+)<\/link>/);
    const descMatch = item.match(/<description>([^<]*)<\/description>/);
    if (!titleMatch || !linkMatch) return null;
    return { title: titleMatch[1], link: linkMatch[1], description: descMatch ? descMatch[1] : "" };
  } catch (e) { return null; }
}

// ---- Main handler ----

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  // Determine action from query param or POST body
  let action = (req.query && req.query.action) || "";
  let email = "";
  let token = (req.query && req.query.token) || "";

  if (req.method === "POST") {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      action = body.action || action;
      email = (body.email || "").trim().toLowerCase();
      token = body.token || token;
    } catch (e) { /* ignore */ }
  }

  // ---- Subscribe ----
  if (action === "subscribe" && email) {
    if (!email.includes("@")) {
      return res.status(400).json({ ok: false, message: "请输入有效的邮箱地址" });
    }
    const list = getList();
    if (list.includes(email)) {
      return res.status(200).json({ ok: false, message: "该邮箱已经订阅过了。" });
    }
    list.push(email);
    writeList(list);

    // Immediately send the latest article to the new subscriber
    let welcomeSent = false;
    try {
      const article = await getLatestArticle();
      if (article) {
        const transporter = getTransporter();
        await transporter.sendMail({
          from: '"老王的健康指南" <' + SMTP_USER + ">",
          to: email,
          subject: "欢迎订阅 · " + article.title,
          html: '<div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;padding:20px;">'
            + '<div style="text-align:center;padding:30px 0;border-bottom:2px solid #5B7B5E;">'
            + '<h1 style="color:#5B7B5E;margin:0;">老王的健康指南</h1>'
            + '<p style="color:#888;font-size:14px;">用简单的方式讲靠谱的健康</p></div>'
            + '<div style="padding:20px 0;"><p style="color:#5B7B5E;font-weight:600;">🎉 订阅成功！</p>'
            + '<p style="color:#666;">下面是为你准备的最新文章：</p></div>'
            + '<div style="padding:10px 0 30px;"><h2 style="color:#333;">' + article.title + '</h2>'
            + '<p style="color:#666;line-height:1.8;">' + (article.description || "") + '</p>'
            + '<p style="margin-top:24px;"><a href="' + article.link + '" style="background:#5B7B5E;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:16px;">阅读全文 →</a></p></div>'
            + '<div style="border-top:1px solid #eee;padding:20px 0;text-align:center;color:#aaa;font-size:12px;">'
            + '<p>每周一篇健康科普，不卖产品、不刷屏。</p>'
            + '<p>如需退订，请访问 <a href="' + SITE_URL + '/#subscribe" style="color:#aaa;">' + SITE_URL + '</a> 点击页面底部的退订链接。</p></div></div>',
        });
        welcomeSent = true;
      }
    } catch (e) {
      console.error("Welcome email failed:", e.message);
    }

    return res.status(200).json({
      ok: true,
      message: welcomeSent
        ? "订阅成功！最新文章已发送到你的邮箱，快去看看吧。"
        : "订阅成功！新文章发布时会自动发送到你的邮箱。",
    });
  }

  // ---- Unsubscribe ----
  if (action === "unsubscribe" && email) {
    if (!email.includes("@")) {
      return res.status(400).json({ ok: false, message: "请输入有效的邮箱地址" });
    }
    const list = getList();
    const idx = list.indexOf(email);
    if (idx === -1) {
      return res.status(200).json({ ok: false, message: "该邮箱未订阅。" });
    }
    list.splice(idx, 1);
    writeList(list);
    return res.status(200).json({ ok: true, message: "已退订，你将不再收到邮件。" });
  }

  // ---- Send newsletter ----
  if (action === "send") {
    if (token !== CRON_SECRET) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }
    try {
      const article = await getLatestArticle();
      if (!article) {
        return res.status(200).json({ ok: true, message: "No articles found", sent: 0 });
      }
      const subscribers = getList();
      if (subscribers.length === 0) {
        return res.status(200).json({ ok: true, message: "No subscribers", sent: 0 });
      }

      const transporter = getTransporter();
      let sent = 0, failed = 0;
      for (const to of subscribers) {
        try {
          await transporter.sendMail({
            from: '"老王的健康指南" <' + SMTP_USER + ">",
            to: to,
            subject: article.title,
            html: '<div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;padding:20px;">'
              + '<div style="text-align:center;padding:30px 0;border-bottom:2px solid #5B7B5E;">'
              + '<h1 style="color:#5B7B5E;margin:0;">老王的健康指南</h1>'
              + '<p style="color:#888;font-size:14px;">用简单的方式讲靠谱的健康</p></div>'
              + '<div style="padding:30px 0;"><h2 style="color:#333;">' + article.title + '</h2>'
              + '<p style="color:#666;line-height:1.8;">' + (article.description || "") + '</p>'
              + '<p style="margin-top:24px;"><a href="' + article.link + '" style="background:#5B7B5E;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:16px;">阅读全文 →</a></p></div>'
              + '<div style="border-top:1px solid #eee;padding:20px 0;text-align:center;color:#aaa;font-size:12px;">'
              + '<p>如需退订，请访问 <a href="' + SITE_URL + '/#subscribe" style="color:#aaa;">' + SITE_URL + '</a> 点击页面底部的退订链接。</p></div></div>',
          });
          sent++;
        } catch (e) {
          failed++;
          console.error("Send to " + to + " failed:", e.message);
        }
        await new Promise(r => setTimeout(r, 2000));
      }
      return res.status(200).json({ ok: true, message: "Newsletter sent", article: article.title, sent: sent, failed: failed });
    } catch (e) {
      console.error("Newsletter error:", e.message);
      return res.status(500).json({ ok: false, message: "Error: " + e.message });
    }
  }

  // ---- Admin: list subscribers ----
  if (action === "list") {
    if (token !== CRON_SECRET) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }
    const list = getList();
    return res.status(200).json({ ok: true, subscribers: list, count: list.length });
  }

  // ---- Admin: add subscriber ----
  if (action === "add" && email) {
    if (token !== CRON_SECRET) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }
    if (!email.includes("@")) {
      return res.status(400).json({ ok: false, message: "请输入有效的邮箱地址" });
    }
    const list = getList();
    if (list.includes(email)) {
      return res.status(200).json({ ok: false, message: "该邮箱已经存在。" });
    }
    list.push(email);
    writeList(list);
    return res.status(200).json({ ok: true, message: "已添加 " + email, count: list.length });
  }

  // ---- Admin: remove subscriber ----
  if (action === "remove" && email) {
    if (token !== CRON_SECRET) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }
    const list = getList();
    const idx = list.indexOf(email);
    if (idx === -1) {
      return res.status(200).json({ ok: false, message: "该邮箱不在列表中。" });
    }
    list.splice(idx, 1);
    writeList(list);
    return res.status(200).json({ ok: true, message: "已删除 " + email, count: list.length });
  }

  // ---- Default: return subscriber count (health check) ----
  const list = getList();
  return res.status(200).json({ ok: true, subscribers: list.length });
};
