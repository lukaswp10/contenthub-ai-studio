/**
 * ⚙️ RENDER SETTINGS - ClipsForge Pro
 * 
 * Configurações de renderização profissional
 * 
 * @version 8.0.0 - FASE 8
 * @author ClipsForge Team
 */

import React, { useState, useCallback } from 'react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Switch } from '../../ui/switch';
import { 
  Settings, 
  Cpu, 
  HardDrive, 
  Zap, 
  Thermometer,
  Battery,
  Monitor,
  Save,
  RotateCcw
} from 'lucide-react';
import { RenderSettings as RenderSettingsType } from '../../../types/render.types';

export interface RenderSettingsProps {
  settings: RenderSettingsType;
  onSettingsChange: (settings: RenderSettingsType) => void;
  onSave: () => void;
  onReset: () => void;
  className?: string;
}

const RenderSettings: React.FC<RenderSettingsProps> = ({
  settings,
  onSettingsChange,
  onSave,
  onReset,
  className = ''
}) => {
  const [localSettings, setLocalSettings] = useState<RenderSettingsType>(settings);

  const handleSettingChange = useCallback((key: keyof RenderSettingsType, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  }, [localSettings, onSettingsChange]);

  const qualityOptions = [
    { value: 'draft', label: 'Rascunho', description: 'Velocidade máxima, qualidade básica' },
    { value: 'preview', label: 'Preview', description: 'Balanceado para visualização' },
    { value: 'high', label: 'Alta', description: 'Qualidade profissional' },
    { value: 'maximum', label: 'Máxima', description: 'Melhor qualidade possível' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Baixa', description: 'Menor impacto no sistema' },
    { value: 'normal', label: 'Normal', description: 'Uso equilibrado de recursos' },
    { value: 'high', label: 'Alta', description: 'Prioridade de processamento' },
    { value: 'realtime', label: 'Tempo Real', description: 'Máxima prioridade' }
  ];

  return (
    <div className={`render-settings ${className}`}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Configurações de Renderização</h3>
            <p className="text-sm text-gray-400">Otimize o desempenho e qualidade</p>
          </div>
          <Badge variant="outline" className="text-xs">
            Fase 8
          </Badge>
        </div>

        {/* Quality Settings */}
        <Card className="p-4 bg-gray-800">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Monitor size={16} className="text-blue-400" />
              <h4 className="text-sm font-medium text-white">Qualidade</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {qualityOptions.map((option) => (
                <Card
                  key={option.value}
                  className={`p-3 cursor-pointer transition-all hover:bg-gray-700 ${
                    localSettings.quality === option.value ? 'ring-2 ring-blue-500 bg-gray-700' : 'bg-gray-900'
                  }`}
                  onClick={() => handleSettingChange('quality', option.value)}
                >
                  <div className="text-sm font-medium text-white">{option.label}</div>
                  <div className="text-xs text-gray-400">{option.description}</div>
                </Card>
              ))}
            </div>
          </div>
        </Card>

        {/* Performance Settings */}
        <Card className="p-4 bg-gray-800">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Cpu size={16} className="text-green-400" />
              <h4 className="text-sm font-medium text-white">Performance</h4>
            </div>

            <div className="space-y-4">
              {/* Threads */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Threads de Processamento</div>
                  <div className="text-xs text-gray-400">Número de threads para renderização</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSettingChange('threads', Math.max(1, localSettings.threads - 1))}
                    className="h-8 w-8 p-0"
                  >
                    -
                  </Button>
                  <span className="text-sm text-white w-8 text-center">{localSettings.threads}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSettingChange('threads', Math.min(16, localSettings.threads + 1))}
                    className="h-8 w-8 p-0"
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* GPU Acceleration */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Aceleração GPU</div>
                  <div className="text-xs text-gray-400">Usar WebGL para renderização</div>
                </div>
                <Switch
                  checked={localSettings.useGPU}
                  onCheckedChange={(checked) => handleSettingChange('useGPU', checked)}
                />
              </div>

              {/* Web Workers */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Web Workers</div>
                  <div className="text-xs text-gray-400">Processamento multi-thread</div>
                </div>
                <Switch
                  checked={localSettings.useWebWorkers}
                  onCheckedChange={(checked) => handleSettingChange('useWebWorkers', checked)}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Memory Settings */}
        <Card className="p-4 bg-gray-800">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <HardDrive size={16} className="text-purple-400" />
              <h4 className="text-sm font-medium text-white">Memória e Cache</h4>
            </div>

            <div className="space-y-4">
              {/* Cache Enabled */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Cache Habilitado</div>
                  <div className="text-xs text-gray-400">Usar cache para acelerar renderização</div>
                </div>
                <Switch
                  checked={localSettings.cacheEnabled}
                  onCheckedChange={(checked) => handleSettingChange('cacheEnabled', checked)}
                />
              </div>

              {/* Cache Size */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Tamanho do Cache</div>
                  <div className="text-xs text-gray-400">Limite de memória para cache (MB)</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSettingChange('cacheSize', Math.max(50, localSettings.cacheSize - 50))}
                    className="h-8 w-8 p-0"
                  >
                    -
                  </Button>
                  <span className="text-sm text-white w-12 text-center">{localSettings.cacheSize}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSettingChange('cacheSize', Math.min(1000, localSettings.cacheSize + 50))}
                    className="h-8 w-8 p-0"
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Memory Limit */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Limite de Memória</div>
                  <div className="text-xs text-gray-400">Máximo de RAM utilizável (MB)</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSettingChange('memoryLimit', Math.max(512, localSettings.memoryLimit - 256))}
                    className="h-8 w-8 p-0"
                  >
                    -
                  </Button>
                  <span className="text-sm text-white w-16 text-center">{localSettings.memoryLimit}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSettingChange('memoryLimit', Math.min(8192, localSettings.memoryLimit + 256))}
                    className="h-8 w-8 p-0"
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* System Optimization */}
        <Card className="p-4 bg-gray-800">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Zap size={16} className="text-yellow-400" />
              <h4 className="text-sm font-medium text-white">Otimização do Sistema</h4>
            </div>

            <div className="space-y-4">
              {/* Priority Level */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-white">Nível de Prioridade</div>
                <div className="grid grid-cols-2 gap-2">
                  {priorityOptions.map((option) => (
                    <Card
                      key={option.value}
                      className={`p-2 cursor-pointer transition-all hover:bg-gray-700 ${
                        localSettings.priorityLevel === option.value ? 'ring-1 ring-yellow-500 bg-gray-700' : 'bg-gray-900'
                      }`}
                      onClick={() => handleSettingChange('priorityLevel', option.value)}
                    >
                      <div className="text-xs font-medium text-white">{option.label}</div>
                      <div className="text-xs text-gray-400">{option.description}</div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Thermal Throttling */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Thermometer size={14} className="text-red-400" />
                  <div>
                    <div className="text-sm font-medium text-white">Controle Térmico</div>
                    <div className="text-xs text-gray-400">Reduzir velocidade se superaquecer</div>
                  </div>
                </div>
                <Switch
                  checked={localSettings.thermalThrottling}
                  onCheckedChange={(checked) => handleSettingChange('thermalThrottling', checked)}
                />
              </div>

              {/* Battery Optimization */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Battery size={14} className="text-green-400" />
                  <div>
                    <div className="text-sm font-medium text-white">Otimização de Bateria</div>
                    <div className="text-xs text-gray-400">Reduzir uso de energia</div>
                  </div>
                </div>
                <Switch
                  checked={localSettings.batteryOptimization}
                  onCheckedChange={(checked) => handleSettingChange('batteryOptimization', checked)}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button onClick={onSave} className="flex-1">
            <Save size={16} className="mr-2" />
            Salvar Configurações
          </Button>
          
          <Button variant="outline" onClick={onReset}>
            <RotateCcw size={16} className="mr-2" />
            Restaurar Padrões
          </Button>
        </div>

        {/* Performance Tips */}
        <Card className="p-4 bg-blue-900/20 border-blue-500/30">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-300">💡 Dicas de Performance</h4>
            <div className="text-xs text-blue-200 space-y-1">
              <div>• Use qualidade "Preview" para testes rápidos</div>
              <div>• Ative GPU para renderização mais rápida</div>
              <div>• Aumente o cache para projetos complexos</div>
              <div>• Use controle térmico em laptops</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RenderSettings; 