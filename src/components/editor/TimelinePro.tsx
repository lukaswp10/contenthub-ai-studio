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
  onPreviewClip?: (startTime: number, endTime: number) => void;
  onExportClip?: (clipData: ClipData) => void;
  isPreviewMode?: boolean;
  currentClipIndex?: number;
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

interface ClipData {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  hasAudio: boolean;
  hasVideo: boolean;
  captions: any[];
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
  setCutPoints,
  onPreviewClip,
  onExportClip,
  isPreviewMode = false,
  currentClipIndex = -1
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

  // ➕ NOVOS ESTADOS para FASE 4.0
  const [availableClips, setAvailableClips] = useState<ClipData[]>([]);
  const [hoveredClip, setHoveredClip] = useState<number>(-1);
  const [selectedClipForEdit, setSelectedClipForEdit] = useState<string | null>(null);
  const [timelineZoom, setTimelineZoom] = useState(1);



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

  // ➕ FUNÇÃO para verificar se pode cortar (deve vir ANTES de handleCut)
  const canCutAtTime = useCallback((time: number): boolean => {
    // Verificar se já existe um corte muito próximo (0.5s de tolerância)
    const tolerance = 0.5;
    const hasNearCut = cutPoints.some(cut => Math.abs(cut.time - time) < tolerance);
    
    if (hasNearCut) {
      console.log(`⚠️ Corte muito próximo de outro existente (${formatTime(time)})`);
      return false;
    }
    
    // Verificar se está dentro dos limites do vídeo
    if (time <= 0.1 || time >= duration - 0.1) {
      console.log(`⚠️ Corte fora dos limites válidos (${formatTime(time)})`);
      return false;
    }
    
    return true;
  }, [cutPoints, duration]);

