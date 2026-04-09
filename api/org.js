const { send, sendErr, notionFetch, getProp, DB, CORS } = require("./_notion");

module.exports = async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      const data = await notionFetch(`/databases/${DB.ORG_PROFILE}/query`, "POST", {});
      const result = {};
      for (const page of data.results) {
        const field = getProp(page, "Field");
        const value = getProp(page, "Value");
        if (field) result[field] = { value: value ?? "", pageId: page.id };
      }
      return send(res, result);
    }

    if (req.method === "POST") {
      const { field, value, pageId } = req.body;
      if (!field) return sendErr(res, "field is required", 400);

      if (pageId) {
        await notionFetch(`/pages/${pageId}`, "PATCH", {
          properties: { "Value": { rich_text: [{ text: { content: value ?? "" } }] } },
        });
        return send(res, { ok: true, pageId });
      } else {
        const page = await notionFetch("/pages", "POST", {
          parent: { database_id: DB.ORG_PROFILE },
          properties: {
            "Field": { title: [{ text: { content: field } }] },
            "Value": { rich_text: [{ text: { content: value ?? "" } }] },
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
