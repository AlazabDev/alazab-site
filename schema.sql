


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."mr_status" AS ENUM (
    'Open',
    'InProgress',
    'Completed',
    'Cancelled'
);


ALTER TYPE "public"."mr_status" OWNER TO "postgres";


CREATE TYPE "public"."notification_severity" AS ENUM (
    'info',
    'success',
    'warning',
    'error'
);


ALTER TYPE "public"."notification_severity" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_quotation_number"() RETURNS "text"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  next_num integer;
  year_str text;
BEGIN
  year_str := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(NULLIF(split_part(quotation_number, '-', 3), '') AS integer)
  ), 0) + 1
  INTO next_num
  FROM public.quotations
  WHERE quotation_number LIKE 'AZB-' || year_str || '-%';
  
  RETURN 'AZB-' || year_str || '-' || LPAD(next_num::text, 4, '0');
END;
$$;


ALTER FUNCTION "public"."generate_quotation_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_conversation_stats"("start_date" timestamp with time zone, "end_date" timestamp with time zone) RETURNS TABLE("total_conversations" bigint, "avg_duration" numeric, "positive_sentiment_count" bigint, "negative_sentiment_count" bigint, "needs_followup_count" bigint)
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT c.conversation_id)::BIGINT,
        AVG(c.duration_seconds)::DECIMAL,
        COUNT(DISTINCT CASE WHEN a.sentiment_label = 'positive' THEN c.conversation_id END)::BIGINT,
        COUNT(DISTINCT CASE WHEN a.sentiment_label = 'negative' THEN c.conversation_id END)::BIGINT,
        COUNT(DISTINCT f.conversation_id)::BIGINT
    FROM public.conversations c
    LEFT JOIN public.conversation_analytics a ON c.conversation_id = a.conversation_id
    LEFT JOIN public.followup_tasks f ON c.conversation_id = f.conversation_id
    WHERE c.created_at BETWEEN start_date AND end_date;
END;
$$;


ALTER FUNCTION "public"."get_conversation_stats"("start_date" timestamp with time zone, "end_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "message" "text",
    "severity" "public"."notification_severity" DEFAULT 'info'::"public"."notification_severity" NOT NULL,
    "source" "text" DEFAULT 'system'::"text" NOT NULL,
    "link" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."admin_notifications" REPLICA IDENTITY FULL;


ALTER TABLE "public"."admin_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_secrets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."app_secrets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."branches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "company_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."branches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chatbot_knowledge" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "source_type" "text" DEFAULT 'manual'::"text" NOT NULL,
    "file_name" "text",
    "category" "text" DEFAULT 'عام'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chatbot_knowledge" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_analytics" (
    "id" bigint NOT NULL,
    "conversation_id" "text" NOT NULL,
    "sentiment_score" numeric(3,2),
    "sentiment_label" "text",
    "topics" "text"[] DEFAULT '{}'::"text"[],
    "entities" "jsonb" DEFAULT '{}'::"jsonb",
    "action_items" "jsonb" DEFAULT '[]'::"jsonb",
    "summary" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "conversation_analytics_sentiment_label_check" CHECK (("sentiment_label" = ANY (ARRAY['positive'::"text", 'negative'::"text", 'neutral'::"text", 'mixed'::"text"]))),
    CONSTRAINT "conversation_analytics_sentiment_score_check" CHECK ((("sentiment_score" >= ('-1'::integer)::numeric) AND ("sentiment_score" <= (1)::numeric)))
);


ALTER TABLE "public"."conversation_analytics" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."conversation_analytics_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."conversation_analytics_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."conversation_analytics_id_seq" OWNED BY "public"."conversation_analytics"."id";



CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" bigint NOT NULL,
    "conversation_id" "text" NOT NULL,
    "agent_id" "text",
    "status" "text" DEFAULT 'initiated'::"text",
    "dynamic_variables" "jsonb" DEFAULT '{}'::"jsonb",
    "telephony_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "started_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "ended_at" timestamp with time zone,
    "duration_seconds" integer DEFAULT 0,
    "transcript" "jsonb" DEFAULT '[]'::"jsonb",
    "analysis" "jsonb" DEFAULT '{}'::"jsonb",
    "audio_url" "text",
    "has_audio" boolean DEFAULT false,
    "has_transcript" boolean DEFAULT false,
    "failure_reason" "text",
    "failure_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "conversations_status_check" CHECK (("status" = ANY (ARRAY['initiated'::"text", 'active'::"text", 'completed'::"text", 'failed'::"text", 'ended'::"text"])))
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."conversations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."conversations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."conversations_id_seq" OWNED BY "public"."conversations"."id";



CREATE TABLE IF NOT EXISTS "public"."cost_estimate_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_name" "text" NOT NULL,
    "client_phone" "text" NOT NULL,
    "client_type" "text",
    "project_name" "text",
    "city" "text",
    "notes" "text",
    "category" "text",
    "subtype" "text",
    "area" numeric,
    "floors" integer,
    "location" "text",
    "condition" "text",
    "scope" "text",
    "finish_level" "text",
    "enabled_items" "jsonb" DEFAULT '[]'::"jsonb",
    "management_pct" numeric,
    "contingency_pct" numeric,
    "estimated_total" numeric,
    "per_meter" numeric,
    "range_min" numeric,
    "range_max" numeric,
    "accuracy" "text",
    "status" "text" DEFAULT 'new'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."cost_estimate_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."finishing_levels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "name_en" "text",
    "price_per_sqm" numeric DEFAULT 0 NOT NULL,
    "description" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."finishing_levels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."followup_tasks" (
    "id" bigint NOT NULL,
    "conversation_id" "text" NOT NULL,
    "task_type" "text" DEFAULT 'general'::"text",
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "priority" "text" DEFAULT 'normal'::"text",
    "assigned_to" "text",
    "due_date" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "followup_tasks_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'normal'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "followup_tasks_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."followup_tasks" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."followup_tasks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."followup_tasks_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."followup_tasks_id_seq" OWNED BY "public"."followup_tasks"."id";



CREATE TABLE IF NOT EXISTS "public"."integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "config" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."keepalive" (
    "id" integer NOT NULL
);


