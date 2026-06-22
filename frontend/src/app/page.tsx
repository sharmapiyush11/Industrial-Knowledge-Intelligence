"use client";

import React from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Cpu, 
  Database, 
  ShieldCheck, 
  Network, 
  TrendingUp, 
  Workflow, 
  Terminal,
  Activity,
  Layers,
  Award,
  Users
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-24 py-8 font-outfit">
      
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider font-mono">
            <Award className="w-3.5 h-3.5" /> Next-Generation Operations Intelligence
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            The Digital Brain for <span className="text-gradient">Industrial Operations</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Ingest heterogeneous documents, build a dynamic Neo4j knowledge graph, predict equipment failure probabilities with machine learning, and empower engineers with a voice-enabled AI Copilot.
          </p>
          <div className="flex gap-4">
            <Link 
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#00d2ff] hover:bg-cyan-400 text-navy-deep font-bold transition-all shadow-glass-glow uppercase text-xs"
            >
              Enter Platform <ArrowRight className="w-4 h-4" />
            </Link>
            <a 
              href="#demo"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700 text-[#f3f4f6] font-semibold transition-all text-xs uppercase"
            >
              See Product Demo
            </a>
          </div>
        </div>

        {/* Floating Schematic SVG Illustration */}
        <div className="lg:col-span-5 relative flex justify-center">
          <div className="absolute inset-0 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <svg viewBox="0 0 400 400" className="w-80 h-80 animate-float">
            <circle cx="200" cy="200" r="180" fill="none" stroke="rgba(0, 210, 255, 0.15)" strokeWidth="1" strokeDasharray="5,5" />
            <circle cx="200" cy="200" r="120" fill="none" stroke="rgba(0, 210, 255, 0.25)" strokeWidth="1" />
            
            {/* Center node */}
            <g transform="translate(200, 200)">
              <circle r="25" fill="url(#blueGrad)" className="cyan-glow" />
              <path d="M-8-8 L8,8 M8-8 L-8,8" stroke="#030712" strokeWidth="2" />
            </g>

            {/* Orbiting nodes */}
            <g transform="translate(100, 120)">
              <circle r="18" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />
              <text x="0" y="4" textAnchor="middle" fill="#c084fc" fontSize="10" fontWeight="bold">SOP</text>
            </g>
            <g transform="translate(300, 120)">
              <circle r="18" fill="#09333f" stroke="#00d2ff" strokeWidth="2" />
              <text x="0" y="4" textAnchor="middle" fill="#00d2ff" fontSize="10" fontWeight="bold">EQ</text>
            </g>
            <g transform="translate(120, 280)">
              <circle r="18" fill="#115e59" stroke="#14b8a6" strokeWidth="2" />
              <text x="0" y="4" textAnchor="middle" fill="#14b8a6" fontSize="10" fontWeight="bold">RCA</text>
            </g>
            <g transform="translate(280, 280)">
              <circle r="18" fill="#991b1b" stroke="#f87171" strokeWidth="2" />
              <text x="0" y="4" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="bold">FAIL</text>
            </g>

            {/* Connecting Links */}
            <line x1="200" y1="200" x2="100" y2="120" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="1.5" />
            <line x1="200" y1="200" x2="300" y2="120" stroke="rgba(0, 210, 255, 0.4)" strokeWidth="1.5" />
            <line x1="200" y1="200" x2="120" y2="280" stroke="rgba(20, 184, 166, 0.4)" strokeWidth="1.5" />
            <line x1="200" y1="200" x2="280" y2="280" stroke="rgba(248, 113, 113, 0.4)" strokeWidth="1.5" />
            
            <defs>
              <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00d2ff" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { metric: "500+", label: "Assets Configured" },
          { metric: "5000+", label: "Maintenance Records" },
          { metric: "99.9%", label: "System Availability" },
          { metric: "35%", label: "Avg Downtime Reduction" }
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-xl border border-slate-800/80 bg-[#070b19]/60 backdrop-blur-md text-center glass-panel">
            <div className="text-3xl font-bold text-[#00d2ff] mb-1 font-mono">{stat.metric}</div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Core Features */}
      <section className="space-y-12">
        <div className="text-center space-y-4 max-w-xl mx-auto">
          <h2 className="text-3xl font-bold font-outfit">Platform Capabilities</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Industrial Brain AI replaces fragmented databases with a single semantic knowledge graph that continuously crawls and learns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Document Ingestion & OCR",
              desc: "Upload SOP PDFs, excel sheets, and inspection checklists. Extract engineering drawings and isolate asset codes.",
              icon: Database
            },
            {
              title: "Dynamic Knowledge Graph",
              desc: "Automatically map connections (Asset → SOP → Inspection → Operator) to construct a live searchable graph.",
              icon: Network
            },
            {
              title: "Predictive Health Models",
              desc: "Calculate Asset Health Scores and failure probabilities using standard machine learning random forest predictions.",
              icon: Activity
            },
            {
              title: "Engineering Copilot",
              desc: "Natural language interface returning citations, related equipment files, confidence scores, and suggested follow-up paths.",
              icon: Terminal
            },
            {
              title: "Root Cause (RCA)",
              desc: "Generate interactive root cause failure trees from incident summaries, cross-referencing previous breakdown reports.",
              icon: Workflow
            },
            {
              title: "Compliance Shield",
              desc: "Proactively identify safety compliance gaps, expired certificates, and missing inspections before audit deadlines.",
              icon: ShieldCheck
            }
          ].map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div key={i} className="p-6 rounded-xl border border-slate-800 bg-[#0c1226]/40 hover:bg-[#0c1226]/80 glass-panel-hover flex flex-col justify-between h-64">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-lg bg-cyan-950/50 flex items-center justify-center border border-cyan-500/20">
                    <Icon className="w-5 h-5 text-[#00d2ff]" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-outfit">{feat.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Architecture & Pipeline */}
      <section id="demo" className="p-8 rounded-xl border border-slate-800 bg-[#070b19]/60 backdrop-blur-md glass-panel space-y-8">
        <div className="max-w-xl">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#00d2ff] font-semibold">Under the Hood</span>
          <h2 className="text-3xl font-bold text-white font-outfit mt-1">Multi-Agent Knowledge Orchestration</h2>
          <p className="text-slate-400 text-xs mt-3 leading-relaxed">
            Data is parsed, stored semantically in vector databases (ChromaDB) and graph databases (Neo4j), and dynamically computed by specialized agents.
          </p>
        </div>

        {/* Visual Pipeline block diagram */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
          {[
            { step: "01 Ingest", label: "PDFs, Logs, SOPs", color: "border-slate-800" },
            { step: "02 Parse", label: "OCR & Entity Extraction", color: "border-cyan-500/30 bg-cyan-950/20" },
            { step: "03 Index", label: "ChromaDB & Neo4j", color: "border-indigo-500/30 bg-indigo-950/20" },
            { step: "04 Reason", label: "Predictive ML & Agents", color: "border-purple-500/30 bg-purple-950/20" },
            { step: "05 Present", label: "Digital Twin & Copilot", color: "border-emerald-500/30 bg-emerald-950/20" }
          ].map((step, idx) => (
            <div key={idx} className={`p-4 rounded-lg border flex flex-col justify-center h-28 ${step.color}`}>
              <div className="text-xs font-mono font-semibold text-[#00d2ff] mb-1">{step.step}</div>
              <div className="text-sm font-bold text-white mb-0.5">{step.label.split(" & ")[0]}</div>
              <div className="text-[10px] text-slate-500">{step.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          {
            quote: "Industrial Brain AI resolved our document lookup problem completely. Engineers can find the exact seal specifications for our Baton Rouge turbines in under 5 seconds, rather than hours.",
            author: "Marcus Vance",
            role: "Operations Chief, Baton Rouge Petrochemical"
          },
          {
            quote: "The combination of a graph-connected data structure with a predictive failure classification engine changed our auditing process. Expired inspection risks are resolved automatically.",
            author: "Sarah Jenkins",
            role: "Senior Safety Auditor, global Energy Partners"
          }
        ].map((test, idx) => (
          <div key={idx} className="p-6 rounded-xl border border-slate-800/80 bg-[#070b19]/40 backdrop-blur-md glass-panel space-y-4">
            <p className="text-slate-300 italic text-sm leading-relaxed">"{test.quote}"</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                <Users className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">{test.author}</div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">{test.role}</div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Call to Action Footer */}
      <section className="text-center py-12 rounded-xl bg-gradient-to-tr from-cyan-950/30 to-indigo-950/30 border border-slate-800 p-8 glass-panel space-y-6">
        <h2 className="text-3xl font-bold text-white">Empower Your Plant Operators Today</h2>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          Start exploring your industrial asset data, upload SOPs, inspect failures, and prompt the operations brain.
        </p>
        <div>
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-[#00d2ff] hover:bg-cyan-400 text-navy-deep font-bold transition-all shadow-glass-glow uppercase text-xs"
          >
            Enter Platform Command Center <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
      
    </div>
  );
}
