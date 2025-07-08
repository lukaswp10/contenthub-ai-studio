# Fixtures para Testes E2E

## Arquivos de Teste

### Vídeos de Teste
- `test-video-short.mp4` - Vídeo curto (5 segundos) para testes rápidos
- `test-video-long.mp4` - Vídeo longo (30 segundos) para testes de performance
- `invalid-file.txt` - Arquivo inválido para testar tratamento de erro

### Como Obter os Arquivos

Para os testes funcionarem, você precisa colocar arquivos de vídeo reais nesta pasta:

1. **test-video-short.mp4**: Qualquer vídeo MP4 de ~5 segundos
2. **test-video-long.mp4**: Qualquer vídeo MP4 de ~30 segundos
3. **invalid-file.txt**: Arquivo de texto simples

### Gerando Vídeos de Teste

Se não tiver vídeos disponíveis, você pode:

1. **Usar FFmpeg** para criar vídeos de teste:
```bash
# Vídeo curto (5s) - cor sólida com contador
ffmpeg -f lavfi -i testsrc2=duration=5:size=1280x720:rate=30 -c:v libx264 test-video-short.mp4

# Vídeo longo (30s) - cor sólida com contador
ffmpeg -f lavfi -i testsrc2=duration=30:size=1280x720:rate=30 -c:v libx264 test-video-long.mp4
```

2. **Usar vídeos online** (baixar vídeos livres de direitos)

3. **Gravar vídeos simples** com qualquer ferramenta

### Arquivo Inválido
```bash
echo "Este é um arquivo inválido para teste" > invalid-file.txt
```

## Configuração Automática

Os testes verificam se os arquivos existem antes de executar. Se não existirem, os testes serão marcados como "skipped". 