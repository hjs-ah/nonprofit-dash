const { send, sendErr, notionFetch, getProp, DB, CORS } = require("./_notion");

module.exports = async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      const data = await notionFetch(`/databases/${DB.ASSETS}/query`, "POST", {});
      const assets = data.results.map(page => ({
        pageId:   page.id,
        title:    getProp(page, "Title") ?? "",
        url:      getProp(page, "URL") ?? "",
        category: getProp(page, "Category") ?? "Other",
        desc:     getProp(page, "Description") ?? "",
      }));
      return send(res, assets);
    }

    if (req.method === "POST") {
      const { title, url, category, desc } = req.body;
      if (!title || !url) return sendErr(res, "title and url are required", 400);
      const page = await notionFetch("/pages", "POST", {
        parent: { database_id: DB.ASSETS },
        properties: {
          "Title":       { title: [{ text: { content: title } }] },
          "URL":         { url },
          "Category":    { select: { name: category ?? "Other" } },
          "Description": { rich_text: [{ text: { content: desc ?? "" } }] },
        },
      });
      return send(res, { ok: true, pageId: page.id });
    }

    if (req.method === "DELETE") {
      const { pageId } = req.body;
      if (!pageId) return sendErr(res, "pageId is required", 400);
      await notionFetch(`/pages/${pageId}`, "PATCH", { archived: true });
      return send(res, { ok: true });
    }

    sendErr(res, "Method not allowed", 405);
  } catch (e) {
    sendErr(res, e.message);
  }
};
