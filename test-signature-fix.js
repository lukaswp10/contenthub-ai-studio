import crypto from 'crypto';

console.log('🔧 === TESTE DA CORREÇÃO DA ASSINATURA ===');
console.log('');

// Parâmetros como no teste que falhou
const uploadParams = {
    public_id: 'videos/4dd38ef4-f5fc-449e-bd4f-529716036acf/test_integration_1750712444',
    folder: 'videos/4dd38ef4-f5fc-449e-bd4f-529716036acf',
    resource_type: 'video',
    type: 'upload',
    timestamp: '1750712444',
    video_codec: 'auto',
    audio_codec: 'auto',
    context: 'user_id=4dd38ef4-f5fc-449e-bd4f-529716036acf|original_filename=test-integration.mp4|upload_source=contenthub-ai',
    upload_preset: 'ml_default'
};

console.log('📦 Parâmetros completos:');
console.log(JSON.stringify(uploadParams, null, 2));
console.log('');

// ❌ MÉTODO ANTIGO (que estava falhando)
console.log('❌ MÉTODO ANTIGO:');
const oldSignatureParams = Object.keys(uploadParams)
    .sort()
    .filter(key => uploadParams[key] !== undefined && uploadParams[key] !== '')
    .map(key => `${key}=${uploadParams[key]}`)
    .join('&');

console.log('String para assinar (antiga):');
console.log(oldSignatureParams);
console.log('');

const oldSignature = crypto.createHash('sha1').update(oldSignatureParams + 'gJh-IPVTqWOv12GKCDDBJ1gy4i8').digest('hex');
console.log('Assinatura (antiga):', oldSignature);
console.log('');

// ✅ MÉTODO NOVO (correção)
console.log('✅ MÉTODO NOVO (CORREÇÃO):');
const signatureParams = {
    context: uploadParams.context,
    folder: uploadParams.folder,
    public_id: uploadParams.public_id,
    timestamp: uploadParams.timestamp,
    type: uploadParams.type,
    upload_preset: uploadParams.upload_preset
};

const newParamsToSign = Object.keys(signatureParams)
    .sort()
    .filter(key => signatureParams[key] !== undefined && signatureParams[key] !== '')
    .map(key => `${key}=${signatureParams[key]}`)
    .join('&');

console.log('String para assinar (nova):');
console.log(newParamsToSign);
console.log('');

const newSignature = crypto.createHash('sha1').update(newParamsToSign + 'gJh-IPVTqWOv12GKCDDBJ1gy4i8').digest('hex');
console.log('Assinatura (nova):', newSignature);
console.log('');

// Comparar com o que o Cloudinary espera
console.log('🔍 COMPARAÇÃO:');
console.log('String que o Cloudinary espera:');
console.log('context=user_id=4dd38ef4-f5fc-449e-bd4f-529716036acf|original_filename=test-integration.mp4|upload_source=contenthub-ai&folder=videos/4dd38ef4-f5fc-449e-bd4f-529716036acf&public_id=videos/4dd38ef4-f5fc-449e-bd4f-529716036acf/test_integration_1750712444&timestamp=1750712444&type=upload&upload_preset=ml_default');
console.log('');
console.log('Nossa string (nova):');
console.log(newParamsToSign);
console.log('');
console.log('Strings são iguais?', newParamsToSign === 'context=user_id=4dd38ef4-f5fc-449e-bd4f-529716036acf|original_filename=test-integration.mp4|upload_source=contenthub-ai&folder=videos/4dd38ef4-f5fc-449e-bd4f-529716036acf&public_id=videos/4dd38ef4-f5fc-449e-bd4f-529716036acf/test_integration_1750712444&timestamp=1750712444&type=upload&upload_preset=ml_default');

console.log('');
console.log('🎯 RESULTADO:');
if (newParamsToSign === 'context=user_id=4dd38ef4-f5fc-449e-bd4f-529716036acf|original_filename=test-integration.mp4|upload_source=contenthub-ai&folder=videos/4dd38ef4-f5fc-449e-bd4f-529716036acf&public_id=videos/4dd38ef4-f5fc-449e-bd4f-529716036acf/test_integration_1750712444&timestamp=1750712444&type=upload&upload_preset=ml_default') {
    console.log('✅ CORREÇÃO FUNCIONOU! A string está igual ao que o Cloudinary espera.');
} else {
    console.log('❌ Ainda há diferenças na string.');
} 