  // ✂️ FUNÇÃO DE CORTE MELHORADA - CORTES ILIMITADOS
  const handleCut = useCallback((time: number) => {
    console.log(`✂️ TimelinePro: Tentando corte no tempo ${formatTime(time)}`);
    
    // ➕ VERIFICAR se pode cortar neste tempo
    if (!canCutAtTime(time)) {
      return;
    }
    
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
      
      console.log(`✅ Corte realizado! Total de cortes: ${cutPoints.length + 1}`);
      
      // Auto-desativar razor após 1s
      setTimeout(() => {
        setRazorToolActive(false);
        console.log('🔄 Razor tool desativado automaticamente');
      }, 1000);

    } catch (error) {
      console.error('❌ Erro ao executar comando de corte:', error);
      alert('❌ Não foi possível realizar o corte. Tente novamente.');
    }
  }, [canCutAtTime, timelineLayers, setTimelineLayers, cutPoints, setCutPoints, onCut, setRazorToolActive]);

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
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
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

  // ➕ FUNÇÃO para calcular clips disponíveis
  const calculateClips = useCallback((): ClipData[] => {
    if (cutPoints.length === 0) return [];

    const sortedCuts = [...cutPoints].sort((a, b) => a.time - b.time);
    const clips: ClipData[] = [];
    
    // Primeiro clip (início até primeiro corte)
    if (sortedCuts.length > 0 && sortedCuts[0].time > 0) {
      clips.push({
        id: `clip-0`,
        name: `Clip 1`,
        startTime: 0,
        endTime: sortedCuts[0].time,
        duration: sortedCuts[0].time,
        hasAudio: true,
        hasVideo: true,
        captions: []
      });
    }

    // Clips intermediários
    for (let i = 0; i < sortedCuts.length - 1; i++) {
      clips.push({
        id: `clip-${i + 1}`,
        name: `Clip ${i + 2}`,
        startTime: sortedCuts[i].time,
        endTime: sortedCuts[i + 1].time,
        duration: sortedCuts[i + 1].time - sortedCuts[i].time,
        hasAudio: true,
        hasVideo: true,
        captions: []
      });
    }

    // Último clip (último corte até final)
    if (sortedCuts.length > 0 && sortedCuts[sortedCuts.length - 1].time < duration) {
      clips.push({
        id: `clip-${sortedCuts.length}`,
        name: `Clip ${sortedCuts.length + 1}`,
        startTime: sortedCuts[sortedCuts.length - 1].time,
        endTime: duration,
        duration: duration - sortedCuts[sortedCuts.length - 1].time,
        hasAudio: true,
        hasVideo: true,
        captions: []
      });
    }

    return clips.filter(clip => clip.duration > 0.1); // Mínimo 0.1s
  }, [cutPoints, duration]);

  // ➕ ATUALIZAR clips quando cutPoints mudarem
  useEffect(() => {
    if (cutPoints.length === 0) {
      setAvailableClips([]);
      return;
    }

    const sortedCuts = [...cutPoints].sort((a, b) => a.time - b.time);
    const clips: ClipData[] = [];
    
    // Primeiro clip (início até primeiro corte)
    if (sortedCuts.length > 0 && sortedCuts[0].time > 0) {
      clips.push({
        id: `clip-0`,
        name: `Clip 1`,
        startTime: 0,
        endTime: sortedCuts[0].time,
        duration: sortedCuts[0].time,
        hasAudio: true,
        hasVideo: true,
        captions: []
      });
    }

    // Clips intermediários
    for (let i = 0; i < sortedCuts.length - 1; i++) {
      clips.push({
        id: `clip-${i + 1}`,
        name: `Clip ${i + 2}`,
        startTime: sortedCuts[i].time,
        endTime: sortedCuts[i + 1].time,
        duration: sortedCuts[i + 1].time - sortedCuts[i].time,
        hasAudio: true,
        hasVideo: true,
        captions: []
      });
    }

    // Último clip (último corte até final)
    if (sortedCuts.length > 0 && sortedCuts[sortedCuts.length - 1].time < duration) {
      clips.push({
        id: `clip-${sortedCuts.length}`,
        name: `Clip ${sortedCuts.length + 1}`,
        startTime: sortedCuts[sortedCuts.length - 1].time,
        endTime: duration,
        duration: duration - sortedCuts[sortedCuts.length - 1].time,
        hasAudio: true,
        hasVideo: true,
        captions: []
      });
    }

    const filteredClips = clips.filter(clip => clip.duration > 0.1); // Mínimo 0.1s
    setAvailableClips(filteredClips);
    console.log(`🎬 ${filteredClips.length} clips disponíveis:`, filteredClips.map(c => `${c.name} (${formatTime(c.duration)})`));
  }, [cutPoints, duration]);

  // ➕ FUNÇÃO para preview de um clip específico
  const previewClip = useCallback((clipIndex: number) => {
    if (clipIndex < 0 || clipIndex >= availableClips.length) return;
    
    const clip = availableClips[clipIndex];
    console.log(`▶️ Preview do ${clip.name}: ${formatTime(clip.startTime)} - ${formatTime(clip.endTime)}`);
    
    if (onPreviewClip) {
      onPreviewClip(clip.startTime, clip.endTime);
    }
    
    // Mover playhead para início do clip
    onSeek(clip.startTime);
  }, [availableClips, onPreviewClip, onSeek]);

  // ➕ FUNÇÃO para exportar um clip específico
  const exportClip = useCallback((clipIndex: number) => {
    if (clipIndex < 0 || clipIndex >= availableClips.length) return;
    
    const clip = availableClips[clipIndex];
    console.log(`📤 Exportando ${clip.name}...`);
    
    if (onExportClip) {
      onExportClip(clip);
    }
  }, [availableClips, onExportClip]);

  return (
    <div className={`timeline-pro-container bg-black/30 backdrop-blur-xl border-t border-white/10 shadow-2xl ${isDragging ? 'dragging' : ''}`} style={{ height: 'auto', minHeight: '350px', maxHeight: '500px' }}>
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
          {/* ➕ Informações dos Clips */}
          {availableClips.length > 0 && (
            <div className="text-sm text-gray-300 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
              📽️ {availableClips.length} clips prontos
            </div>
          )}
          
          <div className="progress-indicator bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
            <span className="text-sm text-gray-300">
              {cutPoints.length} cortes • {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          <div className="time-display bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
            <span className="text-sm text-gray-300 font-mono">
              {Math.round((currentTime / duration) * 100) || 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Timeline Principal */}
      <div 
        ref={timelineRef}
        className="timeline-main flex-1 cursor-crosshair"
        onClick={handleTimelineClick}
      >
        {/* Régua de Tempo */}
        <div className="timeline-ruler h-8 bg-black/40 border-b border-white/10 relative">
          {/* Marcadores de tempo */}
          {Array.from({ length: Math.ceil(duration / 10) + 1 }, (_, i) => {
            const time = i * 10;
            const left = (time / duration) * 100;
            return (
              <div
                key={i}
                className="time-marker absolute"
                style={{ left: `calc(128px + ${left}% - 1px)` }}
              >
                <div className="w-px h-4 bg-white/20"></div>
                <span className="text-xs text-gray-400 mt-1">{formatTime(time)}</span>
              </div>
            );
          })}
          
          {/* ➕ Marcadores de Corte */}
          {cutPoints.map((cut, index) => {
            const left = (cut.time / duration) * 100;
            return (
              <div
                key={cut.id}
                className="cut-point absolute"
                style={{ left: `calc(128px + ${left}% - 1px)` }}
                title={`Corte ${index + 1}: ${formatTime(cut.time)}`}
              />
            );
          })}
        </div>

        {/* Playhead */}
        <div 
          className="playhead absolute top-0 bottom-0 z-40"
          style={{ left: `calc(128px + ${(currentTime / duration) * 100}% - 1px)` }}
        >
          <div className="playhead-handle w-4 h-4 rounded-full absolute -top-2 -left-2"></div>
          <div className="playhead-line w-px h-full bg-red-500"></div>
        </div>

        {/* Container das Tracks */}
        <div className="tracks-container overflow-y-auto">
          {tracks.map((track) => (
            <div 
              key={track.id} 
              className="track flex"
              data-track-id={track.id}
            >
              <div className="track-header">
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-xs font-semibold text-white">{track.label}</div>
                  <div className="text-xs text-gray-400 mt-1">{track.effects.length} items</div>
                </div>
              </div>
              
              <div className="track-content flex-1 relative">
                {track.id === 'audio-track' && (
                  <div 
                    ref={audioWaveformRef} 
                    className="audio-waveform w-full h-full"
                    style={{ 
                      position: 'absolute', 
                      top: '8px', 
                      left: '8px', 
                      right: '8px', 
                      bottom: '8px',
                      height: '44px'
                    }}
                  />
                )}
                
                {track.effects.map((effect) => {
                  const left = (effect.start / duration) * 100;
                  const width = ((effect.end - effect.start) / duration) * 100;
                  const isSelected = selectedLayerId === effect.id;
                  const isAudioTrack = track.id === 'audio-track';
                  
                  return (
                    <div
                      key={effect.id}
                      className={`timeline-effect ${isSelected ? 'selected' : ''}`}
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        backgroundColor: getTrackColor(track.id),
                        zIndex: isAudioTrack ? 1 : 2
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLayerId(effect.id);
                      }}
                      onMouseEnter={() => setHoveredHandle({ layerId: effect.id, type: 'start' })}
                      onMouseLeave={() => setHoveredHandle(null)}
                    >
                      {/* ➕ TRIM HANDLES MELHORADOS */}
                      <div
                        className={`trim-handle left ${hoveredHandle?.layerId === effect.id && hoveredHandle?.type === 'start' ? 'active' : ''}`}
                        onMouseDown={(e) => startTrimDrag(e, effect.id, 'start')}
                        title={`Início: ${formatTime(effect.start)}`}
                      >
                        <div className="trim-handle-icon">⬅</div>
                      </div>
                      
                      <div className="effect-content flex items-center justify-center h-full px-2">
                        <div className="text-xs text-white truncate font-semibold">
                          {effect.name}
                        </div>
                      </div>
                      
                      <div
                        className={`trim-handle right ${hoveredHandle?.layerId === effect.id && hoveredHandle?.type === 'end' ? 'active' : ''}`}
                        onMouseDown={(e) => startTrimDrag(e, effect.id, 'end')}
                        title={`Final: ${formatTime(effect.end)}`}
                      >
                        <div className="trim-handle-icon">➡</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* ➕ PAINEL DE CLIPS DISPONÍVEIS */}
      {availableClips.length > 0 && (
        <div className="clips-panel mt-4 p-3 bg-black/40 backdrop-blur-md rounded-lg border border-white/10">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center">
            <span className="mr-2">🎬</span>
            Clips Disponíveis ({availableClips.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {availableClips.map((clip, index) => (
              <div
                key={clip.id}
                className={`clip-item p-2 rounded-lg border transition-all duration-200 cursor-pointer ${
                  currentClipIndex === index 
                    ? 'bg-blue-600/20 border-blue-500/50 shadow-lg shadow-blue-500/20' 
                    : hoveredClip === index
                    ? 'bg-white/10 border-white/30'
                    : 'bg-white/5 border-white/20 hover:border-white/40'
                }`}
                onMouseEnter={() => setHoveredClip(index)}
                onMouseLeave={() => setHoveredClip(-1)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-white">{clip.name}</span>
                  <span className="text-xs text-gray-400">{formatTime(clip.duration)}</span>
                </div>
                
                <div className="text-xs text-gray-300 mb-2">
                  {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => previewClip(index)}
                    className="flex-1 text-xs py-1 px-2 bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-500/30"
                    title={`Preview ${clip.name}`}
                  >
                    ▶️ Preview
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => exportClip(index)}
                    className="flex-1 text-xs py-1 px-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30"
                    title={`Exportar ${clip.name}`}
                  >
                    📤 Export
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelinePro; 