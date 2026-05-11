import { ChatGroq } from "@langchain/groq";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { QdrantVectorStore } from "@langchain/qdrant";

/**
 * Configuration for Qdrant. 
 * Defaults to localhost:6333 but can be overridden via ENV.
 */
function getQdrantConfig() {
  return {
    url: process.env.QDRANT_URL || "http://localhost:6333",
    apiKey: process.env.QDRANT_API_KEY,
    collectionName: process.env.QDRANT_COLLECTION_NAME || "notebookllm",
  };
}

/**
 * Revamped Document Processing Pipeline
 * Ingests raw Documents, chunks them, generates embeddings via HF, 
 * and indexes them into Qdrant.
 */
export async function processAndIndexDocument(docs: Document[], filename: string) {
  try {
    console.log(`Starting indexing for: ${filename}`);

    // 1. Intelligent Chunking Strategy
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await textSplitter.splitDocuments(docs);
    console.log(`Generated ${chunks.length} chunks`);

    // Ensure metadata is consistent
    chunks.forEach(chunk => {
      chunk.metadata.source = filename;
      chunk.metadata.indexedAt = new Date().toISOString();
    });

    // 2. Embedding Generation (Hugging Face)
    if (!process.env.HF_TOKEN) {
      throw new Error("HF_TOKEN is missing in environment variables.");
    }

    const embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: process.env.HF_TOKEN,
      model: "BAAI/bge-small-en-v1.5", // High-performance small embedding model
    });

    // 3. Vector Storage (Qdrant)
    const config = getQdrantConfig();
    console.log(`Connecting to Qdrant at: ${config.url}`);

    await QdrantVectorStore.fromDocuments(chunks, embeddings, {
      url: config.url,
      apiKey: config.apiKey,
      collectionName: config.collectionName,
    });

    console.log("Indexing complete.");
    return { success: true, chunksProcessed: chunks.length };

  } catch (error: any) {
    console.error("RAG Indexing Error:", error);
    throw new Error(`Failed to index document: ${error.message}`);
  }
}

/**
 * Revamped Retrieval & Generation Pipeline
 * Retrieves context from Qdrant and generates a grounded response via Groq.
 */
export async function queryDocument(userQuery: string) {
  try {
    // 1. Setup Retrieval
    const embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: process.env.HF_TOKEN,
      model: "BAAI/bge-small-en-v1.5",
    });
    
    const config = getQdrantConfig();
    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      url: config.url,
      apiKey: config.apiKey,
      collectionName: config.collectionName,
    });

    const retriever = vectorStore.asRetriever({
      k: 6, // Retrieve top 6 most relevant segments
    });

    const searchedChunks = await retriever.invoke(userQuery);
    
    if (!searchedChunks.length) {
      return {
        answer: "I couldn't find any relevant information in the uploaded document to answer your question.",
        sources: []
      };
    }

    // 2. Grounded Generation (Groq)
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is missing in environment variables.");
    }

    const llm = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      temperature: 0, // Deterministic for factual groundedness
    });
    
    const contextText = searchedChunks.map(c => c.pageContent).join("\n\n---\n\n");

    const system_prompt = `You are a helpful AI Assistant. Answer the user's question using ONLY the context provided below.
    
    RULES:
    1. If the answer is not in the context, say: "I don't have enough information in the document to answer that."
    2. Do NOT use your general knowledge.
    3. Stick strictly to the provided context.
    4. Maintain a professional and helpful tone.

    CONTEXT FROM DOCUMENT:
    ${contextText}`;

    const response = await llm.invoke([
      ["system", system_prompt],
      ["human", userQuery]
    ]);

    return {
      answer: response.content,
      sources: searchedChunks.map(c => c.pageContent)
    };

  } catch (error: any) {
    console.error("RAG Query Error:", error);
    throw new Error(`Failed to generate answer: ${error.message}`);
  }
}
