/**
 * 🎬 COMMAND MANAGER - ClipsForge Pro
 * 
 * Sistema profissional de comandos para undo/redo
 * Implementa Command Pattern com merge de comandos
 * 
 * @version 1.0.0
 * @author ClipsForge Team
 */

import { 
  EditorCommand, 
  CommandHistory,
  CutOperation,
  TrimOperation,
  SplitOperation,
  MoveOperation,
  DeleteOperation
} from '../types/video-editor';

// ===== COMMAND MANAGER =====

export class CommandManager {
  private history: CommandHistory;
  private listeners: ((history: CommandHistory) => void)[] = [];
  
  constructor(maxHistorySize: number = 50) {
    this.history = {
      commands: [],
      currentIndex: -1,
      maxHistorySize,
      canUndo: false,
      canRedo: false
    };
  }
  
  // ===== EXECUTE COMMAND =====
  
  executeCommand(command: EditorCommand): void {
    try {
      // Execute the command
      command.execute();
      
      // Try to merge with previous command if possible
      const lastCommand = this.getLastCommand();
      if (lastCommand && lastCommand.canMerge && lastCommand.canMerge(command)) {
        // Merge commands
        const mergedCommand = lastCommand.merge!(command);
        this.history.commands[this.history.currentIndex] = mergedCommand;
      } else {
        // Add new command
        this.addCommand(command);
      }
      
      this.updateHistoryState();
      this.notifyListeners();
      
      console.log('🎬 Command executed:', command.type, command.description);
    } catch (error) {
      console.error('❌ Command execution failed:', error);
      throw error;
    }
  }
  
  // ===== UNDO =====
  
  undo(): boolean {
    if (!this.canUndo()) return false;
    
    try {
      const command = this.history.commands[this.history.currentIndex];
      command.undo();
      this.history.currentIndex--;
      
      this.updateHistoryState();
      this.notifyListeners();
      
      console.log('↩️ Undo:', command.type, command.description);
      return true;
    } catch (error) {
      console.error('❌ Undo failed:', error);
      return false;
    }
  }
  
  // ===== REDO =====
  
  redo(): boolean {
    if (!this.canRedo()) return false;
    
    try {
      this.history.currentIndex++;
      const command = this.history.commands[this.history.currentIndex];
      command.execute();
      
      this.updateHistoryState();
      this.notifyListeners();
      
      console.log('↪️ Redo:', command.type, command.description);
      return true;
    } catch (error) {
      console.error('❌ Redo failed:', error);
      this.history.currentIndex--;
      return false;
    }
  }
  
  // ===== HELPERS =====
  
  private addCommand(command: EditorCommand): void {
    // Remove any commands after current index (for new branch)
    this.history.commands = this.history.commands.slice(0, this.history.currentIndex + 1);
    
    // Add new command
    this.history.commands.push(command);
    this.history.currentIndex++;
    
    // Trim history if too large
    if (this.history.commands.length > this.history.maxHistorySize) {
      this.history.commands.shift();
      this.history.currentIndex--;
    }
  }
  
  /**
   * Get the last executed command
   */
  public getLastCommand(): EditorCommand | null {
    if (this.history.commands.length === 0) return null;
    return this.history.commands[this.history.currentIndex - 1] || null;
  }
  
  private updateHistoryState(): void {
    this.history.canUndo = this.history.currentIndex >= 0;
    this.history.canRedo = this.history.currentIndex < this.history.commands.length - 1;
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.history));
  }
  
  // ===== PUBLIC API =====
  
  canUndo(): boolean {
    return this.history.canUndo;
  }
  
  canRedo(): boolean {
    return this.history.canRedo;
  }
  
  getHistory(): CommandHistory {
    return { ...this.history };
  }
  
  clear(): void {
    this.history.commands = [];
    this.history.currentIndex = -1;
    this.updateHistoryState();
    this.notifyListeners();
  }
  
  onHistoryChange(listener: (history: CommandHistory) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

// ===== COMMAND FACTORY =====

export class CommandFactory {
  static createCutCommand(
    operation: CutOperation,
    executeCallback: () => void,
    undoCallback: () => void
  ): EditorCommand {
    return {
      id: `cut-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'cut',
      description: `Cut item at ${operation.cutTime}s`,
      timestamp: Date.now(),
      execute: executeCallback,
      undo: undoCallback
    };
  }
  
  static createTrimCommand(
    operation: TrimOperation,
    executeCallback: () => void,
    undoCallback: () => void
  ): EditorCommand {
    return {
      id: `trim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'trim',
      description: `Trim ${operation.trimType} to ${operation.newTime}s`,
      timestamp: Date.now(),
      execute: executeCallback,
      undo: undoCallback,
      canMerge: (other) => {
        return other.type === 'trim' && 
               other.description.includes(operation.itemId) &&
               Date.now() - other.timestamp < 1000; // 1 second merge window
      },
      merge: (other) => {
        return {
          ...other,
          description: `Trim ${operation.trimType} (merged)`,
          timestamp: Date.now()
        };
      }
    };
  }
  
  static createSplitCommand(
    operation: SplitOperation,
    executeCallback: () => void,
    undoCallback: () => void
  ): EditorCommand {
    return {
      id: `split-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'split',
      description: `Split item at ${operation.splitTime}s`,
      timestamp: Date.now(),
      execute: executeCallback,
      undo: undoCallback
    };
  }
  
  static createMoveCommand(
    operation: MoveOperation,
    executeCallback: () => void,
    undoCallback: () => void
  ): EditorCommand {
    return {
      id: `move-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'move',
      description: `Move item from ${operation.fromTime}s to ${operation.toTime}s`,
      timestamp: Date.now(),
      execute: executeCallback,
      undo: undoCallback,
      canMerge: (other) => {
        return other.type === 'move' && 
               other.description.includes(operation.itemId) &&
               Date.now() - other.timestamp < 500; // 500ms merge window for moves
      },
      merge: (other) => {
        return {
          ...other,
          description: `Move item (merged)`,
          timestamp: Date.now()
        };
      }
    };
  }
  
  static createDeleteCommand(
    operation: DeleteOperation,
    executeCallback: () => void,
    undoCallback: () => void
  ): EditorCommand {
    return {
      id: `delete-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'delete',
      description: `Delete item`,
      timestamp: Date.now(),
      execute: executeCallback,
      undo: undoCallback
    };
  }
}

// ===== GLOBAL INSTANCE =====

export const commandManager = new CommandManager();
export default commandManager; 