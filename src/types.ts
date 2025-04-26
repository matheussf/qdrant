export interface SearchResult {
  title: string;
  snippet: string;
  url?: string;
  score?: number;
  metadata?: Record<string, any>;
}

export interface SearchState {
  offset: number;
  currentQuery: string;
  isLoading: boolean;
  error: string | null;
  results: SearchResult[];
  hasMore: boolean;
  searchHistory: string[];
  filters: SearchFilters;
}

export interface SearchFilters {
  sortBy: 'relevance' | 'date' | 'score';
  dateRange?: {
    start: Date;
    end: Date;
  };
  categories?: string[];
}

export interface AppState {
  search: SearchState;
} 