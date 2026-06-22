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
      email_deliveries: {
        Row: {
          bounce_type: string | null
          complaint_type: string | null
          created_at: string
          delivery_id: string
          from_address: string
          last_event: string | null
          last_event_at: string | null
          reply_to: string | null
          subject: string | null
          to_address: string
          updated_at: string | null
        }
        Insert: {
          bounce_type?: string | null
          complaint_type?: string | null
          created_at?: string
          delivery_id: string
          from_address: string
          last_event?: string | null
          last_event_at?: string | null
          reply_to?: string | null
          subject?: string | null
          to_address: string
          updated_at?: string | null
        }
        Update: {
          bounce_type?: string | null
          complaint_type?: string | null
          created_at?: string
          delivery_id?: string
          from_address?: string
          last_event?: string | null
          last_event_at?: string | null
          reply_to?: string | null
          subject?: string | null
          to_address?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_deliveries_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: true
            referencedRelation: "notification_deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_deliveries: {
        Row: {
          attempts: number
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          delivered_at: string | null
          error: string | null
          failed_at: string | null
          id: string
          idempotency_key: string
          payload: Json
          provider: string | null
          provider_message_id: string | null
          recipient: string
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_delivery_status"]
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          delivered_at?: string | null
          error?: string | null
          failed_at?: string | null
          id?: string
          idempotency_key: string
          payload?: Json
          provider?: string | null
          provider_message_id?: string | null
          recipient: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_delivery_status"]
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          delivered_at?: string | null
          error?: string | null
          failed_at?: string | null
          id?: string
          idempotency_key?: string
          payload?: Json
          provider?: string | null
          provider_message_id?: string | null
          recipient?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_delivery_status"]
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pool_closure_analysis: {
        Row: {
          closure_date: string | null
          confidence_score: number | null
          created_at: string
          flags: string[]
          id: string
          pool_update_id: string
          reasoning: string | null
          reopening_date: string | null
          updated_at: string | null
        }
        Insert: {
          closure_date?: string | null
          confidence_score?: number | null
          created_at?: string
          flags?: string[]
          id?: string
          pool_update_id: string
          reasoning?: string | null
          reopening_date?: string | null
          updated_at?: string | null
        }
        Update: {
          closure_date?: string | null
          confidence_score?: number | null
          created_at?: string
          flags?: string[]
          id?: string
          pool_update_id?: string
          reasoning?: string | null
          reopening_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pool_closure_analysis_pool_update_id_fkey"
            columns: ["pool_update_id"]
            isOneToOne: true
            referencedRelation: "pool_updates"
            referencedColumns: ["id"]
          },
        ]
      }
      pool_updates: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          message: string | null
          source: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          message?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          message?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      notification_channel: "email" | "sms"
      notification_delivery_status:
        | "pending"
        | "sending"
        | "sent"
        | "delivered"
        | "failed"
        | "cancelled"
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
      notification_channel: ["email", "sms"],
      notification_delivery_status: [
        "pending",
        "sending",
        "sent",
        "delivered",
        "failed",
        "cancelled",
      ],
    },
  },
} as const

