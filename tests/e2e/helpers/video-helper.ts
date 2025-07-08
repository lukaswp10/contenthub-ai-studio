import { Page, expect } from '@playwright/test';
import { E2E_CONFIG } from '../config/test-config';

/**
 * Funções auxiliares para manipular vídeos nos testes
 */
export class VideoHelper {
  constructor(private page: Page) {}

  /**
   * Faz upload de um arquivo de vídeo
   */
  async uploadVideo(videoPath: string) {
    // Navega para página de upload
    await this.page.goto(E2E_CONFIG.urls.upload);
    
    // Localiza input de arquivo
    const fileInput = this.page.locator(E2E_CONFIG.selectors.uploadInput);
    await expect(fileInput).toBeAttached();
    
    // Faz upload do arquivo
    await fileInput.setInputFiles(videoPath);
    
    // Aguarda progresso de upload
    if (await this.page.locator(E2E_CONFIG.selectors.uploadProgress).isVisible()) {
      await this.page.waitForSelector(E2E_CONFIG.selectors.uploadProgress, { 
        state: 'hidden',
        timeout: E2E_CONFIG.timeouts.upload 
      });
    }
  }

  /**
   * Aguarda o vídeo carregar completamente no player
   */
  async waitForVideoLoad() {
    const video = this.page.locator(E2E_CONFIG.selectors.videoPlayer);
    await expect(video).toBeVisible();
    
    // Aguarda o vídeo ter duração definida
    await this.page.waitForFunction(() => {
      const videoElement = document.querySelector('video') as HTMLVideoElement;
      return videoElement && videoElement.duration > 0;
    }, { timeout: E2E_CONFIG.timeouts.videoLoad });
  }

  /**
   * Obtém duração do vídeo
   */
  async getVideoDuration(): Promise<number> {
    return await this.page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      return video ? video.duration : 0;
    });
  }

  /**
   * Obtém tempo atual do vídeo
   */
  async getCurrentTime(): Promise<number> {
    return await this.page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      return video ? video.currentTime : 0;
    });
  }

  /**
   * Verifica se o vídeo está tocando
   */
  async isVideoPlaying(): Promise<boolean> {
    return await this.page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      return video ? !video.paused : false;
    });
  }

  /**
   * Verifica se o vídeo está pausado
   */
  async isVideoPaused(): Promise<boolean> {
    return await this.page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      return video ? video.paused : true;
    });
  }

  /**
   * Clica no botão play
   */
  async clickPlay() {
    const playButton = this.page.locator(E2E_CONFIG.selectors.playButton);
    await expect(playButton).toBeVisible();
    await playButton.click();
    
    // Aguarda o vídeo começar a tocar
    await this.page.waitForFunction(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      return video && !video.paused;
    }, { timeout: 5000 });
  }

  /**
   * Clica no botão pause
   */
  async clickPause() {
    const pauseButton = this.page.locator(E2E_CONFIG.selectors.pauseButton);
    await expect(pauseButton).toBeVisible();
    await pauseButton.click();
    
    // Aguarda o vídeo pausar
    await this.page.waitForFunction(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      return video && video.paused;
    }, { timeout: 5000 });
  }

  /**
   * Navega para um tempo específico no vídeo
   */
  async seekTo(timeInSeconds: number) {
    await this.page.evaluate((time) => {
      const video = document.querySelector('video') as HTMLVideoElement;
      if (video) {
        video.currentTime = time;
      }
    }, timeInSeconds);
    
    // Aguarda o seek completar
    await this.page.waitForTimeout(1000);
  }

  /**
   * Clica na timeline em uma posição específica
   */
  async clickTimelineAt(percentage: number) {
    const timeline = this.page.locator(E2E_CONFIG.selectors.timeline);
    await expect(timeline).toBeVisible();
    
    const timelineBox = await timeline.boundingBox();
    if (timelineBox) {
      const x = timelineBox.x + (timelineBox.width * percentage / 100);
      const y = timelineBox.y + timelineBox.height / 2;
      
      await this.page.mouse.click(x, y);
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Verifica se o vídeo carregou sem erros
   */
  async checkVideoHealth(): Promise<boolean> {
    return await this.page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      if (!video) return false;
      
      return video.readyState >= 2 && // HAVE_CURRENT_DATA
             video.duration > 0 &&
             !video.error;
    });
  }

  /**
   * Aguarda o vídeo terminar de carregar
   */
  async waitForVideoReady() {
    await this.page.waitForFunction(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      return video && video.readyState >= 3; // HAVE_FUTURE_DATA
    }, { timeout: E2E_CONFIG.timeouts.videoLoad });
  }
} 