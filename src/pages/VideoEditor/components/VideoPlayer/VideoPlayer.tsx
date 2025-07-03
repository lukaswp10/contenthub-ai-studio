import React, { memo, useRef, useState } from 'react'
import { useVideoPlayer } from '../../hooks/useVideoPlayer'
import { VideoControls } from './VideoControls'
import { VideoOverlay } from './VideoOverlay'
import { CaptionSyncControls } from './CaptionSyncControls'
import { Button } from '../../../../components/ui/button'
import { useCaptions, useCaptionStyling, useVideoEditorStore } from '../../../../stores/videoEditorStore'
import { Caption, CaptionSegment } from '../../../../types/caption.types'
import { CaptionEditor } from '../../../../components/editor/CaptionEditor'
import { InlineCaptionEditor } from '../../../../components/editor/InlineCaptionEditor'
import { CaptionHelp } from '../../../../components/editor/CaptionHelp'
import { saveEditedCaptions } from '../../../../utils/galleryStorage'

interface VideoPlayerProps {
  // Captions específicas
  currentCaption: Caption | null
  hasTranscription: boolean
  transcriptionWordsCount: number
  
  // ✅ NOVO: Sistema de legendas originais vs editadas
  videoId?: string // ID do vídeo para salvar na galeria
  showingOriginalCaptions?: boolean
  hasEditedCaptions?: boolean
  onToggleCaptionMode?: () => void
  onCaptionEdit?: (captions: any[]) => void // Callback quando legenda é editada
  
  // ✅ NOVO: Estilos de legenda em tempo real
  captionStyling?: {
    captionPosition: 'top' | 'center' | 'bottom'
    captionFontSize: number
    captionTextColor: string
    captionShadowIntensity: number
    captionShadowColor: string
    captionOpacity: number
    captionBackgroundColor: string
    captionFontFamily: string
    captionAnimation: string
  }
  
