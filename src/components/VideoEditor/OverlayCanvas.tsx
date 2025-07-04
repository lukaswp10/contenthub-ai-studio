/**
 * 🎨 OVERLAY CANVAS - ClipsForge Pro
 * 
 * Canvas sobreposto ao vídeo para renderizar imagens, textos e formas
 * Sincronizado com frame atual do vídeo
 * 
 * @version 3.1.0 - FASE 3
 * @author ClipsForge Team
 */

import React, { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { Overlay, OverlayStyle, OverlayAnimation } from '../../types/video-editor';
import { useVideoEditorStore } from '../../stores/videoEditorStore';

// ===== TYPES =====

interface OverlayCanvasProps {
  width: number;
  height: number;
  overlays: Overlay[];
  currentTime: number;
  onOverlayClick?: (overlay: Overlay) => void;
  onOverlayDoubleClick?: (overlay: Overlay) => void;
  onOverlayDrag?: (overlay: Overlay, newPosition: { x: number; y: number }) => void;
  onOverlayResize?: (overlay: Overlay, newSize: { width: number; height: number }) => void;
  enableInteraction?: boolean;
  showBounds?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface OverlayCanvasRef {
  getCanvas: () => HTMLCanvasElement | null;
  getContext: () => CanvasRenderingContext2D | null;
  redraw: () => void;
  captureFrame: () => string;
  exportFrame: (format?: 'png' | 'jpeg' | 'webp') => string;
}

interface LoadedImage {
  id: string;
  image: HTMLImageElement;
  loaded: boolean;
  error?: string;
}

// ===== COMPONENT =====

const OverlayCanvas = forwardRef<OverlayCanvasRef, OverlayCanvasProps>(({
  width,
  height,
  overlays,
  currentTime,
  onOverlayClick,
  onOverlayDoubleClick,
  onOverlayDrag,
  onOverlayResize,
  enableInteraction = true,
  showBounds = false,
  className = '',
  style = {}
}, ref) => {
  
  // ===== REFS =====
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // ===== STATE =====
  
  const [loadedImages, setLoadedImages] = useState<Map<string, LoadedImage>>(new Map());
  const [hoveredOverlay, setHoveredOverlay] = useState<string | null>(null);
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  
  // ===== STORE =====
  
  const { updateOverlay } = useVideoEditorStore();
  
  // ===== IMAGE LOADING =====
  
  const loadImage = useCallback((overlay: Overlay): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (overlay.type !== 'image' || !overlay.src) {
        reject(new Error('Invalid image overlay'));
        return;
      }
      
      const existing = loadedImages.get(overlay.id);
      if (existing?.loaded) {
        resolve(existing.image);
        return;
      }
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const loadedImage: LoadedImage = {
          id: overlay.id,
          image: img,
          loaded: true
        };
        
        setLoadedImages(prev => new Map(prev).set(overlay.id, loadedImage));
        resolve(img);
      };
      
      img.onerror = (error) => {
        const loadedImage: LoadedImage = {
          id: overlay.id,
          image: img,
          loaded: false,
          error: 'Failed to load image'
        };
        
        setLoadedImages(prev => new Map(prev).set(overlay.id, loadedImage));
        reject(error);
      };
      
      img.src = overlay.src;
    });
  }, [loadedImages]);
  
  // ===== ANIMATION HELPERS =====
  
  const calculateAnimationValue = useCallback((
    animation: OverlayAnimation,
    currentTime: number,
    overlayStartTime: number,
    overlayEndTime: number
  ): number => {
    const overlayDuration = overlayEndTime - overlayStartTime;
    const relativeTime = currentTime - overlayStartTime;
    const progress = Math.max(0, Math.min(1, relativeTime / overlayDuration));
    
    // Apply animation timing
    let animationProgress = 0;
    
    if (animation.direction === 'in') {
      animationProgress = Math.min(1, relativeTime / animation.duration);
    } else if (animation.direction === 'out') {
      const outStartTime = overlayDuration - animation.duration;
      animationProgress = relativeTime >= outStartTime ? 
        (relativeTime - outStartTime) / animation.duration : 0;
    } else {
      // in-out
      const halfDuration = animation.duration / 2;
      if (relativeTime <= halfDuration) {
        animationProgress = relativeTime / halfDuration;
      } else if (relativeTime >= overlayDuration - halfDuration) {
        animationProgress = 1 - ((relativeTime - (overlayDuration - halfDuration)) / halfDuration);
      } else {
        animationProgress = 1;
      }
    }
    
    // Apply easing
    switch (animation.easing) {
      case 'ease-in':
        return animationProgress * animationProgress;
      case 'ease-out':
        return 1 - (1 - animationProgress) * (1 - animationProgress);
      case 'ease-in-out':
        return animationProgress < 0.5 
          ? 2 * animationProgress * animationProgress
          : 1 - 2 * (1 - animationProgress) * (1 - animationProgress);
      default:
        return animationProgress;
    }
  }, []);
  
  // ===== RENDERING FUNCTIONS =====
  
  const applyOverlayStyle = useCallback((
    ctx: CanvasRenderingContext2D,
    style: OverlayStyle | undefined
  ) => {
    if (!style) return;
    
    // Apply filters
    if (style.filter) {
      const filters = [];
      if (style.filter.blur) filters.push(`blur(${style.filter.blur}px)`);
      if (style.filter.brightness) filters.push(`brightness(${style.filter.brightness})`);
      if (style.filter.contrast) filters.push(`contrast(${style.filter.contrast})`);
      if (style.filter.saturate) filters.push(`saturate(${style.filter.saturate})`);
      if (style.filter.hue) filters.push(`hue-rotate(${style.filter.hue}deg)`);
      if (style.filter.sepia) filters.push(`sepia(${style.filter.sepia})`);
      if (style.filter.grayscale) filters.push(`grayscale(${style.filter.grayscale})`);
      if (style.filter.invert) filters.push(`invert(${style.filter.invert})`);
      
      ctx.filter = filters.join(' ');
    }
    
    // Apply shadow
    if (style.shadow) {
      ctx.shadowColor = style.shadow.color;
      ctx.shadowOffsetX = style.shadow.offsetX;
      ctx.shadowOffsetY = style.shadow.offsetY;
      ctx.shadowBlur = style.shadow.blur;
    }
  }, []);
  
  const renderImageOverlay = useCallback(async (
    ctx: CanvasRenderingContext2D,
    overlay: Overlay
  ) => {
    if (!overlay.src) return;
    
    try {
      const img = await loadImage(overlay);
      
      ctx.save();
      
      // Apply transformations
      ctx.translate(overlay.x + overlay.width / 2, overlay.y + overlay.height / 2);
      ctx.rotate((overlay.rotation * Math.PI) / 180);
      ctx.globalAlpha = overlay.opacity;
      
      // Apply style
      applyOverlayStyle(ctx, overlay.style);
      
      // Draw image
      ctx.drawImage(
        img,
        -overlay.width / 2,
        -overlay.height / 2,
        overlay.width,
        overlay.height
      );
      
      ctx.restore();
    } catch (error) {
      console.error('Failed to render image overlay:', error);
      // Render placeholder
      renderPlaceholder(ctx, overlay, 'Image Error');
    }
  }, [loadImage, applyOverlayStyle]);
  
  const renderTextOverlay = useCallback((
    ctx: CanvasRenderingContext2D,
    overlay: Overlay
  ) => {
    if (!overlay.text) return;
    
    ctx.save();
    
    // Apply transformations
    ctx.translate(overlay.x + overlay.width / 2, overlay.y + overlay.height / 2);
    ctx.rotate((overlay.rotation * Math.PI) / 180);
    ctx.globalAlpha = overlay.opacity;
    
    // Apply style
    applyOverlayStyle(ctx, overlay.style);
    
    // Set text properties
    ctx.font = '24px Arial';
    ctx.fillStyle = overlay.style?.backgroundColor || '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw background if specified
    if (overlay.style?.backgroundColor) {
      ctx.fillStyle = overlay.style.backgroundColor;
      ctx.fillRect(-overlay.width / 2, -overlay.height / 2, overlay.width, overlay.height);
    }
    
    // Draw border if specified
    if (overlay.style?.borderColor && overlay.style?.borderWidth) {
      ctx.strokeStyle = overlay.style.borderColor;
      ctx.lineWidth = overlay.style.borderWidth;
      ctx.strokeRect(-overlay.width / 2, -overlay.height / 2, overlay.width, overlay.height);
    }
    
    // Draw text
    ctx.fillStyle = '#000000';
    ctx.fillText(overlay.text, 0, 0);
    
    ctx.restore();
  }, [applyOverlayStyle]);
  
  const renderShapeOverlay = useCallback((
    ctx: CanvasRenderingContext2D,
    overlay: Overlay
  ) => {
    ctx.save();
    
    // Apply transformations
    ctx.translate(overlay.x + overlay.width / 2, overlay.y + overlay.height / 2);
    ctx.rotate((overlay.rotation * Math.PI) / 180);
    ctx.globalAlpha = overlay.opacity;
    
    // Apply style
    applyOverlayStyle(ctx, overlay.style);
    
    // Set shape properties
    ctx.fillStyle = overlay.style?.backgroundColor || '#ff0000';
    ctx.strokeStyle = overlay.style?.borderColor || '#000000';
    ctx.lineWidth = overlay.style?.borderWidth || 1;
    
    // Draw rectangle (default shape)
    ctx.fillRect(-overlay.width / 2, -overlay.height / 2, overlay.width, overlay.height);
    
    if (overlay.style?.borderWidth) {
      ctx.strokeRect(-overlay.width / 2, -overlay.height / 2, overlay.width, overlay.height);
    }
    
    ctx.restore();
  }, [applyOverlayStyle]);
  
  const renderPlaceholder = useCallback((
    ctx: CanvasRenderingContext2D,
    overlay: Overlay,
    text: string
  ) => {
    ctx.save();
    
    ctx.translate(overlay.x + overlay.width / 2, overlay.y + overlay.height / 2);
    ctx.rotate((overlay.rotation * Math.PI) / 180);
    ctx.globalAlpha = overlay.opacity;
    
    // Draw placeholder background
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(-overlay.width / 2, -overlay.height / 2, overlay.width, overlay.height);
    
    // Draw placeholder border
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 2;
    ctx.strokeRect(-overlay.width / 2, -overlay.height / 2, overlay.width, overlay.height);
    
    // Draw placeholder text
    ctx.fillStyle = '#666666';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 0);
    
    ctx.restore();
  }, []);
  
  const renderBounds = useCallback((
    ctx: CanvasRenderingContext2D,
    overlay: Overlay,
    isSelected: boolean = false,
    isHovered: boolean = false
  ) => {
    if (!showBounds && !isSelected && !isHovered) return;
    
    ctx.save();
    
    // Draw bounds rectangle
    ctx.strokeStyle = isSelected ? '#007bff' : isHovered ? '#28a745' : '#6c757d';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash(isSelected ? [] : [5, 5]);
    
    ctx.strokeRect(overlay.x, overlay.y, overlay.width, overlay.height);
    
    // Draw resize handles for selected overlay
    if (isSelected) {
      const handleSize = 8;
      ctx.fillStyle = '#007bff';
      
      // Corner handles
      const corners = [
        { x: overlay.x - handleSize / 2, y: overlay.y - handleSize / 2 },
        { x: overlay.x + overlay.width - handleSize / 2, y: overlay.y - handleSize / 2 },
        { x: overlay.x + overlay.width - handleSize / 2, y: overlay.y + overlay.height - handleSize / 2 },
        { x: overlay.x - handleSize / 2, y: overlay.y + overlay.height - handleSize / 2 }
      ];
      
      corners.forEach(corner => {
        ctx.fillRect(corner.x, corner.y, handleSize, handleSize);
      });
    }
    
    ctx.restore();
  }, [showBounds]);
  
  // ===== MAIN RENDER FUNCTION =====
  
  const renderOverlays = useCallback(async () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    
    if (!canvas || !ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Filter overlays that should be visible at current time
    const visibleOverlays = overlays.filter(overlay => 
      currentTime >= overlay.startTime && currentTime <= overlay.endTime
    );
    
    // Sort by z-index
    visibleOverlays.sort((a, b) => a.zIndex - b.zIndex);
    
    // Render each overlay
    for (const overlay of visibleOverlays) {
      let animatedOverlay = { ...overlay };
      
      // Apply animation if present
      if (overlay.animation) {
        const animationValue = calculateAnimationValue(
          overlay.animation,
          currentTime,
          overlay.startTime,
          overlay.endTime
        );
        
        // Apply animation effects
        switch (overlay.animation.type) {
          case 'fade':
            animatedOverlay.opacity = overlay.opacity * animationValue;
            break;
          case 'scale':
            const scale = animationValue;
            animatedOverlay.width = overlay.width * scale;
            animatedOverlay.height = overlay.height * scale;
            break;
          case 'slide':
            animatedOverlay.x = overlay.x + (overlay.width * (1 - animationValue));
            break;
          // Add more animation types as needed
        }
      }
      
      // Render based on type
      switch (animatedOverlay.type) {
        case 'image':
          await renderImageOverlay(ctx, animatedOverlay);
          break;
        case 'text':
          renderTextOverlay(ctx, animatedOverlay);
          break;
        case 'shape':
          renderShapeOverlay(ctx, animatedOverlay);
          break;
        case 'video':
          // TODO: Implement video overlay rendering
          renderPlaceholder(ctx, animatedOverlay, 'Video Overlay');
          break;
      }
      
      // Render bounds if needed
      renderBounds(
        ctx,
        animatedOverlay,
        selectedOverlay === overlay.id,
        hoveredOverlay === overlay.id
      );
    }
  }, [
    width,
    height,
    overlays,
    currentTime,
    calculateAnimationValue,
    renderImageOverlay,
    renderTextOverlay,
    renderShapeOverlay,
    renderPlaceholder,
    renderBounds,
    selectedOverlay,
    hoveredOverlay
  ]);
  
  // ===== MOUSE INTERACTION =====
  
  const getOverlayAtPoint = useCallback((x: number, y: number): Overlay | null => {
    const visibleOverlays = overlays.filter(overlay => 
      currentTime >= overlay.startTime && currentTime <= overlay.endTime
    );
    
    // Check from top to bottom (highest z-index first)
    visibleOverlays.sort((a, b) => b.zIndex - a.zIndex);
    
    for (const overlay of visibleOverlays) {
      if (x >= overlay.x && x <= overlay.x + overlay.width &&
          y >= overlay.y && y <= overlay.y + overlay.height) {
        return overlay;
      }
    }
    
    return null;
  }, [overlays, currentTime]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enableInteraction) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const overlay = getOverlayAtPoint(x, y);
    setHoveredOverlay(overlay?.id || null);
    
    // Handle dragging
    if (isDragging && selectedOverlay && dragStart) {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;
      
      const overlayToUpdate = overlays.find(o => o.id === selectedOverlay);
      if (overlayToUpdate && onOverlayDrag) {
        onOverlayDrag(overlayToUpdate, {
          x: overlayToUpdate.x + dx,
          y: overlayToUpdate.y + dy
        });
      }
      
      setDragStart({ x, y });
    }
    
    // Update cursor
    canvas.style.cursor = overlay ? 'pointer' : 'default';
  }, [
    enableInteraction,
    getOverlayAtPoint,
    isDragging,
    selectedOverlay,
    dragStart,
    overlays,
    onOverlayDrag
  ]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enableInteraction) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const overlay = getOverlayAtPoint(x, y);
    
    if (overlay) {
      setSelectedOverlay(overlay.id);
      setIsDragging(true);
      setDragStart({ x, y });
      
      if (onOverlayClick) {
        onOverlayClick(overlay);
      }
    } else {
      setSelectedOverlay(null);
    }
  }, [enableInteraction, getOverlayAtPoint, onOverlayClick]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);
  
  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enableInteraction) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const overlay = getOverlayAtPoint(x, y);
    
    if (overlay && onOverlayDoubleClick) {
      onOverlayDoubleClick(overlay);
    }
  }, [enableInteraction, getOverlayAtPoint, onOverlayDoubleClick]);
  
  // ===== EFFECTS =====
  
  // Initialize canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    contextRef.current = ctx;
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    
    // Set context properties
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }, [width, height]);
  
  // Render when dependencies change
  useEffect(() => {
    renderOverlays();
  }, [renderOverlays]);
  
  // Animation loop
  useEffect(() => {
    const animate = () => {
      renderOverlays();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderOverlays]);
  
  // ===== IMPERATIVE HANDLE =====
  
  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    getContext: () => contextRef.current,
    redraw: renderOverlays,
    captureFrame: () => {
      const canvas = canvasRef.current;
      return canvas ? canvas.toDataURL('image/png') : '';
    },
    exportFrame: (format: 'png' | 'jpeg' | 'webp' = 'png') => {
      const canvas = canvasRef.current;
      return canvas ? canvas.toDataURL(`image/${format}`) : '';
    }
  }));
  
  // ===== RENDER =====
  
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`overlay-canvas ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: enableInteraction ? 'auto' : 'none',
        zIndex: 10,
        ...style
      }}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    />
  );
});

OverlayCanvas.displayName = 'OverlayCanvas';

export default OverlayCanvas; 