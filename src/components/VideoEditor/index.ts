/**
 * 🎬 VIDEO EDITOR COMPONENTS - ClipsForge Pro
 * 
 * Exportações dos componentes do editor de vídeo profissional
 * 
 * @version 8.0.0 - FASE 8 COMPLETA
 * @author ClipsForge Team
 */

// Main Components
export { default as VideoEditor } from './VideoEditor';
export { default as VideoPlayer } from './VideoPlayer';
export { default as Timeline } from './Timeline';

// Effects & Transitions (Phase 4)
export { default as EffectsPanel } from './EffectsPanel';
export { default as TransitionsPanel } from './TransitionsPanel';

// Audio System (Phase 6)
export { default as AudioMixerPanel } from './AudioMixerPanel';
export { default as AudioChannelStrip } from './controls/AudioChannelStrip';
export { default as AudioFader } from './ui/AudioFader';
export { default as AudioMeter } from './ui/AudioMeter';

// Motion Graphics System (Phase 6)
export { default as MotionGraphicsPanel } from './panels/MotionGraphicsPanel';
export { default as KeyframeEditor } from './motion/KeyframeEditor';
export { default as PropertyPanel } from './motion/PropertyPanel';
export { default as AnimationPresets } from './motion/AnimationPresets';
export { default as LayerManager } from './motion/LayerManager';

// Advanced Timeline & Preview (Phase 7)
export { default as AdvancedTimeline } from './timeline/AdvancedTimeline';
export { default as RealtimePreview } from './preview/RealtimePreview';
export { default as PanelManager } from './panels/PanelManager';

// Render & Export System (Phase 8)
export { default as ExportManager } from './export/ExportManager';
export { default as RenderQueue } from './render/RenderQueue';
export { default as RenderSettings } from './render/RenderSettings';

// Types
export type { VideoEditorProps, VideoEditorRef } from './VideoEditor';

// Utils & Engines
export { effectsEngine } from '../../utils/effectsEngine';
export { audioEngine } from '../../utils/audioEngine';
export { motionEngine } from '../../utils/motionEngine';
export { renderEngine } from '../../utils/renderEngine'; 