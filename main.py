from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import List, Optional
import requests
import json
import os
import uuid
import datetime
import sqlite3
import jwt
import bcrypt
from dotenv import load_dotenv

load_dotenv()

from nlp_engine import check_plagiarism

app = FastAPI(title="WordSure API")

SECRET_KEY = "wordsure-super-secret-key-change-in-prod"
ALGORITHM = "HS256"
DB_NAME = "Database.db"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.1-8b-instant"

# --- DB Setup ---
def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS history (
        id TEXT PRIMARY KEY,
        user_id TEXT,
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
        email TEXT UNIQUE,
        password TEXT,
        avatar TEXT,
        created_at TEXT
    )""")
    conn.commit()
    conn.close()

init_db()

# --- Auth Utils ---
def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# --- Models ---
class SignupInput(BaseModel):
    name: str
    email: str
    password: str

class LoginInput(BaseModel):
    email: str
    password: str

class ResetPasswordInput(BaseModel):
    email: str
    new_password: str

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
    groq_ok = bool(GROQ_API_KEY)
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM history")
    total = c.fetchone()[0]
    conn.close()
    return {"status": "ok", "ollama": groq_ok, "provider": "groq", "total_checks": total}

@app.post("/api/signup")
async def signup(input: SignupInput):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE email=?", (input.email,))
    if c.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    
    uid = str(uuid.uuid4())
    hashed_pw = get_password_hash(input.password)
    initials = "".join([w[0].upper() for w in input.name.split()[:2]]) if input.name else "U"
    
    c.execute("INSERT INTO users VALUES (?,?,?,?,?,?)", (
        uid, input.name, input.email, hashed_pw, initials, datetime.datetime.now().isoformat()
    ))
    conn.commit()
    conn.close()
    
    token = jwt.encode({"sub": uid}, SECRET_KEY, algorithm=ALGORITHM)
    return {"token": token, "user": {"id": uid, "name": input.name, "email": input.email, "avatar": initials}}

@app.post("/api/login")
async def login(input: LoginInput):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT id, name, email, password, avatar FROM users WHERE email=?", (input.email,))
    user = c.fetchone()
    conn.close()
    
    if not user or not verify_password(input.password, user[3]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    token = jwt.encode({"sub": user[0]}, SECRET_KEY, algorithm=ALGORITHM)
    return {"token": token, "user": {"id": user[0], "name": user[1], "email": user[2], "avatar": user[4]}}

@app.post("/api/reset-password")
async def reset_password(input: ResetPasswordInput):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT id FROM users WHERE email=?", (input.email,))
    user = c.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=400, detail="User not found")
        
    hashed_pw = get_password_hash(input.new_password)
    c.execute("UPDATE users SET password=? WHERE email=?", (hashed_pw, input.email))
    conn.commit()
    conn.close()
    return {"success": True}

@app.post("/api/check")
async def check(input: TextInput, user_id: str = Depends(get_current_user)):
    if not input.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    result = check_plagiarism(input.text)
    # Save to history
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    hid = str(uuid.uuid4())[:8]
    title = input.title or input.text[:40] + "..."
    c.execute("INSERT INTO history VALUES (?,?,?,?,?,?,?,?,?,?)", (
        hid, user_id, title, input.text[:500],
        result["overall_score"], result["high_risk"],
        result["medium_risk"], result["low_risk"],
        result["summary"], datetime.datetime.now().isoformat()
    ))
    conn.commit()
    conn.close()
    result["id"] = hid
    return result

@app.post("/api/check-file")
async def check_file(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
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
async def correct(input: CorrectInput, user_id: str = Depends(get_current_user)):
    corrected = []
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    for sentence in input.sentences:
        prompt = f"""Rewrite this sentence to be completely original while keeping the same meaning. Return ONLY the rewritten sentence, no explanation.

Sentence: {sentence}

Rewritten:"""
        try:
            payload = {
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2,
                "stream": False
            }
            response = requests.post(GROQ_URL, headers=headers, json=payload, timeout=30)
            if response.status_code == 200:
                result = response.json()["choices"][0]["message"]["content"].strip()
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
async def humanize(input: HumanizeInput, user_id: str = Depends(get_current_user)):
    humanized = []
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
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
            payload = {
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.95,
                "top_p": 0.95,
                "stream": False
            }
            response = requests.post(GROQ_URL, headers=headers, json=payload, timeout=30)
            if response.status_code == 200:
                result = response.json()["choices"][0]["message"]["content"].strip()
                
                # Phase 3: Programmatic cleanup
                result = apply_human_formatting_rules(result)
                
                humanized.append({"original": sentence, "humanized": result})
            else:
                humanized.append({"original": sentence, "humanized": sentence})
        except Exception as e:
            humanized.append({"original": sentence, "humanized": sentence, "error": str(e)})
    return {"humanized": humanized}

@app.post("/api/chat")
async def chat(input: ChatInput, user_id: str = Depends(get_current_user)):
    messages = [{"role": m.role, "content": m.content} for m in input.messages]
    system_msg = {
        "role": "system",
        "content": "You are WordSure AI, an expert writing assistant specializing in plagiarism detection, academic integrity, paraphrasing, and creative writing. Be helpful, concise, and friendly. Use bullet points when listing things."
    }
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    try:
        payload = {
            "model": GROQ_MODEL,
            "messages": [system_msg] + messages,
            "temperature": 0.7,
            "stream": False
        }
        response = requests.post(GROQ_URL, headers=headers, json=payload, timeout=30)
        if response.status_code == 200:
            reply = response.json()["choices"][0]["message"]["content"]
            return {"reply": reply}
        else:
            raise HTTPException(status_code=500, detail="Groq API error")
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="Groq API is not reachable")

@app.get("/api/history")
async def get_history(user_id: str = Depends(get_current_user)):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT * FROM history WHERE user_id=? ORDER BY created_at DESC LIMIT 50", (user_id,))
    rows = c.fetchall()
    conn.close()
    return {"history": [
        {"id": r[0], "title": r[2], "score": r[4], "high_risk": r[5],
         "medium_risk": r[6], "low_risk": r[7], "summary": r[8], "created_at": r[9]}
        for r in rows
    ]}

@app.delete("/api/history/{hid}")
async def delete_history(hid: str, user_id: str = Depends(get_current_user)):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("DELETE FROM history WHERE id=? AND user_id=?", (hid, user_id))
    conn.commit()
    conn.close()
    return {"deleted": True}

@app.get("/api/stats")
async def get_stats(user_id: str = Depends(get_current_user)):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT COUNT(*), AVG(score), AVG(high_risk), AVG(medium_risk), AVG(low_risk) FROM history WHERE user_id=?", (user_id,))
    row = c.fetchone()
    c.execute("SELECT score, created_at FROM history WHERE user_id=? ORDER BY created_at DESC LIMIT 7", (user_id,))
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
async def get_profile(user_id: str = Depends(get_current_user)):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE id=?", (user_id,))
    row = c.fetchone()
    conn.close()
    if row:
        return {"id": row[0], "name": row[1], "email": row[2], "avatar": row[4], "created_at": row[5]}
    raise HTTPException(status_code=404, detail="User not found")

@app.put("/api/profile")
async def update_profile(data: ProfileUpdate, user_id: str = Depends(get_current_user)):
    initials = "".join([w[0].upper() for w in data.name.split()[:2]]) if data.name else "U"
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("UPDATE users SET name=?, email=?, avatar=? WHERE id=?",
              (data.name, data.email, initials, user_id))
    conn.commit()
    conn.close()
    return {"success": True, "avatar": initials}

app.mount("/", StaticFiles(directory="static", html=True), name="static")
