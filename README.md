# NotebookLLM — RAG-Powered Document Chat
A Google NotebookLM clone built with Next.js that allows users to upload documents (PDF/CSV) and have intelligent conversations with them using Retrieval-Augmented Generation (RAG).

## 🎯 Project Overview
This application implements a complete RAG pipeline where users can:
- Upload PDF documents
- Have the system intelligently chunk, embed, and index the content
- Ask natural language questions about the document
- Receive grounded answers based solely on the document's content (no hallucinations)

## 🏗️ Architecture
**RAG Pipeline Flow**
Document Upload → Document Loading → Chunking → Embedding → Vector Storage → Retrieval → LLM Generation

**Tech Stack**
- Frontend: Next.js 16, React 19, TailwindCSS
- Document Processing: LangChain, pdf-parse
- Embeddings: Hugging Face Inference API (BAAI/bge-small-en-v1.5)
- Vector Database: Qdrant Cloud
- LLM: Groq (Llama 3.1 8B Instant)
- Orchestration: LangChain

## 📋 Features
- **Complete RAG Pipeline**
- **Document Ingestion**
- **Document Loading**
- **Chunking Strategy**: Recursive Character Text Splitter (1000 chunk size, 200 overlap)
- **Embedding Generation**: BAAI/bge-small-en-v1.5 (384 dimensions)
- **Vector Storage**: Qdrant Cloud
- **Retrieval**: Similarity search with k=6
- **Answer Generation**: Groq LLM (Llama 3.1 8B Instant)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Hugging Face Token (free tier)
- Groq API Key (free tier)
- Qdrant Cloud URL/Key (free tier)

### Installation
1. Install dependencies
   ```bash
   npm install --legacy-peer-deps
   ```
2. Configure environment variables
   ```bash
   cp .env.example .env
   ```
   Fill in your API keys in `.env`:
   ```env
   # Hugging Face — for embeddings
   HF_TOKEN=hf_your_token_here
   
   # Groq — for LLM
   GROQ_API_KEY=gsk_your_key_here
   
   # Qdrant Cloud — for vector storage
   QDRANT_URL=https://your-cluster.qdrant.io
   QDRANT_API_KEY=your_qdrant_api_key
   ```
3. Run the development server
   ```bash
   npm run dev
   ```

## 🎓 Grounding Strategy
The system prompt enforces strict grounding to prevent hallucinations.
`You are a helpful assistant. Answer the user's question using ONLY the context provided below.`
