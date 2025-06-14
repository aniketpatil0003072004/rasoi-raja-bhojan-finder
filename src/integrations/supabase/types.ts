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
      menus: {
        Row: {
          breakfast: string | null
          day: Database["public"]["Enums"]["day_of_week"]
          dinner: string | null
          id: string
          lunch: string | null
          mess_id: string
        }
        Insert: {
          breakfast?: string | null
          day: Database["public"]["Enums"]["day_of_week"]
          dinner?: string | null
          id?: string
          lunch?: string | null
          mess_id: string
        }
        Update: {
          breakfast?: string | null
          day?: Database["public"]["Enums"]["day_of_week"]
          dinner?: string | null
          id?: string
          lunch?: string | null
          mess_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menus_mess_id_fkey"
            columns: ["mess_id"]
            isOneToOne: false
            referencedRelation: "messes"
            referencedColumns: ["id"]
          },
        ]
      }
      messes: {
        Row: {
          address: string | null
          contact: string | null
          created_at: string
          cuisine: string[] | null
          description: string | null
          id: string
          image_url: string | null
          is_verified: boolean | null
          monthly_price: number | null
          name: string
          offers_delivery: boolean | null
          operating_hours: string | null
          owner_id: string | null
          rating: number | null
          review_count: number | null
        }
        Insert: {
          address?: string | null
          contact?: string | null
          created_at?: string
          cuisine?: string[] | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_verified?: boolean | null
          monthly_price?: number | null
          name: string
          offers_delivery?: boolean | null
          operating_hours?: string | null
          owner_id?: string | null
          rating?: number | null
          review_count?: number | null
        }
        Update: {
          address?: string | null
          contact?: string | null
          created_at?: string
          cuisine?: string[] | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_verified?: boolean | null
          monthly_price?: number | null
          name?: string
          offers_delivery?: boolean | null
          operating_hours?: string | null
          owner_id?: string | null
          rating?: number | null
          review_count?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          full_name: string | null
          id: string
          phone_number: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          full_name?: string | null
          id: string
          phone_number?: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          end_date: string
          id: string
          mess_id: string
          owner_confirmation_screenshot_url: string | null
          payment_screenshot_url: string | null
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          mess_id: string
          owner_confirmation_screenshot_url?: string | null
          payment_screenshot_url?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["subscription_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          mess_id?: string
          owner_confirmation_screenshot_url?: string | null
          payment_screenshot_url?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_mess_id_fkey"
            columns: ["mess_id"]
            isOneToOne: false
            referencedRelation: "messes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "student" | "mess_owner" | "delivery_personnel"
      day_of_week:
        | "Monday"
        | "Tuesday"
        | "Wednesday"
        | "Thursday"
        | "Friday"
        | "Saturday"
        | "Sunday"
      subscription_status: "pending_owner_confirmation" | "active" | "rejected"
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
    Enums: {
      app_role: ["student", "mess_owner", "delivery_personnel"],
      day_of_week: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      subscription_status: ["pending_owner_confirmation", "active", "rejected"],
    },
  },
} as const
