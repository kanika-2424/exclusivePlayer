
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



  var seriesName =
  seriesDetailData.info && seriesDetailData.info.name
    ? seriesDetailData.info.name
    : null;
console.log("seriesDetailData" , seriesDetailData);

////////////// tmdb////////
var getSeriesCastData = null;

try {
  if (seriesName) {
    // Step 1: Search for the series to get TMDB ID
    const searchUrl = `https://api.themoviedb.org/3/search/tv?api_key=${localStorage.getItem("tmbdId")}&query=${encodeURIComponent(seriesName)}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) throw new Error("TMDB Search API failed");
    const searchData = await searchRes.json();
    
    // Step 2: Find matching series
    const matchingSeries = searchData.results && searchData.results.length > 0
      ? searchData.results.find(s => s.original_name === seriesName.trim()) || searchData.results[0]
      : null;
    
    // Step 3: Fetch cast data using the TMDB ID
    if (matchingSeries && matchingSeries.id) {
      const castUrl = `https://api.themoviedb.org/3/tv/${matchingSeries.id}/credits?api_key=${localStorage.getItem("tmbdId")}`;
      const castRes = await fetch(castUrl);
      if (!castRes.ok) throw new Error("TMDB Cast API failed");
      getSeriesCastData = await castRes.json();
      
      // Check for navigation interruption
      if (navigationInterrupted) {
        document.removeEventListener("keydown", handleBackNavigationDuringLoading);
        return;
      }
    }
  } else {
    console.warn("No series name available for TMDB lookup");
  }
} catch (err) {
  console.warn("getSeriesCast error", err);
  getSeriesCastData = null;
}



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

  // Get continue watching data for series
var selectedPlaylistData = localStorage.getItem("selectedPlaylist");
var currentPlaylistName = "";
if (selectedPlaylistData) {
  var parsedPlaylist = JSON.parse(selectedPlaylistData);
  currentPlaylistName = parsedPlaylist.playlistName || "";
}

var playlistsData = localStorage.getItem("playlistsData");
var currentPlaylist = null;
if (playlistsData) {
  playlistsData = JSON.parse(playlistsData);
  currentPlaylist = playlistsData.find(pl => pl.playlistName === currentPlaylistName);
}

var continueWatchingSeriesIds = [];
if (currentPlaylist && currentPlaylist.continueWatchingSeries && Array.isArray(currentPlaylist.continueWatchingSeries)) {
  continueWatchingSeriesIds = currentPlaylist.continueWatchingSeries.map(function (item) {
    return item.itemId ? item.itemId.toString() : "";
  });
}

var isContinueWatchingSeries = continueWatchingSeriesIds.includes(seriesData.id.toString());

// Get current episode details for "Start from Beginning" button
let currentEpisodeInfo = '';
if (isContinueWatchingSeries && currentPlaylist.continueWatchingSeries) {
  const continueItem = currentPlaylist.continueWatchingSeries.find(
    item => item.itemId === seriesData.id.toString()
  );
  
  if (continueItem) {
    // Find the episode details
    for (const [seasonNum, seasonEpisodes] of Object.entries(seriesData.episodes)) {
      const episode = seasonEpisodes.find(ep => ep.id.toString() === continueItem.episodeId);
      if (episode) {
        currentEpisodeInfo = `S${seasonNum}.E${episode.episode_num}`;
        break;
      }
    }
  }
}

// Add to seriesData object
seriesData.isContinueWatching = isContinueWatchingSeries;

seriesData.cast = [
  { id: 1, name: "John Doe", image: "/assets/profile.png" },
  { id: 2, name: "Jane Smith", image: "/assets/profile.png" },
  { id: 3, name: "Michael Johnson", image: "/assets/profile.png" },
  { id: 4, name: "Emily Davis", image: "/assets/profile.png" },
  { id: 5, name: "David Wilson", image: "/assets/profile.png" },
  { id: 6, name: "Sarah Brown", image: "/assets/profile.png" },
  { id: 7, name: "Chris Martin", image: "/assets/profile.png" },
  { id: 8, name: "Lisa Anderson", image: "/assets/profile.png" },
  { id: 9, name: "Robert Taylor", image: "/assets/profile.png" },
  { id: 9, name: "Robert Taylor", image: "/assets/profile.png" },
  { id: 9, name: "Robert Taylor", image: "/assets/profile.png" },
  { id: 9, name: "Robert Taylor", image: "/assets/profile.png" },
  { id: 9, name: "Robert Taylor", image: "/assets/profile.png" },
  { id: 9, name: "Robert Taylor", image: "/assets/profile.png" },
  { id: 10, name: "Amanda White", image: "/assets/profile.png" }
];

