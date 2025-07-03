/**
 * 🎬 VIDEO PLAYER PROFISSIONAL - ClipsForge Pro
 * 
 * Player avançado com Video.js, overlay canvas e sincronização precisa
 * 
 * @version 1.0.0
 * @author ClipsForge Team
 */

import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { 
  VideoPlayerState, 
  VideoQuality, 
  TimeRange, 
  Subtitle, 
  Overlay,
  PlayerEvent 
} from '../../types/video-editor';

// ===== TIPOS =====

interface VideoPlayerProps {
  src: string;
  poster?: string;
  width?: number;
  height?: number;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  fluid?: boolean;
  responsive?: boolean;
  playbackRates?: number[];
  
  // Overlay elements
  subtitles?: Subtitle[];
  overlays?: Overlay[];
  
  // Callbacks
  onPlayerReady?: (player: any) => void;
  onTimeUpdate?: (currentTime: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onSeeking?: (time: number) => void;
  onSeeked?: (time: number) => void;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
  onError?: (error: any) => void;
  onEvent?: (event: PlayerEvent) => void;
  
  // Advanced
  enableFrameCallback?: boolean;
  onFrameUpdate?: (time: number, frame: number) => void;
  
  className?: string;
  style?: React.CSSProperties;
}

interface VideoPlayerRef {
  // Controles básicos
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  
  // Informações
  getCurrentTime: () => number;
  getDuration: () => number;
  getState: () => VideoPlayerState;
  getCurrentFrame: () => number;
  
  // Video.js instance
  getPlayer: () => any;
  
  // Overlay controls
  updateSubtitles: (subtitles: Subtitle[]) => void;
  updateOverlays: (overlays: Overlay[]) => void;
  
