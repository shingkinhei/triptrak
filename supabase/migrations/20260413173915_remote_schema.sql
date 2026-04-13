


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


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."fun_generate_trip_days"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
    current_day DATE := NEW.start_date;
    day_count INTEGER := 1;
BEGIN
    WHILE current_day <= NEW.end_date LOOP
        INSERT INTO public.trip_days (trip_uuid, user_id, day_number, date, title)
        VALUES (NEW.trip_uuid, NEW.user_id, day_count, current_day, 'Day ' || day_count);
        
        current_day := current_day + 1;
        day_count := day_count + 1;
    END LOOP;
    RETURN NEW;
END;$$;


ALTER FUNCTION "public"."fun_generate_trip_days"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fun_populate_trip_checklist"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
    -- Insert into pre_trip_checklist by selecting from the template
    INSERT INTO public.pre_trip_checklist (trip_uuid, user_id, label, seq, checked)
    SELECT 
        NEW.trip_uuid,  -- The UUID of the newly created trip
        NEW.user_id,    -- The user who owns the trip
        label, 
        seq, 
        false           -- Default to unchecked
    FROM public.pre_trip_checklist_template;

    RETURN NEW;
END;$$;


ALTER FUNCTION "public"."fun_populate_trip_checklist"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fun_sync_media_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$DECLARE
  -- Parameters passed from the trigger definition
  bucket_name TEXT := TG_ARGV[0];
  column_name TEXT := TG_ARGV[1];
  target_url TEXT;
BEGIN
  -- Dynamically get the URL value from the record being deleted
  EXECUTE format('SELECT ($1).%I', column_name) USING OLD INTO target_url;

  IF target_url IS NOT NULL THEN
    PERFORM
      net.http_post(
        url := 'https://rodtfkraukblqbshlazo.supabase.co/functions/v1/media_deleter',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
        ),
        body := jsonb_build_object(
          'bucket', bucket_name,
          'image_url', target_url
        )
      );
  END IF;
  
  RETURN OLD;
END;$_$;


ALTER FUNCTION "public"."fun_sync_media_delete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


CREATE OR REPLACE FUNCTION "public"."tri_handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  INSERT INTO public.users_info (user_id, email, display_name, home_currency)
  VALUES (
    NEW.id,                -- auth.users 的 UUID
    coalesce(new.email, 'guest'),             -- 使用者 email
    NEW.raw_user_meta_data->>'display_name', -- 從 metadata 取 display_name
    'HKD'                  -- 預設 home_currency
  );
  
  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."tri_handle_new_user"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activities" (
    "activity_uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "activity_id" bigint NOT NULL,
    "day_uuid" "uuid",
    "time" time without time zone,
    "description" "text",
    "activity_type" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "user_id" "uuid" DEFAULT "auth"."uid"(),
    "address" "text",
    "location" "extensions"."geography",
    "ai_plan" boolean DEFAULT false,
    "name" "text"
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


ALTER TABLE "public"."activities" ALTER COLUMN "activity_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."activities_activity_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."activities_option_setup" (
    "activity_type" "text" NOT NULL,
    "icon_text" "text" NOT NULL,
    "color_code" "text",
    "description" "text",
    "ai_preference" boolean DEFAULT false
);


ALTER TABLE "public"."activities_option_setup" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."activities_with_icons" WITH ("security_invoker"='on') AS
 SELECT "a"."activity_uuid",
    "a"."activity_id",
    "a"."day_uuid",
    "a"."time",
    "a"."description",
    "a"."activity_type",
    "o"."icon_text",
    "o"."color_code",
    "o"."description" AS "option_description",
    "a"."created_at",
    "a"."user_id"
   FROM ("public"."activities" "a"
     JOIN "public"."activities_option_setup" "o" ON (("a"."activity_type" = "o"."activity_type")));


ALTER VIEW "public"."activities_with_icons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."countries_setup" (
    "country_code" character(2) NOT NULL,
    "name" "text" NOT NULL,
    "default_image_url" "text",
    "default_image_hint" "text"
);


