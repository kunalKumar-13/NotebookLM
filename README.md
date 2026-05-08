# Google NotebookLM RAG Clone

This is a RAG-powered application where users can upload a PDF or plain text document and have a conversation with it. It represents a full RAG pipeline (ingestion -> chunking -> embedding -> storage -> retrieval -> generation).

## Features
- **Upload Document:** Parse PDF or TXT files.
- **Chunking:** Uses `RecursiveCharacterTextSplitter` to intelligently chunk documents while maintaining context.
- **Embedding:** Uses OpenAI's `text-embedding-3-large`.
- **Vector Database:** Uses **Qdrant** to store embeddings and retrieve relevant chunks.
- **LLM Generation:** Uses `gpt-4o-mini` to synthesize answers based **only** on the retrieved context (grounded generation, prevents hallucination).
- **Beautiful UI:** Built with Next.js, Tailwind CSS, and Framer Motion.

## Setup Instructions

### Prerequisites
- Node.js v18+
- OpenAI API Key
- Qdrant Vector Database (Local or Cloud)

### Environment Variables
Copy the `.env.example` file to `.env` and fill in your credentials.
```bash
cp .env.example .env
```
Fill out the keys:
```env
OPENAI_API_KEY=your_openai_key
QDRANT_URL=http://localhost:6333  # or your Qdrant Cloud URL
QDRANT_API_KEY=your_qdrant_api_key # required if using Qdrant Cloud
```

### Running Locally
1. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000)

## RAG Architecture
1. **Ingestion:** API route parses PDF (`pdf-parse`) or Text into raw strings.
2. **Chunking:** `RecursiveCharacterTextSplitter` with chunk size 1000 and overlap 200.
3. **Embedding:** `OpenAIEmbeddings` maps chunks to vectors.
4. **Storage & Retrieval:** `QdrantVectorStore` persists the chunks. For retrieval, the top 5 closest chunks are matched via vector similarity.
5. **Generation:** OpenAI Chat API receives a strict system prompt instructing it to only answer from the provided context.
