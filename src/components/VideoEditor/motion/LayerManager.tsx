/**
 * 🎬 LAYER MANAGER - ClipsForge Pro
 * Gerenciador avançado de layers com drag & drop
 */

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '../../ui/button';
import { AnimationLayer, LayerType, BlendMode } from '../../../types/motion.types';
import { 
  Eye, EyeOff, Lock, Unlock, Copy, Trash2, 
  Plus, ChevronDown, ChevronRight, Move,
  Image, Type, Square, Circle, Star
} from 'lucide-react';

interface LayerManagerProps {
  layers: AnimationLayer[];
  selectedLayerId?: string;
  onLayerSelect: (layerId: string) => void;
  onLayerAdd: (type: LayerType) => void;
  onLayerDelete: (layerId: string) => void;
  onLayerDuplicate: (layerId: string) => void;
  onLayerReorder: (layerId: string, newIndex: number) => void;
  onLayerUpdate: (layerId: string, updates: Partial<AnimationLayer>) => void;
  className?: string;
}

const LAYER_ICONS: Record<LayerType, React.ReactNode> = {
  text: <Type size={12} />,
  image: <Image size={12} />,
  shape: <Square size={12} />,
  video: <Image size={12} />,
  audio: <Square size={12} />,
  solid: <Square size={12} />,
  null: <Circle size={12} />,
  light: <Star size={12} />,
  camera: <Image size={12} />,
  adjustment: <Square size={12} />,
  particle: <Star size={12} />,
  precomp: <Square size={12} />
};

const LAYER_TYPES: { value: LayerType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'image', label: 'Image' },
  { value: 'shape', label: 'Shape' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'solid', label: 'Solid' },
  { value: 'null', label: 'Null' },
  { value: 'light', label: 'Light' },
  { value: 'camera', label: 'Camera' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'particle', label: 'Particle' },
  { value: 'precomp', label: 'Precomp' }
];

const BLEND_MODES: { value: BlendMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'soft-light', label: 'Soft Light' },
  { value: 'hard-light', label: 'Hard Light' },
  { value: 'color-dodge', label: 'Color Dodge' },
  { value: 'color-burn', label: 'Color Burn' },
  { value: 'darken', label: 'Darken' },
  { value: 'lighten', label: 'Lighten' },
  { value: 'difference', label: 'Difference' },
  { value: 'exclusion', label: 'Exclusion' }
];

