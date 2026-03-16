'use client'

import { useState, useEffect, useCallback } from 'react'
import type {
  StoredMeeting,
  StoredDecision,
  StoredTask,
  TeamMember,
  StoredRejected,
} from '@/lib/store/types'
import * as store from '@/lib/store'

export function useStore() {
  const [meetings, setMeetings] = useState<StoredMeeting[]>([])
  const [decisions, setDecisions] = useState<StoredDecision[]>([])
  const [tasks, setTasks] = useState<StoredTask[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [rejected, setRejected] = useState<StoredRejected[]>([])

  // Initial load
  useEffect(() => {
    setMeetings(store.loadMeetings())
    setDecisions(store.loadDecisions())
    setTasks(store.loadTasks())
    setTeamMembers(store.loadTeamMembers())
    setRejected(store.loadRejected())
  }, [])

  // ---------------------------------------------------------------------------
  // Meetings
  // ---------------------------------------------------------------------------

  const addMeeting = useCallback((meeting: StoredMeeting): void => {
    store.saveMeeting(meeting)
    setMeetings(store.loadMeetings())
  }, [])

  const removeMeeting = useCallback((id: string): void => {
    store.deleteMeeting(id)
    setMeetings(store.loadMeetings())
    setDecisions(store.loadDecisions())
    setTasks(store.loadTasks())
    setRejected(store.loadRejected())
  }, [])

  const findMeetings = useCallback((query: string): StoredMeeting[] => {
    return store.searchMeetings(query)
  }, [])

  // ---------------------------------------------------------------------------
  // Decisions
  // ---------------------------------------------------------------------------

  const addDecision = useCallback((decision: StoredDecision): void => {
    store.saveDecision(decision)
    setDecisions(store.loadDecisions())
  }, [])

  const editDecision = useCallback(
    (id: string, partial: Partial<StoredDecision>): void => {
      store.updateDecision(id, partial)
      setDecisions(store.loadDecisions())
    },
    [],
  )

  const removeDecision = useCallback((id: string): void => {
    store.deleteDecision(id)
    setDecisions(store.loadDecisions())
  }, [])

  const decisionsByMeeting = useCallback(
    (meetingId: string): StoredDecision[] => {
      return store.getDecisionsByMeeting(meetingId)
    },
    [],
  )

  // ---------------------------------------------------------------------------
  // Tasks
  // ---------------------------------------------------------------------------

  const addTask = useCallback((task: StoredTask): void => {
    store.saveTask(task)
    setTasks(store.loadTasks())
  }, [])

  const editTask = useCallback(
    (id: string, partial: Partial<StoredTask>): void => {
      store.updateTask(id, partial)
      setTasks(store.loadTasks())
    },
    [],
  )

  const removeTask = useCallback((id: string): void => {
    store.deleteTask(id)
    setTasks(store.loadTasks())
  }, [])

  const tasksByMeeting = useCallback((meetingId: string): StoredTask[] => {
    return store.getTasksByMeeting(meetingId)
  }, [])

  // ---------------------------------------------------------------------------
  // Team Members
  // ---------------------------------------------------------------------------

  const addTeamMember = useCallback((member: TeamMember): void => {
    store.saveTeamMember(member)
    setTeamMembers(store.loadTeamMembers())
  }, [])

  const removeTeamMember = useCallback((id: string): void => {
    store.deleteTeamMember(id)
    setTeamMembers(store.loadTeamMembers())
  }, [])

  // ---------------------------------------------------------------------------
  // Rejected
  // ---------------------------------------------------------------------------

  const addRejected = useCallback((item: StoredRejected): void => {
    store.saveRejected(item)
    setRejected(store.loadRejected())
  }, [])

  const removeRejected = useCallback((id: string): void => {
    store.deleteRejected(id)
    setRejected(store.loadRejected())
  }, [])

  const rejectedByMeeting = useCallback(
    (meetingId: string): StoredRejected[] => {
      return store.getRejectedByMeeting(meetingId)
    },
    [],
  )

  // ---------------------------------------------------------------------------
  // Code generators
  // ---------------------------------------------------------------------------

  const getNextMeetingCode = useCallback((): string => {
    return store.nextMeetingCode()
  }, [])

  const getNextDecisionCode = useCallback((): string => {
    return store.nextDecisionCode()
  }, [])

  return {
    // State
    meetings,
    decisions,
    tasks,
    teamMembers,
    rejected,

    // Meeting mutators
    addMeeting,
    removeMeeting,
    findMeetings,

    // Decision mutators
    addDecision,
    editDecision,
    removeDecision,
    decisionsByMeeting,

    // Task mutators
    addTask,
    editTask,
    removeTask,
    tasksByMeeting,

    // Team mutators
    addTeamMember,
    removeTeamMember,

    // Rejected mutators
    addRejected,
    removeRejected,
    rejectedByMeeting,

    // Code generators
    getNextMeetingCode,
    getNextDecisionCode,
  }
}
