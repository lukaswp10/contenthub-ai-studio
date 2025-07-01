// 🔄 COMMAND MANAGER - Sistema Undo/Redo Profissional
// Baseado no Command Pattern para operações atômicas

export interface Command {
  execute(): void;
  undo(): void;
  redo?(): void;
  description: string;
  timestamp: number;
  id: string;
}

export interface TimelineLayer {
  id: string;
  type: 'video' | 'audio' | 'text' | 'effect';
  name: string;
  start: number;
  duration: number;
  data: any;
  color: string;
  locked: boolean;
}

export interface CutPoint {
  id: string;
  time: number;
  type: 'cut' | 'split';
}

export class CommandManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxHistorySize: number = 50;
  private listeners: ((manager: CommandManager) => void)[] = [];

  // 🎯 Executar comando com undo/redo
  executeCommand(command: Command): void {
    console.log(`⚡ Executando comando: ${command.description}`);
    
    try {
      command.execute();
      
      // Adicionar ao stack de undo
      this.undoStack.push(command);
      
      // Limpar stack de redo (nova ação invalida o redo)
      this.redoStack = [];
      
      // Limitar tamanho do histórico
      if (this.undoStack.length > this.maxHistorySize) {
        this.undoStack.shift();
      }
      
      // Notificar listeners
      this.notifyListeners();
      
      console.log(`✅ Comando executado: ${command.description}`);
      console.log(`📚 Histórico: ${this.undoStack.length} undo, ${this.redoStack.length} redo`);
      
    } catch (error) {
      console.error(`❌ Erro ao executar comando: ${command.description}`, error);
    }
  }

  // ↩️ Desfazer última ação
  undo(): boolean {
    if (this.undoStack.length === 0) {
      console.log('⚠️ Nada para desfazer');
      return false;
    }

    const command = this.undoStack.pop()!;
    console.log(`↩️ Desfazendo: ${command.description}`);

    try {
      command.undo();
      this.redoStack.push(command);
      this.notifyListeners();
      
      console.log(`✅ Desfeito: ${command.description}`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao desfazer: ${command.description}`, error);
      // Recolocar no stack em caso de erro
      this.undoStack.push(command);
      return false;
    }
  }

  // ↪️ Refazer última ação desfeita
  redo(): boolean {
    if (this.redoStack.length === 0) {
      console.log('⚠️ Nada para refazer');
      return false;
    }

    const command = this.redoStack.pop()!;
    console.log(`↪️ Refazendo: ${command.description}`);

    try {
      // Usar redo() se existir, senão execute()
      if (command.redo) {
        command.redo();
      } else {
        command.execute();
      }
      
      this.undoStack.push(command);
      this.notifyListeners();
      
      console.log(`✅ Refeito: ${command.description}`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao refazer: ${command.description}`, error);
      // Recolocar no stack em caso de erro
      this.redoStack.push(command);
      return false;
    }
  }

  // 📚 Informações do histórico
  getHistory(): { undo: Command[], redo: Command[] } {
    return {
      undo: [...this.undoStack],
      redo: [...this.redoStack]
    };
  }

  // 🔔 Sistema de listeners para UI
  addListener(listener: (manager: CommandManager) => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: (manager: CommandManager) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this));
  }

  // 🧹 Limpar histórico
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.notifyListeners();
    console.log('🧹 Histórico limpo');
  }

  // 📊 Status do manager
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  getLastCommand(): Command | null {
    return this.undoStack[this.undoStack.length - 1] || null;
  }
}

// 🎬 COMANDO: Corte com Razor
export class RazorCutCommand implements Command {
  public id: string;
  public timestamp: number;
  public description: string;

  private cutTime: number;
  private originalLayers: TimelineLayer[];
  private newLayers: TimelineLayer[];
  private affectedLayerIds: string[];
  private setTimelineLayers: (layers: TimelineLayer[]) => void;
  private setCutPoints: (points: CutPoint[]) => void;
  private originalCutPoints: CutPoint[];
  private newCutPoint: CutPoint;

