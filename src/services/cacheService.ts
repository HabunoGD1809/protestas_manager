import { PaginatedResponse } from '../types';

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const CACHE_DURATION = 0.01 * 60 * 1000; // 5 minutos en milisegundos

class CacheService {
  private memoryCache: { [key: string]: CacheItem<unknown> } = {};

  set<T>(key: string, data: T): void {
    const cacheItem: CacheItem<T> = { data, timestamp: Date.now() };
    this.memoryCache[key] = cacheItem;
    this.notifyUpdate(key);
  }

  get<T>(key: string): T | null {
    const memoryItem = this.memoryCache[key] as CacheItem<T> | undefined;
    if (memoryItem && this.isValid(memoryItem.timestamp)) {
      return memoryItem.data;
    }
    return null;
  }

  remove(key: string): void {
    delete this.memoryCache[key];
    this.notifyUpdate(key);
  }

  clear(): void {
    this.memoryCache = {};
    this.notifyUpdate('all');
  }

  private isValid(timestamp: number): boolean {
    return Date.now() - timestamp < CACHE_DURATION;
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
    Object.keys(this.memoryCache).forEach(cacheKey => {
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
}

export const cacheService = new CacheService();
