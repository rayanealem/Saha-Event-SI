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
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_id: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_id?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_id?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          kyc_rejection_reason: string | null
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          kyc_rejection_reason?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          kyc_rejection_reason?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      reservations: {
        Row: {
          ccp_receipt_url: string | null
          client_id: string
          client_message: string | null
          created_at: string
          deposit_amount: number
          end_date: string
          id: string
          reference_code: string
          refusal_reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["reservation_status"]
          total_price: number
          venue_id: string
        }
        Insert: {
          ccp_receipt_url?: string | null
          client_id: string
          client_message?: string | null
          created_at?: string
          deposit_amount: number
          end_date: string
          id?: string
          reference_code: string
          refusal_reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["reservation_status"]
          total_price: number
          venue_id: string
        }
        Update: {
          ccp_receipt_url?: string | null
          client_id?: string
          client_message?: string | null
          created_at?: string
          deposit_amount?: number
          end_date?: string
          id?: string
          reference_code?: string
          refusal_reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          total_price?: number
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          reservation_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reservation_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_documents: {
        Row: {
          created_at: string
          doc_type: Database["public"]["Enums"]["document_type"]
          id: string
          note: string | null
          owner_id: string
          status: Database["public"]["Enums"]["doc_status"]
          url: string
          venue_id: string | null
        }
        Insert: {
          created_at?: string
          doc_type: Database["public"]["Enums"]["document_type"]
          id?: string
          note?: string | null
          owner_id: string
          status?: Database["public"]["Enums"]["doc_status"]
          url: string
          venue_id?: string | null
        }
        Update: {
          created_at?: string
          doc_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          note?: string | null
          owner_id?: string
          status?: Database["public"]["Enums"]["doc_status"]
          url?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_documents_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_documents_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_photos: {
        Row: {
          created_at: string
          display_order: number
          id: string
          url: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          url: string
          venue_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          url?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_photos_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string
          area_m2: number
          capacity_max: number
          ccp_key: string | null
          ccp_name: string | null
          ccp_number: string | null
          created_at: string
          deposit_percentage: number
          description: string | null
          id: string
          name: string
          options: Json
          owner_id: string
          price_per_day: number
          status: Database["public"]["Enums"]["venue_status"]
          wilaya: string
        }
        Insert: {
          address: string
          area_m2: number
          capacity_max: number
          ccp_key?: string | null
          ccp_name?: string | null
          ccp_number?: string | null
          created_at?: string
          deposit_percentage?: number
          description?: string | null
          id?: string
          name: string
          options?: Json
          owner_id: string
          price_per_day: number
          status?: Database["public"]["Enums"]["venue_status"]
          wilaya: string
        }
        Update: {
          address?: string
          area_m2?: number
          capacity_max?: number
          ccp_key?: string | null
          ccp_name?: string | null
          ccp_number?: string | null
          created_at?: string
          deposit_percentage?: number
          description?: string | null
          id?: string
          name?: string
          options?: Json
          owner_id?: string
          price_per_day?: number
          status?: Database["public"]["Enums"]["venue_status"]
          wilaya?: string
        }
        Relationships: [
          {
            foreignKeyName: "venues_owner_id_fkey"
            columns: ["owner_id"]
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
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      doc_status: "PENDING" | "APPROVED" | "REJECTED"
      document_type:
        | "CIN_RECTO"
        | "CIN_VERSO"
        | "SELFIE"
        | "ACTE"
        | "CONTRAT"
        | "AUTORISATION"
        | "REGISTRE"
        | "AUTRE"
      kyc_status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "EXPIRED" | "REJECTED"
      notification_type:
        | "booking_request"
        | "booking_confirmed"
        | "booking_refused"
        | "account_approved"
        | "account_refused"
        | "new_document"
      reservation_status:
        | "PENDING"
        | "CONFIRMED"
        | "CANCELLED"
        | "COMPLETED"
        | "RECEIPT_INVALID"
      user_role: "CLIENT" | "OWNER" | "ADMIN"
      venue_status:
        | "DRAFT"
        | "PUBLISHED"
        | "SUSPENDED"
        | "PENDING_APPROVAL"
        | "REJECTED"
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
      doc_status: ["PENDING", "APPROVED", "REJECTED"],
      document_type: [
        "CIN_RECTO",
        "CIN_VERSO",
        "SELFIE",
        "ACTE",
        "CONTRAT",
        "AUTORISATION",
        "REGISTRE",
        "AUTRE",
      ],
      kyc_status: ["UNVERIFIED", "PENDING", "VERIFIED", "EXPIRED", "REJECTED"],
      notification_type: [
        "booking_request",
        "booking_confirmed",
        "booking_refused",
        "account_approved",
        "account_refused",
        "new_document",
      ],
      reservation_status: [
        "PENDING",
        "CONFIRMED",
        "CANCELLED",
        "COMPLETED",
        "RECEIPT_INVALID",
      ],
      user_role: ["CLIENT", "OWNER", "ADMIN"],
      venue_status: [
        "DRAFT",
        "PUBLISHED",
        "SUSPENDED",
        "PENDING_APPROVAL",
        "REJECTED",
      ],
    },
  },
} as const
