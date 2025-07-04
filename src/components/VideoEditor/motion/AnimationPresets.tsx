/**
 * 🎭 ANIMATION PRESETS - ClipsForge Pro
 * Biblioteca de presets de animação prontos
 */

import React, { useState, useCallback } from 'react';
import { Button } from '../../ui/button';
import { MotionPreset, MotionPresetCategory } from '../../../types/motion.types';
import { Search, Filter, Star, Download, Play } from 'lucide-react';

interface AnimationPresetsProps {
  onPresetApply: (preset: MotionPreset) => void;
  onPresetPreview: (preset: MotionPreset) => void;
  className?: string;
}

const PRESET_CATEGORIES: { value: MotionPresetCategory; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'logo', label: 'Logo' },
  { value: 'transition', label: 'Transition' },
  { value: 'particle', label: 'Particle' },
  { value: 'shape', label: 'Shape' },
  { value: 'effect', label: 'Effect' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'minimal', label: 'Minimal' }
];

const SAMPLE_PRESETS: MotionPreset[] = [
  {
    id: 'fade-in',
    name: 'Fade In',
    category: 'text',
    description: 'Smooth fade in animation',
    thumbnail: '🌅',
    keyframes: [],
    effects: [],
    duration: 1.0,
    tags: ['fade', 'simple', 'smooth'],
    author: 'ClipsForge',
    version: '1.0',
    rating: 4.8,
    downloads: 1250
  },
  {
    id: 'slide-up',
    name: 'Slide Up',
    category: 'text',
    description: 'Slide up from bottom',
    thumbnail: '⬆️',
    keyframes: [],
    effects: [],
    duration: 0.8,
    tags: ['slide', 'motion', 'dynamic'],
    author: 'ClipsForge',
    version: '1.0',
    rating: 4.6,
    downloads: 980
  },
  {
    id: 'bounce-in',
    name: 'Bounce In',
    category: 'logo',
    description: 'Bouncy entrance animation',
    thumbnail: '🏀',
    keyframes: [],
    effects: [],
    duration: 1.2,
    tags: ['bounce', 'playful', 'energetic'],
    author: 'ClipsForge',
    version: '1.0',
    rating: 4.9,
    downloads: 1580
  },
  {
    id: 'glow-pulse',
    name: 'Glow Pulse',
    category: 'effect',
    description: 'Pulsing glow effect',
    thumbnail: '✨',
    keyframes: [],
    effects: [],
    duration: 2.0,
    tags: ['glow', 'pulse', 'magical'],
    author: 'ClipsForge',
    version: '1.0',
    rating: 4.7,
    downloads: 750
  },
  {
    id: 'typewriter',
    name: 'Typewriter',
    category: 'text',
    description: 'Classic typewriter effect',
    thumbnail: '⌨️',
    keyframes: [],
    effects: [],
    duration: 3.0,
    tags: ['typewriter', 'retro', 'classic'],
    author: 'ClipsForge',
    version: '1.0',
    rating: 4.5,
    downloads: 1100
  },
  {
    id: 'particle-burst',
    name: 'Particle Burst',
    category: 'particle',
    description: 'Explosive particle effect',
    thumbnail: '💥',
    keyframes: [],
    effects: [],
    duration: 1.5,
    tags: ['particles', 'explosion', 'dynamic'],
    author: 'ClipsForge',
    version: '1.0',
    rating: 4.8,
    downloads: 890
  }
];

export const AnimationPresets: React.FC<AnimationPresetsProps> = ({
  onPresetApply,
  onPresetPreview,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MotionPresetCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'downloads'>('rating');

  const filteredPresets = SAMPLE_PRESETS
    .filter(preset => {
      const matchesSearch = preset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           preset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || preset.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return b.rating - a.rating;
        case 'downloads':
          return b.downloads - a.downloads;
        default:
          return 0;
      }
    });

  const handlePresetClick = useCallback((preset: MotionPreset, action: 'apply' | 'preview') => {
    if (action === 'apply') {
      onPresetApply(preset);
    } else {
      onPresetPreview(preset);
    }
  }, [onPresetApply, onPresetPreview]);

  return (
    <div className={`animation-presets ${className}`} style={{
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
        borderBottom: '1px solid #333'
      }}>
        <h3 style={{
          margin: '0 0 12px 0',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#fff'
        }}>
          🎭 Animation Presets
        </h3>
        
        {/* Search */}
        <div style={{
          position: 'relative',
          marginBottom: '8px'
        }}>
          <Search 
            size={14} 
            style={{
              position: 'absolute',
              left: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#666'
            }}
          />
          <input
            type="text"
            placeholder="Search presets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 6px 6px 28px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #333',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '12px'
            }}
          />
        </div>
        
        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            style={{
              flex: 1,
              padding: '4px 6px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #333',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '11px'
            }}
          >
            <option value="all">All Categories</option>
            {PRESET_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: '4px 6px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #333',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '11px'
            }}
          >
            <option value="rating">Rating</option>
            <option value="name">Name</option>
            <option value="downloads">Downloads</option>
          </select>
        </div>
      </div>

      {/* Presets Grid */}
      <div style={{
        flex: 1,
        padding: '12px',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '8px'
        }}>
          {filteredPresets.map(preset => (
            <div
              key={preset.id}
              style={{
                backgroundColor: '#2a2a2a',
                border: '1px solid #333',
                borderRadius: '4px',
                padding: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#333';
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2a2a2a';
                e.currentTarget.style.borderColor = '#333';
              }}
            >
              {/* Thumbnail */}
              <div style={{
                width: '100%',
                height: '60px',
                backgroundColor: '#1a1a1a',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                marginBottom: '8px'
              }}>
                {preset.thumbnail}
              </div>
              
              {/* Info */}
              <div style={{
                fontSize: '11px',
                color: '#fff',
                fontWeight: 'bold',
                marginBottom: '4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {preset.name}
              </div>
              
              <div style={{
                fontSize: '9px',
                color: '#666',
                marginBottom: '6px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {preset.description}
              </div>
              
              {/* Stats */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '9px',
                color: '#999',
                marginBottom: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <Star size={8} fill="#f59e0b" color="#f59e0b" />
                  {preset.rating}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <Download size={8} />
                  {preset.downloads}
                </div>
              </div>
              
              {/* Actions */}
              <div style={{
                display: 'flex',
                gap: '4px'
              }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePresetClick(preset, 'preview')}
                  style={{
                    flex: 1,
                    height: '20px',
                    padding: '0',
                    fontSize: '9px',
                    color: '#666'
                  }}
                >
                  <Play size={8} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePresetClick(preset, 'apply')}
                  style={{
                    flex: 2,
                    height: '20px',
                    padding: '0',
                    fontSize: '9px',
                    color: '#3b82f6'
                  }}
                >
                  Apply
                </Button>
              </div>
              
              {/* Duration badge */}
              <div style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: '#fff',
                fontSize: '8px',
                padding: '2px 4px',
                borderRadius: '2px'
              }}>
                {preset.duration}s
              </div>
            </div>
          ))}
        </div>
        
        {filteredPresets.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#666',
            fontSize: '14px',
            padding: '40px 20px'
          }}>
            No presets found matching your criteria
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimationPresets;
