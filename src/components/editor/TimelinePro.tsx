import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Button } from '../ui/button';
import './TimelinePro.css';
import { commandManager, RazorCutCommand, TrimCommand } from '../../utils/commandManager';

interface TimelineProProps {
  videoData?: any;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onCut: (cutTime: number) => void;
  razorToolActive: boolean;
  setRazorToolActive: (active: boolean) => void;
  timelineLayers: TimelineLayer[];
  setTimelineLayers: (layers: TimelineLayer[]) => void;
  cutPoints: CutPoint[];
  setCutPoints: (points: CutPoint[]) => void;
}

interface TimelineLayer {
  id: string;
  type: 'video' | 'audio' | 'text' | 'effect';
  name: string;
  start: number;
  duration: number;
  data: any;
  color: string;
  locked: boolean;
}

interface CutPoint {
  id: string;
  time: number;
  type: 'cut' | 'split';
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
  setRazorToolActive,
  timelineLayers,
  setTimelineLayers,
  cutPoints,
  setCutPoints
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const audioWaveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  // ➕ ESTADOS para Trim Handles
  const [isDragging, setIsDragging] = useState(false);
  const [dragData, setDragData] = useState<{
    layerId: string;
    type: 'start' | 'end';
    originalValue: number;
    startX: number;
  } | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<{
    layerId: string;
    type: 'start' | 'end';
  } | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  // ➕ TRACKS baseadas nos timelineLayers recebidos
  const tracks = useMemo(() => [
    {
      id: 'video-track',
      label: '🎬 Video',
      effects: timelineLayers.filter(layer => layer.type === 'video').map(layer => ({
        id: layer.id,
        name: layer.name,
        start: layer.start,
        end: layer.start + layer.duration,
        source: layer.data
      }))
    },
    {
      id: 'captions-track',
      label: '💬 Captions',
      effects: timelineLayers.filter(layer => layer.type === 'text').map(layer => ({
        id: layer.id,
        name: layer.name,
        start: layer.start,
        end: layer.start + layer.duration
      }))
    },
    {
      id: 'effects-track',
      label: '✨ Effects',
      effects: timelineLayers.filter(layer => layer.type === 'effect').map(layer => ({
        id: layer.id,
        name: layer.name,
        start: layer.start,
        end: layer.start + layer.duration
      }))
    },
    {
      id: 'audio-track',
      label: '🎵 Audio',
      effects: timelineLayers.filter(layer => layer.type === 'audio').map(layer => ({
        id: layer.id,
        name: layer.name,
        start: layer.start,
        end: layer.start + layer.duration
      }))
    }
  ], [timelineLayers]);

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

  // ✂️ FUNÇÃO DE CORTE CORRIGIDA - trabalha com timelineLayers
  const handleCut = useCallback((time: number) => {
    console.log(`✂️ TimelinePro: Executando corte no tempo ${formatTime(time)}`);
    
    // Encontrar layers que podem ser cortados no tempo especificado
    const affectedLayers = timelineLayers.filter(layer => 
      time > layer.start && time < (layer.start + layer.duration) && !layer.locked
    );

    if (affectedLayers.length === 0) {
      console.log('❌ Nenhum layer encontrado para corte no tempo:', formatTime(time));
      return;
    }

    // ✅ USAR COMANDO para undo/redo
    const razorCommand = new RazorCutCommand(
      time,
      timelineLayers,
      cutPoints,
      setTimelineLayers,
      setCutPoints
    );

    try {
      commandManager.executeCommand(razorCommand);
      
      // Callback para o componente pai
      onCut(time);
      
      // Auto-desativar razor
      setTimeout(() => {
        setRazorToolActive(false);
        console.log('🔄 Razor tool desativado automaticamente');
      }, 1000);

    } catch (error) {
      console.error('❌ Erro ao executar comando de corte:', error);
      alert('❌ Não foi possível realizar o corte. Tente novamente.');
    }
  }, [timelineLayers, setTimelineLayers, cutPoints, setCutPoints, onCut, setRazorToolActive]);

  // 🎯 FUNÇÕES TRIM HANDLES
  const startTrimDrag = useCallback((e: React.MouseEvent, layerId: string, type: 'start' | 'end') => {
    e.stopPropagation();
    console.log(`🎯 Iniciando trim ${type} no layer ${layerId}`);
    
    const layer = timelineLayers.find(l => l.id === layerId);
    if (!layer || layer.locked) {
      console.log('❌ Layer bloqueado ou não encontrado');
      return;
    }

    const originalValue = type === 'start' ? layer.start : layer.start + layer.duration;
    
    setDragData({
      layerId,
      type,
      originalValue,
      startX: e.clientX
    });
    setIsDragging(true);
    setSelectedLayerId(layerId);

    console.log(`📍 Trim iniciado: ${type}=${formatTime(originalValue)}`);
  }, [timelineLayers]);

