// async function SeriesDetailPage() {
//   // cleanup previous handlers if any
//   if (SeriesDetailPage.cleanup) SeriesDetailPage.cleanup();

//   const castImageUrl = "https://image.tmdb.org/t/p/w500";
//   const loadingOverlay = document.getElementById("loading-overlay");

//   async function withTimeout(promise, ms = 7000) {
//   let timer;
//   return Promise.race([
//     promise,
//     new Promise((_, reject) => {
//       timer = setTimeout(() => reject(new Error("timeout")), ms);
//     })
//   ]).finally(() => clearTimeout(timer));
// }


//   // --- Back navigation/interruption guard during loading ---
//   let navigationInterrupted = false;
//   function handleBackNavigationDuringLoading(e) {
//     if (
//       (e.keyCode === 10009 ||
//         e.key === "Escape" ||
//         e.key === "Back" ||
//         e.key === "BrowserBack" ||
//         e.key === "XF86Back") &&
//       localStorage.getItem("currentPage") === "seriesDetailPage"
//     ) {
//       e.preventDefault();
//       e.stopPropagation();
//       navigationInterrupted = true;

//       if (loadingOverlay) loadingOverlay.classList.add("hidden");
//       document.removeEventListener("keydown", handleBackNavigationDuringLoading);

//       localStorage.removeItem("selectedSeriesId");
//       localStorage.setItem("currentPage", "seriesPage");
//       if (typeof Router !== "undefined" && Router.showPage) Router.showPage("series");
//       document.body.style.backgroundImage = "none";
//       document.body.style.backgroundColor = "black";
//       return true;
//     }
//   }
//   document.addEventListener("keydown", handleBackNavigationDuringLoading);

//   // --- Load series detail id/data from localStorage ---
//   var seriesDetailId = localStorage.getItem("selectedSeriesId");
//   var selectedSeriesItem = localStorage.getItem("selectedSeriesData");
//   if (!selectedSeriesItem && !seriesDetailId) {
//     console.error("No selectedSeriesData or selectedSeriesId in localStorage");
//     document.removeEventListener("keydown", handleBackNavigationDuringLoading);
//     return;
//   }
//   if (selectedSeriesItem) selectedSeriesItem = JSON.parse(selectedSeriesItem);

//   if (loadingOverlay) loadingOverlay.classList.remove("hidden");

//   // --- Fetch series details from API ---
//   var seriesDetailData = null;
//   try {
//    seriesDetailData = await withTimeout(getSeriesDetail(seriesDetailId), 7000);
//   } catch (err) {
//     console.error("getSeriesDetail error", err);
//     seriesDetailData = null;
//   }

//   // abort if back/navigation happened while awaiting
//   if (navigationInterrupted) {
//     document.removeEventListener("keydown", handleBackNavigationDuringLoading);
//     return;
//   }

//   if (!seriesDetailData) {
//     if (loadingOverlay) loadingOverlay.classList.add("hidden");
//     localStorage.setItem("currentPage", "seriesPage");
//     if (typeof Router !== "undefined" && Router.showPage) Router.showPage("series");
//     document.body.style.backgroundImage = "none";
//     document.body.style.backgroundColor = "black";
//     document.removeEventListener("keydown", handleBackNavigationDuringLoading);
//     return;
//   }




// // --- Fetch cast from TMDB (if available) ---
// var seriesName =
//   seriesDetailData.info && seriesDetailData.info.name
//     ? seriesDetailData.info.name
//     : null;

// var getSeriesCastData = null;

// // try {
// //   if (seriesName) {
// //     const TMDB_API_KEY = "a21eeaca44af5d2a4349214ecba1b338";
    
// //     // Step 1: Search for the series to get TMDB ID
// //     const searchUrl = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(seriesName)}`;
    
// //     const searchRes = await fetch(searchUrl);
// //     if (!searchRes.ok) throw new Error("TMDB Search API failed");
    
// //     const searchData = await searchRes.json();
// //     console.log("tmdbSearchData", searchData);
    
// //     // Step 2: If we found results, get the cast for the first result
// //     if (searchData && searchData.results && searchData.results.length > 0) {
// //       const tmdbId = searchData.results[0].id;
// //       console.log("Found TMDB ID:", tmdbId);
      
// //       // Step 3: Fetch cast/credits using the TMDB ID
// //       const creditsUrl = `https://api.themoviedb.org/3/tv/${tmdbId}/credits?api_key=${TMDB_API_KEY}`;
      
// //       const creditsRes = await fetch(creditsUrl);
// //       if (!creditsRes.ok) throw new Error("TMDB Credits API failed");
      
// //       getSeriesCastData = await creditsRes.json();
// //       console.log("Series Cast Data:", getSeriesCastData);
      
// //     } else {
// //       console.warn("No TMDB results for series name:", seriesName);
// //     }
// //   } else {
// //     console.warn("No series name available in Xtream API");
// //   }
// // } catch (err) {
// //   console.warn("getSeriesCast error", err);
// //   getSeriesCastData = null;
// // }



//   if (navigationInterrupted) {
//     document.removeEventListener("keydown", handleBackNavigationDuringLoading);
//     return;
//   }

//   // done loading
//   if (loadingOverlay) loadingOverlay.classList.add("hidden");
//   document.removeEventListener("keydown", handleBackNavigationDuringLoading);

