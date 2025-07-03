/**
 * 🎬 TIMELINE RESPONSIVO PROFISSIONAL - ClipsForge Pro
 * 
 * Inspirado no Opus Clip com:
 * - ✅ Design responsivo moderno
 * - ✅ Player integrado
 * - ✅ Controles profissionais
 * - ✅ Sincronização perfeita
 * - ✅ Animações suaves
 * 
 * @author ClipsForge Team
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Button } from '../ui/button'
import { formatTime } from '../../utils/timeUtils'

interface TimelineSegment {
  id: string
  start: number
  end: number
  type: 'video' | 'audio' | 'caption' | 'effect'
  content?: string
  color?: string
  thumbnail?: string
}

interface ResponsiveTimelineProps {
  // Dados essenciais
  duration: number
  currentTime: number
  segments: TimelineSegment[]
  
  // Player integrado
  videoUrl?: string
  isPlaying?: boolean
  volume?: number
  
  // Configurações visuais
  height?: number
  showThumbnails?: boolean
  showWaveform?: boolean
  responsiveBreakpoint?: number
  
  // Callbacks
  onSeek?: (time: number) => void
  onPlay?: () => void
  onPause?: () => void
  onVolumeChange?: (volume: number) => void
  onSegmentClick?: (segment: TimelineSegment) => void
  onSegmentEdit?: (segment: TimelineSegment) => void
}

export const ResponsiveTimeline: React.FC<ResponsiveTimelineProps> = ({
  duration = 100,
  currentTime = 0,
  segments = [],
  videoUrl,
  isPlaying = false,
  volume = 1,
  height = 120,
  showThumbnails = true,
  showWaveform = false,
  responsiveBreakpoint = 768,
  onSeek,
  onPlay,
  onPause,
  onVolumeChange,
  onSegmentClick,
  onSegmentEdit
}) => {
  const timelineRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [hoverTime, setHoverTime] = useState(0)
  const [timelineWidth, setTimelineWidth] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // ✅ RESPONSIVE: Detectar tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < responsiveBreakpoint)
      if (timelineRef.current) {
        setTimelineWidth(timelineRef.current.offsetWidth)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [responsiveBreakpoint])

  // ✅ CÁLCULOS: Posições e escalas
  const timeToPixel = useCallback((time: number) => {
    return (time / duration) * timelineWidth
  }, [duration, timelineWidth])

  const pixelToTime = useCallback((pixel: number) => {
    return (pixel / timelineWidth) * duration
  }, [duration, timelineWidth])

  const currentPosition = useMemo(() => {
    return timeToPixel(currentTime)
  }, [currentTime, timeToPixel])

  // ✅ HANDLERS: Interações do usuário
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const newTime = pixelToTime(clickX)
    
    if (onSeek) {
      onSeek(Math.max(0, Math.min(duration, newTime)))
    }
  }, [pixelToTime, duration, onSeek])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const hoverX = e.clientX - rect.left
    const newHoverTime = pixelToTime(hoverX)
    
    setHoverTime(Math.max(0, Math.min(duration, newHoverTime)))
  }, [pixelToTime, duration])

  const handlePlayPause = useCallback(() => {
    if (isPlaying && onPause) {
      onPause()
    } else if (!isPlaying && onPlay) {
      onPlay()
    }
  }, [isPlaying, onPlay, onPause])

  // ✅ RENDERIZAÇÃO: Segmentos da timeline
  const renderSegments = () => {
    return segments.map(segment => {
      const left = timeToPixel(segment.start)
      const width = timeToPixel(segment.end - segment.start)
      
      return (
        <div
          key={segment.id}
          className={`
            absolute top-0 h-full rounded cursor-pointer transition-all duration-200
            ${segment.type === 'video' ? 'bg-blue-500/70 hover:bg-blue-500/90' : ''}
            ${segment.type === 'audio' ? 'bg-green-500/70 hover:bg-green-500/90' : ''}
            ${segment.type === 'caption' ? 'bg-purple-500/70 hover:bg-purple-500/90' : ''}
            ${segment.type === 'effect' ? 'bg-yellow-500/70 hover:bg-yellow-500/90' : ''}
            hover:scale-105 hover:z-10
          `}
          style={{
            left: `${left}px`,
            width: `${width}px`,
            backgroundColor: segment.color
          }}
          onClick={(e) => {
            e.stopPropagation()
            if (onSegmentClick) onSegmentClick(segment)
          }}
          onDoubleClick={(e) => {
            e.stopPropagation()
            if (onSegmentEdit) onSegmentEdit(segment)
          }}
        >
          {/* Conteúdo do segmento */}
          {segment.content && (
            <div className="p-1 text-xs text-white font-medium truncate">
              {segment.content}
            </div>
          )}
          
          {/* Thumbnail se disponível */}
          {showThumbnails && segment.thumbnail && (
            <img 
              src={segment.thumbnail} 
              alt="Thumbnail"
              className="absolute inset-0 w-full h-full object-cover rounded opacity-30"
            />
          )}
        </div>
      )
    })
  }

  // ✅ RENDERIZAÇÃO: Playhead
  const renderPlayhead = () => (
    <div
      className="absolute top-0 w-0.5 h-full bg-red-500 z-20 transition-all duration-100"
      style={{ left: `${currentPosition}px` }}
    >
      {/* Indicador superior */}
      <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full shadow-lg" />
      
      {/* Linha */}
      <div className="w-full h-full bg-red-500 shadow-lg" />
      
      {/* Tempo atual */}
      <div className="absolute -bottom-8 -left-8 bg-black/80 text-white text-xs px-2 py-1 rounded">
        {formatTime(currentTime)}
      </div>
    </div>
  )

  // ✅ RENDERIZAÇÃO: Hover preview
  const renderHoverPreview = () => {
    if (!isHovering || isMobile) return null
    
    const hoverPosition = timeToPixel(hoverTime)
    
    return (
      <div
        className="absolute top-0 w-0.5 h-full bg-white/50 z-10 pointer-events-none"
        style={{ left: `${hoverPosition}px` }}
      >
        <div className="absolute -top-8 -left-8 bg-white text-black text-xs px-2 py-1 rounded shadow-lg">
          {formatTime(hoverTime)}
        </div>
      </div>
    )
  }

  return (
    <div className={`
      responsive-timeline w-full bg-gray-900 rounded-xl overflow-hidden shadow-2xl
      ${isMobile ? 'flex flex-col' : 'flex flex-row'}
    `}>
      
      {/* ✅ PLAYER INTEGRADO */}
      {videoUrl && (
        <div className={`
          player-section bg-black rounded-lg overflow-hidden relative
          ${isMobile ? 'w-full aspect-video mb-4' : 'w-1/3 aspect-video mr-4'}
        `}>
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            controls={false}
            muted={volume === 0}
          />
          
          {/* Overlay de controles */}
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Button
              onClick={handlePlayPause}
              className="bg-white/20 hover:bg-white/40 text-white rounded-full p-4"
            >
              {isPlaying ? '⏸️' : '▶️'}
            </Button>
          </div>
        </div>
      )}

      {/* ✅ TIMELINE SECTION */}
      <div className={`
        timeline-section flex-1 p-4
        ${isMobile ? 'min-h-[200px]' : 'min-h-[120px]'}
      `}>
        
        {/* Header com controles */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Button
              onClick={handlePlayPause}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              {isPlaying ? '⏸️ Pausar' : '▶️ Reproduzir'}
            </Button>
            
            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Controle de volume */}
          {!isMobile && (
            <div className="flex items-center space-x-2">
              <span className="text-white text-sm">🔊</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume * 100}
                onChange={(e) => onVolumeChange?.(Number(e.target.value) / 100)}
                className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Timeline principal */}
        <div
          ref={timelineRef}
          className="relative bg-gray-800 rounded-lg overflow-hidden cursor-pointer"
          style={{ height: `${height}px` }}
          onClick={handleTimelineClick}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Grid de tempo */}
          <div className="absolute inset-0 flex">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className="flex-1 border-r border-gray-700/50"
              >
                <div className="text-xs text-gray-400 p-1">
                  {formatTime((duration / 10) * i)}
                </div>
              </div>
            ))}
          </div>

          {/* Waveform se habilitado */}
          {showWaveform && (
            <div className="absolute inset-0 flex items-end justify-center opacity-30">
              {Array.from({ length: 100 }, (_, i) => (
                <div
                  key={i}
                  className="bg-blue-400 w-1 mx-px"
                  style={{ 
                    height: `${Math.random() * 60 + 10}%` 
                  }}
                />
              ))}
            </div>
          )}

          {/* Segmentos */}
          {renderSegments()}

          {/* Hover preview */}
          {renderHoverPreview()}

          {/* Playhead */}
          {renderPlayhead()}
        </div>

        {/* Informações dos segmentos */}
        {segments.length > 0 && (
          <div className="mt-4">
            <h4 className="text-white text-sm font-medium mb-2">Segmentos</h4>
            <div className={`
              grid gap-2
              ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}
            `}>
              {segments.map(segment => (
                <div
                  key={segment.id}
                  className="bg-gray-800 rounded p-2 cursor-pointer hover:bg-gray-700 transition-colors"
                  onClick={() => onSegmentClick?.(segment)}
                >
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-white text-xs font-medium">
                      {segment.type}
                    </span>
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    {formatTime(segment.start)} - {formatTime(segment.end)}
                  </div>
                  {segment.content && (
                    <div className="text-gray-300 text-xs mt-1 truncate">
                      {segment.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResponsiveTimeline 