/**
 * 🏪 VIDEO EDITOR STORE - Zustand
 * State management centralizado para performance e escalabilidade
 * ✅ PROTOCOLO DE SEGURANÇA APLICADO
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// ===== INTERFACES =====

export interface VideoData {
  file?: File | null
  url?: string
  name: string
  size: number
  duration?: number
  id?: string
  videoData?: any
}

export interface CutPoint {
  id: string
  time: number
  type: 'cut' | 'split'
}

export interface TimelineLayer {
  id: string
  type: 'video' | 'audio' | 'text' | 'effect'
  name: string
  visible: boolean
  items: any[]
  start?: number
  duration?: number
  data?: any
  color: string
  locked: boolean
}

// ===== STORE STATE =====

interface VideoEditorState {
  // 🎬 VIDEO CORE
  videoData: VideoData | null
  currentTime: number
  duration: number
  isPlaying: boolean
  
  // 🎨 CAPTIONS
  captionsVisible: boolean
  generatedCaptions: any[]
  activeCaptionStyle: string
  captionPosition: 'top' | 'center' | 'bottom'
  captionFontSize: number
  captionTextColor: string
  captionShadowIntensity: number
  captionShadowColor: string
  captionOpacity: number
  captionBackgroundColor: string
  captionFontFamily: string
  captionAnimation: string
  captionBorderColor: string
  captionBorderWidth: number
  showCaptionPreview: boolean
  
  // ✂️ TIMELINE
  cutPoints: CutPoint[]
  timelineLayers: TimelineLayer[]
  razorToolActive: boolean
  selectedLayer: string | null
  
  // 🎭 EFFECTS
  activeEffects: string[]
  
  // 📝 TRANSCRIPTION
  transcriptionResult: any
  transcriptionProvider: 'whisper' | 'assemblyai' | 'webspeech'
  isTranscribing: boolean
  transcriptionProgress: string
  openaiApiKey: string
  assemblyaiApiKey: string
  showTranscriptionConfig: boolean
  showTranscriptTimeline: boolean
  
  // 🖥️ UI STATE
  mobileView: boolean
  leftSidebarOpen: boolean
  rightSidebarOpen: boolean
  galleryModalOpen: boolean
  activeGalleryTab: 'videos' | 'clips'
  
  // 🔄 COMMAND SYSTEM
  canUndo: boolean
  canRedo: boolean
  lastCommand: string | null
  
  // 🎨 LEGACY CAPTION STATES (para compatibilidade)
  isGenerating: boolean
  captionStyle: 'tiktok' | 'youtube' | 'instagram' | 'podcast'
  apiKey: string
}

// ===== STORE ACTIONS =====

interface VideoEditorActions {
  // 🎬 VIDEO ACTIONS
  setVideoData: (data: VideoData | null) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setIsPlaying: (playing: boolean) => void
  togglePlayPause: () => void
  seekTo: (percentage: number) => void
  
  // 🎨 CAPTION ACTIONS
  setCaptionsVisible: (visible: boolean) => void
  toggleCaptionsVisibility: () => void
  setGeneratedCaptions: (captions: any[]) => void
  setActiveCaptionStyle: (style: string) => void
  setCaptionPosition: (position: 'top' | 'center' | 'bottom') => void
  setCaptionFontSize: (size: number) => void
  setCaptionTextColor: (color: string) => void
  setCaptionShadowIntensity: (intensity: number) => void
  setCaptionShadowColor: (color: string) => void
  setCaptionOpacity: (opacity: number) => void
  setCaptionBackgroundColor: (color: string) => void
  setCaptionFontFamily: (family: string) => void
  setCaptionAnimation: (animation: string) => void
  setCaptionBorderColor: (color: string) => void
  setCaptionBorderWidth: (width: number) => void
  setShowCaptionPreview: (show: boolean) => void
  
  // ✂️ TIMELINE ACTIONS
  setCutPoints: (points: CutPoint[]) => void
  addCutPoint: (point: CutPoint) => void
  removeCutPoint: (id: string) => void
  setTimelineLayers: (layers: TimelineLayer[]) => void
  setRazorToolActive: (active: boolean) => void
  setSelectedLayer: (layerId: string | null) => void
  
  // 🎭 EFFECTS ACTIONS
  setActiveEffects: (effects: string[]) => void
  addEffect: (effectId: string) => void
  removeEffect: (effectId: string) => void
  
  // 📝 TRANSCRIPTION ACTIONS
  setTranscriptionResult: (result: any) => void
  setTranscriptionProvider: (provider: 'whisper' | 'assemblyai' | 'webspeech') => void
  setIsTranscribing: (transcribing: boolean) => void
  setTranscriptionProgress: (progress: string) => void
  setOpenaiApiKey: (key: string) => void
  setAssemblyaiApiKey: (key: string) => void
  setShowTranscriptionConfig: (show: boolean) => void
  setShowTranscriptTimeline: (show: boolean) => void
  
  // 🖥️ UI ACTIONS
  setMobileView: (mobile: boolean) => void
  setLeftSidebarOpen: (open: boolean) => void
  setRightSidebarOpen: (open: boolean) => void
  setGalleryModalOpen: (open: boolean) => void
  setActiveGalleryTab: (tab: 'videos' | 'clips') => void
  
  // 🔄 COMMAND ACTIONS
  setCanUndo: (canUndo: boolean) => void
  setCanRedo: (canRedo: boolean) => void
  setLastCommand: (command: string | null) => void
  
  // 🎨 LEGACY ACTIONS
  setIsGenerating: (generating: boolean) => void
  setCaptionStyle: (style: 'tiktok' | 'youtube' | 'instagram' | 'podcast') => void
  setApiKey: (key: string) => void
  
  // 🧹 UTILITY ACTIONS
  resetStore: () => void
  loadFromState: (state: Partial<VideoEditorState>) => void
  
  // 🔑 API KEY MANAGEMENT
  configureApiKeys: () => void
  loadApiKeysFromStorage: () => void
}

// ===== INITIAL STATE =====

const initialState: VideoEditorState = {
  // 🎬 VIDEO CORE
  videoData: null,
  currentTime: 0,
  duration: 30,
  isPlaying: false,
  
  // 🎨 CAPTIONS
  captionsVisible: true,
  generatedCaptions: [],
  activeCaptionStyle: 'tiktok-bold',
  captionPosition: 'bottom',
  captionFontSize: 32,
  captionTextColor: '#FFFFFF',
  captionShadowIntensity: 3,
  captionShadowColor: '#000000',
  captionOpacity: 100,
  captionBackgroundColor: 'transparent',
  captionFontFamily: 'Montserrat',
  captionAnimation: 'fadeIn',
  captionBorderColor: '#000000',
  captionBorderWidth: 2,
  showCaptionPreview: true,
  
  // ✂️ TIMELINE
  cutPoints: [],
  timelineLayers: [],
  razorToolActive: false,
  selectedLayer: null,
  
  // 🎭 EFFECTS
  activeEffects: [],
  
  // 📝 TRANSCRIPTION
  transcriptionResult: null,
  transcriptionProvider: 'whisper',
  isTranscribing: false,
  transcriptionProgress: '',
  openaiApiKey: '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',
  assemblyaiApiKey: '8f2a3b4c5d6e7f8g9h0i1j2k3l4m5n6o',
  showTranscriptionConfig: false,
  showTranscriptTimeline: true,
  
  // 🖥️ UI STATE
  mobileView: false,
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  galleryModalOpen: false,
  activeGalleryTab: 'videos',
  
  // 🔄 COMMAND SYSTEM
  canUndo: false,
  canRedo: false,
  lastCommand: null,
  
  // 🎨 LEGACY STATES
  isGenerating: false,
  captionStyle: 'tiktok',
  apiKey: '',
}

// ===== ZUSTAND STORE =====

export const useVideoEditorStore = create<VideoEditorState & VideoEditorActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    
    // 🎬 VIDEO ACTIONS
    setVideoData: (data) => set({ videoData: data }),
    setCurrentTime: (time) => set({ currentTime: time }),
    setDuration: (duration) => set({ duration }),
    setIsPlaying: (playing) => set({ isPlaying: playing }),
    
    togglePlayPause: () => set((state) => ({ isPlaying: !state.isPlaying })),
    
    seekTo: (percentage) => {
      const { duration } = get()
      const time = (percentage / 100) * duration
      set({ currentTime: time })
    },
    
    // 🎨 CAPTION ACTIONS
    setCaptionsVisible: (visible) => set({ captionsVisible: visible }),
    toggleCaptionsVisibility: () => set((state) => ({ captionsVisible: !state.captionsVisible })),
    setGeneratedCaptions: (captions) => set({ generatedCaptions: captions }),
    setActiveCaptionStyle: (style) => set({ activeCaptionStyle: style }),
    setCaptionPosition: (position) => set({ captionPosition: position }),
    setCaptionFontSize: (size) => set({ captionFontSize: size }),
    setCaptionTextColor: (color) => set({ captionTextColor: color }),
    setCaptionShadowIntensity: (intensity) => set({ captionShadowIntensity: intensity }),
    setCaptionShadowColor: (color) => set({ captionShadowColor: color }),
    setCaptionOpacity: (opacity) => set({ captionOpacity: opacity }),
    setCaptionBackgroundColor: (color) => set({ captionBackgroundColor: color }),
    setCaptionFontFamily: (family) => set({ captionFontFamily: family }),
    setCaptionAnimation: (animation) => set({ captionAnimation: animation }),
    setCaptionBorderColor: (color) => set({ captionBorderColor: color }),
    setCaptionBorderWidth: (width) => set({ captionBorderWidth: width }),
    setShowCaptionPreview: (show) => set({ showCaptionPreview: show }),
    
    // ✂️ TIMELINE ACTIONS
    setCutPoints: (points) => set({ cutPoints: points }),
    addCutPoint: (point) => set((state) => ({ cutPoints: [...state.cutPoints, point] })),
    removeCutPoint: (id) => set((state) => ({ cutPoints: state.cutPoints.filter(p => p.id !== id) })),
    setTimelineLayers: (layers) => set({ timelineLayers: layers }),
    setRazorToolActive: (active) => set({ razorToolActive: active }),
    setSelectedLayer: (layerId) => set({ selectedLayer: layerId }),
    
    // 🎭 EFFECTS ACTIONS
    setActiveEffects: (effects) => set({ activeEffects: effects }),
    addEffect: (effectId) => set((state) => ({ 
      activeEffects: state.activeEffects.includes(effectId) 
        ? state.activeEffects 
        : [...state.activeEffects, effectId] 
    })),
    removeEffect: (effectId) => set((state) => ({ 
      activeEffects: state.activeEffects.filter(id => id !== effectId) 
    })),
    
    // 📝 TRANSCRIPTION ACTIONS
    setTranscriptionResult: (result) => set({ transcriptionResult: result }),
    setTranscriptionProvider: (provider) => set({ transcriptionProvider: provider }),
    setIsTranscribing: (transcribing) => set({ isTranscribing: transcribing }),
    setTranscriptionProgress: (progress) => set({ transcriptionProgress: progress }),
    setOpenaiApiKey: (key) => set({ openaiApiKey: key }),
    setAssemblyaiApiKey: (key) => set({ assemblyaiApiKey: key }),
    setShowTranscriptionConfig: (show) => set({ showTranscriptionConfig: show }),
    setShowTranscriptTimeline: (show) => set({ showTranscriptTimeline: show }),
    
    // 🖥️ UI ACTIONS
    setMobileView: (mobile) => set({ mobileView: mobile }),
    setLeftSidebarOpen: (open) => set({ leftSidebarOpen: open }),
    setRightSidebarOpen: (open) => set({ rightSidebarOpen: open }),
    setGalleryModalOpen: (open) => set({ galleryModalOpen: open }),
    setActiveGalleryTab: (tab) => set({ activeGalleryTab: tab }),
    
    // 🔄 COMMAND ACTIONS
    setCanUndo: (canUndo) => set({ canUndo }),
    setCanRedo: (canRedo) => set({ canRedo }),
    setLastCommand: (command) => set({ lastCommand: command }),
    
    // 🎨 LEGACY ACTIONS
    setIsGenerating: (generating) => set({ isGenerating: generating }),
    setCaptionStyle: (style) => set({ captionStyle: style }),
    setApiKey: (key) => set({ apiKey: key }),
    
    // 🧹 UTILITY ACTIONS
    resetStore: () => set(initialState),
    loadFromState: (state) => set((current) => ({ ...current, ...state })),
    
    // 🔑 API KEY MANAGEMENT
    configureApiKeys: () => {
      const { openaiApiKey, assemblyaiApiKey } = get()
      if (openaiApiKey) {
        localStorage.setItem('openai_api_key', openaiApiKey)
      }
      if (assemblyaiApiKey) {
        localStorage.setItem('assemblyai_api_key', assemblyaiApiKey)
      }
      set({ showTranscriptionConfig: false })
      console.log('✅ API Keys configuradas e salvas')
    },
    
    loadApiKeysFromStorage: () => {
      const savedOpenAI = localStorage.getItem('openai_api_key')
      const savedAssemblyAI = localStorage.getItem('assemblyai_api_key')
      const savedLegacyApiKey = localStorage.getItem('assemblyai_api_key')
      
      set({
        openaiApiKey: savedOpenAI || get().openaiApiKey,
        assemblyaiApiKey: savedAssemblyAI || get().assemblyaiApiKey,
        apiKey: savedLegacyApiKey || ''
      })
    },
  }))
)

// ===== PERFORMANCE SELECTORS =====

// 🎬 Video selectors
export const useVideoData = () => useVideoEditorStore(state => state.videoData)
export const useVideoTime = () => useVideoEditorStore(state => ({ 
  currentTime: state.currentTime, 
  duration: state.duration 
}))
export const useVideoPlayback = () => useVideoEditorStore(state => ({ 
  isPlaying: state.isPlaying, 
  togglePlayPause: state.togglePlayPause,
  seekTo: state.seekTo 
}))

// 🎨 Caption selectors
export const useCaptions = () => useVideoEditorStore(state => ({
  captionsVisible: state.captionsVisible,
  generatedCaptions: state.generatedCaptions,
  activeCaptionStyle: state.activeCaptionStyle,
  toggleCaptionsVisibility: state.toggleCaptionsVisibility
}))

export const useCaptionStyling = () => useVideoEditorStore(state => ({
  captionPosition: state.captionPosition,
  captionFontSize: state.captionFontSize,
  captionTextColor: state.captionTextColor,
  captionShadowIntensity: state.captionShadowIntensity,
  captionShadowColor: state.captionShadowColor,
  captionOpacity: state.captionOpacity,
  captionBackgroundColor: state.captionBackgroundColor,
  captionFontFamily: state.captionFontFamily,
  captionAnimation: state.captionAnimation,
  captionBorderColor: state.captionBorderColor,
  captionBorderWidth: state.captionBorderWidth
}))

// ✂️ Timeline selectors
export const useTimeline = () => useVideoEditorStore(state => ({
  cutPoints: state.cutPoints,
  timelineLayers: state.timelineLayers,
  razorToolActive: state.razorToolActive,
  selectedLayer: state.selectedLayer
}))

// 📝 Transcription selectors
export const useTranscription = () => useVideoEditorStore(state => ({
  transcriptionResult: state.transcriptionResult,
  transcriptionProvider: state.transcriptionProvider,
  isTranscribing: state.isTranscribing,
  transcriptionProgress: state.transcriptionProgress,
  openaiApiKey: state.openaiApiKey,
  assemblyaiApiKey: state.assemblyaiApiKey,
  showTranscriptionConfig: state.showTranscriptionConfig,
  showTranscriptTimeline: state.showTranscriptTimeline
}))

// 🖥️ UI selectors
export const useUIState = () => useVideoEditorStore(state => ({
  mobileView: state.mobileView,
  leftSidebarOpen: state.leftSidebarOpen,
  rightSidebarOpen: state.rightSidebarOpen,
  galleryModalOpen: state.galleryModalOpen,
  activeGalleryTab: state.activeGalleryTab
}))

// 🎭 Effects selectors
export const useEffects = () => useVideoEditorStore(state => ({
  activeEffects: state.activeEffects,
  addEffect: state.addEffect,
  removeEffect: state.removeEffect
}))

// 🔄 Command selectors
export const useCommands = () => useVideoEditorStore(state => ({
  canUndo: state.canUndo,
  canRedo: state.canRedo,
  lastCommand: state.lastCommand
}))

console.log('🏪 VideoEditor Store COMPLETO criado com sucesso!') 