//   // --- Map API data to the UI-friendly seriesData ---
//   const seriesData = {
//     id: seriesDetailData.info && seriesDetailData.info.series_id
//         ? seriesDetailData.info.series_id
//         : seriesDetailId,
//     title: seriesDetailData.info && seriesDetailData.info.name
//         ? seriesDetailData.info.name
//         : "No title",
//     rating: seriesDetailData.info && seriesDetailData.info.rating ? seriesDetailData.info.rating : "",
//     releaseDate: seriesDetailData.info && seriesDetailData.info.releaseDate ? seriesDetailData.info.releaseDate : "",
//     director: seriesDetailData.info && seriesDetailData.info.director ? seriesDetailData.info.director : "N/A",
//     genres: seriesDetailData.info && seriesDetailData.info.genre
//         ? (Array.isArray(seriesDetailData.info.genre) 
//             ? seriesDetailData.info.genre 
//             : String(seriesDetailData.info.genre).split(",").map(s => s.trim()))
//         : [],
//     description: seriesDetailData.info && seriesDetailData.info.plot
//         ? seriesDetailData.info.plot
//         : "No description available",
//     posterImage: seriesDetailData.info && seriesDetailData.info.cover
//         ? seriesDetailData.info.cover
//         : "/assets/placeholder-img.png",
//     isFavorite: false,
//     cast: [],
//     episodes: seriesDetailData.episodes || {},
//     seasons: seriesDetailData.seasons || []
//   };

//   // try detect favorite state if helper exists
//   try {
//     if (seriesData.id && typeof isItemFavoriteForPlaylist === "function") {
//       seriesData.isFavorite = isItemFavoriteForPlaylist(seriesData.id, "favouriteSeries");
//     }
//   } catch (err) {
//     seriesData.isFavorite = false;
//   }

//   // build cast list (from TMDB fetch if available)
// //   if (getSeriesCastData && Array.isArray(getSeriesCastData.cast)) {
// //     seriesData.cast = getSeriesCastData.cast.slice(0, 12).map((c) => ({
// //       id: c.id || c.cast_id || Math.random(),
// //       name: c.name || c.original_name || "",
// //       image: c.profile_path ? castImageUrl + c.profile_path : "/assets/placeholder-img.png",
// //     }));
// //   }

//   // Get first episode from first season for Play button
//   const firstSeason = seriesData.seasons && seriesData.seasons.length > 0 
//     ? seriesData.seasons[0] 
//     : null;
//   const firstSeasonNumber = firstSeason ? firstSeason.season_number : null;
//   const firstEpisode = firstSeasonNumber && seriesData.episodes[firstSeasonNumber] 
//     ? seriesData.episodes[firstSeasonNumber][0] 
//     : null;

//   // --- Render the UI ---
//   const genresText = seriesData.genres.join(" / ");
//   const castHtml = seriesData.cast
//     .map((member, index) => `
//       <div class="cast-card" data-index="${index}" tabindex="0">
//         <img src="${member.image}" alt="${member.name}" class="cast-image" />
//         <p class="cast-name">${member.name}</p>
//       </div>
//     `)
//     .join("");

//   const heartIconHtml = seriesData.isFavorite
//     ? '<img src="/assets/heart-filled.svg" alt="fav" />'
//     : '<img src="/assets/heart.svg" alt="fav" />';

//   // inject into DOM
//   const container = document.querySelector("#series-detail-page");
//   if (!container) {
//     console.error("No #series-detail-page container found to render details.");
//     return;
//   }

//   container.innerHTML = `
//   <div class="livetv-main-container">
//     <header class="livetv-header">
//       <div class="header-left">
//         <img src="/assets/logo.png" class="app-logo" />
//         <div class="date-time">
//           <span class="current-time"></span>
//           <span class="current-date"></span>
//         </div>
//       </div>

//       <div class="live-indicator">
//         <span class="current-time">${seriesData.title}</span>
//       </div>

//       <div class="header-right">
//         <div class="search-container">
//           <div class="search-icon">
//             <img src="/assets/search.svg" />
//           </div>
//           <input type="text" class="search-input" placeholder="Search Series" />
//         </div>
//         <div class="menu-dots">
//           <span class="dot"></span><span class="dot"></span><span class="dot"></span>
//         </div>
//       </div>
//     </header>

//     <div class="movie-detail-content">
//       <!-- Left: Poster -->
//       <div class="poster-section">
//         <div class="poster-container">
//           <img src="${seriesData.posterImage}" alt="${seriesData.title}" class="poster-image" />
//           <div class="rating-badge">
//             <span class="star-icon"><img src="/assets/star.svg" class="star-icon" /></span>
//             ${seriesData.rating || ""}
//           </div>
//         </div>
//       </div>

//       <!-- Right: Details -->
//       <div class="details-section">
//         <div class="movie-header">
//           <h1 class="movie-title">${seriesData.title}</h1>
//           <div class="favorite-heart">${heartIconHtml}</div>
//         </div>

//         <div class="movie-meta">
//           <span class="release-date">${seriesData.releaseDate}</span>
//           ${seriesData.seasons.length > 0 ? `<span class="separator">•</span><span class="duration">${seriesData.seasons.length} Season${seriesData.seasons.length > 1 ? 's' : ''}</span>` : ''}
//         </div>

//         <div class="movie-info">
//           <p class="info-row">
//             <span class="label">Directed By :</span>
//             <span class="value">${seriesData.director}</span>
//           </p>
//           <p class="info-row">
//             <span class="label">Genre :</span>
//             <span class="value">${genresText}</span>
//           </p>
//         </div>

//         <p class="movie-description">${seriesData.description}</p>

//         <div class="action-buttons">
//           <button class="action-button play-button" tabindex="0" ${!firstEpisode ? 'style="opacity:0.5;cursor:not-allowed;"' : ''}>
//             <span class="play-icon">▶</span>
//             <span>Play S1.E1</span>
//           </button>
//           <button class="action-button trailer-button" ${seriesDetailData.info && seriesDetailData.info.youtube_trailer ? "" : 'style="display:none;"'} tabindex="0">Watch Trailer</button>
//           <button class="action-button cast-button" tabindex="0">
//             <span>Cast</span>
//           </button>
//         </div>
//       </div>
//     </div>

//     <!-- Cast & Crew Section -->
//     <div class="cast-section">
//       <h2 class="cast-title">Cast & Crew</h2>
//       <div class="cast-grid">
//         ${castHtml}
//       </div>
//     </div>
//   </div>
//   `;

