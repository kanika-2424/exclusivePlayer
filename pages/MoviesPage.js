
// function MoviesPage() {
//   const categoriesData = [
//     { id: -1, name: "Favorite Movies" },
//     { id: -2, name: "English Movies" },
//     { id: 1, name: "Sports Movies" },
//     { id: 2, name: "Korean Movies" },
//     { id: 3, name: "Comedy Movies" },
//     { id: 4, name: "Netflix Movies" },
//     { id: 5, name: "Horror Movies" },
//     { id: 6, name: "French Movies" },
//     { id: 7, name: "Action Movies" },
//     { id: 8, name: "Drama Movies" }
//   ];

//   // Remote navigation state
//   let currentFocusIndex = 0;
//   let movieCards = [];
//   let currentSection = "movies"; // "search", "categories", "expand", "movies"
//   let currentCategoryIndex = 0;

//   // Setup event listeners
//   setTimeout(() => {
//     // Get all movie cards
//     movieCards = Array.from(document.querySelectorAll(".movie-card"));
    
//     // Get navigation elements
//     const searchInput = document.querySelector(".search-category-input");
//     const categoryItems = Array.from(document.querySelectorAll(".movies-category-item"));
//     const expandBtn = document.getElementById("expandBtn");
    
//     // Set initial focus on first card
//     if (movieCards.length > 0) {
//       setFocusOnCard(0);
//     }

//     // EXPAND BUTTON FIX
//     const wrapper = document.querySelector(".movies-categories-wrapper");
//     const sidebar = document.querySelector(".movies-sidebar");

//     if (expandBtn && wrapper && sidebar) {
//       expandBtn.addEventListener("click", () => {
//         wrapper.classList.toggle("expanded");
//         sidebar.classList.toggle("expanded");
//         expandBtn.classList.toggle("rotated");
//         expandBtn.textContent = wrapper.classList.contains("expanded") ? "⌃" : "⌄";
//       });
//     }

//     // Click handler for movie cards
//     function handleMovieCardClick(e) {
//       const card = e.target.closest(".movie-card");
//       if (!card) return;
      
//       const movieIndex = card.getAttribute("data-index");
//       console.log("Movie clicked:", movieIndex);
      
//       // Navigate to MovieDetailPage
//       // Replace with your routing logic
//       // Example: navigateTo("movie-detail-page", { movieId: movieIndex });
//         navigateTo("movie-detail-page");

//     }

//     // Click handler for category items
//     function handleCategoryClick(e) {
//       const category = e.target.closest(".movies-category-item");
//       if (!category) return;
      
//       const categoryId = category.getAttribute("data-id");
//       console.log("Category clicked:", categoryId);
      
//       // Filter movies by category
//       // Replace with your routing/filtering logic
//     }

//     // Register click events
//     document.addEventListener("click", handleMovieCardClick);
//     document.addEventListener("click", handleCategoryClick);

//     // Remote navigation event listener
//     document.addEventListener("keydown", handleRemoteNavigation);

//     // Cleanup function
//     MoviesPage.cleanup = function () {
//       document.removeEventListener("click", handleMovieCardClick);
//       document.removeEventListener("click", handleCategoryClick);
//       document.removeEventListener("keydown", handleRemoteNavigation);
//     };
//   }, 0);

//   // Helper function to check if a category exists at a given index
//   function getCategoryItemAtIndex(index) {
//     const categoryItems = Array.from(document.querySelectorAll(".movies-category-item"));
//     return index >= 0 && index < categoryItems.length ? categoryItems[index] : null;
//   }

//   // Helper function to get the number of visible categories per row
//   function getCategoriesPerRow() {
//     const wrapper = document.querySelector(".movies-categories-wrapper");
//     const isExpanded = wrapper && wrapper.classList.contains("expanded");
//     return isExpanded ? 8 : 7;
//   }

//   // Helper function to get total visible categories
//   function getTotalVisibleCategories() {
//     const categoryItems = Array.from(document.querySelectorAll(".movies-category-item"));
//     return categoryItems.length;
//   }

