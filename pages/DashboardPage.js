

function DashboardPage() {
  setTimeout(() => {
    console.log("Dashboard Page Loaded");

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

    // --- CLICK HANDLER -------------------------------------------------------
    function handleClick(e) {
      if (localStorage.getItem("currentPage") !== "dashboard") return;

      // Logout
      if (e.target.closest(".logout-icon")) {
        localStorage.setItem("isLogin", false);
        localStorage.setItem("currentPage", "playlistPage");
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
        localStorage.setItem("currentPage", "playlistPage");
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

      const current = focusableItems[focusIndex];

      // MOVE DOWN
      if (e.key === "ArrowDown") {
        e.preventDefault();
        
        // Live TV (0) → Account (3)
        if (focusIndex === 0) {
          removeFocus(current);
          focusIndex = 3;
          addFocus(focusableItems[focusIndex]);
        }
        // Movies (1) → Settings (4)
        else if (focusIndex === 1) {
          removeFocus(current);
          focusIndex = 4;
          addFocus(focusableItems[focusIndex]);
        }
        // Series (2) → List Users (5)
        else if (focusIndex === 2) {
          removeFocus(current);
          focusIndex = 5;
          addFocus(focusableItems[focusIndex]);
        }
        // Any bottom row item → Logout (6)
       

        else if (focusIndex === 6) {
          removeFocus(current);
          focusIndex = 0;
          addFocus(focusableItems[focusIndex]);
        }

       
      }

      // MOVE UP
      else if (e.key === "ArrowUp") {
        e.preventDefault();
        
        // Account (3) → Live TV (0)
        if (focusIndex === 3) {
          removeFocus(current);
          focusIndex = 0;
          addFocus(focusableItems[focusIndex]);
        }
        // Settings (4) → Movies (1)
        else if (focusIndex === 4) {
          removeFocus(current);
          focusIndex = 1;
          addFocus(focusableItems[focusIndex]);
        }
        // List Users (5) → Series (2)
        else if (focusIndex === 5) {
          removeFocus(current);
          focusIndex = 2;
          addFocus(focusableItems[focusIndex]);
        }
        // Logout (6) → Account (3)
        // else if (focusIndex === 6) {
        // //   removeFocus(current);
        // //   focusIndex = 3;
        // //   addFocus(focusableItems[focusIndex]);
        // // }

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
    // MOVE RIGHT
else if (e.key === "ArrowRight") {
  e.preventDefault();

  // Live TV (0) → Movies (1)
  if (focusIndex === 0) {
    removeFocus(current);
    focusIndex = 1;
    addFocus(focusableItems[focusIndex]);
  }
  // Movies (1) → Series (2)
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

  // Account (3) → Settings (4)
  else if (focusIndex === 3) {
    removeFocus(current);
    focusIndex = 4;
    addFocus(focusableItems[focusIndex]);
  }
  // Settings (4) → List Users (5)
  else if (focusIndex === 4) {
    removeFocus(current);
    focusIndex = 5;
    addFocus(focusableItems[focusIndex]);
  }

}

      // MOVE LEFT
      else if (e.key === "ArrowLeft") {
        e.preventDefault();
        
        // Movies (1) → Live TV (0)
        if (focusIndex === 1) {
          removeFocus(current);
          focusIndex = 0;
          addFocus(focusableItems[focusIndex]);
        }
        // Series (2) → Movies (1)
        else if (focusIndex === 2) {
          removeFocus(current);
          focusIndex = 1;
          addFocus(focusableItems[focusIndex]);
        }
        // Settings (4) → Account (3)
        else if (focusIndex === 4) {
          removeFocus(current);
          focusIndex = 3;
          addFocus(focusableItems[focusIndex]);
        }
        // List Users (5) → Settings (4)
        else if (focusIndex === 5) {
          removeFocus(current);
          focusIndex = 4;
          addFocus(focusableItems[focusIndex]);
        }
        // Logout (6) → List Users (5)
        else if (focusIndex === 6) {
          removeFocus(current);
          focusIndex = 5;
          addFocus(focusableItems[focusIndex]);
        }
      }

      // ENTER to activate
      else if (e.key === "Enter") {
        e.preventDefault();
        if (focusableItems[focusIndex]) {
          focusableItems[focusIndex].click();
        }
      }
    }

    // --- REGISTER EVENTS -----------------------------------------------------
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeydown);

    // --- CLEANUP -------------------------------------------------------------
    DashboardPage.cleanup = function () {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeydown);
    };

  }, 0);

  // ------------------ UI Rendering ------------------

  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const date = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const playlistData = JSON.parse(localStorage.getItem("selectedPlaylist")) || {};
  const playlistName = playlistData.playlistName || "Any Name";
  const expirationDate = playlistData.expirationDate || "Dec 23, 2025";

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
        <div class="footer-left">Expiration : ${expirationDate}</div>
        <div class="footer-right">Logged in : ${playlistName}</div>
    </footer>
</div>
`;
}