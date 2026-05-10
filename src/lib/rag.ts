import { ChatGroq } from "@langchain/groq";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { QdrantVectorStore } from "@langchain/qdrant";

function getQdrantConfig() {
  const url = process.env.QDRANT_URL || "http://localhost:6333";
  const apiKey = process.env.QDRANT_API_KEY;
  const collectionName = process.env.QDRANT_COLLECTION_NAME || "notebookllm";
  return { url, apiKey, collectionName };
}

export async function processAndIndexDocument(docs: Document[], filename: string) {
  // 1. Chunking Strategy
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const chunks = await textSplitter.splitDocuments(docs);

  // Add source filename to metadata
  chunks.forEach(chunk => {
    chunk.metadata.source = filename;
  });

  // 2. Embedding
  const embeddings = new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.HF_TOKEN,
    model: "BAAI/bge-small-en-v1.5",
  });

  // 3. Indexing using a real Vector Database (Qdrant)
  const config = getQdrantConfig();
  await QdrantVectorStore.fromDocuments(chunks, embeddings, {
    url: config.url,
    apiKey: config.apiKey,
    collectionName: config.collectionName,
  });

  return { success: true, chunksProcessed: chunks.length };
}

export async function queryDocument(userQuery: string) {
  // 1. Retrieve
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
    k: 6,
  });

  const searchedChunks = await retriever.invoke(userQuery);

  // 2. Generate
  const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    temperature: 0,
  });
  
  const contextText = searchedChunks.map(c => c.pageContent).join("\n\n---\n\n");

  const system_prompt = `You are a helpful assistant. Answer the user's question using ONLY the context provided below.
If the answer cannot be found in the context, say "I don't have enough information in the document to answer that."
Do not use your general knowledge — stick strictly to the provided context.

Context from document:
${contextText}`;

  const response = await llm.invoke([
    ["system", system_prompt],
    ["human", userQuery]
  ]);

  return {
    answer: response.content,
    sources: searchedChunks.map(c => c.pageContent)
  };
}
