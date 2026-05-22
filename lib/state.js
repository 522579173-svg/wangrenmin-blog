// lib/state.js — Track newsletter state (last sent article) via GitHub

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const GITHUB_REPO = "522579173-svg/wangrenmin-blog";
const STATE_PATH = "data/last-sent.json";

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

async function getLastSentLink() {
  try {
    const data = await githubAPI("contents/" + STATE_PATH);
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    return JSON.parse(content).lastLink || "";
  } catch (e) {
    return "";
  }
}

async function setLastSentLink(link) {
  const content = Buffer.from(JSON.stringify({ lastLink: link, updatedAt: new Date().toISOString() })).toString("base64");
  let sha;
  try {
    const existing = await githubAPI("contents/" + STATE_PATH);
    sha = existing.sha;
  } catch (e) {
    // File will be created
  }
  const body = { message: "Update last sent: " + link, content: content };
  if (sha) body.sha = sha;
  await githubAPI("contents/" + STATE_PATH, { method: "PUT", body: JSON.stringify(body) });
}

module.exports = { getLastSentLink, setLastSentLink };
