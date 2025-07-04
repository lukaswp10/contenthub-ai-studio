import React, { memo } from 'react'
import { Caption } from '../../../../types/caption.types'

interface VideoOverlayProps {
  // Legendas
  currentCaption: Caption | null
  captionsVisible: boolean
  
  // Estilo das legendas
  captionPosition: 'top' | 'center' | 'bottom'
  captionFontSize: number
  captionTextColor: string
  captionShadowIntensity: number
  captionShadowColor: string
  captionOpacity: number
  captionBackgroundColor: string
  captionFontFamily: string
  captionAnimation: string
  
  // ➕ NOVOS: Callbacks para interação
  onCaptionClick?: (caption: Caption, event?: React.MouseEvent) => void
  onCaptionDoubleClick?: (caption: Caption, event?: React.MouseEvent) => void
  isClickableMode?: boolean
}

const VideoOverlay = memo(({
  currentCaption,
  captionsVisible,
  captionPosition,
  captionFontSize,
  captionTextColor,
  captionShadowIntensity,
  captionShadowColor,
  captionOpacity,
  captionBackgroundColor,
  captionFontFamily,
  captionAnimation,
  onCaptionClick,
  onCaptionDoubleClick,
  isClickableMode = false
}: VideoOverlayProps) => {
  
  // ✅ Não mostrar overlay se não há legenda ou se está oculta
  if (!currentCaption || !captionsVisible) {
    return null
  }

  // VideoOverlay renderizado com legenda ativa

  // ✅ Posicionamento dinâmico CORRIGIDO
  const positionClasses = {
    top: 'top-8 justify-center items-start',
    center: 'top-1/2 -translate-y-1/2 justify-center items-center',
    bottom: 'bottom-20 justify-center items-end'
  }

  // ✅ Estilos dinâmicos para a legenda
  const captionStyles = {
    fontSize: `${captionFontSize}px`,
    color: captionTextColor,
    textShadow: `${captionShadowIntensity}px ${captionShadowIntensity}px 0px ${captionShadowColor}`,
    opacity: captionOpacity / 100,
    backgroundColor: captionBackgroundColor !== 'transparent' ? captionBackgroundColor : 'transparent',
    fontFamily: captionFontFamily,
    transform: 'translateZ(0)', // ✅ Hardware acceleration
    animation: captionAnimation === 'fadeIn' ? 'fadeIn 0.3s ease-in-out' : 'none'
  }

  // ✅ Handlers para interação
  const handleCaptionClick = (e: React.MouseEvent) => {
    if (isClickableMode && onCaptionClick && currentCaption) {
      e.preventDefault()
      e.stopPropagation()
      onCaptionClick(currentCaption, e)
    }
  }

  const handleCaptionDoubleClick = (e: React.MouseEvent) => {
    if (isClickableMode && onCaptionDoubleClick && currentCaption) {
      e.preventDefault()
      e.stopPropagation()
      onCaptionDoubleClick(currentCaption, e)
    }
  }

  return (
    <div className={`
      caption-overlay-visionario absolute inset-0 flex z-20
      ${positionClasses[captionPosition]}
      ${isClickableMode ? 'pointer-events-auto' : 'pointer-events-none'}
    `}>
      <div 
        className={`
          caption-text-visionario text-center font-bold leading-tight max-w-[90%] px-6 py-3 rounded-xl backdrop-blur-sm mx-auto
          ${isClickableMode ? 'cursor-pointer hover:bg-white/10 transition-all duration-200 border-2 border-transparent hover:border-blue-400/50' : ''}
        `}
        style={captionStyles}
        onClick={handleCaptionClick}
        onDoubleClick={handleCaptionDoubleClick}
        title={isClickableMode ? 'Clique para editar • Duplo clique para edição avançada' : undefined}
      >
        {currentCaption.text}
        {isClickableMode && (
          <div className="absolute top-1 right-1 w-2 h-2 bg-blue-400 rounded-full opacity-60 animate-pulse"></div>
        )}
      </div>
    </div>
  )
})

VideoOverlay.displayName = 'VideoOverlay'

export default VideoOverlay 