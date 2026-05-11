# NotebookLLM — RAG-Powered Document Chat

A Google NotebookLM clone built with Next.js that allows users to upload documents (PDF/CSV) and have intelligent conversations with them using Retrieval-Augmented Generation (RAG).

🎯 **Project Overview**
This application implements a complete RAG pipeline where users can:
- Upload PDF or CSV documents
- Have the system intelligently chunk, embed, and index the content
- Ask natural language questions about the document
- Receive grounded answers based solely on the document's content (no hallucinations)

Built as part of Assignment 03 — Google NotebookLM RAG to demonstrate end-to-end RAG implementation.

🏗️ **Architecture**
- **LLM**: Groq (Llama 3.1)
- **Embeddings**: Hugging Face Inference API (`BAAI/bge-small-en-v1.5`)
- **Vector Database**: Qdrant Cloud
- **Framework**: Next.js 16 (App Router)
- **RAG Orchestration**: LangChain

🚀 **Getting Started**

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    npm install --legacy-peer-deps
    ```
3.  **Setup Environment Variables**:
    Create a `.env` file in the root directory:
    ```env
    HF_TOKEN=your_huggingface_token
    GROQ_API_KEY=your_groq_api_key
    QDRANT_URL=your_qdrant_url
    QDRANT_API_KEY=your_qdrant_api_key
    ```
4.  **Run the application**:
    ```bash
    npm run dev
    ```

🛠️ **Tech Stack**
- **Frontend**: React 19, Tailwind CSS, Framer Motion, Lucide React
- **Backend**: Next.js API Routes (Node.js)
- **AI/ML**: LangChain, Groq API, Hugging Face Inference API
- **Storage**: Qdrant Vector DB
