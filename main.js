

// ========================================
// ////SOLUTION 1: On-Screen Console (RECOMMENDED for Tizen)
// /////Add this at the TOP of your main JavaScript file
// //// ========================================

// Create on-screen console for Tizen TV
// window.TizenConsole = {
//   logs: [],
//   maxLogs: 20,
//   overlay: null,
  
//   init() {
//     // Create overlay element
//     this.overlay = document.createElement('div');
//     this.overlay.id = 'tizen-console';
//     this.overlay.style.cssText = `
//       position: fixed;
//       bottom: 0;
//       left: 0;
//       right: 0;
//       background: rgba(0, 0, 0, 0.9);
//       color: #0f0;
//       font-family: monospace;
//       font-size: 16px;
//       padding: 10px;
//       z-index: 999999;
//       max-height: 300px;
//       overflow-y: auto;
//       border-top: 2px solid #0f0;
//       display: none;
//     `;
//     document.body.appendChild(this.overlay);
    
//     // Override console methods
//     const originalLog = console.log;
//     const originalError = console.error;
//     const originalWarn = console.warn;
    
//     console.log = (...args) => {
//       originalLog.apply(console, args);
//       this.add('LOG', args);
//     };
    
//     console.error = (...args) => {
//       originalError.apply(console, args);
//       this.add('ERROR', args);
//     };
    
//     console.warn = (...args) => {
//       originalWarn.apply(console, args);
//       this.add('WARN', args);
//     };
    
//     console.log('✅ Tizen Console initialized - Press INFO button to toggle');
//   },
  
//   add(type, args) {
//     const msg = args.map(arg => {
//       if (typeof arg === 'object') {
//         try {
//           return JSON.stringify(arg, null, 2);
//         } catch (e) {
//           return String(arg);
//         }
//       }
//       return String(arg);
//     }).join(' ');
    
//     const timestamp = new Date().toLocaleTimeString();
//     const color = type === 'ERROR' ? '#f00' : type === 'WARN' ? '#ff0' : '#0f0';
    
//     this.logs.push({
//       type,
//       msg,
//       timestamp,
//       color
//     });
    
//     if (this.logs.length > this.maxLogs) {
//       this.logs.shift();
//     }
    
//     this.render();
//   },
  
//   render() {
//     if (!this.overlay) return;
    
//     this.overlay.innerHTML = this.logs.map(log => 
//       `<div style="color: ${log.color}; margin-bottom: 5px;">
//         <span style="color: #888">[${log.timestamp}]</span> 
//         <strong>${log.type}:</strong> ${log.msg}
//       </div>`
//     ).join('');
    
//     // Auto-scroll to bottom
//     this.overlay.scrollTop = this.overlay.scrollHeight;
//   },
  
//   toggle() {
//     if (!this.overlay) return;
//     this.overlay.style.display = 
//       this.overlay.style.display === 'none' ? 'block' : 'none';
//   },
  
//   clear() {
//     this.logs = [];
//     this.render();
//   }
// };

// ///// Initialize on-screen console
// window.TizenConsole.init();

///////// Add keyboard shortcut to toggle console (INFO button = keyCode 457)


