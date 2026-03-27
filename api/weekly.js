// api/weekly.js — GET lists entries, POST creates one
import { notionQuery, notionCreate, getProp, DB, json, err, cors } from "./_notion.js";

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors() });

  try {
    if (req.method === "GET") {
      const data = await notionQuery(DB.WEEKLY_LOG);
      const entries = data.results
        .map(page => ({
          pageId:   page.id,
          label:    getProp(page, "Week") ?? "",
          phase:    getProp(page, "Phase") ?? "",
          summary:  getProp(page, "Summary") ?? "",
          done:     getProp(page, "Actions Completed") ?? "",
          wip:      getProp(page, "In Progress") ?? "",
          blockers: getProp(page, "Blockers") ?? "",
          next:     getProp(page, "Next Steps") ?? "",
        }))
        .sort((a, b) => b.label.localeCompare(a.label));
      return json(entries);
    }

    if (req.method === "POST") {
      const { label, phase, summary, done, wip, blockers, next } = await req.json();
      if (!label) return err("label is required", 400);

      const rt = (val) => ({ rich_text: [{ text: { content: val ?? "" } }] });

      const page = await notionCreate(DB.WEEKLY_LOG, {
        "Week":             { title: [{ text: { content: label } }] },
        "Phase":            { select: { name: phase ?? "Multiple" } },
        "Summary":          rt(summary),
        "Actions Completed":rt(done),
        "In Progress":      rt(wip),
        "Blockers":         rt(blockers),
        "Next Steps":       rt(next),
      });
      return json({ ok: true, pageId: page.id });
    }

    return err("Method not allowed", 405);
  } catch (e) {
    return err(e.message);
  }
}

export const config = { runtime: "edge" };
