export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
      }
      child_profiles: {
        Row: {
          id: string
          parent_id: string
          name: string
          age_group: '0-3' | '4-6' | '7-11'
          avatar: string
          created_at: string
        }
        Insert: {
          id?: string
          parent_id: string
          name: string
          age_group: '0-3' | '4-6' | '7-11'
          avatar: string
          created_at?: string
        }
        Update: {
          id?: string
          parent_id?: string
          name?: string
          age_group?: '0-3' | '4-6' | '7-11'
          avatar?: string
          created_at?: string
        }
      }
    }
  }
}