////////////// TMDB/////////
if (getSeriesCastData && Array.isArray(getSeriesCastData.cast)) {
  seriesData.cast = getSeriesCastData.cast.map((c) => ({
    id: c.id || c.cast_id || Math.random(),
    name: c.name || c.original_name || "",
    image: c.profile_path ? castImageUrl + c.profile_path : "/assets/profile.png",
  }));
} else {
  seriesData.cast = [];
}


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
 

  const heartIconHtml = seriesData.isFavorite
    ? '<img src="/assets/heart-filled.svg" alt="fav" />'
    : '<img src="/assets/heart.png" alt="fav" />';

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
       
        <div class="menu-dots">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        </div>
      </div>
    </header>

     <!-- ADD THESE LINES HERE (right after header): -->
    <div class="sidebar-container-series-detail" style="display: none;">
      ${Sidebar({ from: "seriesDetailPage" })}
    </div>

    <!-- Add Sorting Dialog -->
    ${SortingDialog()}
    <!-- END OF NEW ADDITIONS -->


    <div class="movie-detail-content">
      <!-- Left: Poster -->
      <div class="poster-section">
        <div class="poster-container">
          <img src="${seriesData.posterImage}" alt="${seriesData.title}" class="poster-image" />
          <div class="rating-badge">
            <span class="star-icon"><img src="/assets/star.png" class="star-icon" /></span>
            ${seriesData.rating || ""}
          </div>
        </div>
      </div>

      <!-- Right: Details -->
      <div class="details-section">
        <div class="movie-header">
          <h1 class="movie-title">${seriesData.title}</h1>
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

      <!-- Wrapper with white border around all buttons + cast dropdown -->
        <div class="cast-wrapper" id="cast-wrapper">
          <div class="action-buttons">
            <button class="action-button play-button" tabindex="0" ${!firstEpisode ? 'style="opacity:0.5;cursor:not-allowed;"' : ''}>
              <span class="play-icon">▶</span>
              <span>Play S1.E1</span>
            </button>

            ${isContinueWatchingSeries ? `
  <button class="action-button from-start-button" tabindex="0">
    <span>Start from Beginning${currentEpisodeInfo ? ` ${currentEpisodeInfo}` : ''}</span>
  </button>
` : ''}


            <button class="action-button trailer-button" ${seriesDetailData.info && seriesDetailData.info.youtube_trailer ? "" : ''} tabindex="0">Watch Trailer</button>
            <button class="action-button cast-button" tabindex="0">
              <span>Cast</span>
              <span class="cast-arrow">  <i class="fa-solid fa-chevron-down"></i>
</span>
            </button>
          </div>

          <!-- Cast dropdown inside the wrapper -->
          <div class="cast-dropdown-container-wrapper">
            <div class="cast-dropdown hidden" id="cast-dropdown">
              <div class="cast-dropdown-header">
                <h3>Cast & Crew</h3>
              </div>
<div class="cast-dropdown-grid">
  ${seriesData.cast && seriesData.cast.length > 0 
    ? seriesData.cast.map((member, index) => `
      <div class="cast-dropdown-card" data-index="${index}" tabindex="0">
          <img src="${member.image}" alt="${member.name}" class="cast-image" "/>
             
        <p class="cast-dropdown-name">${member.name}</p>
      </div>
    `).join('')
    : '<p style="color: white; padding: 20px; text-align: center;">No cast information available</p>'
  }
</div>
            </div>
          </div>
        </div>
    </div>
      </div>
    </div>

<div class="seasons-episodes-section">
  <div class="season-selector-container">
    <!-- WRAPPER that will get the white border when active -->
    <div class="season-wrapper" id="season-wrapper">
      <!-- Blue pill button -->
      <button class="season-dropdown" id="season-dropdown" aria-haspopup="listbox" aria-expanded="false" tabindex="0">
        <span class="season-text">Season 1</span>
              <span class="cast-arrow">  <i class="fa-solid fa-chevron-down"></i>

        
      </button>

      <!-- White bordered menu container (hidden by default) -->
      <div class="season-dropdown-menu hidden" id="season-dropdown-menu" role="listbox" tabindex="-1">
        <!-- items inserted here dynamically -->
      </div>
    </div>
  </div>

  <div class="episodes-grid" id="episodes-grid">
    <!-- Episodes will be dynamically inserted here -->
  </div>
