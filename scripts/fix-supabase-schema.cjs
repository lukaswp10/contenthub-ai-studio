#!/usr/bin/env node

/**
 * Script para corrigir o schema do Supabase - Adicionar coluna duration
 * 
 * Este script adiciona a coluna 'duration' na tabela 'videos' que está faltando
 * e causando o erro PGRST204 nos testes e uploads.
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!')
  console.error('Certifique-se de que VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_ROLE_KEY estão definidas.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixSupabaseSchema() {
  console.log('🔧 Iniciando correção do schema do Supabase...')
  console.log(`📡 URL: ${supabaseUrl}`)
  
  try {
    // Verificar se a tabela videos existe
    console.log('1️⃣ Verificando tabela videos...')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'videos')
    
    if (tablesError) {
      console.error('❌ Erro ao verificar tabelas:', tablesError)
      return false
    }
    
    if (!tables || tables.length === 0) {
      console.error('❌ Tabela videos não encontrada!')
      return false
    }
    
    console.log('✅ Tabela videos encontrada')
    
    // Verificar colunas existentes
    console.log('2️⃣ Verificando colunas da tabela videos...')
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'videos')
    
    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError)
      return false
    }
    
    console.log('📋 Colunas existentes:')
    columns?.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`)
    })
    
    // Verificar se coluna duration existe
    const hasDuration = columns?.some(col => col.column_name === 'duration')
    
    if (hasDuration) {
      console.log('✅ Coluna duration já existe!')
      return true
    }
    
    console.log('⚠️ Coluna duration não encontrada. Adicionando...')
    
    // Adicionar coluna duration usando SQL direto
    console.log('3️⃣ Adicionando coluna duration...')
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE videos ADD COLUMN IF NOT EXISTS duration FLOAT;'
    })
    
    if (alterError) {
      console.error('❌ Erro ao adicionar coluna duration:', alterError)
      
      // Tentar método alternativo
      console.log('🔄 Tentando método alternativo...')
      try {
        // Usar o client admin para executar SQL
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .limit(1)
        
        if (error && error.code === 'PGRST116') {
          console.log('✅ Confirmado: coluna duration não existe')
          console.log('⚠️ Será necessário adicionar a coluna manualmente no dashboard do Supabase')
          console.log('📝 SQL para executar:')
          console.log('   ALTER TABLE videos ADD COLUMN duration FLOAT;')
          return false
        }
      } catch (e) {
        console.error('❌ Erro no método alternativo:', e)
      }
      
      return false
    }
    
    console.log('✅ Coluna duration adicionada com sucesso!')
    
    // Verificar novamente
    console.log('4️⃣ Verificando resultado...')
    const { data: newColumns } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'videos')
    
    const nowHasDuration = newColumns?.some(col => col.column_name === 'duration')
    
    if (nowHasDuration) {
      console.log('🎉 Sucesso! Coluna duration foi adicionada à tabela videos')
      console.log('✅ Schema do Supabase corrigido!')
      return true
    } else {
      console.log('❌ Falha ao verificar a adição da coluna')
      return false
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return false
  }
}

// Executar correção
fixSupabaseSchema()
  .then(success => {
    if (success) {
      console.log('🎯 Correção concluída com sucesso!')
      console.log('🧪 Agora os testes devem funcionar corretamente')
      process.exit(0)
    } else {
      console.log('❌ Correção falhou')
      console.log('🔧 Ação necessária: Adicionar coluna manualmente no Supabase Dashboard')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('💥 Erro fatal:', error)
    process.exit(1)
  }) 