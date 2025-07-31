/**
 * 🇧🇷 UTILITÁRIO DE TIMEZONE DO BRASIL
 * Centraliza todas as operações de data/hora em UTC-3
 */

/**
 * Retorna timestamp atual no timezone do Brasil (UTC-3)
 * @returns ISO string em UTC-3
 */
export function getBrazilTimestamp(): string {
  const now = new Date()
  const brazilTime = new Date(now.getTime() - (3 * 60 * 60 * 1000)) // UTC-3
  return brazilTime.toISOString()
}

/**
 * Retorna apenas a data do Brasil no formato YYYYMMDD
 * @returns string no formato YYYYMMDD
 */
export function getBrazilDateOnly(): string {
  const brazilTime = new Date(new Date().getTime() - (3 * 60 * 60 * 1000)) // UTC-3
  return brazilTime.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD Brasil
}

/**
 * Converte uma data UTC para timezone do Brasil
 * @param utcDate Data em UTC
 * @returns ISO string em UTC-3
 */
export function convertToBrazilTime(utcDate: Date): string {
  const brazilTime = new Date(utcDate.getTime() - (3 * 60 * 60 * 1000)) // UTC-3
  return brazilTime.toISOString()
}

/**
 * Retorna horário atual do Brasil formatado para logs
 * @returns string formatada "DD/MM/YYYY, HH:mm:ss"
 */
export function getBrazilFormattedTime(): string {
  const brazilTime = new Date(new Date().getTime() - (3 * 60 * 60 * 1000)) // UTC-3
  return brazilTime.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
} 