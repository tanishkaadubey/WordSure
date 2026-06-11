const PAGES = {

home: () => `<div class="page">
  <div style="max-width:900px;margin:0 auto">
    <div style="text-align:center;padding:48px 0 40px">
      <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 16px;border-radius:20px;background:rgba(0,229,255,0.1);border:1px solid rgba(0,229,255,0.2);font-size:12px;color:var(--accent);font-family:var(--font-m);margin-bottom:20px">
        Powered by Mistral AI + Sentence Transformers
      </div>
      <h1 style="font-family:var(--font-d);font-size:52px;font-weight:800;line-height:1.15;margin-bottom:16px">
        Detect Plagiarism<br><span style="color:var(--accent)">Instantly.</span>
      </h1>
      <p style="font-size:16px;color:var(--text2);max-width:480px;margin:0 auto 32px;line-height:1.7">
        WordSure uses AI and NLP to analyze your text, detect similarities, and rewrite flagged content — all locally, all free.
      </p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-primary" style="font-size:15px;padding:12px 28px" onclick="nav('checker')">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          Start Checking
        </button>
        <button class="btn btn-secondary" style="font-size:15px;padding:12px 28px" onclick="nav('about')">
          How it works
        </button>
      </div>
    </div>

    <div class="grid-3" style="margin-bottom:32px">
      <div class="card" style="text-align:center;padding:28px 20px">
        <div style="width:48px;height:48px;border-radius:12px;background:rgba(0,229,255,0.1);display:flex;align-items:center;justify-content:center;margin:0 auto 14px">
          <svg width="24" height="24" fill="none" stroke="var(--accent)" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </div>
        <div class="card-title">Smart Detection</div>
        <div class="card-sub" style="margin-top:6px">Sentence-level NLP analysis with similarity scoring</div>
      </div>
      <div class="card" style="text-align:center;padding:28px 20px">
        <div style="width:48px;height:48px;border-radius:12px;background:rgba(124,58,237,0.1);display:flex;align-items:center;justify-content:center;margin:0 auto 14px">
          <svg width="24" height="24" fill="none" stroke="#a78bfa" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        </div>
        <div class="card-title">AI Rewriting</div>
        <div class="card-sub" style="margin-top:6px">Mistral AI rewrites flagged sentences instantly</div>
      </div>
      <div class="card" style="text-align:center;padding:28px 20px">
        <div style="width:48px;height:48px;border-radius:12px;background:rgba(16,185,129,0.1);display:flex;align-items:center;justify-content:center;margin:0 auto 14px">
          <svg width="24" height="24" fill="none" stroke="var(--low)" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div class="card-title">AI Chatbot</div>
        <div class="card-sub" style="margin-top:6px">Ask anything about writing and academic integrity</div>
      </div>
    </div>

    <div class="card" style="display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap">
      <div>
        <div style="font-family:var(--font-d);font-size:16px;font-weight:700;margin-bottom:4px">Ready to check your text?</div>
        <div style="font-size:13px;color:var(--text2)">Paste text or upload a file — results in seconds.</div>
      </div>
      <button class="btn btn-primary" onclick="nav('checker')">Open Checker →</button>
    </div>
  </div>
</div>`,

dashboard: () => `<div class="page" id="dashPage">
  <div class="grid-4" style="margin-bottom:20px" id="dashStats">
    <div class="stat-card"><div class="stat-label">TOTAL CHECKS</div><div class="stat-value" id="dTotal">—</div></div>
    <div class="stat-card"><div class="stat-label">AVG PLAGIARISM</div><div class="stat-value" id="dAvg" style="color:var(--medium)">—</div></div>
    <div class="stat-card"><div class="stat-label">HIGH RISK AVG</div><div class="stat-value" id="dHigh" style="color:var(--high)">—</div></div>
    <div class="stat-card"><div class="stat-label">ORIGINAL AVG</div><div class="stat-value" id="dLow" style="color:var(--low)">—</div></div>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-title" style="margin-bottom:16px">Recent Activity</div>
      <div id="dashRecent"><div style="color:var(--text3);font-size:13px">Loading...</div></div>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:16px">Quick Actions</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <button class="btn btn-secondary" style="justify-content:flex-start;gap:12px" onclick="nav('checker')">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          New Plagiarism Check
        </button>
        <button class="btn btn-secondary" style="justify-content:flex-start;gap:12px" onclick="nav('correction')">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          AI Correction Tool
        </button>
        <button class="btn btn-secondary" style="justify-content:flex-start;gap:12px" onclick="nav('chatbot')">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Open AI Chatbot
        </button>
        <button class="btn btn-secondary" style="justify-content:flex-start;gap:12px" onclick="nav('history')">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          View Full History
        </button>
      </div>
    </div>
  </div>
</div>`,

checker: () => `<div class="page">
  <div class="grid-2" style="align-items:start">
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div class="card-title">Input Text</div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-secondary" style="padding:6px 12px;font-size:12px" onclick="loadSample()">Sample</button>
            <button class="btn btn-secondary" style="padding:6px 12px;font-size:12px" onclick="clearChecker()">Clear</button>
          </div>
        </div>
        <textarea class="form-textarea" id="checkerText" style="min-height:200px" placeholder="Paste your text here to check for plagiarism..."></textarea>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px">
          <span style="font-size:12px;color:var(--text3);font-family:var(--font-m)" id="checkerWC">0 words</span>
          <button class="btn btn-primary" id="checkBtn" onclick="runCheck()">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Analyze Text
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-title" style="margin-bottom:12px">Upload File</div>
        <div class="upload-zone" id="uploadZone" onclick="document.getElementById('fileInput').click()" ondragover="event.preventDefault();this.classList.add('drag')" ondragleave="this.classList.remove('drag')" ondrop="handleDrop(event)">
          <div class="upload-icon">
            <svg width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </div>
          <div style="font-size:14px;font-weight:500;margin-bottom:4px">Drop file here or click to upload</div>
          <div style="font-size:12px;color:var(--text3)">Supports .txt, .pdf files</div>
        </div>
        <input type="file" id="fileInput" accept=".txt,.pdf" style="display:none" onchange="handleFile(this)"/>
      </div>
    </div>

    <div>
      <div id="checkerEmpty" class="card" style="text-align:center;padding:60px 20px">
        <svg width="52" height="52" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24" style="margin:0 auto 14px;opacity:0.25"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <div style="color:var(--text3);font-size:14px">Results will appear here</div>
      </div>
      <div id="checkerResults" style="display:none">
        <div class="card" style="margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:20px">
            <div class="ring-wrap">
              <svg width="90" height="90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg3)" stroke-width="9"/>
                <circle cx="50" cy="50" r="42" fill="none" stroke-width="9" stroke-linecap="round"
                  id="ringCircle" stroke-dasharray="263.9" stroke-dashoffset="263.9"
                  style="transition:stroke-dashoffset 1s cubic-bezier(.4,0,.2,1),stroke .5s"/>
              </svg>
              <div class="ring-center">
                <span class="ring-num" id="ringNum" style="font-size:20px">0%</span>
                <span class="ring-lbl">plagiarism</span>
              </div>
            </div>
            <div style="flex:1">
              <div style="display:flex;flex-direction:column;gap:8px">
                <div style="display:flex;align-items:center;justify-content:space-between">
                  <span style="font-size:13px;color:var(--text2)">High risk</span>
                  <span id="rHigh" class="badge badge-high">0</span>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between">
                  <span style="font-size:13px;color:var(--text2)">Medium risk</span>
                  <span id="rMed" class="badge badge-medium">0</span>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between">
                  <span style="font-size:13px;color:var(--text2)">Original</span>
                  <span id="rLow" class="badge badge-low">0</span>
                </div>
              </div>
              <div id="rSummary" style="margin-top:10px;font-size:12px;color:var(--text2);font-style:italic;line-height:1.5"></div>
            </div>
          </div>
          <div id="progressWrap" style="margin-top:16px">
            <div style="display:flex;justify-content:space-between;font-size:11px;font-family:var(--font-m);color:var(--text3);margin-bottom:6px">
              <span>Plagiarism Level</span><span id="progPct">0%</span>
            </div>
            <div class="progress-wrap">
              <div class="progress-bar" id="progressBar" style="width:0%"></div>
            </div>
          </div>
        </div>

        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <span style="font-size:13px;font-weight:600">Sentence Analysis</span>
            <div style="display:flex;gap:8px">
              <button class="btn btn-purple" style="padding:6px 12px;font-size:12px" onclick="nav('correction',window._lastResult)">
                Fix with AI
              </button>
              <button class="btn btn-secondary" style="padding:6px 12px;font-size:12px" onclick="copyReport()">
                Copy Report
              </button>
            </div>
          </div>
          <div id="sentenceList" style="max-height:340px;overflow-y:auto"></div>
        </div>
      </div>
    </div>
  </div>
</div>`,

correction: (data) => `<div class="page">
  <div class="grid-2" style="align-items:start">
    <div class="card">
      <div class="card-title" style="margin-bottom:4px">Sentences to Fix</div>
      <div class="card-sub" style="margin-bottom:14px">Paste flagged sentences or come from checker</div>
      <textarea class="form-textarea" id="corrText" style="min-height:220px" placeholder="Paste one sentence per line that needs rewriting..."></textarea>
      <div style="display:flex;gap:10px;margin-top:12px">
        <button class="btn btn-primary" style="flex:1;justify-content:center" id="corrBtn" onclick="runCorrection()">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          Rewrite with AI
        </button>
        <button class="btn btn-purple" style="flex:1;justify-content:center" id="humanizeBtn" onclick="runHumanize()">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Humanize Text
        </button>
      </div>
    </div>
    <div>
      <div id="corrEmpty" class="card" style="text-align:center;padding:60px 20px">
        <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24" style="margin:0 auto 14px;opacity:0.25"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        <div style="color:var(--text3);font-size:14px">AI corrections will appear here</div>
      </div>
      <div id="corrResults" style="display:none;display:flex;flex-direction:column;gap:12px"></div>
    </div>
  </div>
</div>`,

chatbot: () => `<div class="page" style="height:calc(100vh - var(--header) - 48px)">
  <div class="chat-wrap">
    <div class="chat-msgs" id="chatMsgs">
      <div class="msg ai">
        <div class="bubble">
          <strong>Hi! I'm WordSure AI</strong> powered by Mistral.<br><br>
          I can help you with:<br>
          • Understanding plagiarism rules<br>
          • Paraphrasing tips<br>
          • Academic writing advice<br>
          • Citation guidance<br><br>
          What would you like to know?
        </div>
      </div>
    </div>
    <div class="chat-input-row">
      <input class="chat-input form-input" id="chatIn" placeholder="Ask anything about writing or plagiarism..." onkeydown="if(event.key==='Enter')sendChat()"/>
      <button class="btn btn-primary" style="padding:11px 18px;flex-shrink:0" onclick="sendChat()">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
    </div>
  </div>
</div>`,

history: () => `<div class="page">
  <div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <div>
        <div class="card-title">Check History</div>
        <div class="card-sub">All your previous plagiarism checks</div>
      </div>
      <button class="btn btn-secondary" style="font-size:12px;padding:7px 14px" onclick="loadHistory()">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.01"/></svg>
        Refresh
      </button>
    </div>
    <div id="historyTable"><div style="color:var(--text3);font-size:13px;text-align:center;padding:40px">Loading history...</div></div>
  </div>
</div>`,

reports: () => `<div class="page">
  <div class="card" style="margin-bottom:16px">
    <div class="card-title" style="margin-bottom:4px">Generate Report</div>
    <div class="card-sub" style="margin-bottom:16px">Download a full plagiarism report for your text</div>
    <textarea class="form-textarea" id="reportText" style="min-height:160px" placeholder="Paste text to generate a downloadable report..."></textarea>
    <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap">
      <button class="btn btn-primary" id="reportBtn" onclick="generateReport()">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Analyze & Preview
      </button>
      <button class="btn btn-secondary" id="dlBtn" style="display:none" onclick="downloadReport()">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Download TXT
      </button>
      <button class="btn btn-purple" id="pdfBtn" style="display:none" onclick="exportPDF()">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Export PDF
      </button>
    </div>
  </div>
  <div id="reportPreview"></div>
</div>`,

about: () => `<div class="page">
  <div style="max-width:760px;margin:0 auto">
    <div class="card" style="margin-bottom:20px;text-align:center;padding:36px">
      <div class="logo-icon" style="width:56px;height:56px;border-radius:14px;font-size:28px;margin:0 auto 16px"></div>
      <h2 style="font-family:var(--font-d);font-size:28px;font-weight:800;margin-bottom:8px">About WordSure</h2>
      <p style="color:var(--text2);font-size:14px;line-height:1.7;max-width:500px;margin:0 auto">
        WordSure is a free, local AI-powered plagiarism detector built with FastAPI, Sentence Transformers, and Mistral AI via Ollama.
      </p>
    </div>

    <div class="card" style="margin-bottom:20px">
      <div class="card-title" style="margin-bottom:20px">How It Works</div>
      <div class="timeline">
        <div class="t-item"><div class="t-dot"></div><div class="t-title">Text Input</div><div class="t-body">You paste text or upload a file. WordSure splits it into individual sentences for analysis.</div></div>
        <div class="t-item"><div class="t-dot" style="background:var(--accent2);box-shadow:0 0 12px var(--accent2)"></div><div class="t-title">NLP Analysis</div><div class="t-body">Sentence Transformers (all-MiniLM-L6-v2) converts each sentence into a vector embedding and compares it against a reference database using cosine similarity.</div></div>
        <div class="t-item"><div class="t-dot" style="background:var(--medium);box-shadow:0 0 12px var(--medium)"></div><div class="t-title">Similarity Scoring</div><div class="t-body">Each sentence gets a similarity score. Above 75% = high risk (red), 45-75% = medium (yellow), below 45% = original (green).</div></div>
        <div class="t-item"><div class="t-dot" style="background:var(--low);box-shadow:0 0 12px var(--low)"></div><div class="t-title">AI Correction</div><div class="t-body">Flagged sentences are sent to Mistral AI (running locally via Ollama) which rewrites them to be completely original.</div></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title" style="margin-bottom:12px">Tech Stack</div>
        ${[['FastAPI','Python backend framework'],['Sentence Transformers','NLP similarity engine'],['Mistral via Ollama','Local LLM for rewriting'],['SQLite','History & data storage'],['Vanilla JS','Lightweight frontend']].map(([t,d])=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px"><span style="font-family:var(--font-m);color:var(--accent)">${t}</span><span style="color:var(--text2)">${d}</span></div>`).join('')}
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:12px">Features</div>
        ${['Sentence-level plagiarism detection','AI-powered text rewriting','Built-in chatbot assistant','File upload (.txt, .pdf)','Check history & reports','100% local — no data sent online','Free forever — no API keys'].map(f=>`<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px"><svg width="14" height="14" fill="none" stroke="var(--low)" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>${f}</div>`).join('')}
      </div>
    </div>
  </div>