</div>


   
  </div>
  `;


  const sortingContainer = document.createElement('div');
sortingContainer.innerHTML = SortingDialog();
document.body.appendChild(sortingContainer);

// Attach sorting dialog events
if (typeof attachSortingDialogEvents === "function") {
  attachSortingDialogEvents();
}

function updatePlayButtonText() {
  const playBtn = container.querySelector(".play-button");
  if (!playBtn) return;
  
  const selectedPlaylistData = localStorage.getItem("selectedPlaylist");
  
  if (!selectedPlaylistData) {
    playBtn.querySelector("span:last-child").textContent = "Play S1.E1";
    return;
  }
  
  try {
    const parsedPlaylist = JSON.parse(selectedPlaylistData);
    const currentPlaylistName = parsedPlaylist.playlistName || "";
    
    let playlistsData = JSON.parse(localStorage.getItem("playlistsData") || "[]");
    const currentPlaylist = playlistsData.find(pl => pl.playlistName === currentPlaylistName);
    
    if (!currentPlaylist.continueWatchingSeries) {
      playBtn.querySelector("span:last-child").textContent = "Play S1.E1";
      return;
    }
    
    // Find any continue watching item for this series
    const continueWatchingItem = currentPlaylist.continueWatchingSeries.find(
      item => item.itemId === seriesData.id.toString()
    );
    
    if (!continueWatchingItem) {
      playBtn.querySelector("span:last-child").textContent = "Play S1.E1";
      return;
    }
    
    // Find episode details using the episodeId from continue watching
    for (const [seasonNum, seasonEpisodes] of Object.entries(seriesData.episodes)) {
      const episode = seasonEpisodes.find(ep => ep.id.toString() === continueWatchingItem.episodeId);
      if (episode) {
        playBtn.querySelector("span:last-child").innerHTML = `Continue S${seasonNum}.E${episode.episode_num}`;
        // Store this episode ID for later use
        localStorage.setItem(`lastPlayedEpisode_${seriesData.id}`, continueWatchingItem.episodeId);
        return;
      }
    }
    
    // If episode not found, default to S1.E1
    playBtn.querySelector("span:last-child").textContent = "Play S1.E1";
  } catch (error) {
    console.error("Error updating play button text:", error);
    playBtn.querySelector("span:last-child").textContent = "Play S1.E1";
  }
}


setTimeout(updatePlayButtonText, 100);

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

  // Get continue watching data
  const selectedPlaylistData = localStorage.getItem("selectedPlaylist");
  let currentPlaylistName = "";
  if (selectedPlaylistData) {
    const parsedPlaylist = JSON.parse(selectedPlaylistData);
    currentPlaylistName = parsedPlaylist.playlistName || "";
  }

  let playlistsData = localStorage.getItem("playlistsData");
  let currentPlaylist = null;
  if (playlistsData) {
    playlistsData = JSON.parse(playlistsData);
    currentPlaylist = playlistsData.find(pl => pl.playlistName === currentPlaylistName);
  }

const continueWatchingData = currentPlaylist.continueWatchingSeries || [];

  episodesGrid.innerHTML = episodes.map((ep, index) => {
    const episodeTitle = ep.title || `Episode ${ep.episode_num}`;
    const episodeInfo = ep.info || {};
    const episodePlot = episodeInfo.plot || "";
    const episodeDuration = episodeInfo.duration || "";
    const episodeRating = episodeInfo.rating || ep.rating || "";
    const episodeCover = episodeInfo.movie_image || ep.cover || seriesData.posterImage;
    
// Check continue watching - match by series ID and episode ID
const continueWatchingItem = continueWatchingData.find(
  item => item.itemId === seriesData.id.toString() && item.episodeId === ep.id.toString()
);

const hasProgress = !!continueWatchingItem;
const progressPercent = hasProgress 
  ? Math.round((continueWatchingItem.resumeTime / continueWatchingItem.duration) * 100)
  : 0;

// Check if this is the last played episode
const lastPlayedEpisodeId = localStorage.getItem(`lastPlayedEpisode_${seriesData.id}`);
const isLastPlayed = lastPlayedEpisodeId && lastPlayedEpisodeId === ep.id.toString();
    
    return `
      <div class="episode-card ${isLastPlayed ? 'last-played' : ''}" 
           data-episode-index="${index}" 
           data-season="${seasonNumber}" 
           data-episode-id="${ep.id}"
           tabindex="0">
        <div class="episode-image-container">
          <img src="${episodeCover}" alt="${episodeTitle}" class="episode-image" />
          
          ${hasProgress ? `
            <div class="episode-progress-bar">
              <div class="episode-progress-fill" style="width: ${progressPercent}%"></div>
            </div>
            <div class="episode-resume-badge">${progressPercent}% watched</div>
          ` : ''}
          
          ${isLastPlayed ? '<div class="last-played-badge">Continue Watching</div>' : ''}
          
          <div class="episode-rating-badge">
            <span class="star-icon"><img src="/assets/star.png" class="star-icon" /></span>
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

  // Add click handlers
  const episodeCards = episodesGrid.querySelectorAll(".episode-card");
  episodeCards.forEach((card) => {
    card.addEventListener("click", () => {
      const episodeIndex = parseInt(card.dataset.episodeIndex);
      const seasonNum = parseInt(card.dataset.season);
      const episode = seriesData.episodes[seasonNum][episodeIndex];
      
      if (episode) {
        playEpisode(episode, seasonNum);
      }
    });
  });
}

  // Initial episodes render
  renderEpisodes(currentSeasonNumber);

  function scrollToLastPlayedEpisode() {
const lastPlayedEpisodeId = localStorage.getItem(`lastPlayedEpisode_${seriesData.id}`);
  if (!lastPlayedEpisodeId) return;
  
  const lastPlayedCard = container.querySelector(`.episode-card[data-episode-id="${lastPlayedEpisodeId}"]`);
  if (lastPlayedCard) {
    console.log("📍 Scrolling to last played episode:", lastPlayedEpisodeId);
    
    // Scroll to the card
    lastPlayedCard.scrollIntoView({ 
      behavior: "smooth", 
      block: "center",
      inline: "center"
    });
    
    // Add highlight animation
    lastPlayedCard.classList.add("highlight");
    setTimeout(() => {
      lastPlayedCard.classList.remove("highlight");
    }, 2000);
  }
}


