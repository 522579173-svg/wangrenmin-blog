// lib/subscribers.js — Store & manage subscribers via GitHub repo file
const GITHUB_TOKEN = process.env.GITHUB_PAT;
const GITHUB_REPO = "522579173-svg/wangrenmin-blog";
const SUBSCRIBERS_PATH = "data/subscribers.json";

async function githubAPI(path, options = {}) {
  const res = await fetch("https://api.github.com/repos/" + GITHUB_REPO + "/" + path, {
    headers: {
      Authorization: "Bearer " + GITHUB_TOKEN,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error("GitHub API " + res.status + ": " + err);
  }
  return res.json();
}

async function getSubscribers() {
  try {
    const data = await githubAPI("contents/" + SUBSCRIBERS_PATH);
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    return JSON.parse(content);
  } catch (e) {
    return [];
  }
}

async function addSubscriber(email) {
  const list = await getSubscribers();
  if (list.includes(email)) {
    return { ok: false, message: "该邮箱已经订阅过了。" };
  }
  list.push(email);
  await saveSubscribers(list);
  return { ok: true, message: "订阅成功！新文章发布时会自动发送到你的邮箱。" };
}

async function removeSubscriber(email) {
  let list = await getSubscribers();
  const idx = list.indexOf(email);
  if (idx === -1) {
    return { ok: false, message: "该邮箱未订阅。" };
  }
  list.splice(idx, 1);
  await saveSubscribers(list);
  return { ok: true, message: "已退订。" };
}

async function saveSubscribers(list) {
  const content = Buffer.from(JSON.stringify(list, null, 2)).toString("base64");
  let sha;
  try {
    const existing = await githubAPI("contents/" + SUBSCRIBERS_PATH);
    sha = existing.sha;
  } catch (e) {
    // File will be created fresh
  }
  const body = { message: "Update subscribers (" + list.length + " total)", content: content };
  if (sha) body.sha = sha;
  await githubAPI("contents/" + SUBSCRIBERS_PATH, { method: "PUT", body: JSON.stringify(body) });
}

module.exports = { getSubscribers, addSubscriber, removeSubscriber };