</div>`,

profile: () => `<div class="page">
  <div style="max-width:600px;margin:0 auto">
    <div class="card" style="margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
        <div id="profAvatar" style="width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-family:var(--font-d);font-size:24px;font-weight:800;color:#fff;flex-shrink:0">TD</div>
        <div><div id="profName" style="font-family:var(--font-d);font-size:20px;font-weight:700">Loading...</div><div id="profEmail" style="font-size:13px;color:var(--text2);margin-top:2px"></div></div>
      </div>
      <div class="form-group"><label class="form-label">FULL NAME</label><input class="form-input" id="pName" placeholder="Your name"/></div>
      <div class="form-group"><label class="form-label">EMAIL</label><input class="form-input" id="pEmail" type="email" placeholder="your@email.com"/></div>
      <button class="btn btn-primary" onclick="saveProfile()">Save Changes</button>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:14px">Your Stats</div>
      <div id="profStats" class="grid-2"><div style="color:var(--text3);font-size:13px">Loading...</div></div>
    </div>
  </div>
</div>`,

login: () => `<div class="page" style="display:flex;align-items:center;justify-content:center;min-height:70vh">
  <div style="width:100%;max-width:400px">
    <div style="text-align:center;margin-bottom:28px">
      <div class="logo-icon" style="width:48px;height:48px;border-radius:12px;font-size:24px;margin:0 auto 12px"></div>
      <h2 style="font-family:var(--font-d);font-size:24px;font-weight:800">Welcome back</h2>
      <p style="color:var(--text2);font-size:13px;margin-top:4px">Sign in to WordSure</p>
    </div>
    <div class="card">
      <div class="form-group"><label class="form-label">EMAIL</label><input class="form-input" id="loginEmail" type="email" placeholder="you@example.com"/></div>
      <div class="form-group"><label class="form-label">PASSWORD</label><input class="form-input" id="loginPass" type="password" placeholder="••••••••"/></div>
      <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:4px" onclick="doLogin()">Sign In</button>
      <div style="text-align:center;margin-top:14px;font-size:13px;color:var(--text2)">
        Don't have an account? <a onclick="nav('signup')" style="color:var(--accent);cursor:pointer">Sign up</a>
      </div>
    </div>
  </div>