//   // Helper function to check if there's a category in the row below at the same column
//   function hasNextRowCategory(currentIndex) {
//     const categoriesPerRow = getCategoriesPerRow();
//     const totalCategories = getTotalVisibleCategories();
//     const nextRowIndex = currentIndex + categoriesPerRow;
//     return nextRowIndex < totalCategories;
//   }

//   // Handle remote navigation
//   function handleRemoteNavigation(e) {
//     const movieCards = Array.from(document.querySelectorAll(".movie-card"));
//     if (movieCards.length === 0) return;

//     const cardsPerRow = 7; // 7 cards per row to align with screen
//     const totalCards = movieCards.length;
//     const searchInput = document.querySelector(".search-category-input");
//     const categoryItems = Array.from(document.querySelectorAll(".movies-category-item"));
//     const expandBtn = document.getElementById("expandBtn");
//     const wrapper = document.querySelector(".movies-categories-wrapper");
//     const isExpanded = wrapper && wrapper.classList.contains("expanded");
//     const categoriesPerRow = isExpanded ? 8 : 7; // 8 when expanded, 7 when not

//     switch(e.key) {
//       case "ArrowRight":
//         e.preventDefault();
        
//         if (currentSection === "search") {
//           // From search, go to first category
//           currentSection = "categories";
//           currentCategoryIndex = 0;
//           setFocusOnCategory(0);
//         } else if (currentSection === "categories") {
//           if (isExpanded) {
//             // When expanded, check if we're at end of a row (every 8th item) or last item
//             const currentRow = Math.floor(currentCategoryIndex / categoriesPerRow);
//             const nextIndex = currentCategoryIndex + 1;
//             const nextRow = Math.floor(nextIndex / categoriesPerRow);
            
//             // If next item is on a new row or we're at last item, go to expand button
//             if (nextRow > currentRow || currentCategoryIndex >= categoryItems.length - 1) {
//               currentSection = "expand";
//               setFocusOnExpandBtn();
//             } else {
//               // Move to next category in same row
//               currentCategoryIndex = nextIndex;
//               setFocusOnCategory(currentCategoryIndex);
//             }
//           } else {
//             // When not expanded, check if at 7th position (index 6) or last visible item
//             if (currentCategoryIndex === 6 || currentCategoryIndex >= categoryItems.length - 1) {
//               // Go to expand button
//               currentSection = "expand";
//               setFocusOnExpandBtn();
//             } else if (currentCategoryIndex < categoryItems.length - 1) {
//               // Move to next category
//               currentCategoryIndex++;
//               setFocusOnCategory(currentCategoryIndex);
//             }
//           }
//         } else if (currentSection === "movies") {
//           // Move to next card in same row
//           if ((currentFocusIndex + 1) % cardsPerRow !== 0 && currentFocusIndex < totalCards - 1) {
//             currentFocusIndex++;
//             setFocusOnCard(currentFocusIndex);
//           }
//         }
//         break;

//       case "ArrowLeft":
//         e.preventDefault();
        
//         if (currentSection === "expand") {
//           // From expand button, go to last category
//           currentSection = "categories";
//           currentCategoryIndex = categoryItems.length - 1;
//           setFocusOnCategory(currentCategoryIndex);
//         } else if (currentSection === "categories") {
//           if (currentCategoryIndex > 0) {
//             // Move through categories backward
//             currentCategoryIndex--;
//             setFocusOnCategory(currentCategoryIndex);
//           } else {
//             // From first category, go to search
//             currentSection = "search";
//             setFocusOnSearch();
//           }
//         } else if (currentSection === "movies") {
//           // Move to previous card
//           if (currentFocusIndex % cardsPerRow !== 0 && currentFocusIndex > 0) {
//             currentFocusIndex--;
//             setFocusOnCard(currentFocusIndex);
//           }
//         }
//         break;

//       case "ArrowDown":
//         e.preventDefault();
        
