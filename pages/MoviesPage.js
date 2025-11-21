

// function MoviesPage() {
//   // CONFIG
//   const PAGE_SIZE = 20; // Load more chunk
//   let categories = []; // [{ id: "233", name: "Estrenos 2025", parent_id: 0, _movieCount, movies: [] }]
//   let moviesByCategory = {}; // map category_id -> [movies]
//   let selectedCategoryId = null;
//   let visibleCount = PAGE_SIZE;

//   // Focus / navigation state
//   let currentSection = "movies"; // "search" | "categories" | "expand" | "movies"
//   let currentFocusIndex = 0; // focused card index
//   let currentCategoryIndex = 0; // focused category index for sidebar
//   let isExpanded = false;

//   // DOM helpers
//   const qs = (s) => document.querySelector(s);
//   const qsa = (s) => Array.from(document.querySelectorAll(s));

//   // Utility: group movies by category_id (string)
//   function buildCategoryMap() {
//     const allCats = Array.isArray(window.moviesCategories) ? window.moviesCategories : [];
//     const allMovies = Array.isArray(window.allMoviesStreams) ? window.allMoviesStreams : [];


    
//     // Normalize categories into our structure
//     categories = allCats.map(c => ({
//       id: String(c.category_id || c.id),
//       name: c.category_name || c.category_name || c.name || `Cat ${c.category_id || c.id}`,
//       parent_id: c.parent_id || 0,
//       movies: [],
//       _movieCount: 0
//     }));

//     // Build map skeleton
//     moviesByCategory = {};
//     categories.forEach(c => moviesByCategory[c.id] = []);

//     // Also keep an "All" and "Favorites" category if you want
//     // (We'll show API categories only; if you need special -1/-2/-3 categories, add them here.)

//     // Group movies
//     for (const m of allMovies) {
//       const cid = String(m.category_id || (Array.isArray(m.category_ids) && m.category_ids[0]) || "-3");
//       if (!moviesByCategory[cid]) moviesByCategory[cid] = [];
//       moviesByCategory[cid].push(m);
//     }

//     // Attach to categories and compute counts
//     categories.forEach(c => {
//       c.movies = moviesByCategory[c.id] || [];
//       c._movieCount = (c.movies && c.movies.length) || 0;
//     });

//     // If no selectedCategoryId, pick first with movies or first category
//     if (!selectedCategoryId) {
//       const withMovies = categories.find(c => c._movieCount > 0);
//       selectedCategoryId = withMovies ? withMovies.id : (categories[0] ? categories[0].id : null);
//     }
//   }

//   // Render sidebar categories
//   function renderCategoriesUI() {
//     const wrapper = qs(".movies-categories-list");
//     if (!wrapper) return;
//     wrapper.innerHTML = categories.map((c, idx) => `
//       <div class="movies-category-item ${String(c.id) === String(selectedCategoryId) ? 'active' : ''}" data-id="${c.id}" data-idx="${idx}">
//         <span class="cat-name">${c.name}</span>
//         <span class="cat-count">${c._movieCount}</span>
//       </div>
//     `).join("");
//   }

//   // Build a single movie card HTML (safe)
//   function buildMovieCardHTML(m) {
//     const img = m.stream_icon || "/assets/noImageFound.png";
//     const title = m.name || m.title || "Untitled";
//     const rating = isNaN(Number(m.rating_5based)) ? 0 : Math.min(5, Number(m.rating_5based));
//     // brief desc fallback - you may enhance by fetching TMDB later
//     const desc = m.overview || m.description || "";
//     return `
//       <div class="movie-card" data-movie-id="${m.stream_id}">
//         <div class="movie-card-image-wrapper">
//           <img src="${img}" alt="${escapeHtml(title)}" onerror="this.onerror=null;this.src='/assets/noImageFound.png'"/>
//         </div>
//         <div class="movie-hover">
//           <img class="hover-play-btn" src="/assets/play.png" alt="play"/>
//           <div class="hover-title">${escapeHtml(title)}</div>
//           <div class="hover-time">${m.container_extension ? m.container_extension.toUpperCase() : ""} ${m.tmdb_id ? "" : ""}</div>
//           <p class="hover-desc">${escapeHtml(desc)}</p>
//           <div class="hover-rating">⭐ ${rating}</div>
//         </div>
//       </div>
//     `;
//   }

