
// Add this BEFORE or AFTER your LiveTvPage function
window.addItemToHistory = (item, historyKey) => {
  const playlistsData = JSON.parse(localStorage.getItem("playlistsData"));
  const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist"));
  
  const currentPlaylist = playlistsData.find(
    pl => pl.playlistName === selectedPlaylist.playlistName
  );
  
  if (!currentPlaylist) return;
  
  // Initialize history array if it doesn't exist
  if (!currentPlaylist[historyKey]) {
    currentPlaylist[historyKey] = [];
  }
  
  // Remove item if it already exists (to avoid duplicates)
  const existingIndex = currentPlaylist[historyKey].findIndex(
    h => (typeof h === 'object' ? h.stream_id : h) === item.stream_id
  );
  
  if (existingIndex > -1) {
    currentPlaylist[historyKey].splice(existingIndex, 1);
  }
  
  // Add item to the beginning of the history array
  const historyItem = {
    stream_id: item.stream_id,
    name: item.name,
    stream_icon: item.stream_icon,
    stream_type: item.stream_type,
    category_id: item.category_id,
    addedAt: new Date().toISOString()
  };
  
  currentPlaylist[historyKey].unshift(historyItem);
  
  // Limit history to last 50 items
  if (currentPlaylist[historyKey].length > 50) {
    currentPlaylist[historyKey] = currentPlaylist[historyKey].slice(0, 50);
  }
  
  // Save back to localStorage
  localStorage.setItem("playlistsData", JSON.stringify(playlistsData));
  
  console.log("✅ Added to history:", item.name);
  
  // **TRIGGER SIDEBAR UPDATE IF ON LIVE TV PAGE**
  if (localStorage.getItem("currentPage") === "liveTvPage") {
    // Find and call renderSidebarCategories if it exists
    const sidebarArea = document.querySelector("#sidebar-area");
    if (sidebarArea) {
      // This will be called from within LiveTvPage context
      // We'll add a global reference to renderSidebarCategories
      if (window.updateLiveTvSidebar) {
        window.updateLiveTvSidebar();
      }
    }
  }
};

