/**
 * 🎬 TIMELINE PROFISSIONAL UNIFICADA - ClipsForge Pro
 * 
 * Timeline principal inspirada no Opus Clips com:
 * - ✅ Drag & drop de segmentos
 * - ✅ Multi-track support
 * - ✅ Zoom e navegação
 * - ✅ Controles profissionais
 * - ✅ Compatibilidade total
 * 
 * @author ClipsForge Team
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '../../ui/button';
import { useVideoEditorStore } from '../../../stores/videoEditorStore';
import { TimelineTrack, VideoSegment, Subtitle, Overlay } from '../../../types/video-editor';
import { 
  Play, 
  Pause, 
  Square, 
  ZoomIn, 
  ZoomOut, 
  SkipBack, 
  SkipForward,
  Scissors,
  Plus,
  Minus,
  Grid,
  Volume2,
  Eye,
  EyeOff,
  Lock,
  Unlock
} from 'lucide-react';

// ===== INTERFACES =====

interface ProfessionalTimelineProps {
  width?: number;
  height?: number;
  className?: string;
  // Compatibilidade com sistema existente
  onSeek?: (time: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onCut?: (time: number) => void;
  // Novos recursos
  onSegmentDrag?: (segmentId: string, newTime: number, trackId: string) => void;
  onSegmentResize?: (segmentId: string, newStart: number, newEnd: number) => void;
  onSegmentSelect?: (segmentId: string) => void;
}

interface TimelineSegment {
  id: string;
  startTime: number;
  endTime: number;
  trackId: string;
  type: 'video' | 'audio' | 'caption' | 'effect';
  name: string;
  color: string;
  content?: string;
  thumbnail?: string;
  draggable: boolean;
  resizable: boolean;
  selected: boolean;
}

interface TimelineTrackUI {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'caption' | 'effect';
  height: number;
  visible: boolean;
  locked: boolean;
  muted?: boolean;
  volume?: number;
  color: string;
  segments: TimelineSegment[];
}

// ===== CONSTANTES =====

const TIMELINE_HEIGHT = 300;
const TRACK_HEIGHT = 60;
const RULER_HEIGHT = 40;
const ZOOM_LEVELS = [0.25, 0.5, 1, 2, 4, 8, 16];
const SNAP_THRESHOLD = 8; // pixels

// ===== COMPONENTE PRINCIPAL =====

export const ProfessionalTimeline: React.FC<ProfessionalTimelineProps> = ({
  width = 1200,
  height = TIMELINE_HEIGHT,
  className = '',
  onSeek,
  onPlay,
  onPause,
  onCut,
  onSegmentDrag,
  onSegmentResize,
  onSegmentSelect
}) => {
  // ===== STORE =====
  const {
    currentTime,
    duration,
    isPlaying,
    tracks,
    selectedItems,
    zoom,
    scrollX,
    markers,
    inPoint,
    outPoint,
    setCurrentTime,
    setZoom,
    setScrollX,
    selectItems,
    addMarker
  } = useVideoEditorStore();

  // ===== REFS =====
  const timelineRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const tracksRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);

  // ===== ESTADO LOCAL =====
  const [localZoom, setLocalZoom] = useState(zoom);
  const [localScrollX, setLocalScrollX] = useState(scrollX);
  const [isDragging, setIsDragging] = useState(false);
  const [dragData, setDragData] = useState<{
    segmentId: string;
    startX: number;
    startTime: number;
    trackId: string;
  } | null>(null);
  const [hoverTime, setHoverTime] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);

  // ===== CÁLCULOS =====
  
  const pixelsPerSecond = useMemo(() => {
    return (width - 200) / duration * localZoom; // 200px para track labels
  }, [width, duration, localZoom]);

  const timeToPixel = useCallback((time: number) => {
    return (time * pixelsPerSecond) - localScrollX;
  }, [pixelsPerSecond, localScrollX]);

  const pixelToTime = useCallback((pixel: number) => {
    return (pixel + localScrollX) / pixelsPerSecond;
  }, [pixelsPerSecond, localScrollX]);

  const visibleTimeRange = useMemo(() => {
    const start = Math.max(0, pixelToTime(0));
    const end = Math.min(duration, pixelToTime(width - 200));
    return { start, end };
  }, [pixelToTime, width, duration]);

  // ===== CONVERSÃO DE DADOS =====
  
  const timelineTracks = useMemo((): TimelineTrackUI[] => {
    return tracks.map(track => ({
      id: track.id,
      name: track.name,
      type: track.type as 'video' | 'audio' | 'caption' | 'effect',
      height: TRACK_HEIGHT,
      visible: track.visible,
      locked: track.locked,
      muted: track.muted,
      volume: track.volume,
      color: track.color || '#3b82f6',
      segments: track.items.map(item => ({
        id: item.id,
        startTime: item.startTime,
        endTime: item.endTime,
        trackId: track.id,
        type: track.type as 'video' | 'audio' | 'caption' | 'effect',
        name: item.name || `${track.type} segment`,
        color: getSegmentColor(track.type),
        content: (item as any).text || (item as any).name,
        thumbnail: (item as any).thumbnail,
        draggable: !track.locked,
        resizable: !track.locked,
        selected: selectedItems.includes(item.id)
      }))
    }));
  }, [tracks, selectedItems]);

  // ===== FUNÇÕES AUXILIARES =====

  const getSegmentColor = (type: string): string => {
    switch (type) {
      case 'video': return '#3b82f6';
      case 'audio': return '#10b981';
      case 'caption': return '#8b5cf6';
      case 'effect': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const frames = Math.floor((time % 1) * 30); // 30fps
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  const snapTime = (time: number): number => {
    if (!snapToGrid) return time;
    
    const gridSize = 1; // 1 segundo
    return Math.round(time / gridSize) * gridSize;
  };

  // ===== HANDLERS =====

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left - 200; // Offset para labels
    const newTime = pixelToTime(clickX);
    const snappedTime = snapTime(Math.max(0, Math.min(duration, newTime)));
    
    setCurrentTime(snappedTime);
    if (onSeek) onSeek(snappedTime);
  }, [pixelToTime, duration, snapTime, setCurrentTime, onSeek]);

  const handleZoomIn = useCallback(() => {
    const currentIndex = ZOOM_LEVELS.indexOf(localZoom);
    const nextIndex = Math.min(currentIndex + 1, ZOOM_LEVELS.length - 1);
    const newZoom = ZOOM_LEVELS[nextIndex];
    setLocalZoom(newZoom);
    setZoom(newZoom);
  }, [localZoom, setZoom]);

  const handleZoomOut = useCallback(() => {
    const currentIndex = ZOOM_LEVELS.indexOf(localZoom);
    const nextIndex = Math.max(currentIndex - 1, 0);
    const newZoom = ZOOM_LEVELS[nextIndex];
    setLocalZoom(newZoom);
    setZoom(newZoom);
  }, [localZoom, setZoom]);

  const handleScroll = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    if (e.ctrlKey || e.metaKey) {
      // Zoom com Ctrl+Scroll
      if (e.deltaY > 0) {
        handleZoomOut();
      } else {
        handleZoomIn();
      }
    } else {
      // Scroll horizontal
      const newScrollX = Math.max(0, localScrollX + e.deltaX);
      setLocalScrollX(newScrollX);
      setScrollX(newScrollX);
    }
  }, [localScrollX, setScrollX, handleZoomIn, handleZoomOut]);

  const handleSegmentMouseDown = useCallback((e: React.MouseEvent, segment: TimelineSegment) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!segment.draggable) return;
    
    setDragData({
      segmentId: segment.id,
      startX: e.clientX,
      startTime: segment.startTime,
      trackId: segment.trackId
    });
    setIsDragging(true);
    
    // Selecionar segmento
    selectItems([segment.id]);
    if (onSegmentSelect) onSegmentSelect(segment.id);
  }, [selectItems, onSegmentSelect]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragData) return;
    
    const deltaX = e.clientX - dragData.startX;
    const deltaTime = deltaX / pixelsPerSecond;
    const newTime = snapTime(Math.max(0, dragData.startTime + deltaTime));
    
    // Atualizar posição visual (otimista)
    // A atualização real será feita no onSegmentDrag
    
    if (onSegmentDrag) {
      onSegmentDrag(dragData.segmentId, newTime, dragData.trackId);
    }
  }, [isDragging, dragData, pixelsPerSecond, snapTime, onSegmentDrag]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragData(null);
  }, []);

  // ===== EFFECTS =====

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // ===== RENDERIZAÇÃO =====

  const renderRuler = () => {
    const { start, end } = visibleTimeRange;
    const majorTicks = [];
    const minorTicks = [];
    
    // Calcular intervalo das marcações baseado no zoom
    const interval = localZoom >= 4 ? 0.1 : localZoom >= 2 ? 0.5 : localZoom >= 1 ? 1 : 5;
    
    for (let time = Math.floor(start / interval) * interval; time <= end; time += interval) {
      const x = timeToPixel(time);
      const isMajor = time % 1 === 0;
      
      if (isMajor) {
        majorTicks.push(
          <div
            key={`major-${time}`}
            className="absolute top-0 bottom-0 w-px bg-gray-300"
            style={{ left: x + 200 }}
          >
            <span className="absolute top-1 left-1 text-xs text-gray-400 font-mono">
              {formatTime(time)}
            </span>
          </div>
        );
      } else {
        minorTicks.push(
          <div
            key={`minor-${time}`}
            className="absolute top-6 bottom-0 w-px bg-gray-500 opacity-50"
            style={{ left: x + 200 }}
          />
        );
      }
    }
    
    return (
      <div className="relative h-10 bg-gray-800 border-b border-gray-600">
        {minorTicks}
        {majorTicks}
      </div>
    );
  };

  const renderPlayhead = () => {
    const x = timeToPixel(currentTime);
    
    return (
      <div
        ref={playheadRef}
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
        style={{ left: x + 200 }}
      >
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
      </div>
    );
  };

  const renderTrack = (track: TimelineTrackUI) => {
    return (
      <div
        key={track.id}
        className="relative border-b border-gray-600"
        style={{ height: track.height }}
      >
        {/* Track Header */}
        <div className="absolute left-0 top-0 w-48 h-full bg-gray-800 border-r border-gray-600 p-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {/* toggle visibility */}}
              className="p-1 h-6 w-6"
            >
              {track.visible ? <Eye size={12} /> : <EyeOff size={12} />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {/* toggle lock */}}
              className="p-1 h-6 w-6"
            >
              {track.locked ? <Lock size={12} /> : <Unlock size={12} />}
            </Button>
          </div>
          <div className="flex-1 text-center">
            <div className="text-sm font-medium text-white truncate">{track.name}</div>
            <div className="text-xs text-gray-400">{track.type}</div>
          </div>
        </div>
        
        {/* Track Content */}
        <div className="ml-48 relative h-full bg-gray-900">
          {/* Grid */}
          {showGrid && (
            <div className="absolute inset-0 opacity-20">
              {/* Grid lines serão renderizadas aqui */}
            </div>
          )}
          
          {/* Segments */}
          {track.segments.map(segment => {
            const x = timeToPixel(segment.startTime);
            const width = timeToPixel(segment.endTime) - timeToPixel(segment.startTime);
            
            if (x + width < 0 || x > width) return null; // Culling
            
            return (
              <div
                key={segment.id}
                className={`
                  absolute top-1 bottom-1 rounded cursor-pointer transition-all duration-200
                  ${segment.selected ? 'ring-2 ring-blue-400' : ''}
                  ${segment.draggable ? 'hover:brightness-110' : 'opacity-50'}
                `}
                style={{
                  left: x,
                  width: Math.max(width, 20), // Largura mínima
                  backgroundColor: segment.color,
                }}
                onMouseDown={(e) => handleSegmentMouseDown(e, segment)}
                title={`${segment.name} (${formatTime(segment.startTime)} - ${formatTime(segment.endTime)})`}
              >
                {/* Segment Content */}
                <div className="p-1 text-xs text-white font-medium truncate">
                  {segment.content || segment.name}
                </div>
                
                {/* Resize Handles */}
                {segment.resizable && (
                  <>
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 cursor-ew-resize opacity-0 hover:opacity-100" />
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500 cursor-ew-resize opacity-0 hover:opacity-100" />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMarkers = () => {
    const markerElements = [];
    
    // In Point
    if (inPoint !== undefined) {
      const x = timeToPixel(inPoint);
      markerElements.push(
        <div
          key="in-point"
          className="absolute top-0 bottom-0 w-0.5 bg-green-500 z-20"
          style={{ left: x + 200 }}
        >
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-green-500 rounded-full border border-white" />
        </div>
      );
    }
    
    // Out Point
    if (outPoint !== undefined) {
      const x = timeToPixel(outPoint);
      markerElements.push(
        <div
          key="out-point"
          className="absolute top-0 bottom-0 w-0.5 bg-red-600 z-20"
          style={{ left: x + 200 }}
        >
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-600 rounded-full border border-white" />
        </div>
      );
    }
    
    return markerElements;
  };

  // ===== RENDER PRINCIPAL =====

  return (
    <div
      className={`professional-timeline bg-gray-900 border border-gray-600 rounded-lg overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-600">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPlay}
            disabled={isPlaying}
            className="p-1 h-8 w-8"
          >
            <Play size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onPause}
            disabled={!isPlaying}
            className="p-1 h-8 w-8"
          >
            <Pause size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentTime(0)}
            className="p-1 h-8 w-8"
          >
            <Square size={16} />
          </Button>
          
          <div className="w-px h-6 bg-gray-600" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={localZoom <= ZOOM_LEVELS[0]}
            className="p-1 h-8 w-8"
          >
            <ZoomOut size={16} />
          </Button>
          <span className="text-xs text-gray-400 font-mono min-w-[3rem] text-center">
            {(localZoom * 100).toFixed(0)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={localZoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
            className="p-1 h-8 w-8"
          >
            <ZoomIn size={16} />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1 h-8 w-8 ${showGrid ? 'bg-gray-700' : ''}`}
          >
            <Grid size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`p-1 h-8 w-8 ${snapToGrid ? 'bg-gray-700' : ''}`}
          >
            <Plus size={16} />
          </Button>
          
          <div className="text-xs text-gray-400 font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>
      
      {/* Timeline Content */}
      <div
        ref={timelineRef}
        className="relative overflow-hidden"
        style={{ height: height - 48 }} // Subtract toolbar height
        onClick={handleTimelineClick}
        onWheel={handleScroll}
      >
        {/* Ruler */}
        {renderRuler()}
        
        {/* Tracks */}
        <div ref={tracksRef} className="relative">
          {timelineTracks.map(renderTrack)}
        </div>
        
        {/* Markers */}
        {renderMarkers()}
        
        {/* Playhead */}
        {renderPlayhead()}
      </div>
    </div>
  );
};

export default ProfessionalTimeline; 