function restoreFromPersistentStorage() {
  return new Promise((resolve) => {
    if (typeof tizen === "undefined") {
      console.log("⚠️ Not Tizen, skipping restore");
      resolve(false);
      return;
    }

    try {
      tizen.filesystem.resolve(
        'wgt-private',
        function (dir) {
          try {
            const file = dir.resolve('appdata.json');

            file.openStream(
              'r',
              function (fs) {
                try {
                  const content = fs.read(file.fileSize);
                  fs.close();

                  const data = JSON.parse(content);

                  console.log("🔁 Restored persistent data:", data);

                  if (data.isLogin) {
                    localStorage.setItem("isLogin", data.isLogin);
                  }
                  if (data.selectedPlaylist) {
                    localStorage.setItem("selectedPlaylist", data.selectedPlaylist);
                  }
                  if (data.currentPlaylistData) {
                    localStorage.setItem("currentPlaylistData", data.currentPlaylistData);
                  }
                  if (data.playlistsData) {
                    localStorage.setItem("playlistsData", data.playlistsData);
                  }

                  resolve(true);
                } catch (e) {
                  console.error("❌ Failed parsing persistent data", e);
                  resolve(false);
                }
              },
              function (err) {
                console.log("ℹ️ No persistent stream yet");
                resolve(false);
              },
              'UTF-8'
            );
          } catch (e) {
            console.log("ℹ️ No persistent file found");
            resolve(false);
          }
        },
        function (err) {
          console.error("❌ wgt-private resolve failed", err);
          resolve(false);
        }
      );
    } catch (e) {
      console.error("❌ Persistent restore error", e);
      resolve(false);
    }
  });
}


