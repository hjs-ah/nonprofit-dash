// api/org.js — GET loads profile, POST saves a single field
import { notionQuery, notionCreate, notionUpdate, getProp, DB, json, err, cors } from "./_notion.js";

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors() });

  try {
    if (req.method === "GET") {
      const data = await notionQuery(DB.ORG_PROFILE);
      const result = {};
      for (const page of data.results) {
        const field = getProp(page, "Field");
        const value = getProp(page, "Value");
        if (field) result[field] = { value: value ?? "", pageId: page.id };
      }
      return json(result);
    }

    if (req.method === "POST") {
      const { field, value, pageId } = await req.json();
      if (!field) return err("field is required", 400);

      if (pageId) {
        await notionUpdate(pageId, {
          "Value": { rich_text: [{ text: { content: value ?? "" } }] },
        });
        return json({ ok: true, pageId });
      } else {
        const page = await notionCreate(DB.ORG_PROFILE, {
          "Field": { title: [{ text: { content: field } }] },
          "Value": { rich_text: [{ text: { content: value ?? "" } }] },
        });
        return json({ ok: true, pageId: page.id });
      }
    }

    return err("Method not allowed", 405);
  } catch (e) {
    return err(e.message);
  }
}

export const config = { runtime: "edge" };
