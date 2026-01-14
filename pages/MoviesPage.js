if (typeof window.moviesPageEnterState === "undefined") {
  window.moviesPageEnterState = {
    enterPressTimer: null,
    isLongPressExecuted: false,
    isProcessingEnter: false,
  };
}

if (typeof window.moviesPageState === "undefined") {
  window.moviesPageState = {
    currentFocusIndex: 0,
    currentCategoryIndex: 0,
    currentSection: "movies",
    lastFocusedCategory: 0,
  };
}

let categoryClickHandler;
let cardClickHandler;
let keydownHandler;
let keyupHandler;
let expandBtnClickHandler;
let searchInputHandler;
let headerSearchInputHandler;
let scrollToTopHandler;

function MoviesPage() {
  // CONFIG
  const CARDS_PER_ROW = 7;
  const ROWS_PER_LOAD = 3;
  const PAGE_SIZE = CARDS_PER_ROW * ROWS_PER_LOAD; // Load more chunk
  let categories = []; // [{ id: "233", name: "Estrenos 2025", parent_id: 0, _movieCount, movies: [] }]
  let moviesByCategory = {}; // map category_id -> [movies]
  let selectedCategoryId = null;
  let visibleCount = PAGE_SIZE;
  let lastFocusedCategory = 0;
  let isRestoringState = false; // Flag to prevent navigation during state restoration

  let isSearchInputActive = false; // For category search
  let isHeaderSearchActive = false; // For header search

  // Focus / navigation state
  let currentSection = "movies"; // "header" | "search" | "categories" | "expand" | "movies"
  let currentFocusIndex = 0; // focused card index
  let currentCategoryIndex = 0; // focused category index for sidebar
  let isExpanded = false;
let isMenuDotsActive = false; // Track if menu dots are focused

    // After CONFIG section, add:
  const currentPlaylistName = JSON.parse(
    localStorage.getItem("selectedPlaylist")
  ).playlistName;

  const currentPlaylist = JSON.parse(
    localStorage.getItem("playlistsData")
  ).filter((pl) => pl.playlistName === currentPlaylistName)[0];

  
const adultsCategories = currentPlaylist.adultsCategories || [];
const unlockedMovieAdultCatIds = new Set();

  // Check if movie is adult content
// Add these helper functions after your CONFIG section in MoviesPage():

// Check if a category is adult based on name patterns
function isMovieAdultCategory(categoryName) {
  if (!categoryName) return false;
  const normalized = categoryName.trim().toLowerCase();
  
  // Check against configured adult categories (if you have a list)
  const configuredAdultCategories = adultsCategories || []; // Define this if you have a list
  if (configuredAdultCategories.includes(normalized)) return true;
  
  // Check against common adult keywords
  return /(adult|xxx|18\+|18\s*plus|sex|porn|erotic|nsfw|mature)/i.test(normalized);
}


function setFocusOnMenuDots() {
  removeAllFocus();
  const menuDots = document.querySelector('.menu-dots');
  if (menuDots) {
    menuDots.classList.add('focused');
  }
  currentSection = "menuDots";
  isMenuDotsActive = true;
}

// Check if a movie belongs to an adult category
function isMovieAdult(movie) {
  if (!movie) return false;
  
  // Get all category IDs this movie belongs to
  const movieCategoryIds = new Set();
  if (movie.category_id != null) {
    movieCategoryIds.add(Number(movie.category_id));
  }
  if (Array.isArray(movie.category_ids)) {
    movie.category_ids.forEach(cid => movieCategoryIds.add(Number(cid)));
  }
  console.log("window.moviesCategories " , window.moviesCategories );
  
  // Check if any of the movie's categories are adult categories
  for (const catId of movieCategoryIds) {
    const category = (window.moviesCategories || []).find(c => c.id === catId);
    if (category && isMovieAdultCategory(category.name)) {
      return true;
    }
  }
  
  return false;
}

// Determine if a movie card should be blurred
function shouldBlurMovie(movie) {
  const parentalLockEnabled = !!getParentalPassword();
  if (!parentalLockEnabled) return false;
  
  if (!isMovieAdult(movie)) return false;
  
  // If we're in an adult category that's unlocked, don't blur
  const currentCategory = categories.find(c => String(c.id) === String(selectedCategoryId));
  if (currentCategory && isMovieAdultCategory(currentCategory.name)) {
    // You can track unlocked categories in a Set if needed
    // return !unlockedCategoryIds.has(String(selectedCategoryId));
    return false; // For now, don't blur within adult categories
  }
  
  // Blur in special categories: Favorites (-1), Continue Watching (-2), All (-3)
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

// Check if parental control is active
function isParentalControlActive() {
  const password = getParentalPassword();
  return password && password.length > 0;
}



// Show password modal
function showPasswordModal(movieId, movieName, onSuccess) {
  const modalHTML = `
    <div class="password-modal-overlay" id="passwordModalOverlay">
      <div class="password-modal">
        <div class="password-modal-header">
          <h2>Parental Control</h2>
          <p>Enter password to access "${movieName}"</p>
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
  const submitBtn = document.getElementById('passwordSubmitBtn');
  const cancelBtn = document.getElementById('passwordCancelBtn');
  
  let focusIndex = 0;
  
  setTimeout(() => input.focus(), 100);
  
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
    console.log("🔐 Verifying password...");
    const enteredPassword = input.value.trim();
    const correctPassword = getParentalPassword();
    
    console.log("Password entered:", enteredPassword ? "Yes" : "No");
    
    if (!enteredPassword) {
      console.log("Empty password");
      if (overlay) overlay.style.zIndex = '9998';
      setTimeout(() => {
        if (typeof Toaster !== 'undefined') {
          Toaster.showToast("error", "Please enter password");
        }
        if (overlay) overlay.style.zIndex = '9999';
      }, 50);
      return;
    }
    
    if (enteredPassword === correctPassword) {
      console.log("✅ Correct password");
      const currentCategory = categories.find(c => String(c.id) === String(selectedCategoryId));
      if (currentCategory && isMovieAdultCategory(currentCategory.name)) {
        unlockedMovieAdultCatIds.add(String(selectedCategoryId));
      }
      
      if (overlay) overlay.style.zIndex = '9998';
      if (typeof Toaster !== 'undefined') {
        Toaster.showToast("success", "Access Granted");
      }
      
      setTimeout(() => {
        closeModal();
        if (onSuccess) onSuccess();
      }, 800);
    } else {
      console.log("❌ Incorrect password");
      if (overlay) overlay.style.zIndex = '9998';
      setTimeout(() => {
        if (typeof Toaster !== 'undefined') {
          Toaster.showToast("error", "Incorrect Password");
        }
        if (overlay) overlay.style.zIndex = '9999';
      }, 50);
      input.value = '';
      setTimeout(() => input.focus(), 100);
    }
  }
  
  function closeModal() {
    console.log("Closing modal");
    if (overlay) {
      overlay.remove();
    }
    document.removeEventListener('keydown', handleModalKeydown);
    localStorage.setItem("currentPage", "moviesPage");
  }
  
  // Click handlers
  submitBtn.addEventListener('click', (e) => {
    console.log("Submit button clicked");
    e.preventDefault();
    e.stopPropagation();
    verifyPassword();
  });
  
  cancelBtn.addEventListener('click', (e) => {
    console.log("Cancel button clicked");
    e.preventDefault();
    e.stopPropagation();
    closeModal();
  });
  
  // Enter key on input
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      console.log("Enter pressed on input");
      e.preventDefault();
      verifyPassword();
    }
  });
  
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
      console.log("Enter pressed, focusIndex:", focusIndex);
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


  window.moviesPageEnterState = window.moviesPageEnterState || {
    enterPressTimer: null,
    isLongPressExecuted: false,
    isProcessingEnter: false,
  };

  window.moviesPageState = window.moviesPageState || {
    currentFocusIndex: 0,
    currentCategoryIndex: 0,
    currentSection: "movies",
    lastFocusedCategory: 0,
  };

  const enterState = window.moviesPageEnterState;
  const pageState = window.moviesPageState;

  const LONG_PRESS_DURATION = 500;

  if (!pageState) {
    console.error("❌ pageState is undefined!");
    return;
  }

  console.log("✅ pageState initialized:", pageState);


  

  const favoritesMoviesIds = Array.isArray(currentPlaylist.favouriteMovies)
    ? currentPlaylist.favouriteMovies
    : [];
  // Get continue watching data from current playlist
  const continueWatchingMovies = Array.isArray(
    currentPlaylist.continueWatchingMovies
  )
    ? currentPlaylist.continueWatchingMovies
    : [];

  const continueWatchingIds = continueWatchingMovies.map((item) =>
    Number(item.itemId)
  );

  console.log("📺 Continue Watching Movies:", continueWatchingMovies);
  console.log("📺 Continue Watching IDs:", continueWatchingIds);
  // DOM helpers
  const qs = (s) => document.querySelector(s);
  const qsa = (s) => Array.from(document.querySelectorAll(s));

  const shouldResetFocus = localStorage.getItem("resetMoviesFocus") === "yes";
  `
// if (shouldResetFocus) {
//   currentFocusIndex = 0;      // focus first card
//   setFocusOnCard(0);              // your function that highlights card
//   localStorage.removeItem("resetMoviesFocus");
// }`;

  // Utility: group movies by category_id (string)
  console.log("currentPage", localStorage.getItem("currentPage"));

function buildCategoryMap() {
  const allCats = Array.isArray(window.moviesCategories)
    ? window.moviesCategories
    : [];
  const allMovies = Array.isArray(window.allMoviesStreams)
    ? window.allMoviesStreams
    : [];

  const allFavoritesMovies = allMovies.filter((m) =>
    favoritesMoviesIds.includes(m.stream_id)
  );

  const favoritesCategory = {
    id: "-1",
    name: "Favorites",
    parent_id: 0,
    movies: allFavoritesMovies,
    _movieCount: allFavoritesMovies.length,
  };

  // Get continue watching movies
  const allContinueWatchingMovies = allMovies.filter((m) => {
    const isInContinueWatching = continueWatchingIds.includes(
      Number(m.stream_id)
    );
    if (isInContinueWatching) {
      console.log("✅ Found continue watching movie:", m.name, m.stream_id);
    }
    return isInContinueWatching;
  });

  console.log(
    "📺 Total Continue Watching Movies:",
    allContinueWatchingMovies.length
  );

  const continueWatchingCategory = {
    id: "-2",
    name: "Continue Watching ",
    parent_id: 0,
    movies: allContinueWatchingMovies,
    _movieCount: allContinueWatchingMovies.length,
  };

  // Normalize categories into our structure
  const normalizedCategories = allCats.map((c) => ({
    id: String(c.category_id || c.id),
    name: c.category_name || c.name || `Cat ${c.category_id || c.id}`,
    parent_id: c.parent_id || 0,
    movies: [],
    _movieCount: 0,
  }));

  categories = [
    favoritesCategory,
    continueWatchingCategory,
    ...normalizedCategories,
  ];

  // Build map skeleton
  moviesByCategory = {};
  categories.forEach((c) => (moviesByCategory[c.id] = []));

  moviesByCategory["-1"] = allFavoritesMovies;
  moviesByCategory["-2"] = allContinueWatchingMovies;

  // Group movies
  for (const m of allMovies) {
    if (!m.stream_icon) {
       console.warn("⚠️ Movie missing icon data:", m.name);
   }
    const cid = String(
      m.category_id ||
        (Array.isArray(m.category_ids) && m.category_ids[0]) ||
        "-3"
    );
    if (!moviesByCategory[cid]) moviesByCategory[cid] = [];
    moviesByCategory[cid].push(m);
  }

  // Attach to categories and compute counts
  categories.forEach((c) => {
    if (c.id === "-1" || c.id === "-2") return;

    c.movies = moviesByCategory[c.id] || [];
    c._movieCount = (c.movies && c.movies.length) || 0;
  });

  // ⭐ ALWAYS select 3rd category (index 2) on fresh load
  if (!selectedCategoryId) {
    // If we have at least 3 categories, select the 3rd one (index 2)
    if (categories.length > 2) {
      selectedCategoryId = categories[2].id;
      console.log("✅ Auto-selected 3rd category:", categories[2].name);
    } else {
      // Fallback to first category if less than 3 categories exist
      selectedCategoryId = categories[0] ? categories[0].id : null;
    }
  }
}



  function applySortingToMovies(movies) {
  const sortValue = localStorage.getItem("movieSortValue") || "default";
  
  if (sortValue === "default") {
    return movies; // Keep original order
  }
  
  const sorted = [...movies]; // Create a copy to avoid mutating original
  
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
      return movies;
  }
}
  // Render sidebar categories
function renderCategoriesUI() {
    const wrapper = qs(".movies-categories-list");
    if (!wrapper) return;
    
    wrapper.innerHTML = categories
    .map((c, idx) => {
        const isAdultCat = isMovieAdultCategory(c.name);
        const parentalLockEnabled = !!getParentalPassword();
        const isCatUnlocked = unlockedMovieAdultCatIds.has(String(c.id));
        const shouldBlur = parentalLockEnabled && isAdultCat && !isCatUnlocked;
        
        // Always show count for every category
        const movieCount = c._movieCount || 0;
        
        return `
        <div class="movies-category-item ${
            String(c.id) === String(selectedCategoryId) ? "active" : ""
        } ${shouldBlur ? 'movie-category-blurred' : ''}" 
             data-id="${c.id}" 
             data-idx="${idx}"
             data-category-name="${escapeHtml(c.name)}"
             data-count="${movieCount}">
            ${shouldBlur ? '<i class="fas fa-lock movie-category-lock-icon"></i>' : ''}
            <div class="cat-item-content">
                <span class="cat-name" title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</span>
                <span class="cat-count-pill">(${movieCount})</span>
            </div>
        </div>`;
    })
    .join("");

    const expandBtn = qs("#expandBtn");
    const categoriesEls = Array.from(wrapper.querySelectorAll(".movies-category-item"));
    if (expandBtn) {
        expandBtn.style.display = categoriesEls.length > 0 ? "flex" : "none";
    }

    setTimeout(() => initCategoryMarquee(), 100);
}

  // Build a single movie card HTML (safe)

  function adjustToFullRow(count) {
    const remainder = count % 7;
    return remainder === 0 ? count : count + (7 - remainder);
  }

  visibleCount = adjustToFullRow(visibleCount + PAGE_SIZE);

function buildMovieCardHTML(m) {
  // const img = m.stream_icon || "/assets/noImageFound.png";
  let imgSrc = m.stream_icon || "/assets/noImageFound.png";
  if (imgSrc.startsWith("//")) {
    imgSrc = "http:" + imgSrc;
  }
  const title = m.name || m.title || "Untitled";
  const rating = isNaN(Number(m.rating_5based)) ? 0 : Math.min(5, Number(m.rating_5based));

  const isFav = favoritesMoviesIds.includes(m.stream_id);
  const showFavHeartIcon = String(selectedCategoryId) === "-1";
  const showHeart = showFavHeartIcon || isFav;

  const continueWatchingItem = continueWatchingMovies.find(
    item => Number(item.itemId) === Number(m.stream_id)
  );
  
  const showProgress = continueWatchingItem && continueWatchingItem.resumeTime > 0;
  const progressPercent = continueWatchingItem && continueWatchingItem.duration > 0
    ? Math.min(100, (continueWatchingItem.resumeTime / continueWatchingItem.duration) * 100)
    : 0;

  // Use the new category-based blur check
  const shouldBlur = shouldBlurMovie(m);

  return `
    <div class="movie-card ${shouldBlur ? 'movie-blurred' : ''}" 
         data-movie-id="${m.stream_id}"
         data-is-adult="${shouldBlur}">
      <div class="movie-card-image-wrapper">
       <img 
  src="${imgSrc}" 
  alt="${escapeHtml(title)}" 
  loading="lazy"
  onerror="this.onerror=null; this.src='/assets/noImageFound.png'; this.parentElement.classList.add('img-error');" 
/>
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


  // Add marquee effect to long category names
function initCategoryMarquee() {
  const categoryItems = qsa('.movies-category-item');
  const wrapper = qs('.movies-categories-wrapper');
  const isExpandedMode = wrapper && wrapper.classList.contains('expanded');
  
  // Container width changes based on expanded state
  const containerWidth = isExpandedMode ? 140 : 160;
  
  console.log(`🔄 Init marquee | Expanded: ${isExpandedMode} | Container width: ${containerWidth}px`);
  
  categoryItems.forEach(item => {
    const catName = item.querySelector('.cat-name');
    if (!catName) return;
    
    const text = catName.textContent.trim();
    const hasCount = item.dataset.count && item.dataset.count !== '';
    
    // Create temporary element to measure actual text width (including count badge)
    const temp = document.createElement('span');
    temp.style.visibility = 'hidden';
    temp.style.position = 'absolute';
    temp.style.whiteSpace = 'nowrap';
    temp.style.fontSize = window.getComputedStyle(catName).fontSize;
    temp.style.fontFamily = window.getComputedStyle(catName).fontFamily;
    temp.style.fontWeight = window.getComputedStyle(catName).fontWeight;
    temp.innerHTML = catName.innerHTML; // Include count badge HTML
    document.body.appendChild(temp);
    
    const textWidth = temp.offsetWidth;
    document.body.removeChild(temp);
    
    console.log(`📏 Category: "${text}" | Text: ${textWidth}px | Container: ${containerWidth}px | HasCount: ${hasCount}`);
    
    // Remove previous marquee settings
    catName.classList.remove('marquee-text');
    catName.style.removeProperty('--marquee-duration');
    catName.style.removeProperty('--container-width');
    catName.style.removeProperty('--text-width');
    
    // Add marquee class if text is wider than container
    if (textWidth > containerWidth) {
      catName.classList.add('marquee-text');
      
      // Set CSS variables for animation
      catName.style.setProperty('--container-width', `${containerWidth}px`);
      catName.style.setProperty('--text-width', `${textWidth}px`);
      
      // ⭐ FASTER SPEED: Calculate duration with higher speed (60px per second instead of 30)
      const duration = Math.max(3, (textWidth / 60)); // 60px per second = 2x faster
      catName.style.setProperty('--marquee-duration', `${duration}s`);
      
      console.log(`✅ Marquee enabled | Duration: ${duration}s | Text: ${textWidth}px | Speed: 60px/s`);
    } else {
      console.log(`⏭️ Text fits, no marquee needed`);
    }
  });
}
  // Render cards for selectedCategoryId up to visibleCount
  function renderCards() {
    const container = qs(".movies-grid");
    if (!container) return;
    const cat = categories.find(
      (c) => String(c.id) === String(selectedCategoryId)
    );


      const allMovies = cat && Array.isArray(cat.movies) ? cat.movies : [];
  const sortedMovies = applySortingToMovies(allMovies);
     const movies = sortedMovies.slice(0, visibleCount);


   if (!movies || movies.length === 0) {
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
      <p>No movies found for this category.</p>
    </div>
  `;
  noDataDiv.style.display = 'flex';
  return;
}

// Remove no-data overlay if it exists (when movies are present)
const noDataDiv = qs(".movie-no-data-overlay");
if (noDataDiv) {
  noDataDiv.style.display = 'none';
}
    container.innerHTML = movies.map(buildMovieCardHTML).join("");
    movieCards = Array.from(container.querySelectorAll(".movie-card"));
  }

  // Load more: increase visibleCount then render
  function loadMore() {
    const cat = categories.find(
      (c) => String(c.id) === String(selectedCategoryId)
    );
    if (!cat) return;
    const total = (cat.movies || []).length;
    if (visibleCount >= total) return;
    visibleCount = Math.min(visibleCount + PAGE_SIZE, total);
    renderCards();
    setFocusOnCard(currentFocusIndex);
  }

  // Focus helpers
  let movieCards = [];
function setFocusOnCard(index) {
    console.log("🎯 setFocusOnCard called with index:", index);

    const grid = qs(".movies-grid");
    if (!grid) {
      movieCards = [];
      console.log("⚠️ No grid found");
      return;
    }

    movieCards = Array.from(grid.querySelectorAll(".movie-card"));
    console.log("📦 Found", movieCards.length, "cards in grid");

    removeAllFocus();

    // Blur any input fields when focusing cards
    const searchInput = qs(".search-category-input");
    if (searchInput) searchInput.blur();

    if (!movieCards || movieCards.length === 0) {
      currentSection = "movies";
      currentFocusIndex = 0;
      console.log("⚠️ No cards found after query");
      return;
    }

    const oldIndex = currentFocusIndex;
    index = Math.max(0, Math.min(index, movieCards.length - 1));
    currentFocusIndex = index;

    console.log(
      "📍 setFocusOnCard - oldIndex:",
      oldIndex,
      "→ newIndex:",
      index,
      "currentFocusIndex now:",
      currentFocusIndex
    );

    movieCards[index].classList.add("focused");
    
    // If it's the first row, ensure proper spacing from top
    const cardsPerRow = computeCardsPerRow();
    if (index < cardsPerRow) {
      // First row - scroll grid container to show cards properly
      const gridContainer = qs(".movies-grid-container");
      if (gridContainer) {
        gridContainer.scrollTop = 0;
      }
    }
    
    movieCards[index].scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
    currentSection = "movies";

    const movieId = movieCards[index].dataset.movieId;
    console.log(
      "✅ Focused card with movie ID:",
      movieId,
      "at DOM index:",
      index
    );
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
    
    // ⭐ Trigger marquee animation on the focused item
    setTimeout(() => {
        const focusedCatName = items[index].querySelector('.cat-name');
        if (focusedCatName && focusedCatName.classList.contains('marquee-text')) {
            // Reset animation
            focusedCatName.style.animation = 'none';
            void focusedCatName.offsetWidth; // Trigger reflow
            focusedCatName.style.animation = '';
        }
    }, 50);
}
function setFocusOnSearch() {
    // category search (sidebar search)
    removeAllFocus();
    
    const container = qs(".search-category-name"); // Parent container
    const input = qs(".search-category-input"); // Input element

    if (container && input) {
      container.classList.add("focused"); // Add focused to parent!
      input.blur(); // Keep input blurred
      isSearchInputActive = false; // Reset edit mode
      
      // Force scroll the container into view at the very top
      setTimeout(() => {
        container.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
        
        // Also scroll all parent containers to top
        const mainContainer = qs(".livetv-main-container");
        const sidebar = qs(".movies-sidebar");
        
        if (mainContainer) {
          mainContainer.scrollTop = 0;
        }
        if (sidebar) {
          sidebar.scrollTop = 0;
        }
        window.scrollTo(0, 0);
      }, 50);
    }
    currentSection = "search";
  }

function setFocusOnHeaderSearch() {
    // header search (top)
    removeAllFocus();
    
    // Scroll to top to ensure header is visible
    const mainContainer = qs(".livetv-main-container");
    const gridContainer = qs(".movies-grid-container");
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (gridContainer) {
      gridContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    const container = qs(".search-container"); // Parent container
    const input = qs(".search-input"); // Input element

    if (container && input) {
      container.classList.add("focused"); // Add focused to parent!
      input.blur(); // Keep input blurred
      isHeaderSearchActive = false; // Reset edit mode
    }
    currentSection = "header";
  }

  function setFocusOnExpandBtn() {
    removeAllFocus();
    const btn = qs("#expandBtn");
    if (btn) {
      btn.classList.add("focused");
      btn.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
    currentSection = "expand";
  }

  function setFocusOnExpandBtn() {
    removeAllFocus();
    const btn = qs("#expandBtn");
    if (btn) {
      btn.classList.add("focused");
      btn.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
    currentSection = "expand";
  }

  // ADD THIS NEW FUNCTION:
  function setFocusOnScrollBtn() {
    removeAllFocus();
    const btn = qs("#scrollToTopBtn");
    if (btn) {
      btn.classList.add("focused");
      // Don't scroll - button is fixed position
    }
    currentSection = "scrollBtn";
  }

function removeAllFocus() {
    qsa(".movie-card").forEach((c) => c.classList.remove("focused"));
    
    // ⭐ Reset categories and stop marquee
    qsa(".movies-category-item").forEach((c) => {
        c.classList.remove("focused");
        const catName = c.querySelector('.cat-name');
        if (catName) {
            // Reset to truncated state
            catName.style.animation = 'none';
            catName.style.transform = 'translateX(0)';
        }
    });

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
  const isAdultCat = isMovieAdultCategory(catName);
  const isUnlocked = unlockedMovieAdultCatIds.has(catId);
  
  // Check if locked adult category
  if (isAdultCat && !!getParentalPassword() && !isUnlocked) {
    showPasswordModal(null, catName, () => {
      unlockedMovieAdultCatIds.add(catId);
      selectedCategoryId = catId;
      visibleCount = PAGE_SIZE;
      qsa(".movies-category-item").forEach((i) => i.classList.remove("active"));
      cat.classList.add("active");
      renderCards();
      
      // ⭐ Check if category has movies
      const selectedCat = categories.find(c => String(c.id) === catId);
      if (selectedCat && selectedCat.movies && selectedCat.movies.length > 0) {
        setTimeout(() => setFocusOnCard(0), 50);
      } else {
        // No movies - stay on category
        const catIdx = cat.dataset.idx;
        setTimeout(() => setFocusOnCategory(Number(catIdx)), 50);
      }
    });
    return;
  }
  
  // Normal category selection
  selectedCategoryId = catId;
  visibleCount = PAGE_SIZE;
  qsa(".movies-category-item").forEach((i) => i.classList.remove("active"));
  cat.classList.add("active");
  renderCards();
  
  // ⭐ Check if category has movies
  const selectedCat = categories.find(c => String(c.id) === catId);
  if (selectedCat && selectedCat.movies && selectedCat.movies.length > 0) {
    setTimeout(() => setFocusOnCard(0), 50);
  } else {
    // No movies - stay on category
    const catIdx = cat.dataset.idx;
    setTimeout(() => setFocusOnCategory(Number(catIdx)), 50);
  }
}

  // Card click handler (delegated)
function onCardClick(e) {
  const card = e.target.closest(".movie-card");
  if (!card) return;
  
  const movieId = Number(card.dataset.movieId);
  const isAdult = card.dataset.isAdult === "true";
  
  // If adult content, show password modal
  if (isAdult) {
    const movieObj = (window.allMoviesStreams || []).find(m => Number(m.stream_id) === movieId);
    const movieName = movieObj ? (movieObj.name || movieObj.title || "Movie") : "Movie";
    
    showPasswordModal(movieId, movieName, () => {
      // On successful password, proceed to detail page
      openMovieDetail(movieId);
    });
    return;
  }
  
  // Not adult content, open directly
  openMovieDetail(movieId);
}

// Helper function to open movie detail
function openMovieDetail(movieId) {
  const movieObj = (window.allMoviesStreams || []).find(m => Number(m.stream_id) === movieId);
  if (movieObj) {
    localStorage.setItem("selectedMovieData", JSON.stringify(movieObj));
    localStorage.setItem("selectedMovieId", movieId);
    localStorage.setItem("moviesSelectedCategoryId", selectedCategoryId);
    localStorage.setItem("moviesCategoryIndex", currentCategoryIndex);
    localStorage.setItem("moviesCardIndex", currentFocusIndex);
    localStorage.setItem("currentPage", "moviesDetailPage");
    
    const lp = qs("#loading-progress");
    if (lp) lp.style.display = "none";
    
    if (typeof navigateTo === "function") {
      navigateTo("movie-detail-page");
    } else if (typeof Router !== "undefined" && Router.showPage) {
      Router.showPage("movie-detail-page");
    }
  }
}

  function toggleFavoriteItem(movieId) {
    console.log(
      "🎯 toggleFavoriteItem called with movieId:",
      movieId,
      "type:",
      typeof movieId
    );

    const playlist = JSON.parse(localStorage.getItem("playlistsData")).find(
      (pl) => pl.playlistName === currentPlaylistName
    );

    if (!playlist) return;

    playlist.favouriteMovies = playlist.favouriteMovies || [];

    // FIXED: Ensure we're comparing numbers with numbers
    const movieIdNum = Number(movieId);
    const index = playlist.favouriteMovies.findIndex(
      (id) => Number(id) === movieIdNum
    );
    const isAdding = index === -1;

    console.log("📋 Current favorites:", playlist.favouriteMovies);
    console.log("🔍 Found at index:", index, "| isAdding:", isAdding);

    if (index > -1) {
      // Remove from favorites
      playlist.favouriteMovies.splice(index, 1);
      console.log("❌ Removed from favorites");
    } else {
      // Add to favorites
      playlist.favouriteMovies.push(movieIdNum);
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
    favoritesMoviesIds.length = 0;
    favoritesMoviesIds.push(...playlist.favouriteMovies);

    console.log("💾 Updated favorites:", favoritesMoviesIds);

    // Update UI
    updateFavoritesUI(movieId, isAdding);

    // Show toast notification
    if (typeof Toaster !== "undefined") {
      Toaster.showToast(
        isAdding ? "success" : "error",
        isAdding ? "Added to Favorites" : "Removed from Favorites"
      );
    }
  }

  function updateFavoritesUI(movieId, isAdding) {
    // Update favorites category
    const favCategory = categories.find((c) => c.id === "-1");
    if (favCategory) {
      if (isAdding) {
        const movieToAdd = window.allMoviesStreams.find(
          (m) => Number(m.stream_id) === Number(movieId)
        );
        if (
          movieToAdd &&
          !favCategory.movies.some(
            (m) => Number(m.stream_id) === Number(movieId)
          )
        ) {
          favCategory.movies.push(movieToAdd);
        }
      } else {
        favCategory.movies = favCategory.movies.filter(
          (m) => Number(m.stream_id) !== Number(movieId)
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

    // Update heart icon on all cards with this movieId
    const allCurrentCards = qsa(".movie-card");
    allCurrentCards.forEach((card) => {
      const cardMovieId = Number(card.dataset.movieId);
      if (cardMovieId === Number(movieId)) {
        const heartIcon = card.querySelector(".movie-card-heart-icon");
        const cardElement = card;

        if (isAdding) {
          if (!heartIcon) {
            const heartImg = document.createElement("img");
            heartImg.src = "/assets/heart.png";
            heartImg.alt = "heart-icon";
            heartImg.className = "movie-card-heart-icon";
            cardElement.insertBefore(
              heartImg,
              cardElement.querySelector(".movie-hover")
            );
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

  // Remote navigation handler
  function handleRemoteNavigation(e) {
    const currentPage = localStorage.getItem("currentPage");
    console.log("🔍 Key pressed:", e.key, "| Current page:", currentPage);

    // ONLY handle when actually on movies page (not detail page!)
    if (currentPage !== "moviesPage") {
      console.log("⛔ Not on movies page, ignoring");
      return;
    }

    const backKeys = [10009, "Escape", "Back", "BrowserBack", "XF86Back"];

    // Inside handleRemoteNavigation function in MoviesPage

    // Back -> go to dashboard (or previous)
    if (backKeys.includes(e.key) || backKeys.includes(e.keyCode)) {
      // Don't handle back during state restoration
      if (isRestoringState) {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      // ⭐ CLEAR all saved state when going back to dashboard
      localStorage.removeItem("moviesSelectedCategoryId");
      localStorage.removeItem("moviesCategoryIndex");
      localStorage.removeItem("moviesCardIndex");

      localStorage.setItem("currentPage", "dashboard");

      if (typeof Router !== "undefined" && Router.showPage) {
        Router.showPage("dashboard");
      } else if (typeof navigateTo === "function") {
        navigateTo("dashboard-page");
      }
      return;
    }

    const cardsContainer = qs(".movies-grid");
    const cards = cardsContainer
      ? Array.from(cardsContainer.querySelectorAll(".movie-card"))
      : [];
    const categoriesEls = Array.from(
      qs(".movies-categories-list").querySelectorAll(".movies-category-item")
    );
    const cardsPerRow = computeCardsPerRow();

    const isUp = e.key === "ArrowUp" || e.keyCode === 38;
    const isDown = e.key === "ArrowDown" || e.keyCode === 40;
    const isLeft = e.key === "ArrowLeft" || e.keyCode === 37;
    const isRight = e.key === "ArrowRight" || e.keyCode === 39;
    const isEnter = e.key === "Enter" || e.keyCode === 13;

    if (isUp) {
      if (
        (currentSection === "search" || currentSection === "header") &&
        (isSearchInputActive || isHeaderSearchActive)
      ) {
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

  if (currentSection === "movies") {
        const isTopRow = currentFocusIndex < cardsPerRow;

        if (isTopRow) {
          // Scroll to top when leaving movies grid
          const mainContainer = qs(".livetv-main-container");
          const gridContainer = qs(".movies-grid-container");
          const sidebar = qs(".movies-sidebar");
          const categoriesWrapper = qs(".movies-categories-wrapper");
          
          if (mainContainer) {
            mainContainer.scrollTo({ top: 0, behavior: "smooth" });
          }
          if (gridContainer) {
            gridContainer.scrollTo({ top: 0, behavior: "smooth" });
          }
          // Scroll sidebar to top to show search input
          if (sidebar) {
            sidebar.scrollTo({ top: 0, behavior: "smooth" });
          }
          if (categoriesWrapper) {
            categoriesWrapper.scrollTo({ top: 0, behavior: "smooth" });
          }
          window.scrollTo({ top: 0, behavior: "smooth" });

          // ⭐ EXPANDED → jump to LAST CATEGORY (bottom-right)
          if (isExpanded) {
            const lastCategoryIndex = categories.length - 1;
            setFocusOnCategory(lastCategoryIndex);
            return;
          }

          // ⭐ NOT EXPANDED → from ANY top card → go to CATEGORY SEARCH
          setFocusOnSearch();
          return;
        }

        // Normal UP movement (not top row)
        setFocusOnCard(currentFocusIndex - cardsPerRow);
        
        return;
      }
      
    if (currentSection === "categories") {
  const perRow = computeCategoriesPerRow();
  const prev = currentCategoryIndex - perRow;

  // Collapsed → check if cards exist before moving
  if (!isExpanded) {
    // if (cards.length > 0) {
             setFocusOnHeaderSearch();

    // }
    // Stay on category if no cards
    e.preventDefault();
    return;
  }

  // EXPANDED: check if we're in the first row
  const isInFirstRow = currentCategoryIndex < perRow;

  console.log("isInFirstRow" , isInFirstRow);
  

  if (isInFirstRow) {
    // From first row → go to search
    setFocusOnSearch();
  } else if (prev >= 0) {
    // Not in first row, move up normally
    setFocusOnCategory(prev);
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
    // openSidebar('moviesPage');
           setFocusOnSearch();


    e.preventDefault();
    return;
  }


      if (
        (currentSection === "search" || currentSection === "header") &&
        (isSearchInputActive || isHeaderSearchActive)
      ) {
        isSearchInputActive = false;
        isHeaderSearchActive = false;

        const searchInput = qs(".search-category-input");
        const searchContainer = qs(".search-category-name");
        const headerInput = qs(".search-input");
        const headerContainer = qs(".search-container");

        if (searchInput) searchInput.blur();
        if (searchContainer) searchContainer.classList.remove("focused");
        if (headerInput) {
          headerInput.blur();
          headerInput.selectionStart = headerInput.selectionEnd = 0; // Remove cursor
        }
        if (headerContainer) headerContainer.classList.remove("focused");
      }

      // If header search (top search input) -> go to sidebar category search
      if (currentSection === "header") {
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
  const lastRowStartIndex =
    Math.floor((totalCategories - 1) / perRow) * perRow;
  const isInLastRow = currentCategoryIndex >= lastRowStartIndex;

 if (isInLastRow) {
  // From last row → ALWAYS go to first card (index 0)
  currentSection = "movies";
  currentFocusIndex = 0;
  setFocusOnCard(0);
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
        // from expand go to movies
        setFocusOnCard(0);
        e.preventDefault();
        return;
      }

      /* -----------------------------
         FIXED: DOWN inside CARD GRID
         ----------------------------- */
      /* -----------------------------
         FIXED: DOWN inside CARD GRID
         ----------------------------- */
      if (currentSection === "movies") {
        const nextIndex = currentFocusIndex + cardsPerRow;

        console.log(
          "⬇️ DOWN in movies - currentFocusIndex:",
          currentFocusIndex,
          "cardsPerRow:",
          cardsPerRow,
          "nextIndex:",
          nextIndex,
          "cards.length:",
          cards.length
        );

        if (nextIndex < cards.length) {
          // Normal move down
          console.log("✅ Moving to nextIndex:", nextIndex);
          setFocusOnCard(nextIndex);
        } else {
          // We're at or near the bottom - try to load more
          const cat = categories.find(
            (c) => String(c.id) === String(selectedCategoryId)
          );
          if (cat && visibleCount < cat.movies.length) {
            console.log("📥 Loading more cards...");
            loadMore();
            // After loading, focus on the next card down
            setTimeout(() => {
              const updatedCards = Array.from(
                document.querySelectorAll(".movie-card")
              );
              if (nextIndex < updatedCards.length) {
                setFocusOnCard(nextIndex);
              }
            }, 50);
          } else {
            console.log("⚠️ Already at bottom, cannot move down");
          }
        }

        e.preventDefault();
        return;
      }
    }

    /* ---------- LEFT ---------- */
    if (isLeft) {
      if (currentSection === "scrollBtn") {
        // Go back to last focused card
        setFocusOnCard(currentFocusIndex);
        e.preventDefault();
        return;
      }

        if (currentSection === "menuDots") {
    setFocusOnHeaderSearch();
    e.preventDefault();
    return;
  }

      if (
        (currentSection === "search" || currentSection === "header") &&
        (isSearchInputActive || isHeaderSearchActive)
      ) {
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

      if (currentSection === "movies") {
        if (currentFocusIndex % cardsPerRow === 0) {
          // Already at leftmost column - don't move
          e.preventDefault();
          return;
        } else {
          setFocusOnCard(currentFocusIndex - 1);
        }
      } else if (currentSection === "categories") {
        const perRow = computeCategoriesPerRow();
  const isLeftmostColumn = (currentCategoryIndex % perRow) === 0;
  
  if (isLeftmostColumn) {
    // Already at leftmost column - don't move
    e.preventDefault();
    return;
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

    /* ---------- RIGHT ---------- */
    if (isRight) {
      if (
        (currentSection === "search" || currentSection === "header") &&
        (isSearchInputActive || isHeaderSearchActive)
      ) {
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
        const isLastColumn = currentCategoryIndex % perRow === perRow - 1;

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
        // rule: last column → expand btn (ALWAYS)
        if (isLastColumn) {
          setFocusOnExpandBtn();
          e.preventDefault();
          return;
        }

        // if next index doesn't exist -> also go expand btn
        if (nextIdx >= categoriesEls.length) {
          setFocusOnExpandBtn();
          e.preventDefault();
          return;
        }

        // normal move
        setFocusOnCategory(nextIdx);
        e.preventDefault();
        return;
      } else if (currentSection === "movies") {
        const isRightmostColumn =
          currentFocusIndex % cardsPerRow === cardsPerRow - 1;
        const isLastCard = currentFocusIndex === cards.length - 1;

        if (isRightmostColumn || isLastCard) {
          // Go to scroll-to-top button
          setFocusOnScrollBtn();
          e.preventDefault();
          return;
        }

        setFocusOnCard(currentFocusIndex + 1);
        e.preventDefault();
        return;
      } else if (currentSection === "expand") {
        // from expand button → go to movies
        // setFocusOnCard(0);
        e.preventDefault();
        return;
      }
    }

    /* ---------- ENTER / SELECT ---------- */
    /* ---------- ENTER / SELECT ---------- */
    /* -----------------------------------------
      ENTER → LONG PRESS (Fav) / SHORT PRESS (Open Detail)
-------------------------------------------- */

    /* ---------- ENTER / SELECT ---------- */
    /* ---------- ENTER / SELECT ---------- */
    if (isEnter && currentSection === "movies") {
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

      const targetMovieId = Number(currentCard.dataset.movieId);
      console.log(
        "▶️ Starting long press timer for movie:",
        targetMovieId,
        "at index:",
        currentFocusIndex
      );

      enterState.isProcessingEnter = true;
      enterState.isLongPressExecuted = false;

      enterState.enterPressTimer = setTimeout(() => {
        console.log(
          "🔥 LONG PRESS EXECUTED - Toggle Favorite for:",
          targetMovieId
        );
        enterState.isLongPressExecuted = true;

        // ⭐ Use the captured movieId, not recalculating from currentFocusIndex
        toggleFavoriteItem(targetMovieId);

        enterState.enterPressTimer = null;
      }, LONG_PRESS_DURATION);

      return;
    }

    // REPLACE THIS ENTIRE BLOCK:
    if (isEnter && currentSection !== "movies") {
      e.preventDefault();

        if (currentSection === "menuDots") {
    console.log("📂 Opening sidebar from menu dots");
    openSidebar('moviesPage');
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
        return;
      }

      if (currentSection === "header") {
        // Toggle edit mode for header search
        isHeaderSearchActive = !isHeaderSearchActive;
        const input = qs(".search-input");
        if (input) {
          if (isHeaderSearchActive) {
            input.focus();
            const textLength = input.value.length;
            input.setSelectionRange(textLength, textLength);
          } else {
            input.blur();
          }
        }
        return;
      }
if (currentSection === "categories") {
  // Select category
  const items = qsa(".movies-category-item");
  if (items[currentCategoryIndex]) {
    const catId = items[currentCategoryIndex].dataset.id;
    const selectedCat = categories.find(c => String(c.id) === String(catId));
    
    items[currentCategoryIndex].click();
    
    // ⭐ If no movies in category, keep focus on category
    if (!selectedCat || !selectedCat.movies || selectedCat.movies.length === 0) {
      setTimeout(() => {
        setFocusOnCategory(currentCategoryIndex);
      }, 100);
    }
  }
  e.preventDefault();
  return;
}

      if (currentSection === "expand") {
        // Toggle expand
        const expandBtn = qs("#expandBtn");
        if (expandBtn) expandBtn.click();
        return;
      }
    }

    if (isEnter && currentSection !== "movies") {
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
            const textLength = input.value.length;
            input.setSelectionRange(textLength, textLength);
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
      if (currentSection === "scrollBtn") {
        const scrollBtn = qs("#scrollToTopBtn");
        if (scrollBtn) scrollBtn.click();
        e.preventDefault();
        return;
      }
    }
  }

  // After handleRemoteNavigation function, add:
  // After handleRemoteNavigation function, update handleKeyUp:
  function handleKeyUp(e) {
    const currentPage = localStorage.getItem("currentPage");

    if (currentPage !== "moviesPage") return;

    const isEnter = e.key === "Enter" || e.keyCode === 13;
    if (!isEnter) return;

    if (currentSection !== "movies") {
      return;
    }

    if (!enterState.isProcessingEnter && !enterState.enterPressTimer) {
      console.log("⚠️ Keyup without keydown, ignoring");
      e.preventDefault();
      return;
    }

    if (enterState.isLongPressExecuted) {
      console.log("⏭️ Long press completed, skipping navigation");

     if (enterState.enterPressTimer) {
    clearTimeout(enterState.enterPressTimer);
    enterState.enterPressTimer = null;
    enterState.isProcessingEnter = false;
    
    console.log("➡️ SHORT PRESS → OPEN MOVIE DETAIL");
    
    const card = movieCards[currentFocusIndex];
    if (!card) return;

    const movieId = Number(card.dataset.movieId);
    const isAdult = card.dataset.isAdult === "true";
    
    // If adult content, show password modal
    if (isAdult) {
      const movieObj = (window.allMoviesStreams || []).find(
        (m) => Number(m.stream_id) === movieId
      );
      const movieName = movieObj ? (movieObj.name || movieObj.title || "Movie") : "Movie";
      
      showPasswordModal(movieId, movieName, () => {
        openMovieDetail(movieId);
      });
    } else {
      openMovieDetail(movieId);
    }
    
    e.preventDefault();
    return;
}

      enterState.isLongPressExecuted = false;

      setTimeout(() => {
        enterState.isProcessingEnter = false;
        console.log("✅ Ready for next press");
      }, 200);

      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (enterState.enterPressTimer) {
      clearTimeout(enterState.enterPressTimer);
      enterState.enterPressTimer = null;
      enterState.isProcessingEnter = false;

      console.log("➡️ SHORT PRESS → OPEN MOVIE DETAIL");

      const card = movieCards[currentFocusIndex];
      if (!card) return;

      const movieId = Number(card.dataset.movieId);
      const movieObj = (window.allMoviesStreams || []).find(
        (m) => Number(m.stream_id) === movieId
      );

      if (movieObj) {
        localStorage.setItem("selectedMovieData", JSON.stringify(movieObj));
        localStorage.setItem("selectedMovieId", movieId);
        localStorage.setItem("moviesSelectedCategoryId", selectedCategoryId);
        localStorage.setItem("moviesCategoryIndex", currentCategoryIndex);
        localStorage.setItem("moviesCardIndex", currentFocusIndex);
        localStorage.setItem("currentPage", "moviesDetailPage");

        if (typeof Router !== "undefined" && Router.showPage) {
          Router.showPage("movie-detail-page");
        } else if (typeof navigateTo === "function") {
          navigateTo("movie-detail-page");
        }
      }

      e.preventDefault();
      return;
    }

    enterState.isProcessingEnter = false;
    console.log("⚠️ Orphaned keyup detected, ignoring");
    e.preventDefault();
  }

  function computeCardsPerRow() {
    const grid = qs(".movies-grid");
    if (!grid) return 7;

    const gridStyle = window.getComputedStyle(grid);
    const gridColumns = gridStyle.gridTemplateColumns.split(" ").length;

    return gridColumns || 7;
  }


  function hideLoadingScreen() {
  const loadingScreen = qs("#moviesLoadingScreen");
  if (loadingScreen) {
    loadingScreen.classList.add("fade-out");
    setTimeout(() => {
      loadingScreen.style.display = "none";
    }, 300);
  }
}


  // compute categories per row (7 / 8 toggle)
  function computeCategoriesPerRow() {
    return isExpanded ? 8 : 7;
  }

  // Header search functionality for movies
  // Header search functionality for movies - searches only in selected category
  function handleHeaderSearch(searchQuery) {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      // Empty search - restore original category movies
      buildCategoryMap();
      renderCards();

      return;
    }

    console.log(
      "🔍 Searching movies in category",
      selectedCategoryId,
      "for:",
      query
    );

    // Get movies from CURRENT CATEGORY ONLY
    const currentCat = categories.find(
      (c) => String(c.id) === String(selectedCategoryId)
    );
    if (!currentCat) {
      console.log("⚠️ No category selected");
      return;
    }

    // Get original movies from the category (from moviesByCategory map)
    const categoryMovies = moviesByCategory[selectedCategoryId] || [];

    const searchResults = categoryMovies.filter((m) => {
      const title = (m.name || m.title || "").toLowerCase();
      const desc = (m.overview || m.description || m.plot || "").toLowerCase();
      return title.includes(query) || desc.includes(query);
    });

    console.log(
      "📊 Found",
      searchResults.length,
      "results in current category"
    );

    // Update current category with search results
    currentCat.movies = searchResults;
    currentCat._movieCount = searchResults.length;

    visibleCount = Math.min(PAGE_SIZE, searchResults.length);
    renderCards();

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
      <p>No movies found for "${escapeHtml(query)}"</p>
      <p style="font-size: 14px; opacity: 0.7; margin-top: 10px;">Try a different search term</p>
    </div>
  `;
  noDataDiv.style.display = 'flex';
}
  }

  // Initialize & event registration
  setTimeout(() => {
    buildCategoryMap();

    const continueWatchingCat = categories.find((c) => c.id === "-2");
    console.log("🎬 Continue Watching Category:", continueWatchingCat);
    if (continueWatchingCat) {
      console.log(
        "📊 Continue Watching Count:",
        continueWatchingCat._movieCount
      );
      console.log("📦 Continue Watching Movies:", continueWatchingCat.movies);
    }

    renderCategoriesUI();
    visibleCount = PAGE_SIZE;
    renderCards();

    setTimeout(() => {
  hideLoadingScreen();
}, 100);


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
const savedCatId = localStorage.getItem("moviesSelectedCategoryId");
const savedCatIndex = localStorage.getItem("moviesCategoryIndex");
const savedCardIndex = localStorage.getItem("moviesCardIndex");

console.log(
  "🔄 Initializing Movies Page - savedCatId:",
  savedCatId,
  "savedCardIndex:",
  savedCardIndex
);

const comingFromDashboard = !savedCatId && !savedCardIndex;
if (comingFromDashboard) {
  // Coming from dashboard or fresh - start from beginning
  console.log("🆕 Fresh start from dashboard");

  if (!pageState) {
    console.error("❌ pageState is undefined in initialization!");
    return;
  }

  // ⭐ ALWAYS start with 3rd category (index 2) - first regular category
  const startCategoryIndex = 2; // Skip Favorites (0) and Continue Watching (1)
  
  // Set the selected category to the 3rd category
  if (categories.length > startCategoryIndex) {
    selectedCategoryId = categories[startCategoryIndex].id;
    currentCategoryIndex = startCategoryIndex;
    
    // Update UI to show active category
    renderCategoriesUI();
    
    // Render cards for this category
    visibleCount = PAGE_SIZE;
    renderCards();
    
    console.log("✅ Starting with category:", categories[startCategoryIndex].name);
  } else {
    // Fallback if not enough categories
    selectedCategoryId = categories[0].id;
    currentCategoryIndex = 0;
  }

  pageState.currentFocusIndex = 0;
  pageState.currentCategoryIndex = startCategoryIndex;
  pageState.currentSection = "movies";
  pageState.lastFocusedCategory = startCategoryIndex;

  // ⭐ Remove any stale focus classes
  qsa(".movie-card").forEach((c) => c.classList.remove("focused"));
  qsa(".movies-category-item").forEach((c) =>
    c.classList.remove("focused")
  );

  setTimeout(() => {
    // Check if the 3rd category has movies
    const startCategory = categories[startCategoryIndex];
    if (startCategory && startCategory.movies && startCategory.movies.length > 0) {
      console.log("🎯 Setting focus to first card in 3rd category");
      pageState.currentFocusIndex = 0;
      currentFocusIndex = 0;
      setFocusOnCard(0);
    } else {
      console.log("⚠️ 3rd category has no movies, focusing on category");
      setFocusOnCategory(startCategoryIndex);
    }
    console.log(
      "✅ Focus set. currentFocusIndex is now:",
      currentFocusIndex
    );
  }, 100);
} else {
  // Coming from movie detail page - restore position
  console.log("↩️ Restoring from detail page");
  selectedCategoryId = String(savedCatId);
  currentCategoryIndex = savedCatIndex ? Number(savedCatIndex) : 2; // Default to 3rd category
  currentFocusIndex = savedCardIndex ? Number(savedCardIndex) : 0;
  visibleCount = savedCardIndex
    ? Math.max(PAGE_SIZE, Number(savedCardIndex) + PAGE_SIZE)
    : PAGE_SIZE;
  renderCategoriesUI();
  renderCards();
  hideLoadingScreen();

  setTimeout(() => {
    if (savedCardIndex) {
      console.log("🎯 Restoring focus to card:", savedCardIndex);
      setFocusOnCard(Number(savedCardIndex));
    } else {
      setFocusOnCategory(currentCategoryIndex);
    }
  }, 80);
  localStorage.removeItem("moviesSelectedCategoryId");
  localStorage.removeItem("moviesCategoryIndex");
  localStorage.removeItem("moviesCardIndex");
}

     const menuDots = document.querySelector('.menu-dots');
if (menuDots) {
    
    const menuDotsClickHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("🔘 Menu dots clicked, current page:", localStorage.getItem("currentPage"));
        
        // Ensure we're on the movies page
        if (localStorage.getItem("currentPage") !== "moviesPage") {
            console.log("⚠️ Not on movies page, setting it now");
            localStorage.setItem("currentPage", "moviesPage");
        }
        
        openSidebar('moviesPage');
    };
    menuDots.removeEventListener('click', menuDotsClickHandler); // Remove old listener
    
    menuDots.addEventListener('click', menuDotsClickHandler);
}
    

    const menuKeyHandler = (e) => {
    const currentPage = localStorage.getItem('currentPage');
    if (currentPage !== 'moviesPage') return;
    
    // Handle Menu/ContextMenu key
    if (e.key === 'Menu' || e.key === 'ContextMenu' || e.key === 'F2') {
        openSidebar('moviesPage');
        e.preventDefault();
    }
};

document.addEventListener('keydown', menuKeyHandler);

    // Add keydown handler for menu button (if needed)
    document.addEventListener('keydown', (e) => {
        if (localStorage.getItem('currentPage') === 'moviesPage') {
            if (e.key === 'Menu' || e.key === 'ContextMenu') {
                openSidebar('moviesPage');
                e.preventDefault();
            }
        }
    });

    // ⭐ IMPORTANT: Remove any existing listeners first
    document.removeEventListener("click", categoryClickHandler);
    document.removeEventListener("click", cardClickHandler);
    document.removeEventListener("keydown", keydownHandler);
    document.removeEventListener("keyup", keyupHandler);

    // Create handler references
    categoryClickHandler = (e) => onCategoryClick(e);
    cardClickHandler = (e) => onCardClick(e);
    keydownHandler = (e) => handleRemoteNavigation(e);
    keyupHandler = (e) => handleKeyUp(e);

    // Add listeners
    document.addEventListener("click", categoryClickHandler);
    document.addEventListener("click", cardClickHandler);
    document.addEventListener("keydown", keydownHandler);
    document.addEventListener("keyup", keyupHandler);

    // Expand toggle
    const expandBtn = qs("#expandBtn");
    const sidebar = qs(".movies-sidebar");
 if (expandBtn) {
  expandBtnClickHandler = () => {
    isExpanded = !isExpanded;

    const wrapper = qs(".movies-categories-wrapper");
    if (wrapper) wrapper.classList.toggle("expanded", isExpanded);

    if (sidebar) sidebar.classList.toggle("expanded", isExpanded);
    expandBtn.classList.toggle("rotated", isExpanded);

    const searchInput = qs(".search-category-input");
    const hasSearchText = searchInput && searchInput.value.trim().length > 0;

    if (!hasSearchText && sidebar) {
      sidebar.classList.remove("filtering");
    }

    // ⭐ Reinitialize marquee after expansion state changes
    setTimeout(() => {
      initCategoryMarquee();
      
      // If a category is focused, restart its animation
      if (currentSection === "categories") {
        const items = qsa(".movies-category-item");
        if (items[currentCategoryIndex]) {
          const focusedCatName = items[currentCategoryIndex].querySelector('.cat-name');
          if (focusedCatName && focusedCatName.classList.contains('marquee-text')) {
            focusedCatName.style.animation = 'none';
            void focusedCatName.offsetWidth;
            focusedCatName.style.animation = '';
          }
        }
      }
    }, 100);

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

      const filtered = categories.filter((c) =>
        c.name.toLowerCase().includes(q)
      );
      if (list) {
       list.innerHTML = filtered.map((c, idx) => {
    const movieCount = c._movieCount || 0;
   return `
<div class="movies-category-item ${String(c.id) === String(selectedCategoryId) ? "active" : ""}" 
     data-id="${c.id}" 
     data-idx="${idx}">
    <div class="cat-item-content">
        <span class="cat-name" title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</span>
        <span class="cat-count-badge">(${c._movieCount || 0})</span>
    </div>
</div>`;
}).join("");

        const expandBtn = qs("#expandBtn");
        if (expandBtn) {
          expandBtn.style.display = filtered.length > 0 ? "flex" : "none";
        }
        
        setTimeout(() => initCategoryMarquee(), 100);
      }
    }, 350);
  };

  searchEl.removeEventListener("input", searchInputHandler);
  searchEl.addEventListener("input", searchInputHandler);
}


      const sortingContainer = document.createElement('div');
    sortingContainer.innerHTML = SortingDialog();
    document.body.appendChild(sortingContainer);
    
    // Attach sorting dialog events
    attachSortingDialogEvents();
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

    // Scroll to top button handler
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

    // cleanup
    MoviesPage.cleanup = () => {
      console.log("🧹 MoviesPage cleanup called - removing event listeners");

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
  delete window.renderMovies;

      
    };
  }, 0);


  const now = new Date();
const time = formatTime(now);
// Expose render function for sidebar sorting

window.renderMovies = () => {
  console.log("🔄 Re-rendering movies with new sort order");
  
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
    currentSection = "movies";
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
  // Template
  return `
<div class="livetv-main-container">
  <header class="livetv-header">
      <div class="header-left">
          <img src="/assets/logo.png" class="app-logo" />
          <div>
           <span class="current-time">${time}</span>

            <span class="current-date">${new Date().toLocaleDateString([], {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}</span>
          </div>
      </div>
      <div class="live-indicator"><span class="current-time">Movies</span></div>
    <div class="header-right">
    <div class="search-container">
        <div class="search-icon"><img src="/assets/search.png" /></div>
        <input type="text" class="search-input" placeholder="Search Movies" />
    </div>
    <div class="menu-dots">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
    </div>
</div>

<!-- Add Sidebar Container -->
<div class="sidebar-container-movie" style="display: none;">
    ${Sidebar({ from: "moviesPage" })}
</div>

<!-- Add Sorting Dialog -->
${SortingDialog()}
  </header>

  <div class="movies-sidebar">
      <div class="search-category-name">
          <input type="text" placeholder="Search Categories" class="search-category-input" />
          <i class="fa fa-search search-category-icon"></i>
      </div>

      <div class="movies-categories-wrapper">
          <div class="movies-categories-list">
            <!-- categories injected here -->
          </div>

         <div class="category-toggle-btn" id="expandBtn" tabindex="0">
  <svg
    class="expand-icon"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Down arrow -->
    <path
      d="M12 5V19M12 19L5 12M12 19L19 12"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</div>

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

<!-- Minimal CSS patch additions + your original CSS preserved -->
<style>
/* Category name truncation with tooltip */
.movies-category-item .cat-name {
    max-width: 160px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    display: block;
}

/* Hover description 3-line clamp */
.hover-desc {
    font-size: 8px;
    line-height: 16px;
    max-width: 80%;
    margin: 0 auto;
    opacity: 0.95;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}


<!-- Loading Screen -->
<div id="moviesLoadingScreen" class="movies-loading-screen">
  <div class="movies-loading-content">
    <img src="/assets/logo.png" class="movies-loading-logo" alt="Loading" />
    <div class="movies-loading-spinner"></div>
    <p class="movies-loading-text">Loading Movies...</p>
  </div>
</div>
</style>
`;
}
