# 🚀 BLAZE ANALYZER V2 - Arquitetura Modular

## 📋 ESTRUTURA ORGANIZADA

```
src/pages/teste-jogo/
├── TesteJogoPageV2.tsx          # 🏠 Página principal
├── components/
│   ├── BlazeDataProvider.tsx    # 🏗️ Estado central (Context)
│   └── BlazeInterface.tsx       # 🎨 Interface principal
├── hooks/
│   ├── useBlazeData.ts          # 🎯 Captura dados Blaze
│   ├── usePredictionEngine.ts   # 🧠 Algoritmos e predições
│   └── useAccuracyTracker.ts    # 📊 Acertos/erros
├── config/
│   └── BlazeConfig.ts           # ⚙️ Configurações centralizadas
└── README.md                    # 📚 Esta documentação
```

## 🔄 FLUXO CORRETO IMPLEMENTADO

```
1. Blaze (Chromium) → useBlazeData → captura números reais
2. Algoritmos → usePredictionEngine → processa e gera predições
3. Predição → useAccuracyTracker → registra para verificação
4. Aprendizado → sistema aprende com acertos/erros
```

## 🎯 REGRA DE NEGÓCIO SEGUIDA

✅ **Buscar dados da Blaze** - `useBlazeData` + `blazeRealDataService`
✅ **Salvar no banco de dados** - Automático via `blazeRealDataService`
✅ **Enviar para algoritmos** - `usePredictionEngine` → `RealAlgorithmsService` + `advancedMLService`
✅ **CSV importação** - Sistema preservado do V1 (integração futura)

## ⚙️ CONFIGURAÇÕES CENTRALIZADAS

Todas as variáveis estão em **`BlazeConfig.ts`**:

- `MIN_NUMBERS_FOR_PREDICTION: 10` - Mínimo para predição
- `MIN_NUMBERS_FOR_REAL_ALGORITHMS: 100` - Mínimo algoritmos reais
- `ENABLE_DEBUG_LOGS: false` - Controle de logs
- `WHITE_MULTIPLIER: 14` - Payout do branco
- `MAX_HISTORY_DISPLAY: 200` - Limite histórico visual

## 🎨 INTERFACE ETAPA 4

Interface limpa com foco em:

1. **Histórico da Blaze** - tempo real, último número destacado
2. **Predição dos Algoritmos** - cor, número, confiança
3. **Acertos/Erros** - estatísticas de performance
4. **Destaque Branco** - alerta especial para pagamento 14x

## 🧪 HOOKS ESPECIALIZADOS

### `useBlazeData`
- Conecta com Chromium via `blazeRealDataService`
- Evita duplicação com `processedIds`
- Gerencia estado da conexão

### `usePredictionEngine`
- Prioridade 1: Algoritmos Reais (100+ números)
- Prioridade 2: ML Avançado (50+ números)
- Fallback: Padrão simples (10+ números)

### `useAccuracyTracker`
- Registra predições para verificação futura
- Compara resultado real vs predição
- Mantém estatísticas acumuladas

## 🚨 MELHORIAS IMPLEMENTADAS

### ETAPA 1 - Dados e Logs
- ✅ Histórico apenas dados reais (Blaze + CSV)
- ✅ Último número destacado com animação
- ✅ Logs reduzidos (só essenciais + erros)

### ETAPA 2 - Arquitetura
- ✅ Sistema modular bem organizado
- ✅ Hooks especializados por responsabilidade
- ✅ Configurações centralizadas
- ✅ Evita duplicação via controle de IDs
- ✅ Performance otimizada

## 🔧 MANUTENÇÃO

Para alterar comportamento:
1. **Configurações** → `BlazeConfig.ts`
2. **Interface** → `BlazeInterface.tsx`
3. **Dados** → `useBlazeData.ts`
4. **Algoritmos** → `usePredictionEngine.ts`
5. **Acurácia** → `useAccuracyTracker.ts`

## ✅ STATUS

- **Build**: ✅ Passando (25.73s)
- **TypeScript**: ✅ Sem erros
- **Arquitetura**: ✅ Modular e escalável
- **Performance**: ✅ Otimizada
- **Logs**: ✅ Reduzidos conforme ETAPA 1
- **Interface**: ✅ Limpa conforme ETAPA 4 