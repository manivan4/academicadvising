# 🎓 Purdue CS CODO Eligibility Advisor

An AI-powered Retrieval-Augmented Generation (RAG) application that helps Purdue
University students determine their eligibility to Change their Degree Objective
(CODO) into the Computer Science major. Students anonymize and upload their
transcript, then chat with an AI advisor backed by official CODO policy
documents.

---

## Architecture Overview

```
                ┌─────────────────────────────────┐
                │         React Frontend           │
                │  (Vite · localhost:5173)         │
                │                                  │
                │  ┌─────────┐   ┌─────────────┐  │
                │  │Anonymize│   │    Chat     │  │
                │  │  Tab    │──▶│    Tab      │  │
                │  └─────────┘   └──────┬──────┘  │
                └─────────────────────┬─┘─────────┘
                                      │ HTTP (fetch)
                                      ▼
                ┌─────────────────────────────────┐
                │       FastAPI Backend            │
                │  (Uvicorn · localhost:8000)      │
                │                                  │
                │  POST /chat   POST /ingest       │
                │  GET  /status                    │
                └──────────────┬──────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                     ▼
┌──────────────────┐  ┌──────────────┐   ┌─────────────────┐
│  ChromaDB        │  │  HuggingFace │   │   Groq Cloud    │
│  (data/vectordb) │  │  Embeddings  │   │  (LLM inference)│
│  Vector Store    │  │ all-MiniLM   │   │ llama-3.1-8b    │
└──────────────────┘  └──────────────┘   └─────────────────┘
```

