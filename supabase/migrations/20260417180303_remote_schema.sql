drop trigger if exists "on_tripday_updated_weather" on "public"."trip_days";

CREATE INDEX idx_trip_days_uuid_date ON public.trip_days USING btree (trip_uuid, date);

CREATE TRIGGER on_tripday_updated_weather AFTER INSERT OR UPDATE ON public.trip_days FOR EACH STATEMENT EXECUTE FUNCTION public.fun_on_tripday_insert_sync();
ALTER TABLE "public"."trip_days" DISABLE TRIGGER "on_tripday_updated_weather";


