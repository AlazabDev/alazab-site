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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_secrets: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      branches: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      chatbot_knowledge: {
        Row: {
          category: string
          content: string
          created_at: string
          file_name: string | null
          id: string
          is_active: boolean
          source_type: string
          title: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          file_name?: string | null
          id?: string
          is_active?: boolean
          source_type?: string
          title: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          file_name?: string | null
          id?: string
          is_active?: boolean
          source_type?: string
          title?: string
        }
        Relationships: []
      }
      conversation_analytics: {
        Row: {
          action_items: Json | null
          conversation_id: string
          created_at: string | null
          entities: Json | null
          id: number
          sentiment_label: string | null
          sentiment_score: number | null
          summary: string | null
          topics: string[] | null
          updated_at: string | null
        }
        Insert: {
          action_items?: Json | null
          conversation_id: string
          created_at?: string | null
          entities?: Json | null
          id?: number
          sentiment_label?: string | null
          sentiment_score?: number | null
          summary?: string | null
          topics?: string[] | null
          updated_at?: string | null
        }
        Update: {
          action_items?: Json | null
          conversation_id?: string
          created_at?: string | null
          entities?: Json | null
          id?: number
          sentiment_label?: string | null
          sentiment_score?: number | null
          summary?: string | null
          topics?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          agent_id: string | null
          analysis: Json | null
          audio_url: string | null
          conversation_id: string
          created_at: string | null
          duration_seconds: number | null
          dynamic_variables: Json | null
          ended_at: string | null
          failure_metadata: Json | null
          failure_reason: string | null
          has_audio: boolean | null
          has_transcript: boolean | null
          id: number
          started_at: string | null
          status: string | null
          telephony_metadata: Json | null
          transcript: Json | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          analysis?: Json | null
          audio_url?: string | null
          conversation_id: string
          created_at?: string | null
          duration_seconds?: number | null
          dynamic_variables?: Json | null
          ended_at?: string | null
          failure_metadata?: Json | null
          failure_reason?: string | null
          has_audio?: boolean | null
          has_transcript?: boolean | null
          id?: number
          started_at?: string | null
          status?: string | null
          telephony_metadata?: Json | null
          transcript?: Json | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          analysis?: Json | null
          audio_url?: string | null
          conversation_id?: string
          created_at?: string | null
          duration_seconds?: number | null
          dynamic_variables?: Json | null
          ended_at?: string | null
          failure_metadata?: Json | null
          failure_reason?: string | null
          has_audio?: boolean | null
          has_transcript?: boolean | null
          id?: number
          started_at?: string | null
          status?: string | null
          telephony_metadata?: Json | null
          transcript?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      finishing_levels: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          name_en: string | null
          price_per_sqm: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_en?: string | null
          price_per_sqm?: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_en?: string | null
          price_per_sqm?: number
          sort_order?: number
        }
        Relationships: []
      }
      followup_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          conversation_id: string
          created_at: string | null
          description: string | null
          due_date: string | null
          id: number
          metadata: Json | null
          priority: string | null
          status: string | null
          task_type: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          conversation_id: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: number
          metadata?: Json | null
          priority?: string | null
          status?: string | null
          task_type?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          conversation_id?: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: number
          metadata?: Json | null
          priority?: string | null
          status?: string | null
          task_type?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      integrations: {
        Row: {
          config: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          project_id: string
          type: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          project_id: string
          type: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          project_id?: string
          type?: string
        }
        Relationships: []
      }
      keepalive: {
        Row: {
          id: number
        }
        Insert: {
          id: number
        }
        Update: {
          id?: number
        }
        Relationships: []
      }
      login_otp: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string
          id: string
          phone: string
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          phone: string
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          phone?: string
        }
        Relationships: []
      }
      maintenance_requests: {
        Row: {
          actual_cost: number | null
          branch_id: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          company_id: string | null
          created_at: string
          description: string | null
          estimated_cost: number | null
          id: string
          location: string | null
          priority: string | null
          service_type: string | null
          sla_due_date: string | null
          status: Database["public"]["Enums"]["mr_status"]
          title: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          branch_id?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          location?: string | null
          priority?: string | null
          service_type?: string | null
          sla_due_date?: string | null
          status?: Database["public"]["Enums"]["mr_status"]
          title: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          branch_id?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          location?: string | null
          priority?: string | null
          service_type?: string | null
          sla_due_date?: string | null
          status?: Database["public"]["Enums"]["mr_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      media_files: {
        Row: {
          contact_id: string | null
          created_at: string | null
          file_size: number | null
          id: string
          media_id: string | null
          message_id: string | null
          metadata: Json | null
          mime_type: string | null
          project_id: string
          public_url: string | null
          storage_path: string | null
          whatsapp_number_id: string
          workflow_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          file_size?: number | null
          id?: string
          media_id?: string | null
          message_id?: string | null
          metadata?: Json | null
          mime_type?: string | null
          project_id: string
          public_url?: string | null
          storage_path?: string | null
          whatsapp_number_id: string
          workflow_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          file_size?: number | null
          id?: string
          media_id?: string | null
          message_id?: string | null
          metadata?: Json | null
          mime_type?: string | null
          project_id?: string
          public_url?: string | null
          storage_path?: string | null
          whatsapp_number_id?: string
          workflow_id?: string
        }
        Relationships: []
      }
      media_messages: {
        Row: {
          conversation_id: string
          file_size: number | null
          id: number
          is_processed: boolean | null
          media_base64: string | null
          media_type: string | null
          media_url: string | null
          mime_type: string | null
          processed_at: string | null
          received_at: string | null
          transcript: string | null
        }
        Insert: {
          conversation_id: string
          file_size?: number | null
          id?: number
          is_processed?: boolean | null
          media_base64?: string | null
          media_type?: string | null
          media_url?: string | null
          mime_type?: string | null
          processed_at?: string | null
          received_at?: string | null
          transcript?: string | null
        }
        Update: {
          conversation_id?: string
          file_size?: number | null
          id?: number
          is_processed?: boolean | null
          media_base64?: string | null
          media_type?: string | null
          media_url?: string | null
          mime_type?: string | null
          processed_at?: string | null
          received_at?: string | null
          transcript?: string | null
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          setting_key: string
          setting_value: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          setting_key: string
          setting_value: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          setting_key?: string
          setting_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          attempts: number
          created_at: string
          expires_at: string
          id: string
          otp_code: string
          phone_number: string
          verified: boolean
        }
        Insert: {
          attempts?: number
          created_at?: string
          expires_at: string
          id?: string
          otp_code: string
          phone_number: string
          verified?: boolean
        }
        Update: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          otp_code?: string
          phone_number?: string
          verified?: boolean
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget: number | null
          category: string | null
          company_name: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          location: string | null
          model_3d_url: string | null
          name: string
          progress: number | null
          start_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          budget?: number | null
          category?: string | null
          company_name?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          model_3d_url?: string | null
          name: string
          progress?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          budget?: number | null
          category?: string | null
          company_name?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          model_3d_url?: string | null
          name?: string
          progress?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quotation_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      quotation_items: {
        Row: {
          category_id: string
          created_at: string
          default_unit_price: number
          description: string
          id: string
          is_active: boolean
          item_code: string | null
          sort_order: number
          unit: string
        }
        Insert: {
          category_id: string
          created_at?: string
          default_unit_price?: number
          description: string
          id?: string
          is_active?: boolean
          item_code?: string | null
          sort_order?: number
          unit?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          default_unit_price?: number
          description?: string
          id?: string
          is_active?: boolean
          item_code?: string | null
          sort_order?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "quotation_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_line_items: {
        Row: {
          created_at: string
          description: string
          id: string
          item_id: string | null
          notes: string | null
          quantity: number
          quotation_id: string
          sort_order: number
          total: number
          unit: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          item_id?: string | null
          notes?: string | null
          quantity?: number
          quotation_id: string
          sort_order?: number
          total?: number
          unit?: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          item_id?: string | null
          notes?: string | null
          quantity?: number
          quotation_id?: string
          sort_order?: number
          total?: number
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_line_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "quotation_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_line_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_notifications: {
        Row: {
          created_at: string | null
          id: string
          notification_type: string
          quotation_id: string
          recipient_phone: string | null
          recipient_type: string
          status: string | null
          wa_message_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notification_type: string
          quotation_id: string
          recipient_phone?: string | null
          recipient_type: string
          status?: string | null
          wa_message_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notification_type?: string
          quotation_id?: string
          recipient_phone?: string | null
          recipient_type?: string
          status?: string | null
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_notifications_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          created_by: string | null
          discount_amount: number | null
          discount_percentage: number | null
          finishing_level_id: string | null
          id: string
          labor_percentage: number | null
          material_cost: number | null
          modified_at: string | null
          modified_by: string | null
          notes: string | null
          pdf_url: string | null
          pricing_system: string
          project_type: string
          property_area: number | null
          property_type: string | null
          quotation_number: string
          rejection_reason: string | null
          status: string
          subtotal: number
          tax_amount: number | null
          tax_percentage: number | null
          total: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          finishing_level_id?: string | null
          id?: string
          labor_percentage?: number | null
          material_cost?: number | null
          modified_at?: string | null
          modified_by?: string | null
          notes?: string | null
          pdf_url?: string | null
          pricing_system?: string
          project_type?: string
          property_area?: number | null
          property_type?: string | null
          quotation_number: string
          rejection_reason?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_percentage?: number | null
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          finishing_level_id?: string | null
          id?: string
          labor_percentage?: number | null
          material_cost?: number | null
          modified_at?: string | null
          modified_by?: string | null
          notes?: string | null
          pdf_url?: string | null
          pricing_system?: string
          project_type?: string
          property_area?: number | null
          property_type?: string | null
          quotation_number?: string
          rejection_reason?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_percentage?: number | null
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_finishing_level_id_fkey"
            columns: ["finishing_level_id"]
            isOneToOne: false
            referencedRelation: "finishing_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      request_server: {
        Row: {
          data: Json | null
          id: number
          inserted_at: string
          name: string | null
          updated_at: string
        }
        Insert: {
          data?: Json | null
          id?: number
          inserted_at?: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          data?: Json | null
          id?: number
          inserted_at?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          category: string
          created_at: string | null
          id: string
          language: string
          phone_number_id: string
          preview_text: string | null
          status: string
          variables_count: number | null
          wa_template_code: string
          wa_template_name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          language: string
          phone_number_id: string
          preview_text?: string | null
          status: string
          variables_count?: number | null
          wa_template_code: string
          wa_template_name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          language?: string
          phone_number_id?: string
          preview_text?: string | null
          status?: string
          variables_count?: number | null
          wa_template_code?: string
          wa_template_name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      webhook_endpoints: {
        Row: {
          created_at: string | null
          events: Json | null
          id: string
          is_active: boolean | null
          project_id: string
          url: string
        }
        Insert: {
          created_at?: string | null
          events?: Json | null
          id?: string
          is_active?: boolean | null
          project_id: string
          url: string
        }
        Update: {
          created_at?: string | null
          events?: Json | null
          id?: string
          is_active?: boolean | null
          project_id?: string
          url?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string | null
          event_hash: string
          id: string
          payload: Json
          raw_body: string | null
          signature: string | null
          source: string
        }
        Insert: {
          created_at?: string | null
          event_hash: string
          id?: string
          payload: Json
          raw_body?: string | null
          signature?: string | null
          source: string
        }
        Update: {
          created_at?: string | null
          event_hash?: string
          id?: string
          payload?: Json
          raw_body?: string | null
          signature?: string | null
          source?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          conversation_id: string | null
          error_message: string | null
          id: number
          payload: Json | null
          processed_at: string | null
          processing_time_ms: number | null
          received_at: string | null
          response_status: number | null
          webhook_type: string | null
        }
        Insert: {
          conversation_id?: string | null
          error_message?: string | null
          id?: number
          payload?: Json | null
          processed_at?: string | null
          processing_time_ms?: number | null
          received_at?: string | null
          response_status?: number | null
          webhook_type?: string | null
        }
        Update: {
          conversation_id?: string | null
          error_message?: string | null
          id?: number
          payload?: Json | null
          processed_at?: string | null
          processing_time_ms?: number | null
          received_at?: string | null
          response_status?: number | null
          webhook_type?: string | null
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          conversation_id: string
          created_at: string | null
          ended_at: string | null
          id: number
          last_message_at: string | null
          message_count: number | null
          platform_metadata: Json | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_phone: string
          whatsapp_conversation_id: string | null
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          ended_at?: string | null
          id?: number
          last_message_at?: string | null
          message_count?: number | null
          platform_metadata?: Json | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_phone: string
          whatsapp_conversation_id?: string | null
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          ended_at?: string | null
          id?: number
          last_message_at?: string | null
          message_count?: number | null
          platform_metadata?: Json | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_phone?: string
          whatsapp_conversation_id?: string | null
        }
        Relationships: []
      }
      whatsapp_flows: {
        Row: {
          categories: string[] | null
          created_at: string | null
          id: string
          json_version: string | null
          name: string
          preview_url: string | null
          status: string | null
          updated_at: string | null
          validation_errors: Json | null
          wa_flow_id: string | null
        }
        Insert: {
          categories?: string[] | null
          created_at?: string | null
          id?: string
          json_version?: string | null
          name: string
          preview_url?: string | null
          status?: string | null
          updated_at?: string | null
          validation_errors?: Json | null
          wa_flow_id?: string | null
        }
        Update: {
          categories?: string[] | null
          created_at?: string | null
          id?: string
          json_version?: string | null
          name?: string
          preview_url?: string | null
          status?: string | null
          updated_at?: string | null
          validation_errors?: Json | null
          wa_flow_id?: string | null
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          content: string | null
          created_at: string
          customer_name: string | null
          direction: string
          id: string
          media_mime_type: string | null
          media_url: string | null
          message_type: string
          phone_number: string
          status: string | null
          wa_message_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          customer_name?: string | null
          direction?: string
          id?: string
          media_mime_type?: string | null
          media_url?: string | null
          message_type?: string
          phone_number: string
          status?: string | null
          wa_message_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          customer_name?: string | null
          direction?: string
          id?: string
          media_mime_type?: string | null
          media_url?: string | null
          message_type?: string
          phone_number?: string
          status?: string | null
          wa_message_id?: string | null
        }
        Relationships: []
      }
      workflow_steps: {
        Row: {
          config: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          type: string
          workflow_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          type: string
          workflow_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          type?: string
          workflow_id?: string
        }
        Relationships: []
      }
      workflows: {
        Row: {
          ai_enabled: boolean | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          project_id: string
        }
        Insert: {
          ai_enabled?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          project_id: string
        }
        Update: {
          ai_enabled?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          project_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_quotation_number: { Args: never; Returns: string }
      get_conversation_stats: {
        Args: { end_date: string; start_date: string }
        Returns: {
          avg_duration: number
          needs_followup_count: number
          negative_sentiment_count: number
          positive_sentiment_count: number
          total_conversations: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      mr_status: "Open" | "InProgress" | "Completed" | "Cancelled"
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
      mr_status: ["Open", "InProgress", "Completed", "Cancelled"],
    },
  },
} as const
