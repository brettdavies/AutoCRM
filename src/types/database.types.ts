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
      counts: {
        Row: {
          id: number
          value: number | null
        }
        Insert: {
          id?: number
          value?: number | null
        }
        Update: {
          id?: number
          value?: number | null
        }
      }
      personal_counts: {
        Row: {
          user_id: string
          value: number
        }
        Insert: {
          user_id: string
          value?: number
        }
        Update: {
          user_id?: string
          value?: number
        }
      }
    }
  }
} 