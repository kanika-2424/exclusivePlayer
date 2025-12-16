
// Add before SeriesPage function
if (typeof window.seriesPageEnterState === 'undefined') {
  window.seriesPageEnterState = {
    enterPressTimer: null,
    isLongPressExecuted: false,
    isProcessingEnter: false
  };
}

if (typeof window.seriesPageState === 'undefined') {
  window.seriesPageState = {
    currentFocusIndex: 0,
    currentCategoryIndex: 0,
    currentSection: "series",
    lastFocusedCategory: 0
  };
}



function SeriesPage() {
  // CONFIG (match seriesPage)
  const CARDS_PER_ROW = 7;
  const ROWS_PER_LOAD = 3;
  const PAGE_SIZE = CARDS_PER_ROW * ROWS_PER_LOAD; // Load more chunk

  let categories = []; // [{ id, name, parent_id, series: [], _seriesCount }]
  let seriesByCategory = {}; // map category_id -> [series]
  let selectedCategoryId = null;
  let visibleCount = PAGE_SIZE;
  let lastFocusedCategory = 0;

  let isSearchInputActive = false; // For category search
  let isHeaderSearchActive = false; // For header search

  // Focus / navigation state
  let currentSection = "series"; // "header" | "search" | "categories" | "expand" | "series"
  let currentFocusIndex = 0; // focused card index
  let currentCategoryIndex = 0; // focused category index for sidebar
  let isExpanded = false;
  let scrollToTopHandler; // Add this line
let isMenuDotsActive = false; // Track if menu dots are focused

  let isRestoringState = false;
const LONG_PRESS_DURATION = 500;


const currentPlaylistName = JSON.parse(
  localStorage.getItem("selectedPlaylist")
).playlistName;

const currentPlaylist = JSON.parse(
  localStorage.getItem("playlistsData")
).filter((pl) => pl.playlistName === currentPlaylistName)[0];


const adultsCategories = currentPlaylist.adultsCategories || [];
const unlockedSeriesAdultCatIds = new Set();

const enterState = window.seriesPageEnterState;
const pageState = window.seriesPageState;

// Get favorites data (same structure as movies)

const favouriteSeriesIds = Array.isArray(currentPlaylist.favouriteSeries)
  ? currentPlaylist.favouriteSeries
  : [];

function setFocusOnMenuDots() {
  removeAllFocus();
  const menuDots = document.querySelector('.menu-dots');
  if (menuDots) {
    menuDots.classList.add('focused');
  }
  currentSection = "menuDots";
  isMenuDotsActive = true;
}
  // Check if a category is adult based on name patterns
function isSeriesAdultCategory(categoryName) {
  if (!categoryName) return false;
  const normalized = categoryName.trim().toLowerCase();
  
  const configuredAdultCategories = adultsCategories || [];
  if (configuredAdultCategories.includes(normalized)) return true;
  
  return /(adult|xxx|18\+|18\s*plus|sex|porn|erotic|nsfw|mature)/i.test(normalized);
}

// Check if a series belongs to an adult category
function isSeriesAdult(series) {
  if (!series) return false;
  
  const seriesCategoryIds = new Set();
  if (series.category_id != null) {
    seriesCategoryIds.add(Number(series.category_id));
  }
  if (Array.isArray(series.category_ids)) {
    series.category_ids.forEach(cid => seriesCategoryIds.add(Number(cid)));
  }
  
  for (const catId of seriesCategoryIds) {
    const category = (window.seriesCategories || window.allseriesCategories || []).find(
      c => (c.category_id === catId || c.id === catId)
    );
    if (category && isSeriesAdultCategory(category.category_name || category.name)) {
      return true;
    }
  }
  
  return false;
}

// Determine if a series card should be blurred
function shouldBlurSeries(series) {
  const parentalLockEnabled = !!getParentalPassword();
  if (!parentalLockEnabled) return false;
  
  if (!isSeriesAdult(series)) return false;
  
  const currentCategory = categories.find(c => String(c.id) === String(selectedCategoryId));
  if (currentCategory && isSeriesAdultCategory(currentCategory.name)) {
    return false;
  }
  
  const specialCategoryIds = ["-1", "-2", "-3"];
  return specialCategoryIds.includes(String(selectedCategoryId));
}

// Get parental password
function getParentalPassword() {
  try {
    const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist")) || {};
    return selectedPlaylist.parentalPassword || "";
  } catch (error) {
    return "";
  }
}



// Show password modal
function showPasswordModal(seriesId, seriesName, onSuccess) {
  const modalHTML = `
    <div class="password-modal-overlay" id="passwordModalOverlay">
      <div class="password-modal">
        <div class="password-modal-header">
          <h2>Parental Control</h2>
          <p>Enter password to access "${seriesName}"</p>
        </div>
        <div class="password-modal-body">
          <div class="password-input-wrapper">
            <input 
              type="password" 
              id="passwordModalInput" 
              class="password-modal-input password-input-focused" 
              placeholder="Enter Password"
              autocomplete="off"
            />
            <i class="fa fa-eye password-eye-icon" id="passwordEyeIcon"></i>
          </div>
        </div>
        <div class="password-modal-footer">
          <button class="password-modal-btn password-submit-btn password-btn-focused" id="passwordSubmitBtn">
            Submit
          </button>
          <button class="password-modal-btn password-cancel-btn" id="passwordCancelBtn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  const overlay = document.getElementById('passwordModalOverlay');
  const input = document.getElementById('passwordModalInput');
  const eyeIcon = document.getElementById('passwordEyeIcon');
  const submitBtn = document.getElementById('passwordSubmitBtn');
  const cancelBtn = document.getElementById('passwordCancelBtn');
  
  let focusIndex = 0;
  
  setTimeout(() => input.focus(), 100);
  
  function togglePasswordVisibility() {
    if (input.type === 'password') {
      input.type = 'text';
      eyeIcon.classList.remove('fa-eye');
      eyeIcon.classList.add('fa-eye-slash');
    } else {
      input.type = 'password';
      eyeIcon.classList.remove('fa-eye-slash');
      eyeIcon.classList.add('fa-eye');
    }
  }
  
  eyeIcon.addEventListener('click', togglePasswordVisibility);
  
  function updateModalFocus() {
    input.classList.remove('password-input-focused');
    submitBtn.classList.remove('password-btn-focused');
    cancelBtn.classList.remove('password-btn-focused');
    
    if (focusIndex === 0) {
      input.classList.add('password-input-focused');
      input.focus();
    } else if (focusIndex === 1) {
      submitBtn.classList.add('password-btn-focused');
      input.blur();
    } else if (focusIndex === 2) {
      cancelBtn.classList.add('password-btn-focused');
      input.blur();
    }
  }
  
  function verifyPassword() {
    const enteredPassword = input.value.trim();
    const correctPassword = getParentalPassword();
    
    if (!enteredPassword) {
      if (typeof Toaster !== 'undefined') {
        Toaster.showToast("error", "Please enter password");
      }
      return;
    }
    
    if (enteredPassword === correctPassword) {
      const currentCategory = categories.find(c => String(c.id) === String(selectedCategoryId));
      if (currentCategory && isSeriesAdultCategory(currentCategory.name)) {
        unlockedSeriesAdultCatIds.add(String(selectedCategoryId));
      }
      
      if (typeof Toaster !== 'undefined') {
        Toaster.showToast("success", "Access Granted");
      }
      closeModal();
      if (onSuccess) onSuccess();
    } else {
      if (typeof Toaster !== 'undefined') {
        Toaster.showToast("error", "Incorrect Password");
      }
      input.value = '';
      input.focus();
    }
  }
  
  function closeModal() {
    if (overlay) {
      overlay.remove();
    }
    document.removeEventListener('keydown', handleModalKeydown);
    localStorage.setItem("currentPage", "seriesPage");
  }
  
  submitBtn.addEventListener('click', verifyPassword);
  cancelBtn.addEventListener('click', closeModal);
  
  function handleModalKeydown(e) {
    if (e.key === 'ArrowDown') {
      focusIndex = Math.min(2, focusIndex + 1);
      updateModalFocus();
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      focusIndex = Math.max(0, focusIndex - 1);
      updateModalFocus();
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && focusIndex > 0) {
      focusIndex--;
      updateModalFocus();
      e.preventDefault();
    } else if (e.key === 'ArrowRight' && focusIndex < 2) {
      focusIndex++;
      updateModalFocus();
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (focusIndex === 0 || focusIndex === 1) {
        verifyPassword();
      } else if (focusIndex === 2) {
        closeModal();
      }
      e.preventDefault();
    } else if (e.key === 'Escape' || e.keyCode === 10009 || e.key === 'Back') {
      closeModal();
      e.preventDefault();
    }
  }
  
  document.addEventListener('keydown', handleModalKeydown);
  localStorage.setItem("currentPage", "passwordModal");
}

  // Get continue watching data from current playlist
const continueWatchingSeries = Array.isArray(currentPlaylist.continueWatchingSeries)
  ? currentPlaylist.continueWatchingSeries
  : [];

const continueWatchingIds = continueWatchingSeries.map(item => Number(item.itemId));


  // DOM helpers
  const qs = (s) => document.querySelector(s);
  const qsa = (s) => Array.from(document.querySelectorAll(s));

  // Utility: group series by category_id (supports a couple of possible global names)
  function buildCategoryMap() {
    const allCats = Array.isArray(window.seriesCategories)
      ? window.seriesCategories
      : (Array.isArray(window.allseriesCategories) ? window.allseriesCategories : []);
    const allSeries = Array.isArray(window.allSeriesStreams) ? window.allSeriesStreams : [];


      const allFavoritesSeries = allSeries.filter((s) =>
    favouriteSeriesIds.includes(s.series_id || s.stream_id)
  );


    const favoritesCategory = {
    id: "-1",
    name: "Favorites",
    parent_id: 0,
    movies: allFavoritesSeries,
    _movieCount: allFavoritesSeries.length
  };


  // Get continue watching series
const allContinueWatchingSeries = allSeries.filter((s) => {
  const isInContinueWatching = continueWatchingIds.includes(Number(s.series_id || s.stream_id));
  return isInContinueWatching;
});

const continueWatchingCategory = {
  id: "-2",
  name: "Continue Watching",
  parent_id: 0,
  movies: allContinueWatchingSeries,
  _movieCount: allContinueWatchingSeries.length
};


    // Normalize categories into our structure
   const normalizedCategories = allCats.map(c => ({
    id: String(c.category_id || c.id),
    name: c.category_name || c.name || `Cat ${c.category_id || c.id}`,
    parent_id: c.parent_id || 0,
    movies: [],
    _movieCount: 0
  }));

categories = [favoritesCategory, continueWatchingCategory, ...normalizedCategories];


    // Build map skeleton
    seriesByCategory = {};
    categories.forEach(c => seriesByCategory[c.id] = []);

      seriesByCategory["-1"] = allFavoritesSeries;
      seriesByCategory["-2"] = allContinueWatchingSeries;



    // Group series
    for (const s of allSeries) {
      const cid = String(s.category_id || (Array.isArray(s.category_ids) && s.category_ids[0]) || "-3");
      if (!seriesByCategory[cid]) seriesByCategory[cid] = [];
      seriesByCategory[cid].push(s);
    }

    // Attach to categories and compute counts
    categories.forEach(c => {
  if (c.id === "-1" || c.id === "-2") return; // Add -2 here

      c.movies = seriesByCategory[c.id] || [];
      c._movieCount = (c.movies && c.movies.length) || 0;
    });

    // If no selectedCategoryId, pick first with series or first category
    if (!selectedCategoryId) {
      const withSeries = categories.find(c => c._movieCount > 0);
      selectedCategoryId = withSeries ? withSeries.id : (categories[0] ? categories[0].id : null);
    }
  }


  function applySortingToSeries(series) {
  const sortValue = localStorage.getItem("seriesSortValue") || "default";
  
  if (sortValue === "default") {
    return series; // Keep original order
  }
  
  const sorted = [...series]; // Create a copy to avoid mutating original
  
  switch (sortValue) {
    case "az":
      return sorted.sort((a, b) => {
        const nameA = (a.name || a.title || "").toLowerCase();
        const nameB = (b.name || b.title || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
    case "za":
      return sorted.sort((a, b) => {
        const nameA = (a.name || a.title || "").toLowerCase();
        const nameB = (b.name || b.title || "").toLowerCase();
        return nameB.localeCompare(nameA);
      });
      
    case "recent":
      return sorted.sort((a, b) => {
        const dateA = new Date(a.added || a.date_added || 0);
        const dateB = new Date(b.added || b.date_added || 0);
        return dateB - dateA; // Most recent first
      });
      
    case "top":
      return sorted.sort((a, b) => {
        const ratingA = parseFloat(a.rating_5based || a.rating || 0);
        const ratingB = parseFloat(b.rating_5based || b.rating || 0);
        return ratingB - ratingA; // Highest rated first
      });
      
    default:
      return series;
  }
}
  // Render sidebar categories (same markup as movies so CSS applies)
function renderCategoriesUI() {
  const wrapper = qs(".movies-categories-list");
  if (!wrapper) return;
  
  wrapper.innerHTML = categories
    .map((c, idx) => {
      const isAdultCat = isSeriesAdultCategory(c.name);
      const parentalLockEnabled = !!getParentalPassword();
      const isCatUnlocked = unlockedSeriesAdultCatIds.has(String(c.id));
      const shouldBlur = parentalLockEnabled && isAdultCat && !isCatUnlocked;
      
      return `
      <div class="movies-category-item ${
        String(c.id) === String(selectedCategoryId) ? "active" : ""
      } ${shouldBlur ? 'movie-category-blurred' : ''}" 
           data-id="${c.id}" 
           data-idx="${idx}"
           data-category-name="${escapeHtml(c.name)}">
        ${shouldBlur ? '<i class="fas fa-lock movie-category-lock-icon"></i>' : ''}
        <span style="display: -webkit-box; text-align: center; margin: 0 auto; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; max-height: 1em;" class="" title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</span>
      </div>`;
    })
    .join("");

  const expandBtn = qs("#expandBtn");
  const categoriesEls = Array.from(wrapper.querySelectorAll(".movies-category-item"));
  if (expandBtn) {
    expandBtn.style.display = categoriesEls.length > 0 ? "flex" : "none";
  }
}

  // Helper: ensure visibleCount aligns to full rows like movies page
  function adjustToFullRow(count) {
    const remainder = count % CARDS_PER_ROW;
    return remainder === 0 ? count : count + (CARDS_PER_ROW - remainder);
  }

  visibleCount = adjustToFullRow(visibleCount + PAGE_SIZE);

  // Build a single series card HTML (keeps classes identical to movies cards so CSS works)
 function buildMovieCardHTML(s) {
  const img = s.cover || s.stream_icon || "/assets/noImageFound.png";
  const title = s.name || s.title || "Untitled";
  const rating = isNaN(Number(s.rating_5based)) ? 0 : Math.min(5, Number(s.rating_5based));
  const desc = s.plot || s.overview || s.description || "";
  const seriesId = s.series_id || s.stream_id || s.id || "";

  const isFav = favouriteSeriesIds.includes(Number(seriesId));
  const showFavHeartIcon = String(selectedCategoryId) === "-1";
  const showHeart = showFavHeartIcon || isFav;

  const continueWatchingItem = continueWatchingSeries.find(
    item => Number(item.itemId) === Number(seriesId)
  );

  const showProgress = continueWatchingItem && continueWatchingItem.resumeTime > 0;
  const progressPercent = continueWatchingItem && continueWatchingItem.duration > 0
    ? Math.min(100, (continueWatchingItem.resumeTime / continueWatchingItem.duration) * 100)
    : 0;

  const shouldBlur = shouldBlurSeries(s);

  return `
    <div class="movie-card ${shouldBlur ? 'movie-blurred' : ''}" 
         data-movie-id="${seriesId}"
         data-is-adult="${shouldBlur}">
      <div class="movie-card-image-wrapper">
        <img src="${img}" alt="${escapeHtml(title)}" onerror="this.onerror=null;this.src='/assets/noImageFound.png'"/>
      </div>

      <div class="movie-rating-badge">
        <img src="/assets/star.png" alt="star" class="star-icon" />
        <span>${rating.toFixed(1)}</span>
      </div>

      ${showHeart ? '<img src="/assets/heart.png" alt="heart-icon" class="movie-card-heart-icon"/>' : ''}
      
      ${showProgress ? `
        <div class="episode-progress-bar">
          <div class="episode-progress-fill" style="width: ${progressPercent.toFixed(1)}%"></div>
        </div>
      ` : ''}
      
      ${shouldBlur ? '<div class="movie-blur-overlay"><i class="fa fa-lock"></i></div>' : ''}

      <div class="movie-hover">
        <img class="hover-play-btn" src="/assets/play.png" alt="play"/>
        <div class="hover-title">${escapeHtml(title)}</div>
        <span style="display: -webkit-box; margin: 0 auto; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; max-height: 3em;" class="description-text">${escapeHtml(desc)}</span>
      </div>
    </div>
  `;
}

  // Simple escaping to avoid XSS in injected strings
  function escapeHtml(str) {
    if (!str && str !== 0) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Render cards for selectedCategoryId up to visibleCount
 function renderCards() {
  const container = qs(".movies-grid");
  if (!container) return;
  const cat = categories.find(c => String(c.id) === String(selectedCategoryId));
  
  // Apply sorting before slicing
  const allSeries = cat && Array.isArray(cat.movies) ? cat.movies : [];
  const sortedSeries = applySortingToSeries(allSeries);
  const items = sortedSeries.slice(0, visibleCount);
  
 if (!items || items.length === 0) {
  container.innerHTML = ''; // Clear the grid
  movieCards = [];
  
  // Show centered message outside grid
  const gridContainer = qs(".movies-grid-container");
  let noDataDiv = qs(".movie-no-data-overlay");
  
  if (!noDataDiv) {
    noDataDiv = document.createElement('div');
    noDataDiv.className = 'movie-no-data-overlay';
    gridContainer.appendChild(noDataDiv);
  }
  
  noDataDiv.innerHTML = `
    <div class="movie-no-data-content">
      <p>No series found for this category.</p>
    </div>
  `;
  noDataDiv.style.display = 'flex';
  return;
}

// Remove no-data overlay if it exists (when series are present)
const noDataDiv = qs(".movie-no-data-overlay");
if (noDataDiv) {
  noDataDiv.style.display = 'none';
}
  container.innerHTML = items.map(buildMovieCardHTML).join("");
  movieCards = Array.from(container.querySelectorAll(".movie-card"));
}

  // Load more: increase visibleCount then render
  function loadMore() {
    const cat = categories.find(c => String(c.id) === String(selectedCategoryId));
    if (!cat) return;
    const total = (cat.movies || []).length;
    if (visibleCount >= total) return;
    visibleCount = Math.min(visibleCount + PAGE_SIZE, total);
    renderCards();
    setFocusOnCard(currentFocusIndex);
  }

  function setFocusOnScrollBtn() {
  removeAllFocus();
  const btn = qs("#scrollToTopBtn");
  if (btn) {
    btn.classList.add("focused");
  }
  currentSection = "scrollBtn";
}

  // Focus helpers
  let movieCards = [];
  function setFocusOnCard(index) {
const grid = qs(".movies-grid");
if (!grid) {
  movieCards = [];
  return;   // ← prevents crash
}



movieCards = Array.from(grid.querySelectorAll(".movie-card"));

    removeAllFocus();

    // Blur any input fields when focusing cards
    const searchInput = qs(".search-category-input");
    if (searchInput) searchInput.blur();

    if (!movieCards || movieCards.length === 0) {
      currentSection = "series";
      currentFocusIndex = 0;
      return;
    }
    index = Math.max(0, Math.min(index, movieCards.length - 1));
    currentFocusIndex = index;
    movieCards[index].classList.add("focused");
    movieCards[index].scrollIntoView({ block: "nearest", inline: "nearest"});
    currentSection = "series";
  }

  function setFocusOnCategory(index) {
    removeAllFocus();
    const items = Array.from(document.querySelectorAll(".movies-category-item"));
    if (!items || items.length === 0) return;

    index = Math.max(0, Math.min(index, items.length - 1));

    currentCategoryIndex = index;
    lastFocusedCategory = index;

    // Blur any input fields
    const searchInput = qs(".search-category-input");
    if (searchInput) searchInput.blur();

    items[index].classList.add("focused");
    items[index].scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
    currentSection = "categories";
  }

  function setFocusOnSearch() { // category search (sidebar search)
    removeAllFocus();
    const container = qs(".search-category-name"); // Parent container
    const input = qs(".search-category-input"); // Input element

    if (container && input) {
      container.classList.add("focused"); // Add focused to parent!
      input.blur(); // Keep input blurred
      isSearchInputActive = false; // Reset edit mode
    }
    currentSection = "search";
  }

 function setFocusOnHeaderSearch() { // header search (top)
  removeAllFocus();
  const container = qs(".search-container"); // Parent container
  const input = qs(".search-input"); // Input element

  if (container && input) {
    container.classList.add("focused"); // Add focused to parent!
    input.blur(); // Keep input blurred initially
    isHeaderSearchActive = false; // Reset edit mode
  }
  currentSection = "header";
}

  function setFocusOnExpandBtn() {
    removeAllFocus();
    const btn = qs("#expandBtn");
    if (btn) {
      btn.classList.add("focused");
      btn.scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
    }
    currentSection = "expand";
  }

  function removeAllFocus() {
    qsa(".movie-card").forEach(c => c.classList.remove("focused"));
    qsa(".movies-category-item").forEach(c => c.classList.remove("focused"));

    // Remove from parent containers
    const searchContainer = qs(".search-category-name");
    if (searchContainer) searchContainer.classList.remove("focused");

    const headerSearchContainer = qs(".search-container");
    if (headerSearchContainer) headerSearchContainer.classList.remove("focused");

    const expandBtn = qs("#expandBtn");
    if (expandBtn) expandBtn.classList.remove("focused");

    const scrollBtn = qs("#scrollToTopBtn");
if (scrollBtn) scrollBtn.classList.remove("focused");
  const menuDots = qs(".menu-dots");
  if (menuDots) menuDots.classList.remove("focused");
}

  // Category click handler (delegated)
function onCategoryClick(e) {
  const cat = e.target.closest(".movies-category-item");
  if (!cat) return;
  
  const catId = String(cat.dataset.id);
  const catName = cat.dataset.categoryName || categories.find(c => String(c.id) === catId).name;
  const isAdultCat = isSeriesAdultCategory(catName);
  const isUnlocked = unlockedSeriesAdultCatIds.has(catId);
  
  if (isAdultCat && !!getParentalPassword() && !isUnlocked) {
    showPasswordModal(null, catName, () => {
      unlockedSeriesAdultCatIds.add(catId);
      selectedCategoryId = catId;
      visibleCount = PAGE_SIZE;
      qsa(".movies-category-item").forEach((i) => i.classList.remove("active"));
      cat.classList.add("active");
      renderCards();
      
      // ⭐ Check if category has series
      const selectedCat = categories.find(c => String(c.id) === catId);
      if (selectedCat && selectedCat.movies && selectedCat.movies.length > 0) {
        setTimeout(() => setFocusOnCard(0), 50);
      } else {
        // No series - stay on category
        const catIdx = cat.dataset.idx;
        setTimeout(() => setFocusOnCategory(Number(catIdx)), 50);
      }
    });
    return;
  }
  
  selectedCategoryId = catId;
  visibleCount = PAGE_SIZE;
  qsa(".movies-category-item").forEach(i => i.classList.remove("active"));
  cat.classList.add("active");
  renderCards();
  
  // ⭐ Check if category has series
  const selectedCat = categories.find(c => String(c.id) === catId);
  if (selectedCat && selectedCat.movies && selectedCat.movies.length > 0) {
    setTimeout(() => setFocusOnCard(0), 50);
  } else {
    // No series - stay on category
    const catIdx = cat.dataset.idx;
    setTimeout(() => setFocusOnCategory(Number(catIdx)), 50);
  }
}

  // Card click handler (delegated)
 function onCardClick(e) {
  const card = e.target.closest(".movie-card");
  if (!card) return;
  
  const seriesId = Number(card.dataset.movieId);
  const isAdult = card.dataset.isAdult === "true";
  
  if (isAdult) {
    const seriesObj = (window.allSeriesStreams || []).find(
      s => Number(s.series_id || s.stream_id || s.id) === seriesId
    );
    const seriesName = seriesObj ? (seriesObj.name || seriesObj.title || "Series") : "Series";
    
    showPasswordModal(seriesId, seriesName, () => {
      openSeriesDetail(seriesId);
    });
    return;
  }
  
  openSeriesDetail(seriesId);
}

function openSeriesDetail(seriesId) {
  const seriesObj = (window.allSeriesStreams || []).find(
    s => Number(s.series_id || s.stream_id || s.id) === seriesId
  );
  if (seriesObj) {
    localStorage.setItem("selectedSeriesData", JSON.stringify(seriesObj));
    localStorage.setItem("selectedSeriesId", seriesId);
    localStorage.setItem("seriesSelectedCategoryId", selectedCategoryId);
    localStorage.setItem("seriesCategoryIndex", currentCategoryIndex);
    localStorage.setItem("seriesCardIndex", currentFocusIndex);
    localStorage.setItem("currentPage", "seriesDetailPage");
    
    const lp = qs("#loading-progress");
    if (lp) lp.style.display = "none";
    
    if (typeof navigateTo === "function") {
      navigateTo("series-detail-page");
    } else if (typeof Router !== "undefined" && Router.showPage) {
      Router.showPage("series-detail-page");
    }
  }
}

function toggleFavoriteItem(seriesId) {
  console.log("🎯 toggleFavoriteItem called with seriesId:", seriesId, "type:", typeof seriesId);
  
  // Only work on series page
  if (localStorage.getItem("currentPage") !== "seriesPage") return;

  const playlist = JSON.parse(localStorage.getItem("playlistsData")).find(
    (pl) => pl.playlistName === currentPlaylistName
  );
  
  if (!playlist) return;

  playlist.favouriteSeries = playlist.favouriteSeries || [];
  
  // FIXED: Ensure we're comparing numbers with numbers
  const seriesIdNum = Number(seriesId);
  const index = playlist.favouriteSeries.findIndex(id => Number(id) === seriesIdNum);
  const isAdding = index === -1;

  console.log("📋 Current favorites:", playlist.favouriteSeries);
  console.log("🔍 Found at index:", index, "| isAdding:", isAdding);

  if (index > -1) {
    // Remove from favorites
    playlist.favouriteSeries.splice(index, 1);
    console.log("❌ Removed from favorites");
  } else {
    // Add to favorites
    playlist.favouriteSeries.push(seriesIdNum);
    console.log("✅ Added to favorites");
  }

  // Save back to localStorage
  localStorage.setItem(
    "playlistsData",
    JSON.stringify(
      JSON.parse(localStorage.getItem("playlistsData")).map((pl) =>
        pl.playlistName === currentPlaylistName ? playlist : pl
      )
    )
  );

  // Update local array
  favouriteSeriesIds.length = 0;
  favouriteSeriesIds.push(...playlist.favouriteSeries);

  console.log("💾 Updated favorites:", favouriteSeriesIds);

  // Update UI
  updateFavoritesUI(seriesId, isAdding);

  // Show toast notification
  if (typeof Toaster !== 'undefined') {
    Toaster.showToast(
      isAdding ? "success" : "error",
      isAdding ? "Added to Favorites" : "Removed from Favorites"
    );
  }
}

function updateFavoritesUI(seriesId, isAdding) {
  // Update favorites category
  const favCategory = categories.find((c) => c.id === "-1");
  if (favCategory) {
    if (isAdding) {
      const seriesToAdd = window.allSeriesStreams.find(
        (s) => Number(s.series_id || s.stream_id) === Number(seriesId)
      );
      if (seriesToAdd && !favCategory.movies.some((s) => Number(s.series_id || s.stream_id) === Number(seriesId))) {
        favCategory.movies.push(seriesToAdd);
      }
    } else {
      favCategory.movies = favCategory.movies.filter(
        (s) => Number(s.series_id || s.stream_id) !== Number(seriesId)
      );
    }
    
    favCategory._movieCount = favCategory.movies.length;

    // Update UI count
    const favCatEl = qs('.movies-category-item[data-id="-1"]');
    if (favCatEl) {
      const countEl = favCatEl.querySelector(".cat-count");
      if (countEl) {
        countEl.textContent = favCategory.movies.length;
      }
    }
  }

  // Update heart icon on all cards with this seriesId
  const allCurrentCards = qsa(".movie-card");
  allCurrentCards.forEach((card) => {
    const cardSeriesId = Number(card.dataset.movieId);
    if (cardSeriesId === Number(seriesId)) {
      const heartIcon = card.querySelector(".movie-card-heart-icon");
      const cardElement = card;

      if (isAdding) {
        if (!heartIcon) {
          const heartImg = document.createElement("img");
          heartImg.src = "/assets/heart.png";
          heartImg.alt = "heart-icon";
          heartImg.className = "movie-card-heart-icon";
          cardElement.insertBefore(heartImg, cardElement.querySelector(".movie-hover"));
        }
      } else {
        if (heartIcon && selectedCategoryId !== "-1") {
          heartIcon.remove();
        }
      }
    }
  });

  // ⭐ If in Favorites category, re-render to show/hide cards
  if (selectedCategoryId === "-1") {
    renderCards(); // This will show updated favorites list
    
    if (movieCards.length === 0) {
      // No favorites left - go to categories
      currentSection = "categories";
      setFocusOnCategory(0);
    } else {
      // Maintain focus on valid card
      currentFocusIndex = Math.min(currentFocusIndex, movieCards.length - 1);
      setFocusOnCard(currentFocusIndex);
    }
  }
}
 

  // Remote navigation handler (copied/adapted from seriesPage)
  function handleRemoteNavigation(e) {
    // ensure only handle when on series page
    if (localStorage.getItem("currentPage") !== "seriesPage" && localStorage.getItem("currentPage") !== null) return;

    const cardsContainer = qs(".movies-grid");
    const cards = cardsContainer ? Array.from(cardsContainer.querySelectorAll(".movie-card")) : [];
    const categoriesEls = Array.from(qs(".movies-categories-list").querySelectorAll(".movies-category-item"));
    const cardsPerRow = computeCardsPerRow();

    const isUp = e.key === "ArrowUp" || e.keyCode === 38;
    const isDown = e.key === "ArrowDown" || e.keyCode === 40;
    const isLeft = e.key === "ArrowLeft" || e.keyCode === 37;
    const isRight = e.key === "ArrowRight" || e.keyCode === 39;
    const isEnter = e.key === "Enter" || e.keyCode === 13;
    const backKeys = [10009, "Escape", "Back", "BrowserBack", "XF86Back"];

    // Back -> go to dashboard (or previous)
  if (backKeys.includes(e.key) || backKeys.includes(e.keyCode)) {
  if (isRestoringState) {
    e.preventDefault();
    return;
  }
  
  e.preventDefault();
  e.stopPropagation();
  
  localStorage.removeItem("seriesSelectedCategoryId");
  localStorage.removeItem("seriesCategoryIndex");
  localStorage.removeItem("seriesCardIndex");
  
  localStorage.setItem("currentPage", "dashboard");
  
  if (typeof Router !== "undefined" && Router.showPage) {
    Router.showPage("dashboard");
  } else if (typeof navigateTo === "function") {
    navigateTo("dashboard-page");
  }
  return;
}

    /* ---------- UP ---------- */
    if (isUp) {
      if ((currentSection === "search" || currentSection === "header") &&
        (isSearchInputActive || isHeaderSearchActive)) {
        isSearchInputActive = false;
        isHeaderSearchActive = false;

        const searchInput = qs(".search-category-input");
        const searchContainer = qs(".search-category-name");
        const headerInput = qs(".search-input");
        const headerContainer = qs(".search-container");

        if (searchInput) searchInput.blur();
        if (searchContainer) searchContainer.classList.remove("focused");
        if (headerInput) headerInput.blur();
        if (headerContainer) headerContainer.classList.remove("focused");
      }

      // If header search is focused already -> stay
      if (currentSection === "header") {
        e.preventDefault();
        return;
      }
if (currentSection === "series") {
    const isTopRow = currentFocusIndex < cardsPerRow;

    if (isTopRow) {

        // 🌟 EXPANDED → go to LAST CATEGORY (bottom-right category)
        if (isExpanded) {
            const lastCategoryIndex = categories.length - 1;
            setFocusOnCategory(lastCategoryIndex);
            return;
        }

        // 🌟 NOT EXPANDED → ALWAYS go to CATEGORY SEARCH
        setFocusOnSearch(); 
        return;
    }

    // Normal UP movement (not top row)
    setFocusOnCard(currentFocusIndex - cardsPerRow);
    return;
}


else if (currentSection === "categories") {
  // Select category
  const items = qsa(".movies-category-item");
  if (items[currentCategoryIndex]) {
    const catId = items[currentCategoryIndex].dataset.id;
    const selectedCat = categories.find(c => String(c.id) === String(catId));
    
    items[currentCategoryIndex].click();
    
    // ⭐ If no series in category, keep focus on category
    if (!selectedCat || !selectedCat.movies || selectedCat.movies.length === 0) {
      setTimeout(() => {
        setFocusOnCategory(currentCategoryIndex);
      }, 100);
    }
  }
  e.preventDefault();
  return;
} else if (currentSection === "expand") {
        // from expand: if expanded go to category search, else go to header search
        if (isExpanded) {
          setFocusOnSearch();
        } else {
          setFocusOnHeaderSearch();
        }
      } else if (currentSection === "search") {
        // category-search: UP goes to header search
        setFocusOnHeaderSearch();
         
      }

      e.preventDefault();
      return;
    }

    /* ---------- DOWN ---------- */
    if (isDown) {

        if (currentSection === "menuDots") {
    // Open sidebar on down
    // openSidebar('seriesPage');
            setFocusOnSearch();

    e.preventDefault();
    return;
  }

      if ((currentSection === "search" || currentSection === "header") &&
        (isSearchInputActive || isHeaderSearchActive)) {
        isSearchInputActive = false;
        isHeaderSearchActive = false;

        const searchInput = qs(".search-category-input");
        const searchContainer = qs(".search-category-name");
        const headerInput = qs(".search-input");
        const headerContainer = qs(".search-container");

        if (searchInput) searchInput.blur();
        if (searchContainer) searchContainer.classList.remove("focused");
        if (headerInput) headerInput.blur();
        if (headerContainer) headerContainer.classList.remove("focused");
      }

  if (currentSection === "header") {
        const headerInput = qs(".search-input");
        if (headerInput) {
          headerInput.blur();
          // Remove cursor from header search
          headerInput.selectionStart = headerInput.selectionEnd = 0;
        }
        
        setFocusOnSearch();
        e.preventDefault();
        return;
      }

      if (currentSection === "search") {
        if (isExpanded) {
          setFocusOnCategory(0);
        } else {
          setFocusOnCard(0);
        }
        e.preventDefault();
        return;
      }

      // If header search (top search input) -> go to sidebar category search
  if (currentSection === "header") {
    const headerInput = qs(".search-input");
    if (headerInput) {
      headerInput.blur();
      headerInput.selectionStart = headerInput.selectionEnd = 0;
    }
    
    setFocusOnSearch();
    e.preventDefault();
    return;
  }

  if (currentSection === "search") {
    // category search -> if expanded go to first category, else go to cards
    if (isExpanded) {
      setFocusOnCategory(0);
    } else {
      // collapsed: directly go to cards
      setFocusOnCard(0);
    }
    e.preventDefault();
    return;
  }

      if (currentSection === "categories") {
        const perRow = computeCategoriesPerRow();
        const next = currentCategoryIndex + perRow;

        // Collapsed → skip categories and go to cards
        if (!isExpanded) {
          setFocusOnCard(0);
          e.preventDefault();
          return;
        }

        // EXPANDED: check if we're in the last row
        const totalCategories = categoriesEls.length;
        const lastRowStartIndex = Math.floor((totalCategories - 1) / perRow) * perRow;
        const isInLastRow = currentCategoryIndex >= lastRowStartIndex;

        if (isInLastRow) {
          // From last row → go to series (align column)
          currentSection = "series";
          const col = currentCategoryIndex % perRow;
          currentFocusIndex = Math.min(col, cards.length - 1);
          setFocusOnCard(currentFocusIndex);
        } else if (next < categoriesEls.length) {
          // Not in last row, move down normally
          setFocusOnCategory(next);
        } else {
          // 2nd-to-last row with no category below → go to last category in bottom row
          const lastCategoryIndex = totalCategories - 1;
          setFocusOnCategory(lastCategoryIndex);
        }

        e.preventDefault();
        return;
      }

      if (currentSection === "expand") {
        // from expand go to series
        setFocusOnCard(0);
        e.preventDefault();
        return;
      }

      /* -----------------------------
         DOWN inside CARD GRID
         ----------------------------- */
      if (currentSection === "series") {
        const nextIndex = currentFocusIndex + cardsPerRow;

        if (nextIndex < cards.length) {
          // Normal move down
          setFocusOnCard(nextIndex);
        } else {
          // We're at or near the bottom - try to load more
          const cat = categories.find(c => String(c.id) === String(selectedCategoryId));
          if (cat && visibleCount < cat.movies.length) {
            loadMore();
            // After loading, focus on the next card down
            setTimeout(() => {
              const updatedCards = Array.from(document.querySelectorAll(".movie-card"));
              if (nextIndex < updatedCards.length) {
                setFocusOnCard(nextIndex);
              }
            }, 50);
          }
        }

        e.preventDefault();
        return;
      }
    }

    /* ---------- LEFT ---------- */
    if (isLeft) {

        if (currentSection === "menuDots") {
    setFocusOnHeaderSearch();
    e.preventDefault();
    return;
  }


      if (currentSection === "scrollBtn") {
  setFocusOnCard(currentFocusIndex);
  e.preventDefault();
  return;
}


      if ((currentSection === "search" || currentSection === "header") &&
        (isSearchInputActive || isHeaderSearchActive)) {
        isSearchInputActive = false;
        isHeaderSearchActive = false;

        const searchInput = qs(".search-category-input");
        const searchContainer = qs(".search-category-name");
        const headerInput = qs(".search-input");
        const headerContainer = qs(".search-container");

        if (searchInput) searchInput.blur();
        if (searchContainer) searchContainer.classList.remove("focused");
        if (headerInput) headerInput.blur();
        if (headerContainer) headerContainer.classList.remove("focused");
      }

      if (currentSection === "series") {


        
        if (currentFocusIndex % cardsPerRow === 0) {
          // Already at leftmost column - go to categories (maintain behavior)
           e.preventDefault();
    return; 
        } else {
          setFocusOnCard(currentFocusIndex - 1);
        }
      } else if (currentSection === "categories") {
        if (currentCategoryIndex === 0) {
          // LEFT from first category → go to CATEGORY SEARCH (sidebar search)
          setFocusOnSearch();
        } else {
          setFocusOnCategory(currentCategoryIndex - 1);
        }
      } else if (currentSection === "expand") {
        const perRow = computeCategoriesPerRow(); // 8 when expanded
        const lastRightIndex = perRow - 1;

        // When expanded → Left should go to last category in the first row
        if (isExpanded) {
          setFocusOnCategory(lastRightIndex);
        } else {
          // Not expanded → left should go to last item of 7-columns row
          setFocusOnCategory(computeCategoriesPerRow() - 1);
        }

        e.preventDefault();
        return;
      }

      e.preventDefault();
      return;
    }

    function blurAllInputs() {
      const inputs = document.querySelectorAll("input");
      inputs.forEach(inp => inp.blur());
    }

    /* ---------- RIGHT ---------- */
    if (isRight) {
      if ((currentSection === "search" || currentSection === "header") &&
        (isSearchInputActive || isHeaderSearchActive)) {
        isSearchInputActive = false;
        isHeaderSearchActive = false;

        const searchInput = qs(".search-category-input");
        const searchContainer = qs(".search-category-name");
        const headerInput = qs(".search-input");
        const headerContainer = qs(".search-container");

        if (searchInput) searchInput.blur();
        if (searchContainer) searchContainer.classList.remove("focused");
        if (headerInput) headerInput.blur();
        if (headerContainer) headerContainer.classList.remove("focused");
      }

     if (currentSection === "header") {
    // From header search → go to menu dots
    const headerInput = qs(".search-input");
    if (headerInput) headerInput.blur();
    setFocusOnMenuDots();
    e.preventDefault();
    return;
  }else if (currentSection === "search") {
        // Leaving search → remove cursor + go to first category
        const input = qs(".search-category-input");
        if (input) input.blur();
        setFocusOnCategory(0);

        e.preventDefault();
        return;
      } else if (currentSection === "categories") {
        const perRow = computeCategoriesPerRow();
        const nextIdx = currentCategoryIndex + 1;
        const isLastColumn = (currentCategoryIndex % perRow) === perRow - 1;

        // --- NOT EXPANDED ---
        if (!isExpanded) {
          if (isLastColumn || nextIdx >= categoriesEls.length) {
            setFocusOnExpandBtn();
            e.preventDefault();
            return;
          }
          setFocusOnCategory(nextIdx);
          e.preventDefault();
          return;
        }

        // --- EXPANDED MODE ---
        if (isLastColumn) {
          setFocusOnExpandBtn();
          e.preventDefault();
          return;
        }

        if (nextIdx >= categoriesEls.length) {
          setFocusOnExpandBtn();
          e.preventDefault();
          return;
        }

        // normal move
        setFocusOnCategory(nextIdx);
        e.preventDefault();
        return;
      } else if (currentSection === "series") {
        const isRightmostColumn = (currentFocusIndex % cardsPerRow) === (cardsPerRow - 1);
        const isLastCard = currentFocusIndex === cards.length - 1;

        if (isRightmostColumn || isLastCard) {
              setFocusOnScrollBtn(); // ⭐ Changed from return

          // Already at rightmost position - don't move
          e.preventDefault();
          return;
        }

        setFocusOnCard(currentFocusIndex + 1);
        e.preventDefault();
        return;
      } else if (currentSection === "expand") {
        // from expand button → go to series
        setFocusOnCard(0);
        e.preventDefault();
        return;
      }
    }

    /* ---------- ENTER / SELECT ---------- */
 /* ---------- ENTER / SELECT ---------- */
if (isEnter && currentSection === "series") {
    e.preventDefault();

    // ⭐ Use global state
    if (enterState.isProcessingEnter) {
        console.log("⚠️ Already processing Enter, ignoring");
        return;
    }

    // ⭐ CAPTURE the current card IMMEDIATELY before timer starts
    const currentCard = movieCards[currentFocusIndex];
    if (!currentCard) {
        console.log("⚠️ No card found at index", currentFocusIndex);
        return;
    }
    
    const targetSeriesId = Number(currentCard.dataset.movieId);
    console.log("▶️ Starting long press timer for series:", targetSeriesId, "at index:", currentFocusIndex);
    
    enterState.isProcessingEnter = true;
    enterState.isLongPressExecuted = false;

    enterState.enterPressTimer = setTimeout(() => {
        console.log("🔥 LONG PRESS EXECUTED - Toggle Favorite for:", targetSeriesId);
        enterState.isLongPressExecuted = true;

        // ⭐ Use the captured seriesId, not recalculating from currentFocusIndex
        toggleFavoriteItem(targetSeriesId);

        enterState.enterPressTimer = null;
    }, LONG_PRESS_DURATION);

    return;
}

// ⭐ ENTER handling for other sections (search, categories, expand)
if (isEnter && currentSection !== "series") {

    if (currentSection === "menuDots") {
    console.log("📂 Opening sidebar from menu dots");
    openSidebar('seriesPage');
    return;
  }

  if (currentSection === "scrollBtn") {
    console.log("🔝 Scroll button clicked - scrolling and going to menu dots!");
    // Scroll main container to top
    const mainContainer = qs(".livetv-main-container");
    if (mainContainer) {
        mainContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
    // Also scroll grid container
    const gridContainer = qs(".movies-grid-container");
    if (gridContainer) {
        gridContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
    // Scroll window to top
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    // Then focus on menu dots
    setTimeout(() => {
        setFocusOnMenuDots();
    }, 300);
    return;
}

    
    if (currentSection === "search") {
        // Toggle edit mode for category search
        isSearchInputActive = !isSearchInputActive;
        const input = qs(".search-category-input");
        if (input) {
            if (isSearchInputActive) {
                input.focus();
            } else {
                input.blur();
            }
        }
        e.preventDefault();
        return;
    }
    
    if (currentSection === "header") {
        // Toggle edit mode for header search
        isHeaderSearchActive = !isHeaderSearchActive;
        const input = qs(".search-input");
        if (input) {
            if (isHeaderSearchActive) {
                input.focus();
            } else {
                input.blur();
            }
        }
        e.preventDefault();
        return;
    }
    


    if (currentSection === "categories") {
        // Select category
        const items = qsa(".movies-category-item");
        if (items[currentCategoryIndex]) {
            items[currentCategoryIndex].click();
        }
        e.preventDefault();
        return;
    }
    
    if (currentSection === "expand") {
        // Toggle expand
        const expandBtn = qs("#expandBtn");
        if (expandBtn) expandBtn.click();
        e.preventDefault();
        return;
    }
}
  }


 function handleKeyUp(e) {
  const currentPage = localStorage.getItem("currentPage");
  
  if (currentPage !== "seriesPage") return;
  
  const isEnter = e.key === "Enter" || e.keyCode === 13;
  if (!isEnter) return;

  if (currentSection !== "series") {
    return;
  }

  if (!enterState.isProcessingEnter && !enterState.enterPressTimer) {
    console.log("⚠️ Keyup without keydown, ignoring");
    e.preventDefault();
    return;
  }

  // ⭐ CRITICAL: Handle long press completion
  if (enterState.isLongPressExecuted) {
    console.log("⏭️ Long press completed, skipping navigation");
    
    // Clear timer if it exists
    if (enterState.enterPressTimer) {
      clearTimeout(enterState.enterPressTimer);
      enterState.enterPressTimer = null;
        enterState.isProcessingEnter = false;

    }
    
    // ⭐ RESET FLAGS with a small delay
    enterState.isLongPressExecuted = false;
    
    setTimeout(() => {
      enterState.isProcessingEnter = false;
      console.log("✅ Ready for next press");
    }, 200);
    
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  // ⭐ SHORT PRESS - Open detail page
// Inside handleKeyUp, replace the SHORT PRESS section:
if (enterState.enterPressTimer) {
  clearTimeout(enterState.enterPressTimer);
  enterState.enterPressTimer = null;
  enterState.isProcessingEnter = false;
  
  console.log("➡️ SHORT PRESS → OPEN SERIES DETAIL");
  
  const card = movieCards[currentFocusIndex];
  if (!card) {
    console.log("⚠️ No card at index", currentFocusIndex);
    e.preventDefault();
    return;
  }

  const seriesId = Number(card.dataset.movieId);
  const isAdult = card.dataset.isAdult === "true";
  
  if (isAdult) {
    const seriesObj = (window.allSeriesStreams || []).find(
      s => Number(s.series_id || s.stream_id || s.id) === seriesId
    );
    const seriesName = seriesObj ? (seriesObj.name || seriesObj.title || "Series") : "Series";
    
    showPasswordModal(seriesId, seriesName, () => {
      openSeriesDetail(seriesId);
    });
  } else {
    openSeriesDetail(seriesId);
  }
  
  e.preventDefault();
  return;
}
  
  // ⭐ Fallback reset
  enterState.isProcessingEnter = false;
  console.log("⚠️ Orphaned keyup detected, ignoring");
  e.preventDefault();
}


  // compute cards per row using grid CSS like seriesPage
  function computeCardsPerRow() {
    const grid = qs(".movies-grid");
    if (!grid) return CARDS_PER_ROW;

    const gridStyle = window.getComputedStyle(grid);
    const cols = gridStyle.gridTemplateColumns.split(' ').length;
    return cols || CARDS_PER_ROW;
  }

  // compute categories per row (7 / 8 toggle)
  function computeCategoriesPerRow() {
    return isExpanded ? 8 : 7;
  }


  // Header search functionality for series
// Header search functionality for series - searches only in selected category
function handleHeaderSearch(searchQuery) {
  const query = searchQuery.trim().toLowerCase();
  
  if (!query) {
    // Empty search - restore original category series
    buildCategoryMap();
    renderCards();
    // DON'T auto-focus on cards after search clears
    return;
  }

  console.log("🔍 Searching series in category", selectedCategoryId, "for:", query);

  // Get series from CURRENT CATEGORY ONLY
  const currentCat = categories.find(c => String(c.id) === String(selectedCategoryId));
  if (!currentCat) {
    console.log("⚠️ No category selected");
    return;
  }

  // Get original series from the category (from seriesByCategory map)
  const categorySeries = seriesByCategory[selectedCategoryId] || [];
  
  const searchResults = categorySeries.filter(s => {
    const title = (s.name || s.title || "").toLowerCase();
    const desc = (s.plot || s.overview || s.description || "").toLowerCase();
    return title.includes(query) || desc.includes(query);
  });

  console.log("📊 Found", searchResults.length, "results in current category");

  // Update current category with search results
  currentCat.movies = searchResults;
  currentCat._movieCount = searchResults.length;

  visibleCount = Math.min(PAGE_SIZE, searchResults.length);
  renderCards();

  // DON'T auto-focus on first card - keep focus on header search
if (searchResults.length === 0) {
  const container = qs(".movies-grid");
  if (container) {
    container.innerHTML = ''; // Clear grid
  }
  
  // Show centered message
  const gridContainer = qs(".movies-grid-container");
  let noDataDiv = qs(".movie-no-data-overlay");
  
  if (!noDataDiv) {
    noDataDiv = document.createElement('div');
    noDataDiv.className = 'movie-no-data-overlay';
    gridContainer.appendChild(noDataDiv);
  }
  
  noDataDiv.innerHTML = `
    <div class="movie-no-data-content">
      <p>No series found for "${escapeHtml(query)}"</p>
      <p style="font-size: 14px; opacity: 0.7; margin-top: 10px;">Try a different search term</p>
    </div>
  `;
  noDataDiv.style.display = 'flex';
}
}


  // Initialize & event registration
 setTimeout(() => {
    buildCategoryMap();

     const sortingContainer = document.createElement('div');
    sortingContainer.innerHTML = SortingDialog();
    document.body.appendChild(sortingContainer);
    
    // Attach sorting dialog events
    attachSortingDialogEvents();
    // END OF NEW ADDITIONS
    
    renderCategoriesUI();
    visibleCount = PAGE_SIZE;
    renderCards();
    
    renderCategoriesUI();
    visibleCount = PAGE_SIZE;
    renderCards();

    // ⭐ Remove old listeners before adding new ones
    if (categoryClickHandler) {
      document.removeEventListener("click", categoryClickHandler);
    }
    if (cardClickHandler) {
      document.removeEventListener("click", cardClickHandler);
    }
    if (keydownHandler) {
      document.removeEventListener("keydown", keydownHandler);
    }
    if (keyupHandler) {
      document.removeEventListener("keyup", keyupHandler);
    }

    categoryClickHandler = (e) => onCategoryClick(e);
    cardClickHandler = (e) => onCardClick(e);
    keydownHandler = (e) => handleRemoteNavigation(e);
    keyupHandler = (e) => handleKeyUp(e);

    // ⭐ Add NEW listeners
    document.addEventListener("click", categoryClickHandler);
    document.addEventListener("click", cardClickHandler);
    document.addEventListener("keydown", keydownHandler);
    document.addEventListener("keyup", keyupHandler);

    // Restore saved focus if returning from detail
    const savedCatId = localStorage.getItem("seriesSelectedCategoryId");
    const savedCatIndex = localStorage.getItem("seriesCategoryIndex");
    const savedCardIndex = localStorage.getItem("seriesCardIndex");

    console.log("🔄 Initializing Series Page - savedCatId:", savedCatId, "savedCardIndex:", savedCardIndex);

    const comingFromDashboard = !savedCatId && !savedCardIndex;
    if (comingFromDashboard) {
      // Coming from dashboard or fresh - start from beginning
      console.log("🆕 Fresh start from dashboard");

      if (!pageState) {
        console.error("❌ pageState is undefined in initialization!");
        return;
      }

      pageState.currentFocusIndex = 0;
      pageState.currentCategoryIndex = 0;
      pageState.currentSection = "series";
      pageState.lastFocusedCategory = 0;

      visibleCount = PAGE_SIZE;
      
      // ⭐ Remove any stale focus classes
      qsa(".movie-card").forEach(c => c.classList.remove("focused"));
      qsa(".movies-category-item").forEach(c => c.classList.remove("focused"));
      
      setTimeout(() => {
        console.log("🎯 Setting focus to first card (index 0)");
        pageState.currentFocusIndex = 0; // Set again to be sure
        setFocusOnCard(0);
        console.log("✅ Focus set. currentFocusIndex is now:", currentFocusIndex);
      }, 100);
    } else {
      // Coming from series detail page - restore position
      console.log("↩️ Restoring from detail page");
      selectedCategoryId = String(savedCatId);
      currentCategoryIndex = savedCatIndex ? Number(savedCatIndex) : 0;
      currentFocusIndex = savedCardIndex ? Number(savedCardIndex) : 0;
      visibleCount = savedCardIndex ? Math.max(PAGE_SIZE, Number(savedCardIndex) + PAGE_SIZE) : PAGE_SIZE;
      renderCategoriesUI();
      renderCards();
      setTimeout(() => {
        if (savedCardIndex) {
          console.log("🎯 Restoring focus to card:", savedCardIndex);
          setFocusOnCard(Number(savedCardIndex));
        } else {
          setFocusOnCategory(currentCategoryIndex);
        }
      }, 80);
      localStorage.removeItem("seriesSelectedCategoryId");
      localStorage.removeItem("seriesCategoryIndex");
      localStorage.removeItem("seriesCardIndex");
    }

    const menuKeyHandler = (e) => {
  const currentPage = localStorage.getItem('currentPage');
  if (currentPage !== 'seriesPage') return;
  
  // Handle Menu/ContextMenu key
  if (e.key === 'Menu' || e.key === 'ContextMenu' || e.key === 'F2') {
    openSidebar('seriesPage');
    e.preventDefault();
  }
};

document.addEventListener('keydown', menuKeyHandler);

    // Expand toggle button
    const expandBtn = qs("#expandBtn");
    const sidebar = qs(".movies-sidebar");
    if (expandBtn) {
      expandBtnClickHandler = () => {
        isExpanded = !isExpanded;
        const wrapper = qs(".movies-categories-wrapper");
        if (wrapper) wrapper.classList.toggle("expanded", isExpanded);
        if (sidebar) sidebar.classList.toggle("expanded", isExpanded);
        expandBtn.classList.toggle("rotated", isExpanded);
        expandBtn.textContent = isExpanded ? "⌃" : "⌄";
        
        const searchInput = qs(".search-category-input");
        const hasSearchText = searchInput && searchInput.value.trim().length > 0;
        
        if (!hasSearchText && sidebar) {
            sidebar.classList.remove("filtering");
        }
        
        if (currentSection === "categories") {
          setFocusOnCategory(currentCategoryIndex);
        } else if (currentSection === "expand") {
          setFocusOnExpandBtn();
        }
      };
      
      expandBtn.removeEventListener("click", expandBtnClickHandler);
      expandBtn.addEventListener("click", expandBtnClickHandler);
    }

    // Search input
    const searchEl = qs(".search-category-input");
    if (searchEl) {
      let timer = null;
      searchInputHandler = (ev) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          const q = ev.target.value.trim().toLowerCase();
          const list = qs(".movies-categories-list");
          const sidebar = qs(".movies-sidebar");
          
          if (!q) {
            if (sidebar) sidebar.classList.remove("filtering");
            renderCategoriesUI();
            return;
          }
          
          if (sidebar) sidebar.classList.add("filtering");
          
          const filtered = categories.filter(c => c.name.toLowerCase().includes(q));
          if (list) {
            list.innerHTML = filtered.map((c, idx) => `
              <div class="movies-category-item ${String(c.id) === String(selectedCategoryId) ? 'active' : ''}" data-id="${c.id}" data-idx="${idx}">
                <span style="text-align: center;" class="cat-name" title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</span>
              </div>
            `).join("");

            const expandBtn = qs("#expandBtn");
            if (expandBtn) {
              expandBtn.style.display = filtered.length > 0 ? "flex" : "none";
            }
          }
        }, 350);
      };


      // Inside the setTimeout initialization block, after the category search input handler:

// Header search input (add after searchEl handler)
const headerSearchEl = qs(".search-input");
if (headerSearchEl) {
  let headerSearchTimer = null;
  let lastSearchQuery = "";
  
  headerSearchInputHandler = (ev) => {
    if (headerSearchTimer) clearTimeout(headerSearchTimer);
    
    headerSearchTimer = setTimeout(() => {
      const query = ev.target.value.trim().toLowerCase();
      
      // If search is cleared, restore original category
      if (!query && lastSearchQuery) {
        console.log("🔄 Search cleared, restoring category");
        buildCategoryMap(); // Rebuild to restore original data
        renderCards();
        if (movieCards.length > 0) {
          setFocusOnCard(0);
        }
        lastSearchQuery = "";
        return;
      }
      
      lastSearchQuery = query;
      handleHeaderSearch(query);
    }, 300);
  };
  
  headerSearchEl.removeEventListener("input", headerSearchInputHandler);
  headerSearchEl.addEventListener("input", headerSearchInputHandler);
  
  // Clear search on blur if needed
  headerSearchEl.addEventListener("blur", () => {
    if (!headerSearchEl.value.trim()) {
      buildCategoryMap();
      renderCards();
    }
  });
}
      
      searchEl.removeEventListener("input", searchInputHandler);
      searchEl.addEventListener("input", searchInputHandler);

      // Add after the scroll button handler
const menuDots = document.querySelector('.menu-dots');
if (menuDots) {
  menuDots.addEventListener('click', () => {
    openSidebar('seriesPage');
  });
}


// Scroll to top button handler
const scrollToTopBtn = qs("#scrollToTopBtn");
if (scrollToTopBtn) {
  scrollToTopHandler = () => {
    console.log("🔝 Scroll button clicked - scrolling and going to menu dots!");
    // Scroll main container to top
    const mainContainer = qs(".livetv-main-container");
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
    // Also scroll grid container
    const gridContainer = qs(".movies-grid-container");
    if (gridContainer) {
      gridContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
    // Scroll window to top
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    // Then focus on menu dots after scroll completes
    setTimeout(() => {
      setFocusOnMenuDots();
    }, 300);
  };
  
  scrollToTopBtn.removeEventListener("click", scrollToTopHandler);
  scrollToTopBtn.addEventListener("click", scrollToTopHandler);
}


    }

    // cleanup
    SeriesPage.cleanup = () => {
      console.log("🧹 SeriesPage cleanup called - removing event listeners");
      
      if (enterState.enterPressTimer) {
        clearTimeout(enterState.enterPressTimer);
        enterState.enterPressTimer = null;
      }
      enterState.isProcessingEnter = false;
      enterState.isLongPressExecuted = false;

      if (categoryClickHandler) {
        document.removeEventListener("click", categoryClickHandler);
      }
      if (cardClickHandler) {
        document.removeEventListener("click", cardClickHandler);
      }
      if (keydownHandler) {
        document.removeEventListener("keydown", keydownHandler);
      }
      if (keyupHandler) {
        document.removeEventListener("keyup", keyupHandler);
      }
      
      const expandBtn = qs("#expandBtn");
      if (expandBtn && expandBtnClickHandler) {
        expandBtn.removeEventListener("click", expandBtnClickHandler);
      }
      
      const searchEl = qs(".search-category-input");
      if (searchEl && searchInputHandler) {
        searchEl.removeEventListener("input", searchInputHandler);
      }


        const headerSearchEl = qs(".search-input");
  if (headerSearchEl && headerSearchInputHandler) {
    headerSearchEl.removeEventListener("input", headerSearchInputHandler);
  }

  const scrollToTopBtn = qs("#scrollToTopBtn");
if (scrollToTopBtn && scrollToTopHandler) {
  scrollToTopBtn.removeEventListener("click", scrollToTopHandler);
}

  document.removeEventListener('keydown', menuKeyHandler);
    delete window.renderSeries;


    };
}, 0);

  const now = new Date();
const time = formatTime(now);

// Expose render function for sidebar sorting
window.renderSeries = () => {
  console.log("🔄 Re-rendering series with new sort order");
  
  // Set flag to prevent enter key handling during re-render
  enterState.isProcessingEnter = true;
  
  // Clear any pending enter timer
  if (enterState.enterPressTimer) {
    clearTimeout(enterState.enterPressTimer);
    enterState.enterPressTimer = null;
  }
  enterState.isLongPressExecuted = false;
  
  // Re-render cards with new sort order
  renderCards();
  
  // Reset focus to first card
  if (movieCards.length > 0) {
    currentSection = "series";
    currentFocusIndex = 0;
    setTimeout(() => {
      setFocusOnCard(0);
      console.log("✅ Focus restored after sorting");
      
      // Re-enable enter key after a safe delay
      setTimeout(() => {
        enterState.isProcessingEnter = false;
      }, 300);
    }, 100);
  } else {
    enterState.isProcessingEnter = false;
  }
};


  // Template (keeps identical markup so Movies CSS works)
  return `
<div class="livetv-main-container">
  <header class="livetv-header">
      <div class="header-left">
          <img src="/assets/logo.png" class="app-logo" />
          <div>
           <span class="current-time">${time}</span>

            <span class="current-date">${new Date().toLocaleDateString([], {month:'long', day:'numeric', year:'numeric'})}</span>
          </div>
      </div>
      <div class="live-indicator"><span class="current-time">Series</span></div>
      <div class="header-right">
          <div class="search-container">
              <div class="search-icon"><img src="/assets/search.png" /></div>
              <input type="text" class="search-input" placeholder="Search Series" />
          </div>
          <div class="menu-dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
      </div>
  </header>

    <!-- ADD THESE LINES HERE (right after header): -->
  <div class="sidebar-container-movie" style="display: none;">
    ${Sidebar({ from: "seriesPage" })}
  </div>

  <!-- Add Sorting Dialog -->
  ${SortingDialog()}
  <!-- END OF NEW ADDITIONS -->


  <div class="movies-sidebar">
      <div class="search-category-name">
          <input type="text" placeholder="Search Categories" class="search-category-input" />
          <i class="fa fa-search search-category-icon"></i>
      </div>

      <div class="movies-categories-wrapper">
          <div class="movies-categories-list">
            <!-- categories injected here -->
          </div>

          <div class="category-toggle-btn" id="expandBtn">⌄</div>
      </div>
  </div>

  <div class="movies-grid-container">
    <div class="movies-grid">
      <!-- cards injected here -->
    </div>


    <button id="scrollToTopBtn" class="scroll-to-top-btn" title="Scroll to Top">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</button>
  </div>
</div>
`;
}