//   // Simple escaping to avoid XSS in injected strings
//   function escapeHtml(str) {
//     if (!str && str !== 0) return "";
//     return String(str)
//       .replace(/&/g, "&amp;")
//       .replace(/</g, "&lt;")
//       .replace(/>/g, "&gt;")
//       .replace(/"/g, "&quot;")
//       .replace(/'/g, "&#039;");
//   }

//   // Render cards for selectedCategoryId up to visibleCount
//   function renderCards() {
//     const container = qs(".movies-grid");
//     if (!container) return;
//     const cat = categories.find(c => String(c.id) === String(selectedCategoryId));
//     const movies = (cat && Array.isArray(cat.movies)) ? cat.movies.slice(0, visibleCount) : [];
//     if (!movies || movies.length === 0) {
//       container.innerHTML = `<div class="movie-no-data"><p>No movies found for this category.</p></div>`;
//       return;
//     }
//     container.innerHTML = movies.map(buildMovieCardHTML).join("");
//     // After HTML injection, update movieCards array
//     movieCards = Array.from(container.querySelectorAll(".movie-card"));
//   }

//   // Load more: increase visibleCount then render
//   function loadMore() {
//     const cat = categories.find(c => String(c.id) === String(selectedCategoryId));
//     if (!cat) return;
//     const total = (cat.movies || []).length;
//     if (visibleCount >= total) return; // nothing more
//     visibleCount = Math.min(visibleCount + PAGE_SIZE, total);
//     renderCards();
//     // keep focus at same column position if possible
//     setFocusOnCard(currentFocusIndex);
//   }

//   // Focus helpers
//   let movieCards = [];
//   function setFocusOnCard(index) {
//     movieCards = Array.from(qs(".movies-grid").querySelectorAll(".movie-card"));
//     removeAllFocus();
//     if (!movieCards || movieCards.length === 0) return;
//     index = Math.max(0, Math.min(index, movieCards.length - 1));
//     currentFocusIndex = index;
//     movieCards[index].classList.add("focused");
//     movieCards[index].scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
//     currentSection = "movies";
//   }

//   function setFocusOnCategory(index) {
//     removeAllFocus();
//     const items = Array.from(document.querySelectorAll(".movies-category-item"));
//     if (!items || items.length === 0) return;
//     index = Math.max(0, Math.min(index, items.length - 1));
//     currentCategoryIndex = index;
//     items[index].classList.add("focused");
//     items[index].scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
//     currentSection = "categories";
//   }

//   function setFocusOnSearch() {
//     removeAllFocus();
//     const el = qs(".search-category-input");
//     if (el) {
//       el.classList.add("focused");
//       el.focus();
//     }
//     currentSection = "search";
//   }

//   function setFocusOnExpandBtn() {
//     removeAllFocus();
//     const btn = qs("#expandBtn");
//     if (btn) {
//       btn.classList.add("focused");
//       btn.scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
//     }
//     currentSection = "expand";
//   }

//   function removeAllFocus() {
//     qsa(".movie-card").forEach(c => c.classList.remove("focused"));
//     qsa(".movies-category-item").forEach(c => c.classList.remove("focused"));
//     const sb = qs(".movies-category-item.active");
//     qsa(".movies-category-item").forEach(c => c.classList.remove("active"));
//     // Don't remove the active class here; we manage it elsewhere
//     const searchBox = qs(".search-category-input");
//     if (searchBox) searchBox.classList.remove("focused");
//     const expandBtn = qs("#expandBtn");
//     if (expandBtn) expandBtn.classList.remove("focused");
//   }

