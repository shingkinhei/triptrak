drop trigger if exists "on_tripday_updated_weather" on "public"."trip_days";

CREATE TRIGGER on_tripday_updated_weather AFTER INSERT OR UPDATE ON public.trip_days FOR EACH STATEMENT EXECUTE FUNCTION public.fun_on_tripday_insert_sync();


