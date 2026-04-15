drop trigger if exists "on_tripday_updated_weather" on "public"."trip_days";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.call_supabase_edge_function(function_name text, payload jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  service_role_key text;
  project_ref text := 'rodtfkraukblqbshlazo'; 
BEGIN
  -- 1. 從 Vault 取得密鑰
  SELECT decrypted_secret INTO service_role_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' 
  LIMIT 1;

  IF service_role_key IS NULL THEN
    RAISE EXCEPTION 'Service role key not found in Vault';
  END IF;

  -- 2. 發送請求 (對所有參數進行明確轉型 ::text)
  PERFORM supabase_functions.http_request(
    format('https://%s.supabase.co/functions/v1/%s', project_ref, function_name)::text,
    'POST'::text, -- 修正 unknown
    jsonb_build_object(
      'Content-type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    )::text,
    payload::text,
    '5000'::text -- 修正 unknown
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fn_trigger_sync_weather()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  PERFORM public.call_supabase_edge_function(
    'sync-weather'::text, 
    jsonb_build_object('record', row_to_json(NEW))::jsonb
  );

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fun_reset_ai_rate_count()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$DECLARE
    updated_rows_count int;
BEGIN
    
    UPDATE public.users_info
    SET ai_rate_count = 0
    WHERE ai_rate_count != 0;
    
    
    GET DIAGNOSTICS updated_rows_count = ROW_COUNT;

    RETURN json_build_object(
        'success', true,
        'message', 'Reset complete',
        'rows_affected', updated_rows_count
    );
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;$function$
;

CREATE OR REPLACE FUNCTION public.fun_trigger_geocode_trip()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- 明確轉型為 text 和 jsonb
  PERFORM public.call_supabase_edge_function(
    'geocode-destination-trip'::text, 
    jsonb_build_object('record', row_to_json(NEW))::text
  );

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fun_trigger_sync_weather()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  PERFORM public.call_supabase_edge_function(
    'sync_weather'::text, 
    jsonb_build_object('record', row_to_json(NEW)::text)
  );

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.on_trip_created_geocode()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- 直接呼叫通用函數
  PERFORM public.call_supabase_edge_function(
    'geocode-destination-trip', 
    jsonb_build_object('record', row_to_json(NEW))
  );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_weather_immediate()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$DECLARE
  service_role_key text;
BEGIN

  SELECT decrypted_secret INTO service_role_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' 
  LIMIT 1;


  PERFORM supabase_functions.http_request(
    'https://rodtfkraukblqbshlazo.supabase.co/functions/v1/sync-weather'::text,
    'POST'::text,
    jsonb_build_object(
      'Content-type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    )::text,
    jsonb_build_object('record', row_to_json(NEW))::text, -- 傳送新日子資料
    '5000'::text
  );

  RETURN NEW;
END;$function$
;