//   // header time/date update
//   (function updateTime() {
//     const now = new Date();
//     const timeEl = container.querySelector(".current-time");
//     const dateEl = container.querySelector(".current-date");
//     if (timeEl) timeEl.textContent = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
//     if (dateEl) dateEl.textContent = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
//   })();

//   // --- Remote navigation & interactions ---
//   let currentSection = "buttons"; // header, buttons, cast
//   let currentFocusIndex = 0;

//   function setFocusOnButton(index) {
//     removeAllFocus();
//     currentSection = "buttons";
//     const buttons = Array.from(container.querySelectorAll(".action-button"));
//     if (buttons[index]) {
//       currentFocusIndex = index;
//       buttons[index].classList.add("focused");
//       try { buttons[index].scrollIntoView({ behavior: "smooth", block: "center", inline: "center" }); } catch (e){}
//     }
//   }

//   function setFocusOnCast(index) {
//     removeAllFocus();
//     currentSection = "cast";
//     const casts = Array.from(container.querySelectorAll(".cast-card"));
//     if (casts[index]) {
//       currentFocusIndex = index;
//       casts[index].classList.add("focused");
//       try { casts[index].scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" }); } catch(e){}
//     }
//   }

//   function setFocusOnHeaderSearch() {
//     removeAllFocus();
//     currentSection = "header";
//     const headerSearchContainer = container.querySelector(".search-container");
//     if (headerSearchContainer) {
//       headerSearchContainer.classList.add("search-focused");
//       try { headerSearchContainer.scrollIntoView({ behavior: "smooth", block: "center" }); } catch(e){}
//     }
//   }

//   function removeAllFocus() {
//     const focusedBtns = container.querySelectorAll(".action-button.focused");
//     focusedBtns.forEach(b => b.classList.remove("focused"));
//     const focusedCast = container.querySelectorAll(".cast-card.focused");
//     focusedCast.forEach(c => c.classList.remove("focused"));
//     const headerSearchContainer = container.querySelector(".search-container");
//     if (headerSearchContainer) headerSearchContainer.classList.remove("search-focused");
//   }

//   // initial focus: play button
//   setTimeout(() => setFocusOnButton(0), 0);

//   // click handlers for buttons
//   const playBtn = container.querySelector(".play-button");
//   const trailerBtn = container.querySelector(".trailer-button");
//   const castBtn = container.querySelector(".cast-button");
//   const favHeartContainer = container.querySelector(".favorite-heart");

//   function buildSeriesUrl(episodeId, containerExtension) {
//     var currentPlaylistData = localStorage.getItem("currentPlaylistData");
//     if (!currentPlaylistData) return "";
//     currentPlaylistData = JSON.parse(currentPlaylistData);
//     if (
//       currentPlaylistData.server_info &&
//       currentPlaylistData.user_info &&
//       episodeId &&
//       containerExtension
//     ) {
//       return (
//         currentPlaylistData.server_info.server_protocol +
//         "://" +
//         currentPlaylistData.server_info.url +
//         ":" +
//         currentPlaylistData.server_info.port +
//         "/series/" +
//         currentPlaylistData.user_info.username +
//         "/" +
//         currentPlaylistData.user_info.password +
//         "/" +
//         episodeId +
//         "." +
//         containerExtension
//       );
//     }
//     return "";
//   }

//   if (playBtn) {
//     playBtn.addEventListener("click", () => {
//       if (!firstEpisode) {
//         alert("No episodes available");
//         return;
//       }
      
//       const episodeUrl = buildSeriesUrl(firstEpisode.id, firstEpisode.container_extension);
//       localStorage.setItem("playingItemData", JSON.stringify(firstEpisode));
//       if (episodeUrl) localStorage.setItem("selectedVideoItemUrl", episodeUrl);
//       localStorage.setItem("from", "series");
//       localStorage.setItem("currentPage", "videojsPlayer");
//       if (typeof Router !== "undefined" && Router.showPage) Router.showPage("videoJsPlayer");
//       document.body.style.backgroundImage = "none";
//       document.body.style.backgroundColor = "black";
//     });
//   }

//   if (trailerBtn) {
//     trailerBtn.addEventListener("click", () => {
//       if (seriesDetailData.info && seriesDetailData.info.youtube_trailer) {
//         const trailerUrl = "https://www.youtube.com/watch?v=" + seriesDetailData.info.youtube_trailer;
//         localStorage.setItem("selectedVideoItemUrl", trailerUrl);
//         localStorage.setItem("currentPage", "videojsPlayer");
//         if (typeof Router !== "undefined" && Router.showPage) Router.showPage("videoJsPlayer");
//         document.body.style.backgroundImage = "none";
//         document.body.style.backgroundColor = "black";
//       } else {
//         alert("No trailer available");
//       }
//     });
//   }

//   if (castBtn) {
//     castBtn.addEventListener("click", () => {
//       // Scroll to cast section
//       const castSection = container.querySelector(".cast-section");
//       if (castSection) {
//         castSection.scrollIntoView({ behavior: "smooth", block: "start" });
//         // Focus on first cast member
//         setTimeout(() => {
//           setFocusOnCast(0);
//         }, 500);
//       }
//     });
//   }

//   if (favHeartContainer) {
//     favHeartContainer.addEventListener("click", () => {
//       favHeartContainer.classList.toggle("active");
//       if (typeof toggleFavoriteItem === "function") {
//         const res = toggleFavoriteItem(seriesData.id || 0, "favouriteSeries");
//         if (res && res.success) {
//           const html = res.isFav ? '<img src="/assets/heart-filled.svg" />' : '<img src="/assets/heart.svg" />';
//           favHeartContainer.innerHTML = html;
//         }
//       } else {
//         const img = favHeartContainer.querySelector("img");
//         if (img) {
//           img.src = img.src.includes("heart-filled") ? "/assets/heart.svg" : "/assets/heart-filled.svg";
//         }
//       }
//     });
//   }

