import { BroadcastChannel } from 'broadcast-channel';
import { logInfo, logError } from './loggingService';

interface LockState {
   lockedBy: string;
   expiresAt: number;
}

interface SyncMessage {
   type: 'acquireLock' | 'lockGranted' | 'releaseLock';
   resourceId: string;
   tabId: string;
}

class TabSyncService {
   private channel: BroadcastChannel<SyncMessage>;
   private tabId: string;
   private locks: Map<string, LockState> = new Map();

   constructor() {
      this.channel = new BroadcastChannel('app_sync_channel');
      this.tabId = crypto.randomUUID();
      this.setupListeners();
      logInfo('TabSyncService inicializado', { tabId: this.tabId });
   }

   private setupListeners() {
      this.channel.onmessage = (msg: SyncMessage) => {
         switch (msg.type) {
            case 'acquireLock':
               this.handleAcquireLock(msg);
               break;
            case 'lockGranted':
               this.handleLockGranted(msg);
               break;
            case 'releaseLock':
               this.handleReleaseLock(msg);
               break;
         }
      };
   }

   private handleAcquireLock(msg: SyncMessage) {
      if (msg.tabId !== this.tabId) {
         const currentLock = this.locks.get(msg.resourceId);
         if (!currentLock || currentLock.expiresAt < Date.now()) {
            this.channel.postMessage({ type: 'lockGranted', resourceId: msg.resourceId, tabId: msg.tabId });
            logInfo('Bloqueo concedido a otra pestaña', { resourceId: msg.resourceId, tabId: msg.tabId });
         }
      }
   }

   private handleLockGranted(msg: SyncMessage) {
      if (msg.tabId === this.tabId) {
         this.locks.set(msg.resourceId, { lockedBy: this.tabId, expiresAt: Date.now() + 30000 });
         logInfo('Bloqueo adquirido', { resourceId: msg.resourceId });
      }
   }

   private handleReleaseLock(msg: SyncMessage) {
      this.locks.delete(msg.resourceId);
      logInfo('Bloqueo liberado', { resourceId: msg.resourceId });
   }

   async acquireLock(resourceId: string): Promise<boolean> {
      return new Promise((resolve) => {
         const currentLock = this.locks.get(resourceId);
         if (currentLock && currentLock.expiresAt > Date.now()) {
            logInfo('Intento de adquirir bloqueo fallido', { resourceId });
            resolve(false);
         } else {
            this.channel.postMessage({ type: 'acquireLock', resourceId, tabId: this.tabId });
            setTimeout(() => {
               const acquired = this.locks.get(resourceId)?.lockedBy === this.tabId;
               logInfo('Resultado de intento de adquirir bloqueo', { resourceId, acquired });
               resolve(acquired);
            }, 100);
         }
      });
   }

   releaseLock(resourceId: string) {
      this.locks.delete(resourceId);
      this.channel.postMessage({ type: 'releaseLock', resourceId, tabId: this.tabId });
      logInfo('Bloqueo liberado', { resourceId });
   }

   async withLock<T>(resourceId: string, action: () => Promise<T>): Promise<T | null> {
      const acquired = await this.acquireLock(resourceId);
      if (acquired) {
         try {
            logInfo('Ejecutando acción con bloqueo', { resourceId });
            return await action();
         } catch (error) {
            logError('Error al ejecutar acción con bloqueo', error as Error);
            throw error;
         } finally {
            this.releaseLock(resourceId);
         }
      }
      logInfo('No se pudo adquirir el bloqueo', { resourceId });
      return null;
   }
}

export const tabSyncService = new TabSyncService();