ALTER TABLE "public"."keepalive" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."login_otp" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "phone" "text" NOT NULL,
    "code" "text" NOT NULL,
    "expires_at" timestamp without time zone NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."login_otp" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."maintenance_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "client_name" "text",
    "service_type" "text",
    "description" "text",
    "location" "text",
    "priority" "text" DEFAULT 'medium'::"text",
    "estimated_cost" numeric,
    "actual_cost" numeric,
    "status" "public"."mr_status" DEFAULT 'Open'::"public"."mr_status" NOT NULL,
    "branch_id" "uuid",
    "company_id" "uuid",
    "sla_due_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "client_phone" "text",
    "client_email" "text"
);


ALTER TABLE "public"."maintenance_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."media_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "whatsapp_number_id" "uuid" NOT NULL,
    "workflow_id" "uuid" NOT NULL,
    "contact_id" "uuid",
    "message_id" "uuid",
    "media_id" "text",
    "mime_type" "text",
    "file_size" bigint,
    "storage_path" "text",
    "public_url" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."media_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."media_messages" (
    "id" bigint NOT NULL,
    "conversation_id" "text" NOT NULL,
    "media_type" "text",
    "media_url" "text",
    "media_base64" "text",
    "transcript" "text",
    "file_size" integer,
    "mime_type" "text",
    "received_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "processed_at" timestamp with time zone,
    "is_processed" boolean DEFAULT false,
    CONSTRAINT "media_messages_media_type_check" CHECK (("media_type" = ANY (ARRAY['image'::"text", 'video'::"text", 'audio'::"text", 'document'::"text", 'sticker'::"text"])))
);


ALTER TABLE "public"."media_messages" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."media_messages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."media_messages_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."media_messages_id_seq" OWNED BY "public"."media_messages"."id";



