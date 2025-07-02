/**
 * 🕒 UTILITÁRIOS DE TEMPO - ClipsForge
 * Funções centralizadas para formatação e manipulação de tempo
 * ✅ PERFORMANCE FIRST: Funções otimizadas e reutilizáveis
 */

/**
 * Formatar segundos em formato MM:SS
 * @param seconds - Tempo em segundos
 * @returns String formatada no formato MM:SS
 */
export const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '00:00'
  
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Formatar tempo para formato SRT (HH:MM:SS,mmm)
 * @param seconds - Tempo em segundos
 * @returns String formatada no formato SRT
 */
export const formatTimeToSRT = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const milliseconds = Math.floor((seconds % 1) * 1000)
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`
}

/**
 * Formatar tempo relativo (há X tempo)
 * @param date - Data para comparar
 * @returns String formatada com tempo relativo
 */
export const formatTimeAgo = (date: Date): string => {
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) return 'Agora há pouco'
  if (diffInHours < 24) return `${diffInHours}h atrás`
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays}d atrás`
}

/**
 * Converter percentual para tempo
 * @param percentage - Percentual (0-100)
 * @param duration - Duração total em segundos
 * @returns Tempo em segundos
 */
export const percentageToTime = (percentage: number, duration: number): number => {
  return (percentage / 100) * duration
}

/**
 * Converter tempo para percentual
 * @param time - Tempo em segundos
 * @param duration - Duração total em segundos
 * @returns Percentual (0-100)
 */
export const timeToPercentage = (time: number, duration: number): number => {
  return duration > 0 ? (time / duration) * 100 : 0
} 