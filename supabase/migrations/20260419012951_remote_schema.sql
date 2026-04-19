drop trigger if exists "on_tripday_updated_weather" on "public"."trip_days";

drop policy "Enable users to view their own data only" on "public"."pre_trip_checklist_template";

drop policy "Users can edit their own trips" on "public"."trip_days";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.fun_on_tripday_insert_sync()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF (TG_OP = 'INSERT') OR 
     (TG_OP = 'UPDATE' AND (OLD.date IS DISTINCT FROM NEW.date)) 
  THEN
    PERFORM public.fun_call_supabase_edge_function(
      'sync-weather'::text, 
      jsonb_build_object('record', row_to_json(NEW)::jsonb)
    );
  END IF;

  RETURN NEW;
END;
$function$
;


  create policy "Enable read access for all users"
  on "public"."pre_trip_checklist_template"
  as permissive
  for select
  to public
using (true);



  create policy "Enable select for users based on user_id"
  on "public"."trip_days"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "trip_days_owner_all_access"
  on "public"."trip_days"
  as permissive
  for all
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


CREATE TRIGGER on_tripday_updated_weather AFTER INSERT OR UPDATE ON public.trip_days FOR EACH STATEMENT EXECUTE FUNCTION public.fun_on_tripday_insert_sync();