ALTER TABLE "public"."countries_setup" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."currencies_setup" (
    "currency_code" "text" NOT NULL,
    "rate" numeric,
    "name" "text",
    "symbol" "text",
    "country_code" "text"
);


ALTER TABLE "public"."currencies_setup" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expense_categories_setup" (
    "name" "text" NOT NULL,
    "description" "text",
    "icon_text" "text",
    "color_code" "text",
    "expense_category_seq" bigint NOT NULL
);


ALTER TABLE "public"."expense_categories_setup" OWNER TO "postgres";


ALTER TABLE "public"."expense_categories_setup" ALTER COLUMN "expense_category_seq" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."expense_categories_setup_expense_category_seq_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "expense_uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "expense_id" bigint NOT NULL,
    "trip_uuid" "uuid",
    "user_id" "uuid" DEFAULT "auth"."uid"(),
    "name" "text",
    "expense_category" "text",
    "amount" numeric,
    "currency_code" character(3),
    "date" "date",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "item_uuid" "uuid"
);


ALTER TABLE "public"."expenses" OWNER TO "postgres";


ALTER TABLE "public"."expenses" ALTER COLUMN "expense_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."expenses_expense_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."pre_trip_checklist" (
    "checklist_uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_uuid" "uuid",
    "label" "text",
    "checked" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid" DEFAULT "auth"."uid"(),
    "seq" bigint,
    "checklist_id" bigint NOT NULL
);


ALTER TABLE "public"."pre_trip_checklist" OWNER TO "postgres";


ALTER TABLE "public"."pre_trip_checklist" ALTER COLUMN "checklist_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."pre_trip_checklist_checklist_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."pre_trip_checklist_template" (
    "label" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid" DEFAULT "auth"."uid"(),
    "seq" bigint,
    "code" character varying NOT NULL
);


ALTER TABLE "public"."pre_trip_checklist_template" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopping_categories_setup" (
    "name" "text" NOT NULL,
    "icon_text" "text" NOT NULL,
    "color_code" "text",
    "description" "text",
    "shopping_categories_seq" bigint NOT NULL
);


ALTER TABLE "public"."shopping_categories_setup" OWNER TO "postgres";


ALTER TABLE "public"."shopping_categories_setup" ALTER COLUMN "shopping_categories_seq" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."shopping_categories_setup_shopping_categories_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."shopping_items" (
    "item_uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "item_id" bigint NOT NULL,
    "shopping_category" "text",
    "name" "text",
    "checked" boolean DEFAULT false,
    "image_url" "text",
    "price" numeric,
    "user_id" "uuid",
    "store" "text",
    "address" "text",
    "trip_uuid" "uuid",
    "pcs" bigint DEFAULT '1'::bigint NOT NULL,
    CONSTRAINT "shopping_items_pcs_check" CHECK (("pcs" > 0))
);


ALTER TABLE "public"."shopping_items" OWNER TO "postgres";


ALTER TABLE "public"."shopping_items" ALTER COLUMN "item_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."shopping_items_item_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."temp_countries" (
    "name" "text",
    "alpha2" character(2),
    "alpha3" character(3),
    "country_code" integer,
    "iso_3166_2" "text",
    "region" "text",
    "sub_region" "text",
    "intermediate_region" "text",
    "region_code" integer,
    "sub_region_code" integer,
    "intermediate_region_code" integer
);


ALTER TABLE "public"."temp_countries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."temp_currencies" (
    "entity" "text",
    "currency" "text" NOT NULL,
    "alphabetic_code" character(3),
    "numeric_code" integer,
    "minor_unit" integer
);


ALTER TABLE "public"."temp_currencies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_days" (
    "day_uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "day_id" bigint NOT NULL,
    "trip_uuid" "uuid",
    "day_number" integer,
    "title" "text",
    "date" "date",
    "feedback" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "user_id" "uuid",
    "weather_icon" "text",
    "temperature" double precision
);


ALTER TABLE "public"."trip_days" OWNER TO "postgres";


ALTER TABLE "public"."trip_days" ALTER COLUMN "day_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."trip_days_day_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."trip_members" (
    "trip_member_uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_uuid" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'editor'::"text",
    "joined_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."trip_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_photos" (
    "photo_uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "photo_id" bigint NOT NULL,
    "day_uuid" "uuid",
    "url" "text" NOT NULL,
    "uploaded_at" timestamp without time zone DEFAULT "now"(),
    "seq" numeric,
    "user_id" "uuid"
);


