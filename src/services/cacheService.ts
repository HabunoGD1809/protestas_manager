import { PaginatedResponse } from '../types';
import { api } from './api';
import { logError, logInfo } from './loggingService';
import * as lzstring from 'lz-string';

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

interface CacheConfig {
  cacheDuration: number;
  maxCacheSize: number;
}

type CachePolicy = 'LRU' | 'LFU';

class CacheService {
  private memoryCache: { [key: string]: CacheItem<unknown> } = {};
  private cacheKeys: string[] = [];
  private config: CacheConfig;
  private policy: CachePolicy = 'LRU';
  private accessCount: { [key: string]: number } = {};

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      cacheDuration: 0.1 * 60 * 1000, // 5 minutos por defecto
      maxCacheSize: 100, // 100 elementos por defecto
      ...config
    };
  }

  setConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
  }

  setPolicy(policy: CachePolicy): void {
    this.policy = policy;
  }

  set<T>(key: string, data: T): void {
    this.enforceCacheLimit();

    const compressedData = lzstring.compress(JSON.stringify(data));
    const cacheItem: CacheItem<string> = { data: compressedData, timestamp: Date.now() };
    this.memoryCache[key] = cacheItem;
    this.cacheKeys.push(key);
    this.accessCount[key] = 0;
    this.notifyUpdate(key);
    this.persistToLocalStorage(key, cacheItem);
  }

  get<T>(key: string): T | null {
    let item = this.memoryCache[key] as CacheItem<string> | undefined;

    if (!item) {
      item = this.getFromLocalStorage<string>(key);
      if (item) this.memoryCache[key] = item;
    }

    if (item && this.isValid(item.timestamp)) {
      this.accessCount[key] = (this.accessCount[key] || 0) + 1;
      const decompressedData = lzstring.decompress(item.data);
      return JSON.parse(decompressedData) as T;
    }

    return null;
  }

  remove(key: string): void {
    delete this.memoryCache[key];
    this.cacheKeys = this.cacheKeys.filter(k => k !== key);
    delete this.accessCount[key];
    this.removeFromLocalStorage(key);
    this.notifyUpdate(key);
  }

  clear(): void {
    this.memoryCache = {};
    this.cacheKeys = [];
    this.accessCount = {};
    localStorage.clear();
    this.notifyUpdate('all');
  }

  private isValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.config.cacheDuration;
  }

  private enforceCacheLimit(): void {
    while (this.cacheKeys.length >= this.config.maxCacheSize) {
      const keyToRemove = this.policy === 'LRU' ? this.getLRUKey() : this.getLFUKey();
      this.remove(keyToRemove);
    }
  }

  private getLRUKey(): string {
    return this.cacheKeys[0];
  }

  private getLFUKey(): string {
    return Object.entries(this.accessCount).reduce((a, b) => a[1] < b[1] ? a : b)[0];
  }

  setPaginated<T>(key: string, data: PaginatedResponse<T>, page: number, pageSize: number): void {
    const paginatedKey = `${key}_${page}_${pageSize}`;
    this.set(paginatedKey, data);
  }

  getPaginated<T>(key: string, page: number, pageSize: number): PaginatedResponse<T> | null {
    const paginatedKey = `${key}_${page}_${pageSize}`;
    return this.get(paginatedKey);
  }

  private notifyUpdate(key: string): void {
    window.dispatchEvent(new CustomEvent('cacheUpdated', { detail: { key } }));
  }

  updateItemInPaginatedList<T>(
    key: string,
    updatedItem: T,
    identifierField: keyof T
  ): void {
    this.cacheKeys.forEach(cacheKey => {
      if (cacheKey.startsWith(`${key}_`)) {
        const cachedData = this.get(cacheKey) as PaginatedResponse<T> | null;
        if (cachedData) {
          cachedData.items = cachedData.items.map(item =>
            item[identifierField] === updatedItem[identifierField] ? updatedItem : item
          );
          this.set(cacheKey, cachedData);
        }
      }
    });
  }

  private persistToLocalStorage<T>(key: string, item: CacheItem<T>): void {
    try {
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      logError('Error persisting to localStorage:', error as Error);
    }
  }

  private getFromLocalStorage<T>(key: string): CacheItem<T> | undefined {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : undefined;
    } catch (error) {
      logError('Error retrieving from localStorage:', error as Error);
      return undefined;
    }
  }

  private removeFromLocalStorage(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      logError('Error removing from localStorage:', error as Error);
    }
  }

  async setWithImmediateUpdate<T>(key: string, data: T, endpoint: string): Promise<void> {
    this.set(key, data);
    try {
      await api.post(endpoint, data);
      logInfo('Datos actualizados inmediatamente en el backend', { key, endpoint });
    } catch (error) {
      logError('Error al actualizar el backend:', error as Error);
      this.remove(key); // Revertimos el cambio en el caché si falla la actualización
      throw error;
    }
  }

  async updateItemInPaginatedListWithImmediateUpdate<T>(
    key: string,
    updatedItem: T,
    identifierField: keyof T,
    endpoint: string
  ): Promise<void> {
    this.updateItemInPaginatedList(key, updatedItem, identifierField);
    try {
      await api.put(`${endpoint}/${updatedItem[identifierField]}`, updatedItem);
      logInfo('Item actualizado inmediatamente en el backend', { key, endpoint, id: updatedItem[identifierField] });
    } catch (error) {
      logError('Error al actualizar el backend:', error as Error);
      this.remove(key); // Revertimos el cambio en el caché si falla la actualización
      throw error;
    }
  }

  markAsStale(key: string): void {
    const item = this.memoryCache[key];
    if (item) {
      item.timestamp = 0; // Marcar como caducado
      this.notifyUpdate(key);
    }
  }

  markAllAsStale(): void {
    this.cacheKeys.forEach(key => this.markAsStale(key));
  }

  cleanStaleData(): void {
    const now = Date.now();
    this.cacheKeys.forEach(key => {
      const item = this.memoryCache[key];
      if (item && now - item.timestamp >= this.config.cacheDuration) {
        this.remove(key);
      }
    });
  }

  invalidateRelatedCache(url: string): void {
    const relatedKeys = this.cacheKeys.filter(key => key.includes(url));
    relatedKeys.forEach(key => this.remove(key));
  }
}

export const cacheService = new CacheService();
