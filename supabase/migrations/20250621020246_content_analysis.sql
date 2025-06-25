-- Criar tabela content_analysis para armazenar análises de IA
CREATE TABLE content_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Análise de conteúdo
  clips_suggestions JSONB NOT NULL DEFAULT '[]',
  analysis_completed BOOLEAN DEFAULT false,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Índices para performance
CREATE INDEX idx_content_analysis_video_id ON content_analysis(video_id);
CREATE INDEX idx_content_analysis_user_id ON content_analysis(user_id);

-- RLS
ALTER TABLE content_analysis ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view own content analysis" ON content_analysis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content analysis" ON content_analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content analysis" ON content_analysis
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_content_analysis_updated_at 
  BEFORE UPDATE ON content_analysis 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();