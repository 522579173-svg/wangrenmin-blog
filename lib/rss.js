// lib/rss.js — Check RSS feed for latest article
const SITE_URL = "https://wangrenmin.com";
const RSS_URL = SITE_URL + "/rss.xml";

async function getLatestArticle() {
  try {
    const res = await fetch(RSS_URL);
    if (!res.ok) return null;
    const xml = await res.text();

    // Parse first <item> from RSS
    const itemMatch = xml.match(/<item>([\s\S]*?)<\/item>/);
    if (!itemMatch) return null;
    const item = itemMatch[1];

    const titleMatch = item.match(/<title>([^<]+)<\/title>/);
    const linkMatch = item.match(/<link>([^<]+)<\/link>/);
    const descMatch = item.match(/<description>([^<]*)<\/description>/);
    const dateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/);

    if (!titleMatch || !linkMatch) return null;

    return {
      title: titleMatch[1],
      link: linkMatch[1],
      pubDate: dateMatch ? dateMatch[1] : "",
      description: descMatch ? descMatch[1] : "",
    };
  } catch (e) {
    console.error("RSS fetch error:", e.message);
    return null;
  }
}

module.exports = { getLatestArticle };