  // Canvas controls
  getCanvasContext: () => CanvasRenderingContext2D | null;
  captureFrame: () => string; // Returns base64 image
}

// ===== COMPONENT =====

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({
  src,
  poster,
  width = 854,
  height = 480,
  autoplay = false,
  muted = false,
  controls = true,
  fluid = true,
  responsive = true,
  playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2],
  
  subtitles = [],
  overlays = [],
  
  onPlayerReady,
  onTimeUpdate,
  onPlay,
  onPause,
  onEnded,
  onSeeking,
  onSeeked,
  onLoadStart,
  onCanPlay,
  onError,
  onEvent,
  
  enableFrameCallback = false,
  onFrameUpdate,
  
  className = '',
  style = {}
}, ref) => {
  
  // ===== REFS =====
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<any>(null);
  const frameCallbackRef = useRef<number | null>(null);
  
  // ===== STATE =====
  
  const [playerState, setPlayerState] = useState<VideoPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
    playbackRate: 1,
    quality: { width: 854, height: 480 },
    fullscreen: false,
    loading: false,
    buffered: []
  });
  
  const [currentSubtitles, setCurrentSubtitles] = useState<Subtitle[]>(subtitles);
  const [currentOverlays, setCurrentOverlays] = useState<Overlay[]>(overlays);
  
  // ===== FRAME CALLBACK =====
  
  const frameCallback = useCallback((time: number) => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const currentTime = video.currentTime;
    const fps = 30; // Assumindo 30 FPS
    const frame = Math.floor(currentTime * fps);
    
    // Update canvas overlay
    renderOverlay(currentTime);
    
    // Callback para componente pai
    if (onFrameUpdate) {
      onFrameUpdate(currentTime, frame);
    }
    
    // Continue o loop se o vídeo estiver tocando
    if (!video.paused && !video.ended) {
      frameCallbackRef.current = video.requestVideoFrameCallback(frameCallback);
    }
  }, [onFrameUpdate]);
  
  // ===== RENDER OVERLAY =====
  
  const renderOverlay = useCallback((currentTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Render subtitles
    currentSubtitles.forEach(subtitle => {
      if (currentTime >= subtitle.startTime && currentTime <= subtitle.endTime) {
        renderSubtitle(ctx, subtitle, canvas.width, canvas.height);
      }
    });
    
    // Render overlays
    currentOverlays.forEach(overlay => {
      if (currentTime >= overlay.startTime && currentTime <= overlay.endTime) {
        renderOverlayElement(ctx, overlay, canvas.width, canvas.height);
      }
    });
  }, [currentSubtitles, currentOverlays]);
  
  // ===== RENDER SUBTITLE =====
  
  const renderSubtitle = useCallback((
    ctx: CanvasRenderingContext2D, 
    subtitle: Subtitle, 
    canvasWidth: number, 
    canvasHeight: number
  ) => {
    const { text, x, y, style } = subtitle;
    
    // Set font
    ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
    ctx.textAlign = style.textAlign as CanvasTextAlign;
    ctx.fillStyle = style.color;
    
    // Text shadow
    if (style.textShadow) {
      ctx.shadowColor = style.textShadow.color;
      ctx.shadowBlur = style.textShadow.blur;
      ctx.shadowOffsetX = style.textShadow.offsetX;
      ctx.shadowOffsetY = style.textShadow.offsetY;
    }
    
    // Background
    if (style.backgroundColor) {
      const metrics = ctx.measureText(text);
      const textWidth = metrics.width;
      const textHeight = style.fontSize;
      
      ctx.fillStyle = style.backgroundColor;
      ctx.fillRect(
        x - textWidth / 2 - 10, 
        y - textHeight - 5, 
        textWidth + 20, 
        textHeight + 10
      );
    }
    
    // Draw text
    ctx.fillStyle = style.color;
    ctx.fillText(text, x, y);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }, []);
  
  // ===== RENDER OVERLAY ELEMENT =====
  
  const renderOverlayElement = useCallback((
    ctx: CanvasRenderingContext2D, 
    overlay: Overlay, 
    canvasWidth: number, 
    canvasHeight: number
  ) => {
    const { x, y, width, height, rotation = 0, opacity = 1, data } = overlay;
    
    ctx.save();
    ctx.globalAlpha = opacity;
    
    // Apply rotation
    if (rotation !== 0) {
      ctx.translate(x + width / 2, y + height / 2);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.translate(-width / 2, -height / 2);
    }
    
    switch (overlay.type) {
      case 'text':
        if (data.text && data.style) {
          ctx.font = `${data.style.fontWeight} ${data.style.fontSize}px ${data.style.fontFamily}`;
          ctx.fillStyle = data.style.color;
          ctx.fillText(data.text, rotation === 0 ? x : 0, rotation === 0 ? y : 0);
        }
        break;
        
      case 'shape':
        if (data.shape) {
          ctx.fillStyle = data.fill || '#ffffff';
          ctx.strokeStyle = data.stroke || '#000000';
          ctx.lineWidth = data.strokeWidth || 1;
          
          switch (data.shape) {
            case 'rectangle':
              ctx.fillRect(rotation === 0 ? x : 0, rotation === 0 ? y : 0, width, height);
              if (data.stroke) ctx.strokeRect(rotation === 0 ? x : 0, rotation === 0 ? y : 0, width, height);
              break;
              
            case 'circle':
              ctx.beginPath();
              ctx.arc(
                rotation === 0 ? x + width / 2 : width / 2, 
                rotation === 0 ? y + height / 2 : height / 2, 
                Math.min(width, height) / 2, 
                0, 
                2 * Math.PI
              );
              ctx.fill();
              if (data.stroke) ctx.stroke();
              break;
          }
        }
        break;
        
      case 'image':
        // Para imagens, seria necessário carregar a imagem primeiro
        // Implementação simplificada aqui
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(rotation === 0 ? x : 0, rotation === 0 ? y : 0, width, height);
        ctx.strokeStyle = '#999999';
        ctx.strokeRect(rotation === 0 ? x : 0, rotation === 0 ? y : 0, width, height);
        break;
    }
    
    ctx.restore();
  }, []);
  
  // ===== EMIT EVENT =====
  
  const emitEvent = useCallback((type: PlayerEvent['type'], data: any = null) => {
    const event: PlayerEvent = {
      type,
      data,
      timestamp: Date.now()
    };
    
    if (onEvent) {
      onEvent(event);
    }
  }, [onEvent]);
  
  // ===== SETUP PLAYER =====
  
  useEffect(() => {
    if (!videoRef.current) return;
    
    // Video.js options
    const options: any = {
      controls,
      fluid,
      responsive,
      playbackRates,
      autoplay,
      muted,
      poster,
      width,
      height,
      sources: [{
        src,
        type: 'video/mp4'
      }],
      plugins: {},
      techOrder: ['html5'],
      html5: {
        vhs: {
          overrideNative: true
        }
      }
    };
    
    // Initialize Video.js
    const player = videojs(videoRef.current, options);
    playerRef.current = player;
    
    // Event listeners
    player.on('ready', () => {
      console.log('🎬 Video.js Player Ready');
      emitEvent('loadstart');
      if (onPlayerReady) onPlayerReady(player);
    });
    
    player.on('play', () => {
      setPlayerState(prev => ({ ...prev, isPlaying: true }));
      emitEvent('play');
      if (onPlay) onPlay();
      
      // Start frame callback
      if (enableFrameCallback && videoRef.current) {
        frameCallbackRef.current = videoRef.current.requestVideoFrameCallback(frameCallback);
      }
    });
    
    player.on('pause', () => {
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
      emitEvent('pause');
      if (onPause) onPause();
      
      // Stop frame callback
      if (frameCallbackRef.current) {
        videoRef.current?.cancelVideoFrameCallback(frameCallbackRef.current);
        frameCallbackRef.current = null;
      }
    });
    
    player.on('timeupdate', () => {
      const currentTime = player.currentTime() || 0;
      const duration = player.duration() || 0;
      
      setPlayerState(prev => ({ 
        ...prev, 
        currentTime, 
        duration 
      }));
      
      if (onTimeUpdate) onTimeUpdate(currentTime);
    });
    
    player.on('seeking', () => {
      const currentTime = player.currentTime() || 0;
      emitEvent('seek', { time: currentTime });
      if (onSeeking) onSeeking(currentTime);
    });
    
    player.on('seeked', () => {
      const currentTime = player.currentTime() || 0;
      if (onSeeked) onSeeked(currentTime);
    });
    
    player.on('ended', () => {
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
      emitEvent('ended');
      if (onEnded) onEnded();
    });
    
    player.on('loadstart', () => {
      setPlayerState(prev => ({ ...prev, loading: true }));
      emitEvent('loadstart');
      if (onLoadStart) onLoadStart();
    });
    
    player.on('canplay', () => {
      setPlayerState(prev => ({ ...prev, loading: false }));
      emitEvent('canplay');
      if (onCanPlay) onCanPlay();
    });
    
    player.on('error', (error: any) => {
      console.error('🚨 Video.js Error:', error);
      emitEvent('error', error);
      if (onError) onError(error);
    });
    
    player.on('volumechange', () => {
      setPlayerState(prev => ({ 
        ...prev, 
        volume: player.volume() || 0,
        muted: player.muted() || false
      }));
    });
    
    player.on('ratechange', () => {
      setPlayerState(prev => ({ 
        ...prev, 
        playbackRate: player.playbackRate() || 1
      }));
    });
    
    // Cleanup
    return () => {
      if (frameCallbackRef.current) {
        videoRef.current?.cancelVideoFrameCallback(frameCallbackRef.current);
      }
      
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src]);
  
  // ===== UPDATE CANVAS SIZE =====
  
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    const updateCanvasSize = () => {
      canvas.width = video.videoWidth || width;
      canvas.height = video.videoHeight || height;
      canvas.style.width = video.offsetWidth + 'px';
      canvas.style.height = video.offsetHeight + 'px';
    };
    
    video.addEventListener('loadedmetadata', updateCanvasSize);
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      video.removeEventListener('loadedmetadata', updateCanvasSize);
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [width, height]);
  
  // ===== UPDATE SUBTITLES =====
  
  useEffect(() => {
    setCurrentSubtitles(subtitles);
  }, [subtitles]);
  
  // ===== UPDATE OVERLAYS =====
  
  useEffect(() => {
    setCurrentOverlays(overlays);
  }, [overlays]);
  
  // ===== IMPERATIVE HANDLE =====
  
  useImperativeHandle(ref, () => ({
    // Controles básicos
    play: () => playerRef.current?.play(),
    pause: () => playerRef.current?.pause(),
    seek: (time: number) => playerRef.current?.currentTime(time),
    setVolume: (volume: number) => playerRef.current?.volume(volume),
    setMuted: (muted: boolean) => playerRef.current?.muted(muted),
    setPlaybackRate: (rate: number) => playerRef.current?.playbackRate(rate),
    
    // Informações
    getCurrentTime: () => playerRef.current?.currentTime() || 0,
    getDuration: () => playerRef.current?.duration() || 0,
    getState: () => playerState,
    getCurrentFrame: () => {
      const currentTime = playerRef.current?.currentTime() || 0;
      const fps = 30; // Assumindo 30 FPS
      return Math.floor(currentTime * fps);
    },
    
    // Video.js instance
    getPlayer: () => playerRef.current,
    
    // Overlay controls
    updateSubtitles: (newSubtitles: Subtitle[]) => setCurrentSubtitles(newSubtitles),
    updateOverlays: (newOverlays: Overlay[]) => setCurrentOverlays(newOverlays),
    
    // Canvas controls
    getCanvasContext: () => canvasRef.current?.getContext('2d') || null,
    captureFrame: () => {
      const canvas = canvasRef.current;
      if (!canvas) return '';
      return canvas.toDataURL('image/png');
    }
  }));
  
  // ===== RENDER =====
  
  return (
    <div 
      className={`video-player-container relative ${className}`}
      style={style}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="video-js vjs-default-skin"
        data-setup="{}"
        style={{
          width: '100%',
          height: '100%'
        }}
      />
      
      {/* Overlay Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          width: '100%',
          height: '100%',
          zIndex: 10
        }}
      />
      
      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs p-2 rounded">
          <div>Time: {playerState.currentTime.toFixed(2)}s</div>
          <div>Duration: {playerState.duration.toFixed(2)}s</div>
          <div>Playing: {playerState.isPlaying ? 'Yes' : 'No'}</div>
          <div>Subtitles: {currentSubtitles.length}</div>
          <div>Overlays: {currentOverlays.length}</div>
        </div>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
export type { VideoPlayerProps, VideoPlayerRef }; 