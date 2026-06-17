# How WordSure Works

Welcome to the architectural overview of **WordSure** — an AI-powered plagiarism detector and corrector. This document provides insights into how the application processes text, flags potential plagiarism, and utilizes cloud AI to rewrite sentences.

## 📽️ Project Presentation
For a visual overview of the project, features, and deployment details, please view our presentation:
👉 **[WordSure Project Presentation (Canva)](https://canva.link/oms019ncocw773s)**

---

## 🏗️ System Architecture

WordSure combines high-performance local NLP processing with lightning-fast cloud AI to deliver a seamless user experience.

### 1. The Frontend (Client)
- Built with **HTML5, CSS3, and Vanilla JavaScript**.
- A Single Page Application (SPA) approach using a dynamic sidebar navigation system.
- Communicates asynchronously with the backend via RESTful APIs.

### 2. The Backend (Server)
- Built on **FastAPI**, a modern, fast, web framework for building APIs with Python 3.10+.
- Handles file uploads (TXT, PDF), user authentication, database operations, and acts as a proxy for our NLP and AI models.
- **SQLite Database** (`Database.db`) handles storing user profiles, history of plagiarism checks, and general application state.

### 3. The NLP Engine (Plagiarism Detection)
- Powered by **Sentence Transformers** (`all-MiniLM-L6-v2`).
- **How it detects plagiarism:**
  1. The input text is split into distinct sentences.
  2. The model converts each sentence into a high-dimensional vector (embedding).
  3. We compute the **Cosine Similarity** between these sentence vectors and a reference database/knowledge base (or web search context via Serper API).
  4. A similarity score (0–100%) is assigned to each sentence.
  5. The backend flags the sentence color based on the risk thresholds:
     - 🔴 **High Risk (≥75%)**
     - 🟡 **Medium Risk (45–75%)**
     - 🟢 **Original (<45%)**

### 4. The Cloud AI Engine (Correction & Chat)
- Powered by **Groq Cloud API** running the **Llama 3.1** model.
- Once sentences are flagged for plagiarism, the user can choose to "Fix with AI".
- The backend sends the flagged sentences to the Groq API with strict prompt engineering, instructing it to rewrite the text to be completely original while retaining the core meaning and tone.
- The same Groq Cloud API handles the intelligent **AI Chatbot**, answering users' questions regarding writing, citations, and plagiarism.

---

## 🔄 The Data Flow

```mermaid
graph TD
    A[User Inputs Text/File] --> B[FastAPI Backend]
    B --> C[Sentence Splitter]
    C --> D[Sentence Transformers]
    D --> E{Cosine Similarity Check}
    
    E -->|Similarity >= 75%| F[Flagged Red]
    E -->|Similarity 45-74%| G[Flagged Yellow]
    E -->|Similarity < 45%| H[Marked Green]
    
    F --> I[User Clicks "Fix with AI"]
    G --> I
    
    I --> J[Groq API Llama 3.1]
    J --> K[AI Rewrites Sentence]
    K --> L[Side-by-Side Comparison UI]
```

## 🚀 Deployment Strategy

WordSure is currently deployed in a **Docker container** hosted on **Hugging Face Spaces**. 
- It uses a custom `Dockerfile` configured to expose port `7860`.
- Continuous Integration / Continuous Deployment (CI/CD) is handled via a **GitHub Action** (`huggingface_sync.yml`). 
- Every push to the `master` branch on GitHub automatically synchronizes and triggers a new build and deployment on the Hugging Face Space.
