
function LiveTvPage() {
  // State variables
  let focusedChannelIndex = 0;
  let inChannelGrid = true;
  let inVideoPlayer = false;

  // NEW state for sidebar & EPG
  let inSidebar = false;
  let inSidebarSearch = false; // NEW: track if in sidebar search box
  let focusedSidebarIndex = 0;

  let inHeaderSearch = false; // NEW: track if in header search box

  let inEPG = false;
  let focusedEPGIndex = 0;

  const qsa = (s) => [...document.querySelectorAll(s)];
  const qs = (s) => document.querySelector(s);

  // Helper to set focus on channel cards
  const setFocus = (list, idx, cls) => {
    list.forEach((el) => el.classList.remove(cls));
    if (list[idx]) {
      list[idx].classList.add(cls);
      list[idx].scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  };

  // Helper to set focus on sidebar
  const setSidebarFocus = (idx) => {
    const list = qsa(".sidebar-item");
    list.forEach((el) => el.classList.remove("sidebar-focused"));
    if (list[idx]) {
      list[idx].classList.add("sidebar-focused");
      list[idx].scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  };

  // Helper to set focus on sidebar search box
  const setSidebarSearchFocus = (active) => {
    const searchBox = qs(".sidebar-search-box");
    const searchInput = qs(".sidebar-search-input");
    if (active) {
      searchBox?.classList.add("search-focused");
      searchInput?.focus();
    } else {
      searchBox?.classList.remove("search-focused");
      searchInput?.blur();
    }
  };

  // Helper to set focus on header search box
  const setHeaderSearchFocus = (active) => {
    const searchBox = qs(".search-container");
    const searchInput = qs(".search-input");
    if (active) {
      searchBox?.classList.add("search-focused");
      searchInput?.focus();
    } else {
      searchBox?.classList.remove("search-focused");
      searchInput?.blur();
    }
  };

  // Helper to set focus on epg
  const setEPGFocus = (idx) => {
    const list = qsa(".epg-item");
    list.forEach((el) => el.classList.remove("epg-focused"));
    if (list[idx]) {
      list[idx].classList.add("epg-focused");
      list[idx].scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  };

  // Play channel function
  const playChannel = (channelData) => {
    const videoWrapper = qs(".livetv-video-wrapper");
    if (!videoWrapper) return;

    // Dispose existing player if any
    if (window.livePlayer) {
      try {
        window.livePlayer.dispose();
      } catch (e) {
        console.warn("Error disposing player:", e);
      }
      window.livePlayer = null;
    }

    // Create video player HTML
    videoWrapper.innerHTML = `
      <div class="live-video-player-div">
        <video 
          id="live-video-player" 
          class="video-js vjs-default-skin" 
          controls 
          preload="auto"
          data-stream-id="${channelData.id}"
          poster="${channelData.logo}"
        >
          <source src="${channelData.streamUrl}" type="application/x-mpegURL">
        </video>
        
        <div class="video-overlay-info">
          <h3 class="video-channel-name">${channelData.name}</h3>
        </div>

        <div class="live-video-loader hidden">
          <div class="spinner"></div>
        </div>
      </div>
    `;

    // Initialize video player (using Video.js as example)
    setTimeout(() => {
      const videoEl = qs("#live-video-player");
      if (videoEl && typeof videojs !== "undefined") {
        window.livePlayer = videojs(videoEl, {
          controls: true,
          autoplay: true,
          preload: "auto"
        });

        // Show loader on waiting
        window.livePlayer.on("waiting", () => {
          qs(".live-video-loader")?.classList.remove("hidden");
        });

        // Hide loader on playing
        window.livePlayer.on("playing", () => {
          qs(".live-video-loader")?.classList.add("hidden");
        });
      }
    }, 100);

    // Update visual states
    qsa(".channel-card").forEach(c => {
      c.classList.remove("channel-card-selected", "channel-card-focused");
    });
    
    const selectedCard = qs(`.channel-card[data-id="${channelData.id}"]`);
    if (selectedCard) {
      selectedCard.classList.add("channel-card-selected", "channel-card-focused");
      // Set focusedChannelIndex to the selected card index
      const channels = qsa(".channel-card");
      const idx = channels.findIndex(c => c.dataset.id == channelData.id);
      if (idx >= 0) focusedChannelIndex = idx;
    }
  };

  // CLICK HANDLER
  function handleClick(e) {
    if (localStorage.getItem("currentPage") !== "liveTvPage") return;

    const card = e.target.closest(".channel-card");
    if (card) {
      const channelId = card.dataset.id;
      const channelName = card.dataset.name;
      const channelLogo = card.dataset.logo;
      
      playChannel({
        id: channelId,
        name: channelName,
        logo: channelLogo,
        streamUrl: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8"
      });
      return;
    }

    const sidebarItem = e.target.closest(".sidebar-item");
    if (sidebarItem) {
      const list = qsa(".sidebar-item");
      focusedSidebarIndex = list.indexOf(sidebarItem);
      setSidebarFocus(focusedSidebarIndex);
      return;
    }

    const epgItem = e.target.closest(".epg-item");
    if (epgItem) {
      const list = qsa(".epg-item");
      focusedEPGIndex = list.indexOf(epgItem);
      setEPGFocus(focusedEPGIndex);
      console.log("EPG item clicked:", epgItem.innerText);
      return;
    }

    if (e.target.closest(".menu-dots")) {
      console.log("Menu clicked");
      return;
    }
  }

  // KEY NAVIGATION
  function handleKeydown(e) {
    if (localStorage.getItem("currentPage") !== "liveTvPage") return;

    const channels = qsa(".channel-card");
    const sidebarItems = qsa(".sidebar-item");
    const epgItems = qsa(".epg-item");

    const isUp = e.key === "ArrowUp" || e.keyCode === 38;
    const isDown = e.key === "ArrowDown" || e.keyCode === 40;
    const isLeft = e.key === "ArrowLeft" || e.keyCode === 37;
    const isRight = e.key === "ArrowRight" || e.keyCode === 39;
    const isEnter = e.key === "Enter" || e.keyCode === 13;
    const backKeys = [10009, "Escape", "Back", "BrowserBack", "XF86Back"];

    // Handle back button
    if (backKeys.includes(e.key) || backKeys.includes(e.keyCode)) {
      // Check if in fullscreen first
      if (document.fullscreenElement) {
        document.exitFullscreen();
        e.preventDefault();
        return;
      }
      
      // Navigate back to dashboard
      if (window.livePlayer) {
        try { window.livePlayer.dispose(); } catch (err) { /* ignore */ }
        window.livePlayer = null;
      }
      localStorage.setItem("currentPage", "dashboard");
      Router.showPage("dashboard");
      return;
    }

    // If user is in video player area
    if (inVideoPlayer) {
      if (isDown) {
        inVideoPlayer = false;
        inChannelGrid = true;
        qs(".live-video-player-div")?.classList.remove("video-focused");
        focusedChannelIndex = 0;
        setFocus(channels, focusedChannelIndex, "channel-card-focused");
        e.preventDefault();
        return;
      }
      
      if (isEnter) {
        const videoDiv = qs(".live-video-player-div");
        if (videoDiv) {
          if (!document.fullscreenElement) {
            videoDiv.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
        }
        e.preventDefault();
        return;
      }
      return;
    }

    // HEADER SEARCH BOX NAVIGATION
    if (inHeaderSearch) {
      // DOWN: Move to channel grid
      if (isDown) {
        inHeaderSearch = false;
        inChannelGrid = true;
        setHeaderSearchFocus(false);
        focusedChannelIndex = 0;
        setFocus(channels, focusedChannelIndex, "channel-card-focused");
        e.preventDefault();
        return;
      }

      // LEFT: Stay in header search
      if (isLeft) {
        e.preventDefault();
        return;
      }

      // RIGHT: Stay in header search
      if (isRight) {
        e.preventDefault();
        return;
      }

      // UP: Stay in header search
      if (isUp) {
        e.preventDefault();
        return;
      }

      // Allow typing in search box
      return;
    }

    // SIDEBAR SEARCH BOX NAVIGATION
    if (inSidebarSearch) {
      // UP: Move to header search
      if (isUp) {
        inSidebarSearch = false;
        inHeaderSearch = true;
        setSidebarSearchFocus(false);
        setHeaderSearchFocus(true);
        e.preventDefault();
        return;
      }

      // DOWN: Move to first sidebar item
      if (isDown) {
        inSidebarSearch = false;
        inSidebar = true;
        setSidebarSearchFocus(false);
        focusedSidebarIndex = 0;
        setSidebarFocus(focusedSidebarIndex);
        e.preventDefault();
        return;
      }

      // RIGHT: Go back to channels
      if (isRight) {
        inSidebarSearch = false;
        inChannelGrid = true;
        setSidebarSearchFocus(false);
        setFocus(channels, focusedChannelIndex, "channel-card-focused");
        e.preventDefault();
        return;
      }

      // LEFT: Stay in search box
      if (isLeft) {
        e.preventDefault();
        return;
      }

      // Allow typing in search box - don't prevent default for regular keys
      return;
    }

    // Sidebar navigation
    if (inSidebar) {
      // UP: Go back to sidebar search box or stay at first item
      if (isUp) {
        if (focusedSidebarIndex > 0) {
          focusedSidebarIndex--;
          setSidebarFocus(focusedSidebarIndex);
        } else {
          // Move to sidebar search box
          inSidebar = false;
          inSidebarSearch = true;
          sidebarItems.forEach(i => i.classList.remove("sidebar-focused"));
          setSidebarSearchFocus(true);
        }
        e.preventDefault();
        return;
      }

      // DOWN: Navigate sidebar items
      if (isDown) {
        if (focusedSidebarIndex < sidebarItems.length - 1) {
          focusedSidebarIndex++;
          setSidebarFocus(focusedSidebarIndex);
        }
        e.preventDefault();
        return;
      }

      // RIGHT: Go back to channels
      if (isRight) {
        inSidebar = false;
        inChannelGrid = true;
        sidebarItems.forEach(i => i.classList.remove("sidebar-focused"));
        setFocus(channels, focusedChannelIndex, "channel-card-focused");
        e.preventDefault();
        return;
      }

      // LEFT: Stay in sidebar
      if (isLeft) {
        e.preventDefault();
        return;
      }

      // ENTER: Click sidebar item
      if (isEnter) {
        sidebarItems[focusedSidebarIndex]?.click();
        e.preventDefault();
        return;
      }

      return;
    }

    // EPG navigation
    if (inEPG) {
      if (isUp) {
        if (focusedEPGIndex > 0) {
          epgItems[focusedEPGIndex].classList.remove("epg-focused");
          focusedEPGIndex--;
          epgItems[focusedEPGIndex].classList.add("epg-focused");
          epgItems[focusedEPGIndex].scrollIntoView({ block: "nearest" });
        } else {
          // Remove EPG focus when leaving
          epgItems.forEach(item => item.classList.remove("epg-focused"));
          inEPG = false;
          inChannelGrid = true;
          const cols = 5;
          const row = Math.floor(focusedChannelIndex / cols);
          const col = focusedChannelIndex % cols;
          focusedChannelIndex = row * cols + col;
          setFocus(qsa(".channel-card"), focusedChannelIndex, "channel-card-focused");
        }
        e.preventDefault();
        return;
      }

      if (isDown) {
        if (focusedEPGIndex < epgItems.length - 1) {
          epgItems[focusedEPGIndex].classList.remove("epg-focused");
          focusedEPGIndex++;
          epgItems[focusedEPGIndex].classList.add("epg-focused");
          epgItems[focusedEPGIndex].scrollIntoView({ block: "nearest" });
        }
        e.preventDefault();
        return;
      }

      if (isLeft) {
        // Remove EPG focus when leaving
        epgItems.forEach(item => item.classList.remove("epg-focused"));
        inEPG = false;
        inChannelGrid = true;
        setFocus(qsa(".channel-card"), focusedChannelIndex, "channel-card-focused");
        e.preventDefault();
        return;
      }

      if (isEnter) {
        console.log("EPG selected:", epgItems[focusedEPGIndex].innerText);
        e.preventDefault();
        return;
      }

      return;
    }

    // CHANNEL GRID NAVIGATION
    if (inChannelGrid) {
      const cols = 5;

      if (isUp) {
        if (focusedChannelIndex >= cols) {
          focusedChannelIndex -= cols;
          setFocus(channels, focusedChannelIndex, "channel-card-focused");
        } else {
          // Move to header search if in first row
          inChannelGrid = false;
          inHeaderSearch = true;
          channels.forEach(c => c.classList.remove("channel-card-focused"));
          setHeaderSearchFocus(true);
        }
        e.preventDefault();
        return;
      }

      if (isDown) {
        if (focusedChannelIndex + cols < channels.length) {
          focusedChannelIndex += cols;
          setFocus(channels, focusedChannelIndex, "channel-card-focused");
        } else {
          inChannelGrid = false;
          inEPG = true;
          focusedEPGIndex = 0;
          qs(".epg-item")?.classList.remove("epg-focused");
          const epgItems = qsa(".epg-item");
          if (epgItems.length) {
            epgItems[0].classList.add("epg-focused");
            epgItems[0].scrollIntoView({ block: "nearest" });
          }
        }
        e.preventDefault();
        return;
      }

      if (isLeft) {
        if (focusedChannelIndex > 0) {
          focusedChannelIndex--;
          setFocus(channels, focusedChannelIndex, "channel-card-focused");
        } else {
          // GO TO SIDEBAR SEARCH BOX
          inChannelGrid = false;
          inSidebarSearch = true;
          channels.forEach(c => c.classList.remove("channel-card-focused"));
          setSidebarSearchFocus(true);
        }
        e.preventDefault();
        return;
      }

      if (isRight) {
        if (focusedChannelIndex < channels.length - 1) {
          focusedChannelIndex++;
          setFocus(channels, focusedChannelIndex, "channel-card-focused");
        }
        e.preventDefault();
        return;
      }

      if (isEnter) {
        const selected = channels[focusedChannelIndex];
        if (selected) selected.click();
        e.preventDefault();
        return;
      }
    }
  }

  // Setup event listeners
  setTimeout(() => {
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeydown);

    // Load sidebar data
    const categoriesData = [
      { name: "Favorite Channels", count: 46 },
      { name: "Channels History", count: 245 },
      { name: "English Channels", count: 4 },
      { name: "Sports Channels", count: 10 },
      { name: "French Channels", count: 34 }
    ];

    document.querySelector("#sidebar-area").innerHTML =
      SidebarCategories(categoriesData);

    // Set initial focus
    const channels = qsa(".channel-card");
    if (channels.length > 0) {
      setFocus(channels, 0, "channel-card-focused");
      focusedChannelIndex = 0;
      inChannelGrid = true;
      inSidebar = false;
      inSidebarSearch = false;
      inHeaderSearch = false;
      inEPG = false;
      inVideoPlayer = false;
    }

    LiveTvPage.cleanup = function () {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeydown);
      
      if (window.livePlayer) {
        try {
          window.livePlayer.dispose();
        } catch (e) {
          console.warn("Error cleaning up player:", e);
        }
        window.livePlayer = null;
      }
    };
  }, 0);

  // Header time
  const now = new Date();
  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
  const date = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  // Channel data
  const channelsData = [
    { id: "1", name: "Demo Channel 1", logo: "/assets/logo.png" },
    { id: "2", name: "Demo Channel 2", logo: "/assets/users.svg" },
    { id: "3", name: "Demo Channel 3", logo: "/assets/logo.png" },
    { id: "4", name: "Demo Channel 4", logo: "/assets/users.svg" },
    { id: "5", name: "Demo Channel 5", logo: "/assets/users.svg" },
    { id: "6", name: "Demo Channel 6", logo: "/assets/users.svg" },
    { id: "7", name: "Demo Channel 7", logo: "/assets/users.svg" },
    { id: "8", name: "Demo Channel 8", logo: "/assets/users.svg" },
    { id: "9", name: "Demo Channel 9", logo: "/assets/users.svg" }
  ];

  return `
<div class="livetv-main-container">
  <header class="livetv-header">
      <div class="header-left">
          <img src="/assets/logo.png" class="app-logo" />
          <div class="live-indicator"><span class="live-text">Live</span></div>
      </div>

      <div class="header-center">
          <span class="current-time">${time}</span>
          <span class="current-date">${date}</span>
      </div>

      <div class="header-right">
          <div class="search-container">
              <div class="search-icon">
                  <img src="/assets/search.png" />
              </div>
              <input type="text" class="search-input" placeholder="Search Channels" />
          </div>

          <div class="menu-dots">
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          </div>
      </div>
  </header>

  <div class="livetv-content-wrapper">
    <div id="sidebar-area"></div>

    <div class="main-content-area">
      <div class="channel-grid">
        ${channelsData
          .map(
            ch => `
            <div class="channel-card" data-id="${ch.id}" data-name="${ch.name}" data-logo="${ch.logo}">
                <div class="channel-card-header">
                  <img src="${ch.logo}" class="channel-logo" alt="${ch.name}" />
                  <button class="favorite-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </button>
                </div>
                <div class="channel-name">${ch.name}</div>
            </div>
          `
          )
          .join("")}
      </div>

      <div class="bottom-section">
        <div class="livetv-video-wrapper">
          <div class="video-placeholder">
            <div class="placeholder-content">
              <img src="/assets/logo.png" alt="Logo" class="placeholder-logo" />
              <p class="placeholder-text">Select a channel to start watching</p>
            </div>
          </div>
        </div>

        <div class="epg-schedule">
          <div class="epg-header">
              <img class="epg-channel-name" src="/assets/channel.png" alt="Logo" class="placeholder-logo" />
            <button class="epg-favorite-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="red" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          </div>
          
          <div class="epg-list">
            <div class="epg-item">
              <span class="epg-time">08:15 PM - 09:15 PM</span>
              <span class="epg-title">Team1 VS Team2 Match</span>
            </div>
            <div class="epg-item">
              <span class="epg-time">09:15 PM - 10:15 PM</span>
              <span class="epg-title">Team1 VS Team2 Match</span>
            </div>
            <div class="epg-item">
              <span class="epg-time">10:15 PM - 11:00 PM</span>
              <span class="epg-title">Team1 VS Team2 Match</span>
            </div>
            <div class="epg-item">
              <span class="epg-time">11:00 PM - 12:15 AM</span>   
              <span class="epg-title">Team1 VS Team2 Match</span>
            </div>
            <div class="epg-item">
              <span class="epg-time">12:15 PM - 01:15 AM</span>
              <span class="epg-title">Team1 VS Team2 Match</span>
            </div>
            <div class="epg-item">
              <span class="epg-time">01:15 PM - 02:15 AM</span>
              <span class="epg-title">Team1 VS Team2 Match</span>
            </div>
            <div class="epg-item">
              <span class="epg-time">02:15 PM - 03:15 AM</span>
              <span class="epg-title">Team1 VS Team2 Match</span>
            </div>
            <div class="epg-item">
              <span class="epg-time">03:15 AM - 04:15 AM</span>
              <span class="epg-title">Late Match</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`;
}