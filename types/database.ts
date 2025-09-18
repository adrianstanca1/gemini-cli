// Database types for Supabase integration
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
      companies: {
        Row: {
          id: string
          name: string
          type: 'GENERAL_CONTRACTOR' | 'SUBCONTRACTOR' | 'SUPPLIER' | 'CONSULTANT' | 'CLIENT'
          address: Json
          phone: string | null
          email: string | null
          website: string | null
          logo: string | null
          settings: Json
          subscription_plan: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
          is_active: boolean
          storage_usage_gb: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'GENERAL_CONTRACTOR' | 'SUBCONTRACTOR' | 'SUPPLIER' | 'CONSULTANT' | 'CLIENT'
          address: Json
          phone?: string | null
          email?: string | null
          website?: string | null
          logo?: string | null
          settings?: Json
          subscription_plan?: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
          is_active?: boolean
          storage_usage_gb?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'GENERAL_CONTRACTOR' | 'SUBCONTRACTOR' | 'SUPPLIER' | 'CONSULTANT' | 'CLIENT'
          address?: Json
          phone?: string | null
          email?: string | null
          website?: string | null
          logo?: string | null
          settings?: Json
          subscription_plan?: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
          is_active?: boolean
          storage_usage_gb?: number
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          company_id: string | null
          first_name: string
          last_name: string
          email: string
          password_hash: string
          phone: string | null
          avatar: string | null
          role: 'OWNER' | 'PRINCIPAL_ADMIN' | 'ADMIN' | 'PROJECT_MANAGER' | 'FOREMAN' | 'OPERATIVE'
          permissions: Json
          preferences: Json
          mfa_enabled: boolean
          mfa_secret: string | null
          is_active: boolean
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          first_name: string
          last_name: string
          email: string
          password_hash: string
          phone?: string | null
          avatar?: string | null
          role: 'OWNER' | 'PRINCIPAL_ADMIN' | 'ADMIN' | 'PROJECT_MANAGER' | 'FOREMAN' | 'OPERATIVE'
          permissions?: Json
          preferences?: Json
          mfa_enabled?: boolean
          mfa_secret?: string | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          first_name?: string
          last_name?: string
          email?: string
          password_hash?: string
          phone?: string | null
          avatar?: string | null
          role?: 'OWNER' | 'PRINCIPAL_ADMIN' | 'ADMIN' | 'PROJECT_MANAGER' | 'FOREMAN' | 'OPERATIVE'
          permissions?: Json
          preferences?: Json
          mfa_enabled?: boolean
          mfa_secret?: string | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          company_id: string | null
          name: string
          description: string | null
          status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
          budget: number | null
          actual_cost: number
          progress: number
          start_date: string | null
          end_date: string | null
          location: Json
          image: string | null
          client_id: string | null
          project_manager_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          name: string
          description?: string | null
          status?: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
          budget?: number | null
          actual_cost?: number
          progress?: number
          start_date?: string | null
          end_date?: string | null
          location: Json
          image?: string | null
          client_id?: string | null
          project_manager_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          name?: string
          description?: string | null
          status?: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
          budget?: number | null
          actual_cost?: number
          progress?: number
          start_date?: string | null
          end_date?: string | null
          location?: Json
          image?: string | null
          client_id?: string | null
          project_manager_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      todos: {
        Row: {
          id: string
          project_id: string | null
          title: string
          description: string | null
          status: 'TODO' | 'IN_PROGRESS' | 'DONE'
          priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
          progress: number
          assigned_to: string | null
          created_by: string | null
          due_date: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          title: string
          description?: string | null
          status?: 'TODO' | 'IN_PROGRESS' | 'DONE'
          priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
          progress?: number
          assigned_to?: string | null
          created_by?: string | null
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string | null
          title?: string
          description?: string | null
          status?: 'TODO' | 'IN_PROGRESS' | 'DONE'
          priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
          progress?: number
          assigned_to?: string | null
          created_by?: string | null
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      time_entries: {
        Row: {
          id: string
          user_id: string | null
          project_id: string | null
          task_id: string | null
          start_time: string
          end_time: string | null
          duration_minutes: number | null
          description: string | null
          location: Json | null
          status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          project_id?: string | null
          task_id?: string | null
          start_time: string
          end_time?: string | null
          duration_minutes?: number | null
          description?: string | null
          location?: Json | null
          status?: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          project_id?: string | null
          task_id?: string | null
          start_time?: string
          end_time?: string | null
          duration_minutes?: number | null
          description?: string | null
          location?: Json | null
          status?: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
