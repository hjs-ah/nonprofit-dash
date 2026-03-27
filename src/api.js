// src/api.js
// All data calls go through /api/* — never directly to Notion.
// The Notion token lives only in Vercel's environment, never in the browser.

async function call(path, method = "GET", body = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

// Connection test
export const ping = () => call("/api/ping");

// Org profile
export const loadOrg    = () => call("/api/org");
export const saveOrgField = (field, value, pageId) =>
  call("/api/org", "POST", { field, value, pageId });

// Checklist
export const loadChecklist = () => call("/api/checklist");
export const saveChecklistItem = (phaseId, taskIndex, taskText, phaseTitle, completed, pageId) =>
  call("/api/checklist", "POST", { phaseId, taskIndex, taskText, phaseTitle, completed, pageId });

// Assets
export const loadAssets  = () => call("/api/assets");
export const saveAsset   = (asset) => call("/api/assets", "POST", asset);
export const deleteAsset = (pageId) => call("/api/assets", "DELETE", { pageId });

// Weekly log
export const loadWeekly  = () => call("/api/weekly");
export const saveWeekly  = (entry) => call("/api/weekly", "POST", entry);
