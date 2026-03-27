# 501(c)(3) Formation Dashboard

A React + Vite web app for tracking nonprofit formation progress, managing board members, logging weekly activity, and organizing assets and links.

---

## Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node)

### Run locally

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

The app opens at **http://localhost:5173** and hot-reloads on file saves.

---

## Deploy to Vercel via GitHub

### Step 1 — Create a GitHub repo

1. Go to [github.com/new](https://github.com/new)
2. Name it `nonprofit-dashboard` (or anything you like)
3. Set to Private if preferred
4. Click **Create repository**

### Step 2 — Push this project to GitHub

In your terminal, inside this project folder:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nonprofit-dashboard.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

### Step 3 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (or create a free account — use "Continue with GitHub")
2. Click **Add New → Project**
3. Find and select your `nonprofit-dashboard` repo
4. Vercel auto-detects Vite — leave all settings as default
5. Click **Deploy**

Vercel gives you a public URL like `https://nonprofit-dashboard-abc123.vercel.app` in about 60 seconds.

### Step 4 — Custom domain (optional)

In your Vercel project settings → Domains, you can add a custom domain like `dashboard.yourorg.org`.

---

## Auto-deploy on push

After initial setup, every `git push` to `main` automatically redeploys. Your workflow becomes:

```bash
# Make changes to src/App.jsx
git add .
git commit -m "Update board members"
git push
# Vercel redeploys automatically in ~30 seconds
```

---

## Project structure

```
nonprofit-dashboard/
├── index.html          # Entry HTML (loads fonts, sets viewport)
├── vite.config.js      # Vite configuration
├── package.json        # Dependencies
└── src/
    ├── main.jsx        # React root
    └── App.jsx         # Entire dashboard (all pages, data, styles)
```

All dashboard content lives in `src/App.jsx`. Data arrays at the top of the file are where you'll customize template content, board members, assets, and phase tasks.

---

## Sections

| Section | Description |
|---|---|
| Overview | Org profile, stats, phase progress summary |
| Formation | 7-phase 501(c)(3) formation checklist |
| Consider | Legal, financial, governance, and program considerations |
| Board | Board member directory with photo upload |
| Impact Report | Annual report structure and PDF upload |
| Financials | Budget, revenue, compliance timeline, required documents |
| Assets | Link library with categories and descriptions |
| Weekly Log | Release-notes-style weekly activity entries |

---

## Mobile

The app is fully responsive:
- **Desktop**: Sidebar navigation on the left
- **Mobile**: Bottom tab bar with a "More" overflow menu for sections 6–8

---

*Built with React 18 + Vite 5. No external UI libraries required.*