  const processTrimDrag = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragData || !timelineRef.current) return;

    const deltaX = e.clientX - dragData.startX;
    const timelineWidth = timelineRef.current.clientWidth - 128;
    const deltaTime = (deltaX / timelineWidth) * duration;
    
    const layer = timelineLayers.find(l => l.id === dragData.layerId);
    if (!layer) return;

    let newValue = dragData.originalValue + deltaTime;
    
    // 🎯 VALIDAÇÕES de trim
    if (dragData.type === 'start') {
      // Não pode passar do final do clip
      newValue = Math.max(0, Math.min(newValue, layer.start + layer.duration - 0.1));
    } else {
      // Não pode ir antes do início do clip
      newValue = Math.max(layer.start + 0.1, Math.min(newValue, duration));
    }

    // Aplicar mudança temporária (preview)
    const updatedLayers = timelineLayers.map(l => {
      if (l.id === dragData.layerId) {
        if (dragData.type === 'start') {
          const newDuration = (l.start + l.duration) - newValue;
          return { ...l, start: newValue, duration: newDuration };
        } else {
          const newDuration = newValue - l.start;
          return { ...l, duration: newDuration };
        }
      }
      return l;
    });

    setTimelineLayers(updatedLayers);
  }, [isDragging, dragData, timelineLayers, duration, setTimelineLayers]);

  const finishTrimDrag = useCallback(() => {
    if (!isDragging || !dragData) return;

    console.log(`✅ Trim finalizado: ${dragData.type} no layer ${dragData.layerId}`);
    
    const currentLayer = timelineLayers.find(l => l.id === dragData.layerId);
    if (!currentLayer) return;

    const currentValue = dragData.type === 'start' 
      ? currentLayer.start 
      : currentLayer.start + currentLayer.duration;

    // ✅ USAR COMANDO para undo/redo (apenas se houve mudança significativa)
    if (Math.abs(currentValue - dragData.originalValue) > 0.05) { // Margem de 50ms
      const trimCommand = new TrimCommand(
        dragData.layerId,
        dragData.type,
        dragData.originalValue,
        currentValue,
        timelineLayers,
        setTimelineLayers
      );

      try {
        // Aplicar comando (já foi aplicado visualmente, agora formalizar)
        commandManager.executeCommand(trimCommand);
        console.log(`📐 Comando trim criado: ${trimCommand.description}`);
      } catch (error) {
        console.error('❌ Erro ao criar comando de trim:', error);
        // Reverter para valor original em caso de erro
        const revertedLayers = timelineLayers.map(l => {
          if (l.id === dragData.layerId) {
            if (dragData.type === 'start') {
              const originalDuration = (l.start + l.duration) - dragData.originalValue;
              return { ...l, start: dragData.originalValue, duration: originalDuration };
            } else {
              const originalDuration = dragData.originalValue - l.start;
              return { ...l, duration: originalDuration };
            }
          }
          return l;
        });
        setTimelineLayers(revertedLayers);
      }
    }
    
    setIsDragging(false);
    setDragData(null);
    
    // Feedback de sucesso
    if (currentLayer) {
      console.log(`📐 Novo tamanho: ${formatTime(currentLayer.duration)} | Início: ${formatTime(currentLayer.start)}`);
    }
  }, [isDragging, dragData, timelineLayers, setTimelineLayers]);

  // 🎯 EVENT LISTENERS para mouse events
  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => processTrimDrag(e);
      const handleMouseUp = () => finishTrimDrag();

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, processTrimDrag, finishTrimDrag]);

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
    <div className={`timeline-pro-container bg-black/30 backdrop-blur-xl border-t border-white/10 shadow-2xl ${isDragging ? 'dragging' : ''}`} style={{ height: '300px' }}>
      {/* Header da Timeline */}
      <div className="timeline-header bg-black/20 backdrop-blur-sm border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h2 className="text-lg font-bold text-white flex items-center">
            <span className="mr-2">⚡</span>
            Timeline Pro
            {/* ➕ Indicador de Trim ativo */}
            {isDragging && (
              <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full animate-pulse">
                ✂️ Trimming
              </span>
            )}
          </h2>
          
          {/* Ferramentas */}
          <div className="flex items-center space-x-3">
            {/* ➕ BOTÕES UNDO/REDO */}
            <div className="flex items-center space-x-1 border border-white/20 rounded-lg p-1">
              <Button
                variant="ghost"
                onClick={() => commandManager.undo()}
                disabled={!commandManager.canUndo()}
                className={`tool-btn px-2 py-1 text-xs transition-all duration-300 ${
                  commandManager.canUndo() 
                    ? 'bg-white/5 hover:bg-green-600/20 text-gray-300 hover:text-green-300 border-0 hover:border-green-500/50' 
                    : 'bg-white/2 text-gray-600 border-0 cursor-not-allowed'
                }`}
                title={`Desfazer ${commandManager.getLastCommand()?.description || ''} (Ctrl+Z)`}
              >
                <span className="mr-1">↩️</span>
                Undo
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => commandManager.redo()}
                disabled={!commandManager.canRedo()}
                className={`tool-btn px-2 py-1 text-xs transition-all duration-300 ${
                  commandManager.canRedo() 
                    ? 'bg-white/5 hover:bg-blue-600/20 text-gray-300 hover:text-blue-300 border-0 hover:border-blue-500/50' 
                    : 'bg-white/2 text-gray-600 border-0 cursor-not-allowed'
                }`}
                title="Refazer (Ctrl+Y)"
              >
                <span className="mr-1">↪️</span>
                Redo
              </Button>
            </div>
            
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
          {/* ➕ Informações de Histórico */}
          {commandManager.getLastCommand() && (
            <div className="command-history bg-gray-600/20 border border-gray-500/50 rounded-lg px-3 py-1 mr-3">
              <div className="text-xs text-gray-200">
                📚 Último: {commandManager.getLastCommand()?.description}
              </div>
              <div className="text-xs text-gray-400">
                ↩️ {commandManager.canUndo() ? 'Ctrl+Z' : 'Sem undo'} | 
                ↪️ {commandManager.canRedo() ? 'Ctrl+Y' : 'Sem redo'}
              </div>
            </div>
          )}
          
          {/* ➕ Informações de Trim em tempo real */}
          {isDragging && dragData && (
            <div className="trim-info bg-blue-600/20 border border-blue-500/50 rounded-lg px-3 py-1 mr-3">
              <div className="text-xs text-blue-200">
                📐 {dragData.type === 'start' ? 'Início' : 'Final'}: {formatTime(
                  dragData.type === 'start' 
                    ? timelineLayers.find(l => l.id === dragData.layerId)?.start || 0
                    : (timelineLayers.find(l => l.id === dragData.layerId)?.start || 0) + 
                      (timelineLayers.find(l => l.id === dragData.layerId)?.duration || 0)
                )}
              </div>
              <div className="text-xs text-blue-300">
                ⏱️ Duração: {formatTime(timelineLayers.find(l => l.id === dragData.layerId)?.duration || 0)}
              </div>
            </div>
          )}
          
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
                    className={`timeline-effect absolute top-1 h-10 rounded-lg cursor-pointer border-2 transition-all duration-200 group-hover:shadow-lg ${
                      selectedLayerId === effect.id ? 'border-opacity-100 shadow-lg' : 'border-opacity-50 hover:border-opacity-100'
                    }`}
                    style={{
                      left: `${(effect.start / duration) * 100}%`,
                      width: `${((effect.end - effect.start) / duration) * 100}%`,
                      background: getTrackColor(track.id),
                      backdropFilter: 'blur(4px)',
                      borderColor: selectedLayerId === effect.id ? '#ffffff' : (
                        track.id === 'video-track' ? '#3b82f6' :
                        track.id === 'captions-track' ? '#10b981' :
                        track.id === 'effects-track' ? '#a855f7' : '#f97316'
                      )
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLayerId(effect.id === selectedLayerId ? null : effect.id);
                    }}
                  >
                    {/* ➕ TRIM HANDLE ESQUERDO */}
                    <div
                      className={`absolute left-0 top-0 w-2 h-full cursor-ew-resize transition-all duration-200 ${
                        hoveredHandle?.layerId === effect.id && hoveredHandle?.type === 'start' 
                          ? 'bg-blue-500 opacity-100' 
                          : 'bg-blue-400 opacity-0 hover:opacity-80'
                      } ${selectedLayerId === effect.id ? 'opacity-60' : ''}`}
                      style={{
                        borderRadius: '8px 0 0 8px',
                        borderRight: '1px solid rgba(255,255,255,0.3)'
                      }}
                      onMouseDown={(e) => startTrimDrag(e, effect.id, 'start')}
                      onMouseEnter={() => setHoveredHandle({ layerId: effect.id, type: 'start' })}
                      onMouseLeave={() => setHoveredHandle(null)}
                      title="Arrastar para ajustar início"
                    >
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs">
                        ⋮
                      </div>
                    </div>

                    {/* CONTEÚDO DO CLIP */}
                    <div className="flex items-center h-full px-2" style={{ paddingLeft: '8px', paddingRight: '8px' }}>
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

                    {/* ➕ TRIM HANDLE DIREITO */}
                    <div
                      className={`absolute right-0 top-0 w-2 h-full cursor-ew-resize transition-all duration-200 ${
                        hoveredHandle?.layerId === effect.id && hoveredHandle?.type === 'end' 
                          ? 'bg-blue-500 opacity-100' 
                          : 'bg-blue-400 opacity-0 hover:opacity-80'
                      } ${selectedLayerId === effect.id ? 'opacity-60' : ''}`}
                      style={{
                        borderRadius: '0 8px 8px 0',
                        borderLeft: '1px solid rgba(255,255,255,0.3)'
                      }}
                      onMouseDown={(e) => startTrimDrag(e, effect.id, 'end')}
                      onMouseEnter={() => setHoveredHandle({ layerId: effect.id, type: 'end' })}
                      onMouseLeave={() => setHoveredHandle(null)}
                      title="Arrastar para ajustar final"
                    >
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs">
                        ⋮
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