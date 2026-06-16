---
title: WordSure
emoji: 📝
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# WordSure — AI Plagiarism Detector & Corrector


> A free, AI-powered plagiarism detection and correction tool built with FastAPI, Sentence Transformers, and Groq Cloud AI.

---

## What is WordSure?

WordSure is a full-stack web application that helps you detect plagiarism in your text, rewrite flagged sentences using AI, and get writing advice through a built-in chatbot — combining high-performance local NLP similarity analysis with lightning-fast cloud AI rewriting.

---

## Features

- **Plagiarism Detection** — Sentence-level NLP analysis with similarity scoring (0–100%)
- **Color Coding** — Red (high risk), Yellow (medium risk), Green (original)
- **AI Correction** — Groq AI rewrites flagged sentences to be original
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
- **Hybrid Performance** — Fast local NLP combined with instant cloud-hosted AI completions
- **Completely Free** — Uses Groq's high-speed free tier

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python) |
| NLP Engine | Sentence Transformers (all-MiniLM-L6-v2) |
| Similarity | Scikit-learn (Cosine Similarity) |
| LLM / Chatbot | Groq Cloud API (Llama 3.1) |
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
| AI Chatbot | Groq Llama 3.1-powered writing assistant |
| History | All past plagiarism checks with delete option |
| Reports | Generate and download detailed reports |
| About | How it works, tech stack, features |
| Profile | Edit name, email, view personal stats |
| Login / Signup | Auth screens (demo mode) |

---

## Prerequisites

Make sure these are installed before running:

1. **Python 3.10 or above** — [python.org/downloads](https://www.python.org/downloads/)
2. **Groq API Key** — Sign up for a free key at [console.groq.com](https://console.groq.com/)
3. **Serper API Key** — Sign up for a free Google Search API key at [serper.dev](https://serper.dev/)

---

## Installation & Setup

### Step 1 — Clone or Extract the Project

Extract the project files to a folder and open that folder in VS Code.

### Step 2 — Create Virtual Environment

Open the terminal in VS Code (`Ctrl + ` `) and run:

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

This installs the backend web framework, machine learning NLP library, and environment config tools.

### Step 5 — Set Up Environment Variables

Create a file named `.env` in the root folder (same directory as `main.py`) and fill it with your API keys:

```ini
GROQ_API_KEY=your_groq_api_key_here
SERPER_API_KEY=your_serper_api_key_here
```

### Step 6 — Run the App

In the VS Code terminal (with the virtual environment activated):

```bash
python -m uvicorn main:app --reload --port 8000
```

### Step 7 — Open in Browser

```
http://127.0.0.1:8000
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
Flagged sentences sent to Groq Cloud API (Llama 3.1)
       ↓
AI rewrites sentences to be original
       ↓
Side-by-side comparison shown
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check if server and Groq API are ready |
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
| `Connection refused` on localhost:8000 | uvicorn not running | Run `python -m uvicorn main:app --reload --port 8000` |
| `Module not found` | venv not activated | Run `venv\Scripts\activate` first |
| Slow first load | Sentence Transformers model loading | Wait 30–60 seconds, normal on first run |
| API / LLM errors | Missing or invalid API keys | Make sure `GROQ_API_KEY` and `SERPER_API_KEY` are correct in the `.env` file |

---

## Deployment

WordSure is fully configured for easy cloud deployment:

1. **API Keys**: Make sure to configure `GROQ_API_KEY` and `SERPER_API_KEY` as environment variables on your cloud provider.
2. **Backend**: You can deploy the FastAPI application on [Render.com](https://render.com) or [Heroku](https://www.heroku.com/).
3. **Frontend**: The static assets can be deployed to [Vercel](https://vercel.com), [Netlify](https://www.netlify.com/), or served directly from the backend.

---

## Built With

- [FastAPI](https://fastapi.tiangolo.com/) — Modern Python web framework
- [Sentence Transformers](https://www.sbert.net/) — NLP sentence embeddings
- [Groq Cloud API](https://groq.com/) — Fast AI completions and rewriting
- [SQLite](https://www.sqlite.org/) — Lightweight local database

---

## License

Free to use for educational and personal projects.

---

## Author

**Tanishka Dubey**
WordSure — AI Plagiarism Detector
Built with FastAPI + Sentence Transformers + Groq AI
