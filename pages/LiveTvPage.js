


window.addItemToHistory = (item, historyKey) => {
  const playlistsData = JSON.parse(localStorage.getItem("playlistsData"));
  const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist"));

  const playlistIndex = playlistsData.findIndex(
    (pl) => pl.playlistName === selectedPlaylist.playlistName
  );

  if (playlistIndex === -1) return;

  if (!playlistsData[playlistIndex][historyKey]) {
    playlistsData[playlistIndex][historyKey] = [];
  }

  // Remove existing to bring to top
  const existingIndex = playlistsData[playlistIndex][historyKey].findIndex(
    (h) => (typeof h === "object" ? h.stream_id : h) == item.stream_id
  );

  if (existingIndex > -1) {
    playlistsData[playlistIndex][historyKey].splice(existingIndex, 1);
  }

  const historyItem = {
    stream_id: item.stream_id,
    name: item.name,
    stream_icon: item.stream_icon,
    category_id: item.category_id,
    addedAt: new Date().toISOString(),
  };

  playlistsData[playlistIndex][historyKey].unshift(historyItem);

  if (playlistsData[playlistIndex][historyKey].length > 50) {
    playlistsData[playlistIndex][historyKey] = playlistsData[playlistIndex][historyKey].slice(0, 50);
  }

  localStorage.setItem("playlistsData", JSON.stringify(playlistsData));
  
  // Force update UI
  filteredCache = null; 
  if (window.updateLiveTvSidebar) window.updateLiveTvSidebar();
};

// ===== LOADING SCREEN COMPONENT =====
const LiveTvLoadingScreen = () => {
  return `
    <div class="livetv-loading-overlay" id="liveTvLoadingOverlay">
      <div class="loading-content">
        <div class="spinner"></div>
        <div class="loading-text">Loading Live TV</div>
        <div class="loading-subtext" id="loadingSubtext">Please wait while we load your channels...</div>
        <div class="loading-progress" id="loadingProgress">
          <div class="progress-bar">
            <div class="progress-fill" id="progressFill"></div>
          </div>
          <div class="progress-text" id="progressText">0%</div>
        </div>
      </div>
    </div>
  `;
};

// ===== CHANNEL GRID LOADING OVERLAY =====
const ChannelGridLoadingOverlay = () => {
  return `
    <div class="channel-grid-loading-overlay" id="channelGridLoading">
      <div class="channel-loading-content">
        <div class="loading-text">Loading Channels</div>
        <div class="loading-subtext">Please wait while we load your channels...</div>
      </div>
    </div>
  `;
};

// ===== SIDEBAR LOADING OVERLAY =====
// ===== SIDEBAR LOADING OVERLAY =====
const SidebarLoadingOverlay = () => {
  return `
    <div class="sidebar-loading-overlay" id="sidebarLoading">
      <div class="sidebar-loading-content">
        <div class="loading-text-small">Loading Categories...</div>
        <div class="loading-subtext-small">Please wait</div>
      </div>
    </div>
  `;
};

function LiveTvPage() {
  // ===== API DATA (NEW) =====
  const categories = window.liveCategories || [];
  const allStreams = window.allLiveStreams || [];
  let videoControlsHideTimer = null; // Timer for auto-hiding video controls

  let isPageFullyLoaded = false;

  // ===== IMAGE PRELOADING FUNCTION =====
const preloadChannelImages = (channels, onProgress, onComplete) => {
  if (!channels || channels.length === 0) {
    onComplete();
    return;
  }

  const totalImages = channels.length;
  let loadedCount = 0;
  let errorCount = 0;

  const imagePromises = channels.map((ch) => {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        loadedCount++;
        const progress = Math.round((loadedCount / totalImages) * 100);
        onProgress(progress, loadedCount, totalImages);
        resolve();
      };
      
      img.onerror = () => {
        errorCount++;
        loadedCount++;
        const progress = Math.round((loadedCount / totalImages) * 100);
        onProgress(progress, loadedCount, totalImages);
        resolve(); // Still resolve on error
      };
      
      // Set source to start loading
      img.src = ch.stream_icon || '/assets/profile.png';
    });
  });

  Promise.all(imagePromises).then(() => {
    console.log(`✅ Preloaded ${loadedCount} images (${errorCount} errors)`);
    onComplete();
  });
};

    // ===== LOADING HELPERS =====
  const showLoading = () => {
    const existing = document.getElementById("liveTvLoadingOverlay");
    if (existing) existing.remove();

    const loadingDiv = document.createElement("div");
    loadingDiv.innerHTML = LiveTvLoadingScreen();
    document.body.appendChild(loadingDiv.firstElementChild);
  };

  const hideLoading = () => {
    const overlay = document.getElementById("liveTvLoadingOverlay");
    if (overlay) {
      overlay.classList.add("fade-out");
      setTimeout(() => {
        overlay.remove();
      }, 500);
    }
  };


  // ADD THIS NEW FUNCTION
const updateLoadingProgress = (percentage, message) => {
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");
  const loadingSubtext = document.getElementById("loadingSubtext");
  
  if (progressFill) {
    progressFill.style.width = percentage + "%";
  }
  
  if (progressText) {
    progressText.textContent = Math.round(percentage) + "%";
  }
  
  if (loadingSubtext && message) {
    loadingSubtext.textContent = message;
  }
};



    setTimeout(() => {
    hideLoading();
  }, 3000);

  // ===== HELPER: Get Filtered Categories =====


  // ===== HELPER: Apply Sorting to Channels =====
