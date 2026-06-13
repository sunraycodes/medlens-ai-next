// ============================================================
// MedLens AI — Patient Knowledge Graph
// Direct port of build_knowledge_graph() from backend/main.py
// Builds a simple patient -> conditions/medications/allergies
// graph. No AI involved.
// ============================================================

import type { KnowledgeGraph, PatientSummary } from "@/types";

export function buildKnowledgeGraph(
  patientSummary: PatientSummary
): KnowledgeGraph {
  const nodes: KnowledgeGraph["nodes"] = [];
  const edges: KnowledgeGraph["edges"] = [];

  nodes.push({ id: "patient", label: "Patient", type: "patient" });

  for (const condition of patientSummary.conditions || []) {
    const nodeId = `condition_${condition}`;
    nodes.push({ id: nodeId, label: condition, type: "condition" });
    edges.push({
      source: "patient",
      target: nodeId,
      relation: "diagnosed_with",
    });
  }

  for (const med of patientSummary.current_medications || []) {
    const nodeId = `medication_${med}`;
    nodes.push({ id: nodeId, label: med, type: "medication" });
    edges.push({ source: "patient", target: nodeId, relation: "prescribed" });
  }

  for (const allergy of patientSummary.allergies || []) {
    const nodeId = `allergy_${allergy}`;
    nodes.push({ id: nodeId, label: allergy, type: "allergy" });
    edges.push({ source: "patient", target: nodeId, relation: "allergic_to" });
  }

  return { nodes, edges };
}
