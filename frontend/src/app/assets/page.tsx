"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Search, 
  Filter, 
  Activity, 
  Wrench, 
  AlertOctagon, 
  FileText, 
  Calendar, 
  MapPin, 
  Building,
  CheckCircle,
  XCircle,
  HelpCircle,
  ChevronRight
} from "lucide-react";

function AssetExplorerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [assetDetail, setAssetDetail] = useState<any>(null);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [plantFilter, setPlantFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Active sub-tab in detail panel
  const [activeTab, setActiveTab] = useState<"timeline" | "predictive" | "inspections" | "documents">("timeline");

  // Fetch asset list
  useEffect(() => {
    fetchAssetList();
  }, [plantFilter, statusFilter, typeFilter, riskFilter]);

  // Sync initialSearch query parameter
  useEffect(() => {
    if (initialSearch && assets.length > 0) {
      const found = assets.find(a => a.id.toLowerCase() === initialSearch.toLowerCase() || a.name.toLowerCase().includes(initialSearch.toLowerCase()));
      if (found) {
        setSelectedAssetId(found.id);
      }
    }
  }, [initialSearch, assets]);

  // Fetch asset details when selection changes
  useEffect(() => {
    if (selectedAssetId) {
      fetchAssetDetails(selectedAssetId);
    }
  }, [selectedAssetId]);

  const fetchAssetList = async () => {
    setIsLoadingList(true);
    try {
      let url = "/api/assets";
      const params = [];
      if (plantFilter) params.push(`plant=${encodeURIComponent(plantFilter)}`);
      if (statusFilter) params.push(`status=${encodeURIComponent(statusFilter)}`);
      if (typeFilter) params.push(`type=${encodeURIComponent(typeFilter)}`);
      if (riskFilter) params.push(`risk=${encodeURIComponent(riskFilter)}`);
      
      if (params.length > 0) {
        url += "?" + params.join("&");
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
        // Default to first asset in list if none selected
        if (data.length > 0 && !selectedAssetId) {
          setSelectedAssetId(data[0].id);
        }
      }
    } catch (e) {
      console.error("Error fetching asset list", e);
    } finally {
      setIsLoadingList(false);
    }
  };

  const fetchAssetDetails = async (id: string) => {
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/assets/${id}`);
      if (res.ok) {
        const data = await res.json();
        setAssetDetail(data);
      }
    } catch (e) {
      console.error("Error fetching asset detail", e);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Filter local asset list by search text query
  const filteredAssets = assets.filter(asset => 
    asset.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group timeline events (Maintenance, Failure, Inspections)
  const getTimelineEvents = () => {
    if (!assetDetail) return [];
    
    const events: any[] = [];
    
    // Add Maintenance Events
    if (assetDetail.maintenance_timeline) {
      assetDetail.maintenance_timeline.forEach((log: any) => {
        events.push({
          id: `m-${log.id}`,
          type: "MAINTENANCE",
          title: log.activity,
          date: new Date(log.timestamp),
          tech: log.technician,
          cost: log.cost,
          status: log.status,
          duration: log.duration_hours,
          icon: Wrench,
          color: "border-cyan-500 text-cyan-400 bg-cyan-950/20"
        });
      });
    }

    // Add Failure Events
    if (assetDetail.failure_timeline) {
      assetDetail.failure_timeline.forEach((inc: any) => {
        events.push({
          id: `f-${inc.id}`,
          type: "FAILURE",
          title: inc.title,
          date: new Date(inc.timestamp),
          severity: inc.severity,
          root_cause: inc.root_cause,
          action_taken: inc.action_taken,
          reporter: inc.reporter,
          icon: AlertOctagon,
          color: "border-red-500 text-red-400 bg-red-950/20"
        });
      });
    }

    // Add Inspection Events
    if (assetDetail.inspection_timeline) {
      assetDetail.inspection_timeline.forEach((ins: any) => {
        events.push({
          id: `i-${ins.id}`,
          type: "INSPECTION",
          title: `Inspection Report (Score: ${ins.score}%)`,
          date: new Date(ins.timestamp),
          inspector: ins.inspector,
          findings: ins.findings,
          status: ins.status,
          icon: FileText,
          color: "border-indigo-500 text-indigo-400 bg-indigo-950/20"
        });
      });
    }

    // Sort events by date descending
    return events.sort((a: any, b: any) => b.date.getTime() - a.date.getTime());
  };

  const timelineEvents = getTimelineEvents();

  return (
    <div className="h-[calc(100vh-10rem)] flex gap-6 font-outfit relative">
      
      {/* Sidebar: Asset List & Filters */}
      <div className="w-80 flex flex-col gap-4 border-r border-slate-800/80 pr-6 shrink-0 h-full overflow-hidden">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input 
            type="text"
            placeholder="Search asset tags (P-101...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#070b19]/60 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-[#f3f4f6] placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all glass-panel"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <select 
            value={plantFilter} 
            onChange={(e) => setPlantFilter(e.target.value)}
            className="bg-[#070b19]/60 border border-slate-800 rounded-lg p-2 text-slate-400 focus:outline-none focus:border-cyan-500 glass-panel"
          >
            <option value="">All Plants</option>
            <option value="Houston Refinery">Houston Refinery</option>
            <option value="Baton Rouge Petrochemical">Baton Rouge</option>
            <option value="Rotterdam Chemical">Rotterdam Chem</option>
            <option value="Singapore Jurong Plant">Singapore Jurong</option>
          </select>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#070b19]/60 border border-slate-800 rounded-lg p-2 text-slate-400 focus:outline-none focus:border-cyan-500 glass-panel"
          >
            <option value="">All Statuses</option>
            <option value="Operational">Operational</option>
            <option value="Under Maintenance">Maintenance</option>
            <option value="Critical">Critical</option>
            <option value="Offline">Offline</option>
          </select>
        </div>

        {/* Asset List Scrollable Container */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {isLoadingList ? (
            <div className="text-center text-xs text-slate-500 py-8">Loading asset records...</div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center text-xs text-slate-500 py-8">No assets match criteria.</div>
          ) : (
            filteredAssets.map((asset) => (
              <div 
                key={asset.id}
                onClick={() => setSelectedAssetId(asset.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center ${
                  selectedAssetId === asset.id 
                    ? "bg-gradient-to-r from-cyan-950/30 to-slate-900/30 border-cyan-500/40 text-cyan-400" 
                    : "bg-[#0c1226]/30 border-slate-850 text-slate-300 hover:bg-slate-800/20"
                }`}
              >
                <div>
                  <div className="text-xs font-bold font-mono">{asset.id}</div>
                  <div className="text-[10px] text-slate-500 font-semibold truncate max-w-[150px] mt-0.5">{asset.name}</div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-bold font-mono ${
                    asset.health_score >= 85 ? "text-emerald-400" : asset.health_score >= 70 ? "text-amber-400" : "text-red-400"
                  }`}>
                    {asset.health_score}%
                  </div>
                  <span className="text-[9px] text-slate-600 block uppercase font-mono tracking-wider">{asset.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Detail Panel */}
      <div className="flex-1 bg-[#070b19]/40 rounded-xl border border-slate-800/80 glass-panel flex flex-col h-full overflow-hidden relative">
        {isLoadingDetail || !assetDetail ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
            <Activity className="w-8 h-8 animate-pulse text-cyan-500" />
            <span>Retrieving Digital Twin telemetry...</span>
          </div>
        ) : (
          <>
            {/* Header Telemetry */}
            <div className="p-6 border-b border-slate-800/60 bg-[#0c1226]/40 flex justify-between items-center">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#00d2ff] font-semibold">Active Digital Twin</span>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white">{assetDetail.asset.name}</h2>
                  <span className="text-xs font-mono px-2 py-0.5 bg-slate-800 rounded text-slate-400">{assetDetail.asset.id}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {assetDetail.asset.location}</span>
                  <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" /> {assetDetail.asset.plant}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Installed: {new Date(assetDetail.asset.install_date).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Health status block */}
              <div className="flex gap-4 items-center">
                <div className="text-right">
                  <span className="text-[9px] uppercase font-mono text-slate-500 font-semibold tracking-wider">Health Index</span>
                  <div className={`text-2xl font-bold font-mono ${
                    assetDetail.asset.health_score >= 85 ? "text-emerald-400" : assetDetail.asset.health_score >= 70 ? "text-amber-400" : "text-red-400"
                  }`}>
                    {assetDetail.asset.health_score}%
                  </div>
                </div>
                <div className="text-right border-l border-slate-800/80 pl-4">
                  <span className="text-[9px] uppercase font-mono text-slate-500 font-semibold tracking-wider">Failure Prob</span>
                  <div className="text-2xl font-bold font-mono text-red-400">
                    {(assetDetail.asset.failure_prob * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800/40 bg-[#070b19]/20 text-xs px-6">
              {[
                { id: "timeline", label: "Operations Timeline" },
                { id: "predictive", label: "Predictive Intelligence" },
                { id: "inspections", label: "Inspections Audit" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-3 font-semibold transition-all border-b-2 ${
                    activeTab === tab.id 
                      ? "border-cyan-500 text-cyan-400" 
                      : "border-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sub-tab view contents */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {/* Tab 1: Timeline of Events */}
              {activeTab === "timeline" && (
                <div className="relative border-l border-slate-800/80 pl-6 ml-3 space-y-6">
                  {timelineEvents.length === 0 ? (
                    <div className="text-xs text-slate-500 italic">No operations timeline logs found. Reseed database to run.</div>
                  ) : (
                    timelineEvents.map((evt: any) => {
                      const Icon = evt.icon;
                      return (
                        <div key={evt.id} className="relative">
                          {/* Node Bullet Icon */}
                          <span className={`absolute -left-[38px] top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${evt.color}`}>
                            <Icon className="w-3 h-3" />
                          </span>

                          <div className="p-4 rounded-xl border border-slate-800/60 bg-[#0c1226]/30 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-mono text-slate-500 uppercase tracking-widest text-[9px] font-semibold">{evt.type}</span>
                              <span className="text-slate-500">{evt.date.toLocaleDateString()}</span>
                            </div>
                            <h4 className="text-sm font-bold text-white">{evt.title}</h4>
                            
                            {/* Maintenance description */}
                            {evt.type === "MAINTENANCE" && (
                              <div className="text-xs text-slate-400 grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                                <div><span className="text-slate-500">Technician:</span> {evt.tech}</div>
                                <div><span className="text-slate-500">Duration:</span> {evt.duration} hrs</div>
                                <div><span className="text-slate-500">Repair Cost:</span> ${evt.cost.toFixed(2)}</div>
                                <div className="col-span-full"><span className="text-slate-500">Status:</span> <span className="text-cyan-400">{evt.status}</span></div>
                              </div>
                            )}

                            {/* Failure description */}
                            {evt.type === "FAILURE" && (
                              <div className="text-xs text-slate-400 space-y-1.5 mt-1">
                                <div><span className="text-slate-500">Reporter:</span> {evt.reporter} | Severity: <span className="text-red-400 font-bold">{evt.severity}</span></div>
                                <div className="p-2 rounded bg-red-950/10 border border-red-500/10 text-red-300 font-mono text-[11px]">{evt.description}</div>
                                <div><span className="text-slate-500 font-semibold">Root Cause:</span> {evt.root_cause}</div>
                                <div><span className="text-slate-500 font-semibold">Action Taken:</span> {evt.action_taken}</div>
                              </div>
                            )}

                            {/* Inspection description */}
                            {evt.type === "INSPECTION" && (
                              <div className="text-xs text-slate-400 space-y-1.5 mt-1">
                                <div><span className="text-slate-500">Auditor:</span> {evt.inspector} | Status: <span className={`font-bold ${evt.status === "Pass" ? "text-emerald-400" : "text-amber-400"}`}>{evt.status}</span></div>
                                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300 italic">{evt.findings}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Tab 2: Predictive Maintenance Diagnostics */}
              {activeTab === "predictive" && assetDetail.predictive_analysis && (
                <div className="space-y-6">
                  {/* ML Risk Gauge */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 rounded-xl border border-slate-800/80 bg-[#0c1226]/40 space-y-2">
                      <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Predictive Classification</span>
                      <h4 className="text-sm font-bold text-white">Risk Category</h4>
                      <div className={`text-xl font-bold uppercase ${
                        assetDetail.predictive_analysis.critical_risk === "Extreme" ? "text-red-500" : assetDetail.predictive_analysis.critical_risk === "High" ? "text-orange-400" : "text-emerald-400"
                      }`}>
                        {assetDetail.predictive_analysis.critical_risk} Risk
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-800/80 bg-[#0c1226]/40 space-y-2">
                      <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Asset Lifespan</span>
                      <h4 className="text-sm font-bold text-white">Installed Time</h4>
                      <div className="text-xl font-bold text-white font-mono">
                        {assetDetail.predictive_analysis.metrics.age_years} Years
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-800/80 bg-[#0c1226]/40 space-y-2">
                      <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Historical Cost</span>
                      <h4 className="text-sm font-bold text-white">Cumulative Cost</h4>
                      <div className="text-xl font-bold text-white font-mono">
                        ${assetDetail.predictive_analysis.metrics.maintenance_cost.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="p-5 rounded-xl border border-slate-800/80 bg-[#0c1226]/20 space-y-3">
                    <h4 className="text-sm font-bold text-white uppercase font-mono text-[#00d2ff]">AI Agent Diagnostics & Actions</h4>
                    <div className="space-y-2.5">
                      {assetDetail.predictive_analysis.recommendations.map((rec: string, i: number) => (
                        <div key={i} className="flex gap-2 text-xs text-slate-300">
                          <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Detailed Inspection Logs */}
              {activeTab === "inspections" && (
                <div className="space-y-4">
                  {assetDetail.inspection_timeline.length === 0 ? (
                    <div className="text-xs text-slate-500 italic">No formal inspection check logs found for this asset.</div>
                  ) : (
                    assetDetail.inspection_timeline.map((ins: any) => (
                      <div key={ins.id} className="p-4 rounded-xl border border-slate-800/80 bg-[#0c1226]/30 flex justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="text-sm font-bold text-white">Inspector: {ins.inspector}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase font-bold border ${
                              ins.status === "Pass" 
                                ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400" 
                                : "bg-amber-950/20 border-amber-500/20 text-amber-400"
                            }`}>
                              {ins.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed font-mono">{ins.findings}</p>
                          <div className="text-[10px] text-slate-500">
                            Cert Expiry: {new Date(ins.cert_expiry).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[9px] uppercase font-mono text-slate-500">Audit Score</span>
                          <div className="text-xl font-bold text-white font-mono">{ins.score}%</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>
          </>
        )}
      </div>

    </div>
  );
}

export default function AssetExplorerPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-slate-500 font-outfit">Loading Assets...</div>}>
      <AssetExplorerContent />
    </React.Suspense>
  );
}
