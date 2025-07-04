/**
 * 🎛️ AUDIO CHANNEL STRIP - ClipsForge Pro
 * Canal de áudio completo com controles profissionais
 */

import React, { useState, useCallback } from 'react';
import { Button } from '../../ui/button';
import AudioFader from '../ui/AudioFader';
import AudioMeter from '../ui/AudioMeter';
import { AudioTrack, AudioEffect } from '../../../types/audio.types';
import { Volume2, VolumeX, Settings, Headphones, Mic, MicOff } from 'lucide-react';

interface AudioChannelStripProps {
  track: AudioTrack;
  onVolumeChange: (trackId: string, volume: number) => void;
  onMuteToggle: (trackId: string) => void;
  onSoloToggle: (trackId: string) => void;
  onEffectAdd: (trackId: string, effect: AudioEffect) => void;
  onEffectRemove: (trackId: string, effectId: string) => void;
  level?: number;
  peak?: number;
  className?: string;
}

export const AudioChannelStrip: React.FC<AudioChannelStripProps> = ({
  track,
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
  onEffectAdd,
  onEffectRemove,
  level = 0,
  peak = 0,
  className = ''
}) => {
  const [showEffects, setShowEffects] = useState(false);
  const [panValue, setPanValue] = useState(0); // -1 to 1

  const handleVolumeChange = useCallback((value: number) => {
    onVolumeChange(track.id, value);
  }, [track.id, onVolumeChange]);

  const handleMuteToggle = useCallback(() => {
    onMuteToggle(track.id);
  }, [track.id, onMuteToggle]);

  const handleSoloToggle = useCallback(() => {
    onSoloToggle(track.id);
  }, [track.id, onSoloToggle]);

  const handlePanChange = useCallback((value: number) => {
    setPanValue((value - 0.5) * 2); // Convert 0-1 to -1 to 1
  }, []);

  return (
    <div 
      className={`audio-channel-strip ${className}`}
      style={{
        width: '80px',
        height: '100%',
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '4px',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'center'
      }}
    >
      {/* Track Name */}
      <div style={{
        fontSize: '10px',
        color: '#ccc',
        fontWeight: 'bold',
        textAlign: 'center',
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {track.name}
      </div>

      {/* Effects Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowEffects(!showEffects)}
        style={{
          width: '32px',
          height: '24px',
          padding: '0',
          backgroundColor: showEffects ? '#3b82f6' : 'transparent'
        }}
        title="Effects"
      >
        <Settings size={12} />
      </Button>

      {/* Pan Control */}
      <div style={{ width: '100%' }}>
        <AudioFader
          value={panValue * 0.5 + 0.5} // Convert -1 to 1 back to 0-1
          onChange={handlePanChange}
          label="PAN"
          vertical={false}
          size="sm"
          color="#8b5cf6"
          showValue={false}
        />
        <div style={{
          fontSize: '8px',
          color: '#999',
          textAlign: 'center',
          marginTop: '2px'
        }}>
          {panValue === 0 ? 'C' : panValue < 0 ? `L${Math.abs(panValue * 100).toFixed(0)}` : `R${(panValue * 100).toFixed(0)}`}
        </div>
      </div>

      {/* Solo/Mute Buttons */}
      <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSoloToggle}
          style={{
            flex: 1,
            height: '24px',
            padding: '0',
            fontSize: '10px',
            backgroundColor: track.solo ? '#f59e0b' : 'transparent',
            color: track.solo ? '#000' : '#ccc'
          }}
        >
          S
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMuteToggle}
          style={{
            flex: 1,
            height: '24px',
            padding: '0',
            fontSize: '10px',
            backgroundColor: track.muted ? '#ef4444' : 'transparent',
            color: track.muted ? '#fff' : '#ccc'
          }}
        >
          M
        </Button>
      </div>

      {/* Audio Meter */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <AudioMeter
          level={level}
          peak={peak}
          vertical={true}
          size="sm"
          showPeak={true}
          showClipping={true}
        />
      </div>

      {/* Volume Fader */}
      <div style={{ height: '120px' }}>
        <AudioFader
          value={track.volume}
          onChange={handleVolumeChange}
          vertical={true}
          size="sm"
          color="#10b981"
          showValue={false}
        />
      </div>

      {/* Volume Value */}
      <div style={{
        fontSize: '8px',
        color: '#999',
        textAlign: 'center'
      }}>
        {Math.round(track.volume * 100)}
      </div>

      {/* Effects List */}
      {showEffects && (
        <div style={{
          position: 'absolute',
          left: '100%',
          top: '0',
          width: '200px',
          backgroundColor: '#2a2a2a',
          border: '1px solid #444',
          borderRadius: '4px',
          padding: '8px',
          zIndex: 1000
        }}>
          <div style={{
            fontSize: '12px',
            color: '#fff',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            Effects Chain
          </div>
          
          {track.effects.map((effect, index) => (
            <div
              key={effect.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px',
                backgroundColor: '#1a1a1a',
                borderRadius: '2px',
                marginBottom: '4px'
              }}
            >
              <span style={{ fontSize: '10px', color: '#ccc' }}>
                {effect.type}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEffectRemove(track.id, effect.id)}
                style={{
                  width: '16px',
                  height: '16px',
                  padding: '0',
                  color: '#ef4444'
                }}
              >
                ×
              </Button>
            </div>
          ))}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Add new effect logic here
              console.log('Add effect to track:', track.id);
            }}
            style={{
              width: '100%',
              height: '24px',
              fontSize: '10px',
              color: '#3b82f6'
            }}
          >
            + Add Effect
          </Button>
        </div>
      )}
    </div>
  );
};

export default AudioChannelStrip;
