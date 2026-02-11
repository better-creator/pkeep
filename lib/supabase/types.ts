export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      members: {
        Row: {
          id: string
          team_id: string
          user_id: string | null
          name: string
          email: string | null
          role: string | null
          area: 'planning' | 'design' | 'dev' | null
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id?: string | null
          name: string
          email?: string | null
          role?: string | null
          area?: 'planning' | 'design' | 'dev' | null
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string | null
          name?: string
          email?: string | null
          role?: string | null
          area?: 'planning' | 'design' | 'dev' | null
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          team_id: string
          name: string
          description: string | null
          status: 'active' | 'archived'
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          name: string
          description?: string | null
          status?: 'active' | 'archived'
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          name?: string
          description?: string | null
          status?: 'active' | 'archived'
          created_at?: string
        }
      }
      screens: {
        Row: {
          id: string
          project_id: string
          code: string
          name: string
          description: string | null
          parent_id: string | null
          figma_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          code: string
          name: string
          description?: string | null
          parent_id?: string | null
          figma_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          code?: string
          name?: string
          description?: string | null
          parent_id?: string | null
          figma_url?: string | null
          created_at?: string
        }
      }
      features: {
        Row: {
          id: string
          project_id: string
          code: string
          name: string
          description: string | null
          screen_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          code: string
          name: string
          description?: string | null
          screen_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          code?: string
          name?: string
          description?: string | null
          screen_id?: string | null
          created_at?: string
        }
      }
      decisions: {
        Row: {
          id: string
          project_id: string
          code: string
          title: string
          content: string | null
          reason: string | null
          status: 'confirmed' | 'changed' | 'pending'
          area: 'planning' | 'design' | 'dev' | null
          created_at: string
          changed_at: string | null
          changed_from: string | null
        }
        Insert: {
          id?: string
          project_id: string
          code: string
          title: string
          content?: string | null
          reason?: string | null
          status?: 'confirmed' | 'changed' | 'pending'
          area?: 'planning' | 'design' | 'dev' | null
          created_at?: string
          changed_at?: string | null
          changed_from?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          code?: string
          title?: string
          content?: string | null
          reason?: string | null
          status?: 'confirmed' | 'changed' | 'pending'
          area?: 'planning' | 'design' | 'dev' | null
          created_at?: string
          changed_at?: string | null
          changed_from?: string | null
        }
      }
      meetings: {
        Row: {
          id: string
          project_id: string
          code: string
          title: string
          date: string
          attendees: string[] | null
          content: string | null
          ai_summary: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          code: string
          title: string
          date: string
          attendees?: string[] | null
          content?: string | null
          ai_summary?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          code?: string
          title?: string
          date?: string
          attendees?: string[] | null
          content?: string | null
          ai_summary?: Json | null
          created_at?: string
        }
      }
      decision_sources: {
        Row: {
          id: string
          decision_id: string
          source_type: 'meeting' | 'slack' | 'figma_comment' | 'github_pr' | 'manual'
          source_id: string | null
          source_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          decision_id: string
          source_type: 'meeting' | 'slack' | 'figma_comment' | 'github_pr' | 'manual'
          source_id?: string | null
          source_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          decision_id?: string
          source_type?: 'meeting' | 'slack' | 'figma_comment' | 'github_pr' | 'manual'
          source_id?: string | null
          source_url?: string | null
          created_at?: string
        }
      }
      decision_links: {
        Row: {
          id: string
          decision_id: string
          link_type: 'screen' | 'feature'
          link_id: string
          created_at: string
        }
        Insert: {
          id?: string
          decision_id: string
          link_type: 'screen' | 'feature'
          link_id: string
          created_at?: string
        }
        Update: {
          id?: string
          decision_id?: string
          link_type?: 'screen' | 'feature'
          link_id?: string
          created_at?: string
        }
      }
      external_links: {
        Row: {
          id: string
          project_id: string
          entity_type: string
          entity_id: string
          platform: 'figma' | 'github' | 'slack' | 'notion'
          external_id: string | null
          external_url: string | null
          synced_at: string
        }
        Insert: {
          id?: string
          project_id: string
          entity_type: string
          entity_id: string
          platform: 'figma' | 'github' | 'slack' | 'notion'
          external_id?: string | null
          external_url?: string | null
          synced_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          entity_type?: string
          entity_id?: string
          platform?: 'figma' | 'github' | 'slack' | 'notion'
          external_id?: string | null
          external_url?: string | null
          synced_at?: string
        }
      }
      github_events: {
        Row: {
          id: string
          project_id: string
          event_type: 'pr' | 'commit' | 'issue'
          title: string | null
          url: string | null
          linked_code: string | null
          raw_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          event_type: 'pr' | 'commit' | 'issue'
          title?: string | null
          url?: string | null
          linked_code?: string | null
          raw_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          event_type?: 'pr' | 'commit' | 'issue'
          title?: string | null
          url?: string | null
          linked_code?: string | null
          raw_data?: Json | null
          created_at?: string
        }
      }
      affinity_groups: {
        Row: {
          id: string
          project_id: string
          name: string
          color: string | null
          position_x: number | null
          position_y: number | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          color?: string | null
          position_x?: number | null
          position_y?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          color?: string | null
          position_x?: number | null
          position_y?: number | null
          created_at?: string
        }
      }
      affinity_items: {
        Row: {
          id: string
          project_id: string
          group_id: string | null
          content: string
          source_type: 'decision' | 'meeting' | 'slack' | 'manual' | null
          source_id: string | null
          position_x: number | null
          position_y: number | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          group_id?: string | null
          content: string
          source_type?: 'decision' | 'meeting' | 'slack' | 'manual' | null
          source_id?: string | null
          position_x?: number | null
          position_y?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          group_id?: string | null
          content?: string
          source_type?: 'decision' | 'meeting' | 'slack' | 'manual' | null
          source_id?: string | null
          position_x?: number | null
          position_y?: number | null
          created_at?: string
        }
      }
      // OTB Layer tables
      domains: {
        Row: {
          id: string
          name: string
          description: string | null
          rules: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          rules?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          rules?: Json | null
          created_at?: string
        }
      }
      crawl_sources: {
        Row: {
          id: string
          name: string
          url: string
          source_type: 'reference' | 'trend' | 'news' | null
          credibility: 'A' | 'B' | 'C' | null
          active: boolean
          last_crawled_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          url: string
          source_type?: 'reference' | 'trend' | 'news' | null
          credibility?: 'A' | 'B' | 'C' | null
          active?: boolean
          last_crawled_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          url?: string
          source_type?: 'reference' | 'trend' | 'news' | null
          credibility?: 'A' | 'B' | 'C' | null
          active?: boolean
          last_crawled_at?: string | null
          created_at?: string
        }
      }
      references: {
        Row: {
          id: string
          source_id: string | null
          url: string
          title: string | null
          thumbnail_url: string | null
          domain: string | null
          tags: string[] | null
          crawled_at: string
        }
        Insert: {
          id?: string
          source_id?: string | null
          url: string
          title?: string | null
          thumbnail_url?: string | null
          domain?: string | null
          tags?: string[] | null
          crawled_at?: string
        }
        Update: {
          id?: string
          source_id?: string | null
          url?: string
          title?: string | null
          thumbnail_url?: string | null
          domain?: string | null
          tags?: string[] | null
          crawled_at?: string
        }
      }
      reference_analysis: {
        Row: {
          id: string
          reference_id: string
          axis_data: Json | null
          style_tags: string[] | null
          color_palette: string[] | null
          analyzed_at: string
        }
        Insert: {
          id?: string
          reference_id: string
          axis_data?: Json | null
          style_tags?: string[] | null
          color_palette?: string[] | null
          analyzed_at?: string
        }
        Update: {
          id?: string
          reference_id?: string
          axis_data?: Json | null
          style_tags?: string[] | null
          color_palette?: string[] | null
          analyzed_at?: string
        }
      }
      trends: {
        Row: {
          id: string
          domain: string | null
          keyword: string
          trend_type: 'rising' | 'stable' | 'declining' | null
          score: number | null
          period: string | null
          source_count: number | null
          detected_at: string
        }
        Insert: {
          id?: string
          domain?: string | null
          keyword: string
          trend_type?: 'rising' | 'stable' | 'declining' | null
          score?: number | null
          period?: string | null
          source_count?: number | null
          detected_at?: string
        }
        Update: {
          id?: string
          domain?: string | null
          keyword?: string
          trend_type?: 'rising' | 'stable' | 'declining' | null
          score?: number | null
          period?: string | null
          source_count?: number | null
          detected_at?: string
        }
      }
      ai_feedbacks: {
        Row: {
          id: string
          project_id: string
          entity_type: string | null
          entity_id: string | null
          feedback_type: 'trend_check' | 'reference_suggest' | 'conflict_alert' | 'missing_alert' | null
          content: string | null
          references: string[] | null
          trends: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          entity_type?: string | null
          entity_id?: string | null
          feedback_type?: 'trend_check' | 'reference_suggest' | 'conflict_alert' | 'missing_alert' | null
          content?: string | null
          references?: string[] | null
          trends?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          entity_type?: string | null
          entity_id?: string | null
          feedback_type?: 'trend_check' | 'reference_suggest' | 'conflict_alert' | 'missing_alert' | null
          content?: string | null
          references?: string[] | null
          trends?: string[] | null
          created_at?: string
        }
      }
      ai_queries: {
        Row: {
          id: string
          project_id: string
          query: string
          context: Json | null
          response: string | null
          sources_used: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          query: string
          context?: Json | null
          response?: string | null
          sources_used?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          query?: string
          context?: Json | null
          response?: string | null
          sources_used?: string[] | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
