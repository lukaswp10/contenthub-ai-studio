-- Adicionar campos do Shotstack na tabela clips

-- Adicionar colunas para integração com Shotstack
ALTER TABLE clips ADD COLUMN IF NOT EXISTS shotstack_render_id TEXT;
ALTER TABLE clips ADD COLUMN IF NOT EXISTS shotstack_status TEXT;
ALTER TABLE clips ADD COLUMN IF NOT EXISTS shotstack_completed_at TIMESTAMPTZ;
ALTER TABLE clips ADD COLUMN IF NOT EXISTS shotstack_error TEXT;

-- Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_clips_shotstack_render_id ON clips(shotstack_render_id) WHERE shotstack_render_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clips_status_processing ON clips(status) WHERE status = 'processing';

-- Comentários para documentação
COMMENT ON COLUMN clips.shotstack_render_id IS 'ID do render no Shotstack para monitoramento';
COMMENT ON COLUMN clips.shotstack_status IS 'Status atual do render no Shotstack (queued, rendering, done, failed)';
COMMENT ON COLUMN clips.shotstack_completed_at IS 'Timestamp de quando o render foi concluído no Shotstack';
COMMENT ON COLUMN clips.shotstack_error IS 'Mensagem de erro caso o render falhe no Shotstack';

-- Adicionar campo clips_generated na tabela videos
ALTER TABLE videos ADD COLUMN IF NOT EXISTS clips_generated INTEGER DEFAULT 0;

-- Funções auxiliares para testar check-shotstack-status

-- Função para buscar clips em processamento
CREATE OR REPLACE FUNCTION get_processing_clips()
RETURNS TABLE (
  id UUID,
  title TEXT,
  status TEXT,
  shotstack_render_id TEXT,
  created_at TIMESTAMPTZ,
  video_id UUID
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    c.id,
    c.title,
    c.status,
    c.shotstack_render_id,
    c.created_at,
    c.video_id
  FROM clips c
  WHERE c.status = 'processing'
    AND c.shotstack_render_id IS NOT NULL
  ORDER BY c.created_at DESC
  LIMIT 20;
$$;

-- Função para buscar clips prontos  
CREATE OR REPLACE FUNCTION get_ready_clips()
RETURNS TABLE (
  id UUID,
  title TEXT,
  status TEXT,
  cloudinary_secure_url TEXT,
  shotstack_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    c.id,
    c.title,
    c.status,
    c.cloudinary_secure_url,
    c.shotstack_completed_at,
    c.created_at
  FROM clips c
  WHERE c.status = 'ready'
    AND c.cloudinary_secure_url IS NOT NULL
  ORDER BY c.updated_at DESC
  LIMIT 20;
$$; 