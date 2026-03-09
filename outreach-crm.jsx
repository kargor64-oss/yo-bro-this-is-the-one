import { useState, useEffect, useRef } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const STATUSES = ["Not Contacted", "Drafted", "Sent", "Replied", "Follow Up"];
const STATUS_COLORS = {
  "Not Contacted": "#3a3a3a",
  "Drafted": "#4a6fa5",
  "Sent": "#c9a96e",
  "Replied": "#5d9e6e",
  "Follow Up": "#b05c5c",
};
const STATUS_TEXT = {
  "Not Contacted": "#888",
  "Drafted": "#a8c4e8",
  "Sent": "#0f0f0f",
  "Replied": "#0f0f0f",
  "Follow Up": "#f0b0b0",
};

const DEPARTMENTS = ["Finance", "Economics", "Computer Science", "Law", "Medicine", "Engineering", "Psychology", "Political Science", "Business", "Other"];

const MODE_LABELS = { academic: "🎓 Academics", professional: "💼 Professionals" };

const EMAIL_GOALS = {
  academic: ["Research inquiry", "Fellowship / program info", "General advice", "Lab / RA opportunity"],
  professional: ["Networking / coffee chat", "Career advice", "Informational interview", "Industry insight"],
};

const DEFAULT_CONTACTS = {
  academic: [
    { id: 1, mode: "academic", name: "Yiming Qian", title: "Professor & Toscano Chair in Finance", org: "University of Connecticut", department: "Finance", email: "yiming.qian@uconn.edu", website: "https://business.uconn.edu/person/yiming-qian/", research: "Corporate finance, IPOs, M&A, behavioral finance, emerging markets", recentWork: "Pre-IPO hype by affiliated analysts (Journal of Corporate Finance); IPOs Chinese style (JFQA, 2024)", notes: "", status: "Not Contacted", emailHistory: [], activityLog: [], followUpDate: null, tags: ["M&A", "Behavioral"] },
    { id: 2, mode: "academic", name: "Jose Vicente Martinez", title: "Associate Professor of Finance", org: "University of Connecticut", department: "Finance", email: "jose.martinez@uconn.edu", website: "https://business.uconn.edu/person/jose-vicente-martinez/", research: "Capital markets, institutional asset management, investor behavior, household finance", recentWork: "Investment Consultants in Private Equity (Review of Corporate Finance Studies, forthcoming)", notes: "", status: "Not Contacted", emailHistory: [], activityLog: [], followUpDate: null, tags: ["Asset Mgmt", "Markets"] },
    { id: 3, mode: "academic", name: "Xiang Zheng", title: "Assistant Professor of Finance", org: "University of Connecticut", department: "Finance", email: "xiang.zheng@uconn.edu", website: "https://business.uconn.edu/person/xiang-zheng/", research: "Fintech, corporate finance, entrepreneurial finance", recentWork: "FMA Best Paper in FinTech (2021); small business survival in Chapter 11 (Journal of Finance)", notes: "", status: "Not Contacted", emailHistory: [], activityLog: [], followUpDate: null, tags: ["Fintech"] },
    { id: 4, mode: "academic", name: "Meng Gao", title: "Assistant Professor of Finance", org: "University of Connecticut", department: "Finance", email: "meng.gao@uconn.edu", website: "https://business.uconn.edu/person/meng-gao/", research: "Financial market technology, informed trading, hedge funds, political connections", recentWork: "Woke or Broke? Corporate Activism on Consumer Spending and Product Sales", notes: "", status: "Not Contacted", emailHistory: [], activityLog: [], followUpDate: null, tags: ["Hedge Funds", "Markets"] },
    { id: 5, mode: "academic", name: "Yao Deng", title: "Assistant Professor of Finance", org: "University of Connecticut", department: "Finance", email: "yao.deng@uconn.edu", website: "https://business.uconn.edu/person/yao-deng/", research: "Asset pricing, behavioral finance, macro finance", recentWork: "Behavioral drivers of asset pricing and macro-financial linkages", notes: "", status: "Not Contacted", emailHistory: [], activityLog: [], followUpDate: null, tags: ["Behavioral", "Asset Pricing"] },
    { id: 6, mode: "academic", name: "Lingling Wang", title: "Associate Professor of Finance", org: "University of Connecticut", department: "Finance", email: "lingling.wang@uconn.edu", website: "https://business.uconn.edu/person/lingling-wang/", research: "Corporate finance, executive compensation, governance, culture and finance, international finance", recentWork: "Cultural factors shaping executive pay and corporate governance decisions", notes: "", status: "Not Contacted", emailHistory: [], activityLog: [], followUpDate: null, tags: ["Governance", "Corp Finance"] },
  ],
  professional: [],
};

const SAMPLE_STUDENT = {
  name: "Karthik Gorrepati",
  background: "High school junior at South Windsor High School (graduating 2027), GPA 3.71. Completed JPMorgan QR and IB Forage simulations (built DCF model, default prediction model using dynamic programming). Attended Fordham Wall Street in the Classroom summer program. Interested in hedge funds, PE, IB, and asset management. Runs cross country and track.",
  interests: ["Finance & investing", "Corporate strategy & M&A", "Economics", "Fintech / crypto / quantitative finance"],
};

