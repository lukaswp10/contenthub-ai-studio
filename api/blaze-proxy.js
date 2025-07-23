// api/blaze-proxy.js
export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Permitir apenas GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🎯 [PROXY] Fazendo requisição server-side para Blaze...');
    
    const response = await fetch('https://blaze.com/api/roulette_games/recent?limit=1', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://blaze.com/',
        'Origin': 'https://blaze.com',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin'
      }
    });

    console.log(`🎯 [PROXY] Response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('API retornou dados inválidos');
    }

    const game = data[0];
    
    // Validar estrutura dos dados
    if (!game || typeof game.roll !== 'number' || !game.color || !game.id) {
      throw new Error('Estrutura de dados inválida');
    }

    // Mapear cor da Blaze para nosso formato
    let color;
    if (game.color === 0) color = 'white';  // Branco
    else if (game.roll >= 1 && game.roll <= 7) color = 'red';    // Vermelho
    else if (game.roll >= 8 && game.roll <= 14) color = 'black';  // Preto
    else color = 'white';  // Fallback

    const result = {
      id: game.id,
      number: game.roll,
      color: color,
      round_id: game.id,
      timestamp_blaze: game.created_at,
      source: 'blaze_proxy_api'
    };

    console.log(`✅ [PROXY] Dados processados:`, result);

    return res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ [PROXY] Erro:`, error.message);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 