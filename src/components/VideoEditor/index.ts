/**
 * 🎬 VIDEO EDITOR COMPONENTS - ClipsForge Pro
 * 
 * Exportações dos componentes do editor de vídeo profissional
 * 
 * @version 4.0.0 - FASE 4
 * @author ClipsForge Team
 */

// Main Components
export { default as VideoEditor } from './VideoEditor';
export { default as VideoPlayer } from './VideoPlayer';
export { default as Timeline } from './Timeline';

// Effects & Transitions (NEW in Phase 4)
export { default as EffectsPanel } from './EffectsPanel';
export { default as TransitionsPanel } from './TransitionsPanel';

// Types
export type { VideoEditorProps, VideoEditorRef } from './VideoEditor';

// Utils
export { effectsEngine } from '../../utils/effectsEngine'; 