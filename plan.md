# Project Implementation Plan: AI-Powered Advising RAG Pipeline

## 1. Overview
This project implements a high-reliability RAG pipeline to automate Purdue University's CS major switching (CODO) eligibility checks.

## 2. File Structure
```
Purdue-CS-CODO-RAG/
├── data/
│   ├── raw_transcripts/    # Input PDFs (to be created/mocked)
│   └── vectordb/           # Persistent ChromaDB storage
├── .env                    # Environment variables (OPENAI_API_KEY)
├── requirements.txt        # Python dependencies
├── ingest.py               # Ingestion Engine: Parsing, Chunking, Indexing
├── rag_pipeline.py         # Core Logic: Retrieval (MultiQuery) & Generation (Chain)
├── app.py                  # Streamlit Test Bench UI
├── evaluate.py             # RAGAS Verification Script
└── plan.md                 # This planning document
```

## 3. Component Design

### 3.1 Data Ingestion (`ingest.py`)
- **Input**: PDF transcripts from `data/raw_transcripts/`.
- **Parsing**: `PyPDFLoader` (from `langchain_community`).
- **Splitting**: `RecursiveCharacterTextSplitter`
  - Chunk Size: 1000 tokens
  - Overlap: 100 tokens (10%)
- **Embedding**: `OpenAIEmbeddings`.
- **Storage**: `Chroma` (local persistence in `data/vectordb/`).

### 3.2 RAG Pipeline (`rag_pipeline.py`)
- **Vector Store**: Connect to existing ChromaDB.
- **Retriever**: 
  - Base: `vectorstore.as_retriever(search_type="mmr")` (Max Marginal Relevance).
  - Advanced: `MultiQueryRetriever` to generate variations of the user query for better recall.
- **LLM**: `ChatOpenAI` (GPT-4o or equivalent).
- **Prompt**: Custom "Advisor" prompt enforcing strict adherence to context and binary "Eligible/Ineligible" output.

### 3.3 User Interface (`app.py`)
- **Framework**: Streamlit.
- **Features**:
  - File uploader (optional, or just query existing db).
  - Chat interface for asking eligibility questions.
  - "View Retrieved Context" expander for debugging.

### 3.4 Verification (`evaluate.py`)
- **Framework**: `ragas`.
- **Metrics**: Faithfulness, Answer Relevancy.
- **Data**: A small "Golden Dataset" of Q&A pairs to validate the pipeline.

## 4. Implementation Steps
1.  **Setup**: Create virtual env, install dependencies (`requirements.txt`).
2.  **Ingestion**: Implement `ingest.py`. (Requires dummy data for testing).
3.  **Core RAG**: Implement `rag_pipeline.py` with MultiQuery + MMR.
4.  **UI**: Build `app.py` to interact with the pipeline.
5.  **Evaluation**: Setup `evaluate.py`.

## 5. Dependencies
`langchain`, `langchain-openai`, `langchain-community`, `chromadb`, `pypdf`, `ragas`, `streamlit`, `python-dotenv`
