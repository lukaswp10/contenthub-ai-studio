// =============================================================================
// 🚨 SISTEMA DE ALERTAS EM TEMPO REAL - APENAS DADOS REAIS
// =============================================================================
// Sistema inteligente de alertas para detectar oportunidades e padrões críticos
// usando EXCLUSIVAMENTE dados reais coletados da Blaze
// =============================================================================

import type { AdvancedFrequencyAnalysis } from './realDataFrequencyAnalysis';
import type { ConfidenceMetrics } from './confidenceEngine';
import type { AdvancedTemporalAnalysis } from './temporalPatternAnalysis';

interface AlertRule {
  id: string;
  name: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'FREQUENCY' | 'TEMPORAL' | 'CONFIDENCE' | 'PATTERN' | 'OPPORTUNITY';
  condition: (context: AlertContext) => boolean;
  message: (context: AlertContext) => string;
  isEnabled: boolean;
}

interface Alert {
  id: string;
  ruleId: string;
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'FREQUENCY' | 'TEMPORAL' | 'CONFIDENCE' | 'PATTERN' | 'OPPORTUNITY';
  timestamp: number;
  data?: any;
  isRead: boolean;
  autoExpire?: number; // minutos para expirar automaticamente
}

interface AlertContext {
  frequencyAnalysis?: AdvancedFrequencyAnalysis;
  confidenceMetrics?: ConfidenceMetrics;
  temporalAnalysis?: AdvancedTemporalAnalysis;
  historicalResults: any[];
  currentPrediction?: any;
  lastResults: any[]; // Últimos 10 resultados
  currentAccuracy: number;
  recentPerformance: number[];
  dataVolume: number;
}

interface AlertSystemState {
  activeAlerts: Alert[];
  dismissedAlerts: Alert[];
  alertHistory: Alert[];
  isSystemActive: boolean;
  lastCheck: number;
  totalAlertsGenerated: number;
  criticalAlertsToday: number;
}

class RealTimeAlertSystem {
  private static instance: RealTimeAlertSystem;
  private alertRules: AlertRule[] = [];
  private state: AlertSystemState;
  private alertCallbacks: ((alert: Alert) => void)[] = [];

  public static getInstance(): RealTimeAlertSystem {
    if (!RealTimeAlertSystem.instance) {
      RealTimeAlertSystem.instance = new RealTimeAlertSystem();
    }
    return RealTimeAlertSystem.instance;
  }

  constructor() {
    this.state = {
      activeAlerts: [],
      dismissedAlerts: [],
      alertHistory: [],
      isSystemActive: true,
      lastCheck: Date.now(),
      totalAlertsGenerated: 0,
      criticalAlertsToday: 0
    };

    this.initializeAlertRules();
    console.log('🚨 Sistema de Alertas em Tempo Real inicializado');
  }

  /**
   * 🚨 VERIFICAR ALERTAS EM TEMPO REAL
   */
  public checkAlerts(context: AlertContext): Alert[] {
    if (!this.state.isSystemActive) {
      return [];
    }

    const newAlerts: Alert[] = [];
    const now = Date.now();

    // Verificar cada regra ativa
    this.alertRules
      .filter(rule => rule.isEnabled)
      .forEach(rule => {
        try {
          if (rule.condition(context)) {
            const alertId = `${rule.id}_${now}`;
            
            // Verificar se já existe um alerta similar ativo
            const existingSimilar = this.state.activeAlerts.find(
              alert => alert.ruleId === rule.id && (now - alert.timestamp) < 300000 // 5 minutos
            );

            if (!existingSimilar) {
              const alert: Alert = {
                id: alertId,
                ruleId: rule.id,
                title: rule.name,
                message: rule.message(context),
                priority: rule.priority,
                category: rule.category,
                timestamp: now,
                data: this.extractRelevantData(context, rule),
                isRead: false,
                autoExpire: this.getAutoExpireTime(rule.priority)
              };

              newAlerts.push(alert);
              this.state.activeAlerts.push(alert);
              this.state.alertHistory.push(alert);
              this.state.totalAlertsGenerated++;

              if (rule.priority === 'CRITICAL') {
                this.state.criticalAlertsToday++;
              }

              console.log(`🚨 ALERTA ${rule.priority}: ${alert.title}`);
              
              // Notificar callbacks
              this.alertCallbacks.forEach(callback => callback(alert));
            }
          }
        } catch (error) {
          console.warn(`⚠️ Erro ao verificar regra ${rule.id}:`, error);
        }
      });

    // Limpar alertas expirados
    this.cleanupExpiredAlerts();
    
    this.state.lastCheck = now;
    return newAlerts;
  }

