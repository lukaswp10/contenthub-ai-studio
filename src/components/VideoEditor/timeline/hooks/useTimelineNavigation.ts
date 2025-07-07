/**
 * 🎬 TIMELINE NAVIGATION HOOK - ClipsForge Pro
 * 
 * Hook customizado para navegação da timeline com:
 * - ✅ Controles de zoom
 * - ✅ Navegação por teclado
 * - ✅ Scroll suave
 * - ✅ Atalhos profissionais
 * 
 * @author ClipsForge Team
 * @version 1.0.0
 */

import { useState, useCallback, useEffect, useRef } from 'react';

interface NavigationState {
  zoom: number;
  scrollX: number;
  isScrolling: boolean;
  focusedTime: number | null;
}

interface NavigationCallbacks {
  onZoomChange?: (zoom: number) => void;
  onScrollChange?: (scrollX: number) => void;
  onTimeChange?: (time: number) => void;
  onPlayToggle?: () => void;
  onCut?: (time: number) => void;
  onMarkIn?: (time: number) => void;
  onMarkOut?: (time: number) => void;
}

interface UseTimelineNavigationProps {
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  timelineWidth: number;
  pixelsPerSecond: number;
  minZoom?: number;
  maxZoom?: number;
  scrollSensitivity?: number;
  keyboardEnabled?: boolean;
  callbacks?: NavigationCallbacks;
}

const ZOOM_LEVELS = [0.25, 0.5, 1, 2, 4, 8, 16];
const SCROLL_ANIMATION_DURATION = 300;

