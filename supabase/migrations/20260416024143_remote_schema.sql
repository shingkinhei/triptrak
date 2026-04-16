set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.fun_reset_ai_rate_count()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
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
END;
$function$
;


