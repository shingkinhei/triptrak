drop trigger if exists "on_tripday_updated_weather" on "public"."trip_days";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.fun_call_supabase_edge_function(function_name text, payload jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  service_role_key text;
  project_ref text := 'rodtfkraukblqbshlazo'; 
BEGIN

  SELECT decrypted_secret INTO service_role_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' 
  LIMIT 1;

  IF service_role_key IS NULL THEN
    RAISE EXCEPTION 'Service role key not found in Vault';
  END IF;

  -- 2. 發送請求 (對所有參數進行明確轉型 ::text)
   PERFORM net.http_post(
    url := format('https://rodtfkraukblqbshlazo.supabase.co/functions/v1/%s', function_name)::text,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := payload,
    timeout_milliseconds := 5000
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fun_on_tripday_insert_sync()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  PERFORM public.fun_call_supabase_edge_function(
    'sync-weather'::text, 
    jsonb_build_object('record', row_to_json(NEW)::jsonb)
  );
  
  RETURN NEW;
END;
$function$
;

CREATE TRIGGER on_tripday_updated_weather AFTER INSERT ON public.trip_days FOR EACH ROW EXECUTE FUNCTION public.fun_on_tripday_insert_sync();


