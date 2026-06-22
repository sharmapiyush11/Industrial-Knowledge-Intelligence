"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  FileText, 
  Download, 
  Activity, 
  Building,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet
} from "lucide-react";

interface AuditResult {
  audit_readiness_score: number;
  compliance_score: number;
  stats: {
    active_violations: number;
    missing_inspections: number;
    expired_certifications: number;
    sop_documentation_gaps: number;
  };
  violations: any[];
  missing_inspections: any[];
  expired_certifications: any[];
  sop_gaps: any[];
}

export default function ComplianceCenterPage() {
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedViolation, setSelectedViolation] = useState<any | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchComplianceAudit();
  }, []);

  const fetchComplianceAudit = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/compliance/audit");
      if (res.ok) {
        const data = await res.json();
        setAudit(data);
        if (data.violations.length > 0) {
          setSelectedViolation(data.violations[0]);
        }
      }
    } catch (e) {
      console.error("Error running compliance audit", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (type: string) => {
    setIsExporting(true);
    // Simulate generation delay
    await new Promise(r => setTimeout(r, 1500));
    setIsExporting(false);
    
    // Trigger mock download file
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(audit, null, 2)], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Industrial_Compliance_Audit_${type.toUpperCase()}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-8 font-outfit">
      
      {/* Top Title Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Compliance & Audit Center</h1>
          <p className="text-xs text-slate-500 mt-1">Cross-referencing SOP specifications, state safety codes, and active equipment logs</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => handleExport("excel")}
            disabled={isExporting || !audit}
            className="px-3.5 py-2.5 rounded-lg border border-slate-800 bg-[#070b19]/60 hover:bg-slate-800/40 text-slate-400 hover:text-white transition-all flex items-center gap-2 text-xs font-semibold"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export Excel
          </button>
          <button 
            onClick={() => handleExport("pdf")}
            disabled={isExporting || !audit}
            className="px-3.5 py-2.5 rounded-lg bg-[#00d2ff] hover:bg-cyan-400 text-navy-deep font-bold transition-all flex items-center gap-2 text-xs font-bold uppercase shadow-glass disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export Audit Package
          </button>
        </div>
      </div>

      {isLoading || !audit ? (
        <div className="text-center text-xs text-slate-500 py-16 flex flex-col items-center justify-center gap-2">
          <LoaderSpinner className="w-6 h-6 animate-spin text-cyan-400" />
          <span>Compiling regulatory registers...</span>
        </div>
      ) : (
        <>
          {/* Dashboard Gauges Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Gauge 1: Audit Readiness */}
            <div className="p-5 rounded-xl border border-slate-800 bg-[#0c1226]/40 glass-panel flex flex-col justify-between h-40">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Audit Readiness</span>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold text-gradient-cyan font-mono">{audit.audit_readiness_score}%</div>
                <ShieldCheck className="w-10 h-10 text-cyan-400/20" />
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                <div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: `${audit.audit_readiness_score}%` }}></div>
              </div>
            </div>

            {/* Gauge 2: Active Violations */}
            <div className="p-5 rounded-xl border border-slate-800 bg-[#0c1226]/40 glass-panel flex flex-col justify-between h-40">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Active Violations</span>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold text-red-400 font-mono">{audit.stats.active_violations}</div>
                <ShieldAlert className="w-10 h-10 text-red-500/20" />
              </div>
              <span className="text-[10px] text-red-400/80 font-bold uppercase tracking-wider">Requires correction action</span>
            </div>

            {/* Gauge 3: Missing Inspections */}
            <div className="p-5 rounded-xl border border-slate-800 bg-[#0c1226]/40 glass-panel flex flex-col justify-between h-40">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Overdue Inspections</span>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold text-amber-400 font-mono">{audit.stats.missing_inspections}</div>
                <AlertTriangle className="w-10 h-10 text-amber-500/20" />
              </div>
              <span className="text-[10px] text-amber-400/80 font-bold uppercase tracking-wider">Pending inspector visit</span>
            </div>

            {/* Gauge 4: Expired Certificates */}
            <div className="p-5 rounded-xl border border-slate-800 bg-[#0c1226]/40 glass-panel flex flex-col justify-between h-40">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Expired Certificates</span>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold text-indigo-400 font-mono">{audit.stats.expired_certifications}</div>
                <FileText className="w-10 h-10 text-indigo-500/20" />
              </div>
              <span className="text-[10px] text-indigo-400/80 font-bold uppercase tracking-wider">ASME code renewal required</span>
            </div>

          </div>

          {/* Master Detail split view: Violations log */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[500px]">
            
            {/* List */}
            <div className="lg:col-span-7 border border-slate-800 bg-[#070b19]/40 rounded-xl p-5 glass-panel flex flex-col h-full overflow-hidden">
              <div className="pb-3 border-b border-slate-800/60 mb-4 flex justify-between items-center shrink-0">
                <h3 className="text-sm font-bold text-white font-outfit uppercase">Compliance Violations Ledger</h3>
                <span className="text-[9px] font-mono text-slate-500 font-semibold uppercase">Real-time DB records</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {audit.violations.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-16 italic">No compliance flags found. Plant fully conforms to codes.</div>
                ) : (
                  audit.violations.map((viol) => (
                    <div 
                      key={viol.id}
                      onClick={() => setSelectedViolation(viol)}
                      className={`p-3.5 rounded-lg border cursor-pointer transition-all flex justify-between items-center ${
                        selectedViolation?.id === viol.id 
                          ? "bg-red-950/20 border-red-500/40 text-red-300" 
                          : "bg-[#0c1226]/30 border-slate-850 text-slate-400 hover:bg-slate-800/20"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                            viol.severity === "Critical" ? "bg-red-900/40 text-red-300 border border-red-500/30" : "bg-orange-950 text-orange-400 border border-orange-500/20"
                          }`}>
                            {viol.severity}
                          </span>
                          <span className="text-xs font-bold text-white">{viol.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[300px]">{viol.finding}</div>
                      </div>
                      <div className="text-right text-[10px] font-mono text-slate-500">
                        {viol.date}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Selected Violation Evidence Drawer */}
            <div className="lg:col-span-5 border border-slate-800 bg-[#070b19]/20 rounded-xl p-6 glass-panel flex flex-col h-full overflow-y-auto relative">
              {selectedViolation ? (
                <div className="space-y-5 text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-mono tracking-widest text-[#00d2ff] font-semibold">Violation Audit Evidence</span>
                    <h3 className="text-base font-bold text-white font-outfit mt-1">{selectedViolation.id}</h3>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Asset Tag</span>
                      <span className="text-cyan-400 font-bold font-mono">{selectedViolation.asset_id} ({selectedViolation.name})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Plant Site</span>
                      <span className="text-slate-300 font-medium">{selectedViolation.plant}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Timestamp Date</span>
                      <span className="text-slate-300 font-medium">{selectedViolation.date}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Originating Source</span>
                      <span className="text-indigo-400 font-semibold">{selectedViolation.source}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Failure Evidence findings</span>
                      <p className="p-3 bg-red-950/15 border border-red-500/10 rounded-lg text-red-300 leading-relaxed font-mono text-[11px] mt-1">{selectedViolation.finding}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-xs italic">
                  No active violation selected.
                </div>
              )}
            </div>

          </div>

          {/* Table representing documentation gaps */}
          <div className="p-6 rounded-xl border border-slate-800 bg-[#070b19]/60 backdrop-blur-md glass-panel space-y-4">
            <div>
              <h3 className="text-base font-bold text-white font-outfit">SOP Regulatory Documentation Gaps</h3>
              <p className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">Asset types requiring updated safety standards or regulatory files</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-outfit">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-semibold uppercase">
                    <th className="py-3 px-4">Gap Category</th>
                    <th className="py-3 px-4">Description Finding</th>
                    <th className="py-3 px-4">Required Action</th>
                    <th className="py-3 px-4">Severity Code</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.sop_gaps.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500 italic">No SOP gaps detected. All asset categories fully documented.</td>
                    </tr>
                  ) : (
                    audit.sop_gaps.map((gap, idx) => (
                      <tr key={idx} className="border-b border-slate-850 text-slate-300">
                        <td className="py-3 px-4 font-bold text-white">{gap.type}</td>
                        <td className="py-3 px-4 text-slate-400">{gap.details}</td>
                        <td className="py-3 px-4 text-cyan-400 italic">{gap.action_required}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950/20 border border-amber-500/20 text-amber-400 font-bold uppercase">{gap.severity}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

// Simple loader helper
function LoaderSpinner({ className }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}
import { Loader2 } from "lucide-react";
