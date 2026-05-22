// api/send-newsletter.js — Check RSS and send newsletter to all subscribers
const { getSubscribers } = require("../lib/subscribers.js");
const { getLatestArticle } = require("../lib/rss.js");
const { sendNewsletter } = require("../lib/email.js");
const { getLastSentLink, setLastSentLink } = require("../lib/state.js");

module.exports = async function handler(req, res) {
  // Only allow GET (for cron trigger) or POST (for manual trigger)
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  // Optional: check a secret token to prevent unauthorized triggers
  const cronSecret = process.env.CRON_SECRET || "wangrenmin-newsletter";
  const token = req.query ? req.query.token : "";
  const authHeader = req.headers.authorization || "";
  const providedToken = token || authHeader.replace("Bearer ", "");

  if (providedToken !== cronSecret && req.method === "GET") {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }

  try {
    // Check RSS for latest article
    const article = await getLatestArticle();
    if (!article) {
      return res.status(200).json({ ok: true, message: "No articles found in RSS", sent: 0 });
    }

    // Check if this article was already sent
    const lastSent = await getLastSentLink();
    if (article.link === lastSent) {
      return res.status(200).json({ ok: true, message: "Already sent: " + article.title, sent: 0 });
    }

    // Get subscribers
    const subscribers = await getSubscribers();
    if (subscribers.length === 0) {
      return res.status(200).json({ ok: true, message: "No subscribers yet", sent: 0 });
    }

    // Send newsletter
    const results = await sendNewsletter(subscribers, article);

    // Mark as sent
    await setLastSentLink(article.link);

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
