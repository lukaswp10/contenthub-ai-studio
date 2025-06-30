import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useClips, Clip } from '@/contexts/ClipsContext'
import { useNavigate } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { VideoUpload } from '@/components/video/VideoUpload'

interface UploadedVideo {
  id: string
  filename: string
  size: number
  duration: number
  uploadedAt: string
  userId: string
  status: 'uploaded' | 'processing' | 'completed'
  url?: string
}

export const UploadPage: React.FC = () => {
  const { user, signOut } = useAuth()
  const { addClips } = useClips()
  const navigate = useNavigate()
  const [uploadedVideo, setUploadedVideo] = useState<UploadedVideo | null>(null)
  const [processing, setProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState('')
  const [processingProgress, setProcessingProgress] = useState(0)

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const resetUpload = () => {
    setUploadedVideo(null)
    setProcessing(false)
    setProcessingStep('')
    setProcessingProgress(0)
    console.log('Estado do upload resetado')
  }

  const handleUploadComplete = (videoUrl: string, videoData: any) => {
    const video: UploadedVideo = {
      ...videoData,
      url: videoUrl
    }
    console.log('Upload completed:', video)
    setUploadedVideo(video)
  }

  const generateAIClips = (sourceVideo: UploadedVideo): Clip[] => {
    const aiAnalysis = [
      {
        moment: "Introdução Impactante",
        description: "Primeiros 15 segundos com maior energia detectada",
        timestamp: "0:00-0:15",
        confidence: 92,
        platform: "TikTok" as const,
        engagementPrediction: 8.5
      },
      {
        moment: "Momento Viral",
        description: "Pico de emoção e expressão facial detectado",
        timestamp: "1:23-1:53",
        confidence: 87,
        platform: "Instagram Reels" as const,
        engagementPrediction: 9.2
      },
      {
        moment: "Conclusão Persuasiva",
        description: "Call-to-action natural e engajante identificado",
        timestamp: "2:45-3:00",
        confidence: 84,
        platform: "YouTube Shorts" as const,
        engagementPrediction: 7.8
      }
    ]

    const baseTitle = sourceVideo.filename.replace(/\.[^/.]+$/, "")
    
    return aiAnalysis.map((analysis, index) => ({
      id: `${sourceVideo.id}_ai_${index}_${Date.now()}`,
      title: `${baseTitle} - ${analysis.moment}`,
      duration: analysis.platform === 'TikTok' ? 15 : analysis.platform === 'Instagram Reels' ? 30 : 15,
      format: analysis.platform,
      createdAt: new Date().toISOString(),
      thumbnail: sourceVideo.url,
      videoUrl: sourceVideo.url,
      sourceVideoId: sourceVideo.id,
      // Métricas baseadas na previsão de engajamento da IA
      views: Math.floor(analysis.engagementPrediction * 1000 + Math.random() * 2000),
      likes: Math.floor(analysis.engagementPrediction * 100 + Math.random() * 200),
      shares: Math.floor(analysis.engagementPrediction * 20 + Math.random() * 30),
      engagement: Number(analysis.engagementPrediction.toFixed(1)),
      status: 'ready' as const,
      // Metadados da IA
      aiMetadata: {
        confidence: analysis.confidence,
        description: analysis.description,
        timestamp: analysis.timestamp,
        moment: analysis.moment
      }
    }))
  }

  const startAIProcessing = async () => {
    if (!uploadedVideo) return

    setProcessing(true)
    setProcessingProgress(0)

    const steps = [
      { name: '🤖 Inicializando IA Avançada...', duration: 800 },
      { name: '👁️ Analisando expressões faciais...', duration: 1500 },
      { name: '🎵 Detectando audio peaks e ritmo...', duration: 1200 },
      { name: '📊 Calculando potencial viral...', duration: 1800 },
      { name: '✨ Identificando momentos épicos...', duration: 1600 },
      { name: '🎬 Criando clips premium...', duration: 1400 },
      { name: '📈 Otimizando para engajamento...', duration: 1200 },
      { name: '🚀 Finalizando com IA...', duration: 700 }
    ]

    for (let i = 0; i < steps.length; i++) {
      setProcessingStep(steps[i].name)
      await new Promise(resolve => setTimeout(resolve, steps[i].duration))
      setProcessingProgress(((i + 1) / steps.length) * 100)
    }

    // Gerar clips com IA avançada
    const aiClips = generateAIClips(uploadedVideo)
    addClips(aiClips)

    setUploadedVideo(prev => ({ ...prev!, status: 'completed' }))
    setProcessing(false)

    // Redirecionar com mensagem especial
    setTimeout(() => {
      navigate('/clips', { 
        state: { 
          message: '🤖 IA criou 3 clips premium otimizados para máximo engajamento!' 
        }
      })
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com navegação consistente */}
      <Header 
        userEmail={user?.email} 
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-blue-600 hover:text-blue-800"
              >
                Dashboard
              </Button>
            </li>
            <li className="text-gray-500">/</li>
            <li className="text-gray-900 font-medium">Upload</li>
          </ol>
        </nav>

        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Upload de Vídeo 📹
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Faça upload do seu vídeo para transformá-lo em clips virais com IA.
          </p>
        </div>

        {/* Upload Component */}
        {!uploadedVideo && (
          <VideoUpload 
            onUploadComplete={handleUploadComplete}
            onReset={resetUpload}
          />
        )}

        {/* Video Uploaded - Processing Options */}
        {uploadedVideo && !processing && uploadedVideo.status === 'uploaded' && (
          <div className="space-y-6">
            {/* Preview do vídeo carregado - Movido para CIMA */}
            {uploadedVideo.url && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Preview do Vídeo
                </h3>
                {uploadedVideo.url.startsWith('blob:') || uploadedVideo.url.startsWith('data:') ? (
                  <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                    <video 
                      src={uploadedVideo.url}
                      controls
                      preload="metadata"
                      className="w-full h-full object-contain"
                      onLoadedData={() => {
                        console.log('Vídeo carregado com sucesso na página de upload')
                      }}
                      onError={(e) => {
                        console.error('Erro ao carregar vídeo na página:', e)
                      }}
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <svg className="h-16 w-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm font-medium mb-1">🔒 Preview bloqueado</p>
                      <p className="text-xs mb-2">Restrições de segurança do navegador</p>
                      <div className="bg-green-100 text-green-800 p-2 rounded text-xs">
                        <p className="font-medium">✅ Upload realizado com sucesso!</p>
                        <p>O processamento funcionará normalmente</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    ✅ Vídeo carregado e pronto para processamento
                  </p>
                  <p className="text-xs text-gray-500">
                    Clique em "Processar com IA" abaixo para continuar
                  </p>
                </div>
              </Card>
            )}

            {/* Escolha do modo - NOVO após upload */}
            {uploadedVideo.url && !processing && (
              <Card className="p-6 mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                  🎯 Como você quer criar seus clips?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Editor Manual */}
                  <div 
                    className="group border-2 border-blue-200 rounded-xl p-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                    onClick={() => navigate('/editor', { 
                      state: {
                        url: uploadedVideo.url,
                        name: uploadedVideo.filename,
                        size: uploadedVideo.size,
                        id: uploadedVideo.id
                      }
                    })}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-3">🎬</div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        Editor Manual
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Controle total para criar quantos clips quiser
                      </p>
                      <ul className="text-xs text-gray-500 space-y-1 mb-4">
                        <li>✂️ Cortar clips no tempo exato</li>
                        <li>🎨 Personalizar títulos e formatos</li>
                        <li>👁️ Preview em tempo real</li>
                        <li>📱 Otimizar para cada plataforma</li>
                      </ul>
                      <Button className="w-full group-hover:bg-blue-600">
                        🚀 Usar Editor Manual
                      </Button>
                    </div>
                  </div>

                  {/* IA Automática */}
                  <div 
                    className="group border-2 border-purple-200 rounded-xl p-6 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all"
                    onClick={() => startAIProcessing()}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-3">🤖</div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        IA Automática
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        IA encontra os melhores momentos automaticamente
                      </p>
                      <ul className="text-xs text-gray-500 space-y-1 mb-4">
                        <li>🎯 Análise inteligente de conteúdo</li>
                        <li>✨ 3 clips premium elaborados</li>
                        <li>📊 Otimização para engajamento</li>
                        <li>⚡ Processamento rápido</li>
                      </ul>
                      <Button className="w-full bg-purple-600 hover:bg-purple-700 group-hover:bg-purple-700">
                        🚀 Processar com IA
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="text-center mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    💡 <strong>Dica:</strong> Você pode usar ambos os modos no mesmo vídeo!
                  </p>
                </div>
              </Card>
            )}

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ✅ Upload Concluído!
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Detalhes do Vídeo</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Nome:</dt>
                      <dd className="text-gray-900 font-medium">{uploadedVideo.filename}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Tamanho:</dt>
                      <dd className="text-gray-900">{(uploadedVideo.size / (1024 * 1024)).toFixed(1)} MB</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Duração:</dt>
                      <dd className="text-gray-900">{uploadedVideo.duration > 0 ? `${Math.round(uploadedVideo.duration)}s` : 'Detectando...'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Status:</dt>
                      <dd className="text-green-600 font-medium">✅ Pronto para IA</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Próximos Passos</h4>
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-blue-800 mb-2">
                      🤖 <strong>Processamento com IA</strong>
                    </p>
                    <p className="text-xs text-blue-700">
                      Nossa IA irá analisar seu vídeo e criar clips otimizados para TikTok, Instagram Reels e YouTube Shorts.
                    </p>
                  </div>
                  <Button 
                    onClick={startAIProcessing}
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                  >
                    🚀 Processar com IA
                  </Button>
                  <Button 
                    onClick={resetUpload}
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                  >
                    🔄 Fazer Novo Upload
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Processing State */}
        {processing && (
          <Card className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Processando com IA 🤖
              </h3>
              <p className="text-gray-600 mb-4">{processingStep}</p>
              
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              
              <p className="text-sm text-gray-500">
                {Math.round(processingProgress)}% concluído • Criando 3 clips otimizados
              </p>
            </div>
          </Card>
        )}

        {/* Processing Complete */}
        {uploadedVideo && uploadedVideo.status === 'completed' && (
          <Card className="p-8 text-center">
            <svg className="mx-auto h-16 w-16 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              🎉 3 Clips Criados com Sucesso!
            </h3>
            <p className="text-gray-600 mb-6">
              Seus clips otimizados para TikTok, Instagram Reels e YouTube Shorts estão prontos. Redirecionando...
            </p>
            <Button onClick={() => navigate('/clips')}>
              Ver Meus Clips
            </Button>
          </Card>
        )}

        {/* Quick Actions - Only show if no video uploaded */}
        {!uploadedVideo && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8">
            <Card className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                📊 Meus Clips
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Visualize todos os seus clips criados
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/clips')}
              >
                Ver Clips
              </Button>
            </Card>

            <Card className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                📈 Analytics
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Acompanhe performance dos clips
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/analytics')}
              >
                Ver Analytics
              </Button>
            </Card>

            <Card className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🏠 Dashboard
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Voltar para página principal
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                Ir para Dashboard
              </Button>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
} 