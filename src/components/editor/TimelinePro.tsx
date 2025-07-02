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
  transcriptionData?: any; // ➕ NOVO: Dados de transcrição
  showTranscriptTrack?: boolean; // ➕ NOVO: Controle de visibilidade
}

interface TimelineLayer {
  id: string;
  type: 'video' | 'audio' | 'text' | 'effect';
  name: string;
  visible: boolean;
  items: any[];
  start?: number;
  duration?: number;
  data?: any;
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
  captions: CaptionSegment[];
}

// ➕ INTERFACE para segmentos de legenda por clip
interface CaptionSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  style: 'tiktok-bold' | 'youtube-highlight' | 'instagram-neon' | 'podcast-clean';
  isEditing?: boolean;
}

interface ViralScore {
  overall: number; // 0-100
  hook: number;
  engagement: number;
  retention: number;
  shareability: number;
  trending: number;
  recommendations: string[];
  optimized: boolean;
}

interface Suggestion {
  id: string;
  type: 'caption' | 'timing' | 'effect' | 'hook' | 'cta';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  before: string;
  after: string;
  impact: number; // +1 a +15 pontos
}

// ➕ INTERFACES para keyboard shortcuts
interface KeyboardShortcut {
  action: string;
  description: string;
  category: string;
}

type KeyboardShortcutsMap = Record<string, KeyboardShortcut>;

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
  currentClipIndex = -1,
  transcriptionData,
  showTranscriptTrack
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

  // ➕ NOVOS ESTADOS para FASE 5.0 - Editor de Legendas
  const [editingCaption, setEditingCaption] = useState<{
    clipId: string;
    captionId: string;
  } | null>(null);
  const [captionText, setCaptionText] = useState('');
  const [showCaptionEditor, setShowCaptionEditor] = useState(false);

  // ➕ NOVOS ESTADOS para FASE 6.0 - Drag & Drop
  const [draggedClip, setDraggedClip] = useState<ClipData | null>(null);
  const [dropZone, setDropZone] = useState<string | null>(null);
  const [clipOrder, setClipOrder] = useState<string[]>([]);

  // ➕ NOVOS ESTADOS para FASE 7.0 - Exportação em Lote & Templates
  const [selectedClips, setSelectedClips] = useState<Set<string>>(new Set());
  const [batchExportMode, setBatchExportMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('tiktok-viral');
  const [exportProgress, setExportProgress] = useState<{
    isExporting: boolean;
    current: number;
    total: number;
    currentClip: string;
  }>({
    isExporting: false,
    current: 0,
    total: 0,
    currentClip: ''
  });

  // ➕ NOVOS ESTADOS para FASE 8.0 - Análise Viral & Otimização
  const [viralAnalysis, setViralAnalysis] = useState<Map<string, ViralScore>>(new Map());
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
  const [analyzingClips, setAnalyzingClips] = useState(false);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<Map<string, Suggestion[]>>(new Map());

  // ➕ TRACKS baseadas nos timelineLayers recebidos
  const tracks = useMemo(() => [
    {
      id: 'video-track',
      label: '🎬 Video',
      effects: timelineLayers.filter(layer => layer.type === 'video').map(layer => ({
        id: layer.id,
        name: layer.name,
        start: layer.start || 0,
        end: (layer.start || 0) + (layer.duration || 0),
        source: layer.data
      }))
    },
    {
      id: 'captions-track',
      label: '💬 Captions',
      effects: timelineLayers.filter(layer => layer.type === 'text').map(layer => ({
        id: layer.id,
        name: layer.name,
        start: layer.start || 0,
        end: (layer.start || 0) + (layer.duration || 0)
      }))
    },
    {
      id: 'effects-track',
      label: '✨ Effects',
      effects: timelineLayers.filter(layer => layer.type === 'effect').map(layer => ({
        id: layer.id,
        name: layer.name,
        start: layer.start || 0,
        end: (layer.start || 0) + (layer.duration || 0)
      }))
    },
    {
      id: 'audio-track',
      label: '🎵 Audio',
      effects: timelineLayers.filter(layer => layer.type === 'audio').map(layer => ({
        id: layer.id,
        name: layer.name,
        start: layer.start || 0,
        end: (layer.start || 0) + (layer.duration || 0)
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

  // ➕ FUNÇÃO HELPER para verificar se layer tem propriedades válidas
  const isValidLayer = (layer: TimelineLayer): layer is TimelineLayer & { start: number; duration: number } => {
    return layer.start !== undefined && layer.duration !== undefined;
  };

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
      isValidLayer(layer) && time > layer.start && time < (layer.start + layer.duration) && !layer.locked
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
    if (!layer || layer.locked || !isValidLayer(layer)) {
      console.log('❌ Layer bloqueado, não encontrado ou inválido');
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
    if (!layer || !isValidLayer(layer)) return;

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
      if (l.id === dragData.layerId && isValidLayer(l)) {
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
    if (!currentLayer || !isValidLayer(currentLayer)) return;

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
          if (l.id === dragData.layerId && isValidLayer(l)) {
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

  // ➕ FUNÇÃO para adicionar legenda a um clip (FASE 5.0)
  const addCaptionToClip = useCallback((clipIndex: number, captionData: Partial<any>) => {
    if (clipIndex < 0 || clipIndex >= availableClips.length) return;
    
    const clip = availableClips[clipIndex];
    const newCaption = {
      id: `caption-${Date.now()}`,
      text: captionData.text || 'Nova legenda...',
      startTime: captionData.startTime || clip.startTime,
      endTime: captionData.endTime || Math.min(clip.startTime + 3, clip.endTime),
      style: captionData.style || 'tiktok-bold',
      isEditing: false
    };

    const updatedClips = [...availableClips];
    updatedClips[clipIndex] = {
      ...clip,
      captions: [...clip.captions, newCaption]
    };
    
    setAvailableClips(updatedClips);
    console.log(`📝 Legenda adicionada ao ${clip.name}:`, newCaption);
  }, [availableClips]);

  // ➕ FUNÇÃO para editar legenda existente
  const editCaption = useCallback((clipId: string, captionId: string, updates: any) => {
    const updatedClips = availableClips.map(clip => {
      if (clip.id === clipId) {
        return {
          ...clip,
          captions: clip.captions.map((caption: any) => 
            caption.id === captionId 
              ? { ...caption, ...updates }
              : caption
          )
        };
      }
      return clip;
    });
    
    setAvailableClips(updatedClips);
  }, [availableClips]);

  // ➕ FUNÇÃO para remover legenda
  const removeCaption = useCallback((clipId: string, captionId: string) => {
    const updatedClips = availableClips.map(clip => {
      if (clip.id === clipId) {
        return {
          ...clip,
          captions: clip.captions.filter((caption: any) => caption.id !== captionId)
        };
      }
      return clip;
    });
    
    setAvailableClips(updatedClips);
    console.log(`🗑️ Legenda removida do clip ${clipId}`);
  }, [availableClips]);

  // ➕ FUNÇÃO para iniciar edição de legenda
  const startEditingCaption = useCallback((clipId: string, captionId: string) => {
    const clip = availableClips.find(c => c.id === clipId);
    const caption = clip?.captions.find((c: any) => c.id === captionId);
    
    if (caption) {
      setEditingCaption({ clipId, captionId });
      setCaptionText(caption.text);
      setShowCaptionEditor(true);
    }
  }, [availableClips]);

  // ➕ FUNÇÃO para salvar edição de legenda
  const saveCaptionEdit = useCallback(() => {
    if (editingCaption) {
      editCaption(editingCaption.clipId, editingCaption.captionId, {
        text: captionText,
        isEditing: false
      });
      setEditingCaption(null);
      setCaptionText('');
      setShowCaptionEditor(false);
    }
  }, [editingCaption, captionText, editCaption]);

  // ➕ FUNÇÃO para reordenar clips via drag & drop
  const reorderClips = useCallback((startIndex: number, endIndex: number) => {
    const result = Array.from(availableClips);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    
    setAvailableClips(result);
    console.log(`🔄 Clips reordenados: ${startIndex} → ${endIndex}`);
  }, [availableClips]);

  // ➕ HANDLERS para Drag & Drop
  const handleDragStart = useCallback((e: React.DragEvent, clip: ClipData, index: number) => {
    setDraggedClip(clip);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
    
    // Adicionar feedback visual
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.8';
    dragImage.style.transform = 'rotate(5deg)';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent, targetClipId: string) => {
    e.preventDefault();
    setDropZone(targetClipId);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Verificar se realmente saiu da área
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropZone(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/html'), 10);
    
    if (sourceIndex !== targetIndex) {
      reorderClips(sourceIndex, targetIndex);
    }
    
    setDraggedClip(null);
    setDropZone(null);
  }, [reorderClips]);

  // ➕ TEMPLATES VIRAIS disponíveis
  const viralTemplates = [
    {
      id: 'tiktok-viral',
      name: '🎵 TikTok Viral',
      description: '9:16, Legendas Bold, Música Trending',
      format: '9:16',
      quality: '1080p',
      captionStyle: 'tiktok-bold',
      effects: ['zoom-in', 'trending-audio'],
      icon: '🎵'
    },
    {
      id: 'youtube-shorts',
      name: '📺 YouTube Shorts',
      description: '9:16, Título Chamativo, Thumb Atraente',
      format: '9:16',
      quality: '1080p',
      captionStyle: 'youtube-highlight',
      effects: ['thumbnail-overlay', 'hook-intro'],
      icon: '📺'
    },
    {
      id: 'instagram-reels',
      name: '📸 Instagram Reels',
      description: '9:16, Estética Premium, Hash Otimizadas',
      format: '9:16',
      quality: '1080p',
      captionStyle: 'instagram-neon',
      effects: ['aesthetic-filter', 'story-style'],
      icon: '📸'
    },
    {
      id: 'podcast-clips',
      name: '🎙️ Podcast Clips',
      description: '16:9, Legendas Limpas, Waveform Visual',
      format: '16:9',
      quality: '1080p',
      captionStyle: 'podcast-clean',
      effects: ['waveform-bg', 'speaker-highlight'],
      icon: '🎙️'
    }
  ];

  // ➕ FUNÇÃO para selecionar/deselecionar clips
  const toggleClipSelection = useCallback((clipId: string) => {
    setSelectedClips(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clipId)) {
        newSet.delete(clipId);
      } else {
        newSet.add(clipId);
      }
      return newSet;
    });
  }, []);

  // ➕ FUNÇÃO para selecionar todos os clips
  const selectAllClips = useCallback(() => {
    setSelectedClips(new Set(availableClips.map(clip => clip.id)));
  }, [availableClips]);

  // ➕ FUNÇÃO para limpar seleção
  const clearSelection = useCallback(() => {
    setSelectedClips(new Set());
  }, []);

  // ➕ FUNÇÃO para exportação em lote
  const exportBatch = useCallback(async () => {
    const selectedClipsList = availableClips.filter(clip => selectedClips.has(clip.id));
    
    if (selectedClipsList.length === 0) {
      alert('Selecione pelo menos um clip para exportar!');
      return;
    }

    const template = viralTemplates.find(t => t.id === selectedTemplate);
    
    setExportProgress({
      isExporting: true,
      current: 0,
      total: selectedClipsList.length,
      currentClip: ''
    });

    console.log(`🚀 Iniciando exportação em lote: ${selectedClipsList.length} clips`);
    console.log(`📱 Template selecionado: ${template?.name}`);

    // Simular exportação de cada clip
    for (let i = 0; i < selectedClipsList.length; i++) {
      const clip = selectedClipsList[i];
      
      setExportProgress(prev => ({
        ...prev,
        current: i + 1,
        currentClip: clip.name
      }));

      console.log(`📤 Exportando ${i + 1}/${selectedClipsList.length}: ${clip.name}`);
      console.log(`⚙️ Aplicando template: ${template?.name}`);
      console.log(`🎬 Formato: ${template?.format} ${template?.quality}`);
      console.log(`📝 Estilo legenda: ${template?.captionStyle}`);
      console.log(`✨ Efeitos: ${template?.effects.join(', ')}`);
      
      // Simular tempo de processamento
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setExportProgress({
      isExporting: false,
      current: 0,
      total: 0,
      currentClip: ''
    });

    alert(`✅ Exportação concluída! ${selectedClipsList.length} clips foram processados com o template "${template?.name}"`);
    console.log(`✅ Exportação em lote finalizada com sucesso!`);
    
    // Limpar seleção
    clearSelection();
    setBatchExportMode(false);
  }, [selectedClips, availableClips, selectedTemplate, viralTemplates, clearSelection]);

  // ➕ FUNÇÃO para analisar potencial viral de clips
  const analyzeViralPotential = useCallback(async () => {
    setAnalyzingClips(true);
    console.log('🤖 Iniciando análise viral dos clips...');
    
    const newAnalysis = new Map<string, ViralScore>();
    const newSuggestions = new Map<string, Suggestion[]>();

    for (const clip of availableClips) {
      // Simular análise de IA
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Análise baseada em fatores reais
      const hookScore = Math.min(100, 85 + (clip.startTime < 3 ? 15 : 0)); // Início rápido
      const engagementScore = Math.min(100, 70 + (clip.captions.length * 5)); // Legendas
      const retentionScore = Math.min(100, 60 + (clip.duration < 30 ? 20 : 0)); // Duração ideal
      const shareabilityScore = Math.min(100, 75 + Math.random() * 20);
      const trendingScore = Math.min(100, 65 + Math.random() * 30);
      
      const overall = Math.round((hookScore + engagementScore + retentionScore + shareabilityScore + trendingScore) / 5);
      
      const score: ViralScore = {
        overall,
        hook: Math.round(hookScore),
        engagement: Math.round(engagementScore),
        retention: Math.round(retentionScore),
        shareability: Math.round(shareabilityScore),
        trending: Math.round(trendingScore),
        recommendations: generateRecommendations(clip, overall),
        optimized: overall > 85
      };

      const suggestions: Suggestion[] = generateOptimizationSuggestions(clip, score);
      
      newAnalysis.set(clip.id, score);
      newSuggestions.set(clip.id, suggestions);
      
      console.log(`📊 ${clip.name}: Score ${overall}/100`);
    }

    setViralAnalysis(newAnalysis);
    setOptimizationSuggestions(newSuggestions);
    setAnalyzingClips(false);
    setShowAnalysisPanel(true);
    
    console.log('✅ Análise viral concluída!');
  }, [availableClips]);

  // ➕ FUNÇÃO para gerar recomendações
  const generateRecommendations = (clip: ClipData, score: number): string[] => {
    const recs = [];
    
    if (score < 60) recs.push('🔥 Adicione hook nos primeiros 3 segundos');
    if (clip.duration > 60) recs.push('⏱️ Reduza para menos de 60 segundos');
    if (clip.captions.length === 0) recs.push('📝 Adicione legendas chamativas');
    if (score < 80) recs.push('🎵 Use música trending para maior alcance');
    if (score > 90) recs.push('⭐ Pronto para viral! Poste em horário de pico');
    
    return recs;
  };

  // ➕ FUNÇÃO para gerar sugestões de otimização
  const generateOptimizationSuggestions = (clip: ClipData, score: ViralScore): Suggestion[] => {
    const suggestions: Suggestion[] = [];
    
    // Sugestão de Hook
    if (score.hook < 80) {
      suggestions.push({
        id: `hook-${clip.id}`,
        type: 'hook',
        priority: 'high',
        title: 'Melhore o Hook',
        description: 'Adicione um gancho visual nos primeiros 3 segundos',
        before: 'Início normal',
        after: 'Hook impactante + zoom + efeito',
        impact: 12
      });
    }

    // Sugestão de Legenda
    if (score.engagement < 75) {
      suggestions.push({
        id: `caption-${clip.id}`,
        type: 'caption',
        priority: 'high',
        title: 'Otimize as Legendas',
        description: 'Use palavras de alta conversão e emojis trending',
        before: clip.captions[0]?.text || 'Sem legenda',
        after: '🔥 ISSO VAI VIRALIZAR! Como [técnica] funciona 👇',
        impact: 15
      });
    }

    // Sugestão de CTA
    suggestions.push({
      id: `cta-${clip.id}`,
      type: 'cta',
      priority: 'medium',
      title: 'Adicione CTA Forte',
      description: 'Call-to-action que gera engajamento',
      before: 'Sem CTA',
      after: '❤️ CURTE se achou útil! 💬 COMENTA sua experiência',
      impact: 8
    });

    return suggestions;
  };

  // ➕ FUNÇÃO para aplicar otimização automática
  const applyOptimization = useCallback((clipId: string, suggestionId: string) => {
    const suggestion = optimizationSuggestions.get(clipId)?.find(s => s.id === suggestionId);
    if (!suggestion) return;

    // Aplicar otimização baseada no tipo
    if (suggestion.type === 'caption') {
      // Adicionar nova legenda otimizada
      const clipIndex = availableClips.findIndex(c => c.id === clipId);
      if (clipIndex !== -1) {
        addCaptionToClip(clipIndex, {
          text: suggestion.after,
          style: 'tiktok-bold'
        });
      }
    }

    // Atualizar score
    const currentScore = viralAnalysis.get(clipId);
    if (currentScore) {
      const newScore = { ...currentScore };
      newScore.overall = Math.min(100, newScore.overall + suggestion.impact);
      if (suggestion.type === 'caption') newScore.engagement = Math.min(100, newScore.engagement + suggestion.impact);
      if (suggestion.type === 'hook') newScore.hook = Math.min(100, newScore.hook + suggestion.impact);
      
      viralAnalysis.set(clipId, newScore);
      setViralAnalysis(new Map(viralAnalysis));
    }

    // Remover sugestão aplicada
    const suggestions = optimizationSuggestions.get(clipId)?.filter(s => s.id !== suggestionId) || [];
    optimizationSuggestions.set(clipId, suggestions);
    setOptimizationSuggestions(new Map(optimizationSuggestions));

    console.log(`✨ Otimização aplicada: ${suggestion.title} (+${suggestion.impact} pontos)`);
  }, [viralAnalysis, optimizationSuggestions, availableClips, addCaptionToClip]);

  // ➕ FUNÇÃO para otimização automática completa
  const autoOptimizeAll = useCallback(async () => {
    console.log('🤖 Iniciando otimização automática de todos os clips...');
    
    for (const clip of availableClips) {
      const suggestions = optimizationSuggestions.get(clip.id) || [];
      const highPrioritySuggestions = suggestions.filter(s => s.priority === 'high');
      
      for (const suggestion of highPrioritySuggestions) {
        applyOptimization(clip.id, suggestion.id);
        await new Promise(resolve => setTimeout(resolve, 300)); // Delay para efeito visual
      }
    }
    
    alert('🚀 Otimização automática concluída! Todos os clips foram melhorados.');
  }, [availableClips, optimizationSuggestions, applyOptimization]);

  // ➕ NOVOS ESTADOS para FASE FINAL - Keyboard Shortcuts Avançado
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [activeShortcut, setActiveShortcut] = useState<string | null>(null);
  const [keySequence, setKeySequence] = useState<string[]>([]);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // ➕ MAPEAMENTO COMPLETO DE ATALHOS PROFISSIONAIS
  const keyboardShortcuts: KeyboardShortcutsMap = {
    // Timeline Navigation
    'Space': { action: 'togglePlay', description: '▶️ Play/Pause', category: 'Playback' },
    'Home': { action: 'goToStart', description: '⏮️ Ir para início', category: 'Navigation' },
    'End': { action: 'goToEnd', description: '⏭️ Ir para final', category: 'Navigation' },
    'ArrowLeft': { action: 'stepBackward', description: '⬅️ Voltar 1 frame', category: 'Navigation' },
    'ArrowRight': { action: 'stepForward', description: '➡️ Avançar 1 frame', category: 'Navigation' },
    'Shift+ArrowLeft': { action: 'jumpBackward', description: '⬅️ Voltar 10s', category: 'Navigation' },
    'Shift+ArrowRight': { action: 'jumpForward', description: '➡️ Avançar 10s', category: 'Navigation' },
    
    // Editing Tools
    'c': { action: 'activateRazor', description: '✂️ Ativar Razor Tool', category: 'Tools' },
    'v': { action: 'activateSelect', description: '👆 Selection Tool', category: 'Tools' },
    'Delete': { action: 'deleteSelected', description: '🗑️ Deletar selecionado', category: 'Edit' },
    'Backspace': { action: 'deleteSelected', description: '🗑️ Deletar selecionado', category: 'Edit' },
    
    // Timeline Controls
    '+': { action: 'zoomIn', description: '🔍 Zoom In Timeline', category: 'Timeline' },
    '-': { action: 'zoomOut', description: '🔍 Zoom Out Timeline', category: 'Timeline' },
    '0': { action: 'resetZoom', description: '🔄 Reset Zoom', category: 'Timeline' },
    
    // Playback Speed
    'j': { action: 'slowDown', description: '🐌 Diminuir velocidade', category: 'Playback' },
    'l': { action: 'speedUp', description: '🚀 Aumentar velocidade', category: 'Playback' },
    'k': { action: 'normalSpeed', description: '⚡ Velocidade normal', category: 'Playback' },
    
    // Clips Management
    'i': { action: 'setInPoint', description: '📍 Marcar ponto IN', category: 'Marks' },
    'o': { action: 'setOutPoint', description: '📍 Marcar ponto OUT', category: 'Marks' },
    'x': { action: 'cutSelection', description: '✂️ Cortar seleção', category: 'Edit' },
    
    // Advanced Features
    'Alt+a': { action: 'analyzeViral', description: '🤖 Análise Viral IA', category: 'AI' },
    'Alt+e': { action: 'batchExport', description: '📦 Exportação em Lote', category: 'Export' },
    'Alt+l': { action: 'toggleCaptions', description: '📝 Toggle Legendas', category: 'Captions' },
    
    // Undo/Redo
    'Ctrl+z': { action: 'undo', description: '↶ Desfazer', category: 'History' },
    'Ctrl+y': { action: 'redo', description: '↷ Refazer', category: 'History' },
    'Ctrl+Shift+z': { action: 'redo', description: '↷ Refazer (Alt)', category: 'History' },
    
    // Help
    '?': { action: 'showHelp', description: '❓ Mostrar Ajuda', category: 'Help' },
    'h': { action: 'showHelp', description: '❓ Mostrar Ajuda', category: 'Help' },
    'Escape': { action: 'escape', description: '🚫 Cancelar/Fechar', category: 'General' }
  };

  // ➕ FUNÇÃO para executar ações via teclado
  const executeKeyboardAction = useCallback((action: string) => {
    setActiveShortcut(action);
    setTimeout(() => setActiveShortcut(null), 1000);

    switch (action) {
      case 'togglePlay':
        // Callback para play/pause
        console.log('⌨️ Toggle Play/Pause');
        break;
        
      case 'goToStart':
        onSeek(0);
        console.log('⌨️ Ir para início');
        break;
        
      case 'goToEnd':
        onSeek(duration);
        console.log('⌨️ Ir para final');
        break;
        
      case 'stepBackward':
        onSeek(Math.max(0, currentTime - 0.033)); // 1 frame a 30fps
        console.log('⌨️ Voltar 1 frame');
        break;
        
      case 'stepForward':
        onSeek(Math.min(duration, currentTime + 0.033));
        console.log('⌨️ Avançar 1 frame');
        break;
        
      case 'jumpBackward':
        onSeek(Math.max(0, currentTime - 10));
        console.log('⌨️ Voltar 10s');
        break;
        
      case 'jumpForward':
        onSeek(Math.min(duration, currentTime + 10));
        console.log('⌨️ Avançar 10s');
        break;
        
      case 'activateRazor':
        setRazorToolActive(true);
        console.log('⌨️ Razor Tool ativado');
        break;
        
      case 'activateSelect':
        setRazorToolActive(false);
        console.log('⌨️ Selection Tool ativado');
        break;
        
      case 'zoomIn':
        setTimelineZoom(prev => Math.min(5, prev * 1.2));
        console.log('⌨️ Zoom In timeline');
        break;
        
      case 'zoomOut':
        setTimelineZoom(prev => Math.max(0.1, prev / 1.2));
        console.log('⌨️ Zoom Out timeline');
        break;
        
      case 'resetZoom':
        setTimelineZoom(1);
        console.log('⌨️ Reset Zoom timeline');
        break;
        
      case 'slowDown':
        setPlaybackSpeed(prev => Math.max(0.25, prev - 0.25));
        console.log(`⌨️ Velocidade: ${playbackSpeed - 0.25}x`);
        break;
        
      case 'speedUp':
        setPlaybackSpeed(prev => Math.min(4, prev + 0.25));
        console.log(`⌨️ Velocidade: ${playbackSpeed + 0.25}x`);
        break;
        
      case 'normalSpeed':
        setPlaybackSpeed(1);
        console.log('⌨️ Velocidade normal: 1x');
        break;
        
      case 'cutSelection':
        if (selectedLayerId) {
          handleCut(currentTime);
        }
        console.log('⌨️ Cortar seleção');
        break;
        
      case 'analyzeViral':
        analyzeViralPotential();
        console.log('⌨️ Iniciando análise viral IA');
        break;
        
      case 'batchExport':
        setBatchExportMode(!batchExportMode);
        console.log('⌨️ Toggle exportação em lote');
        break;
        
      case 'toggleCaptions':
        setShowCaptionEditor(!showCaptionEditor);
        console.log('⌨️ Toggle editor de legendas');
        break;
        
      case 'undo':
        commandManager.undo();
        console.log('⌨️ Desfazer');
        break;
        
      case 'redo':
        commandManager.redo();
        console.log('⌨️ Refazer');
        break;
        
      case 'showHelp':
        setShowShortcutsHelp(!showShortcutsHelp);
        console.log('⌨️ Toggle ajuda de atalhos');
        break;
        
      case 'escape':
        setShowShortcutsHelp(false);
        setShowCaptionEditor(false);
        setBatchExportMode(false);
        setRazorToolActive(false);
        setSelectedLayerId(null);
        setEditingCaption(null);
        console.log('⌨️ ESC - cancelar ações e fechar modals');
        break;
        
      default:
        console.log(`⌨️ Ação não implementada: ${action}`);
    }
  }, [currentTime, duration, onSeek, setRazorToolActive, selectedLayerId, handleCut, 
      analyzeViralPotential, batchExportMode, setBatchExportMode, showCaptionEditor, 
      setShowCaptionEditor, showShortcutsHelp, playbackSpeed, commandManager]);

  // ➕ LISTENER para capturar atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se estiver digitando em input/textarea
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT' || 
          e.target && (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      // Construir string do atalho
      let shortcutKey = '';
      if (e.ctrlKey) shortcutKey += 'Ctrl+';
      if (e.altKey) shortcutKey += 'Alt+';
      if (e.shiftKey) shortcutKey += 'Shift+';
      shortcutKey += e.key;

      // Verificar se existe o atalho
      const shortcut = keyboardShortcuts[shortcutKey];
      if (shortcut) {
        e.preventDefault();
        executeKeyboardAction(shortcut.action);
        
        // Feedback visual
        setKeySequence(prev => [...prev.slice(-2), shortcutKey]);
        setTimeout(() => {
          setKeySequence(prev => prev.slice(1));
        }, 2000);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [executeKeyboardAction, keyboardShortcuts]);

  // ➕ AGRUPAR ATALHOS POR CATEGORIA
  const shortcutCategories = useMemo(() => {
    const categories: Record<string, Array<{key: string, shortcut: any}>> = {};
    
    Object.entries(keyboardShortcuts).forEach(([key, shortcut]) => {
      if (!categories[shortcut.category]) {
        categories[shortcut.category] = [];
      }
      categories[shortcut.category].push({ key, shortcut });
    });
    
    return categories;
  }, [keyboardShortcuts]);

  // ➕ NOVOS ESTADOS para sistema de corte avançado
  const [inPoint, setInPoint] = useState<number | null>(null);
  const [outPoint, setOutPoint] = useState<number | null>(null);
  const [selectedSections, setSelectedSections] = useState<{id: string, start: number, end: number}[]>([]);
  const [previewMode, setPreviewMode] = useState<'original' | 'cut-only'>('original');
  const [currentPreviewSection, setCurrentPreviewSection] = useState<number>(0);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [selectionStartX, setSelectionStartX] = useState<number>(0);

  // ➕ FUNÇÃO para marcar ponto IN (início da seleção)
  const markInPoint = useCallback(() => {
    setInPoint(currentTime);
    console.log(`📍 IN marcado em ${formatTime(currentTime)}`);
    
    // Se já tem OUT, criar seleção automaticamente
    if (outPoint !== null && outPoint > currentTime) {
      const newSelection = {
        id: `selection-${Date.now()}`,
        start: currentTime,
        end: outPoint
      };
      setSelectedSections(prev => [...prev, newSelection]);
      setInPoint(null);
      setOutPoint(null);
      console.log(`✂️ Seleção criada: ${formatTime(currentTime)} - ${formatTime(outPoint)}`);
    }
  }, [currentTime, outPoint]);

  // ➕ FUNÇÃO para marcar ponto OUT (fim da seleção)
  const markOutPoint = useCallback(() => {
    setOutPoint(currentTime);
    console.log(`📍 OUT marcado em ${formatTime(currentTime)}`);
    
    // Se já tem IN, criar seleção automaticamente
    if (inPoint !== null && inPoint < currentTime) {
      const newSelection = {
        id: `selection-${Date.now()}`,
        start: inPoint,
        end: currentTime
      };
      setSelectedSections(prev => [...prev, newSelection]);
      setInPoint(null);
      setOutPoint(null);
      console.log(`✂️ Seleção criada: ${formatTime(inPoint)} - ${formatTime(currentTime)}`);
    }
  }, [currentTime, inPoint]);

  // ➕ FUNÇÃO para limpar seleção atual
  const clearCurrentSelection = useCallback(() => {
    setInPoint(null);
    setOutPoint(null);
    console.log('🔄 Seleção atual limpa');
  }, []);

  // ➕ FUNÇÃO para remover uma seleção específica
  const removeSelection = useCallback((selectionId: string) => {
    setSelectedSections(prev => prev.filter(s => s.id !== selectionId));
    console.log(`❌ Seleção removida: ${selectionId}`);
  }, []);

  // ➕ FUNÇÃO para calcular duração total das partes selecionadas
  const calculateSelectedDuration = useCallback(() => {
    return selectedSections.reduce((total, section) => {
      return total + (section.end - section.start);
    }, 0);
  }, [selectedSections]);

  // ➕ FUNÇÃO para gerar sequência de preview (só partes selecionadas)
  const generatePreviewSequence = useCallback(() => {
    if (selectedSections.length === 0) {
      return [{start: 0, end: duration}];
    }
    
    // Ordenar seleções por tempo
    const sortedSections = [...selectedSections].sort((a, b) => a.start - b.start);
    return sortedSections;
  }, [selectedSections, duration]);

  // ➕ FUNÇÃO para play só das partes cortadas
  const playSelectedSectionsOnly = useCallback(() => {
    const sequence = generatePreviewSequence();
    if (sequence.length === 0) return;
    
    setPreviewMode('cut-only');
    setCurrentPreviewSection(0);
    
    // Começar na primeira seção
    onSeek(sequence[0].start);
    
    console.log(`▶️ Reproduzindo ${sequence.length} seções selecionadas`);
    console.log(`📊 Duração total: ${formatTime(calculateSelectedDuration())}`);
  }, [generatePreviewSequence, onSeek, calculateSelectedDuration]);

  // ➕ FUNÇÃO para voltar ao modo normal
  const playOriginalVideo = useCallback(() => {
    setPreviewMode('original');
    setCurrentPreviewSection(0);
    console.log('🔄 Voltando ao modo original');
  }, []);

  // ➕ LISTENER para controlar preview de seções
  useEffect(() => {
    if (previewMode === 'cut-only') {
      const sequence = generatePreviewSequence();
      const currentSection = sequence[currentPreviewSection];
      
      if (currentSection && currentTime >= currentSection.end) {
        // Ir para próxima seção ou parar
        if (currentPreviewSection < sequence.length - 1) {
          setCurrentPreviewSection(prev => prev + 1);
          onSeek(sequence[currentPreviewSection + 1].start);
        } else {
          // Fim da sequência - voltar ao início ou parar
          setCurrentPreviewSection(0);
          onSeek(sequence[0].start);
          console.log('🔄 Fim da sequência - voltando ao início');
        }
      }
    }
  }, [currentTime, previewMode, currentPreviewSection, generatePreviewSequence, onSeek]);

  // ➕ FUNÇÃO para seleção via arraste na timeline
  const handleTimelineMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const timePosition = (x / rect.width) * duration;
    
    setIsDraggingSelection(true);
    setSelectionStartX(x);
    setInPoint(timePosition);
    setOutPoint(null);
    
    console.log(`🖱️ Iniciando seleção por arraste em ${formatTime(timePosition)}`);
  }, [duration]);

  const handleTimelineMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingSelection) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const timePosition = (x / rect.width) * duration;
    
    if (inPoint !== null) {
      setOutPoint(timePosition);
    }
  }, [isDraggingSelection, inPoint, duration]);

  const handleTimelineMouseUp = useCallback(() => {
    if (isDraggingSelection && inPoint !== null && outPoint !== null) {
      const start = Math.min(inPoint, outPoint);
      const end = Math.max(inPoint, outPoint);
      
      if (end - start > 0.1) { // Mínimo 0.1 segundos
        const newSelection = {
          id: `selection-${Date.now()}`,
          start,
          end
        };
        setSelectedSections(prev => [...prev, newSelection]);
        console.log(`✂️ Seleção por arraste criada: ${formatTime(start)} - ${formatTime(end)}`);
      }
      
      setInPoint(null);
      setOutPoint(null);
    }
    
    setIsDraggingSelection(false);
  }, [isDraggingSelection, inPoint, outPoint]);

  // ➕ FUNÇÃO para snap nos cortes existentes
  const snapToNearestCut = useCallback((time: number, tolerance: number = 0.5) => {
    const nearestCut = cutPoints.find(cut => Math.abs(cut.time - time) < tolerance);
    return nearestCut ? nearestCut.time : time;
  }, [cutPoints]);

  // ➕ ATUALIZAR ATALHOS DE TECLADO para incluir novos comandos
  const enhancedKeyboardShortcuts = {
    ...keyboardShortcuts,
    'i': { action: 'markIn', description: '📍 Marcar ponto IN', category: 'Marks' },
    'o': { action: 'markOut', description: '📍 Marcar ponto OUT', category: 'Marks' },
    'x': { action: 'clearSelection', description: '🔄 Limpar seleção', category: 'Marks' },
    'p': { action: 'previewCuts', description: '▶️ Preview só cortes', category: 'Playback' },
    'r': { action: 'resetPreview', description: '🔄 Reset preview', category: 'Playback' },
  };

  // ➕ NOVOS ESTADOS para Sistema de Transcrição na Timeline (ETAPA 1.2)
  const [currentTranscriptWord, setCurrentTranscriptWord] = useState<string>('');

  // ➕ FUNÇÃO para encontrar palavra atual na transcrição
  const getCurrentTranscriptWord = useCallback(() => {
    if (!transcriptionData?.words || !Array.isArray(transcriptionData.words)) return '';
    
    const currentWord = transcriptionData.words.find((word: any) => 
      currentTime >= word.start && currentTime <= word.end
    );
    
    return currentWord?.text || '';
  }, [transcriptionData, currentTime]);

  // ➕ ATUALIZAR palavra atual quando tempo muda
  useEffect(() => {
    const word = getCurrentTranscriptWord();
    setCurrentTranscriptWord(word);
  }, [currentTime, getCurrentTranscriptWord]);

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
      
      {/* ➕ PAINEL DE CLIPS DISPONÍVEIS COM TODAS AS FUNCIONALIDADES */}
      {availableClips.length > 0 && (
        <div className="clips-panel mt-4 p-3 bg-black/40 backdrop-blur-md rounded-lg border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center">
              <span className="mr-2">🎬</span>
              Clips Disponíveis ({availableClips.length})
              {selectedClips.size > 0 && (
                <span className="ml-2 px-2 py-1 bg-blue-600/20 rounded text-blue-300 text-xs">
                  {selectedClips.size} selecionados
                </span>
              )}
            </h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBatchExportMode(!batchExportMode)}
                className={`text-xs px-2 py-1 ${batchExportMode ? 'bg-orange-600/20 text-orange-300' : 'text-gray-400'}`}
              >
                📦 Lote
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCaptionEditor(!showCaptionEditor)}
                className={`text-xs px-2 py-1 ${showCaptionEditor ? 'bg-purple-600/20 text-purple-300' : 'text-gray-400'}`}
              >
                📝 Legendas
              </Button>
              <span className="text-xs text-gray-500">↕️ Arraste para reordenar</span>
            </div>
          </div>

          {/* ➕ PAINEL DE EXPORTAÇÃO EM LOTE */}
          {batchExportMode && (
            <div className="mb-4 p-3 bg-gradient-to-r from-orange-600/10 to-red-600/10 rounded-lg border border-orange-500/20">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-orange-300 flex items-center">
                  <span className="mr-2">📦</span>
                  Exportação em Lote
                </h4>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAllClips}
                    className="text-xs px-2 py-1 text-orange-300 hover:bg-orange-600/20"
                  >
                    ✅ Todos
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="text-xs px-2 py-1 text-gray-400 hover:bg-gray-600/20"
                  >
                    ❌ Limpar
                  </Button>
                </div>
              </div>

              {/* Template Selector */}
              <div className="mb-3">
                <label className="block text-xs text-gray-300 mb-2">Template Viral:</label>
                <div className="grid grid-cols-2 gap-2">
                  {viralTemplates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`p-2 rounded border text-left transition-all duration-200 ${
                        selectedTemplate === template.id
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                          : 'bg-black/20 border-white/10 text-gray-300 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span>{template.icon}</span>
                        <span className="text-xs font-semibold">{template.name}</span>
                      </div>
                      <p className="text-xs text-gray-400">{template.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Botão de Exportação */}
              <Button
                variant="ghost"
                onClick={exportBatch}
                disabled={selectedClips.size === 0 || exportProgress.isExporting}
                className="w-full bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/30 disabled:opacity-50"
              >
                {exportProgress.isExporting ? (
                  <span className="flex items-center">
                    <span className="mr-2 animate-spin">⚙️</span>
                    Exportando {exportProgress.current}/{exportProgress.total}...
                  </span>
                ) : (
                  <span>🚀 Exportar {selectedClips.size} clips com template</span>
                )}
              </Button>

              {/* Progress Bar */}
              {exportProgress.isExporting && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Processando: {exportProgress.currentClip}</span>
                    <span>{Math.round((exportProgress.current / exportProgress.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {availableClips.map((clip, index) => (
              <div
                key={clip.id}
                draggable
                onDragStart={(e) => handleDragStart(e, clip, index)}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, clip.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={`clip-item p-2 rounded-lg border transition-all duration-200 cursor-move relative ${
                  draggedClip?.id === clip.id
                    ? 'opacity-50 scale-95 rotate-1'
                    : dropZone === clip.id
                    ? 'border-blue-500 bg-blue-600/20 scale-105'
                    : selectedClips.has(clip.id) && batchExportMode
                    ? 'border-orange-500 bg-orange-600/20'
                    : currentClipIndex === index 
                    ? 'bg-blue-600/20 border-blue-500/50 shadow-lg shadow-blue-500/20' 
                    : hoveredClip === index
                    ? 'bg-white/10 border-white/30'
                    : 'bg-white/5 border-white/20 hover:border-white/40'
                }`}
                onMouseEnter={() => setHoveredClip(index)}
                onMouseLeave={() => setHoveredClip(-1)}
              >
                {/* Checkbox para seleção em lote */}
                {batchExportMode && (
                  <div className="absolute top-1 left-1 z-10">
                    <input
                      type="checkbox"
                      checked={selectedClips.has(clip.id)}
                      onChange={() => toggleClipSelection(clip.id)}
                      className="w-4 h-4 text-orange-600 bg-gray-800 border-gray-600 rounded focus:ring-orange-500"
                    />
                  </div>
                )}

                {/* Indicador de posição */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs bg-gray-600/50 rounded px-1 text-gray-300">#{index + 1}</span>
                    <span className="text-sm font-semibold text-white">{clip.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{formatTime(clip.duration)}</span>
                </div>
                
                <div className="text-xs text-gray-300 mb-2">
                  {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
                </div>

                {/* ➕ LEGENDAS DO CLIP */}
                {clip.captions.length > 0 && (
                  <div className="mb-2 p-1 bg-black/20 rounded border border-purple-500/20">
                    <div className="text-xs text-purple-300 mb-1 flex items-center">
                      <span className="mr-1">📝</span>
                      {clip.captions.length} legendas
                    </div>
                    <div className="space-y-1 max-h-16 overflow-y-auto">
                      {clip.captions.map((caption: any) => (
                        <div 
                          key={caption.id}
                          className="text-xs bg-white/10 rounded px-1 py-0.5 flex items-center justify-between"
                        >
                          <span className="truncate text-white">{caption.text}</span>
                          <div className="flex items-center space-x-1 ml-1">
                            <button
                              onClick={() => startEditingCaption(clip.id, caption.id)}
                              className="text-blue-400 hover:text-blue-300"
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => removeCaption(clip.id, caption.id)}
                              className="text-red-400 hover:text-red-300"
                              title="Remover"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
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
                    onClick={() => addCaptionToClip(index, {})}
                    className="text-xs py-1 px-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30"
                    title="Adicionar legenda"
                  >
                    📝
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => exportClip(index)}
                    className="flex-1 text-xs py-1 px-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30"
                    title={`Exportar ${clip.name}`}
                    disabled={exportProgress.isExporting}
                  >
                    📤 Export
                  </Button>
                </div>

                {/* Indicador de arraste */}
                {draggedClip?.id === clip.id && (
                  <div className="absolute top-1 right-1 text-blue-400 animate-pulse">
                    ↕️
                  </div>
                )}

                {/* Indicador de seleção */}
                {selectedClips.has(clip.id) && batchExportMode && (
                  <div className="absolute top-1 right-1 text-orange-400">
                    ✅
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ➕ MODAL DE EDIÇÃO DE LEGENDAS */}
          {showCaptionEditor && editingCaption && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-gray-900 rounded-xl p-6 border border-white/20 max-w-md w-full mx-4">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <span className="mr-2">📝</span>
                  Editar Legenda
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Texto da Legenda:</label>
                    <textarea
                      value={captionText}
                      onChange={(e) => setCaptionText(e.target.value)}
                      className="w-full bg-black/20 border border-white/20 rounded-lg p-3 text-white resize-none"
                      rows={3}
                      placeholder="Digite o texto da legenda..."
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowCaptionEditor(false);
                        setEditingCaption(null);
                        setCaptionText('');
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={saveCaptionEdit}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Salvar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Área de drop quando arrastando */}
          {draggedClip && (
            <div className="mt-2 p-2 border-2 border-dashed border-blue-500/50 rounded-lg bg-blue-600/10 text-center">
              <span className="text-sm text-blue-300">↕️ Solte aqui para reordenar</span>
            </div>
          )}
        </div>
      )}

      {/* ➕ PAINEL DE ANÁLISE VIRAL (FASE 8.0) */}
      {availableClips.length > 0 && (
        <div className="analysis-panel mt-4 p-3 bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-md rounded-lg border border-purple-500/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-purple-300 flex items-center">
              <span className="mr-2">🤖</span>
              Análise Viral IA
            </h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={analyzeViralPotential}
                disabled={analyzingClips}
                className="text-xs px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30"
              >
                {analyzingClips ? (
                  <span className="flex items-center">
                    <span className="mr-1 animate-spin">🔄</span>
                    Analisando...
                  </span>
                ) : (
                  '🔍 Analisar Clips'
                )}
              </Button>
              
              {viralAnalysis.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={autoOptimizeAll}
                  className="text-xs px-3 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-500/30"
                >
                  ⚡ Auto-Otimizar
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAnalysisPanel(!showAnalysisPanel)}
                className={`text-xs px-2 py-1 ${showAnalysisPanel ? 'bg-purple-600/20 text-purple-300' : 'text-gray-400'}`}
              >
                📊 Detalhes
              </Button>
            </div>
          </div>

          {/* Resumo Geral */}
          {viralAnalysis.size > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
              <div className="text-center p-2 bg-black/20 rounded border border-green-500/20">
                <div className="text-lg font-bold text-green-400">
                  {Array.from(viralAnalysis.values()).filter(s => s.overall > 85).length}
                </div>
                <div className="text-xs text-green-300">Prontos pra Viral</div>
              </div>
              <div className="text-center p-2 bg-black/20 rounded border border-yellow-500/20">
                <div className="text-lg font-bold text-yellow-400">
                  {Array.from(viralAnalysis.values()).filter(s => s.overall >= 70 && s.overall <= 85).length}
                </div>
                <div className="text-xs text-yellow-300">Bom Potencial</div>
              </div>
              <div className="text-center p-2 bg-black/20 rounded border border-red-500/20">
                <div className="text-lg font-bold text-red-400">
                  {Array.from(viralAnalysis.values()).filter(s => s.overall < 70).length}
                </div>
                <div className="text-xs text-red-300">Precisa Melhorar</div>
              </div>
              <div className="text-center p-2 bg-black/20 rounded border border-purple-500/20">
                <div className="text-lg font-bold text-purple-400">
                  {Array.from(optimizationSuggestions.values()).reduce((total, suggestions) => total + suggestions.length, 0)}
                </div>
                <div className="text-xs text-purple-300">Sugestões IA</div>
              </div>
            </div>
          )}

          {/* Análise Detalhada por Clip */}
          {showAnalysisPanel && viralAnalysis.size > 0 && (
            <div className="space-y-3">
              {availableClips.map((clip, index) => {
                const analysis = viralAnalysis.get(clip.id);
                const suggestions = optimizationSuggestions.get(clip.id) || [];
                
                if (!analysis) return null;

                return (
                  <div key={clip.id} className="p-3 bg-black/30 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white">{clip.name}</span>
                        <div className={`px-2 py-1 rounded text-xs font-bold ${
                          analysis.overall > 85 ? 'bg-green-600/20 text-green-300' :
                          analysis.overall >= 70 ? 'bg-yellow-600/20 text-yellow-300' :
                          'bg-red-600/20 text-red-300'
                        }`}>
                          {analysis.overall}/100
                        </div>
                        {analysis.optimized && (
                          <span className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded">
                            ✨ Otimizado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Métricas Detalhadas */}
                    <div className="grid grid-cols-5 gap-2 mb-2">
                      <div className="text-center">
                        <div className="text-xs text-gray-400">Hook</div>
                        <div className={`text-sm font-bold ${analysis.hook > 80 ? 'text-green-400' : analysis.hook > 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {analysis.hook}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400">Engajamento</div>
                        <div className={`text-sm font-bold ${analysis.engagement > 80 ? 'text-green-400' : analysis.engagement > 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {analysis.engagement}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400">Retenção</div>
                        <div className={`text-sm font-bold ${analysis.retention > 80 ? 'text-green-400' : analysis.retention > 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {analysis.retention}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400">Share</div>
                        <div className={`text-sm font-bold ${analysis.shareability > 80 ? 'text-green-400' : analysis.shareability > 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {analysis.shareability}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400">Trending</div>
                        <div className={`text-sm font-bold ${analysis.trending > 80 ? 'text-green-400' : analysis.trending > 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {analysis.trending}
                        </div>
                      </div>
                    </div>

                    {/* Recomendações */}
                    {analysis.recommendations.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs text-purple-300 mb-1">🎯 Recomendações IA:</div>
                        <div className="space-y-1">
                          {analysis.recommendations.map((rec, recIndex) => (
                            <div key={recIndex} className="text-xs bg-purple-600/10 rounded px-2 py-1 text-purple-200">
                              {rec}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sugestões de Otimização */}
                    {suggestions.length > 0 && (
                      <div>
                        <div className="text-xs text-orange-300 mb-1 flex items-center">
                          <span className="mr-1">⚡</span>
                          Otimizações Sugeridas ({suggestions.length}):
                        </div>
                        <div className="space-y-1">
                          {suggestions.slice(0, 2).map((suggestion) => (
                            <div key={suggestion.id} className="flex items-center justify-between p-2 bg-orange-600/10 rounded border border-orange-500/20">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className={`px-1 rounded text-xs ${
                                    suggestion.priority === 'high' ? 'bg-red-600/20 text-red-300' :
                                    suggestion.priority === 'medium' ? 'bg-yellow-600/20 text-yellow-300' :
                                    'bg-gray-600/20 text-gray-300'
                                  }`}>
                                    {suggestion.priority.toUpperCase()}
                                  </span>
                                  <span className="text-xs text-orange-200 font-semibold">{suggestion.title}</span>
                                  <span className="text-xs text-green-400">+{suggestion.impact} pts</span>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">{suggestion.description}</div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => applyOptimization(clip.id, suggestion.id)}
                                className="text-xs px-2 py-1 ml-2 bg-orange-600/20 hover:bg-orange-600/30 text-orange-300"
                              >
                                ✨ Aplicar
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ➕ INDICADORES DE KEYBOARD SHORTCUTS ATIVOS */}
      {keySequence.length > 0 && (
        <div className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-md rounded-lg p-3 border border-white/20">
          <div className="text-xs text-gray-400 mb-1">Atalhos Recentes:</div>
          <div className="space-y-1">
            {keySequence.map((key, index) => (
              <div key={index} className={`text-sm font-mono px-2 py-1 rounded ${
                index === keySequence.length - 1 
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' 
                  : 'bg-gray-600/20 text-gray-400'
              }`}>
                {key}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ➕ INDICADOR DE AÇÃO ATIVA */}
      {activeShortcut && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-blue-600/90 backdrop-blur-md rounded-xl p-4 border border-blue-400/50">
          <div className="text-center">
            <div className="text-2xl text-white font-bold mb-2">
              {(() => {
                const shortcutKey = Object.keys(keyboardShortcuts).find(k => keyboardShortcuts[k].action === activeShortcut);
                return shortcutKey ? keyboardShortcuts[shortcutKey].description : activeShortcut;
              })()}
            </div>
            <div className="text-sm text-blue-200">Ação executada</div>
          </div>
        </div>
      )}

      {/* ➕ MODAL DE AJUDA DE ATALHOS */}
      {showShortcutsHelp && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={(e) => {
            // Fechar modal clicando no backdrop
            if (e.target === e.currentTarget) {
              setShowShortcutsHelp(false);
            }
          }}
        >
          <div className="bg-gray-900 rounded-xl p-6 border border-white/20 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto relative">
            {/* Botão X grande e visível no canto superior direito */}
            <button
              onClick={() => setShowShortcutsHelp(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/60 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
              title="Fechar (ESC)"
            >
              <span className="text-xl font-bold">✕</span>
            </button>

            <div className="flex items-center justify-between mb-6 pr-12">
              <h3 className="text-xl font-bold text-white flex items-center">
                <span className="mr-3">⌨️</span>
                Atalhos de Teclado Profissionais
              </h3>
              <div className="text-sm text-gray-400">
                Pressione <kbd className="bg-gray-700 px-2 py-1 rounded text-xs">ESC</kbd> para fechar
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(shortcutCategories).map(([category, shortcuts]) => (
                <div key={category} className="space-y-3">
                  <h4 className="text-lg font-semibold text-white border-b border-white/20 pb-2">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {shortcuts.map(({ key, shortcut }) => (
                      <div key={key} className="flex items-center justify-between p-2 bg-black/20 rounded border border-white/10">
                        <span className="text-sm text-gray-300">{shortcut.description}</span>
                        <kbd className="px-2 py-1 bg-gray-700 text-white text-xs rounded font-mono border border-gray-600">
                          {key.replace('Ctrl+', '⌘').replace('Alt+', '⌥').replace('Shift+', '⇧')}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-600/10 rounded-lg border border-blue-500/20">
              <h4 className="text-sm font-bold text-blue-300 mb-2 flex items-center">
                <span className="mr-2">💡</span>
                Dicas Profissionais:
              </h4>
              <ul className="text-sm text-blue-200 space-y-1">
                <li>• Use <kbd className="bg-gray-700 px-1 rounded text-xs">C</kbd> para ativar Razor Tool e cortar rapidamente</li>
                <li>• <kbd className="bg-gray-700 px-1 rounded text-xs">Space</kbd> para play/pause durante edição</li>
                <li>• <kbd className="bg-gray-700 px-1 rounded text-xs">Shift + ←/→</kbd> para navegar rapidamente</li>
                <li>• <kbd className="bg-gray-700 px-1 rounded text-xs">Alt + A</kbd> para análise viral IA</li>
                <li>• <kbd className="bg-gray-700 px-1 rounded text-xs">J/K/L</kbd> para controle de velocidade como no Premiere</li>
              </ul>
            </div>

            {/* Botão de fechar inferior adicional */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setShowShortcutsHelp(false)}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg"
              >
                Fechar Ajuda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ➕ INDICADOR DE VELOCIDADE DE PLAYBACK */}
      {playbackSpeed !== 1 && (
        <div className="fixed bottom-4 right-4 z-40 bg-black/80 backdrop-blur-md rounded-lg p-2 border border-white/20">
          <div className="text-sm text-white font-bold">
            Velocidade: {playbackSpeed}x
          </div>
        </div>
      )}

      {/* ➕ BOTÃO DE AJUDA FLUTUANTE */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowShortcutsHelp(true)}
        className="fixed bottom-4 left-4 z-40 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-full w-12 h-12 flex items-center justify-center"
        title="Atalhos de Teclado (H ou ?)"
      >
        ⌨️
      </Button>

      {/* ➕ INSTRUÇÕES CLARAS DO SISTEMA DE CORTES */}
      <div className="usage-instructions">
        <h4>🎯 Como Funciona o Sistema de Otimização de Vídeo</h4>
        <ul>
          <li><strong>CONCEITO:</strong> Use cortes para marcar onde quer <strong>REMOVER</strong> partes do vídeo (não criar clips separados)</li>
          <li><strong>OBJETIVO:</strong> Gerar <strong>UM ÚNICO vídeo final otimizado</strong> sem as partes cortadas</li>
          <li><strong>PROCESSO:</strong></li>
          <ul>
            <li>1. Ative a ferramenta <code>Razor</code> (✂️)</li>
            <li>2. Clique nos tempos onde quer fazer cortes (início e fim de seções a remover)</li>
            <li>3. Os cortes dividem o vídeo em segmentos</li>
            <li>4. Marque quais segmentos serão <strong>removidos</strong></li>
            <li>5. Exporte o vídeo final <strong>sem as partes removidas</strong></li>
          </ul>
          <li><strong>RESULTADO:</strong> Um vídeo contínuo otimizado, não múltiplos clips</li>
        </ul>
      </div>

      {/* ➕ SISTEMA DE CORTE AVANÇADO */}
      <div className="cutting-system bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold flex items-center gap-2">
            ✂️ Sistema de Corte Avançado
            <span className="text-sm text-gray-400">
              ({selectedSections.length} seleção(ões) | {formatTime(calculateSelectedDuration())} total)
            </span>
          </h3>
          
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              previewMode === 'cut-only' 
                ? 'bg-green-600/20 text-green-300 border border-green-500/30' 
                : 'bg-gray-600/20 text-gray-300'
            }`}>
              {previewMode === 'cut-only' ? '▶️ Preview Cortes' : '📹 Original'}
            </span>
          </div>
        </div>

        {/* Controles IN/OUT */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <button
            onClick={markInPoint}
            className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              inPoint !== null 
                ? 'bg-green-600 text-white shadow-lg shadow-green-600/50' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            title="Marcar início da seleção (I)"
          >
            📍 IN
            {inPoint !== null && (
              <span className="text-xs">({formatTime(inPoint)})</span>
            )}
          </button>
          
          <button
            onClick={markOutPoint}
            className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              outPoint !== null 
                ? 'bg-green-600 text-white shadow-lg shadow-green-600/50' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            title="Marcar fim da seleção (O)"
          >
            📍 OUT
            {outPoint !== null && (
              <span className="text-xs">({formatTime(outPoint)})</span>
            )}
          </button>
          
          <button
            onClick={clearCurrentSelection}
            className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all"
            title="Limpar seleção atual (X)"
          >
            🔄 Limpar
          </button>
          
          <button
            onClick={playSelectedSectionsOnly}
            disabled={selectedSections.length === 0}
            className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Preview só partes selecionadas (P)"
          >
            ▶️ Preview
          </button>
        </div>

        {/* Barra de seleção visual */}
        <div className="mb-4">
          <div className="text-sm text-gray-300 mb-2">🎯 Seleção Precisa - Clique e arraste na timeline:</div>
          <div 
            className="timeline-selection-bar relative h-16 bg-gray-800 rounded-lg border-2 border-gray-600 cursor-crosshair overflow-hidden"
            onMouseDown={handleTimelineMouseDown}
            onMouseMove={handleTimelineMouseMove}
            onMouseUp={handleTimelineMouseUp}
          >
            {/* Régua de tempo */}
            <div className="absolute top-0 left-0 right-0 h-6 bg-gray-700/50 flex items-center px-2">
              {Array.from({ length: Math.ceil(duration / 10) }, (_, i) => (
                <div 
                  key={i}
                  className="absolute text-xs text-gray-400"
                  style={{ left: `${(i * 10 / duration) * 100}%` }}
                >
                  {formatTime(i * 10)}
                </div>
              ))}
            </div>
            
            {/* Seleções existentes */}
            {selectedSections.map((section) => (
              <div
                key={section.id}
                className="absolute top-6 bottom-0 bg-green-500/30 border-2 border-green-400 rounded cursor-pointer hover:bg-green-500/40"
                style={{
                  left: `${(section.start / duration) * 100}%`,
                  width: `${((section.end - section.start) / duration) * 100}%`,
                }}
                title={`Seleção: ${formatTime(section.start)} - ${formatTime(section.end)}`}
                onClick={() => removeSelection(section.id)}
              >
                <div className="absolute top-1 left-1 text-xs text-green-200 font-bold">
                  ✂️ {formatTime(section.end - section.start)}
                </div>
              </div>
            ))}
            
            {/* Seleção atual (IN/OUT) */}
            {inPoint !== null && outPoint !== null && (
              <div
                className="absolute top-6 bottom-0 bg-blue-500/30 border-2 border-blue-400 border-dashed rounded animate-pulse"
                style={{
                  left: `${(Math.min(inPoint, outPoint) / duration) * 100}%`,
                  width: `${(Math.abs(outPoint - inPoint) / duration) * 100}%`,
                }}
              >
                <div className="absolute top-1 left-1 text-xs text-blue-200 font-bold">
                  📏 {formatTime(Math.abs(outPoint - inPoint))}
                </div>
              </div>
            )}
            
            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-yellow-400 z-10"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-yellow-400">▼</div>
            </div>
          </div>
        </div>

        {/* Lista de seleções */}
        {selectedSections.length > 0 && (
          <div>
            <div className="text-sm text-gray-300 mb-2">📋 Seleções Ativas:</div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {selectedSections.map((section, index) => (
                <div key={section.id} className="flex items-center justify-between bg-gray-800 rounded p-2">
                  <div className="flex items-center gap-3">
                    <span className="text-green-400 font-bold">#{index + 1}</span>
                    <span className="text-white text-sm">
                      {formatTime(section.start)} → {formatTime(section.end)}
                    </span>
                    <span className="text-gray-400 text-xs">
                      (duração: {formatTime(section.end - section.start)})
                    </span>
                  </div>
                  <button
                    onClick={() => removeSelection(section.id)}
                    className="text-red-400 hover:text-red-300 px-2 py-1 rounded transition-colors"
                    title="Remover seleção"
                  >
                    ❌
                  </button>
                </div>
              ))}
            </div>
            
            {/* Controles finais */}
            <div className="flex items-center justify-between mt-4 p-3 bg-gray-800/50 rounded-lg">
              <div className="text-sm">
                <div className="text-green-300 font-semibold">
                  ✅ {selectedSections.length} seleção(ões) ativa(s)
                </div>
                <div className="text-gray-400">
                  Duração total: {formatTime(calculateSelectedDuration())} 
                  ({((calculateSelectedDuration() / duration) * 100).toFixed(1)}% do vídeo)
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={playOriginalVideo}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium transition-all"
                >
                  📹 Original
                </button>
                <button
                  onClick={playSelectedSectionsOnly}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-all"
                >
                  ▶️ Preview Cortes
                </button>
                <button
                  onClick={() => setSelectedSections([])}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-all"
                >
                  🗑️ Limpar Tudo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instruções */}
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
          <div className="text-sm text-blue-300 font-medium mb-2">🎯 Como usar o Sistema de Corte Avançado:</div>
          <div className="text-xs text-blue-200 space-y-1">
            <div><kbd className="bg-gray-700 px-1 rounded">I</kbd> + <kbd className="bg-gray-700 px-1 rounded">O</kbd> - Marcar pontos IN e OUT</div>
            <div><kbd className="bg-gray-700 px-1 rounded">Arrastar</kbd> - Selecionar região diretamente na barra</div>
            <div><kbd className="bg-gray-700 px-1 rounded">P</kbd> - Preview só das partes selecionadas</div>
            <div><kbd className="bg-gray-700 px-1 rounded">X</kbd> - Limpar seleção atual</div>
            <div>🎵 <strong>Áudio incluído:</strong> As seleções afetam vídeo e áudio simultaneamente</div>
          </div>
        </div>
      </div>

      {/* ➕ TRANSCRIPT TRACK (ETAPA 1.2) */}
      {showTranscriptTrack && transcriptionData && (
        <div 
          className="timeline-track transcript-track group relative"
          style={{
            background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(147, 51, 234, 0.4))',
            borderLeft: '3px solid rgba(147, 51, 234, 0.8)',
          }}
        >
          {/* Header da Transcript Track */}
          <div className="track-header flex items-center justify-between bg-purple-900/30 p-2 border-r border-purple-500/30">
            <div className="flex items-center gap-2">
              <span className="text-purple-300 font-semibold">📝 Transcript</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-purple-400">
                  {transcriptionData.words?.length || 0} palavras
                </span>
                {transcriptionData.language && (
                  <span className="text-xs text-blue-400 bg-blue-900/30 px-1 rounded">
                    {transcriptionData.language.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Conteúdo da Transcript Track */}
          <div className="track-content relative h-12 bg-gradient-to-r from-purple-900/10 to-purple-800/20">
            {/* Palavras da transcrição */}
            {transcriptionData.words && transcriptionData.words.map((word: any, index: number) => {
              const leftPercent = (word.start / duration) * 100;
              const widthPercent = ((word.end - word.start) / duration) * 100;
              const isCurrentWord = currentTime >= word.start && currentTime <= word.end;
              
              return (
                <div
                  key={`word-${index}`}
                  className={`absolute top-0 h-full flex items-center justify-center text-xs font-medium px-1 cursor-pointer transition-all duration-200 hover:z-10 border-r border-purple-500/20 ${
                    isCurrentWord 
                      ? 'bg-purple-500/60 text-white scale-105 z-20 shadow-lg' 
                      : word.confidence > 0.9 
                        ? 'bg-purple-600/30 text-purple-200 hover:bg-purple-500/40' 
                        : 'bg-purple-700/20 text-purple-300 hover:bg-purple-600/30'
                  }`}
                  style={{
                    left: `${leftPercent}%`,
                    width: `${Math.max(widthPercent, 0.5)}%`,
                  }}
                  onClick={() => onSeek(word.start)}
                  title={`"${word.text}" (${formatTime(word.start)} - ${formatTime(word.end)}) - Confiança: ${Math.round((word.confidence || 0.9) * 100)}%`}
                >
                  <span className="truncate text-xs">
                    {word.text}
                  </span>
                </div>
              );
            })}

            {/* Indicador de palavra atual */}
            {currentTranscriptWord && (
              <div className="absolute top-0 right-2 bg-purple-600/80 text-white px-2 py-1 rounded text-xs font-medium">
                🎤 "{currentTranscriptWord}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelinePro; 