//         if (currentSection === "header-search") {
//           // From header search, go to sidebar search box
//           const headerSearchInput = document.querySelector(".search-input");
//           if (headerSearchInput) {
//             headerSearchInput.blur(); // Remove cursor from header search
//           }
//           currentSection = "search";
//           setFocusOnSearch();
//         } else if (currentSection === "search") {
//           if (isExpanded) {
//             // When expanded, go to first category
//             currentSection = "categories";
//             currentCategoryIndex = 0;
//             setFocusOnCategory(0);
//           } else {
//             // When not expanded, go to first row of movies
//             currentSection = "movies";
//             currentFocusIndex = 0;
//             setFocusOnCard(currentFocusIndex);
//           }
//         } else if (currentSection === "categories") {
//           if (isExpanded) {
//             // When expanded, navigate down through category rows
//             const nextRowIndex = currentCategoryIndex + categoriesPerRow;
            
//             // Check if there's actually a category at the next row position
//             if (nextRowIndex < categoryItems.length) {
//               // Go to category below in next row
//               currentCategoryIndex = nextRowIndex;
//               setFocusOnCategory(currentCategoryIndex);
//             }
//             // If no category below, stay on current category (don't move to movies)
//           } else {
//             // When not expanded, go directly to movies
//             currentSection = "movies";
//             currentFocusIndex = Math.min(currentCategoryIndex % categoriesPerRow, cardsPerRow - 1);
//             setFocusOnCard(currentFocusIndex);
//           }
//         } else if (currentSection === "expand") {
//           // From expand button, go to first row of movies
//           currentSection = "movies";
//           currentFocusIndex = 0;
//           setFocusOnCard(currentFocusIndex);
//         } else if (currentSection === "movies") {
//           // Move to card below (same column, next row)
//           if (currentFocusIndex + cardsPerRow < totalCards) {
//             currentFocusIndex += cardsPerRow;
//             setFocusOnCard(currentFocusIndex);
//           }
//         }
//         break;

//       case "ArrowUp":
//         e.preventDefault();
        
//         if (currentSection === "header-search") {
//           // Stay at header search, don't go anywhere
//           return;
//         } else if (currentSection === "expand") {
//           if (isExpanded) {
//             // When expanded, go to search box
//             currentSection = "search";
//             setFocusOnSearch();
//           } else {
//             // When not expanded, go to header search
//             currentSection = "header-search";
//             setFocusOnHeaderSearch();
//           }
//         } else if (currentSection === "categories") {
//           if (isExpanded) {
//             // When expanded, navigate up through category rows
//             const prevRowIndex = currentCategoryIndex - categoriesPerRow;
//             if (prevRowIndex >= 0) {
//               // Go to category above in previous row
//               currentCategoryIndex = prevRowIndex;
//               setFocusOnCategory(currentCategoryIndex);
//             } else {
//               // No more categories above, go to search box
//               currentSection = "search";
//               setFocusOnSearch();
//             }
//           } else {
//             // When not expanded, go to header search box
//             currentSection = "header-search";
//             setFocusOnHeaderSearch();
//           }
//         } else if (currentSection === "search") {
//           // From sidebar search, go to header search
//           currentSection = "header-search";
//           setFocusOnHeaderSearch();
//         } else if (currentSection === "movies") {
//           // Check if in first row
//           if (currentFocusIndex < cardsPerRow) {
//             if (isExpanded) {
//               // Go to categories (try to match column)
//               const targetCategoryIndex = currentFocusIndex;
//               // Find the last row of categories
//               const lastCategoryRow = Math.floor((categoryItems.length - 1) / categoriesPerRow);
//               const targetInLastRow = (lastCategoryRow * categoriesPerRow) + targetCategoryIndex;
              
