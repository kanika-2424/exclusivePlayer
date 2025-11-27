
function MoviesPage() {
  // CONFIG
 const CARDS_PER_ROW = 7;
const ROWS_PER_LOAD = 3;  
const PAGE_SIZE = CARDS_PER_ROW * ROWS_PER_LOAD;// Load more chunk
  let categories = []; // [{ id: "233", name: "Estrenos 2025", parent_id: 0, _movieCount, movies: [] }]
  let moviesByCategory = {}; // map category_id -> [movies]
  let selectedCategoryId = null;
  let visibleCount = PAGE_SIZE;
  let lastFocusedCategory = 0;


  let isSearchInputActive = false; // For category search
let isHeaderSearchActive = false; // For header search


  // Focus / navigation state
  let currentSection = "movies"; // "header" | "search" | "categories" | "expand" | "movies"
  let currentFocusIndex = 0; // focused card index
  let currentCategoryIndex = 0; // focused category index for sidebar
  let isExpanded = false;

  // DOM helpers
  const qs = (s) => document.querySelector(s);
  const qsa = (s) => Array.from(document.querySelectorAll(s));

  // Utility: group movies by category_id (string)
  function buildCategoryMap() {
    const allCats = Array.isArray(window.moviesCategories) ? window.moviesCategories : [];
    const allMovies = Array.isArray(window.allMoviesStreams) ? window.allMoviesStreams : [];


    console.log("allMovies" , allMovies);
    
    // Normalize categories into our structure
    categories = allCats.map(c => ({
      id: String(c.category_id || c.id),
      name: c.category_name || c.category_name || c.name || `Cat ${c.category_id || c.id}`,
      parent_id: c.parent_id || 0,
      movies: [],
      _movieCount: 0
    }));

    // Build map skeleton
    moviesByCategory = {};
    categories.forEach(c => moviesByCategory[c.id] = []);

    // Group movies
    for (const m of allMovies) {
      const cid = String(m.category_id || (Array.isArray(m.category_ids) && m.category_ids[0]) || "-3");
      if (!moviesByCategory[cid]) moviesByCategory[cid] = [];
      moviesByCategory[cid].push(m);
    }

    // Attach to categories and compute counts
    categories.forEach(c => {
      c.movies = moviesByCategory[c.id] || [];
      c._movieCount = (c.movies && c.movies.length) || 0;
    });

    // If no selectedCategoryId, pick first with movies or first category
    if (!selectedCategoryId) {
      const withMovies = categories.find(c => c._movieCount > 0);
      selectedCategoryId = withMovies ? withMovies.id : (categories[0] ? categories[0].id : null);
    }
  }

  // Render sidebar categories
  function renderCategoriesUI() {
    const wrapper = qs(".movies-categories-list");
    if (!wrapper) return;
    wrapper.innerHTML = categories.map((c, idx) => `
      <div class="movies-category-item ${String(c.id) === String(selectedCategoryId) ? 'active' : ''}" data-id="${c.id}" data-idx="${idx}">
        <span class="cat-name" title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</span>
        <span class="cat-count">${c._movieCount}</span>
      </div>
    `).join("");
    
    // Show/hide expand button based on whether we have categories
    const expandBtn = qs("#expandBtn");
    const categoriesEls = Array.from(wrapper.querySelectorAll(".movies-category-item"));
    if (expandBtn) {
      expandBtn.style.display = categoriesEls.length > 0 ? "flex" : "none";
    }
  }

  // Build a single movie card HTML (safe)


  function adjustToFullRow(count) {
    const remainder = count % 7;
    return remainder === 0 ? count : count + (7 - remainder);
}

visibleCount = adjustToFullRow(visibleCount + PAGE_SIZE);

function buildMovieCardHTML(m) {
  console.log("m" , m);
  
  const img = m.stream_icon || "/assets/noImageFound.png";
  const title = m.name || m.title || "Untitled";
  const rating = isNaN(Number(m.rating_5based)) ? 0 : Math.min(5, Number(m.rating_5based));
  const desc = m.overview || m.description || m.plot || m.desc || "";
  
  return `
    <div class="movie-card" data-movie-id="${m.stream_id}">
      <div class="movie-card-image-wrapper">
        <img src="${img}" alt="${escapeHtml(title)}" />
      </div>
      
      <!-- Rating Badge -->
      <div class="movie-rating-badge">
        <img src="/assets/star.png" alt="star" class="star-icon" />
        <span>${rating.toFixed(1)}</span>
      </div>
      
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

  // Render cards for selectedCategoryId up to visibleCount
  function renderCards() {
    const container = qs(".movies-grid");
    if (!container) return;
    const cat = categories.find(c => String(c.id) === String(selectedCategoryId));
    const movies = (cat && Array.isArray(cat.movies)) ? cat.movies.slice(0, visibleCount) : [];
   
   console.log("mobies" , movies);
   
    if (!movies || movies.length === 0) {
      container.innerHTML = `<div class="movie-no-data"><p>No movies found for this category.</p></div>`;
      movieCards = [];
      return;
    }
    container.innerHTML = movies.map(buildMovieCardHTML).join("");
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
    movieCards = Array.from(qs(".movies-grid").querySelectorAll(".movie-card"));
    removeAllFocus();
    
    // Blur any input fields when focusing cards
    const searchInput = qs(".search-category-input");
    if (searchInput) searchInput.blur();
    
    if (!movieCards || movieCards.length === 0) {
      currentSection = "movies";
      currentFocusIndex = 0;
      return;
    }
    index = Math.max(0, Math.min(index, movieCards.length - 1));
    currentFocusIndex = index;
    movieCards[index].classList.add("focused");
    movieCards[index].scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
    currentSection = "movies";
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
    const movieId = Number(card.dataset.movieId);
    const movieObj = (window.allMoviesStreams || []).find(m => Number(m.stream_id) === Number(movieId));
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
      } else {
        console.log("Navigate to movie detail", movieId);
      }
    }
  }

  
  // Remote navigation handler
  function handleRemoteNavigation(e) {
    // ensure only handle when on movies page
    if (localStorage.getItem("currentPage") !== "moviesPage" && localStorage.getItem("currentPage") !== null) return;

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

   if (currentSection === "movies") {
    const isTopRow = currentFocusIndex < cardsPerRow;

    if (isTopRow) {

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


      // If header search (top search input) -> go to sidebar category search
      if (currentSection === "header") {
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
          // From last row → go to movies (align column)
          currentSection = "movies";
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


      if (currentSection === "movies") {
          if (currentFocusIndex % cardsPerRow === 0) {
      // Already at leftmost column - don't move
      e.preventDefault();
      return;
    } else {
      setFocusOnCard(currentFocusIndex - 1);
    }
  
      }

      else if (currentSection === "categories") {
        if (currentCategoryIndex === 0) {
          // LEFT from first category → go to CATEGORY SEARCH (sidebar search)
          setFocusOnSearch();
        } else {
          setFocusOnCategory(currentCategoryIndex - 1);
        }
      }
      else if (currentSection === "expand") {
        const perRow = computeCategoriesPerRow(); // 8 when expanded
        const lastRightIndex = perRow - 1;

        // When expanded → Left should go to last category in the first row
        if (isExpanded) {
          setFocusOnCategory(lastRightIndex);
        } else {
          // Not expanded → left should go to last item of 7-columns row
          setFocusOnCategory( computeCategoriesPerRow() - 1 );
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
        // From header search → go to first category
        const input = qs(".search-category-input");
        if (input) input.blur();
        setFocusOnCategory(lastFocusedCategory);

        e.preventDefault();
        return;
      }

      else if (currentSection === "search") {
        // Leaving search → remove cursor + go to first category
        const input = qs(".search-category-input");
        if (input) input.blur();
        setFocusOnCategory(0);

        e.preventDefault();
        return;
      }

      else if (currentSection === "categories") {
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
      }

      else if (currentSection === "movies") {
        // move right in movie grid
        
      //   if (currentFocusIndex < cards.length - 1) {
      //     setFocusOnCard(currentFocusIndex + 1);
      //   }
      //   e.preventDefault();
      //   return;
      // }

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
  }

      else if (currentSection === "expand") {
        // from expand button → go to movies
        setFocusOnCard(0);
        e.preventDefault();
        return;
      }
    }

    /* ---------- ENTER / SELECT ---------- */
if (isEnter) {
  if (currentSection === "movies") {
    const card = qs(".movies-grid .movie-card.focused") || qs(".movies-grid .movie-card");
    if (card) card.click();
  } 
  else if (currentSection === "categories") {
    const catEl = qs(".movies-categories-list .movies-category-item.focused") || qs(".movies-categories-list .movies-category-item");
    if (catEl) catEl.click();
  } 
  else if (currentSection === "expand") {
    const btn = qs("#expandBtn");
    if (btn) btn.click();
  } 
  else if (currentSection === "search") {
    // Category search input
    const input = qs(".search-category-input");
    const container = qs(".search-category-name");
    
    if (input && container) {
      if (!isSearchInputActive) {
        // First ENTER - activate typing mode
        isSearchInputActive = true;
        input.focus();
        input.select();
      } else {
        // Second ENTER - deactivate and keep parent focused
        isSearchInputActive = false;
        input.blur();
        container.classList.add("focused"); // Keep parent focused!
      }
    }
  } 
  else if (currentSection === "header") {
    // Header search input
    const input = qs(".search-input");
    const container = qs(".search-container");
    
    if (input && container) {
      if (!isHeaderSearchActive) {
        // First ENTER - activate typing mode
        isHeaderSearchActive = true;
        input.focus();
        input.select();
      } else {
        // Second ENTER - deactivate and keep parent focused
        isHeaderSearchActive = false;
        input.blur();
        container.classList.add("focused"); // Keep parent focused!
      }
    }
  }
  e.preventDefault();
  return;
}

  }

  // compute cards per row based on container width and card width
  // function computeCardsPerRow() {
  //   const grid = qs(".movies-grid");
  //   const first = grid ? grid.querySelector(".movie-card") : null;
  //   if (!grid || !first) return 7;
  //   const cardW = first.getBoundingClientRect().width || 200;
  //   const perRow = Math.max(1, Math.floor(grid.clientWidth / (cardW + 8)));
  //   return perRow;
  // }

function computeCardsPerRow() {
    const grid = qs(".movies-grid");
    if (!grid) return 7;
    
    const gridStyle = window.getComputedStyle(grid);
    const gridColumns = gridStyle.gridTemplateColumns.split(' ').length;
    
    return gridColumns || 7;
}



  // compute categories per row (7 / 8 toggle)
  function computeCategoriesPerRow() {
    return isExpanded ? 8 : 7;
  }

  // Initialize & event registration
  setTimeout(() => {
    buildCategoryMap();
    renderCategoriesUI();
    visibleCount = PAGE_SIZE;
    renderCards();

    // Restore saved focus if returning from detail
    const savedCatId = localStorage.getItem("moviesSelectedCategoryId");
    const savedCatIndex = localStorage.getItem("moviesCategoryIndex");
    const savedCardIndex = localStorage.getItem("moviesCardIndex");
    if (savedCatId) {
      selectedCategoryId = String(savedCatId);
      currentCategoryIndex = savedCatIndex ? Number(savedCatIndex) : 0;
      visibleCount = savedCardIndex ? Math.max(PAGE_SIZE, Number(savedCardIndex) + PAGE_SIZE) : PAGE_SIZE;
      renderCategoriesUI();
      renderCards();
      setTimeout(() => {
        if (savedCardIndex) setFocusOnCard(Number(savedCardIndex));
        else setFocusOnCategory(currentCategoryIndex);
      }, 80);
      localStorage.removeItem("moviesSelectedCategoryId");
      localStorage.removeItem("moviesCategoryIndex");
      localStorage.removeItem("moviesCardIndex");
    } else {
      setTimeout(() => setFocusOnCard(0), 80);
    }

    // Event delegation
    document.addEventListener("click", onCategoryClick);
    document.addEventListener("click", onCardClick);
    document.addEventListener("keydown", handleRemoteNavigation);

    // Expand toggle
    const expandBtn = qs("#expandBtn");
    const sidebar = qs(".movies-sidebar");
    if (expandBtn) {
 expandBtn.addEventListener("click", () => {
    isExpanded = !isExpanded;
    const wrapper = qs(".movies-categories-wrapper");
    if (wrapper) wrapper.classList.toggle("expanded", isExpanded);
    if (sidebar) sidebar.classList.toggle("expanded", isExpanded);
    expandBtn.classList.toggle("rotated", isExpanded);
    expandBtn.textContent = isExpanded ? "⌃" : "⌄";
    
    // Keep filtering class if search has content
    const searchInput = qs(".search-category-input");
    const hasSearchText = searchInput && searchInput.value.trim().length > 0;
    
    if (!hasSearchText && sidebar) {
        sidebar.classList.remove("filtering");
    }
    
    // restore focus to category or expand
    if (currentSection === "categories") {
      setFocusOnCategory(currentCategoryIndex);
    } else if (currentSection === "expand") {
      setFocusOnExpandBtn();
    }
});
    }

    // Search input debounce for sidebar category search
    const searchEl = qs(".search-category-input");
    if (searchEl) {
      let timer = null;
     // In your search input handler, update this section:
searchEl.addEventListener("input", (ev) => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    const q = ev.target.value.trim().toLowerCase();
    const list = qs(".movies-categories-list");
    const sidebar = qs(".movies-sidebar");
    
    if (!q) {
      // Clear search - restore normal layout
      if (sidebar) sidebar.classList.remove("filtering");
      renderCategoriesUI();
      return;
    }
    
    // Add filtering class to change layout
    if (sidebar) sidebar.classList.add("filtering");
    
    const filtered = categories.filter(c => c.name.toLowerCase().includes(q));
    if (list) {
      list.innerHTML = filtered.map((c, idx) => `
        <div class="movies-category-item ${String(c.id) === String(selectedCategoryId) ? 'active' : ''}" data-id="${c.id}" data-idx="${idx}">
          <span style="text-align: center; " class="cat-name" title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</span>
          <span class="cat-count">${c._movieCount}</span>
        </div>
      `).join("");

      // Show/hide expand button based on filtered results
      const expandBtn = qs("#expandBtn");
      if (expandBtn) {
        expandBtn.style.display = filtered.length > 0 ? "flex" : "none";
      }
    }
  }, 350);
});
    }

    // Header search focus/placeholder logic (optional)
    const headerSearchEl = qs(".search-input");
    if (headerSearchEl) {
      headerSearchEl.addEventListener("focus", () => {
        headerSearchEl.classList.add("focused");
      });
      headerSearchEl.addEventListener("blur", () => {
        headerSearchEl.classList.remove("focused");
      });
    }

    // cleanup
    MoviesPage.cleanup = () => {
      document.removeEventListener("click", onCategoryClick);
      document.removeEventListener("click", onCardClick);
      document.removeEventListener("keydown", handleRemoteNavigation);
    };
  }, 0);

  // Template
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
      <div class="live-indicator"><span class="current-time">Movies</span></div>
      <div class="header-right">
          <div class="search-container">
              <div class="search-icon"><img src="/assets/search.png" /></div>
              <input type="text" class="search-input" placeholder="Search Movies" />
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
</style>
`;
}