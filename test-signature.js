import crypto from 'crypto';

// Parâmetros exatos do teste cURL
const uploadParams = {
  context: 'user_id=4dd38ef4-f5fc-449e-bd4f-529716036acf|original_filename=videoplayback.mp4|upload_source=contenthub-ai',
  folder: 'videos/4dd38ef4-f5fc-449e-bd4f-529716036acf',
  public_id: 'videos/4dd38ef4-f5fc-449e-bd4f-529716036acf/1750710736_videoplayback_mp4',
  timestamp: '1750710736',
  type: 'upload',
  upload_preset: 'ml_default'
};

// API Secret (você precisa colocar o seu aqui)
const API_SECRET = 'gJh-IPVTqWOv12GKCDDBJ1gy4i8'; // Substitua pelo seu secret real

console.log('=== Teste de Geração de Assinatura Cloudinary ===\n');

// 1. Ordenar parâmetros alfabeticamente
const sortedParams = Object.keys(uploadParams)
  .sort()
  .map(key => `${key}=${uploadParams[key]}`)
  .join('&');

console.log('1. Parâmetros ordenados alfabeticamente:');
console.log(sortedParams);
console.log('');

// 2. String que o Cloudinary espera (do erro)
const cloudinaryExpectedString = 'context=user_id=4dd38ef4-f5fc-449e-bd4f-529716036acf|original_filename=videoplayback.mp4|upload_source=contenthub-ai&folder=videos/4dd38ef4-f5fc-449e-bd4f-529716036acf&public_id=videos/4dd38ef4-f5fc-449e-bd4f-529716036acf/1750710736_videoplayback_mp4&timestamp=1750710736&type=upload&upload_preset=ml_default';

console.log('2. String que o Cloudinary espera:');
console.log(cloudinaryExpectedString);
console.log('');

// 3. Comparar as strings
console.log('3. As strings são iguais?', sortedParams === cloudinaryExpectedString);
console.log('');

if (sortedParams !== cloudinaryExpectedString) {
  console.log('4. Diferenças encontradas:');
  console.log('Nossa string:', sortedParams);
  console.log('Cloudinary espera:', cloudinaryExpectedString);
  console.log('');
}

// 5. Gerar assinatura (se tiver o secret)
if (API_SECRET !== 'SEU_API_SECRET_AQUI') {
  const stringToSign = sortedParams + API_SECRET;
  const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');
  
  console.log('5. Assinatura gerada:');
  console.log('String para assinar:', stringToSign);
  console.log('Assinatura:', signature);
  console.log('');
  
  // 6. Comparar com a assinatura esperada
  const expectedSignature = '6d921afe6a734cc44bd1e38e005f3d51d61b907c';
  console.log('6. Assinatura esperada:', expectedSignature);
  console.log('Assinaturas são iguais?', signature === expectedSignature);
} else {
  console.log('5. Para gerar a assinatura, substitua SEU_API_SECRET_AQUI pelo seu secret real');
}

console.log('\n=== Fim do teste ==='); 