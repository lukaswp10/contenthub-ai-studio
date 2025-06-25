import React, { useState, useRef, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface ClipEditorProps {
  video: {
    id: string
    cloudinary_secure_url: string
    duration_seconds: number
    title: string
  }
  onClipCreated?: (clip: any) => void
}

export default function ClipEditor({ video, onClipCreated }: ClipEditorProps) {
  const { toast } = useToast()
  // supabase já importado
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(30)
  const [clipTitle, setClipTitle] = useState('')
  const [clipDescription, setClipDescription] = useState('')
  const [subtitles, setSubtitles] = useState('')
  const [platform, setPlatform] = useState('tiktok')
  const [isCreating, setIsCreating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')

  const platforms = {
    tiktok: { name: 'TikTok', ratio: '9:16', size: '1080x1920' },
    instagram: { name: 'Instagram', ratio: '1:1', size: '1080x1080' },
    youtube: { name: 'YouTube', ratio: '16:9', size: '1920x1080' }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => setCurrentTime(video.currentTime)
    video.addEventListener('timeupdate', updateTime)
    return () => video.removeEventListener('timeupdate', updateTime)
  }, [])

  const togglePlay = () => {
    if (!videoRef.current) return
    
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const seekTo = (time: number) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = time
    setCurrentTime(time)
  }

  const setClipStart = () => {
    setStartTime(currentTime)
    if (endTime <= currentTime) {
      setEndTime(Math.min(currentTime + 30, video.duration_seconds))
    }
  }

  const setClipEnd = () => {
    setEndTime(currentTime)
    if (startTime >= currentTime) {
      setStartTime(Math.max(currentTime - 30, 0))
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const generatePreview = () => {
    const previewUrl = video.cloudinary_secure_url.replace(
      '/upload/',
      `/upload/so_${startTime},eo_${endTime}/`
    )
    setPreviewUrl(previewUrl)
  }

  const createClip = async () => {
    if (!clipTitle.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, adicione um título para o clip",
        variant: "destructive"
      })
      return
    }

    if (clipDuration > 120) {
      toast({
        title: "Duração muito longa",
        description: "O clip deve ter no máximo 120 segundos",
        variant: "destructive"
      })
      return
    }

    setIsCreating(true)
    
    try {
      console.log('🎬 Criando clip manual...')
      
      const { data, error } = await supabase.functions.invoke('create-manual-clip', {
        body: {
          video_id: video.id,
          title: clipTitle,
          description: clipDescription,
          start_time_seconds: startTime,
          end_time_seconds: endTime,
          subtitles: subtitles,
          platform: platform
        }
      })

      if (error) {
        console.error('❌ Erro ao criar clip:', error)
        throw new Error(error.message || 'Erro ao criar clip')
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro desconhecido ao criar clip')
      }

      console.log('✅ Clip criado com sucesso:', data.clip)
      
      toast({
        title: "Clip criado com sucesso! 🎉",
        description: data.using_shotstack 
          ? "Seu clip está sendo processado pelo Shotstack" 
          : "Seu clip foi criado com Cloudinary",
      })
      
      onClipCreated?.(data.clip)
      
      // Limpar formulário
      setClipTitle('')
      setClipDescription('')
      setSubtitles('')
      setStartTime(0)
      setEndTime(Math.min(30, video.duration_seconds))
      setPreviewUrl('')
      
    } catch (error) {
      console.error('❌ Erro ao criar clip:', error)
      toast({
        title: "Erro ao criar clip",
        description: error.message || "Tente novamente em alguns instantes.",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const clipDuration = endTime - startTime

  return (
    <div className="space-y-6 p-6">
      {/* Player de Vídeo */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          ✂️ Editor de Clips - {video.title}
        </h2>
        
        <div className="space-y-4">
          {/* Vídeo Player */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={video.cloudinary_secure_url}
              className="w-full h-auto max-h-96"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            {/* Controles do Player */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20 p-2 rounded"
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </button>
                
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max={video.duration_seconds}
                    step="0.1"
                    value={currentTime}
                    onChange={(e) => seekTo(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(video.duration_seconds)}
                </span>
              </div>
            </div>
          </div>

          {/* Seleção de Tempo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Início do Clip</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={startTime.toFixed(1)}
                  onChange={(e) => setStartTime(parseFloat(e.target.value) || 0)}
                  step="0.1"
                  min="0"
                  max={video.duration_seconds}
                  className="flex-1 p-2 border rounded"
                />
                <button 
                  onClick={setClipStart}
                  className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Marcar
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Fim do Clip</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={endTime.toFixed(1)}
                  onChange={(e) => setEndTime(parseFloat(e.target.value) || 0)}
                  step="0.1"
                  min="0"
                  max={video.duration_seconds}
                  className="flex-1 p-2 border rounded"
                />
                <button 
                  onClick={setClipEnd}
                  className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Marcar
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Duração</label>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-2 rounded ${clipDuration > 120 ? 'bg-red-100 text-red-800' : clipDuration > 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                  {formatTime(clipDuration)}
                </span>
                {clipDuration > 120 && (
                  <span className="text-sm text-red-600">Máximo 120s</span>
                )}
                {clipDuration > 60 && clipDuration <= 120 && (
                  <span className="text-sm text-yellow-600">Longo para algumas plataformas</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configurações do Clip */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Configurações do Clip</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Título do Clip *</label>
              <input
                type="text"
                value={clipTitle}
                onChange={(e) => setClipTitle(e.target.value)}
                placeholder="Ex: Momento épico do vídeo"
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Plataforma</label>
              <select 
                value={platform} 
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {Object.entries(platforms).map(([key, platform]) => (
                  <option key={key} value={key}>
                    {platform.name} ({platform.ratio})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <textarea
              value={clipDescription}
              onChange={(e) => setClipDescription(e.target.value)}
              placeholder="Descreva o conteúdo do clip..."
              rows={3}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Legendas/Texto</label>
            <textarea
              value={subtitles}
              onChange={(e) => setSubtitles(e.target.value)}
              placeholder="Adicione legendas ou texto que aparecerá no clip..."
              rows={3}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-4">
        <button 
          onClick={generatePreview}
          className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center justify-center gap-2"
        >
          👁️ Preview
        </button>
        
        <button 
          onClick={createClip}
          disabled={isCreating || !clipTitle.trim() || clipDuration > 120 || clipDuration <= 0}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 flex items-center justify-center gap-2"
        >
          {isCreating ? "Criando..." : "✂️ Criar Clip"}
        </button>
      </div>

      {/* Preview */}
      {previewUrl && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Preview do Clip</h3>
          <video
            src={previewUrl}
            controls
            className="w-full max-w-md mx-auto rounded-lg"
          />
        </div>
      )}
    </div>
  )
} 