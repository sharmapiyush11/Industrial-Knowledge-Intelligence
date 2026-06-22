# 🎥 Industrial Brain AI - Demo Video Script
Use this guide to record your 3-to-5 minute hackathon demo video. It outlines the exact visual clicks, screen actions, and matching voice narration.

---

## ⏱️ Video Timeline Overview

| Section | Timeline | Focus |
| :--- | :--- | :--- |
| **1. Hook & Dashboard Overview** | 0:00 - 0:45 | High-level pitch & command center metrics |
| **2. Digital Twin Explorer (Assets)** | 0:45 - 1:30 | Operational timelines & ML predictions |
| **3. Voice RAG Copilot** | 1:30 - 2:30 | Chatting with industrial records + citations |
| **4. Root Cause Analysis (RCA)** | 2:30 - 3:15 | Generating interactive failure flow trees |
| **5. Document Ingestion & Compliance**| 3:15 - 4:00 | Ingesting PDFs, extracting entities, safety scores |
| **6. Outro & Call to Action** | 4:00 - 4:30 | Tech stack summary & vision |

---

## 🎙️ Step-by-Step Recording Guide

### **Section 1: Hook & Dashboard Overview (0:00 - 0:45)**
* **Visual Action**:
  1. Start on the landing page (`http://localhost:3001/`). Click **"Get Started"** or navigate to `/login` and type credentials, then proceed to the Dashboard (`/dashboard`).
  2. Hover over the glowing KPI cards (Total Assets, Maintenance Logs, Audit Readiness, Critical Risks).
  3. Scroll slightly to show the interactive charts (Health score breakdown, Maintenance costs, etc.).
* **Voiceover Script**:
  > *"Welcome to Industrial Brain AI. When critical machinery fails in a factory or power plant, operators lose hours searching through paper logs, PDFs, and disconnected databases. Industrial Brain AI solves this by unifying all operational knowledge into a single, cohesive intelligence platform.*
  >
  > *Here on our executive dashboard, we see real-time KPIs summarizing our fleet's health, compliance metrics, and active risks, powered by an underlying machine learning backend."*

---

### **Section 2: Digital Twin Explorer (0:45 - 1:30)**
* **Visual Action**:
  1. Click **Assets** in the sidebar.
  2. Search for `HE-102` or `P-101` in the sidebar master list.
  3. Click on the asset to load the detail panel.
  4. Toggle through the tabs: **Timeline** (operations logs), **ML Risk Analysis** (shows failure probability, risk levels, and specific ML recommendations), and **Inspections**.
* **Voiceover Script**:
  > *"Let's explore our Asset Twin. In this screen, we can search any component across the facility—like Heat Exchanger HE-102. Under the hood, our Predictive Maintenance Agent loads historical logs and feeds them into a Scikit-Learn Random Forest Classifier.*
  >
  > *It dynamically calculates a Health Score of 82%, forecasts a 20% failure probability, and outputs specific, actionable maintenance steps to prevent unplanned downtime."*

---

### **Section 3: Voice RAG Copilot (1:30 - 2:30)**
* **Visual Action**:
  1. Click **Copilot** in the sidebar.
  2. Show the voice mic button.
  3. Type or paste this sample question: `"What maintenance was done on Heat Exchanger HE-102 in the last year?"` and press Send.
  4. Wait for the response to stream.
  5. Click on the **Citation Badge** or citation list to expand the drawer showing the exact database records and confidence score (e.g. 95%).
* **Voiceover Script**:
  > *"Next is the Engineering Copilot. Instead of querying databases or looking up files manually, engineers can ask natural language questions or use voice dictate.*
  >
  > *Let's ask about Heat Exchanger HE-102. The copilot queries our relational database and vector indexes, summarizing all relevant tasks. Crucially, it doesn't just guess; it provides an audit-ready confidence score and direct citation links to the exact maintenance logs in the database."*

---

### **Section 4: Root Cause Analysis (2:30 - 3:15)**
* **Visual Action**:
  1. Click **Root Cause (RCA)** in the sidebar.
  2. Click the sample incident **"Boiler Overheat"** in the dropdown.
  3. Click **Generate RCA**.
  4. Watch the flow diagram nodes and edges render on screen. Zoom in/out, pan, and click a node to highlight its details.
* **Voiceover Script**:
  > *"When incidents do happen, we need to understand why. On our Root Cause Analysis screen, we can select or describe a breakdown brief, and our RCA Agent constructs a step-by-step failure tree.*
  >
  > *Using React Flow, we can explore how a simple feedwater scale deposit led to tube overheating, a pressure surge, and ultimately a steam leak. This visual model helps safety teams establish preventive barriers instantly."*

---

### **Section 5: Document Ingest & Compliance (3:15 - 4:00)**
* **Visual Action**:
  1. Click **Documents** in the sidebar.
  2. Show the drag-and-drop file input.
  3. Click **Compliance** in the sidebar. Show the gauges (Audit Readiness, exp. certifications, and SOP Gaps table).
* **Voiceover Script**:
  > *"Uploading new documents is seamless. Our Document Intelligence Agent extracts equipment tags, safety regulations, and dates to populate our database.*
  >
  > *On the Compliance Center page, we track our regulatory readiness. The Compliance Agent scans our operations data to identify missing SOP documentation gaps, ensuring our facility remains fully compliant."*

---

### **Section 6: Outro & Call to Action (4:00 - 4:30)**
* **Visual Action**:
  1. Return to the Dashboard or Landing Page.
  2. Let the visual interface glow in dark mode.
* **Voiceover Script**:
  > *"Industrial Brain AI combines Next.js 15, FastAPI, Scikit-Learn, and database/graph engines to deliver a premium, production-ready SaaS interface for heavy industries. We are bridging the gap between raw data and operational excellence. Thank you!"*
