const { send, sendErr, notionFetch, getProp, DB, CORS } = require("./_notion");

module.exports = async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      const data = await notionFetch(`/databases/${DB.CHECKLIST}/query`, "POST", {});
      const result = {};
      for (const page of data.results) {
        const key = getProp(page, "Task Key");
        const completed = getProp(page, "Completed");
        if (key) result[key] = { completed: !!completed, pageId: page.id };
      }
      return send(res, result);
    }

    if (req.method === "POST") {
      const { phaseId, taskIndex, taskText, phaseTitle, completed, pageId } = req.body;
      const key = `${phaseId}-${taskIndex}`;

      if (pageId) {
        await notionFetch(`/pages/${pageId}`, "PATCH", {
          properties: { "Completed": { checkbox: !!completed } },
        });
        return send(res, { ok: true, pageId });
      } else {
        const page = await notionFetch("/pages", "POST", {
          parent: { database_id: DB.CHECKLIST },
          properties: {
            "Task Key":   { title: [{ text: { content: key } }] },
            "Phase ID":   { number: phaseId },
            "Task Index": { number: taskIndex },
            "Phase Title":{ rich_text: [{ text: { content: phaseTitle ?? "" } }] },
            "Task Text":  { rich_text: [{ text: { content: taskText ?? "" } }] },
            "Completed":  { checkbox: !!completed },
          },
        });
        return send(res, { ok: true, pageId: page.id });
      }
    }

    sendErr(res, "Method not allowed", 405);
  } catch (e) {
    sendErr(res, e.message);
  }
};
