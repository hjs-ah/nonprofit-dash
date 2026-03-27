// api/ping.js — tests that the server can reach Notion with the stored token
import { json, err, cors } from "./_notion.js";

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors() });

  try {
    const token = process.env.NOTION_TOKEN;
    if (!token) return err("NOTION_TOKEN is not configured on the server", 500);

    const res = await fetch("https://api.notion.com/v1/users/me", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
      },
    });

    if (!res.ok) return err("Notion rejected the token — check NOTION_TOKEN in Vercel", 401);
    const user = await res.json();
    return json({ ok: true, user: user.name || user.id });
  } catch (e) {
    return err(e.message);
  }
}

export const config = { runtime: "edge" };
