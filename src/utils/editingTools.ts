/**
 * 🎬 EDITING TOOLS - ClipsForge Pro
 * 
 * Ferramentas avançadas de edição para o VideoEditor
 * Integra com Command Manager para undo/redo
 * 
 * @version 1.0.0
 * @author ClipsForge Team
 */

import { 
  CutOperation,
  TrimOperation,
  SplitOperation,
  MoveOperation,
  DeleteOperation,
  VideoSegment,
  AudioSegment,
  Subtitle,
  Overlay,
  TimelineTrack,
  SnapPoint
} from '../types/video-editor';

import { CommandFactory, commandManager } from './commandManager';

// ===== EDITING TOOLS CLASS =====

export class EditingTools {
  private timelineState: any;
  private updateTimelineState: (updates: any) => void;
  
  constructor(timelineState: any, updateTimelineState: (updates: any) => void) {
    this.timelineState = timelineState;
    this.updateTimelineState = updateTimelineState;
  }
  
  // ===== CUT TOOL =====
  
  cutItemAtTime(trackId: string, itemId: string, cutTime: number): void {
    const track = this.timelineState.tracks.find((t: any) => t.id === trackId);
    if (!track) {
      console.warn('Track not found:', trackId);
      return;
    }
    
    const item = track.items.find((i: any) => i.id === itemId);
    if (!item) {
      console.warn('Item not found:', itemId);
      return;
    }
    
    // Validate cut time
    if (cutTime <= item.startTime || cutTime >= item.endTime) {
      console.warn('Invalid cut time:', cutTime);
      return;
    }
    
    const beforeItem = { 
      ...item, 
      endTime: cutTime,
      id: `${itemId}_before_${Date.now()}`
    };
    
    const afterItem = { 
      ...item, 
      startTime: cutTime,
      id: `${itemId}_after_${Date.now()}`
    };
    
    const operation: CutOperation = {
      trackId,
      itemId,
      cutTime,
      beforeItem,
      afterItem
    };
    
    const command = CommandFactory.createCutCommand(
      operation,
      () => {
        // Execute: Replace item with two parts
        this.updateTimelineState({
          tracks: this.timelineState.tracks.map((t: any) => 
            t.id === trackId ? {
              ...t,
              items: t.items.flatMap((i: any) => 
                i.id === itemId ? [beforeItem, afterItem] : [i]
              )
            } : t
          )
        });
        console.log('✂️ Cut executed:', operation);
      },
      () => {
        // Undo: Restore original item
        this.updateTimelineState({
          tracks: this.timelineState.tracks.map((t: any) => 
            t.id === trackId ? {
              ...t,
              items: t.items.filter((i: any) => 
                i.id !== beforeItem.id && i.id !== afterItem.id
              ).concat([item])
            } : t
          )
        });
        console.log('↩️ Cut undone:', operation);
      }
    );
    
    commandManager.executeCommand(command);
  }
  
  // ===== TRIM TOOL =====
  
  trimItem(
    trackId: string, 
    itemId: string, 
    trimType: 'start' | 'end', 
    newTime: number, 
    rippleEdit: boolean = false
  ): void {
    const track = this.timelineState.tracks.find((t: any) => t.id === trackId);
    if (!track) return;
    
    const item = track.items.find((i: any) => i.id === itemId);
    if (!item) return;
    
    const originalTime = trimType === 'start' ? item.startTime : item.endTime;
    
    // Validate trim
    if (trimType === 'start' && newTime >= item.endTime) return;
    if (trimType === 'end' && newTime <= item.startTime) return;
    
    const operation: TrimOperation = {
      trackId,
      itemId,
      trimType,
      originalTime,
      newTime,
      rippleEdit
    };
    
    const command = CommandFactory.createTrimCommand(
      operation,
      () => {
        // Execute: Update item time
        this.updateTimelineState({
          tracks: this.timelineState.tracks.map((t: any) => 
            t.id === trackId ? {
              ...t,
              items: t.items.map((i: any) => 
                i.id === itemId ? {
                  ...i,
                  [trimType === 'start' ? 'startTime' : 'endTime']: newTime
                } : i
              )
            } : t
          )
        });
        console.log('✂️ Trim executed:', operation);
      },
      () => {
        // Undo: Restore original time
        this.updateTimelineState({
          tracks: this.timelineState.tracks.map((t: any) => 
            t.id === trackId ? {
              ...t,
              items: t.items.map((i: any) => 
                i.id === itemId ? {
                  ...i,
                  [trimType === 'start' ? 'startTime' : 'endTime']: originalTime
                } : i
              )
            } : t
          )
        });
        console.log('↩️ Trim undone:', operation);
      }
    );
    
    commandManager.executeCommand(command);
  }
  
  // ===== SPLIT TOOL =====
  