//   // Category click handler (delegated)
//   function onCategoryClick(e) {
//     const cat = e.target.closest(".movies-category-item");
//     if (!cat) return;
//     const catId = String(cat.dataset.id);
//     selectedCategoryId = catId;
//     visibleCount = PAGE_SIZE;
//     // set active in sidebar
//     qsa(".movies-category-item").forEach(i => i.classList.remove("active"));
//     cat.classList.add("active");
//     // re-render cards
//     renderCards();
//     // focus first card (if exists)
//     setTimeout(() => setFocusOnCard(0), 50);
//   }

//   // Card click handler (delegated)
//   function onCardClick(e) {
//     const card = e.target.closest(".movie-card");
//     if (!card) return;
//     const movieId = Number(card.dataset.movieId);
//     // Store selected and navigate
//     const movieObj = (window.allMoviesStreams || []).find(m => Number(m.stream_id) === Number(movieId));
//     if (movieObj) {
//       localStorage.setItem("selectedMovieData", JSON.stringify(movieObj));
//       localStorage.setItem("selectedMovieId", movieId);
//       // Save current focus state
//       localStorage.setItem("moviesSelectedCategoryId", selectedCategoryId);
//       localStorage.setItem("moviesCategoryIndex", currentCategoryIndex);
//       localStorage.setItem("moviesCardIndex", currentFocusIndex);
//       localStorage.setItem("currentPage", "moviesDetailPage");
//       // Hide loading progress if present
//       const lp = qs("#loading-progress");
//       if (lp) lp.style.display = "none";
//       // navigate
//       if (typeof Router !== "undefined" && Router.showPage) {
//         Router.showPage("movieDetail");
//       } else if (typeof navigateTo === "function") {
//         navigateTo("movie-detail-page");
//       } else {
//         console.log("Navigate to movie detail", movieId);
//       }
//     }
//   }

//   // Remote navigation handler
//   function handleRemoteNavigation(e) {
//     // Ignore if not on movies page
//     if (localStorage.getItem("currentPage") !== "moviesPage" && localStorage.getItem("currentPage") !== null) return;

//     const cards = Array.from(qs(".movies-grid").querySelectorAll(".movie-card"));
//     const categoriesEls = Array.from(qs(".movies-categories-list").querySelectorAll(".movies-category-item"));
//     const cardsPerRow = computeCardsPerRow();

//     const isUp = e.key === "ArrowUp" || e.keyCode === 38;
//     const isDown = e.key === "ArrowDown" || e.keyCode === 40;
//     const isLeft = e.key === "ArrowLeft" || e.keyCode === 37;
//     const isRight = e.key === "ArrowRight" || e.keyCode === 39;
//     const isEnter = e.key === "Enter" || e.keyCode === 13;
//     const backKeys = [10009, "Escape", "Back", "BrowserBack", "XF86Back"];

//     // Back -> go to dashboard
//     if (backKeys.includes(e.key) || backKeys.includes(e.keyCode)) {
//       localStorage.setItem("currentPage", "dashboard");
//       if (typeof Router !== "undefined" && Router.showPage) Router.showPage("dashboard");
//       return;
//     }

//     // Handle sections
//     if (isUp) {
//       if (currentSection === "movies") {
//         // if in first row -> go to categories or search
//         if (currentFocusIndex < cardsPerRow) {
//           setFocusOnCategory(Math.min(currentCategoryIndex, categories.length - 1));
//         } else {
//           setFocusOnCard(currentFocusIndex - cardsPerRow);
//         }
//      } else if (currentSection === "categories") {
//   const perRow = computeCategoriesPerRow();
//   const prev = currentCategoryIndex - perRow;

//   if (prev >= 0) {
//     setFocusOnCategory(prev);
//   } else {
//     // FIRST row → go to header search OR expand button (your old behavior)
//     const col = currentCategoryIndex % perRow;

