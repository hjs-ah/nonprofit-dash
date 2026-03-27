// api/assets.js — GET lists, POST creates, DELETE archives
import { notionQuery, notionCreate, notionArchive, getProp, DB, json, err, cors } from "./_notion.js";

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors() });

  try {
    if (req.method === "GET") {
      const data = await notionQuery(DB.ASSETS);
      const assets = data.results.map(page => ({
        pageId:   page.id,
        title:    getProp(page, "Title") ?? "",
        url:      getProp(page, "URL") ?? "",
        category: getProp(page, "Category") ?? "Other",
        desc:     getProp(page, "Description") ?? "",
      }));
      return json(assets);
    }

    if (req.method === "POST") {
      const { title, url, category, desc } = await req.json();
      if (!title || !url) return err("title and url are required", 400);

      const page = await notionCreate(DB.ASSETS, {
        "Title":       { title: [{ text: { content: title } }] },
        "URL":         { url },
        "Category":    { select: { name: category ?? "Other" } },
        "Description": { rich_text: [{ text: { content: desc ?? "" } }] },
      });
      return json({ ok: true, pageId: page.id });
    }

    if (req.method === "DELETE") {
      const { pageId } = await req.json();
      if (!pageId) return err("pageId is required", 400);
      await notionArchive(pageId);
      return json({ ok: true });
    }

    return err("Method not allowed", 405);
  } catch (e) {
    return err(e.message);
  }
}

export const config = { runtime: "edge" };
