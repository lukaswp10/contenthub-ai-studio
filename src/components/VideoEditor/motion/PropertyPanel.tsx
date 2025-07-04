/**
 * 🎛️ PROPERTY PANEL - ClipsForge Pro
 * Painel de propriedades para layers de motion graphics
 */

import React, { useState, useCallback } from 'react';
import { Button } from '../../ui/button';
import { AnimationLayer, Transform, Vector2D } from '../../../types/motion.types';
import { RotateCcw, Eye, EyeOff, Lock, Unlock } from 'lucide-react';

interface PropertyPanelProps {
  selectedLayer: AnimationLayer | null;
  onLayerUpdate: (layerId: string, updates: Partial<AnimationLayer>) => void;
  onTransformUpdate: (layerId: string, transform: Partial<Transform>) => void;
  className?: string;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedLayer,
  onLayerUpdate,
  onTransformUpdate,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['transform', 'opacity']));

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  const handleTransformChange = useCallback((property: keyof Transform, value: any) => {
    if (!selectedLayer) return;
    
    const newTransform = { ...selectedLayer.transform };
    newTransform[property] = value;
    onTransformUpdate(selectedLayer.id, newTransform);
  }, [selectedLayer, onTransformUpdate]);

  const handleLayerPropertyChange = useCallback((property: keyof AnimationLayer, value: any) => {
    if (!selectedLayer) return;
    onLayerUpdate(selectedLayer.id, { [property]: value });
  }, [selectedLayer, onLayerUpdate]);

  const resetTransform = useCallback(() => {
    if (!selectedLayer) return;
    
    const defaultTransform: Transform = {
      position: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      rotation: { x: 0, y: 0, z: 0 },
      anchor: { x: 0.5, y: 0.5, z: 0 },
      opacity: 1,
      skew: { x: 0, y: 0 },
      skewAxis: 0
    };
    
    onTransformUpdate(selectedLayer.id, defaultTransform);
  }, [selectedLayer, onTransformUpdate]);

  if (!selectedLayer) {
    return (
      <div className={`property-panel ${className}`} style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '4px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#666',
          fontSize: '14px'
        }}>
          Select a layer to edit properties
        </div>
      </div>
    );
  }

  return (
    <div className={`property-panel ${className}`} style={{
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
          🎛️ {selectedLayer.name}
        </h3>
        
        <div style={{ display: 'flex', gap: '4px' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleLayerPropertyChange('visible', !selectedLayer.visible)}
            style={{
              padding: '4px',
              color: selectedLayer.visible ? '#10b981' : '#666'
            }}
          >
            {selectedLayer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleLayerPropertyChange('locked', !selectedLayer.locked)}
            style={{
              padding: '4px',
              color: selectedLayer.locked ? '#ef4444' : '#666'
            }}
          >
            {selectedLayer.locked ? <Lock size={12} /> : <Unlock size={12} />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={resetTransform}
            style={{ padding: '4px', color: '#f59e0b' }}
          >
            <RotateCcw size={12} />
          </Button>
        </div>
      </div>

      {/* Properties */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '8px'
      }}>
        
        {/* Transform Section */}
        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px',
              backgroundColor: '#2a2a2a',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '8px'
            }}
            onClick={() => toggleSection('transform')}
          >
            <span style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#fff',
              flex: 1
            }}>
              Transform
            </span>
            <span style={{
              fontSize: '10px',
              color: '#666',
              transform: expandedSections.has('transform') ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }}>
              ▶
            </span>
          </div>
          
          {expandedSections.has('transform') && (
            <div style={{
              padding: '8px',
              backgroundColor: '#0f0f0f',
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {/* Position */}
              <div>
                <label style={{ fontSize: '10px', color: '#ccc', marginBottom: '4px', display: 'block' }}>
                  Position
                </label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input
                    type="number"
                    value={selectedLayer.transform.position.x}
                    onChange={(e) => handleTransformChange('position', {
                      ...selectedLayer.transform.position,
                      x: parseFloat(e.target.value)
                    })}
                    style={{
                      flex: 1,
                      padding: '4px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '2px',
                      color: '#fff',
                      fontSize: '10px'
                    }}
                  />
                  <input
                    type="number"
                    value={selectedLayer.transform.position.y}
                    onChange={(e) => handleTransformChange('position', {
                      ...selectedLayer.transform.position,
                      y: parseFloat(e.target.value)
                    })}
                    style={{
                      flex: 1,
                      padding: '4px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '2px',
                      color: '#fff',
                      fontSize: '10px'
                    }}
                  />
                </div>
              </div>

              {/* Scale */}
              <div>
                <label style={{ fontSize: '10px', color: '#ccc', marginBottom: '4px', display: 'block' }}>
                  Scale
                </label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input
                    type="number"
                    step="0.1"
                    value={selectedLayer.transform.scale.x}
                    onChange={(e) => handleTransformChange('scale', {
                      ...selectedLayer.transform.scale,
                      x: parseFloat(e.target.value)
                    })}
                    style={{
                      flex: 1,
                      padding: '4px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '2px',
                      color: '#fff',
                      fontSize: '10px'
                    }}
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={selectedLayer.transform.scale.y}
                    onChange={(e) => handleTransformChange('scale', {
                      ...selectedLayer.transform.scale,
                      y: parseFloat(e.target.value)
                    })}
                    style={{
                      flex: 1,
                      padding: '4px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '2px',
                      color: '#fff',
                      fontSize: '10px'
                    }}
                  />
                </div>
              </div>

              {/* Rotation */}
              <div>
                <label style={{ fontSize: '10px', color: '#ccc', marginBottom: '4px', display: 'block' }}>
                  Rotation
                </label>
                                   <input
                     type="number"
                     value={selectedLayer.transform.rotation.z}
                     onChange={(e) => handleTransformChange('rotation', {
                       ...selectedLayer.transform.rotation,
                       z: parseFloat(e.target.value)
                     })}
                     style={{
                       width: '100%',
                       padding: '4px',
                       backgroundColor: '#1a1a1a',
                       border: '1px solid #333',
                       borderRadius: '2px',
                       color: '#fff',
                       fontSize: '10px'
                     }}
                   />
              </div>

              {/* Opacity */}
              <div>
                <label style={{ fontSize: '10px', color: '#ccc', marginBottom: '4px', display: 'block' }}>
                  Opacity
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={selectedLayer.transform.opacity}
                  onChange={(e) => handleTransformChange('opacity', parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    height: '4px',
                    backgroundColor: '#333',
                    outline: 'none',
                    borderRadius: '2px'
                  }}
                />
                <div style={{
                  fontSize: '10px',
                  color: '#999',
                  textAlign: 'center',
                  marginTop: '2px'
                }}>
                  {Math.round(selectedLayer.transform.opacity * 100)}%
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Layer Info */}
        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px',
              backgroundColor: '#2a2a2a',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '8px'
            }}
            onClick={() => toggleSection('info')}
          >
            <span style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#fff',
              flex: 1
            }}>
              Layer Info
            </span>
            <span style={{
              fontSize: '10px',
              color: '#666',
              transform: expandedSections.has('info') ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }}>
              ▶
            </span>
          </div>
          
          {expandedSections.has('info') && (
            <div style={{
              padding: '8px',
              backgroundColor: '#0f0f0f',
              borderRadius: '4px',
              fontSize: '10px',
              color: '#ccc'
            }}>
              <div><strong>Type:</strong> {selectedLayer.type}</div>
              <div><strong>Duration:</strong> {selectedLayer.duration.toFixed(2)}s</div>
              <div><strong>Start Time:</strong> {selectedLayer.startTime.toFixed(2)}s</div>
              <div><strong>End Time:</strong> {(selectedLayer.startTime + selectedLayer.duration).toFixed(2)}s</div>
              <div><strong>Visible:</strong> {selectedLayer.visible ? 'Yes' : 'No'}</div>
              <div><strong>Locked:</strong> {selectedLayer.locked ? 'Yes' : 'No'}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyPanel;
