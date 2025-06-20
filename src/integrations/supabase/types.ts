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
      api_keys: {
        Row: {
          allowed_ips: string[] | null
          allowed_origins: string[] | null
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          last_used_ip: string | null
          name: string
          rate_limit_per_day: number | null
          rate_limit_per_hour: number | null
          rate_limit_per_minute: number | null
          revoked_at: string | null
          scopes: string[] | null
          total_requests: number | null
          user_id: string
        }
        Insert: {
          allowed_ips?: string[] | null
          allowed_origins?: string[] | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          last_used_ip?: string | null
          name: string
          rate_limit_per_day?: number | null
          rate_limit_per_hour?: number | null
          rate_limit_per_minute?: number | null
          revoked_at?: string | null
          scopes?: string[] | null
          total_requests?: number | null
          user_id: string
        }
        Update: {
          allowed_ips?: string[] | null
          allowed_origins?: string[] | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          last_used_ip?: string | null
          name?: string
          rate_limit_per_day?: number | null
          rate_limit_per_hour?: number | null
          rate_limit_per_minute?: number | null
          revoked_at?: string | null
          scopes?: string[] | null
          total_requests?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clips: {
        Row: {
          ai_analysis_reason: string | null
          ai_best_platform: string[] | null
          ai_content_category: string | null
          ai_detected_emotions: string[] | null
          ai_engagement_prediction: string | null
          ai_hook_strength: number | null
          ai_viral_score: number | null
          avg_watch_time_seconds: number | null
          clip_number: number
          cloudinary_public_id: string | null
          cloudinary_secure_url: string | null
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          edit_history: Json | null
          end_time_seconds: number
          hashtags: string[] | null
          id: string
          is_favorite: boolean | null
          keywords: string[] | null
          preview_gif_url: string | null
          start_time_seconds: number
          status: string | null
          suggested_description: string | null
          suggested_title: string | null
          thumbnail_url: string | null
          title: string
          total_likes: number | null
          total_posts: number | null
          total_shares: number | null
          total_views: number | null
          updated_at: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          ai_analysis_reason?: string | null
          ai_best_platform?: string[] | null
          ai_content_category?: string | null
          ai_detected_emotions?: string[] | null
          ai_engagement_prediction?: string | null
          ai_hook_strength?: number | null
          ai_viral_score?: number | null
          avg_watch_time_seconds?: number | null
          clip_number: number
          cloudinary_public_id?: string | null
          cloudinary_secure_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          edit_history?: Json | null
          end_time_seconds: number
          hashtags?: string[] | null
          id?: string
          is_favorite?: boolean | null
          keywords?: string[] | null
          preview_gif_url?: string | null
          start_time_seconds: number
          status?: string | null
          suggested_description?: string | null
          suggested_title?: string | null
          thumbnail_url?: string | null
          title: string
          total_likes?: number | null
          total_posts?: number | null
          total_shares?: number | null
          total_views?: number | null
          updated_at?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          ai_analysis_reason?: string | null
          ai_best_platform?: string[] | null
          ai_content_category?: string | null
          ai_detected_emotions?: string[] | null
          ai_engagement_prediction?: string | null
          ai_hook_strength?: number | null
          ai_viral_score?: number | null
          avg_watch_time_seconds?: number | null
          clip_number?: number
          cloudinary_public_id?: string | null
          cloudinary_secure_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          edit_history?: Json | null
          end_time_seconds?: number
          hashtags?: string[] | null
          id?: string
          is_favorite?: boolean | null
          keywords?: string[] | null
          preview_gif_url?: string | null
          start_time_seconds?: number
          status?: string | null
          suggested_description?: string | null
          suggested_title?: string | null
          thumbnail_url?: string | null
          title?: string
          total_likes?: number | null
          total_posts?: number | null
          total_shares?: number | null
          total_views?: number | null
          updated_at?: string | null
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clips_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          country: string | null
          created_at: string | null
          email: string
          email_notifications: Json | null
          full_name: string | null
          id: string
          language: string | null
          last_login_at: string | null
          onboarding_completed: boolean | null
          phone_number: string | null
          plan_type: string | null
          processing_preferences: Json | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          timezone: string | null
          updated_at: string | null
          usage_api_calls_current_month: number | null
          usage_clips_generated_total: number | null
          usage_reset_date: string | null
          usage_storage_bytes: number | null
          usage_videos_current_month: number | null
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          email: string
          email_notifications?: Json | null
          full_name?: string | null
          id: string
          language?: string | null
          last_login_at?: string | null
          onboarding_completed?: boolean | null
          phone_number?: string | null
          plan_type?: string | null
          processing_preferences?: Json | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          usage_api_calls_current_month?: number | null
          usage_clips_generated_total?: number | null
          usage_reset_date?: string | null
          usage_storage_bytes?: number | null
          usage_videos_current_month?: number | null
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          email?: string
          email_notifications?: Json | null
          full_name?: string | null
          id?: string
          language?: string | null
          last_login_at?: string | null
          onboarding_completed?: boolean | null
          phone_number?: string | null
          plan_type?: string | null
          processing_preferences?: Json | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          usage_api_calls_current_month?: number | null
          usage_clips_generated_total?: number | null
          usage_reset_date?: string | null
          usage_storage_bytes?: number | null
          usage_videos_current_month?: number | null
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          access_token: string | null
          account_type: string | null
          auto_posting_enabled: boolean | null
          avatar_url: string | null
          avg_views_per_post: number | null
          ayrshare_profile_key: string | null
          ayrshare_status: string | null
          best_posting_times: Json | null
          bio: string | null
          connected_at: string | null
          connection_status: string | null
          created_at: string | null
          daily_post_limit: number | null
          default_hashtags: string[] | null
          display_name: string | null
          engagement_rate: number | null
          hourly_post_limit: number | null
          id: string
          is_active: boolean | null
          last_error_at: string | null
          last_error_message: string | null
          last_post_at: string | null
          last_posted_at: string | null
          last_refreshed_at: string | null
          platform: string
          platform_user_id: string | null
          post_format_template: string | null
          posting_schedule: Json | null
          posts_this_hour: number | null
          posts_today: number | null
          profile_url: string | null
          refresh_token: string | null
          token_expires_at: string | null
          token_scopes: string[] | null
          total_followers: number | null
          total_following: number | null
          updated_at: string | null
          user_id: string
          username: string
          verified: boolean | null
        }
        Insert: {
          access_token?: string | null
          account_type?: string | null
          auto_posting_enabled?: boolean | null
          avatar_url?: string | null
          avg_views_per_post?: number | null
          ayrshare_profile_key?: string | null
          ayrshare_status?: string | null
          best_posting_times?: Json | null
          bio?: string | null
          connected_at?: string | null
          connection_status?: string | null
          created_at?: string | null
          daily_post_limit?: number | null
          default_hashtags?: string[] | null
          display_name?: string | null
          engagement_rate?: number | null
          hourly_post_limit?: number | null
          id?: string
          is_active?: boolean | null
          last_error_at?: string | null
          last_error_message?: string | null
          last_post_at?: string | null
          last_posted_at?: string | null
          last_refreshed_at?: string | null
          platform: string
          platform_user_id?: string | null
          post_format_template?: string | null
          posting_schedule?: Json | null
          posts_this_hour?: number | null
          posts_today?: number | null
          profile_url?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          token_scopes?: string[] | null
          total_followers?: number | null
          total_following?: number | null
          updated_at?: string | null
          user_id: string
          username: string
          verified?: boolean | null
        }
        Update: {
          access_token?: string | null
          account_type?: string | null
          auto_posting_enabled?: boolean | null
          avatar_url?: string | null
          avg_views_per_post?: number | null
          ayrshare_profile_key?: string | null
          ayrshare_status?: string | null
          best_posting_times?: Json | null
          bio?: string | null
          connected_at?: string | null
          connection_status?: string | null
          created_at?: string | null
          daily_post_limit?: number | null
          default_hashtags?: string[] | null
          display_name?: string | null
          engagement_rate?: number | null
          hourly_post_limit?: number | null
          id?: string
          is_active?: boolean | null
          last_error_at?: string | null
          last_error_message?: string | null
          last_post_at?: string | null
          last_posted_at?: string | null
          last_refreshed_at?: string | null
          platform?: string
          platform_user_id?: string | null
          post_format_template?: string | null
          posting_schedule?: Json | null
          posts_this_hour?: number | null
          posts_today?: number | null
          profile_url?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          token_scopes?: string[] | null
          total_followers?: number | null
          total_following?: number | null
          updated_at?: string | null
          user_id?: string
          username?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          analytics_avg_watch_time: number | null
          analytics_click_through_rate: number | null
          analytics_comments: number | null
          analytics_completion_rate: number | null
          analytics_engagement_rate: number | null
          analytics_impressions: number | null
          analytics_last_updated: string | null
          analytics_likes: number | null
          analytics_reach: number | null
          analytics_saves: number | null
          analytics_shares: number | null
          analytics_views: number | null
          ayrshare_post_id: string | null
          clip_id: string
          created_at: string | null
          experiment_id: string | null
          failure_reason: string | null
          hashtags: string[] | null
          id: string
          max_retries: number | null
          media_url: string | null
          mentions: string[] | null
          platform_insights_id: string | null
          platform_post_id: string | null
          platform_post_url: string | null
          platform_specific_data: Json | null
          post_description: string | null
          post_format: string | null
          post_title: string | null
          posted_at: string | null
          publish_immediately: boolean | null
          retry_count: number | null
          scheduled_for: string
          social_account_id: string
          status: string | null
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string
          variant: string | null
        }
        Insert: {
          analytics_avg_watch_time?: number | null
          analytics_click_through_rate?: number | null
          analytics_comments?: number | null
          analytics_completion_rate?: number | null
          analytics_engagement_rate?: number | null
          analytics_impressions?: number | null
          analytics_last_updated?: string | null
          analytics_likes?: number | null
          analytics_reach?: number | null
          analytics_saves?: number | null
          analytics_shares?: number | null
          analytics_views?: number | null
          ayrshare_post_id?: string | null
          clip_id: string
          created_at?: string | null
          experiment_id?: string | null
          failure_reason?: string | null
          hashtags?: string[] | null
          id?: string
          max_retries?: number | null
          media_url?: string | null
          mentions?: string[] | null
          platform_insights_id?: string | null
          platform_post_id?: string | null
          platform_post_url?: string | null
          platform_specific_data?: Json | null
          post_description?: string | null
          post_format?: string | null
          post_title?: string | null
          posted_at?: string | null
          publish_immediately?: boolean | null
          retry_count?: number | null
          scheduled_for: string
          social_account_id: string
          status?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id: string
          variant?: string | null
        }
        Update: {
          analytics_avg_watch_time?: number | null
          analytics_click_through_rate?: number | null
          analytics_comments?: number | null
          analytics_completion_rate?: number | null
          analytics_engagement_rate?: number | null
          analytics_impressions?: number | null
          analytics_last_updated?: string | null
          analytics_likes?: number | null
          analytics_reach?: number | null
          analytics_saves?: number | null
          analytics_shares?: number | null
          analytics_views?: number | null
          ayrshare_post_id?: string | null
          clip_id?: string
          created_at?: string | null
          experiment_id?: string | null
          failure_reason?: string | null
          hashtags?: string[] | null
          id?: string
          max_retries?: number | null
          media_url?: string | null
          mentions?: string[] | null
          platform_insights_id?: string | null
          platform_post_id?: string | null
          platform_post_url?: string | null
          platform_specific_data?: Json | null
          post_description?: string | null
          post_format?: string | null
          post_title?: string | null
          posted_at?: string | null
          publish_immediately?: boolean | null
          retry_count?: number | null
          scheduled_for?: string
          social_account_id?: string
          status?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_clip_id_fkey"
            columns: ["clip_id"]
            isOneToOne: false
            referencedRelation: "clips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount_cents: number
          billing_cycle: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          cancellation_reason: string | null
          created_at: string | null
          currency: string | null
          current_period_end: string
          current_period_start: string
          id: string
          metadata: Json | null
          plan_name: string
          plan_type: string
          status: string
          stripe_customer_id: string
          stripe_price_id: string
          stripe_product_id: string | null
          stripe_subscription_id: string
          tax_percentage: number | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end: string
          current_period_start: string
          id?: string
          metadata?: Json | null
          plan_name: string
          plan_type: string
          status: string
          stripe_customer_id: string
          stripe_price_id: string
          stripe_product_id?: string | null
          stripe_subscription_id: string
          tax_percentage?: number | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          metadata?: Json | null
          plan_name?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string
          stripe_price_id?: string
          stripe_product_id?: string | null
          stripe_subscription_id?: string
          tax_percentage?: number | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          ai_content_type: string | null
          ai_key_moments: Json | null
          ai_main_topics: string[] | null
          ai_suggested_clips: number | null
          cloudinary_format: string | null
          cloudinary_public_id: string | null
          cloudinary_resource_type: string | null
          cloudinary_secure_url: string | null
          codec: string | null
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          error_details: Json | null
          error_message: string | null
          file_size_bytes: number
          fps: number | null
          id: string
          is_archived: boolean | null
          original_filename: string
          processing_completed_at: string | null
          processing_duration_seconds: number | null
          processing_started_at: string | null
          processing_status: string | null
          resolution: string | null
          speakers_detected: number | null
          tags: string[] | null
          title: string
          transcription: Json | null
          transcription_confidence: number | null
          transcription_language: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_content_type?: string | null
          ai_key_moments?: Json | null
          ai_main_topics?: string[] | null
          ai_suggested_clips?: number | null
          cloudinary_format?: string | null
          cloudinary_public_id?: string | null
          cloudinary_resource_type?: string | null
          cloudinary_secure_url?: string | null
          codec?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          error_details?: Json | null
          error_message?: string | null
          file_size_bytes: number
          fps?: number | null
          id?: string
          is_archived?: boolean | null
          original_filename: string
          processing_completed_at?: string | null
          processing_duration_seconds?: number | null
          processing_started_at?: string | null
          processing_status?: string | null
          resolution?: string | null
          speakers_detected?: number | null
          tags?: string[] | null
          title: string
          transcription?: Json | null
          transcription_confidence?: number | null
          transcription_language?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_content_type?: string | null
          ai_key_moments?: Json | null
          ai_main_topics?: string[] | null
          ai_suggested_clips?: number | null
          cloudinary_format?: string | null
          cloudinary_public_id?: string | null
          cloudinary_resource_type?: string | null
          cloudinary_secure_url?: string | null
          codec?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          error_details?: Json | null
          error_message?: string | null
          file_size_bytes?: number
          fps?: number | null
          id?: string
          is_archived?: boolean | null
          original_filename?: string
          processing_completed_at?: string | null
          processing_duration_seconds?: number | null
          processing_started_at?: string | null
          processing_status?: string | null
          resolution?: string | null
          speakers_detected?: number | null
          tags?: string[] | null
          title?: string
          transcription?: Json | null
          transcription_confidence?: number | null
          transcription_language?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_clip_performance: {
        Args: { clip_id: string }
        Returns: undefined
      }
      check_posting_limits: {
        Args: { account_id: string }
        Returns: boolean
      }
      reset_daily_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