setTimeout(scrollToLastPlayedEpisode, 500);


// Reset Resume Time Function for Series
function resetSeriesResumeTime(seriesId, episodeId) {
  if (!seriesId) return;
  
  var playlistsData = localStorage.getItem("playlistsData");
  if (!playlistsData) return;
  playlistsData = JSON.parse(playlistsData);

  var selectedPlaylist = localStorage.getItem("selectedPlaylist");
  if (!selectedPlaylist) return;
  selectedPlaylist = JSON.parse(selectedPlaylist);
  var playlistName = selectedPlaylist.playlistName;

  for (var i = 0; i < playlistsData.length; i++) {
    if (playlistsData[i].playlistName === playlistName && playlistsData[i].continueWatchingSeries) {
      for (var j = 0; j < playlistsData[i].continueWatchingSeries.length; j++) {
        if (playlistsData[i].continueWatchingSeries[j].itemId === seriesId.toString()) {
          // If episodeId provided, reset only that episode, otherwise reset entire series
          if (episodeId && playlistsData[i].continueWatchingSeries[j].episodeId === episodeId.toString()) {
            playlistsData[i].continueWatchingSeries[j].resumeTime = 0;
          } else if (!episodeId) {
            // Reset all episodes for this series
            playlistsData[i].continueWatchingSeries[j].resumeTime = 0;
          }
        }
      }
    }
  }

  localStorage.setItem("playlistsData", JSON.stringify(playlistsData));
}

  function playEpisode(episode, seasonNumber) {
  console.log("🎬 Playing episode:", episode, "Season:", seasonNumber);
  
  const episodeUrl = buildSeriesUrl(episode.id, episode.container_extension);
  
  if (!episodeUrl) {
    console.error("❌ Failed to build episode URL");
    alert("Unable to play episode. Please try again.");
    return;
  }
  
  // Store episode data with season info
  const episodeData = {
    ...episode,
    season: seasonNumber,
    series_id: seriesData.id,
    series_name: seriesData.title
  };
  
  console.log("📦 Storing episode data:", episodeData);
  console.log("🔗 Episode URL:", episodeUrl);
  
  localStorage.setItem("playingItemData", JSON.stringify(episodeData));
  localStorage.setItem("selectedVideoItemUrl", episodeUrl);
  localStorage.setItem("selectedEpisodeId", episode.id.toString());
  localStorage.setItem("selectedSeriesId", seriesData.id.toString());
  localStorage.setItem("selectedSeason", seasonNumber.toString());
  localStorage.setItem("seriesEpisodesData", JSON.stringify(seriesData.episodes));
  localStorage.setItem("from", "series");
  localStorage.setItem("currentPage", "videojsPlayer");
  
  if (typeof Router !== "undefined" && Router.showPage) {
    Router.showPage("videoJsPlayer");
  }
  
  document.body.style.backgroundImage = "none";
  document.body.style.backgroundColor = "black";
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
  
  // ADD THIS:
  const menuDots = container.querySelector(".menu-dots");
  if (menuDots) menuDots.classList.remove("menu-focused");
}

  function setFocusOnMenuDots() {
  removeAllFocus();
  currentSection = "menuDots";
  const menuDots = container.querySelector(".menu-dots");
  if (menuDots) {
    menuDots.classList.add("menu-focused");
    try { 
      menuDots.scrollIntoView({ 
        behavior: "smooth", 
        block: "center" 
      }); 
    } catch(e){}
  }
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
    const selectedPlaylistData = localStorage.getItem("selectedPlaylist");
    
    let episodeToPlay = null;
    let seasonToPlay = null;
    
    // Try to find continue watching episode from playlist data
    if (selectedPlaylistData) {
      try {
        const parsedPlaylist = JSON.parse(selectedPlaylistData);
        const currentPlaylistName = parsedPlaylist.playlistName || "";
        
        let playlistsData = JSON.parse(localStorage.getItem("playlistsData") || "[]");
        const currentPlaylist = playlistsData.find(pl => pl.playlistName === currentPlaylistName);
        
        if (currentPlaylist.continueWatchingSeries) {
          const continueWatchingItem = currentPlaylist.continueWatchingSeries.find(
            item => item.itemId === seriesData.id.toString()
          );
          
          if (continueWatchingItem) {
            // Find the episode
            for (const [seasonNum, seasonEpisodes] of Object.entries(seriesData.episodes)) {
              const foundEpisode = seasonEpisodes.find(ep => ep.id.toString() === continueWatchingItem.episodeId);
              if (foundEpisode) {
                episodeToPlay = foundEpisode;
                seasonToPlay = parseInt(seasonNum);
                console.log("▶️ Resuming continue watching episode S" + seasonNum + ".E" + foundEpisode.episode_num);
                break;
              }
            }
          }
        }
      } catch (error) {
        console.error("Error finding continue watching episode:", error);
      }
    }
    
    // Fallback to first episode
    if (!episodeToPlay) {
      if (!firstEpisode) {
        alert("No episodes available");
        return;
      }
      episodeToPlay = firstEpisode;
      seasonToPlay = firstSeasonNumber;
      console.log("▶️ Playing first episode");
    }
    
    playEpisode(episodeToPlay, seasonToPlay);
  });
}