CREATE TABLE IF NOT EXISTS "public"."notification_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "setting_key" "text" NOT NULL,
    "setting_value" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."otp_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "phone_number" "text" NOT NULL,
    "otp_code" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "verified" boolean DEFAULT false NOT NULL,
    "attempts" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."otp_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "image_id" "uuid",
    "author_name" character varying(255) NOT NULL,
    "author_email" character varying(255) NOT NULL,
    "comment_text" "text" NOT NULL,
    "rating" integer DEFAULT 0,
    "is_approved" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."project_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "image_url" "text" NOT NULL,
    "thumbnail_url" "text",
    "title" character varying(255),
    "description" "text",
    "alt_text" character varying(255),
    "order_index" integer DEFAULT 0,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."project_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "reviewer_name" "text" NOT NULL,
    "reviewer_email" "text",
    "reviewer_phone" "text",
    "rating" integer NOT NULL,
    "comment" "text" NOT NULL,
    "is_approved" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "project_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."project_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'جديد'::"text",
    "location" "text",
    "category" "text",
    "cover_image_url" "text",
    "model_3d_url" "text",
    "progress" integer DEFAULT 0,
    "company_name" "text",
    "budget" numeric,
    "start_date" "date",
    "end_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "slug" "text",
    "client_name" "text",
    "area_sqm" numeric,
    "year" integer,
    "model_3d_embeds" "jsonb" DEFAULT '[]'::"jsonb",
    "gallery" "jsonb" DEFAULT '[]'::"jsonb",
    "stats" "jsonb" DEFAULT '{}'::"jsonb",
    "content_ar" "text",
    "content_en" "text",
    "title_en" "text",
    "is_published" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_featured" boolean DEFAULT false,
    "order_index" integer DEFAULT 0,
    "short_description" character varying(500)
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quotation_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."quotation_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quotation_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_id" "uuid" NOT NULL,
    "item_code" "text",
    "description" "text" NOT NULL,
    "unit" "text" DEFAULT 'م2'::"text" NOT NULL,
    "default_unit_price" numeric DEFAULT 0 NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."quotation_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quotation_line_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quotation_id" "uuid" NOT NULL,
    "item_id" "uuid",
    "description" "text" NOT NULL,
    "unit" "text" DEFAULT 'م2'::"text" NOT NULL,
    "quantity" numeric DEFAULT 1 NOT NULL,
    "unit_price" numeric DEFAULT 0 NOT NULL,
    "total" numeric DEFAULT 0 NOT NULL,
    "notes" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."quotation_line_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quotation_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quotation_id" "uuid" NOT NULL,
    "notification_type" "text" NOT NULL,
    "recipient_type" "text" NOT NULL,
    "recipient_phone" "text",
    "wa_message_id" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."quotation_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quotations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quotation_number" "text" NOT NULL,
    "client_name" "text" NOT NULL,
    "client_phone" "text",
    "client_email" "text",
    "project_type" "text" DEFAULT 'residential'::"text" NOT NULL,
    "property_type" "text",
    "property_area" numeric,
    "pricing_system" "text" DEFAULT 'area_based'::"text" NOT NULL,
    "finishing_level_id" "uuid",
    "material_cost" numeric,
    "labor_percentage" numeric DEFAULT 20,
    "subtotal" numeric DEFAULT 0 NOT NULL,
    "discount_percentage" numeric DEFAULT 0,
    "discount_amount" numeric DEFAULT 0,
    "tax_percentage" numeric DEFAULT 14,
    "tax_amount" numeric DEFAULT 0,
    "total" numeric DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "notes" "text",
    "valid_until" "date",
    "pdf_url" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "rejection_reason" "text",
    "approval_notes" "text",
    "modified_by" "uuid",
    "modified_at" timestamp with time zone
);


ALTER TABLE "public"."quotations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."request_server" (
    "id" bigint NOT NULL,
    "inserted_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "data" "jsonb",
    "name" "text"
);


ALTER TABLE "public"."request_server" OWNER TO "postgres";


ALTER TABLE "public"."request_server" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."request_server_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."service_pages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title_ar" "text" NOT NULL,
    "title_en" "text",
    "subtitle_ar" "text",
    "subtitle_en" "text",
    "hero_image_url" "text",
    "content_ar" "text",
    "content_en" "text",
    "features" "jsonb" DEFAULT '[]'::"jsonb",
    "gallery" "jsonb" DEFAULT '[]'::"jsonb",
    "is_published" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."service_pages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tax_invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_number" "text",
    "taxpayer" "text",
    "commercial_register" "text",
    "tax_card" "text",
    "invoice_date" "date",
    "item" "text",
    "description" "text",
    "taxable_amount" numeric,
    "tax_amount" numeric,
    "tax_type" "text" DEFAULT 'VAT_14'::"text",
    "source_section" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tax_invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "wa_template_name" "text" NOT NULL,
    "wa_template_code" "text" NOT NULL,
    "phone_number_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "category" "text" NOT NULL,
    "language" "text" NOT NULL,
    "preview_text" "text",
    "variables_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'user'::"text" NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_endpoints" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "url" "text" NOT NULL,
    "events" "jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."webhook_endpoints" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "raw_body" "text",
    "signature" "text",
    "event_hash" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."webhook_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_logs" (
    "id" bigint NOT NULL,
    "webhook_type" "text",
    "conversation_id" "text",
    "payload" "jsonb",
    "response_status" integer,
    "error_message" "text",
    "processing_time_ms" integer,
    "received_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "processed_at" timestamp with time zone
);


ALTER TABLE "public"."webhook_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."webhook_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."webhook_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."webhook_logs_id_seq" OWNED BY "public"."webhook_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."whatsapp_conversations" (
    "id" bigint NOT NULL,
    "user_phone" "text" NOT NULL,
    "conversation_id" "text" NOT NULL,
    "whatsapp_conversation_id" "text",
    "status" "text" DEFAULT 'active'::"text",
    "platform_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "started_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "ended_at" timestamp with time zone,
    "last_message_at" timestamp with time zone,
    "message_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "whatsapp_conversations_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'ended'::"text", 'pending'::"text"])))
);


ALTER TABLE "public"."whatsapp_conversations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."whatsapp_conversations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."whatsapp_conversations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."whatsapp_conversations_id_seq" OWNED BY "public"."whatsapp_conversations"."id";