| Layer              | Technology                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| **Frontend**       | React 18 + Vite, Vanilla CSS                                                                               |
| **Backend**        | FastAPI + Uvicorn                                                                                          |
| **Embeddings**     | `all-MiniLM-L6-v2` (HuggingFace, runs locally)                                                             |
| **Vector Store**   | ChromaDB (persisted to `data/vectordb/`)                                                                   |
| **LLM Inference**  | [Groq Cloud](https://console.groq.com) — `llama-3.1-8b-instant` (fast) / `llama-3.3-70b-versatile` (smart) |
| **PDF Processing** | pdf.js (runs entirely in-browser — no transcript ever leaves the client)                                   |

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** and **npm**
- **Git**
- A **Groq API key** — get one free at
  [console.groq.com](https://console.groq.com)

---

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/sanilshetty/Academic-Advising-S26.git
cd Academic-Advising-S26
```

### 2. Create and Activate a Python Virtual Environment

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

### 3. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key_here
```

### 5. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

---

## Building the Knowledge Base

Before running the app, ingest the CODO policy documents into the vector
database.

### 1. Add Documents

When you clone the repository, the `data/raw_data/` and `data/vectordb/`
directories are completely empty (except for `.gitkeep` tracker files) to
prevent developers' local database experiments from clashing on GitHub.

To populate your local knowledge base:

1. Obtain the official Purdue CODO policy source documents (PDFs or `.txt`
   files).
2. Place these documents into the empty `data/raw_data/` directory.

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

You need **two terminals** running simultaneously.

**Terminal 1 — FastAPI Backend:**

```bash
uvicorn server:app --reload --port 8000
```

**Terminal 2 — React Frontend:**

```bash
cd frontend
npm run dev
```

Open your browser to **`http://localhost:5173`**.

### Using the App

1. **Anonymize Tab**: Upload your Purdue transcript PDF and enter your full
   name. The app uses pdf.js to extract the text entirely in your browser, then
   strips your name, email, and phone number before anything is sent to the
   server.
2. **Chat Tab**: Once your transcript is anonymized, it is automatically loaded
   into the chat context. Ask the AI advisor about your CODO eligibility. The
   sidebar shows the live status of the vector database and lets you upload
   additional knowledge base documents without restarting the server.

---

## Evaluation (Optional)

To evaluate RAG pipeline quality using [RAGAS](https://docs.ragas.io/) metrics
(faithfulness, answer relevancy):

```bash
python evaluate.py
```

Results are printed to the console and saved to `evaluation_report.json`.

---

## Project Structure

```
Purdue-CS-CODO-RAG/
├── server.py               # FastAPI backend
├── rag_pipeline.py         # RAG chain (retriever + Groq LLM)
├── ingest.py               # Document ingestion → ChromaDB
├── manage_kb.py            # CLI tool to add/remove/list KB docs
├── evaluate.py             # RAGAS evaluation script
├── requirements.txt        # Python dependencies
│
├── frontend/               # React + Vite frontend
│   ├── index.html          # HTML entry point
│   ├── vite.config.js      # Vite dev server configuration
│   ├── package.json        # Node dependencies
│   └── src/
│       ├── main.jsx        # React app entry point
│       ├── App.jsx         # Root component — tab routing
│       ├── api.js          # Fetch wrappers for the FastAPI backend
│       ├── index.css       # Global design system / all styles
│       └── components/
│           ├── Anonymizer.jsx  # PDF redaction panel (Tab 1)
│           ├── ChatPanel.jsx   # Chat interface (Tab 2)
│           └── Sidebar.jsx     # DB status + KB upload
│
├── data/
│   ├── raw_data/           # Source documents (PDFs, TXTs) — add yours here
│   └── vectordb/           # Persisted ChromaDB vector store (auto-generated)
│
└── tools/                  # Debug and inspection utilities
```

---

## File Descriptions

### Backend

| File                  | Role                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`server.py`**       | FastAPI application. Exposes three endpoints: `GET /status` (checks if the vector DB exists), `POST /ingest` (accepts PDF/TXT uploads, saves them to `data/raw_data/`, and rebuilds the vector database), and `POST /chat` (runs a single RAG turn, accepts the full chat history for multi-turn context). Warms up the RAG chain on startup to minimize first-request latency.                                                                                                                                                                                                      |
| **`rag_pipeline.py`** | Core RAG logic. `get_retriever()` loads ChromaDB with `all-MiniLM-L6-v2` embeddings and configures MMR search (k=5, fetch_k=20) for diverse document retrieval. `get_rag_chain()` builds a two-stage LangChain pipeline: (1) a **contextualize chain** that rewrites follow-up questions into standalone queries using chat history, then (2) a **QA chain** that injects the retrieved policy context and the student's anonymized transcript into a system prompt and calls Groq's `llama-3.1-8b-instant`. Both chains use `ChatGroq` and log retrieval debug info to the console. |
| **`ingest.py`**       | Document ingestion pipeline. Reads all PDFs and `.txt` files from `data/raw_data/`, splits them into overlapping chunks using `RecursiveCharacterTextSplitter`, generates embeddings with `all-MiniLM-L6-v2`, and persists the resulting vectors to `data/vectordb/` via ChromaDB. Supports a `--reset` flag to wipe and rebuild the database from scratch.                                                                                                                                                                                                                          |
| **`manage_kb.py`**    | CLI knowledge base manager. Supports `add`, `remove`, and `list` sub-commands to manage files in `data/raw_data/`. The `--ingest` flag triggers `ingest.py` automatically after any change, making it easy to update the knowledge base without manually running the ingestion script.                                                                                                                                                                                                                                                                                               |
| **`evaluate.py`**     | RAGAS evaluation harness. Runs a set of predefined test questions through the RAG chain, collects the answers and retrieved context, then reports faithfulness and answer relevancy scores. Results are saved to `evaluation_report.json`.                                                                                                                                                                                                                                                                                                                                           |

### Frontend

| File                                         | Role                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`frontend/src/App.jsx`**                   | Root React component. Manages two pieces of global state: the active tab (`anonymize` or `chat`) and `transcriptData` (the redacted transcript string). When `Anonymizer` completes a redaction, it calls `onRedactionComplete`, which stores the cleaned text in state and auto-switches to the Chat tab after 800 ms so the user sees the success banner.                                                                                                                                                                                                             |
| **`frontend/src/api.js`**                    | Thin fetch wrapper for the FastAPI backend. Exports three functions: `getStatus()` (polls `GET /status`), `ingestFiles(files)` (posts a `multipart/form-data` payload to `POST /ingest`), and `sendChat(question, transcriptData, history)` (posts JSON to `POST /chat`). All functions throw descriptive errors on non-2xx responses.                                                                                                                                                                                                                                  |
| **`frontend/src/index.css`**                 | Global design system. Defines all CSS custom properties (colors, spacing, radii, shadows), the two-column `layout` grid, sidebar styles, tab bar, chat bubble styles, the anonymizer panel, form inputs, the drag-and-drop PDF zone, stat cards, and micro-animations (spinner, typing dots). No CSS framework — all styles are hand-authored vanilla CSS.                                                                                                                                                                                                              |
| **`frontend/src/components/Anonymizer.jsx`** | Tab 1 — PDF redaction panel. Lazily loads `pdf.js` from CDN, extracts text from every page of the uploaded transcript, then runs a `redactPII()` function that strips the student's full name (case-insensitive), email addresses, and phone numbers using regex, replacing each match with `[REDACTED]`. All processing is fully client-side — no data is sent to the server. Displays a stats strip (pages, redactions, word count) and a read-only textarea with the redacted output. On completion, fires `onRedactionComplete` to pass the clean text up to `App`. |
| **`frontend/src/components/ChatPanel.jsx`**  | Tab 2 — conversational chat interface. Maintains the full message history in local state and passes it to `api.js` on each send so the backend can contextualize follow-up questions. Auto-scrolls to the latest message, auto-resizes the textarea, and shows an animated three-dot typing indicator while awaiting a response. Displays Groq inference latency (in seconds) beneath each assistant reply. If the anonymized transcript is loaded, a 🔒 badge is shown at the top of the panel.                                                                        |
| **`frontend/src/components/Sidebar.jsx`**    | Persistent left sidebar. Polls `GET /status` every 5 seconds to display a live green/red indicator for the vector database. Also provides a knowledge base uploader: the user selects one or more PDF/TXT files and clicks **⚡ Ingest Files**, which calls `POST /ingest` and displays a success or error message. The sidebar is always visible regardless of which tab is active.                                                                                                                                                                                    |
