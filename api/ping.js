const { send, sendErr, CORS } = require("./_notion");

module.exports = async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();

  const token = process.env.NOTION_TOKEN;
  if (!token) return sendErr(res, "NOTION_TOKEN is not set on the server", 500);

  try {
    const r = await fetch("https://api.notion.com/v1/users/me", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
      },
    });
    if (!r.ok) return sendErr(res, "Notion rejected the token — check NOTION_TOKEN in Vercel", 401);
    const user = await r.json();
    send(res, { ok: true, user: user.name || user.id });
  } catch (e) {
    sendErr(res, e.message);
  }
};
