-- Corrigir onboarding_completed para usuário existente
UPDATE public.profiles 
SET onboarding_completed = true, updated_at = NOW()
WHERE email = 'lukaswp10@gmail.com';