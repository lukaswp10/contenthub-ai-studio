export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          plan: string
          credits_used: number
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          plan?: string
          credits_used?: number
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          plan?: string
          credits_used?: number
          created_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          user_id: string
          filename: string
          size: number | null
          duration: number | null
          status: string
          storage_path: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          size?: number | null
          duration?: number | null
          status?: string
          storage_path?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          size?: number | null
          duration?: number | null
          status?: string
          storage_path?: string | null
          created_at?: string
        }
      }
    }
  }
}
