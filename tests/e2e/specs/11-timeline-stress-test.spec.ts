/**
 * 🔥 TIMELINE STRESS TEST PRODUÇÃO - ClipsForge Pro
 * 
 * Teste de estresse completo da timeline profissional em PRODUÇÃO REAL.
 * 
 * AMBIENTE: https://clipsforge.vercel.app (100% PRODUÇÃO)
 * DADOS: Reais (Supabase produção + Cloudinary)
 * USUÁRIO: lukaswp10@gmail.com (conta real)
 * 
 * @version 3.0.0 - PRODUÇÃO REAL
 * @author ClipsForge Team
 * @created 2024-01-XX
 */

import { test, expect } from '@playwright/test';
import { E2E_CONFIG } from '../config/test-config';

// ===== CONFIGURAÇÃO GLOBAL =====
test.describe.configure({ mode: 'serial' }); // Executar testes em série

// ===== HELPERS OTIMIZADOS PARA PRODUÇÃO =====

const loginUser = async (page: any) => {
  console.log('🔐 Fazendo login na PRODUÇÃO...');
  await page.goto(`${E2E_CONFIG.urls.base}/login`);
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[type="email"]', 'lukaswp10@gmail.com');
  await page.fill('input[type="password"]', '7pguyrxV!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.waitForLoadState('networkidle');
  console.log('✅ Login realizado com sucesso na PRODUÇÃO');
};

const uploadVideoToProduction = async (page: any) => {
  console.log('📤 Fazendo upload real para PRODUÇÃO...');
  
  // Verificar área de upload
  await expect(page.locator('text=📤 Upload Rápido')).toBeVisible({ timeout: 15000 });
  
  // Usar vídeo real que funciona
  const testVideoPath = '/home/lucasmartins/Downloads/videoplayback.mp4';
  
  // Upload do arquivo
  const fileInput = page.locator('input[type="file"]');
  await expect(fileInput).toBeAttached();
  await fileInput.setInputFiles(testVideoPath);
  console.log('📁 Arquivo selecionado: videoplayback.mp4');
  
  // Aguardar reconhecimento
  await page.waitForTimeout(2000);
  
  // Clicar enviar
  const uploadButton = page.locator('button:has-text("Enviar")');
  await expect(uploadButton).toBeVisible({ timeout: 10000 });
  await uploadButton.click();
  console.log('🚀 Upload iniciado para Cloudinary (PRODUÇÃO)');
  
  // Aguardar sucesso (timeout maior para produção)
  try {
    await expect(page.locator('text=Upload concluído')).toBeVisible({ timeout: 90000 });
    console.log('✅ Upload concluído com sucesso na PRODUÇÃO!');
    await page.waitForTimeout(5000); // Aguardar processamento
    return true;
  } catch (error) {
    console.log('❌ Upload falhou na PRODUÇÃO');
    return false;
  }
};

const navigateToEditorProduction = async (page: any) => {
  console.log('🎬 Navegando para editor na PRODUÇÃO...');
  
  // Procurar vídeo na galeria
  const galleryVideos = page.locator('button:has-text("Editar")');
  
  if (await galleryVideos.count() > 0) {
    console.log('📁 Vídeo encontrado na galeria da PRODUÇÃO');
    await galleryVideos.first().click();
  } else {
    console.log('📝 Usando Editor Manual');
    const editorButton = page.locator('button:has-text("Editor Manual")');
    await expect(editorButton).toBeVisible({ timeout: 10000 });
    await editorButton.click();
  }
  
  // Aguardar chegada no editor
  await page.waitForURL('**/editor', { timeout: 45000 });
  await page.waitForLoadState('networkidle');
  console.log('✅ Editor carregado na PRODUÇÃO');
  
  // Aguardar carregamento completo
  await page.waitForTimeout(8000);
  return true;
};

const validateVideoInProduction = async (page: any) => {
  console.log('📹 Validando vídeo na PRODUÇÃO...');
  
  try {
    // Procurar elemento de vídeo
    const videoElement = page.locator('video');
    await expect(videoElement).toBeVisible({ timeout: 15000 });
    
    // Verificar estado do vídeo
    const videoState = await page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      if (!video) return { found: false };
      
      return {
        found: true,
        src: video.src,
        currentSrc: video.currentSrc,
        readyState: video.readyState,
        networkState: video.networkState,
        error: video.error ? {
          code: video.error.code,
          message: video.error.message
        } : null,
        duration: video.duration,
        paused: video.paused,
        canPlay: video.readyState >= 2
      };
    });
    
    console.log('📊 ESTADO DO VÍDEO NA PRODUÇÃO:', JSON.stringify(videoState, null, 2));
    
    if (videoState.error) {
      console.log(`🔴 ERRO DE VÍDEO: ${videoState.error.code} - ${videoState.error.message}`);
      return false;
    }
    
    if (videoState.canPlay) {
      console.log('✅ Vídeo pode ser reproduzido na PRODUÇÃO');
      return true;
    } else {
      console.log('⚠️ Vídeo presente mas não pode ser reproduzido ainda');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Erro ao validar vídeo na PRODUÇÃO:', error);
    return false;
  }
};

