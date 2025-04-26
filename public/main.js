class SearchApp {
  constructor() {
    this.initialState = document.getElementById('initialState');
    this.resultsSection = document.getElementById('resultsSection');
    this.queryInput = document.getElementById('queryInput');
    this.searchBtn = document.getElementById('searchBtn');
    this.loadMoreBtn = document.getElementById('loadMoreBtn');
    this.resultsDiv = document.getElementById('results');
    this.suggestionsList = document.getElementById('suggestionsList');
    this.prevPageBtn = document.getElementById('prevPage');
    this.nextPageBtn = document.getElementById('nextPage');
    this.currentPageSpan = document.getElementById('currentPage');
    this.totalPagesSpan = document.getElementById('totalPages');
    this.currentQuery = '';
    this.currentPage = 1;
    this.totalPages = 1;
    this.isLoading = false;
    this.allResults = [];
    this.totalResults = 0;
    this.pageCache = {};
    this.PAGE_SIZE = 5;
    this.hasSearched = false;
    this.debounce = (func, wait) => {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
      };
    };
    this.init();
  }

  init() {
    this.hideInitialUI();
    this.bindEvents();
  }

  hideInitialUI() {
    this.resultsSection.classList.remove('show');
    this.prevPageBtn.style.display = 'none';
    this.nextPageBtn.style.display = 'none';
    document.querySelector('.pagination-info').style.display = 'none';
    this.loadMoreBtn.style.display = 'none';
  }

  bindEvents() {
    this.searchBtn.addEventListener('click', () => this.performSearch(1));
    this.queryInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.performSearch(1);
      }
    });
    this.loadMoreBtn.addEventListener('click', () => this.handleLoadMore());
    this.prevPageBtn.addEventListener('click', () => this.handlePrevPage());
    this.nextPageBtn.addEventListener('click', () => this.handleNextPage());
    this.queryInput.addEventListener('input', this.debounce(e => this.handleSuggestions(e), 300));
    document.addEventListener('keydown', e => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.queryInput.focus();
      }
    });
  }

  async fetchResults(query, page = 1) {
    const offset = (page - 1) * this.PAGE_SIZE;
    const res = await fetch(`/search?q=${encodeURIComponent(query)}&offset=${offset}`);
    const data = await res.json();
    const results = Array.isArray(data) ? data : data.results;
    const total = data.total || results.length * page;
    return { results, total };
  }

  showLoadingSkeletons() {
    this.resultsDiv.innerHTML = '';
    const skeletons = Array(this.PAGE_SIZE).fill(null).map(() => {
      const skeleton = document.createElement('div');
      skeleton.className = 'result-item loading-more-skeleton';
      skeleton.innerHTML = `
        <div class="loading-skeleton" style="width: 70%; height: 24px;"></div>
        <div class="loading-skeleton" style="width: 90%;"></div>
        <div class="loading-skeleton" style="width: 80%;"></div>
      `;
      return skeleton;
    });
    skeletons.forEach(skeleton => this.resultsDiv.appendChild(skeleton));
  }

  removeLoadingSkeletons() {
    const skeletons = this.resultsDiv.querySelectorAll('.loading-more-skeleton');
    skeletons.forEach(skeleton => skeleton.remove());
  }

  renderResults(results) {
    this.resultsDiv.innerHTML = '';
    results.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'result-item';
      card.style.animationDelay = `${index * 0.1}s`;
      card.innerHTML = `
        <h2>${item.title}</h2>
        <p>${item.snippet}</p>
      `;
      this.resultsDiv.appendChild(card);
    });
  }

  showSuggestions(suggestions) {
    this.suggestionsList.innerHTML = suggestions
      .map((suggestion, index) => `
        <button class="suggestion-item" style="--index: ${index}" role="option">
          ${suggestion}
        </button>
      `)
      .join('');
    this.suggestionsList.classList.add('visible');
  }

  hideSuggestions() {
    this.suggestionsList.classList.remove('visible');
  }

  updateLoadMoreButton() {
    if (this.allResults.length === 0) {
      this.loadMoreBtn.classList.remove('visible');
      setTimeout(() => {
        this.loadMoreBtn.style.display = 'none';
      }, 300);
      return;
    }
    this.loadMoreBtn.style.display = 'block';
    requestAnimationFrame(() => {
      this.loadMoreBtn.classList.add('visible');
    });
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.totalResults / this.PAGE_SIZE);
    this.currentPageSpan.textContent = this.currentPage;
    this.totalPagesSpan.textContent = this.totalPages;
    if (this.totalPages > 1) {
      this.prevPageBtn.style.display = '';
      this.nextPageBtn.style.display = '';
      document.querySelector('.pagination-info').style.display = '';
    } else {
      this.prevPageBtn.style.display = 'none';
      this.nextPageBtn.style.display = 'none';
      document.querySelector('.pagination-info').style.display = 'none';
    }
    this.prevPageBtn.disabled = this.currentPage === 1;
    this.nextPageBtn.disabled = this.currentPage === this.totalPages;
  }

  async performSearch(page = 1) {
    if (this.isLoading) return;
    this.isLoading = true;
    const query = this.queryInput.value;
    if (!query) {
      this.isLoading = false;
      return;
    }
    if (page === 1) {
      this.currentQuery = query;
      this.currentPage = 1;
      this.allResults = [];
      this.pageCache = {};
    }
    if (!this.hasSearched) {
      document.body.classList.add('search-active');
      this.initialState.classList.add('hide');
      setTimeout(() => {
        this.resultsSection.classList.add('show');
      }, 400);
      this.hasSearched = true;
    }
    this.resultsDiv.innerHTML = '';
    this.showLoadingSkeletons();
    this.searchBtn.disabled = true;
    this.searchBtn.innerHTML = '<span class="spinner" role="status" aria-label="Loading"></span>Searching...';
    try {
      let results, total;
      if (this.pageCache[page]) {
        ({ results, total } = this.pageCache[page]);
      } else {
        const fetched = await this.fetchResults(query, page);
        results = fetched.results;
        total = fetched.total;
        this.pageCache[page] = { results, total };
      }
      this.totalResults = total;
      this.allResults = results;
      if (results.length === 0) {
        this.loadMoreBtn.classList.remove('visible');
        setTimeout(() => {
          this.loadMoreBtn.style.display = 'none';
        }, 300);
        return;
      }
      this.removeLoadingSkeletons();
      this.renderResults(results);
      this.updatePagination();
      this.updateLoadMoreButton();
    } catch (error) {
      this.resultsDiv.innerHTML = `
        <div class="error-message" role="alert">
          <p>Error: ${error.message}</p>
          <button onclick="window.location.reload()">Try Again</button>
        </div>
      `;
    } finally {
      this.searchBtn.disabled = false;
      this.searchBtn.innerHTML = 'Search';
      this.isLoading = false;
    }
  }

  handleLoadMore() {
    if (this.isLoading) return;
    this.currentPage++;
    this.loadMoreBtn.disabled = true;
    this.loadMoreBtn.innerHTML = '<span class="spinner" role="status" aria-label="Loading"></span>Loading...';
    this.resultsDiv.innerHTML = '';
    this.showLoadingSkeletons();
    if (this.pageCache[this.currentPage]) {
      setTimeout(() => {
        const skeletons = this.resultsDiv.querySelectorAll('.loading-more-skeleton');
        skeletons.forEach(s => s.classList.add('fade-out'));
        setTimeout(() => {
          this.renderResults(this.pageCache[this.currentPage].results);
          this.updatePagination();
          this.updateLoadMoreButton();
          this.loadMoreBtn.disabled = false;
          this.loadMoreBtn.innerHTML = 'Load More';
        }, 250);
      }, 600);
    } else {
      this.performSearch(this.currentPage).then(() => {
        const skeletons = this.resultsDiv.querySelectorAll('.loading-more-skeleton');
        skeletons.forEach(s => s.classList.add('fade-out'));
        setTimeout(() => {
          this.loadMoreBtn.disabled = false;
          this.loadMoreBtn.innerHTML = 'Load More';
        }, 250);
      });
    }
  }

  handlePrevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      if (this.pageCache[this.currentPage]) {
        this.paginateWithPush('left', () => {
          this.renderResults(this.pageCache[this.currentPage].results);
          this.updatePagination();
          this.updateLoadMoreButton();
        });
      } else {
        this.paginateWithPush('left', () => this.performSearch(this.currentPage));
      }
    }
  }

  handleNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      if (this.pageCache[this.currentPage]) {
        this.paginateWithPush('right', () => {
          this.renderResults(this.pageCache[this.currentPage].results);
          this.updatePagination();
          this.updateLoadMoreButton();
        });
      } else {
        this.paginateWithPush('right', () => this.performSearch(this.currentPage));
      }
    }
  }

  paginateWithPush(direction, renderFn) {
    this.resultsDiv.classList.remove('slide-in-left', 'slide-in-right', 'slide-out-left', 'slide-out-right');
    void this.resultsDiv.offsetWidth;
    if (direction === 'right') {
      this.resultsDiv.classList.add('slide-out-left');
    } else {
      this.resultsDiv.classList.add('slide-out-right');
    }
    setTimeout(() => {
      renderFn();
      this.resultsDiv.classList.remove('slide-out-left', 'slide-out-right');
      void this.resultsDiv.offsetWidth;
      if (direction === 'right') {
        this.resultsDiv.classList.add('slide-in-right');
      } else {
        this.resultsDiv.classList.add('slide-in-left');
      }
      setTimeout(() => {
        this.resultsDiv.classList.remove('slide-in-right', 'slide-in-left');
      }, 350);
    }, 350);
  }

  async handleSuggestions(e) {
    const query = e.target.value;
    if (query.length >= 2) {
      try {
        const res = await fetch(`/suggestions?q=${encodeURIComponent(query)}`);
        const suggestions = await res.json();
        this.showSuggestions(suggestions);
      } catch (error) {
        this.hideSuggestions();
      }
    } else {
      this.hideSuggestions();
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => document.body.classList.add('app-loaded'), 80);
  new SearchApp();
}); 