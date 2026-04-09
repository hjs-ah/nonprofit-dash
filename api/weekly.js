const { send, sendErr, notionFetch, getProp, DB, CORS } = require("./_notion");

module.exports = async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      const data = await notionFetch(`/databases/${DB.WEEKLY_LOG}/query`, "POST", {});
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
      return send(res, entries);
    }

    if (req.method === "POST") {
      const { label, phase, summary, done, wip, blockers, next } = req.body;
      if (!label) return sendErr(res, "label is required", 400);
      const rt = v => ({ rich_text: [{ text: { content: v ?? "" } }] });
      const page = await notionFetch("/pages", "POST", {
        parent: { database_id: DB.WEEKLY_LOG },
        properties: {
          "Week":              { title: [{ text: { content: label } }] },
          "Phase":             { select: { name: phase ?? "Multiple" } },
          "Summary":           rt(summary),
          "Actions Completed": rt(done),
          "In Progress":       rt(wip),
          "Blockers":          rt(blockers),
          "Next Steps":        rt(next),
        },
      });
      return send(res, { ok: true, pageId: page.id });
    }

    sendErr(res, "Method not allowed", 405);
  } catch (e) {
    sendErr(res, e.message);
  }
};
