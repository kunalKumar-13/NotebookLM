"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, MessageSquare, Loader2, Send, FileText, CheckCircle, Sparkles, File, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isIndexed, setIsIndexed] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<{role: 'user'|'ai', content: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

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
          content: `Document **${file.name}** has been securely ingested into the neural matrix. What specific insights are you looking for?`
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
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center py-12 px-4 font-sans selection:bg-white/20 relative overflow-hidden">
      
      {/* Background Ornaments */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-5xl flex flex-col items-center gap-12 relative z-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center space-y-4 mt-6"
        >
          <div className="inline-flex items-center justify-center p-2.5 bg-white/5 border border-white/10 rounded-2xl mb-4 backdrop-blur-xl shadow-2xl">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/40 pb-2">
            NotebookLM
          </h1>
          <p className="text-neutral-400 max-w-lg mx-auto text-lg font-light leading-relaxed">
            Upload your document, let the neural engine index it, and converse with your data seamlessly.
          </p>
        </motion.div>

        {/* Main Content Area */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
          
          {/* Sidebar / Upload Panel */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-4 flex flex-col gap-4"
          >
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-[2rem] p-8 flex flex-col items-center text-center shadow-2xl backdrop-blur-xl">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <FileText className="w-5 h-5 text-white/60" />
              </div>
              <h2 className="text-xl font-medium mb-2 tracking-tight text-white/90">Knowledge Base</h2>
              <p className="text-sm text-neutral-500 mb-8 font-light">Upload a PDF to establish context</p>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf,.txt,.csv"
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 border border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 rounded-3xl transition-all duration-300 flex flex-col items-center justify-center gap-3 group cursor-pointer"
              >
                <div className="p-3 bg-white/5 rounded-full group-hover:scale-110 transition-transform duration-300">
                  <UploadCloud className="w-6 h-6 text-neutral-400 group-hover:text-indigo-400 transition-colors" />
                </div>
                <span className="text-sm font-medium text-neutral-300">
                  {file ? (
                    <span className="flex items-center gap-2"><File className="w-4 h-4" /> {file.name}</span>
                  ) : (
                    "Select Document"
                  )}
                </span>
              </button>

              <button 
                onClick={handleUpload}
                disabled={!file || isUploading || isIndexed}
                className="w-full mt-6 py-4 px-4 bg-white text-black hover:bg-neutral-200 disabled:bg-white/5 disabled:text-white/30 rounded-2xl font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:shadow-none"
              >
                {isUploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Indexing Context...</>
                ) : isIndexed ? (
                  <><CheckCircle className="w-4 h-4" /> System Ready</>
                ) : (
                  <>Process Document <ArrowRight className="w-4 h-4 ml-1" /></>
                )}
              </button>
            </div>
          </motion.div>

          {/* Chat Interface */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-8 flex flex-col h-[650px] bg-white/[0.02] border border-white/[0.08] rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-xl relative"
          >
            {/* Chat Header */}
            <div className="px-6 py-5 border-b border-white/[0.05] bg-white/[0.01] flex items-center gap-4 z-10">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
              <div>
                <h3 className="font-medium text-white/90 text-sm tracking-wide">Synthesis Engine</h3>
                <p className="text-xs text-white/40 mt-0.5">{isIndexed ? "Grounded in your document" : "Awaiting context"}</p>
              </div>
            </div>

            {/* Chat History */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth z-10 custom-scrollbar">
              {!isIndexed && messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-500 gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl mb-2">
                    <MessageSquare className="w-8 h-8 opacity-40" />
                  </div>
                  <p className="font-light tracking-wide text-white/40">Knowledge base empty. Upload to begin.</p>
                </div>
              ) : null}

              <AnimatePresence>
                {messages.map((msg, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    key={idx} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] rounded-3xl px-6 py-4 leading-relaxed text-[15px] font-light shadow-lg ${
                        msg.role === 'user' 
                          ? 'bg-white text-black rounded-br-sm' 
                          : 'bg-white/5 border border-white/10 text-white/90 rounded-bl-sm backdrop-blur-md'
                      }`}
                      dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} // Basic markdown bold
                    />
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white/5 border border-white/10 rounded-3xl rounded-bl-sm px-6 py-5 flex gap-2 items-center backdrop-blur-md">
                      <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Chat Input */}
            <div className="p-6 bg-gradient-to-t from-black/40 to-transparent z-10 pt-10">
              <form onSubmit={handleChat} className="relative flex items-center group">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={!isIndexed || isTyping}
                  placeholder={isIndexed ? "Ask a question about the document..." : "System locked. Require document ingestion."}
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl py-4 pl-6 pr-14 text-sm focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30 focus:bg-white/10 disabled:opacity-50 transition-all duration-300 placeholder:text-neutral-500 font-light"
                />
                <button 
                  type="submit"
                  disabled={!isIndexed || isTyping || !query.trim()}
                  className="absolute right-3 p-2.5 bg-white text-black rounded-xl hover:bg-neutral-200 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-white transition-all duration-300 shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />
    </div>
  );
}
