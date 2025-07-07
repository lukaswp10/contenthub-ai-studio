/**
 * 🎬 TIMELINE DRAG & DROP HOOK - ClipsForge Pro
 * 
 * Hook customizado para arrastar e soltar segmentos com:
 * - ✅ Snap magnético
 * - ✅ Detecção de colisão
 * - ✅ Multi-track support
 * - ✅ Performance otimizada
 * 
 * @author ClipsForge Team
 * @version 1.0.0
 */

import { useState, useCallback, useRef } from 'react';

interface DragState {
  isDragging: boolean;
  segmentId: string | null;
  startX: number;
  startTime: number;
  trackId: string;
  offsetX: number;
  snapPoints: number[];
}

interface DragCallbacks {
  onDragStart?: (segmentId: string, trackId: string) => void;
  onDragMove?: (segmentId: string, newTime: number, trackId: string) => void;
  onDragEnd?: (segmentId: string, finalTime: number, trackId: string) => void;
  onSnapHighlight?: (snapTime: number | null) => void;
}

interface TimelineSegment {
  id: string;
  startTime: number;
  endTime: number;
  trackId: string;
  draggable: boolean;
}

interface UseTimelineDragDropProps {
  segments: TimelineSegment[];
  pixelsPerSecond: number;
  snapThreshold?: number;
  snapToGrid?: boolean;
  gridSize?: number;
  callbacks?: DragCallbacks;
}

