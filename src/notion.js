// ─────────────────────────────────────────────────────────────
// notion.js  —  All Notion API calls for the dashboard
//
// HOW TO GET YOUR TOKEN:
//   1. Go to https://www.notion.so/my-integrations
//   2. Click "+ New integration"
//   3. Name it "501c3 Dashboard", select your workspace, click Save
//   4. Copy the "Internal Integration Secret" (starts with ntn_ or secret_)
//   5. Paste it into the NOTION_TOKEN field in src/config.js
//
// DATABASE IDs (already filled in from your workspace):
//   These were created for you — do not change them.
// ─────────────────────────────────────────────────────────────

const BASE = "https://api.notion.com/v1";
const VERSION = "2022-06-28";

function headers(token) {
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    "Notion-Version": VERSION,
  };
}

async function query(token, databaseId, filter = null) {
  const body = filter ? { filter } : {};
  const res = await fetch(`${BASE}/databases/${databaseId}/query`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Notion query failed: ${res.status}`);
  return res.json();
}

async function createPage(token, databaseId, properties) {
  const res = await fetch(`${BASE}/pages`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties,
    }),
  });
  if (!res.ok) throw new Error(`Notion create failed: ${res.status}`);
  return res.json();
}

async function updatePage(token, pageId, properties) {
  const res = await fetch(`${BASE}/pages/${pageId}`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify({ properties }),
  });
  if (!res.ok) throw new Error(`Notion update failed: ${res.status}`);
  return res.json();
}

async function archivePage(token, pageId) {
  const res = await fetch(`${BASE}/pages/${pageId}`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify({ archived: true }),
  });
  if (!res.ok) throw new Error(`Notion archive failed: ${res.status}`);
  return res.json();
}

// ── Helpers to extract Notion property values
function getProp(page, name) {
  const p = page.properties[name];
  if (!p) return null;
  if (p.type === "title") return p.title?.map(t => t.plain_text).join("") || "";
  if (p.type === "rich_text") return p.rich_text?.map(t => t.plain_text).join("") || "";
  if (p.type === "number") return p.number;
  if (p.type === "checkbox") return p.checkbox;
  if (p.type === "select") return p.select?.name || null;
  if (p.type === "url") return p.url || "";
  if (p.type === "date") return p.date?.start || null;
  return null;
}

// ── Org Profile
export async function loadOrgProfile(token, dbId) {
  const data = await query(token, dbId);
  const result = {};
  for (const page of data.results) {
    const field = getProp(page, "Field");
    const value = getProp(page, "Value");
    if (field) result[field] = { value: value || "", pageId: page.id };
  }
  return result;
}

export async function saveOrgField(token, dbId, profile, field, value) {
  if (profile[field]?.pageId) {
    await updatePage(token, profile[field].pageId, {
      "Value": { rich_text: [{ text: { content: value } }] },
    });
  } else {
    await createPage(token, dbId, {
      "Field": { title: [{ text: { content: field } }] },
      "Value": { rich_text: [{ text: { content: value } }] },
    });
  }
}

// ── Checklist
export async function loadChecklist(token, dbId) {
  const data = await query(token, dbId);
  const result = {};
  for (const page of data.results) {
    const key = getProp(page, "Task Key");
    const completed = getProp(page, "Completed");
    if (key) result[key] = { completed: !!completed, pageId: page.id };
  }
  return result;
}

export async function saveChecklistItem(token, dbId, checklist, phaseId, taskIndex, taskText, phaseTitle, completed) {
  const key = `${phaseId}-${taskIndex}`;
  if (checklist[key]?.pageId) {
    await updatePage(token, checklist[key].pageId, {
      "Completed": { checkbox: completed },
    });
  } else {
    await createPage(token, dbId, {
      "Task Key": { title: [{ text: { content: key } }] },
      "Phase ID": { number: phaseId },
      "Task Index": { number: taskIndex },
      "Phase Title": { rich_text: [{ text: { content: phaseTitle } }] },
      "Task Text": { rich_text: [{ text: { content: taskText } }] },
      "Completed": { checkbox: completed },
    });
  }
}

// ── Assets & Links
export async function loadAssets(token, dbId) {
  const data = await query(token, dbId);
  return data.results.map(page => ({
    pageId: page.id,
    title: getProp(page, "Title") || "",
    url: getProp(page, "URL") || "",
    category: getProp(page, "Category") || "Other",
    desc: getProp(page, "Description") || "",
  }));
}

export async function saveAsset(token, dbId, asset) {
  return createPage(token, dbId, {
    "Title": { title: [{ text: { content: asset.title } }] },
    "URL": { url: asset.url },
    "Category": { select: { name: asset.category } },
    "Description": { rich_text: [{ text: { content: asset.desc || "" } }] },
  });
}

export async function deleteAsset(token, pageId) {
  return archivePage(token, pageId);
}

// ── Weekly Log
export async function loadWeeklyLog(token, dbId) {
  const data = await query(token, dbId);
  return data.results
    .map(page => ({
      pageId: page.id,
      label: getProp(page, "Week") || "",
      phase: getProp(page, "Phase") || "",
      summary: getProp(page, "Summary") || "",
      done: getProp(page, "Actions Completed") || "",
      wip: getProp(page, "In Progress") || "",
      blockers: getProp(page, "Blockers") || "",
      next: getProp(page, "Next Steps") || "",
    }))
    .sort((a, b) => b.label.localeCompare(a.label));
}

export async function saveWeeklyEntry(token, dbId, entry) {
  return createPage(token, dbId, {
    "Week": { title: [{ text: { content: entry.label } }] },
    "Phase": { select: { name: entry.phase } },
    "Summary": { rich_text: [{ text: { content: entry.summary || "" } }] },
    "Actions Completed": { rich_text: [{ text: { content: entry.done || "" } }] },
    "In Progress": { rich_text: [{ text: { content: entry.wip || "" } }] },
    "Blockers": { rich_text: [{ text: { content: entry.blockers || "" } }] },
    "Next Steps": { rich_text: [{ text: { content: entry.next || "" } }] },
  });
}

// ── Board Members
export async function loadBoardMembers(token, dbId) {
  const data = await query(token, dbId);
  return data.results.map(page => ({
    pageId: page.id,
    name: getProp(page, "Name") || "",
    role: getProp(page, "Role") || "",
    bio: getProp(page, "Bio") || "",
    initials: (getProp(page, "Name") || "??").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
    hue: "#2563eb",
  }));
}

export async function saveBoardMember(token, dbId, member) {
  return createPage(token, dbId, {
    "Name": { title: [{ text: { content: member.name } }] },
    "Role": { rich_text: [{ text: { content: member.role } }] },
    "Bio": { rich_text: [{ text: { content: member.bio } }] },
  });
}

// ── Connection test
export async function testConnection(token) {
  const res = await fetch(`${BASE}/users/me`, {
    headers: headers(token),
  });
  return res.ok;
}
