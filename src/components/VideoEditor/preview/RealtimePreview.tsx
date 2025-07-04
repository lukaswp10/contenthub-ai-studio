/**
 * 🎥 REAL-TIME PREVIEW - ClipsForge Pro
 * Sistema de preview em tempo real com GPU acceleration
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../ui/button';
import { 
  Play, Pause, Square, Volume2, VolumeX, 
  Maximize2, Settings, Monitor, Zap
} from 'lucide-react';

interface RealtimePreviewProps {
  width?: number;
  height?: number;
  quality?: 'draft' | 'preview' | 'full';
  gpuAcceleration?: boolean;
  className?: string;
}

export const RealtimePreview: React.FC<RealtimePreviewProps> = ({
  width = 1920,
  height = 1080,
  quality = 'preview',
  gpuAcceleration = true,
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [fps, setFps] = useState(30);
  const [cpuUsage, setCpuUsage] = useState(45);
  const [gpuUsage, setGpuUsage] = useState(32);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Simulação de métricas em tempo real
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime(prev => prev + 1/30);
        setFps(28 + Math.random() * 4);
        setCpuUsage(40 + Math.random() * 20);
        setGpuUsage(25 + Math.random() * 30);
      }, 33);
      
      return () => clearInterval(interval);
    }
  }, [isPlaying]);
  
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className={`realtime-preview ${className}`} style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#1a1a1a',
      border: '1px solid #333',
      borderRadius: '4px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#2a2a2a'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
            🎥 Real-time Preview
          </h3>
          
          {gpuAcceleration && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              backgroundColor: '#10b981',
              borderRadius: '12px',
              fontSize: '10px',
              color: '#fff'
            }}>
              <Zap size={10} />
              GPU
            </div>
          )}
          
          <div style={{
            padding: '2px 6px',
            backgroundColor: '#3b82f6',
            borderRadius: '12px',
            fontSize: '10px',
            color: '#fff',
            textTransform: 'uppercase'
          }}>
            {quality}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button variant="ghost" size="sm">
            <Settings size={16} />
          </Button>
          <Button variant="ghost" size="sm">
            <Maximize2 size={16} />
          </Button>
        </div>
      </div>
      
      {/* Preview Area */}
      <div style={{ flex: 1, display: 'flex' }}>
        {/* Main Preview */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          backgroundColor: '#000'
        }}>
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              border: '1px solid #333',
              backgroundColor: '#1a1a1a'
            }}
          />
          
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#666',
            fontSize: '48px',
            textAlign: 'center'
          }}>
            🎬
            <div style={{ fontSize: '16px', marginTop: '8px' }}>
              Preview Engine - Fase 7
            </div>
          </div>
          
          {/* Performance Overlay */}
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '10px',
            color: '#fff',
            fontFamily: 'monospace'
          }}>
            <div>FPS: {fps.toFixed(1)}</div>
            <div>CPU: {cpuUsage.toFixed(1)}%</div>
            <div>GPU: {gpuUsage.toFixed(1)}%</div>
          </div>
        </div>
        
        {/* Performance Panel */}
        <div style={{
          width: '200px',
          backgroundColor: '#2a2a2a',
          borderLeft: '1px solid #333',
          padding: '12px'
        }}>
          <h4 style={{
            margin: '0 0 12px 0',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Monitor size={12} />
            Performance
          </h4>
          
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '10px', color: '#999', marginBottom: '4px' }}>
              CPU: {cpuUsage.toFixed(1)}%
            </div>
            <div style={{
              width: '100%',
              height: '4px',
              backgroundColor: '#333',
              borderRadius: '2px'
            }}>
              <div style={{
                width: `${cpuUsage}%`,
                height: '100%',
                backgroundColor: '#3b82f6',
                borderRadius: '2px'
              }} />
            </div>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '10px', color: '#999', marginBottom: '4px' }}>
              GPU: {gpuUsage.toFixed(1)}%
            </div>
            <div style={{
              width: '100%',
              height: '4px',
              backgroundColor: '#333',
              borderRadius: '2px'
            }}>
              <div style={{
                width: `${gpuUsage}%`,
                height: '100%',
                backgroundColor: '#10b981',
                borderRadius: '2px'
              }} />
            </div>
          </div>
          
          <div style={{
            padding: '8px',
            backgroundColor: '#1a1a1a',
            borderRadius: '4px',
            fontSize: '10px',
            color: '#999'
          }}>
            <div>Resolution: {width}×{height}</div>
            <div>Quality: {quality}</div>
            <div>FPS: {fps.toFixed(1)}</div>
            <div>Time: {formatTime(currentTime)}</div>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div style={{
        padding: '8px 12px',
        borderTop: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#2a2a2a'
      }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsPlaying(!isPlaying)}
          style={{ color: '#fff' }}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
          style={{ color: '#fff' }}
        >
          <Square size={16} />
        </Button>
        
        <div style={{
          padding: '4px 8px',
          backgroundColor: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '4px',
          color: '#fff',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          {formatTime(currentTime)}
        </div>
        
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMuted(!muted)}
            style={{ color: muted ? '#ef4444' : '#fff' }}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </Button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={{
              width: '60px',
              height: '4px',
              backgroundColor: '#333',
              borderRadius: '2px'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default RealtimePreview;
