export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admins: {
        Row: { created_at: string; email: string; id: string; name: string | null }
        Insert: { created_at?: string; email: string; id?: string; name?: string | null }
        Update: { created_at?: string; email?: string; id?: string; name?: string | null }
        Relationships: []
      }
      ads: {
        Row: { active: boolean; advertiser: string | null; content: string | null; created_at: string; id: string; image_url: string | null; label: string; link: string | null; title: string | null; updated_at: string }
        Insert: { active?: boolean; advertiser?: string | null; content?: string | null; created_at?: string; id?: string; image_url?: string | null; label?: string; link?: string | null; title?: string | null; updated_at?: string }
        Update: { active?: boolean; advertiser?: string | null; content?: string | null; created_at?: string; id?: string; image_url?: string | null; label?: string; link?: string | null; title?: string | null; updated_at?: string }
        Relationships: []
      }
      ads_calendar: {
        Row: { ad_id: string | null; created_at: string; id: string; placement: string; scheduled_date: string; updated_at: string }
        Insert: { ad_id?: string | null; created_at?: string; id?: string; placement?: string; scheduled_date: string; updated_at?: string }
        Update: { ad_id?: string | null; created_at?: string; id?: string; placement?: string; scheduled_date?: string; updated_at?: string }
        Relationships: []
      }
      ai_models_config: {
        Row: { created_at: string; id: string; max_tokens: number | null; model: string; params: Json; task: string; temperature: number; updated_at: string }
        Insert: { created_at?: string; id?: string; max_tokens?: number | null; model: string; params?: Json; task: string; temperature?: number; updated_at?: string }
        Update: { created_at?: string; id?: string; max_tokens?: number | null; model?: string; params?: Json; task?: string; temperature?: number; updated_at?: string }
        Relationships: []
      }
      app_settings: {
        Row: { key: string; updated_at: string; value: Json }
        Insert: { key: string; updated_at?: string; value?: Json }
        Update: { key?: string; updated_at?: string; value?: Json }
        Relationships: []
      }
      brand_config: {
        Row: { accent_color: string | null; banned_words: string[]; created_at: string; id: string; logo_url: string | null; name: string; primary_color: string | null; settings: Json; singleton: boolean; tagline: string | null; tone: string | null; updated_at: string }
        Insert: { accent_color?: string | null; banned_words?: string[]; created_at?: string; id?: string; logo_url?: string | null; name?: string; primary_color?: string | null; settings?: Json; singleton?: boolean; tagline?: string | null; tone?: string | null; updated_at?: string }
        Update: { accent_color?: string | null; banned_words?: string[]; created_at?: string; id?: string; logo_url?: string | null; name?: string; primary_color?: string | null; settings?: Json; singleton?: boolean; tagline?: string | null; tone?: string | null; updated_at?: string }
        Relationships: []
      }
      categories: {
        Row: { active: boolean; created_at: string; description: string | null; id: string; name_ar: string; slug: string; sort_order: number; updated_at: string }
        Insert: { active?: boolean; created_at?: string; description?: string | null; id?: string; name_ar: string; slug: string; sort_order?: number; updated_at?: string }
        Update: { active?: boolean; created_at?: string; description?: string | null; id?: string; name_ar?: string; slug?: string; sort_order?: number; updated_at?: string }
        Relationships: []
      }
      draft_issues: {
        Row: { ad_id: string | null; body: Json; channel_variants: Json; cover_image_url: string | null; created_at: string; gift_id: string | null; id: string; intro: string | null; issue_date: string | null; main_topic: string | null; meta: Json; status: string; title: string | null; type: string; updated_at: string }
        Insert: { ad_id?: string | null; body?: Json; channel_variants?: Json; cover_image_url?: string | null; created_at?: string; gift_id?: string | null; id?: string; intro?: string | null; issue_date?: string | null; main_topic?: string | null; meta?: Json; status?: string; title?: string | null; type?: string; updated_at?: string }
        Update: { ad_id?: string | null; body?: Json; channel_variants?: Json; cover_image_url?: string | null; created_at?: string; gift_id?: string | null; id?: string; intro?: string | null; issue_date?: string | null; main_topic?: string | null; meta?: Json; status?: string; title?: string | null; type?: string; updated_at?: string }
        Relationships: []
      }
      errors_log: {
        Row: { created_at: string; detail: Json; id: string; level: string; message: string | null; source: string | null }
        Insert: { created_at?: string; detail?: Json; id?: string; level?: string; message?: string | null; source?: string | null }
        Update: { created_at?: string; detail?: Json; id?: string; level?: string; message?: string | null; source?: string | null }
        Relationships: []
      }
      feedback_ratings: {
        Row: { created_at: string; id: string; ip_hash: string | null; issue_id: string | null; news_ref: string | null; rating: string }
        Insert: { created_at?: string; id?: string; ip_hash?: string | null; issue_id?: string | null; news_ref?: string | null; rating: string }
        Update: { created_at?: string; id?: string; ip_hash?: string | null; issue_id?: string | null; news_ref?: string | null; rating?: string }
        Relationships: []
      }
      gifts: {
        Row: { active: boolean; category_id: string | null; content: string | null; created_at: string; description: string | null; file_url: string | null; id: string; tags: string[]; title: string; type: string; updated_at: string }
        Insert: { active?: boolean; category_id?: string | null; content?: string | null; created_at?: string; description?: string | null; file_url?: string | null; id?: string; tags?: string[]; title: string; type: string; updated_at?: string }
        Update: { active?: boolean; category_id?: string | null; content?: string | null; created_at?: string; description?: string | null; file_url?: string | null; id?: string; tags?: string[]; title?: string; type?: string; updated_at?: string }
        Relationships: []
      }
      gifts_scheduled: {
        Row: { created_at: string; gift_id: string | null; id: string; note: string | null; scheduled_date: string; updated_at: string }
        Insert: { created_at?: string; gift_id?: string | null; id?: string; note?: string | null; scheduled_date: string; updated_at?: string }
        Update: { created_at?: string; gift_id?: string | null; id?: string; note?: string | null; scheduled_date?: string; updated_at?: string }
        Relationships: []
      }
      gifts_used: {
        Row: { created_at: string; gift_id: string | null; id: string; issue_id: string | null; used_on: string }
        Insert: { created_at?: string; gift_id?: string | null; id?: string; issue_id?: string | null; used_on?: string }
        Update: { created_at?: string; gift_id?: string | null; id?: string; issue_id?: string | null; used_on?: string }
        Relationships: []
      }
      pipeline_runs: {
        Row: { created_at: string; error: string | null; finished_at: string | null; id: string; run_date: string; started_at: string; state: Json; status: string; type: string; updated_at: string }
        Insert: { created_at?: string; error?: string | null; finished_at?: string | null; id?: string; run_date?: string; started_at?: string; state?: Json; status?: string; type?: string; updated_at?: string }
        Update: { created_at?: string; error?: string | null; finished_at?: string | null; id?: string; run_date?: string; started_at?: string; state?: Json; status?: string; type?: string; updated_at?: string }
        Relationships: []
      }
      processed_items: {
        Row: { analysis: Json; audience: string[]; category_id: string | null; created_at: string; id: string; importance: number | null; novelty: number | null; raw_item_id: string | null; rejected_reason: string | null; risk: number | null; selected: boolean; source_trust: number | null; summary: string | null; updated_at: string }
        Insert: { analysis?: Json; audience?: string[]; category_id?: string | null; created_at?: string; id?: string; importance?: number | null; novelty?: number | null; raw_item_id?: string | null; rejected_reason?: string | null; risk?: number | null; selected?: boolean; source_trust?: number | null; summary?: string | null; updated_at?: string }
        Update: { analysis?: Json; audience?: string[]; category_id?: string | null; created_at?: string; id?: string; importance?: number | null; novelty?: number | null; raw_item_id?: string | null; rejected_reason?: string | null; risk?: number | null; selected?: boolean; source_trust?: number | null; summary?: string | null; updated_at?: string }
        Relationships: []
      }
      published_issues: {
        Row: { body: Json; channel_results: Json; cover_image_url: string | null; created_at: string; draft_issue_id: string | null; id: string; issue_date: string | null; published_at: string; slug: string | null; title: string | null; type: string; updated_at: string }
        Insert: { body?: Json; channel_results?: Json; cover_image_url?: string | null; created_at?: string; draft_issue_id?: string | null; id?: string; issue_date?: string | null; published_at?: string; slug?: string | null; title?: string | null; type?: string; updated_at?: string }
        Update: { body?: Json; channel_results?: Json; cover_image_url?: string | null; created_at?: string; draft_issue_id?: string | null; id?: string; issue_date?: string | null; published_at?: string; slug?: string | null; title?: string | null; type?: string; updated_at?: string }
        Relationships: []
      }
      publishing_channels: {
        Row: { channel: string; config: Json; created_at: string; enabled: boolean; id: string; updated_at: string }
        Insert: { channel: string; config?: Json; created_at?: string; enabled?: boolean; id?: string; updated_at?: string }
        Update: { channel?: string; config?: Json; created_at?: string; enabled?: boolean; id?: string; updated_at?: string }
        Relationships: []
      }
      raw_items: {
        Row: { content: string | null; created_at: string; fetched_at: string; id: string; raw: Json; source_id: string | null; title: string | null; updated_at: string; url: string | null; url_hash: string | null }
        Insert: { content?: string | null; created_at?: string; fetched_at?: string; id?: string; raw?: Json; source_id?: string | null; title?: string | null; updated_at?: string; url?: string | null; url_hash?: string | null }
        Update: { content?: string | null; created_at?: string; fetched_at?: string; id?: string; raw?: Json; source_id?: string | null; title?: string | null; updated_at?: string; url?: string | null; url_hash?: string | null }
        Relationships: []
      }
      sources: {
        Row: { active: boolean; config: Json; created_at: string; fetch_interval_minutes: number; id: string; last_fetched_at: string | null; name: string; trust_score: number; type: string; updated_at: string; url: string | null }
        Insert: { active?: boolean; config?: Json; created_at?: string; fetch_interval_minutes?: number; id?: string; last_fetched_at?: string | null; name: string; trust_score?: number; type: string; updated_at?: string; url?: string | null }
        Update: { active?: boolean; config?: Json; created_at?: string; fetch_interval_minutes?: number; id?: string; last_fetched_at?: string | null; name?: string; trust_score?: number; type?: string; updated_at?: string; url?: string | null }
        Relationships: []
      }
      subscribers: {
        Row: { confirmation_token: string | null; confirmed_at: string | null; created_at: string; email: string; id: string; name: string | null; source: string | null; status: string; unsubscribe_token: string | null; updated_at: string }
        Insert: { confirmation_token?: string | null; confirmed_at?: string | null; created_at?: string; email: string; id?: string; name?: string | null; source?: string | null; status?: string; unsubscribe_token?: string | null; updated_at?: string }
        Update: { confirmation_token?: string | null; confirmed_at?: string | null; created_at?: string; email?: string; id?: string; name?: string | null; source?: string | null; status?: string; unsubscribe_token?: string | null; updated_at?: string }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { is_admin: { Args: Record<string, never>; Returns: boolean } }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicSchema = Database["public"]
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"]
