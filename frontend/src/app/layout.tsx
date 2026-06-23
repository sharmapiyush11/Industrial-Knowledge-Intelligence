"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Terminal, 
  Network, 
  FileText, 
  Search, 
  ShieldAlert, 
  GitFork, 
  Activity, 
  Bell, 
  Wrench, 
  Cpu, 
  RefreshCw, 
  Database 
} from "lucide-react";
import "./globals.css";
import { API_BASE, WS_BASE } from "./config";

interface Alert {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  // WebSocket Connection for Real-Time Alerts
  useEffect(() => {
    const wsUrl = WS_BASE;
    let socket: WebSocket | null = null;
    let reconnectTimeout: any;

    function connect() {
      if (!wsUrl) return;
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type !== "SYSTEM" || data.message.includes("seeded")) {
            const newAlert: Alert = {
              id: Math.random().toString(),
              type: data.type || "INFO",
              message: data.message,
              timestamp: new Date().toLocaleTimeString()
            };
            setAlerts((prev) => [newAlert, ...prev].slice(0, 20)); // Limit to 20
          }
        } catch (e) {
          console.error("Error parsing WS alert", e);
        }
      };

      socket.onclose = () => {
        console.log("WebSocket alert stream disconnected. Retrying...");
        reconnectTimeout = setTimeout(connect, 5000);
      };

      socket.onerror = (err) => {
        console.error("WS Alert error", err);
        socket?.close();
      };
    }

    connect();

    return () => {
      if (socket) socket.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  // Seed database handler (Demo Mode)
  const handleSeedDemoData = async () => {
    setIsDemoLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/demo/seed`, { method: "POST" });
      const data = await response.json();
      if (response.ok) {
        // Broadcast local notification
        const newAlert = {
          id: Math.random().toString(),
          type: "SYSTEM",
          message: "Demo Mode Active: Seed data successfully reloaded.",
          timestamp: new Date().toLocaleTimeString()
        };
        setAlerts((prev) => [newAlert, ...prev]);
        
        // Dynamic confetti simulation
        import("canvas-confetti").then((confetti) => {
          confetti.default({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
          });
        });
      }
    } catch (e) {
      console.error("Seeding failed", e);
    } finally {
      setIsDemoLoading(false);
    }
  };

  const navItems = [
    { name: "Executive Center", path: "/dashboard", icon: LayoutDashboard },
    { name: "Asset Digital Twin", path: "/assets", icon: Activity },
    { name: "Engineering Copilot", path: "/copilot", icon: Terminal },
    { name: "Knowledge Graph", path: "/graph", icon: Network },
    { name: "Document Manager", path: "/documents", icon: FileText },
    { name: "Root Cause (RCA)", path: "/rca", icon: GitFork },
    { name: "Compliance Center", path: "/compliance", icon: ShieldAlert },
  ];

  return (
    <html lang="en">
      <head>
        <title>Industrial Brain AI - Unified Asset & Operations Brain</title>
        <meta name="description" content="Enterprise-grade AI platform for manufacturing, energy, and operations knowledge graph intelligence." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="flex h-screen bg-[#030712] text-[#f3f4f6] overflow-hidden select-none">
        
        {/* Navigation Sidebar */}
        <aside className="w-64 border-r border-slate-800/80 bg-[#070b19]/90 flex flex-col justify-between shrink-0 glass-panel">
          <div>
            {/* Header Brand */}
            <div className="p-6 border-b border-slate-800/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center cyan-glow">
                <Cpu className="w-5 h-5 text-navy-deep font-bold" />
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-wide text-gradient font-outfit uppercase">Industrial Brain</h1>
                <span className="text-[10px] text-cyan-400/80 uppercase font-mono tracking-wider font-semibold">Operations AI</span>
              </div>
            </div>

            {/* Menu Links */}
            <nav className="p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.path}
                    href={item.path} 
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all font-outfit font-medium ${
                      isActive 
                        ? "bg-gradient-to-r from-cyan-950/40 to-slate-900/40 border border-cyan-500/20 text-cyan-400 font-semibold" 
                        : "text-slate-400 hover:text-[#f3f4f6] hover:bg-slate-800/30 border border-transparent"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer Controls & Judge Demo Mode */}
          <div className="p-4 border-t border-slate-800/60 space-y-3">
            <button 
              onClick={handleSeedDemoData}
              disabled={isDemoLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-navy-deep text-xs font-bold uppercase transition-all duration-300 shadow-glass-glow disabled:opacity-50"
            >
              {isDemoLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Database className="w-3.5 h-3.5" />
              )}
              {isDemoLoading ? "Seeding..." : "Judge Demo Mode"}
            </button>
            <div className="text-[10px] text-slate-500 text-center uppercase tracking-widest font-mono">
              V1.0.0 - Production MVP
            </div>
          </div>
        </aside>

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Top Global Status Header */}
          <header className="h-16 border-b border-slate-800/80 bg-[#070b19]/60 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500">Live Infrastructure Monitoring</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs text-emerald-400 font-semibold">FastAPI Agent Orchestration Stream online</span>
              </div>
            </div>

            {/* Notification Dropdown Trigger */}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationCenter(!showNotificationCenter)}
                className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/80 transition-all flex items-center gap-2 relative"
              >
                <Bell className="w-4 h-4 text-slate-300" />
                {alerts.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-cyan-500 text-navy-deep text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {alerts.length}
                  </span>
                )}
              </button>

              {/* Notification Center Popover */}
              {showNotificationCenter && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 rounded-xl border border-slate-800 bg-[#0c1226]/95 backdrop-blur-xl shadow-2xl p-4 overflow-y-auto z-50 glass-panel">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 mb-2">
                    <span className="text-xs font-semibold text-gradient uppercase font-outfit">Live Agent Alarms</span>
                    <button 
                      onClick={() => setAlerts([])}
                      className="text-[10px] text-slate-500 hover:text-cyan-400 uppercase font-semibold font-mono"
                    >
                      Clear
                    </button>
                  </div>
                  {alerts.length === 0 ? (
                    <div className="text-xs text-slate-500 text-center py-8">
                      No system events received. Triggers appear when database is reseeded or documents uploaded.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {alerts.map((al) => (
                        <div 
                          key={al.id}
                          className={`p-2.5 rounded-lg border text-xs font-outfit ${
                            al.type === "RISK_ALERT" 
                              ? "bg-red-950/20 border-red-500/20 text-red-300" 
                              : al.type === "DOCUMENT_INDEXED"
                              ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-300"
                              : "bg-[#111936] border-slate-800 text-slate-300"
                          }`}
                        >
                          <div className="flex justify-between font-semibold mb-0.5">
                            <span className="text-[10px] font-mono tracking-wider">{al.type}</span>
                            <span className="text-[9px] text-slate-500">{al.timestamp}</span>
                          </div>
                          <div>{al.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </header>

          {/* Main Router Content */}
          <main className="flex-grow overflow-auto bg-[#030712]/50 relative">
            
            {/* Absolute Background Ambient Glows */}
            <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"></div>

            <div className="p-8 h-full min-h-screen">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
