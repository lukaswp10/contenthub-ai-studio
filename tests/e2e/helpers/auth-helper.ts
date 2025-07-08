import { Page, BrowserContext } from '@playwright/test';
import { E2E_CONFIG } from '../config/test-config';

/**
 * Helper global para autenticação em testes E2E
 */
export class AuthHelper {
  private static authState: any = null;
  private static isAuthenticated = false;

  /**
   * Credenciais fixas para testes
   */
  private static getCredentials() {
    return {
      email: 'lukaswp10@gmail.com',
      password: '7pguyrxV!'
    };
  }

  /**
   * Fazer login uma vez e guardar o estado de autenticação
   */
  static async authenticateOnce(context: BrowserContext): Promise<void> {
    if (this.isAuthenticated && this.authState) {
      console.log('🔄 Reutilizando autenticação existente');
      return;
    }

    const credentials = this.getCredentials();
    console.log(`🔐 Fazendo login inicial com: ${credentials.email}`);

    const page = await context.newPage();
    
    try {
      // Ir para página de login (usando URL de produção)
      await page.goto(`${E2E_CONFIG.urls.base}/login`);
      await page.waitForLoadState('networkidle');
      
      // Aguardar elementos da página carregarem
      await page.waitForSelector('input[type="email"]', { timeout: E2E_CONFIG.timeouts.uiInteraction });
      
      // Preencher formulário
      await page.fill('input[type="email"]', credentials.email);
      await page.fill('input[type="password"]', credentials.password);
      
      // Aguardar botão ficar habilitado e clicar
      await page.waitForSelector('button:has-text("Entrar"):not([disabled])', { timeout: E2E_CONFIG.timeouts.uiInteraction });
      await page.click('button:has-text("Entrar")');
      
      // Aguardar redirecionamento com timeout maior para produção
      await page.waitForLoadState('networkidle', { timeout: E2E_CONFIG.timeouts.default });
      await page.waitForTimeout(3000); // Aguardar mais tempo para produção
      
      // Verificar se login foi bem-sucedido
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        throw new Error('Login falhou - ainda na página de login');
      }
      
      // Salvar estado de autenticação (cookies + localStorage)
      this.authState = {
        cookies: await context.cookies(),
        localStorage: await page.evaluate(() => {
          const storage: any = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) storage[key] = localStorage.getItem(key);
          }
          return storage;
        })
      };
      
      this.isAuthenticated = true;
      console.log(`✅ Login bem-sucedido e estado salvo - URL: ${currentUrl}`);
      
    } catch (error) {
      console.error('❌ Erro no login:', error);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Aplicar estado de autenticação a uma página
   */
  static async applyAuthState(page: Page): Promise<void> {
    if (!this.isAuthenticated || !this.authState) {
      throw new Error('Não há estado de autenticação disponível');
    }

    console.log('🔄 Aplicando estado de autenticação à página');
    
    // Aplicar cookies
    await page.context().addCookies(this.authState.cookies);
    
    // Aplicar localStorage
    await page.goto(E2E_CONFIG.urls.base);
    await page.evaluate((storage) => {
      for (const [key, value] of Object.entries(storage)) {
        localStorage.setItem(key, value as string);
      }
    }, this.authState.localStorage);
  }

  /**
   * Função principal para usar em todos os testes
   */
  static async loginForTests(page: Page): Promise<void> {
    try {
      // Autenticar uma vez no contexto
      await this.authenticateOnce(page.context());
      
      // Aplicar estado de autenticação à página atual
      await this.applyAuthState(page);
      
      console.log('✅ Autenticação aplicada com sucesso');
    } catch (error) {
      console.error('❌ Erro na autenticação:', error);
      throw error;
    }
  }

  /**
   * Verificar se está logado
   */
  static async isLoggedIn(page: Page): Promise<boolean> {
    try {
      await page.goto(E2E_CONFIG.urls.dashboard);
      await page.waitForLoadState('networkidle');
      return !page.url().includes('/login');
    } catch {
      return false;
    }
  }

  /**
   * Limpar estado de autenticação
   */
  static clearAuthState(): void {
    this.authState = null;
    this.isAuthenticated = false;
    console.log('🗑️ Estado de autenticação limpo');
  }
} 