  splitItem(trackId: string, itemId: string, splitTime: number): void {
    const track = this.timelineState.tracks.find((t: any) => t.id === trackId);
    if (!track) return;
    
    const item = track.items.find((i: any) => i.id === itemId);
    if (!item) return;
    
    // Validate split time
    if (splitTime <= item.startTime || splitTime >= item.endTime) return;
    
    const leftItem = { 
      ...item, 
      endTime: splitTime,
      id: `${itemId}_left_${Date.now()}`
    };
    
    const rightItem = { 
      ...item, 
      startTime: splitTime,
      id: `${itemId}_right_${Date.now()}`
    };
    
    const operation: SplitOperation = {
      trackId,
      itemId,
      splitTime,
      leftItem,
      rightItem
    };
    
    const command = CommandFactory.createSplitCommand(
      operation,
      () => {
        // Execute: Replace with split items
        this.updateTimelineState({
          tracks: this.timelineState.tracks.map((t: any) => 
            t.id === trackId ? {
              ...t,
              items: t.items.flatMap((i: any) => 
                i.id === itemId ? [leftItem, rightItem] : [i]
              )
            } : t
          )
        });
        console.log('🔪 Split executed:', operation);
      },
      () => {
        // Undo: Restore original item
        this.updateTimelineState({
          tracks: this.timelineState.tracks.map((t: any) => 
            t.id === trackId ? {
              ...t,
              items: t.items.filter((i: any) => 
                i.id !== leftItem.id && i.id !== rightItem.id
              ).concat([item])
            } : t
          )
        });
        console.log('↩️ Split undone:', operation);
      }
    );
    
    commandManager.executeCommand(command);
  }
  
  // ===== DELETE TOOL =====
  
  deleteItem(trackId: string, itemId: string, rippleEdit: boolean = false): void {
    const track = this.timelineState.tracks.find((t: any) => t.id === trackId);
    if (!track) return;
    
    const item = track.items.find((i: any) => i.id === itemId);
    if (!item) return;
    
    const operation: DeleteOperation = {
      trackId,
      itemId,
      deletedItem: item,
      rippleEdit
    };
    
    const command = CommandFactory.createDeleteCommand(
      operation,
      () => {
        // Execute: Remove item
        this.updateTimelineState({
          tracks: this.timelineState.tracks.map((t: any) => 
            t.id === trackId ? {
              ...t,
              items: t.items.filter((i: any) => i.id !== itemId)
            } : t
          )
        });
        console.log('🗑️ Delete executed:', operation);
      },
      () => {
        // Undo: Restore item
        this.updateTimelineState({
          tracks: this.timelineState.tracks.map((t: any) => 
            t.id === trackId ? {
              ...t,
              items: [...t.items, item]
            } : t
          )
        });
        console.log('↩️ Delete undone:', operation);
      }
    );
    
    commandManager.executeCommand(command);
  }
}

// ===== SNAP UTILITIES =====

export class SnapUtilities {
  static findSnapPoints(
    timelineState: any,
    time: number,
    snapSettings: any,
    currentTime: number,
    excludeItemId?: string
  ): SnapPoint[] {
    const points: SnapPoint[] = [];
    
    if (!snapSettings.enabled) return points;
    
    // Add playhead snap point
    if (snapSettings.snapToPlayhead) {
      points.push({
        time: currentTime,
        type: 'playhead',
        priority: 10
      });
    }
    
    // Add item snap points
    if (snapSettings.snapToItems) {
      timelineState.tracks.forEach((track: any) => {
        track.items.forEach((item: any) => {
          if (item.id === excludeItemId) return;
          
          points.push({
            time: item.startTime,
            type: 'item-start',
            trackId: track.id,
            itemId: item.id,
            priority: 5
          });
          
          points.push({
            time: item.endTime,
            type: 'item-end',
            trackId: track.id,
            itemId: item.id,
            priority: 5
          });
        });
      });
    }
    
    // Add grid snap points
    if (snapSettings.snapToGrid) {
      const gridInterval = 1; // 1 second intervals
      const nearestGrid = Math.round(time / gridInterval) * gridInterval;
      
      for (let i = -2; i <= 2; i++) {
        points.push({
          time: nearestGrid + (i * gridInterval),
          type: 'grid',
          priority: 1
        });
      }
    }
    
    return points.sort((a, b) => b.priority - a.priority);
  }
  
  static getSnapTime(
    timelineState: any,
    targetTime: number,
    snapSettings: any,
    currentTime: number,
    excludeItemId?: string
  ): number {
    const snapPoints = this.findSnapPoints(
      timelineState, 
      targetTime, 
      snapSettings, 
      currentTime, 
      excludeItemId
    );
    
    const tolerance = snapSettings.snapTolerance / 50; // Convert pixels to seconds
    
    for (const point of snapPoints) {
      if (Math.abs(point.time - targetTime) <= tolerance) {
        return point.time;
      }
    }
    
    return targetTime;
  }
}

export default EditingTools; 