  // Canvas ref para efeitos
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export const VideoPlayer = memo(({
  currentCaption,
  hasTranscription,
  transcriptionWordsCount,
  videoId,
  showingOriginalCaptions,
  hasEditedCaptions,
  onToggleCaptionMode,
  onCaptionEdit,
  captionStyling: customCaptionStyling,
  canvasRef
}: VideoPlayerProps) => {
  
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // 🔄 Local state para UI
  const [syncControlsVisible, setSyncControlsVisible] = useState(false)
  const [captionEditorOpen, setCaptionEditorOpen] = useState(false)
  const [isClickableMode, setIsClickableMode] = useState(false)
  const [selectedCaptionId, setSelectedCaptionId] = useState<string | null>(null)
  const [inlineEditorVisible, setInlineEditorVisible] = useState(false)
  const [inlineEditorCaption, setInlineEditorCaption] = useState<Caption | null>(null)
  const [inlineEditorPosition, setInlineEditorPosition] = useState({ x: 0, y: 0 })
  const [helpVisible, setHelpVisible] = useState(false)
  
  // ➕ INTEGRANDO COM LEGENDAS REAIS
  const { generatedCaptions } = useCaptions()
  
  // ✅ Converter legendas para formato CaptionSegment
  const captionSegments = React.useMemo(() => {
    return generatedCaptions.map((caption, index) => ({
      id: `caption-${index}`,
      text: caption.text,
      start: caption.start,
      end: caption.end,
      confidence: caption.confidence || 0.8,
      words: []
    }))
  }, [generatedCaptions])
  
  // ✅ Função para atualizar legendas no store
  const { setGeneratedCaptions } = useVideoEditorStore()
  
  const updateCaptionsInStore = (newSegments: CaptionSegment[]) => {
    const updatedCaptions = newSegments.map(segment => ({
      text: segment.text,
      start: segment.start,
      end: segment.end,
      confidence: segment.confidence || 0.8
    }))
    
    // Atualizar as legendas no store Zustand
    setGeneratedCaptions(updatedCaptions)
    
    // ✅ SALVAMENTO AUTOMÁTICO: Salvar na galeria se tiver videoId
    if (videoId && onCaptionEdit) {
      saveEditedCaptions(videoId, updatedCaptions)
      onCaptionEdit(updatedCaptions)
    }
  }
  
  // 🏪 Zustand hooks para state management
  const { captionsVisible, toggleCaptionsVisibility } = useCaptions()
  const storeCaptionStyling = useCaptionStyling()
  
  // ✅ PRIORIZAR estilos customizados se fornecidos
  const finalCaptionStyling = customCaptionStyling || storeCaptionStyling
  
  // ✅ Hook customizado integrado com Zustand
  const {
    seekTo,
    togglePlayPause,
    hasVideo,
    videoUrl,
    currentTime,
    duration,
    isPlaying,
    // ➕ FASE 1: Funções de clips
    playClip,
    playFullVideo,
    isClipMode,
    clipDuration,
    clipCurrentTime,
    clipRemainingTime,
    clipProgressPercentage
  } = useVideoPlayer({ videoRef })

  // ✅ Handlers para edição de legendas
  const handleCaptionClick = (caption: Caption, event?: React.MouseEvent) => {
    setSelectedCaptionId(caption.start?.toString() || null)
    
    // Calcular posição do editor inline
    const rect = event?.currentTarget.getBoundingClientRect()
    const position = {
      x: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
      y: rect ? rect.top : window.innerHeight / 2
    }
    
    setInlineEditorCaption(caption)
    setInlineEditorPosition(position)
    setInlineEditorVisible(true)
  }

  const handleCaptionDoubleClick = (caption: Caption) => {
    setSelectedCaptionId(caption.start?.toString() || null)
    setCaptionEditorOpen(true)
  }

  // ✅ Funções de gerenciamento de legendas
  const updateCaptionText = (startTime: number, newText: string) => {
    const updatedSegments = captionSegments.map(segment => 
      segment.start === startTime 
        ? { ...segment, text: newText }
        : segment
    )
    updateCaptionsInStore(updatedSegments)
  }

  const handleCaptionUpdate = (captionId: string, newText: string) => {
    const updatedSegments = captionSegments.map(segment => 
      segment.id === captionId 
        ? { ...segment, text: newText }
        : segment
    )
    
    updateCaptionsInStore(updatedSegments)
  }

  const handleCaptionTimeUpdate = (captionId: string, start: number, end: number) => {
    const updatedSegments = captionSegments.map(segment => 
      segment.id === captionId 
        ? { ...segment, start, end }
        : segment
    )
    updateCaptionsInStore(updatedSegments)
  }

  const handleCaptionDelete = (captionId: string) => {
    const updatedSegments = captionSegments.filter(segment => segment.id !== captionId)
    updateCaptionsInStore(updatedSegments)
  }

  const handleCaptionAdd = (start: number, end: number, text: string) => {
    const newCaption: CaptionSegment = {
      id: Date.now().toString(),
      text,
      start,
      end,
      confidence: 1.0,
      words: []
    }
    const updatedSegments = [...captionSegments, newCaption].sort((a, b) => a.start - b.start)
    updateCaptionsInStore(updatedSegments)
  }

  // ✅ Handlers para editor inline
  const handleInlineEditorSave = (newText: string) => {
    if (inlineEditorCaption && inlineEditorCaption.start !== undefined) {
      // Encontrar o segmento correspondente baseado no tempo de início
      const matchingSegment = captionSegments.find(segment => 
        Math.abs(segment.start - inlineEditorCaption.start) < 0.1 // Tolerância de 100ms
      )
      
      if (matchingSegment) {
        // Usar o ID do segmento para atualização mais precisa
        handleCaptionUpdate(matchingSegment.id, newText)
      } else {
        // Fallback para o método anterior
        updateCaptionText(inlineEditorCaption.start, newText)
      }
    }
    setInlineEditorVisible(false)
    setInlineEditorCaption(null)
  }

  const handleInlineEditorCancel = () => {
    setInlineEditorVisible(false)
    setInlineEditorCaption(null)
  }

  // VideoPlayer renderizado com sucesso

  // ✅ FALLBACK: Quando não há vídeo carregado
  if (!hasVideo || !videoUrl) {
    return (
      <div className="video-container-visionario relative w-full max-w-6xl h-full max-h-[65vh] bg-black/40 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center">
        <div className="text-center text-white space-y-4">
          <div className="text-6xl">🎬</div>
          <h3 className="text-2xl font-bold">Nenhum vídeo carregado</h3>
          <p className="text-gray-400">Clique no botão "Galeria" para selecionar um vídeo</p>
        </div>
      </div>
    )
  }

  return (
    <div className="video-container-visionario relative w-full max-w-6xl h-full max-h-[65vh] bg-black/40 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center">
      
      {/* ✅ VIDEO ELEMENT */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="video-player-visionario w-full h-full object-contain rounded-2xl"
        style={{ 
          filter: 'none',
          transition: 'filter 0.3s ease'
        }}
      />
      
      {/* ✅ CANVAS PARA EFEITOS */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-0 rounded-2xl"
        style={{ mixBlendMode: 'overlay' }}
      />
      
      {/* ✅ OVERLAY DE LEGENDAS */}
      <VideoOverlay
        currentCaption={currentCaption}
        captionsVisible={captionsVisible}
        {...finalCaptionStyling}
        onCaptionClick={handleCaptionClick}
        onCaptionDoubleClick={handleCaptionDoubleClick}
        isClickableMode={isClickableMode}
      />
      
      {/* ✅ PLAY/PAUSE OVERLAY */}
      <div className="play-overlay-visionario absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300 bg-black/10 rounded-2xl backdrop-blur-sm">
        <Button
          onClick={togglePlayPause}
          className="play-btn-visionario bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white rounded-full w-24 h-24 flex items-center justify-center text-4xl border-2 border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-110 shadow-2xl"
        >
          {isPlaying ? '⏸️' : '▶️'}
        </Button>
      </div>
      
      {/* ➕ CONTROLES DE SINCRONIZAÇÃO DE LEGENDAS */}
      <CaptionSyncControls
        isVisible={syncControlsVisible}
        onToggle={() => setSyncControlsVisible(!syncControlsVisible)}
      />
      
      {/* ✅ CONTROLES DO VÍDEO */}
      <VideoControls
        onSeek={seekTo}
        onToggleCaptions={toggleCaptionsVisibility}
        hasTranscription={hasTranscription}
        transcriptionWordsCount={transcriptionWordsCount}
        showingOriginalCaptions={showingOriginalCaptions}
        hasEditedCaptions={hasEditedCaptions}
        onToggleCaptionMode={onToggleCaptionMode}
        onToggleSyncControls={() => setSyncControlsVisible(!syncControlsVisible)}
        syncControlsVisible={syncControlsVisible}
        // ➕ FASE 1: Passar funções do hook para controle direto do vídeo
        onPlayClip={playClip}
        onPlayFullVideo={playFullVideo}
        clipData={{
          isClipMode,
          clipDuration,
          clipCurrentTime,
          clipRemainingTime,
          clipProgressPercentage
        }}
      />
      
      {/* ➕ CONTROLES DE EDIÇÃO DE LEGENDAS */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2 z-30">
        <Button
          onClick={() => setIsClickableMode(!isClickableMode)}
          className={`
            ${isClickableMode 
              ? 'bg-blue-600 hover:bg-blue-500 text-white' 
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }
            px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
          `}
          title={isClickableMode ? 'Desativar edição de legendas' : 'Ativar edição de legendas'}
        >
          {isClickableMode ? '🔓' : '🔒'} Editar
        </Button>
        
        <Button
          onClick={() => setCaptionEditorOpen(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          title="Abrir editor avançado de legendas"
        >
          📝 Editor
        </Button>
        
        <Button
          onClick={() => setHelpVisible(true)}
          className="bg-orange-600 hover:bg-orange-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          title="Como usar as legendas editáveis"
        >
          💡 Ajuda
        </Button>
      </div>
      
             {/* ➕ EDITOR DE LEGENDAS */}
       <CaptionEditor
         isOpen={captionEditorOpen}
         onClose={() => setCaptionEditorOpen(false)}
         captions={captionSegments}
         currentTime={currentTime}
         onCaptionUpdate={handleCaptionUpdate}
         onCaptionTimeUpdate={handleCaptionTimeUpdate}
         onCaptionDelete={handleCaptionDelete}
         onCaptionAdd={handleCaptionAdd}
         onSeekTo={(time) => seekTo((time / duration) * 100)}
         selectedCaptionId={selectedCaptionId || undefined}
       />
       
       {/* ➕ EDITOR INLINE DE LEGENDAS */}
       <InlineCaptionEditor
         caption={inlineEditorCaption}
         isVisible={inlineEditorVisible}
         onSave={handleInlineEditorSave}
         onCancel={handleInlineEditorCancel}
         position={inlineEditorPosition}
       />
       
       {/* ➕ AJUDA DE LEGENDAS */}
       <CaptionHelp
         isVisible={helpVisible}
         onClose={() => setHelpVisible(false)}
       />
     </div>
   )
})

VideoPlayer.displayName = 'VideoPlayer' 