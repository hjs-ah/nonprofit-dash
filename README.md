# 501(c)(3) Formation Dashboard

A React + Vite web app for tracking nonprofit formation progress, managing board members, logging weekly activity, and organizing assets — synced to Notion.

---

## ⚠️ Token security

Your Notion integration token is a secret. It must **never** be pasted into source code or committed to git.

This project reads the token from an environment variable named `VITE_NOTION_TOKEN`. Set it in Vercel (for production) or in `.env.local` (for local development). Both methods are described below.

---

## Step 1 — Create your Notion integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **+ New integration**
3. Name it `501c3 Dashboard`, select your workspace, click **Save**
4. Copy the **Internal Integration Secret** (starts with `ntn_` or `secret_`)

## Step 2 — Share your Notion databases with the integration

Open each database in Notion → click **…** (top right) → **Connections** → find and add your integration:

- Checklist Progress
- Organization Profile
- Assets & Links
- Weekly Activity Log

---

## Local development

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher

### Setup

```bash
# 1. Copy the example env file
cp .env.local.example .env.local

# 2. Paste your Notion token into .env.local
#    Open .env.local and replace the placeholder:
#    VITE_NOTION_TOKEN=ntn_your_actual_token_here

# 3. Install dependencies
npm install

# 4. Start the dev server
npm run dev
# Opens at http://localhost:5173
```

`.env.local` is listed in `.gitignore` and will never be committed.

---

## Deploy to Vercel

### Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nonprofit-dashboard.git
git push -u origin main
```

### Connect to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Before clicking Deploy, open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `VITE_NOTION_TOKEN` | `ntn_your_token_here` |

4. Click **Deploy**

Vercel injects `VITE_NOTION_TOKEN` at build time. It is never written to any file and never exposed in your git history.

### Update the token later

Vercel Dashboard → your project → **Settings → Environment Variables** → edit `VITE_NOTION_TOKEN` → redeploy.

---

## Auto-deploy on push

After the initial setup, every `git push` to `main` redeploys automatically in ~30 seconds.

```bash
# Make a change, then:
git add .
git commit -m "Update checklist"
git push
```

---

## Project structure

```
nonprofit-dashboard/
├── .env.local.example   ← copy to .env.local for local dev
├── .gitignore           ← .env.local and node_modules excluded
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx         ← React entry point
    ├── App.jsx          ← full dashboard UI
    ├── notion.js        ← all Notion API calls
    └── config.js        ← reads token from import.meta.env
```

---

## How data saves

| Section | Saves to Notion when... |
|---|---|
| Org profile fields | 1.2 seconds after you stop typing |
| Checklist checkboxes | Immediately on toggle |
| Assets | On clicking "Save to Notion" |
| Weekly log entries | On clicking "Save to Notion" |

A floating **Saved to Notion ✓** badge confirms every successful write.

---

*Built with React 18 + Vite 5. No external UI libraries.*
