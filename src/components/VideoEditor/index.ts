/**
 * 🎬 VideoEditor Components Export
 * 
 * Centralized export for all video editor components
 * 
 * @version 7.0.0 - ADVANCED TIMELINE & REAL-TIME PREVIEW
 * @author ClipsForge Team
 */

// Core Components
export { default as VideoEditor } from './VideoEditor'
export { default as VideoPlayer } from './VideoPlayer'
export { default as SubtitleEditor } from './SubtitleEditor'
export { default as ExportModal } from './ExportModal'

// Advanced Components (Phase 4)
export { default as EffectsPanel } from './EffectsPanel'
export { default as TransitionsPanel } from './TransitionsPanel'

// Audio Components (Phase 6)
export { default as AudioMixerPanel } from './AudioMixerPanel'
export { default as AudioFader } from './ui/AudioFader'
export { default as AudioMeter } from './ui/AudioMeter'
export { default as AudioChannelStrip } from './controls/AudioChannelStrip'

// Motion Graphics Components (Phase 6)
export { default as MotionGraphicsPanel } from './panels/MotionGraphicsPanel'
export { default as KeyframeEditor } from './motion/KeyframeEditor'
export { default as PropertyPanel } from './motion/PropertyPanel'
export { default as AnimationPresets } from './motion/AnimationPresets'
export { default as LayerManager } from './motion/LayerManager'

// Timeline Components (Phase 7)
export { default as AdvancedTimeline } from './timeline/AdvancedTimeline'
export { default as ProfessionalTimeline } from './timeline/ProfessionalTimeline'
export { default as IntegratedTimeline } from './timeline/IntegratedTimeline'
export { default as TimelineRuler } from './timeline/components/TimelineRuler'

// Preview Components (Phase 7)
export { default as RealtimePreview } from './preview/RealtimePreview'

// Panel Management (Phase 7)
export { default as PanelManager } from './panels/PanelManager'

// Export Components
export { default as ExportManager } from './export/ExportManager'
export { default as RenderQueue } from './render/RenderQueue'
export { default as RenderSettings } from './render/RenderSettings'

// Timeline Hooks
export { default as useTimelineDragDrop } from './timeline/hooks/useTimelineDragDrop'
export { default as useTimelineNavigation } from './timeline/hooks/useTimelineNavigation'

// Overlay Components
export { default as OverlayCanvas } from './OverlayCanvas'

// Utils
export { effectsEngine } from '../../utils/effectsEngine'
export { audioEngine } from '../../utils/audioEngine'
export { motionEngine } from '../../utils/motionEngine' 