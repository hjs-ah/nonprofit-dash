# 501(c)(3) Formation Dashboard

React + Vite frontend with Vercel serverless API routes as the backend. The Notion token lives only in Vercel's encrypted environment — it is never in source code or sent to the browser.

---

## Architecture

```
Browser (React)  →  /api/*  →  Vercel Edge Functions  →  Notion API
                      ↑
              Token injected here
              from process.env.NOTION_TOKEN
              Never reaches the browser
```

---

## One-time setup

### 1. Create a Notion integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **+ New integration** → name it `501c3 Dashboard` → Save
3. Copy the **Internal Integration Secret** (starts with `ntn_` or `secret_`)

### 2. Share databases with the integration

Open each database in Notion → **…** → **Connections** → add your integration:

- Checklist Progress
- Organization Profile
- Assets & Links
- Weekly Activity Log

### 3. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nonprofit-dashboard.git
git push -u origin main
```

### 4. Deploy on Vercel + add the token

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
2. **Before clicking Deploy**, open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `NOTION_TOKEN` | `ntn_your_secret_here` |

3. Click **Deploy**

That's it. The token is encrypted in Vercel and injected into the serverless functions at runtime via `process.env.NOTION_TOKEN`. It never appears in the browser or in your git history.

---

## Updating the token

Vercel Dashboard → your project → **Settings → Environment Variables** → edit `NOTION_TOKEN` → **Redeploy**.

---

## Local development

For full local testing (including API routes), use the Vercel CLI:

```bash
npm install -g vercel
vercel link        # link to your Vercel project (pulls env vars)
vercel dev         # runs frontend + API routes on http://localhost:3000
```

Or for frontend-only work with hot reload:

```bash
npm install
npm run dev        # runs at http://localhost:5173
                   # API calls will fail locally without vercel dev
```

---

## Project structure

```
nonprofit-dashboard/
├── api/
│   ├── _notion.js     ← shared Notion helper (server-side only)
│   ├── ping.js        ← GET  /api/ping   — connection test
│   ├── org.js         ← GET/POST /api/org
│   ├── checklist.js   ← GET/POST /api/checklist
│   ├── assets.js      ← GET/POST/DELETE /api/assets
│   └── weekly.js      ← GET/POST /api/weekly
├── src/
│   ├── api.js         ← all frontend fetch calls (talks to /api/*)
│   ├── App.jsx        ← full dashboard UI
│   └── main.jsx       ← React entry point
├── index.html
├── vercel.json
├── vite.config.js
└── package.json
```

---

## How data saves

| Section | Saves when |
|---|---|
| Org profile fields | 1.2s after you stop typing |
| Checklist checkboxes | Instantly on toggle |
| Assets | On "Save to Notion" |
| Weekly log entries | On "Save to Notion" |

A floating **Saved ✓** badge confirms every successful write.

---

## Troubleshooting

**"Notion token not configured"** — Add `NOTION_TOKEN` to Vercel environment variables and redeploy.

**"Save failed"** — Check that each Notion database has been shared with your integration (Step 2 above).

**API routes 404 locally** — Use `vercel dev` instead of `npm run dev` for local API testing.
