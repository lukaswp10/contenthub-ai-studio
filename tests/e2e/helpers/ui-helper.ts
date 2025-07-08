import { Page, expect } from '@playwright/test';
import { E2E_CONFIG } from '../config/test-config';

/**
 * Funções auxiliares para interagir com a UI do ClipsForge
 */
export class UIHelper {
  constructor(private page: Page) {}



  /**
   * Navega para uma página específica
   */
  async navigateTo(path: 'upload' | 'editor' | 'dashboard' | 'base') {
    await this.page.goto(E2E_CONFIG.urls[path]);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Clica em um botão e aguarda a ação
   */
  async clickButton(selector: string, waitFor?: string) {
    const button = this.page.locator(selector);
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
    await button.click();
    
    if (waitFor) {
      await this.page.waitForSelector(waitFor, { timeout: E2E_CONFIG.timeouts.uiInteraction });
    }
  }

  /**
   * Verifica se um elemento está visível
   */
  async isVisible(selector: string): Promise<boolean> {
    try {
      const element = this.page.locator(selector);
      await expect(element).toBeVisible({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verifica se um botão está habilitado
   */
  async isEnabled(selector: string): Promise<boolean> {
    try {
      const element = this.page.locator(selector);
      await expect(element).toBeEnabled({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Aguarda um elemento aparecer na tela
   */
  async waitForElement(selector: string, timeout?: number) {
    await this.page.waitForSelector(selector, { 
      timeout: timeout || E2E_CONFIG.timeouts.default 
    });
  }

  /**
   * Tira screenshot para debug
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}.png`,
      fullPage: true 
    });
  }

  /**
   * Simula teclas de atalho
   */
  async pressShortcut(key: string) {
    await this.page.keyboard.press(key);
    await this.page.waitForTimeout(500); // Aguarda processamento
  }

  /**
   * Verifica se modal está aberto
   */
  async isModalOpen(modalSelector: string): Promise<boolean> {
    return await this.isVisible(modalSelector);
  }

  /**
   * Fecha modal se estiver aberto
   */
  async closeModal(modalSelector: string, closeButton?: string) {
    if (await this.isModalOpen(modalSelector)) {
      if (closeButton) {
        await this.clickButton(closeButton);
      } else {
        await this.page.keyboard.press('Escape');
      }
    }
  }

  /**
   * Aguarda carregamento completo da página
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Verifica se há erros no console
   */
  async checkConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];
    
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    return errors;
  }
} 