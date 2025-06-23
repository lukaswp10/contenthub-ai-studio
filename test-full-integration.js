import fetch from 'node-fetch';

// Configurações
const SUPABASE_URL = 'https://rgwbtdzdeibobuveegfp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE4MDcsImV4cCI6MjA2ODI4NzgwN30.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'; // Substitua pela sua chave real

// Simular dados do usuário autenticado
const USER_ID = '4dd38ef4-f5fc-449e-bd4f-529716036acf';
const AUTH_TOKEN = 'SEU_TOKEN_AQUI'; // Substitua pelo token real

console.log('🧪 === TESTE DE INTEGRAÇÃO COMPLETA ===');
console.log('');

async function testFullIntegration() {
    try {
        console.log('📋 Passo 1: Simulando autorização de upload...');
        
        // Simular a chamada para a função Edge (como o frontend faz)
        const uploadRequest = {
            fileName: 'test-integration.mp4',
            fileSize: 55195, // Tamanho do test-video.mp4
            contentType: 'video/mp4',
            duration: 5,
            processingConfig: {
                clipDuration: 30,
                clipCount: 5,
                language: 'pt-BR',
                generateSubtitles: true,
                optimizeForMobile: true
            }
        };

        console.log('📤 Enviando requisição para função Edge:');
        console.log(JSON.stringify(uploadRequest, null, 2));
        console.log('');

        // Chamada para a função Edge (simulando o frontend)
        const authResponse = await fetch(`${SUPABASE_URL}/functions/v1/upload-video`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify(uploadRequest)
        });

        if (!authResponse.ok) {
            const errorText = await authResponse.text();
            console.log('❌ Erro na autorização:');
            console.log(`Status: ${authResponse.status}`);
            console.log(`Resposta: ${errorText}`);
            return;
        }

        const authData = await authResponse.json();
        console.log('✅ Autorização bem-sucedida:');
        console.log(JSON.stringify(authData, null, 2));
        console.log('');

        if (!authData.success) {
            console.log('❌ Autorização falhou:', authData.error);
            return;
        }

        console.log('📋 Passo 2: Simulando upload para Cloudinary...');
        
        // Extrair parâmetros da resposta
        const { upload_url, upload_params } = authData;
        
        console.log('🔗 URL de upload:', upload_url);
        console.log('📦 Parâmetros de upload:');
        console.log(JSON.stringify(upload_params, null, 2));
        console.log('');

        // Simular o upload para o Cloudinary (como o frontend faz)
        const formData = new FormData();
        
        // Adicionar arquivo
        const fs = await import('fs');
        const videoBuffer = fs.readFileSync('test-video.mp4');
        const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' });
        formData.append('file', videoBlob, 'test-video.mp4');
        
        // Adicionar parâmetros
        Object.entries(upload_params).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                formData.append(key, value);
            }
        });

        console.log('📤 Enviando para Cloudinary...');
        
        const cloudinaryResponse = await fetch(upload_url, {
            method: 'POST',
            body: formData
        });

        console.log('📊 Status da resposta:', cloudinaryResponse.status);
        
        if (cloudinaryResponse.ok) {
            const result = await cloudinaryResponse.json();
            console.log('✅ Upload bem-sucedido!');
            console.log('📄 Resposta do Cloudinary:');
            console.log(JSON.stringify(result, null, 2));
            
            console.log('');
            console.log('🎯 TESTE COMPLETO: SUCESSO!');
            console.log('✅ Função Edge: OK');
            console.log('✅ Assinatura: OK');
            console.log('✅ Upload Cloudinary: OK');
            console.log('✅ Integração: OK');
        } else {
            const errorText = await cloudinaryResponse.text();
            console.log('❌ Erro no upload:');
            console.log(`Status: ${cloudinaryResponse.status}`);
            console.log(`Resposta: ${errorText}`);
            
            console.log('');
            console.log('🔍 Análise do erro:');
            if (cloudinaryResponse.status === 401) {
                console.log('- Erro 401: Problema de autenticação/assinatura');
                console.log('- Verifique se a assinatura está correta');
                console.log('- Verifique se o preset está configurado como Signed');
            } else if (cloudinaryResponse.status === 400) {
                console.log('- Erro 400: Parâmetros inválidos');
                console.log('- Verifique se todos os parâmetros estão corretos');
            }
        }

    } catch (error) {
        console.log('❌ Erro no teste:', error.message);
        console.log('Stack:', error.stack);
    }
}

// Função para testar apenas a geração de assinatura
async function testSignatureGeneration() {
    console.log('🔐 === TESTE DE GERAÇÃO DE ASSINATURA ===');
    console.log('');
    
    // Simular os parâmetros que seriam enviados
    const uploadParams = {
        public_id: `videos/${USER_ID}/test_integration_${Math.round(Date.now() / 1000)}`,
        folder: `videos/${USER_ID}`,
        resource_type: 'video',
        type: 'upload',
        timestamp: String(Math.round(Date.now() / 1000)),
        video_codec: 'auto',
        audio_codec: 'auto',
        context: `user_id=${USER_ID}|original_filename=test-integration.mp4|upload_source=contenthub-ai`,
        upload_preset: 'ml_default'
    };

    console.log('📦 Parâmetros de teste:');
    console.log(JSON.stringify(uploadParams, null, 2));
    console.log('');

    // Gerar assinatura usando a mesma lógica do backend
    const paramsToSign = Object.keys(uploadParams)
        .sort()
        .filter(key => uploadParams[key] !== undefined && uploadParams[key] !== '')
        .map(key => `${key}=${uploadParams[key]}`)
        .join('&');

    console.log('🔤 String para assinar:');
    console.log(paramsToSign);
    console.log('');

    const crypto = await import('crypto');
    const apiSecret = 'gJh-IPVTqWOv12GKCDDBJ1gy4i8';
    const signature = crypto.createHash('sha1').update(paramsToSign + apiSecret).digest('hex');

    console.log('🔐 Assinatura gerada:', signature);
    console.log('');

    // Testar upload com essa assinatura
    const testUploadParams = {
        ...uploadParams,
        signature,
        api_key: '586415153212745'
    };

    console.log('📤 Testando upload com assinatura gerada...');
    
    const formData = new FormData();
    const fs = await import('fs');
    const videoBuffer = fs.readFileSync('test-video.mp4');
    const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' });
    formData.append('file', videoBlob, 'test-video.mp4');
    
    Object.entries(testUploadParams).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
            formData.append(key, value);
        }
    });

    const response = await fetch('https://api.cloudinary.com/v1_1/dyqjxsnjp/video/upload', {
        method: 'POST',
        body: formData
    });

    console.log('📊 Status:', response.status);
    
    if (response.ok) {
        const result = await response.json();
        console.log('✅ Teste de assinatura: SUCESSO!');
        console.log('📄 Resposta:', JSON.stringify(result, null, 2));
    } else {
        const errorText = await response.text();
        console.log('❌ Teste de assinatura: FALHOU');
        console.log('📄 Erro:', errorText);
    }
}

// Executar testes
async function runTests() {
    console.log('🚀 Iniciando testes de integração...');
    console.log('');
    
    // Teste 1: Geração de assinatura
    await testSignatureGeneration();
    console.log('');
    console.log('=' * 50);
    console.log('');
    
    // Teste 2: Integração completa (requer token válido)
    if (AUTH_TOKEN !== 'SEU_TOKEN_AQUI') {
        await testFullIntegration();
    } else {
        console.log('⚠️  Para testar integração completa, configure AUTH_TOKEN no código');
        console.log('💡 Execute apenas o teste de assinatura acima');
    }
}

runTests().catch(console.error); 