const API = "";
let _chatHistory = [];
let _lastResult = null;
let _reportResult = null;

function getToken() { return localStorage.getItem("wordsure_token"); }
function setToken(t) { localStorage.setItem("wordsure_token", t); }
function removeToken() { localStorage.removeItem("wordsure_token"); }

async function authFetch(url, options = {}) {
  const token = getToken();
  if (!options.headers) options.headers = {};
  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(url, options);
  if (res.status === 401) {
    removeToken();
    nav("login");
    toast("Session expired. Please log in again.", "error");
    throw new Error("Unauthorized");
  }
  return res;
}

// ---- NAVIGATION ----
function nav(page, data) {
  const isAuthPage = ['login', 'signup', 'reset'].includes(page);
  if (!getToken() && !isAuthPage) {
    page = 'login';
  }
  
  const content = document.getElementById("pageContent");
  content.innerHTML = PAGES[page] ? PAGES[page](data) : PAGES.home();
  document.getElementById("topbarTitle").textContent = PAGE_TITLES[page] || page;
  
  document.querySelectorAll(".nav-item").forEach(el => {
    el.classList.toggle("active", el.dataset.page === page);
  });
  
  // Show/hide sidebar based on auth
  const sidebar = document.getElementById("sidebar");
  if (page === 'login' || page === 'signup' || page === 'reset') {
    sidebar.style.display = 'none';
  } else {
    sidebar.style.display = 'flex';
  }

  window._currentPage = page;
  
  if (page === "dashboard") loadDashboard();
  if (page === "history") loadHistory();
  if (page === "profile") loadProfile();
  if (page === "correction" && data) prefillCorrection(data);
  sidebar.classList.remove("open");
}

// ---- HEALTH CHECK ----
async function checkHealth() {
  try {
    const r = await fetch(`${API}/api/health`);
    const d = await r.json();
    const dot = document.getElementById("statusDot");
    const txt = document.getElementById("statusTxt");
    if (d.ollama) { 
      dot.className = "dot on"; 
      txt.textContent = d.provider === "groq" ? "Groq ready" : "Ollama ready"; 
    }
    else { 
      dot.className = "dot off"; 
      txt.textContent = d.provider === "groq" ? "Groq offline" : "Ollama offline"; 
    }
  } catch {
    document.getElementById("statusDot").className = "dot off";
    document.getElementById("statusTxt").textContent = "Server offline";
  }
}
checkHealth();
setInterval(checkHealth, 12000);

// ---- THEME ----
function toggleTheme() {
  const html = document.documentElement;
  html.dataset.theme = html.dataset.theme === "dark" ? "light" : "dark";
}

// ---- TOAST ----
function toast(msg, type = "info") {
  const wrap = document.getElementById("toastWrap");
  if(!wrap) return;
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";
  el.innerHTML = `<span style="font-weight:700;font-size:15px">${icon}</span><span>${msg}</span>`;
  wrap.appendChild(el);
  setTimeout(() => { el.style.animation = "slide-out 0.3s ease forwards"; setTimeout(() => el.remove(), 300); }, 3000);
}

// ---- CHECKER ----
document.addEventListener("input", e => {
  if (e.target.id === "checkerText") {
    const w = e.target.value.trim().split(/\s+/).filter(Boolean).length;
    const el = document.getElementById("checkerWC");
    if (el) el.textContent = `${w} word${w !== 1 ? "s" : ""}`;
  }
});

function loadSample() {
  const el = document.getElementById("checkerText");
  if (!el) return;
  el.value = `Plagiarism is the act of using someone else's work or ideas without giving proper credit. Machine learning is a subset of artificial intelligence that enables systems to learn from data and improve over time. The internet has revolutionized how people communicate and share information worldwide. Academic integrity means being honest and ethical in all academic work and research submissions.`;
  el.dispatchEvent(new Event("input"));
}

function clearChecker() {
  const el = document.getElementById("checkerText");
  if (el) el.value = "";
  const empty = document.getElementById("checkerEmpty");
  const results = document.getElementById("checkerResults");
  if (empty) empty.style.display = "block";
  if (results) results.style.display = "none";
}

async function runCheck() {
  const text = document.getElementById("checkerText")?.value.trim();
  if (!text) { toast("Please enter some text first", "error"); return; }
  const btn = document.getElementById("checkBtn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner dark"></span> Analyzing...`;
  try {
    const r = await authFetch(`${API}/api/check`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, title: text.substring(0, 40) })
    });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();
    _lastResult = data;
    window._lastResult = data;
    displayCheckerResults(data);
    toast("Analysis complete!", "success");
  } catch (e) {
    if(e.message !== "Unauthorized") toast("Error: " + e.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> Analyze Text`;
  }
}

