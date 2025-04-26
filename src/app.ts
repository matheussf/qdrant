import { store, actions } from './state';
import { searchService } from './services/search';
import { ui } from './components/ui';
import { debounce } from './utils';

class App {
  private static instance: App;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): App {
    if (!App.instance) {
      App.instance = new App();
    }
    return App.instance;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    this.setupIntersectionObserver();
    
    this.isInitialized = true;
  }

  private setupEventListeners() {
    const { queryInput, searchBtn, loadMoreBtn } = ui.elements;

    if (queryInput) {
      queryInput.addEventListener('input', debounce(async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const query = target.value;
        
        if (query.length >= 2) {
          const suggestions = await searchService.getSuggestions(query);
          ui.updateSuggestions(suggestions);
          ui.showSuggestions();
        } else {
          ui.hideSuggestions();
        }
      }, 300));

      queryInput.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.performSearch(true);
        }
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.performSearch(true));
    }

    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => this.performSearch(false));
    }
  }

  private setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const { queryInput } = ui.elements;
        if (queryInput) {
          queryInput.focus();
        }
      }
    });
  }

  private setupIntersectionObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const { loadMoreBtn } = ui.elements;
            if (loadMoreBtn && loadMoreBtn.style.display !== 'none') {
              this.performSearch(false);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const { loadMoreBtn } = ui.elements;
    if (loadMoreBtn) {
      observer.observe(loadMoreBtn);
    }
  }

  private async performSearch(reset: boolean) {
    const { queryInput } = ui.elements;
    if (!queryInput) return;

    const query = queryInput.value;
    if (!query) return;

    const state = store.getState();
    
    if (reset || query !== state.search.currentQuery) {
      actions.setSearchState({
        offset: 0,
        currentQuery: query,
        results: [],
        error: null,
      });
      ui.elements.resultsDiv!.innerHTML = '';
    }

    actions.setSearchState({ isLoading: true });
    ui.showLoadingState();

    try {
      const results = await searchService.search(
        query,
        state.search.offset,
        state.search.filters
      );

      actions.setSearchState({
        results: [...state.search.results, ...results],
        hasMore: results.length === 5,
        offset: state.search.offset + 5,
        isLoading: false,
        error: null,
      });

      actions.addToSearchHistory(query);

      if (results.length === 0 && state.search.offset === 0) {
        ui.showNoResults();
      } else {
        results.forEach(item => {
          const card = ui.createResultCard(item);
          ui.elements.resultsDiv!.appendChild(card);
        });
      }

      ui.updateLoadMoreButton(results.length === 5);
    } catch (error) {
      actions.setSearchState({
        error: error instanceof Error ? error.message : 'An error occurred',
        isLoading: false,
      });
      ui.showError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      ui.resetLoadingState();
    }
  }
}

export const app = App.getInstance(); 