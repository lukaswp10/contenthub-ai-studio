/*
 * ========================================
 * PÁGINA DE UPLOAD - REDIRECIONAMENTO
 * ========================================
 * 
 * Esta página agora redireciona para o Dashboard onde
 * o upload está integrado de forma unificada.
 * 
 * NOVO FLUXO: Dashboard → Upload Compacto → Galeria
 * ANTIGO FLUXO: Dashboard → /upload → Escolha → Editor
 * 
 * ========================================
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'

export const UploadPage: React.FC = () => {
  const navigate = useNavigate()
  
  React.useEffect(() => {
    console.log('📝 Redirecionando /upload → /dashboard (fluxo unificado)')
    navigate('/dashboard', { replace: true })
  }, [navigate])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecionando para o dashboard...</p>
        <p className="text-xs text-gray-500 mt-2">Upload agora integrado na página principal</p>
      </div>
    </div>
  )
}

/*
 * ========================================
 * CÓDIGO ORIGINAL COMENTADO
 * ========================================
 * 
 * O código original desta página (~460 linhas) foi removido
 * para implementar o novo fluxo unificado no Dashboard.
 * 
 * Funcionalidades movidas para:
 * - CompactVideoUpload: Upload compacto
 * - VideoGallery: Galeria integrada
 * - DashboardPage: Orquestração
 * 
 * Para restaurar: git checkout HEAD~1 -- src/pages/upload/UploadPage.tsx
 * 
 * Motivo: Unificar UX em uma página só
 * Data: 2024
 * ========================================
 */ 