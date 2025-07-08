// Função de debounce para otimizar operações em tempo real
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

// Função de throttle para operações que precisam de execução regular
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let isThrottled = false
  
  return (...args: Parameters<T>) => {
    if (!isThrottled) {
      func(...args)
      isThrottled = true
      
      setTimeout(() => {
        isThrottled = false
      }, delay)
    }
  }
} 