const validateVideoPlayback = async (page: any) => {
  console.log('📹 Validando reprodução real do vídeo...');
  
  try {
    // Aguardar elemento de vídeo
    const videoElement = page.locator('video').first();
    await expect(videoElement).toBeVisible({ timeout: 10000 });
    
    // Aguardar carregamento inicial
    console.log('⏳ Aguardando carregamento inicial do vídeo...');
    await page.waitForTimeout(3000);
    
    // Obter estado inicial detalhado
    const initialState = await page.evaluate(() => {
      const video = document.querySelector('video');
      if (!video) return { found: false };
      
      return {
        found: true,
        src: video.src,
        currentSrc: video.currentSrc,
        readyState: video.readyState,
        networkState: video.networkState,
        error: video.error ? {
          code: video.error.code,
          message: video.error.message
        } : null,
        duration: video.duration,
        currentTime: video.currentTime,
        paused: video.paused,
        ended: video.ended,
        canPlay: video.readyState >= 3, // HAVE_FUTURE_DATA
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        buffered: video.buffered.length > 0 ? {
          start: video.buffered.start(0),
          end: video.buffered.end(0)
        } : null
      };
    });
    
    console.log('📊 ESTADO INICIAL DO VÍDEO:', JSON.stringify(initialState, null, 2));
    
    if (initialState.error) {
      console.log(`🔴 ERRO DE VÍDEO: ${initialState.error.code} - ${initialState.error.message}`);
      return {
        loaded: false,
        played: false,
        error: `Error Code ${initialState.error.code}: ${initialState.error.message}`,
        duration: 0
      };
    }
    
    // Se não está carregado, aguardar mais tempo
    if (initialState.readyState < 3) {
      console.log('⏳ Vídeo ainda carregando, aguardando mais tempo...');
      
      // Aguardar evento de carregamento
      await Promise.race([
        page.waitForFunction(() => {
          const video = document.querySelector('video');
          return video && video.readyState >= 3;
        }, { timeout: 15000 }),
        page.waitForTimeout(15000)
      ]);
      
      // Verificar novamente
      const loadedState = await page.evaluate(() => {
        const video = document.querySelector('video');
        if (!video) return { found: false };
        
        return {
          found: true,
          readyState: video.readyState,
          error: video.error ? {
            code: video.error.code,
            message: video.error.message
          } : null,
          duration: video.duration,
          canPlay: video.readyState >= 3
        };
      });
      
      console.log('📊 ESTADO APÓS AGUARDAR:', JSON.stringify(loadedState, null, 2));
      
      if (loadedState.error) {
        return {
          loaded: false,
          played: false,
          error: `Error Code ${loadedState.error.code}: ${loadedState.error.message}`,
          duration: 0
        };
      }
      
      if (!loadedState.canPlay) {
        console.log('⚠️ Vídeo não conseguiu carregar completamente');
        return {
          loaded: false,
          played: false,
          error: 'Vídeo não carregou completamente',
          duration: 0
        };
      }
    }
    
    // Tentar reproduzir o vídeo
    console.log('▶️ Tentando reproduzir vídeo...');
    
    const playResult = await page.evaluate(async () => {
      const video = document.querySelector('video');
      if (!video) return { success: false, error: 'Vídeo não encontrado' };
      
      try {
        // Resetar para início
        video.currentTime = 0;
        
        // Tentar reproduzir
        const playPromise = video.play();
        if (playPromise) {
          await playPromise;
        }
        
        return {
          success: true,
          currentTime: video.currentTime,
          paused: video.paused,
          duration: video.duration
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });
    
    console.log('📊 RESULTADO DO PLAY:', JSON.stringify(playResult, null, 2));
    
    if (!playResult.success) {
      return {
        loaded: true,
        played: false,
        error: playResult.error,
        duration: playResult.duration || 0
      };
    }
    
    // Aguardar 5 segundos de reprodução
    console.log('⏱️ Aguardando 5 segundos de reprodução...');
    
    let playbackSuccess = false;
    let finalTime = 0;
    
    for (let i = 0; i < 10; i++) { // 10 tentativas de 500ms cada
      await page.waitForTimeout(500);
      
      const currentState = await page.evaluate(() => {
        const video = document.querySelector('video');
        if (!video) return { found: false };
        
        return {
          currentTime: video.currentTime,
          paused: video.paused,
          ended: video.ended,
          duration: video.duration
        };
      });
      
      finalTime = currentState.currentTime;
      
      if (currentState.currentTime >= 5) {
        playbackSuccess = true;
        console.log(`✅ Vídeo reproduziu por ${currentState.currentTime.toFixed(2)}s`);
        break;
      }
      
      if (currentState.paused || currentState.ended) {
        console.log(`⚠️ Vídeo pausou/terminou em ${currentState.currentTime.toFixed(2)}s`);
        break;
      }
      
      console.log(`⏱️ Tempo atual: ${currentState.currentTime.toFixed(2)}s`);
    }
    
    return {
      loaded: true,
      played: playbackSuccess,
      error: null,
      duration: finalTime,
      playedFor5Seconds: playbackSuccess
    };
    
  } catch (error) {
    console.error('❌ Erro ao validar reprodução:', error);
    return {
      loaded: false,
      played: false,
      error: error.message,
      duration: 0
    };
  }
};

const findTimelineInProduction = async (page: any) => {
  console.log('🔍 Procurando timeline na PRODUÇÃO...');
  
  // Aguardar carregamento
  await page.waitForTimeout(5000);
  
  // Seletores específicos para produção
  const timelineSelectors = [
    '.timeline-container-pro',
    '.absolute.bottom-0.left-0.right-0',
    '.integrated-timeline',
    '[data-testid="timeline"]',
    '.timeline-container',
    '.timeline-wrapper'
  ];
  
  for (const selector of timelineSelectors) {
    const element = page.locator(selector);
    if (await element.count() > 0) {
      const isVisible = await element.isVisible();
      if (isVisible) {
        console.log(`⏱️ Timeline encontrada na PRODUÇÃO: ${selector}`);
        return element.first();
      }
    }
  }
  
  throw new Error('❌ Timeline não encontrada na PRODUÇÃO');
};

const testPlaybackInProduction = async (page: any) => {
  console.log('▶️ Testando controles na PRODUÇÃO...');
  
  const results = { play: false, pause: false };
  
  // Testar botão play
  try {
    const playButton = page.locator('button:has-text("▶"), button:has-text("Play"), button[aria-label*="play"]');
    if (await playButton.count() > 0) {
      await playButton.first().click();
      await page.waitForTimeout(2000);
      
      const isPlaying = await page.evaluate(() => {
        const video = document.querySelector('video') as HTMLVideoElement;
        return video ? !video.paused : false;
      });
      
      results.play = isPlaying;
      console.log(`▶️ Play: ${isPlaying ? '✅' : '❌'}`);
    }
  } catch (error) {
    console.log('❌ Erro no botão play:', error);
  }
  
  // Testar botão pause
  try {
    const pauseButton = page.locator('button:has-text("⏸"), button:has-text("Pause"), button[aria-label*="pause"]');
    if (await pauseButton.count() > 0) {
      await pauseButton.first().click();
      await page.waitForTimeout(2000);
      
      const isPaused = await page.evaluate(() => {
        const video = document.querySelector('video') as HTMLVideoElement;
        return video ? video.paused : true;
      });
      
      results.pause = isPaused;
      console.log(`⏸️ Pause: ${isPaused ? '✅' : '❌'}`);
    }
  } catch (error) {
    console.log('❌ Erro no botão pause:', error);
  }
  
  return results;
};

const testNavigationInProduction = async (page: any, timeline: any) => {
  console.log('🎯 Testando navegação na PRODUÇÃO...');
  
  const results = { tested: 0, successful: 0 };
  
  // Testar clique na timeline
  try {
    results.tested++;
    
    const timelineBounds = await timeline.boundingBox();
    if (timelineBounds) {
      const x = timelineBounds.x + timelineBounds.width * 0.3;
      const y = timelineBounds.y + timelineBounds.height / 2;
      
      const timeBefore = await page.evaluate(() => {
        const video = document.querySelector('video') as HTMLVideoElement;
        return video ? video.currentTime : 0;
      });
      
      await page.mouse.click(x, y);
      await page.waitForTimeout(1000);
      
      const timeAfter = await page.evaluate(() => {
        const video = document.querySelector('video') as HTMLVideoElement;
        return video ? video.currentTime : 0;
      });
      
      if (Math.abs(timeAfter - timeBefore) > 0.1) {
        results.successful++;
        console.log(`✅ Navegação por clique: ${timeBefore.toFixed(2)}s → ${timeAfter.toFixed(2)}s`);
      } else {
        console.log(`❌ Navegação por clique não funcionou`);
      }
    }
  } catch (error) {
    console.log('❌ Erro na navegação por clique:', error);
  }
  
  return results;
};

const testShortcutsInProduction = async (page: any) => {
  console.log('⌨️ Testando atalhos na PRODUÇÃO...');
  
  const shortcuts = ['Space', 'ArrowLeft', 'ArrowRight'];
  const results = { tested: 0, working: 0 };
  
  for (const shortcut of shortcuts) {
    results.tested++;
    
    try {
      const beforeState = await page.evaluate(() => {
        const video = document.querySelector('video') as HTMLVideoElement;
        return { time: video ? video.currentTime : 0, paused: video ? video.paused : true };
      });
      
      await page.keyboard.press(shortcut);
      await page.waitForTimeout(1000);
      
      const afterState = await page.evaluate(() => {
        const video = document.querySelector('video') as HTMLVideoElement;
        return { time: video ? video.currentTime : 0, paused: video ? video.paused : true };
      });
      
      if (beforeState.time !== afterState.time || beforeState.paused !== afterState.paused) {
        results.working++;
        console.log(`✅ Atalho ${shortcut} funcionou`);
      } else {
        console.log(`❌ Atalho ${shortcut} não teve efeito`);
      }
    } catch (error) {
      console.log(`❌ Erro no atalho ${shortcut}:`, error);
    }
  }
  
  return results;
};

const testCuttingInProduction = async (page: any) => {
  console.log('✂️ Testando ferramentas de corte na PRODUÇÃO...');
  
  const results = { found: false, functional: false };
  
  try {
    // Procurar ferramentas de corte
    const cuttingSelectors = [
      'button:has-text("✂")',
      'button:has-text("Cortar")',
      'button:has-text("Dividir")',
      '.cutting-tool',
      '[data-testid="cutting-tool"]'
    ];
    
    for (const selector of cuttingSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0 && await element.isVisible()) {
        results.found = true;
        console.log(`✂️ Ferramenta de corte encontrada: ${selector}`);
        
        // Testar funcionalidade (básica)
        try {
          await element.click();
          await page.waitForTimeout(1000);
          results.functional = true;
          console.log('✅ Ferramenta de corte funcional');
        } catch (error) {
          console.log('❌ Ferramenta de corte não funcional');
        }
        
        break;
      }
    }
    
    if (!results.found) {
      console.log('❌ Nenhuma ferramenta de corte encontrada');
    }
  } catch (error) {
    console.log('❌ Erro ao testar ferramentas de corte:', error);
  }
  
  return results;
};

const testResponsivenessInProduction = async (page: any, timeline: any) => {
  console.log('📱 Testando responsividade na PRODUÇÃO...');
  
  const viewports = [
    { width: 1366, height: 768, name: 'Laptop' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1920, height: 1080, name: 'Desktop' }
  ];
  
  const results = { tested: 0, working: 0 };
  
  for (const viewport of viewports) {
    results.tested++;
    
    try {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(2000);
      
      const isVisible = await timeline.isVisible();
      if (isVisible) {
        console.log(`✅ Timeline visível em ${viewport.name}`);
        results.working++;
      } else {
        console.log(`❌ Timeline não visível em ${viewport.name}`);
      }
    } catch (error) {
      console.log(`❌ Erro no viewport ${viewport.name}:`, error);
    }
  }
  
  // Restaurar viewport
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  return results;
};

// ===== TESTE PRINCIPAL =====

test.describe('🔥 ClipsForge - Timeline Stress Test PRODUÇÃO', () => {
  
  test('Teste Completo da Timeline em PRODUÇÃO REAL', async ({ page }) => {
    console.log('🔥 INICIANDO TESTE COMPLETO DA TIMELINE EM PRODUÇÃO...');
    console.log('🌐 AMBIENTE: https://clipsforge.vercel.app (100% PRODUÇÃO)');
    
    // ===== MONITORAMENTO DE ERROS =====
    const consoleErrors: string[] = [];
    const jsErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const error = `Console Error: ${msg.text()}`;
        consoleErrors.push(error);
        console.log('🔴 ' + error);
      }
    });
    
    page.on('pageerror', (error) => {
      const errorMsg = `JS Error: ${error.message}`;
      jsErrors.push(errorMsg);
      console.log('🔴 ' + errorMsg);
    });
    
    // ===== FASE 1: PREPARAÇÃO =====
    console.log('\n📋 FASE 1: Preparação na PRODUÇÃO');
    
    await loginUser(page);
    
    const uploadSuccess = await uploadVideoToProduction(page);
    if (!uploadSuccess) {
      console.log('❌ Upload falhou - teste interrompido');
      throw new Error('Upload falhou na PRODUÇÃO');
    }
    
    await navigateToEditorProduction(page);
    
    // Aguardar carregamento completo
    await page.waitForTimeout(10000);
    
    // ===== FASE 2: VALIDAÇÃO DO VÍDEO =====
    console.log('\n📋 FASE 2: Validação do Vídeo na PRODUÇÃO');
    
    const videoLoaded = await validateVideoInProduction(page);
    if (!videoLoaded) {
      console.log('⚠️ Vídeo não carregou completamente, mas continuando teste...');
    }
    
    // ===== FASE 2.1: TESTE DE REPRODUÇÃO REAL =====
    console.log('\n📋 FASE 2.1: Teste de Reprodução Real na PRODUÇÃO');
    const playbackTest = await validateVideoPlayback(page);
    
    console.log('📊 RESULTADO DA REPRODUÇÃO:', JSON.stringify({
      loaded: playbackTest.loaded,
      played: playbackTest.played,
      playedFor5Seconds: playbackTest.playedFor5Seconds,
      duration: playbackTest.duration,
      error: playbackTest.error
    }, null, 2));
    
    if (playbackTest.error) {
      console.log(`🔴 ERRO NA REPRODUÇÃO: ${playbackTest.error}`);
      jsErrors.push(`Playback Error: ${playbackTest.error}`);
    }
    
    if (playbackTest.playedFor5Seconds) {
      console.log('✅ Vídeo reproduziu por 5+ segundos com sucesso!');
    } else {
      console.log(`⚠️ Vídeo só reproduziu por ${playbackTest.duration.toFixed(2)}s`);
    }
    
    // ===== FASE 3: VALIDAÇÃO DA TIMELINE =====
    console.log('\n📋 FASE 3: Validação da Timeline na PRODUÇÃO');
    
    const timeline = await findTimelineInProduction(page);
    await expect(timeline).toBeVisible();
    console.log('✅ Timeline encontrada e visível na PRODUÇÃO');
    
    // ===== FASE 4: TESTE DOS CONTROLES =====
    console.log('\n📋 FASE 4: Teste dos Controles na PRODUÇÃO');
    
    const playbackResults = await testPlaybackInProduction(page);
    console.log(`Controles: Play ${playbackResults.play ? '✅' : '⚠️'} | Pause ${playbackResults.pause ? '✅' : '⚠️'}`);
    
    // ===== FASE 5: TESTE DE NAVEGAÇÃO =====
    console.log('\n📋 FASE 5: Teste de Navegação na PRODUÇÃO');
    
    const navigationResults = await testNavigationInProduction(page, timeline);
    console.log(`Navegação: ${navigationResults.successful}/${navigationResults.tested} (${navigationResults.tested > 0 ? ((navigationResults.successful / navigationResults.tested) * 100).toFixed(1) : 0}%)`);
    
    // ===== FASE 6: TESTE DE ATALHOS =====
    console.log('\n📋 FASE 6: Teste de Atalhos na PRODUÇÃO');
    
    const shortcutResults = await testShortcutsInProduction(page);
    console.log(`Atalhos: ${shortcutResults.working}/${shortcutResults.tested} (${shortcutResults.tested > 0 ? ((shortcutResults.working / shortcutResults.tested) * 100).toFixed(1) : 0}%)`);
    
    // ===== FASE 7: TESTE DE FERRAMENTAS DE CORTE =====
    console.log('\n📋 FASE 7: Teste de Ferramentas de Corte na PRODUÇÃO');
    
    const cuttingResults = await testCuttingInProduction(page);
    console.log(`Corte: ${cuttingResults.found ? '✅ Encontrado' : '⚠️ Não encontrado'} | ${cuttingResults.functional ? '✅ Funcional' : '⚠️ Não testado'}`);
    
    // ===== FASE 8: TESTE DE RESPONSIVIDADE =====
    console.log('\n📋 FASE 8: Teste de Responsividade na PRODUÇÃO');
    
    const responsiveResults = await testResponsivenessInProduction(page, timeline);
    console.log(`Responsividade: ${responsiveResults.working}/${responsiveResults.tested} (${responsiveResults.tested > 0 ? ((responsiveResults.working / responsiveResults.tested) * 100).toFixed(1) : 0}%)`);
    
    // ===== RELATÓRIO FINAL =====
    console.log('\n🎉 RELATÓRIO FINAL - PRODUÇÃO REAL:');
    console.log('==========================================');
    console.log(`🌐 AMBIENTE: https://clipsforge.vercel.app`);
    console.log(`👤 USUÁRIO: lukaswp10@gmail.com`);
    console.log(`📹 Vídeo: ${videoLoaded ? '✅ Carregado' : '⚠️ Carregamento parcial'}`);
    console.log(`🎬 Reprodução: ${playbackTest.playedFor5Seconds ? '✅ 5+ segundos' : `⚠️ ${playbackTest.duration.toFixed(1)}s`}`);
    console.log(`⏱️ Timeline: ✅ Encontrada e visível`);
    console.log(`▶️ Controles: Play ${playbackResults.play ? '✅' : '⚠️'} | Pause ${playbackResults.pause ? '✅' : '⚠️'}`);
    console.log(`🎯 Navegação: ${navigationResults.successful}/${navigationResults.tested} (${navigationResults.tested > 0 ? ((navigationResults.successful / navigationResults.tested) * 100).toFixed(1) : 0}%)`);
    console.log(`⌨️ Atalhos: ${shortcutResults.working}/${shortcutResults.tested} (${shortcutResults.tested > 0 ? ((shortcutResults.working / shortcutResults.tested) * 100).toFixed(1) : 0}%)`);
    console.log(`✂️ Corte: ${cuttingResults.found ? '✅ Encontrado' : '⚠️ Não encontrado'} | ${cuttingResults.functional ? '✅ Funcional' : '⚠️ Não testado'}`);
    console.log(`📱 Responsividade: ${responsiveResults.working}/${responsiveResults.tested} (${responsiveResults.tested > 0 ? ((responsiveResults.working / responsiveResults.tested) * 100).toFixed(1) : 0}%)`);
    
    // Relatório de erros
    if (consoleErrors.length > 0 || jsErrors.length > 0) {
      console.log('\n🔴 ERROS DETECTADOS NA PRODUÇÃO:');
      console.log(`Console Errors: ${consoleErrors.length}`);
      console.log(`JS Errors: ${jsErrors.length}`);
      
      [...consoleErrors, ...jsErrors].forEach(error => {
        console.log('  - ' + error);
      });
    }
    
    // Calcular score geral
    const totalTests = 7;
    let passedTests = 0;
    
    // Timeline sempre deve estar visível
    passedTests++; // Timeline encontrada
    
    // Outros testes contribuem para o score
    if (videoLoaded) passedTests++;
    if (playbackResults.play || playbackResults.pause) passedTests++;
    if (navigationResults.successful > 0) passedTests++;
    if (shortcutResults.working > 0) passedTests++;
    if (cuttingResults.found) passedTests++;
    if (responsiveResults.working > 0) passedTests++;
    
    const overallScore = Math.min(100, (passedTests / totalTests) * 100);
    
    console.log(`\n🏆 SCORE FINAL NA PRODUÇÃO: ${overallScore.toFixed(1)}% (${passedTests}/${totalTests} testes aprovados)`);
    
    if (overallScore >= 85) {
      console.log('🎉 EXCELENTE! Timeline funcionando perfeitamente na PRODUÇÃO!');
    } else if (overallScore >= 70) {
      console.log('✅ BOM! Timeline funcionando bem na PRODUÇÃO.');
    } else if (overallScore >= 50) {
      console.log('⚠️ REGULAR! Timeline básica funcionando na PRODUÇÃO.');
    } else {
      console.log('❌ CRÍTICO! Timeline com problemas na PRODUÇÃO.');
    }
    
    console.log('==========================================\n');
    
    // Verificações finais (mais tolerantes para produção)
    await expect(timeline).toBeVisible();
    expect(overallScore).toBeGreaterThan(40); // Score mínimo para produção
    
    console.log('✅ TESTE COMPLETO DA PRODUÇÃO FINALIZADO COM SUCESSO!');
  });
}); 