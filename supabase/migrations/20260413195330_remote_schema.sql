set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.tri_handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$BEGIN
  INSERT INTO public.users_info (user_id, email, display_name, home_currency)
  VALUES (
    NEW.id,                -- auth.users 的 UUID
    coalesce(new.email, 'guest'),             -- 使用者 email
    NEW.raw_user_meta_data->>'display_name', -- 從 metadata 取 display_name
    'HKD'                  -- 預設 home_currency
  );
  
  RETURN NEW;
END;$function$
;


