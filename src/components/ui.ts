import { SearchResult } from '../types';
import { store, actions } from '../state';

export class UIComponents {
  private static instance: UIComponents;
  public elements: {
    resultsDiv: HTMLElement | null;
    loadMoreBtn: HTMLButtonElement | null;
    searchBtn: HTMLButtonElement | null;
    queryInput: HTMLInputElement | null;
    suggestionsList: HTMLElement | null;
  };

  private constructor() {
    this.initializeElements();
  }

  static getInstance(): UIComponents {
    if (!UIComponents.instance) {
      UIComponents.instance = new UIComponents();
    }
    return UIComponents.instance;
  }

  private initializeElements() {
    this.elements = {
      resultsDiv: document.getElementById('results'),
      loadMoreBtn: document.getElementById('loadMoreBtn') as HTMLButtonElement,
      searchBtn: document.getElementById('searchBtn') as HTMLButtonElement,
      queryInput: document.getElementById('queryInput') as HTMLInputElement,
      suggestionsList: document.getElementById('suggestionsList'),
    };
  }

  createResultCard(item: SearchResult): HTMLElement {
    const card = document.createElement('div');
    card.className = 'result-item';
    card.setAttribute('role', 'article');
    card.setAttribute('aria-labelledby', `result-title-${item.title}`);
    
    card.innerHTML = `
      <h2 id="result-title-${item.title}">${item.title}</h2>
      <p>${item.snippet}</p>
      ${item.url ? `<a href="${item.url}" class="result-link" aria-label="Read more about ${item.title}">Read more</a>` : ''}
    `;
    
    return card;
  }

  createLoadingSkeleton(): HTMLElement {
    const skeleton = document.createElement('div');
    skeleton.className = 'result-item skeleton';
    skeleton.setAttribute('aria-hidden', 'true');
    
    skeleton.innerHTML = `
      <div class="skeleton-title"></div>
      <div class="skeleton-text"></div>
      <div class="skeleton-text"></div>
    `;
    
    return skeleton;
  }

  showLoadingState() {
    const { searchBtn } = this.elements;
    if (searchBtn) {
      searchBtn.disabled = true;
      searchBtn.innerHTML = '<span class="spinner" role="status" aria-label="Loading"></span>Searching...';
    }
  }

  resetLoadingState() {
    const { searchBtn } = this.elements;
    if (searchBtn) {
      searchBtn.disabled = false;
      searchBtn.innerHTML = 'Search';
    }
  }

  showError(message: string) {
    const { resultsDiv } = this.elements;
    if (resultsDiv) {
      resultsDiv.innerHTML = `
        <div class="error-message" role="alert">
          <p>${message}</p>
          <button onclick="window.location.reload()">Try Again</button>
        </div>
      `;
    }
  }

  showNoResults() {
    const { resultsDiv } = this.elements;
    if (resultsDiv) {
      resultsDiv.innerHTML = `
        <div class="no-results" role="status">
          <p>No results found.</p>
          <p>Try different keywords or check your spelling.</p>
        </div>
      `;
    }
  }

  updateSuggestions(suggestions: string[]) {
    const { suggestionsList } = this.elements;
    if (suggestionsList) {
      suggestionsList.innerHTML = suggestions
        .map(suggestion => `
          <li>
            <button class="suggestion-item" role="option">
              ${suggestion}
            </button>
          </li>
        `)
        .join('');
    }
  }

  showSuggestions() {
    const { suggestionsList } = this.elements;
    if (suggestionsList) {
      suggestionsList.style.display = 'block';
    }
  }

  hideSuggestions() {
    const { suggestionsList } = this.elements;
    if (suggestionsList) {
      suggestionsList.style.display = 'none';
    }
  }

  updateLoadMoreButton(hasMore: boolean) {
    const { loadMoreBtn } = this.elements;
    if (loadMoreBtn) {
      loadMoreBtn.style.display = hasMore ? 'block' : 'none';
    }
  }

  highlightText(text: string, query: string): string {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}

export const ui = UIComponents.getInstance(); 