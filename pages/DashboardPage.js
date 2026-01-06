

function DashboardPage() {
  setTimeout(() => {

    // Collect all focusable elements in navigation order
    const focusableItems = [
      document.querySelector(".livetv-box"),      // 0
      document.querySelector(".movies-box"),      // 1
      document.querySelector(".series-box"),      // 2
      document.querySelector(".account-box"),     // 3
      document.querySelector(".settings-box"),    // 4
      document.querySelector(".list-users-box"),  // 5
      document.querySelector(".logout-icon")      // 6
    ].filter(el => el);

    let modalFocusableItems = [];
let isModalOpen = false;
let modalFocusIndex = 0;
    let focusIndex = 0;

    // --- FOCUS HELPERS -------------------------------------------------------
    function removeFocus(el) {
      if (!el) return;
      el.classList.remove("dashboard-focused");
    }

    function addFocus(el) {
      if (!el) return;
      el.classList.add("dashboard-focused");
    }

    // Set initial focus
    addFocus(focusableItems[0]);


    // --- MODAL HELPERS -------------------------------------------------------
function showExitModal() {
  const modal = document.getElementById("exit-modal");
  if (!modal) return;
  
  modal.classList.remove("hidden");
  isModalOpen = true;
  
  // Get modal buttons
  modalFocusableItems = [
    document.querySelector(".exit-yes-btn"),
    document.querySelector(".exit-no-btn")
  ].filter(el => el);
  
  modalFocusIndex = 0;
  
  // Remove focus from dashboard items
  removeFocus(focusableItems[focusIndex]);
  
  // Focus on Yes button
  addFocus(modalFocusableItems[0]);
}

function hideExitModal() {
  const modal = document.getElementById("exit-modal");
  if (!modal) return;
  
  modal.classList.add("hidden");
  isModalOpen = false;
  
  // Remove focus from modal buttons
  if (modalFocusableItems[modalFocusIndex]) {
    removeFocus(modalFocusableItems[modalFocusIndex]);
  }
  
  // Restore focus to dashboard
  addFocus(focusableItems[focusIndex]);
}

function exitApp() {
  // Clear all localStorage if needed
  localStorage.clear();
  
  // Close the window/app
  if (window.close) {
    window.close();
  }
  
  // For web apps that can't close, redirect to a blank page
  window.location.href = "about:blank";
}

    // --- CLICK HANDLER -------------------------------------------------------
    function handleClick(e) {
      if (localStorage.getItem("currentPage") !== "dashboard") return;

      // Logout
      if (e.target.closest(".logout-icon")) {
        localStorage.setItem("isLogin", false);
        localStorage.setItem("currentPage", "playlist");
        DashboardPage.cleanup();
        localStorage.removeItem("selectedStreamOption");
        localStorage.removeItem("selectedStreamFormat");
        navigateTo("playlist-page");
        return;
      }

      // Settings
      if (e.target.closest(".settings-box")) {
        localStorage.setItem("movieSortValue", "default");
        localStorage.setItem("currentPage", "settingsPage");
        DashboardPage.cleanup();
        navigateTo("settings-page");
        return;
      }

      // Account
      if (e.target.closest(".account-box")) {
        localStorage.setItem("movieSortValue", "default");
        localStorage.setItem("currentPage", "accountPage");
        DashboardPage.cleanup();
        navigateTo("account-page");
        return;
      }

      // Movies
      if (e.target.closest(".movies-box")) {
        localStorage.setItem("movieSortValue", "default");
        localStorage.setItem("currentPage", "moviesPage");
        DashboardPage.cleanup();
        localStorage.setItem("resetMoviesFocus", "yes");

        navigateTo("movies-page");
        return;
      }

      // Series
      if (e.target.closest(".series-box")) {
        localStorage.setItem("movieSortValue", "default");
        localStorage.setItem("currentPage", "seriesPage");
        localStorage.removeItem("seriesLastCategoryId");
        localStorage.removeItem("seriesLastChannelIndex");
        localStorage.removeItem("seriesLastCardIndex");
        DashboardPage.cleanup();
        navigateTo("series-page");
        return;
      }

      // List Users
      if (e.target.closest(".list-users-box")) {
        localStorage.setItem("isLogin", false);
        localStorage.setItem("movieSortValue", "default");
        localStorage.setItem("currentPage", "playlist");
        DashboardPage.cleanup();
        navigateTo("playlist-page");
        return;
      }

      // Live TV
      if (e.target.closest(".livetv-box")) {
        localStorage.setItem("movieSortValue", "default");
        localStorage.setItem("currentPage", "liveTvPage");
        localStorage.setItem("isLivePageOpen", true);
        DashboardPage.cleanup();
        console.log("Navigating to Live TV");
        navigateTo("live-tv-page");
        return;
      }
    }

    // --- KEYBOARD / REMOTE HANDLER -------------------------------------------
function handleKeydown(e) {
  if (localStorage.getItem("currentPage") !== "dashboard") return;

  console.log("🎮 Dashboard handleKeydown:", {
    key: e.key,
    code: e.code,
    keyCode: e.keyCode,
    which: e.which,
    isModalOpen: isModalOpen
  });

  // --- HANDLE MODAL NAVIGATION ---
  if (isModalOpen) {
    console.log("📱 Modal is open, handling modal navigation");
    
    if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.keyCode === 37 || e.keyCode === 39) {
      e.preventDefault();
      removeFocus(modalFocusableItems[modalFocusIndex]);
      modalFocusIndex = modalFocusIndex === 0 ? 1 : 0;
      addFocus(modalFocusableItems[modalFocusIndex]);
      console.log("Modal focus moved to:", modalFocusIndex);
    }
    else if (e.key === "Enter" || e.keyCode === 13) {
      e.preventDefault();
      console.log("Enter pressed on modal button:", modalFocusIndex);
      
      if (modalFocusIndex === 0) {
        console.log("🚪 Exiting app...");
        exitApp();
      } else {
        console.log("❌ Closing modal...");
        hideExitModal();
      }
    }
    else if (e.key === "Escape" || e.key === "Backspace" || e.key === "Back" || 
             e.keyCode === 27 || e.keyCode === 8 || e.keyCode === 10009) {
      e.preventDefault();
      console.log("Back pressed, closing modal");
      hideExitModal();
    }
    
    return;
  }

  // --- HANDLE DASHBOARD NAVIGATION ---
  const current = focusableItems[focusIndex];

  // ⚠️ CRITICAL FIX: Check keyCode/which FIRST before e.key
  const exitKeyCodes = [27, 8, 461, 10009, 10182];
  const exitKeys = ["Escape", "Backspace", "Back", "Exit", "XF86Back", "BrowserBack", "GoBack"];
  const exitCodes = ["Escape", "Backspace", "BrowserBack"];

  const isExitKey = 
    exitKeyCodes.includes(e.keyCode) ||
    exitKeyCodes.includes(e.which) ||
    exitKeys.includes(e.key) ||
    exitCodes.includes(e.code);

  if (isExitKey) {
    e.preventDefault();
    e.stopPropagation();
    console.log("🚨 EXIT KEY DETECTED! keyCode:", e.keyCode, "key:", e.key);
    showExitModal();
    return;
  }

  // MOVE DOWN
  if (e.key === "ArrowDown" || e.keyCode === 40) {
    e.preventDefault();
    
    if (focusIndex === 0) {
      removeFocus(current);
      focusIndex = 3;
      addFocus(focusableItems[focusIndex]);
    }
    else if (focusIndex === 1) {
      removeFocus(current);
      focusIndex = 4;
      addFocus(focusableItems[focusIndex]);
    }
    else if (focusIndex === 2) {
      removeFocus(current);
      focusIndex = 5;
      addFocus(focusableItems[focusIndex]);
    }
    else if (focusIndex === 6) {
      removeFocus(current);
      focusIndex = 0;
      addFocus(focusableItems[focusIndex]);
    }
  }

  // MOVE UP
  else if (e.key === "ArrowUp" || e.keyCode === 38) {
    e.preventDefault();
    
    if (focusIndex === 3) {
      removeFocus(current);
      focusIndex = 0;
      addFocus(focusableItems[focusIndex]);
    }
    else if (focusIndex === 4) {
      removeFocus(current);
      focusIndex = 1;
      addFocus(focusableItems[focusIndex]);
    }
    else if (focusIndex === 5) {
      removeFocus(current);
      focusIndex = 2;
      addFocus(focusableItems[focusIndex]);
    }
    else if (focusIndex === 0) {
      removeFocus(current);
      focusIndex = 6;
      addFocus(focusableItems[focusIndex]);
    }
    else if (focusIndex === 1) {
      removeFocus(current);
      focusIndex = 6;
      addFocus(focusableItems[focusIndex]);
    }
    else if (focusIndex === 2) {
      removeFocus(current);
      focusIndex = 6;
      addFocus(focusableItems[focusIndex]);
    }
  }

  // MOVE RIGHT
  else if (e.key === "ArrowRight" || e.keyCode === 39) {
    e.preventDefault();

    if (focusIndex === 0) {
      removeFocus(current);
      focusIndex = 1;
      addFocus(focusableItems[focusIndex]);
    }
    else if (focusIndex === 1) {
      removeFocus(current);
      focusIndex = 2;
      addFocus(focusableItems[focusIndex]);
    }
    else if (focusIndex === 2) {
      removeFocus(current);
      focusIndex = 3;
      addFocus(focusableItems[focusIndex]);
    }
    else if (focusIndex === 3) {
      removeFocus(current);
      focusIndex = 4;
      addFocus(focusableItems[focusIndex]);
    }
    else if (focusIndex === 4) {
      removeFocus(current);
      focusIndex = 5;
      addFocus(focusableItems[focusIndex]);
    }
  }

  // MOVE LEFT
  else if (e.key === "ArrowLeft" || e.keyCode === 37) {
    e.preventDefault();
    
    if (focusIndex === 1) {
      removeFocus(current);
      focusIndex = 0;
      addFocus(focusableItems[focusIndex]);
    }
    else if (focusIndex === 2) {
      removeFocus(current);
      focusIndex = 1;
      addFocus(focusableItems[focusIndex]);
    }
    else if (focusIndex === 4) {
      removeFocus(current);
      focusIndex = 3;
      addFocus(focusableItems[focusIndex]);
    }
    else if (focusIndex === 5) {
      removeFocus(current);
      focusIndex = 4;
      addFocus(focusableItems[focusIndex]);
    }
    else if (focusIndex === 6) {
      removeFocus(current);
      focusIndex = 5;
      addFocus(focusableItems[focusIndex]);
    }
  }

  // ENTER to activate
  else if (e.key === "Enter" || e.keyCode === 13) {
    e.preventDefault();
    if (focusableItems[focusIndex]) {
      focusableItems[focusIndex].click();
    }
  }
}


// Special handler for Tizen EXIT button (keyCode 10182)
function handleTizenExit(e) {
  if (localStorage.getItem("currentPage") !== "dashboard") return;
  
  console.log("🔴 Tizen EXIT handler:", e.keyCode);
  
  if (e.keyCode === 10182 || e.which === 10182) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    console.log("🚨 EXIT BUTTON (10182) DETECTED!");
    
    if (isModalOpen) {
      hideExitModal();
    } else {
      showExitModal();
    }
  }
}

// Register this FIRST with capture phase
document.addEventListener("keydown", handleTizenExit, true);

// Then register normal handler
document.addEventListener("click", handleClick);
document.addEventListener("keydown", handleKeydown);

// Update cleanup
DashboardPage.cleanup = function () {
  document.removeEventListener("keydown", handleTizenExit, true);
  document.removeEventListener("click", handleClick);
  document.removeEventListener("keydown", handleKeydown);
};

    // --- REGISTER EVENTS -----------------------------------------------------
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeydown);

    // --- CLEANUP -------------------------------------------------------------
    DashboardPage.cleanup = function () {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeydown);
    };

  }, 0);


    console.log("Dashboard Page Loaded");


  // ------------------ UI Rendering ------------------

  const now = new Date();