//     if (col === perRow - 1) {
//       // last column → expand button
//       setFocusOnExpandBtn();
//     } else {
//       // other columns → header search
//       setFocusOnSearch();
//     }
//   }
// }
// else if (currentSection === "expand") {
//         setFocusOnSearch();
//       } else if (currentSection === "search") {
//         // stay
//       }
//       e.preventDefault();
//       return;
//     }

//     if (isDown) {
//       if (currentSection === "search") {
//         setFocusOnCategory(0);
//         e.preventDefault();
//         return;
//       }

//       if (currentSection === "categories") {
//         // go to category below if exists
//         const perRow = computeCategoriesPerRow();
//         const next = currentCategoryIndex + perRow;
//         if (next < categoriesEls.length) {
//           setFocusOnCategory(next);
//         } else {
//           // go to movies first row (matching column)
//           currentSection = "movies";
//           const col = currentCategoryIndex % perRow;
//           currentFocusIndex = Math.min(col, (qs(".movies-grid").querySelectorAll(".movie-card") || []).length - 1);
//           setFocusOnCard(currentFocusIndex);
//         }
//         e.preventDefault();
//         return;
//       }

//       if (currentSection === "expand") {
//         setFocusOnCard(0);
//         e.preventDefault();
//         return;
//       }

//       if (currentSection === "movies") {
//         // move down a row, or load more if at last row
//         const total = cards.length;
//         const nextIdx = currentFocusIndex + cardsPerRow;
//         const totalRows = Math.ceil(total / cardsPerRow);
//         const currentRow = Math.floor(currentFocusIndex / cardsPerRow);

//         if (nextIdx < total) {
//           // Move down normally
//           setFocusOnCard(nextIdx);
//         } else {
//           // We are on the last row — try to load more
//           const cat = categories.find(c => String(c.id) === String(selectedCategoryId));
//           if (cat && visibleCount < cat.movies.length) {
//             loadMore();
//           }
//           // After loadMore, remain in same column in the new row if possible
//         }
//         e.preventDefault();
//         return;
//       }
//     }

//     if (isLeft) {
//       if (currentSection === "movies") {
//         if (currentFocusIndex % cardsPerRow === 0) {
//           // go to categories
//           setFocusOnCategory(Math.max(0, currentCategoryIndex));
//         } else {
//           setFocusOnCard(currentFocusIndex - 1);
//         }
//       } else if (currentSection === "categories") {
//         if (currentCategoryIndex === 0) setFocusOnSearch();
//         else setFocusOnCategory(currentCategoryIndex - 1);
//       } else if (currentSection === "expand") {
//         setFocusOnCategory(categories.length - 1);
//       }
//       e.preventDefault();
//       return;
//     }

//     if (isRight) {
//       if (currentSection === "search") {
//         setFocusOnCategory(0);
//       } else if (currentSection === "categories") {
//         // if at end of visible row go to expand button
//         const perRow = computeCategoriesPerRow();
//         if ((currentCategoryIndex + 1) % perRow === 0 || currentCategoryIndex >= categoriesEls.length - 1) {
//           setFocusOnExpandBtn();
//         } else {
//           setFocusOnCategory(currentCategoryIndex + 1);
//         }
//       } else if (currentSection === "movies") {
//         if (currentFocusIndex < cards.length - 1) setFocusOnCard(currentFocusIndex + 1);
//       } else if (currentSection === "expand") {
//         setFocusOnCard(0);
//       }
//       e.preventDefault();
//       return;
//     }

//     if (isEnter) {
//       if (currentSection === "movies") {
//         const card = qs(".movies-grid .movie-card.focused") || (qs(".movies-grid .movie-card") && qs(".movies-grid .movie-card"));
//         if (card) {
//           card.click();
//         }
//       } else if (currentSection === "categories") {
//         const catEl = qs(".movies-categories-list .movies-category-item.focused") || qs(".movies-categories-list .movies-category-item");
//         if (catEl) catEl.click();
//       } else if (currentSection === "expand") {
//         const btn = qs("#expandBtn");
//         if (btn) btn.click();
//       } else if (currentSection === "search") {
//         const input = qs(".search-category-input");
//         if (input) input.focus();
//       }
//       e.preventDefault();
//       return;
//     }
//   }