  /**
   * 📋 INICIALIZAR REGRAS DE ALERTA
   */
  private initializeAlertRules(): void {
    this.alertRules = [
      // 🔥 ALERTAS DE ALTA CONFIANÇA
      {
        id: 'high_confidence_prediction',
        name: '🔥 Alta Confiança Detectada',
        description: 'Predição com confiança muito alta (85%+)',
        priority: 'HIGH',
        category: 'CONFIDENCE',
        isEnabled: true,
        condition: (ctx) => 
          ctx.confidenceMetrics?.finalConfidence >= 85 && 
          ctx.confidenceMetrics?.recommendation === 'VERY_HIGH',
        message: (ctx) => 
          `Confiança ${ctx.confidenceMetrics?.finalConfidence}% - ${ctx.confidenceMetrics?.recommendation} | ${ctx.confidenceMetrics?.reasoning[0] || 'Múltiplos fatores positivos'}`
      },

      // ⚡ ALERTAS DE OPORTUNIDADE
      {
        id: 'extreme_frequency_bias',
        name: '⚡ Viés Extremo Detectado',
        description: 'Viés de frequência muito forte detectado',
        priority: 'HIGH',
        category: 'FREQUENCY',
        isEnabled: true,
        condition: (ctx) => 
          ctx.frequencyAnalysis?.biasDetection.confidence >= 80 &&
          ctx.frequencyAnalysis?.biasDetection.overallBias !== 'balanced',
        message: (ctx) => 
          `Forte viés ${ctx.frequencyAnalysis?.biasDetection.overallBias.toUpperCase()} detectado (${ctx.frequencyAnalysis?.biasDetection.confidence.toFixed(1)}% confiança)`
      },

      {
        id: 'white_overdue_critical',
        name: '🤍 Branco Criticamente Atrasado',
        description: 'Branco não aparece há muito tempo - pressão extrema',
        priority: 'CRITICAL',
        category: 'FREQUENCY',
        isEnabled: true,
        condition: (ctx) => 
          ctx.frequencyAnalysis?.statisticalPressure.whitePressure >= 85 &&
          ctx.frequencyAnalysis?.statisticalPressure.lastOccurrence.white >= 80,
        message: (ctx) => 
          `🚨 BRANCO há ${ctx.frequencyAnalysis?.statisticalPressure.lastOccurrence.white} rodadas! Pressão: ${ctx.frequencyAnalysis?.statisticalPressure.whitePressure.toFixed(1)}`
      },

      // 🕐 ALERTAS TEMPORAIS
      {
        id: 'optimal_time_window',
        name: '🕐 Janela de Tempo Ótima',
        description: 'Hora atual com padrão temporal favorável',
        priority: 'HIGH',
        category: 'TEMPORAL',
        isEnabled: true,
        condition: (ctx) => 
          ctx.temporalAnalysis?.temporalAlerts.isOptimalTime === true &&
          ctx.temporalAnalysis?.temporalAlerts.timeRecommendation === 'EXCELLENT',
        message: (ctx) => 
          `🕐 Hora ótima detectada! ${ctx.temporalAnalysis?.temporalAlerts.currentHourBias} | ${ctx.temporalAnalysis?.temporalAlerts.reasoning[0]}`
      },

      {
        id: 'temporal_momentum_strong',
        name: '📈 Momentum Temporal Forte',
        description: 'Tendência temporal consistente detectada',
        priority: 'MEDIUM',
        category: 'TEMPORAL',
        isEnabled: true,
        condition: (ctx) => 
          ctx.temporalAnalysis?.temporalMomentum.overallTrend !== 'stable' &&
          ctx.temporalAnalysis?.temporalMomentum.last3Hours.strength >= 10,
        message: (ctx) => 
          `📈 Momentum ${ctx.temporalAnalysis?.temporalMomentum.overallTrend.replace('increasing_', '').toUpperCase()} forte detectado (${ctx.temporalAnalysis?.temporalMomentum.last3Hours.strength.toFixed(1)}%)`
      },

      // 🎯 ALERTAS DE CONSENSO
      {
        id: 'perfect_consensus',
        name: '🎯 Consenso Perfeito',
        description: 'Múltiplas análises em perfeito acordo',
        priority: 'CRITICAL',
        category: 'CONFIDENCE',
        isEnabled: true,
        condition: (ctx) => 
          ctx.confidenceMetrics?.consensusStrength.value >= 90 &&
          ctx.confidenceMetrics?.patternStrength.value >= 80 &&
          ctx.confidenceMetrics?.frequencyDeviation.value >= 75,
        message: (ctx) => 
          `🎯 CONSENSO PERFEITO! ML + Frequência + Temporal em acordo (${ctx.confidenceMetrics?.consensusStrength.value}%)`
      },

      // 📊 ALERTAS DE PERFORMANCE
      {
        id: 'accuracy_dropping',
        name: '📉 Precisão em Queda',
        description: 'Precisão do sistema está diminuindo',
        priority: 'MEDIUM',
        category: 'PATTERN',
        isEnabled: true,
        condition: (ctx) => 
          ctx.currentAccuracy > 60 && 
          ctx.recentPerformance.length >= 5 &&
          ctx.recentPerformance.slice(-3).every(perf => perf < ctx.currentAccuracy - 10),
        message: (ctx) => 
          `📉 Precisão em queda: ${ctx.currentAccuracy.toFixed(1)}% → ${ctx.recentPerformance.slice(-1)[0]?.toFixed(1)}% (últimas predições)`
      },

      {
        id: 'accuracy_improving',
        name: '📈 Precisão Melhorando',
        description: 'Sistema está tendo boa performance recente',
        priority: 'LOW',
        category: 'PATTERN',
        isEnabled: true,
        condition: (ctx) => 
          ctx.recentPerformance.length >= 3 &&
          ctx.recentPerformance.slice(-3).every(perf => perf > 70),
        message: (ctx) => 
          `📈 Boa sequência! Últimas ${ctx.recentPerformance.slice(-3).length} predições acima de 70%`
      },

      // 🔍 ALERTAS DE QUALIDADE DE DADOS
      {
        id: 'insufficient_data',
        name: '⚠️ Dados Insuficientes',
        description: 'Volume de dados muito baixo para análise confiável',
        priority: 'MEDIUM',
        category: 'PATTERN',
        isEnabled: true,
        condition: (ctx) => 
          ctx.dataVolume < 50 ||
          (ctx.confidenceMetrics?.dataQuality.value < 40),
        message: (ctx) => 
          `⚠️ Dados insuficientes: ${ctx.dataVolume} registros | Qualidade: ${ctx.confidenceMetrics?.dataQuality.value}%`
      },

      // 🎰 ALERTAS DE PADRÕES ESPECIAIS
      {
        id: 'unusual_streak',
        name: '🎰 Sequência Incomum',
        description: 'Sequência muito longa detectada',
        priority: 'HIGH',
        category: 'PATTERN',
        isEnabled: true,
        condition: (ctx) => {
          if (!ctx.frequencyAnalysis?.streakAnalysis) return false;
          const streaks = ctx.frequencyAnalysis.streakAnalysis;
          const currentMax = Math.max(streaks.currentRedStreak, streaks.currentBlackStreak);
          const avgMax = Math.max(streaks.averageRedStreak, streaks.averageBlackStreak);
          return currentMax > avgMax * 2 && currentMax >= 5;
        },
        message: (ctx) => {
          const streaks = ctx.frequencyAnalysis?.streakAnalysis;
          const currentRed = streaks?.currentRedStreak || 0;
          const currentBlack = streaks?.currentBlackStreak || 0;
          const color = currentRed > currentBlack ? 'VERMELHO' : 'PRETO';
          const count = Math.max(currentRed, currentBlack);
          return `🎰 Sequência ${color} incomum: ${count} seguidos (média: ${Math.max(streaks?.averageRedStreak || 0, streaks?.averageBlackStreak || 0).toFixed(1)})`;
        }
      },

      // 🔮 ALERTAS PREDITIVOS
      {
        id: 'pattern_disruption_expected',
        name: '🔮 Quebra de Padrão Esperada',
        description: 'Padrão atual provavelmente vai quebrar',
        priority: 'MEDIUM',
        category: 'PATTERN',
        isEnabled: true,
        condition: (ctx) => 
          ctx.frequencyAnalysis?.streakAnalysis.streakBreakProbability >= 80,
        message: (ctx) => 
          `🔮 Quebra de padrão esperada: ${ctx.frequencyAnalysis?.streakAnalysis.streakBreakProbability.toFixed(1)}% probabilidade`
      }
    ];

    console.log(`📋 ${this.alertRules.length} regras de alerta inicializadas`);
  }

