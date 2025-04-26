// Constants
const PAGE_SIZE = 5;

// State management
let state = {
  offset: 0,
  currentQuery: '',
};

// DOM Elements
const elements = {
  resultsDiv: document.getElementById('results'),
  loadMoreBtn: document.getElementById('loadMoreBtn'),
  searchBtn: document.getElementById('searchBtn'),
  queryInput: document.getElementById('queryInput'),
};

// Initialize
document.body.style.overflowY = 'hidden';

// Event Listeners
function initializeEventListeners() {
  elements.searchBtn.addEventListener('click', () => performSearch(true));
  elements.queryInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') performSearch(true);
  });
  elements.loadMoreBtn.addEventListener('click', () => performSearch(false));
}

// UI Updates
function updateUI(results) {
  if (results.length === PAGE_SIZE) {
    elements.loadMoreBtn.style.display = 'block';
  } else {
    elements.loadMoreBtn.style.display = 'none';
  }
}

function showLoadingState() {
  elements.searchBtn.disabled = true;
  elements.searchBtn.innerHTML = '<span class="spinner"></span>Searching...';
}

function resetLoadingState() {
  elements.searchBtn.disabled = false;
  elements.searchBtn.innerHTML = 'Search';
}

function showError(message) {
  elements.resultsDiv.textContent = `Error: ${message}`;
}

function showNoResults() {
  elements.resultsDiv.textContent = "No results found.";
}

function createResultCard(item) {
  const card = document.createElement('div');
  card.className = 'result-item';
  card.innerHTML = `
    <h2>${item.title}</h2>
    <p>${item.snippet}</p>
  `;
  return card;
}

// Search functionality
async function performSearch(reset = true) {
  const query = elements.queryInput.value;
  if (!query) return;
  
  if (reset || query !== state.currentQuery) {
    state.offset = 0;
    elements.resultsDiv.innerHTML = '';
    state.currentQuery = query;
  }
  
  showLoadingState();
  
  try {
    const res = await fetch(`/search?q=${encodeURIComponent(query)}&offset=${state.offset}`);
    const results = await res.json();
    
    if (results.error) {
      showError(results.error);
      return;
    }
    
    if (results.length === 0) {
      showNoResults();
      return;
    }
    
    updateUI(results);
    state.offset += PAGE_SIZE;
    
    results.forEach(item => {
      elements.resultsDiv.appendChild(createResultCard(item));
    });
  } catch (error) {
    showError(error.message);
  } finally {
    resetLoadingState();
  }
}

// Initialize the application
initializeEventListeners(); 