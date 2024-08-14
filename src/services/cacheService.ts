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
    localStorage.setItem(key, JSON.stringify(cacheItem));
  }

  get<T>(key: string): T | null {
    const memoryItem = this.memoryCache[key] as CacheItem<T> | undefined;
    if (memoryItem && this.isValid(memoryItem.timestamp)) {
      return memoryItem.data;
    }

    const storedItem = localStorage.getItem(key);
    if (storedItem) {
      const parsedItem: CacheItem<T> = JSON.parse(storedItem);
      if (this.isValid(parsedItem.timestamp)) {
        this.memoryCache[key] = parsedItem;
        return parsedItem.data;
      }
    }

    return null;
  }

  remove(key: string): void {
    delete this.memoryCache[key];
    localStorage.removeItem(key);
  }

  clear(): void {
    this.memoryCache = {};
    localStorage.clear();
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
}

export const cacheService = new CacheService();