const time = formatTime(now);
  const date = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const playlistData = JSON.parse(localStorage.getItem("selectedPlaylist")) || {};
  const playlistName = playlistData.playlistName || "Any Name";

let expDate;

if (
  playlistData &&
  playlistData.userInfo &&
  playlistData.userInfo.exp_date
) {
  expDate = playlistData.userInfo.exp_date;
} else {
  expDate = null;
}





  return `
<div class="dashboard-main-container">
    <header class="dashboard-header">
        <div class="header-left">
            <img src="/assets/logo.png" alt="Exclusive Player" class="app-logo" />
            <div class="header-center">
                <span class="current-time">${time}</span>
                <span class="current-date">${date}</span>
            </div>
        </div>

        <div class="header-right">
            <div class="logout-icon">
                <img src="/assets/logout.png" alt="Power" />
            </div>
        </div>
    </header>

    <div class="container dashboard-wrapper">

        <div class="top-row">

            <div class="menu-box large livetv-box" id="live-tv-box">
                <div class="menu-content-title">
                    <div class="icon-border">
                        <img src="/assets/live.png" class="dashboard-livetv-icon" alt="Live TV" />
                    </div>
                    <div class="menu-title title-livetv">Live TV</div>
                </div>
            </div>

            <div class="menu-box medium movies-box">
                <div class="menu-content-title">
                    <div class="icon-border">
                        <img src="/assets/movies.png" alt="Movies" />
                    </div>
                    <div class="menu-title">Movies</div>
                </div>
            </div>

            <div class="menu-box medium series-box">
                <div class="menu-content-title">
                    <div class="icon-border">
                        <img src="/assets/series.png" alt="Series" />
                    </div>
                    <div class="menu-title">Series</div>
                </div>
            </div>

        </div>

        <div class="bottom-row">

            <div class="menu-box small account-box">
                <div class="menu-content-title">
                    <div class="icon-border">
                        <img src="/assets/account.png" alt="My Account" />
                    </div>
                    <div class="menu-title">My Account</div>
                </div>
            </div>

            <div class="menu-box small settings-box">
                <div class="menu-content-title">
                    <div class="icon-border">
                        <img src="/assets/settings.png" alt="Settings" />
                    </div>
                    <div class="menu-title">Settings</div>
                </div>
            </div>

            <div class="menu-box small list-users-box">
                <div class="menu-content-title">
                    <div class="icon-border">
                        <img src="/assets/users.png" alt="List Users" />
                    </div>
                    <div class="menu-title">List User</div>
                </div>
            </div>

        </div>

    </div>

    <footer class="footer-dashboard">
        <div class="footer-left">Expiration :    ${formatUnixDate(expDate) || 'N/A'}</div>
        <div class="footer-right">Logged in : ${playlistName}</div>
    </footer>

     <div id="exit-modal" class="exit-modal hidden">
        <div class="exit-modal-content">
            <h2 class="exit-modal-title">Exit Application</h2>
            <p class="exit-modal-text">Do you want to exit the app?</p>
            <div class="exit-modal-buttons">
                <button class="exit-btn exit-yes-btn dashboard-focused">Yes</button>
                <button class="exit-btn exit-no-btn">No</button>
            </div>
        </div>
    </div>

</div>
`;
}