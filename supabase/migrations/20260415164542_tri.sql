drop function if exists "public"."call_supabase_edge_function"(function_name text, payload jsonb);

drop function if exists "public"."fn_trigger_sync_weather"();

drop function if exists "public"."fun_reset_ai_rate_count"();

drop function if exists "public"."fun_trigger_geocode_trip"();

drop function if exists "public"."fun_trigger_sync_weather"();

drop function if exists "public"."on_trip_created_geocode"();

drop function if exists "public"."sync_weather_immediate"();

CREATE TRIGGER on_tripday_updated_weather AFTER INSERT ON public.trip_days FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://rodtfkraukblqbshlazo.supabase.co/functions/v1/bright-processor', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZHRma3JhdWtibHFic2hsYXpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjEyMTg2OSwiZXhwIjoyMDgxNjk3ODY5fQ.OJB5vKpabp8rRlbjij4wIlNqvWrsgMFiOCB2OToYkmk"}', '{}', '5000');