//   // compute cards per row based on container width and card width
//   function computeCardsPerRow() {
//     const grid = qs(".movies-grid");
//     const first = grid ? grid.querySelector(".movie-card") : null;
//     if (!grid || !first) return 7;
//     const cardW = first.getBoundingClientRect().width || 200;
//     const perRow = Math.max(1, Math.floor(grid.clientWidth / (cardW + 8)));
//     return perRow;
//   }

//   // compute categories per row (7 / 8 toggle)
//   function computeCategoriesPerRow() {
//     return isExpanded ? 8 : 7;
//   }

//   // Initialize & event registration
//   setTimeout(() => {
//     // Build categories and mapping from global data
//     buildCategoryMap();
//     // Render sidebar categories
//     renderCategoriesUI();

//     // Render first category's movies
//     visibleCount = PAGE_SIZE;
//     renderCards();

//     // Restore saved focus if returning from detail
//     const savedCatId = localStorage.getItem("moviesSelectedCategoryId");
//     const savedCatIndex = localStorage.getItem("moviesCategoryIndex");
//     const savedCardIndex = localStorage.getItem("moviesCardIndex");
//     if (savedCatId) {
//       selectedCategoryId = String(savedCatId);
//       currentCategoryIndex = savedCatIndex ? Number(savedCatIndex) : 0;
//       visibleCount = savedCardIndex ? Math.max(PAGE_SIZE, Number(savedCardIndex) + PAGE_SIZE) : PAGE_SIZE;
//       renderCategoriesUI();
//       renderCards();
//       setTimeout(() => {
//         if (savedCardIndex) setFocusOnCard(Number(savedCardIndex));
//         else setFocusOnCategory(currentCategoryIndex);
//       }, 80);
//       // Cleanup saved keys
//       localStorage.removeItem("moviesSelectedCategoryId");
//       localStorage.removeItem("moviesCategoryIndex");
//       localStorage.removeItem("moviesCardIndex");
//     } else {
//       // default focus
//       setTimeout(() => setFocusOnCard(0), 80);
//     }

//     // Event delegation
//     document.addEventListener("click", onCategoryClick);
//     document.addEventListener("click", onCardClick);
//     document.addEventListener("keydown", handleRemoteNavigation);

//     // Expand toggle
//  // Expand toggle
//     const expandBtn = qs("#expandBtn");
//     const sidebar = qs(".movies-sidebar");
//     if (expandBtn) {
//       expandBtn.addEventListener("click", () => {
//         isExpanded = !isExpanded;
//         const wrapper = qs(".movies-categories-wrapper");
//         if (wrapper) wrapper.classList.toggle("expanded", isExpanded);
//         if (sidebar) sidebar.classList.toggle("expanded", isExpanded);
//         expandBtn.classList.toggle("rotated", isExpanded);
//         expandBtn.textContent = isExpanded ? "⌃" : "⌄";
//         // reflow categories focus
//         if (currentSection === "categories") {
//           setFocusOnCategory(currentCategoryIndex);
//         } else if (currentSection === "expand") {
//           setFocusOnExpandBtn();
//         }
//       });
//     }

//     // Search input debounce — simply filter category names (optional)
//     const searchEl = qs(".search-category-input");
//     if (searchEl) {
//       let timer = null;
//       searchEl.addEventListener("input", (ev) => {
//         if (timer) clearTimeout(timer);
//         timer = setTimeout(() => {
//           const q = ev.target.value.trim().toLowerCase();
//           if (!q) {
//             // show all categories
//             renderCategoriesUI();
//             return;
//           }
//           // filter categories by name
//           const filtered = categories.filter(c => c.name.toLowerCase().includes(q));
//           const list = qs(".movies-categories-list");
//           if (list) {
//             list.innerHTML = filtered.map((c, idx) => `
//               <div class="movies-category-item" data-id="${c.id}" data-idx="${idx}">
//                 <span class="cat-name">${c.name}</span>
//                 <span class="cat-count">${c._movieCount}</span>
//               </div>
//             `).join("");
//           }
//         }, 350);
//       });
//     }