export const useTimelineNavigation = ({
  duration,
  currentTime,
  isPlaying,
  timelineWidth,
  pixelsPerSecond,
  minZoom = 0.25,
  maxZoom = 16,
  scrollSensitivity = 1,
  keyboardEnabled = true,
  callbacks
}: UseTimelineNavigationProps) => {
  
  // ===== STATE =====
  
  const [navigationState, setNavigationState] = useState<NavigationState>({
    zoom: 1,
    scrollX: 0,
    isScrolling: false,
    focusedTime: null
  });
  
  const animationRef = useRef<number | null>(null);
  const scrollTargetRef = useRef<number>(0);
  
  // ===== ZOOM CONTROLS =====
  
  const zoomIn = useCallback(() => {
    const currentIndex = ZOOM_LEVELS.indexOf(navigationState.zoom);
    const nextIndex = Math.min(currentIndex + 1, ZOOM_LEVELS.length - 1);
    const newZoom = ZOOM_LEVELS[nextIndex];
    
    if (newZoom !== navigationState.zoom) {
      setNavigationState(prev => ({ ...prev, zoom: newZoom }));
      callbacks?.onZoomChange?.(newZoom);
    }
  }, [navigationState.zoom, callbacks]);
  
  const zoomOut = useCallback(() => {
    const currentIndex = ZOOM_LEVELS.indexOf(navigationState.zoom);
    const nextIndex = Math.max(currentIndex - 1, 0);
    const newZoom = ZOOM_LEVELS[nextIndex];
    
    if (newZoom !== navigationState.zoom) {
      setNavigationState(prev => ({ ...prev, zoom: newZoom }));
      callbacks?.onZoomChange?.(newZoom);
    }
  }, [navigationState.zoom, callbacks]);
  
  const setZoom = useCallback((newZoom: number) => {
    const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
    if (clampedZoom !== navigationState.zoom) {
      setNavigationState(prev => ({ ...prev, zoom: clampedZoom }));
      callbacks?.onZoomChange?.(clampedZoom);
    }
  }, [navigationState.zoom, minZoom, maxZoom, callbacks]);
  
  const zoomToFit = useCallback(() => {
    if (duration > 0) {
      const targetZoom = Math.min(maxZoom, timelineWidth / (duration * 100));
      setZoom(Math.max(minZoom, targetZoom));
      setNavigationState(prev => ({ ...prev, scrollX: 0 }));
      callbacks?.onScrollChange?.(0);
    }
  }, [duration, timelineWidth, maxZoom, minZoom, setZoom, callbacks]);
  
  // ===== SCROLL CONTROLS =====
  
  const smoothScrollTo = useCallback((targetScrollX: number) => {
    const startScrollX = navigationState.scrollX;
    const distance = targetScrollX - startScrollX;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / SCROLL_ANIMATION_DURATION, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentScrollX = startScrollX + (distance * easeOut);
      
      setNavigationState(prev => ({ 
        ...prev, 
        scrollX: currentScrollX,
        isScrolling: progress < 1
      }));
      
      callbacks?.onScrollChange?.(currentScrollX);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    animationRef.current = requestAnimationFrame(animate);
  }, [navigationState.scrollX, callbacks]);
  
  const scrollToTime = useCallback((time: number) => {
    const targetScrollX = (time * pixelsPerSecond) - (timelineWidth / 2);
    const clampedScrollX = Math.max(0, targetScrollX);
    smoothScrollTo(clampedScrollX);
  }, [pixelsPerSecond, timelineWidth, smoothScrollTo]);
  
  const handleWheelScroll = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const zoomDirection = e.deltaY > 0 ? -1 : 1;
      if (zoomDirection > 0) {
        zoomIn();
      } else {
        zoomOut();
      }
    } else {
      // Scroll horizontal
      const scrollDelta = e.deltaX || e.deltaY;
      const newScrollX = Math.max(0, navigationState.scrollX + (scrollDelta * scrollSensitivity));
      
      setNavigationState(prev => ({ ...prev, scrollX: newScrollX }));
      callbacks?.onScrollChange?.(newScrollX);
    }
  }, [navigationState.scrollX, scrollSensitivity, zoomIn, zoomOut, callbacks]);
  
  // ===== NAVIGATION HELPERS =====
  
  const frameForward = useCallback(() => {
    const fps = 30; // Assumindo 30fps
    const frameTime = 1 / fps;
    const newTime = Math.min(duration, currentTime + frameTime);
    callbacks?.onTimeChange?.(newTime);
  }, [currentTime, duration, callbacks]);
  
  const frameBackward = useCallback(() => {
    const fps = 30;
    const frameTime = 1 / fps;
    const newTime = Math.max(0, currentTime - frameTime);
    callbacks?.onTimeChange?.(newTime);
  }, [currentTime, callbacks]);
  
  const jumpToStart = useCallback(() => {
    callbacks?.onTimeChange?.(0);
    scrollToTime(0);
  }, [callbacks, scrollToTime]);
  
  const jumpToEnd = useCallback(() => {
    callbacks?.onTimeChange?.(duration);
    scrollToTime(duration);
  }, [duration, callbacks, scrollToTime]);
  
  const jumpBySeconds = useCallback((seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    callbacks?.onTimeChange?.(newTime);
  }, [currentTime, duration, callbacks]);
  
  // ===== KEYBOARD SHORTCUTS =====
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!keyboardEnabled) return;
    
    // Prevenir ação padrão para atalhos específicos
    const preventDefaults = [
      'Space', 'ArrowLeft', 'ArrowRight', 'Home', 'End',
      'KeyI', 'KeyO', 'KeyS', 'Equal', 'Minus'
    ];
    
    if (preventDefaults.includes(e.code)) {
      e.preventDefault();
    }
    
    switch (e.code) {
      case 'Space':
        callbacks?.onPlayToggle?.();
        break;
        
      case 'ArrowLeft':
        if (e.shiftKey) {
          jumpBySeconds(-10);
        } else if (e.ctrlKey || e.metaKey) {
          frameBackward();
        } else {
          jumpBySeconds(-1);
        }
        break;
        
      case 'ArrowRight':
        if (e.shiftKey) {
          jumpBySeconds(10);
        } else if (e.ctrlKey || e.metaKey) {
          frameForward();
        } else {
          jumpBySeconds(1);
        }
        break;
        
      case 'Home':
        jumpToStart();
        break;
        
      case 'End':
        jumpToEnd();
        break;
        
      case 'KeyI':
        if (!e.ctrlKey && !e.metaKey) {
          callbacks?.onMarkIn?.(currentTime);
        }
        break;
        
      case 'KeyO':
        if (!e.ctrlKey && !e.metaKey) {
          callbacks?.onMarkOut?.(currentTime);
        }
        break;
        
      case 'KeyS':
        if (!e.ctrlKey && !e.metaKey) {
          callbacks?.onCut?.(currentTime);
        }
        break;
        
      case 'Equal':
      case 'NumpadAdd':
        if (e.ctrlKey || e.metaKey) {
          zoomIn();
        }
        break;
        
      case 'Minus':
      case 'NumpadSubtract':
        if (e.ctrlKey || e.metaKey) {
          zoomOut();
        }
        break;
        
      case 'Digit0':
        if (e.ctrlKey || e.metaKey) {
          zoomToFit();
        }
        break;
    }
  }, [
    keyboardEnabled,
    callbacks,
    currentTime,
    jumpBySeconds,
    frameForward,
    frameBackward,
    jumpToStart,
    jumpToEnd,
    zoomIn,
    zoomOut,
    zoomToFit
  ]);
  
  // ===== EFFECTS =====
  
  useEffect(() => {
    if (keyboardEnabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [keyboardEnabled, handleKeyDown]);
  
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // ===== AUTO-FOLLOW PLAYHEAD =====
  
  useEffect(() => {
    if (isPlaying && !navigationState.isScrolling) {
      const playheadPosition = currentTime * pixelsPerSecond;
      const viewportStart = navigationState.scrollX;
      const viewportEnd = navigationState.scrollX + timelineWidth;
      
      // Auto-scroll se o playhead sair da viewport
      if (playheadPosition < viewportStart || playheadPosition > viewportEnd) {
        const targetScrollX = playheadPosition - (timelineWidth / 2);
        const clampedScrollX = Math.max(0, targetScrollX);
        
        setNavigationState(prev => ({ ...prev, scrollX: clampedScrollX }));
        callbacks?.onScrollChange?.(clampedScrollX);
      }
    }
  }, [
    isPlaying,
    currentTime,
    pixelsPerSecond,
    navigationState.scrollX,
    navigationState.isScrolling,
    timelineWidth,
    callbacks
  ]);
  
  // ===== RETURN =====
  
  return {
    // Estado
    zoom: navigationState.zoom,
    scrollX: navigationState.scrollX,
    isScrolling: navigationState.isScrolling,
    
    // Controles de zoom
    zoomIn,
    zoomOut,
    setZoom,
    zoomToFit,
    canZoomIn: navigationState.zoom < maxZoom,
    canZoomOut: navigationState.zoom > minZoom,
    
    // Controles de scroll
    scrollToTime,
    smoothScrollTo,
    
    // Navegação
    frameForward,
    frameBackward,
    jumpToStart,
    jumpToEnd,
    jumpBySeconds,
    
    // Event handlers
    handleWheelScroll,
    handleKeyDown,
    
    // Utilities
    getVisibleTimeRange: () => {
      const start = navigationState.scrollX / pixelsPerSecond;
      const end = (navigationState.scrollX + timelineWidth) / pixelsPerSecond;
      return { start: Math.max(0, start), end: Math.min(duration, end) };
    },
    
    isTimeVisible: (time: number) => {
      const { start, end } = 
        { 
          start: navigationState.scrollX / pixelsPerSecond,
          end: (navigationState.scrollX + timelineWidth) / pixelsPerSecond
        };
      return time >= start && time <= end;
    }
  };
};

export default useTimelineNavigation; 