  constructor(
    cutTime: number,
    timelineLayers: TimelineLayer[],
    cutPoints: CutPoint[],
    setTimelineLayers: (layers: TimelineLayer[]) => void,
    setCutPoints: (points: CutPoint[]) => void
  ) {
    this.id = `razor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.timestamp = Date.now();
    this.cutTime = cutTime;
    this.originalLayers = [...timelineLayers];
    this.originalCutPoints = [...cutPoints];
    this.setTimelineLayers = setTimelineLayers;
    this.setCutPoints = setCutPoints;
    this.affectedLayerIds = [];
    this.newLayers = [];
    
    this.description = `Corte Razor em ${this.formatTime(cutTime)}`;

    this.newCutPoint = {
      id: `cut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      time: cutTime,
      type: 'cut'
    };
  }

  execute(): void {
    // Encontrar layers afetados
    const affectedLayers = this.originalLayers.filter(layer => 
      this.cutTime > layer.start && 
      this.cutTime < (layer.start + layer.duration) && 
      !layer.locked
    );

    if (affectedLayers.length === 0) {
      throw new Error('Nenhum layer encontrado para corte');
    }

    this.affectedLayerIds = affectedLayers.map(l => l.id);
    
    // Criar novos layers
    const newLayers: TimelineLayer[] = [];
    const remainingLayers = this.originalLayers.filter(layer => !affectedLayers.includes(layer));

    affectedLayers.forEach(layer => {
      const cutTime = this.cutTime - layer.start;
      
      if (cutTime > 0.1 && cutTime < layer.duration - 0.1) {
        // Primeira parte
        const firstPart: TimelineLayer = {
          ...layer,
          id: `${layer.id}_part1_${Date.now()}`,
          duration: cutTime,
          name: `${layer.name} (1/2)`
        };

        // Segunda parte  
        const secondPart: TimelineLayer = {
          ...layer,
          id: `${layer.id}_part2_${Date.now()}`,
          start: this.cutTime,
          duration: layer.duration - cutTime,
          name: `${layer.name} (2/2)`
        };

        newLayers.push(firstPart, secondPart);
      }
    });

    this.newLayers = [...remainingLayers, ...newLayers];
    
    // Aplicar mudanças
    this.setTimelineLayers(this.newLayers);
    this.setCutPoints([...this.originalCutPoints, this.newCutPoint]);
  }

  undo(): void {
    // Restaurar estado original
    this.setTimelineLayers(this.originalLayers);
    this.setCutPoints(this.originalCutPoints);
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

// 🎯 COMANDO: Trim de Clip
export class TrimCommand implements Command {
  public id: string;
  public timestamp: number;
  public description: string;

  private layerId: string;
  private trimType: 'start' | 'end';
  private oldValue: number;
  private newValue: number;
  private originalLayers: TimelineLayer[];
  private setTimelineLayers: (layers: TimelineLayer[]) => void;

  constructor(
    layerId: string,
    trimType: 'start' | 'end',
    oldValue: number,
    newValue: number,
    timelineLayers: TimelineLayer[],
    setTimelineLayers: (layers: TimelineLayer[]) => void
  ) {
    this.id = `trim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.timestamp = Date.now();
    this.layerId = layerId;
    this.trimType = trimType;
    this.oldValue = oldValue;
    this.newValue = newValue;
    this.originalLayers = [...timelineLayers];
    this.setTimelineLayers = setTimelineLayers;
    
    const layer = timelineLayers.find(l => l.id === layerId);
    this.description = `Trim ${trimType} do "${layer?.name || 'clip'}" para ${this.formatTime(newValue)}`;
  }

  execute(): void {
    const updatedLayers = this.originalLayers.map(layer => {
      if (layer.id === this.layerId) {
        if (this.trimType === 'start') {
          const newDuration = (layer.start + layer.duration) - this.newValue;
          return { ...layer, start: this.newValue, duration: newDuration };
        } else {
          const newDuration = this.newValue - layer.start;
          return { ...layer, duration: newDuration };
        }
      }
      return layer;
    });

    this.setTimelineLayers(updatedLayers);
  }

  undo(): void {
    this.setTimelineLayers(this.originalLayers);
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

// 📦 Instância global do CommandManager
export const commandManager = new CommandManager(); 