//     // cleanup
//     MoviesPage.cleanup = () => {
//       document.removeEventListener("click", onCategoryClick);
//       document.removeEventListener("click", onCardClick);
//       document.removeEventListener("keydown", handleRemoteNavigation);
//       // remove other dynamic handlers if any
//     };
//   }, 0);

//   // Template: keep similar structure to your original HTML but dynamic
//   return `
// <div class="livetv-main-container">
//   <header class="livetv-header">
//       <div class="header-left">
//           <img src="/assets/logo.png" class="app-logo" />
//           <div>
//             <span class="current-time">${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
//             <span class="current-date">${new Date().toLocaleDateString([], {month:'long', day:'numeric', year:'numeric'})}</span>
//           </div>
//       </div>
//       <div class="live-indicator"><span class="current-time">Movies</span></div>
//       <div class="header-right">
//           <div class="search-container">
//               <div class="search-icon"><img src="/assets/search.svg" /></div>
//               <input type="text" class="search-input" placeholder="Search Channels" />
//           </div>
//           <div class="menu-dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
//       </div>
//   </header>

//   <div class="movies-sidebar">
//       <div class="search-category-name">
//           <input type="text" placeholder="Search Categories" class="search-category-input" />
//           <i class="fa fa-search search-category-icon"></i>
//       </div>

//       <div class="movies-categories-wrapper">
//           <div class="movies-categories-list">
//             <!-- categories injected here -->
//           </div>

//           <div class="category-toggle-btn" id="expandBtn">⌄</div>
//       </div>
//   </div>

//   <div class="movies-grid-container">
//     <div class="movies-grid">
//       <!-- cards injected here -->
//     </div>
//   </div>
// </div>
// `;
// }



