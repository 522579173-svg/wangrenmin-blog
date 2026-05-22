// lib/subscribers.js — Read/write subscribers via /tmp (persists while Lambda is warm)
// Falls back to built-in list on cold start.
const fs = require("fs");
const path = require("path");

const TMP_FILE = "/tmp/subscribers.json";
const DEFAULT_LIST = ["522579173@qq.com", "843991851@qq.com"];

function readFromDisk() {
  try {
    if (fs.existsSync(TMP_FILE)) {
      return JSON.parse(fs.readFileSync(TMP_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("read error:", e.message);
  }
  return null;
}

function writeToDisk(list) {
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(list), "utf-8");
  } catch (e) {
    console.error("write error:", e.message);
  }
}

function getSubscribers() {
  const disk = readFromDisk();
  if (disk && disk.length > 0) {
    return disk;
  }
  // Cold start: use default list + try env var backup
  try {
    const envData = process.env.SUBSCRIBERS;
    if (envData) {
      const parsed = JSON.parse(envData);
      if (parsed.length > 0) {
        writeToDisk(parsed);
        return parsed;
      }
    }
  } catch (e) { /* ignore */ }
  writeToDisk(DEFAULT_LIST);
  return DEFAULT_LIST.slice();
}

function saveSubscribers(list) {
  writeToDisk(list);
}

function addSubscriber(email) {
  const list = getSubscribers();
  if (list.includes(email)) {
    return { ok: false, message: "该邮箱已经订阅过了。" };
  }
  list.push(email);
  saveSubscribers(list);
  return { ok: true, message: "订阅成功！新文章发布时会自动发送到你的邮箱。" };
}

function removeSubscriber(email) {
  const list = getSubscribers();
  const idx = list.indexOf(email);
  if (idx === -1) {
    return { ok: false, message: "该邮箱未订阅。" };
  }
  list.splice(idx, 1);
  saveSubscribers(list);
  return { ok: true, message: "已退订，你将不再收到邮件。" };
}

module.exports = { getSubscribers, addSubscriber, removeSubscriber };
