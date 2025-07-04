/**
 * 📝 SUBTITLE EDITOR - ClipsForge Pro
 * 
 * Editor de legendas interativo com drag-and-drop, resize e edição inline
 * Implementa Interact.js para manipulação avançada
 * 
 * @version 4.1.0 - FASE 4
 * @author ClipsForge Team
 */

import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import interact from 'interactjs';
import { Subtitle, SubtitleStyle, WordTimestamp } from '../../types/video-editor';
import { useVideoEditorStore } from '../../stores/videoEditorStore';

// ===== TYPES =====

interface SubtitleEditorProps {
  width: number;
  height: number;
  subtitles: Subtitle[];
  currentTime: number;
  onSubtitleUpdate?: (subtitle: Subtitle) => void;
  onSubtitleSelect?: (subtitle: Subtitle | null) => void;
  onSubtitleDelete?: (subtitleId: string) => void;
  enableEditing?: boolean;
  showTimestamps?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface SubtitleEditorRef {
  getContainer: () => HTMLDivElement | null;
  selectSubtitle: (id: string) => void;
  clearSelection: () => void;
  startInlineEdit: (id: string) => void;
  finishInlineEdit: () => void;
}

interface DragState {
  subtitleId: string;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
}

interface ResizeState {
  subtitleId: string;
  initialWidth: number;
  initialHeight: number;
}

// ===== COMPONENT =====

const SubtitleEditor = forwardRef<SubtitleEditorRef, SubtitleEditorProps>(({
  width,
  height,
  subtitles,
  currentTime,
  onSubtitleUpdate,
  onSubtitleSelect,
  onSubtitleDelete,
  enableEditing = true,
  showTimestamps = false,
  className = '',
  style = {}
}, ref) => {
  
  // ===== REFS =====
  
  const containerRef = useRef<HTMLDivElement>(null);
  const subtitleRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  // ===== STATE =====
  
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null);
  const [editingSubtitle, setEditingSubtitle] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [hoveredSubtitle, setHoveredSubtitle] = useState<string | null>(null);
  
  // ===== STORE =====
  
  const { updateSubtitle } = useVideoEditorStore();
  
  // ===== HELPERS =====
  
  const isSubtitleVisible = useCallback((subtitle: Subtitle): boolean => {
    return currentTime >= subtitle.startTime && currentTime <= subtitle.endTime;
  }, [currentTime]);
  
  const getSubtitleStyle = useCallback((subtitle: Subtitle): React.CSSProperties => {
    const style = subtitle.style;
    
    return {
      position: 'absolute',
      left: `${subtitle.x}px`,
      top: `${subtitle.y}px`,
      fontFamily: style.fontFamily,
      fontSize: `${style.fontSize}px`,
      fontWeight: style.fontWeight,
      fontStyle: style.fontStyle,
      color: style.color,
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      borderWidth: style.borderWidth ? `${style.borderWidth}px` : '0',
      borderStyle: 'solid',
      borderRadius: style.borderRadius ? `${style.borderRadius}px` : '0',
      padding: `${style.padding.top}px ${style.padding.right}px ${style.padding.bottom}px ${style.padding.left}px`,
      textAlign: style.alignment,
      opacity: style.opacity || 1,
      letterSpacing: style.letterSpacing ? `${style.letterSpacing}px` : 'normal',
      lineHeight: style.lineHeight || 'normal',
      textTransform: style.textTransform || 'none',
      textDecoration: style.textDecoration || 'none',
      textShadow: style.shadow ? 
        `${style.shadow.offsetX}px ${style.shadow.offsetY}px ${style.shadow.blur}px ${style.shadow.color}` : 
        'none',
      outline: style.outline ? 
        `${style.outline.width}px solid ${style.outline.color}` : 
        'none',
      cursor: enableEditing ? 'move' : 'default',
      userSelect: 'none',
      minWidth: '50px',
      minHeight: '20px',
      maxWidth: `${width - 20}px`,
      wordWrap: 'break-word',
      whiteSpace: 'pre-wrap',
      zIndex: 1000,
      // Animation styles
      transition: subtitle.animation ? 
        `all ${subtitle.animation.duration}s ${subtitle.animation.easing}` : 
        'none'
    };
  }, [width, enableEditing]);
  
  const getAnimationStyle = useCallback((subtitle: Subtitle): React.CSSProperties => {
    if (!subtitle.animation) return {};
    
    const { animation } = subtitle;
    const relativeTime = currentTime - subtitle.startTime;
    const progress = Math.max(0, Math.min(1, relativeTime / animation.duration));
    
    switch (animation.type) {
      case 'fade':
        return {
          opacity: progress
        };
      case 'slide':
        return {
          transform: `translateY(${(1 - progress) * 20}px)`
        };
      case 'scale':
        return {
          transform: `scale(${progress})`
        };
      case 'bounce':
        const bounceValue = Math.abs(Math.sin(progress * Math.PI * 2));
        return {
          transform: `translateY(${bounceValue * 10}px)`
        };
      default:
        return {};
    }
  }, [currentTime]);
  
  // ===== INTERACT.JS SETUP =====
  
  const setupInteractJS = useCallback((element: HTMLDivElement, subtitleId: string) => {
    if (!enableEditing) return;
    
    const interactable = interact(element);
    
    // Make element draggable
    interactable.draggable({
      inertia: true,
      modifiers: [
        interact.modifiers.restrictRect({
          restriction: 'parent',
          endOnly: true
        })
      ],
      autoScroll: true,
      listeners: {
        start(event) {
          const subtitle = subtitles.find(s => s.id === subtitleId);
          if (!subtitle) return;
          
          setDragState({
            subtitleId,
            startX: event.clientX,
            startY: event.clientY,
            initialX: subtitle.x,
            initialY: subtitle.y
          });
          
          element.style.zIndex = '1001';
          element.classList.add('dragging');
        },
        
        move(event) {
          const subtitle = subtitles.find(s => s.id === subtitleId);
          if (!subtitle || !dragState) return;
          
          const newX = Math.max(0, Math.min(width - 100, dragState.initialX + event.dx));
          const newY = Math.max(0, Math.min(height - 50, dragState.initialY + event.dy));
          
          element.style.left = `${newX}px`;
          element.style.top = `${newY}px`;
        },
        
        end(event) {
          if (!dragState) return;
          
          const subtitle = subtitles.find(s => s.id === subtitleId);
          if (!subtitle) return;
          
          const newX = Math.max(0, Math.min(width - 100, dragState.initialX + event.dx));
          const newY = Math.max(0, Math.min(height - 50, dragState.initialY + event.dy));
          
          const updatedSubtitle = {
            ...subtitle,
            x: newX,
            y: newY
          };
          
          if (onSubtitleUpdate) {
            onSubtitleUpdate(updatedSubtitle);
          }
          
          updateSubtitle(subtitleId, { x: newX, y: newY });
          
          element.style.zIndex = '1000';
          element.classList.remove('dragging');
          setDragState(null);
        }
      }
    });
    
    // Make element resizable
    interactable.resizable({
      edges: { left: true, right: true, bottom: true, top: true },
      listeners: {
        start(event) {
          const subtitle = subtitles.find(s => s.id === subtitleId);
          if (!subtitle) return;
          
          setResizeState({
            subtitleId,
            initialWidth: event.rect.width,
            initialHeight: event.rect.height
          });
          
          element.classList.add('resizing');
        },
        
        move(event) {
          const { width: newWidth, height: newHeight } = event.rect;
          
          element.style.width = `${newWidth}px`;
          element.style.height = `${newHeight}px`;
          
          // Update position if dragging from left/top edges
          element.style.left = `${event.rect.left}px`;
          element.style.top = `${event.rect.top}px`;
        },
        
        end(event) {
          if (!resizeState) return;
          
          const subtitle = subtitles.find(s => s.id === subtitleId);
          if (!subtitle) return;
          
          const { width: newWidth, height: newHeight } = event.rect;
          
          const updatedSubtitle = {
            ...subtitle,
            x: event.rect.left,
            y: event.rect.top,
            style: {
              ...subtitle.style,
              // We could store width/height in style if needed
            }
          };
          
          if (onSubtitleUpdate) {
            onSubtitleUpdate(updatedSubtitle);
          }
          
          updateSubtitle(subtitleId, {
            x: event.rect.left,
            y: event.rect.top
          });
          
          element.classList.remove('resizing');
          setResizeState(null);
        }
      },
      modifiers: [
        interact.modifiers.restrictEdges({
          outer: 'parent'
        }),
        interact.modifiers.restrictSize({
          min: { width: 50, height: 20 }
        })
      ]
    });
    
    return interactable;
  }, [
    enableEditing,
    subtitles,
    width,
    height,
    dragState,
    resizeState,
    onSubtitleUpdate,
    updateSubtitle
  ]);
  
  // ===== EVENT HANDLERS =====
  
  const handleSubtitleClick = useCallback((subtitle: Subtitle) => {
    if (!enableEditing) return;
    
    setSelectedSubtitle(subtitle.id);
    if (onSubtitleSelect) {
      onSubtitleSelect(subtitle);
    }
  }, [enableEditing, onSubtitleSelect]);
  
  const handleSubtitleDoubleClick = useCallback((subtitle: Subtitle) => {
    if (!enableEditing) return;
    
    setEditingSubtitle(subtitle.id);
    setEditingText(subtitle.text);
  }, [enableEditing]);
  
  const handleInlineEditChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditingText(e.target.value);
  }, []);
  
  const handleInlineEditKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      finishInlineEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingSubtitle(null);
      setEditingText('');
    }
  }, []);
  
  const finishInlineEdit = useCallback(() => {
    if (!editingSubtitle) return;
    
    const subtitle = subtitles.find(s => s.id === editingSubtitle);
    if (!subtitle) return;
    
    const updatedSubtitle = {
      ...subtitle,
      text: editingText
    };
    
    if (onSubtitleUpdate) {
      onSubtitleUpdate(updatedSubtitle);
    }
    
    updateSubtitle(editingSubtitle, { text: editingText });
    
    setEditingSubtitle(null);
    setEditingText('');
  }, [editingSubtitle, editingText, subtitles, onSubtitleUpdate, updateSubtitle]);
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enableEditing || !selectedSubtitle) return;
    
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (onSubtitleDelete) {
        onSubtitleDelete(selectedSubtitle);
      }
      setSelectedSubtitle(null);
    } else if (e.key === 'Enter') {
      const subtitle = subtitles.find(s => s.id === selectedSubtitle);
      if (subtitle) {
        handleSubtitleDoubleClick(subtitle);
      }
    }
  }, [enableEditing, selectedSubtitle, onSubtitleDelete, subtitles, handleSubtitleDoubleClick]);
  
  // ===== WORD-LEVEL HIGHLIGHTING =====
  
  const renderWordTimestamps = useCallback((subtitle: Subtitle) => {
    if (!showTimestamps || !subtitle.wordTimestamps) {
      return subtitle.text;
    }
    
    return subtitle.wordTimestamps.map((wordData, index) => {
      const isActive = currentTime >= wordData.startTime && currentTime <= wordData.endTime;
      
      return (
        <span
          key={index}
          className={`word-timestamp ${isActive ? 'active' : ''}`}
          style={{
            backgroundColor: isActive ? 'rgba(255, 255, 0, 0.3)' : 'transparent',
            transition: 'background-color 0.1s ease'
          }}
        >
          {wordData.word}
          {index < subtitle.wordTimestamps!.length - 1 ? ' ' : ''}
        </span>
      );
    });
  }, [showTimestamps, currentTime]);
  
  // ===== EFFECTS =====
  
  // Setup interact.js for each subtitle
  useEffect(() => {
    const interactables: any[] = [];
    
    subtitleRefs.current.forEach((element, subtitleId) => {
      const interactable = setupInteractJS(element, subtitleId);
      if (interactable) {
        interactables.push(interactable);
      }
    });
    
    return () => {
      interactables.forEach(interactable => {
        interactable.unset();
      });
    };
  }, [subtitles, setupInteractJS]);
  
  // Global keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  // Click outside to deselect
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSelectedSubtitle(null);
        if (onSubtitleSelect) {
          onSubtitleSelect(null);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onSubtitleSelect]);
  
  // ===== IMPERATIVE HANDLE =====
  
  useImperativeHandle(ref, () => ({
    getContainer: () => containerRef.current,
    selectSubtitle: (id: string) => {
      setSelectedSubtitle(id);
      const subtitle = subtitles.find(s => s.id === id);
      if (subtitle && onSubtitleSelect) {
        onSubtitleSelect(subtitle);
      }
    },
    clearSelection: () => {
      setSelectedSubtitle(null);
      if (onSubtitleSelect) {
        onSubtitleSelect(null);
      }
    },
    startInlineEdit: (id: string) => {
      const subtitle = subtitles.find(s => s.id === id);
      if (subtitle) {
        setEditingSubtitle(id);
        setEditingText(subtitle.text);
      }
    },
    finishInlineEdit
  }));
  
  // ===== RENDER =====
  
  return (
    <div
      ref={containerRef}
      className={`subtitle-editor ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${width}px`,
        height: `${height}px`,
        pointerEvents: enableEditing ? 'auto' : 'none',
        zIndex: 10,
        ...style
      }}
    >
      {subtitles
        .filter(isSubtitleVisible)
        .map((subtitle) => {
          const isSelected = selectedSubtitle === subtitle.id;
          const isEditing = editingSubtitle === subtitle.id;
          const isHovered = hoveredSubtitle === subtitle.id;
          
          return (
            <div
              key={subtitle.id}
              ref={(el) => {
                if (el) {
                  subtitleRefs.current.set(subtitle.id, el);
                } else {
                  subtitleRefs.current.delete(subtitle.id);
                }
              }}
              className={`subtitle-item ${isSelected ? 'selected' : ''} ${isEditing ? 'editing' : ''} ${isHovered ? 'hovered' : ''}`}
              style={{
                ...getSubtitleStyle(subtitle),
                ...getAnimationStyle(subtitle),
                boxShadow: isSelected ? '0 0 0 2px #007bff' : 'none',
                outline: isHovered ? '1px dashed #28a745' : 'none'
              }}
              onClick={() => handleSubtitleClick(subtitle)}
              onDoubleClick={() => handleSubtitleDoubleClick(subtitle)}
              onMouseEnter={() => setHoveredSubtitle(subtitle.id)}
              onMouseLeave={() => setHoveredSubtitle(null)}
            >
              {isEditing ? (
                <textarea
                  value={editingText}
                  onChange={handleInlineEditChange}
                  onKeyDown={handleInlineEditKeyDown}
                  onBlur={finishInlineEdit}
                  autoFocus
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    background: 'transparent',
                    color: 'inherit',
                    font: 'inherit',
                    resize: 'none',
                    outline: 'none',
                    padding: 0,
                    margin: 0
                  }}
                />
              ) : (
                <div className="subtitle-text">
                  {renderWordTimestamps(subtitle)}
                </div>
              )}
              
              {/* Resize handles for selected subtitle */}
              {isSelected && enableEditing && (
                <div className="resize-handles">
                  <div className="resize-handle resize-handle-nw" />
                  <div className="resize-handle resize-handle-ne" />
                  <div className="resize-handle resize-handle-sw" />
                  <div className="resize-handle resize-handle-se" />
                  <div className="resize-handle resize-handle-n" />
                  <div className="resize-handle resize-handle-s" />
                  <div className="resize-handle resize-handle-e" />
                  <div className="resize-handle resize-handle-w" />
                </div>
              )}
            </div>
          );
        })}
      
      {/* CSS Styles */}
      <style>{`
        .subtitle-editor {
          font-family: Arial, sans-serif;
        }
        
        .subtitle-item {
          position: absolute;
          cursor: move;
          user-select: none;
          transition: all 0.2s ease;
        }
        
        .subtitle-item.selected {
          z-index: 1001 !important;
        }
        
        .subtitle-item.dragging {
          z-index: 1002 !important;
          transform: rotate(2deg);
        }
        
        .subtitle-item.resizing {
          z-index: 1002 !important;
        }
        
        .subtitle-item.hovered {
          transform: scale(1.02);
        }
        
        .word-timestamp.active {
          animation: highlight 0.3s ease;
        }
        
        @keyframes highlight {
          0% { background-color: rgba(255, 255, 0, 0.1); }
          50% { background-color: rgba(255, 255, 0, 0.5); }
          100% { background-color: rgba(255, 255, 0, 0.3); }
        }
        
        .resize-handles {
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          pointer-events: none;
        }
        
        .resize-handle {
          position: absolute;
          background: #007bff;
          border: 1px solid #fff;
          pointer-events: auto;
          z-index: 1003;
        }
        
        .resize-handle-nw { top: -4px; left: -4px; width: 8px; height: 8px; cursor: nw-resize; }
        .resize-handle-ne { top: -4px; right: -4px; width: 8px; height: 8px; cursor: ne-resize; }
        .resize-handle-sw { bottom: -4px; left: -4px; width: 8px; height: 8px; cursor: sw-resize; }
        .resize-handle-se { bottom: -4px; right: -4px; width: 8px; height: 8px; cursor: se-resize; }
        .resize-handle-n { top: -4px; left: 50%; transform: translateX(-50%); width: 8px; height: 8px; cursor: n-resize; }
        .resize-handle-s { bottom: -4px; left: 50%; transform: translateX(-50%); width: 8px; height: 8px; cursor: s-resize; }
        .resize-handle-e { top: 50%; right: -4px; transform: translateY(-50%); width: 8px; height: 8px; cursor: e-resize; }
        .resize-handle-w { top: 50%; left: -4px; transform: translateY(-50%); width: 8px; height: 8px; cursor: w-resize; }
      `}</style>
    </div>
  );
});

SubtitleEditor.displayName = 'SubtitleEditor';

export default SubtitleEditor; 