function displayCheckerResults(data) {
  document.getElementById("checkerEmpty").style.display = "none";
  document.getElementById("checkerResults").style.display = "block";
  const score = data.overall_score;
  const circ = document.getElementById("ringCircle");
  const offset = 263.9 - (score / 100) * 263.9;
  circ.style.strokeDashoffset = offset;
  circ.style.stroke = score >= 70 ? "var(--high)" : score >= 40 ? "var(--medium)" : "var(--low)";
  document.getElementById("ringNum").textContent = `${score}%`;
  document.getElementById("rHigh").textContent = data.high_risk;
  document.getElementById("rMed").textContent = data.medium_risk;
  document.getElementById("rLow").textContent = data.low_risk;
  document.getElementById("rSummary").textContent = data.summary;
  const pb = document.getElementById("progressBar");
  pb.style.width = score + "%";
  pb.className = "progress-bar " + (score >= 70 ? "high" : score >= 40 ? "medium" : "low");
  document.getElementById("progPct").textContent = score + "%";
  const list = document.getElementById("sentenceList");
  list.innerHTML = "";
  data.sentences.forEach((s, i) => {
    const div = document.createElement("div");
    div.className = "sentence-item";
    div.style.animationDelay = (i * 0.03) + "s";
    let matchHtml = "";
    if (s.matched_with) {
      if (s.matched_with.startsWith("http")) {
        const url = s.matched_with.split(" ")[0];
        matchHtml = `<div style="font-size:12px;color:var(--text3);margin-top:4px;">Source: <a href="${url}" target="_blank" style="color:var(--accent);text-decoration:none;">${url}</a></div>`;
      } else {
        matchHtml = `<div style="font-size:12px;color:var(--text3);margin-top:4px;">Source: ${esc(s.matched_with)}</div>`;
      }
    }
    div.innerHTML = `<div class="s-bar ${s.level}"></div><div class="s-text" style="flex:1;">${esc(s.sentence)}${matchHtml}</div><span class="s-score ${s.level}">${s.score}%</span>`;
    list.appendChild(div);
  });
}

function copyReport() {
  if (!_lastResult) return;
  const lines = [`WordSure Report — ${new Date().toLocaleString()}`, `Overall Plagiarism: ${_lastResult.overall_score}%`, `Summary: ${_lastResult.summary}`, "", "--- Sentences ---"];
  _lastResult.sentences.forEach(s => lines.push(`[${s.level.toUpperCase()} ${s.score}%] ${s.sentence}`));
  navigator.clipboard.writeText(lines.join("\n")).then(() => toast("Report copied to clipboard!", "success"));
}

// ---- FILE UPLOAD ----
async function handleFile(input) {
  const file = input.files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append("file", file);
  toast("Reading file...", "info");
  try {
    const r = await authFetch(`${API}/api/check-file`, { method: "POST", body: fd });
    const data = await r.json();
    _lastResult = data;
    window._lastResult = data;
    displayCheckerResults(data);
    toast(`File analyzed: ${file.name}`, "success");
  } catch (e) {
    if(e.message !== "Unauthorized") toast("File error: " + e.message, "error");
  }
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById("uploadZone").classList.remove("drag");
  const file = e.dataTransfer.files[0];
  if (!file) return;
  const input = document.getElementById("fileInput");
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  handleFile(input);
}

// ---- CORRECTION ----
function prefillCorrection(data) {
  const el = document.getElementById("corrText");
  if (!el || !data?.sentences) return;
  const flagged = data.sentences.filter(s => s.level !== "low").map(s => s.sentence);
  el.value = flagged.join("\n");
}

