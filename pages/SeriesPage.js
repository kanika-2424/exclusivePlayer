
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

  let isRestoringState = false;
const LONG_PRESS_DURATION = 500;

const enterState = window.seriesPageEnterState;
const pageState = window.seriesPageState;

// Get favorites data (same structure as movies)
const currentPlaylistName = JSON.parse(
  localStorage.getItem("selectedPlaylist")
).playlistName;

const currentPlaylist = JSON.parse(
  localStorage.getItem("playlistsData")
).filter((pl) => pl.playlistName === currentPlaylistName)[0];

const favouriteSeriesIds = Array.isArray(currentPlaylist.favouriteSeries)
  ? currentPlaylist.favouriteSeries
  : [];

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

    // Normalize categories into our structure
   const normalizedCategories = allCats.map(c => ({
    id: String(c.category_id || c.id),
    name: c.category_name || c.name || `Cat ${c.category_id || c.id}`,
    parent_id: c.parent_id || 0,
    movies: [],
    _movieCount: 0
  }));

    categories = [favoritesCategory, ...normalizedCategories];


    // Build map skeleton
    seriesByCategory = {};
    categories.forEach(c => seriesByCategory[c.id] = []);

      seriesByCategory["-1"] = allFavoritesSeries;


    // Group series
    for (const s of allSeries) {
      const cid = String(s.category_id || (Array.isArray(s.category_ids) && s.category_ids[0]) || "-3");
      if (!seriesByCategory[cid]) seriesByCategory[cid] = [];
      seriesByCategory[cid].push(s);
    }

    // Attach to categories and compute counts
    categories.forEach(c => {
          if (c.id === "-1") return;

      c.movies = seriesByCategory[c.id] || [];
      c._movieCount = (c.movies && c.movies.length) || 0;
    });

    // If no selectedCategoryId, pick first with series or first category
    if (!selectedCategoryId) {
      const withSeries = categories.find(c => c._movieCount > 0);
      selectedCategoryId = withSeries ? withSeries.id : (categories[0] ? categories[0].id : null);
    }
  }

  // Render sidebar categories (same markup as movies so CSS applies)
  function renderCategoriesUI() {
    const wrapper = qs(".movies-categories-list");
    if (!wrapper) return;
    wrapper.innerHTML = categories.map((c, idx) => `
      <div class="movies-category-item ${String(c.id) === String(selectedCategoryId) ? 'active' : ''}" data-id="${c.id}" data-idx="${idx}">
        <span  style="display: -webkit-box; text-align: center;  margin: 0 auto; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; max-height: 1em;" class="" title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</span>
        
        
      </div>
    `).join("");

    // Show/hide expand button based on whether we have categories
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


    return `
      <div class="movie-card" data-movie-id="${seriesId}">
        <div class="movie-card-image-wrapper">
          <img src="${img}" alt="${escapeHtml(title)}" onerror="this.onerror=null;this.src='/assets/noImageFound.png'"/>
        </div>

        <div class="movie-rating-badge">
          <img src="/assets/star.png" alt="star" class="star-icon" />
          <span>${rating.toFixed(1)}</span>
        </div>

              ${showHeart ? '<img src="/assets/heart.png" alt="heart-icon" class="movie-card-heart-icon"/>' : ''}


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
    const items = (cat && Array.isArray(cat.movies)) ? cat.movies.slice(0, visibleCount) : [];
    if (!items || items.length === 0) {
      container.innerHTML = `<div class="movie-no-data"><p>No series found for this category.</p></div>`;
      movieCards = [];
      return;
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
    movieCards[index].scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
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
  }

  // Category click handler (delegated)
  function onCategoryClick(e) {
    const cat = e.target.closest(".movies-category-item");
    if (!cat) return;
    const catId = String(cat.dataset.id);
    selectedCategoryId = catId;
    visibleCount = PAGE_SIZE;
    qsa(".movies-category-item").forEach(i => i.classList.remove("active"));
    cat.classList.add("active");
    renderCards();
    setTimeout(() => setFocusOnCard(0), 50);
  }

  // Card click handler (delegated)
  function onCardClick(e) {
    const card = e.target.closest(".movie-card");
    if (!card) return;
    const seriesId = Number(card.dataset.seriesId);
    // Try common property names in data
    const seriesObj = (window.allSeriesStreams || []).find(s => Number(s.series_id || s.stream_id || s.id) === Number(seriesId));
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
      } else {
        console.log("Navigate to series detail", seriesId);
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
        const perRow = computeCategoriesPerRow();
        const prev = currentCategoryIndex - perRow;

        // If collapsed and trying to go up from categories -> go to header search
        if (!isExpanded) {
          setFocusOnHeaderSearch();
          e.preventDefault();
          return;
        }

        if (prev >= 0) {
          setFocusOnCategory(prev);
        } else {
          // at top row -> focus category search (sidebar search)
          setFocusOnSearch();
        }
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
        // From header search → go to lastFocusedCategory
        const input = qs(".search-category-input");
        if (input) input.blur();
        setFocusOnCategory(lastFocusedCategory);

        e.preventDefault();
        return;
      } else if (currentSection === "search") {
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
    console.log("📍 Opening detail for series:", seriesId, "at index:", currentFocusIndex);
    
    const seriesObj = (window.allSeriesStreams || []).find(
      (s) => Number(s.series_id || s.stream_id || s.id) === seriesId
    );

    if (seriesObj) {
      localStorage.setItem("selectedSeriesData", JSON.stringify(seriesObj));
      localStorage.setItem("selectedSeriesId", seriesId);
      localStorage.setItem("seriesSelectedCategoryId", selectedCategoryId);
      localStorage.setItem("seriesCategoryIndex", currentCategoryIndex);
      localStorage.setItem("seriesCardIndex", currentFocusIndex);
      localStorage.setItem("currentPage", "seriesDetailPage");

      if (typeof Router !== "undefined" && Router.showPage) {
        Router.showPage("series-detail-page");
      } else if (typeof navigateTo === "function") {
        navigateTo("series-detail-page");
      }
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
      container.innerHTML = `<div class="movie-no-data"><p>No series found for "${escapeHtml(query)}" in this category</p></div>`;
    }
  }
}


  // Initialize & event registration
 setTimeout(() => {
    buildCategoryMap();
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

    };
}, 0);

  // Template (keeps identical markup so Movies CSS works)
  return `
<div class="livetv-main-container">
  <header class="livetv-header">
      <div class="header-left">
          <img src="/assets/logo.png" class="app-logo" />
          <div>
            <span class="current-time">${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: true})}</span>
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
  </div>
</div>
`;
}
