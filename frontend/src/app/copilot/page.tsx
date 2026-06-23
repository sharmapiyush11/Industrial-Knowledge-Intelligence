"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "../config";
import { 
  Send, 
  Mic, 
  MicOff,
  User, 
  Terminal, 
  ChevronRight, 
  FileText, 
  Activity, 
  Sparkles, 
  ShieldAlert, 
  Clock 
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "copilot";
  text: string;
  timestamp: string;
  confidence_score?: number;
  citations?: any[];
  related_assets?: any[];
  suggested_questions?: string[];
}

export default function CopilotPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "copilot",
      text: "### Welcome to the Engineering Copilot\n\nI am connected to the **Industrial Operations Brain** containing all local SOPs, maintenance work orders, incident records, and inspection logs.\n\nAsk me queries like:\n1. *\"What maintenance activities occurred on Pump P-101 in the last year?\"*\n2. *\"Show all failures related to Compressor C-15.\"*\n3. *\"Which SOP applies to Boiler B-102?\"*",
      timestamp: new Date().toLocaleTimeString(),
      suggested_questions: [
        "What maintenance activities occurred on Pump P-101 in the last year?",
        "Show all failures related to Compressor C-15.",
        "Which SOP applies to Boiler B-102?"
      ]
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Voice Recognition Simulation
  const handleVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    setSpeechError("");
    setIsListening(true);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Fallback: mock transcription typing
      setTimeout(() => {
        setInputText("Show maintenance records for Pump P-101");
        setIsListening(false);
      }, 2500);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = "en-US";
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const result = event.results[0][0].transcript;
        setInputText(result);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setSpeechError("Microphone error. Using keyboard input.");
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsThinking(true);

    try {
      const response = await fetch(`${API_BASE}/api/copilot/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: textToSend })
      });
      const data = await response.json();
      
      if (response.ok) {
        const copilotMsg: Message = {
          id: Math.random().toString(),
          sender: "copilot",
          text: data.answer,
          timestamp: new Date().toLocaleTimeString(),
          confidence_score: data.confidence_score,
          citations: data.citations,
          related_assets: data.related_assets,
          suggested_questions: data.suggested_questions
        };
        setMessages((prev) => [...prev, copilotMsg]);
      } else {
        const errorMsg: Message = {
          id: Math.random().toString(),
          sender: "copilot",
          text: "I encountered an error querying the operations database. Please verify backend services.",
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (e) {
      const errorMsg: Message = {
        id: Math.random().toString(),
        sender: "copilot",
        text: "Could not connect to FastAPI. Please ensure uvicorn server is running.",
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex gap-6 font-outfit relative">
      
      {/* Left Chat Screen */}
      <div className="flex-1 flex flex-col border border-slate-800 bg-[#070b19]/40 rounded-xl glass-panel overflow-hidden h-full">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-800 bg-[#0c1226]/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Engineering Assistant</h2>
              <span className="text-[10px] text-slate-500 font-mono">Semantic RAG & Knowledge Agent</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5 bg-[#111936] px-2 py-1 rounded border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-cyan-500" /> Session active
            </span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-4 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "copilot" && (
                <div className="w-8 h-8 rounded-lg bg-cyan-950/80 flex items-center justify-center border border-cyan-500/20 shrink-0">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                </div>
              )}

              <div className="space-y-2 max-w-2xl">
                {/* Message Box */}
                <div className={`p-4 rounded-xl border text-xs leading-relaxed font-outfit whitespace-pre-line ${
                  msg.sender === "user" 
                    ? "bg-gradient-to-r from-cyan-950/20 to-slate-900/20 border-cyan-500/30 text-cyan-100" 
                    : "bg-[#0c1226]/50 border-slate-800 text-slate-300"
                }`}>
                  {msg.text}
                </div>

                {/* Agent metadata details (Confidence & Citations) */}
                {msg.sender === "copilot" && (msg.confidence_score !== undefined || (msg.citations && msg.citations.length > 0)) && (
                  <div className="p-3 rounded-lg border border-slate-800 bg-[#070b19]/60 space-y-2 text-[10px] font-outfit">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                      <span className="text-slate-500 uppercase font-mono tracking-wider font-semibold">Agent Reasoning Metas</span>
                      {msg.confidence_score && (
                        <span className="text-cyan-400 font-bold font-mono">Confidence: {Math.round(msg.confidence_score * 100)}%</span>
                      )}
                    </div>
                    
                    {/* Citations List */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-slate-500 uppercase font-mono font-semibold block">Source Citations:</span>
                        {msg.citations.map((cit, idx) => (
                          <div key={idx} className="flex gap-2 text-slate-400">
                            <span className="text-cyan-400 shrink-0">[{idx + 1}]</span>
                            <div>
                              <span className="font-bold text-white block">{cit.source}</span>
                              <span className="text-slate-500 font-mono text-[9px] block italic">{cit.snippet}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Related Assets */}
                    {msg.related_assets && msg.related_assets.length > 0 && (
                      <div className="space-y-1.5 pt-1.5 border-t border-slate-850">
                        <span className="text-slate-500 uppercase font-mono font-semibold block">Connected Equipment:</span>
                        <div className="flex flex-wrap gap-2">
                          {msg.related_assets.map((asset, idx) => (
                            <button
                              key={idx}
                              onClick={() => router.push(`/assets?search=${asset.id}`)}
                              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-cyan-400 hover:border-cyan-500 transition-all font-mono"
                            >
                              {asset.id} ({asset.name})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Suggested Questions */}
                {msg.sender === "copilot" && msg.suggested_questions && msg.suggested_questions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {msg.suggested_questions.map((quest, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(quest)}
                        className="px-3 py-1.5 rounded-lg border border-slate-800 bg-[#0c1226]/20 hover:bg-slate-800/40 text-[10px] text-slate-400 hover:text-white transition-all font-semibold flex items-center gap-1.5"
                      >
                        <ChevronRight className="w-3 h-3 text-cyan-500 shrink-0" />
                        {quest}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {msg.sender === "user" && (
                <div className="w-8 h-8 rounded-lg bg-indigo-950/80 flex items-center justify-center border border-indigo-500/20 shrink-0">
                  <User className="w-4 h-4 text-indigo-400" />
                </div>
              )}
            </div>
          ))}

          {/* Thinking Animation */}
          {isThinking && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-lg bg-cyan-950/80 flex items-center justify-center border border-cyan-500/20 shrink-0">
                <Terminal className="w-4 h-4 text-cyan-400 animate-pulse" />
              </div>
              <div className="p-4 rounded-xl border border-slate-800 bg-[#0c1226]/50 text-xs text-slate-400 font-mono flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                <span className="ml-2">Orchestrating agents...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Controls */}
        <div className="p-4 border-t border-slate-800 bg-[#0c1226]/30 space-y-3">
          {speechError && (
            <div className="text-[10px] text-red-400 bg-red-950/15 border border-red-500/10 px-3 py-1 rounded flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> {speechError}
            </div>
          )}

          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); }}
            className="flex gap-3"
          >
            {/* Voice Input Toggle Button */}
            <button
              type="button"
              onClick={handleVoiceInput}
              className={`p-3 rounded-lg border transition-all shrink-0 ${
                isListening 
                  ? "bg-red-950/40 border-red-500/50 text-red-400 animate-pulse" 
                  : "bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-white"
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Input Bar */}
            <input 
              type="text"
              placeholder={isListening ? "Listening... Speak now." : "Prompt the Operations Brain..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-[#0a0f1d] border border-slate-800 rounded-lg px-4 text-xs text-[#f3f4f6] placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
            />

            {/* Submit Button */}
            <button
              type="submit"
              className="p-3 rounded-lg bg-[#00d2ff] hover:bg-cyan-400 text-navy-deep font-bold transition-all shrink-0 shadow-glass"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Right Reference panel showing context rules */}
      <div className="w-80 border border-slate-800 bg-[#070b19]/20 rounded-xl p-5 space-y-6 shrink-0 h-full overflow-y-auto glass-panel">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#00d2ff] font-semibold">Diagnostic Prompts</span>
          <h3 className="text-sm font-bold text-white font-outfit mt-1">Suggested Scenarios</h3>
        </div>

        <div className="space-y-3.5 text-xs">
          {[
            {
              title: "Maintenance Lookup",
              query: "What maintenance activities occurred on Pump P-101 in the last year?",
              desc: "Searches CMMS maintenance records dynamically."
            },
            {
              title: "Failure Audit",
              query: "Show all failures related to Compressor C-15.",
              desc: "Crawls historical Incident Reports and maps failure nodes."
            },
            {
              title: "Regulatory SOP Reference",
              query: "Which SOP applies to Boiler B-102?",
              desc: "Locates linked safety documentation categories."
            }
          ].map((scen, idx) => (
            <div 
              key={idx} 
              onClick={() => setInputText(scen.query)}
              className="p-3 rounded-lg border border-slate-850 bg-[#0c1226]/40 hover:bg-slate-800/20 cursor-pointer transition-all space-y-1.5"
            >
              <div className="font-bold text-cyan-400">{scen.title}</div>
              <p className="text-slate-400 italic">"{scen.query}"</p>
              <div className="text-[9px] text-slate-500 font-semibold uppercase">{scen.desc}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
