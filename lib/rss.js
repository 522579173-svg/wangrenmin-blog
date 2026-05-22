// lib/rss.js — Check RSS feed for new articles
const SITE_URL = "https://wangrenmin.com";
const RSS_URL = SITE_URL + "/rss.xml";

async function getLatestArticle() {
  try {
    const res = await fetch(RSS_URL);
    const xml = await res.text();

    // Parse first <item> from RSS
    const titleMatch = xml.match(/<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>/);
    const linkMatch = xml.match(/<link>(https:\/\/wangrenmin\.com\/[^<]+)<\/link>/);
    const dateMatch = xml.match(/<pubDate>([^<]+)<\/pubDate>/);
    const descMatch = xml.match(/<description>([^<]*)<\/description>/);

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
