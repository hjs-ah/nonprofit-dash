import { useState, useRef, useCallback, useEffect } from "react";
import {
  ping, loadOrg, saveOrgField,
  loadChecklist, saveChecklistItem,
  loadAssets, saveAsset, deleteAsset,
  loadWeekly, saveWeekly,
} from "./api.js";

// ─────────────────────────────────────────────
// STATIC DATA
// ─────────────────────────────────────────────
const PHASES = [
  { id: 1, title: "Foundation & Governance", tasks: [
    { t: "Choose and verify your organization's legal name", n: "Check availability with your state Secretary of State" },
    { t: "Define your charitable purpose aligned with IRS §501(c)(3)", n: "Education, religion, science, public safety, poverty relief, etc." },
    { t: "Recruit initial board of directors", n: "Minimum 3 unrelated, non-compensated individuals recommended" },
    { t: "Draft organizational bylaws", n: "Include governance rules, officer roles, meeting requirements, quorum" },
    { t: "Hold inaugural board meeting — adopt bylaws, elect officers", n: "Document full minutes; this is your founding record" },
    { t: "Create a conflict of interest policy", n: "Required by IRS Form 1023" },
  ], links: [
    { l: "IRS Charitable Purpose Requirements", u: "https://www.irs.gov/charities-non-profits/charitable-purposes" },
    { l: "Sample Bylaws (Council of Nonprofits)", u: "https://www.councilofnonprofits.org/running-nonprofit/governance/bylaws" },
  ]},
  { id: 2, title: "Legal Incorporation", tasks: [
    { t: "File Articles of Incorporation with your state", n: "Must include required 501(c)(3) dissolution and purpose clauses" },
    { t: "Pay state filing fee", n: "Typically $25–$100 depending on state" },
    { t: "Receive Certificate of Incorporation from state" },
    { t: "Register a Registered Agent in your state", n: "Person or registered agent service" },
    { t: "Obtain your EIN from the IRS", n: "Free — apply online at IRS.gov in minutes" },
  ], links: [
    { l: "IRS EIN Online Application", u: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online" },
  ]},
  { id: 3, title: "IRS 501(c)(3) Application", tasks: [
    { t: "Determine which form to use: 1023-EZ or full Form 1023", n: "1023-EZ: projected gross receipts under $50K/yr, assets under $250K" },
    { t: "Gather Articles of Incorporation (certified copy)" },
    { t: "Gather organizational bylaws" },
    { t: "Prepare financial statements or 3-year budget projections" },
    { t: "Write program descriptions — narrative of planned activities" },
    { t: "Compile list of board members and officers" },
    { t: "Complete and submit Form 1023 or 1023-EZ on Pay.gov", n: "$275 (1023-EZ) · $600 (full 1023)" },
    { t: "Await IRS Determination Letter", n: "1023-EZ: 2–4 weeks · Full 1023: 3–6 months" },
  ], links: [
    { l: "Form 1023-EZ", u: "https://www.irs.gov/forms-pubs/about-form-1023-ez" },
    { l: "Form 1023 (Full)", u: "https://www.irs.gov/forms-pubs/about-form-1023" },
    { l: "Pay.gov", u: "https://www.pay.gov" },
  ]},
  { id: 4, title: "State & Local Compliance", tasks: [
    { t: "Apply for state income tax exemption", n: "Most states auto-recognize after federal approval" },
    { t: "Register for state sales tax exemption" },
    { t: "Register to solicit charitable donations in your state" },
    { t: "Register in other states where you will fundraise" },
    { t: "Obtain any required local business licenses or permits" },
  ], links: [
    { l: "Multi-State Registration (URS)", u: "https://www.multistatefiling.org/" },
    { l: "National Association of State Charity Officials", u: "https://www.nasconet.org/resources/state-government/" },
  ]},
  { id: 5, title: "Banking & Financials", tasks: [
    { t: "Open a dedicated nonprofit bank account", n: "Bring EIN, Articles of Incorporation, and bylaws" },
    { t: "Set up accounting software", n: "QuickBooks Nonprofit, Wave, or Aplos" },
    { t: "Establish a chart of accounts for fund accounting" },
    { t: "Create a Year 1 operating budget" },
    { t: "Set up donation tracking and IRS-compliant receipting", n: "Written acknowledgment required for gifts over $250" },
    { t: "Establish financial controls", n: "Dual signatures on checks, expense approval policy, monthly reconciliation" },
  ], links: []},
  { id: 6, title: "Operations Setup", tasks: [
    { t: "Create an organizational email domain", n: "Google Workspace for Nonprofits or Microsoft 365 Nonprofits — often free" },
    { t: "Build a website with required disclosures", n: "Include mission, EIN, 501(c)(3) status, and privacy policy" },
    { t: "Draft formal descriptions for all initial programs and services" },
    { t: "Develop a Year 1 fundraising plan" },
    { t: "Set up a donor management CRM", n: "Salesforce Nonprofit, Bloomerang, or Little Green Light" },
    { t: "Draft volunteer policies and agreements if applicable" },
    { t: "Purchase Directors & Officers (D&O) liability insurance" },
  ], links: [
    { l: "Google for Nonprofits", u: "https://www.google.com/nonprofits/" },
    { l: "Microsoft 365 Nonprofits", u: "https://www.microsoft.com/en-us/nonprofits/microsoft-365" },
  ]},
  { id: 7, title: "Ongoing Compliance", tasks: [
    { t: "File IRS Form 990 annually", n: "990-N / 990-EZ / full 990 — due 4.5 months after fiscal year end" },
    { t: "Renew state charitable solicitation registrations annually" },
    { t: "Hold annual board meeting and document minutes" },
    { t: "Review and update bylaws and conflict of interest policy as needed" },
    { t: "Maintain organized records — board minutes, financials, donation records", n: "IRS recommends at least 3 years of records" },
    { t: "Report any major changes to the IRS", n: "New programs, address changes, officer changes" },
  ], links: [
    { l: "Form 990 Overview", u: "https://www.irs.gov/forms-pubs/about-form-990" },
    { l: "Nonprofit Compliance Calendar", u: "https://www.councilofnonprofits.org/running-nonprofit/administration/nonprofit-compliance-calendar" },
  ]},
];

const CONSIDERATIONS = [
  { cat: "Legal", items: ["Ensure Articles of Incorporation include IRS-required language for dissolution and charitable purpose — missing these clauses will cause your 501(c)(3) application to be rejected.", "State law governs your nonprofit corporation. Federal law (IRS) governs your tax-exempt status. Both must be maintained independently.", "Your board must include at least 3 unrelated individuals. IRS may scrutinize boards where members are related by blood, marriage, or business interest.", "Private inurement prohibition: no part of net earnings may benefit any private individual. This includes excessive compensation to founders."] },
  { cat: "Financial", items: ["File Form 990 every year, even if you have zero revenue. Three consecutive missed filings result in automatic revocation of tax-exempt status.", "Restricted vs. unrestricted funds: if donors earmark gifts for specific purposes, those funds are legally restricted and must be used only for that purpose.", "Keep personal and organizational finances completely separate from day one. Co-mingling is a red flag during audits.", "Charitable deduction substantiation: donors giving $250+ must receive written acknowledgment. Verbal thank-yous don't count."] },
  { cat: "Governance", items: ["Conflict of interest policies should be adopted at your founding meeting and re-signed annually by all board members and key staff.", "Board members have three legal duties: Duty of Care, Duty of Loyalty, and Duty of Obedience (comply with laws and mission).", "Executive compensation should be set by the board, not by the executive. Document the process using comparability data.", "Meeting minutes are a legal record. They should capture decisions, vote outcomes, and attendance — not a full transcript."] },
  { cat: "Fundraising", items: ["Most states require charitable solicitation registration before you solicit donations — even online. Fines for non-compliance can be significant.", "Grant compliance: foundation grants often come with reporting requirements and restrictions. Track grant terms carefully.", "Quid pro quo contributions (e.g., gala tickets) require you to disclose the fair market value of goods/services received.", "Recurring donors need to be told upfront how to cancel. FTC regulations on automatic payments apply to nonprofits."] },
  { cat: "Program", items: ["Your programs must align with the charitable purpose described in your 1023 application. Significant program changes should be reported to the IRS.", "Document program outcomes from day one — funders will ask for impact data, and retroactive data collection is unreliable.", "Volunteer hour tracking can be valuable for matching grant requirements and in-kind contribution documentation.", "If you hire paid staff, you're now subject to employment law: payroll taxes, workers' comp, and anti-discrimination requirements apply."] },
  { cat: "Technology", items: ["Website accessibility (WCAG 2.1 AA) is increasingly expected by major funders and may be legally required depending on your programs.", "Data privacy: if you collect donor or client data, create a privacy policy and understand state privacy laws (e.g., CCPA).", "Email marketing: CAN-SPAM and CASL apply. Always include unsubscribe options and your physical mailing address.", "Cybersecurity is a governance issue — boards should adopt a basic data security policy, especially if you handle sensitive client information."] },
];

const IMPACT_SECTIONS = [
  { title: "Executive Summary", desc: "A 1–2 paragraph overview of the reporting period's highlights, major milestones, and what readers will find in this report." },
  { title: "Mission & Vision", desc: "Restate your mission and articulate how the year's work moved you closer to the long-term vision." },
  { title: "People Served", desc: "Quantitative data on beneficiaries reached: demographics, geography, program enrollment, and year-over-year comparisons." },
  { title: "Program Highlights", desc: "Story-driven summaries of 2–4 signature programs. Include a compelling client story or testimonial for each." },
  { title: "Partnerships & Collaborations", desc: "Organizations, institutions, and community partners who helped amplify your impact during the year." },
  { title: "Financials at a Glance", desc: "High-level breakdown of revenue sources and expense allocation. Show donors that funds are used responsibly." },
  { title: "Stories of Change", desc: "2–3 narrative case studies featuring real people (with permission) whose lives were affected by your work." },
  { title: "Looking Ahead", desc: "Goals for the next year, new programs planned, and a call to action for donors, volunteers, and partners." },
  { title: "Board & Staff", desc: "List of board members, key staff, and leadership. Demonstrates accountability and organizational health." },
  { title: "Donor Honor Roll", desc: "Recognition of donors by giving level. Tiered acknowledgment encourages giving at higher levels." },
];

const METRICS = ["People served (unduplicated)", "Volunteer hours contributed", "Programs offered & participants", "Geographic reach (zip codes, counties)", "Grants received & grant-to-program ratio", "Donor retention rate year-over-year", "Program cost per person served", "Staff and board diversity metrics"];

const FINANCIALS = {
  budget: [{ category: "Personnel (salaries, benefits)", amount: 120000 }, { category: "Program delivery costs", amount: 85000 }, { category: "Occupancy (rent, utilities)", amount: 24000 }, { category: "Technology & software", amount: 8500 }, { category: "Marketing & communications", amount: 12000 }, { category: "Professional services", amount: 15000 }, { category: "Insurance", amount: 6500 }, { category: "Miscellaneous / contingency", amount: 9000 }],
  revenue: [{ category: "Individual donations", amount: 95000 }, { category: "Foundation grants", amount: 110000 }, { category: "Government grants", amount: 45000 }, { category: "Events & fundraising", amount: 28000 }, { category: "Earned income / fees", amount: 12000 }],
  timeline: [{ month: "Month 1–2", milestone: "Open bank account, set up accounting software, hire bookkeeper" }, { month: "Month 3", milestone: "Finalize Year 1 budget, board adopts financial controls policy" }, { month: "Month 4", milestone: "Submit first grant applications, launch initial fundraising campaign" }, { month: "Month 6", milestone: "Mid-year financial review with board treasurer, update projections" }, { month: "Month 9", milestone: "Begin Year 2 budget planning, assess reserve fund status" }, { month: "Month 12", milestone: "Year-end close, prepare financial statements for Form 990" }, { month: "Month 14–15", milestone: "File Form 990 (due 4.5 months after fiscal year end)" }, { month: "Ongoing", milestone: "Monthly reconciliation, quarterly treasurer reports to board" }],
  documents: [{ name: "Form 1023 / 1023-EZ", desc: "IRS application for tax-exempt status", status: "Required" }, { name: "Form 990 (annual)", desc: "Annual information return; public record", status: "Required" }, { name: "Audited Financial Statements", desc: "Required by many funders at $500K+ revenue", status: "Recommended" }, { name: "IRS Form W-9", desc: "Provided to grantors; confirms EIN and exempt status", status: "Required" }, { name: "Gift Acknowledgment Letters", desc: "Written receipt for donations $250+", status: "Required" }, { name: "Chart of Accounts", desc: "Foundation of your fund accounting system", status: "Required" }, { name: "Financial Controls Policy", desc: "Documents dual-signature rules, expense approvals", status: "Required" }, { name: "Investment Policy Statement", desc: "Guides management of reserve/endowment funds", status: "Recommended" }, { name: "State Charitable Registration", desc: "Annual registration to solicit donations in each state", status: "Required" }, { name: "1099-NEC Forms", desc: "Issued to contractors paid $600+ in a year", status: "Required" }],
};

const ASSET_CATEGORIES = ["Legal", "Financial", "Templates", "Government", "Tools & Software", "Reference", "Other"];
const PHASE_OPTIONS = ["Foundation & Governance", "Legal Incorporation", "IRS Application", "State Compliance", "Banking & Financials", "Operations", "Ongoing Compliance", "Multiple"];
const NAV_ITEMS = [
  { id: "overview", label: "Overview", shortLabel: "Home" },
  { id: "checklist", label: "Formation", shortLabel: "Formation" },
  { id: "consider", label: "Consider", shortLabel: "Consider" },
  { id: "board", label: "Board", shortLabel: "Board" },
  { id: "impact", label: "Impact Report", shortLabel: "Impact" },
  { id: "financials", label: "Financials", shortLabel: "Finance" },
  { id: "assets", label: "Assets", shortLabel: "Assets" },
  { id: "weekly", label: "Weekly Log", shortLabel: "Log" },
];

// ─────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────
const TAG_LIGHT = { Legal:{bg:"#dbeafe",text:"#1d4ed8"}, Financial:{bg:"#dcfce7",text:"#15803d"}, Government:{bg:"#fee2e2",text:"#b91c1c"}, "Tools & Software":{bg:"#ede9fe",text:"#6d28d9"}, Templates:{bg:"#fef9c3",text:"#92400e"}, Reference:{bg:"#f3f4f6",text:"#374151"}, Other:{bg:"#f3f4f6",text:"#374151"}, Required:{bg:"#fee2e2",text:"#b91c1c"}, Recommended:{bg:"#dcfce7",text:"#15803d"}, "Foundation & Governance":{bg:"#dbeafe",text:"#1d4ed8"}, "Legal Incorporation":{bg:"#fef9c3",text:"#92400e"}, "IRS Application":{bg:"#fee2e2",text:"#b91c1c"}, "State Compliance":{bg:"#dcfce7",text:"#15803d"}, "Banking & Financials":{bg:"#ede9fe",text:"#6d28d9"}, Operations:{bg:"#f3f4f6",text:"#374151"}, "Ongoing Compliance":{bg:"#f0fdf4",text:"#166534"}, Multiple:{bg:"#fce7f3",text:"#9d174d"} };
const TAG_DARK  = { Legal:{bg:"rgba(37,99,235,0.15)",text:"#93c5fd"}, Financial:{bg:"rgba(22,163,74,0.15)",text:"#86efac"}, Government:{bg:"rgba(220,38,38,0.15)",text:"#fca5a5"}, "Tools & Software":{bg:"rgba(124,58,237,0.15)",text:"#c4b5fd"}, Templates:{bg:"rgba(180,83,9,0.15)",text:"#fcd34d"}, Reference:{bg:"rgba(255,255,255,0.08)",text:"rgba(255,255,255,0.5)"}, Other:{bg:"rgba(255,255,255,0.08)",text:"rgba(255,255,255,0.5)"}, Required:{bg:"rgba(220,38,38,0.15)",text:"#fca5a5"}, Recommended:{bg:"rgba(22,163,74,0.15)",text:"#86efac"}, "Foundation & Governance":{bg:"rgba(37,99,235,0.15)",text:"#93c5fd"}, "Legal Incorporation":{bg:"rgba(180,83,9,0.15)",text:"#fcd34d"}, "IRS Application":{bg:"rgba(220,38,38,0.15)",text:"#fca5a5"}, "State Compliance":{bg:"rgba(22,163,74,0.15)",text:"#86efac"}, "Banking & Financials":{bg:"rgba(124,58,237,0.15)",text:"#c4b5fd"}, Operations:{bg:"rgba(255,255,255,0.08)",text:"rgba(255,255,255,0.5)"}, "Ongoing Compliance":{bg:"rgba(22,163,74,0.12)",text:"#86efac"}, Multiple:{bg:"rgba(157,23,77,0.15)",text:"#f9a8d4"} };

function buildT(dark) {
  return dark ? {
    bg:"#0f0f0d", surface:"#18181b", surface2:"#1e1e22", border:"rgba(255,255,255,0.08)", border2:"rgba(255,255,255,0.14)",
    text:"#f4f4f5", muted:"rgba(244,244,245,0.5)", muted2:"rgba(244,244,245,0.3)",
    accent:"#6ea8fe", accentBg:"rgba(110,168,254,0.1)", accentBorder:"rgba(110,168,254,0.3)",
    green:"#4ade80", greenBg:"rgba(74,222,128,0.1)", red:"#f87171",
    progTrack:"rgba(255,255,255,0.08)", progFill:"#6ea8fe", sidebarBg:"#111113", inputBg:"rgba(255,255,255,0.04)",
  } : {
    bg:"#f8f7f4", surface:"#ffffff", surface2:"#f1f0ec", border:"rgba(0,0,0,0.09)", border2:"rgba(0,0,0,0.16)",
    text:"#1c1b18", muted:"#78756e", muted2:"#a09d96",
    accent:"#2563eb", accentBg:"rgba(37,99,235,0.07)", accentBorder:"rgba(37,99,235,0.22)",
    green:"#16a34a", greenBg:"rgba(22,163,74,0.08)", red:"#dc2626",
    progTrack:"rgba(0,0,0,0.08)", progFill:"#2563eb", sidebarBg:"#ffffff", inputBg:"#f1f0ec",
  };
}

function fmtCurrency(n) { return "$" + n.toLocaleString(); }

function useIsMobile() {
  const [mob, setMob] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mob;
}

// ─────────────────────────────────────────────
// SAVE BADGE
// ─────────────────────────────────────────────
function SaveBadge({ status }) {
  if (status === "idle") return null;
  const s = { saving:{bg:"rgba(37,99,235,0.08)",text:"#2563eb",label:"Saving to Notion…"}, saved:{bg:"rgba(22,163,74,0.08)",text:"#16a34a",label:"Saved ✓"}, error:{bg:"rgba(220,38,38,0.08)",text:"#dc2626",label:"Save failed — check NOTION_TOKEN in Vercel"} }[status];
  return <div style={{position:"fixed",top:14,right:16,zIndex:999,padding:"6px 14px",borderRadius:100,background:s.bg,color:s.text,fontSize:12,fontWeight:500,fontFamily:"'DM Sans',sans-serif",border:`1px solid ${s.text}22`}}>{s.label}</div>;
}

// ─────────────────────────────────────────────
// NOT CONFIGURED SCREEN
// ─────────────────────────────────────────────
function NotConfigured() {
  return (
    <div style={{minHeight:"100vh",background:"#f8f7f4",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{maxWidth:520,background:"#fff",border:"1px solid rgba(0,0,0,0.09)",borderRadius:16,padding:"36px 32px"}}>
        <div style={{fontSize:22,fontWeight:600,color:"#1c1b18",marginBottom:8,letterSpacing:"-0.02em"}}>Notion token not configured</div>
        <p style={{fontSize:13.5,color:"#78756e",lineHeight:1.7,marginBottom:20}}>The dashboard can't reach Notion because <code>NOTION_TOKEN</code> is missing from your Vercel environment variables.</p>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {[
            ["1", "Go to your Vercel project", <span>Open <a href="https://vercel.com" target="_blank" rel="noreferrer" style={{color:"#2563eb"}}>vercel.com</a> → your project → Settings → Environment Variables</span>],
            ["2", "Add the variable", <span>Name: <code>NOTION_TOKEN</code> &nbsp; Value: your integration secret (starts with <code>ntn_</code>)</span>],
            ["3", "Redeploy", "Vercel → Deployments → click the three dots on the latest deployment → Redeploy"],
          ].map(([step, title, body]) => (
            <div key={step} style={{display:"flex",gap:12}}>
              <div style={{width:24,height:24,borderRadius:"50%",background:"rgba(37,99,235,0.08)",border:"1px solid rgba(37,99,235,0.22)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:"#2563eb",flexShrink:0,marginTop:2}}>{step}</div>
              <div><div style={{fontSize:13.5,fontWeight:500,color:"#1c1b18",marginBottom:3}}>{title}</div><div style={{fontSize:13,color:"#78756e",lineHeight:1.65}}>{body}</div></div>
            </div>
          ))}
        </div>
        <div style={{marginTop:24,padding:"12px 16px",background:"#f1f0ec",borderRadius:8,fontSize:12.5,color:"#78756e",lineHeight:1.6}}>
          The token lives only in Vercel's encrypted environment. It is never sent to the browser or stored in your source code.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(false);
  const T = buildT(dark);
  const tags = dark ? TAG_DARK : TAG_LIGHT;
  const isMobile = useIsMobile();

  const [status, setStatus]         = useState("checking"); // checking | ok | no-token | error
  const [saveStatus, setSaveStatus] = useState("idle");
  const [loading, setLoading]       = useState(true);
  const [activeNav, setActiveNav]   = useState("overview");
  const [moreOpen, setMoreOpen]     = useState(false);

  // Data
  const [orgProfile, setOrgProfile]   = useState({});
  const [orgFields, setOrgFields]     = useState({ name:"", state:"", ein:"", fiscalYear:"", vision:"", mission:"" });
  const [checklist, setChecklist]     = useState({});
  const [checks, setChecks]           = useState({});
  const [assets, setAssets]           = useState([]);
  const [weekEntries, setWeekEntries] = useState([]);

  // UI
  const [expandedPhase, setExpandedPhase]     = useState(null);
  const [expandedConsider, setExpandedConsider] = useState(null);
  const [expandedWeek, setExpandedWeek]       = useState(null);
  const [activeFinTab, setActiveFinTab]       = useState("budget");
  const [impactPdf, setImpactPdf]             = useState(null);
  const pdfRef = useRef();

  // Asset form
  const [aTitle,setATitle]=useState(""); const [aUrl,setAUrl]=useState(""); const [aCat,setACat]=useState("Reference"); const [aDesc,setADesc]=useState("");
  // Weekly form
  const [wLabel,setWLabel]=useState(""); const [wPhase,setWPhase]=useState("Foundation & Governance");
  const [wSummary,setWSummary]=useState(""); const [wDone,setWDone]=useState(""); const [wWip,setWWip]=useState(""); const [wBlockers,setWBlockers]=useState(""); const [wNext,setWNext]=useState("");

  // ── Check server connectivity on mount
  useEffect(() => {
    ping()
      .then(() => setStatus("ok"))
      .catch(e => {
        if (e.message.includes("401") || e.message.includes("token") || e.message.includes("500")) {
          setStatus("no-token");
        } else {
          setStatus("error");
        }
      });
  }, []);

  // ── Load data once ping succeeds
  useEffect(() => {
    if (status !== "ok") return;
    setLoading(true);
    Promise.all([loadOrg(), loadChecklist(), loadAssets(), loadWeekly()])
      .then(([org, cl, assetList, weekList]) => {
        setOrgProfile(org);
        setOrgFields({
          name:       org["Organization Name"]?.value || "",
          state:      org["State of Incorporation"]?.value || "",
          ein:        org["EIN"]?.value || "",
          fiscalYear: org["Fiscal Year End"]?.value || "",
          vision:     org["Vision"]?.value || "",
          mission:    org["Mission"]?.value || "",
        });
        setChecklist(cl);
        const ck = {};
        Object.entries(cl).forEach(([k, v]) => { ck[k] = v.completed; });
        setChecks(ck);
        setAssets(assetList);
        setWeekEntries(weekList);
        if (weekList.length > 0) setExpandedWeek(0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status]);

  // ── Save wrapper
  const withSave = useCallback(async (fn) => {
    setSaveStatus("saving");
    try {
      await fn();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (e) {
      console.error(e);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 4000);
    }
  }, []);

  // ── Org field debounce
  const saveTimers = useRef({});
  const handleOrgField = (field, notionKey, value) => {
    setOrgFields(prev => ({ ...prev, [field]: value }));
    clearTimeout(saveTimers.current[field]);
    saveTimers.current[field] = setTimeout(() => {
      const pageId = orgProfile[notionKey]?.pageId || null;
      withSave(async () => {
        const res = await saveOrgField(notionKey, value, pageId);
        if (!pageId && res.pageId) {
          setOrgProfile(prev => ({ ...prev, [notionKey]: { value, pageId: res.pageId } }));
        }
      });
    }, 1200);
  };

  // ── Checklist toggle
  const toggleCheck = async (phaseId, ti) => {
    const key = `${phaseId}-${ti}`;
    const newVal = !checks[key];
    setChecks(prev => ({ ...prev, [key]: newVal }));
    const phase = PHASES.find(p => p.id === phaseId);
    const pageId = checklist[key]?.pageId || null;
    withSave(async () => {
      const res = await saveChecklistItem(phaseId, ti, phase?.tasks[ti]?.t || "", phase?.title || "", newVal, pageId);
      if (!pageId && res.pageId) {
        setChecklist(prev => ({ ...prev, [key]: { completed: newVal, pageId: res.pageId } }));
      } else {
        setChecklist(prev => ({ ...prev, [key]: { ...prev[key], completed: newVal } }));
      }
    });
  };

  // ── Assets
  const handleAddAsset = async () => {
    if (!aTitle.trim() || !aUrl.trim()) return;
    const asset = { title: aTitle.trim(), url: aUrl.trim(), category: aCat, desc: aDesc.trim() };
    setATitle(""); setAUrl(""); setADesc(""); setACat("Reference");
    withSave(async () => {
      const res = await saveAsset(asset);
      setAssets(prev => [{ ...asset, pageId: res.pageId }, ...prev]);
    });
  };
  const handleDeleteAsset = async (i) => {
    const { pageId } = assets[i];
    setAssets(prev => prev.filter((_, idx) => idx !== i));
    if (pageId) withSave(() => deleteAsset(pageId));
  };

  // ── Weekly
  const handleAddWeek = async () => {
    if (!wLabel.trim()) return;
    const entry = { label: wLabel, phase: wPhase, summary: wSummary, done: wDone, wip: wWip, blockers: wBlockers, next: wNext };
    setWLabel(""); setWSummary(""); setWDone(""); setWWip(""); setWBlockers(""); setWNext("");
    withSave(async () => {
      const res = await saveWeekly(entry);
      setWeekEntries(prev => [{ ...entry, pageId: res.pageId }, ...prev]);
      setExpandedWeek(0);
    });
  };

  const totalTasks   = PHASES.reduce((a, p) => a + p.tasks.length, 0);
  const doneTasks    = Object.values(checks).filter(Boolean).length;
  const pct          = Math.round((doneTasks / totalTasks) * 100);
  const phasesDone   = PHASES.filter(p => p.tasks.every((_, ti) => checks[`${p.id}-${ti}`])).length;
  const totalRevenue  = FINANCIALS.revenue.reduce((a, r) => a + r.amount, 0);
  const totalExpenses = FINANCIALS.budget.reduce((a, r) => a + r.amount, 0);
  const surplus       = totalRevenue - totalExpenses;

  // ── Style helpers
  const card = (x={}) => ({ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:"16px 18px", marginBottom:10, ...x });
  const lbl  = { fontSize:10.5, color:T.muted2, textTransform:"uppercase", letterSpacing:"0.09em", fontWeight:500, display:"block", marginBottom:5 };
  const inp  = (x={}) => ({ background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:7, padding:"8px 11px", color:T.text, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", ...x });
  const ta   = (x={}) => ({ ...inp(), resize:"vertical", minHeight:68, lineHeight:1.55, ...x });
  const tag  = (k) => ({ display:"inline-block", fontSize:11, padding:"2px 9px", borderRadius:100, fontWeight:500, background:(tags[k]||tags["Other"]).bg, color:(tags[k]||tags["Other"]).text, whiteSpace:"nowrap" });
  const pbtn = { padding:"9px 18px", borderRadius:7, border:"none", background:T.accent, color:"#fff", fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:500 };
  const gbtn = { padding:"8px 14px", borderRadius:7, border:`1px solid ${T.border2}`, background:T.surface2, color:T.text, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" };

  // ── Accordion
  function Accord({ title, badge, badgeDone, open, onToggle, children }) {
    return (
      <div style={card({padding:0,overflow:"hidden",marginBottom:7})}>
        <button onClick={onToggle} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"13px 15px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
          <span style={{fontSize:12,color:T.muted,display:"inline-block",transition:"transform 0.18s",transform:open?"rotate(90deg)":"rotate(0deg)",flexShrink:0}}>→</span>
          <span style={{flex:1,fontWeight:500,fontSize:13.5,color:T.text}}>{title}</span>
          {badge && <span style={{fontSize:11,padding:"2px 9px",borderRadius:100,background:badgeDone?T.greenBg:T.surface2,color:badgeDone?T.green:T.muted,border:`1px solid ${T.border}`,flexShrink:0}}>{badge}</span>}
        </button>
        {open && <div style={{padding:"2px 15px 15px",borderTop:`1px solid ${T.border}`}}>{children}</div>}
      </div>
    );
  }

  function PH({ title, sub }) {
    return <>
      <div style={{fontSize:isMobile?20:22,fontWeight:600,color:T.text,letterSpacing:"-0.02em",marginBottom:3}}>{title}</div>
      <div style={{fontSize:13,color:T.muted,marginBottom:22}}>{sub}</div>
    </>;
  }

  // ── Early returns
  if (status === "checking") return (
    <div style={{minHeight:"100vh",background:"#f8f7f4",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14,fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{width:28,height:28,borderRadius:"50%",border:"2px solid rgba(0,0,0,0.1)",borderTopColor:"#2563eb",animation:"spin 0.8s linear infinite"}} />
      <div style={{fontSize:13,color:"#78756e"}}>Connecting to Notion…</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (status === "no-token") return <NotConfigured />;

  if (status === "error") return (
    <div style={{minHeight:"100vh",background:"#f8f7f4",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",padding:24}}>
      <div style={{maxWidth:480,textAlign:"center"}}>
        <div style={{fontSize:20,fontWeight:600,color:"#1c1b18",marginBottom:8}}>Connection error</div>
        <p style={{fontSize:13.5,color:"#78756e",lineHeight:1.7}}>Could not reach the server. Make sure the app is deployed on Vercel and try reloading.</p>
      </div>
    </div>
  );

  if (loading) return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14,fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{width:28,height:28,borderRadius:"50%",border:`2px solid ${T.border}`,borderTopColor:T.accent,animation:"spin 0.8s linear infinite"}} />
      <div style={{fontSize:13,color:T.muted}}>Loading from Notion…</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Sidebar
  const Sidebar = () => (
    <aside style={{width:210,background:T.sidebarBg,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0,height:"100vh",position:"sticky",top:0}}>
      <div style={{padding:"20px 16px 13px",borderBottom:`1px solid ${T.border}`}}>
        <div style={{fontSize:13.5,fontWeight:600,color:T.text,letterSpacing:"-0.01em"}}>501(c)(3) Dashboard</div>
        <div style={{fontSize:11,color:T.muted,marginTop:2}}>Synced with Notion</div>
      </div>
      <nav style={{flex:1,padding:"7px 7px",overflowY:"auto"}}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => setActiveNav(item.id)} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"8px 10px",borderRadius:7,border:"none",cursor:"pointer",background:activeNav===item.id?T.accentBg:"transparent",color:activeNav===item.id?T.accent:T.muted,fontSize:13,fontFamily:"'DM Sans',sans-serif",fontWeight:activeNav===item.id?500:400,borderLeft:`2px solid ${activeNav===item.id?T.accent:"transparent"}`,marginBottom:1,textAlign:"left",transition:"all 0.1s"}}>
            <span style={{fontSize:11,opacity:0.7}}>→</span>{item.label}
          </button>
        ))}
      </nav>
      <div style={{padding:"11px 13px 16px",borderTop:`1px solid ${T.border}`}}>
        <button onClick={()=>setDark(d=>!d)} style={{display:"flex",alignItems:"center",gap:7,width:"100%",padding:"7px 10px",borderRadius:7,border:`1px solid ${T.border}`,background:T.surface2,color:T.muted,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",marginBottom:10}}>
          <span>{dark?"○":"☀"}</span><span>{dark?"Dark mode":"Light mode"}</span>
        </button>
        <div style={{...lbl,marginBottom:5}}>Overall progress</div>
        <div style={{background:T.progTrack,borderRadius:100,height:3,marginBottom:5}}>
          <div style={{width:`${pct}%`,height:"100%",borderRadius:100,background:T.progFill,transition:"width 0.4s"}} />
        </div>
        <div style={{fontSize:11.5,color:T.accent,fontWeight:500}}>{pct}% — {doneTasks}/{totalTasks} steps</div>
      </div>
    </aside>
  );

  // ── Bottom nav
  const BottomNav = () => {
    const vis = NAV_ITEMS.slice(0,5);
    const ovr = NAV_ITEMS.slice(5);
    const anyOvr = ovr.some(i=>i.id===activeNav);
    return (
      <nav style={{position:"fixed",bottom:0,left:0,right:0,background:T.sidebarBg,borderTop:`1px solid ${T.border}`,display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom)"}}>
        {vis.map(item=>(
          <button key={item.id} onClick={()=>setActiveNav(item.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,padding:"9px 4px 8px",border:"none",cursor:"pointer",background:"transparent",color:activeNav===item.id?T.accent:T.muted,fontFamily:"'DM Sans',sans-serif"}}>
            <span style={{fontSize:14}}>→</span>
            <span style={{fontSize:10,fontWeight:activeNav===item.id?600:400}}>{item.shortLabel}</span>
          </button>
        ))}
        <div style={{flex:1,position:"relative"}}>
          {moreOpen&&<>
            <div onClick={()=>setMoreOpen(false)} style={{position:"fixed",inset:0,zIndex:150}}/>
            <div style={{position:"fixed",bottom:58,right:0,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"6px 0",minWidth:160,zIndex:200,boxShadow:"0 -4px 20px rgba(0,0,0,0.1)"}}>
              {ovr.map(item=>(
                <button key={item.id} onClick={()=>{setActiveNav(item.id);setMoreOpen(false);}} style={{display:"block",width:"100%",padding:"10px 16px",border:"none",cursor:"pointer",background:"transparent",color:activeNav===item.id?T.accent:T.text,fontFamily:"'DM Sans',sans-serif",fontSize:13,textAlign:"left",fontWeight:activeNav===item.id?500:400}}>→ {item.label}</button>
              ))}
            </div>
          </>}
          <button onClick={()=>setMoreOpen(o=>!o)} style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,padding:"9px 4px 8px",border:"none",cursor:"pointer",background:"transparent",color:anyOvr?T.accent:T.muted,fontFamily:"'DM Sans',sans-serif"}}>
            <span style={{fontSize:14,letterSpacing:"0.1em"}}>···</span>
            <span style={{fontSize:10,fontWeight:anyOvr?600:400}}>More</span>
          </button>
        </div>
      </nav>
    );
  };

  // ─────────────────────────────────────────────
  // PAGES
  // ─────────────────────────────────────────────
  const pages = {
    overview: <div>
      <PH title="Dashboard" sub="Synced with Notion — changes save automatically" />
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:10,marginBottom:18}}>
        {[{label:"Phases complete",val:`${phasesDone}/7`},{label:"Steps done",val:`${doneTasks}/${totalTasks}`},{label:"Progress",val:`${pct}%`},{label:"Assets saved",val:assets.length}].map(c=>(
          <div key={c.label} style={card({padding:"14px 16px",marginBottom:0})}>
            <div style={{fontSize:isMobile?20:24,fontWeight:600,color:T.accent,letterSpacing:"-0.02em"}}>{c.val}</div>
            <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginTop:3,fontWeight:500}}>{c.label}</div>
          </div>
        ))}
      </div>
      <div style={card()}>
        <span style={lbl}>Organization profile — auto-saves after 1.2s</span>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10}}>
          {[["name","Organization Name","e.g. Verity Foundation"],["state","State of Incorporation","e.g. Virginia"],["ein","EIN (once assigned)","xx-xxxxxxx"],["fiscalYear","Fiscal Year End","e.g. December 31"]].map(([f,nk,ph])=>(
            <div key={f}><span style={lbl}>{nk}</span><input style={inp()} type="text" placeholder={ph} value={orgFields[f]} onChange={e=>handleOrgField(f,nk,e.target.value)}/></div>
          ))}
          <div style={{gridColumn:isMobile?"1":"1/-1"}}><span style={lbl}>Vision Statement</span><textarea style={ta()} placeholder="The long-term future your organization aspires to create…" value={orgFields.vision} onChange={e=>handleOrgField("vision","Vision",e.target.value)}/></div>
          <div style={{gridColumn:isMobile?"1":"1/-1"}}><span style={lbl}>Mission Statement</span><textarea style={ta()} placeholder="What your organization does, for whom, and why…" value={orgFields.mission} onChange={e=>handleOrgField("mission","Mission",e.target.value)}/></div>
        </div>
      </div>
      <div style={card()}>
        <span style={lbl}>Phase summary</span>
        {PHASES.map(ph=>{
          const done=ph.tasks.filter((_,ti)=>checks[`${ph.id}-${ti}`]).length;
          const p=Math.round((done/ph.tasks.length)*100);
          return <div key={ph.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <span style={{fontSize:11,color:T.muted2,flexShrink:0}}>→</span>
            <span style={{flex:1,fontSize:13,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ph.title}</span>
            <span style={{fontSize:11,color:T.muted,flexShrink:0}}>{done}/{ph.tasks.length}</span>
            <div style={{width:isMobile?60:88,background:T.progTrack,borderRadius:100,height:3,flexShrink:0}}>
              <div style={{width:`${p}%`,height:"100%",borderRadius:100,background:p===100?T.green:T.accent,transition:"width 0.4s"}}/>
            </div>
          </div>;
        })}
      </div>
    </div>,

    checklist: <div>
      <PH title="Formation Checklist" sub="Checkboxes sync to Notion instantly" />
      {PHASES.map(ph=>{
        const done=ph.tasks.filter((_,ti)=>checks[`${ph.id}-${ti}`]).length;
        return <Accord key={ph.id} open={expandedPhase===ph.id} onToggle={()=>setExpandedPhase(expandedPhase===ph.id?null:ph.id)} title={ph.title} badge={`${done}/${ph.tasks.length}`} badgeDone={done===ph.tasks.length}>
          {ph.tasks.map((task,ti)=>{
            const checked=!!checks[`${ph.id}-${ti}`];
            return <div key={ti} style={{display:"flex",gap:10,padding:"9px 0",borderBottom:`1px solid ${T.border}`}}>
              <input type="checkbox" checked={checked} onChange={()=>toggleCheck(ph.id,ti)} style={{marginTop:2,accentColor:T.accent,cursor:"pointer",flexShrink:0,width:15,height:15}}/>
              <div>
                <div style={{fontSize:13.5,color:checked?T.muted:T.text,textDecoration:checked?"line-through":"none",lineHeight:1.4}}>{task.t}</div>
                {task.n&&<div style={{fontSize:11.5,color:T.muted2,marginTop:2}}>{task.n}</div>}
              </div>
            </div>;
          })}
          {ph.links?.length>0&&<div style={{marginTop:10,paddingTop:10,borderTop:`1px dashed ${T.border}`}}>
            <span style={lbl}>Resources</span>
            {ph.links.map((lk,li)=><a key={li} href={lk.u} target="_blank" rel="noreferrer" style={{fontSize:13,color:T.accent,marginRight:12,textDecoration:"none",display:"inline-block",marginBottom:3}}>→ {lk.l}</a>)}
          </div>}
        </Accord>;
      })}
    </div>,

    consider: <div>
      <PH title="Things to Consider" sub="Key decisions, risks, and nuances across every domain" />
      {CONSIDERATIONS.map(cat=>(
        <Accord key={cat.cat} open={expandedConsider===cat.cat} onToggle={()=>setExpandedConsider(expandedConsider===cat.cat?null:cat.cat)} title={cat.cat} badge={`${cat.items.length} items`}>
          {cat.items.map((item,i)=>(
            <div key={i} style={{display:"flex",gap:11,padding:"11px 0",borderBottom:`1px solid ${T.border}`}}>
              <div style={{width:20,height:20,borderRadius:"50%",background:T.accentBg,border:`1px solid ${T.accentBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9.5,color:T.accent,fontWeight:600,flexShrink:0,marginTop:2}}>{i+1}</div>
              <p style={{fontSize:13.5,color:T.text,lineHeight:1.65}}>{item}</p>
            </div>
          ))}
        </Accord>
      ))}
    </div>,

    board: <div>
      <PH title="Board of Directors" sub="Board directory and meeting notes live in your Notion workspace" />
      <div style={card()}>
        <p style={{fontSize:13.5,color:T.text,lineHeight:1.7,marginBottom:12}}>Your board directory and meeting notes are managed directly in Notion. Click below to open them.</p>
        <a href="https://www.notion.so/330fffd7c625812ab70bf242b5b39898" target="_blank" rel="noreferrer" style={{...pbtn,display:"inline-block",textDecoration:"none"}}>→ Open Board in Notion</a>
      </div>
      <div style={card()}>
        <span style={lbl}>Board governance reminders</span>
        {["Hold regular board meetings (at minimum quarterly)", "Document all decisions and votes in written minutes", "Review and re-sign conflict of interest policy annually", "Ensure board size stays at or above 3 unrelated individuals", "Conduct annual board self-evaluation"].map((item,i)=>(
          <div key={i} style={{display:"flex",gap:10,padding:"9px 0",borderBottom:`1px solid ${T.border}`,fontSize:13.5,color:T.text}}>
            <span style={{color:T.accent,flexShrink:0}}>→</span>{item}
          </div>
        ))}
      </div>
    </div>,

    impact: <div>
      <PH title="Impact Report" sub="Structure and content guidance for your annual impact report" />
      <div style={{...card(),display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <button style={gbtn} onClick={()=>pdfRef.current.click()}>→ Upload PDF</button>
        <span style={{fontSize:13,color:impactPdf?T.green:T.muted}}>{impactPdf?`${impactPdf} ✓`:"No file uploaded yet"}</span>
        <input ref={pdfRef} type="file" accept=".pdf" style={{display:"none"}} onChange={e=>setImpactPdf(e.target.files?.[0]?.name||null)}/>
      </div>
      <span style={lbl}>Report sections</span>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(250px,1fr))",gap:10}}>
        {IMPACT_SECTIONS.map((sec,i)=>(
          <div key={i} style={card({marginBottom:0,padding:"14px 16px"})}>
            <div style={{fontSize:12,color:T.accent,marginBottom:6}}>→</div>
            <div style={{fontSize:14,fontWeight:600,color:T.text,marginBottom:5}}>{sec.title}</div>
            <div style={{fontSize:12.5,color:T.muted,lineHeight:1.65}}>{sec.desc}</div>
          </div>
        ))}
      </div>
      <div style={{...card(),marginTop:12}}>
        <span style={lbl}>Key metrics to track</span>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:2}}>
          {METRICS.map((m,i)=>(
            <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",fontSize:13,color:T.text,padding:"5px 0"}}>
              <span style={{color:T.accent,flexShrink:0,marginTop:1,fontSize:11}}>→</span>{m}
            </div>
          ))}
        </div>
      </div>
    </div>,

    financials: <div>
      <PH title="Financials" sub="Year 1 budget, compliance timeline, and required documents" />
      <div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap"}}>
        {["budget","timeline","documents"].map(tab=>(
          <button key={tab} onClick={()=>setActiveFinTab(tab)} style={{padding:"7px 15px",borderRadius:7,border:`1px solid ${activeFinTab===tab?T.accent:T.border}`,background:activeFinTab===tab?T.accentBg:"transparent",color:activeFinTab===tab?T.accent:T.muted,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:activeFinTab===tab?500:400,textTransform:"capitalize"}}>{tab}</button>
        ))}
      </div>
      {activeFinTab==="budget"&&<div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:10,marginBottom:18}}>
          {[{label:"Total Revenue",val:fmtCurrency(totalRevenue),color:T.green},{label:"Total Expenses",val:fmtCurrency(totalExpenses),color:T.red},{label:"Net Surplus",val:(surplus>=0?"+":"")+fmtCurrency(surplus),color:surplus>=0?T.green:T.red}].map(c=>(
            <div key={c.label} style={card({marginBottom:0})}>
              <div style={{fontSize:20,fontWeight:600,color:c.color,letterSpacing:"-0.02em"}}>{c.val}</div>
              <div style={{fontSize:10.5,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginTop:3,fontWeight:500}}>{c.label}</div>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
          {[{title:"Revenue Sources",rows:FINANCIALS.revenue,total:totalRevenue,color:T.green},{title:"Expense Categories",rows:FINANCIALS.budget,total:totalExpenses,color:T.red}].map(table=>(
            <div key={table.title} style={card()}>
              <div style={{fontSize:13,fontWeight:500,color:T.text,marginBottom:14}}>{table.title}</div>
              {table.rows.map((row,i)=>{
                const p=Math.round((row.amount/table.total)*100);
                return <div key={i} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,fontSize:13}}>
                    <span style={{color:T.text,flex:1,paddingRight:8}}>{row.category}</span>
                    <span style={{color:T.muted,flexShrink:0}}>{fmtCurrency(row.amount)}</span>
                  </div>
                  <div style={{background:T.progTrack,borderRadius:100,height:3}}>
                    <div style={{width:`${p}%`,height:"100%",borderRadius:100,background:table.color,opacity:0.75}}/>
                  </div>
                </div>;
              })}
            </div>
          ))}
        </div>
      </div>}
      {activeFinTab==="timeline"&&<div style={card()}>
        <div style={{position:"relative",paddingLeft:18}}>
          <div style={{position:"absolute",left:5,top:0,bottom:0,width:1,background:T.border}}/>
          {FINANCIALS.timeline.map((item,i)=>(
            <div key={i} style={{position:"relative",marginBottom:20,paddingLeft:14}}>
              <div style={{position:"absolute",left:-17,top:5,width:7,height:7,borderRadius:"50%",background:T.accent,border:`2px solid ${T.bg}`}}/>
              <div style={{fontSize:10.5,color:T.accent,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:2,fontWeight:500}}>{item.month}</div>
              <div style={{fontSize:13.5,color:T.text,lineHeight:1.5}}>{item.milestone}</div>
            </div>
          ))}
        </div>
      </div>}
      {activeFinTab==="documents"&&(isMobile?(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {FINANCIALS.documents.map((doc,i)=>(
            <div key={i} style={card({marginBottom:0,padding:"13px 15px"})}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:5}}>
                <span style={{fontSize:13.5,fontWeight:500,color:T.text}}>{doc.name}</span>
                <span style={tag(doc.status)}>{doc.status}</span>
              </div>
              <span style={{fontSize:12.5,color:T.muted}}>{doc.desc}</span>
            </div>
          ))}
        </div>
      ):(
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"2fr 2fr 1fr",gap:12,padding:"11px 16px",borderBottom:`1px solid ${T.border}`}}>
            {["Document","Description","Status"].map(h=><span key={h} style={lbl}>{h}</span>)}
          </div>
          {FINANCIALS.documents.map((doc,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 2fr 1fr",gap:12,padding:"12px 16px",alignItems:"center",background:i%2===0?"transparent":T.surface2,borderBottom:i<FINANCIALS.documents.length-1?`1px solid ${T.border}`:"none"}}>
              <span style={{fontSize:13.5,fontWeight:500,color:T.text}}>{doc.name}</span>
              <span style={{fontSize:12.5,color:T.muted}}>{doc.desc}</span>
              <span style={tag(doc.status)}>{doc.status}</span>
            </div>
          ))}
        </div>
      ))}
    </div>,

    assets: <div>
      <PH title="Assets & Links" sub="Saved to Notion — accessible from any device" />
      <div style={card()}>
        <span style={lbl}>Add new asset</span>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:8,marginBottom:8}}>
          <div><span style={lbl}>Title</span><input style={inp()} type="text" placeholder="e.g. IRS Form 1023-EZ" value={aTitle} onChange={e=>setATitle(e.target.value)}/></div>
          <div><span style={lbl}>URL</span><input style={inp()} type="text" placeholder="https://…" value={aUrl} onChange={e=>setAUrl(e.target.value)}/></div>
          <div><span style={lbl}>Category</span><select value={aCat} onChange={e=>setACat(e.target.value)} style={inp({height:36})}>{ASSET_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
          <div><span style={lbl}>Description (optional)</span><input style={inp()} type="text" placeholder="Brief note…" value={aDesc} onChange={e=>setADesc(e.target.value)}/></div>
        </div>
        <button onClick={handleAddAsset} style={pbtn}>→ Save to Notion</button>
      </div>
      <span style={lbl}>Saved assets ({assets.length})</span>
      {assets.length===0&&<div style={{fontSize:13,color:T.muted,padding:"14px 0"}}>No assets yet — add your first link above.</div>}
      {assets.map((asset,i)=>(
        <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"11px 14px",background:T.surface,border:`1px solid ${T.border}`,borderRadius:9,marginBottom:6}}>
          <span style={{color:T.accent,fontSize:12,flexShrink:0,marginTop:2}}>→</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
              <span style={{fontSize:13.5,fontWeight:500,color:T.text}}>{asset.title}</span>
              <span style={tag(asset.category)}>{asset.category}</span>
            </div>
            {asset.desc&&<div style={{fontSize:12,color:T.muted,marginBottom:3}}>{asset.desc}</div>}
            <a href={asset.url} target="_blank" rel="noreferrer" style={{fontSize:12.5,color:T.accent,textDecoration:"none",wordBreak:"break-all"}}>{asset.url}</a>
          </div>
          <button onClick={()=>handleDeleteAsset(i)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted2,fontSize:18,padding:"0 2px",lineHeight:1,flexShrink:0}}>×</button>
        </div>
      ))}
    </div>,

    weekly: <div>
      <PH title="Weekly Activity Log" sub="Entries save to Notion — perfect for board meeting prep" />
      <div style={card()}>
        <span style={lbl}>Log this week</span>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:8,marginBottom:8}}>
          <div><span style={lbl}>Week label</span><input style={inp()} type="text" placeholder="e.g. Week of March 24, 2026" value={wLabel} onChange={e=>setWLabel(e.target.value)}/></div>
          <div><span style={lbl}>Phase focus</span><select value={wPhase} onChange={e=>setWPhase(e.target.value)} style={inp({height:36})}>{PHASE_OPTIONS.map(p=><option key={p}>{p}</option>)}</select></div>
          <div style={{gridColumn:isMobile?"1":"1/-1"}}><span style={lbl}>Summary</span><textarea style={ta()} placeholder="1–2 sentence overview of this week's focus and outcomes…" value={wSummary} onChange={e=>setWSummary(e.target.value)}/></div>
          <div style={{gridColumn:isMobile?"1":"1/-1"}}><span style={lbl}>Actions completed</span><textarea style={ta()} placeholder={"• Filed Articles of Incorporation\n• Opened bank account"} value={wDone} onChange={e=>setWDone(e.target.value)}/></div>
          <div style={{gridColumn:isMobile?"1":"1/-1"}}><span style={lbl}>In progress</span><textarea style={ta({minHeight:56})} placeholder="• Drafting bylaws — awaiting attorney review" value={wWip} onChange={e=>setWWip(e.target.value)}/></div>
          <div style={{gridColumn:isMobile?"1":"1/-1"}}><span style={lbl}>Blockers</span><textarea style={ta({minHeight:56})} placeholder="• State filing delay — estimated 2 weeks" value={wBlockers} onChange={e=>setWBlockers(e.target.value)}/></div>
          <div style={{gridColumn:isMobile?"1":"1/-1"}}><span style={lbl}>Next steps</span><textarea style={ta({minHeight:56})} placeholder={"• Schedule inaugural board meeting\n• Submit EIN application"} value={wNext} onChange={e=>setWNext(e.target.value)}/></div>
        </div>
        <button onClick={handleAddWeek} style={pbtn}>→ Save to Notion</button>
      </div>
      <span style={lbl}>Previous entries ({weekEntries.length})</span>
      {weekEntries.length===0&&<div style={{fontSize:13,color:T.muted,padding:"14px 0"}}>No entries yet — log your first week above.</div>}
      {weekEntries.map((entry,i)=>{
        const isOpen=expandedWeek===i;
        return <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:11,marginBottom:7,overflow:"hidden"}}>
          <button onClick={()=>setExpandedWeek(isOpen?null:i)} style={{display:"flex",alignItems:"center",gap:9,width:"100%",padding:"12px 15px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
            <span style={{fontSize:12,color:T.muted,display:"inline-block",transition:"transform 0.18s",transform:isOpen?"rotate(90deg)":"rotate(0deg)",flexShrink:0}}>→</span>
            <span style={{flex:1,fontSize:13.5,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{entry.label}</span>
            {!isMobile&&<span style={tag(entry.phase)}>{entry.phase}</span>}
            <span style={{fontSize:11,color:T.muted,flexShrink:0,marginLeft:8}}>#{weekEntries.length-i}</span>
          </button>
          {isOpen&&<div style={{padding:"13px 15px",borderTop:`1px solid ${T.border}`}}>
            {isMobile&&<div style={{marginBottom:10}}><span style={tag(entry.phase)}>{entry.phase}</span></div>}
            {entry.summary&&<div style={{marginBottom:12}}><span style={lbl}>Summary</span><div style={{fontSize:13.5,color:T.text,lineHeight:1.6}}>{entry.summary}</div></div>}
            {[{k:"done",l:"→ Actions completed"},{k:"wip",l:"→ In progress"},{k:"blockers",l:"→ Blockers"},{k:"next",l:"→ Next steps"}].map(f=>entry[f.k]?(
              <div key={f.k} style={{marginBottom:12}}>
                <span style={lbl}>{f.l}</span>
                <div style={{fontSize:13.5,color:T.text,lineHeight:1.6,whiteSpace:"pre-line"}}>{entry[f.k]}</div>
              </div>
            ):null)}
          </div>}
        </div>;
      })}
    </div>,
  };

  return (
    <div style={{display:"flex",height:"100vh",overflow:"hidden",background:T.bg,fontFamily:"'DM Sans',sans-serif",color:T.text,fontSize:14}}>
      <SaveBadge status={saveStatus}/>
      {!isMobile&&<Sidebar/>}
      <main style={{flex:1,overflowY:"auto",padding:isMobile?"20px 16px 80px":"32px 44px 56px"}}>
        {pages[activeNav]}
      </main>
      {isMobile&&<BottomNav/>}
    </div>
  );
}
