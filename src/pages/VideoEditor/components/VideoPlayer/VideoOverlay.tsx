import React, { memo } from 'react'

interface Caption {
  id: string
  text: string
  start: number
  end: number
  confidence: number
}

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
  
  console.log('📺 VideoOverlay: Renderizando overlay', {
    hasCaption: !!currentCaption,
    captionsVisible,
    text: currentCaption?.text
  })

  // ✅ Função para renderizar legenda com estilo personalizado
  const renderCaptionWithStyle = (caption: Caption) => {
    if (!caption) return null
    
    const dynamicStyle = {
      fontFamily: captionFontFamily,
      fontSize: `${captionFontSize}px`,
      fontWeight: '700',
      color: captionTextColor,
      textShadow: captionShadowIntensity > 0 ? `${captionShadowIntensity}px ${captionShadowIntensity}px 0px ${captionShadowColor}` : 'none',
      opacity: captionOpacity / 100,
      background: captionBackgroundColor !== 'transparent' ? captionBackgroundColor : 'transparent',
      padding: captionBackgroundColor !== 'transparent' ? '8px 16px' : '0px',
      borderRadius: captionBackgroundColor !== 'transparent' ? '8px' : '0px',
      wordWrap: 'break-word' as const,
      maxWidth: '90%',
      textAlign: 'center' as const,
      lineHeight: '1.3',
      display: 'inline-block',
      position: 'relative' as const,
      zIndex: 1000,
      animation: `${captionAnimation} 0.5s ease-out`,
      animationFillMode: 'both',
      transform: 'translateZ(0)', // Hardware acceleration
      willChange: 'transform, opacity'
    }
    
    return (
      <div
        className="caption-text caption-custom"
        style={dynamicStyle}
        key={`caption-${caption.id || Math.random()}`}
      >
        {caption.text}
      </div>
    )
  }

  return (
    <>
      {/* OVERLAY DE LEGENDAS VISIONÁRIO */}
      <div 
        className={`caption-overlay-visionario absolute left-8 right-8 text-center pointer-events-none z-10 ${
          captionPosition === 'top' ? 'top-8' : 
          captionPosition === 'center' ? 'top-1/2 transform -translate-y-1/2' : 
          'bottom-8'
        }`}
        style={{
          fontSize: `${captionFontSize}px`,
          fontWeight: 'bold',
          color: captionTextColor,
          textShadow: `${captionShadowIntensity}px ${captionShadowIntensity}px 0px ${captionShadowColor}`,
          wordWrap: 'break-word'
        }}
      >
        {/* Legendas funcionais com estilo personalizado */}
        {currentCaption && captionsVisible && renderCaptionWithStyle(currentCaption)}
      </div>
    </>
  )
})

VideoOverlay.displayName = 'VideoOverlay' 