/**
 * 📝 CAPTION TYPES - Interfaces centralizadas
 * ✅ PROTOCOLO DE SEGURANÇA APLICADO
 */

export interface Caption {
  text: string
  start: number
  end: number
  confidence?: number
}

export interface CaptionSegment {
  id: string
  text: string
  start: number
  end: number
  confidence: number
  words?: CaptionWord[]
}

export interface CaptionWord {
  text: string
  start: number
  end: number
  confidence: number
}

export interface CaptionStyle {
  position: 'top' | 'center' | 'bottom'
  fontSize: number
  textColor: string
  shadowIntensity: number
  shadowColor: string
  opacity: number
  backgroundColor: string
  fontFamily: string
  animation: string
} 