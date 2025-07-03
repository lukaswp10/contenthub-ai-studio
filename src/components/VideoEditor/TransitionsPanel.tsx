/**
 * 🔄 PAINEL DE TRANSIÇÕES PROFISSIONAL - ClipsForge Pro
 * 
 * Interface avançada para transições entre clips
 * 3D, 2D e efeitos criativos com preview em tempo real
 * 
 * @version 4.0.0 - FASE 4
 * @author ClipsForge Team
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { 
  Transition, 
  TransitionType, 
  TransitionCategory, 
  TransitionParameters,
  TransitionPreset,
  EasingFunction
} from '../../types/effects.types';

// ===== INTERFACES =====

interface TransitionsPanelProps {
  className?: string;
  onTransitionApply?: (transition: Transition, fromTrackId: string, toTrackId: string) => void;
  onTransitionRemove?: (transitionId: string) => void;
  onTransitionUpdate?: (transitionId: string, parameters: Partial<Transition>) => void;
  appliedTransitions?: Transition[];
  previewMode?: boolean;
}

interface TransitionDefinition {
  type: TransitionType;
  name: string;
  category: TransitionCategory;
  description: string;
  icon: string;
  defaultDuration: number;
  parameters: TransitionParameters;
  presets?: TransitionPreset[];
  thumbnail?: string;
}

// ===== TRANSITION DEFINITIONS =====

const TRANSITION_DEFINITIONS: TransitionDefinition[] = [
  // Basic Transitions
  {
    type: 'fade',
    name: 'Fade',
    category: 'basic',
    description: 'Simple fade in/out transition',
    icon: '🌅',
    defaultDuration: 1.0,
    parameters: {
      softness: 0.5
    }
  },
  {
    type: 'dissolve',
    name: 'Dissolve',
    category: 'basic',
    description: 'Smooth dissolve between clips',
    icon: '💧',
    defaultDuration: 1.5,
    parameters: {
      softness: 0.7
    }
  },
  {
    type: 'cut',
    name: 'Cut',
    category: 'basic',
    description: 'Instant cut (no transition)',
    icon: '✂️',
    defaultDuration: 0.0,
    parameters: {}
  },
  {
    type: 'dip',
    name: 'Dip to Black',
    category: 'basic',
    description: 'Fade to black then fade in',
    icon: '⚫',
    defaultDuration: 2.0,
    parameters: {
      color: '#000000'
    }
  },
  
  // Slide Transitions
  {
    type: 'slideLeft',
    name: 'Slide Left',
    category: 'slide',
    description: 'Slide from right to left',
    icon: '⬅️',
    defaultDuration: 1.0,
    parameters: {
      direction: 'left',
      softness: 0.3
    }
  },
  {
    type: 'slideRight',
    name: 'Slide Right',
    category: 'slide',
    description: 'Slide from left to right',
    icon: '➡️',
    defaultDuration: 1.0,
    parameters: {
      direction: 'right',
      softness: 0.3
    }
  },
  {
    type: 'slideUp',
    name: 'Slide Up',
    category: 'slide',
    description: 'Slide from bottom to top',
    icon: '⬆️',
    defaultDuration: 1.0,
    parameters: {
      direction: 'up',
      softness: 0.3
    }
  },
  {
    type: 'slideDown',
    name: 'Slide Down',
    category: 'slide',
    description: 'Slide from top to bottom',
    icon: '⬇️',
    defaultDuration: 1.0,
    parameters: {
      direction: 'down',
      softness: 0.3
    }
  },
  
  // Zoom Transitions
  {
    type: 'zoomIn',
    name: 'Zoom In',
    category: 'zoom',
    description: 'Zoom into the next clip',
    icon: '🔍',
    defaultDuration: 1.2,
    parameters: {
      intensity: 0.8,
      center: [0.5, 0.5]
    }
  },
  {
    type: 'zoomOut',
    name: 'Zoom Out',
    category: 'zoom',
    description: 'Zoom out from current clip',
    icon: '🔎',
    defaultDuration: 1.2,
    parameters: {
      intensity: 0.8,
      center: [0.5, 0.5]
    }
  },
  
  // Rotate Transitions
  {
    type: 'rotateLeft',
    name: 'Rotate Left',
    category: 'rotate',
    description: 'Rotate counterclockwise',
    icon: '↺',
    defaultDuration: 1.5,
    parameters: {
      angle: -90
    }
  },
  {
    type: 'rotateRight',
    name: 'Rotate Right',
    category: 'rotate',
    description: 'Rotate clockwise',
    icon: '↻',
    defaultDuration: 1.5,
    parameters: {
      angle: 90
    }
  },
  {
    type: 'spin',
    name: 'Spin',
    category: 'rotate',
    description: 'Full 360° rotation',
    icon: '🌀',
    defaultDuration: 2.0,
    parameters: {
      angle: 360
    }
  },
  
  // Wipe Transitions
  {
    type: 'wipeLeft',
    name: 'Wipe Left',
    category: 'wipe',
    description: 'Wipe from right to left',
    icon: '🧽',
    defaultDuration: 1.0,
    parameters: {
      direction: 'left',
      softness: 0.1
    }
  },
  {
    type: 'wipeCircle',
    name: 'Circle Wipe',
    category: 'wipe',
    description: 'Circular wipe transition',
    icon: '⭕',
    defaultDuration: 1.2,
    parameters: {
      center: [0.5, 0.5],
      softness: 0.2
    }
  },
  
  // 3D Transitions
  {
    type: 'cube',
    name: 'Cube',
    category: '3d',
    description: '3D cube rotation',
    icon: '🎲',
    defaultDuration: 1.5,
    parameters: {
      direction: 'left'
    }
  },
  {
    type: 'flip3D',
    name: '3D Flip',
    category: '3d',
    description: '3D flip transition',
    icon: '🔄',
    defaultDuration: 1.3,
    parameters: {
      direction: 'left'
    }
  },
  {
    type: 'pageTurn',
    name: 'Page Turn',
    category: '3d',
    description: 'Page turning effect',
    icon: '📄',
    defaultDuration: 1.8,
    parameters: {
      direction: 'right'
    }
  },
  
  // Creative Transitions
  {
    type: 'glitch',
    name: 'Glitch',
    category: 'creative',
    description: 'Digital glitch effect',
    icon: '📺',
    defaultDuration: 0.8,
    parameters: {
      intensity: 0.7
    }
  },
  {
    type: 'pixelate',
    name: 'Pixelate',
    category: 'creative',
    description: 'Pixel dissolve effect',
    icon: '🟫',
    defaultDuration: 1.0,
    parameters: {
      intensity: 0.8
    }
  },
  {
    type: 'liquid',
    name: 'Liquid',
    category: 'creative',
    description: 'Liquid morphing effect',
    icon: '🌊',
    defaultDuration: 2.0,
    parameters: {
      intensity: 0.6
    }
  }
];

const CATEGORY_LABELS: Record<TransitionCategory, string> = {
  basic: 'Basic',
  slide: 'Slide',
  zoom: 'Zoom',
  rotate: 'Rotate',
  wipe: 'Wipe',
  '3d': '3D',
  creative: 'Creative'
};

const CATEGORY_ICONS: Record<TransitionCategory, string> = {
  basic: '⚡',
  slide: '📱',
  zoom: '🔍',
  rotate: '🌀',
  wipe: '🧽',
  '3d': '🎲',
  creative: '✨'
};

const EASING_OPTIONS: { value: EasingFunction; label: string }[] = [
  { value: 'linear', label: 'Linear' },
  { value: 'easeIn', label: 'Ease In' },
  { value: 'easeOut', label: 'Ease Out' },
  { value: 'easeInOut', label: 'Ease In/Out' },
  { value: 'easeInBack', label: 'Back In' },
  { value: 'easeOutBack', label: 'Back Out' },
  { value: 'easeInBounce', label: 'Bounce In' },
  { value: 'easeOutBounce', label: 'Bounce Out' }
];

// ===== MAIN COMPONENT =====

const TransitionsPanel: React.FC<TransitionsPanelProps> = ({
  className = '',
  onTransitionApply,
  onTransitionRemove,
  onTransitionUpdate,
  appliedTransitions = [],
  previewMode = false
}) => {
  // ===== STATE =====
  
  const [selectedCategory, setSelectedCategory] = useState<TransitionCategory>('basic');
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedTransition, setDraggedTransition] = useState<TransitionDefinition | null>(null);
  const [expandedTransition, setExpandedTransition] = useState<string | null>(null);
  const [selectedTracks, setSelectedTracks] = useState<{ from: string; to: string } | null>(null);
  
  const panelRef = useRef<HTMLDivElement>(null);
  
  // ===== COMPUTED VALUES =====
  
  const categories = useMemo(() => {
    const cats = Array.from(new Set(TRANSITION_DEFINITIONS.map(t => t.category)));
    return cats.sort();
  }, []);
  
  const filteredTransitions = useMemo(() => {
    return TRANSITION_DEFINITIONS.filter(transition => {
      const matchesCategory = transition.category === selectedCategory;
      const matchesSearch = searchTerm === '' || 
        transition.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transition.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm]);
  
  const appliedTransitionsByType = useMemo(() => {
    return appliedTransitions.reduce((acc, transition) => {
      acc[transition.type] = transition;
      return acc;
    }, {} as Record<TransitionType, Transition>);
  }, [appliedTransitions]);
  
  // ===== TRANSITION HANDLERS =====
  
  const handleTransitionClick = useCallback((transitionDef: TransitionDefinition) => {
    if (!selectedTracks) {
      // Show track selection UI or use default
      console.log('Please select tracks for transition');
      return;
    }
    
    const existingTransition = appliedTransitionsByType[transitionDef.type];
    
    if (existingTransition) {
      // Remove existing transition
      onTransitionRemove?.(existingTransition.id);
    } else {
      // Apply new transition
      const newTransition: Transition = {
        id: `transition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: transitionDef.name,
        type: transitionDef.type,
        category: transitionDef.category,
        duration: transitionDef.defaultDuration,
        easing: 'easeInOut',
        parameters: { ...transitionDef.parameters }
      };
      
      onTransitionApply?.(newTransition, selectedTracks.from, selectedTracks.to);
    }
  }, [selectedTracks, appliedTransitionsByType, onTransitionApply, onTransitionRemove]);
  
  const handleParameterChange = useCallback((transitionId: string, paramName: string, value: any) => {
    const transition = appliedTransitions.find(t => t.id === transitionId);
    if (!transition) return;
    
    const updatedParameters = {
      ...transition.parameters,
      [paramName]: value
    };
    
    onTransitionUpdate?.(transitionId, { parameters: updatedParameters });
  }, [appliedTransitions, onTransitionUpdate]);
  
  const handleDurationChange = useCallback((transitionId: string, duration: number) => {
    onTransitionUpdate?.(transitionId, { duration });
  }, [onTransitionUpdate]);
  
  const handleEasingChange = useCallback((transitionId: string, easing: EasingFunction) => {
    onTransitionUpdate?.(transitionId, { easing });
  }, [onTransitionUpdate]);
  
  // ===== DRAG & DROP =====
  
  const handleDragStart = useCallback((e: React.DragEvent, transitionDef: TransitionDefinition) => {
    setDraggedTransition(transitionDef);
    e.dataTransfer.setData('application/json', JSON.stringify(transitionDef));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);
  
  const handleDragEnd = useCallback(() => {
    setDraggedTransition(null);
  }, []);
  
  // ===== RENDER =====
  
  return (
    <div 
      ref={panelRef}
      className={`transitions-panel bg-gray-900 border-l border-gray-700 ${className}`}
      style={{ minWidth: '300px', maxWidth: '400px' }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-3">
          🔄 Transitions
        </h2>
        
        {/* Search */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Search transitions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute right-3 top-2.5 text-gray-400">
            🔍
          </div>
        </div>
        
        {/* Track Selection */}
        <div className="mb-3 p-2 bg-gray-800 rounded-lg">
          <div className="text-sm font-medium text-gray-300 mb-2">Apply Between:</div>
          <div className="flex items-center space-x-2 text-sm">
            <select 
              className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white"
              onChange={(e) => setSelectedTracks(prev => ({ ...prev, from: e.target.value } as any))}
            >
              <option value="">From Track</option>
              <option value="track1">Track 1</option>
              <option value="track2">Track 2</option>
              <option value="track3">Track 3</option>
            </select>
            <span className="text-gray-400">→</span>
            <select 
              className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white"
              onChange={(e) => setSelectedTracks(prev => ({ ...prev, to: e.target.value } as any))}
            >
              <option value="">To Track</option>
              <option value="track1">Track 1</option>
              <option value="track2">Track 2</option>
              <option value="track3">Track 3</option>
            </select>
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
      
      {/* Transitions List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          {filteredTransitions.map(transitionDef => {
            const isApplied = !!appliedTransitionsByType[transitionDef.type];
            const appliedTransition = appliedTransitionsByType[transitionDef.type];
            
            return (
              <div
                key={transitionDef.type}
                className={`transition-item border rounded-lg transition-all duration-200 ${
                  isApplied 
                    ? 'border-purple-500 bg-purple-500/10' 
                    : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
                } ${draggedTransition?.type === transitionDef.type ? 'opacity-50' : ''}`}
              >
                {/* Transition Header */}
                <div
                  className="p-3 cursor-pointer flex items-center justify-between"
                  draggable
                  onDragStart={(e) => handleDragStart(e, transitionDef)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleTransitionClick(transitionDef)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-xl">{transitionDef.icon}</div>
                    <div>
                      <div className="font-medium text-white text-sm">{transitionDef.name}</div>
                      <div className="text-xs text-gray-400">{transitionDef.description}</div>
                      <div className="text-xs text-purple-400">
                        {transitionDef.defaultDuration}s duration
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isApplied && (
                      <div className="text-purple-400 text-sm">✓</div>
                    )}
                    {appliedTransition && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedTransition(
                            expandedTransition === appliedTransition.id ? null : appliedTransition.id
                          );
                        }}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {expandedTransition === appliedTransition.id ? '🔽' : '▶️'}
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Transition Parameters */}
                {appliedTransition && expandedTransition === appliedTransition.id && (
                  <div className="border-t border-gray-600 p-3 space-y-3">
                    {/* Duration */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-300">Duration</label>
                        <span className="text-xs text-gray-400">{appliedTransition.duration}s</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value={appliedTransition.duration}
                        onChange={(e) => handleDurationChange(
                          appliedTransition.id, 
                          parseFloat(e.target.value)
                        )}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    
                    {/* Easing */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-300">Easing</label>
                      <select
                        value={appliedTransition.easing}
                        onChange={(e) => handleEasingChange(
                          appliedTransition.id, 
                          e.target.value as EasingFunction
                        )}
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                      >
                        {EASING_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Custom Parameters */}
                    {Object.entries(appliedTransition.parameters).map(([paramName, value]) => (
                      <div key={paramName} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium text-gray-300 capitalize">
                            {paramName}
                          </label>
                          <span className="text-xs text-gray-400">
                            {typeof value === 'number' ? value.toFixed(2) : String(value)}
                          </span>
                        </div>
                        
                        {typeof value === 'number' && (
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={value}
                            onChange={(e) => handleParameterChange(
                              appliedTransition.id, 
                              paramName, 
                              parseFloat(e.target.value)
                            )}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                          />
                        )}
                        
                        {typeof value === 'string' && paramName === 'color' && (
                          <input
                            type="color"
                            value={value}
                            onChange={(e) => handleParameterChange(
                              appliedTransition.id, 
                              paramName, 
                              e.target.value
                            )}
                            className="w-full h-8 rounded border border-gray-600 bg-gray-800"
                          />
                        )}
                      </div>
                    ))}
                    
                    {/* Remove Button */}
                    <div className="pt-2 border-t border-gray-600">
                      <button
                        onClick={() => onTransitionRemove?.(appliedTransition.id)}
                        className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                      >
                        Remove Transition
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
          {appliedTransitions.length} transitions applied
          {selectedTracks && (
            <div className="mt-1">
              {selectedTracks.from} → {selectedTracks.to}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransitionsPanel; 