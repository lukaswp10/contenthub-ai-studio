-- Verificar se o trigger existe e depois criar o perfil para o usuário existente
-- Primeiro, criar o perfil manualmente para o usuário que já existe
INSERT INTO public.profiles (id, email, full_name, plan_type, onboarding_completed, created_at, updated_at)
VALUES (
  'e84ef867-0059-4f61-bf78-3951167fab16',
  'lukaswp10@gmail.com',
  'Lucas Martins',
  'free',
  false,
  '2025-06-17 03:02:37.777168+00',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Verificar se a função handle_new_user existe e recriar se necessário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, plan_type, onboarding_completed)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'free',
    false
  );
  RETURN new;
END;
$$;

-- Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();