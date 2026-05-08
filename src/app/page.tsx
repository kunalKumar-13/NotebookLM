"use client";

import { useState, useRef } from "react";
import { UploadCloud, MessageSquare, Loader2, Send, FileText, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isIndexed, setIsIndexed] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<{role: 'user'|'ai', content: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setIsIndexed(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setIsIndexed(true);
        setMessages([{
          role: 'ai',
          content: `Successfully analyzed ${file.name}. What would you like to know about it?`
        }]);
      } else {
        alert(data.error || "Failed to upload document");
      }
    } catch (error) {
      alert("Error uploading file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isTyping) return;

    const userMessage = query;
    setQuery("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setMessages(prev => [...prev, { role: 'ai', content: data.answer }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: `Error: ${data.error}` }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "Failed to connect to the server." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center py-10 px-4 font-sans selection:bg-indigo-500/30">
      <div className="w-full max-w-4xl flex flex-col items-center gap-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4 mt-10">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-2">
            <MessageSquare className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">
            NotebookLM Clone
          </h1>
          <p className="text-neutral-400 max-w-lg mx-auto text-lg">
            Upload any document and ask questions. Powered by RAG, LangChain, and Qdrant.
          </p>
        </div>

        {/* Main Content Area */}
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 mt-8">
          
          {/* Sidebar / Upload Panel */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col items-center text-center shadow-xl shadow-black/50">
              <h2 className="text-xl font-semibold mb-2">Knowledge Base</h2>
              <p className="text-sm text-neutral-400 mb-6">Upload a PDF or TXT file to start</p>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf,.txt"
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-neutral-700 hover:border-indigo-500 hover:bg-indigo-500/5 rounded-2xl transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer"
              >
                <UploadCloud className="w-8 h-8 text-neutral-500 group-hover:text-indigo-400 transition-colors" />
                <span className="text-sm font-medium text-neutral-300">
                  {file ? file.name : "Select Document"}
                </span>
              </button>

              <button 
                onClick={handleUpload}
                disabled={!file || isUploading || isIndexed}
                className="w-full mt-4 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Indexing...</>
                ) : isIndexed ? (
                  <><CheckCircle className="w-4 h-4 text-green-400" /> Ready</>
                ) : (
                  "Process Document"
                )}
              </button>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="md:col-span-8 flex flex-col h-[600px] bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl shadow-black/50">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <h3 className="font-medium text-neutral-200">AI Assistant</h3>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
              {!isIndexed && messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-500 gap-3">
                  <FileText className="w-12 h-12 opacity-20" />
                  <p>Upload and process a document to start chatting</p>
                </div>
              ) : null}

              <AnimatePresence>
                {messages.map((msg, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={idx} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-2xl px-5 py-3.5 leading-relaxed text-[15px] ${
                        msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-br-sm' 
                          : 'bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-bl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-neutral-800 border border-neutral-700 rounded-2xl rounded-bl-sm px-5 py-4 flex gap-1.5 items-center">
                      <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce"></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-neutral-900 border-t border-neutral-800">
              <form onSubmit={handleChat} className="relative flex items-center">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={!isIndexed || isTyping}
                  placeholder={isIndexed ? "Ask anything about the document..." : "Waiting for document..."}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3.5 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 transition-all placeholder:text-neutral-600"
                />
                <button 
                  type="submit"
                  disabled={!isIndexed || isTyping || !query.trim()}
                  className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