ALTER TABLE "public"."trip_photos" OWNER TO "postgres";


ALTER TABLE "public"."trip_photos" ALTER COLUMN "photo_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."trip_photos_photo_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."trip_status_setup" (
    "status" "text" NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."trip_status_setup" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trips" (
    "trip_uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_id" bigint NOT NULL,
    "user_id" "uuid",
    "name" "text",
    "destination" "text",
    "country_code" character(2),
    "start_date" "date",
    "end_date" "date",
    "status" "text" DEFAULT 'U'::"text",
    "cover_image_url" "text",
    "cover_image_hint" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "currency_code" "text",
    "latitude" double precision,
    "longitude" double precision
);


ALTER TABLE "public"."trips" OWNER TO "postgres";


ALTER TABLE "public"."trips" ALTER COLUMN "trip_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."trips_trip_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."users_info" (
    "user_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "display_name" "text",
    "home_currency" character(3),
    "created_at" timestamp without time zone DEFAULT "now"(),
    "display_id" bigint NOT NULL,
    "ai_rate_count" smallint DEFAULT '0'::smallint,
    "ai_rate_limit" smallint DEFAULT '10'::smallint,
    "home_language" "text" DEFAULT 'en'::"text"
);


ALTER TABLE "public"."users_info" OWNER TO "postgres";


ALTER TABLE "public"."users_info" ALTER COLUMN "display_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."users_info_display_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE OR REPLACE VIEW "public"."v_point_of_interest" WITH ("security_invoker"='on') AS
 SELECT "a"."activity_uuid",
    "a"."name",
    "a"."address",
    "a"."time",
    "a"."day_uuid",
    "td"."date",
    "td"."trip_uuid"
   FROM ("public"."activities" "a"
     JOIN "public"."trip_days" "td" ON (("a"."day_uuid" = "td"."day_uuid")));


