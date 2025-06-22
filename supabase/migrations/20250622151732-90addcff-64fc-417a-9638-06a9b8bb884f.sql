
-- Corrigir warnings de security: adicionar SET search_path = '' às funções existentes
-- para torná-las mais seguras e evitar ataques de injeção via search_path

-- 1. Corrigir função update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$function$;

-- 2. Corrigir função reset_daily_limits
CREATE OR REPLACE FUNCTION public.reset_daily_limits()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  UPDATE public.social_accounts 
  SET posts_today = 0, posts_this_hour = 0
  WHERE posts_today > 0 OR posts_this_hour > 0;
END;
$function$;

-- 3. Corrigir função check_posting_limits
CREATE OR REPLACE FUNCTION public.check_posting_limits(account_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  account public.social_accounts%ROWTYPE;
  can_post boolean := true;
BEGIN
  SELECT * INTO account FROM public.social_accounts WHERE id = account_id;
  
  -- Check daily limit
  IF account.daily_post_limit IS NOT NULL AND account.posts_today >= account.daily_post_limit THEN
    can_post := false;
  END IF;
  
  -- Check hourly limit
  IF account.hourly_post_limit IS NOT NULL AND account.posts_this_hour >= account.hourly_post_limit THEN
    can_post := false;
  END IF;
  
  -- Check minimum interval
  IF account.last_post_at IS NOT NULL THEN
    DECLARE
      min_interval integer;
    BEGIN
      min_interval := (account.posting_schedule->>'min_interval_minutes')::integer;
      IF account.last_post_at + (min_interval || ' minutes')::interval > NOW() THEN
        can_post := false;
      END IF;
    END;
  END IF;
  
  RETURN can_post;
END;
$function$;

-- 4. Corrigir função calculate_clip_performance
CREATE OR REPLACE FUNCTION public.calculate_clip_performance(clip_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  UPDATE public.clips c
  SET 
    total_posts = (SELECT COUNT(*) FROM public.social_posts WHERE clip_id = c.id AND status = 'posted'),
    total_views = (SELECT COALESCE(SUM(analytics_views), 0) FROM public.social_posts WHERE clip_id = c.id),
    total_likes = (SELECT COALESCE(SUM(analytics_likes), 0) FROM public.social_posts WHERE clip_id = c.id),
    total_shares = (SELECT COALESCE(SUM(analytics_shares), 0) FROM public.social_posts WHERE clip_id = c.id)
  WHERE c.id = clip_id;
END;
$function$;