async function runCorrection() {
  const raw = document.getElementById("corrText")?.value.trim();
  if (!raw) { toast("Enter sentences to correct", "error"); return; }
  const sentences = raw.split("\n").map(s => s.trim()).filter(Boolean);
  const btn = document.getElementById("corrBtn");
  const hBtn = document.getElementById("humanizeBtn");
  btn.disabled = true;
  if (hBtn) hBtn.disabled = true;
  btn.innerHTML = `<span class="spinner dark"></span> Rewriting with AI...`;
  document.getElementById("corrEmpty").style.display = "none";
  const res = document.getElementById("corrResults");
  res.style.display = "flex";
  res.innerHTML = `<div class="card" style="text-align:center;padding:30px"><span class="spinner"></span><div style="margin-top:10px;color:var(--text2);font-size:13px">Groq AI is rewriting ${sentences.length} sentence${sentences.length > 1 ? "s" : ""}...</div></div>`;
  try {
    const r = await authFetch(`${API}/api/correct`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sentences })
    });
    const data = await r.json();
    res.innerHTML = "";
    data.corrections.forEach(c => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <div class="correction-grid">
          <div><div class="corr-label orig">ORIGINAL</div><div class="corr-box orig">${esc(c.original)}</div></div>
          <div><div class="corr-label fixed">AI REWRITE</div><div class="corr-box fixed">${esc(c.corrected)}</div></div>
        </div>
        <button class="btn btn-secondary" style="font-size:12px;padding:6px 12px" onclick="navigator.clipboard.writeText(${JSON.stringify(c.corrected)}).then(()=>toast('Copied!','success'))">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy rewritten text
        </button>`;
      res.appendChild(div);
    });
    toast("All sentences rewritten!", "success");
  } catch (e) {
    if(e.message !== "Unauthorized") {
      res.innerHTML = `<div class="card"><div style="color:var(--high);font-size:13px">Error: ${e.message}</div></div>`;
      toast("Correction failed", "error");
    }
  } finally {
    btn.disabled = false;
    const hBtn = document.getElementById("humanizeBtn");
    if (hBtn) hBtn.disabled = false;
    btn.innerHTML = `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> Rewrite with AI`;
  }
}

async function runHumanize() {
  const raw = document.getElementById("corrText")?.value.trim();
  if (!raw) { toast("Enter sentences to humanize", "error"); return; }
  const sentences = raw.split("\n").map(s => s.trim()).filter(Boolean);
  const btn = document.getElementById("humanizeBtn");
  const corrBtn = document.getElementById("corrBtn");
  btn.disabled = true;
  if (corrBtn) corrBtn.disabled = true;
  
  const originalBtnContent = btn.innerHTML;
  btn.innerHTML = `<span class="spinner dark"></span> Humanizing...`;
  document.getElementById("corrEmpty").style.display = "none";
  const res = document.getElementById("corrResults");
  res.style.display = "flex";
  res.innerHTML = `<div class="card" style="text-align:center;padding:30px"><span class="spinner"></span><div style="margin-top:10px;color:var(--text2);font-size:13px">Groq AI is humanizing ${sentences.length} sentence${sentences.length > 1 ? "s" : ""}...</div></div>`;
  
  try {
    const r = await authFetch(`${API}/api/humanize`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sentences })
    });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();
    res.innerHTML = "";
    data.humanized.forEach(c => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <div class="correction-grid">
          <div><div class="corr-label orig">ORIGINAL</div><div class="corr-box orig">${esc(c.original)}</div></div>
          <div><div class="corr-label fixed">HUMANIZED</div><div class="corr-box fixed">${esc(c.humanized)}</div></div>
        </div>
        <button class="btn btn-secondary" style="font-size:12px;padding:6px 12px" onclick="navigator.clipboard.writeText(${JSON.stringify(c.humanized).replace(/"/g, '&quot;')}).then(()=>toast('Copied!','success'))">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy humanized text
        </button>`;
      res.appendChild(div);
    });
    toast("All sentences humanized!", "success");
  } catch (e) {
    if(e.message !== "Unauthorized") {
      res.innerHTML = `<div class="card"><div style="color:var(--high);font-size:13px">Error: ${e.message}</div></div>`;
      toast("Humanization failed", "error");
    }
  } finally {
    btn.disabled = false;
    if (corrBtn) corrBtn.disabled = false;
    btn.innerHTML = originalBtnContent;
  }
}

