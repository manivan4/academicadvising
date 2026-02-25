# 🎓 Purdue CS CODO Eligibility Advisor

An AI-powered Retrieval-Augmented Generation (RAG) application that helps Purdue
University students determine their eligibility to Change their Degree Objective
(CODO) into the Computer Science major. Students can upload their transcript and
chat with an advisor backed by official CODO policy documents.

## Architecture Overview

```
PDF/TXT Documents → Ingestion → ChromaDB (Vector Store)
                                       ↓
User Transcript + Query → Retriever (MMR) → Groq LLM → Response
```

- **Embeddings**: `all-MiniLM-L6-v2` (HuggingFace, runs locally)
- **LLM Inference**: [Groq Cloud](https://console.groq.com)
  (`llama-3.1-8b-instant` by default)
- **Vector Store**: ChromaDB (persisted to `data/vectordb/`)
- **Frontend**: Streamlit

---

## Prerequisites

- **Python 3.10+**
- **Git**
- A **Groq API key** — get one free at
  [console.groq.com](https://console.groq.com)

---

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/Purdue-CS-CODO-RAG.git
cd Purdue-CS-CODO-RAG
```

### 2. Create and Activate a Virtual Environment

```bash
# Create the environment
python -m venv .venv

# Activate it (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Activate it (Windows CMD)
.venv\Scripts\activate.bat

# Activate it (macOS/Linux)
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the project root (copy the example below):

```env
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_here   # Only needed for evaluation (evaluate.py)
```

---

## Building the Knowledge Base

Before running the app, you need to ingest the CODO policy documents into the
vector database.

### 1. Add Documents

Place your source documents (PDFs or `.txt` files) in `data/raw_data/`.

You can also use the knowledge base management script:

```bash
# Add a file and immediately re-ingest
python manage_kb.py add path/to/document.pdf --ingest

# List documents currently in the knowledge base
python manage_kb.py list

# Remove a document and re-ingest
python manage_kb.py remove document.pdf --ingest
```

### 2. Run Ingestion

```bash
# First-time ingestion
python ingest.py

# Reset the database and re-ingest all documents
python ingest.py --reset
```

A `data/vectordb/` directory will be created containing the persisted ChromaDB
vector store.

---

## Running the Application

```bash
streamlit run app.py
```

The app will open in your browser at `http://localhost:8501`.

### Using the App

1. **Upload Knowledge Base Docs** (Sidebar → "Knowledge Base"): Upload
   additional PDFs/TXT files and click **Save & Ingest Files** to add them to
   the vector store.
2. **Upload Your Transcript** (Sidebar → "Personal Student Data"): Upload your
   Purdue transcript (PDF or TXT). The app extracts the text and passes it
   directly to the LLM context.
3. **Chat**: Ask eligibility questions in the chat window. Example prompts:
   - _"I have a 3.2 GPA and a B in CS 18000. Am I eligible for CODO?"_
   - _"What GPA do I need to CODO into CS?"_
   - _"Can you review my transcript and tell me if I qualify?"_

---

## Evaluation (Optional)

To evaluate the RAG pipeline quality using [RAGAS](https://docs.ragas.io/)
metrics (faithfulness, answer relevancy):

> **Note:** Requires an OpenAI API key set in `.env`.

```bash
python evaluate.py
```

Results are printed to the console and saved to `evaluation_report.json`.

---

## Project Structure

```
Purdue-CS-CODO-RAG/
├── app.py              # Streamlit frontend
├── rag_pipeline.py     # RAG chain (retriever + Groq LLM)
├── ingest.py           # Document ingestion → ChromaDB
├── manage_kb.py        # CLI tool to add/remove/list knowledge base docs
├── evaluate.py         # RAGAS evaluation script
├── requirements.txt    # Python dependencies
├── data/
│   ├── raw_data/       # Source documents (PDFs, TXTs) — add yours here
│   └── vectordb/       # Persisted ChromaDB vector store (auto-generated)
└── tools/              # Debug and inspection utilities
```

---

## Troubleshooting

| Problem                           | Solution                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| `Vector DB not found`             | Run `python ingest.py` first                                                          |
| `GROQ_API_KEY not found`          | Ensure `.env` exists and contains your key                                            |
| `Could not reset database`        | Stop the running Streamlit app before re-ingesting                                    |
| Embedding model slow on first run | `all-MiniLM-L6-v2` is downloaded on first use (~90 MB); subsequent runs use the cache |