export const LayerManager: React.FC<LayerManagerProps> = ({
  layers,
  selectedLayerId,
  onLayerSelect,
  onLayerAdd,
  onLayerDelete,
  onLayerDuplicate,
  onLayerReorder,
  onLayerUpdate,
  className = ''
}) => {
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());
  const dragCounterRef = useRef(0);

  const handleDragStart = useCallback((e: React.DragEvent, layerId: string) => {
    setDraggedLayer(layerId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', layerId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setDragOverIndex(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const draggedLayerId = e.dataTransfer.getData('text/plain');
    
    if (draggedLayerId && draggedLayerId !== draggedLayer) return;
    
    if (draggedLayer) {
      onLayerReorder(draggedLayer, dropIndex);
    }
    
    setDraggedLayer(null);
    setDragOverIndex(null);
    dragCounterRef.current = 0;
  }, [draggedLayer, onLayerReorder]);

  const handleDragEnd = useCallback(() => {
    setDraggedLayer(null);
    setDragOverIndex(null);
    dragCounterRef.current = 0;
  }, []);

  const toggleLayerExpanded = useCallback((layerId: string) => {
    setExpandedLayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(layerId)) {
        newSet.delete(layerId);
      } else {
        newSet.add(layerId);
      }
      return newSet;
    });
  }, []);

  const handleLayerToggle = useCallback((layerId: string, property: 'visible' | 'locked') => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      onLayerUpdate(layerId, { [property]: !layer[property] });
    }
  }, [layers, onLayerUpdate]);

  const handleOpacityChange = useCallback((layerId: string, opacity: number) => {
    onLayerUpdate(layerId, { opacity });
  }, [onLayerUpdate]);

  const handleBlendModeChange = useCallback((layerId: string, blendMode: BlendMode) => {
    onLayerUpdate(layerId, { blendMode });
  }, [onLayerUpdate]);

  return (
    <div className={`layer-manager ${className}`} style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#1a1a1a',
      border: '1px solid #333',
      borderRadius: '4px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
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
          🎬 Layers ({layers.length})
        </h3>
        
        <div style={{ position: 'relative' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddMenu(!showAddMenu)}
            style={{
              padding: '4px 8px',
              height: '24px',
              fontSize: '11px',
              color: '#3b82f6'
            }}
          >
            <Plus size={12} />
            Add
          </Button>
          
          {showAddMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              backgroundColor: '#2a2a2a',
              border: '1px solid #333',
              borderRadius: '4px',
              padding: '4px',
              zIndex: 1000,
              minWidth: '120px'
            }}>
              {LAYER_TYPES.map(type => (
                <Button
                  key={type.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onLayerAdd(type.value);
                    setShowAddMenu(false);
                  }}
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    padding: '4px 8px',
                    height: '24px',
                    fontSize: '11px',
                    color: '#fff'
                  }}
                >
                  {LAYER_ICONS[type.value]}
                  <span style={{ marginLeft: '8px' }}>{type.label}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Layers List */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '8px'
      }}>
        {layers.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#666',
            fontSize: '12px',
            padding: '40px 20px'
          }}>
            No layers yet. Click "Add" to create your first layer.
          </div>
        ) : (
          layers.map((layer, index) => {
            const isSelected = layer.id === selectedLayerId;
            const isDragging = layer.id === draggedLayer;
            const isExpanded = expandedLayers.has(layer.id);
            const showDropIndicator = dragOverIndex === index;
            
            return (
              <div key={layer.id} style={{ marginBottom: '2px' }}>
                {/* Drop indicator */}
                {showDropIndicator && (
                  <div style={{
                    height: '2px',
                    backgroundColor: '#3b82f6',
                    marginBottom: '2px',
                    borderRadius: '1px'
                  }} />
                )}
                
                {/* Layer Item */}
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, layer.id)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onLayerSelect(layer.id)}
                  style={{
                    backgroundColor: isSelected ? '#3b82f6' : '#2a2a2a',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    padding: '8px',
                    cursor: 'pointer',
                    opacity: isDragging ? 0.5 : 1,
                    transition: 'all 0.2s',
                    userSelect: 'none'
                  }}
                >
                  {/* Main Layer Row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {/* Expand/Collapse */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLayerExpanded(layer.id);
                      }}
                      style={{
                        padding: '0',
                        width: '16px',
                        height: '16px',
                        color: '#666'
                      }}
                    >
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </Button>
                    
                    {/* Drag Handle */}
                    <Move size={12} color="#666" />
                    
                    {/* Layer Icon */}
                    <div style={{ color: '#666' }}>
                      {LAYER_ICONS[layer.type]}
                    </div>
                    
                    {/* Layer Name */}
                    <span style={{
                      flex: 1,
                      fontSize: '12px',
                      color: isSelected ? '#fff' : '#ccc',
                      fontWeight: isSelected ? 'bold' : 'normal'
                    }}>
                      {layer.name}
                    </span>
                    
                    {/* Controls */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {/* Visibility */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLayerToggle(layer.id, 'visible');
                        }}
                        style={{
                          padding: '0',
                          width: '16px',
                          height: '16px',
                          color: layer.visible ? '#3b82f6' : '#666'
                        }}
                      >
                        {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                      </Button>
                      
                      {/* Lock */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLayerToggle(layer.id, 'locked');
                        }}
                        style={{
                          padding: '0',
                          width: '16px',
                          height: '16px',
                          color: layer.locked ? '#ef4444' : '#666'
                        }}
                      >
                        {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
                      </Button>
                      
                      {/* Duplicate */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayerDuplicate(layer.id);
                        }}
                        style={{
                          padding: '0',
                          width: '16px',
                          height: '16px',
                          color: '#666'
                        }}
                      >
                        <Copy size={12} />
                      </Button>
                      
                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayerDelete(layer.id);
                        }}
                        style={{
                          padding: '0',
                          width: '16px',
                          height: '16px',
                          color: '#ef4444'
                        }}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Expanded Properties */}
                  {isExpanded && (
                    <div style={{
                      marginTop: '8px',
                      paddingTop: '8px',
                      borderTop: '1px solid #333',
                      fontSize: '11px'
                    }}>
                      {/* Opacity */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '6px'
                      }}>
                        <span style={{ color: '#999', minWidth: '50px' }}>Opacity:</span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={layer.opacity}
                          onChange={(e) => handleOpacityChange(layer.id, parseFloat(e.target.value))}
                          style={{
                            flex: 1,
                            height: '4px',
                            backgroundColor: '#333',
                            borderRadius: '2px',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        />
                        <span style={{ color: '#fff', minWidth: '35px' }}>
                          {Math.round(layer.opacity * 100)}%
                        </span>
                      </div>
                      
                      {/* Blend Mode */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ color: '#999', minWidth: '50px' }}>Blend:</span>
                        <select
                          value={layer.blendMode}
                          onChange={(e) => handleBlendModeChange(layer.id, e.target.value as BlendMode)}
                          style={{
                            flex: 1,
                            padding: '2px 4px',
                            backgroundColor: '#333',
                            border: '1px solid #444',
                            borderRadius: '2px',
                            color: '#fff',
                            fontSize: '10px'
                          }}
                        >
                          {BLEND_MODES.map(mode => (
                            <option key={mode.value} value={mode.value}>
                              {mode.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LayerManager;