export const useTimelineDragDrop = ({
  segments,
  pixelsPerSecond,
  snapThreshold = 8,
  snapToGrid = true,
  gridSize = 1,
  callbacks
}: UseTimelineDragDropProps) => {
  
  // ===== STATE =====
  
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    segmentId: null,
    startX: 0,
    startTime: 0,
    trackId: '',
    offsetX: 0,
    snapPoints: []
  });
  
  const [snapPreview, setSnapPreview] = useState<number | null>(null);
  const dragStartRef = useRef<{ x: number; time: number } | null>(null);
  
  // ===== HELPERS =====
  
  const pixelToTime = useCallback((pixel: number): number => {
    return pixel / pixelsPerSecond;
  }, [pixelsPerSecond]);
  
  const timeToPixel = useCallback((time: number): number => {
    return time * pixelsPerSecond;
  }, [pixelsPerSecond]);
  
  const generateSnapPoints = useCallback((excludeSegmentId?: string): number[] => {
    const points: number[] = [];
    
    // Snap points dos segmentos
    segments.forEach(segment => {
      if (segment.id !== excludeSegmentId) {
        points.push(segment.startTime);
        points.push(segment.endTime);
      }
    });
    
    // Snap points da grade
    if (snapToGrid && gridSize > 0) {
      const maxTime = Math.max(...segments.map(s => s.endTime), 0);
      for (let time = 0; time <= maxTime + gridSize; time += gridSize) {
        points.push(time);
      }
    }
    
    return points.sort((a, b) => a - b);
  }, [segments, snapToGrid, gridSize]);
  
  const findNearestSnapPoint = useCallback((time: number, snapPoints: number[]): number | null => {
    let nearestPoint: number | null = null;
    let minDistance = Infinity;
    
    snapPoints.forEach(snapPoint => {
      const distance = Math.abs(timeToPixel(time) - timeToPixel(snapPoint));
      if (distance < snapThreshold && distance < minDistance) {
        minDistance = distance;
        nearestPoint = snapPoint;
      }
    });
    
    return nearestPoint;
  }, [timeToPixel, snapThreshold]);
  
  const checkCollision = useCallback((
    segmentId: string,
    newStartTime: number,
    newEndTime: number,
    trackId: string
  ): boolean => {
    return segments.some(segment => {
      if (segment.id === segmentId || segment.trackId !== trackId) {
        return false;
      }
      
      // Verifica sobreposição
      return !(newEndTime <= segment.startTime || newStartTime >= segment.endTime);
    });
  }, [segments]);
  
  // ===== DRAG HANDLERS =====
  
  const handleDragStart = useCallback((
    e: React.MouseEvent,
    segmentId: string,
    trackId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    const segment = segments.find(s => s.id === segmentId);
    if (!segment || !segment.draggable) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const snapPoints = generateSnapPoints(segmentId);
    
    dragStartRef.current = {
      x: e.clientX,
      time: segment.startTime
    };
    
    setDragState({
      isDragging: true,
      segmentId,
      startX: e.clientX,
      startTime: segment.startTime,
      trackId,
      offsetX,
      snapPoints
    });
    
    callbacks?.onDragStart?.(segmentId, trackId);
  }, [segments, generateSnapPoints, callbacks]);
  
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.segmentId) return;
    
    const segment = segments.find(s => s.id === dragState.segmentId);
    if (!segment) return;
    
    const deltaX = e.clientX - dragState.startX;
    const deltaTime = pixelToTime(deltaX);
    const newStartTime = Math.max(0, dragState.startTime + deltaTime);
    const newEndTime = newStartTime + (segment.endTime - segment.startTime);
    
    // Verificar snap
    const snapPoint = findNearestSnapPoint(newStartTime, dragState.snapPoints);
    const finalStartTime = snapPoint !== null ? snapPoint : newStartTime;
    const finalEndTime = finalStartTime + (segment.endTime - segment.startTime);
    
    // Verificar colisão
    const hasCollision = checkCollision(
      dragState.segmentId,
      finalStartTime,
      finalEndTime,
      dragState.trackId
    );
    
    if (!hasCollision) {
      setSnapPreview(snapPoint);
      callbacks?.onSnapHighlight?.(snapPoint);
      callbacks?.onDragMove?.(dragState.segmentId, finalStartTime, dragState.trackId);
    }
  }, [
    dragState,
    segments,
    pixelToTime,
    findNearestSnapPoint,
    checkCollision,
    callbacks
  ]);
  
  const handleDragEnd = useCallback(() => {
    if (!dragState.isDragging || !dragState.segmentId) return;
    
    const segment = segments.find(s => s.id === dragState.segmentId);
    if (!segment) return;
    
    // Finalizar drag
    callbacks?.onDragEnd?.(
      dragState.segmentId,
      segment.startTime, // Usar o tempo atual do segmento
      dragState.trackId
    );
    
    // Limpar estado
    setDragState({
      isDragging: false,
      segmentId: null,
      startX: 0,
      startTime: 0,
      trackId: '',
      offsetX: 0,
      snapPoints: []
    });
    
    setSnapPreview(null);
    callbacks?.onSnapHighlight?.(null);
    dragStartRef.current = null;
  }, [dragState, segments, callbacks]);
  
  // ===== RESIZE HANDLERS =====
  
  const handleResizeStart = useCallback((
    e: React.MouseEvent,
    segmentId: string,
    edge: 'start' | 'end'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    const segment = segments.find(s => s.id === segmentId);
    if (!segment || !segment.draggable) return;
    
    // Implementar lógica de redimensionamento
    // Por enquanto, apenas prevenir propagação
    
  }, [segments]);
  
  // ===== UTILITIES =====
  
  const getSegmentPosition = useCallback((segmentId: string) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return { x: 0, width: 0 };
    
    const x = timeToPixel(segment.startTime);
    const width = timeToPixel(segment.endTime - segment.startTime);
    
    return { x, width };
  }, [segments, timeToPixel]);
  
  const isSegmentDragging = useCallback((segmentId: string): boolean => {
    return dragState.isDragging && dragState.segmentId === segmentId;
  }, [dragState]);
  
  // ===== RETURN =====
  
  return {
    // Estado
    isDragging: dragState.isDragging,
    draggedSegmentId: dragState.segmentId,
    snapPreview,
    
    // Handlers
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleResizeStart,
    
    // Utilities
    getSegmentPosition,
    isSegmentDragging,
    
    // Dados para conexão com eventos globais
    dragHandlers: {
      onMouseMove: handleDragMove,
      onMouseUp: handleDragEnd
    }
  };
};

export default useTimelineDragDrop; 