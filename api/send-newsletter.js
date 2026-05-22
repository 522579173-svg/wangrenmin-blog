// api/send-newsletter.js — Check RSS and send newsletter to all subscribers
const { getSubscribers } = require("../lib/subscribers.js");
const { getLatestArticle } = require("../lib/rss.js");
const { sendNewsletter } = require("../lib/email.js");

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const cronSecret = process.env.CRON_SECRET || "wangrenmin-newsletter";
  const token = (req.query && req.query.token) || "";
  const authHeader = req.headers.authorization || "";
  const providedToken = token || authHeader.replace("Bearer ", "");

  if (providedToken !== cronSecret) {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }

  try {
    const article = await getLatestArticle();
    if (!article) {
      return res.status(200).json({ ok: true, message: "No articles found in RSS", sent: 0 });
    }

    const subscribers = await getSubscribers();
    if (subscribers.length === 0) {
      return res.status(200).json({ ok: true, message: "No subscribers yet", sent: 0 });
    }

    const results = await sendNewsletter(subscribers, article);

    return res.status(200).json({
      ok: true,
      message: "Newsletter sent",
      article: article.title,
      sent: results.sent,
      failed: results.failed,
    });
  } catch (e) {
    console.error("Send newsletter error:", e.message);
    return res.status(500).json({ ok: false, message: "Error: " + e.message });
  }
};
