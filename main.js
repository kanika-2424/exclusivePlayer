
window.onload = function () {

  // -----------------------------
  // GLOBAL VARIABLES (Movies / Series / Live)
  // -----------------------------
  window.moviesCategories = [];
  window.allMoviesStreams = [];

  window.allSeriesStreams = [];
  window.allSeriesCategories = [];

  window.allLiveStreams = [];
  window.liveCategories = [];

  // TMDB
  window.TMBD_API_KEY = localStorage.getItem("tmbdId") || "";
  window.castImageUrl = "https://image.tmdb.org/t/p/w500";

  // For animation
  window.currentAnimationId = null;


  // -----------------------------
  // REGISTER REMOTE KEYS (Tizen)
  // -----------------------------
  if (typeof tizen !== "undefined" && tizen.tvinputdevice) {
    try {
      const keys = tizen.tvinputdevice.getSupportedKeys();
      keys.forEach((key) => {
        tizen.tvinputdevice.registerKey(key.name);
      });
    } catch (err) {
      console.log("Tizen key error:", err);
    }
  }

  // Global Back / Exit handling
  document.addEventListener("keydown", (e) => {
    const currentPage = localStorage.getItem("currentPage");

    // Don't allow exit on dashboard (your previous logic)
    if (currentPage !== "dashboard") {
      if (e.key === "XF86Exit" && typeof tizen !== "undefined") {
        const app = tizen.application.getCurrentApplication();
        if (app) app.exit();
      }
    }
  });

Toaster(); // Initialize Toaster
  // -----------------------------
  // Show Splash Screen (only if it exists)
  // -----------------------------
  const splashExists = document.getElementById("splash-page");
  if (splashExists) {
    showSplashScreen();
  }


  // -----------------------------
  // START FLOW AFTER SPLASH
  // -----------------------------
  setTimeout(async () => {
    // Hide splash if it was shown
    const splash = document.getElementById("splash-page");
    if (splash) {
      splash.style.display = "none";
    }
    const isLogin = localStorage.getItem("isLogin") === "true";
    const selectedPlaylistRaw = localStorage.getItem("selectedPlaylist");
    const currentPlaylistDataRaw = localStorage.getItem("currentPlaylistData");

    let selectedPlaylist = null;
    if (selectedPlaylistRaw) {
      try {
        selectedPlaylist = JSON.parse(selectedPlaylistRaw);
      } catch (e) {
        selectedPlaylist = null;
      }
    }



    
    // -------------------------
    // LOGIN FLOW DECISION TREE
    // -------------------------

    if (isLogin && selectedPlaylist) {
      // User already logged in with playlist
      console.log("✅ User is logged in, loading dashboard...");


        const allPlaylists = JSON.parse(localStorage.getItem('playlistsData')) || [];
  const fullPlaylistData = allPlaylists.find(p => p.playlistName === selectedPlaylist.playlistName);
  
  if (fullPlaylistData) {
    // ✅ Merge the full data back into selectedPlaylist to restore parentalPassword, etc.
    const restoredPlaylist = {
      ...fullPlaylistData,
      playlistUrl: selectedPlaylist.playlistUrl || fullPlaylistData.playlistUrl,
      playlistUsername: selectedPlaylist.playlistUsername || fullPlaylistData.playlistUsername
    };
    localStorage.setItem('selectedPlaylist', JSON.stringify(restoredPlaylist));
    selectedPlaylist = restoredPlaylist; // Update the variable too
  }
      
      // Check if we already have data in localStorage
      if (currentPlaylistDataRaw) {
        try {
          const playlistData = JSON.parse(currentPlaylistDataRaw);
          
          // Load data from localStorage or re-fetch
          const loadingOverlay = document.getElementById("loading-overlay");
          if (loadingOverlay) {
            loadingOverlay.classList.remove("hidden");
          }
          
          resetLoadingPercentage();
          updateLoadingPercentage(20, "Loading saved data...");

          // Try to load cached data first
          try {
            updateLoadingPercentage(30, "Loading movies...");
            const vodMovies = await getAllVodMovies();
            
            updateLoadingPercentage(45, "Loading movie categories...");
            const moviesCategories = await getMoviesCategories();
            
            updateLoadingPercentage(60, "Loading series...");
            const vodSeries = await getAllVodSeries();
            
            updateLoadingPercentage(70, "Loading series categories...");
            const seriesCategories = await getSeriesCategories();
            
            updateLoadingPercentage(80, "Loading live streams...");
            const vodAllLiveStreams = await getAllLiveStreams();
            
            updateLoadingPercentage(90, "Loading live categories...");
            const liveCategories = await getLiveCategories();

            // Set global variables
            window.allMoviesStreams = vodMovies || [];
            window.moviesCategories = moviesCategories || [];
            window.allSeriesStreams = vodSeries || [];
            window.allseriesCategories = seriesCategories || [];
            window.allLiveStreams = vodAllLiveStreams || [];
            window.liveCategories = liveCategories || [];

            updateLoadingPercentage(100, "Ready!");
            
        setTimeout(() => {
  if (loadingOverlay) {
    loadingOverlay.classList.add("hidden");
  }
  resetLoadingPercentage();
  
  const currentPage = localStorage.getItem("currentPage");
  
  // ✅ ONLY navigate if no page is set OR still on splash/loading
  // ✅ DO NOT navigate if already on dashboard (from login)
  if ((!currentPage || currentPage === "splash" || currentPage === "loading") 
      && currentPage !== "dashboard") {
    localStorage.setItem("currentPage", "dashboard");
    Router.showPage('dashboard');
  } else {
    console.log("✅ Page already set to:", currentPage, "- skipping navigation");
  }

}, 500);
            
          } catch (error) {
            console.error("❌ Failed to load data on refresh:", error);
            // If loading fails, log them out
            localStorage.removeItem("isLogin");
            localStorage.removeItem("currentPlaylistData");
            if (loadingOverlay) {
              loadingOverlay.classList.add("hidden");
            }
            Router.showPage("login");
          }
          
        } catch (e) {
          console.error("❌ Failed to parse playlist data:", e);
          Router.showPage("login");
        }
      } else {
        // No cached data, go to login
        console.log("⚠️ No cached data found, redirecting to login");
        localStorage.removeItem("isLogin");
        Router.showPage("login");
      }
      return;
    }

    if (!isLogin && selectedPlaylist) {
      // Playlist exists but not logged in → go to playlist page
      console.log("📋 Playlist exists, showing playlist page");
      localStorage.setItem("currentPage", "playlist");
      Router.showPage("playlist");
      return;
    }

    // Show login screen (default)
    console.log("🔑 No login state, showing login page");
    localStorage.setItem("currentPage", "login");
    Router.showPage("login");

  }, 100); // Small delay to ensure splash shows


  // Utility: Fetch TMDB ID only if function exists
  if (typeof getTmbdId === "function") {
    getTmbdId();
  }
};


function formatTime(date, format = null) {
  // Get format from parameter, or from selectedPlaylist, or from localStorage, or default to 12hrs
  const timeFormat = format || 
                     JSON.parse(localStorage.getItem("selectedPlaylist")).timeFormat || 
                     localStorage.getItem("selectedTimeFormat") || 
                     "12hrs";
  
  if (timeFormat === "24hrs") {
    // 24-hour format: HH:mm
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  } else {
    // 12-hour format: hh:mm AM/PM
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  }
}


// ===================================
// SPLASH PAGE FUNCTION (optional)
// ===================================
function showSplashScreen() {
  const splashPage = document.getElementById("splash-page");
  if (!splashPage) {
    console.log("⚠️ Splash page element not found");
    return;
  }

  splashPage.innerHTML = `
    <div class="splash-page-container">
      <img src="/assets/splashLogo.png" alt="Logo" class="logo" />
    </div>
  `;
  splashPage.style.display = "block";

  const allPages = document.querySelectorAll(".page");
  allPages.forEach((page) => {
    if (page.id !== "splash-page") page.style.display = "none";
  });
}