//               if (targetInLastRow < categoryItems.length) {
//                 currentSection = "categories";
//                 currentCategoryIndex = targetInLastRow;
//                 setFocusOnCategory(currentCategoryIndex);
//               } else {
//                 // If target column doesn't exist in last row, go to last category
//                 currentSection = "categories";
//                 currentCategoryIndex = categoryItems.length - 1;
//                 setFocusOnCategory(currentCategoryIndex);
//               }
//             } else {
//               // When not expanded, go to search box
//               currentSection = "search";
//               setFocusOnSearch();
//             }
//           } else {
//             // Move to card above (same column, previous row)
//             currentFocusIndex -= cardsPerRow;
//             setFocusOnCard(currentFocusIndex);
//           }
//         }
//         break;

//       case "Enter":
//         e.preventDefault();
        
//         if (currentSection === "movies") {
//           // Trigger click on focused card
//           if (movieCards[currentFocusIndex]) {
//             const movieIndex = movieCards[currentFocusIndex].getAttribute("data-index");
//             console.log("Movie selected via remote:", movieIndex);
            
//             // Navigate to MovieDetailPage
//             // Replace with your routing logic
//             // Example: navigateTo("movie-detail-page", { movieId: movieIndex });
//         navigateTo("movie-detail-page");


            
//             movieCards[currentFocusIndex].click();
//           }
//         } else if (currentSection === "categories") {
//           // Trigger click on focused category
//           if (categoryItems[currentCategoryIndex]) {
//             const categoryId = categoryItems[currentCategoryIndex].getAttribute("data-id");
//             console.log("Category selected via remote:", categoryId);
            
//             categoryItems[currentCategoryIndex].click();
//           }
//         } else if (currentSection === "expand") {
//           // Trigger click on expand button
//           if (expandBtn) {
//             expandBtn.click();
//           }
//         } else if (currentSection === "search") {
//           // Focus the search input for typing
//           if (searchInput) {
//             searchInput.focus();
//           }
//         }
//         break;
//     }
//   }

//   // Set focus on specific card
//   function setFocusOnCard(index) {
//     // Remove all focus states
//     removeAllFocus();
    
//     currentSection = "movies";

//     // Add focus to current card
//     if (movieCards[index]) {
//       movieCards[index].classList.add("focused");
      
//       // Scroll card into view smoothly
//       movieCards[index].scrollIntoView({
//         behavior: "smooth",
//         block: "center",
//         inline: "center"
//       });
//     }
//   }

//   // Set focus on search box
//   function setFocusOnSearch() {
//     removeAllFocus();
//     currentSection = "search";
    
//     const searchBox = document.querySelector(".search-category-name");
//     if (searchBox) {
//       searchBox.classList.add("focused");
//       searchBox.scrollIntoView({
//         behavior: "smooth",
//         block: "center"
//       });
//     }
//   }

//   // Set focus on header search input
//   function setFocusOnHeaderSearch() {
//     removeAllFocus();
//     currentSection = "header-search";
    
//     const headerSearchContainer = document.querySelector(".search-container");
//     const headerSearchInput = document.querySelector(".search-input");
//     if (headerSearchContainer) {
//       headerSearchContainer.classList.add("search-focused");
//       headerSearchContainer.scrollIntoView({
//         behavior: "smooth",
//         block: "center"
//       });
//     }
//     if (headerSearchInput) {
//       headerSearchInput.focus();
//     }
//   }

//   // Set focus on category
//   function setFocusOnCategory(index) {
//     removeAllFocus();
//     currentSection = "categories";
    
//     const categoryItems = document.querySelectorAll(".movies-category-item");
//     if (categoryItems[index]) {
//       categoryItems[index].classList.add("focused");
//       categoryItems[index].scrollIntoView({
//         behavior: "smooth",
//         block: "center",
//         inline: "center"
//       });
//     }
//   }

//   // Set focus on expand button
//   function setFocusOnExpandBtn() {
//     removeAllFocus();
//     currentSection = "expand";
    
//     const expandBtn = document.getElementById("expandBtn");
//     if (expandBtn) {
//       expandBtn.classList.add("focused");
//       expandBtn.scrollIntoView({
//         behavior: "smooth",
//         block: "center",
//         inline: "center"
//       });
//     }
//   }

