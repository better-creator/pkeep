export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      affinity_groups: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          position_x: number | null
          position_y: number | null
          project_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          position_x?: number | null
          position_y?: number | null
          project_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          position_x?: number | null
          position_y?: number | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affinity_groups_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      affinity_items: {
        Row: {
          content: string
          created_at: string | null
          group_id: string | null
          id: string
          position_x: number | null
          position_y: number | null
          project_id: string | null
          source_id: string | null
          source_type: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          group_id?: string | null
          id?: string
          position_x?: number | null
          position_y?: number | null
          project_id?: string | null
          source_id?: string | null
          source_type?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          group_id?: string | null
          id?: string
          position_x?: number | null
          position_y?: number | null
          project_id?: string | null
          source_id?: string | null
          source_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affinity_items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "affinity_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affinity_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_feedbacks: {
        Row: {
          content: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          feedback_type: string | null
          id: string
          project_id: string | null
          references: string[] | null
          trends: string[] | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          feedback_type?: string | null
          id?: string
          project_id?: string | null
          references?: string[] | null
          trends?: string[] | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          feedback_type?: string | null
          id?: string
          project_id?: string | null
          references?: string[] | null
          trends?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedbacks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_queries: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string
          project_id: string | null
          query: string
          response: string | null
          sources_used: string[] | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          query: string
          response?: string | null
          sources_used?: string[] | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          query?: string
          response?: string | null
          sources_used?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_queries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          org_id: string
          target_id: string | null
          target_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          org_id: string
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          org_id?: string
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conflict_records: {
        Row: {
          conflict_type: string
          detected_at: string | null
          existing_decision_id: string
          id: string
          new_decision_id: string
          project_id: string
          reason: string | null
          resolution: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          similarity_score: number | null
        }
        Insert: {
          conflict_type: string
          detected_at?: string | null
          existing_decision_id: string
          id?: string
          new_decision_id: string
          project_id: string
          reason?: string | null
          resolution?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          similarity_score?: number | null
        }
        Update: {
          conflict_type?: string
          detected_at?: string | null
          existing_decision_id?: string
          id?: string
          new_decision_id?: string
          project_id?: string
          reason?: string | null
          resolution?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          similarity_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conflict_records_existing_decision_id_fkey"
            columns: ["existing_decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conflict_records_new_decision_id_fkey"
            columns: ["new_decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conflict_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conflict_records_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      context_edges: {
        Row: {
          created_at: string | null
          decision_id: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          project_id: string
          relation_type: string
        }
        Insert: {
          created_at?: string | null
          decision_id: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          project_id: string
          relation_type: string
        }
        Update: {
          created_at?: string | null
          decision_id?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          project_id?: string
          relation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "context_edges_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "context_edges_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      crawl_sources: {
        Row: {
          active: boolean | null
          created_at: string | null
          credibility: string | null
          id: string
          last_crawled_at: string | null
          name: string
          source_type: string | null
          url: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          credibility?: string | null
          id?: string
          last_crawled_at?: string | null
          name: string
          source_type?: string | null
          url: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          credibility?: string | null
          id?: string
          last_crawled_at?: string | null
          name?: string
          source_type?: string | null
          url?: string
        }
        Relationships: []
      }
      decision_chunks: {
        Row: {
          chunk_index: number
          chunk_text: string
          chunk_type: string | null
          created_at: string | null
          decision_id: string
          embedding: string | null
          id: string
          token_count: number | null
        }
        Insert: {
          chunk_index: number
          chunk_text: string
          chunk_type?: string | null
          created_at?: string | null
          decision_id: string
          embedding?: string | null
          id?: string
          token_count?: number | null
        }
        Update: {
          chunk_index?: number
          chunk_text?: string
          chunk_type?: string | null
          created_at?: string | null
          decision_id?: string
          embedding?: string | null
          id?: string
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "decision_chunks_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_edges: {
        Row: {
          confidence: number | null
          created_at: string | null
          edge_type: string
          id: string
          meeting_id: string | null
          project_id: string
          reason: string | null
          source_id: string
          target_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          edge_type: string
          id?: string
          meeting_id?: string | null
          project_id: string
          reason?: string | null
          source_id: string
          target_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          edge_type?: string
          id?: string
          meeting_id?: string | null
          project_id?: string
          reason?: string | null
          source_id?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_edges_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_edges_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_edges_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_edges_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_links: {
        Row: {
          created_at: string | null
          decision_id: string | null
          id: string
          link_id: string
          link_type: string
        }
        Insert: {
          created_at?: string | null
          decision_id?: string | null
          id?: string
          link_id: string
          link_type: string
        }
        Update: {
          created_at?: string | null
          decision_id?: string | null
          id?: string
          link_id?: string
          link_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_links_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_sources: {
        Row: {
          created_at: string | null
          decision_id: string | null
          id: string
          source_id: string | null
          source_type: string
          source_url: string | null
        }
        Insert: {
          created_at?: string | null
          decision_id?: string | null
          id?: string
          source_id?: string | null
          source_type: string
          source_url?: string | null
        }
        Update: {
          created_at?: string | null
          decision_id?: string | null
          id?: string
          source_id?: string | null
          source_type?: string
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decision_sources_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          area: string | null
          auto_created: boolean | null
          changed_at: string | null
          changed_from: string | null
          code: string
          content: string | null
          created_at: string | null
          embedding: string | null
          id: string
          project_id: string | null
          reason: string | null
          source_meeting_id: string | null
          status: string | null
          title: string
        }
        Insert: {
          area?: string | null
          auto_created?: boolean | null
          changed_at?: string | null
          changed_from?: string | null
          code: string
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          project_id?: string | null
          reason?: string | null
          source_meeting_id?: string | null
          status?: string | null
          title: string
        }
        Update: {
          area?: string | null
          auto_created?: boolean | null
          changed_at?: string | null
          changed_from?: string | null
          code?: string
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          project_id?: string | null
          reason?: string | null
          source_meeting_id?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_changed_from_fkey"
            columns: ["changed_from"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_source_meeting_id_fkey"
            columns: ["source_meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      domains: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          rules: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          rules?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          rules?: Json | null
        }
        Relationships: []
      }
      external_links: {
        Row: {
          entity_id: string
          entity_type: string
          external_id: string | null
          external_url: string | null
          id: string
          platform: string
          project_id: string | null
          synced_at: string | null
        }
        Insert: {
          entity_id: string
          entity_type: string
          external_id?: string | null
          external_url?: string | null
          id?: string
          platform: string
          project_id?: string | null
          synced_at?: string | null
        }
        Update: {
          entity_id?: string
          entity_type?: string
          external_id?: string | null
          external_url?: string | null
          id?: string
          platform?: string
          project_id?: string | null
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          project_id: string | null
          screen_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          project_id?: string | null
          screen_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string | null
          screen_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "features_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "features_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
        ]
      }
      github_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          linked_code: string | null
          project_id: string | null
          raw_data: Json | null
          title: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          linked_code?: string | null
          project_id?: string | null
          raw_data?: Json | null
          title?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          linked_code?: string | null
          project_id?: string | null
          raw_data?: Json | null
          title?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "github_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_channels: {
        Row: {
          channel_config: Json
          created_at: string | null
          id: string
          integration_id: string
          team_id: string
        }
        Insert: {
          channel_config?: Json
          created_at?: string | null
          id?: string
          integration_id: string
          team_id: string
        }
        Update: {
          channel_config?: Json
          created_at?: string | null
          id?: string
          integration_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_channels_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_channels_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          created_at: string | null
          credentials_encrypted: string | null
          id: string
          metadata: Json | null
          org_id: string
          provider: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credentials_encrypted?: string | null
          id?: string
          metadata?: Json | null
          org_id: string
          provider: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credentials_encrypted?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string
          provider?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          org_id: string
          org_role: string
          status: string | null
          team_id: string | null
          team_role: string | null
          token: string
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          org_id: string
          org_role?: string
          status?: string | null
          team_id?: string | null
          team_role?: string | null
          token: string
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          org_id?: string
          org_role?: string
          status?: string | null
          team_id?: string | null
          team_role?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_chunks: {
        Row: {
          chunk_index: number
          chunk_text: string
          created_at: string | null
          embedding: string | null
          end_seconds: number | null
          id: string
          meeting_id: string
          speaker: string | null
          start_seconds: number | null
          token_count: number | null
        }
        Insert: {
          chunk_index: number
          chunk_text: string
          created_at?: string | null
          embedding?: string | null
          end_seconds?: number | null
          id?: string
          meeting_id: string
          speaker?: string | null
          start_seconds?: number | null
          token_count?: number | null
        }
        Update: {
          chunk_index?: number
          chunk_text?: string
          created_at?: string | null
          embedding?: string | null
          end_seconds?: number | null
          id?: string
          meeting_id?: string
          speaker?: string | null
          start_seconds?: number | null
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_chunks_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          ai_summary: Json | null
          attendees: string[] | null
          audio_url: string | null
          code: string
          content: string | null
          created_at: string | null
          date: string
          duration_seconds: number | null
          id: string
          project_id: string | null
          speaker_map: Json | null
          title: string
          transcript: Json | null
        }
        Insert: {
          ai_summary?: Json | null
          attendees?: string[] | null
          audio_url?: string | null
          code: string
          content?: string | null
          created_at?: string | null
          date: string
          duration_seconds?: number | null
          id?: string
          project_id?: string | null
          speaker_map?: Json | null
          title: string
          transcript?: Json | null
        }
        Update: {
          ai_summary?: Json | null
          attendees?: string[] | null
          audio_url?: string | null
          code?: string
          content?: string | null
          created_at?: string | null
          date?: string
          duration_seconds?: number | null
          id?: string
          project_id?: string | null
          speaker_map?: Json | null
          title?: string
          transcript?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          area: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          role: string | null
          team_id: string | null
          team_role: string | null
          user_id: string | null
        }
        Insert: {
          area?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          role?: string | null
          team_id?: string | null
          team_role?: string | null
          user_id?: string | null
        }
        Update: {
          area?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          role?: string | null
          team_id?: string | null
          team_role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          created_at: string | null
          id: string
          org_id: string
          org_role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          org_id: string
          org_role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          org_id?: string
          org_role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          allowed_domains: string[] | null
          allowed_ips: string[] | null
          billing_email: string | null
          created_at: string | null
          id: string
          logo_url: string | null
          metadata: Json | null
          name: string
          plan: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          allowed_domains?: string[] | null
          allowed_ips?: string[] | null
          billing_email?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          metadata?: Json | null
          name: string
          plan?: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          allowed_domains?: string[] | null
          allowed_ips?: string[] | null
          billing_email?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          metadata?: Json | null
          name?: string
          plan?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          action: string
          id: string
          label: string | null
          scope: string
        }
        Insert: {
          action: string
          id?: string
          label?: string | null
          scope: string
        }
        Update: {
          action?: string
          id?: string
          label?: string | null
          scope?: string
        }
        Relationships: []
      }
      project_teams: {
        Row: {
          created_at: string | null
          is_owner_team: boolean | null
          project_id: string
          team_id: string
        }
        Insert: {
          created_at?: string | null
          is_owner_team?: boolean | null
          project_id: string
          team_id: string
        }
        Update: {
          created_at?: string | null
          is_owner_team?: boolean | null
          project_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_teams_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          status: string | null
          team_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string | null
          team_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      reference_analysis: {
        Row: {
          analyzed_at: string | null
          axis_data: Json | null
          color_palette: string[] | null
          id: string
          reference_id: string | null
          style_tags: string[] | null
        }
        Insert: {
          analyzed_at?: string | null
          axis_data?: Json | null
          color_palette?: string[] | null
          id?: string
          reference_id?: string | null
          style_tags?: string[] | null
        }
        Update: {
          analyzed_at?: string | null
          axis_data?: Json | null
          color_palette?: string[] | null
          id?: string
          reference_id?: string | null
          style_tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "reference_analysis_reference_id_fkey"
            columns: ["reference_id"]
            isOneToOne: false
            referencedRelation: "references"
            referencedColumns: ["id"]
          },
        ]
      }
      references: {
        Row: {
          crawled_at: string | null
          domain: string | null
          id: string
          source_id: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string | null
          url: string
        }
        Insert: {
          crawled_at?: string | null
          domain?: string | null
          id?: string
          source_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          url: string
        }
        Update: {
          crawled_at?: string | null
          domain?: string | null
          id?: string
          source_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "references_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "crawl_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      rejected_alternatives: {
        Row: {
          auto_created: boolean | null
          created_at: string | null
          decision_id: string | null
          description: string | null
          id: string
          keywords: string[] | null
          meeting_id: string | null
          project_id: string | null
          proposed_by: string | null
          rejection_reason: string | null
          title: string
        }
        Insert: {
          auto_created?: boolean | null
          created_at?: string | null
          decision_id?: string | null
          description?: string | null
          id?: string
          keywords?: string[] | null
          meeting_id?: string | null
          project_id?: string | null
          proposed_by?: string | null
          rejection_reason?: string | null
          title: string
        }
        Update: {
          auto_created?: boolean | null
          created_at?: string | null
          decision_id?: string | null
          description?: string | null
          id?: string
          keywords?: string[] | null
          meeting_id?: string | null
          project_id?: string | null
          proposed_by?: string | null
          rejection_reason?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "rejected_alternatives_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rejected_alternatives_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rejected_alternatives_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          id: string
          is_custom: boolean | null
          label: string | null
          name: string
          org_id: string | null
          scope: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_custom?: boolean | null
          label?: string | null
          name: string
          org_id?: string | null
          scope: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_custom?: boolean | null
          label?: string | null
          name?: string
          org_id?: string | null
          scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_sync: {
        Row: {
          manager_name: string | null
          page_id: string
          prev_manager_name: string | null
          schedule_date: string | null
          updated_at: string
        }
        Insert: {
          manager_name?: string | null
          page_id: string
          prev_manager_name?: string | null
          schedule_date?: string | null
          updated_at?: string
        }
        Update: {
          manager_name?: string | null
          page_id?: string
          prev_manager_name?: string | null
          schedule_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      screens: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          figma_url: string | null
          id: string
          name: string
          parent_id: string | null
          project_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          figma_url?: string | null
          id?: string
          name: string
          parent_id?: string | null
          project_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          figma_url?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "screens_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screens_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          assignee_name: string | null
          auto_created: boolean | null
          created_at: string | null
          decision_id: string | null
          id: string
          meeting_id: string | null
          project_id: string | null
          status: string | null
          title: string
        }
        Insert: {
          assignee_id?: string | null
          assignee_name?: string | null
          auto_created?: boolean | null
          created_at?: string | null
          decision_id?: string | null
          id?: string
          meeting_id?: string | null
          project_id?: string | null
          status?: string | null
          title: string
        }
        Update: {
          assignee_id?: string | null
          assignee_name?: string | null
          auto_created?: boolean | null
          created_at?: string | null
          decision_id?: string | null
          id?: string
          meeting_id?: string | null
          project_id?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          org_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          org_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          org_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      trends: {
        Row: {
          detected_at: string | null
          domain: string | null
          id: string
          keyword: string
          period: string | null
          score: number | null
          source_count: number | null
          trend_type: string | null
        }
        Insert: {
          detected_at?: string | null
          domain?: string | null
          id?: string
          keyword: string
          period?: string | null
          score?: number | null
          source_count?: number | null
          trend_type?: string | null
        }
        Update: {
          detected_at?: string | null
          domain?: string | null
          id?: string
          keyword?: string
          period?: string | null
          score?: number | null
          source_count?: number | null
          trend_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_project: { Args: { p_project_id: string }; Returns: boolean }
      can_write_project: { Args: { p_project_id: string }; Returns: boolean }
      create_organization_with_team: {
        Args: {
          p_org_name: string
          p_org_slug: string
          p_project_name: string
          p_team_name: string
          p_user_email: string
          p_user_name: string
        }
        Returns: Json
      }
      generate_next_code: {
        Args: { p_prefix: string; p_project_id: string }
        Returns: string
      }
      get_decision_impact: {
        Args: { max_depth?: number; source_decision_id: string }
        Returns: {
          code: string
          decision_id: string
          depth: number
          edge_type: string
          path: string[]
          status: string
          title: string
        }[]
      }
      get_decision_lineage: {
        Args: { max_depth?: number; target_decision_id: string }
        Returns: {
          code: string
          decision_id: string
          depth: number
          edge_type: string
          path: string[]
          status: string
          title: string
        }[]
      }
      has_permission: {
        Args: {
          p_action: string
          p_org_id?: string
          p_team_id?: string
          p_user_id: string
        }
        Returns: boolean
      }
      log_audit: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_org_id: string
          p_target_id?: string
          p_target_type?: string
        }
        Returns: string
      }
      match_decision_chunks: {
        Args: {
          match_count?: number
          project_filter?: string
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          chunk_id: string
          chunk_text: string
          chunk_type: string
          decision_code: string
          decision_id: string
          decision_status: string
          decision_title: string
          similarity: number
        }[]
      }
      match_meeting_chunks: {
        Args: {
          match_count?: number
          project_filter?: string
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          chunk_id: string
          chunk_text: string
          meeting_code: string
          meeting_id: string
          meeting_title: string
          similarity: number
          speaker: string
        }[]
      }
      user_org_ids: { Args: never; Returns: string[] }
      user_org_role: { Args: { p_org_id: string }; Returns: string }
      user_team_ids: { Args: never; Returns: string[] }
      user_team_role: { Args: { p_team_id: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
