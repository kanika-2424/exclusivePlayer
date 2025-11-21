

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


  // -----------------------------
  // Show Splash Screen
  // -----------------------------
  showSplashScreen();


  // -----------------------------
  // START FLOW AFTER SPLASH
  // -----------------------------
  setTimeout(() => {
    const isLogin = localStorage.getItem("isLogin") === "true";
    const selectedPlaylistRaw = localStorage.getItem("selectedPlaylist");

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

    if (isLogin) {
      // User already logged in
      localStorage.setItem("currentPage", "preLoginPage");
      Router.showPage("preLoginPage");
      return;
    }

    if (!isLogin && selectedPlaylist) {
      // Playlist exists → go to playlist page
      localStorage.setItem("currentPage", "playlistPage");
      Router.showPage("playlistPage");
      return;
    }

    // Show login screen
    Router.showPage("login");

  }, 0);


  // Utility: Fetch TMDB ID only if function exists
  if (typeof getTmbdId === "function") {
    getTmbdId();
  }
};


// ===================================
// SPLASH PAGE FUNCTION
// ===================================
function showSplashScreen() {
  const splashPage = document.getElementById("splash-page");
  if (!splashPage) return;

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
