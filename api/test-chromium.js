/**
 * 🔍 DIAGNÓSTICO CHROMIUM VERCEL - ClipsForge Pro
 * 
 * Função específica para diagnosticar problemas do Chromium em produção
 * Logs apenas em produção, não polui ambiente local
 * 
 * @author ClipsForge Team
 * @version 1.0.0 - Diagnóstico
 */

export default async function handler(req, res) {
  const isProduction = process.env.VERCEL_ENV === 'production';
  
  // ✅ LOGS CONDICIONAIS (só produção)
  const log = (message) => {
    if (isProduction) {
      console.log(message);
    }
  };
  
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  log('🔥 DIAGNÓSTICO: Função iniciou');
  
  const diagnostico = {
    ambiente: isProduction ? 'PRODUÇÃO' : 'LOCAL',
    timestamp: new Date().toISOString(),
    etapas: [],
    sucesso: false,
    erro: null
  };

  try {
    // ===== ETAPA 1: TESTAR IMPORTS =====
    log('📦 ETAPA 1: Testando imports das dependências...');
    diagnostico.etapas.push('ETAPA 1: Imports iniciado');
    
    let chromium, puppeteer;
    
    try {
      chromium = require('@sparticuz/chromium');
      log('✅ @sparticuz/chromium: CARREGADO');
      diagnostico.etapas.push('@sparticuz/chromium: OK');
    } catch (error) {
      log(`❌ @sparticuz/chromium: ERRO - ${error.message}`);
      diagnostico.etapas.push(`@sparticuz/chromium: ERRO - ${error.message}`);
      throw new Error(`Erro carregando @sparticuz/chromium: ${error.message}`);
    }
    
    try {
      puppeteer = require('puppeteer-core');
      log('✅ puppeteer-core: CARREGADO');
      diagnostico.etapas.push('puppeteer-core: OK');
    } catch (error) {
      log(`❌ puppeteer-core: ERRO - ${error.message}`);
      diagnostico.etapas.push(`puppeteer-core: ERRO - ${error.message}`);
      throw new Error(`Erro carregando puppeteer-core: ${error.message}`);
    }

    // ===== ETAPA 2: VERIFICAR EXECUTABLE =====
    log('🔧 ETAPA 2: Verificando Chromium executable...');
    diagnostico.etapas.push('ETAPA 2: Executable iniciado');
    
    let executablePath;
    try {
      executablePath = await chromium.executablePath();
      log(`✅ Executable path: ${executablePath ? 'ENCONTRADO' : 'VAZIO'}`);
      log(`📍 Path: ${executablePath}`);
      diagnostico.etapas.push(`Executable: ${executablePath ? 'OK' : 'VAZIO'}`);
      
      if (!executablePath) {
        throw new Error('Executable path retornou vazio');
      }
    } catch (error) {
      log(`❌ Executable ERRO: ${error.message}`);
      diagnostico.etapas.push(`Executable: ERRO - ${error.message}`);
      throw new Error(`Erro obtendo executable: ${error.message}`);
    }

    // ===== ETAPA 3: TESTAR ARGS CHROMIUM =====
    log('⚙️ ETAPA 3: Verificando args do Chromium...');
    diagnostico.etapas.push('ETAPA 3: Args iniciado');
    
    try {
      const args = chromium.args;
      log(`✅ Args disponíveis: ${args ? args.length : 0} argumentos`);
      log(`📋 Args: ${args ? args.slice(0, 3).join(', ') + '...' : 'NENHUM'}`);
      diagnostico.etapas.push(`Args: ${args ? args.length + ' args' : 'NENHUM'}`);
    } catch (error) {
      log(`❌ Args ERRO: ${error.message}`);
      diagnostico.etapas.push(`Args: ERRO - ${error.message}`);
    }

    // ===== ETAPA 4: TESTAR LAUNCH BÁSICO =====
    log('🚀 ETAPA 4: Testando launch básico do browser...');
    diagnostico.etapas.push('ETAPA 4: Launch iniciado');
    
    let browser = null;
    try {
      const startTime = Date.now();
      
      browser = await puppeteer.launch({
        args: [
          ...chromium.args,
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ],
        executablePath,
        headless: chromium.headless || true,
        timeout: 15000, // 15s timeout para teste
      });
      
      const launchTime = Date.now() - startTime;
      log(`✅ Browser LANÇADO com sucesso em ${launchTime}ms`);
      diagnostico.etapas.push(`Launch: OK (${launchTime}ms)`);
      
      // ===== ETAPA 5: TESTAR PÁGINA =====
      log('📄 ETAPA 5: Testando criação de página...');
      diagnostico.etapas.push('ETAPA 5: Página iniciado');
      
      const page = await browser.newPage();
      log('✅ Página criada com sucesso');
      diagnostico.etapas.push('Página: OK');
      
      await page.close();
      log('✅ Página fechada com sucesso');
      
    } catch (error) {
      log(`❌ Launch ERRO: ${error.message}`);
      diagnostico.etapas.push(`Launch: ERRO - ${error.message}`);
      throw new Error(`Erro no launch: ${error.message}`);
    } finally {
      if (browser) {
        try {
          await browser.close();
          log('🔒 Browser fechado com sucesso');
        } catch (closeError) {
          log(`⚠️ Erro fechando browser: ${closeError.message}`);
        }
      }
    }

    // ===== SUCESSO TOTAL =====
    log('🎉 DIAGNÓSTICO: TODOS OS TESTES PASSARAM!');
    diagnostico.sucesso = true;
    diagnostico.etapas.push('DIAGNÓSTICO: SUCESSO TOTAL');
    
    return res.status(200).json({
      success: true,
      message: 'Chromium funcionando perfeitamente',
      diagnostico
    });

  } catch (error) {
    // ✅ LOG DE ERRO SEMPRE (para debug)
    console.error('❌ DIAGNÓSTICO FALHOU:', error.message);
    log(`❌ STACK: ${error.stack}`);
    
    diagnostico.erro = error.message;
    diagnostico.etapas.push(`ERRO FINAL: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      diagnostico,
      stack: error.stack
    });
  }
} 