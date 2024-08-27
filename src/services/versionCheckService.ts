import { api } from './apiService';
import { cacheService } from './cacheService';
import { logError, logInfo } from './loggingService';

interface VersionCheckConfig {
  checkInterval: number;
  retryInterval: number;
  maxRetries: number;
}

class VersionCheckService {
  private currentVersion = '';
  private checkInterval: NodeJS.Timeout | null = null;
  private retryCount = 0;
  private config: VersionCheckConfig;

  constructor(config: Partial<VersionCheckConfig> = {}) {
    this.config = {
      checkInterval: 30 * 1000, // 30 segundos por defecto
      retryInterval: 10 * 1000, // 10 segundos por defecto
      maxRetries: 3, // 3 intentos por defecto
      ...config
    };
  }

  setConfig(config: Partial<VersionCheckConfig>): void {
    this.config = { ...this.config, ...config };
    if (this.checkInterval) {
      this.stopVersionCheck();
      this.startVersionCheck();
    }
  }

  async checkForUpdates(): Promise<void> {
    try {
      const response = await api.get<{ version: string }>('/api/version');
      const newVersion = response.data.version;

      if (newVersion !== this.currentVersion) {
        this.currentVersion = newVersion;
        this.markDataAsStale();
        window.dispatchEvent(new CustomEvent('potentialDataUpdate'));
        logInfo('Nueva versión detectada', { oldVersion: this.currentVersion, newVersion });
      }

      this.retryCount = 0; // Resetear el contador de reintentos en caso de éxito
    } catch (error) {
      logError('Error checking for updates:', error as Error);
      this.handleCheckError();
    }
  }

  private handleCheckError(): void {
    if (this.retryCount < this.config.maxRetries) {
      this.retryCount++;
      setTimeout(() => this.checkForUpdates(), this.config.retryInterval);
    } else {
      logError('Max retries reached for version check', new Error('Version check failed after max retries'));
      // Aquí podrías implementar una lógica adicional, como notificar al usuario
    }
  }

  private markDataAsStale(): void {
    ['protestas', 'naturalezas', 'cabecillas'].forEach(key => {
      cacheService.markAsStale(key);
    });
  }

  startVersionCheck(): void {
    this.checkForUpdates();
    this.checkInterval = setInterval(() => this.checkForUpdates(), this.config.checkInterval);
  }

  stopVersionCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Método para forzar una verificación de versión
  forceVersionCheck(): void {
    this.checkForUpdates();
  }
}

export const versionCheckService = new VersionCheckService();

// Verificar actualizaciones cuando se restaure la conexión
window.addEventListener('online', () => versionCheckService.checkForUpdates());
