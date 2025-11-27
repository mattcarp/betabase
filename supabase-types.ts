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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accessibility: {
        Row: {
          aut: string
          id: string
          page_id: string | null
          scanned_at: string | null
          url: string
        }
        Insert: {
          aut: string
          id?: string
          page_id?: string | null
          scanned_at?: string | null
          url: string
        }
        Update: {
          aut?: string
          id?: string
          page_id?: string | null
          scanned_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_accessibility_page"
            columns: ["page_id"]
            isOneToOne: true
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      Account: {
        Row: {
          access_token: string | null
          expires_at: number | null
          id: string
          id_token: string | null
          provider: string
          providerAccountId: string
          refresh_token: string | null
          scope: string | null
          session_state: string | null
          token_type: string | null
          type: string
          userId: string
        }
        Insert: {
          access_token?: string | null
          expires_at?: number | null
          id: string
          id_token?: string | null
          provider: string
          providerAccountId: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type: string
          userId: string
        }
        Update: {
          access_token?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider?: string
          providerAccountId?: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Account_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          access_token: string | null
          expires_at: number | null
          id: string
          id_token: string | null
          provider: string
          providerAccountId: string
          refresh_token: string | null
          scope: string | null
          session_state: string | null
          token_type: string | null
          type: string
          userId: string | null
        }
        Insert: {
          access_token?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider: string
          providerAccountId: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type: string
          userId?: string | null
        }
        Update: {
          access_token?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider?: string
          providerAccountId?: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type?: string
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      aoma_console_logs: {
        Row: {
          additional_data: Json | null
          created_at: string
          id: string
          log_message: string
          log_source: string | null
          log_time: string
          log_type: string
          page_id: string
          stack_trace: string | null
        }
        Insert: {
          additional_data?: Json | null
          created_at?: string
          id?: string
          log_message: string
          log_source?: string | null
          log_time?: string
          log_type: string
          page_id: string
          stack_trace?: string | null
        }
        Update: {
          additional_data?: Json | null
          created_at?: string
          id?: string
          log_message?: string
          log_source?: string | null
          log_time?: string
          log_type?: string
          page_id?: string
          stack_trace?: string | null
        }
        Relationships: []
      }
      aoma_css_styles: {
        Row: {
          computed_style: Json | null
          created_at: string
          css_rules: Json
          id: string
          page_id: string
          selector: string
          stylesheet_href: string | null
        }
        Insert: {
          computed_style?: Json | null
          created_at?: string
          css_rules: Json
          id?: string
          page_id: string
          selector: string
          stylesheet_href?: string | null
        }
        Update: {
          computed_style?: Json | null
          created_at?: string
          css_rules?: Json
          id?: string
          page_id?: string
          selector?: string
          stylesheet_href?: string | null
        }
        Relationships: []
      }
      aoma_dom_structures: {
        Row: {
          created_at: string
          id: string
          page_id: string
          structure_embedding: string | null
          structure_json: Json
          structure_text: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          page_id: string
          structure_embedding?: string | null
          structure_json: Json
          structure_text?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          page_id?: string
          structure_embedding?: string | null
          structure_json?: Json
          structure_text?: string | null
        }
        Relationships: []
      }
      aoma_navigation_links: {
        Row: {
          created_at: string
          id: string
          is_internal: boolean
          link_text: string | null
          selector: string | null
          source_page_id: string
          target_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_internal?: boolean
          link_text?: string | null
          selector?: string | null
          source_page_id: string
          target_url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_internal?: boolean
          link_text?: string | null
          selector?: string | null
          source_page_id?: string
          target_url?: string
        }
        Relationships: []
      }
      aoma_sessions: {
        Row: {
          cookies: Json
          created_at: string
          id: string
          local_storage: Json | null
          session_storage: Json | null
          timestamp: string
          url: string
        }
        Insert: {
          cookies: Json
          created_at?: string
          id?: string
          local_storage?: Json | null
          session_storage?: Json | null
          timestamp?: string
          url: string
        }
        Update: {
          cookies?: Json
          created_at?: string
          id?: string
          local_storage?: Json | null
          session_storage?: Json | null
          timestamp?: string
          url?: string
        }
        Relationships: []
      }
      aoma_test_dependencies: {
        Row: {
          created_at: string
          dependency_type: string
          dependency_value: string
          description: string | null
          id: string
          page_id: string
        }
        Insert: {
          created_at?: string
          dependency_type: string
          dependency_value: string
          description?: string | null
          id?: string
          page_id: string
        }
        Update: {
          created_at?: string
          dependency_type?: string
          dependency_value?: string
          description?: string | null
          id?: string
          page_id?: string
        }
        Relationships: []
      }
      aoma_ui_elements: {
        Row: {
          attributes: Json | null
          bounding_box: Json | null
          created_at: string
          element_type: string
          embedding: string | null
          id: string
          page_id: string
          screenshot_path: string | null
          selector: string
          text_content: string | null
        }
        Insert: {
          attributes?: Json | null
          bounding_box?: Json | null
          created_at?: string
          element_type: string
          embedding?: string | null
          id?: string
          page_id: string
          screenshot_path?: string | null
          selector: string
          text_content?: string | null
        }
        Update: {
          attributes?: Json | null
          bounding_box?: Json | null
          created_at?: string
          element_type?: string
          embedding?: string | null
          id?: string
          page_id?: string
          screenshot_path?: string | null
          selector?: string
          text_content?: string | null
        }
        Relationships: []
      }
      app_console_logs: {
        Row: {
          app_under_test: string
          id: string
          log_type: string
          message: string | null
          metadata: Json | null
          page_id: string | null
          timestamp: string | null
        }
        Insert: {
          app_under_test: string
          id?: string
          log_type: string
          message?: string | null
          metadata?: Json | null
          page_id?: string | null
          timestamp?: string | null
        }
        Update: {
          app_under_test?: string
          id?: string
          log_type?: string
          message?: string | null
          metadata?: Json | null
          page_id?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_console_logs_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "app_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      app_links: {
        Row: {
          app_under_test: string
          created_at: string | null
          id: string
          selector: string | null
          source_id: string | null
          target_url: string
          text_content: string | null
        }
        Insert: {
          app_under_test: string
          created_at?: string | null
          id?: string
          selector?: string | null
          source_id?: string | null
          target_url: string
          text_content?: string | null
        }
        Update: {
          app_under_test?: string
          created_at?: string | null
          id?: string
          selector?: string | null
          source_id?: string | null
          target_url?: string
          text_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_links_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "app_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      app_pages: {
        Row: {
          app_under_test: string
          created_at: string | null
          embedding: string | null
          html_content: string | null
          id: string
          interactive_elements: Json | null
          screenshot: string | null
          section_name: string | null
          text_content: string | null
          title: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          app_under_test: string
          created_at?: string | null
          embedding?: string | null
          html_content?: string | null
          id?: string
          interactive_elements?: Json | null
          screenshot?: string | null
          section_name?: string | null
          text_content?: string | null
          title?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          app_under_test?: string
          created_at?: string | null
          embedding?: string | null
          html_content?: string | null
          id?: string
          interactive_elements?: Json | null
          screenshot?: string | null
          section_name?: string | null
          text_content?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      app_performance_metrics: {
        Row: {
          app_under_test: string
          created_at: string | null
          id: string
          metrics: Json
          page_id: string | null
        }
        Insert: {
          app_under_test: string
          created_at?: string | null
          id?: string
          metrics: Json
          page_id?: string | null
        }
        Update: {
          app_under_test?: string
          created_at?: string | null
          id?: string
          metrics?: Json
          page_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_performance_metrics_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "app_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      app_screenshots: {
        Row: {
          app_under_test: string
          created_at: string | null
          height: number | null
          id: string
          page_id: string | null
          path: string
          width: number | null
        }
        Insert: {
          app_under_test: string
          created_at?: string | null
          height?: number | null
          id?: string
          page_id?: string | null
          path: string
          width?: number | null
        }
        Update: {
          app_under_test?: string
          created_at?: string | null
          height?: number | null
          id?: string
          page_id?: string | null
          path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "app_screenshots_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "app_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      aqm_analyses: {
        Row: {
          algorithm: string
          analysis_type: string
          audio_file_id: string
          confidence_score: number | null
          created_at: string | null
          detected_issues: Json | null
          gpu_used: boolean | null
          id: string
          model_version: string | null
          parameters: Json | null
          perceptual_analysis: Json | null
          processing_time_ms: number | null
          quality_metrics: Json | null
          recommendations: Json | null
          spectral_features: Json | null
          temporal_features: Json | null
        }
        Insert: {
          algorithm: string
          analysis_type: string
          audio_file_id: string
          confidence_score?: number | null
          created_at?: string | null
          detected_issues?: Json | null
          gpu_used?: boolean | null
          id?: string
          model_version?: string | null
          parameters?: Json | null
          perceptual_analysis?: Json | null
          processing_time_ms?: number | null
          quality_metrics?: Json | null
          recommendations?: Json | null
          spectral_features?: Json | null
          temporal_features?: Json | null
        }
        Update: {
          algorithm?: string
          analysis_type?: string
          audio_file_id?: string
          confidence_score?: number | null
          created_at?: string | null
          detected_issues?: Json | null
          gpu_used?: boolean | null
          id?: string
          model_version?: string | null
          parameters?: Json | null
          perceptual_analysis?: Json | null
          processing_time_ms?: number | null
          quality_metrics?: Json | null
          recommendations?: Json | null
          spectral_features?: Json | null
          temporal_features?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "aqm_analyses_audio_file_id_fkey"
            columns: ["audio_file_id"]
            isOneToOne: false
            referencedRelation: "aqm_audio_files"
            referencedColumns: ["id"]
          },
        ]
      }
      aqm_api_usage: {
        Row: {
          api_key_hash: string | null
          credits_used: number | null
          endpoint: string
          error_message: string | null
          id: string
          ip_address: unknown
          method: string
          model_used: string | null
          response_time_ms: number | null
          status_code: number | null
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          api_key_hash?: string | null
          credits_used?: number | null
          endpoint: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          method: string
          model_used?: string | null
          response_time_ms?: number | null
          status_code?: number | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          api_key_hash?: string | null
          credits_used?: number | null
          endpoint?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          method?: string
          model_used?: string | null
          response_time_ms?: number | null
          status_code?: number | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aqm_api_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      aqm_audio_files: {
        Row: {
          bit_depth: number | null
          cdn_url: string | null
          channels: number | null
          codec: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          duration_seconds: number | null
          file_hash: string
          file_size_bytes: number
          filename: string
          format: string
          id: string
          metadata: Json | null
          mime_type: string
          s3_bucket: string | null
          s3_key: string | null
          sample_rate: number | null
          storage_provider: string | null
          storage_url: string | null
          tags: string[] | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          bit_depth?: number | null
          cdn_url?: string | null
          channels?: number | null
          codec?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          file_hash: string
          file_size_bytes: number
          filename: string
          format: string
          id?: string
          metadata?: Json | null
          mime_type: string
          s3_bucket?: string | null
          s3_key?: string | null
          sample_rate?: number | null
          storage_provider?: string | null
          storage_url?: string | null
          tags?: string[] | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          bit_depth?: number | null
          cdn_url?: string | null
          channels?: number | null
          codec?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          file_hash?: string
          file_size_bytes?: number
          filename?: string
          format?: string
          id?: string
          metadata?: Json | null
          mime_type?: string
          s3_bucket?: string | null
          s3_key?: string | null
          sample_rate?: number | null
          storage_provider?: string | null
          storage_url?: string | null
          tags?: string[] | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aqm_audio_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      aqm_audio_knowledge: {
        Row: {
          category: string
          code_snippets: Json | null
          confidence_score: number | null
          configuration_examples: Json | null
          content_embedding: string | null
          created_at: string | null
          document_id: string | null
          document_url: string | null
          full_content: string | null
          id: string
          knowledge_type: string
          metrics_discussed: string[] | null
          summary: string
          title: string
          tools_mentioned: string[] | null
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          category: string
          code_snippets?: Json | null
          confidence_score?: number | null
          configuration_examples?: Json | null
          content_embedding?: string | null
          created_at?: string | null
          document_id?: string | null
          document_url?: string | null
          full_content?: string | null
          id?: string
          knowledge_type: string
          metrics_discussed?: string[] | null
          summary: string
          title: string
          tools_mentioned?: string[] | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          category?: string
          code_snippets?: Json | null
          confidence_score?: number | null
          configuration_examples?: Json | null
          content_embedding?: string | null
          created_at?: string | null
          document_id?: string | null
          document_url?: string | null
          full_content?: string | null
          id?: string
          knowledge_type?: string
          metrics_discussed?: string[] | null
          summary?: string
          title?: string
          tools_mentioned?: string[] | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      aqm_comparisons: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          detailed_metrics: Json | null
          id: string
          name: string
          notes: string | null
          original_file_id: string
          scores: Json | null
          test_type: string
          variant_a_file_id: string | null
          variant_a_method: string | null
          variant_b_file_id: string | null
          variant_b_method: string | null
          variant_c_file_id: string | null
          variant_c_method: string | null
          variant_d_file_id: string | null
          variant_d_method: string | null
          winner: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          detailed_metrics?: Json | null
          id?: string
          name: string
          notes?: string | null
          original_file_id: string
          scores?: Json | null
          test_type: string
          variant_a_file_id?: string | null
          variant_a_method?: string | null
          variant_b_file_id?: string | null
          variant_b_method?: string | null
          variant_c_file_id?: string | null
          variant_c_method?: string | null
          variant_d_file_id?: string | null
          variant_d_method?: string | null
          winner?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          detailed_metrics?: Json | null
          id?: string
          name?: string
          notes?: string | null
          original_file_id?: string
          scores?: Json | null
          test_type?: string
          variant_a_file_id?: string | null
          variant_a_method?: string | null
          variant_b_file_id?: string | null
          variant_b_method?: string | null
          variant_c_file_id?: string | null
          variant_c_method?: string | null
          variant_d_file_id?: string | null
          variant_d_method?: string | null
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aqm_comparisons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aqm_comparisons_original_file_id_fkey"
            columns: ["original_file_id"]
            isOneToOne: false
            referencedRelation: "aqm_audio_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aqm_comparisons_variant_a_file_id_fkey"
            columns: ["variant_a_file_id"]
            isOneToOne: false
            referencedRelation: "aqm_audio_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aqm_comparisons_variant_b_file_id_fkey"
            columns: ["variant_b_file_id"]
            isOneToOne: false
            referencedRelation: "aqm_audio_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aqm_comparisons_variant_c_file_id_fkey"
            columns: ["variant_c_file_id"]
            isOneToOne: false
            referencedRelation: "aqm_audio_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aqm_comparisons_variant_d_file_id_fkey"
            columns: ["variant_d_file_id"]
            isOneToOne: false
            referencedRelation: "aqm_audio_files"
            referencedColumns: ["id"]
          },
        ]
      }
      aqm_ml_models: {
        Row: {
          benchmark_scores: Json
          checkpoint_url: string | null
          config: Json | null
          created_at: string | null
          description: string | null
          estimated_time_per_minute: Json | null
          github_url: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          license: string | null
          max_duration_seconds: number | null
          min_memory_gb: number | null
          model_type: string
          model_url: string | null
          name: string
          paper_url: string | null
          recommended_gpu_memory_gb: number | null
          supported_formats: string[] | null
          supports_gpu: boolean | null
          updated_at: string | null
          version: string
        }
        Insert: {
          benchmark_scores: Json
          checkpoint_url?: string | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          estimated_time_per_minute?: Json | null
          github_url?: string | null
          id: string
          is_active?: boolean | null
          is_default?: boolean | null
          license?: string | null
          max_duration_seconds?: number | null
          min_memory_gb?: number | null
          model_type: string
          model_url?: string | null
          name: string
          paper_url?: string | null
          recommended_gpu_memory_gb?: number | null
          supported_formats?: string[] | null
          supports_gpu?: boolean | null
          updated_at?: string | null
          version: string
        }
        Update: {
          benchmark_scores?: Json
          checkpoint_url?: string | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          estimated_time_per_minute?: Json | null
          github_url?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          license?: string | null
          max_duration_seconds?: number | null
          min_memory_gb?: number | null
          model_type?: string
          model_url?: string | null
          name?: string
          paper_url?: string | null
          recommended_gpu_memory_gb?: number | null
          supported_formats?: string[] | null
          supports_gpu?: boolean | null
          updated_at?: string | null
          version?: string
        }
        Relationships: []
      }
      aqm_performance_metrics: {
        Row: {
          audio_duration_seconds: number | null
          cpu_cores: number | null
          file_size_mb: number | null
          gpu_model: string | null
          id: string
          memory_gb: number | null
          metric_name: string
          metric_type: string
          metric_value: number
          model_id: string | null
          timestamp: string | null
          unit: string
        }
        Insert: {
          audio_duration_seconds?: number | null
          cpu_cores?: number | null
          file_size_mb?: number | null
          gpu_model?: string | null
          id?: string
          memory_gb?: number | null
          metric_name: string
          metric_type: string
          metric_value: number
          model_id?: string | null
          timestamp?: string | null
          unit: string
        }
        Update: {
          audio_duration_seconds?: number | null
          cpu_cores?: number | null
          file_size_mb?: number | null
          gpu_model?: string | null
          id?: string
          memory_gb?: number | null
          metric_name?: string
          metric_type?: string
          metric_value?: number
          model_id?: string | null
          timestamp?: string | null
          unit?: string
        }
        Relationships: []
      }
      aqm_processing_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          id: string
          input_file_id: string
          job_type: string
          model_id: string
          output_file_id: string | null
          output_urls: Json | null
          parameters: Json | null
          priority: number | null
          processing_time_ms: number | null
          progress_percent: number | null
          queued_at: string | null
          result_metrics: Json | null
          started_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          input_file_id: string
          job_type: string
          model_id: string
          output_file_id?: string | null
          output_urls?: Json | null
          parameters?: Json | null
          priority?: number | null
          processing_time_ms?: number | null
          progress_percent?: number | null
          queued_at?: string | null
          result_metrics?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          input_file_id?: string
          job_type?: string
          model_id?: string
          output_file_id?: string | null
          output_urls?: Json | null
          parameters?: Json | null
          priority?: number | null
          processing_time_ms?: number | null
          progress_percent?: number | null
          queued_at?: string | null
          result_metrics?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aqm_processing_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aqm_processing_jobs_input_file_id_fkey"
            columns: ["input_file_id"]
            isOneToOne: false
            referencedRelation: "aqm_audio_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aqm_processing_jobs_output_file_id_fkey"
            columns: ["output_file_id"]
            isOneToOne: false
            referencedRelation: "aqm_audio_files"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_base_executions: {
        Row: {
          beta_base_id: number
          browser_name: string | null
          build: string | null
          comments: string | null
          executed_at: string
          executed_by: string | null
          id: string
          imported_at: string
          input_text: string | null
          os_name: string | null
          pass_fail: string
          result_text: string | null
          scenario_id: string
          ticket: string | null
        }
        Insert: {
          beta_base_id: number
          browser_name?: string | null
          build?: string | null
          comments?: string | null
          executed_at: string
          executed_by?: string | null
          id?: string
          imported_at?: string
          input_text?: string | null
          os_name?: string | null
          pass_fail: string
          result_text?: string | null
          scenario_id: string
          ticket?: string | null
        }
        Update: {
          beta_base_id?: number
          browser_name?: string | null
          build?: string | null
          comments?: string | null
          executed_at?: string
          executed_by?: string | null
          id?: string
          imported_at?: string
          input_text?: string | null
          os_name?: string | null
          pass_fail?: string
          result_text?: string | null
          scenario_id?: string
          ticket?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beta_base_executions_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "beta_base_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_base_scenarios: {
        Row: {
          beta_base_id: number
          created_at: string
          created_by: string | null
          embedding: string | null
          execution_count: number
          expected_result_text: string | null
          id: string
          imported_at: string
          last_execution_date: string | null
          metadata: Json
          name: string
          pass_rate: number | null
          preconditions_text: string | null
          relevance_score: number
          script_text: string | null
          search_vector: unknown
          tags: string[] | null
          tier: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          beta_base_id: number
          created_at: string
          created_by?: string | null
          embedding?: string | null
          execution_count?: number
          expected_result_text?: string | null
          id?: string
          imported_at?: string
          last_execution_date?: string | null
          metadata?: Json
          name: string
          pass_rate?: number | null
          preconditions_text?: string | null
          relevance_score: number
          script_text?: string | null
          search_vector?: unknown
          tags?: string[] | null
          tier: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          beta_base_id?: number
          created_at?: string
          created_by?: string | null
          embedding?: string | null
          execution_count?: number
          expected_result_text?: string | null
          id?: string
          imported_at?: string
          last_execution_date?: string | null
          metadata?: Json
          name?: string
          pass_rate?: number | null
          preconditions_text?: string | null
          relevance_score?: number
          script_text?: string | null
          search_vector?: unknown
          tags?: string[] | null
          tier?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      code_files: {
        Row: {
          content_preview: string | null
          content_summary: string | null
          created_at: string | null
          embedding: string | null
          file_extension: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          language: string | null
          last_commit_hash: string | null
          last_modified: string | null
          line_count: number | null
          repository_name: string
          repository_path: string
          updated_at: string | null
        }
        Insert: {
          content_preview?: string | null
          content_summary?: string | null
          created_at?: string | null
          embedding?: string | null
          file_extension?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          language?: string | null
          last_commit_hash?: string | null
          last_modified?: string | null
          line_count?: number | null
          repository_name: string
          repository_path: string
          updated_at?: string | null
        }
        Update: {
          content_preview?: string | null
          content_summary?: string | null
          created_at?: string | null
          embedding?: string | null
          file_extension?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          language?: string | null
          last_commit_hash?: string | null
          last_modified?: string | null
          line_count?: number | null
          repository_name?: string
          repository_path?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      console_logs: {
        Row: {
          created_at: string | null
          id: string
          level: string
          message: string
          metadata: Json
          page_id: string | null
          page_url: string
          stack: string | null
          timestamp: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          level: string
          message: string
          metadata: Json
          page_id?: string | null
          page_url: string
          stack?: string | null
          timestamp: string
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: string
          message?: string
          metadata?: Json
          page_id?: string | null
          page_url?: string
          stack?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_console_logs_page"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      context_source_weights: {
        Row: {
          contribution_weight: number
          id: string
          last_updated: string
          negative_feedback_count: number
          positive_feedback_count: number
          source_name: string
          total_usage_count: number
        }
        Insert: {
          contribution_weight?: number
          id?: string
          last_updated?: string
          negative_feedback_count?: number
          positive_feedback_count?: number
          source_name: string
          total_usage_count?: number
        }
        Update: {
          contribution_weight?: number
          id?: string
          last_updated?: string
          negative_feedback_count?: number
          positive_feedback_count?: number
          source_name?: string
          total_usage_count?: number
        }
        Relationships: []
      }
      context_weights: {
        Row: {
          aoma_docs: number
          aoma_ui: number
          created_at: string
          git: number
          id: string
          jira: number
          updated_at: string
        }
        Insert: {
          aoma_docs?: number
          aoma_ui?: number
          created_at?: string
          git?: number
          id?: string
          jira?: number
          updated_at?: string
        }
        Update: {
          aoma_docs?: number
          aoma_ui?: number
          created_at?: string
          git?: number
          id?: string
          jira?: number
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          assistant_id: string
          created_at: string | null
          id: string
          last_message: string | null
          metadata: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assistant_id: string
          created_at?: string | null
          id?: string
          last_message?: string | null
          metadata?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assistant_id?: string
          created_at?: string | null
          id?: string
          last_message?: string | null
          metadata?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      crawled_pages: {
        Row: {
          app_id: string
          content_embedding: string | null
          depth: number | null
          description: string | null
          html_content: string | null
          id: string
          main_content: string | null
          meta_data: Json | null
          screenshot_path: string | null
          status: number | null
          title: string | null
          updated_at: string | null
          url: string
          visited_at: string | null
        }
        Insert: {
          app_id: string
          content_embedding?: string | null
          depth?: number | null
          description?: string | null
          html_content?: string | null
          id?: string
          main_content?: string | null
          meta_data?: Json | null
          screenshot_path?: string | null
          status?: number | null
          title?: string | null
          updated_at?: string | null
          url: string
          visited_at?: string | null
        }
        Update: {
          app_id?: string
          content_embedding?: string | null
          depth?: number | null
          description?: string | null
          html_content?: string | null
          id?: string
          main_content?: string | null
          meta_data?: Json | null
          screenshot_path?: string | null
          status?: number | null
          title?: string | null
          updated_at?: string | null
          url?: string
          visited_at?: string | null
        }
        Relationships: []
      }
      crawler_documents: {
        Row: {
          app_id: string | null
          app_name: string | null
          content: string | null
          content_hash: string
          crawled_at: string | null
          created_at: string
          embedding: string | null
          id: string
          markdown_content: string | null
          metadata: Json | null
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          app_id?: string | null
          app_name?: string | null
          content?: string | null
          content_hash: string
          crawled_at?: string | null
          created_at?: string
          embedding?: string | null
          id?: string
          markdown_content?: string | null
          metadata?: Json | null
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          app_id?: string | null
          app_name?: string | null
          content?: string | null
          content_hash?: string
          crawled_at?: string | null
          created_at?: string
          embedding?: string | null
          id?: string
          markdown_content?: string | null
          metadata?: Json | null
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      crawler_logs: {
        Row: {
          app_id: string | null
          app_name: string | null
          created_at: string
          details: Json | null
          id: string
          level: string
          message: string
        }
        Insert: {
          app_id?: string | null
          app_name?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          level: string
          message: string
        }
        Update: {
          app_id?: string | null
          app_name?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          level?: string
          message?: string
        }
        Relationships: []
      }
      curation_items: {
        Row: {
          accepted_at: string | null
          content: Json
          created_at: string
          id: string
          original_embedding: string | null
          reviewer: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          content: Json
          created_at?: string
          id?: string
          original_embedding?: string | null
          reviewer?: string | null
          source: string
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          content?: Json
          created_at?: string
          id?: string
          original_embedding?: string | null
          reviewer?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      deduplication_scans: {
        Row: {
          created_at: string | null
          duplicates_found: number | null
          files_scanned: number | null
          id: string
          initiated_by: string
          status: string | null
          storage_saved: number | null
        }
        Insert: {
          created_at?: string | null
          duplicates_found?: number | null
          files_scanned?: number | null
          id?: string
          initiated_by: string
          status?: string | null
          storage_saved?: number | null
        }
        Update: {
          created_at?: string | null
          duplicates_found?: number | null
          files_scanned?: number | null
          id?: string
          initiated_by?: string
          status?: string | null
          storage_saved?: number | null
        }
        Relationships: []
      }
      dom_snapshots: {
        Row: {
          component_tree: Json
          created_at: string | null
          dom_depth: number
          element_count: number
          id: string
          page_url: string
          style_metrics: Json
          timestamp: string
          viewport: Json
        }
        Insert: {
          component_tree: Json
          created_at?: string | null
          dom_depth: number
          element_count: number
          id?: string
          page_url: string
          style_metrics: Json
          timestamp: string
          viewport: Json
        }
        Update: {
          component_tree?: Json
          created_at?: string | null
          dom_depth?: number
          element_count?: number
          id?: string
          page_url?: string
          style_metrics?: Json
          timestamp?: string
          viewport?: Json
        }
        Relationships: []
      }
      duplicate_files: {
        Row: {
          action_taken: string | null
          created_at: string | null
          duplicate_file_id: string
          id: string
          original_file_id: string
          scan_id: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string | null
          duplicate_file_id: string
          id?: string
          original_file_id: string
          scan_id: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string | null
          duplicate_file_id?: string
          id?: string
          original_file_id?: string
          scan_id?: string
        }
        Relationships: []
      }
      embedding_migration_status: {
        Row: {
          app_under_test: string
          completed_at: string | null
          created_at: string | null
          division: string
          error_message: string | null
          failed_count: number | null
          id: string
          migrated_count: number | null
          organization: string
          source_type: string
          started_at: string | null
          status: string | null
          total_count: number | null
          updated_at: string | null
        }
        Insert: {
          app_under_test: string
          completed_at?: string | null
          created_at?: string | null
          division: string
          error_message?: string | null
          failed_count?: number | null
          id?: string
          migrated_count?: number | null
          organization: string
          source_type: string
          started_at?: string | null
          status?: string | null
          total_count?: number | null
          updated_at?: string | null
        }
        Update: {
          app_under_test?: string
          completed_at?: string | null
          created_at?: string | null
          division?: string
          error_message?: string | null
          failed_count?: number | null
          id?: string
          migrated_count?: number | null
          organization?: string
          source_type?: string
          started_at?: string | null
          status?: string | null
          total_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      file_metadata: {
        Row: {
          content_type: string | null
          created_at: string | null
          created_by: string
          file_hash: string
          file_path: string | null
          file_size: number | null
          filename: string
          id: string
          openai_file_id: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string | null
          created_by: string
          file_hash: string
          file_path?: string | null
          file_size?: number | null
          filename: string
          id?: string
          openai_file_id?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string | null
          created_by?: string
          file_hash?: string
          file_path?: string | null
          file_size?: number | null
          filename?: string
          id?: string
          openai_file_id?: string | null
        }
        Relationships: []
      }
      firecrawl_analysis: {
        Row: {
          accessibility_issues: Json | null
          analysis_type: string | null
          analyzed_at: string | null
          api_endpoints: string[] | null
          app_name: string | null
          content_embedding: string | null
          expires_at: string | null
          id: string
          performance_metrics: Json | null
          selectors: Json | null
          testable_features: Json | null
          url: string
          user_flows: Json | null
        }
        Insert: {
          accessibility_issues?: Json | null
          analysis_type?: string | null
          analyzed_at?: string | null
          api_endpoints?: string[] | null
          app_name?: string | null
          content_embedding?: string | null
          expires_at?: string | null
          id?: string
          performance_metrics?: Json | null
          selectors?: Json | null
          testable_features?: Json | null
          url: string
          user_flows?: Json | null
        }
        Update: {
          accessibility_issues?: Json | null
          analysis_type?: string | null
          analyzed_at?: string | null
          api_endpoints?: string[] | null
          app_name?: string | null
          content_embedding?: string | null
          expires_at?: string | null
          id?: string
          performance_metrics?: Json | null
          selectors?: Json | null
          testable_features?: Json | null
          url?: string
          user_flows?: Json | null
        }
        Relationships: []
      }
      generated_tests: {
        Row: {
          aoma_docs_context: string | null
          aoma_ui_context: string | null
          confidence_score: number | null
          created_at: string
          generation_source: string | null
          git_context: string | null
          id: string
          jira_context: string | null
          options: Json
          query: string
          related_features: string[] | null
          review_status: string | null
          source_url: string | null
          test_code: string
          test_type: string[] | null
          user_id: string | null
        }
        Insert: {
          aoma_docs_context?: string | null
          aoma_ui_context?: string | null
          confidence_score?: number | null
          created_at?: string
          generation_source?: string | null
          git_context?: string | null
          id?: string
          jira_context?: string | null
          options?: Json
          query: string
          related_features?: string[] | null
          review_status?: string | null
          source_url?: string | null
          test_code: string
          test_type?: string[] | null
          user_id?: string | null
        }
        Update: {
          aoma_docs_context?: string | null
          aoma_ui_context?: string | null
          confidence_score?: number | null
          created_at?: string
          generation_source?: string | null
          git_context?: string | null
          id?: string
          jira_context?: string | null
          options?: Json
          query?: string
          related_features?: string[] | null
          review_status?: string | null
          source_url?: string | null
          test_code?: string
          test_type?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      git_commits: {
        Row: {
          additions: number | null
          author_email: string
          author_name: string
          commit_date: string
          commit_hash: string
          commit_message: string
          created_at: string | null
          deletions: number | null
          diff_summary: string | null
          embedding: string | null
          files_changed: Json | null
          id: string
          repository_name: string
          repository_path: string
          updated_at: string | null
        }
        Insert: {
          additions?: number | null
          author_email: string
          author_name: string
          commit_date: string
          commit_hash: string
          commit_message: string
          created_at?: string | null
          deletions?: number | null
          diff_summary?: string | null
          embedding?: string | null
          files_changed?: Json | null
          id?: string
          repository_name: string
          repository_path: string
          updated_at?: string | null
        }
        Update: {
          additions?: number | null
          author_email?: string
          author_name?: string
          commit_date?: string
          commit_hash?: string
          commit_message?: string
          created_at?: string | null
          deletions?: number | null
          diff_summary?: string | null
          embedding?: string | null
          files_changed?: Json | null
          id?: string
          repository_name?: string
          repository_path?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      git_file_embeddings: {
        Row: {
          content: string | null
          content_hash: string | null
          created_at: string | null
          embedding: string
          file_path: string
          id: number
          metadata: Json | null
          repo_path: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          content_hash?: string | null
          created_at?: string | null
          embedding: string
          file_path: string
          id?: number
          metadata?: Json | null
          repo_path: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          content_hash?: string | null
          created_at?: string | null
          embedding?: string
          file_path?: string
          id?: number
          metadata?: Json | null
          repo_path?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      jira_ticket_embeddings: {
        Row: {
          created_at: string | null
          embedding: string
          id: number
          metadata: Json | null
          summary: string | null
          ticket_key: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          embedding: string
          id?: number
          metadata?: Json | null
          summary?: string | null
          ticket_key: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          embedding?: string
          id?: number
          metadata?: Json | null
          summary?: string | null
          ticket_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      jira_tickets: {
        Row: {
          created_at: string | null
          description: string | null
          embedding: string | null
          external_id: string
          id: string
          metadata: Json | null
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          external_id: string
          id?: string
          metadata?: Json | null
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          external_id?: string
          id?: string
          metadata?: Json | null
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      links: {
        Row: {
          aut: string
          discovered_at: string | null
          id: string
          link_text: string | null
          source_page_id: string | null
          source_url: string
          target_url: string
        }
        Insert: {
          aut: string
          discovered_at?: string | null
          id?: string
          link_text?: string | null
          source_page_id?: string | null
          source_url: string
          target_url: string
        }
        Update: {
          aut?: string
          discovered_at?: string | null
          id?: string
          link_text?: string | null
          source_page_id?: string | null
          source_url?: string
          target_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_links_source_page"
            columns: ["source_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      logs: {
        Row: {
          id: number
          level: string
          message: string
          metadata: Json | null
          timestamp: string
        }
        Insert: {
          id?: number
          level: string
          message: string
          metadata?: Json | null
          timestamp?: string
        }
        Update: {
          id?: number
          level?: string
          message?: string
          metadata?: Json | null
          timestamp?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          parent_id: string | null
          role: string
          thread_depth: number | null
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          parent_id?: string | null
          role: string
          thread_depth?: number | null
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          parent_id?: string | null
          role?: string
          thread_depth?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      navigation_links: {
        Row: {
          app_id: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          link_text: string | null
          selector: string | null
          source_page_id: string
          target_url: string
        }
        Insert: {
          app_id: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          link_text?: string | null
          selector?: string | null
          source_page_id: string
          target_url: string
        }
        Update: {
          app_id?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          link_text?: string | null
          selector?: string | null
          source_page_id?: string
          target_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_source_page"
            columns: ["source_page_id"]
            isOneToOne: false
            referencedRelation: "crawled_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      network_requests: {
        Row: {
          aut: string
          captured_at: string | null
          id: string
          method: string | null
          page_id: string | null
          request_url: string
          url: string
        }
        Insert: {
          aut: string
          captured_at?: string | null
          id?: string
          method?: string | null
          page_id?: string | null
          request_url: string
          url: string
        }
        Update: {
          aut?: string
          captured_at?: string | null
          id?: string
          method?: string | null
          page_id?: string | null
          request_url?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_network_requests_page"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_states: {
        Row: {
          aut: string
          id: string
          page_id: string | null
          snapshot_at: string | null
          url: string
        }
        Insert: {
          aut: string
          id?: string
          page_id?: string | null
          snapshot_at?: string | null
          url: string
        }
        Update: {
          aut?: string
          id?: string
          page_id?: string | null
          snapshot_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_page_states_page"
            columns: ["page_id"]
            isOneToOne: true
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          aut: string
          content_embedding: string | null
          crawled_at: string | null
          embedding: string | null
          html: string | null
          id: string
          title: string | null
          url: string
        }
        Insert: {
          aut: string
          content_embedding?: string | null
          crawled_at?: string | null
          embedding?: string | null
          html?: string | null
          id?: string
          title?: string | null
          url: string
        }
        Update: {
          aut?: string
          content_embedding?: string | null
          crawled_at?: string | null
          embedding?: string | null
          html?: string | null
          id?: string
          title?: string | null
          url?: string
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          created_at: string | null
          id: string
          navigation_timing: Json
          page_id: string | null
          page_url: string
          resource_timing: Json
          timestamp: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          navigation_timing: Json
          page_id?: string | null
          page_url: string
          resource_timing: Json
          timestamp: string
        }
        Update: {
          created_at?: string | null
          id?: string
          navigation_timing?: Json
          page_id?: string | null
          page_url?: string
          resource_timing?: Json
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_performance_metrics_page"
            columns: ["page_id"]
            isOneToOne: true
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      Session: {
        Row: {
          expires: string
          id: string
          sessionToken: string
          userId: string
        }
        Insert: {
          expires: string
          id: string
          sessionToken: string
          userId: string
        }
        Update: {
          expires?: string
          id?: string
          sessionToken?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Session_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          expires: string
          id: string
          sessionToken: string
          userId: string | null
        }
        Insert: {
          expires: string
          id?: string
          sessionToken: string
          userId?: string | null
        }
        Update: {
          expires?: string
          id?: string
          sessionToken?: string
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      siam_git_files: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: number
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      siam_jira_tickets: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: number
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      siam_meeting_transcriptions: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: number
          meeting_date: string | null
          metadata: Json | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: number
          meeting_date?: string | null
          metadata?: Json | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: number
          meeting_date?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      siam_vectors: {
        Row: {
          app_under_test: string
          content: string
          created_at: string | null
          division: string
          embedding: string | null
          embedding_gemini: string | null
          embedding_source: string | null
          id: string
          metadata: Json | null
          organization: string
          source_id: string
          source_type: string
          updated_at: string | null
        }
        Insert: {
          app_under_test: string
          content: string
          created_at?: string | null
          division: string
          embedding?: string | null
          embedding_gemini?: string | null
          embedding_source?: string | null
          id?: string
          metadata?: Json | null
          organization: string
          source_id: string
          source_type: string
          updated_at?: string | null
        }
        Update: {
          app_under_test?: string
          content?: string
          created_at?: string | null
          division?: string
          embedding?: string | null
          embedding_gemini?: string | null
          embedding_source?: string | null
          id?: string
          metadata?: Json | null
          organization?: string
          source_id?: string
          source_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      siam_web_crawl_results: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: number
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sync_status: {
        Row: {
          created_at: string | null
          id: number
          last_sync_time: string
          sync_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          last_sync_time: string
          sync_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          last_sync_time?: string
          sync_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_metrics_snapshots: {
        Row: {
          created_at: string
          id: string
          metrics: Json
        }
        Insert: {
          created_at?: string
          id?: string
          metrics: Json
        }
        Update: {
          created_at?: string
          id?: string
          metrics?: Json
        }
        Relationships: []
      }
      test_context_attribution: {
        Row: {
          confidence: number
          context_source: string
          created_at: string
          id: string
          line_content: string
          line_number: number
          test_id: string
        }
        Insert: {
          confidence?: number
          context_source: string
          created_at?: string
          id?: string
          line_content: string
          line_number: number
          test_id: string
        }
        Update: {
          confidence?: number
          context_source?: string
          created_at?: string
          id?: string
          line_content?: string
          line_number?: number
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_test"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "generated_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_contexts: {
        Row: {
          aut: string
          browser_name: string
          execution_timestamp: string | null
          id: string
        }
        Insert: {
          aut: string
          browser_name: string
          execution_timestamp?: string | null
          id?: string
        }
        Update: {
          aut?: string
          browser_name?: string
          execution_timestamp?: string | null
          id?: string
        }
        Relationships: []
      }
      test_coverage: {
        Row: {
          branch_coverage: number | null
          coverage_data: Json | null
          created_at: string | null
          execution_id: string
          file_path: string
          function_coverage: number | null
          id: string
          line_coverage: number | null
          statement_coverage: number | null
          uncovered_lines: number[] | null
        }
        Insert: {
          branch_coverage?: number | null
          coverage_data?: Json | null
          created_at?: string | null
          execution_id: string
          file_path: string
          function_coverage?: number | null
          id?: string
          line_coverage?: number | null
          statement_coverage?: number | null
          uncovered_lines?: number[] | null
        }
        Update: {
          branch_coverage?: number | null
          coverage_data?: Json | null
          created_at?: string | null
          execution_id?: string
          file_path?: string
          function_coverage?: number | null
          id?: string
          line_coverage?: number | null
          statement_coverage?: number | null
          uncovered_lines?: number[] | null
        }
        Relationships: []
      }
      test_executions: {
        Row: {
          created_at: string | null
          environment: string | null
          execution_id: string
          failed: number | null
          flaky_count: number | null
          id: string
          metadata: Json | null
          passed: number | null
          run_id: string | null
          skipped: number | null
          suite_name: string | null
          total_tests: number | null
          triggered_by: string | null
          worker_count: number | null
        }
        Insert: {
          created_at?: string | null
          environment?: string | null
          execution_id: string
          failed?: number | null
          flaky_count?: number | null
          id?: string
          metadata?: Json | null
          passed?: number | null
          run_id?: string | null
          skipped?: number | null
          suite_name?: string | null
          total_tests?: number | null
          triggered_by?: string | null
          worker_count?: number | null
        }
        Update: {
          created_at?: string | null
          environment?: string | null
          execution_id?: string
          failed?: number | null
          flaky_count?: number | null
          id?: string
          metadata?: Json | null
          passed?: number | null
          run_id?: string | null
          skipped?: number | null
          suite_name?: string | null
          total_tests?: number | null
          triggered_by?: string | null
          worker_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_executions_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "test_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      test_feedback: {
        Row: {
          context_sources: Json | null
          created_at: string
          feedback_category: string | null
          feedback_details: Json | null
          feedback_reason: string | null
          feedback_score: number | null
          feedback_status: string
          id: string
          improved_test_content: string | null
          original_test_content: string
          reviewer: string | null
          test_spec_id: string | null
          updated_at: string
        }
        Insert: {
          context_sources?: Json | null
          created_at?: string
          feedback_category?: string | null
          feedback_details?: Json | null
          feedback_reason?: string | null
          feedback_score?: number | null
          feedback_status: string
          id?: string
          improved_test_content?: string | null
          original_test_content: string
          reviewer?: string | null
          test_spec_id?: string | null
          updated_at?: string
        }
        Update: {
          context_sources?: Json | null
          created_at?: string
          feedback_category?: string | null
          feedback_details?: Json | null
          feedback_reason?: string | null
          feedback_score?: number | null
          feedback_status?: string
          id?: string
          improved_test_content?: string | null
          original_test_content?: string
          reviewer?: string | null
          test_spec_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_feedback_test_spec_id_fkey"
            columns: ["test_spec_id"]
            isOneToOne: false
            referencedRelation: "test_specs"
            referencedColumns: ["id"]
          },
        ]
      }
      test_generation_patterns: {
        Row: {
          created_at: string
          frequency: number
          id: string
          pattern_category: string
          pattern_content: string
          pattern_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          frequency?: number
          id?: string
          pattern_category: string
          pattern_content: string
          pattern_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          frequency?: number
          id?: string
          pattern_category?: string
          pattern_content?: string
          pattern_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      test_knowledge_base: {
        Row: {
          category: string
          content: string
          content_tsvector: unknown
          created_at: string | null
          embedding: string | null
          helpful_count: number | null
          id: string
          metadata: Json | null
          relevance_score: number | null
          solution: string | null
          source: string
          source_id: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category: string
          content: string
          content_tsvector?: unknown
          created_at?: string | null
          embedding?: string | null
          helpful_count?: number | null
          id?: string
          metadata?: Json | null
          relevance_score?: number | null
          solution?: string | null
          source: string
          source_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string
          content?: string
          content_tsvector?: unknown
          created_at?: string | null
          embedding?: string | null
          helpful_count?: number | null
          id?: string
          metadata?: Json | null
          relevance_score?: number | null
          solution?: string | null
          source?: string
          source_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      test_quality_dimensions: {
        Row: {
          coverage_score: number | null
          created_at: string
          effectiveness_score: number | null
          id: string
          maintainability_score: number | null
          overall_score: number | null
          readability_score: number | null
          test_feedback_id: string | null
        }
        Insert: {
          coverage_score?: number | null
          created_at?: string
          effectiveness_score?: number | null
          id?: string
          maintainability_score?: number | null
          overall_score?: number | null
          readability_score?: number | null
          test_feedback_id?: string | null
        }
        Update: {
          coverage_score?: number | null
          created_at?: string
          effectiveness_score?: number | null
          id?: string
          maintainability_score?: number | null
          overall_score?: number | null
          readability_score?: number | null
          test_feedback_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_quality_dimensions_test_feedback_id_fkey"
            columns: ["test_feedback_id"]
            isOneToOne: false
            referencedRelation: "test_feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      test_results: {
        Row: {
          browser_logs: Json | null
          console_logs: Json | null
          coverage_data: Json | null
          created_at: string
          duration: number | null
          embedding: string | null
          error_message: string | null
          execution_id: string | null
          flakiness_score: number | null
          html_snapshot: string | null
          id: string
          metadata: Json | null
          performance_metrics: Json | null
          retry_count: number | null
          screenshot_url: string | null
          stack_trace: string | null
          status: string
          suite_name: string | null
          tags: string[] | null
          test_file: string
          test_name: string
          trace_url: string | null
          updated_at: string
        }
        Insert: {
          browser_logs?: Json | null
          console_logs?: Json | null
          coverage_data?: Json | null
          created_at?: string
          duration?: number | null
          embedding?: string | null
          error_message?: string | null
          execution_id?: string | null
          flakiness_score?: number | null
          html_snapshot?: string | null
          id?: string
          metadata?: Json | null
          performance_metrics?: Json | null
          retry_count?: number | null
          screenshot_url?: string | null
          stack_trace?: string | null
          status: string
          suite_name?: string | null
          tags?: string[] | null
          test_file: string
          test_name: string
          trace_url?: string | null
          updated_at?: string
        }
        Update: {
          browser_logs?: Json | null
          console_logs?: Json | null
          coverage_data?: Json | null
          created_at?: string
          duration?: number | null
          embedding?: string | null
          error_message?: string | null
          execution_id?: string | null
          flakiness_score?: number | null
          html_snapshot?: string | null
          id?: string
          metadata?: Json | null
          performance_metrics?: Json | null
          retry_count?: number | null
          screenshot_url?: string | null
          stack_trace?: string | null
          status?: string
          suite_name?: string | null
          tags?: string[] | null
          test_file?: string
          test_name?: string
          trace_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      test_runs: {
        Row: {
          branch: string
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          environment: string | null
          failed_tests: number | null
          id: string
          metadata: Json | null
          passed_tests: number | null
          runner: string | null
          spec_id: string | null
          started_at: string
          status: string
          suite_name: string | null
          total_tests: number | null
          triggered_by: string | null
        }
        Insert: {
          branch: string
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          environment?: string | null
          failed_tests?: number | null
          id?: string
          metadata?: Json | null
          passed_tests?: number | null
          runner?: string | null
          spec_id?: string | null
          started_at?: string
          status: string
          suite_name?: string | null
          total_tests?: number | null
          triggered_by?: string | null
        }
        Update: {
          branch?: string
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          environment?: string | null
          failed_tests?: number | null
          id?: string
          metadata?: Json | null
          passed_tests?: number | null
          runner?: string | null
          spec_id?: string | null
          started_at?: string
          status?: string
          suite_name?: string | null
          total_tests?: number | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_runs_spec_id_fkey"
            columns: ["spec_id"]
            isOneToOne: false
            referencedRelation: "test_specs"
            referencedColumns: ["id"]
          },
        ]
      }
      test_save_events: {
        Row: {
          file_name: string
          file_path: string
          id: string
          saved_at: string
          user_id: string | null
        }
        Insert: {
          file_name: string
          file_path: string
          id?: string
          saved_at?: string
          user_id?: string | null
        }
        Update: {
          file_name?: string
          file_path?: string
          id?: string
          saved_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      test_specs: {
        Row: {
          ai_generated: boolean | null
          created_at: string
          flaky: boolean | null
          id: string
          jira_key: string | null
          path: string
        }
        Insert: {
          ai_generated?: boolean | null
          created_at?: string
          flaky?: boolean | null
          id?: string
          jira_key?: string | null
          path: string
        }
        Update: {
          ai_generated?: boolean | null
          created_at?: string
          flaky?: boolean | null
          id?: string
          jira_key?: string | null
          path?: string
        }
        Relationships: []
      }
      todos: {
        Row: {
          category: string
          completed: boolean
          created_at: string | null
          due_date: string | null
          id: string
          position: number | null
          priority: string
          text: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          completed?: boolean
          created_at?: string | null
          due_date?: string | null
          id?: string
          position?: number | null
          priority?: string
          text: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          completed?: boolean
          created_at?: string | null
          due_date?: string | null
          id?: string
          position?: number | null
          priority?: string
          text?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      traces: {
        Row: {
          aut: string
          id: string
          page_id: string | null
          recorded_at: string | null
          url: string
        }
        Insert: {
          aut: string
          id?: string
          page_id?: string | null
          recorded_at?: string | null
          url: string
        }
        Update: {
          aut?: string
          id?: string
          page_id?: string | null
          recorded_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_traces_page"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          email: string | null
          emailVerified: string | null
          id: string
          image: string | null
          name: string | null
        }
        Insert: {
          email?: string | null
          emailVerified?: string | null
          id: string
          image?: string | null
          name?: string | null
        }
        Update: {
          email?: string | null
          emailVerified?: string | null
          id?: string
          image?: string | null
          name?: string | null
        }
        Relationships: []
      }
      user_nicknames: {
        Row: {
          created_at: string
          id: string
          nickname: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nickname: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nickname?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          auth_user_id: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          nickname: string | null
          primary_email: string | null
          secondary_email: string | null
          theme_preference: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          nickname?: string | null
          primary_email?: string | null
          secondary_email?: string | null
          theme_preference?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          nickname?: string | null
          primary_email?: string | null
          secondary_email?: string | null
          theme_preference?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      vector_query_performance: {
        Row: {
          app_under_test: string | null
          avg_similarity: number | null
          created_at: string | null
          division: string | null
          embedding_provider: string | null
          id: string
          match_count: number | null
          organization: string | null
          query_duration_ms: number | null
          query_text: string | null
          results_returned: number | null
        }
        Insert: {
          app_under_test?: string | null
          avg_similarity?: number | null
          created_at?: string | null
          division?: string | null
          embedding_provider?: string | null
          id?: string
          match_count?: number | null
          organization?: string | null
          query_duration_ms?: number | null
          query_text?: string | null
          results_returned?: number | null
        }
        Update: {
          app_under_test?: string | null
          avg_similarity?: number | null
          created_at?: string | null
          division?: string | null
          embedding_provider?: string | null
          id?: string
          match_count?: number | null
          organization?: string | null
          query_duration_ms?: number | null
          query_text?: string | null
          results_returned?: number | null
        }
        Relationships: []
      }
      verification_tokens: {
        Row: {
          expires: string
          identifier: string
          token: string
        }
        Insert: {
          expires: string
          identifier: string
          token: string
        }
        Update: {
          expires?: string
          identifier?: string
          token?: string
        }
        Relationships: []
      }
      VerificationToken: {
        Row: {
          expires: string
          identifier: string
          token: string
        }
        Insert: {
          expires: string
          identifier: string
          token: string
        }
        Update: {
          expires?: string
          identifier?: string
          token?: string
        }
        Relationships: []
      }
      visual_baselines: {
        Row: {
          component_name: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          page_url: string
          selector_path: string | null
          snapshot_id: string
        }
        Insert: {
          component_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          page_url: string
          selector_path?: string | null
          snapshot_id: string
        }
        Update: {
          component_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          page_url?: string
          selector_path?: string | null
          snapshot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visual_baselines_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "visual_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      visual_diffs: {
        Row: {
          ai_analysis: Json | null
          base_snapshot_id: string
          compare_snapshot_id: string
          created_at: string | null
          diff_areas: Json
          diff_image_url: string
          diff_percentage: number
          diff_pixels: number
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          ai_analysis?: Json | null
          base_snapshot_id: string
          compare_snapshot_id: string
          created_at?: string | null
          diff_areas: Json
          diff_image_url: string
          diff_percentage: number
          diff_pixels: number
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          ai_analysis?: Json | null
          base_snapshot_id?: string
          compare_snapshot_id?: string
          created_at?: string | null
          diff_areas?: Json
          diff_image_url?: string
          diff_percentage?: number
          diff_pixels?: number
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "visual_diffs_base_snapshot_id_fkey"
            columns: ["base_snapshot_id"]
            isOneToOne: false
            referencedRelation: "visual_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visual_diffs_compare_snapshot_id_fkey"
            columns: ["compare_snapshot_id"]
            isOneToOne: false
            referencedRelation: "visual_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      visual_snapshots: {
        Row: {
          browser_info: Json
          component_name: string | null
          created_at: string | null
          device_pixel_ratio: number
          id: string
          image_hash: string
          image_url: string
          page_url: string
          selector_path: string | null
          timestamp: string
          viewport_height: number
          viewport_width: number
        }
        Insert: {
          browser_info: Json
          component_name?: string | null
          created_at?: string | null
          device_pixel_ratio: number
          id?: string
          image_hash: string
          image_url: string
          page_url: string
          selector_path?: string | null
          timestamp?: string
          viewport_height: number
          viewport_width: number
        }
        Update: {
          browser_info?: Json
          component_name?: string | null
          created_at?: string | null
          device_pixel_ratio?: number
          id?: string
          image_hash?: string
          image_url?: string
          page_url?: string
          selector_path?: string | null
          timestamp?: string
          viewport_height?: number
          viewport_width?: number
        }
        Relationships: []
      }
      voice_settings: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          pitch: number | null
          rate: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          pitch?: number | null
          rate?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          pitch?: number | null
          rate?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      wiki_documents: {
        Row: {
          app_name: string
          content_hash: string | null
          crawled_at: string | null
          embedding: string | null
          id: string
          markdown_content: string | null
          metadata: Json | null
          title: string | null
          url: string
        }
        Insert: {
          app_name: string
          content_hash?: string | null
          crawled_at?: string | null
          embedding?: string | null
          id?: string
          markdown_content?: string | null
          metadata?: Json | null
          title?: string | null
          url: string
        }
        Update: {
          app_name?: string
          content_hash?: string | null
          crawled_at?: string | null
          embedding?: string | null
          id?: string
          markdown_content?: string | null
          metadata?: Json | null
          title?: string | null
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      beta_base_query_patterns: {
        Row: {
          avg_pass_rate: number | null
          avg_relevance: number | null
          frequency: number | null
          pattern: string | null
          tiers: string[] | null
          top_scenario_ids: string[] | null
        }
        Relationships: []
      }
      console_error_analysis: {
        Row: {
          avg_memory_usage_bytes: number | null
          had_offline_state: boolean | null
          hour: string | null
          level: string | null
          occurrence_count: number | null
          page_url: string | null
          unique_message_count: number | null
          unique_messages: string[] | null
        }
        Relationships: []
      }
      dom_complexity_analysis: {
        Row: {
          avg_dom_depth: number | null
          avg_element_count: number | null
          captured_elements: number | null
          div_count: number | null
          hour: string | null
          page_url: string | null
          samples: number | null
          viewport_height: string | null
          viewport_width: string | null
        }
        Relationships: []
      }
      flaky_tests_view: {
        Row: {
          failure_rate: number | null
          failures: number | null
          flakiness_score: number | null
          passes: number | null
          recent_history: string[] | null
          test_name: string | null
          total_runs: number | null
        }
        Relationships: []
      }
      performance_overview: {
        Row: {
          avg_dom_load_ms: number | null
          avg_fcp_ms: number | null
          avg_full_load_ms: number | null
          avg_lcp_ms: number | null
          avg_ttfb_ms: number | null
          hour: string | null
          p95_full_load_ms: number | null
          page_url: string | null
          samples: number | null
        }
        Relationships: []
      }
      siam_tables_summary: {
        Row: {
          last_updated: string | null
          row_count: number | null
          table_name: string | null
        }
        Relationships: []
      }
      siam_vector_stats: {
        Row: {
          app_under_test: string | null
          avg_content_length: number | null
          division: string | null
          document_count: number | null
          embedding_storage_size: string | null
          newest_document: string | null
          oldest_document: string | null
          organization: string | null
          source_type: string | null
        }
        Relationships: []
      }
      test_execution_summary: {
        Row: {
          avg_pass_rate: number | null
          date: string | null
          failed_tests: number | null
          passed_tests: number | null
          skipped_tests: number | null
          total_executions: number | null
          total_tests: number | null
        }
        Relationships: []
      }
      visual_regression_analysis: {
        Row: {
          ai_analysis: Json | null
          browser_info: Json | null
          component_name: string | null
          device_pixel_ratio: number | null
          diff_id: string | null
          diff_percentage: number | null
          diff_pixels: number | null
          diff_timestamp: string | null
          page_url: string | null
          selector_path: string | null
          status: string | null
          viewport_height: number | null
          viewport_width: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      begin_transaction: { Args: never; Returns: undefined }
      check_tables_exist: { Args: never; Returns: Json }
      commit_transaction: { Args: never; Returns: undefined }
      extract_test_patterns: {
        Args: {
          category?: string
          improved_content: string
          is_positive: boolean
          original_content: string
        }
        Returns: undefined
      }
      find_similar_failures: {
        Args: { error_text: string; limit_count?: number }
        Returns: {
          error_message: string
          similarity_score: number
          test_name: string
        }[]
      }
      find_similar_scenarios: {
        Args: {
          match_count?: number
          match_threshold?: number
          min_tier?: string
          query_embedding: string
        }
        Returns: {
          execution_count: number
          id: string
          name: string
          pass_rate: number
          relevance_score: number
          similarity: number
          tier: string
        }[]
      }
      get_execution_trend: {
        Args: { scenario_uuid: string }
        Returns: {
          fail_count: number
          month: string
          pass_count: number
          pass_rate: number
          total_executions: number
        }[]
      }
      get_flaky_tests: {
        Args: {
          flakiness_threshold?: number
          min_runs?: number
          start_date?: string
        }
        Returns: {
          failure_rate: number
          failures: number
          flakiness_score: number
          passes: number
          test_name: string
          total_runs: number
        }[]
      }
      get_user_by_auth_id: {
        Args: { p_auth_user_id: string }
        Returns: {
          auth_user_id: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          nickname: string | null
          primary_email: string | null
          secondary_email: string | null
          theme_preference: string | null
          updated_at: string
          username: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_by_email: {
        Args: { p_email: string }
        Returns: {
          auth_user_id: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          nickname: string | null
          primary_email: string | null
          secondary_email: string | null
          theme_preference: string | null
          updated_at: string
          username: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_by_username: {
        Args: { p_username: string }
        Returns: {
          auth_user_id: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          nickname: string | null
          primary_email: string | null
          secondary_email: string | null
          theme_preference: string | null
          updated_at: string
          username: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_nickname: { Args: { p_user_id: string }; Returns: string }
      get_user_recent_audio_files: {
        Args: { limit_count?: number; user_uuid: string }
        Returns: {
          created_at: string
          duration_seconds: number
          filename: string
          id: string
        }[]
      }
      insert_test_deduplication_scan: {
        Args: { p_initiated_by: string; p_status?: string }
        Returns: Json
      }
      insert_test_duplicate_file: {
        Args: {
          p_action_taken?: string
          p_duplicate_file_id: string
          p_original_file_id: string
          p_scan_id: string
        }
        Returns: Json
      }
      insert_test_file_metadata: {
        Args: {
          p_content_type: string
          p_created_by: string
          p_file_hash: string
          p_file_path: string
          p_file_size: number
          p_filename: string
        }
        Returns: Json
      }
      match_aoma_pages: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          id: string
          similarity: number
          text_content: string
          title: string
          url: string
        }[]
      }
      match_aoma_vectors: {
        Args: {
          filter_source_types?: string[]
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          created_at: string
          id: string
          metadata: Json
          similarity: number
          source_id: string
          source_type: string
        }[]
      }
      match_app_pages: {
        Args: {
          app_name: string
          match_count: number
          query_embedding: string
          similarity_threshold: number
        }
        Returns: {
          app_under_test: string
          created_at: string
          embedding: string
          html_content: string
          id: string
          interactive_elements: Json
          screenshot: string
          section_name: string
          similarity: number
          text_content: string
          title: string
          updated_at: string
          url: string
        }[]
      }
      match_code_files: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
          repo_path: string
        }
        Returns: {
          content: string
          file_path: string
          metadata: Json
          similarity: number
        }[]
      }
      match_crawled_pages: {
        Args: {
          app_filter: string
          match_count?: number
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          app_identifier: string
          description: string
          html_content: string
          id: string
          main_content: string
          meta_data: Json
          screenshot_path: string
          similarity: number
          title: string
          url: string
          visited_at: string
        }[]
      }
      match_git_files: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: unknown
        }
        Returns: {
          file_path: string
          metadata: Json
          repo_name: string
          similarity: number
        }[]
      }
      match_jira_tickets:
        | {
            Args: {
              match_count: number
              match_threshold: number
              query_embedding: unknown
            }
            Returns: {
              metadata: Json
              similarity: number
              summary: string
              ticket_key: string
            }[]
          }
        | {
            Args: {
              match_count: number
              match_threshold: number
              query_embedding: string
            }
            Returns: {
              metadata: Json
              similarity: number
              summary: string
              ticket_key: string
            }[]
          }
      match_page_embeddings: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          aut: string
          id: number
          similarity: number
          title: string
          url: string
        }[]
      }
      match_siam_git_files: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_siam_jira_tickets: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_siam_meeting_transcriptions: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_siam_vectors: {
        Args: {
          filter_source_types?: string[]
          match_count?: number
          match_threshold?: number
          p_app_under_test: string
          p_division: string
          p_organization: string
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
          source_id: string
          source_type: string
        }[]
      }
      match_siam_vectors_fast: {
        Args: {
          filter_source_types?: string[]
          match_count?: number
          p_app_under_test: string
          p_division: string
          p_organization: string
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
          source_id: string
          source_type: string
        }[]
      }
      match_siam_vectors_gemini: {
        Args: {
          filter_source_types?: string[]
          match_count?: number
          match_threshold?: number
          p_app_under_test: string
          p_division: string
          p_organization: string
          query_embedding: string
        }
        Returns: {
          app_under_test: string
          content: string
          division: string
          embedding_gemini: string
          id: string
          metadata: Json
          organization: string
          similarity: number
          source_id: string
          source_type: string
        }[]
      }
      match_siam_web_crawl_results: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_wiki_documents: {
        Args: {
          app_name_filter?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          app_name: string
          content_hash: string
          crawled_at: string
          id: string
          markdown_content: string
          metadata: Json
          similarity: number
          title: string
          url: string
        }[]
      }
      refresh_query_patterns: { Args: never; Returns: undefined }
      rollback_transaction: { Args: never; Returns: undefined }
      search_aqm_knowledge: {
        Args: { limit_count?: number; query_embedding: string }
        Returns: {
          category: string
          id: string
          similarity: number
          title: string
        }[]
      }
      search_code_files_semantic: {
        Args: {
          p_filters?: Json
          p_max_results?: number
          p_query_embedding: string
          p_similarity_threshold?: number
        }
        Returns: {
          content_preview: string
          content_summary: string
          file_extension: string
          file_name: string
          file_path: string
          language: string
          last_modified: string
          line_count: number
          repository_name: string
          similarity: number
        }[]
      }
      search_crawler_docs:
        | {
            Args: {
              app_name_param: string
              match_count?: number
              match_threshold?: number
              query_embedding: string
            }
            Returns: {
              app_name: string
              content: string
              id: string
              metadata: Json
              similarity: number
              title: string
              url: string
            }[]
          }
        | {
            Args: {
              p_app_name: string
              p_match_count: number
              p_query_embedding: string
            }
            Returns: {
              content_hash: string
              id: string
              last_crawled_at: string
              metadata: Json
              similarity: number
              storage_path: string
              url: string
            }[]
          }
      search_git_commits_semantic: {
        Args: {
          p_filters?: Json
          p_max_results?: number
          p_query_embedding: string
          p_similarity_threshold?: number
        }
        Returns: {
          additions: number
          author_email: string
          author_name: string
          commit_date: string
          commit_hash: string
          commit_message: string
          deletions: number
          diff_summary: string
          files_changed: Json
          repository_name: string
          similarity: number
        }[]
      }
      search_jira_tickets_semantic:
        | {
            Args: {
              filters?: Json
              max_results?: number
              search_query: string
              similarity_threshold?: number
            }
            Returns: {
              key: string
              priority: string
              project_key: string
              similarity: number
              status: string
              summary: string
            }[]
          }
        | {
            Args: {
              p_filters?: Json
              p_max_results?: number
              p_query_embedding: string
              p_similarity_threshold?: number
            }
            Returns: {
              key: string
              priority: string
              project_key: string
              similarity: number
              status: string
              summary: string
            }[]
          }
      search_scenarios: {
        Args: { min_tier?: string; result_limit?: number; search_query: string }
        Returns: {
          execution_count: number
          id: string
          name: string
          pass_rate: number
          rank: number
          relevance_score: number
          snippet: string
          tier: string
        }[]
      }
      set_user_nickname: {
        Args: { p_nickname: string; p_user_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      sync_test_failure_to_knowledge: {
        Args: { test_result_id: string }
        Returns: undefined
      }
      update_context_source_weight: {
        Args: { is_positive: boolean; source_name: string }
        Returns: undefined
      }
      upsert_aoma_vector: {
        Args: {
          p_content: string
          p_embedding: string
          p_metadata?: Json
          p_source_id: string
          p_source_type: string
        }
        Returns: string
      }
      upsert_siam_vector: {
        Args: {
          p_app_under_test: string
          p_content: string
          p_division: string
          p_embedding: string
          p_metadata?: Json
          p_organization: string
          p_source_id: string
          p_source_type: string
        }
        Returns: string
      }
      upsert_user: {
        Args: {
          p_auth_user_id: string
          p_first_name?: string
          p_last_name?: string
          p_nickname?: string
          p_primary_email?: string
          p_secondary_email?: string
          p_theme_preference?: string
          p_username?: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
