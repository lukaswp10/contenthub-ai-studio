/**
 * 🎛️ AUDIO MIXER PANEL - ClipsForge Pro
 * Painel de mixagem de áudio profissional
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import AudioChannelStrip from './controls/AudioChannelStrip';
import { audioEngine } from '../../utils/audioEngine';
import { AudioTrack, AudioEffect, AudioMixer } from '../../types/audio.types';
import { Volume2, VolumeX, Settings, Plus, Trash2 } from 'lucide-react';

interface AudioMixerPanelProps {
  tracks: AudioTrack[];
  onTrackAdd: () => void;
  onTrackRemove: (trackId: string) => void;
  onTrackUpdate: (trackId: string, updates: Partial<AudioTrack>) => void;
  onEffectAdd: (trackId: string, effect: AudioEffect) => void;
  onEffectRemove: (trackId: string, effectId: string) => void;
  className?: string;
}

export const AudioMixerPanel: React.FC<AudioMixerPanelProps> = ({
  tracks,
  onTrackAdd,
  onTrackRemove,
  onTrackUpdate,
  onEffectAdd,
  onEffectRemove,
  className = ''
}) => {
  const [audioLevels, setAudioLevels] = useState<Record<string, { level: number; peak: number }>>({});
  const [masterVolume, setMasterVolume] = useState(1);
  const [masterMuted, setMasterMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showMasterEffects, setShowMasterEffects] = useState(false);

  // Initialize audio engine
  useEffect(() => {
    const initAudio = async () => {
      try {
        await audioEngine.initialize();
        console.log('🎵 Audio Engine initialized in mixer');
      } catch (error) {
        console.error('Failed to initialize audio engine:', error);
      }
    };

    initAudio();
  }, []);

  // Monitor audio levels
  useEffect(() => {
    const interval = setInterval(() => {
      const levels: Record<string, { level: number; peak: number }> = {};
      
      tracks.forEach(track => {
        const analysis = audioEngine.getAnalysis(track.id);
        if (analysis) {
          levels[track.id] = {
            level: analysis.rms,
            peak: analysis.peak
          };
        }
      });
      
      setAudioLevels(levels);
    }, 50); // 20fps update rate

    return () => clearInterval(interval);
  }, [tracks]);

  const handleVolumeChange = useCallback((trackId: string, volume: number) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      onTrackUpdate(trackId, { volume });
      // Update track volume through track update
      console.log(`🎚️ Volume changed for track ${trackId}: ${volume}`);
    }
  }, [tracks, onTrackUpdate]);

  const handleMuteToggle = useCallback((trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      const newMuted = !track.muted;
      onTrackUpdate(trackId, { muted: newMuted });
      console.log(`🔇 Mute toggled for track ${trackId}: ${newMuted}`);
    }
  }, [tracks, onTrackUpdate]);

  const handleSoloToggle = useCallback((trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      const newSolo = !track.solo;
      onTrackUpdate(trackId, { solo: newSolo });
      console.log(`🎯 Solo toggled for track ${trackId}: ${newSolo}`);
    }
  }, [tracks, onTrackUpdate]);

  const handleMasterVolumeChange = useCallback((volume: number) => {
    setMasterVolume(volume);
    console.log(`🎛️ Master volume changed: ${volume}`);
  }, []);

  const handleMasterMuteToggle = useCallback(() => {
    const newMuted = !masterMuted;
    setMasterMuted(newMuted);
    console.log(`🔇 Master mute toggled: ${newMuted}`);
  }, [masterMuted]);

  const handleRecordToggle = useCallback(() => {
    if (isRecording) {
      audioEngine.stop();
      console.log('⏹️ Recording stopped');
    } else {
      audioEngine.play();
      console.log('⏺️ Recording started');
    }
    setIsRecording(!isRecording);
  }, [isRecording]);

  return (
    <div 
      className={`audio-mixer-panel ${className}`}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '12px',
        borderBottom: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#fff'
        }}>
          🎛️ Audio Mixer
        </h3>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onTrackAdd}
            title="Add Track"
            style={{
              color: '#10b981'
            }}
          >
            <Plus size={16} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRecordToggle}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
            style={{
              color: isRecording ? '#ef4444' : '#ccc',
              backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.1)' : 'transparent'
            }}
          >
            ⏺
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMasterEffects(!showMasterEffects)}
            title="Master Effects"
            style={{
              color: showMasterEffects ? '#3b82f6' : '#ccc'
            }}
          >
            <Settings size={16} />
          </Button>
        </div>
      </div>

      {/* Mixer Channels */}
      <div style={{
        flex: 1,
        display: 'flex',
        padding: '12px',
        gap: '8px',
        overflowX: 'auto',
        overflowY: 'hidden'
      }}>
        {/* Track Channels */}
        {tracks.map(track => (
          <div key={track.id} style={{ position: 'relative' }}>
            <AudioChannelStrip
              track={track}
              onVolumeChange={handleVolumeChange}
              onMuteToggle={handleMuteToggle}
              onSoloToggle={handleSoloToggle}
              onEffectAdd={onEffectAdd}
              onEffectRemove={onEffectRemove}
              level={audioLevels[track.id]?.level || 0}
              peak={audioLevels[track.id]?.peak || 0}
            />
            
            {/* Remove Track Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTrackRemove(track.id)}
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                width: '20px',
                height: '20px',
                padding: '0',
                backgroundColor: '#ef4444',
                color: '#fff',
                borderRadius: '50%',
                fontSize: '12px'
              }}
              title="Remove Track"
            >
              ×
            </Button>
          </div>
        ))}

        {/* Master Channel */}
        <div style={{
          width: '100px',
          height: '100%',
          backgroundColor: '#2a2a2a',
          border: '2px solid #3b82f6',
          borderRadius: '4px',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          alignItems: 'center',
          marginLeft: '16px'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#3b82f6',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            MASTER
          </div>

          {/* Master Mute */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMasterMuteToggle}
            style={{
              width: '60px',
              height: '24px',
              padding: '0',
              fontSize: '10px',
              backgroundColor: masterMuted ? '#ef4444' : 'transparent',
              color: masterMuted ? '#fff' : '#ccc'
            }}
          >
            {masterMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </Button>

          {/* Master Meter */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            {/* Master meter would go here */}
            <div style={{
              width: '16px',
              height: '120px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '2px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                bottom: 0,
                width: '100%',
                height: `${masterVolume * 100}%`,
                backgroundColor: '#3b82f6',
                transition: 'height 0.1s ease'
              }} />
            </div>
          </div>

          {/* Master Volume */}
          <div style={{ height: '120px' }}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={masterVolume}
              onChange={(e) => handleMasterVolumeChange(parseFloat(e.target.value))}
              style={{
                width: '120px',
                height: '20px',
                transform: 'rotate(-90deg)',
                transformOrigin: 'center',
                appearance: 'none',
                background: '#333',
                outline: 'none'
              }}
            />
          </div>

          {/* Master Volume Value */}
          <div style={{
            fontSize: '10px',
            color: '#3b82f6',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            {Math.round(masterVolume * 100)}
          </div>
        </div>
      </div>

      {/* Master Effects Panel */}
      {showMasterEffects && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          right: '0',
          width: '300px',
          height: '200px',
          backgroundColor: '#2a2a2a',
          border: '1px solid #444',
          borderRadius: '4px',
          padding: '12px',
          zIndex: 1000
        }}>
          <div style={{
            fontSize: '12px',
            color: '#fff',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            Master Effects Chain
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{
              padding: '8px',
              backgroundColor: '#1a1a1a',
              borderRadius: '2px',
              fontSize: '10px',
              color: '#ccc'
            }}>
              Compressor - Threshold: -12dB
            </div>
            <div style={{
              padding: '8px',
              backgroundColor: '#1a1a1a',
              borderRadius: '2px',
              fontSize: '10px',
              color: '#ccc'
            }}>
              EQ - High Pass: 80Hz
            </div>
            <div style={{
              padding: '8px',
              backgroundColor: '#1a1a1a',
              borderRadius: '2px',
              fontSize: '10px',
              color: '#ccc'
            }}>
              Limiter - Ceiling: -0.1dB
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            style={{
              width: '100%',
              height: '24px',
              fontSize: '10px',
              color: '#3b82f6',
              marginTop: '8px'
            }}
          >
            + Add Master Effect
          </Button>
        </div>
      )}
    </div>
  );
};

export default AudioMixerPanel;
