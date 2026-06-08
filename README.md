# WordSure — AI Plagiarism Detector & Corrector

> A free, local, AI-powered plagiarism detection and correction tool built with FastAPI, Sentence Transformers, and Mistral AI via Ollama.

---

## What is WordSure?

WordSure is a full-stack web application that helps you detect plagiarism in your text, rewrite flagged sentences using AI, and get writing advice through a built-in chatbot — all running locally on your machine with zero cost.

---

## Features

- **Plagiarism Detection** — Sentence-level NLP analysis with similarity scoring (0–100%)
- **Color Coding** — Red (high risk), Yellow (medium risk), Green (original)
- **AI Correction** — Mistral AI rewrites flagged sentences to be original
- **Side-by-Side View** — Original vs AI-rewritten text comparison
- **AI Chatbot** — Ask anything about plagiarism and academic writing
- **File Upload** — Supports `.txt` and `.pdf` files
- **Check History** — All past checks saved with scores and dates
- **Reports** — Generate and download full plagiarism reports
- **Dashboard** — Stats overview of all your checks
- **User Profile** — Save your name and view your usage stats
- **Dark / Light Mode** — Toggle from the top bar
- **Progress Bar** — Visual plagiarism level indicator
- **Copy Button** — Copy corrected text in one click
- **100% Local** — No data sent to any server, everything runs on your machine
- **Completely Free** — No API keys, no subscriptions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python) |
| NLP Engine | Sentence Transformers (all-MiniLM-L6-v2) |
| Similarity | Scikit-learn (Cosine Similarity) |
| LLM / Chatbot | Mistral via Ollama (local) |
| Database | SQLite |
| Frontend | HTML + CSS + Vanilla JavaScript |
| Fonts | Syne, DM Mono, Inter (Google Fonts) |

---

## Project Structure

```
WordSure/
├── main.py              ← FastAPI backend (all API routes)
├── nlp_engine.py        ← Plagiarism detection logic (NLP)
├── requirements.txt     ← Python dependencies
├── wordsure.db          ← SQLite database (auto-created on first run)
└── static/
    ├── index.html       ← Main SPA shell with sidebar
    ├── css/
    │   └── main.css     ← All styles (dark/light theme)
    └── js/
        ├── pages.js     ← All 10 page templates
        └── app.js       ← All frontend logic
```

---

## Pages

| Page | Description |
|---|---|
| Home | Landing page with feature overview |
| Dashboard | Stats, recent activity, quick actions |
| Plagiarism Checker | Main text analysis tool with file upload |
| AI Correction | Side-by-side AI rewriting of flagged sentences |
| AI Chatbot | Mistral-powered writing assistant |
| History | All past plagiarism checks with delete option |
| Reports | Generate and download detailed reports |
| About | How it works, tech stack, features |
| Profile | Edit name, email, view personal stats |
| Login / Signup | Auth screens (demo mode) |

---

## Prerequisites

Make sure these are installed before running:

1. **Python 3.10 or above** — [python.org/downloads](https://www.python.org/downloads/)
2. **Ollama** — [ollama.com/download](https://ollama.com/download)

---

## Installation & Setup

### Step 1 — Clone or Extract the Project

Extract `WordSure_v2.zip` to any folder, then open that folder in VS Code.

### Step 2 — Create Virtual Environment

Open the terminal in VS Code (`Ctrl + `` `) and run:

```bash
python -m venv venv
```

### Step 3 — Activate Virtual Environment

```bash
# Windows
venv\Scripts\activate

# Mac / Linux
source venv/bin/activate
```

You should see `(venv)` at the start of your terminal line.

### Step 4 — Install Dependencies

```bash
pip install -r requirements.txt
```

This will take 3–5 minutes the first time (downloads ~500MB of ML libraries).

### Step 5 — Setup Ollama (One Time Only)

Open a **separate** Command Prompt window and run:

```bash
ollama pull mistral
```

This downloads the Mistral AI model (~4GB). Only needed once.

### Step 6 — Start Ollama

Keep this Command Prompt open and running:

```bash
ollama serve
```

> If you see `bind: Only one usage of each socket address` — Ollama is already running in the background. That is fine, proceed to Step 7.

### Step 7 — Run the App

Back in VS Code terminal (with venv activated):

```bash
uvicorn main:app --reload --port 8000
```

### Step 8 — Open in Browser

```
http://localhost:8000
```

WordSure is now running!

---

## How It Works

```
User pastes text
       ↓
FastAPI receives text
       ↓
nlp_engine.py splits text into sentences
       ↓
Sentence Transformers converts each sentence to a vector
       ↓
Cosine similarity compared against reference database
       ↓
Score calculated per sentence (0–100%)
       ↓
High (≥75%) → Red    Medium (45–75%) → Yellow    Low (<45%) → Green
       ↓
User clicks "Fix with AI"
       ↓
Flagged sentences sent to Mistral via Ollama
       ↓
AI rewrites sentences to be original
       ↓
Side-by-side comparison shown
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check if server and Ollama are running |
| POST | `/api/check` | Analyze text for plagiarism |
| POST | `/api/check-file` | Analyze uploaded .txt or .pdf file |
| POST | `/api/correct` | AI rewrite of flagged sentences |
| POST | `/api/chat` | Send message to AI chatbot |
| GET | `/api/history` | Get all past checks |
| DELETE | `/api/history/{id}` | Delete a history entry |
| GET | `/api/stats` | Get usage statistics |
| GET | `/api/profile` | Get user profile |
| PUT | `/api/profile` | Update user profile |

---

## Common Errors & Fixes

| Error | Cause | Fix |
|---|---|---|
| `ollama is not recognized` | Ollama not installed or PC not restarted | Install Ollama, restart PC |
| `bind: Only one usage of each socket address` | Ollama already running | This is fine, ignore it |
| `Connection refused` on localhost:8000 | uvicorn not running | Run `uvicorn main:app --reload --port 8000` |
| `Module not found` | venv not activated | Run `venv\Scripts\activate` first |
| Slow first load | Sentence Transformers model loading | Wait 30–60 seconds, normal on first run |
| Chatbot not responding | Ollama offline | Make sure `ollama serve` is running in CMD |

---

## Deployment

### Local Development (Default)
Everything runs on `http://localhost:8000` — no setup needed beyond the steps above.

### Deploy Online (Free)

For online deployment, replace Ollama with Groq API (free tier):

1. Get free API key at [console.groq.com](https://console.groq.com)
2. In `main.py`, replace the Ollama `requests.post` calls with the Groq Python client
3. Deploy backend to [Render.com](https://render.com) (free tier — 750 hrs/month)
4. Deploy frontend to [Vercel.com](https://vercel.com) (free forever)

---

## Built With

- [FastAPI](https://fastapi.tiangolo.com/) — Modern Python web framework
- [Sentence Transformers](https://www.sbert.net/) — NLP sentence embeddings
- [Ollama](https://ollama.com/) — Run LLMs locally
- [Mistral](https://mistral.ai/) — Open source LLM for text rewriting
- [SQLite](https://www.sqlite.org/) — Lightweight local database

---

## License

Free to use for educational and personal projects.

---

## Author

**Tanishka Dubey**
WordSure — AI Plagiarism Detector
Built with FastAPI + Sentence Transformers + Mistral AI