//   // Remove all focus states
//   function removeAllFocus() {
//     // Remove focus from all cards
//     movieCards.forEach(card => {
//       card.classList.remove("focused");
//     });
    
//     // Remove focus from search
//     const searchBox = document.querySelector(".search-category-name");
//     if (searchBox) {
//       searchBox.classList.remove("focused");
//     }

//     // Remove focus from header search
//     const headerSearchContainer = document.querySelector(".search-container");
//     if (headerSearchContainer) {
//       headerSearchContainer.classList.remove("search-focused");
//     }
    
//     // Remove focus from categories
//     const categoryItems = document.querySelectorAll(".movies-category-item");
//     categoryItems.forEach(cat => {
//       cat.classList.remove("focused");
//     });
    
//     // Remove focus from expand button
//     const expandBtn = document.getElementById("expandBtn");
//     if (expandBtn) {
//       expandBtn.classList.remove("focused");
//     }
//   }

//   // Header time
//   const now = new Date();
//   const time = now.toLocaleTimeString("en-US", {
//     hour: "2-digit",
//     minute: "2-digit",
//     hour12: true
//   });
//   const date = now.toLocaleDateString("en-US", {
//     month: "long",
//     day: "numeric",
//     year: "numeric"
//   });

//   document.addEventListener("mouseover", e => {
//     const card = e.target.closest(".movie-card");
//     if (!card) return;
//     card.classList.add("hovering");
//   });

//   document.addEventListener("mouseout", e => {
//     const card = e.target.closest(".movie-card");
//     if (!card) return;
//     card.classList.remove("hovering");
//   });

//   document.addEventListener("click", e => {
//     const card = e.target.closest(".movie-card");
//     if (!card) return;
    
//     const movieIndex = card.getAttribute("data-index");
//     console.log("Movie card clicked:", movieIndex);
    
//         navigateTo("movie-detail-page");

//   });

//   return `
// <div class="livetv-main-container">
//   <header class="livetv-header">
//       <div class="header-left">
//           <img src="/assets/logo.png" class="app-logo" />

//           <div class="">
//           <span class="current-time">${time}</span>
//           <span class="current-date">${date}</span>
//       </div>
//       </div>

//           <div class="live-indicator"><span class="current-time">English Movies</span></div>
      

//       <div class="header-right">
//           <div class="search-container">
//               <div class="search-icon">
//                   <img src="/assets/search.svg" />
//               </div>
//               <input type="text" class="search-input" placeholder="Search Channels" />
//           </div>

//           <div class="menu-dots">
//               <span class="dot"></span><span class="dot"></span><span class="dot"></span>
//           </div>
//       </div>
//   </header>

// <div class="movies-sidebar">

//     <!-- SEARCH BOX -->
//     <div class="search-category-name">
//         <input 
//             type="text" 
//             placeholder="Search Categories"
//             class="search-category-input"
//         />
//         <i class="fa fa-search search-category-icon"></i>
//     </div>

//     <!-- CATEGORIES WRAPPER -->

//     <div class="movies-categories-wrapper">
//         <div class="movies-categories-list">
//             ${categoriesData
//                 .map(
//                     (cat) => `
//                     <div class="movies-category-item" data-id="${cat.id}">
//                         <span>${cat.name}</span>
//                     </div>
//                     `
//                 )
//                 .join("")}
//         </div>

//     <div class="category-toggle-btn" id="expandBtn">⌄</div>


//     </div>

//     <!-- TOGGLE BUTTON -->


// </div>

// <div class="movies-grid-container">
//    <div class="movies-grid">
//     ${Array(20).fill(0).map((_, i) => `
//         <div class="movie-card" data-index="${i}">
//             <img src="https://images.pexels.com/photos/713149/pexels-photo-713149.jpeg" />