function MoviesPage() {
  // CONFIG
  const PAGE_SIZE = 20; // Load more chunk
  let categories = []; // [{ id: "233", name: "Estrenos 2025", parent_id: 0, _movieCount, movies: [] }]
  let moviesByCategory = {}; // map category_id -> [movies]
  let selectedCategoryId = null;
  let visibleCount = PAGE_SIZE;

  // Focus / navigation state
  let currentSection = "movies"; // "search" | "categories" | "expand" | "movies"
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
        <span class="cat-name">${c.name}</span>
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
  function buildMovieCardHTML(m) {
    const img = m.stream_icon || "/assets/noImageFound.png";
    const title = m.name || m.title || "Untitled";
    const rating = isNaN(Number(m.rating_5based)) ? 0 : Math.min(5, Number(m.rating_5based));
    const desc = m.overview || m.description || "";
    return `
      <div class="movie-card" data-movie-id="${m.stream_id}">
        <div class="movie-card-image-wrapper">
          <img src="${img}" alt="${escapeHtml(title)}" onerror="this.onerror=null;this.src='/assets/noImageFound.png'"/>
        </div>
        <div class="movie-hover">
          <img class="hover-play-btn" src="/assets/play.png" alt="play"/>
          <div class="hover-title">${escapeHtml(title)}</div>
          <div class="hover-time">${m.container_extension ? m.container_extension.toUpperCase() : ""} ${m.tmdb_id ? "" : ""}</div>
          <p class="hover-desc">${escapeHtml(desc)}</p>
          <div class="hover-rating">⭐ ${rating}</div>
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
    if (!movies || movies.length === 0) {
      container.innerHTML = `<div class="movie-no-data"><p>No movies found for this category.</p></div>`;
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
    if (!movieCards || movieCards.length === 0) return;
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
    items[index].classList.add("focused");
    items[index].scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
    currentSection = "categories";
  }

  function setFocusOnSearch() {
    removeAllFocus();
    const el = qs(".search-category-input");
    if (el) {
      el.classList.add("focused");
      el.focus();
    }
    currentSection = "search";
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
    const searchBox = qs(".search-category-input");
    if (searchBox) searchBox.classList.remove("focused");
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
      if (typeof Router !== "undefined" && Router.showPage) {
        Router.showPage("movieDetail");
      } else if (typeof navigateTo === "function") {
        navigateTo("movie-detail-page");
      } else {
        console.log("Navigate to movie detail", movieId);
      }
    }
  }

  // Remote navigation handler
  function handleRemoteNavigation(e) {
    if (localStorage.getItem("currentPage") !== "moviesPage" && localStorage.getItem("currentPage") !== null) return;

    const cards = Array.from(qs(".movies-grid").querySelectorAll(".movie-card"));
    const categoriesEls = Array.from(qs(".movies-categories-list").querySelectorAll(".movies-category-item"));
    const cardsPerRow = computeCardsPerRow();

    const isUp = e.key === "ArrowUp" || e.keyCode === 38;
    const isDown = e.key === "ArrowDown" || e.keyCode === 40;
    const isLeft = e.key === "ArrowLeft" || e.keyCode === 37;
    const isRight = e.key === "ArrowRight" || e.keyCode === 39;
    const isEnter = e.key === "Enter" || e.keyCode === 13;
    const backKeys = [10009, "Escape", "Back", "BrowserBack", "XF86Back"];

    // Back -> go to dashboard
    if (backKeys.includes(e.key) || backKeys.includes(e.keyCode)) {
      localStorage.setItem("currentPage", "dashboard");
      if (typeof Router !== "undefined" && Router.showPage) Router.showPage("dashboard");
      return;
    }

    // Handle UP arrow
    if (isUp) {
      if (currentSection === "movies") {
        if (currentFocusIndex < cardsPerRow) {
          setFocusOnCategory(Math.min(currentCategoryIndex, categories.length - 1));
        } else {
          setFocusOnCard(currentFocusIndex - cardsPerRow);
        }
      } else if (currentSection === "categories") {
        const perRow = computeCategoriesPerRow();
        const prev = currentCategoryIndex - perRow;

        if (prev >= 0) {
          setFocusOnCategory(prev);
        } else {
          const col = currentCategoryIndex % perRow;
          if (col === perRow - 1) {
            setFocusOnExpandBtn();
          } else {
            setFocusOnSearch();
          }
        }
      } else if (currentSection === "expand") {
        setFocusOnSearch();
      } else if (currentSection === "search") {
        // stay
      }
      e.preventDefault();
      return;
    }

    // Handle DOWN arrow
    if (isDown) {
      if (currentSection === "search") {
        // Only allow down if expanded
        if (isExpanded) {
          setFocusOnCategory(0);
        } else {
          // When collapsed, just remove focus from search
          removeAllFocus();
        }
        e.preventDefault();
        return;
      }

      if (currentSection === "categories") {
        const perRow = computeCategoriesPerRow();
        const next = currentCategoryIndex + perRow;
        if (next < categoriesEls.length) {
          setFocusOnCategory(next);
        } else {
          currentSection = "movies";
          const col = currentCategoryIndex % perRow;
          currentFocusIndex = Math.min(col, (qs(".movies-grid").querySelectorAll(".movie-card") || []).length - 1);
          setFocusOnCard(currentFocusIndex);
        }
        e.preventDefault();
        return;
      }

      if (currentSection === "expand") {
        setFocusOnCard(0);
        e.preventDefault();
        return;
      }

      if (currentSection === "movies") {
        const total = cards.length;
        const nextIdx = currentFocusIndex + cardsPerRow;

        if (nextIdx < total) {
          setFocusOnCard(nextIdx);
        } else {
          const cat = categories.find(c => String(c.id) === String(selectedCategoryId));
          if (cat && visibleCount < cat.movies.length) {
            loadMore();
          }
        }
        e.preventDefault();
        return;
      }
    }

    // Handle LEFT arrow
    if (isLeft) {
      if (currentSection === "movies") {
        if (currentFocusIndex % cardsPerRow === 0) {
          setFocusOnCategory(Math.max(0, currentCategoryIndex));
        } else {
          setFocusOnCard(currentFocusIndex - 1);
        }
      } else if (currentSection === "categories") {
        if (currentCategoryIndex === 0) setFocusOnSearch();
        else setFocusOnCategory(currentCategoryIndex - 1);
      } else if (currentSection === "expand") {
        setFocusOnCategory(categories.length - 1);
      }
      e.preventDefault();
      return;
    }

    // Handle RIGHT arrow
    if (isRight) {
      if (currentSection === "search") {
        // From search, go to first category
        const input = qs(".search-category-input");
    if (input) input.blur(); 
        setFocusOnCategory(0);
          e.preventDefault();
      } else if (currentSection === "categories") {
        const perRow = computeCategoriesPerRow();
        const nextIdx = currentCategoryIndex + 1;
        
        if (nextIdx >= categoriesEls.length) {
          // Last category, go to expand button
          setFocusOnExpandBtn();
        } else if (!isExpanded && (nextIdx % perRow === 0)) {
          // When collapsed and at end of row, go to expand
          setFocusOnExpandBtn();
        } else {
          // Move to next category
          setFocusOnCategory(nextIdx);
        }
      } else if (currentSection === "movies") {
        if (currentFocusIndex < cards.length - 1) setFocusOnCard(currentFocusIndex + 1);
      } else if (currentSection === "expand") {
        setFocusOnCard(0);
      }
      e.preventDefault();
      return;
    }

    // Handle ENTER
    if (isEnter) {
      if (currentSection === "movies") {
        const card = qs(".movies-grid .movie-card.focused") || (qs(".movies-grid .movie-card") && qs(".movies-grid .movie-card"));
        if (card) card.click();
      } else if (currentSection === "categories") {
        const catEl = qs(".movies-categories-list .movies-category-item.focused") || qs(".movies-categories-list .movies-category-item");
        if (catEl) catEl.click();
      } else if (currentSection === "expand") {
        const btn = qs("#expandBtn");
        if (btn) btn.click();
      } else if (currentSection === "search") {
        const input = qs(".search-category-input");
        if (input) input.focus();
      }
      e.preventDefault();
      return;
    }
  }

  // compute cards per row based on container width and card width
  function computeCardsPerRow() {
    const grid = qs(".movies-grid");
    const first = grid ? grid.querySelector(".movie-card") : null;
    if (!grid || !first) return 7;
    const cardW = first.getBoundingClientRect().width || 200;
    const perRow = Math.max(1, Math.floor(grid.clientWidth / (cardW + 8)));
    return perRow;
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
        if (currentSection === "categories") {
          setFocusOnCategory(currentCategoryIndex);
        } else if (currentSection === "expand") {
          setFocusOnExpandBtn();
        }
      });
    }

    // Search input debounce
    const searchEl = qs(".search-category-input");
    if (searchEl) {
      let timer = null;
      searchEl.addEventListener("input", (ev) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          const q = ev.target.value.trim().toLowerCase();
          if (!q) {
            renderCategoriesUI();
            return;
          }
          const filtered = categories.filter(c => c.name.toLowerCase().includes(q));
          const list = qs(".movies-categories-list");
          if (list) {
            list.innerHTML = filtered.map((c, idx) => `
              <div class="movies-category-item" data-id="${c.id}" data-idx="${idx}">
                <span class="cat-name">${c.name}</span>
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
            <span class="current-time">${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
            <span class="current-date">${new Date().toLocaleDateString([], {month:'long', day:'numeric', year:'numeric'})}</span>
          </div>
      </div>
      <div class="live-indicator"><span class="current-time">Movies</span></div>
      <div class="header-right">
          <div class="search-container">
              <div class="search-icon"><img src="/assets/search.svg" /></div>
              <input type="text" class="search-input" placeholder="Search Channels" />
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