CREATE TABLE IF NOT EXISTS "public"."whatsapp_flows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "wa_flow_id" "text",
    "name" "text" NOT NULL,
    "status" "text" DEFAULT 'DRAFT'::"text",
    "categories" "text"[],
    "validation_errors" "jsonb",
    "json_version" "text",
    "preview_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."whatsapp_flows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."whatsapp_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "wa_message_id" "text",
    "phone_number" "text" NOT NULL,
    "customer_name" "text",
    "direction" "text" DEFAULT 'outbound'::"text" NOT NULL,
    "message_type" "text" DEFAULT 'text'::"text" NOT NULL,
    "content" "text",
    "media_url" "text",
    "media_mime_type" "text",
    "status" "text" DEFAULT 'sent'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."whatsapp_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "config" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workflow_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "is_default" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "ai_enabled" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workflows" OWNER TO "postgres";


ALTER TABLE ONLY "public"."conversation_analytics" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."conversation_analytics_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."conversations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."conversations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."followup_tasks" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."followup_tasks_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."media_messages" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."media_messages_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."webhook_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."webhook_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."whatsapp_conversations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."whatsapp_conversations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."admin_notifications"
    ADD CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_secrets"
    ADD CONSTRAINT "app_secrets_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."app_secrets"
    ADD CONSTRAINT "app_secrets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."branches"
    ADD CONSTRAINT "branches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chatbot_knowledge"
    ADD CONSTRAINT "chatbot_knowledge_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_analytics"
    ADD CONSTRAINT "conversation_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_conversation_id_key" UNIQUE ("conversation_id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cost_estimate_requests"
    ADD CONSTRAINT "cost_estimate_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."finishing_levels"
    ADD CONSTRAINT "finishing_levels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."followup_tasks"
    ADD CONSTRAINT "followup_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integrations"
    ADD CONSTRAINT "integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."keepalive"
    ADD CONSTRAINT "keepalive_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."login_otp"
    ADD CONSTRAINT "login_otp_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."maintenance_requests"
    ADD CONSTRAINT "maintenance_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."media_files"
    ADD CONSTRAINT "media_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."media_messages"
    ADD CONSTRAINT "media_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_settings"
    ADD CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_settings"
    ADD CONSTRAINT "notification_settings_setting_key_key" UNIQUE ("setting_key");



ALTER TABLE ONLY "public"."otp_codes"
    ADD CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_comments"
    ADD CONSTRAINT "project_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_images"
    ADD CONSTRAINT "project_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_reviews"
    ADD CONSTRAINT "project_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."quotation_categories"
    ADD CONSTRAINT "quotation_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotation_items"
    ADD CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotation_line_items"
    ADD CONSTRAINT "quotation_line_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotation_notifications"
    ADD CONSTRAINT "quotation_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_quotation_number_key" UNIQUE ("quotation_number");



ALTER TABLE ONLY "public"."request_server"
    ADD CONSTRAINT "request_server_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_pages"
    ADD CONSTRAINT "service_pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_pages"
    ADD CONSTRAINT "service_pages_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."tax_invoices"
    ADD CONSTRAINT "tax_invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."templates"
    ADD CONSTRAINT "templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."templates"
    ADD CONSTRAINT "templates_wa_template_code_key" UNIQUE ("wa_template_code");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_endpoints"
    ADD CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_events"
    ADD CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_logs"
    ADD CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whatsapp_conversations"
    ADD CONSTRAINT "whatsapp_conversations_conversation_id_key" UNIQUE ("conversation_id");



ALTER TABLE ONLY "public"."whatsapp_conversations"
    ADD CONSTRAINT "whatsapp_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whatsapp_flows"
    ADD CONSTRAINT "whatsapp_flows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whatsapp_flows"
    ADD CONSTRAINT "whatsapp_flows_wa_flow_id_key" UNIQUE ("wa_flow_id");



ALTER TABLE ONLY "public"."whatsapp_messages"
    ADD CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_steps"
    ADD CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflows"
    ADD CONSTRAINT "workflows_pkey" PRIMARY KEY ("id");



CREATE INDEX "admin_notifications_created_at_idx" ON "public"."admin_notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "admin_notifications_unread_idx" ON "public"."admin_notifications" USING "btree" ("read_at") WHERE ("read_at" IS NULL);



CREATE INDEX "idx_analytics_conversation_id" ON "public"."conversation_analytics" USING "btree" ("conversation_id");



CREATE INDEX "idx_analytics_sentiment" ON "public"."conversation_analytics" USING "btree" ("sentiment_label");



CREATE INDEX "idx_analytics_topics" ON "public"."conversation_analytics" USING "gin" ("topics");



CREATE INDEX "idx_conversations_agent_id" ON "public"."conversations" USING "btree" ("agent_id");



CREATE INDEX "idx_conversations_conv_id" ON "public"."conversations" USING "btree" ("conversation_id");



CREATE INDEX "idx_conversations_created_at" ON "public"."conversations" USING "btree" ("created_at");



CREATE INDEX "idx_conversations_started_at" ON "public"."conversations" USING "btree" ("started_at");



CREATE INDEX "idx_conversations_status" ON "public"."conversations" USING "btree" ("status");



CREATE INDEX "idx_media_conversation_id" ON "public"."media_messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_media_received_at" ON "public"."media_messages" USING "btree" ("received_at");



CREATE INDEX "idx_media_type" ON "public"."media_messages" USING "btree" ("media_type");



CREATE INDEX "idx_otp_phone_expires" ON "public"."otp_codes" USING "btree" ("phone_number", "expires_at" DESC);



CREATE INDEX "idx_project_comments_image_id" ON "public"."project_comments" USING "btree" ("image_id");



CREATE INDEX "idx_project_comments_project_id" ON "public"."project_comments" USING "btree" ("project_id");



CREATE INDEX "idx_project_images_project_id" ON "public"."project_images" USING "btree" ("project_id");



CREATE INDEX "idx_project_reviews_project" ON "public"."project_reviews" USING "btree" ("project_id");



CREATE INDEX "idx_tasks_conversation_id" ON "public"."followup_tasks" USING "btree" ("conversation_id");



CREATE INDEX "idx_tasks_due_date" ON "public"."followup_tasks" USING "btree" ("due_date");



CREATE INDEX "idx_tasks_priority" ON "public"."followup_tasks" USING "btree" ("priority");



CREATE INDEX "idx_tasks_status" ON "public"."followup_tasks" USING "btree" ("status");



CREATE INDEX "idx_webhook_logs_conversation" ON "public"."webhook_logs" USING "btree" ("conversation_id");



CREATE INDEX "idx_webhook_logs_received_at" ON "public"."webhook_logs" USING "btree" ("received_at");



CREATE INDEX "idx_webhook_logs_type" ON "public"."webhook_logs" USING "btree" ("webhook_type");



CREATE INDEX "idx_whatsapp_conv_conversation_id" ON "public"."whatsapp_conversations" USING "btree" ("conversation_id");



CREATE INDEX "idx_whatsapp_conv_last_message" ON "public"."whatsapp_conversations" USING "btree" ("last_message_at");



CREATE INDEX "idx_whatsapp_conv_status" ON "public"."whatsapp_conversations" USING "btree" ("status");



CREATE INDEX "idx_whatsapp_conv_user_phone" ON "public"."whatsapp_conversations" USING "btree" ("user_phone");



CREATE INDEX "tax_invoices_invoice_date_idx" ON "public"."tax_invoices" USING "btree" ("invoice_date");



CREATE INDEX "tax_invoices_invoice_number_idx" ON "public"."tax_invoices" USING "btree" ("invoice_number");



CREATE UNIQUE INDEX "templates_unique_idx" ON "public"."templates" USING "btree" ("wa_template_code", "phone_number_id");



CREATE UNIQUE INDEX "webhook_events_hash_idx" ON "public"."webhook_events" USING "btree" ("event_hash");



CREATE OR REPLACE TRIGGER "trg_project_reviews_updated" BEFORE UPDATE ON "public"."project_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_projects_updated" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_service_pages_updated" BEFORE UPDATE ON "public"."service_pages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_analytics_updated_at" BEFORE UPDATE ON "public"."conversation_analytics" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_conversations_updated_at" BEFORE UPDATE ON "public"."conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tasks_updated_at" BEFORE UPDATE ON "public"."followup_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_whatsapp_conv_updated_at" BEFORE UPDATE ON "public"."whatsapp_conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."maintenance_requests"
    ADD CONSTRAINT "maintenance_requests_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id");