ALTER VIEW "public"."v_point_of_interest" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."weather_code_setup" (
    "wmo_code" integer NOT NULL,
    "description" "text" NOT NULL,
    "icon_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."weather_code_setup" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activities_option_setup"
    ADD CONSTRAINT "activities_option_setup_pkey" PRIMARY KEY ("activity_type");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("activity_uuid");



ALTER TABLE ONLY "public"."countries_setup"
    ADD CONSTRAINT "countries_setup_pkey" PRIMARY KEY ("country_code");



ALTER TABLE ONLY "public"."currencies_setup"
    ADD CONSTRAINT "currencies_setup_pkey" PRIMARY KEY ("currency_code");



ALTER TABLE ONLY "public"."expense_categories_setup"
    ADD CONSTRAINT "expense_categories_setup_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."expense_categories_setup"
    ADD CONSTRAINT "expense_categories_setup_pkey" PRIMARY KEY ("name");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_expense_id_key" UNIQUE ("expense_id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("expense_uuid");



ALTER TABLE ONLY "public"."pre_trip_checklist"
    ADD CONSTRAINT "pre_trip_checklist_checklist_id_key" UNIQUE ("checklist_id");



ALTER TABLE ONLY "public"."pre_trip_checklist"
    ADD CONSTRAINT "pre_trip_checklist_pkey" PRIMARY KEY ("checklist_uuid");



ALTER TABLE ONLY "public"."pre_trip_checklist_template"
    ADD CONSTRAINT "pre_trip_checklist_template_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."shopping_categories_setup"
    ADD CONSTRAINT "shopping_categories_setup_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."shopping_categories_setup"
    ADD CONSTRAINT "shopping_categories_setup_pkey" PRIMARY KEY ("name");



ALTER TABLE ONLY "public"."shopping_categories_setup"
    ADD CONSTRAINT "shopping_categories_setup_shopping_categories_key" UNIQUE ("shopping_categories_seq");



ALTER TABLE ONLY "public"."shopping_items"
    ADD CONSTRAINT "shopping_items_item_id_key" UNIQUE ("item_id");



ALTER TABLE ONLY "public"."shopping_items"
    ADD CONSTRAINT "shopping_items_pkey" PRIMARY KEY ("item_uuid");



ALTER TABLE ONLY "public"."trip_days"
    ADD CONSTRAINT "trip_days_day_id_key" UNIQUE ("day_id");



ALTER TABLE ONLY "public"."trip_days"
    ADD CONSTRAINT "trip_days_pkey" PRIMARY KEY ("day_uuid");



ALTER TABLE ONLY "public"."trip_members"
    ADD CONSTRAINT "trip_members_pkey" PRIMARY KEY ("trip_member_uuid");



ALTER TABLE ONLY "public"."trip_members"
    ADD CONSTRAINT "trip_members_unique_user_trip" UNIQUE ("trip_uuid", "user_id");



ALTER TABLE ONLY "public"."trip_photos"
    ADD CONSTRAINT "trip_photos_photo_id_key" UNIQUE ("photo_id");



ALTER TABLE ONLY "public"."trip_photos"
    ADD CONSTRAINT "trip_photos_pkey" PRIMARY KEY ("photo_uuid");



ALTER TABLE ONLY "public"."trip_status_setup"
    ADD CONSTRAINT "trip_status_setup_pkey" PRIMARY KEY ("status");



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "trips_pkey" PRIMARY KEY ("trip_uuid");



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "trips_trip_id_key" UNIQUE ("trip_id");



ALTER TABLE ONLY "public"."users_info"
    ADD CONSTRAINT "users_info_display_id_unique" UNIQUE ("display_id");



ALTER TABLE ONLY "public"."users_info"
    ADD CONSTRAINT "users_info_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."weather_code_setup"
    ADD CONSTRAINT "weather_code_setup_pkey" PRIMARY KEY ("wmo_code");



CREATE OR REPLACE TRIGGER "on_trip_created_geocode" AFTER INSERT ON "public"."trips" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://rodtfkraukblqbshlazo.supabase.co/functions/v1/geocode-destination-trip', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZHRma3JhdWtibHFic2hsYXpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjEyMTg2OSwiZXhwIjoyMDgxNjk3ODY5fQ.OJB5vKpabp8rRlbjij4wIlNqvWrsgMFiOCB2OToYkmk"}', '{}', '5000');



CREATE OR REPLACE TRIGGER "on_tripday_updated_weather" AFTER INSERT ON "public"."trip_days" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://rodtfkraukblqbshlazo.supabase.co/functions/v1/bright-processor', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZHRma3JhdWtibHFic2hsYXpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjEyMTg2OSwiZXhwIjoyMDgxNjk3ODY5fQ.OJB5vKpabp8rRlbjij4wIlNqvWrsgMFiOCB2OToYkmk"}', '{}', '5000');



CREATE OR REPLACE TRIGGER "tri_after_trip_insert_checklist" AFTER INSERT ON "public"."trips" FOR EACH ROW EXECUTE FUNCTION "public"."fun_populate_trip_checklist"();



CREATE OR REPLACE TRIGGER "tri_sync_del_shopping_item_photo" AFTER DELETE ON "public"."shopping_items" FOR EACH ROW EXECUTE FUNCTION "public"."fun_sync_media_delete"('shopping_item_photo', 'image_url');



CREATE OR REPLACE TRIGGER "tri_sync_del_trip_cover" AFTER DELETE ON "public"."trips" FOR EACH ROW EXECUTE FUNCTION "public"."fun_sync_media_delete"('trip_cover', 'cover_image_url');



CREATE OR REPLACE TRIGGER "trigger_generate_trip_days" AFTER INSERT ON "public"."trips" FOR EACH ROW EXECUTE FUNCTION "public"."fun_generate_trip_days"();



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_day_uuid_fkey" FOREIGN KEY ("day_uuid") REFERENCES "public"."trip_days"("day_uuid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_expense_category_fkey" FOREIGN KEY ("expense_category") REFERENCES "public"."expense_categories_setup"("name");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_item_uuid_fkey" FOREIGN KEY ("item_uuid") REFERENCES "public"."shopping_items"("item_uuid");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_trip_uuid_fkey" FOREIGN KEY ("trip_uuid") REFERENCES "public"."trips"("trip_uuid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pre_trip_checklist"
    ADD CONSTRAINT "pre_trip_checklist_trip_uuid_fkey" FOREIGN KEY ("trip_uuid") REFERENCES "public"."trips"("trip_uuid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pre_trip_checklist"
    ADD CONSTRAINT "pre_trip_checklist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shopping_items"
    ADD CONSTRAINT "shopping_items_shopping_category_fkey" FOREIGN KEY ("shopping_category") REFERENCES "public"."shopping_categories_setup"("name");



ALTER TABLE ONLY "public"."shopping_items"
    ADD CONSTRAINT "shopping_items_trip_uuid_fkey" FOREIGN KEY ("trip_uuid") REFERENCES "public"."trips"("trip_uuid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shopping_items"
    ADD CONSTRAINT "shopping_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_days"
    ADD CONSTRAINT "trip_days_trip_uuid_fkey" FOREIGN KEY ("trip_uuid") REFERENCES "public"."trips"("trip_uuid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_days"
    ADD CONSTRAINT "trip_days_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_members"
    ADD CONSTRAINT "trip_members_trip_uuid_fkey" FOREIGN KEY ("trip_uuid") REFERENCES "public"."trips"("trip_uuid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_members"
    ADD CONSTRAINT "trip_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_info"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_photos"
    ADD CONSTRAINT "trip_photos_day_uuid_fkey" FOREIGN KEY ("day_uuid") REFERENCES "public"."trip_days"("day_uuid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_photos"
    ADD CONSTRAINT "trip_photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "trips_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "public"."countries_setup"("country_code");



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "trips_status_fkey" FOREIGN KEY ("status") REFERENCES "public"."trip_status_setup"("status");



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "trips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users_info"
    ADD CONSTRAINT "users_info_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow All Read" ON "public"."activities_option_setup" FOR SELECT USING (true);



CREATE POLICY "Allow all read" ON "public"."countries_setup" FOR SELECT USING (true);



CREATE POLICY "Allow all read" ON "public"."expense_categories_setup" FOR SELECT USING (true);



CREATE POLICY "Allow all read" ON "public"."shopping_categories_setup" FOR SELECT USING (true);



CREATE POLICY "Allow all read" ON "public"."trip_status_setup" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."weather_code_setup" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."currencies_setup" FOR SELECT USING (true);



CREATE POLICY "Enable update access for all users" ON "public"."currencies_setup" FOR UPDATE TO "anon" USING (true);



CREATE POLICY "Enable users to view their own data only" ON "public"."pre_trip_checklist_template" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own trips" ON "public"."trips" FOR DELETE TO "authenticated", "authenticator" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can edit their own trips" ON "public"."activities" TO "authenticated", "authenticator" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can edit their own trips" ON "public"."expenses" TO "authenticated", "authenticator" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can edit their own trips" ON "public"."pre_trip_checklist" TO "authenticated", "authenticator" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can edit their own trips" ON "public"."shopping_items" TO "authenticated", "authenticator" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can edit their own trips" ON "public"."trip_days" TO "authenticated", "authenticator" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can edit their own trips" ON "public"."trip_photos" TO "authenticated", "authenticator" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can edit their own trips" ON "public"."users_info" TO "authenticated", "authenticator" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own trips" ON "public"."trips" FOR INSERT TO "authenticated", "authenticator" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own trips" ON "public"."trips" FOR UPDATE TO "authenticated", "authenticator" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own trips" ON "public"."trips" FOR SELECT TO "authenticated", "authenticator" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activities_option_setup" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."countries_setup" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."currencies_setup" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expense_categories_setup" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pre_trip_checklist" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pre_trip_checklist_template" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shopping_categories_setup" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shopping_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."temp_countries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."temp_currencies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trip_days" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trip_photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trip_status_setup" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trips" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users_info" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."weather_code_setup" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";










































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































GRANT ALL ON FUNCTION "public"."fun_generate_trip_days"() TO "anon";
GRANT ALL ON FUNCTION "public"."fun_generate_trip_days"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fun_generate_trip_days"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fun_populate_trip_checklist"() TO "anon";
GRANT ALL ON FUNCTION "public"."fun_populate_trip_checklist"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fun_populate_trip_checklist"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fun_sync_media_delete"() TO "anon";
GRANT ALL ON FUNCTION "public"."fun_sync_media_delete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fun_sync_media_delete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tri_handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."tri_handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tri_handle_new_user"() TO "service_role";























































































GRANT ALL ON TABLE "public"."activities" TO "anon";
GRANT ALL ON TABLE "public"."activities" TO "authenticated";
GRANT ALL ON TABLE "public"."activities" TO "service_role";



GRANT ALL ON SEQUENCE "public"."activities_activity_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."activities_activity_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."activities_activity_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."activities_option_setup" TO "anon";
GRANT ALL ON TABLE "public"."activities_option_setup" TO "authenticated";
GRANT ALL ON TABLE "public"."activities_option_setup" TO "service_role";



GRANT ALL ON TABLE "public"."activities_with_icons" TO "anon";
GRANT ALL ON TABLE "public"."activities_with_icons" TO "authenticated";
GRANT ALL ON TABLE "public"."activities_with_icons" TO "service_role";



GRANT ALL ON TABLE "public"."countries_setup" TO "anon";
GRANT ALL ON TABLE "public"."countries_setup" TO "authenticated";
GRANT ALL ON TABLE "public"."countries_setup" TO "service_role";



GRANT ALL ON TABLE "public"."currencies_setup" TO "anon";
GRANT ALL ON TABLE "public"."currencies_setup" TO "authenticated";
GRANT ALL ON TABLE "public"."currencies_setup" TO "service_role";



GRANT ALL ON TABLE "public"."expense_categories_setup" TO "anon";
GRANT ALL ON TABLE "public"."expense_categories_setup" TO "authenticated";
GRANT ALL ON TABLE "public"."expense_categories_setup" TO "service_role";



GRANT ALL ON SEQUENCE "public"."expense_categories_setup_expense_category_seq_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."expense_categories_setup_expense_category_seq_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."expense_categories_setup_expense_category_seq_seq" TO "service_role";



GRANT ALL ON TABLE "public"."expenses" TO "anon";
GRANT ALL ON TABLE "public"."expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."expenses" TO "service_role";



GRANT ALL ON SEQUENCE "public"."expenses_expense_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."expenses_expense_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."expenses_expense_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pre_trip_checklist" TO "anon";
GRANT ALL ON TABLE "public"."pre_trip_checklist" TO "authenticated";
GRANT ALL ON TABLE "public"."pre_trip_checklist" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pre_trip_checklist_checklist_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pre_trip_checklist_checklist_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pre_trip_checklist_checklist_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pre_trip_checklist_template" TO "anon";
GRANT ALL ON TABLE "public"."pre_trip_checklist_template" TO "authenticated";
GRANT ALL ON TABLE "public"."pre_trip_checklist_template" TO "service_role";



GRANT ALL ON TABLE "public"."shopping_categories_setup" TO "anon";
GRANT ALL ON TABLE "public"."shopping_categories_setup" TO "authenticated";
GRANT ALL ON TABLE "public"."shopping_categories_setup" TO "service_role";



GRANT ALL ON SEQUENCE "public"."shopping_categories_setup_shopping_categories_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."shopping_categories_setup_shopping_categories_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."shopping_categories_setup_shopping_categories_seq" TO "service_role";



GRANT ALL ON TABLE "public"."shopping_items" TO "anon";
GRANT ALL ON TABLE "public"."shopping_items" TO "authenticated";
GRANT ALL ON TABLE "public"."shopping_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."shopping_items_item_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."shopping_items_item_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."shopping_items_item_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."temp_countries" TO "anon";
GRANT ALL ON TABLE "public"."temp_countries" TO "authenticated";
GRANT ALL ON TABLE "public"."temp_countries" TO "service_role";



GRANT ALL ON TABLE "public"."temp_currencies" TO "anon";
GRANT ALL ON TABLE "public"."temp_currencies" TO "authenticated";
GRANT ALL ON TABLE "public"."temp_currencies" TO "service_role";



GRANT ALL ON TABLE "public"."trip_days" TO "anon";
GRANT ALL ON TABLE "public"."trip_days" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_days" TO "service_role";



GRANT ALL ON SEQUENCE "public"."trip_days_day_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."trip_days_day_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."trip_days_day_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."trip_members" TO "anon";
GRANT ALL ON TABLE "public"."trip_members" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_members" TO "service_role";



GRANT ALL ON TABLE "public"."trip_photos" TO "anon";
GRANT ALL ON TABLE "public"."trip_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_photos" TO "service_role";



GRANT ALL ON SEQUENCE "public"."trip_photos_photo_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."trip_photos_photo_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."trip_photos_photo_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."trip_status_setup" TO "anon";
GRANT ALL ON TABLE "public"."trip_status_setup" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_status_setup" TO "service_role";



GRANT ALL ON TABLE "public"."trips" TO "anon";
GRANT ALL ON TABLE "public"."trips" TO "authenticated";
GRANT ALL ON TABLE "public"."trips" TO "service_role";



GRANT ALL ON SEQUENCE "public"."trips_trip_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."trips_trip_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."trips_trip_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."users_info" TO "anon";
GRANT ALL ON TABLE "public"."users_info" TO "authenticated";
GRANT ALL ON TABLE "public"."users_info" TO "service_role";



GRANT ALL ON SEQUENCE "public"."users_info_display_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."users_info_display_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."users_info_display_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."v_point_of_interest" TO "anon";
GRANT ALL ON TABLE "public"."v_point_of_interest" TO "authenticated";
GRANT ALL ON TABLE "public"."v_point_of_interest" TO "service_role";



GRANT ALL ON TABLE "public"."weather_code_setup" TO "anon";
GRANT ALL ON TABLE "public"."weather_code_setup" TO "authenticated";
GRANT ALL ON TABLE "public"."weather_code_setup" TO "service_role";









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



































drop extension if exists "pg_net";

create extension if not exists "pg_net" with schema "public";

drop policy "Users can edit their own trips" on "public"."activities";

drop policy "Users can edit their own trips" on "public"."trip_photos";

drop policy "Users can edit their own trips" on "public"."users_info";


  create policy "Users can edit their own trips"
  on "public"."activities"
  as permissive
  for all
  to authenticator, authenticated
using ((auth.uid() = user_id));



  create policy "Users can edit their own trips"
  on "public"."trip_photos"
  as permissive
  for all
  to authenticator, authenticated
using ((auth.uid() = user_id));



  create policy "Users can edit their own trips"
  on "public"."users_info"
  as permissive
  for all
  to authenticator, authenticated
using ((auth.uid() = user_id));


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.tri_handle_new_user();


  create policy "Authenticated User can Edit h0r4u5_0"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'shopping_item_photo'::text));



  create policy "Authenticated User can Edit h0r4u5_1"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'shopping_item_photo'::text));



  create policy "Authenticated User can Edit h0r4u5_2"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'shopping_item_photo'::text));



  create policy "Authenticated User can Edit h0r4u5_3"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'shopping_item_photo'::text));



  create policy "Authenticated User can edit  8rncpp_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'trip_cover'::text));



  create policy "Authenticated User can edit  8rncpp_1"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'trip_cover'::text));



  create policy "Authenticated User can edit  8rncpp_2"
  on "storage"."objects"
  as permissive
  for select
  to anon, authenticated
using ((bucket_id = 'trip_cover'::text));



  create policy "Authenticated User can edit  8rncpp_3"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'trip_cover'::text));



  create policy "Authenticated users can edit day feedback images 1p8xfig_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'day_feedback'::text));



  create policy "Authenticated users can edit day feedback images 1p8xfig_1"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'day_feedback'::text));



  create policy "Authenticated users can edit day feedback images 1p8xfig_2"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'day_feedback'::text));



  create policy "Authenticated users can edit day feedback images 1p8xfig_3"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'day_feedback'::text));



  create policy "Enable read access for all users"
  on "storage"."objects"
  as permissive
  for select
  to public
using (true);



