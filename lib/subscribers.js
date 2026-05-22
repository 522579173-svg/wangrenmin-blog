// lib/subscribers.js — Auto-manage subscribers via Vercel Env Var API
const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN || "";
const PROJECT_ID = "prj_FrY1bby819TVYWroMT7uDXYJWT3t";
const ENV_KEY = "SUBSCRIBERS";

async function vercelAPI(path, method, body) {
  const opts = {
    method: method || "GET",
    headers: {
      Authorization: "Bearer " + VERCEL_TOKEN,
      "Content-Type": "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch("https://api.vercel.com" + path, opts);
  if (!res.ok) {
    const err = await res.text();
    throw new Error("Vercel API " + res.status + ": " + err);
  }
  return res.json();
}

async function getSubscribers() {
  try {
    const data = await vercelAPI("/v10/projects/" + PROJECT_ID + "/env/" + ENV_KEY);
    if (data && data.value) {
      return JSON.parse(data.value);
    }
  } catch (e) {
    console.error("getSubscribers error:", e.message);
  }
  return [];
}

async function saveSubscribers(list) {
  const value = JSON.stringify(list);
  try {
    // Get current env var to find its ID
    const current = await vercelAPI("/v10/projects/" + PROJECT_ID + "/env/" + ENV_KEY);
    const envId = current.id;
    // Update it
    await vercelAPI("/v10/projects/" + PROJECT_ID + "/env/" + envId, "PATCH", {
      value: value,
      type: "plain",
      target: ["production"],
    });
  } catch (e) {
    console.error("saveSubscribers error:", e.message);
    throw e;
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
  const list = await getSubscribers();
  const idx = list.indexOf(email);
  if (idx === -1) {
    return { ok: false, message: "该邮箱未订阅。" };
  }
  list.splice(idx, 1);
  await saveSubscribers(list);
  return { ok: true, message: "已退订，你将不再收到邮件。" };
}

module.exports = { getSubscribers, addSubscriber, removeSubscriber };
