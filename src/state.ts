import { AppState, SearchState } from './types';

const initialState: AppState = {
  search: {
    offset: 0,
    currentQuery: '',
    isLoading: false,
    error: null,
    results: [],
    hasMore: false,
    searchHistory: [],
    filters: {
      sortBy: 'relevance',
    },
  }
};

class Store {
  private state: AppState;
  private listeners: Set<() => void>;

  constructor(initialState: AppState) {
    this.state = initialState;
    this.listeners = new Set();
  }

  getState(): AppState {
    return this.state;
  }

  setState(newState: Partial<AppState>) {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }
}

export const store = new Store(initialState);

// Action creators
export const actions = {
  setSearchState: (searchState: Partial<SearchState>) => {
    store.setState({ search: { ...store.getState().search, ...searchState } });
  },

  addToSearchHistory: (query: string) => {
    const { searchHistory } = store.getState().search;
    const newHistory = [query, ...searchHistory.filter(q => q !== query)].slice(0, 10);
    store.setState({ search: { ...store.getState().search, searchHistory: newHistory } });
  }
}; 