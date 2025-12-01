

async function MovieDetailPage() {
  // cleanup previous handlers if any
  if (MovieDetailPage.cleanup) MovieDetailPage.cleanup();

  const castImageUrl = "https://image.tmdb.org/t/p/w500";
  const loadingOverlay = document.getElementById("loading-overlay");

  // --- Back navigation/interruption guard during loading ---
  let navigationInterrupted = false;
  function handleBackNavigationDuringLoading(e) {
    if (
      (e.keyCode === 10009 ||
        e.key === "Escape" ||
        e.key === "Back" ||
        e.key === "BrowserBack" ||
        e.key === "XF86Back") &&
      localStorage.getItem("currentPage") === "moviesDetailPage"
    ) {
      e.preventDefault();
      e.stopPropagation();
      navigationInterrupted = true;

      if (loadingOverlay) loadingOverlay.classList.add("hidden");
      document.removeEventListener("keydown", handleBackNavigationDuringLoading);

      localStorage.removeItem("selectedMovieId");
      localStorage.setItem("currentPage", "moviesPage");
      if (typeof Router !== "undefined" && Router.showPage) Router.showPage("movies");
      document.body.style.backgroundImage = "none";
      document.body.style.backgroundColor = "black";
      return true;
    }
  }
  document.addEventListener("keydown", handleBackNavigationDuringLoading);

  // --- Load movie detail id/data from localStorage ---
  var movieDetailId = localStorage.getItem("selectedMovieId");
  var selectedMovieItem = localStorage.getItem("selectedMovieData");
  if (!selectedMovieItem && !movieDetailId) {
    console.error("No selectedMovieData or selectedMovieId in localStorage");
    document.removeEventListener("keydown", handleBackNavigationDuringLoading);
    return;
  }
  if (selectedMovieItem) selectedMovieItem = JSON.parse(selectedMovieItem);

  if (loadingOverlay) loadingOverlay.classList.remove("hidden");

  // --- Fetch movie details from API ---
  var movieDetailData = null;
  try {
    movieDetailData = await getMovieDetail(movieDetailId);
  } catch (err) {
    console.error("getMovieDetail error", err);
    movieDetailData = null;
  }

  // abort if back/navigation happened while awaiting
  if (navigationInterrupted) {
    document.removeEventListener("keydown", handleBackNavigationDuringLoading);
    return;
  }

  if (!movieDetailData) {
    if (loadingOverlay) loadingOverlay.classList.add("hidden");
    localStorage.setItem("currentPage", "moviesPage");
    if (typeof Router !== "undefined" && Router.showPage) Router.showPage("movies");
    document.body.style.backgroundImage = "none";
    document.body.style.backgroundColor = "black";
    document.removeEventListener("keydown", handleBackNavigationDuringLoading);
    return;
  }

  // --- Fetch cast from TMDB (if available) ---
// --- Fetch cast from TMDB (if available) ---
var tmdbId =
  movieDetailData.info && movieDetailData.info.tmdb_id
    ? movieDetailData.info.tmdb_id
    : null;

var getMovieCastData = null;

try {
  if (tmdbId) {
    // Correct TMDB call with your API key
    const url = `https://api.themoviedb.org/3/movie/${tmdbId}/credits?api_key=${localStorage.getItem("tmbdId")}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("TMDB Cast API failed");
    getMovieCastData = await res.json();
  } else {
    console.warn("No tmdb_id available in Xtream API");
  }
} catch (err) {
  console.warn("getMovieCast error", err);
  getMovieCastData = null;
}


  if (navigationInterrupted) {
    document.removeEventListener("keydown", handleBackNavigationDuringLoading);
    return;
  }

  // done loading
  if (loadingOverlay) loadingOverlay.classList.add("hidden");
  document.removeEventListener("keydown", handleBackNavigationDuringLoading);

  // --- Map API data to the UI-friendly movieData used in your original template ---
  const movieData = {
    id:
      movieDetailData.movie_data && movieDetailData.movie_data.stream_id
        ? movieDetailData.movie_data.stream_id
        : movieDetailId,
    title:
      movieDetailData.movie_data && movieDetailData.movie_data.name
        ? movieDetailData.movie_data.name
        : (movieDetailData.info && movieDetailData.info.title) || "No title",
    rating: movieDetailData.info && movieDetailData.info.rating ? movieDetailData.info.rating : "",
    duration: movieDetailData.info && movieDetailData.info.duration ? movieDetailData.info.duration : "",
    releaseDate: movieDetailData.info && movieDetailData.info.releasedate ? movieDetailData.info.releasedate : "",
    director: movieDetailData.info && movieDetailData.info.director ? movieDetailData.info.director : "N/A",
    genres:
      movieDetailData.info && movieDetailData.info.genre
        ? // genre sometimes a comma string, normalize to array
          (Array.isArray(movieDetailData.info.genre) ? movieDetailData.info.genre : String(movieDetailData.info.genre).split(",").map(s => s.trim()))
        : [],
    description:
      movieDetailData.info && movieDetailData.info.description
        ? movieDetailData.info.description
        : "No description available",
    posterImage:
      movieDetailData.info && movieDetailData.info.movie_image
        ? movieDetailData.info.movie_image
        : (movieDetailData.info && movieDetailData.info.backdrop_path && movieDetailData.info.backdrop_path[0]) ? castImageUrl + movieDetailData.info.backdrop_path[0] : "/assets/profile.png",
    isFavorite: false, // will set below if helper exists
    cast: []
  };

  // try detect favorite state if helper exists
  try {
    if (movieData.id && typeof isItemFavoriteForPlaylist === "function") {
      movieData.isFavorite = isItemFavoriteForPlaylist(movieData.id, "favouriteMovies");
    }
  } catch (err) {
    movieData.isFavorite = false;
  }

  // build cast list (from TMDB fetch if available)
  if (getMovieCastData && Array.isArray(getMovieCastData.cast)) {
    movieData.cast = getMovieCastData.cast.map((c) => ({
      id: c.id || c.cast_id || Math.random(),
      name: c.name || c.original_name || "",
      image: c.profile_path ? castImageUrl + c.profile_path : "/assets/placeholder-img.png",
    }));
  } else if (movieDetailData.info && movieDetailData.info.cast && Array.isArray(movieDetailData.info.cast)) {
    // fallback if API stores cast in info
    movieData.cast = movieDetailData.info.cast.map((c, i) => ({
      id: i,
      name: c.name || c,
      image: c.image || "/assets/placeholder-img.png",
    }));
  }

  // --- Render the UI using your original layout and classes (keeps your UI) ---
  const genresText = movieData.genres.join(" / ");
  const castHtml = movieData.cast
    .map((member, index) => `
      <div class="cast-card" data-index="${index}" tabindex="0">
        <img src="${member.image}" alt="${member.name}" class="cast-image" "/>
        <p class="cast-name">${member.name}</p>
      </div>
    `)
    .join("");

  const heartIconHtml = movieData.isFavorite
    ? '<img src="/assets/heart-filled.svg" alt="fav" />'
    : '<img src="/assets/heart.png" alt="fav" />';

  // inject into DOM (target same container you used originally)
  const container = document.querySelector("#movie-detail-page");
  if (!container) {
    console.error("No #movies-detail-page container found to render details.");
    return;
  }

  function formatDuration(raw) {
  if (!raw) return "";
  const parts = raw.split(":"); // "01:49:00"
  let h = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10);

  return `${h}h ${m}min`;
}

function formatReleaseDate(raw) {
  if (!raw) return "";

  const date = new Date(raw);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
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
        <span class="current-time">${movieData.title}</span>
      </div>

      <div class="header-right">
     
        <div class="menu-dots">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        </div>
      </div>
    </header>

    <div class="movie-detail-content">
      <!-- Left: Poster -->
      <div class="poster-section">
        <div class="poster-container">
          <img src="${movieData.posterImage}" alt="${movieData.title}" class="poster-image" />
          <div class="rating-badge">
            <span class="star-icon"><img src="/assets/star.png" class="star-icon" /></span>
            ${movieData.rating || ""}
          </div>
        </div>
      </div>

      <!-- Right: Details -->
      <div class="details-section">
        <div class="movie-header">
          <h1 class="movie-title">${movieData.title}</h1>
        </div>

      <div class="movie-meta">
  <span class="duration">${formatDuration(movieData.duration)}</span>
  <span class="release-date">${formatReleaseDate(movieData.releaseDate)}</span>
</div>


        <div class="movie-info">
          <p class="info-row">
            <span class="label">Directed By :</span>
            <span class="value">${movieData.director}</span>
          </p>
          <p class="info-row">
            <span class="label">Genre :</span>
            <span class="value">${genresText}</span>
          </p>
        </div>

        <p class="movie-description">${movieData.description}</p>

        <div class="action-buttons">
          <button class="action-button play-button" tabindex="0">
            <span class="play-icon">▶</span>
            <span>Play Now</span>
          </button>
          <button class="action-button trailer-button" ${movieDetailData.info && movieDetailData.info.youtube_trailer ? "" : 'style="display:none;"'} tabindex="0">Watch Trailer</button>
        </div>
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

  // --- Remote navigation & interactions (keeps your simplified remote logic) ---
  let currentSection = "buttons"; // header, buttons, cast
  let currentFocusIndex = 0;

  // Prepare focusable elements arrays
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


function setFocusOnHeaderMenu() {
  removeAllFocus();
  currentSection = "header";
  const menuDots = container.querySelector(".menu-dots");
  if (menuDots) {
    menuDots.classList.add("menu-focused");
    try { menuDots.scrollIntoView({ behavior: "smooth", block: "center" }); } catch(e){}
  }
}
function removeAllFocus() {
  const focusedBtns = container.querySelectorAll(".action-button.focused");
  focusedBtns.forEach(b => b.classList.remove("focused"));
  const focusedCast = container.querySelectorAll(".cast-card.focused");
  focusedCast.forEach(c => c.classList.remove("focused"));
  const menuDots = container.querySelector(".menu-dots");
  if (menuDots) menuDots.classList.remove("menu-focused");
}


  
  // initial focus: play button
  setTimeout(() => setFocusOnButton(0), 0);

  // initial focus: play button
setTimeout(() => {
  setFocusOnButton(0);
  // Scroll to top of the page
  window.scrollTo(0, 0);
  // Or scroll the container to top
  if (container) {
    container.scrollTop = 0;
  }
}, 0);

  // click handlers for buttons
  const playBtn = container.querySelector(".play-button");
  const trailerBtn = container.querySelector(".trailer-button");
  const favHeartContainer = container.querySelector(".favorite-heart");

  function buildMovieUrl() {
    var currentPlaylistData = localStorage.getItem("currentPlaylistData");
    if (!currentPlaylistData) return "";
    currentPlaylistData = JSON.parse(currentPlaylistData);
    if (
      currentPlaylistData.server_info &&
      currentPlaylistData.user_info &&
      movieDetailData.movie_data &&
      movieDetailData.movie_data.stream_id &&
      movieDetailData.movie_data.container_extension
    ) {
      return (
        currentPlaylistData.server_info.server_protocol +
        "://" +
        currentPlaylistData.server_info.url +
        ":" +
        currentPlaylistData.server_info.port +
        "/movie/" +
        currentPlaylistData.user_info.username +
        "/" +
        currentPlaylistData.user_info.password +
        "/" +
        movieDetailData.movie_data.stream_id +
        "." +
        movieDetailData.movie_data.container_extension
      );
    }
    return "";
  }

  if (playBtn) {
    playBtn.addEventListener("click", () => {
      // set playing item and navigate to player (same as your reference logic)
      const movieVideoUrl = buildMovieUrl();
      localStorage.setItem("playingItemData", JSON.stringify(movieDetailData.movie_data || {}));
      if (movieVideoUrl) localStorage.setItem("selectedVideoItemUrl", movieVideoUrl);
      localStorage.setItem("from", "movie");
      localStorage.setItem("currentPage", "videojsPlayer");
      if (typeof Router !== "undefined" && Router.showPage) Router.showPage("videoJsPlayer");
      document.body.style.backgroundImage = "none";
      document.body.style.backgroundColor = "black";
    });
  }

  if (trailerBtn) {
    trailerBtn.addEventListener("click", () => {
      if (movieDetailData.info && movieDetailData.info.youtube_trailer) {
        const trailerUrl = "https://www.youtube.com/watch?v=" + movieDetailData.info.youtube_trailer;
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

  if (favHeartContainer) {
    favHeartContainer.addEventListener("click", () => {
      // toggle UI heart quickly (actual favorite state handled via toggleFavoriteItem if available)
      favHeartContainer.classList.toggle("active");
      if (typeof toggleFavoriteItem === "function") {
        const res = toggleFavoriteItem(movieData.id || 0, "favouriteMovies");
        if (res && res.success) {
          // update heart icon and text if your toggle returns isFav
          const html = res.isFav ? '<img src="/assets/heart-filled.svg" />' : '<img src="/assets/heart.png" />';
          favHeartContainer.innerHTML = html;
        }
      } else {
        // fallback: swap image
        const img = favHeartContainer.querySelector("img");
        if (img) {
          img.src = img.src.includes("heart-filled") ? "/assets/heart.png" : "/assets/heart-filled.svg";
        }
      }
    });
  }

  // cast card click -> you can wire to show actor detail or navigate; default: console log
  const castCardsEls = container.querySelectorAll(".cast-card");
  castCardsEls.forEach((card, idx) => {
    card.addEventListener("click", () => {
      console.log("Cast clicked:", movieData.cast[idx]);
      // you can implement cast detail navigation here
    });
  });

function handleRemoteNavigation(e) {
  if (localStorage.getItem("currentPage") !== "moviesDetailPage") return;

  const buttons = Array.from(container.querySelectorAll(".action-button"));
  const casts = Array.from(container.querySelectorAll(".cast-card"));

  switch (e.key) {
    // -------------------------------------------------
    // → RIGHT
    // -------------------------------------------------
    case "ArrowRight":
      e.preventDefault();

      if (currentSection === "buttons") {
        if (currentFocusIndex < buttons.length - 1) {
          currentFocusIndex++;
          setFocusOnButton(currentFocusIndex);
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

    // -------------------------------------------------
    // ← LEFT
    // -------------------------------------------------
    case "ArrowLeft":
      e.preventDefault();

      if (currentSection === "buttons") {
        if (currentFocusIndex > 0) {
          currentFocusIndex--;
          setFocusOnButton(currentFocusIndex);
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

    // -------------------------------------------------
    // ↓ DOWN
    // -------------------------------------------------
    case "ArrowDown":
      e.preventDefault();


        if (currentSection === "header") {
    currentSection = "buttons";
    currentFocusIndex = 0;
    setFocusOnButton(0);
    return;
  }


      // BUTTONS → CAST (always go to first cast card)
      if (currentSection === "buttons") {
        if (casts.length > 0) {
          currentSection = "cast";
          currentFocusIndex = 0;
          setFocusOnCast(0);
        }
        return;
      }

      // CAST → Stay in cast (no downward movement in horizontal list)
      if (currentSection === "cast") {
        // Do nothing, already at bottom section
        return;
      }
      break;

    // -------------------------------------------------
    // ↑ UP
    // -------------------------------------------------
    case "ArrowUp":
      e.preventDefault();

      // CAST → BUTTONS (go back to play button)
      if (currentSection === "cast") {
        currentSection = "buttons";
        currentFocusIndex = 0;
        setFocusOnButton(0);
        return;
      }

        // BUTTONS → HEADER MENU (three dots)
  if (currentSection === "buttons") {
    currentSection = "header";
    setFocusOnHeaderMenu();
    return;
  }


      // BUTTONS → Stay in buttons (no upward movement from buttons)
      if (currentSection === "buttons") {
        // Do nothing, already at top section
        return;
      }
      break;

    // -------------------------------------------------
    // ENTER
    // -------------------------------------------------
    case "Enter":
      e.preventDefault();
      if (currentSection === "buttons") {
        buttons[currentFocusIndex].click();
      } else if (currentSection === "cast") {
        casts[currentFocusIndex].click();
      }
      return;

    // -------------------------------------------------
    // BACK HANDLER
    // -------------------------------------------------
    default:
      if (
        e.keyCode === 10009 ||
        e.key === "Escape" ||
        e.key === "Back" ||
        e.key === "BrowserBack" ||
        e.key === "XF86Back"
      ) {
        localStorage.removeItem("selectedMovieId");
        localStorage.setItem("currentPage", "moviesPage");
        if (typeof Router !== "undefined" && Router.showPage) {
          Router.showPage("movies");
        } else if (typeof navigateTo === "function") {
          navigateTo("movies-page");
        }
        document.body.style.backgroundImage = "none";
        document.body.style.backgroundColor = "black";
        return;
      }
  }
}



  document.addEventListener("keydown", handleRemoteNavigation);

  // cleanup function to remove listeners when leaving page
  MovieDetailPage.cleanup = function () {
    document.removeEventListener("keydown", handleRemoteNavigation);
    document.removeEventListener("keydown", handleBackNavigationDuringLoading);
    // remove other listeners if necessary
  };
}