ALTER TABLE ONLY "public"."project_comments"
    ADD CONSTRAINT "project_comments_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "public"."project_images"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_comments"
    ADD CONSTRAINT "project_comments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_images"
    ADD CONSTRAINT "project_images_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_reviews"
    ADD CONSTRAINT "project_reviews_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quotation_items"
    ADD CONSTRAINT "quotation_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."quotation_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quotation_line_items"
    ADD CONSTRAINT "quotation_line_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."quotation_items"("id");



ALTER TABLE ONLY "public"."quotation_line_items"
    ADD CONSTRAINT "quotation_line_items_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quotation_notifications"
    ADD CONSTRAINT "quotation_notifications_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_finishing_level_id_fkey" FOREIGN KEY ("finishing_level_id") REFERENCES "public"."finishing_levels"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin delete branches" ON "public"."branches" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin delete categories" ON "public"."categories" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin delete maintenance_requests" ON "public"."maintenance_requests" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin delete projects" ON "public"."projects" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin insert branches" ON "public"."branches" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin insert categories" ON "public"."categories" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin insert projects" ON "public"."projects" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin manage chatbot_knowledge" ON "public"."chatbot_knowledge" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin manage finishing_levels" ON "public"."finishing_levels" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin manage integrations" ON "public"."integrations" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin manage notification_settings" ON "public"."notification_settings" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin manage quotation_categories" ON "public"."quotation_categories" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin manage quotation_items" ON "public"."quotation_items" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin manage quotation_line_items" ON "public"."quotation_line_items" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin manage quotation_notifications" ON "public"."quotation_notifications" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin manage quotations" ON "public"."quotations" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin manage reviews" ON "public"."project_reviews" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin manage service_pages" ON "public"."service_pages" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin manage webhook_endpoints" ON "public"."webhook_endpoints" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin manage whatsapp_flows" ON "public"."whatsapp_flows" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin manage workflow_steps" ON "public"."workflow_steps" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin manage workflows" ON "public"."workflows" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin or creator read quotation_line_items" ON "public"."quotation_line_items" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR ("quotation_id" IN ( SELECT "quotations"."id"
   FROM "public"."quotations"
  WHERE ("quotations"."created_by" = "auth"."uid"())))));



