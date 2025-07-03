/**
 * 🎨 PAINEL DE EFEITOS PROFISSIONAL - ClipsForge Pro
 * 
 * Interface avançada para aplicação de efeitos visuais
 * Drag & drop, categorização e preview em tempo real
 * 
 * @version 4.0.0 - FASE 4
 * @author ClipsForge Team
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  BaseEffect, 
  EffectType, 
  EffectCategory, 
  EffectParameters,
  EffectPreset 
} from '../../types/effects.types';

// ===== INTERFACES =====

interface EffectsPanelProps {
  className?: string;
  onEffectApply?: (effect: BaseEffect, trackId: string) => void;
  onEffectRemove?: (effectId: string) => void;
  onEffectUpdate?: (effectId: string, parameters: Partial<BaseEffect>) => void;
  selectedTrackId?: string;
  appliedEffects?: BaseEffect[];
  previewMode?: boolean;
}

interface EffectDefinition {
  type: EffectType;
  name: string;
  category: EffectCategory;
  description: string;
  icon: string;
  parameters: EffectParameters;
  presets?: EffectPreset[];
  thumbnail?: string;
}

// ===== EFFECT DEFINITIONS =====

const EFFECT_DEFINITIONS: EffectDefinition[] = [
  // Color Effects
  {
    type: 'brightness',
    name: 'Brightness',
    category: 'color',
    description: 'Adjust the brightness of your video',
    icon: '☀️',
    parameters: {
      brightness: {
        name: 'Brightness',
        type: 'range',
        value: 0,
        min: -1,
        max: 1,
        step: 0.01,
        unit: '',
        description: 'Brightness adjustment'
      }
    }
  },
  {
    type: 'contrast',
    name: 'Contrast',
    category: 'color',
    description: 'Adjust the contrast of your video',
    icon: '🌓',
    parameters: {
      contrast: {
        name: 'Contrast',
        type: 'range',
        value: 1,
        min: 0,
        max: 3,
        step: 0.01,
        unit: '',
        description: 'Contrast adjustment'
      }
    }
  },
  {
    type: 'saturation',
    name: 'Saturation',
    category: 'color',
    description: 'Adjust color saturation',
    icon: '🎨',
    parameters: {
      saturation: {
        name: 'Saturation',
        type: 'range',
        value: 1,
        min: 0,
        max: 3,
        step: 0.01,
        unit: '',
        description: 'Color saturation'
      }
    }
  },
  {
    type: 'hue',
    name: 'Hue Shift',
    category: 'color',
    description: 'Shift the color hue',
    icon: '🌈',
    parameters: {
      hue: {
        name: 'Hue',
        type: 'range',
        value: 0,
        min: -180,
        max: 180,
        step: 1,
        unit: '°',
        description: 'Hue shift in degrees'
      }
    }
  },
  
  // Blur Effects
  {
    type: 'gaussianBlur',
    name: 'Gaussian Blur',
    category: 'blur',
    description: 'Apply Gaussian blur effect',
    icon: '💫',
    parameters: {
      blurRadius: {
        name: 'Blur Radius',
        type: 'range',
        value: 0,
        min: 0,
        max: 20,
        step: 0.1,
        unit: 'px',
        description: 'Blur intensity'
      }
    }
  },
  {
    type: 'motionBlur',
    name: 'Motion Blur',
    category: 'blur',
    description: 'Simulate motion blur',
    icon: '🏃',
    parameters: {
      angle: {
        name: 'Angle',
        type: 'range',
        value: 0,
        min: 0,
        max: 360,
        step: 1,
        unit: '°',
        description: 'Motion direction'
      },
      distance: {
        name: 'Distance',
        type: 'range',
        value: 5,
        min: 0,
        max: 50,
        step: 0.1,
        unit: 'px',
        description: 'Motion distance'
      }
    }
  },
  
  // Stylistic Effects
  {
    type: 'vintage',
    name: 'Vintage',
    category: 'stylistic',
    description: 'Apply vintage film look',
    icon: '📷',
    parameters: {
      intensity: {
        name: 'Intensity',
        type: 'range',
        value: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
        unit: '',
        description: 'Vintage effect intensity'
      }
    }
  },
  {
    type: 'filmGrain',
    name: 'Film Grain',
    category: 'stylistic',
    description: 'Add film grain texture',
    icon: '🎞️',
    parameters: {
      intensity: {
        name: 'Intensity',
        type: 'range',
        value: 0.1,
        min: 0,
        max: 1,
        step: 0.01,
        unit: '',
        description: 'Grain intensity'
      }
    }
  },
  {
    type: 'vignette',
    name: 'Vignette',
    category: 'stylistic',
    description: 'Add vignette effect',
    icon: '🔘',
    parameters: {
      intensity: {
        name: 'Intensity',
        type: 'range',
        value: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
        unit: '',
        description: 'Vignette intensity'
      },
      size: {
        name: 'Size',
        type: 'range',
        value: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
        unit: '',
        description: 'Vignette size'
      }
    }
  }
];

const CATEGORY_LABELS: Record<EffectCategory, string> = {
  color: 'Color',
  blur: 'Blur',
  distortion: 'Distortion',
  stylistic: 'Stylistic',
  advanced: 'Advanced',
  audio: 'Audio',
  utility: 'Utility'
};

const CATEGORY_ICONS: Record<EffectCategory, string> = {
  color: '🎨',
  blur: '💫',
  distortion: '🌀',
  stylistic: '✨',
  advanced: '⚡',
  audio: '🔊',
  utility: '🔧'
};

// ===== MAIN COMPONENT =====

const EffectsPanel: React.FC<EffectsPanelProps> = ({
  className = '',
  onEffectApply,
  onEffectRemove,
  onEffectUpdate,
  selectedTrackId,
  appliedEffects = [],
  previewMode = false
}) => {
  // ===== STATE =====
  
  const [selectedCategory, setSelectedCategory] = useState<EffectCategory>('color');
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedEffect, setDraggedEffect] = useState<EffectDefinition | null>(null);
  const [previewEffect, setPreviewEffect] = useState<BaseEffect | null>(null);
  const [expandedEffect, setExpandedEffect] = useState<string | null>(null);
  
  const panelRef = useRef<HTMLDivElement>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // ===== COMPUTED VALUES =====
  
  const categories = useMemo(() => {
    const cats = Array.from(new Set(EFFECT_DEFINITIONS.map(e => e.category)));
    return cats.sort();
  }, []);
  
  const filteredEffects = useMemo(() => {
    return EFFECT_DEFINITIONS.filter(effect => {
      const matchesCategory = effect.category === selectedCategory;
      const matchesSearch = searchTerm === '' || 
        effect.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        effect.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm]);
  
  const appliedEffectsByType = useMemo(() => {
    return appliedEffects.reduce((acc, effect) => {
      acc[effect.type] = effect;
      return acc;
    }, {} as Record<EffectType, BaseEffect>);
  }, [appliedEffects]);
  
  // ===== EFFECT HANDLERS =====
  
  const handleEffectClick = useCallback((effectDef: EffectDefinition) => {
    if (!selectedTrackId) return;
    
    const existingEffect = appliedEffectsByType[effectDef.type];
    
    if (existingEffect) {
      // Toggle effect
      onEffectRemove?.(existingEffect.id);
    } else {
      // Apply new effect
      const newEffect: BaseEffect = {
        id: `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: effectDef.name,
        type: effectDef.type,
        category: effectDef.category,
        enabled: true,
        opacity: 1,
        blendMode: 'normal',
        startTime: 0,
        endTime: 999999, // Will be set by timeline
        parameters: { ...effectDef.parameters },
        keyframes: [],
        version: '4.0.0'
      };
      
      onEffectApply?.(newEffect, selectedTrackId);
    }
  }, [selectedTrackId, appliedEffectsByType, onEffectApply, onEffectRemove]);
  
  const handleParameterChange = useCallback((effectId: string, paramName: string, value: any) => {
    const effect = appliedEffects.find(e => e.id === effectId);
    if (!effect) return;
    
    const updatedParameters = {
      ...effect.parameters,
      [paramName]: {
        ...effect.parameters[paramName],
        value
      }
    };
    
    onEffectUpdate?.(effectId, { parameters: updatedParameters });
  }, [appliedEffects, onEffectUpdate]);
  
  // ===== DRAG & DROP =====
  
  const handleDragStart = useCallback((e: React.DragEvent, effectDef: EffectDefinition) => {
    setDraggedEffect(effectDef);
    e.dataTransfer.setData('application/json', JSON.stringify(effectDef));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);
  
  const handleDragEnd = useCallback(() => {
    setDraggedEffect(null);
  }, []);
  
  // ===== CLEANUP =====
  
  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, []);
  
  // ===== RENDER =====
  
  return (
    <div 
      ref={panelRef}
      className={`effects-panel bg-gray-900 border-l border-gray-700 ${className}`}
      style={{ minWidth: '300px', maxWidth: '400px' }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-3">
          🎨 Effects & Filters
        </h2>
        
        {/* Search */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Search effects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute right-3 top-2.5 text-gray-400">
            🔍
          </div>
        </div>
        
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {CATEGORY_ICONS[category]} {CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>
      </div>
      
      {/* Effects List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          {filteredEffects.map(effectDef => {
            const isApplied = !!appliedEffectsByType[effectDef.type];
            const appliedEffect = appliedEffectsByType[effectDef.type];
            
            return (
              <div
                key={effectDef.type}
                className={`effect-item border rounded-lg transition-all duration-200 ${
                  isApplied 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
                } ${draggedEffect?.type === effectDef.type ? 'opacity-50' : ''}`}
              >
                {/* Effect Header */}
                <div
                  className="p-3 cursor-pointer flex items-center justify-between"
                  draggable
                  onDragStart={(e) => handleDragStart(e, effectDef)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleEffectClick(effectDef)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-xl">{effectDef.icon}</div>
                    <div>
                      <div className="font-medium text-white text-sm">{effectDef.name}</div>
                      <div className="text-xs text-gray-400">{effectDef.description}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isApplied && (
                      <div className="text-blue-400 text-sm">✓</div>
                    )}
                    {appliedEffect && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedEffect(
                            expandedEffect === appliedEffect.id ? null : appliedEffect.id
                          );
                        }}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {expandedEffect === appliedEffect.id ? '🔽' : '▶️'}
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Effect Parameters */}
                {appliedEffect && expandedEffect === appliedEffect.id && (
                  <div className="border-t border-gray-600 p-3 space-y-3">
                    {Object.entries(appliedEffect.parameters).map(([paramName, param]) => (
                      <div key={paramName} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium text-gray-300">
                            {param.name}
                          </label>
                          <span className="text-xs text-gray-400">
                            {param.value}{param.unit}
                          </span>
                        </div>
                        
                        {param.type === 'range' && (
                          <input
                            type="range"
                            min={param.min}
                            max={param.max}
                            step={param.step}
                            value={param.value as number}
                            onChange={(e) => handleParameterChange(
                              appliedEffect.id, 
                              paramName, 
                              parseFloat(e.target.value)
                            )}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                          />
                        )}
                        
                        {param.type === 'boolean' && (
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={param.value as boolean}
                              onChange={(e) => handleParameterChange(
                                appliedEffect.id, 
                                paramName, 
                                e.target.checked
                              )}
                              className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-300">{param.description}</span>
                          </label>
                        )}
                        
                        {param.type === 'color' && (
                          <input
                            type="color"
                            value={param.value as string}
                            onChange={(e) => handleParameterChange(
                              appliedEffect.id, 
                              paramName, 
                              e.target.value
                            )}
                            className="w-full h-8 rounded border border-gray-600 bg-gray-800"
                          />
                        )}
                      </div>
                    ))}
                    
                    {/* Effect Controls */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-600">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-300">Opacity:</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={appliedEffect.opacity}
                          onChange={(e) => onEffectUpdate?.(appliedEffect.id, {
                            opacity: parseFloat(e.target.value)
                          })}
                          className="w-16 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-xs text-gray-400 w-8">
                          {Math.round(appliedEffect.opacity * 100)}%
                        </span>
                      </div>
                      
                      <button
                        onClick={() => onEffectRemove?.(appliedEffect.id)}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-400 text-center">
          {appliedEffects.length} effects applied
          {selectedTrackId && (
            <div className="mt-1">
              Track: {selectedTrackId}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EffectsPanel; 