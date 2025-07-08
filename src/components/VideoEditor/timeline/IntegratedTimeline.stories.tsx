import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import IntegratedTimeline from './IntegratedTimeline';

// Mock data para os testes
const mockCutSegments = [
  {
    id: '1',
    start: 0,
    end: 10,
    name: 'Introdução',
    selected: false,
    color: '#10B981'
  },
  {
    id: '2',
    start: 10,
    end: 25,
    name: 'Conteúdo Principal',
    selected: false,
    color: '#8B5CF6'
  },
  {
    id: '3',
    start: 25,
    end: 35,
    name: 'Conclusão',
    selected: false,
    color: '#F59E0B'
  }
];

const mockCutHistory = [mockCutSegments];

const meta: Meta<typeof IntegratedTimeline> = {
  title: 'VideoEditor/IntegratedTimeline',
  component: IntegratedTimeline,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Timeline integrada com sistema de marcadores e grupos para edição de vídeo profissional'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    duration: {
      control: { type: 'number', min: 10, max: 300, step: 5 },
      description: 'Duração total do vídeo em segundos'
    },
    currentTime: {
      control: { type: 'number', min: 0, max: 300, step: 0.1 },
      description: 'Tempo atual de reprodução'
    },
    isPlaying: {
      control: { type: 'boolean' },
      description: 'Se o vídeo está reproduzindo'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Props básicas para todas as stories
const baseProps = {
  isPlaying: false,
  currentTime: 0,
  duration: 60,
  cutSegments: [],
  inPoint: null,
  outPoint: null,
  selectedSegment: null,
  activeTool: 'select',
  cutHistory: [[]],
  onPlay: () => console.log('Play'),
  onPause: () => console.log('Pause'),
  onStop: () => console.log('Stop'),
  onSeek: (time: number) => console.log('Seek to:', time),
  onSetInPoint: () => console.log('Set In Point'),
  onSetOutPoint: () => console.log('Set Out Point'),
  onSplitAtCurrentTime: () => console.log('Split at current time'),
  onCreateCut: () => console.log('Create cut'),
  onUndoCut: () => console.log('Undo cut'),
  onJumpToSegment: (segment: any) => console.log('Jump to segment:', segment),
  formatTime: (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  },
  getTimelinePosition: (time: number) => (time / 60) * 100
};

// Story básica - Timeline vazia
export const Default: Story = {
  args: baseProps
};

// Story com segmentos - Para testar funcionalidade básica
export const WithSegments: Story = {
  args: {
    ...baseProps,
    duration: 40,
    currentTime: 12,
    cutSegments: mockCutSegments,
    cutHistory: mockCutHistory
  },
  render: (args) => (
    <div style={{ padding: '20px', height: '100vh', backgroundColor: '#f5f5f5' }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Timeline com Segmentos</h2>
      <IntegratedTimeline {...args} />
    </div>
  )
};

// Story para testar marcadores
export const WithMarkers: Story = {
  args: {
    ...baseProps,
    duration: 30,
    currentTime: 8,
    cutSegments: mockCutSegments.slice(0, 2)
  },
  render: (args) => (
    <div style={{ padding: '20px', height: '100vh', backgroundColor: '#f5f5f5' }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Timeline com Marcadores</h2>
      <p style={{ marginBottom: '15px', color: '#666' }}>
        Teste os atalhos: <strong>M</strong> (novo marcador), <strong>Shift+M</strong> (próximo), <strong>,</strong> (anterior)
      </p>
      <IntegratedTimeline {...args} />
    </div>
  )
};

// Story para testar grupos
export const WithGroups: Story = {
  args: {
    ...baseProps,
    duration: 40,
    currentTime: 15,
    cutSegments: mockCutSegments
  },
  render: (args) => (
    <div style={{ padding: '20px', height: '100vh', backgroundColor: '#f5f5f5' }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Timeline com Grupos</h2>
      <p style={{ marginBottom: '15px', color: '#666' }}>
        Teste os atalhos: <strong>G</strong> (criar grupo), <strong>U</strong> (colapsar/expandir)
      </p>
      <IntegratedTimeline {...args} />
    </div>
  )
};

// Story completa - Para testar integração completa
export const Complete: Story = {
  args: {
    ...baseProps,
    duration: 40,
    currentTime: 18,
    cutSegments: mockCutSegments,
    inPoint: 5,
    outPoint: 30
  },
  render: (args) => (
    <div style={{ padding: '20px', height: '100vh', backgroundColor: '#f5f5f5' }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Timeline Completa - Marcadores + Grupos</h2>
      <div style={{ marginBottom: '15px', color: '#666', fontSize: '14px' }}>
        <p><strong>Atalhos de Marcadores:</strong> M (novo), Shift+M (próximo), , (anterior), 1-6 (categorias)</p>
        <p><strong>Atalhos de Grupos:</strong> G (criar), U (colapsar/expandir), Ctrl+G (painel)</p>
        <p><strong>Outros:</strong> Ctrl+Z (desfazer), Ctrl+Y (refazer), + (zoom in), - (zoom out)</p>
      </div>
      <IntegratedTimeline {...args} />
    </div>
  )
};

// Story para teste de reprodução
export const Playing: Story = {
  args: {
    ...baseProps,
    isPlaying: true,
    currentTime: 15,
    duration: 60,
    cutSegments: mockCutSegments
  },
  render: (args) => (
    <div style={{ padding: '20px', height: '100vh', backgroundColor: '#f5f5f5' }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Timeline em Reprodução</h2>
      <p style={{ marginBottom: '15px', color: '#666' }}>
        Estado de reprodução ativo com controles
      </p>
      <IntegratedTimeline {...args} />
    </div>
  )
};

// Story para teste de performance
export const PerformanceTest: Story = {
  args: {
    ...baseProps,
    duration: 300,
    currentTime: 150,
    cutSegments: [
      ...mockCutSegments,
      { id: '4', start: 35, end: 50, name: 'Segmento 4', selected: false, color: '#EF4444' },
      { id: '5', start: 50, end: 75, name: 'Segmento 5', selected: false, color: '#3B82F6' },
      { id: '6', start: 75, end: 100, name: 'Segmento 6', selected: false, color: '#EC4899' }
    ]
  },
  render: (args) => (
    <div style={{ padding: '20px', height: '100vh', backgroundColor: '#f5f5f5' }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Teste de Performance (5min)</h2>
      <p style={{ marginBottom: '15px', color: '#666' }}>
        Timeline longa para testar performance com muitos elementos
      </p>
      <IntegratedTimeline {...args} />
    </div>
  )
}; 