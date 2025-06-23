import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Clock, 
  Languages, 
  Film, 
  Smartphone,
  Volume2,
  Scissors,
  Sparkles
} from 'lucide-react'

interface ProcessingConfig {
  clipDuration: number
  clipCount: number | 'auto'
  language: string
  contentType: string
  generateSubtitles: boolean
  optimizeForMobile: boolean
  removesilence: boolean
  enhanceAudio: boolean
}

interface ProcessingConfigProps {
  onConfigChange?: (config: ProcessingConfig) => void
}

export function ProcessingConfig({ onConfigChange }: ProcessingConfigProps) {
  const [config, setConfig] = useState<ProcessingConfig>({
    clipDuration: 30,
    clipCount: 'auto',
    language: 'auto',
    contentType: 'auto',
    generateSubtitles: false,
    optimizeForMobile: false,
    removesilence: false,
    enhanceAudio: false
  });

  // For now, we'll use a simple plan check
  const isPro = true; // TODO: Get from user profile
  const isAgency = false; // TODO: Get from user profile

  const updateConfig = (key: keyof ProcessingConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações de Processamento
        </CardTitle>
        <CardDescription>
          Personalize como a IA vai processar seu vídeo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Clip Duration */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Duração dos clips
            </Label>
            <Select
              value={String(config.clipDuration)}
              onValueChange={(value) => updateConfig('clipDuration', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 segundos (TikTok/Reels)</SelectItem>
                <SelectItem value="30">30 segundos (Padrão)</SelectItem>
                <SelectItem value="60">60 segundos (YouTube Shorts)</SelectItem>
                <SelectItem value="90">90 segundos (Instagram)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clip Count */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Film className="h-4 w-4" />
              Quantidade de clips
            </Label>
            <Select
              value={String(config.clipCount)}
              onValueChange={(value) => updateConfig('clipCount', value === 'auto' ? 'auto' : parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Automático (IA decide)
                  </span>
                </SelectItem>
                <SelectItem value="3">3 clips</SelectItem>
                <SelectItem value="5">5 clips</SelectItem>
                <SelectItem value="10">10 clips</SelectItem>
                <SelectItem value="15" disabled={!isPro}>
                  15 clips {!isPro && <Badge variant="secondary" className="ml-2">Pro</Badge>}
                </SelectItem>
                <SelectItem value="20" disabled={!isAgency}>
                  20 clips {!isAgency && <Badge variant="secondary" className="ml-2">Agency</Badge>}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              Idioma do vídeo
            </Label>
            <Select
              value={config.language}
              onValueChange={(value) => updateConfig('language', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Detectar automaticamente</SelectItem>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="it">Italiano</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="ko">한국어</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content Type */}
          <div className="space-y-2">
            <Label>Tipo de conteúdo</Label>
            <Select
              value={config.contentType}
              onValueChange={(value) => updateConfig('contentType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Detectar automaticamente</SelectItem>
                <SelectItem value="podcast">Podcast/Conversa</SelectItem>
                <SelectItem value="tutorial">Tutorial/Educacional</SelectItem>
                <SelectItem value="presentation">Apresentação/Palestra</SelectItem>
                <SelectItem value="interview">Entrevista</SelectItem>
                <SelectItem value="vlog">Vlog/Lifestyle</SelectItem>
                <SelectItem value="gaming">Gaming</SelectItem>
                <SelectItem value="music">Música/Show</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium">Opções Avançadas</h4>
          
          <div className="space-y-4">
            {/* Generate Subtitles */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="subtitles" className="flex items-center gap-2">
                  Gerar legendas automáticas
                  {!isPro && <Badge variant="secondary">Pro</Badge>}
                </Label>
                <p className="text-sm text-gray-600">
                  Adiciona legendas em todos os clips gerados
                </p>
              </div>
              <Switch
                id="subtitles"
                checked={config.generateSubtitles}
                onCheckedChange={(checked) => updateConfig('generateSubtitles', checked)}
                disabled={!isPro}
              />
            </div>

            {/* Optimize for Mobile */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="mobile" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Otimizar para mobile
                </Label>
                <p className="text-sm text-gray-600">
                  Converte para formato vertical 9:16
                </p>
              </div>
              <Switch
                id="mobile"
                checked={config.optimizeForMobile}
                onCheckedChange={(checked) => updateConfig('optimizeForMobile', checked)}
              />
            </div>

            {/* Remove Silence */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="silence" className="flex items-center gap-2">
                  <Scissors className="h-4 w-4" />
                  Remover silêncios
                  {!isPro && <Badge variant="secondary">Pro</Badge>}
                </Label>
                <p className="text-sm text-gray-600">
                  Remove pausas longas automaticamente
                </p>
              </div>
              <Switch
                id="silence"
                checked={config.removesilence}
                onCheckedChange={(checked) => updateConfig('removesilence', checked)}
                disabled={!isPro}
              />
            </div>

            {/* Enhance Audio */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="audio" className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Melhorar qualidade do áudio
                  {!isAgency && <Badge variant="secondary">Agency</Badge>}
                </Label>
                <p className="text-sm text-gray-600">
                  Aplica filtros de redução de ruído e clareza
                </p>
              </div>
              <Switch
                id="audio"
                checked={config.enhanceAudio}
                onCheckedChange={(checked) => updateConfig('enhanceAudio', checked)}
                disabled={!isAgency}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 