  /**
   * 🔧 HELPERS
   */
  private extractRelevantData(context: AlertContext, rule: AlertRule): any {
    switch (rule.category) {
      case 'FREQUENCY':
        return {
          bias: context.frequencyAnalysis?.biasDetection,
          pressure: context.frequencyAnalysis?.statisticalPressure,
          streaks: context.frequencyAnalysis?.streakAnalysis
        };
      case 'TEMPORAL':
        return {
          currentHour: context.temporalAnalysis?.timeBasedTrends.currentHour,
          alerts: context.temporalAnalysis?.temporalAlerts,
          momentum: context.temporalAnalysis?.temporalMomentum
        };
      case 'CONFIDENCE':
        return {
          confidence: context.confidenceMetrics?.finalConfidence,
          recommendation: context.confidenceMetrics?.recommendation,
          factors: {
            consensus: context.confidenceMetrics?.consensusStrength,
            patterns: context.confidenceMetrics?.patternStrength
          }
        };
      default:
        return { dataVolume: context.dataVolume, accuracy: context.currentAccuracy };
    }
  }

  private getAutoExpireTime(priority: string): number {
    switch (priority) {
      case 'CRITICAL': return 30; // 30 minutos
      case 'HIGH': return 20;     // 20 minutos
      case 'MEDIUM': return 15;   // 15 minutos
      case 'LOW': return 10;      // 10 minutos
      default: return 15;
    }
  }

