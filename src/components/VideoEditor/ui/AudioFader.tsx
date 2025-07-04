/**
 * 🎚️ AUDIO FADER - ClipsForge Pro
 * Componente de fader profissional para controle de volume
 */

import React, { useState, useRef, useCallback } from 'react';

interface AudioFaderProps {
  value: number; // 0 to 1
  onChange: (value: number) => void;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  vertical?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  showValue?: boolean;
  disabled?: boolean;
}

export const AudioFader: React.FC<AudioFaderProps> = ({
  value,
  onChange,
  label,
  min = 0,
  max = 1,
  step = 0.01,
  vertical = true,
  size = 'md',
  color = '#3b82f6',
  showValue = true,
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    updateValue(e);
  }, [disabled]);

  const updateValue = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    let percentage: number;

    if (vertical) {
      percentage = 1 - (e.clientY - rect.top) / rect.height;
    } else {
      percentage = (e.clientX - rect.left) / rect.width;
    }

    percentage = Math.max(0, Math.min(1, percentage));
    const newValue = min + percentage * (max - min);
    onChange(Math.round(newValue / step) * step);
  }, [min, max, step, vertical, onChange]);

  const sizeStyles = {
    sm: { width: vertical ? '24px' : '120px', height: vertical ? '120px' : '24px' },
    md: { width: vertical ? '32px' : '160px', height: vertical ? '160px' : '32px' },
    lg: { width: vertical ? '40px' : '200px', height: vertical ? '200px' : '40px' }
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="audio-fader" style={{ 
      display: 'flex', 
      flexDirection: vertical ? 'column' : 'row',
      alignItems: 'center',
      gap: '8px',
      opacity: disabled ? 0.5 : 1
    }}>
      {label && (
        <label style={{ 
          fontSize: '12px', 
          color: '#ccc',
          fontWeight: 'bold'
        }}>
          {label}
        </label>
      )}
      
      <div
        ref={sliderRef}
        className="fader-track"
        style={{
          ...sizeStyles[size],
          backgroundColor: '#2a2a2a',
          border: '1px solid #444',
          borderRadius: '4px',
          position: 'relative',
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
        onMouseDown={handleMouseDown}
      >
        <div
          className="fader-fill"
          style={{
            position: 'absolute',
            backgroundColor: color,
            [vertical ? 'bottom' : 'left']: 0,
            [vertical ? 'width' : 'height']: '100%',
            [vertical ? 'height' : 'width']: `${percentage}%`,
            borderRadius: '2px'
          }}
        />
        
        <div
          className="fader-thumb"
          style={{
            position: 'absolute',
            width: vertical ? '100%' : '8px',
            height: vertical ? '8px' : '100%',
            backgroundColor: '#fff',
            border: '2px solid #333',
            borderRadius: '2px',
            [vertical ? 'bottom' : 'left']: `calc(${percentage}% - 4px)`,
            cursor: disabled ? 'not-allowed' : 'grab'
          }}
        />
      </div>
      
      {showValue && (
        <span style={{ 
          fontSize: '10px', 
          color: '#999',
          minWidth: '40px',
          textAlign: 'center'
        }}>
          {Math.round(value * 100)}%
        </span>
      )}
    </div>
  );
};

export default AudioFader;
