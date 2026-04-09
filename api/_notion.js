// api/_notion.js  —  server-side only, never sent to browser

const BASE = "https://api.notion.com/v1";
const VERSION = "2022-06-28";

function headers() {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error("NOTION_TOKEN environment variable is not set");
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    "Notion-Version": VERSION,
  };
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function send(res, data, status = 200) {
  res.setHeader("Content-Type", "application/json");
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  res.status(status).json(data);
}

function sendErr(res, message, status = 500) {
  send(res, { error: message }, status);
}

async function notionFetch(path, method = "GET", body = null) {
  const opts = { method, headers: headers() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Notion ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

function getProp(page, name) {
  const p = page.properties?.[name];
  if (!p) return null;
  if (p.type === "title")     return p.title?.map(t => t.plain_text).join("") ?? "";
  if (p.type === "rich_text") return p.rich_text?.map(t => t.plain_text).join("") ?? "";
  if (p.type === "number")    return p.number;
  if (p.type === "checkbox")  return p.checkbox;
  if (p.type === "select")    return p.select?.name ?? null;
  if (p.type === "url")       return p.url ?? "";
  return null;
}

const DB = {
  ORG_PROFILE: "ca287e934a68467eae2fdd54968ab069",
  CHECKLIST:   "b9c37255-3d41-47ef-b114-6563ac0690a5",
  ASSETS:      "4ca5d70c79974914b307bd2cdb05d774",
  WEEKLY_LOG:  "617ea8b1c6cc4702af25bd1a5db1ea70",
};

module.exports = { send, sendErr, notionFetch, getProp, DB, CORS };