  private cleanupExpiredAlerts(): void {
    const now = Date.now();
    
    this.state.activeAlerts = this.state.activeAlerts.filter(alert => {
      if (alert.autoExpire) {
        const expireTime = alert.timestamp + (alert.autoExpire * 60 * 1000);
        return now < expireTime;
      }
      return true;
    });
  }

  /**
   * 📡 API PÚBLICA
   */
  public getActiveAlerts(): Alert[] {
    return [...this.state.activeAlerts].sort((a, b) => {
      // Ordenar por prioridade e depois por timestamp
      const priorityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return b.timestamp - a.timestamp;
    });
  }

  public dismissAlert(alertId: string): void {
    const alertIndex = this.state.activeAlerts.findIndex(alert => alert.id === alertId);
    if (alertIndex !== -1) {
      const alert = this.state.activeAlerts[alertIndex];
      alert.isRead = true;
      this.state.dismissedAlerts.push(alert);
      this.state.activeAlerts.splice(alertIndex, 1);
      console.log(`🔕 Alerta dispensado: ${alert.title}`);
    }
  }

  public markAsRead(alertId: string): void {
    const alert = this.state.activeAlerts.find(alert => alert.id === alertId);
    if (alert) {
      alert.isRead = true;
    }
  }

  public getAlertStats(): { active: number; critical: number; todayTotal: number } {
    return {
      active: this.state.activeAlerts.length,
      critical: this.state.activeAlerts.filter(a => a.priority === 'CRITICAL').length,
      todayTotal: this.state.criticalAlertsToday
    };
  }

  public addAlertCallback(callback: (alert: Alert) => void): void {
    this.alertCallbacks.push(callback);
  }

  public removeAlertCallback(callback: (alert: Alert) => void): void {
    const index = this.alertCallbacks.indexOf(callback);
    if (index !== -1) {
      this.alertCallbacks.splice(index, 1);
    }
  }

  public toggleSystem(active: boolean): void {
    this.state.isSystemActive = active;
    console.log(`🚨 Sistema de alertas ${active ? 'ativado' : 'desativado'}`);
  }

  public enableRule(ruleId: string): void {
    const rule = this.alertRules.find(r => r.id === ruleId);
    if (rule) {
      rule.isEnabled = true;
      console.log(`✅ Regra habilitada: ${rule.name}`);
    }
  }

  public disableRule(ruleId: string): void {
    const rule = this.alertRules.find(r => r.id === ruleId);
    if (rule) {
      rule.isEnabled = false;
      console.log(`❌ Regra desabilitada: ${rule.name}`);
    }
  }

  public getAllRules(): AlertRule[] {
    return [...this.alertRules];
  }
}

// Singleton export
export const realTimeAlertSystem = RealTimeAlertSystem.getInstance();
export type { Alert, AlertRule, AlertContext, AlertSystemState }; 