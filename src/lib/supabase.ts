import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          id: string
          workspace_type: string
          date: string
          time_slot: string
          duration: string
          customer_name: string
          customer_email: string
          customer_phone: string
          customer_whatsapp: string
          total_price: number
          status: 'pending' | 'confirmed' | 'rejected' | 'cancelled'
          confirmation_code: string | null
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_type: string
          date: string
          time_slot: string
          duration: string
          customer_name: string
          customer_email: string
          customer_phone: string
          customer_whatsapp: string
          total_price: number
          status?: 'pending' | 'confirmed' | 'rejected' | 'cancelled'
          confirmation_code?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_type?: string
          date?: string
          time_slot?: string
          duration?: string
          customer_name?: string
          customer_email?: string
          customer_phone?: string
          customer_whatsapp?: string
          total_price?: number
          status?: 'pending' | 'confirmed' | 'rejected' | 'cancelled'
          confirmation_code?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      admin_notes: {
        Row: {
          id: string
          user_id: string
          admin_id: string
          note_content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          admin_id: string
          note_content: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          admin_id?: string
          note_content?: string
          created_at?: string
        }
      }
      user_activity_log: {
        Row: {
          id: string
          user_id: string
          action: string
          details: any | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          details?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          details?: any | null
          created_at?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          user_subscription_id: string | null
          booking_id: string | null
          session_type: string
          start_time: string
          end_time: string | null
          duration_minutes: number | null
          hours_deducted: number
          minutes_deducted: number
          status: string
          started_by: string
          ended_by: string | null
          confirmation_required: boolean
          confirmed_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          user_subscription_id?: string | null
          booking_id?: string | null
          session_type?: string
          start_time?: string
          end_time?: string | null
          duration_minutes?: number | null
          hours_deducted?: number
          minutes_deducted?: number
          status?: string
          started_by: string
          ended_by?: string | null
          confirmation_required?: boolean
          confirmed_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          user_subscription_id?: string | null
          booking_id?: string | null
          session_type?: string
          start_time?: string
          end_time?: string | null
          duration_minutes?: number | null
          hours_deducted?: number
          minutes_deducted?: number
          status?: string
          started_by?: string
          ended_by?: string | null
          confirmation_required?: boolean
          confirmed_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workspace_types: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          price_unit: string
          image_url: string | null
          features: string[]
          is_active: boolean
          created_at: string
          updated_at: string
          whatsapp?: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: number
          price_unit: string
          image_url?: string | null
          whatsapp?: string
          features?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          whatsapp?: string
          description?: string
          price?: number
          price_unit?: string
          image_url?: string | null
          features?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      content_items: {
        Row: {
          id: string
          title: string
          type: string
          content: string
          metadata: any | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          type: string
          content: string
          metadata?: any | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          type?: string
          content?: string
          metadata?: any | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}