//             <div class="movie-hover">
//                 <img class="hover-play-btn" src="assets/play.png" />
//                 <div class="hover-title">Movie ${i + 1}</div>
//                 <div class="hover-time">2h 35m</div>
//                 <p class="hover-desc">
//                     Lorem Ipsum is simply dummy text of the printing industry.
//                 </p>
//             </div>
//         </div>
//     `).join("")}
//    </div>
// </div>
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

    // Also keep an "All" and "Favorites" category if you want
    // (We'll show API categories only; if you need special -1/-2/-3 categories, add them here.)

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
  }

  // Build a single movie card HTML (safe)
  function buildMovieCardHTML(m) {
    const img = m.stream_icon || "/assets/noImageFound.png";
    const title = m.name || m.title || "Untitled";
    const rating = isNaN(Number(m.rating_5based)) ? 0 : Math.min(5, Number(m.rating_5based));
    // brief desc fallback - you may enhance by fetching TMDB later
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
    // After HTML injection, update movieCards array
    movieCards = Array.from(container.querySelectorAll(".movie-card"));
  }

  // Load more: increase visibleCount then render
  function loadMore() {
    const cat = categories.find(c => String(c.id) === String(selectedCategoryId));
    if (!cat) return;
    const total = (cat.movies || []).length;
    if (visibleCount >= total) return; // nothing more
    visibleCount = Math.min(visibleCount + PAGE_SIZE, total);
    renderCards();
    // keep focus at same column position if possible
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
    const sb = qs(".movies-category-item.active");
    qsa(".movies-category-item").forEach(c => c.classList.remove("active"));
    // Don't remove the active class here; we manage it elsewhere
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
    // set active in sidebar
    qsa(".movies-category-item").forEach(i => i.classList.remove("active"));
    cat.classList.add("active");
    // re-render cards
    renderCards();
    // focus first card (if exists)
    setTimeout(() => setFocusOnCard(0), 50);
  }

  // Card click handler (delegated)
  function onCardClick(e) {
    const card = e.target.closest(".movie-card");
    if (!card) return;
    const movieId = Number(card.dataset.movieId);
    // Store selected and navigate
    const movieObj = (window.allMoviesStreams || []).find(m => Number(m.stream_id) === Number(movieId));
    if (movieObj) {
      localStorage.setItem("selectedMovieData", JSON.stringify(movieObj));
      localStorage.setItem("selectedMovieId", movieId);
      // Save current focus state
      localStorage.setItem("moviesSelectedCategoryId", selectedCategoryId);
      localStorage.setItem("moviesCategoryIndex", currentCategoryIndex);
      localStorage.setItem("moviesCardIndex", currentFocusIndex);
      localStorage.setItem("currentPage", "moviesDetailPage");
      // Hide loading progress if present
      const lp = qs("#loading-progress");
      if (lp) lp.style.display = "none";
      // navigate
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
    // Ignore if not on movies page
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

    // Handle sections
    if (isUp) {
      if (currentSection === "movies") {
        // if in first row -> go to categories or search
        if (currentFocusIndex < cardsPerRow) {
          setFocusOnCategory(Math.min(currentCategoryIndex, categories.length - 1));
        } else {
          setFocusOnCard(currentFocusIndex - cardsPerRow);
        }
      } else if (currentSection === "categories") {
        // move up a row
        const perRow = computeCategoriesPerRow();
        const prev = currentCategoryIndex - perRow;
        if (prev >= 0) setFocusOnCategory(prev);
        else setFocusOnSearch();
      } else if (currentSection === "expand") {
        setFocusOnSearch();
      } else if (currentSection === "search") {
        // stay
      }
      e.preventDefault();
      return;
    }

    if (isDown) {
      if (currentSection === "search") {
        setFocusOnCategory(0);
        e.preventDefault();
        return;
      }

      if (currentSection === "categories") {
        // go to category below if exists
        const perRow = computeCategoriesPerRow();
        const next = currentCategoryIndex + perRow;
        if (next < categoriesEls.length) {
          setFocusOnCategory(next);
        } else {
          // go to movies first row (matching column)
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
        // move down a row, or load more if at last row
        const total = cards.length;
        const nextIdx = currentFocusIndex + cardsPerRow;
        const totalRows = Math.ceil(total / cardsPerRow);
        const currentRow = Math.floor(currentFocusIndex / cardsPerRow);

        if (nextIdx < total) {
          // Move down normally
          setFocusOnCard(nextIdx);
        } else {
          // We are on the last row — try to load more
          const cat = categories.find(c => String(c.id) === String(selectedCategoryId));
          if (cat && visibleCount < cat.movies.length) {
            loadMore();
          }
          // After loadMore, remain in same column in the new row if possible
        }
        e.preventDefault();
        return;
      }
    }

    if (isLeft) {
      if (currentSection === "movies") {
        if (currentFocusIndex % cardsPerRow === 0) {
          // go to categories
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

    if (isRight) {
      if (currentSection === "search") {
        setFocusOnCategory(0);
      } else if (currentSection === "categories") {
        // if at end of visible row go to expand button
        const perRow = computeCategoriesPerRow();
        if ((currentCategoryIndex + 1) % perRow === 0 || currentCategoryIndex >= categoriesEls.length - 1) {
          setFocusOnExpandBtn();
        } else {
          setFocusOnCategory(currentCategoryIndex + 1);
        }
      } else if (currentSection === "movies") {
        if (currentFocusIndex < cards.length - 1) setFocusOnCard(currentFocusIndex + 1);
      } else if (currentSection === "expand") {
        setFocusOnCard(0);
      }
      e.preventDefault();
      return;
    }

    if (isEnter) {
      if (currentSection === "movies") {
        const card = qs(".movies-grid .movie-card.focused") || (qs(".movies-grid .movie-card") && qs(".movies-grid .movie-card"));
        if (card) {
          card.click();
        }
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
    // Build categories and mapping from global data
    buildCategoryMap();
    // Render sidebar categories
    renderCategoriesUI();

    // Render first category's movies
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
      // Cleanup saved keys
      localStorage.removeItem("moviesSelectedCategoryId");
      localStorage.removeItem("moviesCategoryIndex");
      localStorage.removeItem("moviesCardIndex");
    } else {
      // default focus
      setTimeout(() => setFocusOnCard(0), 80);
    }

    // Event delegation
    document.addEventListener("click", onCategoryClick);
    document.addEventListener("click", onCardClick);
    document.addEventListener("keydown", handleRemoteNavigation);

    // Expand toggle
    const expandBtn = qs("#expandBtn");
    if (expandBtn) {
      expandBtn.addEventListener("click", () => {
        isExpanded = !isExpanded;
        const wrapper = qs(".movies-categories-wrapper");
        if (wrapper) wrapper.classList.toggle("expanded", isExpanded);
        expandBtn.classList.toggle("rotated", isExpanded);
        expandBtn.textContent = isExpanded ? "⌃" : "⌄";
        // reflow categories focus
        setFocusOnCategory(currentCategoryIndex);
      });
    }

    // Search input debounce — simply filter category names (optional)
    const searchEl = qs(".search-category-input");
    if (searchEl) {
      let timer = null;
      searchEl.addEventListener("input", (ev) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          const q = ev.target.value.trim().toLowerCase();
          if (!q) {
            // show all categories
            renderCategoriesUI();
            return;
          }
          // filter categories by name
          const filtered = categories.filter(c => c.name.toLowerCase().includes(q));
          const list = qs(".movies-categories-list");
          if (list) {
            list.innerHTML = filtered.map((c, idx) => `
              <div class="movies-category-item" data-id="${c.id}" data-idx="${idx}">
                <span class="cat-name">${c.name}</span>
                <span class="cat-count">${c._movieCount}</span>
              </div>
            `).join("");
          }
        }, 350);
      });
    }

    // cleanup
    MoviesPage.cleanup = () => {
      document.removeEventListener("click", onCategoryClick);
      document.removeEventListener("click", onCardClick);
      document.removeEventListener("keydown", handleRemoteNavigation);
      // remove other dynamic handlers if any
    };
  }, 0);

  // Template: keep similar structure to your original HTML but dynamic
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
