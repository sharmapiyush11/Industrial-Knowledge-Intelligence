# Industrial Brain AI - Architecture Diagram

Here is the system data flow and multi-agent interaction schematic for the **Industrial Brain AI** platform.

```mermaid
graph TD
    %% Input Sources
    subgraph Data Sources
        SOP["SOP PDFs / Regulations"]
        Logs["CMMS Maintenance Logs"]
        Check["Inspection Checklists"]
        Incidents["Incident Breakdown Logs"]
    end

    %% Ingestion Pipeline
    subgraph Ingestion & Parse Pipeline [Document Intelligence Agent]
        OCR["OCR character parsing (PaddleOCR / fitz)"]
        Extract["Entity Extraction (Asset IDs, Dates, Risks, Regs)"]
    end

    %% Storage
    subgraph Storage Mappings
        PG[("PostgreSQL / SQLite")]
        Chroma[("ChromaDB Vector Store")]
        Neo[("Neo4j Graph Database")]
    end

    %% Agents
    subgraph Multi-Agent Intelligence Engine
        KG["Knowledge Graph Agent"]
        PM["Predictive Maintenance Agent (Random Forest Classifier)"]
        Comp["Compliance Agent (Audit Checker)"]
        RCA["RCA Agent (Flow Tree Builder)"]
        Copilot["Engineering Copilot (RAG Reranker)"]
    end

    %% Presentation Layer
    subgraph Frontend UI [Next.js 15 App Router]
        Dash["Executive Command Center"]
        Twin["Digital Twin Explorer"]
        Graph["React Flow Network Canvas"]
        Chat["Voice AI Copilot Panel"]
    end

    %% Connections
    SOP & Logs & Check & Incidents --> OCR
    OCR --> Extract
    
    Extract -->|"Structured Fields"| PG
    Extract -->|"Embeddings"| Chroma
    
    PG -->|"Read Records"| PM & Comp & RCA & Copilot
    
    KG -->|"Sync Nodes/Edges"| Neo
    PG -->|"Map Maint/Failures"| KG
    
    Neo -->|"Graph Query"| Graph
    PM -->|"Health & Risk Prob"| Twin & Dash
    Comp -->|"Readiness Score"| Dash
    RCA -->|"Flow Tree Nodes"| Graph
    Copilot -->|"Answers & Citations"| Chat
```

---

## Data Pipeline Details

1. **Document Ingestion**: Files uploaded via the **Document Manager** are routed to the **Document Intelligence Agent**. This agent runs PyMuPDF character parses or OCR to extract text content and utilizes regex rules to pull Asset tags (e.g., `P-101`), inspector names, risk parameters, and dates.
2. **Database Syncer**: Extracted data is saved as structured logs in the relational database (PostgreSQL/SQLite). The **Knowledge Graph Agent** is immediately triggered via a database transaction hook to sync these tables into the Neo4j graph nodes and relationships (e.g., `Asset -SUFFERED_FAILURE-> FailureEvent`).
3. **Reasoning Loop**:
   - The **Predictive Maintenance Agent** pulls log parameters, fits a Random Forest classifier, and calculates health indexes.
   - The **Compliance Agent** runs periodic checks against inspection dates to alert on overdue certifications.
   - The **RCA Agent** isolates breakdown reports and structures failure trees.
4. **WebSocket Broadcast**: Any new document uploads, critical risks, or database reseeds trigger a WebSocket broadcast message from the FastAPI manager to the Next.js header stream, instantly sliding in warning alert banners.