window.onload = async function () {

  localStorage.setItem("isInitialLoad", "true");


    await restoreFromPersistentStorage();

  console.log("🔐 isLogin:--------------", localStorage.getItem("isLogin"));
  console.log("📦 selectedPlaylist:", localStorage.getItem("selectedPlaylist"));

    // window.TizenConsole.init();

  // // FORCE SHOW FOR FIRST TEST
  // window.TizenConsole.overlay.style.display = 'block';
  // console.log('🔥 Tizen Console attached to DOM');
  // //-----------------------------


  document.addEventListener('keydown', (e) => {
  console.log('KEY:', e.keyCode);

  // BLUE button → toggle console
  if (e.keyCode === 406) {
    window.TizenConsole.toggle();
  }

  // RED button → clear
  if (e.keyCode === 403) {
    window.TizenConsole.clear();
  }
});

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



      if (currentPage === "settingsPage") {
    console.log("Settings page active - main.js ignoring key");
    return; // Don't handle keys, let SettingsPage handle them
  }

    if (e.key === "XF86Exit" && typeof tizen !== "undefined") {
    const app = tizen.application.getCurrentApplication();
    if (app) app.exit();
  }


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

  // -------------------------
// LOGIN FLOW DECISION TREE
// -------------------------

if (isLogin && selectedPlaylist) {


      localStorage.removeItem("isInitialLoad");
  localStorage.setItem("isLoading", "true");


    const allPages = document.querySelectorAll('.page');
  allPages.forEach(page => {
    page.style.display = 'none';
    page.innerHTML = ''; // Clear any content
  });

  // User already logged in with playlist
  console.log("✅ User is logged in, loading dashboard...");
    showLoader();


   const loadingOverlay = document.getElementById("loading-overlay");
  if (loadingOverlay) {
    loadingOverlay.classList.remove("hidden");
  }
  

  // Restore full playlist data including parentalPassword
  const allPlaylists = JSON.parse(localStorage.getItem('playlistsData')) || [];
  const fullPlaylistData = allPlaylists.find(p => p.playlistName === selectedPlaylist.playlistName);
  
  if (fullPlaylistData) {
    const restoredPlaylist = {
      ...fullPlaylistData,
      playlistUrl: selectedPlaylist.playlistUrl || fullPlaylistData.playlistUrl,
      playlistUsername: selectedPlaylist.playlistUsername || fullPlaylistData.playlistUsername
    };
    localStorage.setItem('selectedPlaylist', JSON.stringify(restoredPlaylist));
    selectedPlaylist = restoredPlaylist;
  }
  

  
  resetLoadingPercentage();
  updateLoadingPercentage(10, "Restoring session...");

  // Check if we already have cached data
  if (currentPlaylistDataRaw) {
    try {
      const playlistData = JSON.parse(currentPlaylistDataRaw);
      
      updateLoadingPercentage(20, "Loading saved data...");

      // Load all cached data
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

          hideLoader(); 
          resetLoadingPercentage();
            localStorage.removeItem("isLoading");
localStorage.removeItem("isInitialLoad");
          
          // Set current page and navigate to dashboard
          localStorage.setItem("currentPage", "dashboard");
          Router.showPage('dashboard');
          
          console.log("✅ Auto-login successful - Dashboard loaded");
        }, 500);
        
      } catch (error) {
        console.error("❌ Failed to load cached data on refresh:", error);
        
        // Try to re-fetch data instead of logging out
        updateLoadingPercentage(50, "Refreshing data...");
        
        try {
          // Re-fetch all data from API
          const fetchedData = await fetchPlaylistData(selectedPlaylist);
          
          if (fetchedData) {
            localStorage.setItem("currentPlaylistData", JSON.stringify(fetchedData));
            
            // Reload the page to start fresh with new data
            window.location.reload();
          } else {
            throw new Error("Failed to fetch playlist data");
          }
        } catch (refetchError) {
          console.error("❌ Failed to re-fetch data:", refetchError);
          
          // Only log out as last resort
          localStorage.removeItem("isLogin");
          localStorage.removeItem("currentPlaylistData");
            localStorage.removeItem("isLoading");
            localStorage.removeItem("isInitialLoad"); // ✅ ADD THIS


          if (loadingOverlay) {
            loadingOverlay.classList.add("hidden");
          }
          resetLoadingPercentage();
          localStorage.removeItem("isInitialLoad"); // ✅ ADD THIS

          Router.showPage("login");
        }
      }
      
    } catch (e) {
      console.error("❌ Failed to parse playlist data:", e);
      localStorage.removeItem("isLogin");
      localStorage.removeItem("currentPlaylistData");
      if (loadingOverlay) {
        loadingOverlay.classList.add("hidden");
      }
      Router.showPage("login");
    }
  } else {
    // No cached data, try to fetch it
    console.log("⚠️ No cached data found, fetching fresh data...");
    
    try {
      updateLoadingPercentage(30, "Fetching playlist data...");
      const fetchedData = await fetchPlaylistData(selectedPlaylist);
      
      if (fetchedData) {
        localStorage.setItem("currentPlaylistData", JSON.stringify(fetchedData));
        
        // Reload to process the newly fetched data
        window.location.reload();
      } else {
        throw new Error("No data returned from API");
      }
    } catch (fetchError) {
      console.error("❌ Failed to fetch data:", fetchError);
      localStorage.removeItem("isLogin");
      if (loadingOverlay) {
        loadingOverlay.classList.add("hidden");
      }
      resetLoadingPercentage();
      Router.showPage("login");
    }
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




    if (typeof logAllDnsEntries === "function") {
    logAllDnsEntries();
  }
 

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

function showGlobalLoader(text = "Loading, please wait…") {
  const loader = document.getElementById("global-loader");
  if (!loader) return;
  loader.querySelector(".loader-text").innerText = text;
  loader.classList.remove("hidden");
}

function hideGlobalLoader() {
  const loader = document.getElementById("global-loader");
  if (!loader) return;
  loader.classList.add("hidden");
}


const LoadingScreen = () => {
  return `
    <div class="livetv-loading-overlay" id="LoadingOverlay">
      <div class="loading-content">
      <img src="/assets/logo.png" alt="Logo" class="loading-logo" />
        <div class="spinner"></div>
        <div class="loading-text">Loading</div>
           <div id="loading-progress" style="font-size: 32px; font-weight: bold;">0%</div>

      </div>
    </div>
  `;
};

function showLoader() {
  if (document.getElementById("LoadingOverlay")) return;

  // ✅ Add loading class to body
  document.body.classList.add('loading');
  
  document.body.insertAdjacentHTML(
    "beforeend",
    LoadingScreen()
  );
}

function hideLoader() {
  const loader = document.getElementById("LoadingOverlay");
  if (loader) loader.remove();
  
  // ✅ Remove loading class from body
  document.body.classList.remove('loading');
}

function hideLoader() {
  const loader = document.getElementById("LoadingOverlay");
  if (loader) loader.remove();
}
