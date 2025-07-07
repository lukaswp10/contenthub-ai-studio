/**
 * 🎬 TIMELINE RULER - ClipsForge Pro
 * 
 * Régua de tempo profissional com:
 * - ✅ Marcações precisas
 * - ✅ Zoom adaptativo
 * - ✅ Timecode profissional
 * - ✅ Performance otimizada
 * 
 * @author ClipsForge Team
 * @version 1.0.0
 */

import React, { useMemo } from 'react';

interface TimelineRulerProps {
  width: number;
  height?: number;
  duration: number;
  zoom: number;
  scrollX: number;
  currentTime: number;
  pixelsPerSecond: number;
  onTimeClick?: (time: number) => void;
  showFrames?: boolean;
  fps?: number;
}

const TimelineRuler: React.FC<TimelineRulerProps> = ({
  width,
  height = 40,
  duration,
  zoom,
  scrollX,
  currentTime,
  pixelsPerSecond,
  onTimeClick,
  showFrames = true,
  fps = 30
}) => {
  
  // ===== CÁLCULOS =====
  
  const timeToPixel = (time: number): number => {
    return (time * pixelsPerSecond) - scrollX;
  };
  
  const pixelToTime = (pixel: number): number => {
    return (pixel + scrollX) / pixelsPerSecond;
  };
  
  const visibleTimeRange = useMemo(() => {
    const start = Math.max(0, pixelToTime(0));
    const end = Math.min(duration, pixelToTime(width - 200));
    return { start, end };
  }, [pixelToTime, width, duration]);
  
  // ===== FORMATAÇÃO =====
  
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    
    if (showFrames) {
      const frames = Math.floor((time % 1) * fps);
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // ===== MARCAÇÕES =====
  
  const tickMarks = useMemo(() => {
    const { start, end } = visibleTimeRange;
    const marks: Array<{
      time: number;
      x: number;
      isMajor: boolean;
      label?: string;
    }> = [];
    
    // Determinar intervalo baseado no zoom
    let majorInterval = 10; // segundos
    let minorInterval = 1;
    
    if (zoom >= 8) {
      majorInterval = 1;
      minorInterval = 0.1;
    } else if (zoom >= 4) {
      majorInterval = 2;
      minorInterval = 0.5;
    } else if (zoom >= 2) {
      majorInterval = 5;
      minorInterval = 1;
    } else if (zoom >= 1) {
      majorInterval = 10;
      minorInterval = 2;
    } else {
      majorInterval = 30;
      minorInterval = 5;
    }
    
    // Gerar marcações menores
    for (let time = Math.floor(start / minorInterval) * minorInterval; time <= end; time += minorInterval) {
      const x = timeToPixel(time);
      if (x >= 0 && x <= width - 200) {
        marks.push({
          time,
          x: x + 200,
          isMajor: false
        });
      }
    }
    
    // Gerar marcações principais
    for (let time = Math.floor(start / majorInterval) * majorInterval; time <= end; time += majorInterval) {
      const x = timeToPixel(time);
      if (x >= 0 && x <= width - 200) {
        marks.push({
          time,
          x: x + 200,
          isMajor: true,
          label: formatTime(time)
        });
      }
    }
    
    return marks;
  }, [visibleTimeRange, zoom, timeToPixel, width, formatTime]);
  
  // ===== HANDLERS =====
  
  const handleClick = (e: React.MouseEvent) => {
    if (!onTimeClick) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left - 200;
    const time = pixelToTime(clickX);
    
    onTimeClick(Math.max(0, Math.min(duration, time)));
  };
  
  // ===== RENDER =====
  
  return (
    <div
      className="timeline-ruler relative bg-gray-800 border-b border-gray-600 cursor-pointer select-none"
      style={{ width, height }}
      onClick={handleClick}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-700 to-gray-800" />
      
      {/* Tick marks */}
      {tickMarks.map((mark, index) => (
        <div
          key={`${mark.time}-${index}`}
          className={`absolute top-0 ${
            mark.isMajor 
              ? 'h-full w-px bg-gray-300' 
              : 'h-1/2 w-px bg-gray-500 opacity-60'
          }`}
          style={{ left: mark.x }}
        >
          {/* Label para marcações principais */}
          {mark.isMajor && mark.label && (
            <div className="absolute top-1 left-1 text-xs text-gray-300 font-mono whitespace-nowrap">
              {mark.label}
            </div>
          )}
        </div>
      ))}
      
      {/* Current time indicator */}
      <div
        className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
        style={{ left: timeToPixel(currentTime) + 200 }}
      >
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full border border-white shadow-lg" />
      </div>
      
      {/* Hover effect */}
      <div className="absolute inset-0 hover:bg-white hover:bg-opacity-5 transition-colors duration-200" />
    </div>
  );
};

export default TimelineRuler; 