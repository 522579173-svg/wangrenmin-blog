// lib/subscribers.js — Read subscriber list from GitHub raw URL (no auth needed)
const SUBSCRIBERS_URL = "https://raw.githubusercontent.com/522579173-svg/wangrenmin-blog/main/data/subscribers.json";

async function getSubscribers() {
  try {
    const res = await fetch(SUBSCRIBERS_URL);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error("Failed to fetch subscribers:", e.message);
    return [];
  }
}

module.exports = { getSubscribers };
