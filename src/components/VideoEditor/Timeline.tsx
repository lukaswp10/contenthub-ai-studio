/**
 * 🎬 TIMELINE PROFISSIONAL - ClipsForge Pro
 * 
 * Timeline multi-track com React-Konva, zoom, playhead sincronizado
 * 
 * @version 1.0.0
 * @author ClipsForge Team
 */

import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer, Rect, Text, Line, Group, Circle } from 'react-konva';
import Konva from 'konva';
import { 
  TimelineState, 
  TimelineTrack, 
  VideoSegment, 
  AudioSegment, 
  Subtitle, 
  Overlay,
  TimelineMarker,
  TimelineEvent,
  Point
} from '../../types/video-editor';

// ===== TIPOS =====

export interface TimelineProps {
  width: number;
  height: number;
  timeline: TimelineState;
  
  // Callbacks
  onTimelineUpdate?: (timeline: TimelineState) => void;
  onSeek?: (time: number) => void;
  onSelectionChange?: (selectedItems: string[]) => void;
  onItemUpdate?: (trackId: string, itemId: string, updates: any) => void;
  onTrackUpdate?: (trackId: string, updates: Partial<TimelineTrack>) => void;
  onMarkerAdd?: (time: number, label: string) => void;
  onEvent?: (event: TimelineEvent) => void;
  
  // Configurações
  pixelsPerSecond?: number;
  trackHeight?: number;
  rulerHeight?: number;
  backgroundColor?: string;
  playheadColor?: string;
  selectionColor?: string;
  
  // Interação
  allowDrag?: boolean;
  allowResize?: boolean;
  allowSelection?: boolean;
  snapToGrid?: boolean;
  snapThreshold?: number;
  
  className?: string;
  style?: React.CSSProperties;
}

export interface TimelineRef {
  // Navegação
  seek: (time: number) => void;
  zoom: (factor: number) => void;
  scrollTo: (time: number) => void;
  
  // Seleção
  selectItems: (itemIds: string[]) => void;
  clearSelection: () => void;
  
  // Tracks
  addTrack: (track: TimelineTrack) => void;
  removeTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<TimelineTrack>) => void;
  
  // Items
  addItem: (trackId: string, item: VideoSegment | AudioSegment | Subtitle | Overlay) => void;
  removeItem: (trackId: string, itemId: string) => void;
  updateItem: (trackId: string, itemId: string, updates: any) => void;
  
  // Markers
  addMarker: (time: number, label: string) => void;
  removeMarker: (markerId: string) => void;
  
  // Utilitários
  getItemAt: (trackId: string, time: number) => any | null;
  getTimeline: () => TimelineState;
  captureFrame: () => string;
}

// ===== CONSTANTES =====

const COLORS = {
  video: '#3B82F6',
  audio: '#10B981',
  subtitle: '#F59E0B',
  overlay: '#8B5CF6',
  background: '#1F2937',
  track: '#374151',
  trackSelected: '#4B5563',
  playhead: '#EF4444',
  selection: '#3B82F6',
  marker: '#F59E0B',
  ruler: '#6B7280',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF'
};

// ===== COMPONENT =====

