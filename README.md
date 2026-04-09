# 501(c)(3) Formation Dashboard

React + Vite frontend with Vercel serverless API routes. The Notion token stays on the server — the browser never touches Notion directly.

---

## Deploy to Vercel (5 min)

### 1. Create a Notion integration
Go to [notion.so/my-integrations](https://www.notion.so/my-integrations) → **+ New integration** → name it `501c3 Dashboard` → Save → copy the token (starts with `ntn_`).

### 2. Share your Notion databases with the integration
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

### 4. Deploy on Vercel
1. [vercel.com](https://vercel.com) → **Add New Project** → import your repo
2. **Before deploying**, open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `NOTION_TOKEN` | `ntn_your_secret_here` |

3. Click **Deploy** — done.

---

## Local development (API routes included)

```bash
npm install -g vercel
vercel link      # links to your Vercel project, pulls env vars
vercel dev       # runs at http://localhost:3000 with full API routes
```

Frontend-only (no API calls work):
```bash
npm install && npm run dev
```

---

## Troubleshooting

**"Notion token not configured"** — `NOTION_TOKEN` is missing from Vercel environment variables. Add it and redeploy.

**"Save failed"** — Each Notion database needs to have your integration added via **… → Connections**.

**404 on /api/* routes** — Make sure `vercel.json` is included in your repo and the `api/` folder is at the project root.
