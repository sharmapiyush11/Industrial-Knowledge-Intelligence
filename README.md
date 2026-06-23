# Industrial Brain AI
### Unified Asset & Operations Knowledge Intelligence Platform

🚀 **Live Production Demo**: [https://industrial-knowledge-intelligence-7.vercel.app](https://industrial-knowledge-intelligence-7.vercel.app)
⚡ **Live Backend API**: [https://industrial-knowledge-intelligence-7.onrender.com/docs](https://industrial-knowledge-intelligence-7.onrender.com/docs)

---

**Industrial Brain AI** is an enterprise-grade AI platform that transforms fragmented industrial operations knowledge (SOPs, P&IDs, CAD diagrams, maintenance logs, inspection checklists, and safety manuals) into a single, cohesive, searchable operations intelligence system.

Built for asset-intensive sectors (manufacturing, oil & gas, mining, chemical, and pharma), the platform combines dynamic graph networks (Neo4j), vector embeddings (ChromaDB), and custom machine learning classification models to run predictive analytics, safety gap analysis, and interactive Root Cause Analysis (RCA).

---

## 🚀 Key Innovation Highlights
1. **Zero-Configuration Standalone Mode**: Can run instantly out-of-the-box using integrated SQLite and JSON-based Graph engine simulation if active database engines (Neo4j, Postgres) or API keys are missing.
2. **True Random Forest Predictor**: Features a live Scikit-Learn training loop that fits on historical maintenance costs, vibration averages, and failure intervals to compute asset failure probabilities and health scores.
3. **Voice-Enabled RAG Copilot**: Ask questions about equipment statuses using standard keyboard input or the integrated microphone voice recognition pipeline.
4. **Interactive RCA Diagrams**: Automatically constructs step-by-step failure propagation diagrams (nodes and edges) from incident briefs.

---

## 🛠 Tech Stack
- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, Recharts, React Flow, Framer Motion
- **Backend**: FastAPI (Python), SQLAlchemy, WebSockets
- **Databases**: PostgreSQL, Neo4j Graph DB, ChromaDB Vector DB (Local SQLite fallback supported)
- **ML / Parser**: Scikit-Learn, PyMuPDF (fitz), Pandas, NumPy

---

## 📂 Project Structure
```text
c:\Users\parth\ET AI HACK
├── backend/
│   ├── agents/
│   │   ├── compliance.py          # Safety gap audits & certification tracker
│   │   ├── doc_intel.py           # PyMuPDF character parsing & entity extractor
│   │   ├── engineering_copilot.py # RAG-based search engine with citations
│   │   ├── knowledge_graph.py     # Graph relationship sync pipeline
│   │   ├── lessons_learned.py     # Recurring incident pattern detector
│   │   ├── predictive_maintenance.py # Random Forest ML model training
│   │   └── root_cause.py          # RCA flow tree nodes & edges generator
│   ├── utils/
│   │   └── seed_data.py           # Auto-generates 500 assets and 5000 logs
│   ├── database.py                # Database schemas (Postgres / SQLite)
│   ├── graph_db.py                # Neo4j connector & JSON fallback file store
│   ├── main.py                    # Entrypoint, WebSocket Alert streams
│   └── Dockerfile                 # Python backend build
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── assets/            # Digital Twin Asset Explorer
│   │       ├── compliance/        # Compliance Score & violations center
│   │       ├── copilot/           # RAG voice-enabled ChatGPT style box
│   │       ├── dashboard/         # Command Center with Recharts analytics
│   │       ├── documents/         # Upload manager & highlighted preview
│   │       ├── graph/             # React Flow Knowledge Graph visualizer
│   │       ├── rca/               # Root Cause flowchart canvas
│   │       ├── layout.tsx         # Navigation & global alert WebSockets
│   │       └── globals.css        # CSS & Glassmorphism styles
│   ├── tailwind.config.ts         # Visual tokens (electric-cyan, navy)
│   └── Dockerfile                 # Next.js builder
├── docker-compose.yml             # Orchestration profile
└── README.md                      # Documentation
```

---

## ⚙️ How to Run the Platform

### Option A: Using Docker Compose (Full Production Setup)
Initialize and run all containers (Postgres, Neo4j, ChromaDB, FastAPI Backend, Next.js Frontend) using:
```bash
docker-compose up --build
```
Once initialized:
- **Frontend App**: Access at `http://localhost:3000`
- **Backend API Docs**: Access at `http://localhost:8000/docs`

---

### Option B: Local Running (Zero-Configuration Fallback)
If Docker is not installed on your host, you can run the system locally using SQLite file fallbacks:

#### 1. Start the Backend
1. Navigate to the `backend` directory.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the uvicorn development server:
   ```bash
   uvicorn main:app --host 127.0.0.1 --port 8000
   ```
   *Note: On startup, the backend automatically initializes an `industrial_brain.db` SQLite file, generates and seeds 500 assets, 5000 maintenance logs, 200 SOPs, and 100 incident records, and fits the Random Forest classifier!*

#### 2. Start the Frontend
1. Navigate to the `frontend` directory.
2. Install packages:
   ```bash
   npm install
   ```
3. Run the Next.js dev server:
   ```bash
   npm run dev
   ```
4. Access the web dashboard at `http://localhost:3000`!

---

## 🏆 Hackathon Judges Exploration Guide
When exploring the platform, be sure to check these high-impact features:
1. **Reseed Database (Judge Demo Mode)**: Click the glowing **Judge Demo Mode** button in the sidebar. This wipes and re-seeds 5,000+ realistic records and regenerates the entire graph in under 3 seconds. Watch the real-time notification alerts pop up as this completes.
2. **Prompt the Copilot**: Ask: `"What maintenance occurred on Pump P-101 in the last year?"` or click the voice button and dictate. Note the citation card linking to maintenance log records and the 95% confidence score.
3. **Run a Root Cause Analysis**: Go to the RCA page, load the "Boiler Overheat" sample incident, and click **Analyze**. Check the generated flow diagram tracing feedwater scale deposits to the final tube rupture.
4. **Audit Readiness**: Go to the Compliance page to review safety violations, expired certificates, and documentation gaps (like missing SOPs for specific equipment types).
5. **Interactive Timelines**: Go to the Asset explorer, search for `P-101`, and navigate the Digital Twin tabs to review historical timelines of maintenance runs, inspections, and failures.

---

## 🌐 Live Production Deployments

The platform has been fully deployed to production:
- **Frontend (Vercel)**: [https://industrial-knowledge-intelligence-7.vercel.app](https://industrial-knowledge-intelligence-7.vercel.app)
- **Backend (Render)**: [https://industrial-knowledge-intelligence-7.onrender.com](https://industrial-knowledge-intelligence-7.onrender.com)
- **Interactive Swagger Docs**: [https://industrial-knowledge-intelligence-7.onrender.com/docs](https://industrial-knowledge-intelligence-7.onrender.com/docs)
