import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAI } from "openai";

// Default to in-memory/local for development, but support cloud Qdrant for production
const getQdrantConfig = () => {
  const url = process.env.QDRANT_URL || "http://localhost:6333";
  const apiKey = process.env.QDRANT_API_KEY;
  const collectionName = process.env.QDRANT_COLLECTION || "notebook-lm-rag";
  return { url, apiKey, collectionName };
};

export async function processAndIndexDocument(text: string, filename: string) {
  // 1. Chunking Strategy: Recursive Character Text Splitter
  // We use this to keep sentences and paragraphs together for better context.
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docs = await textSplitter.createDocuments([text], [{ source: filename }]);

  // 2. Embedding & 3. Indexing
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large",
  });

  const config = getQdrantConfig();
  
  const vectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings, {
    url: config.url,
    apiKey: config.apiKey,
    collectionName: config.collectionName,
  });

  return { success: true, chunksProcessed: docs.length };
}

export async function queryDocument(userQuery: string) {
  // 1. Retrieve
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large",
  });

  const config = getQdrantConfig();

  const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: config.url,
    apiKey: config.apiKey,
    collectionName: config.collectionName,
  });

  const retriever = vectorStore.asRetriever({
    k: 5, // Retrieve top 5 most relevant chunks
  });

  const searchedChunks = await retriever.invoke(userQuery);

  // 2. Generate
  const client = new OpenAI();
  
  const contextText = searchedChunks.map(c => c.pageContent).join("\n\n---\n\n");

  const system_prompt = `You are an intelligent AI Assistant (similar to Google NotebookLM) that helps the user by answering questions based solely on the provided document context.

Rule:
- ONLY answer based on the available context from the uploaded documents.
- If the answer is not in the context, say "I cannot find the answer to that in the uploaded document." Do not hallucinate.

Context from document:
${contextText}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system_prompt },
      { role: 'user', content: userQuery }
    ]
  });

  return {
    answer: response.choices[0].message.content,
    sources: searchedChunks.map(c => c.pageContent)
  };
}
