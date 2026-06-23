import random
import datetime
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from database import Asset, MaintenanceLog, SOP, InspectionReport, IncidentReport, User
import graph_db
import hashlib

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def seed_db_data(db: Session):
    # Check if we already have data
    if db.query(Asset).count() > 0:
        print("Database already seeded. Skipping...")
        return

    print("Seeding database... (500 Assets, 5000 Maintenance Logs, 200 SOPs, 100 Inspections, 100 Incidents)")

    # 0. Seed Users
    roles = ["Admin", "Plant Manager", "Engineer", "Technician", "Auditor"]
    for role in roles:
        username = role.lower().replace(" ", "")
        user = User(
            username=username,
            email=f"{username}@industrialbrain.ai",
            password_hash=hash_password("password123"),
            role=role
        )
        db.add(user)
    db.commit()

    # 1. Seed Assets
    plants = ["Houston Refinery", "Baton Rouge Petrochemical", "Rotterdam Chemical", "Singapore Jurong Plant"]
    asset_types = ["Pump", "Compressor", "Boiler", "Gas Turbine", "Centrifuge", "Heat Exchanger", "Storage Tank", "Control Valve"]
    locations = ["Zone A-1", "Zone A-2", "Zone B-1", "Zone B-2", "Utility Block", "Process Block 1", "Process Block 2", "Tank Farm"]
    
    status_options = ["Operational", "Operational", "Operational", "Operational", "Under Maintenance", "Critical", "Offline"]
    risk_options = ["Low", "Low", "Medium", "Medium", "High", "Extreme"]

    assets_list = []
    # Let's seed 500 assets
    for i in range(1, 501):
        atype = random.choice(asset_types)
        prefix = atype[:2].upper()
        asset_id = f"{prefix}-{100 + i}"
        name = f"{atype} {asset_id}"
        plant = random.choice(plants)
        loc = random.choice(locations)
        status = random.choice(status_options)
        
        # Determine risk and scores based on status
        if status == "Operational":
            health = random.uniform(85.0, 100.0)
            failure_p = random.uniform(0.01, 0.15)
            risk = "Low" if health > 92 else "Medium"
        elif status == "Under Maintenance":
            health = random.uniform(60.0, 84.0)
            failure_p = random.uniform(0.15, 0.40)
            risk = "Medium"
        elif status == "Critical":
            health = random.uniform(30.0, 59.0)
            failure_p = random.uniform(0.40, 0.85)
            risk = "High"
        else: # Offline
            health = random.uniform(0.0, 29.0)
            failure_p = random.uniform(0.85, 0.99)
            risk = "Extreme"

        install_age_days = random.randint(100, 4000)
        install_dt = datetime.datetime.utcnow() - datetime.timedelta(days=install_age_days)

        asset = Asset(
            id=asset_id,
            name=name,
            type=atype,
            location=loc,
            plant=plant,
            status=status,
            health_score=round(health, 2),
            failure_prob=round(failure_p, 4),
            critical_risk=risk,
            install_date=install_dt
        )
        db.add(asset)
        assets_list.append(asset)
        
        # Seed into Knowledge Graph
        graph_db.add_node(asset_id, "Asset", {
            "name": name,
            "type": atype,
            "plant": plant,
            "status": status,
            "health_score": round(health, 2),
            "critical_risk": risk
        }, save=False)

    db.commit()

    # 2. Seed SOPs
    sop_categories = ["Maintenance", "Safety", "Operations", "Compliance"]
    sop_procedures = {
        "Maintenance": [
            ("Centrifugal Pump Alignment SOP", "Procedure for laser-aligning shaft and motor couplings to minimize vibration."),
            ("Compressor Seal Kit Replacement", "Step-by-step instructions for replacing dry gas seals on high-pressure compressors."),
            ("Heat Exchanger Tube Bundle Cleaning", "Procedure for high-pressure hydro-blasting and eddy current inspection of tubes."),
            ("Valve Actuator Calibration Procedure", "Standard calibration of pneumatic and digital valve positioners for control loops.")
        ],
        "Safety": [
            ("Boiler Emergency Blowdown SOP", "Safety isolation protocol and high-pressure steam blowdown sequence during overpressure."),
            ("Confined Space Entry Safety Protocol", "Permit and gas testing checklist before entering storage vessel interior chambers."),
            ("Lockout Tagout (LOTO) Energy Isolation", "Standard rules for locking electrical, hydraulic, and process line energy sources.")
        ],
        "Operations": [
            ("Gas Turbine Startup Checklist", "Pre-start check, purge cycle, ignition sequence, and synchronization procedure."),
            ("Storage Tank Level Control SOP", "Operating guidelines for dual-redundant radar level indicators and emergency alarms.")
        ],
        "Compliance": [
            ("EPA Fugitive Emissions Monitoring Guide", "Standard leak detection and repair (LDAR) rules and reporting standards."),
            ("Boiler Annual Certification Compliance Check", "State and federal checklist for boiler safety valves and flue emissions tests.")
        ]
    }

    sop_list = []
    # Seed 200 SOPs (using combinations or repeating standard ones)
    for i in range(1, 201):
        cat = random.choice(sop_categories)
        titles = sop_procedures[cat]
        base_title, base_desc = random.choice(titles)
        sop_id = f"SOP-{1000 + i}"
        title = f"{base_title} - Rev {random.choice(['A','B','C'])} ({sop_id})"
        content = f"Title: {title}\nCategory: {cat}\n\n1. SCOPE AND APPLICATION\n{base_desc}\n\n2. PREREQUISITES & SAFETY EQUIPMENT\n- Standard PPE (Hardhat, steel-toed boots, goggles, gloves)\n- LOTO Permit required\n- Gas sniffer if entering enclosed areas\n\n3. DETAILED PROCEDURAL STEPS\n- Step 3.1: Complete pre-work risk assessment.\n- Step 3.2: Isolate power source and depressurize system.\n- Step 3.3: Perform standard action specified in technical manual.\n- Step 3.4: Re-align, pressure test, and remove isolation tags.\n\n4. RECORD KEEPING AND AUDIT compliance\n- Log completion in CMMS. Save calibration file."
        
        sop = SOP(
            id=sop_id,
            title=title,
            content=content,
            category=cat,
            version=f"{random.randint(1,4)}.{random.randint(0,9)}",
            last_updated=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(10, 365)),
            file_path=f"/docs/sops/{sop_id}.pdf"
        )
        db.add(sop)
        sop_list.append(sop)
        
        # Add to graph
        graph_db.add_node(sop_id, "SOP", {
            "title": title,
            "category": cat,
            "version": sop.version
        }, save=False)
    db.commit()

    # Link some Assets to SOPs in the graph
    for asset in assets_list:
        # Link asset to 1 or 2 random SOPs
        for _ in range(random.randint(1, 2)):
            rel_sop = random.choice(sop_list)
            graph_db.add_relationship(asset.id, rel_sop.id, "GOVERNED_BY", save=False)

    # 3. Seed Maintenance Logs
    technicians = ["John Doe", "Jane Smith", "Mike Kowalski", "Carlos Santana", "Yuki Tanaka", "Ahmed Ali", "Pierre Dubois"]
    maintenance_activities = [
        "Vibration analysis and bearing lubrication.",
        "Replaced worn mechanical seals and O-rings.",
        "Calibrated transmitter and cleaned valve ports.",
        "Inspected burner assembly and adjusted combustion air-fuel ratio.",
        "Performed shaft laser alignment and motor torque test.",
        "Replaced auxiliary oil filter and checked oil level.",
        "Tightened casing bolts and inspected gaskets for minor leaks.",
        "Replaced rotor stator blades and cleaned intake filter.",
        "Pneumatic pressure leak test and safety valve test."
    ]

    print("Generating 5000 Maintenance Logs...")
    for i in range(1, 5001):
        asset = random.choice(assets_list)
        tech = random.choice(technicians)
        act = random.choice(maintenance_activities)
        cost = random.uniform(150.0, 8500.0)
        dur = random.uniform(1.0, 12.0)
        status = "Completed" if random.random() < 0.95 else "Failed"
        
        days_ago = random.randint(1, 1000)
        log_dt = datetime.datetime.utcnow() - datetime.timedelta(days=days_ago)

        log = MaintenanceLog(
            asset_id=asset.id,
            activity=act,
            cost=round(cost, 2),
            duration_hours=round(dur, 1),
            technician=tech,
            timestamp=log_dt,
            status=status
        )
        db.add(log)
        
    db.commit()

    # Link Personnel to Maintenance Activities in graph
    for tech in set(technicians):
        graph_db.add_node(tech.lower().replace(" ", "_"), "Personnel", {
            "name": tech,
            "role": "Maintenance Technician"
        }, save=False)

    # Add a sample of relationships to graph (not all 5000 logs to avoid over-crowding, but a representative subset)
    sample_assets_for_logs = random.sample(assets_list, 150)
    for asset in sample_assets_for_logs:
        # Get its logs
        logs = db.query(MaintenanceLog).filter_by(asset_id=asset.id).limit(2).all()
        for log in logs:
            log_node_id = f"ML-{log.id}"
            graph_db.add_node(log_node_id, "MaintenanceRecord", {
                "activity": log.activity,
                "status": log.status,
                "cost": log.cost,
                "date": log.timestamp.strftime("%Y-%m-%d")
            }, save=False)
            graph_db.add_relationship(asset.id, log_node_id, "HAS_MAINTENANCE", save=False)
            tech_node_id = log.technician.lower().replace(" ", "_")
            graph_db.add_relationship(tech_node_id, log_node_id, "PERFORMED", save=False)

    # 4. Seed Inspection Reports
    inspectors = ["Alice Vance (Auditor)", "Bob Builder (Compliance)", "Charlie Green (Safety Lead)", "Diana Prince (Chief Inspector)"]
    findings_pool = [
        "Normal operation. No degradation detected. Metal thickness tests within safety limits.",
        "Minor corrosion detected on casing base. Structural integrity is intact, monitor next cycle.",
        "High vibration levels in bearing housing. Exceeds standard ISO 10816 limits. Action required.",
        "Flue gas temperature exceeds nominal limits. Potential scale buildup in boiler tubes. Decalcification recommended.",
        "Fugitive methane emissions detected at seal flange (15 ppm). Replaced seal gland packing.",
        "Overpressure safety valve cert is expiring. Test scheduled within two weeks.",
        "Hydraulic control pressure shows pressure drops. Hose degradation noted."
    ]

    print("Generating 100 Inspection Reports...")
    inspections_list = []
    for i in range(1, 101):
        asset = random.choice(assets_list)
        insp = random.choice(inspectors)
        findings = random.choice(findings_pool)
        
        # Decide status and score based on findings
        if "Normal" in findings:
            score = random.uniform(90.0, 100.0)
            status = "Pass"
        elif "Minor" in findings or "expiring" in findings:
            score = random.uniform(75.0, 89.0)
            status = "Pass"
        else:
            score = random.uniform(40.0, 74.0)
            status = "Flagged" if score > 60 else "Fail"

        days_ago = random.randint(5, 365)
        insp_dt = datetime.datetime.utcnow() - datetime.timedelta(days=days_ago)
        expiry_dt = insp_dt + datetime.timedelta(days=365)

        report = InspectionReport(
            asset_id=asset.id,
            inspector=insp,
            findings=findings,
            score=round(score, 2),
            timestamp=insp_dt,
            status=status,
            cert_expiry=expiry_dt
        )
        db.add(report)
        inspections_list.append(report)
    db.commit()

    # Link Inspection reports in graph
    for rpt in inspections_list:
        rpt_node_id = f"IR-{rpt.id}"
        graph_db.add_node(rpt_node_id, "InspectionReport", {
            "inspector": rpt.inspector,
            "score": rpt.score,
            "status": rpt.status,
            "findings": rpt.findings[:60] + "...",
            "expiry": rpt.cert_expiry.strftime("%Y-%m-%d")
        }, save=False)
        graph_db.add_relationship(rpt.asset_id, rpt_node_id, "HAS_INSPECTION", save=False)
        
        # If inspection is "Flagged" or "Fail", link to compliance check
        if rpt.status in ["Fail", "Flagged"]:
            graph_db.add_relationship(rpt_node_id, "COMP-VIOLATION", "VIOLATED_COMPLIANCE", save=False)

    # Seed global Compliance Violation Node
    graph_db.add_node("COMP-VIOLATION", "ComplianceRequirement", {
        "title": "Industrial Environmental and Emissions Safety Compliance (Section 12)",
        "regulatory_ref": "EPA Code 40 CFR / ASME Section I",
        "description": "Compliance limits governing safety valve operations, leak tolerances, and boiler pressure vessels."
    }, save=False)

    # 5. Seed Incident Reports
    incident_types = [
        ("Loss of Prime / Air Lock in Pump Casing", "Pump P-101 suffered loss of suction prime, causing dry run vibration and mechanical seal rupture.", "Critical", "Dry running without lubrication due to upstream suction blockage.", "Cleared blockage, replaced seals, updated start procedures."),
        ("Compressor Dry Gas Seal Blowby", "Compressor C-15 experienced high seal leak alarm, triggering immediate automatic ESD.", "Critical", "Contamination of barrier gas with crude hydrocarbons.", "Purged barrier filter line, replaced seals, cleaned valve loops."),
        ("Boiler Steam Drum Tube Rupture", "Boiler B-12 tube rupture leading to sudden steam pressure drop and boiler trip.", "Critical", "Accelerated scale thickness leading to localized thermal hot spots.", "Re-tubed process bundle, descaled entire drum chamber, modified feed chemical dosing."),
        ("Gas Turbine High Exhaust Temp Excursion", "Turbine G-102 high exhaust spread trip during peak generation load.", "High", "Fouled turbine fuel nozzles causing non-uniform fuel combustion.", "Cleaned fuel nozzles, replaced exhaust thermocouple, ran borescope scan."),
        ("Control Valve Actuator Leakage", "Control Valve V-302 stuck at 42% travel, causing minor glycol temperature drift.", "Medium", "Diaphragm rupture in pneumatic valve actuator head.", "Replaced actuator internal diaphragm and recalibrated post-isolation.")
    ]

    print("Generating 100 Incident Reports...")
    for i in range(1, 101):
        asset = random.choice(assets_list)
        base_title, desc, severity, root_cause, action = random.choice(incident_types)
        
        title = f"{base_title} at {asset.id}"
        days_ago = random.randint(10, 730)
        inc_dt = datetime.datetime.utcnow() - datetime.timedelta(days=days_ago)
        reporter = random.choice(["Carlos Santana (Shift Supervisor)", "Ahmed Ali (Lead operator)", "Alice Vance (Auditor)"])

        inc = IncidentReport(
            title=title,
            description=desc,
            asset_id=asset.id,
            severity=severity,
            root_cause=root_cause,
            action_taken=action,
            timestamp=inc_dt,
            reporter=reporter
        )
        db.add(inc)
        
    db.commit()

    # Seed dynamic Failure nodes in graph for first few incidents
    incidents = db.query(IncidentReport).limit(30).all()
    for inc in incidents:
        inc_node_id = f"INC-{inc.id}"
        graph_db.add_node(inc_node_id, "FailureEvent", {
            "title": inc.title,
            "severity": inc.severity,
            "date": inc.timestamp.strftime("%Y-%m-%d"),
            "root_cause": inc.root_cause
        }, save=False)
        graph_db.add_relationship(inc.asset_id, inc_node_id, "SUFFERED_FAILURE", save=False)
        
        # Link failure to specific SOP if applicable
        if "SOP" in inc.description or random.random() < 0.3:
            random_sop = random.choice(sop_list)
            graph_db.add_relationship(inc_node_id, random_sop.id, "REQUIRES_PROCEDURE", save=False)

    # Save to local store fallback once at the end of seeding
    graph_db.local_store.save()

    print("Database seeding completed successfully!")
