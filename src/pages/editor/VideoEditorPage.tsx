/**
 * CURSOR CONTEXT CHECKPOINT - 2025-01-07 14:51:00
 * ===============================================
 * Projeto: ClipsForge Pro Video Editor
 * Status: Galeria modal implementada + Legendas corrigidas
 * 
 * ÚLTIMAS IMPLEMENTAÇÕES:
 * - ✅ Galeria transformada em modal elegante
 * - ✅ Sistema de exclusão de vídeos/clips
 * - ✅ Botão upload redesenhado
 * - ✅ Correção legendas AssemblyAI
 * - ✅ Editor manual na dashboard
 * 
 * PRÓXIMOS PASSOS:
 * - Aguardando próximas melhorias do usuário
 * - Possível otimização de persistência
 * 
 * BUGS CONHECIDOS:
 * - TypeScript warning linha 451 (prev: any)
 * 
 * DECISÕES IMPORTANTES:
 * - Modal substitui sidebar para melhor UX
 * - AssemblyAI como serviço principal de transcrição
 * - 4 estilos virais mantidos e funcionais
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Play, 
  Pause, 
  Download, 
  Scissors, 
  Type, 
  Image as ImageIcon,
  Wand2,
  Save,
  ArrowLeft,
  Clock,
  Volume2,
  SkipBack,
  SkipForward,
  Sparkles,
  Palette,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react'

import { useVideoEditorStore } from '../../stores/videoEditorStore'

// ===== COMPONENT =====

const VideoEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  // ===== STATE =====
  
  const [activeTab, setActiveTab] = useState('editor')
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  
  // ===== STORE =====
  
  const {
    currentTime,
    duration,
    isPlaying,
    setCurrentTime,
    setIsPlaying
  } = useVideoEditorStore()
  
  // ===== REFS =====
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // ===== HANDLERS =====
  
  const handleGoBack = () => {
    navigate('/gallery')
  }
  
  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }
  
  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }
  
  const handleTogglePlayPause = () => {
    if (isPlaying) {
      handlePause()
    } else {
      handlePlay()
    }
  }
  
  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }
  
  const handleExport = async () => {
    setIsExporting(true)
    setExportProgress(0)
    
    // Simulate export progress
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsExporting(false)
          return 100
        }
        return prev + 10
      })
    }, 500)
  }
  
  // ===== EFFECTS =====
  
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }
    
    const handleLoadedMetadata = () => {
      // Video loaded
    }
    
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [setCurrentTime])
  
  // ===== RENDER =====
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Gallery
            </button>
            <h1 className="text-xl font-semibold">Video Editor</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Save className="w-4 h-4" />
              Save
            </button>
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isExporting ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        
        {/* Video Preview */}
        <div className="flex-1 p-6">
          <div className="h-full bg-white rounded-lg shadow-sm border">
            <div className="p-6 h-full flex flex-col">
              
              {/* Video Container */}
              <div className="flex-1 bg-black rounded-lg relative overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  crossOrigin="anonymous"
                  playsInline
                  preload="metadata"
                />
                
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
                
                {/* Play Button Overlay */}
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={handleTogglePlayPause}
                      className="bg-white/20 hover:bg-white/30 text-white rounded-full p-4 transition-colors"
                    >
                      <Play className="w-8 h-8" />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Video Controls */}
              <div className="mt-4 space-y-4">
                
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}</span>
                    <span>{Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                
                {/* Control Buttons */}
                <div className="flex items-center justify-center gap-2">
                  <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleTogglePlayPause}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <SkipForward className="w-4 h-4" />
                  </button>
                  <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="w-80 border-l bg-white">
          <div className="h-full flex flex-col">
            
            {/* Tabs */}
            <div className="border-b">
              <div className="flex">
                {['editor', 'effects', 'export'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-4 py-3 text-sm font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
              
              {activeTab === 'editor' && (
                <div className="space-y-4">
                  <div className="bg-white border rounded-lg">
                    <div className="p-4 border-b">
                      <h3 className="text-sm font-medium">Basic Tools</h3>
                    </div>
                    <div className="p-4 space-y-2">
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <Scissors className="w-4 h-4" />
                        Cut
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <Type className="w-4 h-4" />
                        Add Text
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <ImageIcon className="w-4 h-4" />
                        Add Image
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'effects' && (
                <div className="space-y-4">
                  <div className="bg-white border rounded-lg">
                    <div className="p-4 border-b">
                      <h3 className="text-sm font-medium">Video Effects</h3>
                    </div>
                    <div className="p-4 space-y-2">
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <Wand2 className="w-4 h-4" />
                        Filters
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <Sparkles className="w-4 h-4" />
                        Transitions
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <Palette className="w-4 h-4" />
                        Color Correction
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'export' && (
                <div className="space-y-4">
                  <div className="bg-white border rounded-lg">
                    <div className="p-4 border-b">
                      <h3 className="text-sm font-medium">Export Settings</h3>
                    </div>
                    <div className="p-4 space-y-4">
                      {isExporting && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Exporting...</span>
                            <span>{exportProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${exportProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                          <Smartphone className="w-4 h-4" />
                          Mobile (9:16)
                        </button>
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                          <Monitor className="w-4 h-4" />
                          Desktop (16:9)
                        </button>
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                          <Tablet className="w-4 h-4" />
                          Square (1:1)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoEditorPage
export { VideoEditorPage } 