// Handle "Start from Beginning" button
const fromStartBtn = container.querySelector(".from-start-button");
if (fromStartBtn) {
  fromStartBtn.addEventListener("click", () => {
    // Reset resume time before playing
    if (seriesData.id) {
      resetSeriesResumeTime(seriesData.id, firstEpisode ? firstEpisode.id : null);
    }
    
    // Play first episode from beginning
    if (!firstEpisode) {
      alert("No episodes available");
      return;
    }
    
    console.log("▶️ Starting from beginning - S1.E1");
    playEpisode(firstEpisode, firstSeasonNumber);
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


const castWrapper = container.querySelector("#cast-wrapper");

if (castBtn && castWrapper) {
  // Create backdrop element
  const backdrop = document.createElement('div');
  backdrop.className = 'cast-backdrop';
  backdrop.id = 'cast-backdrop';
  document.body.appendChild(backdrop);

  castBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const castDropdown = container.querySelector("#cast-dropdown");
        const fromStartBtn = container.querySelector(".from-start-button"); // ⭐ NEW

    
    if (castDropdown) {
      const isHidden = castDropdown.classList.contains("hidden");
      
      if (isHidden) {
        // Open dropdown
        castDropdown.classList.remove("hidden");
        castBtn.classList.add("open");
        castWrapper.classList.add("active");
        backdrop.classList.add("active");
        
        // Add dimmed class to play and trailer buttons
        if (playBtn) playBtn.classList.add("dimmed");
        if (trailerBtn) trailerBtn.classList.add("dimmed");
                if (fromStartBtn) fromStartBtn.classList.add("dimmed"); // ⭐ NEW

        setTimeout(() => {
    const h = castDropdown.offsetHeight;
    const w = castDropdown.offsetWidth;
    castWrapper.style.setProperty("--cast-dropdown-height", `${h + 15}px`);
    
    // ✅ ADD: Auto-focus first cast card when opening
    const firstCastCard = castDropdown.querySelector(".cast-dropdown-card");
    if (firstCastCard) {
      firstCastCard.classList.add("focused");
      firstCastCard.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, 10);
} else {
        // Close dropdown
        castDropdown.classList.add("hidden");
        castBtn.classList.remove("open");
        castWrapper.classList.remove("active");
        backdrop.classList.remove("active");
        
        // Remove dimmed class from play and trailer buttons
        if (playBtn) playBtn.classList.remove("dimmed");
        if (trailerBtn) trailerBtn.classList.remove("dimmed");
                if (fromStartBtn) fromStartBtn.classList.remove("dimmed"); // ⭐ NEW

        
        castWrapper.style.removeProperty("--cast-dropdown-height");
      }
    }
  });
  
  // Close dropdown when clicking backdrop
  backdrop.addEventListener("click", () => {
    const castDropdown = container.querySelector("#cast-dropdown");
      const fromStartBtn = container.querySelector(".from-start-button"); // ⭐ NEW

    if (castDropdown && !castDropdown.classList.contains("hidden")) {
      castDropdown.classList.add("hidden");
      castBtn.classList.remove("open");
      castWrapper.classList.remove("active");
      backdrop.classList.remove("active");
      
      // Remove dimmed class
      if (playBtn) playBtn.classList.remove("dimmed");
      if (trailerBtn) trailerBtn.classList.remove("dimmed");
          if (fromStartBtn) fromStartBtn.classList.remove("dimmed"); // ⭐ NEW

      
      castWrapper.style.removeProperty("--cast-dropdown-height");
    }
  });
  
  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    const castDropdown = container.querySelector("#cast-dropdown");
      const fromStartBtn = container.querySelector(".from-start-button"); // ⭐ NEW

    
    if (castWrapper && !castWrapper.contains(e.target)) {
      if (castDropdown && !castDropdown.classList.contains("hidden")) {
        castDropdown.classList.add("hidden");
        castBtn.classList.remove("open");
        castWrapper.classList.remove("active");
        backdrop.classList.remove("active");
        
        // Remove dimmed class
        if (playBtn) playBtn.classList.remove("dimmed");
        if (trailerBtn) trailerBtn.classList.remove("dimmed");
              if (fromStartBtn) fromStartBtn.classList.remove("dimmed"); // ⭐ NEW

        
        castWrapper.style.removeProperty("--cast-dropdown-height");
      }
    }
  });
}

if (castBtn) {
  castBtn.addEventListener("click", () => {
    const castSection = container.querySelector(".cast-section");
    if (castSection) {
      // Toggle visibility
      castSection.classList.toggle("visible");
      
      if (castSection.classList.contains("visible")) {
        castSection.scrollIntoView({ behavior: "smooth", block: "start" });
        // Focus on first cast member after animation
        setTimeout(() => {
          setFocusOnCast(0);
        }, 500);
      } else {
        // Return focus to cast button when hiding
        setFocusOnButton(2); // Index 2 is cast button (Play=0, Trailer=1, Cast=2)
      }
    }
  });
}

  if (favHeartContainer) {
    favHeartContainer.addEventListener("click", () => {
      favHeartContainer.classList.toggle("active");
      if (typeof toggleFavoriteItem === "function") {
        const res = toggleFavoriteItem(seriesData.id || 0, "favouriteSeries");
        if (res && res.success) {
          const html = res.isFav ? '<img src="/assets/heart-filled.svg" />' : '<img src="/assets/heart.png" />';
          favHeartContainer.innerHTML = html;
        }
      } else {
        const img = favHeartContainer.querySelector("img");
        if (img) {
          img.src = img.src.includes("heart-filled") ? "/assets/heart.png" : "/assets/heart-filled.svg";
        }
      }
    });
  }

  // Menu dots click handler (add after favHeartContainer listener)
const menuDots = container.querySelector(".menu-dots");
if (menuDots) {
  // Remove any existing listeners
  const newMenuDots = menuDots.cloneNode(true);
  menuDots.parentNode.replaceChild(newMenuDots, menuDots);
  
  newMenuDots.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("🖱️ Menu dots clicked on series detail page!");
    
    if (typeof openSidebar === "function") {
      openSidebar("seriesDetailPage");
    } else {
      console.error("❌ openSidebar function not found!");
    }
  });
}

