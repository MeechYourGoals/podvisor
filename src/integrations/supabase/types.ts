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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      anonymous_rate_limits: {
        Row: {
          created_at: string | null
          ip_address: string
          last_reset: string | null
          video_count: number | null
        }
        Insert: {
          created_at?: string | null
          ip_address: string
          last_reset?: string | null
          video_count?: number | null
        }
        Update: {
          created_at?: string | null
          ip_address?: string
          last_reset?: string | null
          video_count?: number | null
        }
        Relationships: []
      }
      bookmark_folders: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          folder_name: string
          icon: string | null
          id: string
          profile_id: string | null
          sort_order: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          folder_name: string
          icon?: string | null
          id?: string
          profile_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          folder_name?: string
          icon?: string | null
          id?: string
          profile_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmark_folders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_context_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarked_insights: {
        Row: {
          created_at: string | null
          folder_id: string | null
          id: string
          insight_id: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          folder_id?: string | null
          id?: string
          insight_id?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          folder_id?: string | null
          id?: string
          insight_id?: string | null
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarked_insights_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "bookmark_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarked_insights_insight_id_fkey"
            columns: ["insight_id"]
            isOneToOne: false
            referencedRelation: "insights"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarked_videos: {
        Row: {
          created_at: string | null
          folder_id: string | null
          id: string
          notes: string | null
          user_id: string
          video_id: string | null
        }
        Insert: {
          created_at?: string | null
          folder_id?: string | null
          id?: string
          notes?: string | null
          user_id: string
          video_id?: string | null
        }
        Update: {
          created_at?: string | null
          folder_id?: string | null
          id?: string
          notes?: string | null
          user_id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookmarked_videos_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "bookmark_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarked_videos_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarked_videos_folders: {
        Row: {
          bookmarked_video_id: string
          created_at: string | null
          folder_id: string
          id: string
        }
        Insert: {
          bookmarked_video_id: string
          created_at?: string | null
          folder_id: string
          id?: string
        }
        Update: {
          bookmarked_video_id?: string
          created_at?: string | null
          folder_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarked_videos_folders_bookmarked_video_id_fkey"
            columns: ["bookmarked_video_id"]
            isOneToOne: false
            referencedRelation: "bookmarked_videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarked_videos_folders_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "bookmark_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      content_sources: {
        Row: {
          created_at: string | null
          id: string
          source_name: string | null
          source_type: string
          source_url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          source_name?: string | null
          source_type: string
          source_url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          source_name?: string | null
          source_type?: string
          source_url?: string
        }
        Relationships: []
      }
      experts: {
        Row: {
          created_at: string | null
          credentials: string | null
          domain: Database["public"]["Enums"]["profile_category"] | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          credentials?: string | null
          domain?: Database["public"]["Enums"]["profile_category"] | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          credentials?: string | null
          domain?: Database["public"]["Enums"]["profile_category"] | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      insights: {
        Row: {
          actionability_score: number | null
          category: Database["public"]["Enums"]["profile_category"]
          created_at: string | null
          expert_attribution: string | null
          id: string
          impact_score: number | null
          insight_text: string
          profile_used: string | null
          video_id: string | null
        }
        Insert: {
          actionability_score?: number | null
          category: Database["public"]["Enums"]["profile_category"]
          created_at?: string | null
          expert_attribution?: string | null
          id?: string
          impact_score?: number | null
          insight_text: string
          profile_used?: string | null
          video_id?: string | null
        }
        Update: {
          actionability_score?: number | null
          category?: Database["public"]["Enums"]["profile_category"]
          created_at?: string | null
          expert_attribution?: string | null
          id?: string
          impact_score?: number | null
          insight_text?: string
          profile_used?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insights_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      personalized_insights: {
        Row: {
          action_items: string[] | null
          created_at: string | null
          for_profile_context: string | null
          id: string
          insight_text: string
          profile_id: string | null
          profile_used: string | null
          relevance_score: number | null
          video_id: string | null
        }
        Insert: {
          action_items?: string[] | null
          created_at?: string | null
          for_profile_context?: string | null
          id?: string
          insight_text: string
          profile_id?: string | null
          profile_used?: string | null
          relevance_score?: number | null
          video_id?: string | null
        }
        Update: {
          action_items?: string[] | null
          created_at?: string | null
          for_profile_context?: string | null
          id?: string
          insight_text?: string
          profile_id?: string | null
          profile_used?: string | null
          relevance_score?: number | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personalized_insights_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_context_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personalized_insights_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_products: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          interval: string
          stripe_price_id: string
          stripe_product_id: string
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          interval?: string
          stripe_price_id: string
          stripe_product_id: string
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          interval?: string
          stripe_price_id?: string
          stripe_product_id?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
        }
        Relationships: []
      }
      user_context_profiles: {
        Row: {
          category: Database["public"]["Enums"]["profile_category"]
          challenges: string
          created_at: string | null
          experience_level: string
          goals: string
          id: string
          profile_name: string
          role_description: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["profile_category"]
          challenges: string
          created_at?: string | null
          experience_level: string
          goals: string
          id?: string
          profile_name: string
          role_description: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["profile_category"]
          challenges?: string
          created_at?: string | null
          experience_level?: string
          goals?: string
          id?: string
          profile_name?: string
          role_description?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_default_profiles: {
        Row: {
          created_at: string | null
          description: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          audio_per_month: number | null
          audio_uploads_this_month: number | null
          created_at: string | null
          current_period_end: string | null
          folders_per_profile: number | null
          id: string
          profile_limit: number | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"] | null
          updated_at: string | null
          user_id: string | null
          videos_analyzed_this_month: number | null
          videos_per_month: number | null
        }
        Insert: {
          audio_per_month?: number | null
          audio_uploads_this_month?: number | null
          created_at?: string | null
          current_period_end?: string | null
          folders_per_profile?: number | null
          id?: string
          profile_limit?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"] | null
          updated_at?: string | null
          user_id?: string | null
          videos_analyzed_this_month?: number | null
          videos_per_month?: number | null
        }
        Update: {
          audio_per_month?: number | null
          audio_uploads_this_month?: number | null
          created_at?: string | null
          current_period_end?: string | null
          folders_per_profile?: number | null
          id?: string
          profile_limit?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"] | null
          updated_at?: string | null
          user_id?: string | null
          videos_analyzed_this_month?: number | null
          videos_per_month?: number | null
        }
        Relationships: []
      }
      videos: {
        Row: {
          analyzed_at: string | null
          audio_duration_seconds: number | null
          audio_original_filename: string | null
          audio_source_path: string | null
          created_at: string | null
          expert_id: string | null
          id: string
          is_audio_upload: boolean | null
          is_favorite: boolean | null
          profile_used: string | null
          source_id: string | null
          speakers: Json | null
          status: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string
          video_id: string
          youtube_url: string
        }
        Insert: {
          analyzed_at?: string | null
          audio_duration_seconds?: number | null
          audio_original_filename?: string | null
          audio_source_path?: string | null
          created_at?: string | null
          expert_id?: string | null
          id?: string
          is_audio_upload?: boolean | null
          is_favorite?: boolean | null
          profile_used?: string | null
          source_id?: string | null
          speakers?: Json | null
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          video_id: string
          youtube_url: string
        }
        Update: {
          analyzed_at?: string | null
          audio_duration_seconds?: number | null
          audio_original_filename?: string | null
          audio_source_path?: string | null
          created_at?: string | null
          expert_id?: string | null
          id?: string
          is_audio_upload?: boolean | null
          is_favorite?: boolean | null
          profile_used?: string | null
          source_id?: string | null
          speakers?: Json | null
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          video_id?: string
          youtube_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "experts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "content_sources"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_anonymous_limits: { Args: never; Returns: undefined }
      increment_audio_count: { Args: { p_user_id: string }; Returns: undefined }
      increment_video_count: { Args: { p_user_id: string }; Returns: undefined }
    }
    Enums: {
      profile_category:
        | "business"
        | "sports"
        | "health_fitness"
        | "technology"
        | "personal_development"
        | "finance"
        | "entertainment"
        | "education"
        | "general"
      subscription_tier: "free" | "pro" | "team" | "annual"
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
    Enums: {
      profile_category: [
        "business",
        "sports",
        "health_fitness",
        "technology",
        "personal_development",
        "finance",
        "entertainment",
        "education",
        "general",
      ],
      subscription_tier: ["free", "pro", "team", "annual"],
    },
  },
} as const
