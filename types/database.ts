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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          cancelled_at: string | null
          cancelled_by: Database["public"]["Enums"]["user_role"] | null
          created_at: string
          end_time: string
          home_address: string | null
          id: string
          location_type: Database["public"]["Enums"]["location_type"]
          patient_id: string
          patient_notes: string | null
          service_id: string
          slot: unknown
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          appointment_date: string
          cancelled_at?: string | null
          cancelled_by?: Database["public"]["Enums"]["user_role"] | null
          created_at?: string
          end_time: string
          home_address?: string | null
          id?: string
          location_type: Database["public"]["Enums"]["location_type"]
          patient_id: string
          patient_notes?: string | null
          service_id: string
          slot?: unknown
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          cancelled_at?: string | null
          cancelled_by?: Database["public"]["Enums"]["user_role"] | null
          created_at?: string
          end_time?: string
          home_address?: string | null
          id?: string
          location_type?: Database["public"]["Enums"]["location_type"]
          patient_id?: string
          patient_notes?: string | null
          service_id?: string
          slot?: unknown
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_exceptions: {
        Row: {
          created_at: string
          date: string
          end_time: string | null
          id: string
          is_closed: boolean
          reason: string | null
          start_time: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time?: string | null
          id?: string
          is_closed?: boolean
          reason?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string | null
          id?: string
          is_closed?: boolean
          reason?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      availability_rules: {
        Row: {
          created_at: string
          end_time: string
          id: string
          start_time: string
          updated_at: string
          weekday: number
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          start_time: string
          updated_at?: string
          weekday: number
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          start_time?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          date_of_birth: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          email: string
          full_name: string
          id: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          at_cabinet: boolean
          at_home: boolean
          category: Database["public"]["Enums"]["service_category"]
          created_at: string
          description: string
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          price: number | null
          price_type: Database["public"]["Enums"]["price_type"]
          sessions_included: number | null
          updated_at: string
        }
        Insert: {
          at_cabinet?: boolean
          at_home?: boolean
          category: Database["public"]["Enums"]["service_category"]
          created_at?: string
          description?: string
          duration_minutes: number
          id?: string
          is_active?: boolean
          name: string
          price?: number | null
          price_type?: Database["public"]["Enums"]["price_type"]
          sessions_included?: number | null
          updated_at?: string
        }
        Update: {
          at_cabinet?: boolean
          at_home?: boolean
          category?: Database["public"]["Enums"]["service_category"]
          created_at?: string
          description?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number | null
          price_type?: Database["public"]["Enums"]["price_type"]
          sessions_included?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      book_appointment: {
        Args: {
          p_date: string
          p_home_address?: string
          p_location: Database["public"]["Enums"]["location_type"]
          p_notes?: string
          p_service_id: string
          p_start_time: string
        }
        Returns: string
      }
      cancel_appointment: { Args: { p_id: string }; Returns: undefined }
      get_available_slots: {
        Args: { p_date: string; p_service_id: string }
        Returns: {
          end_time: string
          start_time: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      now_local: { Args: never; Returns: string }
      set_appointment_status: {
        Args: {
          p_id: string
          p_status: Database["public"]["Enums"]["appointment_status"]
        }
        Returns: undefined
      }
    }
    Enums: {
      appointment_status: "pending" | "confirmed" | "completed" | "cancelled"
      location_type: "cabinet" | "home"
      price_type: "session" | "package"
      service_category:
        | "kinesitherapie"
        | "massage"
        | "hijama"
        | "diabetes_care"
      user_role: "patient" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      appointment_status: ["pending", "confirmed", "completed", "cancelled"],
      location_type: ["cabinet", "home"],
      price_type: ["session", "package"],
      service_category: [
        "kinesitherapie",
        "massage",
        "hijama",
        "diabetes_care",
      ],
      user_role: ["patient", "admin"],
    },
  },
} as const
