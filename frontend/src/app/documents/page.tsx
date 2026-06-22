"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Upload, 
  Search, 
  CheckCircle, 
  Loader2, 
  Eye, 
  Tag, 
  Calendar,
  AlertTriangle,
  FileCode,
  Terminal,
  Activity
} from "lucide-react";
import { useRouter } from "next/navigation";

interface DocumentItem {
  id: string;
  title: string;
  type: string;
  category: string;
  date: string;
  file_path: string;
}

export default function DocumentManagementPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  
  // Upload States
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [docType, setDocType] = useState("SOP");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState("");
  
  // Ingested Detail State
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/documents/list");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
        if (data.length > 0 && !selectedDocId) {
          handleSelectDoc(data[0]);
        }
      }
    } catch (e) {
      console.error("Error loading document list", e);
    }
  };

  const handleSelectDoc = async (doc: DocumentItem) => {
    setSelectedDocId(doc.id);
    setIsLoadingDetail(true);
    
    // Simulate loading exact document details/mock parsed layout
    setTimeout(() => {
      // Create rich mock text with entities for presentation highlights
      let text = "";
      let entities: any = { asset_ids: [], dates: [], risk_levels: [], regulations: [], personnel: [] };

      if (doc.type === "SOP") {
        text = `Title: ${doc.title}\nCategory: Operations Standards\nDoc Ref: ${doc.id}\n\n1.0 PURPOSE AND SCOPE\nThis procedure outlines safety regulations and check sequences for pump station seals. Highly relevant to centrifugal pumps like Pump P-101 and Turbine G-102. Last reviewed on 2026-06-22.\n\n2.0 SAFETY REQUIREMENTS\n- Standard PPE, including flame-resistant clothing.\n- Isolation via LOTO permit standard 43A.\n- Must follow EPA Section 12 emissions standard.\n\n3.0 PROCEDURE STEPS\n- Inspect casing alignment.\n- Repack seal glands and check oil lines.\n- Run pressure test up to 150 PSI. Check for leak anomalies.`;
        entities = {
          asset_ids: ["P-101", "G-102"],
          dates: ["2026-06-22"],
          risk_levels: ["Medium"],
          regulations: ["EPA"],
          personnel: ["Operator"]
        };
      } else if (doc.type === "Inspection") {
        text = `INSPECTION REPORT FILE: ${doc.id}\nEquipment Reference: Compressor C-15\nInspector: Alice Vance\nDate: 2026-06-22\nStatus: Flagged\n\nEXECUTIVE FINDINGS:\nVisual inspection of Compressor C-15 casing showed minor oil accumulation around seal loops. Structural weld inspection passed. Carbon monoxide emissions limits complied with standard regulations.\n\nMEASURED PARAMETERS:\n- Shaft vibration: 6.2 mm/s (Warning threshold: 5.0 mm/s)\n- Case Temp: 85C (Normal)\n- Air flow delta: 12% drop. Decalcification recommended on next turnaround.`;
        entities = {
          asset_ids: ["C-15"],
          dates: ["2026-06-22"],
          risk_levels: ["High"],
          regulations: ["ISO 10816"],
          personnel: ["Alice Vance"]
        };
      } else {
        text = `INCIDENT BRIEF REPORT: ${doc.id}\nIncident Location: Houston Refinery Zone A\nAsset: Boiler B-12\nDate: 2026-06-22\nReporter: Carlos Santana\nSeverity: Critical\n\nINCIDENT SUMMARY:\nBoiler B-12 suffered loss of feedwater pressure leading to drum overheating and localized steam tube rupture. Safety ESD trip triggered automatically. Control operator successfully isolated boiler drum.\n\nROOT CAUSE IDENTIFIED:\nThermal exhaustion due to water scale build-up inside bottom header tubes. Corrosion scales blocked auxiliary flow feed valve.`;
        entities = {
          asset_ids: ["B-12"],
          dates: ["2026-06-22"],
          risk_levels: ["Critical"],
          regulations: ["ASME Section I"],
          personnel: ["Carlos Santana"]
        };
      }

      setSelectedDoc({
        ...doc,
        text,
        entities
      });
      setIsLoadingDetail(false);
    }, 400);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload) return;

    setIsUploading(true);
    setUploadProgress(10);
    setUploadStep("Establishing secure CMMS endpoint...");

    // Step-by-step progress bars simulation
    const steps = [
      { progress: 30, step: "Extracting file metadata..." },
      { progress: 60, step: "Running OCR engine (PaddleOCR)..." },
      { progress: 85, step: "Compiling entity extraction (Asset IDs, dates)..." },
      { progress: 95, step: "Syncing Neo4j relationship paths..." },
    ];

    for (const s of steps) {
      await new Promise(r => setTimeout(r, 600));
      setUploadProgress(s.progress);
      setUploadStep(s.step);
    }

    // Call API
    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append("doc_type", docType);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        setUploadProgress(100);
        setUploadStep("Ingest successfully completed!");
        await new Promise(r => setTimeout(r, 500));
        setFileToUpload(null);
        fetchDocuments();
      }
    } catch (err) {
      console.error(err);
      setUploadStep("Upload error");
    } finally {
      setIsUploading(false);
    }
  };

  // Helper to color code parsed entity tags
  const renderHighlightedText = (text: string, entities: any) => {
    if (!text) return "";
    let highlighted = text;
    
    // Simple word replacements to add highlight styling
    entities.asset_ids.forEach((id: string) => {
      highlighted = highlighted.replace(new RegExp(`\\b${id}\\b`, "g"), `<span class="bg-cyan-950 text-cyan-400 font-bold px-1 rounded border border-cyan-500/30">${id}</span>`);
    });
    
    entities.dates.forEach((d: string) => {
      highlighted = highlighted.replace(new RegExp(`\\b${d}\\b`, "g"), `<span class="bg-indigo-950 text-indigo-400 font-bold px-1 rounded border border-indigo-500/30">${d}</span>`);
    });

    entities.risk_levels.forEach((r: string) => {
      highlighted = highlighted.replace(new RegExp(`\\b${r}\\b`, "g"), `<span class="bg-red-950 text-red-400 font-bold px-1 rounded border border-red-500/30">${r}</span>`);
    });

    return <div className="whitespace-pre-wrap leading-relaxed font-mono" dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  const filteredDocs = documents.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-10rem)] flex gap-6 font-outfit relative">
      
      {/* Left panel: Document List & Upload Form */}
      <div className="w-96 flex flex-col gap-4 border-r border-slate-800/80 pr-6 shrink-0 h-full overflow-hidden">
        
        {/* Ingestion Upload Card */}
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0c1226]/40 glass-panel space-y-4">
          <div className="font-bold text-xs uppercase text-slate-400 flex items-center gap-2"><Upload className="w-4 h-4 text-cyan-400" /> Ingest New Document</div>
          
          <form onSubmit={handleFileUpload} className="space-y-3">
            <div>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full bg-[#070b19] border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="SOP">Standard Operating Procedure (SOP)</option>
                <option value="Inspection">Inspection Report</option>
                <option value="Incident">Incident Breakdown Report</option>
              </select>
            </div>

            <div className="border border-dashed border-slate-800 hover:border-slate-700 rounded-lg p-4 text-center cursor-pointer relative bg-[#070b19]/30">
              <input 
                type="file" 
                required
                onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <FileCode className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <div className="text-[10px] text-slate-400 font-bold">
                {fileToUpload ? fileToUpload.name : "Select PDF / TXT file"}
              </div>
              <span className="text-[8px] text-slate-600 block mt-1">Max capacity 15MB</span>
            </div>

            <button
              type="submit"
              disabled={isUploading || !fileToUpload}
              className="w-full py-2.5 rounded-lg bg-[#00d2ff] hover:bg-cyan-400 text-navy-deep font-bold uppercase text-[10px] tracking-wider transition-all disabled:opacity-50"
            >
              Start Pipeline Ingest
            </button>
          </form>

          {/* Upload Progress Loader */}
          {isUploading && (
            <div className="p-3 rounded-lg bg-[#070b19] border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400 flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin text-cyan-400" /> {uploadStep}</span>
                <span className="font-bold text-white">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-[#00d2ff] h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Filter Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input 
            type="text"
            placeholder="Search document corpus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#070b19]/60 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-[#f3f4f6] placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all glass-panel"
          />
        </div>

        {/* Document List */}
        <div className="flex-grow overflow-y-auto space-y-2 pr-1">
          {filteredDocs.map((doc) => (
            <div 
              key={doc.id}
              onClick={() => handleSelectDoc(doc)}
              className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${
                selectedDocId === doc.id 
                  ? "bg-gradient-to-r from-cyan-950/30 to-slate-900/30 border-cyan-500/40 text-cyan-400" 
                  : "bg-[#0c1226]/30 border-slate-850 text-slate-300 hover:bg-slate-800/20"
              }`}
            >
              <FileText className={`w-5 h-5 shrink-0 ${doc.type === "SOP" ? "text-purple-400" : doc.type === "Inspection" ? "text-indigo-400" : "text-red-400"}`} />
              <div className="min-w-0 flex-grow">
                <div className="text-xs font-bold truncate text-white">{doc.title}</div>
                <div className="flex justify-between text-[9px] text-slate-500 font-semibold uppercase tracking-wider mt-1">
                  <span>{doc.type}</span>
                  <span>{doc.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel: Side-by-Side Document Viewer */}
      <div className="flex-1 bg-[#070b19]/40 rounded-xl border border-slate-800/80 glass-panel flex flex-col h-full overflow-hidden">
        {isLoadingDetail || !selectedDoc ? (
          <div className="flex-grow flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
            <Eye className="w-8 h-8 animate-pulse text-cyan-500" />
            <span>Parsing document characters...</span>
          </div>
        ) : (
          <>
            {/* Header Viewer properties */}
            <div className="p-6 border-b border-slate-800/60 bg-[#0c1226]/40 flex justify-between items-start gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#00d2ff] font-semibold">{selectedDoc.type} Document Profile</span>
                <h2 className="text-base font-bold text-white leading-tight">{selectedDoc.title}</h2>
                <div className="flex gap-4 text-[10px] text-slate-400 font-mono mt-1">
                  <span>REF: {selectedDoc.id}</span>
                  <span>INGEST DATE: {selectedDoc.date}</span>
                </div>
              </div>

              {/* Action shortcuts */}
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/copilot?search=${selectedDoc.id}`)}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold text-cyan-400 hover:text-white transition-all flex items-center gap-1.5"
                >
                  <Terminal className="w-3.5 h-3.5" /> Prompt Copilot
                </button>
                {selectedDoc.entities.asset_ids.length > 0 && (
                  <button
                    onClick={() => router.push(`/assets?search=${selectedDoc.entities.asset_ids[0]}`)}
                    className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold text-indigo-400 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <Activity className="w-3.5 h-3.5" /> Open Asset Twin
                  </button>
                )}
              </div>
            </div>

            {/* Ingested OCR Text Snippet Viewer */}
            <div className="flex-grow p-6 overflow-y-auto bg-[#030712]/40 text-xs border-b border-slate-800/60">
              <div className="font-semibold text-slate-500 uppercase font-mono tracking-wider mb-3">Ingested OCR Character Text</div>
              <div className="p-4 rounded-xl border border-slate-850 bg-[#0c1226]/30">
                {renderHighlightedText(selectedDoc.text, selectedDoc.entities)}
              </div>
            </div>

            {/* Extracted Entity Drawer */}
            <div className="p-6 bg-[#0c1226]/40 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <span className="text-[9px] uppercase font-mono text-slate-500 block mb-1">Asset ID Mappings</span>
                {selectedDoc.entities.asset_ids.length === 0 ? (
                  <span className="text-[10px] text-slate-600">None parsed</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDoc.entities.asset_ids.map((id: string) => (
                      <span key={id} className="px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 font-mono text-[10px] font-bold">{id}</span>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <span className="text-[9px] uppercase font-mono text-slate-500 block mb-1">Risk Indexes</span>
                {selectedDoc.entities.risk_levels.length === 0 ? (
                  <span className="text-[10px] text-slate-600">None parsed</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDoc.entities.risk_levels.map((r: string) => (
                      <span key={r} className="px-2 py-0.5 rounded bg-red-950/40 border border-red-500/20 text-red-400 font-mono text-[10px] font-bold">{r}</span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <span className="text-[9px] uppercase font-mono text-slate-500 block mb-1">Regulatory Standards</span>
                {selectedDoc.entities.regulations.length === 0 ? (
                  <span className="text-[10px] text-slate-600">None parsed</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDoc.entities.regulations.map((reg: string) => (
                      <span key={reg} className="px-2 py-0.5 rounded bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 font-mono text-[10px] font-bold">{reg}</span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <span className="text-[9px] uppercase font-mono text-slate-500 block mb-1">Personnel</span>
                {selectedDoc.entities.personnel.length === 0 ? (
                  <span className="text-[10px] text-slate-600">None parsed</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDoc.entities.personnel.map((p: string) => (
                      <span key={p} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px] font-bold">{p}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
