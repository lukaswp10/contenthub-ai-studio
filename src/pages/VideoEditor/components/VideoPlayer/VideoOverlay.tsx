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
}

export const VideoOverlay = memo(({
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
  captionAnimation
}: VideoOverlayProps) => {
  
  // ✅ Não mostrar overlay se não há legenda ou se está oculta
  if (!currentCaption || !captionsVisible) {
    return null
  }

  console.log('📝 VideoOverlay: Renderizando legenda', {
    text: currentCaption.text,
    position: captionPosition,
    visible: captionsVisible
  })

  // ✅ Posicionamento dinâmico
  const positionClasses = {
    top: 'top-8 justify-start',
    center: 'top-1/2 -translate-y-1/2 justify-center',
    bottom: 'bottom-20 justify-end'
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

  return (
    <div className={`
      caption-overlay-visionario absolute left-0 right-0 flex items-center px-8 pointer-events-none z-10
      ${positionClasses[captionPosition]}
    `}>
      <div 
        className="caption-text-visionario text-center font-bold leading-tight max-w-full px-4 py-2 rounded-lg backdrop-blur-sm"
        style={captionStyles}
      >
        {currentCaption.text}
      </div>
    </div>
  )
})

VideoOverlay.displayName = 'VideoOverlay' 