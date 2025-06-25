import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
    Eye,
    Pause,
    Play,
    RefreshCw,
    Save,
    Scissors,
    Settings,
    SkipBack,
    SkipForward,
    Type,
    Volume2,
    VolumeX
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface ClipSuggestion {
  id?: string;
  start_time: number;
  end_time: number;
  title: string;
  description: string;
  viral_score: number;
  hook_strength: number;
  hashtags: string[];
  best_platforms: string[];
  content_category: string;
}

interface VideoPreviewEditorProps {
  videoId: string;
  videoUrl: string;
  duration: number;
  clipSuggestions: ClipSuggestion[];
  onClipsUpdated?: (clips: ClipSuggestion[]) => void;
  onRegenerateClips?: (videoId: string, editedSegments: any[]) => void;
}

export function VideoPreviewEditor({
  videoId,
  videoUrl,
  duration,
  clipSuggestions,
  onClipsUpdated,
  onRegenerateClips
}: VideoPreviewEditorProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Editing state
  const [selectedClip, setSelectedClip] = useState<ClipSuggestion | null>(null);
  const [editingClip, setEditingClip] = useState<ClipSuggestion | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [subtitleText, setSubtitleText] = useState('');
  const [customSegments, setCustomSegments] = useState<any[]>([]);
  
  // UI state
  const [showEditor, setShowEditor] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    setCurrentTime(time);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  };

  const changeVolume = (newVolume: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = newVolume[0];
    setVolume(newVolume[0]);
  };

  const changePlaybackSpeed = (speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const handleTimelineClick = (event: React.MouseEvent) => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    const rect = timeline.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const timelineWidth = rect.width;
    const clickTime = (clickX / timelineWidth) * duration;
    
    seekTo(clickTime);
  };

  const playClip = (clip: ClipSuggestion) => {
    seekTo(clip.start_time);
    setSelectedClip(clip);
    
    const video = videoRef.current;
    if (!video) return;
    
    video.play();
    
    // Stop at end time
    const checkTime = () => {
      if (video.currentTime >= clip.end_time) {
        video.pause();
        return;
      }
      requestAnimationFrame(checkTime);
    };
    checkTime();
  };

  const startEditingClip = (clip: ClipSuggestion) => {
    setEditingClip({ ...clip });
    setShowEditor(true);
    setSelectedClip(clip);
  };

  const saveEditedClip = async () => {
    if (!editingClip) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clips')
        .update({
          title: editingClip.title,
          description: editingClip.description,
          start_time_seconds: editingClip.start_time,
          end_time_seconds: editingClip.end_time,
          hashtags: editingClip.hashtags,
          ai_content_category: editingClip.content_category
        })
        .eq('id', editingClip.id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      const updatedClips = clipSuggestions.map(clip => 
        clip.id === editingClip.id ? editingClip : clip
      );
      onClipsUpdated?.(updatedClips);

      toast({
        title: "Clip atualizado",
        description: "As alterações foram salvas com sucesso."
      });

      setShowEditor(false);
      setEditingClip(null);
    } catch (error) {
      console.error('Error saving clip:', error);
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const regenerateClips = async () => {
    if (!onRegenerateClips) return;

    setLoading(true);
    try {
      // Include custom segments and subtitle preferences
      const editedSegments = [
        ...customSegments,
        ...(subtitleText ? [{ type: 'subtitle', text: subtitleText }] : [])
      ];

      await onRegenerateClips(videoId, editedSegments);
      
      toast({
        title: "Regenerando clips",
        description: "Novos clips estão sendo gerados com base nas suas edições."
      });
    } catch (error) {
      console.error('Error regenerating clips:', error);
      toast({
        title: "Erro na regeneração",
        description: "Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getClipColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Video Player */}
      <Card>
        <CardContent className="p-0">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-auto max-h-96 object-contain"
              playsInline
              preload="metadata"
            />
            
            {/* Video Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              {/* Timeline */}
              <div 
                ref={timelineRef}
                className="relative mb-4 h-2 bg-gray-600 rounded cursor-pointer"
                onClick={handleTimelineClick}
              >
                {/* Progress Bar */}
                <div 
                  className="absolute top-0 left-0 h-full bg-white rounded"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
                
                {/* Clip Markers */}
                {clipSuggestions.map((clip, index) => (
                  <div
                    key={index}
                    className={`absolute top-0 h-full rounded cursor-pointer opacity-70 hover:opacity-100 ${getClipColor(clip.viral_score)}`}
                    style={{
                      left: `${(clip.start_time / duration) * 100}%`,
                      width: `${((clip.end_time - clip.start_time) / duration) * 100}%`
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      playClip(clip);
                    }}
                    title={`${clip.title} (${formatTime(clip.start_time)} - ${formatTime(clip.end_time)})`}
                  />
                ))}
                
                {/* Current Time Indicator */}
                <div 
                  className="absolute top-0 w-0.5 h-full bg-white shadow-lg"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => seekTo(Math.max(0, currentTime - 10))}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlay}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => seekTo(Math.min(duration, currentTime + 10))}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  
                  <div className="w-20">
                    <Slider
                      value={[volume]}
                      max={1}
                      step={0.1}
                      onValueChange={changeVolume}
                      className="cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                  
                  <select
                    value={playbackSpeed}
                    onChange={(e) => changePlaybackSpeed(Number(e.target.value))}
                    className="bg-transparent border border-white/20 rounded px-2 py-1 text-xs"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={0.75}>0.75x</option>
                    <option value={1}>1x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2x</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Subtitles Overlay */}
            {showSubtitles && subtitleText && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded">
                {subtitleText}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clips Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5" />
              Clips Sugeridos ({clipSuggestions.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditor(!showEditor)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Editor
              </Button>
              <Button
                onClick={regenerateClips}
                disabled={loading}
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Regenerar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clipSuggestions.map((clip, index) => (
              <Card key={index} className={`cursor-pointer transition-all hover:shadow-md ${selectedClip === clip ? 'ring-2 ring-blue-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {formatTime(clip.start_time)} - {formatTime(clip.end_time)}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getClipColor(clip.viral_score)}`}
                    >
                      {clip.viral_score.toFixed(1)}
                    </Badge>
                  </div>
                  
                  <h4 className="font-medium mb-2 line-clamp-2">{clip.title}</h4>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{clip.description}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {clip.hashtags.slice(0, 3).map((tag, tagIndex) => (
                      <Badge key={tagIndex} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => playClip(clip)}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditingClip(clip)}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {clip.best_platforms.map((platform, platformIndex) => (
                        <Badge key={platformIndex} variant="outline" className="text-xs">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Editor Panel */}
      {showEditor && editingClip && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Editor de Clip
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="clip-title">Título</Label>
                  <Input
                    id="clip-title"
                    value={editingClip.title}
                    onChange={(e) => setEditingClip({
                      ...editingClip,
                      title: e.target.value
                    })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="clip-description">Descrição</Label>
                  <Textarea
                    id="clip-description"
                    value={editingClip.description}
                    onChange={(e) => setEditingClip({
                      ...editingClip,
                      description: e.target.value
                    })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="clip-hashtags">Hashtags (separadas por vírgula)</Label>
                  <Input
                    id="clip-hashtags"
                    value={editingClip.hashtags.join(', ')}
                    onChange={(e) => setEditingClip({
                      ...editingClip,
                      hashtags: e.target.value.split(',').map(tag => tag.trim())
                    })}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Tempo de Início</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={editingClip.start_time}
                      onChange={(e) => setEditingClip({
                        ...editingClip,
                        start_time: Number(e.target.value)
                      })}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingClip({
                        ...editingClip,
                        start_time: currentTime
                      })}
                    >
                      Usar Atual
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label>Tempo de Fim</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={editingClip.end_time}
                      onChange={(e) => setEditingClip({
                        ...editingClip,
                        end_time: Number(e.target.value)
                      })}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingClip({
                        ...editingClip,
                        end_time: currentTime
                      })}
                    >
                      Usar Atual
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={showSubtitles}
                    onCheckedChange={setShowSubtitles}
                  />
                  <Label>Mostrar Legendas</Label>
                </div>
                
                {showSubtitles && (
                  <div>
                    <Label htmlFor="subtitle-text">Texto da Legenda</Label>
                    <Textarea
                      id="subtitle-text"
                      value={subtitleText}
                      onChange={(e) => setSubtitleText(e.target.value)}
                      placeholder="Digite o texto da legenda..."
                    />
                  </div>
                )}
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditor(false);
                  setEditingClip(null);
                }}
              >
                Cancelar
              </Button>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => playClip(editingClip)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                
                <Button
                  onClick={saveEditedClip}
                  disabled={loading}
                >
                  <Save className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Salvar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 