// ---- CHATBOT ----
async function sendChat() {
  const inp = document.getElementById("chatIn");
  const msg = inp?.value.trim();
  if (!msg) return;
  inp.value = "";
  appendMsg("user", msg);
  _chatHistory.push({ role: "user", content: msg });
  const typing = appendTyping();
  try {
    const r = await authFetch(`${API}/api/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: _chatHistory })
    });
    const data = await r.json();
    typing.remove();
    appendMsg("ai", data.reply || "Sorry, no response.");
    _chatHistory.push({ role: "assistant", content: data.reply });
  } catch (e) {
    typing.remove();
    if(e.message !== "Unauthorized") appendMsg("ai", "Error connecting to Groq AI. Make sure your API key is valid and you have internet access.");
  }
}

function appendMsg(role, text) {
  const msgs = document.getElementById("chatMsgs");
  if (!msgs) return;
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.innerHTML = `<div class="bubble">${text.replace(/\n/g,"<br>")}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function appendTyping() {
  const msgs = document.getElementById("chatMsgs");
  const div = document.createElement("div");
  div.className = "msg ai";
  div.innerHTML = `<div class="bubble"><div class="typing"><div class="tdot"></div><div class="tdot"></div><div class="tdot"></div></div></div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

// ---- DASHBOARD ----
async function loadDashboard() {
  try {
    const r = await authFetch(`${API}/api/stats`);
    const d = await r.json();
    document.getElementById("dTotal").textContent = d.total_checks;
    document.getElementById("dAvg").textContent = d.avg_score + "%";
    document.getElementById("dHigh").textContent = d.avg_high;
    document.getElementById("dLow").textContent = d.avg_low;
    const rc = document.getElementById("dashRecent");
    if (!d.recent?.length) { rc.innerHTML = `<div style="color:var(--text3);font-size:13px">No checks yet. <a onclick="nav('checker')" style="color:var(--accent);cursor:pointer">Run your first check →</a></div>`; return; }
    rc.innerHTML = d.recent.map(r => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:12px">
          <span style="font-size:13px;color:var(--text2)">${r.date}</span>
          <span class="badge ${r.score >= 70 ? 'badge-high' : r.score >= 40 ? 'badge-medium' : 'badge-low'}">${r.score}%</span>
        </div>
        <button class="btn btn-secondary" style="padding:4px 8px;font-size:11px" onclick="exportHistoryPDF('${r.date}', ${r.score})">PDF</button>
      </div>`).join("");
  } catch { }
}

function exportHistoryPDF(date, score) {
  const container = document.createElement("div");
  container.innerHTML = `
    <h2>WordSure Quick Report</h2>
    <p><strong>Date:</strong> ${date}</p>
    <p><strong>Plagiarism Score:</strong> ${score}%</p>
    <p><em>Log in to history to see full details.</em></p>
  `;
  container.style.padding = "40px";
  container.style.fontFamily = "Inter, sans-serif";
  const opt = {
    margin: 1,
    filename: `WordSure_Summary_${date}.pdf`,
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  toast("Generating PDF...", "info");
  
  container.style.position = "absolute";
  container.style.left = "-9999px";
  document.body.appendChild(container);
  
  html2pdf().set(opt).from(container).save().then(() => {
    toast("PDF downloaded!", "success");
    document.body.removeChild(container);
  }).catch(() => {
    toast("PDF generation failed", "error");
    document.body.removeChild(container);
  });
}

// ---- HISTORY ----
async function loadHistory() {
  try {
    const r = await authFetch(`${API}/api/history`);
    const data = await r.json();
    const el = document.getElementById("historyTable");
    if (!data.history?.length) { el.innerHTML = `<div style="color:var(--text3);font-size:13px;text-align:center;padding:40px">No history yet. <a onclick="nav('checker')" style="color:var(--accent);cursor:pointer">Check your first text →</a></div>`; return; }
    el.innerHTML = `<table class="htable"><thead><tr><th>Title</th><th>Score</th><th>High</th><th>Medium</th><th>Date</th><th></th></tr></thead><tbody>
      ${data.history.map(h => `<tr>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(h.title)}</td>
        <td><span class="badge ${h.score>=70?'badge-high':h.score>=40?'badge-medium':'badge-low'}">${h.score}%</span></td>
        <td style="color:var(--high)">${h.high_risk}</td>
        <td style="color:var(--medium)">${h.medium_risk}</td>
        <td style="color:var(--text3);font-family:var(--font-m);font-size:12px">${h.created_at?.substring(0,10)}</td>
        <td><button class="btn btn-danger" style="padding:5px 10px;font-size:11px" onclick="deleteHistory('${h.id}')">Delete</button></td>
      </tr>`).join("")}
    </tbody></table>`;
  } catch (e) { toast("Could not load history", "error"); }
}

async function deleteHistory(id) {
  try {
    await authFetch(`${API}/api/history/${id}`, { method: "DELETE" });
    toast("Deleted", "success");
    loadHistory();
  } catch(e){}
}

// ---- REPORTS ----
async function generateReport() {
  const text = document.getElementById("reportText")?.value.trim();
  if (!text) { toast("Enter text to generate report", "error"); return; }
  const btn = document.getElementById("reportBtn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner dark"></span> Analyzing...`;
  try {
    const r = await authFetch(`${API}/api/check`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, title: "Report" })
    });
    _reportResult = await r.json();
    document.getElementById("reportPreview").innerHTML = `
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div class="card-title">Report Preview</div>
          <span class="badge ${_reportResult.overall_score>=70?'badge-high':_reportResult.overall_score>=40?'badge-medium':'badge-low'}" style="font-size:13px;padding:4px 12px">${_reportResult.overall_score}% Plagiarism</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">
          <div class="stat-card"><div class="stat-label">HIGH RISK</div><div class="stat-value" style="color:var(--high);font-size:22px">${_reportResult.high_risk}</div></div>
          <div class="stat-card"><div class="stat-label">MEDIUM RISK</div><div class="stat-value" style="color:var(--medium);font-size:22px">${_reportResult.medium_risk}</div></div>
          <div class="stat-card"><div class="stat-label">ORIGINAL</div><div class="stat-value" style="color:var(--low);font-size:22px">${_reportResult.low_risk}</div></div>
        </div>
        <div style="font-size:13px;color:var(--text2);font-style:italic;margin-bottom:14px">${_reportResult.summary}</div>
        ${_reportResult.sentences.map(s=>{
          let matchHtml = "";
          if (s.matched_with) {
            if (s.matched_with.startsWith("http")) {
              const url = s.matched_with.split(" ")[0];
              matchHtml = `<div style="font-size:11px;color:var(--text3);margin-top:2px;">Source: <a href="${url}" target="_blank" style="color:var(--accent);">${url}</a></div>`;
            } else {
              matchHtml = `<div style="font-size:11px;color:var(--text3);margin-top:2px;">Source: ${esc(s.matched_with)}</div>`;
            }
          }
          return `<div class="sentence-item"><div class="s-bar ${s.level}"></div><div class="s-text" style="flex:1;">${esc(s.sentence)}${matchHtml}</div><span class="s-score ${s.level}">${s.score}%</span></div>`;
        }).join("")}
      </div>`;
    document.getElementById("dlBtn").style.display = "inline-flex";
    document.getElementById("pdfBtn").style.display = "inline-flex";
    toast("Report ready!", "success");
  } catch (e) { if(e.message !== "Unauthorized") toast("Error: " + e.message, "error"); }
  finally { btn.disabled = false; btn.innerHTML = `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Analyze & Preview`; }
}

function exportPDF() {
  const element = document.getElementById("reportPreview");
  if (!element || !element.innerHTML) { toast("No report to export", "error"); return; }
  
  toast("Generating PDF...", "info");
  
  const container = document.createElement("div");
  container.innerHTML = element.innerHTML;
  container.style.padding = "40px";
  container.style.background = "#ffffff";
  container.style.color = "#000000";
  container.style.fontFamily = "Inter, sans-serif";
  container.style.width = "800px";
  
  const cards = container.querySelectorAll('.card');
  cards.forEach(c => {
    c.style.background = "#ffffff";
    c.style.border = "1px solid #e2e8f0";
    c.style.boxShadow = "none";
  });

  const opt = {
    margin:       0.5,
    filename:     `WordSure_Report_${Date.now()}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  
  container.style.position = "absolute";
  container.style.left = "-9999px";
  document.body.appendChild(container);
  
  html2pdf().set(opt).from(container).save().then(() => {
    toast("PDF downloaded!", "success");
    document.body.removeChild(container);
  }).catch(e => {
    toast("PDF generation failed", "error");
    document.body.removeChild(container);
  });
}

function downloadReport() {
  if (!_reportResult) return;
  const lines = [
    "WORDSURE PLAGIARISM REPORT",
    "=".repeat(50),
    `Generated: ${new Date().toLocaleString()}`,
    `Overall Score: ${_reportResult.overall_score}%`,
    `Summary: ${_reportResult.summary}`,
    "",
    `High Risk Sentences: ${_reportResult.high_risk}`,
    `Medium Risk Sentences: ${_reportResult.medium_risk}`,
    `Original Sentences: ${_reportResult.low_risk}`,
    "", "=".repeat(50),
    "DETAILED ANALYSIS", "=".repeat(50), ""
  ];
  _reportResult.sentences.forEach((s, i) => {
    lines.push(`[${i+1}] ${s.level.toUpperCase()} RISK — ${s.score}% similarity`);
    lines.push(s.sentence);
    if (s.matched_with) lines.push(`  Matched: "${s.matched_with}"`);
    lines.push("");
  });
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `WordSure_Report_${Date.now()}.txt`;
  a.click(); URL.revokeObjectURL(url);
  toast("Report downloaded!", "success");
}

// ---- PROFILE ----
async function loadProfile() {
  try {
    const [pr, sr] = await Promise.all([authFetch(`${API}/api/profile`), authFetch(`${API}/api/stats`)]);
    const p = await pr.json();
    const s = await sr.json();
    document.getElementById("profAvatar").textContent = p.avatar || "U";
    document.getElementById("profName").textContent = p.name;
    document.getElementById("profEmail").textContent = p.email;
    document.getElementById("pName").value = p.name;
    document.getElementById("pEmail").value = p.email;
    document.getElementById("profStats").innerHTML = `
      <div class="stat-card"><div class="stat-label">TOTAL CHECKS</div><div class="stat-value" style="font-size:24px">${s.total_checks}</div></div>
      <div class="stat-card"><div class="stat-label">AVG SCORE</div><div class="stat-value" style="font-size:24px;color:var(--medium)">${s.avg_score}%</div></div>`;
    document.getElementById("avatarNav").textContent = p.avatar || "U";
    document.getElementById("nameNav").textContent = p.name || "My Profile";
  } catch { }
}

async function saveProfile() {
  const name = document.getElementById("pName")?.value.trim();
  const email = document.getElementById("pEmail")?.value.trim();
  if (!name) { toast("Name cannot be empty", "error"); return; }
  try {
    const r = await authFetch(`${API}/api/profile`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email })
    });
    const d = await r.json();
    document.getElementById("profAvatar").textContent = d.avatar;
    document.getElementById("profName").textContent = name;
    document.getElementById("avatarNav").textContent = d.avatar;
    document.getElementById("nameNav").textContent = name;
    toast("Profile saved!", "success");
  } catch { toast("Save failed", "error"); }
}

