"use client";

import React, { useState, useEffect, useCallback } from "react";
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  MarkerType 
} from "reactflow";
import "reactflow/dist/style.css";
import { Network, Search, RefreshCw, X, Tag, FileText, User, HelpCircle } from "lucide-react";
import { API_BASE } from "../config";

export default function KnowledgeGraphPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  // Fetch graph data on mount
  useEffect(() => {
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/graph/data`);
      if (res.ok) {
        const data = await res.json();
        
        // Define colors per node type (label)
        const getStyle = (label: string) => {
          switch (label) {
            case "Asset":
              return { background: "#0c3a50", color: "#00d2ff", border: "1.5px solid #00d2ff" };
            case "SOP":
              return { background: "#2e1049", color: "#c084fc", border: "1.5px solid #c084fc" };
            case "FailureEvent":
              return { background: "#450a0a", color: "#f87171", border: "1.5px solid #f87171" };
            case "InspectionReport":
              return { background: "#1e1b4b", color: "#818cf8", border: "1.5px solid #818cf8" };
            case "Personnel":
              return { background: "#064e3b", color: "#34d399", border: "1.5px solid #34d399" };
            default:
              return { background: "#1e293b", color: "#94a3b8", border: "1.5px solid #475569" };
          }
        };

        // Layout nodes in a clean circular / grid arrangement
        const flowNodes = data.nodes.map((node: any, index: number) => {
          const angle = (index / data.nodes.length) * 2 * Math.PI;
          const radius = 250 + (index % 3) * 60;
          const x = 350 + radius * Math.cos(angle);
          const y = 300 + radius * Math.sin(angle);
          
          return {
            id: node.id,
            data: { label: `${node.label.toUpperCase()}\n${node.id}` },
            position: { x, y },
            style: getStyle(node.label),
            rawNode: node
          };
        });

        const flowEdges = data.edges.map((edge: any, index: number) => ({
          id: `e-${index}`,
          source: edge.source,
          target: edge.target,
          label: edge.type,
          animated: edge.type === "SUFFERED_FAILURE" || edge.type === "VIOLATED_COMPLIANCE",
          style: { stroke: edge.type === "SUFFERED_FAILURE" ? "#f87171" : "#475569" },
          labelStyle: { fill: "#94a3b8", fontSize: 8, fontWeight: 600 }
        }));

        setNodes(flowNodes);
        setEdges(flowEdges);
      }
    } catch (e) {
      console.error("Error loading graph data", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Node select handler
  const onNodeClick = useCallback((event: React.MouseEvent, node: any) => {
    setSelectedNode(node.rawNode || null);
  }, []);

  // Search logic: filter nodes matching query and highlight
  const handleSearch = () => {
    if (!searchQuery) return;
    const matchedNode: any = nodes.find((n: any) => n.id.toLowerCase() === searchQuery.toLowerCase() || (n.rawNode?.properties?.name || "").toLowerCase().includes(searchQuery.toLowerCase()));
    if (matchedNode) {
      // Highlight the node
      setNodes((nds) => 
        nds.map((n: any) => {
          if (n.id === matchedNode.id) {
            return { ...n, style: { ...n.style, boxShadow: "0 0 25px #00d2ff" } };
          }
          return n;
        })
      );
      setSelectedNode(matchedNode.rawNode);
    }
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex gap-6 font-outfit relative">
      
      {/* Graph Visualizer Canvas */}
      <div className="flex-grow border border-slate-800 bg-[#070b19]/40 rounded-xl relative h-full glass-panel overflow-hidden">
        {/* Floating Controls Bar */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Locate Asset (P-101...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="bg-[#0c1226]/80 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-[#f3f4f6] placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-60 glass-panel"
            />
          </div>
          <button 
            onClick={fetchGraphData}
            className="p-2.5 rounded-lg border border-slate-800 bg-[#0c1226]/80 text-slate-400 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Sync Graph
          </button>
        </div>

        {/* Legend Panel */}
        <div className="absolute bottom-4 left-4 z-10 p-3 rounded-lg border border-slate-800/80 bg-[#0c1226]/90 text-[10px] space-y-1.5 glass-panel">
          <div className="font-bold uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-800/60 mb-1">Entity Map</div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#0c3a50] border border-[#00d2ff]"></span> <span className="text-slate-400">Assets</span></div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#2e1049] border border-[#c084fc]"></span> <span className="text-slate-400">Operating SOPs</span></div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#450a0a] border border-[#f87171]"></span> <span className="text-slate-400">Failure Incidents</span></div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#1e1b4b] border border-[#818cf8]"></span> <span className="text-slate-400">Inspections</span></div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#064e3b] border border-[#34d399]"></span> <span className="text-slate-400">Technicians</span></div>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          maxZoom={1.5}
          minZoom={0.2}
        >
          <Background color="rgba(0, 210, 255, 0.05)" gap={16} size={1} />
          <Controls className="bg-[#0c1226] border border-slate-800 text-slate-400 [&_button]:border-slate-800" />
          <MiniMap 
            nodeColor={(node) => (node.style?.background as string) || "#1e293b"}
            maskColor="rgba(3, 7, 18, 0.6)"
            className="border border-slate-800 rounded-lg overflow-hidden !bg-[#070b19]/90"
          />
        </ReactFlow>
      </div>

      {/* Right Drawer showing Node Properties */}
      {selectedNode && (
        <div className="w-80 border border-slate-800 bg-[#070b19]/30 rounded-xl p-5 space-y-6 shrink-0 h-full overflow-y-auto glass-panel relative animate-float-in">
          <button 
            onClick={() => setSelectedNode(null)}
            className="absolute top-4 right-4 p-1 rounded-lg border border-slate-800 text-slate-500 hover:text-white hover:bg-slate-800/40 transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div>
            <span className="text-[9px] uppercase font-mono tracking-widest text-[#00d2ff] font-semibold">{selectedNode.label} Meta Node</span>
            <h3 className="text-base font-bold text-white font-outfit mt-1">{selectedNode.id}</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="font-semibold text-slate-500 uppercase font-mono tracking-wider pb-1.5 border-b border-slate-800/60">Node Properties</div>
            <div className="space-y-2.5">
              {Object.entries(selectedNode.properties || {}).map(([key, val]: any) => (
                <div key={key}>
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">{key.replace("_", " ")}</span>
                  <span className="text-slate-200 font-medium font-outfit">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