CREATE POLICY "Admin or creator read quotations" ON "public"."quotations" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR ("created_by" = "auth"."uid"())));



CREATE POLICY "Admin read all service_pages" ON "public"."service_pages" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin read app_secrets" ON "public"."app_secrets" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin read chatbot_knowledge" ON "public"."chatbot_knowledge" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin read conversation_analytics" ON "public"."conversation_analytics" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin read conversations" ON "public"."conversations" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin read followup_tasks" ON "public"."followup_tasks" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin read maintenance_requests" ON "public"."maintenance_requests" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin read media_files" ON "public"."media_files" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin read media_messages" ON "public"."media_messages" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin read templates" ON "public"."templates" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin read webhook_logs" ON "public"."webhook_logs" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin read whatsapp_conversations" ON "public"."whatsapp_conversations" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin read whatsapp_messages" ON "public"."whatsapp_messages" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin read workflow_steps" ON "public"."workflow_steps" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin read workflows" ON "public"."workflows" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin update branches" ON "public"."branches" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin update categories" ON "public"."categories" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin update maintenance_requests" ON "public"."maintenance_requests" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin update projects" ON "public"."projects" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can delete notifications" ON "public"."admin_notifications" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins can update comments" ON "public"."project_comments" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can update notifications" ON "public"."admin_notifications" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can view notifications" ON "public"."admin_notifications" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Allow authenticated insert keepalive" ON "public"."request_server" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Allow public read branches" ON "public"."branches" FOR SELECT USING (true);



CREATE POLICY "Allow public read categories" ON "public"."categories" FOR SELECT USING (true);



CREATE POLICY "Allow public read projects" ON "public"."projects" FOR SELECT USING (true);



CREATE POLICY "Anyone can insert comments" ON "public"."project_comments" FOR INSERT TO "authenticated", "anon" WITH CHECK (("is_approved" IS NOT TRUE));



CREATE POLICY "Anyone can submit reviews" ON "public"."project_reviews" FOR INSERT TO "authenticated", "anon" WITH CHECK ((("is_approved" = false) AND (("rating" >= 1) AND ("rating" <= 5))));



CREATE POLICY "Authenticated insert maintenance_requests" ON "public"."maintenance_requests" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated read categories" ON "public"."categories" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated read projects" ON "public"."projects" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Block authenticated delete from user_roles" ON "public"."user_roles" FOR DELETE TO "authenticated" USING (false);



CREATE POLICY "Block authenticated read login_otp" ON "public"."login_otp" FOR SELECT TO "authenticated", "anon" USING (false);



CREATE POLICY "Block authenticated read otp_codes" ON "public"."otp_codes" FOR SELECT TO "authenticated", "anon" USING (false);



CREATE POLICY "Block authenticated update to user_roles" ON "public"."user_roles" FOR UPDATE TO "authenticated" USING (false);



CREATE POLICY "Block authenticated write login_otp" ON "public"."login_otp" FOR INSERT TO "authenticated", "anon" WITH CHECK (false);



CREATE POLICY "Block authenticated write otp_codes" ON "public"."otp_codes" FOR INSERT TO "authenticated", "anon" WITH CHECK (false);



CREATE POLICY "Block authenticated write to user_roles" ON "public"."user_roles" FOR INSERT TO "authenticated" WITH CHECK (false);



CREATE POLICY "Comments are viewable by everyone" ON "public"."project_comments" FOR SELECT USING (("is_approved" = true));



