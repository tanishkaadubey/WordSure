from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import re
import numpy as np
import os
import requests
from dotenv import load_dotenv

load_dotenv()

model = SentenceTransformer("all-MiniLM-L6-v2")

REFERENCE_TEXTS = [
    "Plagiarism is the act of using someone else's work or ideas without giving proper credit.",
    "Machine learning is a subset of artificial intelligence that enables systems to learn from data.",
    "Climate change refers to long-term shifts in global temperatures and weather patterns.",
    "The internet has revolutionized how people communicate and share information worldwide.",
    "Artificial intelligence is the simulation of human intelligence processes by computer systems.",
    "Natural language processing is a field of AI that helps computers understand human language.",
    "Deep learning uses neural networks with many layers to analyze various forms of data.",
    "Python is a high-level programming language known for its simplicity and readability.",
    "Academic integrity means being honest and ethical in all academic work and research.",
    "The water cycle describes how water evaporates, condenses, and falls as precipitation.",
    "Democracy is a system of government where citizens exercise power by voting.",
    "Photosynthesis is the process by which plants use sunlight to produce energy from carbon dioxide.",
    "The Renaissance was a period of cultural and intellectual flowering in Europe.",
    "Blockchain is a decentralized digital ledger that records transactions securely.",
    "Globalization refers to the increasing interconnection of economies, cultures, and populations.",
    "The human brain contains approximately 86 billion neurons connected by trillions of synapses.",
    "Software engineering is the systematic application of engineering approaches to software development.",
    "The theory of evolution explains how species change over time through natural selection.",
    "Cybersecurity involves protecting computer systems and networks from digital attacks.",
    "Data science combines statistics, programming, and domain expertise to extract insights from data.",
    "The French Revolution began in 1789 and transformed French society and government.",
    "Quantum computing uses quantum mechanics to perform calculations exponentially faster.",
    "Social media platforms have changed how people interact and consume information.",
    "Renewable energy sources include solar, wind, hydroelectric, and geothermal power.",
    "The human genome contains approximately 3 billion base pairs of DNA.",
]

def query_serper(query):
    api_key = os.getenv("SERPER_API_KEY")
    if not api_key:
        return None
    url = "https://google.serper.dev/search"
    payload = {"q": query, "num": 3}
    headers = {
        'X-API-KEY': api_key,
        'Content-Type': 'application/json'
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=5)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Serper error: {e}")
        return None

def query_tavily(query):
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        return None
    url = "https://api.tavily.com/search"
    payload = {
        "api_key": api_key,
        "query": query,
        "search_depth": "basic",
        "include_answer": False,
        "include_images": False,
        "include_raw_content": False,
        "max_results": 3
    }
    headers = {
        'Content-Type': 'application/json'
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=5)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Tavily error: {e}")
        return None

def split_sentences(text):
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s.strip() for s in sentences if len(s.strip()) > 15]

def check_plagiarism(text):
    sentences = split_sentences(text)
    if not sentences:
        return {"overall_score": 0, "sentences": [], "summary": "No meaningful sentences found.",
                "total_sentences": 0, "high_risk": 0, "medium_risk": 0, "low_risk": 0, "engine": "offline"}

    # Extract up to 3 longest sentences > 30 chars
    long_sentences = [s for s in sentences if len(s) > 30]
    query_sentences = sorted(long_sentences, key=len, reverse=True)[:3]

    online_references = []
    used_engine = "offline"

    for q_sent in query_sentences:
        # First preference: Serper
        serper_res = query_serper(q_sent)
        if serper_res and "organic" in serper_res:
            used_engine = "serper"
            for item in serper_res["organic"]:
                snippet = item.get("snippet", "")
                link = item.get("link", "")
                if snippet:
                    online_references.append({"text": snippet, "url": link})
            continue

        # Second preference: Tavily (if Serper fails or has no key)
        tavily_res = query_tavily(q_sent)
        if tavily_res and "results" in tavily_res:
            used_engine = "tavily"
            for item in tavily_res["results"]:
                content = item.get("content", "")
                url = item.get("url", "")
                if content:
                    online_references.append({"text": content, "url": url})
            continue

    if not online_references:
        reference_texts = REFERENCE_TEXTS
        reference_urls = [None] * len(REFERENCE_TEXTS)
        used_engine = "offline"
    else:
        reference_texts = [ref["text"] for ref in online_references]
        reference_urls = [ref["url"] for ref in online_references]

    sentence_embeddings = model.encode(sentences)
    reference_embeddings = model.encode(reference_texts)

    results = []
    total_score = 0

    for sentence, emb in zip(sentences, sentence_embeddings):
        sims = cosine_similarity([emb], reference_embeddings)[0]
        best_score = float(np.max(sims))
        best_match_idx = int(np.argmax(sims))
        similarity_percent = round(best_score * 100, 1)

        if similarity_percent >= 75:
            level = "high"
        elif similarity_percent >= 45:
            level = "medium"
        else:
            level = "low"

        matched_with = None
        if best_score > 0.45:
            if reference_urls[best_match_idx]:
                snippet_preview = reference_texts[best_match_idx][:50] + "..." if len(reference_texts[best_match_idx]) > 50 else reference_texts[best_match_idx]
                matched_with = f"{reference_urls[best_match_idx]} (Snippet: {snippet_preview})"
            else:
                matched_with = reference_texts[best_match_idx]

        results.append({
            "sentence": sentence,
            "score": similarity_percent,
            "level": level,
            "matched_with": matched_with
        })
        total_score += similarity_percent

    overall = round(total_score / len(sentences), 1) if sentences else 0
    high_count = sum(1 for r in results if r["level"] == "high")
    medium_count = sum(1 for r in results if r["level"] == "medium")

    if overall >= 70:
        summary = "High plagiarism detected. Significant rewriting recommended."
    elif overall >= 40:
        summary = "Moderate similarity found. Some sentences need paraphrasing."
    else:
        summary = "Content appears mostly original. Minor similarities detected."

    return {
        "overall_score": overall,
        "total_sentences": len(sentences),
        "high_risk": high_count,
        "medium_risk": medium_count,
        "low_risk": len(sentences) - high_count - medium_count,
        "sentences": results,
        "summary": summary,
        "engine": used_engine
    }
