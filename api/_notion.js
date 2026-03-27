// api/_notion.js
// Shared Notion API helper — runs server-side only.
// The token is read from process.env.NOTION_TOKEN (set in Vercel dashboard).
// It is NEVER sent to the browser.

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

export async function notionQuery(databaseId, filter = null) {
  const body = filter ? { filter } : {};
  const res = await fetch(`${BASE}/databases/${databaseId}/query`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Notion query failed ${res.status}: ${err}`);
  }
  return res.json();
}

export async function notionCreate(databaseId, properties) {
  const res = await fetch(`${BASE}/pages`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ parent: { database_id: databaseId }, properties }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Notion create failed ${res.status}: ${err}`);
  }
  return res.json();
}

export async function notionUpdate(pageId, properties) {
  const res = await fetch(`${BASE}/pages/${pageId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ properties }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Notion update failed ${res.status}: ${err}`);
  }
  return res.json();
}

export async function notionArchive(pageId) {
  const res = await fetch(`${BASE}/pages/${pageId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ archived: true }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Notion archive failed ${res.status}: ${err}`);
  }
  return res.json();
}

// Extract plain text from Notion property
export function getProp(page, name) {
  const p = page.properties?.[name];
  if (!p) return null;
  if (p.type === "title")      return p.title?.map(t => t.plain_text).join("") ?? "";
  if (p.type === "rich_text")  return p.rich_text?.map(t => t.plain_text).join("") ?? "";
  if (p.type === "number")     return p.number;
  if (p.type === "checkbox")   return p.checkbox;
  if (p.type === "select")     return p.select?.name ?? null;
  if (p.type === "url")        return p.url ?? "";
  return null;
}

// Standard CORS headers — allow requests from your own Vercel domain only
export function cors(req) {
  return {
    "Access-Control-Allow-Origin": "*", // Vercel restricts this to same-origin already
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// Helper to send JSON responses
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...cors() },
  });
}

export function err(message, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...cors() },
  });
}

// Database IDs — matches what was created in your Notion workspace
export const DB = {
  ORG_PROFILE: "ca287e934a68467eae2fdd54968ab069",
  CHECKLIST:   "b9c37255-3d41-47ef-b114-6563ac0690a5",
  ASSETS:      "4ca5d70c79974914b307bd2cdb05d774",
  WEEKLY_LOG:  "617ea8b1c6cc4702af25bd1a5db1ea70",
};
