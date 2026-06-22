"use client";

import React, { useState, useEffect } from "react";
import ReactFlow, { 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState 
} from "reactflow";
import "reactflow/dist/style.css";
import { 
  GitFork, 
  Cpu, 
  Wrench, 
  TrendingUp, 
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  ListFilter
} from "lucide-react";

export default function RcaPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Form input
  const [title, setTitle] = useState("Mechanical Seal Rupture Trip");
  const [description, setDescription] = useState("Pump P-101 suffered loss of suction prime, causing dry run friction heat and mechanical seal failure with minor methane leak.");
  const [assetId, setAssetId] = useState("P-101");
  const [assets, setAssets] = useState<any[]>([]);
  
  // Results
  const [isLoading, setIsLoading] = useState(false);
  const [similarCases, setSimilarCases] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [analysisRan, setAnalysisRan] = useState(false);

  // Fetch asset tags for dropdown
  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await fetch("/api/assets");
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const runAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAnalysisRan(false);

    try {
      const res = await fetch("/api/rca/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, asset_id: assetId })
      });
      const data = await res.json();
      
      if (res.ok) {
        setNodes(data.flow_graph.nodes);
        setEdges(data.flow_graph.edges);
        setSimilarCases(data.similar_incidents || []);
        setRecommendations(data.recommendations || []);
        setAnalysisRan(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const sampleIncidents = [
    {
      title: "Boiler B-12 Overheat Drum Trip",
      desc: "Water drum scale deposits blocked feedwater injection valves, causing dry boiling, high heat concentrations, and ultimate tube wall rupture.",
      asset: "B-103"
    },
    {
      title: "Compressor C-15 Gas Seal Leak",
      desc: "Hydrocarbon condensates bypassed moisture filtration barrier and contaminated compressor seal kit leading to pressure trip.",
      asset: "C-105"
    }
  ];

  return (
    <div className="h-[calc(100vh-10rem)] flex gap-6 font-outfit relative">
      
      {/* Left panel: Incident Input form & details */}
      <div className="w-96 flex flex-col gap-4 border-r border-slate-800/80 pr-6 shrink-0 h-full overflow-y-auto">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#00d2ff] font-semibold">Incident Reasoning</span>
          <h2 className="text-xl font-bold text-white mt-1">Failure Analysis (RCA)</h2>
        </div>

        {/* Entry Form */}
        <form onSubmit={runAnalysis} className="p-4 rounded-xl border border-slate-800 bg-[#0c1226]/40 glass-panel space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Incident Title</label>
            <input 
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#070b19] border border-slate-800 rounded-lg p-2 text-xs text-[#f3f4f6] focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Equipment Tag</label>
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              className="w-full bg-[#070b19] border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              {assets.map(a => (
                <option key={a.id} value={a.id}>{a.id} - {a.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Incident Description Brief</label>
            <textarea 
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#070b19] border border-slate-800 rounded-lg p-2 text-xs text-[#f3f4f6] focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-[#00d2ff] hover:bg-cyan-400 text-navy-deep font-bold uppercase text-[10px] tracking-wider transition-all disabled:opacity-50"
          >
            {isLoading ? "Running Logic Engine..." : "Analyze Root Cause"}
          </button>
        </form>

        {/* Demo Samples shortcuts */}
        <div className="space-y-3">
          <div className="text-[10px] uppercase font-mono text-slate-500 font-semibold tracking-wider">Load Sample Reports</div>
          {sampleIncidents.map((samp, idx) => (
            <div 
              key={idx}
              onClick={() => { setTitle(samp.title); setDescription(samp.desc); setAssetId(samp.asset); }}
              className="p-3 rounded-lg border border-slate-850 bg-[#0c1226]/20 hover:bg-slate-800/20 cursor-pointer transition-all space-y-1.5"
            >
              <div className="font-bold text-xs text-white flex justify-between">
                <span>{samp.title}</span>
                <span className="text-[9px] font-mono text-cyan-400">{samp.asset}</span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{samp.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel: RCA Visual Flow diagram canvas & Similar cases list */}
      <div className="flex-1 bg-[#070b19]/40 rounded-xl border border-slate-800/80 glass-panel flex flex-col h-full overflow-hidden relative">
        {!analysisRan ? (
          <div className="flex-grow flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
            <GitFork className="w-8 h-8 animate-pulse text-cyan-500" />
            <span>Select/Type an incident details and hit run to construct root cause maps...</span>
          </div>
        ) : (
          <div className="flex-grow flex flex-col md:flex-row h-full overflow-hidden">
            
            {/* React Flow Chart Canvas */}
            <div className="flex-grow border-b md:border-b-0 md:border-r border-slate-800/60 relative h-full">
              <div className="absolute top-4 left-4 z-10">
                <span className="text-[9px] uppercase font-mono tracking-widest text-[#00d2ff] font-semibold">Incident Tree Chart</span>
              </div>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                fitView
              >
                <Background color="rgba(0, 210, 255, 0.03)" gap={16} />
                <Controls className="bg-[#0c1226] border border-slate-800 text-slate-400 [&_button]:border-slate-800" />
              </ReactFlow>
            </div>

            {/* Sidebar drawer showing similar incidents and recommendations */}
            <div className="w-80 p-6 space-y-6 overflow-y-auto shrink-0 h-full bg-[#0c1226]/40">
              
              {/* Recommendations */}
              <div className="space-y-3">
                <div className="text-[10px] uppercase font-mono text-slate-500 font-semibold tracking-wider">Mitigation Recommendations</div>
                <div className="space-y-2">
                  {recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-2 text-[11px] text-slate-300 leading-relaxed">
                      <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Similar Incidents */}
              <div className="space-y-3 pt-4 border-t border-slate-800/60">
                <div className="text-[10px] uppercase font-mono text-slate-500 font-semibold tracking-wider">Related Historical Failures</div>
                {similarCases.length === 0 ? (
                  <div className="text-[10px] text-slate-500 italic">No similar historical cases parsed.</div>
                ) : (
                  <div className="space-y-2.5">
                    {similarCases.map((caseItem) => (
                      <div key={caseItem.id} className="p-3 rounded-lg border border-slate-800 bg-[#070b19]/60 text-[11px] space-y-1">
                        <div className="flex justify-between font-bold text-white">
                          <span className="truncate max-w-[150px]">{caseItem.title}</span>
                          <span className="text-red-400 font-mono">{caseItem.date}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 leading-relaxed"><span className="text-slate-500 font-semibold">Root Cause:</span> {caseItem.root_cause}</div>
                        <div className="text-[10px] text-slate-400 leading-relaxed"><span className="text-slate-500 font-semibold">Resolution:</span> {caseItem.action_taken}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>

    </div>
  );
}
