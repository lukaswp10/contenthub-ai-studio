/**
 * 🎯 API CHROMIUM CAPTURE - ClipsForge Pro
 * 
 * Endpoint para executar captura de dados da Blaze via Chromium
 * 
 * @author ClipsForge Team
 */

const { spawn } = require('child_process');
const path = require('path');

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Método não permitido' 
    });
  }
  
  try {
    const { action } = req.body;
    
    if (action !== 'capture_blaze') {
      return res.status(400).json({ 
        success: false, 
        error: 'Ação inválida' 
      });
    }
    
    console.log('🚀 Executando captura Chromium...');
    
    // Caminho para o script
    const scriptPath = path.join(process.cwd(), 'scripts', 'blaze-chrome-capture.cjs');
    
    // Executar script Chromium
    const result = await new Promise((resolve, reject) => {
      const child = spawn('node', [scriptPath], {
        cwd: process.cwd(),
        timeout: 45000, // 45 segundos timeout
        env: { ...process.env, NODE_ENV: 'production' }
      });
      
      let stdout = '';
      let stderr = '';
      let capturedData = null;
      
      child.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        
        // Procurar por dados capturados nos logs
        if (output.includes('🎯 CAPTURADO:') && output.includes('📅 Timestamp:')) {
          try {
            // Extrair dados do log
            const lines = output.split('\n');
            let numero, cor, id, timestamp;
            
            for (const line of lines) {
              if (line.includes('🎯 CAPTURADO:')) {
                const match = line.match(/🎯 CAPTURADO: (⚪|🔴|⚫) (WHITE|RED|BLACK) \((\d+)\)/);
                if (match) {
                  numero = parseInt(match[3]);
                  cor = match[2] === 'WHITE' ? 0 : match[2] === 'RED' ? 1 : 2;
                }
              }
              if (line.includes('📅 Timestamp:')) {
                timestamp = line.split('📅 Timestamp: ')[1]?.trim();
              }
              if (line.includes('🆔 ID:')) {
                id = line.split('🆔 ID: ')[1]?.split(' ')[0]?.trim();
              }
            }
            
            if (numero !== undefined && cor !== undefined && id && timestamp) {
              capturedData = {
                numero,
                cor,
                corNome: cor === 0 ? 'WHITE' : cor === 1 ? 'RED' : 'BLACK',
                corEmoji: cor === 0 ? '⚪' : cor === 1 ? '🔴' : '⚫',
                id,
                timestamp,
                url: 'chromium_capture'
              };
            }
          } catch (parseError) {
            console.log('⚠️ Erro ao extrair dados do log:', parseError);
          }
        }
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0 && capturedData) {
          resolve(capturedData);
        } else {
          reject(new Error(`Script falhou: code ${code}, stderr: ${stderr}`));
        }
      });
      
      child.on('error', (error) => {
        reject(error);
      });
    });
    
    console.log('✅ Captura Chromium concluída:', result);
    
    return res.status(200).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('❌ Erro na captura Chromium:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
} 