const applySortingToChannels = (channels) => {
  if (!channels || channels.length === 0) return channels;

  const sortValue = localStorage.getItem("liveTvSortValue") || "default";
  const sortedChannels = [...channels]; // Create a copy

  switch (sortValue) {
    case "az":
      return sortedChannels.sort((a, b) => 
        (a.name || "").localeCompare(b.name || "")
      );
    
    case "za":
      return sortedChannels.sort((a, b) => 
        (b.name || "").localeCompare(a.name || "")
      );
    
    case "recent":
      return sortedChannels.sort((a, b) => {
        const dateA = a.addedAt ? new Date(a.addedAt) : new Date(0);
        const dateB = b.addedAt ? new Date(b.addedAt) : new Date(0);
        return dateB - dateA;
      });
    
    case "default":
    default:
      return channels; // Return original order
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

  // ===== GLOBAL STATE FOR CROSS-COMPONENT ACCESS =====
window.liveTvPageState = {
  inChannelGrid: true,
  inVideoPlayer: false,
  inSidebar: false,
  inSidebarSearch: false,
  inHeaderSearch: false,
  inEPG: false,
  inAspectRatioBtn: false,
  inPlayPauseBtn: false,
  inFavoriteBtn: false,
  inRemoveHistoryBtn: false,
  isMenuDotsActive: false
};

  let selectedCategoryId = "All"; // Currently selected category
  let focusedChannelIndex = 0;
  let focusedCategoryIndex = 0;
  let currentChunk = 1; // For lazy loading channels
  const pageSize = 20; // Channels per load
  let searchQuery = ""; // Search text
  let liveTvSortValue = localStorage.getItem("liveTvSortValue") || "default";


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
  let inPlayPauseBtn = false;
  let isHeaderSearchActive = false;
  let isSidebarSearchActive = false;
  let inFavoriteBtn = false; // ADD THIS LINE
  let inRemoveHistoryBtn = false; // ADD THIS
  let isMenuDotsActive = false; // Track if menu dots are focused
let lockedCategories = new Set(); // Track which categories are locked

  let inPasswordModal = false;
  let pendingChannel = null; // Store channel data when password is required
  let passwordModalOrigin = null; // Track where modal was opened from (sidebar/channels)

  let passwordModalFocusIndex = 0; // 0 = input field, 1 = submit button, 2 = cancel button
let previousCategoryId = null; // Track previous category for re-locking
let currentCategoryChunk = 1;
const categoriesPerChunk = 20;
let allCategoriesData = []; // Store all categories
let isLoadingMoreChannels = false;
let isLoadingMoreCategories = false;

let menuKeyHandler = null;
let filteredCache = null;
const getFilteredCategories = () => {
  if (filteredCache && !searchQuery) return filteredCache;

   console.log("🔍 getFilteredCategories called");
  console.log("📊 Current chunks - Categories:", currentCategoryChunk, "Channels:", currentChunk);
  
  
  try {
    const currentPlaylistName = JSON.parse(
      localStorage.getItem("selectedPlaylist")
    ).playlistName;

    if (!currentPlaylistName) {
      console.error("❌ No playlist name found");
      return [];
    }

    const playlistsData = JSON.parse(localStorage.getItem("playlistsData"));
    if (!playlistsData) {
      console.error("❌ No playlists data found");
      return [];
    }

    const currentPlaylist = playlistsData.find(
      (pl) => pl.playlistName === currentPlaylistName
    );
    if (!currentPlaylist) {
      console.error("❌ Current playlist not found");
      return [];
    }

    const updatedFavorites = currentPlaylist.favoritesLiveTV || [];
    const channelHistory = currentPlaylist.ChannelListLive || [];

    const streams =
      window.currentAllStreams || allStreams || window.allLiveStreams || [];

    console.log("🔍 Streams available:", streams.length);

    if (streams.length === 0) {
      console.warn("⚠️ No streams available in getFilteredCategories");
    }

    // **FILTER CATEGORIES**
    const filteredCategories = (
      categories ||
      window.liveCategories ||
      []
    ).map((c) => {
      let categoryChannels = [];

      try {
        categoryChannels =
          streams.filter((s) => s.category_id === c.category_id) || [];

        if (searchQuery.trim() && selectedCategoryId === c.category_id) {
          categoryChannels = categoryChannels.filter((ch) =>
            (ch.name || "").toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
      } catch (err) {
        console.error("Error filtering category channels:", err);
      }

      return {
        ...c,
        channels: categoryChannels,
      };
    });

    const allLiveStreams =
      searchQuery.trim() && selectedCategoryId === "All"
        ? streams.filter((ch) =>
            (ch.name || "").toLowerCase().includes(searchQuery.toLowerCase())
          )
        : streams;

    console.log("🔍 Processing favorites:", updatedFavorites.length);

   // Replace the Favorites processing section:
const favoritesChannels = (updatedFavorites || [])
  .map((favItem) => {
    // If favItem is just an ID (number), find full stream info
    const streamId = typeof favItem === "object" ? favItem.stream_id : favItem;
    const fullData = streams.find((s) => s.stream_id == streamId);
    
    return fullData || (typeof favItem === "object" ? favItem : null);
  })
  .filter(Boolean) // Remove nulls
  .filter((ch) => {
    if (!searchQuery.trim() || selectedCategoryId !== "favorites") return true;
    return (ch.name || "").toLowerCase().includes(searchQuery.toLowerCase());
  });

// Replace the History processing section:
const historyChannels = (channelHistory || [])
  .map((histItem) => {
    const streamId = typeof histItem === "object" ? histItem.stream_id : histItem;
    const fullData = streams.find((s) => s.stream_id == streamId);
    
    return fullData || (typeof histItem === "object" ? histItem : null);
  })
  .filter(Boolean)
  .filter((ch) => {
    if (!searchQuery.trim() || selectedCategoryId !== "channelHistory") return true;
    return (ch.name || "").toLowerCase().includes(searchQuery.toLowerCase());
  });

    const result = [
      {
        category_id: "All",
        category_name: "All",
        channels: applySortingToChannels(allLiveStreams || []),
        totalChannels: allLiveStreams.length, // ADD THIS
      },
      {
        category_id: "favorites",
        category_name: "Favorites",
        channels: applySortingToChannels(favoritesChannels || []),
        totalChannels: favoritesChannels.length, // ADD THIS
      },
      {
        category_id: "channelHistory",
        category_name: "Channel History",
        channels: applySortingToChannels(historyChannels || []),
        totalChannels: historyChannels.length, // ADD THIS
      },
      ...filteredCategories.map(cat => ({
        ...cat,
        channels: applySortingToChannels(cat.channels || []),
        totalChannels: cat.channels.length, // ADD THIS
      })),
    ];

    // STORE ALL CATEGORIES
    allCategoriesData = result;
filteredCache = result;
    console.log("✅ getFilteredCategories result:", result.length, "categories");
    return result;

  } catch (error) {
    console.error("❌ ERROR in getFilteredCategories:", error);
    console.error("Stack:", error.stack);
    return [
      {
        category_id: "All",
        category_name: "All",
        channels: [],
        totalChannels: 0,
      },
    ];
  }
  
};

// ===== GET CHUNKED CHANNELS =====
const getChunkedChannels = (allChannels, chunk, pageSize) => {
  const startIdx = (chunk - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  return allChannels.slice(0, endIdx); // Return all channels up to current chunk
};

// ===== GET CHUNKED CATEGORIES =====
const getChunkedCategories = (allCategories, chunk, pageSize) => {
  const startIdx = (chunk - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  return allCategories.slice(0, endIdx);
};

// ===== CHECK IF MORE CHANNELS AVAILABLE =====
const hasMoreChannelsAvailable = (allChannels, chunk, pageSize) => {
  return allChannels.length > chunk * pageSize;
};

// 4. CHECK IF MORE CATEGORIES AVAILABLE
const hasMoreCategoriesAvailable = (allCategories, chunk, pageSize) => {
  return allCategories.length > chunk * pageSize;
};


const showAspectRatioButton = () => {
  const aspectRatioDiv = document.querySelector(".videojs-aspect-ratio-div");
  if (aspectRatioDiv) {
    // Check fullscreen status using multiple APIs
    const isFs = !!(document.fullscreenElement || 
                    document.webkitFullscreenElement || 
                    document.mozFullScreenElement || 
                    document.msFullscreenElement);
    
    if (isFs) {
      aspectRatioDiv.style.display = "block";
      aspectRatioDiv.style.opacity = "1";
      aspectRatioDiv.style.transition = "opacity 0.3s ease";
    } else {
      aspectRatioDiv.style.display = "none";
      aspectRatioDiv.style.opacity = "0";
    }
  }
};


  // ===== CHECK IF CONTENT IS 18+ =====
  const isAdultContent = (channelData) => {
    if (!channelData) return false;

    const name = (channelData.name || "").toLowerCase();
    const categoryName = (channelData.category_name || "").toLowerCase();

    // Check for adult keywords in channel name or category
    const adultKeywords = [
      "18+",
      "xxx",
      "adult",
      "porn",
      "sexy",
      "hot",
      "erotic",
      "sex",
      "18 plus",
      "18s*plus",
      "nsfw",
      "mature",
      "explicit",
      "xxx videos",
      "adult content",
      "xc+",
    ];

    return adultKeywords.some(
      (keyword) => name.includes(keyword) || categoryName.includes(keyword)
    );
  };

  // ===== RE-LOCK CATEGORY WHEN SWITCHING AWAY =====
const relockPreviousCategory = (previousCategoryId) => {
  const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist")) || {};
  const hasParentalPassword = selectedPlaylist.parentalPassword && selectedPlaylist.parentalPassword.length > 0;
  
  if (hasParentalPassword && previousCategoryId && categoryHasAdultContent(previousCategoryId)) {
    lockedCategories.add(previousCategoryId);
    console.log("🔒 Re-locked category:", previousCategoryId);
  }
};

  // ===== CHECK IF CATEGORY HAS ADULT CONTENT =====
// ===== CHECK IF CATEGORY HAS ADULT CONTENT =====
const categoryHasAdultContent = (categoryId) => {
  const streams = window.currentAllStreams || allStreams || window.allLiveStreams || [];
  
  // Special handling for built-in categories
  if (categoryId === "All") {
    return streams.some(ch => isAdultContent(ch));
  }
  
  if (categoryId === "favorites") {
    const currentPlaylistName = JSON.parse(localStorage.getItem("selectedPlaylist")).playlistName;
    const currentPlaylist = JSON.parse(localStorage.getItem("playlistsData")).find(
      pl => pl.playlistName === currentPlaylistName
    );
    const favoritesList = currentPlaylist.favoritesLiveTV || [];
    
    const favChannels = favoritesList.map(favItem => {
      if (typeof favItem === "number") {
        return streams.find(s => s.stream_id === favItem);
      }
      return favItem;
    }).filter(Boolean);
    
    return favChannels.some(ch => isAdultContent(ch));
  }
  
  if (categoryId === "channelHistory") {
    // History should never be locked (adult channels aren't added to history)
    return false;
  }
  
  // Regular categories
  const categoryChannels = streams.filter(s => s.category_id === categoryId);
  return categoryChannels.some(ch => isAdultContent(ch));
};

  // ===== VIDEO ASPECT RATIO MANAGER =====
  // ===== VIDEO ASPECT RATIO MANAGER =====
  // ===== VIDEO ASPECT RATIO MANAGER =====
  window.VideoAspectRatio = {
    ratios: ["16:9", "4:3", "2.35:1"],
    classes: ["video-aspect-169", "video-aspect-43", "video-aspect-235"],
    currentIndex: 0,
    overlayTimeout: null,

    initialize(videoElement) {
      this.currentIndex = 0; // Start with 16:9
      this.apply(videoElement, 0);
    },

    apply(videoElement, index) {
      if (!videoElement) return;

      // Remove all aspect ratio classes
      this.classes.forEach((cls) => videoElement.classList.remove(cls));

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
      const existingOverlay = document.querySelector(".aspect-ratio-overlay");
      if (existingOverlay) {
        existingOverlay.remove();
      }

      // Create new overlay
      const overlay = document.createElement("div");
      overlay.className = "aspect-ratio-overlay";
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
    },
  };
  // ===== SIMPLE VIDEO PLAYER (TEMPORARY) =====
  // Find this function and replace it:




  // Add this function after SimpleVideoPlayer:
// Add this function after SimpleVideoPlayer:
const toggleAspectRatio = () => {
  // Try to find video element from different player types
  let videoEl = document.getElementById("live-video-player") || // SimpleVideoPlayer
                document.querySelector("#live-videojs-player_html5_api") || // LiveVideoJsComponent
                document.querySelector("#flowplayer-live video") || // FlowLivePlayerComponent
                document.querySelector(".flowplayer .fp-engine"); // Flowplayer engine
  
  // If still not found, try to get from window.livePlayer
  if (!videoEl && window.livePlayer) {
    if (window.livePlayer._fp) {
      // Flowplayer
      videoEl = document.querySelector(".flowplayer .fp-engine");
    } else {
      // Video.js
      videoEl = window.livePlayer.el().querySelector("video");
    }
  }

  if (!videoEl || !window.VideoAspectRatio) {
    console.warn("Video element or VideoAspectRatio not found");
    return;
  }

  // Cycle to next aspect ratio
  const newLabel = window.VideoAspectRatio.cycle(videoEl);

  // Update button label if it exists
  const aspectBtn = document.querySelector(".aspect-ratio-btn") || 
                    document.querySelector("#videojs-aspect-ratio");
  if (aspectBtn) {
    const aspectLabel = aspectBtn.querySelector(".aspect-label");
    if (aspectLabel && newLabel) {
      aspectLabel.textContent = newLabel;
    }
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
// Helper to set focus on sidebar search box
const setSidebarSearchFocus = (active) => {

  const searchBox = qs(".sidebar-search-box");
  const searchInput = qs(".sidebar-search-input");
  if (active) {
    searchBox.classList.add("search-focused");
    // DON'T focus the input - just add visual focus
    // searchInput.focus(); // REMOVE THIS LINE
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
      // searchInput.blur(); // Keep blurred initially
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
  // Add this function after setRemoveHistoryBtnFocus or other focus helpers
  const removeAllFocus = () => {
    // Remove focus from all channel cards
    const channels = qsa(".channel-card");
    channels.forEach((c) =>
      c.classList.remove("channel-card-focused", "channel-card-selected")
    );

 

    // Remove focus from EPG items
    const epgItems = qsa(".epg-item");
    epgItems.forEach((item) => item.classList.remove("epg-focused"));

    // Remove focus from search boxes
    const headerSearchBox = qs(".search-container");
    if (headerSearchBox) headerSearchBox.classList.remove("search-focused");

    const sidebarSearchBox = qs(".sidebar-search-box");
    if (sidebarSearchBox) sidebarSearchBox.classList.remove("search-focused");

    // Remove focus from video player
    const videoDiv = qs(".live-video-player-div");
    if (videoDiv) {
      videoDiv.classList.remove("video-focused");
      videoDiv.style.outline = "none";
      videoDiv.style.border = "none";
    }

    // Remove focus from aspect ratio button
    const aspectBtn = qs(".aspect-ratio-btn");
    if (aspectBtn) {
      aspectBtn.classList.remove("videojs-aspect-ratio-btn-focused");
      aspectBtn.style.border = "none";
    }

    // Remove focus from favorite buttons
    const favBtns = qsa(".favorite-btn");
    favBtns.forEach((btn) => (btn.style.outline = "none"));

    // Remove focus from remove history buttons
    const removeBtns = qsa(".remove-history-btn");
    removeBtns.forEach((btn) => (btn.style.outline = "none"));

    // Remove focus from menu dots
    const menuDots = qs(".menu-dots");
    if (menuDots) menuDots.classList.remove("focused");
  };

  // After setRemoveHistoryBtnFocus function
  function setFocusOnMenuDots() {
    removeAllFocus();
    const menuDots = document.querySelector(".menu-dots");
    if (menuDots) {
      menuDots.classList.add("focused");
    }
    isMenuDotsActive = true;
    inChannelGrid = false;
    inHeaderSearch = false;
    inSidebarSearch = false;
    inSidebar = false;
    inEPG = false;
    inVideoPlayer = false;
    inFavoriteBtn = false;
    inRemoveHistoryBtn = false;
  }

  // ===== PASSWORD MODAL COMPONENT =====
 const PasswordModal = () => {
  return `
    <div class="password-modal-overlay" id="passwordModalOverlay">
      <div class="password-modal">
        <div class="password-modal-header">
          <h2>Parental Control</h2>
          <p>This content is restricted. Please enter your password.</p>
        </div>
        
        <div class="password-modal-body">
          <div class="password-input-wrapper">
            <input 
              type="password" 
              id="passwordModalInput" 
              class="password-modal-input" 
              placeholder="Enter Password"
              maxlength="20"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
            />
          </div>
        </div>
        
        <div class="password-modal-footer">
          <button class="password-modal-btn password-submit-btn">Submit</button>
          <button class="password-modal-btn password-cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  `;
};

  // ===== SHOW PASSWORD MODAL =====
 const showPasswordModal = (channelData) => {
  pendingChannel = channelData;
  inPasswordModal = true;
  inChannelGrid = false;
  passwordModalFocusIndex = 0;

    const previousSidebarIndex = focusedSidebarIndex;
  inSidebar = false;

  // Add modal to page
  const modalContainer = document.createElement("div");
  modalContainer.innerHTML = PasswordModal();
  document.body.appendChild(modalContainer.firstElementChild);

  // CRITICAL: Use requestAnimationFrame for better performance on Tizen
  requestAnimationFrame(() => {
    const input = document.getElementById("passwordModalInput");
    if (input) {
      // Set type to text initially for faster rendering on TV
      input.type = "password";
      
      // Add input event listener for immediate feedback
      input.addEventListener("input", (e) => {
        // Force immediate update on Tizen
        e.target.value = e.target.value;
      });
      
      // Focus after a small delay for Tizen stability
      setTimeout(() => {
        input.focus();
        updatePasswordModalFocus();
      }, 50);
    }
  });
};

  // ===== HIDE PASSWORD MODAL =====
  // ===== HIDE PASSWORD MODAL (UPDATED) =====
const hidePasswordModal = (clearPending = true) => {
  const modal = document.getElementById("passwordModalOverlay");
  const input = document.getElementById("passwordModalInput");
  
  // Force blur immediately on Tizen
  if (input) {
    input.blur();
    input.value = ""; // Clear value immediately
  }
  
  // Remove modal without animation for faster cleanup
  if (modal) {
    modal.remove();
  }
  
  inPasswordModal = false;

  if (clearPending) {
    pendingChannel = null;
  }

  passwordModalFocusIndex = 0;

  // Always return focus to sidebar
  requestAnimationFrame(() => {
    inSidebar = true;
    inChannelGrid = false;
    inSidebarSearch = false;
    inHeaderSearch = false;
    
    const sidebarItems = qsa(".sidebar-item");
    if (sidebarItems.length > 0) {
      setSidebarFocus(focusedSidebarIndex);
    }
  });
};

  // ===== UPDATE PASSWORD MODAL FOCUS =====
const updatePasswordModalFocus = () => {
  const input = document.getElementById("passwordModalInput");
  const submitBtn = document.querySelector(".password-submit-btn");
  const cancelBtn = document.querySelector(".password-cancel-btn");

  // Use requestAnimationFrame for smoother updates on Tizen
  requestAnimationFrame(() => {
    // Remove all focus
    if (input) {
      input.classList.remove("password-input-focused");
      if (passwordModalFocusIndex !== 0) {
        input.blur();
      }
    }
    if (submitBtn) submitBtn.classList.remove("password-btn-focused");
    if (cancelBtn) cancelBtn.classList.remove("password-btn-focused");

    // Add focus to current element
    if (passwordModalFocusIndex === 0 && input) {
      input.classList.add("password-input-focused");
      // Small delay for Tizen keyboard
      setTimeout(() => {
        input.focus();
      }, 50);
    } else if (passwordModalFocusIndex === 1 && submitBtn) {
      submitBtn.classList.add("password-btn-focused");
    } else if (passwordModalFocusIndex === 2 && cancelBtn) {
      cancelBtn.classList.add("password-btn-focused");
    }
  });
};

  // ===== VERIFY PASSWORD =====
const verifyPasswordForCategory = () => {
  const input = document.getElementById("passwordModalInput");
  if (!input) return;
  
  const enteredPassword = input.value.trim();
  const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist")) || {};
  const correctPassword = selectedPlaylist.parentalPassword || "";
  
  if (enteredPassword === correctPassword) {
    // Password correct - unlock category
    const categoryToUnlock = pendingChannel; // This stores category ID
    
    if (categoryToUnlock) {
      lockedCategories.delete(categoryToUnlock);
      console.log("🔓 Unlocked category:", categoryToUnlock);
      
      // Update previous category
      previousCategoryId = categoryToUnlock;
      selectedCategoryId = categoryToUnlock;
    }
    
    // Hide modal immediately
    hidePasswordModal(false);
    
    // Use requestAnimationFrame for smoother transition on Tizen
    requestAnimationFrame(() => {
      // Show brief loading message
      const channelGrid = qs(".channel-grid");
      if (channelGrid) {
        channelGrid.innerHTML = `
          <div style="display: flex; justify-content: center; align-items: center; height: 300px;">
            <p style="color: white; font-size: 20px;">Loading channels...</p>
          </div>
        `;
      }
      
      // Render channels after a small delay for Tizen
      setTimeout(() => {
        renderChannels();
        renderSidebarCategories();
        
        // Focus on first channel after render completes
        setTimeout(() => {
          const channels = qsa(".channel-card");
          if (channels.length > 0) {
            inChannelGrid = true;
            inSidebar = false;
            focusedChannelIndex = 0;
            setFocus(channels, 0, "channel-card-focused");
          }
        }, 100);
      }, 50);
    });
    
  } else {
    // Wrong password
    if (typeof Toaster !== "undefined" && typeof Toaster.showToast === "function") {
      Toaster.showToast("error", "Incorrect password");
    }
    input.value = "";
    input.focus();
  }
};


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
    }/${channelData.stream_id}.${playlistLiveExtension.streamFormat || "m3u8"}`;

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

    console.log("🎮 Player components available:", {
      hasLiveVideoJs,
      hasFlowPlayer,
    });

    // Get stream format
    const playlistsData = JSON.parse(localStorage.getItem("playlistsData"));
    const currentPlaylist = playlistsData.find(
      (pl) => pl.playlistName === selectedPlaylist.playlistName
    );

    const isTs = (currentPlaylist.streamFormat || "").toLowerCase() === "ts";

    // Create player HTML
    if (isTs && hasFlowPlayer) {
      videoWrapper.innerHTML = FlowLivePlayerComponent(
        channelData.stream_id,
        liveVideoUrl,
        channelData.stream_icon || channelData.logo || "/assets/profile.png",
        "100vh",
        channelData.name || "Unknown Channel"
      );
    } else if (hasLiveVideoJs) {
      videoWrapper.innerHTML = LiveVideoJsComponent(
        channelData.stream_id,
        liveVideoUrl,
        channelData.stream_icon || channelData.logo || "/assets/profile.png",
        "100vh",
        channelData.name || "Unknown Channel"
      );
    } else {
      // Use simple player fallback
      videoWrapper.innerHTML = SimpleVideoPlayer(
        channelData.stream_id,
        liveVideoUrl,
        channelData.stream_icon || channelData.logo || "/assets/profile.png",
        "100vh",
        channelData.name || "Unknown Channel"
      );

      if (selectedCategoryId !== "channelHistory") {
        const streams =
          window.currentAllStreams || allStreams || window.allLiveStreams || [];
        const selectedChannelItem = streams.find(
          (item) => item.stream_id == channelData.stream_id
        );

         if (selectedChannelItem && !isAdultContent(selectedChannelItem) && typeof window.addItemToHistory === "function") {
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

   if (playPauseIcon) {
    playPauseIcon.style.display = "flex";
    playPauseIcon.style.opacity = "1";
  }
  
  if (aspectRatioBtn) {
    aspectRatioBtn.style.display = "block";
    aspectRatioBtn.style.opacity = "1";
  }

  if (videoEl && typeof videojs !== "undefined") {
    // Force video element to be visible
    videoEl.style.display = "block";
    videoEl.style.visibility = "visible";
    videoEl.style.opacity = "1";
    
    window.livePlayer = videojs(videoEl, {
      controls: true,
      autoplay: true,
      preload: "auto",
      fluid: false, // Changed to false
      fill: true, // Added
      responsive: false, // Added for Tizen
      html5: {
        vhs: {
          overrideNative: true,
          enableLowInitialPlaylist: true
        },
        nativeVideoTracks: false,
        nativeAudioTracks: false,
        nativeTextTracks: false
      }
    });

    // Force video to display
    window.livePlayer.ready(function() {
      const player = this;
      const tech = player.tech({ IWillNotUseThisInPlugins: true });
      
      if (tech && tech.el_) {
        tech.el_.style.width = "100%";
        tech.el_.style.height = "100%";
        tech.el_.style.display = "block";
        tech.el_.style.position = "relative";
      }
    });

    if (window.VideoAspectRatio) {
      window.VideoAspectRatio.initialize(videoEl);
    }

    window.livePlayer.on("waiting", () => {
      const loader = document.querySelector(".live-video-loader");
      if (loader) loader.classList.remove("hidden");
    });

    window.livePlayer.on("playing", () => {
      const loader = document.querySelector(".live-video-loader");
      if (loader) loader.classList.add("hidden");
      
      // Ensure video is visible after playing starts
      if (videoEl) {
        videoEl.style.display = "block";
        videoEl.style.visibility = "visible";
      }
    });

    window.livePlayer.on("error", (e) => {
      console.error("❌ Player error:", e);
    });



        const handleFullscreenChange = () => {
      const aspectRatioDiv = document.querySelector(".videojs-aspect-ratio-div");
      if (aspectRatioDiv) {
        const isFs = document.fullscreenElement || 
                     document.webkitFullscreenElement || 
                     document.mozFullScreenElement || 
                     document.msFullscreenElement;
        
        aspectRatioDiv.style.display = isFs ? "block" : "none";
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);
    
    // Rest of your play/pause button handlers...
    if (playPauseBtn) {
      const playIcon = playPauseBtn.querySelector("i");
      
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
        if (playIcon) playIcon.className = "fa-solid fa-play";
      });

      videoEl.addEventListener("play", () => {
        playPauseBtn.style.display = "flex";
        playPauseBtn.style.opacity = "1";
        if (playIcon) playIcon.className = "fa-solid fa-pause";
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

     const videoContainer = document.querySelector(".live-video-player-div");
if (videoContainer) {
  videoContainer.addEventListener("click", (e) => {
    if (e.target === videoContainer || e.target === videoEl) {
      if (!document.fullscreenElement && 
          !document.webkitFullscreenElement && 
          !document.mozFullScreenElement && 
          !document.msFullscreenElement) {
        if (videoContainer.requestFullscreen) {
          videoContainer.requestFullscreen();
        } else if (videoContainer.webkitRequestFullscreen) {
          videoContainer.webkitRequestFullscreen();
        } else if (videoContainer.mozRequestFullScreen) {
          videoContainer.mozRequestFullScreen();
        } else if (videoContainer.msRequestFullscreen) {
          videoContainer.msRequestFullscreen();
        }
      }
    }
  });
}

      videoEl.addEventListener("click", (e) => {
        e.stopPropagation();
        playPauseBtn.style.display = "flex";
        togglePlayPause();
      });
    }

    if (aspectBtn) {
      const aspectLabel = aspectBtn.querySelector(".aspect-label");
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
    qsa(".channel-card").forEach((c) => {
      c.classList.remove(
        "channel-card-selected",
        "channel-card-focused",
        "channel-card-playing"
      );
    });

    const selectedCard = qs(
      `.channel-card[data-stream-id="${channelData.stream_id}"]`
    );
    if (selectedCard) {
      selectedCard.classList.add(
        "channel-card-selected",
        "channel-card-focused",
        "channel-card-playing"
      );

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

   const isAdult = isAdultContent(channelData);
  
  if (!isAdult) {
    // Only add non-adult content to history
    const streams = window.currentAllStreams || allStreams || window.allLiveStreams || [];
    const selectedChannelItem = streams.find(
      (item) => item.stream_id == channelData.stream_id
    );
    
    if (selectedChannelItem && typeof window.addItemToHistory === "function") {
      window.addItemToHistory(selectedChannelItem, "ChannelListLive");
    }
  } else {
    console.log("🔒 Adult content - not adding to history");
  }
}

    console.log("✅ Channel playback initiated");
  };


  window.isItemFavoriteForPlaylist = (item, favoriteKey) => {
    const playlistsData = JSON.parse(localStorage.getItem("playlistsData"));
    const selectedPlaylist = JSON.parse(
      localStorage.getItem("selectedPlaylist")
    );

    const currentPlaylist = playlistsData.find(
      (pl) => pl.playlistName === selectedPlaylist.playlistName
    );

    if (!currentPlaylist || !currentPlaylist[favoriteKey]) {
      return false;
    }

    // Check if stream_id exists (works for both objects and IDs)
    return currentPlaylist[favoriteKey].some(
      (fav) =>
        (typeof fav === "object" ? fav.stream_id : fav) === item.stream_id
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
      epgChannelLogo.src =
        channelData.stream_icon || channelData.logo || "/assets/channel.png";
      epgChannelLogo.alt = channelData.name || "Channel";
    }

    // Update favorite button state
    if (epgFavoriteBtn) {
      const isFav = window.isItemFavoriteForPlaylist
        ? window.isItemFavoriteForPlaylist(channelData, "favoritesLiveTV")
        : false;

      const svg = epgFavoriteBtn.querySelector("svg path");
      if (svg) {
        svg.setAttribute("fill", isFav ? "red" : "none");
      }

      // Add click handler for favorite button
      epgFavoriteBtn.onclick = () => {
        const result = window.toggleFavoriteItem(
          channelData,
          "favoritesLiveTV"
        );
        const svg = epgFavoriteBtn.querySelector("svg path");
        if (svg) {
          svg.setAttribute("fill", result.isFav ? "red" : "none");
        }

        if (
          typeof Toaster !== "undefined" &&
          typeof Toaster.showToast === "function"
        ) {
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
      getLiveStreamEpg(streamId)
      getLiveStreamEpg(streamId)
  .then((data) => {
    console.log("------EPG data received:" , data);
    
    // Handle both response formats
    let epgData = [];
    if (Array.isArray(data)) {
      epgData = data;
    } else if (data && data.epg_listings && Array.isArray(data.epg_listings)) {
      epgData = data.epg_listings;
    }

    console.log("------EPG listings array:", epgData);

    if (epgData.length > 0) {
      renderEPGList(epgData);
    } else {
      epgList.innerHTML = `
        <div class="epg-item">
          <span class="epg-title">No EPG data available</span>
        </div>
      `;
    }
  })
  .catch((error) => {
    console.error("------EPG fetch error:", error);
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

  console.log("------Rendering EPG list with data:", epgData);

  const currentPlaylistName = JSON.parse(
    localStorage.getItem("selectedPlaylist")
  ).playlistName;
  const currentPlaylist = JSON.parse(
    localStorage.getItem("playlistsData")
  ).find((pl) => pl.playlistName === currentPlaylistName);
  const timeFormat = currentPlaylist.timeFormat || "12hrs";

  try {
    const epgHTML = epgData
      .map((program) => {
        const startTime = formatTimes(program.start, timeFormat);
        const endTime = formatTimes(program.end, timeFormat);
        const title = decodeBase64(program.title) || "Untitled";

        return `
          <div class="epg-item">
            <span class="epg-time">${startTime} - ${endTime}</span>
            <span class="epg-title">${title}</span>
          </div>
        `;
      })
      .join("");

    epgList.innerHTML = epgHTML;
    console.log("------EPG rendered successfully");
  } catch (error) {
    console.error("------Error rendering EPG:", error);
    epgList.innerHTML = `
      <div class="epg-item">
        <span class="epg-title">Error displaying EPG data</span>
      </div>
    `;
  }
};

  // Helper functions (copy from LiveVideoJsComponent)
  function formatTimes(dateStr, format) {
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
      const startTime = new Date(now.getTime() + i * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

      programs.push({
        start: startTime.getTime() / 1000,
        end: endTime.getTime() / 1000,
        title: `${channelName} Program ${i + 1}`,
      });
    }

    renderEPGList(programs);
  };

 window.toggleFavoriteItem = (item, favoriteKey) => {
  const playlistsData = JSON.parse(localStorage.getItem("playlistsData"));
  const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist"));

  const playlistIndex = playlistsData.findIndex(
    (pl) => pl.playlistName === selectedPlaylist.playlistName
  );

  if (playlistIndex === -1) return { isFav: false, item };

  if (!playlistsData[playlistIndex][favoriteKey]) {
    playlistsData[playlistIndex][favoriteKey] = [];
  }

  const existingIndex = playlistsData[playlistIndex][favoriteKey].findIndex(
    (fav) => (typeof fav === "object" ? fav.stream_id : fav) == item.stream_id
  );

  let isFav;
  if (existingIndex > -1) {
    playlistsData[playlistIndex][favoriteKey].splice(existingIndex, 1);
    isFav = false;
  } else {
    // Save full object for better reliability
    const favItem = {
      stream_id: item.stream_id,
      name: item.name,
      stream_icon: item.stream_icon,
      stream_type: item.stream_type,
      category_id: item.category_id
    };
    playlistsData[playlistIndex][favoriteKey].push(favItem);
    isFav = true;
  }

  // Save the entire playlistsData array back
  localStorage.setItem("playlistsData", JSON.stringify(playlistsData));
  
  // Clear cache to force refresh
  filteredCache = null; 

  return { isFav, item };
};

  // ===== TOGGLE FAVORITE =====
  // ===== TOGGLE FAVORITE =====
  const toggleFavorite = (channelData) => {
    filteredCache = null; // Add this line here
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
    if (
      typeof Toaster !== "undefined" &&
      typeof Toaster.showToast === "function"
    ) {
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
    const selectedPlaylist = JSON.parse(
      localStorage.getItem("selectedPlaylist")
    );

    const currentPlaylist = playlistsData.find(
      (pl) => pl.playlistName === selectedPlaylist.playlistName
    );

    if (!currentPlaylist || !currentPlaylist.ChannelListLive) return;

    const index = currentPlaylist.ChannelListLive.findIndex(
      (h) => (typeof h === "object" ? h.stream_id : h) === channelData.stream_id
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
        focusedChannelIndex = Math.min(
          focusedChannelIndex,
          channels.length - 1
        );
        setFocus(channels, focusedChannelIndex, "channel-card-focused");
      }

      if (
        typeof Toaster !== "undefined" &&
        typeof Toaster.showToast === "function"
      ) {
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
  // ===== RENDER CHANNELS =====
// ===== RENDER CHANNELS =====
// ===== RENDER CHANNELS =====
const renderChannels = () => {
  const filtered = getFilteredCategories();

  let selectedCat = filtered.find(
    (c) => c.category_id === selectedCategoryId
  );
  if (!selectedCat) {
    selectedCat = filtered[0];
    selectedCategoryId = selectedCat.category_id;
  }

  const channelGrid = qs(".channel-grid");
  if (!channelGrid) return;

  // Check if category is locked
  const isLocked = lockedCategories.has(selectedCategoryId);
  
  if (isLocked) {
    console.log("🔒 Showing locked overlay for category:", selectedCategoryId);
    channelGrid.innerHTML = `
      <div class="locked-category-overlay">
        <div class="locked-category-message">
          <i class="fa fa-lock" style="font-size: 64px; color: #ef4444; margin-bottom: 20px;"></i>
          <p style="font-size: 28px; color: #fff; font-weight: bold; margin-bottom: 10px;">This category is locked</p>
          <p style="font-size: 18px; color: #ccc; margin: 0;">Select the category from sidebar to unlock</p>
        </div>
      </div>
    `;
    return;
  }

  const allChannels = selectedCat.channels || [];
  
  const channelsToShow = getChunkedChannels(allChannels, currentChunk, pageSize);
  const hasMore = hasMoreChannelsAvailable(allChannels, currentChunk, pageSize);

  console.log(`📺 Showing ${channelsToShow.length} of ${allChannels.length} channels (chunk ${currentChunk})`);

  if (channelsToShow.length === 0) {
    channelGrid.innerHTML = `
      <div class="no-channels">
        <p>No channels found in this category</p>
      </div>`;
    return;
  }

  const currentPlaylistName = JSON.parse(
    localStorage.getItem("selectedPlaylist")
  ).playlistName;
  const currentPlaylist = JSON.parse(
    localStorage.getItem("playlistsData")
  ).find((pl) => pl.playlistName === currentPlaylistName);
  const favoritesList = currentPlaylist.favoritesLiveTV || [];

  const isHistoryView = selectedCategoryId === "channelHistory";

  const channelCardsHTML = channelsToShow
    .map((ch) => {
      const isFav = favoritesList.some(
        (fav) =>
          (typeof fav === "object" ? fav.stream_id : fav) === ch.stream_id
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
               loading="lazy"
               onerror="this.src='/assets/profile.png'; this.onerror=null;" />
          <div class="channel-actions">
            <button class="favorite-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="${
                isFav ? "red" : "none"
              }" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            ${
              isHistoryView
                ? `
              <button class="remove-history-btn" title="Remove from history">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            `
                : ""
            }
          </div>
        </div>
        <div class="channel-name">${ch.name}</div>
      </div>
    `;
    })
    .join("");

  // Use requestAnimationFrame for smoother rendering on Tizen
  requestAnimationFrame(() => {
    channelGrid.innerHTML = channelCardsHTML;
    
    // Update scroll arrows after render
    setTimeout(() => {
      const updateScrollArrows = window.updateScrollArrows;
      if (typeof updateScrollArrows === 'function') {
        updateScrollArrows();
      }
    }, 50);
  });
};

// ===== LOAD MORE CHANNELS FUNCTION =====
// ===== LOAD MORE CHANNELS FUNCTION =====
const loadMoreChannels = () => {
  if (isLoadingMoreChannels) {
    console.log("⏳ Already loading channels...");
    return;
  }
  
  const filtered = getFilteredCategories();
  const selectedCat = filtered.find((c) => c.category_id === selectedCategoryId);
  const allChannels = selectedCat ? selectedCat.channels || [] : [];
  const hasMore = hasMoreChannelsAvailable(allChannels, currentChunk, pageSize);
  
  if (!hasMore) {
    console.log("✅ No more channels to load");
    return;
  }
  
  isLoadingMoreChannels = true;
  currentChunk++;
  
  console.log(`📺 Loading chunk ${currentChunk} (${currentChunk * pageSize} channels)...`);
  
  // Show loading indicator

  
  // Small delay for TV performance
  setTimeout(() => {
    renderChannels();
    isLoadingMoreChannels = false;
    
    // Maintain focus on current channel
    const channels = qsa(".channel-card");
    if (channels.length > focusedChannelIndex) {
      setFocus(channels, focusedChannelIndex, "channel-card-focused");
    }
  }, 100);
};

// ===== SETUP SCROLL-BASED AUTO-LOADING =====
const setupScrollAutoLoad = () => {
  const channelGrid = qs(".channel-grid");
  if (!channelGrid) return;
  
  let scrollTimeout;
  
  const handleScroll = () => {
    if (isLoadingMoreChannels) return;
    
    clearTimeout(scrollTimeout);
    
    scrollTimeout = setTimeout(() => {
      const filtered = getFilteredCategories();
      const selectedCat = filtered.find((c) => c.category_id === selectedCategoryId);
      const allChannels = selectedCat ? selectedCat.channels || [] : [];
      const hasMore = hasMoreChannelsAvailable(allChannels, currentChunk, pageSize);
      
      if (!hasMore) return;
      
      // Check if scrolled near the end (80% of scroll width)
      const scrollLeft = channelGrid.scrollLeft;
      const scrollWidth = channelGrid.scrollWidth;
      const clientWidth = channelGrid.clientWidth;
      const scrollPercentage = (scrollLeft + clientWidth) / scrollWidth;
      
      if (scrollPercentage > 0.8) {
        console.log("🔄 Scroll detected near end - auto-loading...");
        loadMoreChannels();
      }
    }, 200); // Debounce scroll events
  };
  
  channelGrid.addEventListener('scroll', handleScroll);
  
  // Store reference for cleanup
  window.channelGridScrollHandler = handleScroll;
};


// 1. ADD THIS DEFINITION HERE
const setupSidebarSearchListener = () => {
  const sidebarSearchInput = document.querySelector(".sidebar-search-input");
  if (!sidebarSearchInput) return;

  sidebarSearchInput.addEventListener("input", function(e) {
    // We update the data, but we DON'T recreate the search box element
    currentCategoryChunk = 1;
    focusedSidebarIndex = 0;

    // IMPORTANT: Only update the list of items, not the whole sidebar
    const filtered = getFilteredCategories();
    const query = e.target.value.toLowerCase();
    
    let displayCategories;
    if (query !== "") {
      displayCategories = filtered.filter(function(c) {
        return (c.category_name || "").toLowerCase().includes(query);
      });
    } else {
      displayCategories = filtered;
    }

    // Call a function that ONLY updates the .sidebar-items div
    updateSidebarItemsOnly(displayCategories);
  });
};

const updateSidebarItemsOnly = (displayCategories) => {
  const sidebarItemsContainer = document.querySelector(".sidebar-items");
  if (!sidebarItemsContainer) return;

  const categoriesToShow = getChunkedCategories(displayCategories, currentCategoryChunk, categoriesPerChunk);
  
  const categoriesHTML = categoriesToShow.map((c) => {
    const isActive = c.category_id === selectedCategoryId;
    return `
      <div class="sidebar-item ${isActive ? "sidebar-active" : ""}" data-category-id="${c.category_id}">
        <span class="sidebar-item-name">${c.category_name}</span>
        <span class="sidebar-item-count">${c.channels ? c.channels.length : 0}</span>
      </div>`;
  }).join("");

  sidebarItemsContainer.innerHTML = categoriesHTML;
};


  // ===== RENDER SIDEBAR CATEGORIES =====
const renderSidebarCategories = () => {
  const filtered = getFilteredCategories();
  
  // Use current search query if present
 const query = qs(".sidebar-search-input")
  ? qs(".sidebar-search-input").value.toLowerCase()
  : "";

  const displayCategories = query 
    ? filtered.filter(c => c.category_name.toLowerCase().includes(query))
    : filtered;

  const categoriesToShow = getChunkedCategories(displayCategories, currentCategoryChunk, categoriesPerChunk);
  
  const categoriesHTML = categoriesToShow.map((c) => {
    const isActive = c.category_id === selectedCategoryId;
    const hasAdult = categoryHasAdultContent(c.category_id);
    const isLocked = hasAdult && lockedCategories.has(c.category_id);
    
    return `
      <div class="sidebar-item ${isActive ? "sidebar-active" : ""} ${isLocked ? "sidebar-locked" : ""}" 
           data-category-id="${c.category_id}"
           data-has-adult="${hasAdult}">
        <span class="sidebar-item-name">
          <span class="sidebar-text">${c.category_name}</span>
          ${isLocked ? '<i class="fa fa-lock sidebar-lock"></i>' : ''}
        </span>
        <span class="sidebar-item-count">${c.channels ? c.channels.length : 0}</span>
      </div>`;
  }).join("");

  // Only update the ITEMS, not the search box itself, to prevent losing focus
  const sidebarItemsContainer = qs(".sidebar-items");
  if (sidebarItemsContainer) {
    sidebarItemsContainer.innerHTML = categoriesHTML;
  } else {
    // Initial render of the whole sidebar structure
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
        </div>`;
      setupSidebarSearchListener(); // Attach listener after creating element
    }
  }
};

// ===== LOAD MORE CATEGORIES FUNCTION =====
const loadMoreCategories = () => {
  if (isLoadingMoreCategories) {
    console.log("⏳ Already loading categories...");
    return;
  }
  
  const filtered = allCategoriesData.length > 0 ? allCategoriesData : getFilteredCategories();
  const hasMore = hasMoreCategoriesAvailable(filtered, currentCategoryChunk, categoriesPerChunk);
  
  if (!hasMore) {
    console.log("✅ No more categories to load");
    return;
  }
  
  isLoadingMoreCategories = true;
  currentCategoryChunk++;
  
  console.log(`📁 Loading category chunk ${currentCategoryChunk}...`);
  
  setTimeout(() => {
    renderSidebarCategories();
    isLoadingMoreCategories = false;
    
    // Maintain sidebar focus
    const sidebarItems = qsa(".sidebar-item");
    if (sidebarItems.length > focusedSidebarIndex) {
      setSidebarFocus(focusedSidebarIndex);
    }
  }, 100);
};


// Initialize locked categories
const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist")) || {};
const hasParentalPassword = selectedPlaylist.parentalPassword && selectedPlaylist.parentalPassword.length > 0;

if (hasParentalPassword) {
  const filtered = getFilteredCategories();
  filtered.forEach(cat => {
    if (categoryHasAdultContent(cat.category_id)) {
      lockedCategories.add(cat.category_id);
    }
  });
}

  window.updateLiveTvSidebar = renderSidebarCategories;

  // ===== GLOBAL RENDER FUNCTION FOR SORTING =====
// ===== GLOBAL RENDER FUNCTION FOR SORTING =====
window.renderLiveTv = () => {
  console.log("🔄 Refreshing Live TV page after sorting");
  
  // Reset navigation state
  inChannelGrid = true;
  inSidebar = false;
  inSidebarSearch = false;
  inHeaderSearch = false;
  inEPG = false;
  inVideoPlayer = false;
  inFavoriteBtn = false;
  inRemoveHistoryBtn = false;
  inAspectRatioBtn = false;
  isMenuDotsActive = false;
  
  // Reset focus index
  focusedChannelIndex = 0;
  
  // Re-render channels with new sort order
  renderChannels();
  renderSidebarCategories();
  
  // Restore focus to first channel
  setTimeout(() => {
    const channels = qsa(".channel-card");
    if (channels.length > 0) {
      // Remove all existing focus
      removeAllFocus();
      
      // Set focus on first channel
      focusedChannelIndex = 0;
      setFocus(channels, focusedChannelIndex, "channel-card-focused");
      
      console.log("✅ Focus restored to channel grid");
    }
  }, 100);
};

  // CLICK HANDLER
  // ===== CLICK HANDLER (UPDATED) =====
  function handleClick(e) {

      if (!isPageFullyLoaded) {
    e.preventDefault();
    e.stopPropagation();
    
    // SHOW VISUAL FEEDBACK
    const loadingSubtext = document.getElementById("loadingSubtext");
    if (loadingSubtext) {
      loadingSubtext.textContent = "Please wait - channels are still loading...";
      loadingSubtext.style.color = "#fbbf24"; // Yellow color
      
      // Flash the text
      loadingSubtext.style.animation = "pulse 0.5s ease-in-out";
      setTimeout(() => {
        loadingSubtext.style.animation = "";
      }, 500);
    }
    
    console.log("⏳ Please wait - page is still loading...");
    return;
  }
    console.log("Click detected on:", e.target);
    if (localStorage.getItem("currentPage") !== "liveTvPage") return;

    const menuDots = e.target.closest(".menu-dots");
    if (menuDots) {
      e.stopPropagation();
      openSidebar("liveTvPage");
      return;
    }

    if (inPasswordModal) {
      // Submit button
      if (e.target.classList.contains("password-submit-btn")) {
    verifyPasswordForCategory(); // Changed function name
        return;
      }

      // Cancel button
      if (e.target.classList.contains("password-cancel-btn")) {
        hidePasswordModal();
        return;
      }

      // Click outside modal to close
      if (e.target.id === "passwordModalOverlay") {
        hidePasswordModal();
        return;
      }

      return; // Block all other clicks when modal is open
    }

    // Remove from history button click
    const removeHistoryBtn = e.target.closest(".remove-history-btn");
    if (removeHistoryBtn) {
      e.stopPropagation();

      const card = removeHistoryBtn.closest(".channel-card");
      if (!card) return;

      const streamId = card.dataset.streamId;
      const channelData = allStreams.find((ch) => ch.stream_id == streamId);

      if (channelData) {
        removeFromHistory(channelData);
      }
      return;
    }
    // Check if click is on favorite button OR its children (svg/path)
  // Check if click is on favorite button OR its children (svg/path)
const favBtn = e.target.closest(".favorite-btn");
const svg = e.target.closest("svg");
const isFavClick = favBtn || (svg && svg.parentElement.classList.contains("favorite-btn"));

if (favBtn || isFavClick) {
  e.stopPropagation();

  const targetBtn = favBtn || (svg ? svg.parentElement : null);
  if (!targetBtn) return;
  
  const card = targetBtn.closest(".channel-card");
  if (!card) return;

  const streamId = card.dataset.streamId;
  const channelData = allStreams.find((ch) => ch.stream_id == streamId);

  if (channelData) {
    toggleFavorite(channelData);

    if (selectedCategoryId === "favorites") {
      setTimeout(() => {
        renderChannels();
        renderSidebarCategories();
        const channels = qsa(".channel-card");
        if (channels.length > 0) {
          focusedChannelIndex = Math.min(
            focusedChannelIndex,
            channels.length - 1
          );
          setFocus(channels, focusedChannelIndex, "channel-card-focused");
        }
      }, 100);
    }
  }
  return;
}
  

    if (favBtn || isFavClick) {
      e.stopPropagation();

      const targetBtn = favBtn || e.target.closest("svg").parentElement;
      const card = targetBtn.closest(".channel-card");

      if (!card) return;

      const streamId = card.dataset.streamId;
      const channelData = allStreams.find((ch) => ch.stream_id == streamId);

      if (channelData) {
        toggleFavorite(channelData);

        if (selectedCategoryId === "favorites") {
          setTimeout(() => {
            renderChannels();
            renderSidebarCategories();
            const channels = qsa(".channel-card");
            if (channels.length > 0) {
              focusedChannelIndex = Math.min(
                focusedChannelIndex,
                channels.length - 1
              );
              setFocus(channels, focusedChannelIndex, "channel-card-focused");
            }
          }, 100);
        }
      }
      return;
    }


   

    // Channel card click
    const card = e.target.closest(".channel-card");
    if (card) {
      const streamId = card.dataset.streamId;
      const channelName = card.dataset.name;
      const channelLogo = card.dataset.logo;

      const channelData = allStreams.find((ch) => ch.stream_id == streamId);

      if (channelData) {
        playChannel(channelData);
      }
      return;
    }

  // Sidebar category click
// Sidebar category click
// Sidebar category click
const sidebarItem = e.target.closest(".sidebar-item");
if (sidebarItem) {
  const catId = sidebarItem.dataset.categoryId;
  const hasAdult = sidebarItem.dataset.hasAdult === "true";
  const isLocked = lockedCategories.has(catId);
  
  // Re-lock previous category if switching away
  if (previousCategoryId && previousCategoryId !== catId) {
    relockPreviousCategory(previousCategoryId);
  }
  
  // Check if category is locked
  if (hasAdult && isLocked) {
    // Show password modal to unlock category
    showPasswordModal(catId);
    return;
  }
  
  // Category is unlocked or has no adult content - switch to it
  selectedCategoryId = catId;
  previousCategoryId = catId;
  currentChunk = 1;

  // **SHOW CHANNEL GRID LOADING OVERLAY**
  const channelGrid = qs(".channel-grid");
  if (channelGrid) {
    channelGrid.innerHTML = ChannelGridLoadingOverlay();
  }

  focusedChannelIndex = 0;

  // **GET CHANNELS TO PRELOAD**
  const filtered = getFilteredCategories();
  const selectedCat = filtered.find((c) => c.category_id === selectedCategoryId);
  const allChannels = selectedCat ? selectedCat.channels || [] : [];
  const channelsToPreload = getChunkedChannels(allChannels, currentChunk, pageSize);

  // **PRELOAD NEW CATEGORY IMAGES**
  preloadChannelImages(
    channelsToPreload,
    // Progress callback
    (progress, loaded, total) => {
      const channelProgressFill = document.getElementById("channelProgressFill");
      const channelProgressText = document.getElementById("channelProgressText");
      const channelLoadingSubtext = document.getElementById("channelLoadingSubtext");
      
      if (channelProgressFill) {
        channelProgressFill.style.width = progress + "%";
      }
      
      if (channelProgressText) {
        channelProgressText.textContent = Math.round(progress) + "%";
      }
      
      if (channelLoadingSubtext) {
        // channelLoadingSubtext.textContent = `Loading images ${loaded}/${total}...`;
      }
    },
    // Complete callback
    () => {
      renderChannels();
      renderSidebarCategories();

      // **REMOVE CHANNEL GRID LOADING OVERLAY**
      const channelGridLoadingOverlay = document.getElementById("channelGridLoading");
      if (channelGridLoadingOverlay) {
        channelGridLoadingOverlay.style.opacity = "0";
        channelGridLoadingOverlay.style.transition = "opacity 0.3s ease";
        setTimeout(() => {
          channelGridLoadingOverlay.remove();
        }, 300);
      }

      setTimeout(() => {
        const channels = qsa(".channel-card");
        if (channels.length > 0) {
          setFocus(channels, 0, "channel-card-focused");
          inChannelGrid = true;
          inSidebar = false;
        }
      }, 50);
    }
  );
  
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


  // Show both play button and aspect ratio button
// Show both play button and aspect ratio button
const showVideoControls = () => {
  const playPauseBtn = document.querySelector(".play-pause-btn") || document.querySelector("#live-play-pause-btn");
  const aspectRatioDiv = document.querySelector(".videojs-aspect-ratio-div");
  
  if (playPauseBtn) {
    playPauseBtn.style.display = "flex";
    playPauseBtn.style.opacity = "1";
    playPauseBtn.style.transition = "opacity 0.3s ease";
  }
  
  // CRITICAL: Check fullscreen status before showing
  if (aspectRatioDiv) {
    const isFs = !!(document.fullscreenElement || 
                    document.webkitFullscreenElement || 
                    document.mozFullScreenElement || 
                    document.msFullscreenElement);
    
    if (isFs) {
      aspectRatioDiv.style.display = "block";
      aspectRatioDiv.style.opacity = "1";
      aspectRatioDiv.style.transition = "opacity 0.3s ease";
    } else {
      // Force hide if not in fullscreen
      aspectRatioDiv.style.display = "none";
      aspectRatioDiv.style.opacity = "0";
    }
  }
  
  // Always restart auto-hide timer
  startVideoControlsHideTimer();
};

// Make it globally accessible
window.showVideoControls = showVideoControls;

// Start timer to auto-hide video controls after 3 seconds
// Start timer to auto-hide video controls after 3 seconds
const startVideoControlsHideTimer = () => {
  if (videoControlsHideTimer) {
    clearTimeout(videoControlsHideTimer);
    videoControlsHideTimer = null;
  }
  
  videoControlsHideTimer = setTimeout(() => {
    // Check if video is playing
    let isPlaying = false;
    if (window.livePlayer) {
      try {
        if (window.livePlayer._fp) {
          isPlaying = window.livePlayer._fp.playing;
        } else {
          isPlaying = window.livePlayer.paused ? !window.livePlayer.paused() : false;
        }
      } catch (err) {
        console.warn("Error checking play state:", err);
      }
    }
    
    if (isPlaying) {
      const playPauseBtn = document.querySelector(".play-pause-btn") || document.querySelector("#live-play-pause-btn");
      const aspectRatioDiv = document.querySelector(".videojs-aspect-ratio-div");
      
      if (playPauseBtn) {
        playPauseBtn.style.opacity = "0";
        playPauseBtn.style.transition = "opacity 0.3s ease";
        setTimeout(() => {
          playPauseBtn.style.display = "none";
        }, 300);
      }
      
      // CRITICAL: Only hide aspect ratio if in fullscreen
      if (aspectRatioDiv) {
        const isFs = !!(document.fullscreenElement || 
                        document.webkitFullscreenElement || 
                        document.mozFullScreenElement || 
                        document.msFullscreenElement);
        
        if (isFs) {
          aspectRatioDiv.style.opacity = "0";
          aspectRatioDiv.style.transition = "opacity 0.3s ease";
          setTimeout(() => {
            aspectRatioDiv.style.display = "none";
          }, 300);
        } else {
          // Force hide immediately if not fullscreen
          aspectRatioDiv.style.display = "none";
          aspectRatioDiv.style.opacity = "0";
        }
      }
    }
    
    videoControlsHideTimer = null;
  }, 3000);
};


window.startVideoControlsHideTimer = startVideoControlsHideTimer;

// Stop auto-hide timer
const stopVideoControlsHideTimer = () => {
  if (videoControlsHideTimer) {
    clearTimeout(videoControlsHideTimer);
    videoControlsHideTimer = null;
  }
};

  // KEY NAVIGATION
  function handleKeydown(e) {

      // BLOCK ALL NAVIGATION UNTIL PAGE IS FULLY LOADED
  if (!isPageFullyLoaded) {
    e.preventDefault();
    e.stopPropagation();
    
    // SHOW VISUAL FEEDBACK
    const loadingSubtext = document.getElementById("loadingSubtext");
    if (loadingSubtext) {
      loadingSubtext.textContent = "Please wait - channels are still loading...";
      loadingSubtext.style.color = "#fbbf24"; // Yellow color
      
      // Flash the text
      loadingSubtext.style.animation = "pulse 0.5s ease-in-out";
      setTimeout(() => {
        loadingSubtext.style.animation = "";
      }, 500);
    }
    
    console.log("⏳ Please wait - page is still loading...");
    return;
  }
  
  

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

    // In handleKeydown, after password modal checks, add:

    // MENU DOTS NAVIGATION

// MENU DOTS NAVIGATION
if (isMenuDotsActive) {
    // BACK/ESCAPE: Go back to dashboard
    if (backKeys.includes(e.key) || backKeys.includes(e.keyCode)) {
        console.log("⬅️ Back pressed from menu dots - going to dashboard");
        e.preventDefault();
        e.stopPropagation();
        
        // Clean up menu dots focus
        isMenuDotsActive = false;
        const menuDots = qs('.menu-dots');
        if (menuDots) menuDots.classList.remove('focused');
        
        // Dispose player
        disposeLivePlayer();
        
        if (window.livePlayer) {
            try {
                window.livePlayer.dispose();
            } catch {}
            window.livePlayer = null;
        }
        
        // Navigate back
        localStorage.setItem("currentPage", "dashboard");
        
        if (typeof Router !== "undefined" && Router.showPage) {
            Router.showPage("dashboard");
        } else if (typeof navigateTo === "function") {
            navigateTo("dashboard-page");
        }
        return;
    }
    

     if (isDown) {
        isMenuDotsActive = false;
        inSidebarSearch = true;
        // isHeaderSearchActive = false;
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

    // DOWN: Open sidebar
    // if (isDown) {
    //     openSidebar('liveTvPage');
    //     e.preventDefault();
    //     return;
    // }
    
    // LEFT: Go back to header search
    if (isLeft) {
        isMenuDotsActive = false;
        inHeaderSearch = true;
        const menuDots = qs('.menu-dots');
        if (menuDots) menuDots.classList.remove('focused');
        setHeaderSearchFocus(true);
        e.preventDefault();
        return;
    }
    
    // RIGHT: Stay on menu dots (no action)
    if (isRight) {
        e.preventDefault();
        return;
    }
    
    // UP: Stay on menu dots (no action)
    if (isUp) {
        e.preventDefault();
        return;
    }
    
    // ENTER: Open sidebar
    if (isEnter) {
        openSidebar('liveTvPage');
        e.preventDefault();
        return;
    }
    
    return; // Block other keys when menu dots focused
}

   if (inPasswordModal) {
  // Debounce rapid key presses on Tizen
  if (window.passwordModalDebounce) {
    return;
  }
  
  window.passwordModalDebounce = true;
  setTimeout(() => {
    window.passwordModalDebounce = false;
  }, 100);
  
  if (e.key === "ArrowDown") {
    passwordModalFocusIndex++;
    if (passwordModalFocusIndex > 2) passwordModalFocusIndex = 2;
    
    // Blur input when moving away
    const input = document.getElementById("passwordModalInput");
    if (input && passwordModalFocusIndex > 0) {
      input.blur();
    }
    
    updatePasswordModalFocus();
    e.preventDefault();
    return;
  }


    if (e.key === "ArrowRight") {
    passwordModalFocusIndex++;
    if (passwordModalFocusIndex > 2) passwordModalFocusIndex = 2;
    

    updatePasswordModalFocus();
    e.preventDefault();
    return;
  }

  if (e.key === "ArrowLeft") {
  passwordModalFocusIndex--;
  if (passwordModalFocusIndex < 0) passwordModalFocusIndex = 0;

  // Focus input if we moved back to it
  if (passwordModalFocusIndex === 0) {
    const input = document.getElementById("passwordModalInput");
    if (input) input.focus();
  }

  updatePasswordModalFocus();
  e.preventDefault();
  return;
}


  if (e.key === "ArrowUp") {
    passwordModalFocusIndex--;
    if (passwordModalFocusIndex < 0) passwordModalFocusIndex = 0;
    updatePasswordModalFocus();
    e.preventDefault();
    return;
  }
 

  if (e.key === "Enter") {
    // Blur input before any action
    const input = document.getElementById("passwordModalInput");
    if (input) {
      input.blur();
    }
    
    if (passwordModalFocusIndex === 1) {
      // Submit
    verifyPasswordForCategory(); // Changed function name
    } else if (passwordModalFocusIndex === 2) {
      // Cancel
      hidePasswordModal();
    } else if (passwordModalFocusIndex === 0) {
      // Move from input to submit button
      passwordModalFocusIndex = 1;
      updatePasswordModalFocus();
    }
    e.preventDefault();
    return;
  }

  // Back button closes modal
  if (e.keyCode === 10009 || e.key === "Escape" || e.key === "Back") {
    hidePasswordModal();
    e.preventDefault();
    return;
  }

  return;
}

    // Handle back button
    // Handle back button
    if (backKeys.includes(e.key) || backKeys.includes(e.keyCode)) {
      // Check if in fullscreen first
      if (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      ) {
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
   // If user is in video player area
if (inVideoPlayer) {
  const videoDiv = qs(".live-video-player-div");
  const playPauseBtn = qs(".play-pause-btn") || qs("#live-play-pause-btn");
  const aspectBtn = qs(".aspect-ratio-btn") || qs("#videojs-aspect-ratio");

  // Show controls whenever user navigates in video area
  showVideoControls();

  if (isUp) {
    inVideoPlayer = false;
    inChannelGrid = true;
    stopVideoControlsHideTimer(); // Stop timer when leaving video
    if (videoDiv) {
      videoDiv.classList.remove("video-focused");
      videoDiv.style.outline = "none";
      videoDiv.style.border = "none";
    }
    if (playPauseBtn) playPauseBtn.style.border = "4px solid #0ea5e9";
    if (aspectBtn) aspectBtn.style.border = "none";
    focusedChannelIndex = 0;
    setFocus(channels, focusedChannelIndex, "channel-card-focused");
    e.preventDefault();
    return;
  }

  if (isDown) {
    
    // Go to play/pause button
    inVideoPlayer = false;
    inPlayPauseBtn = true;
    showVideoControls(); // Show controls when moving to play button
    if (videoDiv) {
      videoDiv.style.outline = "none";
      videoDiv.style.border = "none";
    }
    if (playPauseBtn) {
      playPauseBtn.style.display = "flex";
      playPauseBtn.style.opacity = "1";
      playPauseBtn.classList.add("focused");
    }
    e.preventDefault();
    return;
  }

  if (isEnter) {
    // Click on video container to enter fullscreen
    if (videoDiv) {
      try {
        if (!document.fullscreenElement && 
            !document.webkitFullscreenElement && 
            !document.mozFullScreenElement && 
            !document.msFullscreenElement) {
          // Enter fullscreen - try different methods for TV compatibility
          if (videoDiv.requestFullscreen) {
            videoDiv.requestFullscreen();
          } else if (videoDiv.webkitRequestFullscreen) {
            videoDiv.webkitRequestFullscreen();
          } else if (videoDiv.mozRequestFullScreen) {
            videoDiv.mozRequestFullScreen();
          } else if (videoDiv.msRequestFullscreen) {
            videoDiv.msRequestFullscreen();
          }
        } else {
          // Exit fullscreen
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
          } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
          }
        }
      } catch (err) {
        console.error("Fullscreen error:", err);
      }
    }
    showVideoControls(); // Show controls on any interaction
    e.preventDefault();
    return;
  }

  if (isRight) {
    // Go to EPG list
    inVideoPlayer = false;
    inEPG = true;
    stopVideoControlsHideTimer(); // Stop timer when leaving video
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

  return;
}

    // Play/Pause button navigation
   if (inPlayPauseBtn) {
  const playPauseBtn = qs(".play-pause-btn") || qs("#live-play-pause-btn");
  const videoDiv = qs(".live-video-player-div");
  const aspectBtn = qs(".aspect-ratio-btn") || qs("#videojs-aspect-ratio");

  // Show controls on any navigation
  showVideoControls();
   const isFs = !!(document.fullscreenElement || 
                    document.webkitFullscreenElement || 
                    document.mozFullScreenElement || 
                    document.msFullscreenElement);
if (!isFs && window._justExitedFullscreen) {
    // Clear the flag
    window._justExitedFullscreen = false;
    
    // Ensure focus is on play/pause button
    if (playPauseBtn) {
      playPauseBtn.classList.add("focused");
      playPauseBtn.style.border = "3px solid #0ea5e9";
    }
  }
  

  if (isUp) {
    // Go back to video container
    inPlayPauseBtn = false;
    inVideoPlayer = true;
    if (playPauseBtn) {
      playPauseBtn.classList.remove("focused");
      playPauseBtn.style.display = "flex";
      playPauseBtn.style.opacity = "1";
    }
    if (videoDiv) {
      videoDiv.classList.add("video-focused");
      videoDiv.style.border = "3px solid #0ea5e9";
      videoDiv.style.boxSizing = "border-box";
      videoDiv.style.outline = "3px solid #0ea5e9";
      videoDiv.style.outlineOffset = "-3px";
    }
    e.preventDefault();
    return;
  }




  if (isDown && isFs) {
    // Go to aspect ratio button

    inPlayPauseBtn = false;
    inAspectRatioBtn = true;
    if (playPauseBtn) playPauseBtn.classList.remove("focused");
    if (aspectBtn) {
      aspectBtn.classList.add("videojs-aspect-ratio-btn-focused");
      aspectBtn.style.border = "3px solid var(--gold)";
      aspectBtn.scrollIntoView({ block: "nearest" });
    }
    e.preventDefault();
    return;
  }

  if (isEnter) {
    // Toggle play/pause
    if (window.livePlayer) {
      try {
        if (window.livePlayer._fp) {
          const fp = window.livePlayer._fp;
          if (fp.playing) {
            fp.pause();
          } else {
            fp.resume();
          }
        } else {
          if (window.livePlayer.paused()) {
            window.livePlayer.play();
          } else {
            window.livePlayer.pause();
          }
        }
      } catch (err) {
        console.warn("Play/Pause toggle failed:", err);
      }
    } else {
      togglePlayPause();
    }
    showVideoControls(); // Show controls on interaction
    e.preventDefault();
    return;
  }
}

    // Aspect ratio button navigation
if (inAspectRatioBtn || window.liveTvPageState.inAspectRatioBtn) {

  const aspectBtn = qs(".aspect-ratio-btn") || qs("#videojs-aspect-ratio");
  const playPauseBtn = qs(".play-pause-btn") || qs("#live-play-pause-btn");

  // Show controls on any navigation
  showVideoControls();

  if (isUp) {
    inAspectRatioBtn = false;
    inPlayPauseBtn = true;
       window.liveTvPageState.inAspectRatioBtn = false;
    window.liveTvPageState.inPlayPauseBtn = true;
    if (aspectBtn) {
      aspectBtn.classList.remove("videojs-aspect-ratio-btn-focused");
      aspectBtn.style.border = "none";
    }
    if (playPauseBtn) {
      playPauseBtn.classList.add("focused");
      playPauseBtn.style.display = "flex";
      playPauseBtn.style.opacity = "1";
    }
    e.preventDefault();
    return;
  }

 

 if (isEnter) {
  // Check fullscreen before allowing toggle
  const isFs = !!(document.fullscreenElement || 
                  document.webkitFullscreenElement || 
                  document.mozFullScreenElement || 
                  document.msFullscreenElement);
  
  if (isFs) {
        window._aspectRatioWasUsed = true;
    window.liveTvPageState.inAspectRatioBtn = true; 
    toggleAspectRatio();
    showVideoControls(); // Show controls and restart timer
  } else {
    console.log("🚫 Aspect ratio blocked - not in fullscreen");
  }
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
                    searchInput.selectionStart = searchInput.selectionEnd = 0;

          }
        }
        e.preventDefault();
        return;
      }
      // DOWN: Move to channel grid
      if (isDown) {
        inHeaderSearch = false;
        inSidebarSearch = true;
        // isHeaderSearchActive = false;
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

      // RIGHT: Move to menu dots
      if (isRight) {
        inHeaderSearch = false;
        // isHeaderSearchActive = false;
        setHeaderSearchFocus(false);

        const headerInput = qs(".search-input");
        if (headerInput) {
          headerInput.blur();
          headerInput.selectionStart = headerInput.selectionEnd = 0;
        }

        setFocusOnMenuDots();
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
  // SIDEBAR SEARCH BOX NAVIGATION
if (inSidebarSearch) {
  const searchInput = document.querySelector(".sidebar-search-input");

  // DOWN: Exit search and go to the first item in the filtered list
  if (isDown) {
    // 1. Force the input to release focus
    if (searchInput) {
      searchInput.blur();
    }
    // 2. Set states
    isSidebarSearchActive = false;
    inSidebarSearch = false;
    inSidebar = true;
    
    // 3. Visual cleanup
    setSidebarSearchFocus(false);
    
    // 4. Focus first sidebar item
    focusedSidebarIndex = 0;
    const sidebarItems = document.querySelectorAll(".sidebar-item");
    if (sidebarItems.length > 0) {
      setSidebarFocus(0);
    }
    
    e.preventDefault();
    return;
  }

  // UP: Exit search and go to the Top Channel Search
  if (isUp) {
    if (searchInput) {
      searchInput.blur();
    }
    isSidebarSearchActive = false;
    inSidebarSearch = false;
    inHeaderSearch = true;
    
    setSidebarSearchFocus(false);
    setHeaderSearchFocus(true);
    
    e.preventDefault();
    return;
  }

  // ENTER: Toggle typing mode
  if (isEnter) {
    isSidebarSearchActive = !isSidebarSearchActive;
    if (searchInput) {
      if (isSidebarSearchActive) {
        searchInput.focus();
      } else {
        searchInput.blur();
      }
    }
    e.preventDefault();
    return;
  }

  // If the user is currently typing (cursor in box), 
  // we let the browser handle characters, but NOT Up/Down 
  // (which we already handled above)
  if (isSidebarSearchActive) {
    // Allow Left/Right to move cursor inside text, but stop other navigation
    if (isLeft || isRight) {
       return; 
    }
  }
}

    // Sidebar navigation
 // Sidebar navigation
if (inSidebar) {

    const filtered = getFilteredCategories();
const hasMoreCats = hasMoreCategoriesAvailable(filtered, currentCategoryChunk, categoriesPerChunk);
  

  // UP: Go back to sidebar search box or stay at first item
  if (isUp) {
    if (focusedSidebarIndex > 0) {
      focusedSidebarIndex--;
      setSidebarFocus(focusedSidebarIndex);
    } else {
      // Move to sidebar search box
      inSidebar = false;
      inSidebarSearch = true;
      sidebarItems.forEach((i) => i.classList.remove("sidebar-focused"));
      setSidebarSearchFocus(true);
    }
    e.preventDefault();
    return;
  }

  if (isDown) {
    const sidebarItems = qsa(".sidebar-item");
    
    if (focusedSidebarIndex < sidebarItems.length - 1) {
      focusedSidebarIndex++;
      setSidebarFocus(focusedSidebarIndex);
      
      // **AUTO-LOAD MORE CATEGORIES WHEN NEAR END**
      const isNearEnd = focusedSidebarIndex >= sidebarItems.length - 3;
      if (isNearEnd && hasMoreCats && !isLoadingMoreCategories) {
        console.log("🔄 Near end of categories - auto-loading...");
        loadMoreCategories();
      }
    }
    e.preventDefault();
    return;
  }
  // RIGHT: Go back to channels - ALWAYS START FROM FIRST CHANNEL
  if (isRight) {
    inSidebar = false;
    inChannelGrid = true;
    sidebarItems.forEach((i) => i.classList.remove("sidebar-focused"));
    
    // ALWAYS reset to first channel
    focusedChannelIndex = 0;
    
    setFocus(channels, focusedChannelIndex, "channel-card-focused");
    
    // Scroll channel grid to start
    const channelGrid = qs(".channel-grid");
    if (channelGrid) {
      channelGrid.scrollTo({ left: 0, behavior: "smooth" });
    }
    
    e.preventDefault();
    return;
  }

  // LEFT: Stay in sidebar
  if (isLeft) {
    e.preventDefault();
    return;
  }

  // ENTER: Click sidebar item
// ENTER: Click sidebar item or unlock category
// ENTER: Click sidebar item or unlock category
if (isEnter) {
  const sidebarItems = qsa(".sidebar-item");
  const selectedItem = sidebarItems[focusedSidebarIndex];
  
  if (selectedItem) {
    const catId = selectedItem.dataset.categoryId;
    const hasAdult = selectedItem.dataset.hasAdult === "true";
    const isLocked = lockedCategories.has(catId);
    
    // Re-lock previous category if switching away
    if (previousCategoryId && previousCategoryId !== catId) {
      relockPreviousCategory(previousCategoryId);
    }
    
    if (hasAdult && isLocked) {
      // Show password modal
      showPasswordModal(catId);
    } else {
      // Switch to category
      selectedItem.click();
    }
  }
  
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
          epgItems.forEach((item) => item.classList.remove("epg-focused"));
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
        epgItems.forEach((item) => item.classList.remove("epg-focused"));
        inEPG = false;
        inVideoPlayer = true;
        inPlayPauseBtn = false;
        inAspectRatioBtn = false;
          showVideoControls(); // Show controls when entering video from EPG

        const videoDiv = qs(".live-video-player-div");
        const playPauseBtn = qs(".play-pause-btn") || qs("#live-play-pause-btn");
        const aspectBtn = qs(".aspect-ratio-btn") || qs("#videojs-aspect-ratio");
        if (videoDiv) {
          videoDiv.classList.add("video-focused");
          videoDiv.style.border = "3px solid #0ea5e9"; // Blue border
          videoDiv.style.boxSizing = "border-box"; // Important: keeps border inside
          videoDiv.style.outline = "3px solid #0ea5e9"; // Add outline for full visibility
          videoDiv.style.outlineOffset = "-3px";
        }
        if (playPauseBtn) playPauseBtn.style.border = "4px solid #0ea5e9";
        if (aspectBtn) {
          aspectBtn.classList.remove("videojs-aspect-ratio-btn-focused");
          aspectBtn.style.border = "none";
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
  const favBtn = card ? card.querySelector(".favorite-btn") : null;
  const rows = 3;

  if (isLeft) {
    // Go back to current channel card
    inFavoriteBtn = false;
    inChannelGrid = true;
    if (favBtn) favBtn.style.outline = "none";
    setFocus(channels, focusedChannelIndex, "channel-card-focused");
    e.preventDefault();
    return;
  }

  if (isRight) {
    const card = channels[focusedChannelIndex];
    const removeBtn = card ? card.querySelector(".remove-history-btn") : null;

    // If remove button exists (in history view), go to it
    if (removeBtn && selectedCategoryId === "channelHistory") {
      inFavoriteBtn = false;
      inRemoveHistoryBtn = true;
      if (favBtn) favBtn.style.outline = "none";
      setRemoveHistoryBtnFocus(true);
      e.preventDefault();
      return;
    }

    // Otherwise, move to next column's card (same row)
    inFavoriteBtn = false;
    inChannelGrid = true;
    if (favBtn) favBtn.style.outline = "none";

    const nextChannelIndex = focusedChannelIndex + rows;
    
    if (nextChannelIndex < channels.length) {
      focusedChannelIndex = nextChannelIndex;
    }
    
    setFocus(channels, focusedChannelIndex, "channel-card-focused");
    e.preventDefault();
    return;
  }

  if (isEnter) {
    // Click the favorite button
    if (favBtn) favBtn.click();
    e.preventDefault();
    return;
  }

  // UP: Move to card above in same column
  if (isUp) {
    inFavoriteBtn = false;
    inChannelGrid = true;
    if (favBtn) favBtn.style.outline = "none";
    
    const currentRow = focusedChannelIndex % rows;
    
    if (currentRow > 0) {
      focusedChannelIndex--;
    }
    
    setFocus(channels, focusedChannelIndex, "channel-card-focused");
    e.preventDefault();
    return;
  }

  // DOWN: Move to card below or go to video player
 // DOWN: Move to card below or go to video player
if (isDown) {
  inFavoriteBtn = false;
  inChannelGrid = true;
  if (favBtn) favBtn.style.outline = "none";
  
  const nextIndex = focusedChannelIndex + 1;
  const currentRow = focusedChannelIndex % rows;
  const nextRow = nextIndex % rows;
  
  // Check if we can move down
  if (nextIndex < channels.length && nextRow > currentRow) {
    focusedChannelIndex = nextIndex;
    setFocus(channels, focusedChannelIndex, "channel-card-focused");
  } else {
    // At bottom - check if channel is playing
    const playingCard = qs(".channel-card-playing");
    
    if (playingCard) {
      // Channel is playing - go to video player
      inChannelGrid = false;
      inVideoPlayer = true;
      inPlayPauseBtn = false;
      inAspectRatioBtn = false;
      
      channels.forEach((c) => c.classList.remove("channel-card-focused"));
      showAspectRatioButton();

      const videoDiv = qs(".live-video-player-div");
      const playPauseBtn = qs(".play-pause-btn") || qs("#live-play-pause-btn");
      const aspectBtn = qs(".aspect-ratio-btn") || qs("#videojs-aspect-ratio");
      
      if (videoDiv) {
        videoDiv.classList.add("video-focused");
        videoDiv.style.border = "3px solid #0ea5e9";
        videoDiv.style.boxSizing = "border-box";
        videoDiv.style.outline = "3px solid #0ea5e9";
        videoDiv.style.outlineOffset = "-3px";
      }
      if (playPauseBtn) playPauseBtn.style.border = "4px solid #0ea5e9";
      if (aspectBtn) {
        aspectBtn.classList.remove("videojs-aspect-ratio-btn-focused");
        aspectBtn.style.border = "none";
      }
    } else {
      // No channel playing - return focus to card
      setFocus(channels, focusedChannelIndex, "channel-card-focused");
    }
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
  const removeBtn = card ? card.querySelector(".remove-history-btn") : null;
  const rows = 3;

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
    // Move to next column's card (same row)
    inRemoveHistoryBtn = false;
    inChannelGrid = true;
    if (removeBtn) removeBtn.style.outline = "none";

    const nextChannelIndex = focusedChannelIndex + rows;

    if (nextChannelIndex < channels.length) {
      focusedChannelIndex = nextChannelIndex;
    }
    
    setFocus(channels, focusedChannelIndex, "channel-card-focused");
    e.preventDefault();
    return;
  }

  if (isEnter) {
    // Click the remove button
    if (removeBtn) removeBtn.click();
    e.preventDefault();
    return;
  }

  // UP: Move to card above
  if (isUp) {
    inRemoveHistoryBtn = false;
    inChannelGrid = true;
    if (removeBtn) removeBtn.style.outline = "none";
    
    const currentRow = focusedChannelIndex % rows;
    
    if (currentRow > 0) {
      focusedChannelIndex--;
    }
    
    setFocus(channels, focusedChannelIndex, "channel-card-focused");
    e.preventDefault();
    return;
  }

  // DOWN: Move to card below or go to video player
// DOWN: Move to card below or go to video player
if (isDown) {
  inRemoveHistoryBtn = false;
  inChannelGrid = true;
  if (removeBtn) removeBtn.style.outline = "none";
  
  const nextIndex = focusedChannelIndex + 1;
  const currentRow = focusedChannelIndex % rows;
  const nextRow = nextIndex % rows;
  
  if (nextIndex < channels.length && nextRow > currentRow) {
    focusedChannelIndex = nextIndex;
    setFocus(channels, focusedChannelIndex, "channel-card-focused");
  } else {
    // At bottom - check if channel is playing
    const playingCard = qs(".channel-card-playing");
    
    if (playingCard) {
      // Channel is playing - go to video player
      inChannelGrid = false;
      inVideoPlayer = true;
      inPlayPauseBtn = false;
      inAspectRatioBtn = false;
      
      channels.forEach((c) => c.classList.remove("channel-card-focused"));
      showAspectRatioButton();

      const videoDiv = qs(".live-video-player-div");
      const playPauseBtn = qs(".play-pause-btn") || qs("#live-play-pause-btn");
      const aspectBtn = qs(".aspect-ratio-btn") || qs("#videojs-aspect-ratio");
      
      if (videoDiv) {
        videoDiv.classList.add("video-focused");
        videoDiv.style.border = "3px solid #0ea5e9";
        videoDiv.style.boxSizing = "border-box";
        videoDiv.style.outline = "3px solid #0ea5e9";
        videoDiv.style.outlineOffset = "-3px";
      }
      if (playPauseBtn) playPauseBtn.style.border = "4px solid #0ea5e9";
      if (aspectBtn) {
        aspectBtn.classList.remove("videojs-aspect-ratio-btn-focused");
        aspectBtn.style.border = "none";
      }
    } else {
      // No channel playing - return focus to card
      setFocus(channels, focusedChannelIndex, "channel-card-focused");
    }
  }
  e.preventDefault();
  return;
}

  return;
}
    // CHANNEL GRID NAVIGATION
// CHANNEL GRID NAVIGATION
// CHANNEL GRID NAVIGATION
if (inChannelGrid) {
  const rows = 3;
  const totalChannels = channels.length;
  
  // **GET CATEGORY DATA FOR AUTO-LOADING**
  const filtered = getFilteredCategories();
  const selectedCat = filtered.find((c) => c.category_id === selectedCategoryId);
  const allChannels = selectedCat ? selectedCat.channels || [] : [];
const hasMore = hasMoreChannelsAvailable(allChannels, currentChunk, pageSize);
  
  // Calculate current position
  const currentRow = focusedChannelIndex % rows;
  const currentCol = Math.floor(focusedChannelIndex / rows);
  
  if (isUp) {
    if (currentRow > 0) {
      // Move up within same column
      focusedChannelIndex--;
      setFocus(channels, focusedChannelIndex, "channel-card-focused");
      
      const card = channels[focusedChannelIndex];
      if (card) {
        card.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
      }
    } else {
      // Already in first row - go to header search
      inChannelGrid = false;
      inHeaderSearch = true;
      channels.forEach((c) => c.classList.remove("channel-card-focused"));
      setHeaderSearchFocus(true);
    }
    e.preventDefault();
    return;
  }

  if (isDown) {
    const nextIndex = focusedChannelIndex + 1;
    const nextRow = nextIndex % rows;
    
    if (nextIndex < totalChannels && nextRow > currentRow) {
      // Move down within same column
      focusedChannelIndex = nextIndex;
      setFocus(channels, focusedChannelIndex, "channel-card-focused");
      
      const card = channels[focusedChannelIndex];
      if (card) {
        card.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
      }
    } else {
      // At bottom row - check if channel is playing
      const playingCard = qs(".channel-card-playing");
      
      if (playingCard) {
        // Channel is playing - go to video player
        inChannelGrid = false;
        inVideoPlayer = true;
        inPlayPauseBtn = false;
        inAspectRatioBtn = false;
        
        channels.forEach((c) => c.classList.remove("channel-card-focused"));
        showAspectRatioButton();

        const videoDiv = qs(".live-video-player-div");
        const playPauseBtn = qs(".play-pause-btn") || qs("#live-play-pause-btn");
        const aspectBtn = qs(".aspect-ratio-btn") || qs("#videojs-aspect-ratio");
        
        if (videoDiv) {
          videoDiv.classList.add("video-focused");
          videoDiv.style.border = "3px solid #0ea5e9";
          videoDiv.style.boxSizing = "border-box";
          videoDiv.style.outline = "3px solid #0ea5e9";
          videoDiv.style.outlineOffset = "-3px";
        }
        if (playPauseBtn) playPauseBtn.style.border = "4px solid #0ea5e9";
        if (aspectBtn) {
          aspectBtn.classList.remove("videojs-aspect-ratio-btn-focused");
          aspectBtn.style.border = "none";
        }
      }
    }
    e.preventDefault();
    return;
  }

  if (isLeft) {
    const prevIndex = focusedChannelIndex - rows;
    
    if (prevIndex >= 0) {
      // Move to previous column (left card in same row)
      focusedChannelIndex = prevIndex;
      setFocus(channels, focusedChannelIndex, "channel-card-focused");
      
      const card = channels[focusedChannelIndex];
      if (card) {
        card.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
      }
    } else {
      // First column - GO TO SIDEBAR SEARCH BOX
      inChannelGrid = false;
      inSidebarSearch = true;
      channels.forEach((c) => c.classList.remove("channel-card-focused"));
      setSidebarSearchFocus(true);
    }
    e.preventDefault();
    return;
  }

if (isRight) {
    // **CHECK IF NEAR END - AUTO LOAD MORE**
    const isNearEnd = focusedChannelIndex >= totalChannels - (rows * 2);
    
    if (isNearEnd && hasMore && !isLoadingMoreChannels) {
      console.log("🔄 Near end - auto-loading more channels...");
      loadMoreChannels();
    }
    
    // FIRST go to favorite button of current card
    inChannelGrid = false;
    inFavoriteBtn = true;
    
    // Only remove focus from the current card, not everything
    const currentCard = channels[focusedChannelIndex];
    if (currentCard) {
      currentCard.classList.remove("channel-card-focused");
    }
    
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





setTimeout(() => {
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeydown);



    // Progress: 10%
    updateLoadingProgress(10, "Initializing parental controls...");

        const sidebarArea = qs("#sidebar-area");
      if (sidebarArea) {
        sidebarArea.innerHTML = SidebarLoadingOverlay();
      }



      // Add fullscreen change listener to detect exit
// Add fullscreen change listener to detect exit
// Store handler globally so cleanup can access it
let fullscreenExitHandler = () => {
  const isFs = !!(document.fullscreenElement || 
                  document.webkitFullscreenElement || 
                  document.mozFullScreenElement || 
                  document.msFullscreenElement);
  
  if (!isFs && window._aspectRatioWasUsed && window.liveTvPageState.inAspectRatioBtn) {
    // Force navigation state change
    setTimeout(() => {
      inAspectRatioBtn = false;
      inPlayPauseBtn = true;
      window.liveTvPageState.inAspectRatioBtn = false;
      window.liveTvPageState.inPlayPauseBtn = true;
      
      const playPauseBtn = qs(".play-pause-btn") || qs("#live-play-pause-btn");
      const aspectBtn = qs(".aspect-ratio-btn") || qs("#videojs-aspect-ratio");
      
      if (aspectBtn) {
        aspectBtn.classList.remove("videojs-aspect-ratio-btn-focused");
        aspectBtn.style.border = "none";
      }
      
      if (playPauseBtn) {
        playPauseBtn.classList.add("focused");
        playPauseBtn.style.display = "flex";
        playPauseBtn.style.opacity = "1";
        playPauseBtn.style.border = "3px solid #0ea5e9";
      }
      
      console.log("🎯 FORCED focus to play/pause button");
      window._aspectRatioWasUsed = false;
    }, 100);
  }
};

document.addEventListener("fullscreenchange", fullscreenExitHandler);
document.addEventListener("webkitfullscreenchange", fullscreenExitHandler);
document.addEventListener("mozfullscreenchange", fullscreenExitHandler);
document.addEventListener("msfullscreenchange", fullscreenExitHandler);


    // ===== INITIALIZE LOCKED CATEGORIES FIRST =====
    const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist")) || {};
    const hasParentalPassword = selectedPlaylist.parentalPassword && selectedPlaylist.parentalPassword.length > 0;

    console.log("🔒 Parental password set:", hasParentalPassword);

    if (hasParentalPassword) {
      const allCategories = categories || window.liveCategories || [];
      const streams = window.currentAllStreams || allStreams || window.allLiveStreams || [];
      
      console.log("🔍 Total streams:", streams.length);
      console.log("🔍 Total categories:", allCategories.length);
      
      let adultChannelsFound = 0;
      streams.forEach(ch => {
        if (isAdultContent(ch)) {
          adultChannelsFound++;
        }
      });
      
      console.log("🔞 Total adult channels found:", adultChannelsFound);
      
      allCategories.forEach(cat => {
        const categoryChannels = streams.filter(s => s.category_id === cat.category_id);
        const hasAdult = categoryChannels.some(ch => isAdultContent(ch));
        
        if (hasAdult) {
          lockedCategories.add(cat.category_id);
        }
      });
      
      const hasAdultInAll = streams.some(ch => isAdultContent(ch));
      if (hasAdultInAll) {
        lockedCategories.add("All");
      }
      
      const currentPlaylistName = JSON.parse(localStorage.getItem("selectedPlaylist")).playlistName;
      const currentPlaylist = JSON.parse(localStorage.getItem("playlistsData")).find(
        pl => pl.playlistName === currentPlaylistName
      );
      const favoritesList = currentPlaylist.favoritesLiveTV || [];
      
      const favChannels = favoritesList.map(favItem => {
        if (typeof favItem === "number") {
          return streams.find(s => s.stream_id === favItem);
        }
        return favItem;
      }).filter(Boolean);
      
      const hasAdultInFav = favChannels.some(ch => isAdultContent(ch));
      if (hasAdultInFav) {
        lockedCategories.add("favorites");
      }
    }

    // Progress: 20%
    updateLoadingProgress(20, "Loading categories...");
    
    setTimeout(() => {
      // **SHOW SIDEBAR LOADING OVERLAY**
      const sidebarArea = qs("#sidebar-area");
    if (sidebarArea) {
    sidebarArea.innerHTML = `
      <div class="sidebar-loading-overlay" id="sidebarLoading">
        <div class="sidebar-loading-content">
          <div class="loading-text-small">Preparing Categories...</div>
          <div class="loading-subtext-small">Loading channels first</div>
        </div>
      </div>
    `;
  }
  
      
      setTimeout(() => {
      
        
        // Progress: 30%
        updateLoadingProgress(30, "Preparing channels...");
        
        setTimeout(() => {
          // **SHOW CHANNEL GRID LOADING OVERLAY**
          const channelGrid = qs(".channel-grid");
          if (channelGrid) {
            channelGrid.innerHTML = ChannelGridLoadingOverlay();
          }
          
          // **GET CHANNELS TO PRELOAD**
          const filtered = getFilteredCategories();
          let selectedCat = filtered.find((c) => c.category_id === selectedCategoryId);
          if (!selectedCat) {
            selectedCat = filtered[0];
            selectedCategoryId = selectedCat.category_id;
          }
          
          const allChannels = selectedCat.channels || [];
          const channelsToPreload = getChunkedChannels(allChannels, currentChunk, pageSize);
          
          console.log(`🖼️ Preloading ${channelsToPreload.length} channel images...`);
          
          // Progress: 40%
          updateLoadingProgress(40, `Preloading images (0/${channelsToPreload.length})...`);
          
          // **UPDATE CHANNEL GRID OVERLAY PROGRESS**
          const updateChannelGridProgress = (progress, loaded, total) => {
            const channelProgressFill = document.getElementById("channelProgressFill");
            const channelProgressText = document.getElementById("channelProgressText");
            const channelLoadingSubtext = document.getElementById("channelLoadingSubtext");
            
            if (channelProgressFill) {
              channelProgressFill.style.width = progress + "%";
            }
            
            if (channelProgressText) {
              channelProgressText.textContent = Math.round(progress) + "%";
            }
            
            if (channelLoadingSubtext) {
              // channelLoadingSubtext.textContent = `Loading images ${loaded}/${total}...`;
            }
          };
          
          // **PRELOAD IMAGES BEFORE RENDERING**
          preloadChannelImages(
            channelsToPreload,
            // Progress callback
            (progress, loaded, total) => {
              const adjustedProgress = 40 + Math.round(progress * 0.4); // 40% to 80%
              updateLoadingProgress(
                adjustedProgress, 
                `Loading channel images (${loaded}/${total})...`
              );
              
              // Also update channel grid overlay
              updateChannelGridProgress(progress, loaded, total);
            },
            // Complete callback
            () => {
              console.log("✅ All images preloaded!");
              
              // Progress: 80%
              updateLoadingProgress(80, "Rendering channels...");
              
              // Update channel grid overlay
              const channelLoadingSubtext = document.getElementById("channelLoadingSubtext");
              // if (channelLoadingSubtext) {
              //   channelLoadingSubtext.textContent = "Rendering channels...";
              // }
              
              setTimeout(() => {
                // Now render channels (images already cached)
                renderChannels();

                    setTimeout(() => {
        renderSidebarCategories();
        console.log("✅ Sidebar categories rendered");
      }, 100);

                
                // **REMOVE CHANNEL GRID LOADING OVERLAY**
                const channelGridLoadingOverlay = document.getElementById("channelGridLoading");
                if (channelGridLoadingOverlay) {
                  channelGridLoadingOverlay.style.opacity = "0";
                  channelGridLoadingOverlay.style.transition = "opacity 0.3s ease";
                  setTimeout(() => {
                    channelGridLoadingOverlay.remove();
                  }, 300);
                }
                
                // Progress: 90%
                updateLoadingProgress(90, "Setting up navigation...");
                
                setTimeout(() => {
                  setupScrollAutoLoad();

                  // Menu key handler
                   menuKeyHandler = (e) => {
                    if (!isPageFullyLoaded) return;
                    
                    const currentPage = localStorage.getItem("currentPage");
                    if (currentPage !== "liveTvPage") return;

                    if (e.key === "Menu" || e.key === "ContextMenu" || e.key === "F2") {
                      openSidebar("liveTvPage");
                      e.preventDefault();
                    }
                  };

                  document.addEventListener("keydown", menuKeyHandler);

                  const menuDots = document.querySelector(".menu-dots");
                  if (menuDots) {
                    menuDots.addEventListener("click", () => {
                      if (!isPageFullyLoaded) return;
                      openSidebar("liveTvPage");
                    });
                  }

                  // Progress: 95%
                  updateLoadingProgress(95, "Almost ready...");

                  // ENABLE NAVIGATION
                  setTimeout(() => {
                    const sidebarItems = qsa(".sidebar-item");
                    const channels = qsa(".channel-card");
                    
                    console.log("✅ Rendered:", sidebarItems.length, "categories,", channels.length, "channels");
                    
                    if (sidebarItems.length > 0 || channels.length > 0) {
                      // Progress: 100%
                      updateLoadingProgress(100, "Ready!");
                      
                      setTimeout(() => {
                        isPageFullyLoaded = true;
                        
                        inSidebarSearch = true;
                        inChannelGrid = false;
                        inSidebar = false;
                        inHeaderSearch = false;
                        inEPG = false;
                        inVideoPlayer = false;
                        inFavoriteBtn = false;
                        inRemoveHistoryBtn = false;
                        
                        setSidebarSearchFocus(true);
                        
                        hideLoading();
                        
                        console.log("🎮 Page fully loaded - navigation enabled");
                      }, 500);
                    } else {
                      console.error("❌ No content rendered - keeping page locked");
                      updateLoadingProgress(100, "Error loading content. Please refresh.");
                    }
                  }, 300);
                }, 200);
              }, 200);
            }
          );
        }, 300);
      }, 300);
    }, 300);

    // Rest of your code (search handlers, cleanup, etc.)...
    // ===== SEARCH INPUT HANDLER =====
    const headerSearchInput = qs(".search-input");
    if (headerSearchInput) {
      headerSearchInput.addEventListener("input", (e) => {
        if (!isPageFullyLoaded) return;
        searchQuery = e.target.value;
        currentChunk = 1;
        renderChannels();
      });
    }

  const sidebarSearchInput = qs(".sidebar-search-input");
if (sidebarSearchInput) {
    sidebarSearchInput.addEventListener("input", (e) => {
        if (!isPageFullyLoaded) return;
        
        const query = e.target.value.toLowerCase();
        
        // 1. Get the base data
        const allData = getFilteredCategories(); 
        
        // 2. Filter the categories based on name
        const matchingCategories = allData.filter((c) =>
            c.category_name.toLowerCase().includes(query)
        );

        // 3. Reset pagination for the sidebar because the list has changed
        currentCategoryChunk = 1; 
        
        // 4. Update the sidebar items container
        const sidebarItemsContainer = qs(".sidebar-items");
        if (sidebarItemsContainer) {
            // We reuse your mapping logic to ensure locks and counts appear correctly
            const categoriesHTML = matchingCategories
                .slice(0, categoriesPerChunk) // Show first chunk of results
                .map((c) => {
                    const isActive = c.category_id === selectedCategoryId;
                    const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist")) || {};
                    const hasParentalPassword = selectedPlaylist.parentalPassword && selectedPlaylist.parentalPassword.length > 0;
                    const hasAdultContent = hasParentalPassword && categoryHasAdultContent(c.category_id);
                    const isLocked = hasAdultContent && lockedCategories.has(c.category_id);
                    
                    return `
                    <div class="sidebar-item ${isActive ? "sidebar-active" : ""} ${isLocked ? "sidebar-locked" : ""}" 
                         data-category-id="${c.category_id}"
                         data-has-adult="${hasAdultContent}">
                      <span class="sidebar-item-name">
                        <span class="sidebar-text">${c.category_name}</span>
                        ${isLocked ? '<i class="fa fa-lock sidebar-lock"></i>' : ''}
                      </span>
                      <span class="sidebar-item-count">${c.channels ? c.channels.length : 0}</span>
                    </div>`;
                }).join("");
            
            sidebarItemsContainer.innerHTML = categoriesHTML;
        }
    });
}
    
 LiveTvPage.cleanup = function () {
  isPageFullyLoaded = false;
  document.removeEventListener("click", handleClick);
  document.removeEventListener("keydown", handleKeydown);

  // Remove fullscreen exit handler
  if (fullscreenExitHandler) {
    document.removeEventListener("fullscreenchange", fullscreenExitHandler);
    document.removeEventListener("webkitfullscreenchange", fullscreenExitHandler);
    document.removeEventListener("mozfullscreenchange", fullscreenExitHandler);
    document.removeEventListener("msfullscreenchange", fullscreenExitHandler);
    fullscreenExitHandler = null; // Clean up reference
  }

  window.liveTvPageState = null;

  if (menuKeyHandler) {
    document.removeEventListener("keydown", menuKeyHandler);
    menuKeyHandler = null;
  }

  // REMOVED: These lines referenced undefined globalFullscreenHandler
  // document.removeEventListener("fullscreenchange", globalFullscreenHandler);
  // document.removeEventListener("webkitfullscreenchange", globalFullscreenHandler);
  // document.removeEventListener("mozfullscreenchange", globalFullscreenHandler);
  // document.removeEventListener("msfullscreenchange", globalFullscreenHandler);

  const channelGrid = qs(".channel-grid");
  if (channelGrid) {
    channelGrid.removeEventListener("scroll", window.updateScrollArrows);
  }

  stopVideoControlsHideTimer();

  const modal = document.getElementById("passwordModalOverlay");
  if (modal) {
    modal.remove();
  }

  disposeLivePlayer();

  if (
    typeof LiveVideoJsComponent !== "undefined" &&
    typeof LiveVideoJsComponent.cleanup === "function"
  ) {
    try {
      LiveVideoJsComponent.cleanup();
    } catch (err) {
      console.warn("LiveVideoJsComponent cleanup error:", err);
    }
  }

  if (window.livePlayer) {
    try {
      window.livePlayer.dispose();
    } catch {}
    window.livePlayer = null;
  }
};
  }, 0);


  // ===== SCROLL ARROW VISIBILITY CONTROL =====
const updateScrollArrows = () => {
  const channelGrid = qs(".channel-grid");
  const leftArrow = qs("#channelScrollLeft");
  const rightArrow = qs("#channelScrollRight");
  
  if (!channelGrid || !leftArrow || !rightArrow) return;
  
  const scrollLeft = channelGrid.scrollLeft;
  const maxScroll = channelGrid.scrollWidth - channelGrid.clientWidth;
  
  // Show/hide left arrow
  if (scrollLeft <= 0) {
    leftArrow.classList.add("disabled");
  } else {
    leftArrow.classList.remove("disabled");
  }
  
  // Show/hide right arrow
  if (scrollLeft >= maxScroll - 5) { // -5 for threshold
    rightArrow.classList.add("disabled");
  } else {
    rightArrow.classList.remove("disabled");
  }
};

window.updateScrollArrows = updateScrollArrows;


// Add scroll event listener
const channelGrid = qs(".channel-grid");
if (channelGrid) {
  channelGrid.addEventListener("scroll", updateScrollArrows);
  
  // Initial check
  updateScrollArrows();
}

// Add click handlers for arrows
const leftArrow = qs("#channelScrollLeft");
const rightArrow = qs("#channelScrollRight");

if (leftArrow) {
  leftArrow.addEventListener("click", () => {
    const channelGrid = qs(".channel-grid");
    if (channelGrid) {
      channelGrid.scrollBy({ left: -300, behavior: "smooth" });
    }
  });
}

if (rightArrow) {
  rightArrow.addEventListener("click", () => {
    const channelGrid = qs(".channel-grid");
    if (channelGrid) {
      channelGrid.scrollBy({ left: 300, behavior: "smooth" });
    }
  });
}

// Update arrows after rendering channels
const observer = new MutationObserver(() => {
  updateScrollArrows();
});

if (channelGrid) {
  observer.observe(channelGrid, { childList: true, subtree: true });
}


  // Header time
  const now = new Date();
  const time = formatTime(now);
  const date = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
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
           <span class="current-date">${new Date().toLocaleDateString([], {
             month: "long",
             day: "numeric",
             year: "numeric",
           })}</span>
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

    <div class="sidebar-container-live" style="display: none;">
    ${Sidebar({ from: "liveTvPage" })}
</div>
${SortingDialog()}

  </header>

    

  <div class="livetv-content-wrapper">
    <div id="sidebar-area"></div>

    <div class="main-content-area">
       <div class="channel-grid-wrapper">

    
    <div class="channel-grid">
      <!-- Channels will be rendered dynamically by renderChannels() -->
    </div>
    
   
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



