// api/checklist.js — GET loads all checked tasks, POST toggles one
import { notionQuery, notionCreate, notionUpdate, getProp, DB, json, err, cors } from "./_notion.js";

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors() });

  try {
    if (req.method === "GET") {
      const data = await notionQuery(DB.CHECKLIST);
      const result = {};
      for (const page of data.results) {
        const key = getProp(page, "Task Key");
        const completed = getProp(page, "Completed");
        if (key) result[key] = { completed: !!completed, pageId: page.id };
      }
      return json(result);
    }

    if (req.method === "POST") {
      const { phaseId, taskIndex, taskText, phaseTitle, completed, pageId } = await req.json();
      const key = `${phaseId}-${taskIndex}`;

      if (pageId) {
        await notionUpdate(pageId, {
          "Completed": { checkbox: !!completed },
        });
        return json({ ok: true, pageId });
      } else {
        const page = await notionCreate(DB.CHECKLIST, {
          "Task Key":   { title: [{ text: { content: key } }] },
          "Phase ID":   { number: phaseId },
          "Task Index": { number: taskIndex },
          "Phase Title":{ rich_text: [{ text: { content: phaseTitle ?? "" } }] },
          "Task Text":  { rich_text: [{ text: { content: taskText ?? "" } }] },
          "Completed":  { checkbox: !!completed },
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