// ---- AUTH ----
async function doLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPass").value.trim();
  if(!email || !password) { toast("Please enter email and password", "error"); return; }
  
  const btn = document.getElementById("loginBtn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner dark"></span> Signing In...`;
  
  try {
    const r = await fetch(`${API}/api/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if(!r.ok) {
      const e = await r.json();
      throw new Error(e.detail || "Login failed");
    }
    const data = await r.json();
    setToken(data.token);
    toast("Welcome back!", "success");
    nav("home");
    // Initial profile load
    document.getElementById("avatarNav").textContent = data.user.avatar || "U";
    document.getElementById("nameNav").textContent = data.user.name || "My Profile";
  } catch(e) {
    toast(e.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = "Sign In";
  }
}

async function doSignup() {
  const name = document.getElementById("suName").value.trim();
  const email = document.getElementById("suEmail").value.trim();
  const password = document.getElementById("suPass").value.trim();
  if(!name || !email || !password) { toast("Please fill all fields", "error"); return; }
  
  const btn = document.getElementById("signupBtn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner dark"></span> Creating...`;
  
  try {
    const r = await fetch(`${API}/api/signup`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    if(!r.ok) {
      const e = await r.json();
      throw new Error(e.detail || "Signup failed");
    }
    const data = await r.json();
    setToken(data.token);
    toast("Account created!", "success");
    nav("home");
    document.getElementById("avatarNav").textContent = data.user.avatar || "U";
    document.getElementById("nameNav").textContent = data.user.name || "My Profile";
  } catch(e) {
    toast(e.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = "Create Account";
  }
}

async function doResetPassword() {
  const email = document.getElementById("resetEmail").value.trim();
  const password = document.getElementById("resetPass").value.trim();
  if(!email || !password) { toast("Please fill all fields", "error"); return; }
  
  const btn = document.getElementById("resetBtn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner dark"></span> Resetting...`;
  
  try {
    const r = await fetch(`${API}/api/reset-password`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, new_password: password })
    });
    if(!r.ok) {
      const e = await r.json();
      throw new Error(e.detail || "Failed to reset password");
    }
    toast("Password updated! Please sign in.", "success");
    nav("login");
  } catch(e) {
    toast(e.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = "Update Password";
  }
}

function doLogout() {
  removeToken();
  toast("Logged out successfully", "success");
  nav("login");
}

// ---- UTILS ----
function esc(str) {
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// ---- INIT ----
nav("home");
