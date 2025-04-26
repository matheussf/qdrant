import { SearchResult, SearchFilters } from '../types';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const PAGE_SIZE = 5;

interface CacheEntry {
  results: SearchResult[];
  timestamp: number;
}

class SearchService {
  private cache: Map<string, CacheEntry> = new Map();

  private getCacheKey(query: string, offset: number, filters: SearchFilters): string {
    return `${query}-${offset}-${JSON.stringify(filters)}`;
  }

  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < CACHE_DURATION;
  }

  private async fetchWithRetry(url: string, retries = 3): Promise<Response> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.fetchWithRetry(url, retries - 1);
      }
      throw error;
    }
  }

  async search(
    query: string,
    offset: number = 0,
    filters: SearchFilters = { sortBy: 'relevance' }
  ): Promise<SearchResult[]> {
    const cacheKey = this.getCacheKey(query, offset, filters);
    const cachedResult = this.cache.get(cacheKey);

    if (cachedResult && this.isCacheValid(cachedResult)) {
      return cachedResult.results;
    }

    try {
      const queryParams = new URLSearchParams({
        q: query,
        offset: offset.toString(),
        sortBy: filters.sortBy,
        ...(filters.dateRange && {
          startDate: filters.dateRange.start.toISOString(),
          endDate: filters.dateRange.end.toISOString(),
        }),
        ...(filters.categories && {
          categories: filters.categories.join(','),
        }),
      });

      const response = await this.fetchWithRetry(`/search?${queryParams}`);
      const results = await response.json();

      this.cache.set(cacheKey, {
        results,
        timestamp: Date.now(),
      });

      return results;
    } catch (error) {
      console.error('Search error:', error);
      throw new Error('Failed to fetch search results. Please try again later.');
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  async getSuggestions(query: string): Promise<string[]> {
    if (!query) return [];

    try {
      const response = await this.fetchWithRetry(`/suggestions?q=${encodeURIComponent(query)}`);
      const suggestions = await response.json();
      return suggestions;
    } catch (error) {
      console.error('Suggestions error:', error);
      return [];
    }
  }
}

export const searchService = new SearchService(); 