function LiveTvPage() {
  // ===== API DATA (NEW) =====
  const categories = window.liveCategories || [];
  const allStreams = window.allLiveStreams || [];


  console.log('====================================');
  console.log("allStreams" , allStreams);
  console.log('====================================');

// ===== HELPER: Get Filtered Categories =====
const getFilteredCategories = () => {
  try {
    const currentPlaylistName = JSON.parse(
      localStorage.getItem("selectedPlaylist")
    )?.playlistName;
    
    if (!currentPlaylistName) {
      console.error("❌ No playlist name found");
      return [];
    }
    
    const playlistsData = JSON.parse(localStorage.getItem("playlistsData"));
    if (!playlistsData) {
      console.error("❌ No playlists data found");
      return [];
    }
    
    const currentPlaylist = playlistsData.find((pl) => pl.playlistName === currentPlaylistName);
    if (!currentPlaylist) {
      console.error("❌ Current playlist not found");
      return [];
    }

    const updatedFavorites = currentPlaylist.favoritesLiveTV || [];
    const channelHistory = currentPlaylist.ChannelListLive || [];
    
    // **CRITICAL: Get streams from multiple sources**
    const streams = window.currentAllStreams || allStreams || window.allLiveStreams || [];
    
    console.log("🔍 Streams available:", streams.length);
    
    if (streams.length === 0) {
      console.warn("⚠️ No streams available in getFilteredCategories");
    }
    
    // **SAFE MAPPING**
    const filteredCategories = (categories || window.liveCategories || []).map(c => {
      let categoryChannels = [];
      
      try {
        categoryChannels = streams.filter(s => s.category_id === c.category_id) || [];
        
        if (searchQuery.trim() && selectedCategoryId === c.category_id) {
          categoryChannels = categoryChannels.filter(ch => 
            (ch.name || "").toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
      } catch (err) {
        console.error("Error filtering category channels:", err);
      }
      
      return {
        ...c,
        channels: categoryChannels
      };
    });

    const allLiveStreams = searchQuery.trim() && selectedCategoryId === "All" 
      ? streams.filter(ch => 
          (ch.name || "").toLowerCase().includes(searchQuery.toLowerCase())
        )
      : streams;

    console.log("🔍 Processing favorites:", updatedFavorites.length);
    
    // **SAFE FAVORITES MAPPING**
    const favoritesChannels = (updatedFavorites || []).map(favItem => {
      try {
        if (typeof favItem === 'number') {
          return streams.find(s => s.stream_id === favItem) || { stream_id: favItem, name: 'Unknown', stream_icon: '/assets/profile.png' };
        }
        if (!favItem.stream_icon) {
          const fullData = streams.find(s => s.stream_id === favItem.stream_id);
          return fullData || favItem;
        }
        return favItem;
      } catch (err) {
        console.error("Error mapping favorite:", err, favItem);
        return favItem;
      }
    }).filter(ch => {
      if (!searchQuery.trim() || selectedCategoryId !== "favorites") return true;
      return (ch.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    });
    
    console.log("🔍 Processing history:", channelHistory.length);
    
    // **SAFE HISTORY MAPPING**
    const historyChannels = (channelHistory || []).map(histItem => {
      try {
        if (typeof histItem === 'number') {
          return streams.find(s => s.stream_id === histItem) || { stream_id: histItem, name: 'Unknown', stream_icon: '/assets/profile.png' };
        }
        if (!histItem.stream_icon) {
          const fullData = streams.find(s => s.stream_id === histItem.stream_id);
          return fullData || histItem;
        }
        return histItem;
      } catch (err) {
        console.error("Error mapping history item:", err, histItem);
        return histItem;
      }
    }).filter(ch => {
      if (!searchQuery.trim() || selectedCategoryId !== "channelHistory") return true;
      return (ch.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    });

    const result = [
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
    
    console.log("✅ getFilteredCategories result:", result.length, "categories");
    return result;
    
  } catch (error) {
    console.error("❌ ERROR in getFilteredCategories:", error);
    console.error("Stack:", error.stack);
    return [
      {
        category_id: "All",
        category_name: "All",
        channels: []
      }
    ];
  }
};


  
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
  let currentAspectRatio = "contain";
  let inAspectRatioBtn = false;
  let isHeaderSearchActive = false;
let isSidebarSearchActive = false;
let inFavoriteBtn = false; // ADD THIS LINE
let inRemoveHistoryBtn = false; // ADD THIS



  // Add this at the TOP of your LiveTvPage function (after the state variables)


  // ===== VIDEO ASPECT RATIO MANAGER =====
// ===== VIDEO ASPECT RATIO MANAGER =====
// ===== VIDEO ASPECT RATIO MANAGER =====
window.VideoAspectRatio = {
  ratios: ['16:9', '4:3', '2.35:1'],
  classes: ['video-aspect-169', 'video-aspect-43', 'video-aspect-235'],
  currentIndex: 0,
  overlayTimeout: null,
  
  initialize(videoElement) {
    this.currentIndex = 0; // Start with 16:9
    this.apply(videoElement, 0);
  },
  
  apply(videoElement, index) {
    if (!videoElement) return;
    
    // Remove all aspect ratio classes
    this.classes.forEach(cls => videoElement.classList.remove(cls));
    
    // Add the selected class
    videoElement.classList.add(this.classes[index]);
  },
  
  cycle(videoElement) {
    this.currentIndex = (this.currentIndex + 1) % this.ratios.length;
    this.apply(videoElement, this.currentIndex);
    return this.ratios[this.currentIndex];
  },
  
  getCurrentRatio() {
    return this.ratios[this.currentIndex];
  },
  
  showOverlay(message) {
    // Remove existing overlay
    const existingOverlay = document.querySelector('.aspect-ratio-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }
    
    // Create new overlay
    const overlay = document.createElement('div');
    overlay.className = 'aspect-ratio-overlay';
    overlay.textContent = message;
    overlay.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 30px 60px;
      border-radius: 12px;
      font-size: 32px;
      font-weight: bold;
      z-index: 10000;
      pointer-events: none;
      border: 4px solid #0ea5e9;
      box-shadow: 0 0 30px rgba(14, 165, 233, 0.5);
    `;
    
    document.body.appendChild(overlay);
    
    // Clear existing timeout
    if (this.overlayTimeout) {
      clearTimeout(this.overlayTimeout);
    }
    
    // Auto-remove after 2 seconds
    this.overlayTimeout = setTimeout(() => {
      overlay.remove();
    }, 2000);
  }
};
// ===== SIMPLE VIDEO PLAYER (TEMPORARY) =====
// Find this function and replace it:
const SimpleVideoPlayer = (streamId, streamUrl, logo, height, channelName) => {
  return `
    <div class="live-video-player-div" style="height: ${height}; position: relative; background: #000; box-sizing: border-box; display: flex; align-items: center; justify-content: center;">
      <video 
        id="live-video-player" 
        class="video-js vjs-default-skin video-aspect-169" 
        controls 
        autoplay
        preload="auto"
        data-stream-id="${streamId}"
        poster="${logo}"
        style="display: block;"
      >
        <source src="${streamUrl}" type="application/x-mpegURL">
      </video>
      
      <div class="video-overlay-info" style="position: absolute; top: 10px; left: 10px; color: white; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px; z-index: 999;">
        <h3 style="margin: 0; font-size: 16px;">${channelName}</h3>
      </div>

      <!-- ASPECT RATIO BUTTON -->
      <button id="videojs-aspect-ratio" class="aspect-ratio-btn" style="position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%); background: rgba(255, 165, 0, 0.9); color: white; border: none; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; z-index: 1000; min-width: 200px; text-align: center;">
        <span style="margin-right: 8px;">⛶</span><span class="aspect-label">16:9</span>
      </button>

      <!-- PLAY/PAUSE BUTTON with SVG Icons -->
      <button class="play-pause-btn" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.85); color: white; border: 4px solid #0ea5e9; width: 90px; height: 90px; border-radius: 50%; cursor: pointer; z-index: 9999; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; box-shadow: 0 0 20px rgba(14, 165, 233, 0.5);">
        <svg class="pause-icon" width="45" height="45" viewBox="0 0 24 24" fill="white" style="display: block;">
          <rect x="6" y="4" width="4" height="16" rx="1"/>
          <rect x="14" y="4" width="4" height="16" rx="1"/>
        </svg>
      </button>

      <div class="live-video-loader hidden" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 998;">
        <div class="spinner"></div>
      </div>
    </div>
  `;
};

const togglePlayPause = () => {
  const videoEl = document.getElementById("live-video-player");
  const playPauseBtn = document.querySelector(".play-pause-btn");
  
  if (!videoEl || !playPauseBtn) return;
  
  // SVG for Play icon
  const playIconSVG = `
    <svg class="play-icon" width="45" height="45" viewBox="0 0 24 24" fill="white">
      <path d="M8 5v14l11-7z"/>
    </svg>
  `;
  
  // SVG for Pause icon
  const pauseIconSVG = `
    <svg class="pause-icon" width="45" height="45" viewBox="0 0 24 24" fill="white">
      <rect x="6" y="4" width="4" height="16" rx="1"/>
      <rect x="14" y="4" width="4" height="16" rx="1"/>
    </svg>
  `;
  
  if (videoEl.paused) {
    videoEl.play();
    playPauseBtn.innerHTML = pauseIconSVG;
    playPauseBtn.style.opacity = "1";
    
    // Hide after 1.5 seconds
    setTimeout(() => {
      if (!videoEl.paused) {
        playPauseBtn.style.opacity = "0";
        setTimeout(() => {
          playPauseBtn.style.display = "none";
        }, 300);
      }
    }, 1500);
  } else {
    videoEl.pause();
    playPauseBtn.style.display = "flex";
    playPauseBtn.style.opacity = "1";
    playPauseBtn.innerHTML = playIconSVG;
  }
};


// Add this function after SimpleVideoPlayer:
const toggleAspectRatio = () => {
  const videoEl = document.getElementById("live-video-player");
  const aspectBtn = document.querySelector(".aspect-ratio-btn");
  const aspectLabel = aspectBtn?.querySelector(".aspect-label");
  
  if (!videoEl || !aspectBtn || !window.VideoAspectRatio) return;
  
  // Cycle to next aspect ratio
  const newLabel = window.VideoAspectRatio.cycle(videoEl);
  
  // Update button label to show current selection
  if (aspectLabel && newLabel) {
    aspectLabel.textContent = newLabel;
  }
  
  // Show large overlay notification in center of screen
  window.VideoAspectRatio.showOverlay(newLabel);
  
  console.log("✅ Aspect ratio changed to:", newLabel);
};

// ===== HELPER: Get Filtered Categories =====
// ===== HELPER: Get Filtered Categories =====


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
    searchInput.blur(); // Keep blurred initially
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


  // Helper to set focus on favorite button
const setFavoriteBtnFocus = (active) => {
  const channels = qsa(".channel-card");
  const card = channels[focusedChannelIndex];
  if (!card) return;
  
  const favBtn = card.querySelector(".favorite-btn");
  if (active) {
    favBtn.style.outline = "3px solid #0ea5e9";
    favBtn.style.outlineOffset = "2px";
    favBtn.scrollIntoView({ block: "nearest", inline: "nearest" });
  } else {
    favBtn.style.outline = "none";
  }
};


// Helper to set focus on remove history button
const setRemoveHistoryBtnFocus = (active) => {
  const channels = qsa(".channel-card");
  const card = channels[focusedChannelIndex];
  if (!card) return;
  
  const removeBtn = card.querySelector(".remove-history-btn");
  if (active && removeBtn) {
    removeBtn.style.outline = "3px solid #0ea5e9";
    removeBtn.style.outlineOffset = "2px";
    removeBtn.scrollIntoView({ block: "nearest", inline: "nearest" });
  } else if (removeBtn) {
    removeBtn.style.outline = "none";
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
      
   if (selectedCategoryId !== "channelHistory") {
  const streams = window.currentAllStreams || allStreams || window.allLiveStreams || [];
  const selectedChannelItem = streams.find(
    (item) => item.stream_id == channelData.stream_id
  );
  if (selectedChannelItem && typeof window.addItemToHistory === "function") {
    window.addItemToHistory(selectedChannelItem, "ChannelListLive");
  }
}

    // Initialize Video.js if available
// Find this section in playChannel function (around line 400)
// REPLACE the entire setTimeout block with this:

setTimeout(() => {
  const videoEl = document.getElementById("live-video-player");
  const playPauseBtn = document.querySelector(".play-pause-btn");
  const aspectBtn = document.querySelector(".aspect-ratio-btn");
  
  if (videoEl && typeof videojs !== "undefined") {
    window.livePlayer = videojs(videoEl, {
      controls: true,
      autoplay: true,
      preload: "auto",
      fluid: true
    });
    
    // Initialize aspect ratio to default (16:9)
    if (window.VideoAspectRatio) {
      window.VideoAspectRatio.initialize(videoEl);
    }
    
    window.livePlayer.on("waiting", () => {
      qs(".live-video-loader")?.classList.remove("hidden");
    });
    
    window.livePlayer.on("playing", () => {
      qs(".live-video-loader")?.classList.add("hidden");
    });
    
    window.livePlayer.on("error", (e) => {
      console.error("❌ Player error:", e);
    });
    
    // Play/Pause button event listeners
    if (playPauseBtn) {
      // SVG icon definitions
      const playIconSVG = `
        <svg class="play-icon" width="45" height="45" viewBox="0 0 24 24" fill="white">
          <path d="M8 5v14l11-7z"/>
        </svg>
      `;
      
      const pauseIconSVG = `
        <svg class="pause-icon" width="45" height="45" viewBox="0 0 24 24" fill="white">
          <rect x="6" y="4" width="4" height="16" rx="1"/>
          <rect x="14" y="4" width="4" height="16" rx="1"/>
        </svg>
      `;
      
      // Show button initially then hide
      playPauseBtn.style.display = "flex";
      playPauseBtn.style.opacity = "1";
      setTimeout(() => {
        playPauseBtn.style.opacity = "0";
        setTimeout(() => {
          playPauseBtn.style.display = "none";
        }, 300);
      }, 2000);
      
      videoEl.addEventListener("pause", () => {
        playPauseBtn.style.display = "flex";
        playPauseBtn.style.opacity = "1";
        playPauseBtn.innerHTML = playIconSVG;
      });
      
      videoEl.addEventListener("play", () => {
        playPauseBtn.style.display = "flex";
        playPauseBtn.style.opacity = "1";
        playPauseBtn.innerHTML = pauseIconSVG;
        setTimeout(() => {
          if (!videoEl.paused) {
            playPauseBtn.style.opacity = "0";
            setTimeout(() => {
              playPauseBtn.style.display = "none";
            }, 300);
          }
        }, 1500);
      });
      
      playPauseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        togglePlayPause();
      });
      
      // Click on video to toggle play/pause and show button
      videoEl.addEventListener("click", (e) => {
        e.stopPropagation();
        playPauseBtn.style.display = "flex";
        togglePlayPause();
      });
    }
    
    // Aspect ratio button event listener
    if (aspectBtn) {
      const aspectLabel = aspectBtn.querySelector(".aspect-label");
      
      // Set initial aspect ratio label
      if (aspectLabel && window.VideoAspectRatio) {
        aspectLabel.textContent = window.VideoAspectRatio.getCurrentRatio();
      }
      
      aspectBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleAspectRatio();
      });
    }
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

window.isItemFavoriteForPlaylist = (item, favoriteKey) => {
  const playlistsData = JSON.parse(localStorage.getItem("playlistsData"));
  const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist"));
  
  const currentPlaylist = playlistsData.find(
    pl => pl.playlistName === selectedPlaylist.playlistName
  );
  
  if (!currentPlaylist || !currentPlaylist[favoriteKey]) {
    return false;
  }
  
  // Check if stream_id exists (works for both objects and IDs)
  return currentPlaylist[favoriteKey].some(fav => 
    (typeof fav === 'object' ? fav.stream_id : fav) === item.stream_id
  );
};

  // ===== UPDATE EPG (Program Guide) =====
const updateEPG = (channelData) => {
  const epgList = qs(".epg-list");
  const epgChannelLogo = qs(".epg-channel-logo");
  const epgFavoriteBtn = qs(".epg-favorite-btn");
  
  if (!epgList) return;

  // Update channel logo
  if (epgChannelLogo) {
    epgChannelLogo.src = channelData.stream_icon || channelData.logo || "/assets/channel.png";
    epgChannelLogo.alt = channelData.name || "Channel";
  }

  // Update favorite button state
  if (epgFavoriteBtn) {
    const isFav = window.isItemFavoriteForPlaylist ? 
      window.isItemFavoriteForPlaylist(channelData, "favoritesLiveTV") : false;
    
    const svg = epgFavoriteBtn.querySelector("svg path");
    if (svg) {
      svg.setAttribute("fill", isFav ? "red" : "none");
    }
    
    // Add click handler for favorite button
    epgFavoriteBtn.onclick = () => {
      const result = window.toggleFavoriteItem(channelData, "favoritesLiveTV");
      const svg = epgFavoriteBtn.querySelector("svg path");
      if (svg) {
        svg.setAttribute("fill", result.isFav ? "red" : "none");
      }
      
      if (typeof Toaster !== "undefined" && typeof Toaster.showToast === "function") {
        Toaster.showToast(
          result.isFav ? "success" : "error",
          `Channel ${result.isFav ? "added to" : "removed from"} favorites`
        );
      }
    };
  }

  // Show loading state
  epgList.innerHTML = `
    <div class="epg-item">
      <span class="epg-title">Loading EPG...</span>
    </div>
  `;

  // Fetch real EPG data from API
  const streamId = channelData.stream_id;
  
  if (streamId && typeof getLiveStreamEpg === "function") {
    getLiveStreamEpg(streamId).then((data) => {
      const epgData = data.epg_listings || [];
      
      if (epgData.length > 0) {
        renderEPGList(epgData);
      } else {
        epgList.innerHTML = `
          <div class="epg-item">
            <span class="epg-title">No EPG data available</span>
          </div>
        `;
      }
    }).catch(() => {
      epgList.innerHTML = `
        <div class="epg-item">
          <span class="epg-title">Failed to load EPG</span>
        </div>
      `;
    });
  }
};

  // ===== RENDER EPG LIST =====
const renderEPGList = (epgData) => {
  const epgList = qs(".epg-list");
  if (!epgList) return;

  const currentPlaylistName = JSON.parse(localStorage.getItem("selectedPlaylist")).playlistName;
  const currentPlaylist = JSON.parse(localStorage.getItem("playlistsData")).find(pl => pl.playlistName === currentPlaylistName);
  const timeFormat = currentPlaylist.timeFormat || '12hrs';

  const epgHTML = epgData.map(program => {
    const startTime = formatTime(program.start, timeFormat);
    const endTime = formatTime(program.end, timeFormat);
    const title = decodeBase64(program.title) || "Untitled";
    
    return `
      <div class="epg-item">
        <span class="epg-time">${startTime} - ${endTime}</span>
        <span class="epg-title">${title}</span>
      </div>
    `;
  }).join("");

  epgList.innerHTML = epgHTML;
};

// Helper functions (copy from LiveVideoJsComponent)
function formatTime(dateStr, format) {
  let date;
  if (!isNaN(dateStr)) {
    const ts = dateStr.toString().length === 10 ? dateStr * 1000 : dateStr;
    date = new Date(parseInt(ts));
  } else {
    date = new Date(dateStr);
  }
  if (isNaN(date)) return dateStr;

  const options = format === "12hrs"
    ? { hour: "numeric", minute: "2-digit", hour12: true }
    : { hour: "2-digit", minute: "2-digit", hour12: false };

  return new Intl.DateTimeFormat(undefined, options).format(date);
}

function decodeBase64(str) {
  try {
    if (!str) return "";
    return decodeURIComponent(escape(window.atob(str)));
  } catch (e) {
    return str;
  }
}

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

window.toggleFavoriteItem = (item, favoriteKey) => {
  const playlistsData = JSON.parse(localStorage.getItem("playlistsData"));
  const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist"));
  
  const currentPlaylist = playlistsData.find(
    pl => pl.playlistName === selectedPlaylist.playlistName
  );
  
  if (!currentPlaylist[favoriteKey]) {
    currentPlaylist[favoriteKey] = [];
  }
  
  const index = currentPlaylist[favoriteKey].findIndex(
    fav => (typeof fav === 'object' ? fav.stream_id : fav) === item.stream_id
  );
  
  let isFav;
  if (index > -1) {
    currentPlaylist[favoriteKey].splice(index, 1);
    isFav = false;
  } else {
    // Store the FULL item object with all properties
    const fullItem = {
      stream_id: item.stream_id,
      name: item.name,
      stream_icon: item.stream_icon,  // Make sure this is included
      stream_type: item.stream_type,
      category_id: item.category_id,
      // Add any other properties you need
    };
    currentPlaylist[favoriteKey].push(fullItem);
    isFav = true;
  }
  
  localStorage.setItem("playlistsData", JSON.stringify(playlistsData));
  
  return { isFav, item };
};

  // ===== TOGGLE FAVORITE =====
 // ===== TOGGLE FAVORITE =====
const toggleFavorite = (channelData) => {
  console.log("toggleFavorite called with:", channelData);

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
  
  // **UPDATE SIDEBAR COUNTS IMMEDIATELY**
  renderSidebarCategories();
  
  // Show toast notification
  if (typeof Toaster !== "undefined" && typeof Toaster.showToast === "function") {
    Toaster.showToast(
      result.isFav ? "success" : "error",
      `Channel ${result.isFav ? "added to" : "removed from"} favorites`
    );
  }
  
  return result;
};



// Add this function after toggleFavorite
const removeFromHistory = (channelData) => {
  const playlistsData = JSON.parse(localStorage.getItem("playlistsData"));
  const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist"));
  
  const currentPlaylist = playlistsData.find(
    pl => pl.playlistName === selectedPlaylist.playlistName
  );
  
  if (!currentPlaylist || !currentPlaylist.ChannelListLive) return;
  
  const index = currentPlaylist.ChannelListLive.findIndex(
    h => (typeof h === 'object' ? h.stream_id : h) === channelData.stream_id
  );
  
  if (index > -1) {
    currentPlaylist.ChannelListLive.splice(index, 1);
    localStorage.setItem("playlistsData", JSON.stringify(playlistsData));
    
    // Update UI
    renderChannels();
    renderSidebarCategories();
    
    // Refocus
    const channels = qsa(".channel-card");
    if (channels.length > 0) {
      focusedChannelIndex = Math.min(focusedChannelIndex, channels.length - 1);
      setFocus(channels, focusedChannelIndex, "channel-card-focused");
    }
    
    if (typeof Toaster !== "undefined" && typeof Toaster.showToast === "function") {
      Toaster.showToast("error", "Channel removed from history");
    }
  }
};


  // ===== ADD TO HISTORY =====
  const addItemToHistory = (item, historyKey) => {
    if (typeof window.addItemToHistory === "function") {
      window.addItemToHistory(item, historyKey);
    }
  };



// ===== RENDER CHANNELS =====
// ===== RENDER CHANNELS =====
const renderChannels = () => {
  const filtered = getFilteredCategories();
  
  let selectedCat = filtered.find((c) => c.category_id === selectedCategoryId);
  if (!selectedCat) {
    selectedCat = filtered[0];
    selectedCategoryId = selectedCat.category_id;
  }

  const allChannels = selectedCat.channels || [];
  const channelsToShow = allChannels.slice(0, currentChunk * pageSize);
  
  const channelGrid = qs(".channel-grid");
  if (!channelGrid) return;

  if (channelsToShow.length === 0) {
    channelGrid.innerHTML = `
      <div class="no-channels">
        <p>No channels found in this category</p>
      </div>`;
    return;
  }

  const currentPlaylistName = JSON.parse(localStorage.getItem("selectedPlaylist")).playlistName;
  const currentPlaylist = JSON.parse(localStorage.getItem("playlistsData")).find(
    pl => pl.playlistName === currentPlaylistName
  );
  const favoritesList = currentPlaylist?.favoritesLiveTV || [];
  
  // Check if we're in history view
  const isHistoryView = selectedCategoryId === "channelHistory";

  const channelCardsHTML = channelsToShow.map(ch => {
    const isFav = favoritesList.some(fav => 
      (typeof fav === 'object' ? fav.stream_id : fav) === ch.stream_id
    );
    
    return `
      <div class="channel-card" 
           data-stream-id="${ch.stream_id}" 
           data-name="${ch.name}" 
           data-logo="${ch.stream_icon}">
        <div class="channel-card-header">
          <img src="${ch.stream_icon}" 
               class="channel-logo" 
               alt="${ch.name}"
               onerror="this.src='/assets/profile.png'" />
          <div class="channel-actions">
            <button class="favorite-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="${isFav ? 'red' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            ${isHistoryView ? `
              <button class="remove-history-btn" title="Remove from history">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            ` : ''}
          </div>
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

window.updateLiveTvSidebar = renderSidebarCategories;





  // CLICK HANDLER
 // ===== CLICK HANDLER (UPDATED) =====
  function handleClick(e) {
    console.log("Click detected on:", e.target);
    if (localStorage.getItem("currentPage") !== "liveTvPage") return;


    // Remove from history button click
const removeHistoryBtn = e.target.closest(".remove-history-btn");
if (removeHistoryBtn) {
  e.stopPropagation();
  
  const card = removeHistoryBtn.closest(".channel-card");
  if (!card) return;
  
  const streamId = card.dataset.streamId;
  const channelData = allStreams.find(ch => ch.stream_id == streamId);
  
  if (channelData) {
    removeFromHistory(channelData);
  }
  return;
}
       // Check if click is on favorite button OR its children (svg/path)
const favBtn = e.target.closest(".favorite-btn");
const isFavClick = favBtn || e.target.closest("svg")?.parentElement?.classList.contains("favorite-btn");

if (favBtn || isFavClick) {
  e.stopPropagation();
  
  const targetBtn = favBtn || e.target.closest("svg").parentElement;
  const card = targetBtn.closest(".channel-card");
  
  if (!card) return;
  
  const streamId = card.dataset.streamId;
  const channelData = allStreams.find(ch => ch.stream_id == streamId);
  
  if (channelData) {
    toggleFavorite(channelData);
    
    if (selectedCategoryId === "favorites") {
      setTimeout(() => {
        renderChannels();
        renderSidebarCategories();
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


      const playPauseBtn = e.target.closest(".play-pause-btn");
  if (playPauseBtn) {
    e.stopPropagation();
    togglePlayPause();
    return;
  }


    const aspectBtn = e.target.closest(".aspect-ratio-btn");
if (aspectBtn) {
  e.stopPropagation();
  toggleAspectRatio();
  return;
}



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
   // Find the "If user is in video player area" section and REPLACE it with:

if (inVideoPlayer) {
  const videoDiv = qs(".live-video-player-div");
  const aspectBtn = qs(".aspect-ratio-btn");
  
  if (isUp) {
    inVideoPlayer = false;
    inChannelGrid = true;
    if (videoDiv) {
      videoDiv.classList.remove("video-focused");
      videoDiv.style.outline = "none";
      videoDiv.style.border = "none";
    }
    if (aspectBtn) aspectBtn.style.border = "none";
    focusedChannelIndex = 0;
    setFocus(channels, focusedChannelIndex, "channel-card-focused");
    e.preventDefault();
    return;
  }
  
   if (isDown) {
    // Go to aspect ratio button
    inVideoPlayer = false;
    inAspectRatioBtn = true;
    const videoDiv = qs(".live-video-player-div");
    const aspectBtn = qs("#videojs-aspect-ratio");
    if (videoDiv) videoDiv.style.outline = "none";
    if (aspectBtn) {
      aspectBtn.classList.add("videojs-aspect-ratio-btn-focused");
      aspectBtn.scrollIntoView({ block: "nearest" });
    }
    e.preventDefault();
    return;
  }
  
  
  if (isRight) {
    // Go to EPG list
    inVideoPlayer = false;
    inEPG = true;
    if (videoDiv) {
      videoDiv.classList.remove("video-focused");
      videoDiv.style.outline = "none";
      videoDiv.style.border = "none";
    }
    if (aspectBtn) aspectBtn.style.border = "none";
    focusedEPGIndex = 0;
    const epgItems = qsa(".epg-item");
    if (epgItems.length) {
      epgItems[0].classList.add("epg-focused");
      epgItems[0].scrollIntoView({ block: "nearest" });
    }
    e.preventDefault();
    return;
  }
  
  if (isEnter) {
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
  
  // SPACE or K key for play/pause
  if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'k' || e.key === 'K') {
    togglePlayPause();
    e.preventDefault();
    return;
  }
  
  return;
}

// Add new navigation section for Aspect Ratio Button
// Aspect ratio button navigation
// Aspect ratio button navigation
if (inAspectRatioBtn) {
  const aspectBtn = qs(".aspect-ratio-btn");
  
  if (isUp) {
    inAspectRatioBtn = false;
    inVideoPlayer = true;
    if (aspectBtn) aspectBtn.style.border = "none";
    const videoDiv = qs(".live-video-player-div");
    if (videoDiv) {
      videoDiv.style.outline = "4px solid #0ea5e9";
      videoDiv.style.outlineOffset = "-4px";
    }
    e.preventDefault();
    return;
  }
  
  if (isDown) {
    inAspectRatioBtn = false;
    inEPG = true;
    if (aspectBtn) aspectBtn.style.border = "none";
    focusedEPGIndex = 0;
    const epgItems = qsa(".epg-item");
    if (epgItems.length) {
      epgItems[0].classList.add("epg-focused");
    }
    e.preventDefault();
    return;
  }
  
  if (isEnter) {
    toggleAspectRatio();
    e.preventDefault();
    return;
  }
}

    // HEADER SEARCH BOX NAVIGATION
    if (inHeaderSearch) {

       if (isEnter) {
    isHeaderSearchActive = !isHeaderSearchActive;
    const searchInput = qs(".search-input");
    if (searchInput) {
      if (isHeaderSearchActive) {
        searchInput.focus();
        const textLength = searchInput.value.length;
        searchInput.setSelectionRange(textLength, textLength);
      } else {
        searchInput.blur();
      }
    }
    e.preventDefault();
    return;
  }
      // DOWN: Move to channel grid
     if (isDown) {
    inHeaderSearch = false;
    inSidebarSearch = true;
    isHeaderSearchActive = false;
    setHeaderSearchFocus(false);
    setSidebarSearchFocus(true);
    
    const headerInput = qs(".search-input");
    if (headerInput) {
      headerInput.blur();
      headerInput.selectionStart = headerInput.selectionEnd = 0;
    }
    
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
      // UP: Move to header search with cursor at end
  if (isUp) {
    inSidebarSearch = false;
    inHeaderSearch = true;
    isSidebarSearchActive = false;
    setSidebarSearchFocus(false);
    setHeaderSearchFocus(true);
    
    // Auto-enter edit mode with cursor at end
    setTimeout(() => {
      isHeaderSearchActive = true;
      const input = qs(".search-input");
      if (input) {
        input.focus();
        const textLength = input.value.length;
        input.setSelectionRange(textLength, textLength);
      }
    }, 0);
    
    e.preventDefault();
    return;
  }

  // DOWN: Move to first sidebar item
  if (isDown) {
    inSidebarSearch = false;
    inSidebar = true;
    isSidebarSearchActive = false;
    setSidebarSearchFocus(false);
    focusedSidebarIndex = 0;
    setSidebarFocus(focusedSidebarIndex);
    e.preventDefault();
    return;
  }

  // RIGHT: Go to channel grid (remove cursor)
  if (isRight) {
    inSidebarSearch = false;
    inChannelGrid = true;
    isSidebarSearchActive = false;
    setSidebarSearchFocus(false);
    
    const sidebarInput = qs(".sidebar-search-input");
    if (sidebarInput) {
      sidebarInput.blur();
      sidebarInput.selectionStart = sidebarInput.selectionEnd = 0;
    }
    
    setFocus(channels, focusedChannelIndex, "channel-card-focused");
    e.preventDefault();
    return;
  }

  // If in edit mode, allow typing
  if (isSidebarSearchActive) {
    return; // Allow typing
  }

  // LEFT: Stay in search box when not editing
  if (isLeft) {
    e.preventDefault();
    return;
  }

        if (isEnter) {
    isSidebarSearchActive = !isSidebarSearchActive;
    const searchInput = qs(".sidebar-search-input");
    if (searchInput) {
      if (isSidebarSearchActive) {
        searchInput.focus();
        const textLength = searchInput.value.length;
        searchInput.setSelectionRange(textLength, textLength);
      } else {
        searchInput.blur();
      }
    }
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
      // Go to aspect ratio button
      epgItems.forEach(item => item.classList.remove("epg-focused"));
      inEPG = false;
      inAspectRatioBtn = true;
      const aspectBtn = qs(".aspect-ratio-btn");
      if (aspectBtn) {
        aspectBtn.style.border = "3px solid #0ea5e9";
        aspectBtn.scrollIntoView({ block: "nearest" });
      }
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
  // Go to video player instead of channel grid
  epgItems.forEach(item => item.classList.remove("epg-focused"));
  inEPG = false;
  inVideoPlayer = true;
  const videoDiv = qs(".live-video-player-div");
  if (videoDiv) {
     videoDiv.classList.add("video-focused");
  videoDiv.style.border = "3px solid #0ea5e9"; // Blue border
  videoDiv.style.boxSizing = "border-box"; // Important: keeps border inside
  videoDiv.style.outline = "3px solid #0ea5e9"; // Add outline for full visibility
  videoDiv.style.outlineOffset = "-3px";
  }
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

    // FAVORITE BUTTON NAVIGATION
if (inFavoriteBtn) {
  const channels = qsa(".channel-card");
  const card = channels[focusedChannelIndex];
  const favBtn = card?.querySelector(".favorite-btn");
  const cols = 5;

  if (isLeft) {
    // Go back to channel card
    inFavoriteBtn = false;
    inChannelGrid = true;
    if (favBtn) favBtn.style.outline = "none";
    setFocus(channels, focusedChannelIndex, "channel-card-focused");
    e.preventDefault();
    return;
  }

 if (isRight) {
  const card = channels[focusedChannelIndex];
  const removeBtn = card?.querySelector(".remove-history-btn");
  
  // If remove button exists (in history view), go to it
  if (removeBtn && selectedCategoryId === "channelHistory") {
    inFavoriteBtn = false;
    inRemoveHistoryBtn = true;
    if (favBtn) favBtn.style.outline = "none";
    setRemoveHistoryBtnFocus(true);
    e.preventDefault();
    return;
  }
  
  // Otherwise, go to next channel card
  inFavoriteBtn = false;
  inChannelGrid = true;
  if (favBtn) favBtn.style.outline = "none";
  
  if (focusedChannelIndex < channels.length - 1) {
    focusedChannelIndex++;
  }
  setFocus(channels, focusedChannelIndex, "channel-card-focused");
  e.preventDefault();
  return;
}

  if (isEnter) {
    // Click the favorite button
    favBtn?.click();
    e.preventDefault();
    return;
  }

  // UP/DOWN: Navigate to adjacent rows while staying on favorite button
  if (isUp && focusedChannelIndex >= cols) {
    focusedChannelIndex -= cols;
    if (favBtn) favBtn.style.outline = "none";
    setFavoriteBtnFocus(true);
    e.preventDefault();
    return;
  }

 if (isDown) {
  inFavoriteBtn = false;
  inChannelGrid = true;
  if (favBtn) favBtn.style.outline = "none";
  
  const lastRowStart = Math.floor((channels.length - 1) / cols) * cols;
  
  if (focusedChannelIndex >= lastRowStart) {
    // In last row - go to video player
    channels.forEach(c => c.classList.remove("channel-card-focused"));
    inVideoPlayer = true;
    const videoDiv = qs(".live-video-player-div");
    if (videoDiv) {
      videoDiv.classList.add("video-focused");
      videoDiv.style.border = "3px solid #0ea5e9";
      videoDiv.style.boxSizing = "border-box";
      videoDiv.style.outline = "3px solid #0ea5e9";
      videoDiv.style.outlineOffset = "-3px";
    }
  } else {
    // Move to card below (not its heart)
    focusedChannelIndex += cols;
    setFocus(channels, focusedChannelIndex, "channel-card-focused");
  }
  e.preventDefault();
  return;
}

  return;
}


// REMOVE HISTORY BUTTON NAVIGATION
if (inRemoveHistoryBtn) {
  const channels = qsa(".channel-card");
  const card = channels[focusedChannelIndex];
  const removeBtn = card?.querySelector(".remove-history-btn");
  const cols = 5;

  if (isLeft) {
    // Go back to favorite button
    inRemoveHistoryBtn = false;
    inFavoriteBtn = true;
    if (removeBtn) removeBtn.style.outline = "none";
    setFavoriteBtnFocus(true);
    e.preventDefault();
    return;
  }

  if (isRight) {
    // Go to next channel card
    inRemoveHistoryBtn = false;
    inChannelGrid = true;
    if (removeBtn) removeBtn.style.outline = "none";
    
    if (focusedChannelIndex < channels.length - 1) {
      focusedChannelIndex++;
    }
    setFocus(channels, focusedChannelIndex, "channel-card-focused");
    e.preventDefault();
    return;
  }

  if (isEnter) {
    // Click the remove button
    removeBtn?.click();
    e.preventDefault();
    return;
  }

  // UP/DOWN: Navigate to adjacent rows while staying on remove button
  if (isUp && focusedChannelIndex >= cols) {
    focusedChannelIndex -= cols;
    if (removeBtn) removeBtn.style.outline = "none";
    setRemoveHistoryBtnFocus(true);
    e.preventDefault();
    return;
  }

  if (isDown) {
    inRemoveHistoryBtn = false;
    inChannelGrid = true;
    if (removeBtn) removeBtn.style.outline = "none";
    
    const lastRowStart = Math.floor((channels.length - 1) / cols) * cols;
    
    if (focusedChannelIndex >= lastRowStart) {
      // In last row - go to video player
      channels.forEach(c => c.classList.remove("channel-card-focused"));
      inVideoPlayer = true;
      const videoDiv = qs(".live-video-player-div");
      if (videoDiv) {
        videoDiv.classList.add("video-focused");
        videoDiv.style.border = "3px solid #0ea5e9";
        videoDiv.style.boxSizing = "border-box";
        videoDiv.style.outline = "3px solid #0ea5e9";
        videoDiv.style.outlineOffset = "-3px";
      }
    } else {
      // Move to card below
      focusedChannelIndex += cols;
      setFocus(channels, focusedChannelIndex, "channel-card-focused");
    }
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

   // Find this section in handleKeydown and REPLACE the isDown block in CHANNEL GRID NAVIGATION:

if (isDown) {
  const cols = 5;
  const lastRowStart = Math.floor((channels.length - 1) / cols) * cols;
  
  if (focusedChannelIndex >= lastRowStart) {
    // In last row - go to video player
    inChannelGrid = false;
    inVideoPlayer = true;
    channels.forEach(c => c.classList.remove("channel-card-focused"));
    const videoDiv = qs(".live-video-player-div");
    if (videoDiv) {
   videoDiv.classList.add("video-focused");
  videoDiv.style.border = "3px solid #0ea5e9"; // Blue border
  videoDiv.style.boxSizing = "border-box"; // Important: keeps border inside
  videoDiv.style.outline = "3px solid #0ea5e9"; // Add outline for full visibility
  videoDiv.style.outlineOffset = "-3px";
    }
  } else {
    // Normal down navigation
    const filtered = getFilteredCategories();
    const selectedCat = filtered.find(c => c.category_id === selectedCategoryId);
    
    if (focusedChannelIndex + cols < channels.length) {
      focusedChannelIndex += cols;
      setFocus(channels, focusedChannelIndex, "channel-card-focused");
    } else if (selectedCat && currentChunk * pageSize < selectedCat.channels.length) {
      currentChunk++;
      renderChannels();
      setTimeout(() => {
        const updatedChannels = qsa(".channel-card");
        if (focusedChannelIndex + cols < updatedChannels.length) {
          focusedChannelIndex += cols;
          setFocus(updatedChannels, focusedChannelIndex, "channel-card-focused");
        }
      }, 100);
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
  // Go to favorite button of current card
  inChannelGrid = false;
  inFavoriteBtn = true;
  channels.forEach(c => c.classList.remove("channel-card-focused"));
  setFavoriteBtnFocus(true);
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
            inFavoriteBtn = false; // ADD THIS
            inRemoveHistoryBtn = false; // ADD THIS


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
     <div class="livetv-video-wrapper" style="padding: 5px; background: #000;">
  <div class="video-placeholder">
    <div class="placeholder-content">
      <img src="/assets/logo.png" alt="Logo" class="placeholder-logo" />
      <p class="placeholder-text">Select a channel to start watching</p>
    </div>
  </div>
</div>

        <div class="epg-schedule">
          <div class="epg-header">
            <img class="epg-channel-logo" src="/assets/channel.png" alt="Channel" />
            <button class="epg-favorite-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"  stroke="none" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          </div>
          
          <div class="epg-list">
            <div class="epg-item">
              <span class="epg-title">Select a channel to view schedule</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`;
}