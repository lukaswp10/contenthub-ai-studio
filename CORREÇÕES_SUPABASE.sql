-- ===== CORREÇÕES FOUNDATION MODEL 2025 =====
-- Execute estas queries no SQL Editor do Supabase

-- 1️⃣ CRIAR TABELA UNIFIED_PREDICTIONS (FALTANTE)
CREATE TABLE IF NOT EXISTS unified_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id TEXT NOT NULL UNIQUE,
  predicted_color TEXT NOT NULL CHECK (predicted_color IN ('red', 'black', 'white')),
  predicted_number INTEGER NOT NULL CHECK (predicted_number >= 0 AND predicted_number <= 14),
  confidence_percentage DECIMAL(5,2) NOT NULL,
  algorithm_used TEXT NOT NULL,
  data_points_used INTEGER NOT NULL DEFAULT 0,
  execution_time_ms INTEGER NOT NULL DEFAULT 0,
  timestamp_prediction TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2️⃣ CORRIGIR FOUNDATION_PREDICTIONS (UPSERT)
-- Remover constraint UNIQUE se existir problemas
ALTER TABLE foundation_predictions DROP CONSTRAINT IF EXISTS foundation_predictions_prediction_id_key;
-- Recriar como index único para melhor performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_foundation_predictions_unique_id ON foundation_predictions(prediction_id);

-- 3️⃣ VERIFICAR ESTRUTURA UNIFIED_FEEDBACK
-- Adicionar campos que podem estar faltando
ALTER TABLE unified_feedback ADD COLUMN IF NOT EXISTS data_freshness INTEGER DEFAULT 0;
ALTER TABLE unified_feedback ADD COLUMN IF NOT EXISTS timestamp_result TIMESTAMPTZ;

-- 4️⃣ CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_unified_predictions_id ON unified_predictions(prediction_id);
CREATE INDEX IF NOT EXISTS idx_unified_predictions_timestamp ON unified_predictions(timestamp_prediction DESC);

-- 5️⃣ VERIFICAR SE TUDO FOI CRIADO
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('foundation_predictions', 'unified_feedback', 'unified_predictions')
ORDER BY table_name;

-- ===== TESTE INSERÇÃO =====
-- Testar se foundation_predictions aceita UPSERT
INSERT INTO foundation_predictions (
  prediction_id, predicted_color, predicted_number, confidence_percentage,
  red_probability, black_probability, white_probability,
  red_confidence, black_confidence, white_confidence,
  model_confidence, timestamp_prediction
) VALUES (
  'test_upsert_' || EXTRACT(epoch FROM NOW()),
  'red', 5, 75.50,
  0.6500, 0.2800, 0.0700,
  0.7550, 0.2800, 0.0700,
  0.7550, NOW()
) ON CONFLICT (prediction_id) DO NOTHING;

-- ===== FIM DAS QUERIES =====
