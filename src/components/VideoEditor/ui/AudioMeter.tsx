/**
 * 📊 AUDIO METER - ClipsForge Pro
 * Componente de medidor de nível de áudio profissional
 */

import React, { useEffect, useRef, useState } from 'react';

interface AudioMeterProps {
  level: number; // 0 to 1
  peak?: number; // 0 to 1
  label?: string;
  vertical?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showPeak?: boolean;
  showClipping?: boolean;
  smoothing?: number;
}

export const AudioMeter: React.FC<AudioMeterProps> = ({
  level,
  peak = 0,
  label,
  vertical = true,
  size = 'md',
  showPeak = true,
  showClipping = true,
  smoothing = 0.8
}) => {
  const [smoothedLevel, setSmoothedLevel] = useState(level);
  const [peakHold, setPeakHold] = useState(peak);
  const [isClipping, setIsClipping] = useState(false);
  const animationRef = useRef<number>();

  useEffect(() => {
    const animate = () => {
      setSmoothedLevel(prev => prev * smoothing + level * (1 - smoothing));
      
      if (peak > peakHold) {
        setPeakHold(peak);
      } else {
        setPeakHold(prev => Math.max(peak, prev * 0.995));
      }
      
      setIsClipping(level > 0.95);
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [level, peak, peakHold, smoothing]);

  const sizeStyles = {
    sm: { width: vertical ? '8px' : '80px', height: vertical ? '80px' : '8px' },
    md: { width: vertical ? '12px' : '120px', height: vertical ? '120px' : '12px' },
    lg: { width: vertical ? '16px' : '160px', height: vertical ? '160px' : '16px' }
  };

  const getColor = (level: number) => {
    if (level > 0.9) return '#ef4444'; // Red
    if (level > 0.7) return '#f59e0b'; // Yellow
    return '#10b981'; // Green
  };

  const levelPercentage = smoothedLevel * 100;
  const peakPercentage = peakHold * 100;

  return (
    <div className="audio-meter" style={{ 
      display: 'flex', 
      flexDirection: vertical ? 'column' : 'row',
      alignItems: 'center',
      gap: '4px'
    }}>
      {label && (
        <label style={{ 
          fontSize: '10px', 
          color: '#ccc',
          fontWeight: 'bold'
        }}>
          {label}
        </label>
      )}
      
      <div
        className="meter-container"
        style={{
          ...sizeStyles[size],
          backgroundColor: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '2px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Level indicator */}
        <div
          className="meter-level"
          style={{
            position: 'absolute',
            backgroundColor: getColor(smoothedLevel),
            [vertical ? 'bottom' : 'left']: 0,
            [vertical ? 'width' : 'height']: '100%',
            [vertical ? 'height' : 'width']: `${levelPercentage}%`,
            transition: 'all 0.1s ease'
          }}
        />
        
        {/* Peak indicator */}
        {showPeak && peakHold > 0 && (
          <div
            className="meter-peak"
            style={{
              position: 'absolute',
              backgroundColor: '#fff',
              [vertical ? 'bottom' : 'left']: `${peakPercentage}%`,
              [vertical ? 'width' : 'height']: '100%',
              [vertical ? 'height' : 'width']: '2px',
              transform: vertical ? 'translateY(1px)' : 'translateX(-1px)'
            }}
          />
        )}
        
        {/* Clipping indicator */}
        {showClipping && isClipping && (
          <div
            className="meter-clip"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: '#ef4444',
              opacity: 0.8
            }}
          />
        )}
      </div>
      
      {/* Value display */}
      <span style={{ 
        fontSize: '8px', 
        color: isClipping ? '#ef4444' : '#999',
        fontWeight: isClipping ? 'bold' : 'normal'
      }}>
        {Math.round(smoothedLevel * 100)}
      </span>
    </div>
  );
};

export default AudioMeter;
