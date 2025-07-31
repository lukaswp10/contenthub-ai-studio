-- ✅ FOUNDATION MODEL 2025 - QUERIES PARA SUPABASE
-- Execute estas queries no SQL Editor do Supabase (na ordem)

-- 1️⃣ VERIFICAR TABELAS
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('blaze_real_data', 'unified_predictions', 'unified_feedback', 'foundation_predictions');

-- 2️⃣ CRIAR FOUNDATION_PREDICTIONS
CREATE TABLE IF NOT EXISTS foundation_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id TEXT NOT NULL UNIQUE,
  predicted_color TEXT NOT NULL CHECK (predicted_color IN ('red', 'black', 'white')),
  predicted_number INTEGER NOT NULL CHECK (predicted_number >= 0 AND predicted_number <= 14),
  confidence_percentage DECIMAL(5,2) NOT NULL,
  red_probability DECIMAL(6,4) NOT NULL,
  black_probability DECIMAL(6,4) NOT NULL,
  white_probability DECIMAL(6,4) NOT NULL,
  red_confidence DECIMAL(6,4) NOT NULL,
  black_confidence DECIMAL(6,4) NOT NULL,
  white_confidence DECIMAL(6,4) NOT NULL,
  uncertainty_score DECIMAL(6,4) NOT NULL DEFAULT 0,
  concept_drift_score DECIMAL(6,4) NOT NULL DEFAULT 0,
  model_confidence DECIMAL(6,4) NOT NULL,
  algorithm_used TEXT NOT NULL DEFAULT 'Foundation Model 2025',
  execution_time_ms INTEGER NOT NULL DEFAULT 0,
  data_points_used INTEGER NOT NULL DEFAULT 0,
  transformer_weight DECIMAL(4,3) NOT NULL DEFAULT 0.70,
  pattern_weight DECIMAL(4,3) NOT NULL DEFAULT 0.20,
  statistical_weight DECIMAL(4,3) NOT NULL DEFAULT 0.10,
  actual_color TEXT CHECK (actual_color IN ('red', 'black', 'white')),
  actual_number INTEGER CHECK (actual_number >= 0 AND actual_number <= 14),
  was_correct BOOLEAN,
  timestamp_prediction TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3️⃣ CRIAR UNIFIED_FEEDBACK
CREATE TABLE IF NOT EXISTS unified_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id TEXT NOT NULL,
  predicted_color TEXT NOT NULL CHECK (predicted_color IN ('red', 'black', 'white')),
  predicted_number INTEGER NOT NULL CHECK (predicted_number >= 0 AND predicted_number <= 14),
  confidence_percentage DECIMAL(5,2) NOT NULL,
  actual_color TEXT CHECK (actual_color IN ('red', 'black', 'white')),
  actual_number INTEGER CHECK (actual_number >= 0 AND actual_number <= 14),
  was_correct BOOLEAN,
  algorithm_used TEXT NOT NULL,
  data_points_used INTEGER NOT NULL DEFAULT 0,
  data_freshness INTEGER NOT NULL DEFAULT 0,
  execution_time_ms INTEGER NOT NULL DEFAULT 0,
  total_predictions INTEGER NOT NULL DEFAULT 1,
  correct_predictions INTEGER NOT NULL DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  timestamp_prediction TIMESTAMPTZ NOT NULL,
  timestamp_result TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4️⃣ CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_foundation_predictions_id ON foundation_predictions(prediction_id);
CREATE INDEX IF NOT EXISTS idx_unified_feedback_prediction_id ON unified_feedback(prediction_id);

-- ✅ PRONTO! Agora teste em http://localhost:8080/teste-jogo