</div>`,

signup: () => `<div class="page" style="display:flex;align-items:center;justify-content:center;min-height:70vh">
  <div style="width:100%;max-width:400px">
    <div style="text-align:center;margin-bottom:28px">
      <div class="logo-icon" style="width:48px;height:48px;border-radius:12px;font-size:24px;margin:0 auto 12px"></div>
      <h2 style="font-family:var(--font-d);font-size:24px;font-weight:800">Create account</h2>
      <p style="color:var(--text2);font-size:13px;margin-top:4px">Join WordSure for free</p>
    </div>
    <div class="card">
      <div class="form-group"><label class="form-label">FULL NAME</label><input class="form-input" id="suName" placeholder="Tanishka Dubey"/></div>
      <div class="form-group"><label class="form-label">EMAIL</label><input class="form-input" id="suEmail" type="email" placeholder="you@example.com"/></div>
      <div class="form-group"><label class="form-label">PASSWORD</label><input class="form-input" id="suPass" type="password" placeholder="••••••••"/></div>
      <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:4px" onclick="toast('Account created! Welcome to WordSure.','success');nav('home')">Create Account</button>
      <div style="text-align:center;margin-top:14px;font-size:13px;color:var(--text2)">
        Already have an account? <a onclick="nav('login')" style="color:var(--accent);cursor:pointer">Sign in</a>
      </div>
    </div>
  </div>
</div>`

};

const PAGE_TITLES = {
  home:'Home', dashboard:'Dashboard', checker:'Plagiarism Checker',
  correction:'AI Correction', chatbot:'AI Chatbot', history:'History',
  reports:'Reports', about:'About WordSure', profile:'My Profile',
  login:'Sign In', signup:'Sign Up'
};