//   // cast card click
//   const castCardsEls = container.querySelectorAll(".cast-card");
//   castCardsEls.forEach((card, idx) => {
//     card.addEventListener("click", () => {
//       console.log("Cast clicked:", seriesData.cast[idx]);
//     });
//   });

//   function handleRemoteNavigation(e) {
//     const buttons = Array.from(container.querySelectorAll(".action-button"));
//     const casts = Array.from(container.querySelectorAll(".cast-card"));

//     function getRowIndex(el) {
//       if (!el) return 0;
//       return Math.floor(el.getBoundingClientRect().top);
//     }

//     switch (e.key) {
//       case "ArrowRight":
//         e.preventDefault();
//         if (currentSection === "buttons") {
//           if (currentFocusIndex < buttons.length - 1) {
//             currentFocusIndex++;
//             setFocusOnButton(currentFocusIndex);
//           }
//           return;
//         }
//         if (currentSection === "cast") {
//           if (currentFocusIndex < casts.length - 1) {
//             currentFocusIndex++;
//             setFocusOnCast(currentFocusIndex);
//           }
//           return;
//         }
//         break;

//       case "ArrowLeft":
//         e.preventDefault();
//         if (currentSection === "buttons") {
//           if (currentFocusIndex > 0) {
//             currentFocusIndex--;
//             setFocusOnButton(currentFocusIndex);
//           }
//           return;
//         }
//         if (currentSection === "cast") {
//           if (currentFocusIndex > 0) {
//             currentFocusIndex--;
//             setFocusOnCast(currentFocusIndex);
//           }
//           return;
//         }
//         break;

//       case "ArrowDown":
//         e.preventDefault();
//         if (currentSection === "header") {
//           currentSection = "buttons";
//           currentFocusIndex = 0;
//           setFocusOnButton(0);
//           return;
//         }
//         if (currentSection === "buttons") {
//           currentSection = "cast";
//           currentFocusIndex = 0;
//           setFocusOnCast(0);
//           return;
//         }
//         if (currentSection === "cast") {
//           const curr = casts[currentFocusIndex];
//           const currRow = getRowIndex(curr);
//           for (let i = currentFocusIndex + 1; i < casts.length; i++) {
//             if (getRowIndex(casts[i]) > currRow) {
//               currentFocusIndex = i;
//               setFocusOnCast(i);
//               return;
//             }
//           }
//           return;
//         }
//         break;

//       case "ArrowUp":
//         e.preventDefault();
//         if (currentSection === "cast") {
//           const curr = casts[currentFocusIndex];
//           const currRow = getRowIndex(curr);
//           const isTopRow = !casts.some(c => getRowIndex(c) < currRow);
//           if (isTopRow) {
//             currentSection = "buttons";
//             currentFocusIndex = 0;
//             setFocusOnButton(0);
//             return;
//           }
//           for (let i = currentFocusIndex - 1; i >= 0; i--) {
//             if (getRowIndex(casts[i]) < currRow) {
//               currentFocusIndex = i;
//               setFocusOnCast(i);
//               return;
//             }
//           }
//           return;
//         }
//         if (currentSection === "buttons") {
//           currentSection = "header";
//           setFocusOnHeaderSearch();
//           return;
//         }
//         break;

//       case "Enter":
//         e.preventDefault();
//         if (currentSection === "buttons") {
//           buttons[currentFocusIndex]?.click();
//         } else if (currentSection === "cast") {
//           casts[currentFocusIndex]?.click();
//         }
//         return;

//       default:
//         if (
//           e.keyCode === 10009 ||
//           e.key === "Escape" ||
//           e.key === "Back" ||
//           e.key === "BrowserBack" ||
//           e.key === "XF86Back"
//         ) {
//           localStorage.removeItem("selectedSeriesId");
//           localStorage.setItem("currentPage", "seriesPage");
//           if (typeof Router !== "undefined" && Router.showPage) {
//             Router.showPage("series");
//           } else if (typeof navigateTo === "function") {
//             navigateTo("series-page");
//           }
//           document.body.style.backgroundImage = "none";
//           document.body.style.backgroundColor = "black";
//           return;
//         }
//     }
//   }

//   document.addEventListener("keydown", handleRemoteNavigation);

//   // cleanup function
//   SeriesDetailPage.cleanup = function () {
//     document.removeEventListener("keydown", handleRemoteNavigation);
//     document.removeEventListener("keydown", handleBackNavigationDuringLoading);
//   };



  
// }