const LOADING_STEPS = ["Analyzing background...", "Connecting to your interests...", "Drafting opening...", "Writing body...", "Refining tone..."];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const daysUntil = (iso) => {
  if (!iso) return null;
  const diff = new Date(iso) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const escapeCSV = (v) => `"${String(v || "").replace(/"/g, '""')}"`;

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function OutreachCRM() {
  const [mode, setMode] = useState("academic");
  const [view, setView] = useState("dashboard"); // dashboard | list | detail | settings
  const [contacts, setContacts] = useState({ academic: DEFAULT_CONTACTS.academic, professional: DEFAULT_CONTACTS.professional });
  const [student, setStudent] = useState(SAMPLE_STUDENT);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDept, setFilterDept] = useState("All");
  const [filterOrg, setFilterOrg] = useState("All");
  const [storageReady, setStorageReady] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [generating, setGenerating] = useState({});
  const [genStep, setGenStep] = useState({});
  const [genGoal, setGenGoal] = useState({});
  const [customInterest, setCustomInterest] = useState("");
  const [exportMsg, setExportMsg] = useState("");
  const fileInputRef = useRef();

  const INTERESTS_LIST = [
    "Finance & investing", "Corporate strategy & M&A", "Entrepreneurship", "Economics",
    "Computer science & AI", "Data science & statistics", "Biomedical research", "Environmental science",
    "Psychology & behavioral science", "Political science & policy", "Law & legal studies",
    "Marketing & consumer behavior", "Healthcare & medicine", "Engineering", "Education",
  ];

  const modeContacts = contacts[mode];

  // ── STORAGE ──
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("outreach-crm-v2");
        if (r?.value) {
          const s = JSON.parse(r.value);
          if (s.contacts) setContacts(s.contacts);
          if (s.student) setStudent(s.student);
          if (s.mode) setMode(s.mode);
        }
      } catch (e) {}
      setStorageReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    const t = setTimeout(async () => {
      try {
        await window.storage.set("outreach-crm-v2", JSON.stringify({ contacts, student, mode }));
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 1500);
      } catch (e) {}
    }, 800);
    return () => clearTimeout(t);
  }, [contacts, student, mode, storageReady]);

  // ── CONTACT CRUD ──
  const updateContact = (id, updates) => {
    setContacts(prev => ({
      ...prev,
      [mode]: prev[mode].map(c => c.id === id ? { ...c, ...updates } : c),
    }));
  };

  const addActivityLog = (id, entry) => {
    setContacts(prev => ({
      ...prev,
      [mode]: prev[mode].map(c => c.id === id
        ? { ...c, activityLog: [{ ts: new Date().toISOString(), text: entry }, ...(c.activityLog || [])] }
        : c
      ),
    }));
  };

  const setStatus = (id, status) => {
    updateContact(id, { status });
    addActivityLog(id, `Status changed to "${status}"`);
  };

  const deleteContact = (id) => {
    setContacts(prev => ({ ...prev, [mode]: prev[mode].filter(c => c.id !== id) }));
    if (selectedId === id) { setSelectedId(null); setView("list"); }
  };

  const saveContact = (data) => {
    if (data.id) {
      updateContact(data.id, data);
      addActivityLog(data.id, "Contact info updated");
    } else {
      const newC = {
        ...data,
        id: Date.now(),
        mode,
        status: "Not Contacted",
        emailHistory: [],
        activityLog: [{ ts: new Date().toISOString(), text: "Contact added" }],
        followUpDate: null,
        tags: [],
      };
      setContacts(prev => ({ ...prev, [mode]: [...prev[mode], newC] }));
    }
    setShowAddForm(false);
    setEditingContact(null);
  };

  // ── EMAIL GENERATION ──
  const buildPrompt = (contact, goal) => {
    const isAcademic = mode === "academic";
    const goalNote = goal ? `Email goal: ${goal}` : "";
    if (isAcademic) {
      return `You are helping a student write a cold email to a professor. ${goalNote}

Student:
- Name: ${student.name || "a student"}
- Interests: ${student.interests?.join(", ")}
- Background: ${student.background || "none"}

Professor:
- Name: ${contact.name}
- Title: ${contact.title}
- University: ${contact.org}
- Department: ${contact.department}
- Research: ${contact.research}
- Recent work: ${contact.recentWork}

Write a SHORT cold email (under 130 words). Sound like a real curious student, not a LinkedIn post or cover letter. Avoid clichés: "I came across your work", "deeply passionate", "I would be honored". Reference ONE specific thing from their research. Ask ONE focused question or make one specific request based on the goal. Weave in the student's background naturally.

Just the email body. Start "Dear Professor [Last Name]," — end simply, no "I look forward to hearing from you".`;
    } else {
      return `You are helping a student write a cold networking email to an industry professional. ${goalNote}

Student:
- Name: ${student.name || "a student"}
- Interests: ${student.interests?.join(", ")}
- Background: ${student.background || "none"}

Professional:
- Name: ${contact.name}
- Title: ${contact.title}
- Company: ${contact.org}
- Team: ${contact.department}
- Expertise: ${contact.research}
- Notable: ${contact.recentWork}

Write a SHORT email (under 120 words). Warm, direct, human — not a cover letter. Avoid "reaching out because", "deeply passionate", "I would be honored". Reference something specific about their work/career. Make ONE concrete ask (15-min call, advice, etc). Make it easy to say yes.

Just the email body. Start "Hi [First Name]," — end simply and confidently.`;
    }
  };

  const generateEmail = async (contact, goal) => {
    const id = contact.id;
    setGenerating(p => ({ ...p, [id]: true }));
    setGenStep(p => ({ ...p, [id]: 0 }));
    for (let i = 1; i < LOADING_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 550));
      setGenStep(p => ({ ...p, [id]: i }));
    }
    const prompt = buildPrompt(contact, goal);
    const subject = mode === "academic"
      ? `Prospective Student — ${goal || "Question About Your Research"}`
      : `${student.name || "Student"} — ${goal || "Quick Question"}`;
    const doFetch = async () => {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 400, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      return data.content?.map(b => b.text || "").join("") || "";
    };
    try {
      let body = await doFetch();
      if (!body) throw new Error("empty");
      const draft = { id: Date.now(), ts: new Date().toISOString(), goal: goal || "General", subject, body };
      setContacts(prev => ({
        ...prev,
        [mode]: prev[mode].map(c => c.id === id
          ? { ...c, emailHistory: [draft, ...(c.emailHistory || [])], status: c.status === "Not Contacted" ? "Drafted" : c.status }
          : c
        ),
      }));
      addActivityLog(id, `Email drafted (goal: ${goal || "General"})`);
      if (contacts[mode].find(c => c.id === id)?.status === "Not Contacted") {
        addActivityLog(id, `Status changed to "Drafted"`);
      }
    } catch (e) {
      try {
        await new Promise(r => setTimeout(r, 2000));
        const body = await doFetch();
        const draft = { id: Date.now(), ts: new Date().toISOString(), goal: goal || "General", subject, body };
        setContacts(prev => ({
          ...prev,
          [mode]: prev[mode].map(c => c.id === id ? { ...c, emailHistory: [draft, ...(c.emailHistory || [])] } : c),
        }));
        addActivityLog(id, `Email drafted (retry)`);
      } catch (e2) {
        addActivityLog(id, "Email generation failed — please try again");
      }
    }
    setGenerating(p => ({ ...p, [id]: false }));
  };

  // ── EXPORT ──
  const exportCSV = () => {
    const rows = [["Name", "Title", "Org", "Dept", "Email", "Status", "Research", "Latest Email Subject", "Latest Email Body", "Notes"]];
    modeContacts.forEach(c => {
      const latest = c.emailHistory?.[0];
      rows.push([c.name, c.title, c.org, c.department, c.email, c.status, c.research, latest?.subject || "", latest?.body || "", c.notes || ""]);
    });
    const csv = rows.map(r => r.map(escapeCSV).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `outreach-${mode}.csv`; a.click();
    setExportMsg("CSV downloaded!");
    setTimeout(() => setExportMsg(""), 2000);
  };

  const exportEmails = () => {
    let txt = "";
    modeContacts.filter(c => c.emailHistory?.length).forEach(c => {
      const d = c.emailHistory[0];
      txt += `=== ${c.name} (${c.org}) ===\nSubject: ${d.subject}\n\n${d.body}\n\n`;
    });
    if (!txt) { setExportMsg("No emails to export yet"); setTimeout(() => setExportMsg(""), 2000); return; }
    const blob = new Blob([txt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `emails-${mode}.txt`; a.click();
    setExportMsg("Emails downloaded!");
    setTimeout(() => setExportMsg(""), 2000);
  };

  // ── CSV IMPORT ──
  const importCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split("\n").slice(1).filter(Boolean);
      const imported = lines.map((line, i) => {
        const cols = line.match(/(".*?"|[^,]+)(?=,|$)/g)?.map(v => v.replace(/^"|"$/g, "").replace(/""/g, '"')) || [];
        return {
          id: Date.now() + i,
          mode,
          name: cols[0] || "", title: cols[1] || "", org: cols[2] || "",
          department: cols[3] || "", email: cols[4] || "", status: "Not Contacted",
          research: cols[5] || "", recentWork: cols[6] || "", notes: cols[7] || "",
          emailHistory: [], activityLog: [{ ts: new Date().toISOString(), text: "Imported via CSV" }],
          followUpDate: null, tags: [],
        };
      }).filter(c => c.name);
      setContacts(prev => ({ ...prev, [mode]: [...prev[mode], ...imported] }));
      setExportMsg(`Imported ${imported.length} contacts`);
      setTimeout(() => setExportMsg(""), 2500);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ── FILTERED LIST ──
  const orgs = ["All", ...Array.from(new Set(modeContacts.map(c => c.org).filter(Boolean)))];
  const filtered = modeContacts.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.org?.toLowerCase().includes(q) || c.department?.toLowerCase().includes(q) || c.research?.toLowerCase().includes(q);
    const matchStatus = filterStatus === "All" || c.status === filterStatus;
    const matchDept = filterDept === "All" || c.department === filterDept;
    const matchOrg = filterOrg === "All" || c.org === filterOrg;
    return matchSearch && matchStatus && matchDept && matchOrg;
  });

  // ── STATS ──
  const stats = STATUSES.reduce((acc, s) => { acc[s] = modeContacts.filter(c => c.status === s).length; return acc; }, {});
  const totalWithEmails = modeContacts.filter(c => c.emailHistory?.length > 0).length;
  const followUps = modeContacts.filter(c => c.followUpDate && daysUntil(c.followUpDate) <= 3 && daysUntil(c.followUpDate) >= 0);

  const selectedContact = selectedId ? modeContacts.find(c => c.id === selectedId) : null;

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "Georgia, serif", minHeight: "100vh", background: "#0c0c0e", color: "#e2ddd6" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; }
        :root {
          --gold: #c9a96e; --gold-dim: #c9a96e22; --gold-mid: #c9a96e55;
          --green: #5d9e6e; --red: #b05c5c; --blue: #4a6fa5;
          --bg: #0c0c0e; --bg1: #131317; --bg2: #1a1a20; --bg3: #22222a;
          --border: #2a2a35; --border2: #333340; --text: #e2ddd6; --muted: #666; --muted2: #888;
        }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: var(--bg1); }
        ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }
        .mono { font-family: 'DM Mono', monospace; }
        .serif { font-family: 'DM Serif Display', serif; }
        .label { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
        .card { background: var(--bg1); border: 1px solid var(--border); border-radius: 6px; }
        .card:hover { border-color: var(--border2); }
        .btn { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; letter-spacing: .06em; cursor: pointer; border-radius: 4px; transition: all .15s; padding: 8px 16px; border: none; }
        .btn-gold { background: var(--gold); color: #0c0c0e; }
        .btn-gold:hover { background: #d4b87a; transform: translateY(-1px); }
        .btn-ghost { background: none; border: 1px solid var(--border2); color: var(--muted2); }
        .btn-ghost:hover { border-color: var(--gold-mid); color: var(--gold); }
        .btn-danger { background: none; border: 1px solid #442222; color: #b05c5c; }
        .btn-danger:hover { background: #2a1010; }
        input, textarea, select {
          background: var(--bg2); border: 1px solid var(--border); color: var(--text);
          padding: 9px 13px; border-radius: 4px; font-family: 'DM Mono', monospace; font-size: 12px;
          width: 100%; outline: none; transition: border-color .2s;
        }
        input:focus, textarea:focus, select:focus { border-color: var(--gold-mid); }
        select option { background: var(--bg2); }
        .pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 9px; font-family: 'DM Mono', monospace; letter-spacing: .05em; margin: 2px; border: 1px solid var(--border2); color: var(--muted); }
        .pill.on { background: var(--gold-dim); border-color: var(--gold-mid); color: var(--gold); }
        .nav-item { font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; padding: 8px 16px; cursor: pointer; border-radius: 4px; transition: all .15s; color: var(--muted); background: none; border: none; }
        .nav-item.active { color: var(--gold); background: var(--gold-dim); }
        .nav-item:hover:not(.active) { color: var(--muted2); background: var(--bg2); }
        .status-badge { display: inline-block; padding: 3px 10px; border-radius: 3px; font-size: 10px; font-family: 'DM Mono', monospace; font-weight: 500; }
        .fade { animation: fadeIn .3s ease; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .pulse { animation: pulse 1.4s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:1} }
        .contact-row { padding: 14px 18px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background .12s; display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: center; }
        .contact-row:hover { background: var(--bg2); }
        .contact-row.active { background: #1a1810; border-left: 2px solid var(--gold); }
        .tag { display: inline-block; padding: 2px 8px; background: var(--bg3); border: 1px solid var(--border2); border-radius: 3px; font-size: 9px; font-family: 'DM Mono', monospace; color: var(--muted2); margin: 2px; }
        .email-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 5px; padding: 14px; margin-bottom: 10px; transition: border-color .15s; }
        .email-card:hover { border-color: var(--gold-mid); }
        .email-card.best { border-color: var(--gold-mid); background: #1a1810; }
        .activity-item { padding: 8px 0; border-bottom: 1px solid var(--border); display: flex; gap: 12px; align-items: flex-start; }
        .mode-toggle-wrap { display: flex; gap: 2px; background: var(--bg2); border: 1px solid var(--border); border-radius: 5px; padding: 3px; }
        .mode-btn { background: none; border: none; padding: 5px 14px; font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: .05em; cursor: pointer; border-radius: 3px; color: var(--muted); transition: all .2s; }
        .mode-btn.active { background: var(--gold); color: #0c0c0e; font-weight: 500; }
        .mode-btn:hover:not(.active) { color: var(--muted2); }
        .stat-box { background: var(--bg1); border: 1px solid var(--border); border-radius: 6px; padding: 16px 20px; }
        .reminder-alert { background: #2a1010; border: 1px solid #442222; border-radius: 5px; padding: 10px 16px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
        .sidebar { width: 280px; flex-shrink: 0; border-right: 1px solid var(--border); height: calc(100vh - 56px); overflow-y: auto; }
        .detail-panel { flex: 1; overflow-y: auto; height: calc(100vh - 56px); padding: 24px 28px; }
        .split { display: flex; height: calc(100vh - 56px); }
        .textarea-email { background: var(--bg1); border: 1px solid var(--border); color: var(--text); padding: 14px; border-radius: 5px; font-family: 'DM Mono', monospace; font-size: 12px; line-height: 1.75; width: 100%; min-height: 200px; resize: vertical; outline: none; }
        .textarea-email:focus { border-color: var(--gold-mid); }
      `}</style>

      {/* ── TOP NAV ── */}
      <div style={{ background: "var(--bg1)", borderBottom: "1px solid var(--border)", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div>
            <span className="serif" style={{ fontSize: 18, color: "var(--text)" }}>Outreach</span>
            <span className="mono" style={{ fontSize: 10, color: "var(--muted)", marginLeft: 8 }}>CRM</span>
          </div>
          <div className="mode-toggle-wrap">
            {Object.entries(MODE_LABELS).map(([k, v]) => (
              <button key={k} className={`mode-btn ${mode === k ? "active" : ""}`} onClick={() => { setMode(k); setSelectedId(null); setView("dashboard"); }}>{v}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {savedToast && <span className="mono" style={{ fontSize: 10, color: "var(--green)" }}>✓ saved</span>}
          {exportMsg && <span className="mono" style={{ fontSize: 10, color: "var(--gold)" }}>{exportMsg}</span>}
          {["dashboard", "list", "settings"].map(v => (
            <button key={v} className={`nav-item ${view === v && !selectedId ? "active" : ""}`} onClick={() => { setView(v); setSelectedId(null); }}>{v}</button>
          ))}
          <button className="btn btn-gold" style={{ padding: "6px 14px" }} onClick={() => { setShowAddForm(true); setEditingContact(null); setView("list"); }}>+ Add</button>
        </div>
      </div>

      {/* ── DASHBOARD ── */}
      {view === "dashboard" && !selectedId && (
        <div className="fade" style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}>
          <div className="serif" style={{ fontSize: 26, marginBottom: 6 }}>
            {mode === "academic" ? "Academic Outreach" : "Professional Networking"}
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginBottom: 28 }}>
            {modeContacts.length} contacts · {totalWithEmails} emails drafted
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 24 }}>
            {STATUSES.map(s => (
              <div key={s} className="stat-box" style={{ cursor: "pointer" }} onClick={() => { setFilterStatus(s); setView("list"); }}>
                <div className="mono" style={{ fontSize: 22, fontWeight: 500, color: STATUS_COLORS[s] }}>{stats[s]}</div>
                <div className="label" style={{ marginTop: 4 }}>{s}</div>
              </div>
            ))}
          </div>

          {/* Follow-up reminders */}
          {followUps.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div className="label" style={{ marginBottom: 10 }}>⚡ Follow-up Due Soon</div>
              {followUps.map(c => {
                const d = daysUntil(c.followUpDate);
                return (
                  <div key={c.id} className="reminder-alert" onClick={() => { setSelectedId(c.id); setView("detail"); }} style={{ cursor: "pointer" }}>
                    <div>
                      <span className="mono" style={{ fontSize: 13, color: "var(--text)" }}>{c.name}</span>
                      <span className="mono" style={{ fontSize: 11, color: "var(--muted)", marginLeft: 12 }}>{c.org}</span>
                    </div>
                    <div className="mono" style={{ fontSize: 11, color: "#f0b0b0" }}>
                      {d === 0 ? "Today" : d === 1 ? "Tomorrow" : `In ${d} days`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recent contacts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {modeContacts.slice(0, 6).map(c => (
              <div key={c.id} className="card" style={{ padding: "16px 20px", cursor: "pointer" }} onClick={() => { setSelectedId(c.id); setView("detail"); }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div className="serif" style={{ fontSize: 15 }}>{c.name}</div>
                  <span className="status-badge" style={{ background: STATUS_COLORS[c.status] + "33", color: STATUS_TEXT[c.status] === "#0f0f0f" ? STATUS_COLORS[c.status] : STATUS_TEXT[c.status] }}>{c.status}</span>
                </div>
                <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>{c.title} · {c.org}</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--muted2)", lineHeight: 1.5 }}>{c.research?.slice(0, 80)}{c.research?.length > 80 ? "..." : ""}</div>
                {c.followUpDate && daysUntil(c.followUpDate) !== null && daysUntil(c.followUpDate) >= 0 && (
                  <div className="mono" style={{ fontSize: 10, color: "#f0b0b0", marginTop: 8 }}>📅 Follow up: {fmtDate(c.followUpDate)}</div>
                )}
              </div>
            ))}
          </div>

          {/* Export row */}
          <div style={{ display: "flex", gap: 10, marginTop: 24, alignItems: "center" }}>
            <button className="btn btn-ghost" onClick={exportCSV}>↓ Export CSV</button>
            <button className="btn btn-ghost" onClick={exportEmails}>↓ Export Emails (.txt)</button>
            <button className="btn btn-ghost" onClick={() => fileInputRef.current.click()}>↑ Import CSV</button>
            <input ref={fileInputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={importCSV} />
            <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>CSV format: Name, Title, Org, Dept, Email, Research, Recent Work, Notes</span>
          </div>
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {view === "list" && !selectedId && (
        <div className="fade" style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 28px" }}>
          {/* Add/edit form */}
          {showAddForm && (
            <ContactForm
              initial={editingContact}
              mode={mode}
              onSave={saveContact}
              onCancel={() => { setShowAddForm(false); setEditingContact(null); }}
            />
          )}

          {/* Filters */}
          <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
            <input placeholder="Search by name, school, research..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: "1 1 220px", maxWidth: 340 }} />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: "auto", minWidth: 140 }}>
              <option value="All">All Statuses</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ width: "auto", minWidth: 140 }}>
              <option value="All">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
            <select value={filterOrg} onChange={e => setFilterOrg(e.target.value)} style={{ width: "auto", minWidth: 160 }}>
              {orgs.map(o => <option key={o}>{o === "All" ? "All Schools/Orgs" : o}</option>)}
            </select>
            <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>{filtered.length} results</span>
          </div>

          {/* Contact list */}
          <div className="card" style={{ overflow: "hidden" }}>
            {filtered.length === 0 && (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <div className="mono" style={{ color: "var(--muted)", fontSize: 12 }}>No contacts match your filters</div>
              </div>
            )}
            {filtered.map(c => (
              <div key={c.id} className="contact-row" onClick={() => { setSelectedId(c.id); setView("detail"); }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span className="serif" style={{ fontSize: 15 }}>{c.name}</span>
                    <span className="status-badge" style={{ background: STATUS_COLORS[c.status] + "33", color: STATUS_COLORS[c.status] }}>{c.status}</span>
                    {c.emailHistory?.length > 0 && <span className="mono" style={{ fontSize: 9, color: "var(--green)" }}>✓ {c.emailHistory.length} draft{c.emailHistory.length > 1 ? "s" : ""}</span>}
                    {c.followUpDate && daysUntil(c.followUpDate) !== null && daysUntil(c.followUpDate) <= 3 && daysUntil(c.followUpDate) >= 0 && <span className="mono" style={{ fontSize: 9, color: "#f0b0b0" }}>⚡ follow up</span>}
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{c.title} · {c.org} · {c.department}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--muted2)" }}>{c.research?.slice(0, 100)}{c.research?.length > 100 ? "..." : ""}</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  {c.website && <a href={c.website} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="btn btn-ghost" style={{ padding: "5px 10px", fontSize: 10 }}>↗ Page</a>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DETAIL VIEW ── */}
      {selectedId && selectedContact && (
        <DetailView
          contact={selectedContact}
          mode={mode}
          generating={generating[selectedContact.id]}
          genStep={genStep[selectedContact.id] || 0}
          onBack={() => { setSelectedId(null); setView("list"); }}
          onStatusChange={(s) => setStatus(selectedContact.id, s)}
          onGenerate={(goal) => generateEmail(selectedContact, goal)}
          onUpdateEmail={(draftId, field, val) => {
            setContacts(prev => ({
              ...prev,
              [mode]: prev[mode].map(c => c.id === selectedContact.id
                ? { ...c, emailHistory: c.emailHistory.map(d => d.id === draftId ? { ...d, [field]: val } : d) }
                : c
              ),
            }));
          }}
          onDeleteDraft={(draftId) => {
            setContacts(prev => ({
              ...prev,
              [mode]: prev[mode].map(c => c.id === selectedContact.id
                ? { ...c, emailHistory: c.emailHistory.filter(d => d.id !== draftId) }
                : c
              ),
            }));
          }}
          onUpdateNotes={(notes) => updateContact(selectedContact.id, { notes })}
          onAddActivity={(txt) => addActivityLog(selectedContact.id, txt)}
          onSetFollowUp={(date) => { updateContact(selectedContact.id, { followUpDate: date }); addActivityLog(selectedContact.id, `Follow-up set for ${fmtDate(date)}`); }}
          onEdit={() => { setEditingContact(selectedContact); setShowAddForm(true); setView("list"); setSelectedId(null); }}
          onDelete={() => deleteContact(selectedContact.id)}
        />
      )}

      {/* ── SETTINGS ── */}
      {view === "settings" && !selectedId && (
        <SettingsView student={student} setStudent={setStudent} INTERESTS_LIST={INTERESTS_LIST} customInterest={customInterest} setCustomInterest={setCustomInterest} />
      )}
    </div>
  );
}

// ─── CONTACT FORM ─────────────────────────────────────────────────────────────
function ContactForm({ initial, mode, onSave, onCancel }) {
  const isAcademic = mode === "academic";
  const [form, setForm] = useState(initial || {
    name: "", title: "", org: "", department: "", email: "", website: "", research: "", recentWork: "", notes: "",
  });
  const f = (k) => (v) => setForm(p => ({ ...p, [k]: typeof v === "string" ? v : v.target.value }));

  return (
    <div className="card fade" style={{ padding: "20px 24px", marginBottom: 20, borderColor: "#c9a96e33" }}>
      <div className="label" style={{ color: "var(--gold)", marginBottom: 16 }}>{initial ? "Edit Contact" : `Add ${isAcademic ? "Professor" : "Professional"}`}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <input placeholder="Full Name" value={form.name} onChange={f("name")} />
        <input placeholder={isAcademic ? "Title (e.g. Associate Professor)" : "Title (e.g. VP, Analyst)"} value={form.title} onChange={f("title")} />
        <input placeholder={isAcademic ? "University" : "Company / Org"} value={form.org} onChange={f("org")} />
        <input placeholder={isAcademic ? "Department" : "Team / Division"} value={form.department} onChange={f("department")} />
        <input placeholder="Email" value={form.email} onChange={f("email")} />
        <input placeholder={isAcademic ? "Faculty page URL" : "LinkedIn / website"} value={form.website} onChange={f("website")} />
      </div>
      <textarea placeholder={isAcademic ? "Research interests" : "Areas of expertise / what they do"} value={form.research} onChange={f("research")} style={{ marginBottom: 8, minHeight: 56 }} />
      <textarea placeholder={isAcademic ? "Recent papers / awards" : "Notable deals, projects, career highlights"} value={form.recentWork} onChange={f("recentWork")} style={{ marginBottom: 8, minHeight: 56 }} />
      <textarea placeholder="Personal notes..." value={form.notes} onChange={f("notes")} style={{ marginBottom: 14, minHeight: 44 }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-gold" onClick={() => onSave(form)}>Save</button>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ─── DETAIL VIEW ──────────────────────────────────────────────────────────────
function DetailView({ contact: c, mode, generating, genStep, onBack, onStatusChange, onGenerate, onUpdateEmail, onDeleteDraft, onUpdateNotes, onAddActivity, onSetFollowUp, onEdit, onDelete }) {
  const isAcademic = mode === "academic";
  const [activeTab, setActiveTab] = useState("emails");
  const [selectedGoal, setSelectedGoal] = useState(EMAIL_GOALS[mode][0]);
  const [noteInput, setNoteInput] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [followInput, setFollowInput] = useState(c.followUpDate?.slice(0, 10) || "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const copyDraft = (d) => {
    navigator.clipboard.writeText(`Subject: ${d.subject}\n\n${d.body}`);
    setCopiedId(d.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fade" style={{ maxWidth: 900, margin: "0 auto", padding: "24px 28px" }}>
      {/* Back + header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <button className="btn btn-ghost" style={{ padding: "5px 12px", marginBottom: 12, fontSize: 11 }} onClick={onBack}>← Back</button>
          <div className="serif" style={{ fontSize: 24 }}>{c.name}</div>
          <div className="mono" style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{c.title} · {c.org}</div>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{c.email}</div>
          {c.website && <a href={c.website} target="_blank" rel="noreferrer" className="mono" style={{ fontSize: 11, color: "var(--gold)", marginTop: 2, display: "block" }}>↗ Faculty / Profile Page</a>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <select value={c.status} onChange={e => onStatusChange(e.target.value)} style={{ width: "auto", minWidth: 150 }}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="btn btn-ghost" onClick={onEdit}>Edit</button>
          {confirmDelete
            ? <><button className="btn btn-danger" onClick={onDelete}>Confirm Delete</button><button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>Cancel</button></>
            : <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>Delete</button>
          }
        </div>
      </div>

      {/* Research info */}
      <div className="card" style={{ padding: "14px 18px", marginBottom: 16 }}>
        <div className="label" style={{ marginBottom: 6 }}>{isAcademic ? "Research" : "Expertise"}</div>
        <div className="mono" style={{ fontSize: 12, color: "var(--muted2)", lineHeight: 1.6, marginBottom: 8 }}>{c.research}</div>
        {c.recentWork && <>
          <div className="label" style={{ marginBottom: 4 }}>{isAcademic ? "Recent Work" : "Notable"}</div>
          <div className="mono" style={{ fontSize: 12, color: "var(--muted2)", lineHeight: 1.6 }}>{c.recentWork}</div>
        </>}
        {c.tags?.length > 0 && <div style={{ marginTop: 10 }}>{c.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 1 }}>
        {["emails", "activity", "notes"].map(t => (
          <button key={t} className={`nav-item ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)} style={{ padding: "6px 14px" }}>{t} {t === "emails" && c.emailHistory?.length ? `(${c.emailHistory.length})` : ""}</button>
        ))}
      </div>

      {/* EMAILS TAB */}
      {activeTab === "emails" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <select value={selectedGoal} onChange={e => setSelectedGoal(e.target.value)} style={{ width: "auto", minWidth: 200 }}>
              {EMAIL_GOALS[mode].map(g => <option key={g}>{g}</option>)}
            </select>
            <button className="btn btn-gold" onClick={() => onGenerate(selectedGoal)} disabled={generating}>
              {generating ? "Generating..." : c.emailHistory?.length ? "Generate New Draft" : "Generate Email"}
            </button>
          </div>

          {generating && (
            <div style={{ padding: "28px 0", textAlign: "center" }}>
              <div className="mono pulse" style={{ fontSize: 12, color: "var(--gold)" }}>{LOADING_STEPS[genStep]}</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 14 }}>
                {LOADING_STEPS.map((_, i) => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i <= genStep ? "var(--gold)" : "var(--border2)", transition: "background .3s" }} />)}
              </div>
            </div>
          )}

          {!generating && c.emailHistory?.length === 0 && (
            <div style={{ padding: "40px 0", textAlign: "center", border: "1px dashed var(--border2)", borderRadius: 6 }}>
              <div className="mono" style={{ color: "var(--muted)", fontSize: 12, marginBottom: 12 }}>No drafts yet — generate your first email above</div>
            </div>
          )}

          {c.emailHistory?.map((d, i) => (
            <div key={d.id} className={`email-card ${i === 0 ? "best" : ""}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {i === 0 && <span className="mono" style={{ fontSize: 9, color: "var(--gold)", background: "var(--gold-dim)", padding: "2px 8px", borderRadius: 3 }}>LATEST</span>}
                  <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>{d.goal} · {fmtDate(d.ts)}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-gold" style={{ padding: "4px 12px", fontSize: 10 }} onClick={() => copyDraft(d)}>{copiedId === d.id ? "✓ Copied!" : "Copy"}</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 10 }} onClick={() => onDeleteDraft(d.id)}>Delete</button>
                </div>
              </div>
              <div className="label" style={{ marginBottom: 4 }}>Subject</div>
              <input value={d.subject} onChange={e => onUpdateEmail(d.id, "subject", e.target.value)} style={{ marginBottom: 10 }} />
              <div className="label" style={{ marginBottom: 4 }}>Body</div>
              <textarea className="textarea-email" value={d.body} onChange={e => onUpdateEmail(d.id, "body", e.target.value)} />
            </div>
          ))}
        </div>
      )}

      {/* ACTIVITY TAB */}
      {activeTab === "activity" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <input placeholder="Add a note (e.g. emailed on 3/8, met at info session...)" value={noteInput} onChange={e => setNoteInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && noteInput.trim()) { onAddActivity(noteInput.trim()); setNoteInput(""); } }} />
            <button className="btn btn-gold" style={{ flexShrink: 0 }} onClick={() => { if (noteInput.trim()) { onAddActivity(noteInput.trim()); setNoteInput(""); } }}>Log</button>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div className="label" style={{ marginBottom: 10 }}>Set Follow-up Reminder</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="date" value={followInput} onChange={e => setFollowInput(e.target.value)} style={{ width: "auto" }} />
              <button className="btn btn-ghost" onClick={() => { if (followInput) onSetFollowUp(followInput + "T00:00:00.000Z"); }}>Set Reminder</button>
              {c.followUpDate && <button className="btn btn-ghost" onClick={() => { onSetFollowUp(null); setFollowInput(""); }}>Clear</button>}
              {c.followUpDate && <span className="mono" style={{ fontSize: 11, color: "#f0b0b0" }}>📅 {fmtDate(c.followUpDate)} ({daysUntil(c.followUpDate)} days)</span>}
            </div>
          </div>

          <div>
            {(c.activityLog || []).length === 0 && <div className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>No activity yet</div>}
            {(c.activityLog || []).map((a, i) => (
              <div key={i} className="activity-item">
                <div className="mono" style={{ fontSize: 10, color: "var(--muted)", minWidth: 90 }}>{fmtDate(a.ts)}</div>
                <div className="mono" style={{ fontSize: 12, color: "var(--muted2)" }}>{a.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NOTES TAB */}
      {activeTab === "notes" && (
        <div>
          <div className="label" style={{ marginBottom: 8 }}>Personal Notes</div>
          <textarea className="textarea-email" style={{ minHeight: 180 }} placeholder="Anything useful — connection notes, conversation topics, mutual contacts, what to mention..." value={c.notes || ""} onChange={e => onUpdateNotes(e.target.value)} />
          <div className="mono" style={{ fontSize: 10, color: "var(--muted)", marginTop: 8 }}>Notes auto-save as you type</div>
        </div>
      )}
    </div>
  );
}

// ─── SETTINGS VIEW ────────────────────────────────────────────────────────────
function SettingsView({ student, setStudent, INTERESTS_LIST, customInterest, setCustomInterest }) {
  const toggle = (i) => setStudent(p => ({
    ...p,
    interests: p.interests?.includes(i) ? p.interests.filter(x => x !== i) : [...(p.interests || []), i],
  }));

  return (
    <div className="fade" style={{ maxWidth: 580, margin: "0 auto", padding: "28px 28px" }}>
      <div className="serif" style={{ fontSize: 22, marginBottom: 20 }}>Your Profile</div>

      <div style={{ marginBottom: 16 }}>
        <div className="label" style={{ marginBottom: 6 }}>Your Name</div>
        <input value={student.name || ""} onChange={e => setStudent(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Karthik Gorrepati" />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div className="label" style={{ marginBottom: 8 }}>Interests</div>
        <div style={{ marginBottom: 10 }}>
          {INTERESTS_LIST.map(i => <button key={i} className={`pill ${student.interests?.includes(i) ? "on" : ""}`} onClick={() => toggle(i)} style={{ cursor: "pointer", background: "none", border: "1px solid var(--border2)" }}>{i}</button>)}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="Add custom interest..." value={customInterest} onChange={e => setCustomInterest(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && customInterest.trim()) { toggle(customInterest.trim()); setCustomInterest(""); } }} />
          <button className="btn btn-ghost" style={{ flexShrink: 0 }} onClick={() => { if (customInterest.trim()) { toggle(customInterest.trim()); setCustomInterest(""); } }}>+ Add</button>
        </div>
        {student.interests?.filter(i => !INTERESTS_LIST.includes(i)).length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div className="label" style={{ marginBottom: 4 }}>Custom</div>
            {student.interests.filter(i => !INTERESTS_LIST.includes(i)).map(i => (
              <button key={i} className="pill on" onClick={() => toggle(i)} style={{ cursor: "pointer", background: "var(--gold-dim)" }}>{i} ×</button>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 20 }}>
        <div className="label" style={{ marginBottom: 6 }}>Background / Context</div>
        <textarea
          value={student.background || ""}
          onChange={e => setStudent(p => ({ ...p, background: e.target.value }))}
          placeholder="Your school, GPA, programs you've done, what you're looking for — the more detail the better the emails"
          style={{ minHeight: 110 }}
        />
        <div className="mono" style={{ fontSize: 10, color: "var(--muted)", marginTop: 6 }}>Claude uses this to personalize every email</div>
      </div>

      <div style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 5, padding: "14px 18px" }}>
        <div className="label" style={{ color: "var(--gold)", marginBottom: 10 }}>Tips</div>
        <div className="mono" style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.9 }}>
          🎓 Academic emails — reference specific research, ask one smart question<br />
          💼 Professional emails — warm tone, concrete ask, easy to reply to<br />
          📋 Use the activity log to track when you sent emails and got replies<br />
          📅 Set follow-up reminders so nothing falls through the cracks<br />
          ↓ Export your contacts + emails to CSV or .txt anytime
        </div>
      </div>
    </div>
  );
}