CREATE POLICY "Enable read access for all users" ON "public"."keepalive" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."request_server" FOR SELECT USING (true);



CREATE POLICY "Only admins can update comments" ON "public"."project_comments" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Project images are viewable by everyone" ON "public"."project_images" FOR SELECT USING (true);



CREATE POLICY "Public read approved reviews" ON "public"."project_reviews" FOR SELECT USING (("is_approved" = true));



CREATE POLICY "Public read finishing_levels" ON "public"."finishing_levels" FOR SELECT USING (true);



CREATE POLICY "Public read published service_pages" ON "public"."service_pages" FOR SELECT USING (("is_published" = true));



CREATE POLICY "Public read quotation_categories" ON "public"."quotation_categories" FOR SELECT USING (true);



CREATE POLICY "Public read quotation_items" ON "public"."quotation_items" FOR SELECT USING (true);



CREATE POLICY "Service role manages app_secrets" ON "public"."app_secrets" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role manages login_otp" ON "public"."login_otp" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role manages notification_settings" ON "public"."notification_settings" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role manages otp_codes" ON "public"."otp_codes" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role manages quotation_line_items" ON "public"."quotation_line_items" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role manages quotation_notifications" ON "public"."quotation_notifications" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role manages quotations" ON "public"."quotations" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role manages roles" ON "public"."user_roles" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role manages whatsapp_flows" ON "public"."whatsapp_flows" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role manages whatsapp_messages" ON "public"."whatsapp_messages" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Users can read own roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."admin_notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admins insert tax_invoices" ON "public"."tax_invoices" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "admins read estimates" ON "public"."cost_estimate_requests" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "admins read tax_invoices" ON "public"."tax_invoices" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "allow_select_keepalive" ON "public"."request_server" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anyone can insert estimates" ON "public"."cost_estimate_requests" FOR INSERT TO "authenticated", "anon" WITH CHECK ((("client_name" IS NOT NULL) AND ("client_phone" IS NOT NULL)));



ALTER TABLE "public"."app_secrets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."branches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chatbot_knowledge" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cost_estimate_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."finishing_levels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."followup_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."integrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."keepalive" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."login_otp" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."maintenance_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."media_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."media_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."otp_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quotation_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quotation_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quotation_line_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quotation_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quotations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."request_server" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service only integrations" ON "public"."integrations" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "service only users" ON "public"."users" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "service only webhook events" ON "public"."webhook_events" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "service only webhook_endpoints" ON "public"."webhook_endpoints" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "service write media" ON "public"."media_files" FOR INSERT WITH CHECK (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."service_pages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tax_invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_read_self" ON "public"."users" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