// Menu key handler for series detail page
function handleMenuKey(e) {
  const currentPage = localStorage.getItem("currentPage");
  if (currentPage !== "seriesDetailPage") return;
  
  // Handle Menu/ContextMenu key
  if (e.key === "Menu" || e.key === "ContextMenu" || e.key === "F2" || e.keyCode === 93) {
    e.preventDefault();
    e.stopPropagation();
    
    if (typeof openSidebar === "function") {
      openSidebar("seriesDetailPage");
    } else {
      console.error("❌ openSidebar function not found!");
    }
  }
}

document.addEventListener("keydown", handleMenuKey);

  // cast card click
  const castCardsEls = container.querySelectorAll(".cast-card");
  castCardsEls.forEach((card, idx) => {
    card.addEventListener("click", () => {
      console.log("Cast clicked:", seriesData.cast[idx]);
    });
  });


  // Add this right after castBtn event listener setup, BEFORE handleRemoteNavigation
document.addEventListener("keydown", function closeCastDropdownHandler(e) {
  const castDropdown = container.querySelector("#cast-dropdown");
  const backdrop = document.getElementById('cast-backdrop');
  const castWrapper = container.querySelector("#cast-wrapper");
  const castBtn = container.querySelector(".cast-button");
  const playBtn = container.querySelector(".play-button");
  const trailerBtn = container.querySelector(".trailer-button");
    const fromStartBtn = container.querySelector(".from-start-button"); // ⭐ NEW

  
  if (!castDropdown || castDropdown.classList.contains("hidden")) return;
  
  // Check for ESC or Back keys
  if (
    e.keyCode === 27 ||  // ESC
    e.keyCode === 10009 ||  // Samsung/LG Back
    e.key === "Escape" || 
    e.key === "Back" || 
    e.key === "BrowserBack" || 
    e.key === "XF86Back"
  ) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    // Close dropdown
    castDropdown.classList.add("hidden");
    if (castBtn) castBtn.classList.remove("open");
    if (castWrapper) {
      castWrapper.classList.remove("active");
      castWrapper.style.removeProperty("--cast-dropdown-height");
    }
    
    // Remove backdrop
    if (backdrop) backdrop.classList.remove("active");
    
    // Remove dimmed class from buttons
    if (playBtn) playBtn.classList.remove("dimmed");
    if (trailerBtn) trailerBtn.classList.remove("dimmed");
        if (fromStartBtn) fromStartBtn.classList.remove("dimmed"); // ⭐ NEW

    
    setFocusOnButton(2);
  }
}, true); // Use capture phase to catch event early

