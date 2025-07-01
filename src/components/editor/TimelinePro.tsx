import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Button } from '../ui/button';
import './TimelinePro.css';

interface TimelineProProps {
  videoData?: any;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onCut: (cutTime: number) => void;
  razorToolActive: boolean;
  setRazorToolActive: (active: boolean) => void;
}

interface TrackEffect {
  id: string;
  name: string;
  start: number;
  end: number;
  source?: any;
}

interface Track {
  id: string;
  label: string;
  effects: TrackEffect[];
}

const TimelinePro: React.FC<TimelineProProps> = ({
  videoData,
  currentTime,
  duration,
  onSeek,
  onCut,
  razorToolActive,
  setRazorToolActive
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const audioWaveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  // Estado das tracks
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: 'video-track',
      label: '🎬 Video',
      effects: []
    },
    {
      id: 'captions-track',
      label: '💬 Captions',
      effects: []
    },
    {
      id: 'effects-track',
      label: '✨ Effects',
      effects: []
    },
    {
      id: 'audio-track',
      label: '🎵 Audio',
      effects: []
    }
  ]);

  // Configurar WaveSurfer para waveform de áudio
  useEffect(() => {
    if (audioWaveformRef.current && videoData?.url) {
      // Limpar instância anterior
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }

      try {
        wavesurferRef.current = WaveSurfer.create({
          container: audioWaveformRef.current,
          waveColor: '#FF6B35',
          progressColor: '#FF8C42',
          cursorColor: '#ffffff',
          barWidth: 1,
          barRadius: 1,
          height: 40,
          normalize: true
        });

        wavesurferRef.current.load(videoData.url);
      } catch (error) {
        console.log('WaveSurfer error:', error);
      }
    }

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, [videoData]);

  // Atualizar tracks quando videoData mudar
  useEffect(() => {
    if (videoData && duration) {
      setTracks(prev => prev.map(track => {
        if (track.id === 'video-track') {
          return {
            ...track,
            effects: [{
              id: 'main-video',
              name: videoData.name || 'video.mp4',
              start: 0,
              end: duration,
              source: videoData
            }]
          };
        }
        if (track.id === 'audio-track') {
          return {
            ...track,
            effects: [{
              id: 'main-audio',
              name: 'Audio',
              start: 0,
              end: duration
            }]
          };
        }
        return track;
      }));
    }
  }, [videoData, duration]);

  // Atualizar track de legendas quando legendas são geradas
  useEffect(() => {
    // Simular legendas para demonstração
    if (videoData && duration) {
      const captionSegments = Array.from({ length: 8 }, (_, i) => ({
        id: `caption-${i}`,
        name: `L${i + 1}`,
        start: (i * duration) / 8,
        end: ((i + 1) * duration) / 8
      }));

      setTracks(prev => prev.map(track => 
        track.id === 'captions-track' 
          ? { ...track, effects: captionSegments }
          : track
      ));
    }
  }, [videoData, duration]);

  // Função para cortar vídeo
  const handleCut = useCallback((time: number) => {
    const videoTrack = tracks.find(t => t.id === 'video-track');
    if (!videoTrack || videoTrack.effects.length === 0) return;

    const mainVideo = videoTrack.effects[0];

    if (time > mainVideo.start && time < mainVideo.end) {
      // Dividir o clipe em dois
      const newClips: TrackEffect[] = [
        {
          ...mainVideo,
          id: `${mainVideo.id}-part1`,
          name: `${mainVideo.name} (1/2)`,
          end: time
        },
        {
          ...mainVideo,
          id: `${mainVideo.id}-part2`,
          name: `${mainVideo.name} (2/2)`,
          start: time
        }
      ];

      setTracks(prev => prev.map(track => 
        track.id === 'video-track' 
          ? { ...track, effects: newClips }
          : track
      ));

      // Callback para processar o corte
      onCut(time);
      setRazorToolActive(false);
    }
  }, [tracks, onCut, setRazorToolActive]);

  // Função para formatar tempo
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Função para obter cor da track
  const getTrackColor = (trackId: string): string => {
    const colors: Record<string, string> = {
      'video-track': 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.6))',
      'captions-track': 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.6))',
      'effects-track': 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(168, 85, 247, 0.6))',
      'audio-track': 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(239, 68, 68, 0.6))'
    };
    return colors[trackId] || 'rgba(107, 114, 128, 0.3)';
  };

  // Handle click na timeline para seek
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left - 128; // Subtrair largura do header
      const timelineWidth = rect.width - 128;
      const clickTime = Math.max(0, Math.min(duration, (clickX / timelineWidth) * duration));
      
      if (razorToolActive) {
        handleCut(clickTime);
      } else {
        onSeek(clickTime);
      }
    }
  };

  return (
    <div className="timeline-pro-container bg-black/30 backdrop-blur-xl border-t border-white/10 shadow-2xl" style={{ height: '300px' }}>
      {/* Header da Timeline */}
      <div className="timeline-header bg-black/20 backdrop-blur-sm border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h2 className="text-lg font-bold text-white flex items-center">
            <span className="mr-2">⚡</span>
            Timeline Pro
          </h2>
          
          {/* Ferramentas */}
          <div className="flex items-center space-x-3">
            <Button
              variant={razorToolActive ? "default" : "ghost"}
              onClick={() => setRazorToolActive(!razorToolActive)}
              className={`tool-btn ${razorToolActive 
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/20' 
                : 'bg-white/5 hover:bg-red-600/20 text-gray-300 hover:text-red-300 border border-white/20 hover:border-red-500/50'
              } px-3 py-2 rounded-lg transition-all duration-300 text-sm`}
              title="Ferramenta Razor (C)"
            >
              <span className="mr-1">✂️</span>
              Razor
            </Button>
            
            <Button
              variant="ghost"
              className="tool-btn bg-white/5 hover:bg-blue-600/20 text-gray-300 hover:text-blue-300 border border-white/20 hover:border-blue-500/50 px-3 py-2 rounded-lg transition-all duration-300 text-sm"
              title="Zoom Fit"
            >
              <span className="mr-1">🎯</span>
              Fit
            </Button>
            
            <Button
              variant="ghost"
              className="tool-btn bg-white/5 hover:bg-purple-600/20 text-gray-300 hover:text-purple-300 border border-white/20 hover:border-purple-500/50 px-3 py-2 rounded-lg transition-all duration-300 text-sm"
              title="Configurações"
            >
              <span className="mr-1">⚙️</span>
              Config
            </Button>
          </div>
        </div>
        
        {/* Controles de Reprodução */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="progress-indicator bg-white/5 rounded-full px-2 py-1 border border-white/20">
              <span className="text-xs text-gray-300 font-mono">
                {Math.round((currentTime / duration) * 100) || 0}%
              </span>
            </div>
            
            <div className="time-display bg-white/5 rounded-full px-3 py-1 border border-white/20">
              <span className="text-xs text-white font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Principal */}
      <div 
        ref={timelineRef}
        className={`timeline-main flex-1 relative overflow-hidden ${razorToolActive ? 'cursor-crosshair' : 'cursor-pointer'}`}
        onClick={handleTimelineClick}
      >
        {/* Régua de Tempo */}
        <div className="timeline-ruler h-10 bg-gradient-to-b from-black/40 to-black/20 border-b border-white/10 relative overflow-hidden">
          {/* Marcadores de tempo */}
          <div className="absolute inset-0 flex items-end pb-1" style={{ marginLeft: '128px' }}>
            {Array.from({ length: Math.ceil(duration / 10) + 1 }, (_, i) => (
              <div
                key={i}
                className="time-marker absolute bottom-0"
                style={{ left: `${(i * 10 / duration) * 100}%` }}
              >
                <div className="w-px h-4 bg-white/30"></div>
                <div className="text-xs text-gray-400 mt-1 -translate-x-1/2">
                  {formatTime(i * 10)}
                </div>
              </div>
            ))}
          </div>
          
          {/* Playhead */}
          <div
            className="playhead absolute top-0 w-0.5 h-full z-40 transition-all duration-75"
            style={{ left: `${128 + (currentTime / duration) * (100 - 12.8)}%` }}
          >
            <div className="playhead-handle w-3 h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full -ml-1.5 -mt-1 border border-white shadow-lg shadow-red-500/50"></div>
            <div className="playhead-line w-0.5 bg-gradient-to-b from-red-500 to-red-600 h-full shadow-lg"></div>
          </div>
        </div>

        {/* Tracks Container */}
        <div className="tracks-container flex-1 overflow-y-auto bg-black/10" style={{ height: '220px' }}>
          {tracks.map((track, index) => (
            <div key={track.id} className="track flex items-center h-14 border-b border-white/10 hover:bg-white/5 transition-colors group">
              {/* Track Header */}
              <div className="track-header w-32 px-3 bg-black/20 h-full flex items-center border-r border-white/10 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full border ${
                    track.id === 'video-track' ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-400' :
                    track.id === 'captions-track' ? 'bg-gradient-to-r from-green-500 to-green-600 border-green-400' :
                    track.id === 'effects-track' ? 'bg-gradient-to-r from-purple-500 to-purple-600 border-purple-400' :
                    'bg-gradient-to-r from-orange-500 to-orange-600 border-orange-400'
                  }`}></div>
                  <div>
                    <div className="text-xs font-medium text-white">{track.label}</div>
                    <div className="text-xs text-gray-400">
                      {track.id === 'video-track' ? 'Principal' :
                       track.id === 'captions-track' ? 'IA' :
                       track.id === 'effects-track' ? 'Visual' : 'Wave'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Track Content */}
              <div className="track-content flex-1 relative h-12 mx-2">
                {/* Renderizar effects/clips */}
                {track.effects.map(effect => (
                  <div
                    key={effect.id}
                    className="timeline-effect absolute top-1 h-10 rounded-lg cursor-pointer border-2 border-opacity-50 hover:border-opacity-100 transition-all duration-200 group-hover:shadow-lg"
                    style={{
                      left: `${(effect.start / duration) * 100}%`,
                      width: `${((effect.end - effect.start) / duration) * 100}%`,
                      background: getTrackColor(track.id),
                      backdropFilter: 'blur(4px)',
                      borderColor: track.id === 'video-track' ? '#3b82f6' :
                                   track.id === 'captions-track' ? '#10b981' :
                                   track.id === 'effects-track' ? '#a855f7' : '#f97316'
                    }}
                  >
                    <div className="flex items-center h-full px-2">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm">
                          {track.id === 'video-track' ? '🎬' :
                           track.id === 'captions-track' ? '💬' :
                           track.id === 'effects-track' ? '✨' : '🎵'}
                        </span>
                        <div>
                          <div className="text-xs font-medium text-white truncate">
                            {effect.name}
                          </div>
                          <div className="text-xs text-gray-200">
                            {formatTime(effect.end - effect.start)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Waveform para track de áudio */}
                {track.id === 'audio-track' && (
                  <div 
                    ref={audioWaveformRef} 
                    className="audio-waveform absolute top-1 h-10 w-full opacity-70 rounded"
                    style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.4))' }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimelinePro; 