ALTER TABLE "public"."webhook_endpoints" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."webhook_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."webhook_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."whatsapp_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."whatsapp_flows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."whatsapp_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_steps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflows" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."admin_notifications";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."generate_quotation_number"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."generate_quotation_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_conversation_stats"("start_date" timestamp with time zone, "end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_conversation_stats"("start_date" timestamp with time zone, "end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_conversation_stats"("start_date" timestamp with time zone, "end_date" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."admin_notifications" TO "anon";
GRANT ALL ON TABLE "public"."admin_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."app_secrets" TO "anon";
GRANT ALL ON TABLE "public"."app_secrets" TO "authenticated";
GRANT ALL ON TABLE "public"."app_secrets" TO "service_role";



GRANT ALL ON TABLE "public"."branches" TO "anon";
GRANT ALL ON TABLE "public"."branches" TO "authenticated";
GRANT ALL ON TABLE "public"."branches" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."chatbot_knowledge" TO "anon";
GRANT ALL ON TABLE "public"."chatbot_knowledge" TO "authenticated";
GRANT ALL ON TABLE "public"."chatbot_knowledge" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_analytics" TO "anon";
GRANT ALL ON TABLE "public"."conversation_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_analytics" TO "service_role";



GRANT ALL ON SEQUENCE "public"."conversation_analytics_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."conversation_analytics_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."conversation_analytics_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."conversations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."conversations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."conversations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."cost_estimate_requests" TO "anon";
GRANT ALL ON TABLE "public"."cost_estimate_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."cost_estimate_requests" TO "service_role";



GRANT ALL ON TABLE "public"."finishing_levels" TO "anon";
GRANT ALL ON TABLE "public"."finishing_levels" TO "authenticated";
GRANT ALL ON TABLE "public"."finishing_levels" TO "service_role";



GRANT ALL ON TABLE "public"."followup_tasks" TO "anon";
GRANT ALL ON TABLE "public"."followup_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."followup_tasks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."followup_tasks_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."followup_tasks_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."followup_tasks_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."integrations" TO "anon";
GRANT ALL ON TABLE "public"."integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."integrations" TO "service_role";



GRANT ALL ON TABLE "public"."keepalive" TO "anon";
GRANT ALL ON TABLE "public"."keepalive" TO "authenticated";
GRANT ALL ON TABLE "public"."keepalive" TO "service_role";



GRANT ALL ON TABLE "public"."login_otp" TO "anon";
GRANT ALL ON TABLE "public"."login_otp" TO "authenticated";
GRANT ALL ON TABLE "public"."login_otp" TO "service_role";



GRANT ALL ON TABLE "public"."maintenance_requests" TO "anon";
GRANT ALL ON TABLE "public"."maintenance_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."maintenance_requests" TO "service_role";



GRANT ALL ON TABLE "public"."media_files" TO "anon";
GRANT ALL ON TABLE "public"."media_files" TO "authenticated";
GRANT ALL ON TABLE "public"."media_files" TO "service_role";



GRANT ALL ON TABLE "public"."media_messages" TO "anon";
GRANT ALL ON TABLE "public"."media_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."media_messages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."media_messages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."media_messages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."media_messages_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notification_settings" TO "anon";
GRANT ALL ON TABLE "public"."notification_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_settings" TO "service_role";



GRANT ALL ON TABLE "public"."otp_codes" TO "anon";
GRANT ALL ON TABLE "public"."otp_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."otp_codes" TO "service_role";



GRANT ALL ON TABLE "public"."project_comments" TO "anon";
GRANT ALL ON TABLE "public"."project_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."project_comments" TO "service_role";



GRANT ALL ON TABLE "public"."project_images" TO "anon";
GRANT ALL ON TABLE "public"."project_images" TO "authenticated";
GRANT ALL ON TABLE "public"."project_images" TO "service_role";



GRANT ALL ON TABLE "public"."project_reviews" TO "anon";
GRANT ALL ON TABLE "public"."project_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."project_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."quotation_categories" TO "anon";
GRANT ALL ON TABLE "public"."quotation_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."quotation_categories" TO "service_role";



GRANT ALL ON TABLE "public"."quotation_items" TO "anon";
GRANT ALL ON TABLE "public"."quotation_items" TO "authenticated";
GRANT ALL ON TABLE "public"."quotation_items" TO "service_role";



GRANT ALL ON TABLE "public"."quotation_line_items" TO "anon";
GRANT ALL ON TABLE "public"."quotation_line_items" TO "authenticated";
GRANT ALL ON TABLE "public"."quotation_line_items" TO "service_role";



GRANT ALL ON TABLE "public"."quotation_notifications" TO "anon";
GRANT ALL ON TABLE "public"."quotation_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."quotation_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."quotations" TO "anon";
GRANT ALL ON TABLE "public"."quotations" TO "authenticated";
GRANT ALL ON TABLE "public"."quotations" TO "service_role";



GRANT ALL ON TABLE "public"."request_server" TO "anon";
GRANT ALL ON TABLE "public"."request_server" TO "authenticated";
GRANT ALL ON TABLE "public"."request_server" TO "service_role";



GRANT ALL ON SEQUENCE "public"."request_server_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."request_server_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."request_server_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."service_pages" TO "anon";
GRANT ALL ON TABLE "public"."service_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."service_pages" TO "service_role";



GRANT ALL ON TABLE "public"."tax_invoices" TO "anon";
GRANT ALL ON TABLE "public"."tax_invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."tax_invoices" TO "service_role";



GRANT ALL ON TABLE "public"."templates" TO "anon";
GRANT ALL ON TABLE "public"."templates" TO "authenticated";
GRANT ALL ON TABLE "public"."templates" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_endpoints" TO "anon";
GRANT ALL ON TABLE "public"."webhook_endpoints" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_endpoints" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_events" TO "anon";
GRANT ALL ON TABLE "public"."webhook_events" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_events" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_logs" TO "anon";
GRANT ALL ON TABLE "public"."webhook_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."webhook_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."webhook_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."webhook_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."whatsapp_conversations" TO "anon";
GRANT ALL ON TABLE "public"."whatsapp_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."whatsapp_conversations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."whatsapp_conversations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."whatsapp_conversations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."whatsapp_conversations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."whatsapp_flows" TO "anon";
GRANT ALL ON TABLE "public"."whatsapp_flows" TO "authenticated";
GRANT ALL ON TABLE "public"."whatsapp_flows" TO "service_role";



GRANT ALL ON TABLE "public"."whatsapp_messages" TO "anon";
GRANT ALL ON TABLE "public"."whatsapp_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."whatsapp_messages" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_steps" TO "anon";
GRANT ALL ON TABLE "public"."workflow_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_steps" TO "service_role";



GRANT ALL ON TABLE "public"."workflows" TO "anon";
GRANT ALL ON TABLE "public"."workflows" TO "authenticated";
GRANT ALL ON TABLE "public"."workflows" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































