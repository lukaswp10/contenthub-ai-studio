/**
 * 🎬 VIDEO EDITOR PROFISSIONAL - ClipsForge Pro
 * 
 * Editor limpo e funcional com layout responsivo corrigido
 * 
 * @version 1.0.0 - LAYOUT CORRIGIDO
 * @author ClipsForge Team
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import {
  ArrowLeft, Save, Download, Settings, Pause, Square, SkipBack, SkipForward, VolumeX,
  MousePointer, Scissors, Type, Image, X, FileText, Mic, Share2, Plus, Volume2, Play
} from 'lucide-react'

interface VideoLocationState {
  url: string
  name: string
  size: number
  duration: number
  file?: File
  id?: string
  videoData?: any
}

const VideoEditorPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // ===== ESTADO PRINCIPAL =====
  const [videoData, setVideoData] = useState<VideoLocationState | null>(null)
  const [videoLoaded, setVideoLoaded] = useState(false)
  
  // ===== ESTADO DO PLAYER =====
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  
  // ===== ESTADO DO EDITOR =====
  const [activeTool, setActiveTool] = useState<'select' | 'cut' | 'text' | 'image'>('select')
  const [activePanel, setActivePanel] = useState<'captions' | 'effects' | 'transitions' | 'audio' | 'motion' | 'export' | 'settings' | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // ===== HANDLERS DO PLAYER =====
  const handlePlay = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }, [])
  
  const handlePause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }, [])
  
  const handleStop = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }, [])
  
  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])
  
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }, [])
  
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      setVideoLoaded(true)
    }
  }, [])
  
  const handleVolumeChange = useCallback((newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
    }
  }, [])
  
  const handleMuteToggle = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !muted
      setMuted(!muted)
    }
  }, [muted])
  
  // ===== HANDLERS DOS PAINÉIS =====
  const handlePanelToggle = useCallback((panel: typeof activePanel) => {
    if (activePanel === panel) {
      setActivePanel(null)
      setSidebarOpen(false)
    } else {
      setActivePanel(panel)
      setSidebarOpen(true)
    }
  }, [activePanel])
  
  const handleToolSelect = useCallback((tool: typeof activeTool) => {
    setActiveTool(tool)
  }, [])
  
  // ===== HANDLERS DE LEGENDAS =====
  const handleVideoCaption = useCallback(() => {
    console.log('📝 Gerando legenda do vídeo...')
    alert('🎬 Funcionalidade: Legenda do Vídeo\n\nEsta função irá extrair o áudio do vídeo e gerar legendas automáticas usando IA.')
  }, [])
  
  const handleVoiceOver = useCallback(() => {
    console.log('🎤 Adicionando voz de fora...')
    alert('🎤 Funcionalidade: Adicionar Voz de Fora\n\nEsta função permitirá gravar narração externa e sincronizar com o vídeo.')
  }, [])
  
  // ===== VERIFICAÇÕES =====
  const handleGoBack = () => {
    navigate('/upload')
  }
  
  // ===== EFFECTS =====
  useEffect(() => {
    const state = location.state as VideoLocationState
    if (state) {
      setVideoData(state)
    }
  }, [location.state])
  
  useEffect(() => {
    if (!videoData) {
      navigate('/upload')
    }
  }, [videoData, navigate])
  
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [handleTimeUpdate, handleLoadedMetadata])
  
  // ===== LOADING STATE =====
  if (!videoData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white">Carregando editor profissional...</p>
        </div>
      </div>
    )
  }
  
  // ===== UTILITIES =====
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  
  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* ===== HEADER ===== */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              className="text-gray-300 hover:text-white"
            >
              <ArrowLeft size={16} className="mr-2" />
              Voltar
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-white font-medium truncate max-w-[200px]">
                {videoData.name}
              </span>
              <span className="text-gray-400 text-sm hidden md:inline">
                ({(videoData.size / 1024 / 1024).toFixed(1)} MB • {formatTime(videoData.duration)})
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hidden md:flex"
            >
              <Save size={16} className="mr-2" />
              Salvar
            </Button>
            
            <Button
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download size={16} className="mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>
      
      {/* ===== TOOLBAR PRINCIPAL ===== */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Controles de Reprodução */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStop}
              className="text-white hover:bg-gray-700"
              title="Parar"
            >
              <Square size={16} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSeek(Math.max(0, currentTime - 10))}
              className="text-white hover:bg-gray-700"
              title="Voltar 10s"
            >
              <SkipBack size={16} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={isPlaying ? handlePause : handlePlay}
              className={`text-white hover:bg-gray-700 ${isPlaying ? 'bg-green-600' : 'bg-blue-600'}`}
              title={isPlaying ? "Pausar" : "Reproduzir"}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSeek(Math.min(duration, currentTime + 10))}
              className="text-white hover:bg-gray-700"
              title="Avançar 10s"
            >
              <SkipForward size={16} />
            </Button>
            
            <div className="flex items-center space-x-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMuteToggle}
                className="text-white hover:bg-gray-700"
                title={muted ? "Ativar som" : "Silenciar"}
              >
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </Button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 hidden md:block"
                title="Volume"
              />
            </div>
          </div>
          
          {/* Ferramentas de Edição */}
          <div className="flex items-center space-x-1">
            <Button
              variant={activeTool === 'select' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleToolSelect('select')}
              className="text-white hover:bg-gray-700"
              title="Selecionar"
            >
              <MousePointer size={16} />
            </Button>
            
            <Button
              variant={activeTool === 'cut' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleToolSelect('cut')}
              className="text-white hover:bg-gray-700"
              title="Cortar"
            >
              <Scissors size={16} />
            </Button>
            
            <Button
              variant={activeTool === 'text' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleToolSelect('text')}
              className="text-white hover:bg-gray-700"
              title="Texto"
            >
              <Type size={16} />
            </Button>
            
            <Button
              variant={activeTool === 'image' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleToolSelect('image')}
              className="text-white hover:bg-gray-700"
              title="Imagem"
            >
              <Image size={16} />
            </Button>
          </div>
          
          {/* Painéis Principais */}
          <div className="flex items-center space-x-1 flex-wrap">
            <Button
              variant={activePanel === 'captions' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handlePanelToggle('captions')}
              className="text-white hover:bg-yellow-600"
              style={{ backgroundColor: activePanel === 'captions' ? '#eab308' : 'transparent' }}
              title="Legendas Automáticas"
            >
              📝
            </Button>
            
            <Button
              variant={activePanel === 'effects' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handlePanelToggle('effects')}
              className="text-white hover:bg-blue-600"
              style={{ backgroundColor: activePanel === 'effects' ? '#3b82f6' : 'transparent' }}
              title="Efeitos"
            >
              🎨
            </Button>
            
            <Button
              variant={activePanel === 'transitions' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handlePanelToggle('transitions')}
              className="text-white hover:bg-purple-600"
              style={{ backgroundColor: activePanel === 'transitions' ? '#8b5cf6' : 'transparent' }}
              title="Transições"
            >
              🔄
            </Button>
            
            <Button
              variant={activePanel === 'audio' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handlePanelToggle('audio')}
              className="text-white hover:bg-green-600"
              style={{ backgroundColor: activePanel === 'audio' ? '#10b981' : 'transparent' }}
              title="Áudio"
            >
              🎵
            </Button>
            
            <Button
              variant={activePanel === 'motion' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handlePanelToggle('motion')}
              className="text-white hover:bg-orange-600"
              style={{ backgroundColor: activePanel === 'motion' ? '#f59e0b' : 'transparent' }}
              title="Motion Graphics"
            >
              🎬
            </Button>
            
            <Button
              variant={activePanel === 'export' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handlePanelToggle('export')}
              className="text-white hover:bg-emerald-600"
              style={{ backgroundColor: activePanel === 'export' ? '#059669' : 'transparent' }}
              title="Exportar"
            >
              📤
            </Button>
          </div>
          
          {/* Tempo e Configurações */}
          <div className="flex items-center space-x-2">
            <div className="text-white font-mono text-sm hidden lg:block">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            
            <Button
              variant={activePanel === 'settings' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handlePanelToggle('settings')}
              className="text-white hover:bg-gray-600"
              title="Configurações"
            >
              <Settings size={16} />
            </Button>
          </div>
        </div>
      </div>
      
      {/* ===== CONTEÚDO PRINCIPAL ===== */}
      <div className="flex-1 flex overflow-hidden">
        {/* Área Principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Player */}
          <div className="flex-1 bg-black flex items-center justify-center relative">
            <video
              ref={videoRef}
              src={videoData.url}
              className="w-full h-full object-contain"
              controls={false}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
            />
            
            {/* Overlay de Loading */}
            {!videoLoaded && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-white text-sm">Carregando vídeo...</p>
                </div>
              </div>
            )}
            
            {/* Timeline */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center space-x-2">
                <span className="text-white text-xs font-mono">{formatTime(currentTime)}</span>
                <div className="flex-1 bg-gray-600 rounded-full h-1 relative">
                  <div 
                    className="bg-blue-500 h-1 rounded-full transition-all duration-100"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  ></div>
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    value={currentTime}
                    onChange={(e) => handleSeek(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <span className="text-white text-xs font-mono">{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sidebar dos Painéis */}
        {sidebarOpen && activePanel && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto flex-shrink-0">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">
                  {activePanel === 'captions' && '📝 Legendas'}
                  {activePanel === 'effects' && '🎨 Efeitos'}
                  {activePanel === 'transitions' && '🔄 Transições'}
                  {activePanel === 'audio' && '🎵 Áudio'}
                  {activePanel === 'motion' && '🎬 Motion'}
                  {activePanel === 'export' && '📤 Exportar'}
                  {activePanel === 'settings' && '⚙️ Configurações'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {activePanel === 'captions' && (
                <div className="p-4">
                  <div className="space-y-4">
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                      <h4 className="text-yellow-300 font-medium mb-3">🎤 Opções de Legenda</h4>
                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left hover:bg-yellow-600/20"
                          onClick={handleVideoCaption}
                        >
                          <FileText size={16} className="mr-3 text-yellow-400" />
                          <div className="flex-1">
                            <div className="font-medium">Legenda do Vídeo</div>
                            <div className="text-xs text-gray-400">Transcrever áudio do vídeo</div>
                          </div>
                        </Button>
                        
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left hover:bg-yellow-600/20"
                          onClick={handleVoiceOver}
                        >
                          <Mic size={16} className="mr-3 text-yellow-400" />
                          <div className="flex-1">
                            <div className="font-medium">Adicionar Voz de Fora</div>
                            <div className="text-xs text-gray-400">Gravar narração externa</div>
                          </div>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">Status</h4>
                      <p className="text-gray-400 text-sm">
                        Nenhuma legenda gerada ainda. Clique em uma das opções acima para começar.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Outros painéis simplificados */}
              {activePanel !== 'captions' && (
                <div className="p-4">
                  <div className="text-center text-gray-400">
                    <p>Painel {activePanel} será implementado na próxima fase</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* ===== FOOTER ===== */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-2">
            <span>🎬 ClipsForge Pro</span>
            <span>•</span>
            <span>Editor Profissional - Layout Corrigido</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span>Pronto para edição</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoEditorPage 