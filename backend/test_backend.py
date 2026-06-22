import os
import sys
import unittest
from sqlalchemy.orm import Session

# Add current folder to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import init_db, get_db, SessionLocal, Asset, MaintenanceLog, SOP, IncidentReport, InspectionReport
from utils import seed_data
from agents.predictive_maintenance import PredictiveMaintenanceAgent
from agents.compliance import ComplianceIntelligenceAgent
from agents.engineering_copilot import EngineeringCopilotAgent
from agents.root_cause import RootCauseAnalysisAgent

class TestIndustrialBrainBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Override DATABASE_URL to use a test SQLite db file
        os.environ["DATABASE_URL"] = "sqlite:///./test_industrial_brain.db"
        # Force JSON graph DB fallback
        os.environ["NEO4J_URI"] = ""
        
        # Init DB schema
        init_db()
        cls.db = SessionLocal()
        
        # Seed mock data
        seed_data.seed_db_data(cls.db)

    @classmethod
    def tearDownClass(cls):
        cls.db.close()
        # Clean up test database file
        if os.path.exists("./test_industrial_brain.db"):
            try:
                os.remove("./test_industrial_brain.db")
            except Exception:
                pass
        if os.path.exists("graph.json"):
            try:
                os.remove("graph.json")
            except Exception:
                pass

    def test_database_seeding(self):
        """Verifies database was seeded with correct number of items"""
        asset_count = self.db.query(Asset).count()
        maint_count = self.db.query(MaintenanceLog).count()
        sop_count = self.db.query(SOP).count()
        incident_count = self.db.query(IncidentReport).count()
        inspection_count = self.db.query(InspectionReport).count()

        print(f"\n--- Database Seeding Results ---")
        print(f"Assets: {asset_count} (Expected: 500)")
        print(f"Maintenance Logs: {maint_count} (Expected: 5000)")
        print(f"SOPs: {sop_count} (Expected: 200)")
        print(f"Incidents: {incident_count} (Expected: 100)")
        print(f"Inspections: {inspection_count} (Expected: 100)")

        self.assertEqual(asset_count, 500)
        self.assertEqual(maint_count, 5000)
        self.assertEqual(sop_count, 200)
        self.assertEqual(incident_count, 100)
        self.assertEqual(inspection_count, 100)

    def test_predictive_maintenance_ml(self):
        """Verifies Random Forest model fit and predict capabilities"""
        agent = PredictiveMaintenanceAgent()
        
        # Train model
        success = agent.train_model(self.db)
        self.assertTrue(success)
        
        # Run prediction on a sample asset P-101 (or similar in DB)
        sample_asset = self.db.query(Asset).first()
        self.assertIsNotNone(sample_asset)
        
        pred = agent.predict_asset_risk(sample_asset.id, self.db)
        print(f"\n--- ML Risk Prediction for {sample_asset.id} ---")
        print(f"Health Score: {pred['health_score']}%")
        print(f"Failure Probability: {pred['failure_probability']}")
        print(f"Risk Rating: {pred['critical_risk']}")
        print(f"Recommendations: {pred['recommendations']}")

        self.assertIn("health_score", pred)
        self.assertIn("failure_probability", pred)
        self.assertIn("critical_risk", pred)
        self.assertGreater(len(pred["recommendations"]), 0)

    def test_compliance_auditor(self):
        """Verifies safety audit compliance gap checks"""
        agent = ComplianceIntelligenceAgent()
        audit = agent.run_compliance_audit(self.db)

        print(f"\n--- Safety Audit Report ---")
        print(f"Audit Readiness Score: {audit['audit_readiness_score']}%")
        print(f"Compliance Score: {audit['compliance_score']}%")
        print(f"Violations detected: {audit['stats']['active_violations']}")
        print(f"Expired Certs: {audit['stats']['expired_certifications']}")
        print(f"SOP Documentation Gaps: {audit['stats']['sop_documentation_gaps']}")

        self.assertIn("audit_readiness_score", audit)
        self.assertIn("compliance_score", audit)
        self.assertGreater(len(audit["violations"]), 0)

    def test_copilot_questions(self):
        """Verifies RAG-style conversational responses and citations"""
        agent = EngineeringCopilotAgent()
        
        # Ask question about Pump P-101 (guaranteed to exist in seeded DB)
        res = agent.answer_question("Show maintenance records for P-101", self.db)
        
        print(f"\n--- Engineering Copilot RAG ---")
        print(f"Answer snippet: {res['answer'][:150]}...")
        print(f"Citations: {len(res['citations'])}")
        print(f"Confidence: {res['confidence_score']}")
        print(f"Followups: {res['suggested_questions']}")

        self.assertIn("answer", res)
        self.assertGreater(len(res["citations"]), 0)
        self.assertEqual(res["confidence_score"], 0.95)

    def test_root_cause_analysis(self):
        """Verifies RCA tree node-edge structures for React Flow"""
        agent = RootCauseAnalysisAgent()
        res = agent.analyze_incident(
            "Suction blockage trip", 
            "Water drum scale deposits blocked feedwater injection valves, causing dry boiling, high heat concentrations, and ultimate tube wall rupture.", 
            "B-103", 
            self.db
        )

        print(f"\n--- Root Cause Analysis Flow Tree ---")
        print(f"Flow nodes: {len(res['flow_graph']['nodes'])}")
        print(f"Flow edges: {len(res['flow_graph']['edges'])}")
        print(f"Recommendations: {len(res['recommendations'])}")

        self.assertEqual(len(res["flow_graph"]["nodes"]), 5)
        self.assertEqual(len(res["flow_graph"]["edges"]), 5)
        self.assertGreater(len(res["recommendations"]), 0)

if __name__ == "__main__":
    unittest.main()
