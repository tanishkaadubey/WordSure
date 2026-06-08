from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import re
import numpy as np

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

def split_sentences(text):
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s.strip() for s in sentences if len(s.strip()) > 15]

def check_plagiarism(text):
    sentences = split_sentences(text)
    if not sentences:
        return {"overall_score": 0, "sentences": [], "summary": "No meaningful sentences found.",
                "total_sentences": 0, "high_risk": 0, "medium_risk": 0, "low_risk": 0}

    sentence_embeddings = model.encode(sentences)
    reference_embeddings = model.encode(REFERENCE_TEXTS)

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

        results.append({
            "sentence": sentence,
            "score": similarity_percent,
            "level": level,
            "matched_with": REFERENCE_TEXTS[best_match_idx] if best_score > 0.45 else None
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
        "summary": summary
    }
