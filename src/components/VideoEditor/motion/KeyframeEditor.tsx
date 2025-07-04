/**
 * ⏱️ KEYFRAME EDITOR - ClipsForge Pro
 * Editor de keyframes para animações
 */

import React, { useState, useCallback } from 'react';
import { Button } from '../../ui/button';
import { Keyframe, EasingFunction } from '../../../types/motion.types';
import { Play, Pause, SkipBack, SkipForward, Plus, Trash2 } from 'lucide-react';

interface KeyframeEditorProps {
  keyframes: Keyframe[];
  currentTime: number;
  duration: number;
  onKeyframeAdd: (time: number) => void;
  onKeyframeRemove: (keyframeId: string) => void;
  onKeyframeUpdate: (keyframeId: string, updates: Partial<Keyframe>) => void;
  onTimeChange: (time: number) => void;
  className?: string;
}

export const KeyframeEditor: React.FC<KeyframeEditorProps> = ({
  keyframes,
  currentTime,
  duration,
  onKeyframeAdd,
  onKeyframeRemove,
  onKeyframeUpdate,
  onTimeChange,
  className = ''
}) => {
  const [selectedKeyframe, setSelectedKeyframe] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / rect.width) * duration;
    onTimeChange(time);
  }, [duration, onTimeChange]);

  const handleKeyframeClick = useCallback((keyframeId: string) => {
    setSelectedKeyframe(keyframeId);
  }, []);

  const handleAddKeyframe = useCallback(() => {
    onKeyframeAdd(currentTime);
  }, [currentTime, onKeyframeAdd]);

  const easingOptions: { value: EasingFunction; label: string }[] = [
    { value: 'linear', label: 'Linear' },
    { value: 'ease', label: 'Ease' },
    { value: 'ease-in', label: 'Ease In' },
    { value: 'ease-out', label: 'Ease Out' },
    { value: 'ease-in-out', label: 'Ease In Out' },
    { value: 'bounce', label: 'Bounce' },
    { value: 'elastic', label: 'Elastic' }
  ];

  const selectedKf = keyframes.find(kf => kf.id === selectedKeyframe);

  return (
    <div className={`keyframe-editor ${className}`} style={{
      width: '100%',
      height: '200px',
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
        justifyContent: 'space-between'
      }}>
        <h4 style={{
          margin: 0,
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#fff'
        }}>
          ⏱️ Keyframe Editor
        </h4>
        
        <div style={{ display: 'flex', gap: '4px' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTimeChange(0)}
            style={{ padding: '4px' }}
          >
            <SkipBack size={12} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            style={{ padding: '4px' }}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTimeChange(duration)}
            style={{ padding: '4px' }}
          >
            <SkipForward size={12} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddKeyframe}
            style={{ padding: '4px', color: '#10b981' }}
          >
            <Plus size={12} />
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div style={{
        flex: 1,
        position: 'relative',
        margin: '8px',
        backgroundColor: '#0f0f0f',
        border: '1px solid #333',
        borderRadius: '2px',
        cursor: 'pointer'
      }} onClick={handleTimelineClick}>
        
        {/* Timeline track */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '8px',
          right: '8px',
          height: '2px',
          backgroundColor: '#333',
          transform: 'translateY(-50%)'
        }} />
        
        {/* Keyframes */}
        {keyframes.map(keyframe => (
          <div
            key={keyframe.id}
            style={{
              position: 'absolute',
              left: `${(keyframe.time / duration) * 100}%`,
              top: '50%',
              width: '12px',
              height: '12px',
              backgroundColor: selectedKeyframe === keyframe.id ? '#3b82f6' : '#10b981',
              border: '2px solid #fff',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              cursor: 'pointer',
              zIndex: 2
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleKeyframeClick(keyframe.id);
            }}
          />
        ))}
        
        {/* Playhead */}
        <div style={{
          position: 'absolute',
          left: `${(currentTime / duration) * 100}%`,
          top: '0',
          bottom: '0',
          width: '2px',
          backgroundColor: '#ef4444',
          transform: 'translateX(-50%)',
          zIndex: 3
        }} />
      </div>

      {/* Keyframe Properties */}
      {selectedKf && (
        <div style={{
          padding: '8px 12px',
          borderTop: '1px solid #333',
          backgroundColor: '#2a2a2a'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '11px'
          }}>
            <div>
              <label style={{ color: '#ccc', marginRight: '4px' }}>Time:</label>
              <input
                type="number"
                value={selectedKf.time.toFixed(2)}
                onChange={(e) => onKeyframeUpdate(selectedKf.id, { time: parseFloat(e.target.value) })}
                style={{
                  width: '60px',
                  padding: '2px 4px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '2px',
                  color: '#fff',
                  fontSize: '10px'
                }}
              />
            </div>
            
            <div>
              <label style={{ color: '#ccc', marginRight: '4px' }}>Easing:</label>
              <select
                value={selectedKf.easing}
                onChange={(e) => onKeyframeUpdate(selectedKf.id, { easing: e.target.value as EasingFunction })}
                style={{
                  padding: '2px 4px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '2px',
                  color: '#fff',
                  fontSize: '10px'
                }}
              >
                {easingOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onKeyframeRemove(selectedKf.id)}
              style={{ 
                padding: '2px 4px',
                color: '#ef4444',
                marginLeft: 'auto'
              }}
            >
              <Trash2 size={10} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyframeEditor;
