"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE } from "../config";
import { 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  FileText, 
  Building,
  RefreshCw,
  Gauge,
  Flame,
  Wrench
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from "recharts";

interface KPIs {
  asset_health_score: number;
  compliance_score: number;
  open_risks: number;
  failure_predictions: number;
  documents_indexed: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [kpis, setKpis] = useState<KPIs>({
    asset_health_score: 92.4,
    compliance_score: 88.5,
    open_risks: 12,
    failure_predictions: 4,
    documents_indexed: 312
  });
  const [isLoading, setIsLoading] = useState(true);
  const [criticalAssets, setCriticalAssets] = useState<any[]>([]);

  // Fetch KPIs on mount
  useEffect(() => {
    fetchKpis();
  }, []);

  const fetchKpis = async () => {
    setIsLoading(true);
    try {
      // Fetch KPIs
      const res = await fetch(`${API_BASE}/api/dashboard/kpis`);
      if (res.ok) {
        const data = await res.json();
        setKpis(data);
      }

      // Fetch critical assets
      const resAssets = await fetch(`${API_BASE}/api/assets?status=Critical`);
      if (resAssets.ok) {
        const dataAssets = await resAssets.json();
        setCriticalAssets(dataAssets.slice(0, 5));
      }
    } catch (e) {
      console.error("Error fetching dashboard data", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data for charts
  const monthlyTrends = [
    { name: "Jan", Health: 94, Compliance: 91, Risks: 8 },
    { name: "Feb", Health: 93, Compliance: 90, Risks: 9 },
    { name: "Mar", Health: 92, Compliance: 89, Risks: 11 },
    { name: "Apr", Health: 94, Compliance: 93, Risks: 7 },
    { name: "May", Health: 91, Compliance: 88, Risks: 14 },
    { name: "Jun", Health: kpis.asset_health_score, Compliance: kpis.compliance_score, Risks: kpis.open_risks }
  ];

  const plantBreakdown = [
    { name: "Houston Refinery", Health: 93.4, color: "#00d2ff" },
    { name: "Baton Rouge", Health: 89.2, color: "#6366f1" },
    { name: "Rotterdam Chem", Health: 94.6, color: "#c084fc" },
    { name: "Singapore Jurong", Health: 91.8, color: "#10b981" }
  ];

  const riskMatrix = [
    { name: "Pumps", Critical: 3, High: 8, Medium: 15 },
    { name: "Boilers", Critical: 1, High: 4, Medium: 9 },
    { name: "Turbines", Critical: 2, High: 3, Medium: 5 },
    { name: "Valves", Critical: 0, High: 2, Medium: 14 }
  ];

  const radarData = [
    { subject: "Vibration Loop", A: 85, fullMark: 100 },
    { subject: "Pressure Seals", A: 70, fullMark: 100 },
    { subject: "Combustion", A: 90, fullMark: 100 },
    { subject: "LDAR Leaks", A: 65, fullMark: 100 },
    { subject: "Calibration", A: 80, fullMark: 100 },
    { subject: "Structural", A: 95, fullMark: 100 }
  ];

  return (
    <div className="space-y-8 font-outfit">
      
      {/* Top Title Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Executive Command Center</h1>
          <p className="text-xs text-slate-500 mt-1">Real-time predictive analytics and risk matrices across global assets</p>
        </div>
        <button 
          onClick={fetchKpis}
          className="p-2.5 rounded-lg border border-slate-800 bg-[#070b19]/60 hover:bg-slate-800/40 text-slate-400 hover:text-white transition-all flex items-center gap-2 text-xs uppercase font-semibold font-mono"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* KPI Cards (Clickable Metrics) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        
        {/* KPI 1: Asset Health */}
        <div 
          onClick={() => router.push("/assets")}
          className="p-5 rounded-xl border border-slate-800 bg-[#0c1226]/40 hover:bg-[#0c1226]/80 glass-panel-hover cursor-pointer space-y-4"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Asset Health</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-3xl font-bold text-gradient-cyan font-mono">{kpis.asset_health_score}%</div>
            <div className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-1">Average metric health index</div>
          </div>
        </div>

        {/* KPI 2: Compliance Score */}
        <div 
          onClick={() => router.push("/compliance")}
          className="p-5 rounded-xl border border-slate-800 bg-[#0c1226]/40 hover:bg-[#0c1226]/80 glass-panel-hover cursor-pointer space-y-4"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Compliance</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[#c084fc] font-mono">{kpis.compliance_score}%</div>
            <div className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-1">Audit readiness score</div>
          </div>
        </div>

        {/* KPI 3: Open Risks */}
        <div 
          onClick={() => router.push("/rca")}
          className="p-5 rounded-xl border border-slate-800 bg-[#0c1226]/40 hover:bg-[#0c1226]/80 glass-panel-hover cursor-pointer space-y-4"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Open Incidents</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="text-3xl font-bold text-amber-400 font-mono">{kpis.open_risks}</div>
            <div className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-1">Active failure logs / events</div>
          </div>
        </div>

        {/* KPI 4: Failure Predictions */}
        <div 
          onClick={() => router.push("/assets")}
          className="p-5 rounded-xl border border-slate-800 bg-[#0c1226]/40 hover:bg-[#0c1226]/80 glass-panel-hover cursor-pointer space-y-4"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Predicted Failures</span>
            <Flame className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <div className="text-3xl font-bold text-red-400 font-mono">{kpis.failure_predictions}</div>
            <div className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-1">Assets flagged critical / offline</div>
          </div>
        </div>

        {/* KPI 5: Documents Indexed */}
        <div 
          onClick={() => router.push("/documents")}
          className="p-5 rounded-xl border border-slate-800 bg-[#0c1226]/40 hover:bg-[#0c1226]/80 glass-panel-hover cursor-pointer space-y-4"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Indexed Corpus</span>
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-3xl font-bold text-emerald-400 font-mono">{kpis.documents_indexed}</div>
            <div className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-1">SOPs, inspections, and logs</div>
          </div>
        </div>

      </div>

      {/* Row 2: Analytics Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Global Health & Compliance Timeline Trend */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-slate-800 bg-[#070b19]/60 backdrop-blur-md glass-panel space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-white font-outfit">Performance Trend</h2>
              <p className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">Asset health index vs safety compliance</p>
            </div>
            <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider font-mono">6 Month Window</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends}>
                <defs>
                  <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00d2ff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis domain={[50, 100]} stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#0c1226", border: "1px solid rgba(0,210,255,0.1)", borderRadius: "8px" }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Area type="monotone" dataKey="Health" stroke="#00d2ff" strokeWidth={2.5} fillOpacity={1} fill="url(#healthGrad)" />
                <Area type="monotone" dataKey="Compliance" stroke="#c084fc" strokeWidth={2.5} fillOpacity={1} fill="url(#compGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Regional Plant Breakdown Pie */}
        <div className="p-6 rounded-xl border border-slate-800 bg-[#070b19]/60 backdrop-blur-md glass-panel space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white font-outfit">Regional Health Distribution</h2>
            <p className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">Asset health score average per plant location</p>
          </div>
          <div className="h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={plantBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="Health"
                >
                  {plantBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} contentStyle={{ backgroundColor: "#0c1226", border: "1px solid rgba(0,210,255,0.1)", borderRadius: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500">Global Avg</span>
              <span className="text-xl font-bold font-mono text-cyan-400">{kpis.asset_health_score}%</span>
            </div>
          </div>
          {/* Custom legend */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {plantBreakdown.map((plant, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: plant.color }}></span>
                <span className="text-slate-400 truncate">{plant.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 3: Risk Matrix Bar Chart & Radar Risk Vectors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Risk Distribution by Equipment Category */}
        <div className="p-6 rounded-xl border border-slate-800 bg-[#070b19]/60 backdrop-blur-md glass-panel space-y-4">
          <div>
            <h2 className="text-base font-bold text-white font-outfit">Equipment Failure Matrix</h2>
            <p className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">Failure count distribution categorized by equipment group</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskMatrix} stackOffset="expand">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `${Math.round(val * 100)}%`} />
                <Tooltip contentStyle={{ backgroundColor: "#0c1226", border: "1px solid rgba(0,210,255,0.1)", borderRadius: "8px" }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="Critical" stackId="a" fill="#ef4444" />
                <Bar dataKey="High" stackId="a" fill="#f97316" />
                <Bar dataKey="Medium" stackId="a" fill="#eab308" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Systemic Compliance Failures Radar */}
        <div className="p-6 rounded-xl border border-slate-800 bg-[#070b19]/60 backdrop-blur-md glass-panel space-y-4">
          <div>
            <h2 className="text-base font-bold text-white font-outfit">Systemic Risk Vector</h2>
            <p className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">Vulnerability weights across compliance audits</p>
          </div>
          <div className="h-64 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" r="80%" data={radarData}>
                <PolarGrid stroke="rgba(0, 210, 255, 0.1)" />
                <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={10} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" fontSize={8} />
                <Radar name="Vulnerability Risk %" dataKey="A" stroke="#c084fc" fill="#c084fc" fillOpacity={0.2} />
                <Tooltip contentStyle={{ backgroundColor: "#0c1226", border: "1px solid rgba(0,210,255,0.1)", borderRadius: "8px" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 4: Critical Action Items table */}
      <div className="p-6 rounded-xl border border-slate-800 bg-[#070b19]/60 backdrop-blur-md glass-panel space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-white font-outfit">Critical Assets Requiring Attention</h2>
            <p className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">Top 5 assets showing lowest health metrics or offline status</p>
          </div>
          <Link href="/assets" className="text-xs text-cyan-400 hover:text-cyan-300 font-bold uppercase font-mono tracking-wider">
            Explore All Assets &rarr;
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-outfit">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-semibold uppercase">
                <th className="py-3 px-4">Asset ID</th>
                <th className="py-3 px-4">Equipment Name</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Plant</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Health Score</th>
                <th className="py-3 px-4">Failure Prob</th>
              </tr>
            </thead>
            <tbody>
              {criticalAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No critical assets flagged. Reseed the database using Judge Demo Mode to load logs.
                  </td>
                </tr>
              ) : (
                criticalAssets.map((asset) => (
                  <tr 
                    key={asset.id} 
                    onClick={() => router.push(`/assets?search=${asset.id}`)}
                    className="border-b border-slate-850 hover:bg-slate-800/20 cursor-pointer transition-all"
                  >
                    <td className="py-3 px-4 font-bold text-cyan-400">{asset.id}</td>
                    <td className="py-3 px-4 font-semibold text-white">{asset.name}</td>
                    <td className="py-3 px-4 text-slate-400">{asset.location}</td>
                    <td className="py-3 px-4 text-slate-400">{asset.plant}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        asset.status === "Offline" 
                          ? "bg-red-950/40 border border-red-500/20 text-red-400" 
                          : "bg-amber-950/40 border border-amber-500/20 text-amber-400"
                      }`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-red-400">{asset.health_score}%</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{(asset.failure_prob * 100).toFixed(1)}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
