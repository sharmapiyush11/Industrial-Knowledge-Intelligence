import os
import json
import logging

logger = logging.getLogger(__name__)

NEO4J_URI = os.getenv("NEO4J_URI", "")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")

class JSONGraphStore:
    def __init__(self, filepath="graph.json"):
        self.filepath = filepath
        self.nodes = {}
        self.edges = []
        self.load()

    def load(self):
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, "r") as f:
                    data = json.load(f)
                    self.nodes = data.get("nodes", {})
                    self.edges = data.get("edges", [])
            except Exception as e:
                logger.error(f"Error loading local graph store: {e}")
                self.nodes = {}
                self.edges = []
        else:
            self.nodes = {}
            self.edges = []

    def save(self):
        try:
            with open(self.filepath, "w") as f:
                json.dump({"nodes": self.nodes, "edges": self.edges}, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving local graph store: {e}")

    def add_node(self, node_id, label, properties, save=True):
        self.nodes[str(node_id)] = {
            "id": str(node_id),
            "label": label,
            "properties": properties
        }
        if save:
            self.save()

    def add_relationship(self, source_id, target_id, rel_type, properties=None, save=True):
        source_id = str(source_id)
        target_id = str(target_id)
        # Check if relationship already exists
        exists = False
        for edge in self.edges:
            if edge["source"] == source_id and edge["target"] == target_id and edge["type"] == rel_type:
                exists = True
                break
        if not exists:
            self.edges.append({
                "source": source_id,
                "target": target_id,
                "type": rel_type,
                "properties": properties or {}
            })
            if save:
                self.save()

    def get_nodes(self):
        return list(self.nodes.values())

    def get_edges(self):
        return self.edges

    def clear(self):
        self.nodes = {}
        self.edges = []
        self.save()

# Global local store fallback
local_store = JSONGraphStore()

# Neo4j Driver Connection setup if URL exists
driver = None
if NEO4J_URI:
    try:
        # pyrefly: ignore [missing-import]
        from neo4j import GraphDatabase
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        logger.info("Connected to Neo4j successfully.")
    except Exception as e:
        logger.error(f"Failed to connect to Neo4j: {e}. Falling back to local store.")
        driver = None

def add_node(node_id, label, properties, save=True):
    # Always write to local store fallback
    local_store.add_node(node_id, label, properties, save)
    
    if driver:
        try:
            with driver.session() as session:
                query = (
                    f"MERGE (n:{label} {{id: $id}}) "
                    "SET n += $properties "
                    "RETURN n"
                )
                session.run(query, id=str(node_id), properties=properties)
        except Exception as e:
            logger.error(f"Neo4j add_node error: {e}")

def add_relationship(source_id, target_id, rel_type, properties=None, save=True):
    local_store.add_relationship(source_id, target_id, rel_type, properties, save)
    
    if driver:
        try:
            with driver.session() as session:
                query = (
                    f"MATCH (a {{id: $source_id}}), (b {{id: $target_id}}) "
                    f"MERGE (a)-[r:{rel_type}]->(b) "
                    "SET r += $properties "
                    "RETURN r"
                )
                session.run(query, source_id=str(source_id), target_id=str(target_id), properties=properties or {})
        except Exception as e:
            logger.error(f"Neo4j add_relationship error: {e}")

def get_graph_data():
    if driver:
        try:
            nodes = []
            edges = []
            with driver.session() as session:
                # Fetch all nodes
                result_nodes = session.run("MATCH (n) RETURN n")
                for record in result_nodes:
                    node = record["n"]
                    label = list(node.labels)[0] if node.labels else "Asset"
                    nodes.append({
                        "id": node.get("id"),
                        "label": label,
                        "properties": dict(node)
                    })
                # Fetch all relationships
                result_rels = session.run("MATCH (a)-[r]->(b) RETURN a.id, b.id, type(r), r")
                for record in result_rels:
                    edges.append({
                        "source": record["a.id"],
                        "target": record["b.id"],
                        "type": record["type(r)"],
                        "properties": dict(record["r"])
                    })
            return {"nodes": nodes, "edges": edges}
        except Exception as e:
            logger.error(f"Neo4j get_graph_data error: {e}. Returning local store.")
            return {"nodes": local_store.get_nodes(), "edges": local_store.get_edges()}
    else:
        return {"nodes": local_store.get_nodes(), "edges": local_store.get_edges()}

def clear_graph():
    local_store.clear()
    if driver:
        try:
            with driver.session() as session:
                session.run("MATCH (n) DETACH DELETE n")
        except Exception as e:
            logger.error(f"Neo4j clear_graph error: {e}")