// Add cast dropdown navigation handler
// Replace the handleCastDropdownNavigation function with this simpler version:
document.addEventListener("keydown", function handleCastDropdownNavigation(e) {
  const castDropdown = container.querySelector("#cast-dropdown");
  
  if (!castDropdown || castDropdown.classList.contains("hidden")) return;
  
  const castCards = Array.from(castDropdown.querySelectorAll(".cast-dropdown-card"));
  if (castCards.length === 0) return;
  
  let focusedCard = castDropdown.querySelector(".cast-dropdown-card.focused");
  let currentIndex = focusedCard ? castCards.indexOf(focusedCard) : -1;
  
  // Helper to set focus on cast card
  function focusCastCard(index) {
    castCards.forEach(card => card.classList.remove("focused"));
    if (castCards[index]) {
      castCards[index].classList.add("focused");
      // Scroll to center the focused card
      castCards[index].scrollIntoView({ 
        behavior: "smooth", 
        block: "nearest", 
        inline: "center" 
      });
    }
  }
  
  // Initialize focus on first card when opening
  if (currentIndex === -1 && e.key === "ArrowDown") {
    e.preventDefault();
    e.stopPropagation();
    focusCastCard(0);
    return;
  }
  
  switch (e.key) {
    case "ArrowRight":
      e.preventDefault();
      e.stopPropagation();
      if (currentIndex === -1) {
        focusCastCard(0);
      } else if (currentIndex < castCards.length - 1) {
        focusCastCard(currentIndex + 1);
      }
      break;
      
    case "ArrowLeft":
      e.preventDefault();
      e.stopPropagation();
      if (currentIndex > 0) {
        focusCastCard(currentIndex - 1);
      }
      break;
      
    case "ArrowUp":
      e.preventDefault();
      e.stopPropagation();
      // Go back to cast button
      castCards.forEach(card => card.classList.remove("focused"));
      setFocusOnButton(2); // Focus cast button (index 2)
      break;
      
    case "ArrowDown":
      e.preventDefault();
      e.stopPropagation();
      // Focus first card if not already focused
      if (currentIndex === -1) {
        focusCastCard(0);
      }
      break;
  }
}, true);


