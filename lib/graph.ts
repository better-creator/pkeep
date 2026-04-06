/**
 * Graph KB Library for PKEEP
 * Handles creating and querying decision relationship edges.
 *
 * Tables: decision_edges, context_edges, conflict_records
 * RPC:    get_decision_lineage, get_decision_impact
 */

import { createClient } from '@/lib/supabase/server'

// ─── Types ───────────────────────────────────────────────────

export interface LineageNode {
  decisionId: string
  code: string
  title: string
  status: string
  edgeType: string
  depth: number
}

export interface ContextNode {
  entityType: string
  entityId: string
  relationType: string
  metadata: Record<string, any>
}

export interface ConflictRecord {
  id: string
  newDecisionId: string
  existingDecisionId: string
  conflictType: string
  severity: string
  reason?: string
  resolved: boolean
}

// ─── Edge Creation ───────────────────────────────────────────

export async function createDecisionEdge(params: {
  projectId: string
  sourceId: string
  targetId: string
  edgeType: 'changed_from' | 'extends' | 'conflicts' | 'depends' | 'related'
  reason?: string
  meetingId?: string
  confidence?: number
}): Promise<void> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('decision_edges').insert({
      project_id: params.projectId,
      source_id: params.sourceId,
      target_id: params.targetId,
      edge_type: params.edgeType,
      reason: params.reason ?? null,
      meeting_id: params.meetingId ?? null,
      confidence: params.confidence ?? 1.0,
    })

    if (error) {
      console.error('[graph] createDecisionEdge failed:', error.message)
    }
  } catch (err) {
    console.error('[graph] createDecisionEdge unexpected error:', err)
  }
}

export async function createContextEdge(params: {
  projectId: string
  decisionId: string
  entityType:
    | 'rejected_alternative'
    | 'task'
    | 'meeting'
    | 'screen'
    | 'feature'
    | 'keyword'
  entityId: string
  relationType:
    | 'created_from'
    | 'discussed_in'
    | 'rejected_for'
    | 'produces'
    | 'affects'
    | 'tagged_with'
    | 'linked_to'
  metadata?: Record<string, any>
}): Promise<void> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('context_edges').insert({
      project_id: params.projectId,
      decision_id: params.decisionId,
      entity_type: params.entityType,
      entity_id: params.entityId,
      relation_type: params.relationType,
      metadata: params.metadata ?? {},
    })

    if (error) {
      console.error('[graph] createContextEdge failed:', error.message)
    }
  } catch (err) {
    console.error('[graph] createContextEdge unexpected error:', err)
  }
}

export async function recordConflict(params: {
  projectId: string
  newDecisionId: string
  existingDecisionId: string
  conflictType: 'semantic' | 'logical' | 'temporal' | 'area_overlap'
  severity: 'high' | 'medium' | 'low'
  similarityScore?: number
  reason?: string
}): Promise<void> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('conflict_records').insert({
      project_id: params.projectId,
      new_decision_id: params.newDecisionId,
      existing_decision_id: params.existingDecisionId,
      conflict_type: params.conflictType,
      severity: params.severity,
      similarity_score: params.similarityScore ?? null,
      reason: params.reason ?? null,
    })

    if (error) {
      console.error('[graph] recordConflict failed:', error.message)
    }
  } catch (err) {
    console.error('[graph] recordConflict unexpected error:', err)
  }
}

// ─── Graph Queries ───────────────────────────────────────────

/**
 * Trace backward lineage: what decisions led to this one?
 * Uses the `get_decision_lineage` RPC (recursive CTE, walks edges in reverse).
 */
export async function getDecisionLineage(
  decisionId: string,
  maxDepth: number = 3
): Promise<LineageNode[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_decision_lineage', {
      target_decision_id: decisionId,
      max_depth: maxDepth,
    })

    if (error) {
      console.error('[graph] getDecisionLineage failed:', error.message)
      return []
    }

    return (data ?? []).map((row: any) => ({
      decisionId: row.decision_id,
      code: row.code,
      title: row.title,
      status: row.status,
      edgeType: row.edge_type,
      depth: row.depth,
    }))
  } catch (err) {
    console.error('[graph] getDecisionLineage unexpected error:', err)
    return []
  }
}

/**
 * Trace forward impact: what decisions does this one affect?
 * Uses the `get_decision_impact` RPC (recursive CTE, walks edges forward).
 */
export async function getDecisionImpact(
  decisionId: string,
  maxDepth: number = 3
): Promise<LineageNode[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_decision_impact', {
      source_decision_id: decisionId,
      max_depth: maxDepth,
    })

    if (error) {
      console.error('[graph] getDecisionImpact failed:', error.message)
      return []
    }

    return (data ?? []).map((row: any) => ({
      decisionId: row.decision_id,
      code: row.code,
      title: row.title,
      status: row.status,
      edgeType: row.edge_type,
      depth: row.depth,
    }))
  } catch (err) {
    console.error('[graph] getDecisionImpact unexpected error:', err)
    return []
  }
}

/**
 * Get all context edges for a decision (meetings, tasks, screens, etc.).
 */
export async function getDecisionContext(
  decisionId: string
): Promise<ContextNode[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('context_edges')
      .select('entity_type, entity_id, relation_type, metadata')
      .eq('decision_id', decisionId)

    if (error) {
      console.error('[graph] getDecisionContext failed:', error.message)
      return []
    }

    return (data ?? []).map((row) => ({
      entityType: row.entity_type,
      entityId: row.entity_id,
      relationType: row.relation_type,
      metadata: row.metadata ?? {},
    }))
  } catch (err) {
    console.error('[graph] getDecisionContext unexpected error:', err)
    return []
  }
}

/**
 * Get all unresolved conflicts for a project.
 */
export async function getUnresolvedConflicts(
  projectId: string
): Promise<ConflictRecord[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('conflict_records')
      .select(
        'id, new_decision_id, existing_decision_id, conflict_type, severity, reason, resolved'
      )
      .eq('project_id', projectId)
      .eq('resolved', false)
      .order('detected_at', { ascending: false })

    if (error) {
      console.error('[graph] getUnresolvedConflicts failed:', error.message)
      return []
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      newDecisionId: row.new_decision_id,
      existingDecisionId: row.existing_decision_id,
      conflictType: row.conflict_type,
      severity: row.severity,
      reason: row.reason ?? undefined,
      resolved: row.resolved,
    }))
  } catch (err) {
    console.error('[graph] getUnresolvedConflicts unexpected error:', err)
    return []
  }
}

/**
 * Mark a conflict as resolved.
 */
export async function resolveConflict(
  conflictId: string,
  resolution: string,
  resolvedBy?: string
): Promise<void> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('conflict_records')
      .update({
        resolved: true,
        resolution,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy ?? null,
      })
      .eq('id', conflictId)

    if (error) {
      console.error('[graph] resolveConflict failed:', error.message)
    }
  } catch (err) {
    console.error('[graph] resolveConflict unexpected error:', err)
  }
}
