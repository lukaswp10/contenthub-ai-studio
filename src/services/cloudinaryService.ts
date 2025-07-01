// Serviço para upload e gerenciamento de vídeos no Cloudinary
export interface CloudinaryUploadResponse {
  public_id: string
  secure_url: string
  url: string
  format: string
  resource_type: string
  bytes: number
  duration?: number
  width?: number
  height?: number
  created_at: string
}

const CLOUDINARY_CONFIG = {
  cloudName: 'dyqjxsnjp',
  apiKey: '586415153212745',
  apiSecret: 'gJh-IPVTqWOv12GKCDDBJ1gy4i8'
}

// Função para gerar assinatura SHA-1 para upload seguro
const generateSignature = async (params: Record<string, any>, apiSecret: string): Promise<string> => {
  // Ordenar parâmetros alfabeticamente e criar string
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')
  
  const stringToSign = sortedParams + apiSecret
  
  // Usar Web Crypto API para gerar SHA-1
  const encoder = new TextEncoder()
  const data = encoder.encode(stringToSign)
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  
  // Converter para hex
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  console.log('🔐 String to sign:', stringToSign)
  console.log('🔐 Generated signature:', hashHex)
  
  return hashHex
}

// Upload de vídeo para Cloudinary
export const uploadVideoToCloudinary = async (file: File): Promise<CloudinaryUploadResponse> => {
  const formData = new FormData()
  const timestamp = Math.round(Date.now() / 1000)
  
  // Parâmetros para assinatura (apenas os que o Cloudinary espera)
  const signatureParams = {
    folder: 'clipsforge/videos',
    timestamp
  }
  
  // Gerar assinatura
  const signature = await generateSignature(signatureParams, CLOUDINARY_CONFIG.apiSecret)
  
  // Adicionar parâmetros ao FormData
  formData.append('file', file)
  formData.append('api_key', CLOUDINARY_CONFIG.apiKey)
  formData.append('timestamp', timestamp.toString())
  formData.append('signature', signature)
  formData.append('folder', 'clipsforge/videos')
  formData.append('resource_type', 'video') // Enviar mas não assinar
  
  try {
    console.log('📤 Iniciando upload para Cloudinary:', file.name)
    console.log('📋 Signature params:', signatureParams)
    console.log('🔐 Signature generated:', signature)
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/video/upload`,
      {
        method: 'POST',
        body: formData
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erro no upload: ${response.status} - ${errorText}`)
    }
    
    const result: CloudinaryUploadResponse = await response.json()
    console.log('✅ Upload concluído:', result.secure_url)
    
    return result
    
  } catch (error) {
    console.error('❌ Erro no upload para Cloudinary:', error)
    throw new Error(`Falha no upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

// Deletar vídeo do Cloudinary
export const deleteVideoFromCloudinary = async (publicId: string): Promise<boolean> => {
  const timestamp = Math.round(Date.now() / 1000)
  
  // Parâmetros para assinatura (apenas os que o Cloudinary espera)
  const signatureParams = {
    public_id: publicId,
    timestamp
  }
  
  const signature = await generateSignature(signatureParams, CLOUDINARY_CONFIG.apiSecret)
  
  const formData = new FormData()
  formData.append('public_id', publicId)
  formData.append('api_key', CLOUDINARY_CONFIG.apiKey)
  formData.append('timestamp', timestamp.toString())
  formData.append('signature', signature)
  formData.append('resource_type', 'video') // Enviar mas não assinar
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/video/destroy`,
      {
        method: 'POST',
        body: formData
      }
    )
    
    if (!response.ok) {
      throw new Error(`Erro ao deletar: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('🗑️ Vídeo deletado do Cloudinary:', publicId)
    
    return result.result === 'ok'
    
  } catch (error) {
    console.error('❌ Erro ao deletar do Cloudinary:', error)
    return false
  }
}

// Gerar thumbnail do vídeo
export const generateVideoThumbnail = (publicId: string): string => {
  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/video/upload/so_2.0,w_300,h_200,c_fill,q_auto,f_jpg/${publicId}.jpg`
}

// Obter URL otimizada do vídeo
export const getOptimizedVideoUrl = (publicId: string, options?: {
  width?: number
  height?: number
  quality?: string
}): string => {
  const { width = 800, height = 450, quality = 'auto' } = options || {}
  
  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/video/upload/w_${width},h_${height},c_fill,q_${quality},f_mp4/${publicId}.mp4`
}

// Verificar se o arquivo é um vídeo válido
export const isValidVideoFile = (file: File): boolean => {
  const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/wmv']
  const maxSize = 100 * 1024 * 1024 // 100MB
  
  return validTypes.includes(file.type) && file.size <= maxSize
}

// Obter informações do vídeo
export const getVideoInfo = async (publicId: string): Promise<any> => {
  try {
    const response = await fetch(
      `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/video/upload/${publicId}.json`
    )
    
    if (!response.ok) {
      throw new Error('Erro ao obter informações do vídeo')
    }
    
    return await response.json()
    
  } catch (error) {
    console.error('❌ Erro ao obter info do vídeo:', error)
    return null
  }
} 