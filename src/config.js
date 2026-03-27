// ─────────────────────────────────────────────────────────────
// config.js  —  reads your Notion token from the environment
//
// DO NOT paste your token here. Set it as a Vercel environment
// variable named VITE_NOTION_TOKEN (see README for instructions).
//
// For local development, create a .env.local file in the project
// root (it is gitignored) with this line:
//   VITE_NOTION_TOKEN=ntn_your_token_here
// ─────────────────────────────────────────────────────────────

export const NOTION_TOKEN = import.meta.env.VITE_NOTION_TOKEN || "";

// Your Notion database IDs — created automatically, do not change
export const DB = {
  ORG_PROFILE:   "ca287e934a68467eae2fdd54968ab069",
  CHECKLIST:     "b9c37255-3d41-47ef-b114-6563ac0690a5",
  ASSETS:        "4ca5d70c79974914b307bd2cdb05d774",
  WEEKLY_LOG:    "617ea8b1c6cc4702af25bd1a5db1ea70",
};