async function SeriesDetailPage() {
  // cleanup previous handlers if any
  if (SeriesDetailPage.cleanup) SeriesDetailPage.cleanup();

  const castImageUrl = "https://image.tmdb.org/t/p/w500";
  const loadingOverlay = document.getElementById("loading-overlay");

  async function withTimeout(promise, ms = 7000) {
    let timer;
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("timeout")), ms);
      })
    ]).finally(() => clearTimeout(timer));
  }

  // --- Back navigation/interruption guard during loading ---
  let navigationInterrupted = false;
  function handleBackNavigationDuringLoading(e) {
    if (
      (e.keyCode === 10009 ||
        e.key === "Escape" ||
        e.key === "Back" ||
        e.key === "BrowserBack" ||
        e.key === "XF86Back") &&
      localStorage.getItem("currentPage") === "seriesDetailPage"
    ) {
      e.preventDefault();
      e.stopPropagation();
      navigationInterrupted = true;

      if (loadingOverlay) loadingOverlay.classList.add("hidden");
      document.removeEventListener("keydown", handleBackNavigationDuringLoading);

      localStorage.removeItem("selectedSeriesId");
      localStorage.setItem("currentPage", "seriesPage");
      if (typeof Router !== "undefined" && Router.showPage) Router.showPage("series");
      document.body.style.backgroundImage = "none";
      document.body.style.backgroundColor = "black";
      return true;
    }
  }
  document.addEventListener("keydown", handleBackNavigationDuringLoading);

  // --- Load series detail id/data from localStorage ---
  var seriesDetailId = localStorage.getItem("selectedSeriesId");
  var selectedSeriesItem = localStorage.getItem("selectedSeriesData");
  if (!selectedSeriesItem && !seriesDetailId) {
    console.error("No selectedSeriesData or selectedSeriesId in localStorage");
    document.removeEventListener("keydown", handleBackNavigationDuringLoading);
    return;
  }
  if (selectedSeriesItem) selectedSeriesItem = JSON.parse(selectedSeriesItem);

  if (loadingOverlay) loadingOverlay.classList.remove("hidden");

  // --- Fetch series details from API ---
  var seriesDetailData = null;
  try {
    seriesDetailData = await withTimeout(getSeriesDetail(seriesDetailId), 7000);
  } catch (err) {
    console.error("getSeriesDetail error", err);
    seriesDetailData = null;
  }

  // abort if back/navigation happened while awaiting
  if (navigationInterrupted) {
    document.removeEventListener("keydown", handleBackNavigationDuringLoading);
    return;
  }

  if (!seriesDetailData) {
    if (loadingOverlay) loadingOverlay.classList.add("hidden");
    localStorage.setItem("currentPage", "seriesPage");
    if (typeof Router !== "undefined" && Router.showPage) Router.showPage("series");
    document.body.style.backgroundImage = "none";
    document.body.style.backgroundColor = "black";
    document.removeEventListener("keydown", handleBackNavigationDuringLoading);
    return;
  }

  if (navigationInterrupted) {
    document.removeEventListener("keydown", handleBackNavigationDuringLoading);
    return;
  }

  // done loading
  if (loadingOverlay) loadingOverlay.classList.add("hidden");
  document.removeEventListener("keydown", handleBackNavigationDuringLoading);

  // --- Map API data to the UI-friendly seriesData ---
  const seriesData = {
    id: seriesDetailData.info && seriesDetailData.info.series_id
        ? seriesDetailData.info.series_id
        : seriesDetailId,
    title: seriesDetailData.info && seriesDetailData.info.name
        ? seriesDetailData.info.name
        : "No title",
    rating: seriesDetailData.info && seriesDetailData.info.rating ? seriesDetailData.info.rating : "",
    releaseDate: seriesDetailData.info && seriesDetailData.info.releaseDate ? seriesDetailData.info.releaseDate : "",
    director: seriesDetailData.info && seriesDetailData.info.director ? seriesDetailData.info.director : "N/A",
    genres: seriesDetailData.info && seriesDetailData.info.genre
        ? (Array.isArray(seriesDetailData.info.genre) 
            ? seriesDetailData.info.genre 
            : String(seriesDetailData.info.genre).split(",").map(s => s.trim()))
        : [],
    description: seriesDetailData.info && seriesDetailData.info.plot
        ? seriesDetailData.info.plot
        : "No description available",
    posterImage: seriesDetailData.info && seriesDetailData.info.cover
        ? seriesDetailData.info.cover
        : "/assets/placeholder-img.png",
    isFavorite: false,
    cast: [],
    episodes: seriesDetailData.episodes || {},
    seasons: seriesDetailData.seasons || []
  };

  // try detect favorite state if helper exists
  try {
    if (seriesData.id && typeof isItemFavoriteForPlaylist === "function") {
      seriesData.isFavorite = isItemFavoriteForPlaylist(seriesData.id, "favouriteSeries");
    }
  } catch (err) {
    seriesData.isFavorite = false;
  }

  // Get first episode from first season for Play button
  const firstSeason = seriesData.seasons && seriesData.seasons.length > 0 
    ? seriesData.seasons[0] 
    : null;
  const firstSeasonNumber = firstSeason ? firstSeason.season_number : null;
  const firstEpisode = firstSeasonNumber && seriesData.episodes[firstSeasonNumber] 
    ? seriesData.episodes[firstSeasonNumber][0] 
    : null;

  // --- Render the UI ---
  const genresText = seriesData.genres.join(" / ");
  const castHtml = seriesData.cast
    .map((member, index) => `
      <div class="cast-card" data-index="${index}" tabindex="0">
        <img src="${member.image}" alt="${member.name}" class="cast-image" />
        <p class="cast-name">${member.name}</p>
      </div>
    `)
    .join("");

  const heartIconHtml = seriesData.isFavorite
    ? '<img src="/assets/heart-filled.svg" alt="fav" />'
    : '<img src="/assets/heart.svg" alt="fav" />';

  // inject into DOM
  const container = document.querySelector("#series-detail-page");
  if (!container) {
    console.error("No #series-detail-page container found to render details.");
    return;
  }

  container.innerHTML = `
  <div class="livetv-main-container">
    <header class="livetv-header">
      <div class="header-left">
        <img src="/assets/logo.png" class="app-logo" />
        <div class="date-time">
          <span class="current-time"></span>
          <span class="current-date"></span>
        </div>
      </div>

      <div class="live-indicator">
        <span class="current-time">${seriesData.title}</span>
      </div>

      <div class="header-right">
        <div class="search-container">
          <div class="search-icon">
            <img src="/assets/search.svg" />
          </div>
          <input type="text" class="search-input" placeholder="Search Series" />
        </div>
        <div class="menu-dots">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        </div>
      </div>
    </header>

    <div class="movie-detail-content">
      <!-- Left: Poster -->
      <div class="poster-section">
        <div class="poster-container">
          <img src="${seriesData.posterImage}" alt="${seriesData.title}" class="poster-image" />
          <div class="rating-badge">
            <span class="star-icon"><img src="/assets/star.svg" class="star-icon" /></span>
            ${seriesData.rating || ""}
          </div>
        </div>
      </div>

      <!-- Right: Details -->
      <div class="details-section">
        <div class="movie-header">
          <h1 class="movie-title">${seriesData.title}</h1>
          <div class="favorite-heart">${heartIconHtml}</div>
        </div>

        <div class="movie-meta">
          <span class="release-date">${seriesData.releaseDate}</span>
          ${seriesData.seasons.length > 0 ? `<span class="separator">•</span><span class="duration">${seriesData.seasons.length} Season${seriesData.seasons.length > 1 ? 's' : ''}</span>` : ''}
        </div>

        <div class="movie-info">
          <p class="info-row">
            <span class="label">Directed By :</span>
            <span class="value">${seriesData.director}</span>
          </p>
          <p class="info-row">
            <span class="label">Genre :</span>
            <span class="value">${genresText}</span>
          </p>
        </div>

        <p class="movie-description">${seriesData.description}</p>

        <div class="action-buttons">
          <button class="action-button play-button" tabindex="0" ${!firstEpisode ? 'style="opacity:0.5;cursor:not-allowed;"' : ''}>
            <span class="play-icon">▶</span>
            <span>Play S1.E1</span>
          </button>
          <button class="action-button trailer-button" ${seriesDetailData.info && seriesDetailData.info.youtube_trailer ? "" : 'style="display:none;"'} tabindex="0">Watch Trailer</button>
          <button class="action-button cast-button" tabindex="0">
            <span>Cast</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Seasons & Episodes Section -->
    <div class="seasons-episodes-section">
      <div class="season-selector-container">
        <button class="season-dropdown" tabindex="0">
          <span class="season-text">Season 01</span>
          <span class="dropdown-arrow">v</span>
        </button>
      </div>
      
      <div class="episodes-grid" id="episodes-grid">
        <!-- Episodes will be dynamically inserted here -->
      </div>
    </div>

    <!-- Cast & Crew Section -->
    <div class="cast-section">
      <h2 class="cast-title">Cast & Crew</h2>
      <div class="cast-grid">
        ${castHtml}
      </div>
    </div>
  </div>
  `;

  // header time/date update
  (function updateTime() {
    const now = new Date();
    const timeEl = container.querySelector(".current-time");
    const dateEl = container.querySelector(".current-date");
    if (timeEl) timeEl.textContent = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    if (dateEl) dateEl.textContent = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  })();

  // --- Episodes Rendering ---
  let currentSeasonNumber = firstSeasonNumber || (seriesData.seasons[0] ? seriesData.seasons[0].season_number : 1);

  function renderEpisodes(seasonNumber) {
    const episodesGrid = container.querySelector("#episodes-grid");
    if (!episodesGrid) return;

    const episodes = seriesData.episodes[seasonNumber] || [];

    if (episodes.length === 0) {
      episodesGrid.innerHTML = '<p style="color: white; padding: 20px;">No episodes available for this season.</p>';
      return;
    }

    episodesGrid.innerHTML = episodes.map((ep, index) => {
      const episodeTitle = ep.title || `Episode ${ep.episode_num}`;
      const episodeInfo = ep.info || {};
      const episodePlot = episodeInfo.plot ;
      const episodeDuration = episodeInfo.duration ;
     

      const episodeRating = episodeInfo.rating || ep.rating ;
      const episodeCover = episodeInfo.movie_image || ep.cover || seriesData.posterImage;
      
      return `
        <div class="episode-card" data-episode-index="${index}" data-season="${seasonNumber}" tabindex="0">
          <div class="episode-image-container">
            <img src="${episodeCover}" alt="${episodeTitle}" class="episode-image" />
            <div class="episode-rating-badge">
                       <span class="star-icon"><img src="/assets/star.svg" class="star-icon" /></span>

              ${episodeRating}
            </div>
            <div class="episode-number-badge">S${String(seasonNumber)}.E${String(ep.episode_num || index + 1)}</div>
            <div class="episode-overlay-content">
          <img class="playpng" src="/assets/play.png" alt="play"/>

              <h3 class="episode-title">${episodeTitle}</h3>
              <p class="episode-description">${episodePlot}</p>
              <p class="episode-duration">${episodeDuration}</p>
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Add click handlers to episode cards
    const episodeCards = episodesGrid.querySelectorAll(".episode-card");
    episodeCards.forEach((card) => {
      card.addEventListener("click", () => {
        const episodeIndex = parseInt(card.dataset.episodeIndex);
        const seasonNum = parseInt(card.dataset.season);
        const episode = seriesData.episodes[seasonNum][episodeIndex];
        
        if (episode) {
          const episodeUrl = buildSeriesUrl(episode.id, episode.container_extension);
          localStorage.setItem("playingItemData", JSON.stringify(episode));
          if (episodeUrl) localStorage.setItem("selectedVideoItemUrl", episodeUrl);
          localStorage.setItem("from", "series");
          localStorage.setItem("currentPage", "videojsPlayer");
          if (typeof Router !== "undefined" && Router.showPage) Router.showPage("videoJsPlayer");
          document.body.style.backgroundImage = "none";
          document.body.style.backgroundColor = "black";
        }
      });
    });
  }

  // Initial episodes render
  renderEpisodes(currentSeasonNumber);

  // Season dropdown handler
  const seasonDropdown = container.querySelector(".season-dropdown");
  if (seasonDropdown && seriesData.seasons.length > 0) {
    seasonDropdown.addEventListener("click", () => {
      // Simple season cycling for now
      const currentIndex = seriesData.seasons.findIndex(s => s.season_number === currentSeasonNumber);
      const nextIndex = (currentIndex + 1) % seriesData.seasons.length;
      currentSeasonNumber = seriesData.seasons[nextIndex].season_number;
      
      const seasonText = seasonDropdown.querySelector(".season-text");
      if (seasonText) {
        seasonText.textContent = `Season ${String(currentSeasonNumber).padStart(2, '0')}`;
      }
      
      renderEpisodes(currentSeasonNumber);
    });
  }

  // --- Remote navigation & interactions ---
  let currentSection = "buttons"; // header, buttons, seasons, episodes, cast
  let currentFocusIndex = 0;

  function setFocusOnButton(index) {
    removeAllFocus();
    currentSection = "buttons";
    const buttons = Array.from(container.querySelectorAll(".action-button"));
    if (buttons[index]) {
      currentFocusIndex = index;
      buttons[index].classList.add("focused");
      try { buttons[index].scrollIntoView({ behavior: "smooth", block: "center", inline: "center" }); } catch (e){}
    }
  }

  function setFocusOnCast(index) {
    removeAllFocus();
    currentSection = "cast";
    const casts = Array.from(container.querySelectorAll(".cast-card"));
    if (casts[index]) {
      currentFocusIndex = index;
      casts[index].classList.add("focused");
      try { casts[index].scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" }); } catch(e){}
    }
  }

  function setFocusOnSeason() {
    removeAllFocus();
    currentSection = "seasons";
    const seasonDropdown = container.querySelector(".season-dropdown");
    if (seasonDropdown) {
      seasonDropdown.classList.add("focused");
      try { seasonDropdown.scrollIntoView({ behavior: "smooth", block: "center" }); } catch(e){}
    }
  }

  function setFocusOnEpisode(index) {
    removeAllFocus();
    currentSection = "episodes";
    const episodes = Array.from(container.querySelectorAll(".episode-card"));
    if (episodes[index]) {
      currentFocusIndex = index;
      episodes[index].classList.add("focused");
      try { episodes[index].scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" }); } catch(e){}
    }
  }

  function setFocusOnHeaderSearch() {
    removeAllFocus();
    currentSection = "header";
    const headerSearchContainer = container.querySelector(".search-container");
    if (headerSearchContainer) {
      headerSearchContainer.classList.add("search-focused");
      try { headerSearchContainer.scrollIntoView({ behavior: "smooth", block: "center" }); } catch(e){}
    }
  }

  function removeAllFocus() {
    const focusedBtns = container.querySelectorAll(".action-button.focused");
    focusedBtns.forEach(b => b.classList.remove("focused"));
    const focusedCast = container.querySelectorAll(".cast-card.focused");
    focusedCast.forEach(c => c.classList.remove("focused"));
    const focusedEpisodes = container.querySelectorAll(".episode-card.focused");
    focusedEpisodes.forEach(e => e.classList.remove("focused"));
    const seasonDropdown = container.querySelector(".season-dropdown");
    if (seasonDropdown) seasonDropdown.classList.remove("focused");
    const headerSearchContainer = container.querySelector(".search-container");
    if (headerSearchContainer) headerSearchContainer.classList.remove("search-focused");
  }

  // initial focus: play button
  setTimeout(() => setFocusOnButton(0), 0);

  // click handlers for buttons
  const playBtn = container.querySelector(".play-button");
  const trailerBtn = container.querySelector(".trailer-button");
  const castBtn = container.querySelector(".cast-button");
  const favHeartContainer = container.querySelector(".favorite-heart");

  function buildSeriesUrl(episodeId, containerExtension) {
    var currentPlaylistData = localStorage.getItem("currentPlaylistData");
    if (!currentPlaylistData) return "";
    currentPlaylistData = JSON.parse(currentPlaylistData);
    if (
      currentPlaylistData.server_info &&
      currentPlaylistData.user_info &&
      episodeId &&
      containerExtension
    ) {
      return (
        currentPlaylistData.server_info.server_protocol +
        "://" +
        currentPlaylistData.server_info.url +
        ":" +
        currentPlaylistData.server_info.port +
        "/series/" +
        currentPlaylistData.user_info.username +
        "/" +
        currentPlaylistData.user_info.password +
        "/" +
        episodeId +
        "." +
        containerExtension
      );
    }
    return "";
  }

  if (playBtn) {
    playBtn.addEventListener("click", () => {
      if (!firstEpisode) {
        alert("No episodes available");
        return;
      }
      
      const episodeUrl = buildSeriesUrl(firstEpisode.id, firstEpisode.container_extension);
      localStorage.setItem("playingItemData", JSON.stringify(firstEpisode));
      if (episodeUrl) localStorage.setItem("selectedVideoItemUrl", episodeUrl);
      localStorage.setItem("from", "series");
      localStorage.setItem("currentPage", "videojsPlayer");
      if (typeof Router !== "undefined" && Router.showPage) Router.showPage("videoJsPlayer");
      document.body.style.backgroundImage = "none";
      document.body.style.backgroundColor = "black";
    });
  }

  if (trailerBtn) {
    trailerBtn.addEventListener("click", () => {
      if (seriesDetailData.info && seriesDetailData.info.youtube_trailer) {
        const trailerUrl = "https://www.youtube.com/watch?v=" + seriesDetailData.info.youtube_trailer;
        localStorage.setItem("selectedVideoItemUrl", trailerUrl);
        localStorage.setItem("currentPage", "videojsPlayer");
        if (typeof Router !== "undefined" && Router.showPage) Router.showPage("videoJsPlayer");
        document.body.style.backgroundImage = "none";
        document.body.style.backgroundColor = "black";
      } else {
        alert("No trailer available");
      }
    });
  }

  if (castBtn) {
    castBtn.addEventListener("click", () => {
      // Scroll to cast section
      const castSection = container.querySelector(".cast-section");
      if (castSection) {
        castSection.scrollIntoView({ behavior: "smooth", block: "start" });
        // Focus on first cast member
        setTimeout(() => {
          setFocusOnCast(0);
        }, 500);
      }
    });
  }

  if (favHeartContainer) {
    favHeartContainer.addEventListener("click", () => {
      favHeartContainer.classList.toggle("active");
      if (typeof toggleFavoriteItem === "function") {
        const res = toggleFavoriteItem(seriesData.id || 0, "favouriteSeries");
        if (res && res.success) {
          const html = res.isFav ? '<img src="/assets/heart-filled.svg" />' : '<img src="/assets/heart.svg" />';
          favHeartContainer.innerHTML = html;
        }
      } else {
        const img = favHeartContainer.querySelector("img");
        if (img) {
          img.src = img.src.includes("heart-filled") ? "/assets/heart.svg" : "/assets/heart-filled.svg";
        }
      }
    });
  }

  // cast card click
  const castCardsEls = container.querySelectorAll(".cast-card");
  castCardsEls.forEach((card, idx) => {
    card.addEventListener("click", () => {
      console.log("Cast clicked:", seriesData.cast[idx]);
    });
  });

  function handleRemoteNavigation(e) {
    const buttons = Array.from(container.querySelectorAll(".action-button"));
    const casts = Array.from(container.querySelectorAll(".cast-card"));
    const episodes = Array.from(container.querySelectorAll(".episode-card"));

    function getRowIndex(el) {
      if (!el) return 0;
      return Math.floor(el.getBoundingClientRect().top);
    }

    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        if (currentSection === "buttons") {
          if (currentFocusIndex < buttons.length - 1) {
            currentFocusIndex++;
            setFocusOnButton(currentFocusIndex);
          }
          return;
        }
        if (currentSection === "episodes") {
          if (currentFocusIndex < episodes.length - 1) {
            currentFocusIndex++;
            setFocusOnEpisode(currentFocusIndex);
          }
          return;
        }
        if (currentSection === "cast") {
          if (currentFocusIndex < casts.length - 1) {
            currentFocusIndex++;
            setFocusOnCast(currentFocusIndex);
          }
          return;
        }
        break;

      case "ArrowLeft":
        e.preventDefault();
        if (currentSection === "buttons") {
          if (currentFocusIndex > 0) {
            currentFocusIndex--;
            setFocusOnButton(currentFocusIndex);
          }
          return;
        }
        if (currentSection === "episodes") {
          if (currentFocusIndex > 0) {
            currentFocusIndex--;
            setFocusOnEpisode(currentFocusIndex);
          }
          return;
        }
        if (currentSection === "cast") {
          if (currentFocusIndex > 0) {
            currentFocusIndex--;
            setFocusOnCast(currentFocusIndex);
          }
          return;
        }
        break;

      case "ArrowDown":
        e.preventDefault();
        if (currentSection === "header") {
          currentSection = "buttons";
          currentFocusIndex = 0;
          setFocusOnButton(0);
          return;
        }
        if (currentSection === "buttons") {
          setFocusOnSeason();
          return;
        }
        if (currentSection === "seasons") {
          if (episodes.length > 0) {
            currentFocusIndex = 0;
            setFocusOnEpisode(0);
          }
          return;
        }
        if (currentSection === "episodes") {
          const curr = episodes[currentFocusIndex];
          const currRow = getRowIndex(curr);
          for (let i = currentFocusIndex + 1; i < episodes.length; i++) {
            if (getRowIndex(episodes[i]) > currRow) {
              currentFocusIndex = i;
              setFocusOnEpisode(i);
              return;
            }
          }
          // If no more rows in episodes, go to cast
          if (casts.length > 0) {
            currentFocusIndex = 0;
            setFocusOnCast(0);
          }
          return;
        }
        if (currentSection === "cast") {
          const curr = casts[currentFocusIndex];
          const currRow = getRowIndex(curr);
          for (let i = currentFocusIndex + 1; i < casts.length; i++) {
            if (getRowIndex(casts[i]) > currRow) {
              currentFocusIndex = i;
              setFocusOnCast(i);
              return;
            }
          }
          return;
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        if (currentSection === "cast") {
          const curr = casts[currentFocusIndex];
          const currRow = getRowIndex(curr);
          const isTopRow = !casts.some(c => getRowIndex(c) < currRow);
          if (isTopRow) {
            if (episodes.length > 0) {
              currentFocusIndex = episodes.length - 1;
              setFocusOnEpisode(currentFocusIndex);
            } else {
              setFocusOnSeason();
            }
            return;
          }
          for (let i = currentFocusIndex - 1; i >= 0; i--) {
            if (getRowIndex(casts[i]) < currRow) {
              currentFocusIndex = i;
              setFocusOnCast(i);
              return;
            }
          }
          return;
        }
        if (currentSection === "episodes") {
          const curr = episodes[currentFocusIndex];
          const currRow = getRowIndex(curr);
          const isTopRow = !episodes.some(ep => getRowIndex(ep) < currRow);
          if (isTopRow) {
            setFocusOnSeason();
            return;
          }
          for (let i = currentFocusIndex - 1; i >= 0; i--) {
            if (getRowIndex(episodes[i]) < currRow) {
              currentFocusIndex = i;
              setFocusOnEpisode(i);
              return;
            }
          }
          return;
        }
        if (currentSection === "seasons") {
          currentSection = "buttons";
          currentFocusIndex = 0;
          setFocusOnButton(0);
          return;
        }
        if (currentSection === "buttons") {
          currentSection = "header";
          setFocusOnHeaderSearch();
          return;
        }
        break;

      case "Enter":
        e.preventDefault();
        if (currentSection === "buttons") {
          buttons[currentFocusIndex]?.click();
        } else if (currentSection === "seasons") {
          const seasonDropdown = container.querySelector(".season-dropdown");
          seasonDropdown?.click();
        } else if (currentSection === "episodes") {
          episodes[currentFocusIndex]?.click();
        } else if (currentSection === "cast") {
          casts[currentFocusIndex]?.click();
        }
        return;

      default:
        if (
          e.keyCode === 10009 ||
          e.key === "Escape" ||
          e.key === "Back" ||
          e.key === "BrowserBack" ||
          e.key === "XF86Back"
        ) {
          localStorage.removeItem("selectedSeriesId");
          localStorage.setItem("currentPage", "seriesPage");
          if (typeof Router !== "undefined" && Router.showPage) {
            Router.showPage("series");
          } else if (typeof navigateTo === "function") {
            navigateTo("series-page");
          }
          document.body.style.backgroundImage = "none";
          document.body.style.backgroundColor = "black";
          return;
        }
    }
  }

  document.addEventListener("keydown", handleRemoteNavigation);

  // cleanup function
  SeriesDetailPage.cleanup = function () {
    document.removeEventListener("keydown", handleRemoteNavigation);
    document.removeEventListener("keydown", handleBackNavigationDuringLoading);
  };
}