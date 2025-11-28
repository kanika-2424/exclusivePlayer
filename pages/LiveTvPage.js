
function LiveTvPage() {
  // ===== API DATA (NEW) =====
  const categories = window.liveCategories || [];
  const allStreams = window.allLiveStreams || [];
  
  const currentPlaylistName = JSON.parse(
    localStorage.getItem("selectedPlaylist")
  ).playlistName;
  const currentPlaylist = JSON.parse(
    localStorage.getItem("playlistsData")
  ).filter((pl) => pl.playlistName === currentPlaylistName)[0];

  const allFavoritesLiveTV = currentPlaylist.favoritesLiveTV || [];
  
  // ===== STATE VARIABLES =====
  let selectedCategoryId = "All"; // Currently selected category
  let focusedChannelIndex = 0;
  let focusedCategoryIndex = 0;
  let currentChunk = 1; // For lazy loading channels
  const pageSize = 20; // Channels per load
  let searchQuery = ""; // Search text
  
  let inChannelGrid = true;
  let inVideoPlayer = false;
  let inSidebar = false;
  let inSidebarSearch = false;
  let inHeaderSearch = false;
  let inEPG = false;
  let focusedSidebarIndex = 0;
  let focusedEPGIndex = 0;


  // Add this at the TOP of your LiveTvPage function (after the state variables)

// ===== SIMPLE VIDEO PLAYER (TEMPORARY) =====
const SimpleVideoPlayer = (streamId, streamUrl, logo, height, channelName) => {
  return `
    <div class="live-video-player-div" style="height: ${height}; position: relative; background: #000;">
      <video 
        id="live-video-player" 
        class="video-js vjs-default-skin" 
        controls 
        autoplay
        preload="auto"
        data-stream-id="${streamId}"
        poster="${logo}"
        style="width: 100%; height: 100%;"
      >
        <source src="${streamUrl}" type="application/x-mpegURL">
      </video>
      
      <div class="video-overlay-info" style="position: absolute; top: 10px; left: 10px; color: white; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px;">
        <h3 style="margin: 0; font-size: 16px;">${channelName}</h3>
      </div>

      <div class="live-video-loader hidden" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
        <div class="spinner"></div>
      </div>
    </div>
  `;
};
// ===== HELPER: Get Filtered Categories =====
  const getFilteredCategories = () => {
    const currentPlaylistName = JSON.parse(
      localStorage.getItem("selectedPlaylist")
    ).playlistName;
    const currentPlaylist = JSON.parse(
      localStorage.getItem("playlistsData")
    ).find((pl) => pl.playlistName === currentPlaylistName);

    const updatedFavorites = currentPlaylist ? currentPlaylist.favoritesLiveTV : [];
    const channelHistory = currentPlaylist ? currentPlaylist.ChannelListLive || [] : [];
    
    const filteredCategories = categories.map(c => {
      let categoryChannels = allStreams.filter(s => s.category_id === c.category_id) || [];
      
      if (searchQuery.trim() && selectedCategoryId === c.category_id) {
        categoryChannels = categoryChannels.filter(ch => 
          (ch.name || "").toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      return {
        ...c,
        channels: categoryChannels || []
      };
    });

    const allLiveStreams = searchQuery.trim() && selectedCategoryId === "All" 
      ? window.allLiveStreams.filter(ch => 
          (ch.name || "").toLowerCase().includes(searchQuery.toLowerCase())
        )
      : window.allLiveStreams;

    const favoritesChannels = searchQuery.trim() && selectedCategoryId === "favorites"
      ? updatedFavorites.filter(ch => 
          (ch.name || "").toLowerCase().includes(searchQuery.toLowerCase())
        )
      : updatedFavorites;

    const historyChannels = searchQuery.trim() && selectedCategoryId === "channelHistory"
      ? channelHistory.filter(ch => 
          (ch.name || "").toLowerCase().includes(searchQuery.toLowerCase())
        )
      : channelHistory;

    return [
      {
        category_id: "All",
        category_name: "All",
        channels: allLiveStreams || []
      },
      {
        category_id: "favorites",
        category_name: "Favorites", 
        channels: favoritesChannels || []
      },
      {
        category_id: "channelHistory",
        category_name: "Channel History",
        channels: historyChannels || []
      },
      ...filteredCategories
    ];
  };

  // ===== HELPER: Dispose Player =====
  const disposeLivePlayer = () => {
    if (window.livePlayer) {
      try {
        window.livePlayer.dispose();
      } catch (error) {
        console.log("Error disposing live player:", error);
      }
      window.livePlayer = null;
    }
  };
 

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
      searchBox.classList.add("search-focused");
      searchInput.focus();
    } else {
      searchBox.classList.remove("search-focused");
      searchInput.blur();
    }
  };

  // Helper to set focus on header search box
  const setHeaderSearchFocus = (active) => {
    const searchBox = qs(".search-container");
    const searchInput = qs(".search-input");
    if (active) {
      searchBox.classList.add("search-focused");
      searchInput.focus();
    } else {
      searchBox.classList.remove("search-focused");
      searchInput.blur();
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
// ===== PLAY CHANNEL FUNCTION (UPDATED) =====
 // ===== PLAY CHANNEL FUNCTION (FIXED) =====
  const playChannel = (channelData) => {
    console.log("🎬 Playing channel:", channelData); // Debug log
    
    const videoWrapper = qs(".livetv-video-wrapper");
    if (!videoWrapper) {
      console.error("❌ Video wrapper not found!");
      return;
    }

    // Get playlist data for stream URL
    const currentPlaylistData = JSON.parse(
      localStorage.getItem("currentPlaylistData")
    );
    const playlistLiveExtension = JSON.parse(
      localStorage.getItem("selectedPlaylist")
    );

    if (!currentPlaylistData || !playlistLiveExtension) {
      console.error("❌ Playlist data not found!");
      return;
    }

    // Build stream URL
    const liveVideoUrl = `${
      currentPlaylistData.server_info.server_protocol
    }://${currentPlaylistData.server_info.url}:${
      currentPlaylistData.server_info.port
    }/live/${currentPlaylistData.user_info.username}/${
      currentPlaylistData.user_info.password
    }/${channelData.stream_id}.${
      playlistLiveExtension.streamFormat || "m3u8"
    }`;

    console.log("🔗 Stream URL:", liveVideoUrl); // Debug log

    // Clean up existing player
    if (window.livePlayer) {
      try {
        window.livePlayer.dispose();
      } catch (err) {
        console.warn("Player disposal error:", err);
      }
      window.livePlayer = null;
    }

    // Check if player components exist
    const hasLiveVideoJs = typeof LiveVideoJsComponent !== "undefined";
    const hasFlowPlayer = typeof FlowLivePlayerComponent !== "undefined";
    
    console.log("🎮 Player components available:", { hasLiveVideoJs, hasFlowPlayer });

    // Get stream format
    const playlistsData = JSON.parse(localStorage.getItem("playlistsData"));
    const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist"));
    const currentPlaylist = playlistsData.find(pl => pl.playlistName === selectedPlaylist.playlistName);
    
    const isTs = (currentPlaylist.streamFormat || "").toLowerCase() === "ts";
    
    // Create player HTML
    if (isTs && hasFlowPlayer) {
      videoWrapper.innerHTML = FlowLivePlayerComponent(
        channelData.stream_id,
        liveVideoUrl,
        channelData.stream_icon || channelData.logo || "/assets/profile.png",
        "400px",
        channelData.name || "Unknown Channel"
      );
    } else if (hasLiveVideoJs) {
      videoWrapper.innerHTML = LiveVideoJsComponent(
        channelData.stream_id,
        liveVideoUrl,
        channelData.stream_icon || channelData.logo || "/assets/profile.png",
        "400px",
        channelData.name || "Unknown Channel"
      );
    } else {
      // Use simple player fallback
      videoWrapper.innerHTML = SimpleVideoPlayer(
        channelData.stream_id,
        liveVideoUrl,
        channelData.stream_icon || channelData.logo || "/assets/profile.png",
        "400px",
        channelData.name || "Unknown Channel"
      );
      
      // Initialize Video.js if available
      setTimeout(() => {
        const videoEl = document.getElementById("live-video-player");
        if (videoEl && typeof videojs !== "undefined") {
          window.livePlayer = videojs(videoEl, {
            controls: true,
            autoplay: true,
            preload: "auto",
            fluid: true
          });
          
          window.livePlayer.on("waiting", () => {
            qs(".live-video-loader").classList.remove("hidden");
          });
          
          window.livePlayer.on("playing", () => {
            qs(".live-video-loader").classList.add("hidden");
          });
          
          window.livePlayer.on("error", (e) => {
            console.error("❌ Player error:", e);
          });
        }
      }, 100);
    }

    // Update visual states
    qsa(".channel-card").forEach(c => {
      c.classList.remove("channel-card-selected", "channel-card-focused", "channel-card-playing");
    });

    const selectedCard = qs(`.channel-card[data-stream-id="${channelData.stream_id}"]`);
    if (selectedCard) {
      selectedCard.classList.add("channel-card-selected", "channel-card-focused", "channel-card-playing");
      
      const allCards = qsa(".channel-card");
      const cardIndex = Array.from(allCards).indexOf(selectedCard);
      if (cardIndex !== -1) {
        focusedChannelIndex = cardIndex;
      }
    }

    // Update EPG (load channel's program data)
    updateEPG(channelData);

    // Add to history
    if (selectedCategoryId !== "channelHistory") {
      const selectedChannelItem = allStreams.find(
        (item) => item.stream_id == channelData.stream_id
      );
      if (selectedChannelItem && typeof addItemToHistory === "function") {
        addItemToHistory(selectedChannelItem, "ChannelListLive");
      }
    }
    
    console.log("✅ Channel playback initiated");
  };

  // ===== UPDATE EPG (Program Guide) =====
  const updateEPG = (channelData) => {
    const epgList = qs(".epg-list");
    const epgChannelName = qs(".epg-channel-name");
    
    if (!epgList) return;

    // Update channel logo/name in EPG header
    if (epgChannelName) {
      epgChannelName.src = channelData.stream_icon || channelData.logo || "/assets/channel.png";
      epgChannelName.alt = channelData.name || "Channel";
    }

    // Fetch EPG data from API if available
    const streamId = channelData.stream_id;
    
    // Check if we have EPG data
    if (typeof getEPGForChannel === "function") {
      getEPGForChannel(streamId).then(epgData => {
        if (epgData && epgData.length > 0) {
          renderEPGList(epgData);
        } else {
          renderDefaultEPG(channelData.name);
        }
      }).catch(() => {
        renderDefaultEPG(channelData.name);
      });
    } else {
      // No EPG function available, show default
      renderDefaultEPG(channelData.name);
    }
  };

  // ===== RENDER EPG LIST =====
  const renderEPGList = (epgData) => {
    const epgList = qs(".epg-list");
    if (!epgList) return;

    const epgHTML = epgData.map(program => {
      const startTime = new Date(program.start * 1000).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      const endTime = new Date(program.end * 1000).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      
      return `
        <div class="epg-item">
          <span class="epg-time">${startTime} - ${endTime}</span>
          <span class="epg-title">${program.title || "No Title"}</span>
        </div>
      `;
    }).join("");

    epgList.innerHTML = epgHTML;
  };

  // ===== RENDER DEFAULT EPG (No Data Available) =====
  const renderDefaultEPG = (channelName) => {
    const epgList = qs(".epg-list");
    if (!epgList) return;

    const now = new Date();
    const programs = [];
    
    // Generate fake schedule for demo
    for (let i = 0; i < 8; i++) {
      const startTime = new Date(now.getTime() + (i * 60 * 60 * 1000));
      const endTime = new Date(startTime.getTime() + (60 * 60 * 1000));
      
      programs.push({
        start: startTime.getTime() / 1000,
        end: endTime.getTime() / 1000,
        title: `${channelName} Program ${i + 1}`
      });
    }

    renderEPGList(programs);
  };


  // ===== TOGGLE FAVORITE =====
  const toggleFavorite = (channelData) => {
    const result = window.toggleFavoriteItem(channelData, "favoritesLiveTV");
    
    // Update heart button UI
    const card = qs(`.channel-card[data-stream-id="${channelData.stream_id}"]`);
    if (card) {
      const favBtn = card.querySelector(".favorite-btn");
      if (favBtn) {
        const svg = favBtn.querySelector("svg path");
        if (svg) {
          svg.setAttribute("fill", result.isFav ? "red" : "none");
        }
      }
    }
    
    // Show toast notification
    if (typeof Toaster !== "undefined" && typeof Toaster.showToast === "function") {
      Toaster.showToast(
        result.isFav ? "success" : "error",
        `Channel ${result.isFav ? "added to" : "removed from"} favorites`
      );
    }
    
    return result;
  };

  // ===== ADD TO HISTORY =====
  const addItemToHistory = (item, historyKey) => {
    if (typeof window.addItemToHistory === "function") {
      window.addItemToHistory(item, historyKey);
    }
  };



// ===== RENDER CHANNELS =====
  const renderChannels = () => {
    const filtered = getFilteredCategories();
    
    // Find selected category
    let selectedCat = filtered.find((c) => c.category_id === selectedCategoryId);
    if (!selectedCat) {
      selectedCat = filtered[0];
      selectedCategoryId = selectedCat.category_id;
    }

    // Get channels for selected category
    const allChannels = selectedCat.channels || [];
    
    // Apply pagination
    const channelsToShow = allChannels.slice(0, currentChunk * pageSize);
    
    // Update channel grid
    const channelGrid = qs(".channel-grid");
    if (!channelGrid) return;

    if (channelsToShow.length === 0) {
      channelGrid.innerHTML = `
        <div class="no-channels">
          <p>No channels found in this category</p>
        </div>`;
      return;
    }

    // Build channel cards HTML
    const channelCardsHTML = channelsToShow.map(ch => {
      const isFav = window.isItemFavoriteForPlaylist ? 
        window.isItemFavoriteForPlaylist(ch, "favoritesLiveTV") : false;
      
      return `
        <div class="channel-card" 
             data-stream-id="${ch.stream_id}" 
             data-name="${ch.name}" 
             data-logo="${ch.stream_icon }">
          <div class="channel-card-header">
            <img src="${ch.stream_icon }" 
                 class="channel-logo" 
                 alt="${ch.name}"
                 onerror="this.src='/assets/profile.png'" />
            <button class="favorite-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="${isFav ? 'red' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          </div>
          <div class="channel-name">${ch.name}</div>
        </div>
      `;
    }).join("");

    channelGrid.innerHTML = channelCardsHTML;
  };

  // ===== RENDER SIDEBAR CATEGORIES =====
  const renderSidebarCategories = () => {
    const filtered = getFilteredCategories();
    
    const categoriesHTML = filtered.map(c => {
      const isActive = c.category_id === selectedCategoryId;
      return `
        <div class="sidebar-item ${isActive ? 'sidebar-active' : ''}" 
             data-category-id="${c.category_id}">
          <span class="sidebar-item-name">${c.category_name}</span>
          <span class="sidebar-item-count">${c.channels ? c.channels.length : 0}</span>
        </div>
      `;
    }).join("");

    const sidebarArea = qs("#sidebar-area");
    if (sidebarArea) {
      sidebarArea.innerHTML = `
        <div class="sidebar-content">
          <div class="sidebar-search-box">
            <input type="text" class="sidebar-search-input" placeholder="Search Categories" />
            <i class="fa fa-search"></i>
          </div>
          <div class="sidebar-items">
            ${categoriesHTML}
          </div>
        </div>
      `;
    }
  };






  // CLICK HANDLER
 // ===== CLICK HANDLER (UPDATED) =====
  function handleClick(e) {
    if (localStorage.getItem("currentPage") !== "liveTvPage") return;

    // Channel card click
    const card = e.target.closest(".channel-card");
    if (card) {
      const streamId = card.dataset.streamId;
      const channelName = card.dataset.name;
      const channelLogo = card.dataset.logo;
      
      const channelData = allStreams.find(ch => ch.stream_id == streamId);
      
      if (channelData) {
        playChannel(channelData);
      }
      return;
    }

    // Favorite button click
    const favBtn = e.target.closest(".favorite-btn");
    if (favBtn) {
      e.stopPropagation();
      const card = favBtn.closest(".channel-card");
      const streamId = card.dataset.streamId;
      const channelData = allStreams.find(ch => ch.stream_id == streamId);
      
      if (channelData) {
        toggleFavorite(channelData);
        
        // Re-render if in favorites category and removed
        if (selectedCategoryId === "favorites") {
          setTimeout(() => {
            renderChannels();
            renderSidebarCategories();
            
            // Restore focus
            const channels = qsa(".channel-card");
            if (channels.length > 0) {
              focusedChannelIndex = Math.min(focusedChannelIndex, channels.length - 1);
              setFocus(channels, focusedChannelIndex, "channel-card-focused");
            }
          }, 100);
        }
      }
      return;
    }

    // Sidebar category click
    const sidebarItem = e.target.closest(".sidebar-item");
    if (sidebarItem) {
      const catId = sidebarItem.dataset.categoryId;
      selectedCategoryId = catId;
      currentChunk = 1;
      focusedChannelIndex = 0;
      
      renderChannels();
      renderSidebarCategories();
      
      setTimeout(() => {
        const channels = qsa(".channel-card");
        if (channels.length > 0) {
          setFocus(channels, 0, "channel-card-focused");
          inChannelGrid = true;
          inSidebar = false;
        }
      }, 50);
      return;
    }

    // EPG item click
    const epgItem = e.target.closest(".epg-item");
    if (epgItem) {
      const list = qsa(".epg-item");
      focusedEPGIndex = list.indexOf(epgItem);
      setEPGFocus(focusedEPGIndex);
      console.log("EPG item clicked:", epgItem.innerText);
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
 // Handle back button
    if (backKeys.includes(e.key) || backKeys.includes(e.keyCode)) {
      // Check if in fullscreen first
      if (document.fullscreenElement || 
          document.webkitFullscreenElement || 
          document.mozFullScreenElement ||
          document.msFullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
        e.preventDefault();
        return;
      }
      
      // Dispose player and navigate back
      disposeLivePlayer();
      
      if (window.livePlayer) {
        try {
          window.livePlayer.dispose();
        } catch {}
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
        qs(".live-video-player-div").classList.remove("video-focused");
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
        sidebarItems[focusedSidebarIndex].click();
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
        const cols = 5;
        
        if (focusedChannelIndex + cols < channels.length) {
          // Normal down navigation
          focusedChannelIndex += cols;
          setFocus(channels, focusedChannelIndex, "channel-card-focused");
        } else {
          // At bottom row - check if we can load more
          const filtered = getFilteredCategories();
          const selectedCat = filtered.find(c => c.category_id === selectedCategoryId);
          
          if (selectedCat && currentChunk * pageSize < selectedCat.channels.length) {
            // Load more channels
            currentChunk++;
            renderChannels();
            
            setTimeout(() => {
              const updatedChannels = qsa(".channel-card");
              if (focusedChannelIndex + cols < updatedChannels.length) {
                focusedChannelIndex += cols;
                setFocus(updatedChannels, focusedChannelIndex, "channel-card-focused");
              }
            }, 100);
          } else {
            // No more channels, go to EPG
            inChannelGrid = false;
            inEPG = true;
            focusedEPGIndex = 0;
            channels.forEach(c => c.classList.remove("channel-card-focused"));
            const epgItems = qsa(".epg-item");
            if (epgItems.length) {
              epgItems[0].classList.add("epg-focused");
              epgItems[0].scrollIntoView({ block: "nearest" });
            }
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
    // const categoriesData = [
    //   { name: "Favorite Channels", count: 46 },
    //   { name: "Channels History", count: 245 },
    //   { name: "English Channels", count: 4 },
    //   { name: "Sports Channels", count: 10 },
    //   { name: "French Channels", count: 34 }
    // ];

    // ===== INITIALIZE PAGE =====
    // Render sidebar categories
    renderSidebarCategories();
    
    // Render channels
    renderChannels();

    // Set initial focus on first channel
    setTimeout(() => {
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
    }, 50);

    // document.querySelector("#sidebar-area").innerHTML =
    //   SidebarCategories(categoriesData);

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
      
      // Dispose video player
      disposeLivePlayer();
      
      // Call LiveVideoJsComponent cleanup if it exists
      if (typeof LiveVideoJsComponent !== "undefined" && typeof LiveVideoJsComponent.cleanup === "function") {
        try {
          LiveVideoJsComponent.cleanup();
        } catch (err) {
          console.warn("LiveVideoJsComponent cleanup error:", err);
        }
      }
      
      // Fallback cleanup for window.livePlayer
      if (window.livePlayer) {
        try {
          window.livePlayer.dispose();
        } catch {}
        window.livePlayer = null;
      }
    };
// ===== SEARCH INPUT HANDLER =====
    const headerSearchInput = qs(".search-input");
    if (headerSearchInput) {
      headerSearchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value;
        currentChunk = 1;
        
        renderChannels();
        
        setTimeout(() => {
          const channels = qsa(".channel-card");
          if (channels.length > 0) {
            focusedChannelIndex = 0;
            if (inChannelGrid) {
              setFocus(channels, 0, "channel-card-focused");
            }
          }
        }, 100);
      });
    }

    const sidebarSearchInput = qs(".sidebar-search-input");
    if (sidebarSearchInput) {
      sidebarSearchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = getFilteredCategories();
        
        const matchingCategories = filtered.filter(c => 
          c.category_name.toLowerCase().includes(query)
        );
        
        const sidebarItems = qs(".sidebar-items");
        if (sidebarItems) {
          sidebarItems.innerHTML = matchingCategories.map(c => {
            const isActive = c.category_id === selectedCategoryId;
            return `
              <div class="sidebar-item ${isActive ? 'sidebar-active' : ''}" 
                   data-category-id="${c.category_id}">
                <span class="sidebar-item-name">${c.category_name}</span>
                <span class="sidebar-item-count">${c.channels ? c.channels.length : 0}</span>
              </div>
            `;
          }).join("");
        }
      });
    }




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
        <!-- Channels will be rendered dynamically by renderChannels() -->
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
             Select a channel to view the program schedule
            </div>
          
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`;
}