/**
 * 🎬 MOTION GRAPHICS PANEL - ClipsForge Pro
 * Painel principal de motion graphics integrando todos os componentes
 */

import React, { useState, useCallback } from 'react';
import { Button } from '../../ui/button';
import KeyframeEditor from '../motion/KeyframeEditor';
import PropertyPanel from '../motion/PropertyPanel';
import { motionEngine } from '../../../utils/motionEngine';
import { AnimationLayer, Keyframe, Transform } from '../../../types/motion.types';
import { Play, Pause, Square, Plus, Layers, Settings } from 'lucide-react';

interface MotionGraphicsPanelProps {
  layers: AnimationLayer[];
  selectedLayerId: string | null;
  currentTime: number;
  duration: number;
  onLayerAdd: () => void;
  onLayerRemove: (layerId: string) => void;
  onLayerSelect: (layerId: string | null) => void;
  onLayerUpdate: (layerId: string, updates: Partial<AnimationLayer>) => void;
  onKeyframeAdd: (layerId: string, time: number) => void;
  onKeyframeRemove: (layerId: string, keyframeId: string) => void;
  onKeyframeUpdate: (layerId: string, keyframeId: string, updates: Partial<Keyframe>) => void;
  onTimeChange: (time: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  isPlaying: boolean;
  className?: string;
}

export const MotionGraphicsPanel: React.FC<MotionGraphicsPanelProps> = ({
  layers,
  selectedLayerId,
  currentTime,
  duration,
  onLayerAdd,
  onLayerRemove,
  onLayerSelect,
  onLayerUpdate,
  onKeyframeAdd,
  onKeyframeRemove,
  onKeyframeUpdate,
  onTimeChange,
  onPlay,
  onPause,
  onStop,
  isPlaying,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'layers' | 'properties' | 'keyframes'>('layers');
  const [showPreview, setShowPreview] = useState(true);

  const selectedLayer = selectedLayerId ? layers.find(l => l.id === selectedLayerId) || null : null;
  const selectedKeyframes = selectedLayer ? selectedLayer.keyframes : [];

  const handleTransformUpdate = useCallback((layerId: string, transform: Partial<Transform>) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      const newTransform = { ...layer.transform, ...transform };
      onLayerUpdate(layerId, { transform: newTransform });
      
      // Update motion engine
      motionEngine.updateLayer(layerId, { transform: newTransform });
    }
  }, [layers, onLayerUpdate]);

  const handleLayerClick = useCallback((layerId: string) => {
    onLayerSelect(layerId === selectedLayerId ? null : layerId);
  }, [selectedLayerId, onLayerSelect]);

  const handleKeyframeAdd = useCallback((time: number) => {
    if (selectedLayerId) {
      onKeyframeAdd(selectedLayerId, time);
    }
  }, [selectedLayerId, onKeyframeAdd]);

  const handleKeyframeRemove = useCallback((keyframeId: string) => {
    if (selectedLayerId) {
      onKeyframeRemove(selectedLayerId, keyframeId);
    }
  }, [selectedLayerId, onKeyframeRemove]);

  const handleKeyframeUpdate = useCallback((keyframeId: string, updates: Partial<Keyframe>) => {
    if (selectedLayerId) {
      onKeyframeUpdate(selectedLayerId, keyframeId, updates);
    }
  }, [selectedLayerId, onKeyframeUpdate]);

  return (
    <div className={`motion-graphics-panel ${className}`} style={{
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
          🎬 Motion Graphics
        </h3>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            style={{
              color: showPreview ? '#10b981' : '#666'
            }}
          >
            👁️
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onLayerAdd}
            style={{ color: '#10b981' }}
          >
            <Plus size={16} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={isPlaying ? onPause : onPlay}
            style={{ color: '#3b82f6' }}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onStop}
            style={{ color: '#ef4444' }}
          >
            <Square size={16} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #333'
      }}>
        {[
          { id: 'layers', label: 'Layers', icon: Layers },
          { id: 'properties', label: 'Properties', icon: Settings },
          { id: 'keyframes', label: 'Keyframes', icon: '⏱️' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: activeTab === tab.id ? '#2a2a2a' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === tab.id ? '#fff' : '#666',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.2s'
            }}
          >
            {typeof tab.icon === 'string' ? tab.icon : <tab.icon size={12} />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Layers Tab */}
        {activeTab === 'layers' && (
          <div style={{
            flex: 1,
            padding: '12px',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              {layers.map((layer, index) => (
                <div
                  key={layer.id}
                  onClick={() => handleLayerClick(layer.id)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: selectedLayerId === layer.id ? '#3b82f6' : '#2a2a2a',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: layer.visible ? '#10b981' : '#666',
                      borderRadius: '50%'
                    }} />
                    <span style={{
                      fontSize: '12px',
                      color: selectedLayerId === layer.id ? '#fff' : '#ccc',
                      fontWeight: selectedLayerId === layer.id ? 'bold' : 'normal'
                    }}>
                      {layer.name}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      color: '#666',
                      backgroundColor: '#1a1a1a',
                      padding: '2px 6px',
                      borderRadius: '2px'
                    }}>
                      {layer.type}
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span style={{
                      fontSize: '10px',
                      color: '#666'
                    }}>
                      {layer.duration.toFixed(1)}s
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLayerRemove(layer.id);
                      }}
                      style={{
                        padding: '2px',
                        color: '#ef4444',
                        fontSize: '12px'
                      }}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
              
              {layers.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  color: '#666',
                  fontSize: '14px',
                  padding: '20px'
                }}>
                  No layers yet. Click + to add a layer.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <PropertyPanel
            selectedLayer={selectedLayer}
            onLayerUpdate={onLayerUpdate}
            onTransformUpdate={handleTransformUpdate}
          />
        )}

        {/* Keyframes Tab */}
        {activeTab === 'keyframes' && (
          <div style={{
            flex: 1,
            padding: '12px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {selectedLayer ? (
              <KeyframeEditor
                keyframes={selectedKeyframes}
                currentTime={currentTime}
                duration={duration}
                onKeyframeAdd={handleKeyframeAdd}
                onKeyframeRemove={handleKeyframeRemove}
                onKeyframeUpdate={handleKeyframeUpdate}
                onTimeChange={onTimeChange}
              />
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                fontSize: '14px'
              }}>
                Select a layer to edit keyframes
              </div>
            )}
          </div>
        )}
      </div>

      {/* Timeline Info */}
      <div style={{
        padding: '8px 12px',
        borderTop: '1px solid #333',
        backgroundColor: '#0f0f0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '10px',
        color: '#666'
      }}>
        <div>
          Time: {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
        </div>
        <div>
          Layers: {layers.length} | Selected: {selectedLayer ? selectedLayer.name : 'None'}
        </div>
      </div>
    </div>
  );
};

export default MotionGraphicsPanel;
