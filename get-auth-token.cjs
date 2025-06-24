#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rgwbtdzdeibobuveegfp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjczNDIsImV4cCI6MjA2NTY0MzM0Mn0.f3ZdePT5fk6EuO-eP4fu4EBCN97V3mNxYAKU39sduGw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAuthToken() {
  try {
    console.log('🔐 Fazendo login para obter token...');
    
    // Use one of the test accounts we created earlier
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'teste@exemplo.com',
      password: '123456789'
    });

    if (error) {
      console.error('❌ Erro no login:', error.message);
      
      // Try alternative test account
      console.log('🔄 Tentando conta alternativa...');
      const { data: data2, error: error2 } = await supabase.auth.signInWithPassword({
        email: 'test@outlook.com', 
        password: '123456789'
      });
      
      if (error2) {
        console.error('❌ Erro no login alternativo:', error2.message);
        process.exit(1);
      }
      
      console.log('✅ Login realizado com sucesso!');
      console.log('🎫 Token:', data2.session.access_token);
      return data2.session.access_token;
    }

    console.log('✅ Login realizado com sucesso!');
    console.log('🎫 Token:', data.session.access_token);
    return data.session.access_token;
    
  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
    process.exit(1);
  }
}

getAuthToken().then(token => {
  console.log('\n📋 Para usar no script test-upload-curl.sh:');
  console.log(`TOKEN="${token}"`);
  process.exit(0);
}); 