const Timeline = forwardRef<TimelineRef, TimelineProps>(({
  width,
  height,
  timeline,
  
  onTimelineUpdate,
  onSeek,
  onSelectionChange,
  onItemUpdate,
  onTrackUpdate,
  onMarkerAdd,
  onEvent,
  
  pixelsPerSecond = 50,
  trackHeight = 80,
  rulerHeight = 30,
  backgroundColor = COLORS.background,
  playheadColor = COLORS.playhead,
  selectionColor = COLORS.selection,
  
  allowDrag = true,
  allowResize = true,
  allowSelection = true,
  snapToGrid = true,
  snapThreshold = 10,
  
  className = '',
  style = {}
}, ref) => {
  
  // ===== REFS =====
  
  const stageRef = useRef<Konva.Stage>(null);
  const rulerLayerRef = useRef<Konva.Layer>(null);
  const tracksLayerRef = useRef<Konva.Layer>(null);
  const playheadLayerRef = useRef<Konva.Layer>(null);
  const selectionLayerRef = useRef<Konva.Layer>(null);
  
  // ===== STATE =====
  
  const [currentTimeline, setCurrentTimeline] = useState<TimelineState>(timeline);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<Point>({ x: 0, y: 0 });
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0, y: 0, visible: false
  });
  
  // ===== CALCULATIONS =====
  
  const timeToPixels = useCallback((time: number) => {
    return time * pixelsPerSecond * currentTimeline.zoom - currentTimeline.scrollX;
  }, [pixelsPerSecond, currentTimeline.zoom, currentTimeline.scrollX]);
  
  const pixelsToTime = useCallback((pixels: number) => {
    return (pixels + currentTimeline.scrollX) / (pixelsPerSecond * currentTimeline.zoom);
  }, [pixelsPerSecond, currentTimeline.zoom, currentTimeline.scrollX]);
  
  const getTrackY = useCallback((trackIndex: number) => {
    return rulerHeight + trackIndex * trackHeight;
  }, [rulerHeight, trackHeight]);
  
  const getItemWidth = useCallback((item: VideoSegment | AudioSegment | Subtitle | Overlay) => {
    const duration = 'duration' in item ? item.duration : (item.endTime - item.startTime);
    return duration * pixelsPerSecond * currentTimeline.zoom;
  }, [pixelsPerSecond, currentTimeline.zoom]);
  
  const snapToGridTime = useCallback((time: number) => {
    if (!snapToGrid) return time;
    
    const gridSize = 1 / currentTimeline.zoom;
    return Math.round(time / gridSize) * gridSize;
  }, [snapToGrid, currentTimeline.zoom]);
  
  // ===== EMIT EVENT =====
  
  const emitEvent = useCallback((type: TimelineEvent['type'], data: any = null) => {
    const event: TimelineEvent = {
      type,
      data,
      timestamp: Date.now()
    };
    
    if (onEvent) {
      onEvent(event);
    }
  }, [onEvent]);
  
  // ===== RENDER RULER =====
  
  const renderRuler = useCallback(() => {
    const elements: JSX.Element[] = [];
    const startTime = pixelsToTime(0);
    const endTime = pixelsToTime(width);
    
    // Background
    elements.push(
      <Rect
        key="ruler-bg"
        x={0}
        y={0}
        width={width}
        height={rulerHeight}
        fill={COLORS.track}
        stroke={COLORS.ruler}
        strokeWidth={1}
      />
    );
    
    // Time markers
    const interval = currentTimeline.zoom > 2 ? 0.1 : currentTimeline.zoom > 1 ? 0.5 : 1;
    
    for (let time = Math.floor(startTime); time <= Math.ceil(endTime); time += interval) {
      const x = timeToPixels(time);
      if (x >= 0 && x <= width) {
        const isSecond = time % 1 === 0;
        const height = isSecond ? rulerHeight - 5 : rulerHeight - 15;
        
        elements.push(
          <Line
            key={`ruler-line-${time}`}
            points={[x, rulerHeight - height, x, rulerHeight]}
            stroke={COLORS.ruler}
            strokeWidth={1}
          />
        );
        
        if (isSecond) {
          elements.push(
            <Text
              key={`ruler-text-${time}`}
              x={x + 5}
              y={5}
              text={`${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`}
              fontSize={12}
              fill={COLORS.textSecondary}
            />
          );
        }
      }
    }
    
    return elements;
  }, [width, rulerHeight, pixelsToTime, timeToPixels, currentTimeline.zoom]);
  
  // ===== RENDER TRACKS =====
  
  const renderTracks = useCallback(() => {
    const elements: JSX.Element[] = [];
    
    currentTimeline.tracks.forEach((track, trackIndex) => {
      const y = getTrackY(trackIndex);
      
      // Track background
      elements.push(
        <Rect
          key={`track-bg-${track.id}`}
          x={0}
          y={y}
          width={width}
          height={trackHeight}
          fill={track.locked ? COLORS.trackSelected : COLORS.track}
          stroke={COLORS.ruler}
          strokeWidth={1}
          opacity={track.visible ? 1 : 0.5}
        />
      );
      
      // Track label
      elements.push(
        <Text
          key={`track-label-${track.id}`}
          x={10}
          y={y + 10}
          text={track.name}
          fontSize={14}
          fill={COLORS.text}
          fontStyle={track.locked ? 'italic' : 'normal'}
        />
      );
      
      // Track items
      track.items.forEach((item, itemIndex) => {
        const itemX = timeToPixels(item.startTime);
        const itemWidth = getItemWidth(item);
        const itemY = y + 25;
        const itemHeight = trackHeight - 35;
        
        if (itemX + itemWidth >= 0 && itemX <= width) {
          const isSelected = currentTimeline.selectedItems.includes(item.id);
          const isHovered = hoveredItem === item.id;
          
          // Item background
          elements.push(
            <Rect
              key={`item-bg-${item.id}`}
              x={itemX}
              y={itemY}
              width={itemWidth}
              height={itemHeight}
              fill={COLORS[track.type as keyof typeof COLORS] || COLORS.video}
              stroke={isSelected ? selectionColor : COLORS.ruler}
              strokeWidth={isSelected ? 3 : 1}
              opacity={isHovered ? 0.8 : 0.6}
              cornerRadius={4}
              draggable={allowDrag && !track.locked}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={(e) => {
                setIsDragging(false);
                const newStartTime = snapToGridTime(pixelsToTime(e.target.x()));
                const newEndTime = newStartTime + (item.endTime - item.startTime);
                
                if (onItemUpdate) {
                  onItemUpdate(track.id, item.id, {
                    startTime: newStartTime,
                    endTime: newEndTime
                  });
                }
                
                emitEvent('update', { trackId: track.id, itemId: item.id, type: 'move' });
              }}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => {
                if (allowSelection) {
                  const newSelection = isSelected 
                    ? currentTimeline.selectedItems.filter(id => id !== item.id)
                    : [...currentTimeline.selectedItems, item.id];
                  
                  setCurrentTimeline(prev => ({
                    ...prev,
                    selectedItems: newSelection
                  }));
                  
                  if (onSelectionChange) {
                    onSelectionChange(newSelection);
                  }
                  
                  emitEvent('select', { itemId: item.id, selected: !isSelected });
                }
              }}
            />
          );
          
          // Item text
          let itemText = '';
          if ('text' in item) {
            itemText = item.text;
          } else if ('name' in item) {
            itemText = item.name || 'Untitled';
          } else {
            itemText = `${track.type} ${itemIndex + 1}`;
          }
          
          elements.push(
            <Text
              key={`item-text-${item.id}`}
              x={itemX + 5}
              y={itemY + 5}
              text={itemText}
              fontSize={12}
              fill={COLORS.text}
              width={itemWidth - 10}
              ellipsis={true}
            />
          );
          
          // Resize handles
          if (allowResize && isSelected && !track.locked) {
            // Left handle
            elements.push(
              <Rect
                key={`resize-left-${item.id}`}
                x={itemX - 3}
                y={itemY}
                width={6}
                height={itemHeight}
                fill={selectionColor}
                draggable={true}
                onDragMove={(e) => {
                  const newStartTime = snapToGridTime(pixelsToTime(e.target.x() + 3));
                  if (newStartTime < item.endTime) {
                    if (onItemUpdate) {
                      onItemUpdate(track.id, item.id, { startTime: newStartTime });
                    }
                  }
                }}
              />
            );
            
            // Right handle
            elements.push(
              <Rect
                key={`resize-right-${item.id}`}
                x={itemX + itemWidth - 3}
                y={itemY}
                width={6}
                height={itemHeight}
                fill={selectionColor}
                draggable={true}
                onDragMove={(e) => {
                  const newEndTime = snapToGridTime(pixelsToTime(e.target.x() + 3));
                  if (newEndTime > item.startTime) {
                    if (onItemUpdate) {
                      onItemUpdate(track.id, item.id, { endTime: newEndTime });
                    }
                  }
                }}
              />
            );
          }
        }
      });
    });
    
    return elements;
  }, [currentTimeline, width, trackHeight, getTrackY, timeToPixels, getItemWidth, 
      allowDrag, allowResize, allowSelection, snapToGridTime, selectionColor, 
      hoveredItem, onItemUpdate, onSelectionChange, emitEvent, pixelsToTime]);
  
  // ===== RENDER PLAYHEAD =====
  
  const renderPlayhead = useCallback(() => {
    const x = timeToPixels(currentTimeline.currentTime);
    
    if (x >= 0 && x <= width) {
      return (
        <Group key="playhead">
          <Line
            points={[x, 0, x, height]}
            stroke={playheadColor}
            strokeWidth={2}
          />
          <Circle
            x={x}
            y={rulerHeight / 2}
            radius={8}
            fill={playheadColor}
            stroke={COLORS.background}
            strokeWidth={2}
          />
        </Group>
      );
    }
    
    return null;
  }, [currentTimeline.currentTime, timeToPixels, width, height, playheadColor, rulerHeight]);
  
  // ===== RENDER MARKERS =====
  
  const renderMarkers = useCallback(() => {
    const elements: JSX.Element[] = [];
    
    currentTimeline.markers.forEach(marker => {
      const x = timeToPixels(marker.time);
      
      if (x >= 0 && x <= width) {
        elements.push(
          <Group key={`marker-${marker.id}`}>
            <Line
              points={[x, rulerHeight, x, height]}
              stroke={marker.color || COLORS.marker}
              strokeWidth={1}
              dash={[5, 5]}
            />
            <Circle
              x={x}
              y={rulerHeight - 10}
              radius={6}
              fill={marker.color || COLORS.marker}
              stroke={COLORS.background}
              strokeWidth={1}
            />
            <Text
              x={x + 10}
              y={rulerHeight - 15}
              text={marker.label}
              fontSize={10}
              fill={COLORS.text}
            />
          </Group>
        );
      }
    });
    
    return elements;
  }, [currentTimeline.markers, timeToPixels, width, height, rulerHeight]);
  
  // ===== MOUSE EVENTS =====
  
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    
    // Click on ruler = seek
    if (pos.y <= rulerHeight) {
      const time = pixelsToTime(pos.x);
      setCurrentTimeline(prev => ({
        ...prev,
        currentTime: time
      }));
      
      if (onSeek) {
        onSeek(time);
      }
      
      emitEvent('seek', { time });
    }
  }, [rulerHeight, pixelsToTime, onSeek, emitEvent]);
  
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    const scaleBy = 1.1;
    const newZoom = e.evt.deltaY > 0 
      ? currentTimeline.zoom / scaleBy 
      : currentTimeline.zoom * scaleBy;
    
    const clampedZoom = Math.max(0.1, Math.min(10, newZoom));
    
    setCurrentTimeline(prev => ({
      ...prev,
      zoom: clampedZoom
    }));
    
    emitEvent('zoom', { zoom: clampedZoom });
  }, [currentTimeline.zoom, emitEvent]);
  
  // ===== KEYBOARD EVENTS =====
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Delete selected items
        if (currentTimeline.selectedItems.length > 0) {
          currentTimeline.tracks.forEach(track => {
            track.items = track.items.filter(item => !currentTimeline.selectedItems.includes(item.id));
          });
          
          setCurrentTimeline(prev => ({
            ...prev,
            selectedItems: []
          }));
          
          if (onSelectionChange) {
            onSelectionChange([]);
          }
          
          emitEvent('remove', { itemIds: currentTimeline.selectedItems });
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTimeline.selectedItems, currentTimeline.tracks, onSelectionChange, emitEvent]);
  
  // ===== SYNC TIMELINE =====
  
  useEffect(() => {
    setCurrentTimeline(timeline);
  }, [timeline]);
  
  useEffect(() => {
    if (onTimelineUpdate) {
      onTimelineUpdate(currentTimeline);
    }
  }, [currentTimeline, onTimelineUpdate]);
  
  // ===== IMPERATIVE HANDLE =====
  
  useImperativeHandle(ref, () => ({
    // Navegação
    seek: (time: number) => {
      setCurrentTimeline(prev => ({ ...prev, currentTime: time }));
      if (onSeek) onSeek(time);
    },
    
    zoom: (factor: number) => {
      setCurrentTimeline(prev => ({ ...prev, zoom: Math.max(0.1, Math.min(10, factor)) }));
    },
    
    scrollTo: (time: number) => {
      const x = time * pixelsPerSecond * currentTimeline.zoom;
      setCurrentTimeline(prev => ({ ...prev, scrollX: x }));
    },
    
    // Seleção
    selectItems: (itemIds: string[]) => {
      setCurrentTimeline(prev => ({ ...prev, selectedItems: itemIds }));
      if (onSelectionChange) onSelectionChange(itemIds);
    },
    
    clearSelection: () => {
      setCurrentTimeline(prev => ({ ...prev, selectedItems: [] }));
      if (onSelectionChange) onSelectionChange([]);
    },
    
    // Tracks
    addTrack: (track: TimelineTrack) => {
      setCurrentTimeline(prev => ({
        ...prev,
        tracks: [...prev.tracks, track]
      }));
    },
    
    removeTrack: (trackId: string) => {
      setCurrentTimeline(prev => ({
        ...prev,
        tracks: prev.tracks.filter(t => t.id !== trackId)
      }));
    },
    
    updateTrack: (trackId: string, updates: Partial<TimelineTrack>) => {
      setCurrentTimeline(prev => ({
        ...prev,
        tracks: prev.tracks.map(t => t.id === trackId ? { ...t, ...updates } : t)
      }));
    },
    
    // Items
    addItem: (trackId: string, item: any) => {
      setCurrentTimeline(prev => ({
        ...prev,
        tracks: prev.tracks.map(t => 
          t.id === trackId 
            ? { ...t, items: [...t.items, item] }
            : t
        )
      }));
    },
    
    removeItem: (trackId: string, itemId: string) => {
      setCurrentTimeline(prev => ({
        ...prev,
        tracks: prev.tracks.map(t => 
          t.id === trackId 
            ? { ...t, items: t.items.filter(i => i.id !== itemId) }
            : t
        )
      }));
    },
    
    updateItem: (trackId: string, itemId: string, updates: any) => {
      setCurrentTimeline(prev => ({
        ...prev,
        tracks: prev.tracks.map(t => 
          t.id === trackId 
            ? { ...t, items: t.items.map(i => i.id === itemId ? { ...i, ...updates } : i) }
            : t
        )
      }));
    },
    
    // Markers
    addMarker: (time: number, label: string) => {
      const marker: TimelineMarker = {
        id: `marker-${Date.now()}`,
        time,
        label,
        color: COLORS.marker
      };
      
      setCurrentTimeline(prev => ({
        ...prev,
        markers: [...prev.markers, marker]
      }));
    },
    
    removeMarker: (markerId: string) => {
      setCurrentTimeline(prev => ({
        ...prev,
        markers: prev.markers.filter(m => m.id !== markerId)
      }));
    },
    
    // Utilitários
    getItemAt: (trackId: string, time: number) => {
      const track = currentTimeline.tracks.find(t => t.id === trackId);
      if (!track) return null;
      
      return track.items.find(item => 
        time >= item.startTime && time <= item.endTime
      ) || null;
    },
    
    getTimeline: () => currentTimeline,
    
    captureFrame: () => {
      const stage = stageRef.current;
      if (!stage) return '';
      return stage.toDataURL();
    }
  }));
  
  // ===== RENDER =====
  
  return (
    <div 
      className={`timeline-container ${className}`}
      style={{
        width,
        height,
        backgroundColor,
        ...style
      }}
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onWheel={handleWheel}
        onClick={handleStageClick}
      >
        {/* Ruler Layer */}
        <Layer ref={rulerLayerRef}>
          {renderRuler()}
        </Layer>
        
        {/* Tracks Layer */}
        <Layer ref={tracksLayerRef}>
          {renderTracks()}
        </Layer>
        
        {/* Markers Layer */}
        <Layer>
          {renderMarkers()}
        </Layer>
        
        {/* Playhead Layer */}
        <Layer ref={playheadLayerRef}>
          {renderPlayhead()}
        </Layer>
      </Stage>
      
      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs p-2 rounded">
          <div>Time: {currentTimeline.currentTime.toFixed(2)}s</div>
          <div>Zoom: {currentTimeline.zoom.toFixed(2)}x</div>
          <div>Scroll: {currentTimeline.scrollX.toFixed(0)}px</div>
          <div>Selected: {currentTimeline.selectedItems.length}</div>
          <div>Tracks: {currentTimeline.tracks.length}</div>
        </div>
      )}
    </div>
  );
});

Timeline.displayName = 'Timeline';

export default Timeline; 