function handleRemoteNavigation(e) {

  // ⭐ CRITICAL FIX: Only handle if we're actually on the detail page!
  if (localStorage.getItem("currentPage") !== "seriesDetailPage") return;

  // Check if cast dropdown is open - handle FIRST before other navigation
  const castDropdown = container.querySelector("#cast-dropdown");
  const backdrop = document.getElementById('cast-backdrop');
  const castWrapper = container.querySelector("#cast-wrapper");
  const isDropdownOpen = castDropdown && !castDropdown.classList.contains("hidden");

  if (isDropdownOpen) {
    if (
      e.keyCode === 27 ||  // ESC key code
      e.keyCode === 10009 ||
      e.key === "Escape" || 
      e.key === "Back" || 
      e.key === "BrowserBack" || 
      e.key === "XF86Back"
    ) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      // Close the cast dropdown
      castDropdown.classList.add("hidden");
      if (castBtn) castBtn.classList.remove("open");
      if (castWrapper) {
        castWrapper.classList.remove("active");
        castWrapper.style.removeProperty("--cast-dropdown-height");
      }
      
      // Remove backdrop
      if (backdrop) backdrop.classList.remove("active");
      
      // Remove dimmed class from play and trailer buttons
      if (playBtn) playBtn.classList.remove("dimmed");
      if (trailerBtn) trailerBtn.classList.remove("dimmed");
      
      // Return focus to cast button
      setFocusOnButton(2);
      return;
    }
  }

  const seasonWrapper = container.querySelector("#season-wrapper");
  if (seasonWrapper && seasonWrapper.classList.contains("active")) {
    return; // season menu has its own key handler
  }

  const castSection = container.querySelector(".cast-section");
  if (castSection && castSection.classList.contains("visible")) {
    return;
  }

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

        if (currentSection === "menuDots") {
    currentSection = "buttons";
    currentFocusIndex = 0;
    setFocusOnButton(0);
    return;
  }


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

        const castSection = container.querySelector(".cast-section");
        if (casts.length > 0 && castSection && castSection.classList.contains("visible")) {
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
    setFocusOnMenuDots();
    return;
  }
   if (currentSection === "menuDots") {
    // Stay at top
    return;
  }

      break;

    case "Enter":
      e.preventDefault();

       if (currentSection === "menuDots") {
    if (typeof openSidebar === "function") {
      openSidebar("seriesDetailPage");
    }
    return;
  }

      if (currentSection === "buttons") {
        buttons[currentFocusIndex].click();
      } else if (currentSection === "seasons") {
        const seasonDropdown = container.querySelector(".season-dropdown");
        seasonDropdown.click();
      } else if (currentSection === "episodes") {
        episodes[currentFocusIndex].click();
      } else if (currentSection === "cast") {
        casts[currentFocusIndex].click();
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

      // ---------- Season dropdown behavior (insert after renderEpisodes call) ----------
(function setupSeasonDropdown() {
  const wrapper = container.querySelector("#season-wrapper");
  const btn = container.querySelector("#season-dropdown");
  const menu = container.querySelector("#season-dropdown-menu");
  const seasonText = container.querySelector(".season-text");

  if (!wrapper || !btn || !menu) return;

  // Populate menu from seriesData.seasons (safe fallback)
  const seasons = Array.isArray(seriesData.seasons) && seriesData.seasons.length
    ? seriesData.seasons
    : [{ season_number: 1, name: "Season 1", episode_count: (seriesData.episodes && seriesData.episodes[1] ? seriesData.episodes[1].length : 0) }];

  let focusedIndex = 0;
  let selectedSeasonNumber = currentSeasonNumber || (seasons[0] && seasons[0].season_number);

  function buildMenuItems() {
    menu.innerHTML = seasons.map((s, idx) => {
      const label = s.name || `Season ${String(s.season_number).padStart(2, "0")}`;
      const count = s.episode_count != null ? `(${String(s.episode_count).padStart(2,"0")})` : "";
      return `<div class="season-dropdown-item ${s.season_number === selectedSeasonNumber ? "selected" : ""}" role="option" data-index="${idx}" data-season="${s.season_number}" tabindex="-1">
                <span class="season-label">${label}</span>
                <span class="episode-count">${count}</span>
              </div>`;
    }).join("");
  }

  buildMenuItems();

  // helper to open/close
  function openMenu() {
    wrapper.classList.add("active");
    btn.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
    menu.classList.remove("hidden");

     const h = menu.offsetHeight;
  wrapper.style.setProperty("--dropdown-height", `${h + 15}px`);
    // focus first selected item
    const items = menu.querySelectorAll(".season-dropdown-item");
    focusedIndex = Array.from(items).findIndex(it => it.classList.contains("selected"));
    if (focusedIndex < 0) focusedIndex = 0;
    updateItemFocus();
    // ensure the focused item is visible
    items[focusedIndex].scrollIntoView({ block: "nearest" });
  }

  function closeMenu() {


    wrapper.classList.remove("active");
    btn.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
    menu.classList.add("hidden");
      wrapper.style.removeProperty("--dropdown-height");



       document.querySelectorAll(".play-button, .trailer-button")
    .forEach(btn => btn.classList.remove("dimmed"));

    // return focus to the button
    btn.focus();
  }

  // toggle on button click
  btn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    if (menu.classList.contains("hidden")) openMenu();
    else closeMenu();
  });

  // click on menu items
  menu.addEventListener("click", (ev) => {
    const item = ev.target.closest(".season-dropdown-item");
    if (!item) return;
    const seasonNum = parseInt(item.dataset.season, 10);
    // update selected season
    selectedSeasonNumber = seasonNum;
    // update button text
    seasonText.textContent = `Season ${String(seasonNum).padStart(2, "0")}`;
    // mark selected UI
    menu.querySelectorAll(".season-dropdown-item").forEach(it => it.classList.remove("selected"));
    item.classList.add("selected");
    // render episodes for selected season
    currentSeasonNumber = seasonNum;
    renderEpisodes(currentSeasonNumber);
    // close menu
    closeMenu();
  });

  // keyboard nav inside menu & for button
  function updateItemFocus() {
    const items = Array.from(menu.querySelectorAll(".season-dropdown-item"));
    items.forEach((it, i) => it.classList.toggle("focused", i === focusedIndex));
    // focus is visual only — do not call .focus() because we want remote/keyboard behavior consistent
    // ensure visible
    items[focusedIndex].scrollIntoView({ block: "nearest" });
  }

  document.addEventListener("keydown", function seasonMenuKeyHandler(e) {
    // if menu closed, allow Enter on button to open
    if (!menu || !btn) return;
    const isOpen = !menu.classList.contains("hidden");

    if (isOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const items = menu.querySelectorAll(".season-dropdown-item");
        if (focusedIndex < items.length - 1) focusedIndex++;
        updateItemFocus();
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (focusedIndex > 0) focusedIndex--;
        updateItemFocus();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const items = menu.querySelectorAll(".season-dropdown-item");
        const item = items[focusedIndex];
        if (item) item.click();
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
        return;
      }
    } else {
      // menu closed: open with Enter / ArrowDown when season button focused
      const activeEl = document.activeElement;
      if (activeEl === btn && (e.key === "Enter" || e.key === "ArrowDown")) {
        e.preventDefault();
        openMenu();
      }
    }
  });

  // close when clicking outside
  document.addEventListener("click", function onDocClick(ev) {
    if (!wrapper.contains(ev.target)) {
      if (!menu.classList.contains("hidden")) closeMenu();
    }
  });

  // initialize button text according to currentSeasonNumber
  if (selectedSeasonNumber) {
    seasonText.textContent = `Season ${String(selectedSeasonNumber).padStart(2, "0")}`;
  }
})();

  document.addEventListener("keydown", handleRemoteNavigation);

  // cleanup function
SeriesDetailPage.cleanup = function () {
  // remove listeners
  document.removeEventListener("keydown", handleRemoteNavigation);
  document.removeEventListener("keydown", handleBackNavigationDuringLoading);
    document.removeEventListener("keydown", handleMenuKey);


   const backdrop = document.getElementById('cast-backdrop');
  if (backdrop) backdrop.remove();

   const sortingDialog = document.querySelector('.sorting-dialog-container');
  if (sortingDialog) {
    sortingDialog.remove();
  }


  SeriesDetailPage.initialized = false;  // ← CRUCIAL
};


}

window.SeriesDetailPage = SeriesDetailPage;