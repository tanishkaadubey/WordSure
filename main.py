from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import requests
import json
import os
import uuid
import datetime
import sqlite3

from nlp_engine import check_plagiarism

app = FastAPI(title="WordSure API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_CHAT_URL = "http://localhost:11434/api/chat"
MODEL = "mistral"

# --- DB Setup ---
def init_db():
    conn = sqlite3.connect("wordsure.db")
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS history (
        id TEXT PRIMARY KEY,
        title TEXT,
        text TEXT,
        score REAL,
        high_risk INTEGER,
        medium_risk INTEGER,
        low_risk INTEGER,
        summary TEXT,
        created_at TEXT
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        avatar TEXT,
        created_at TEXT
    )""")
    # Insert demo user if not exists
    c.execute("INSERT OR IGNORE INTO users VALUES (?,?,?,?,?)",
        ("user1", "Tanishka Dubey", "tanishka@example.com", "TD", datetime.datetime.now().isoformat()))
    conn.commit()
    conn.close()

init_db()

# --- Models ---
class TextInput(BaseModel):
    text: str
    title: Optional[str] = "Untitled"

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatInput(BaseModel):
    messages: List[ChatMessage]

class CorrectInput(BaseModel):
    sentences: List[str]

class HumanizeInput(BaseModel):
    sentences: List[str]

class ProfileUpdate(BaseModel):
    name: str
    email: str

# --- Routes ---
@app.get("/")
async def root():
    return FileResponse("static/index.html")

@app.get("/api/health")
async def health():
    try:
        r = requests.get("http://localhost:11434/api/tags", timeout=3)
        ollama_ok = r.status_code == 200
    except:
        ollama_ok = False
    conn = sqlite3.connect("wordsure.db")
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM history")
    total = c.fetchone()[0]
    conn.close()
    return {"status": "ok", "ollama": ollama_ok, "total_checks": total}

@app.post("/api/check")
async def check(input: TextInput):
    if not input.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    result = check_plagiarism(input.text)
    # Save to history
    conn = sqlite3.connect("wordsure.db")
    c = conn.cursor()
    hid = str(uuid.uuid4())[:8]
    title = input.title or input.text[:40] + "..."
    c.execute("INSERT INTO history VALUES (?,?,?,?,?,?,?,?,?)", (
        hid, title, input.text[:500],
        result["overall_score"], result["high_risk"],
        result["medium_risk"], result["low_risk"],
        result["summary"], datetime.datetime.now().isoformat()
    ))
    conn.commit()
    conn.close()
    result["id"] = hid
    return result

@app.post("/api/check-file")
async def check_file(file: UploadFile = File(...)):
    content = await file.read()
    text = ""
    fname = file.filename.lower()
    if fname.endswith(".txt"):
        text = content.decode("utf-8", errors="ignore")
    elif fname.endswith(".pdf"):
        try:
            import io
            import re
            raw = content.decode("latin-1", errors="ignore")
            # Basic PDF text extraction
            text = re.sub(r'[^\x20-\x7E\n]', ' ', raw)
            text = re.sub(r'\s+', ' ', text).strip()
            if len(text) < 50:
                text = "Could not extract text from PDF. Please paste text directly."
        except:
            text = "Could not read PDF. Please paste text directly."
    else:
        text = content.decode("utf-8", errors="ignore")
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from file")
    result = check_plagiarism(text)
    return result

@app.post("/api/correct")
async def correct(input: CorrectInput):
    corrected = []
    for sentence in input.sentences:
        prompt = f"""Rewrite this sentence to be completely original while keeping the same meaning. Return ONLY the rewritten sentence, no explanation.

Sentence: {sentence}

Rewritten:"""
        try:
            response = requests.post(OLLAMA_URL, json={
                "model": MODEL, "prompt": prompt, "stream": False
            }, timeout=180)
            if response.status_code == 200:
                result = response.json().get("response", sentence).strip()
                corrected.append({"original": sentence, "corrected": result})
            else:
                corrected.append({"original": sentence, "corrected": sentence})
        except Exception as e:
            corrected.append({"original": sentence, "corrected": sentence, "error": str(e)})
    return {"corrections": corrected}

def apply_human_formatting_rules(text: str) -> str:
    # Rule-based tweaks to remove common AI fingerprints
    replacements = {
        "It is important to note that ": "",
        "Furthermore, ": "Also, ",
        "In conclusion, ": "To wrap up, ",
        "Additionally, ": "Plus, ",
        "delve into": "look into",
        "tapestry": "mix",
        "realm": "area",
        "pivotal": "key"
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
        text = text.replace(old.lower(), new.lower())
    return text

@app.post("/api/humanize")
async def humanize(input: HumanizeInput):
    humanized = []
    for sentence in input.sentences:
        # Phase 1 & 2: Advanced Prompting & Burstiness
        prompt = f"""You are an expert human copywriter. Rewrite this text to sound completely natural and human-like. 
Your goal is to bypass AI detectors.
Rules:
1. Increase burstiness: Mix very short sentences with longer ones.
2. Increase perplexity: Use natural, conversational vocabulary.
3. DO NOT use AI buzzwords like: delve, furthermore, tapestry, realm, pivotal.
4. Keep the original meaning intact.
5. Return ONLY the rewritten text, no explanation.

Text: {sentence}

Rewritten:"""
        try:
            # High temperature for more randomness
            response = requests.post(OLLAMA_URL, json={
                "model": MODEL, 
                "prompt": prompt, 
                "stream": False,
                "options": {
                    "temperature": 0.95,
                    "top_p": 0.95
                }
            }, timeout=180)
            if response.status_code == 200:
                result = response.json().get("response", sentence).strip()
                
                # Phase 3: Programmatic cleanup
                result = apply_human_formatting_rules(result)
                
                humanized.append({"original": sentence, "humanized": result})
            else:
                humanized.append({"original": sentence, "humanized": sentence})
        except Exception as e:
            humanized.append({"original": sentence, "humanized": sentence, "error": str(e)})
    return {"humanized": humanized}

@app.post("/api/chat")
async def chat(input: ChatInput):
    messages = [{"role": m.role, "content": m.content} for m in input.messages]
    system_msg = {
        "role": "system",
        "content": "You are WordSure AI, an expert writing assistant specializing in plagiarism detection, academic integrity, paraphrasing, and creative writing. Be helpful, concise, and friendly. Use bullet points when listing things."
    }
    try:
        response = requests.post(OLLAMA_CHAT_URL, json={
            "model": MODEL,
            "messages": [system_msg] + messages,
            "stream": False
        }, timeout=90)
        if response.status_code == 200:
            reply = response.json()["message"]["content"]
            return {"reply": reply}
        else:
            raise HTTPException(status_code=500, detail="Ollama error")
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="Ollama is not running")

@app.get("/api/history")
async def get_history():
    conn = sqlite3.connect("wordsure.db")
    c = conn.cursor()
    c.execute("SELECT * FROM history ORDER BY created_at DESC LIMIT 50")
    rows = c.fetchall()
    conn.close()
    return {"history": [
        {"id": r[0], "title": r[1], "score": r[3], "high_risk": r[4],
         "medium_risk": r[5], "low_risk": r[6], "summary": r[7], "created_at": r[8]}
        for r in rows
    ]}

@app.delete("/api/history/{hid}")
async def delete_history(hid: str):
    conn = sqlite3.connect("wordsure.db")
    c = conn.cursor()
    c.execute("DELETE FROM history WHERE id=?", (hid,))
    conn.commit()
    conn.close()
    return {"deleted": True}

@app.get("/api/stats")
async def get_stats():
    conn = sqlite3.connect("wordsure.db")
    c = conn.cursor()
    c.execute("SELECT COUNT(*), AVG(score), AVG(high_risk), AVG(medium_risk), AVG(low_risk) FROM history")
    row = c.fetchone()
    c.execute("SELECT score, created_at FROM history ORDER BY created_at DESC LIMIT 7")
    recent = c.fetchall()
    conn.close()
    return {
        "total_checks": row[0] or 0,
        "avg_score": round(row[1] or 0, 1),
        "avg_high": round(row[2] or 0, 1),
        "avg_medium": round(row[3] or 0, 1),
        "avg_low": round(row[4] or 0, 1),
        "recent": [{"score": r[0], "date": r[1][:10]} for r in recent]
    }

@app.get("/api/profile")
async def get_profile():
    conn = sqlite3.connect("wordsure.db")
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE id='user1'")
    row = c.fetchone()
    conn.close()
    if row:
        return {"id": row[0], "name": row[1], "email": row[2], "avatar": row[3], "created_at": row[4]}
    return {"id": "user1", "name": "User", "email": "", "avatar": "U"}

@app.put("/api/profile")
async def update_profile(data: ProfileUpdate):
    initials = "".join([w[0].upper() for w in data.name.split()[:2]])
    conn = sqlite3.connect("wordsure.db")
    c = conn.cursor()
    c.execute("UPDATE users SET name=?, email=?, avatar=? WHERE id='user1'",
              (data.name, data.email, initials))
    conn.commit()
    conn.close()
    return {"success": True, "avatar": initials}

app.mount("/", StaticFiles(directory="static", html=True), name="static")
