


window.addItemToHistory = (item, historyKey) => {
  const playlistsData = JSON.parse(localStorage.getItem("playlistsData"));
  const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist"));

  const currentPlaylist = playlistsData.find(
    (pl) => pl.playlistName === selectedPlaylist.playlistName
  );

  if (!currentPlaylist) return;

  // Initialize history array if it doesn't exist
  if (!currentPlaylist[historyKey]) {
    currentPlaylist[historyKey] = [];
  }

  // Remove item if it already exists (to avoid duplicates)
  const existingIndex = currentPlaylist[historyKey].findIndex(
    (h) => (typeof h === "object" ? h.stream_id : h) === item.stream_id
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
    addedAt: new Date().toISOString(),
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

// ===== LOADING SCREEN COMPONENT =====
const LiveTvLoadingScreen = () => {
  return `
    <div class="livetv-loading-overlay" id="liveTvLoadingOverlay">
      <div class="loading-content">
        <img src="/assets/logo.png" alt="Logo" class="loading-logo" />
        <div class="spinner"></div>
        <div class="loading-text">Loading Live TV</div>
        <div class="loading-subtext">Please wait while we load your channels...</div>
      </div>
    </div>
  `;
};

function LiveTvPage() {
  // ===== API DATA (NEW) =====
  const categories = window.liveCategories || [];
  const allStreams = window.allLiveStreams || [];


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


  showLoading();

    setTimeout(() => {
    hideLoading();
  }, 3000);

  // ===== HELPER: Get Filtered Categories =====
  const getFilteredCategories = () => {
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

      // **CRITICAL: Get streams from multiple sources**
      const streams =
        window.currentAllStreams || allStreams || window.allLiveStreams || [];

      console.log("🔍 Streams available:", streams.length);

      if (streams.length === 0) {
        console.warn("⚠️ No streams available in getFilteredCategories");
      }

      // **SAFE MAPPING**
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

      // **SAFE FAVORITES MAPPING**
      const favoritesChannels = (updatedFavorites || [])
        .map((favItem) => {
          try {
            if (typeof favItem === "number") {
              return (
                streams.find((s) => s.stream_id === favItem) || {
                  stream_id: favItem,
                  name: "Unknown",
                  stream_icon: "/assets/profile.png",
                }
              );
            }
            if (!favItem.stream_icon) {
              const fullData = streams.find(
                (s) => s.stream_id === favItem.stream_id
              );
              return fullData || favItem;
            }
            return favItem;
          } catch (err) {
            console.error("Error mapping favorite:", err, favItem);
            return favItem;
          }
        })
        .filter((ch) => {
          if (!searchQuery.trim() || selectedCategoryId !== "favorites")
            return true;
          return (ch.name || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        });

      console.log("🔍 Processing history:", channelHistory.length);

      // **SAFE HISTORY MAPPING**
      const historyChannels = (channelHistory || [])
        .map((histItem) => {
          try {
            if (typeof histItem === "number") {
              return (
                streams.find((s) => s.stream_id === histItem) || {
                  stream_id: histItem,
                  name: "Unknown",
                  stream_icon: "/assets/profile.png",
                }
              );
            }
            if (!histItem.stream_icon) {
              const fullData = streams.find(
                (s) => s.stream_id === histItem.stream_id
              );
              return fullData || histItem;
            }
            return histItem;
          } catch (err) {
            console.error("Error mapping history item:", err, histItem);
            return histItem;
          }
        })
        .filter((ch) => {
          if (!searchQuery.trim() || selectedCategoryId !== "channelHistory")
            return true;
          return (ch.name || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        });

    // Apply sorting to each category's channels
const result = [
  {
    category_id: "All",
    category_name: "All",
    channels: applySortingToChannels(allLiveStreams || []),
  },
  {
    category_id: "favorites",
    category_name: "Favorites",
    channels: applySortingToChannels(favoritesChannels || []),
  },
  {
    category_id: "channelHistory",
    category_name: "Channel History",
    channels: applySortingToChannels(historyChannels || []),
  },
  ...filteredCategories.map(cat => ({
    ...cat,
    channels: applySortingToChannels(cat.channels || [])
  })),
];

console.log("✅ getFilteredCategories result:", result.length, "categories");
return result;

      console.log(
        "✅ getFilteredCategories result:",
        result.length,
        "categories"
      );
      return result;
    } catch (error) {
      console.error("❌ ERROR in getFilteredCategories:", error);
      console.error("Stack:", error.stack);
      return [
        {
          category_id: "All",
          category_name: "All",
          channels: [],
        },
      ];
    }
  };

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

  let inPasswordModal = false;
  let pendingChannel = null; // Store channel data when password is required
  let passwordModalFocusIndex = 0; // 0 = input field, 1 = submit button, 2 = cancel button

  // Add this at the TOP of your LiveTvPage function (after the state variables)

  // ===== CHECK IF CONTENT IS 18+ =====
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
    removeAllFocus(); // ADD THIS LINE

    list.forEach((el) => el.classList.remove(cls));
    if (list[idx]) {
      list[idx].classList.add(cls);
      list[idx].scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  };

  // Helper to set focus on sidebar
  const setSidebarFocus = (idx) => {
    removeAllFocus(); // ADD THIS LINE

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
  removeAllFocus(); // ADD THIS LINE

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
    removeAllFocus(); // ADD THIS LINE

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
    removeAllFocus(); // ADD THIS LINE

    const list = qsa(".epg-item");
    list.forEach((el) => el.classList.remove("epg-focused"));
    if (list[idx]) {
      list[idx].classList.add("epg-focused");
      list[idx].scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  };

  // Helper to set focus on favorite button
  const setFavoriteBtnFocus = (active) => {
    removeAllFocus(); // ADD THIS LINE

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
    removeAllFocus(); // ADD THIS LINE

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

    // Remove focus from sidebar items
    const sidebarItems = qsa(".sidebar-item");
    sidebarItems.forEach((item) =>
      item.classList.remove("sidebar-focused", "sidebar-active")
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

    // Add modal to page
    const modalContainer = document.createElement("div");
    modalContainer.innerHTML = PasswordModal();
    document.body.appendChild(modalContainer.firstElementChild);

    // Focus input
    setTimeout(() => {
      const input = document.getElementById("passwordModalInput");
      if (input) {
        input.focus();
      }
      updatePasswordModalFocus();
    }, 100);

    // Add eye icon toggle
    const eyeIcon = document.getElementById("passwordModalEye");
    const input = document.getElementById("passwordModalInput");

    if (eyeIcon && input) {
      eyeIcon.addEventListener("click", () => {
        if (input.type === "password") {
          input.type = "text";
          eyeIcon.classList.remove("fa-eye");
          eyeIcon.classList.add("fa-eye-slash");
        } else {
          input.type = "password";
          eyeIcon.classList.remove("fa-eye-slash");
          eyeIcon.classList.add("fa-eye");
        }
      });
    }
  };

  // ===== HIDE PASSWORD MODAL =====
  // ===== HIDE PASSWORD MODAL (UPDATED) =====
  const hidePasswordModal = (clearPending = true) => {
    const modal = document.getElementById("passwordModalOverlay");
    if (modal) {
      modal.remove();
    }
    inPasswordModal = false;

    // Only clear pending channel if explicitly requested (for cancel)
    if (clearPending) {
      pendingChannel = null;
    }

    passwordModalFocusIndex = 0;

    // Return focus to channel grid
    inChannelGrid = true;
    const channels = qsa(".channel-card");
    if (channels.length > 0) {
      setFocus(channels, focusedChannelIndex, "channel-card-focused");
    }
  };

  // ===== UPDATE PASSWORD MODAL FOCUS =====
  const updatePasswordModalFocus = () => {
    const input = document.getElementById("passwordModalInput");
    const submitBtn = document.querySelector(".password-submit-btn");
    const cancelBtn = document.querySelector(".password-cancel-btn");

    // Remove all focus
    if (input) input.classList.remove("password-input-focused");
    if (submitBtn) submitBtn.classList.remove("password-btn-focused");
    if (cancelBtn) cancelBtn.classList.remove("password-btn-focused");

    // Add focus to current element
    if (passwordModalFocusIndex === 0 && input) {
      input.classList.add("password-input-focused");
      input.focus();
    } else if (passwordModalFocusIndex === 1 && submitBtn) {
      submitBtn.classList.add("password-btn-focused");
    } else if (passwordModalFocusIndex === 2 && cancelBtn) {
      cancelBtn.classList.add("password-btn-focused");
    }
  };

  // ===== VERIFY PASSWORD =====
  // ===== VERIFY PASSWORD (UPDATED) =====
  // ===== VERIFY PASSWORD (FINAL VERSION) =====
  // ===== VERIFY PASSWORD (FIXED) =====
  const verifyPassword = () => {
    const input = document.getElementById("passwordModalInput");
    const enteredPassword = input.value.trim() || "";

    console.log("🔑 Verifying password...", { enteredPassword }); // Debug

    if (!enteredPassword) {
      console.log("❌ No password entered");
      if (
        typeof Toaster !== "undefined" &&
        typeof Toaster.showToast === "function"
      ) {
        Toaster.showToast("error", "Please enter password");
      } else {
        alert("Please enter password");
      }
      return;
    }

    const selectedPlaylist =
      JSON.parse(localStorage.getItem("selectedPlaylist")) || {};
    const savedPassword = selectedPlaylist.parentalPassword || "";

    console.log("🔑 Comparing passwords..."); // Debug

    if (!savedPassword) {
      console.log("❌ No password set in settings");
      if (
        typeof Toaster !== "undefined" &&
        typeof Toaster.showToast === "function"
      ) {
        Toaster.showToast(
          "error",
          "No parental password set. Please set one in Settings."
        );
      } else {
        alert("No parental password set. Please set one in Settings.");
      }
      hidePasswordModal(true); // Clear pending
      return;
    }

    if (enteredPassword === savedPassword) {
      console.log("✅ Password correct!");

      // Store the channel data BEFORE closing modal
      const channelToPlay = { ...pendingChannel };

      console.log("📺 Channel to play:", channelToPlay); // Debug

      // Close modal WITHOUT clearing pendingChannel
      hidePasswordModal(false);

      // Show success message
      if (
        typeof Toaster !== "undefined" &&
        typeof Toaster.showToast === "function"
      ) {
        Toaster.showToast("success", "Access granted");
      }

      // Clear pendingChannel manually
      pendingChannel = null;

      // Play channel after a small delay
setTimeout(() => {
  if (channelToPlay && channelToPlay.stream_id) {
    console.log("🎬 Now playing:", channelToPlay.name);

    const videoWrapper = qs(".livetv-video-wrapper");
    if (!videoWrapper) {
      console.error("❌ Video wrapper not found!");
      return;
    }

    const currentPlaylistData = JSON.parse(localStorage.getItem("currentPlaylistData"));
    const playlistLiveExtension = JSON.parse(localStorage.getItem("selectedPlaylist"));

    if (!currentPlaylistData || !playlistLiveExtension) {
      console.error("❌ Playlist data not found!");
      return;
    }

    const liveVideoUrl = `${currentPlaylistData.server_info.server_protocol}://${currentPlaylistData.server_info.url}:${currentPlaylistData.server_info.port}/live/${currentPlaylistData.user_info.username}/${currentPlaylistData.user_info.password}/${channelToPlay.stream_id}.${playlistLiveExtension.streamFormat || "m3u8"}`;

    console.log("🔗 Stream URL:", liveVideoUrl);

    if (window.livePlayer) {
      try {
        window.livePlayer.dispose();
      } catch (err) {
        console.warn("Player disposal error:", err);
      }
      window.livePlayer = null;
    }

    const hasLiveVideoJs = typeof LiveVideoJsComponent !== "undefined";
    const hasFlowPlayer = typeof FlowLivePlayerComponent !== "undefined";

    const playlistsData = JSON.parse(localStorage.getItem("playlistsData"));
    const currentPlaylist = playlistsData.find(
      (pl) => pl.playlistName === selectedPlaylist.playlistName
    );

    const isTs = (currentPlaylist.streamFormat || "").toLowerCase() === "ts";

    // ===== UPDATED: Use only LiveVideoJsComponent or FlowLivePlayerComponent =====
    if (isTs && hasFlowPlayer) {
      videoWrapper.innerHTML = FlowLivePlayerComponent(
        channelToPlay.stream_id,
        liveVideoUrl,
        channelToPlay.stream_icon || channelToPlay.logo || "/assets/profile.png",
        "100vh",
        channelToPlay.name || "Unknown Channel"
      );
    } else if (hasLiveVideoJs) {
      videoWrapper.innerHTML = LiveVideoJsComponent(
        channelToPlay.stream_id,
        liveVideoUrl,
        channelToPlay.stream_icon || channelToPlay.logo || "/assets/profile.png",
        "100vh",
        channelToPlay.name || "Unknown Channel"
      );
    } else {
      console.error("❌ No player components available!");
      videoWrapper.innerHTML = `
        <div class="live-video-player live-video-player-div" style="width:100%; height:100%;">
          <div class="live-no-url-message">
            <div class="no-url-icon">⚠️</div>
            <p class="no-url-text">Video player components not loaded</p>
          </div>
        </div>
      `;
      return;
    }

    // Update visual states and EPG (rest of the code remains the same)
    qsa(".channel-card").forEach((c) => {
      c.classList.remove("channel-card-selected", "channel-card-focused", "channel-card-playing");
    });

    const selectedCard = qs(`.channel-card[data-stream-id="${channelToPlay.stream_id}"]`);
    if (selectedCard) {
      selectedCard.classList.add("channel-card-selected", "channel-card-focused", "channel-card-playing");
      const allCards = qsa(".channel-card");
      const cardIndex = Array.from(allCards).indexOf(selectedCard);
      if (cardIndex !== -1) {
        focusedChannelIndex = cardIndex;
      }
    }

    updateEPG(channelToPlay);

    if (selectedCategoryId !== "channelHistory") {
      const streams = window.currentAllStreams || allStreams || window.allLiveStreams || [];
      const selectedChannelItem = streams.find((item) => item.stream_id == channelToPlay.stream_id);
      if (selectedChannelItem && typeof window.addItemToHistory === "function") {
        window.addItemToHistory(selectedChannelItem, "ChannelListLive");
      }
    }

    console.log("✅ Channel playback initiated");
  }
}, 300);
    } else {
      console.log("❌ Password incorrect");
      if (
        typeof Toaster !== "undefined" &&
        typeof Toaster.showToast === "function"
      ) {
        Toaster.showToast("error", "Incorrect Password");
      } else {
        alert("Incorrect password");
      }
      if (input) {
        input.value = "";
        input.focus();
      }
    }
  };

  // Play channel function
  // ===== PLAY CHANNEL FUNCTION (UPDATED) =====
  // ===== PLAY CHANNEL FUNCTION (FIXED) =====
  const playChannel = (channelData) => {
    console.log("🎬 Playing channel:", channelData); // Debug log

    const selectedPlaylist =
      JSON.parse(localStorage.getItem("selectedPlaylist")) || {};
    const hasParentalPassword =
      selectedPlaylist.parentalPassword &&
      selectedPlaylist.parentalPassword.length > 0;

    if (hasParentalPassword && isAdultContent(channelData)) {
      console.log("🔒 Adult content detected - showing password prompt");
      showPasswordModal(channelData);
      return; // Stop here and wait for password verification
    }

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
        if (
          selectedChannelItem &&
          typeof window.addItemToHistory === "function"
        ) {
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
            if (!document.fullscreenElement) {
              videoContainer.requestFullscreen().catch(err => {
                console.warn("Fullscreen request failed:", err);
              });
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
    const selectedPlaylist = JSON.parse(
      localStorage.getItem("selectedPlaylist")
    );

    const currentPlaylist = playlistsData.find(
      (pl) => pl.playlistName === selectedPlaylist.playlistName
    );

    if (!currentPlaylist[favoriteKey]) {
      currentPlaylist[favoriteKey] = [];
    }

    const index = currentPlaylist[favoriteKey].findIndex(
      (fav) =>
        (typeof fav === "object" ? fav.stream_id : fav) === item.stream_id
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
        stream_icon: item.stream_icon, // Make sure this is included
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
  const renderChannels = () => {
    const filtered = getFilteredCategories();

    let selectedCat = filtered.find(
      (c) => c.category_id === selectedCategoryId
    );
    if (!selectedCat) {
      selectedCat = filtered[0];
      selectedCategoryId = selectedCat.category_id;
    }

    const allChannels = selectedCat.channels || [];
    const channelsToShow = allChannels;

    const channelGrid = qs(".channel-grid");
    if (!channelGrid) return;

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

    // Check if we're in history view
    const isHistoryView = selectedCategoryId === "channelHistory";

    // Get parental control settings
    const selectedPlaylist =
      JSON.parse(localStorage.getItem("selectedPlaylist")) || {};
    const hasParentalPassword =
      selectedPlaylist.parentalPassword &&
      selectedPlaylist.parentalPassword.length > 0;

    const channelCardsHTML = channelsToShow
      .map((ch) => {
        const isFav = favoritesList.some(
          (fav) =>
            (typeof fav === "object" ? fav.stream_id : fav) === ch.stream_id
        );

        // Check if content should be blurred
        const shouldBlur = hasParentalPassword && isAdultContent(ch);

        return `
      <div class="channel-card ${shouldBlur ? "channel-blurred" : ""}" 
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
        ${
          shouldBlur
            ? '<div class="blur-overlay"><i class="fa fa-lock"></i></div>'
            : ""
        }
      </div>
    `;
      })
      .join("");

    channelGrid.innerHTML = channelCardsHTML;
  };

  // ===== RENDER SIDEBAR CATEGORIES =====
  const renderSidebarCategories = () => {
    const filtered = getFilteredCategories();

    const categoriesHTML = filtered
      .map((c) => {
        const isActive = c.category_id === selectedCategoryId;
        return `
        <div class="sidebar-item ${isActive ? "sidebar-active" : ""}" 
             data-category-id="${c.category_id}">
          <span class="sidebar-item-name">${c.category_name}</span>
          <span class="sidebar-item-count">${
            c.channels ? c.channels.length : 0
          }</span>
        </div>
      `;
      })
      .join("");

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
        verifyPassword();
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
      if (e.key === "ArrowDown") {
        passwordModalFocusIndex++;
        if (passwordModalFocusIndex > 2) passwordModalFocusIndex = 2;
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
        if (passwordModalFocusIndex === 1) {
          // Submit
          verifyPassword();
        } else if (passwordModalFocusIndex === 2) {
          // Cancel
          hidePasswordModal();
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

      return; // Block all other keys when modal is open
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
    if (inVideoPlayer) {
      const videoDiv = qs(".live-video-player-div");
      const playPauseBtn = qs(".play-pause-btn") || qs("#live-play-pause-btn");
      const aspectBtn = qs(".aspect-ratio-btn") || qs("#videojs-aspect-ratio");

      if (isUp) {
        inVideoPlayer = false;
        inChannelGrid = true;
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
          if (!document.fullscreenElement) {
            videoDiv.requestFullscreen().catch(err => {
              console.warn("Fullscreen request failed:", err);
            });
          } else {
            document.exitFullscreen();
          }
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

      return;
    }

    // Play/Pause button navigation
    if (inPlayPauseBtn) {
      const playPauseBtn = qs(".play-pause-btn") || qs("#live-play-pause-btn");
      const videoDiv = qs(".live-video-player-div");
      const aspectBtn = qs(".aspect-ratio-btn") || qs("#videojs-aspect-ratio");

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

      if (isDown) {
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
        e.preventDefault();
        return;
      }
    }

    // Aspect ratio button navigation
    if (inAspectRatioBtn) {
      const aspectBtn = qs(".aspect-ratio-btn") || qs("#videojs-aspect-ratio");
      const playPauseBtn = qs(".play-pause-btn") || qs("#live-play-pause-btn");

      if (isUp) {
        inAspectRatioBtn = false;
        inPlayPauseBtn = true;
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
    if (inSidebarSearch) {
      // UP: Move to header search
      // UP: Move to header search with cursor at end
      if (isUp) {
        inSidebarSearch = false;
        inHeaderSearch = true;
        // isSidebarSearchActive = false;
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
        // isSidebarSearchActive = false;
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
        // Open keyboard - focus input
        searchInput.focus();
        const textLength = searchInput.value.length;
        searchInput.setSelectionRange(textLength, textLength);
      } else {
        // Close keyboard - blur input
        searchInput.blur();
        searchInput.selectionStart = searchInput.selectionEnd = 0;
      }
    }
    e.preventDefault();
    return;
  }


// If in edit mode, allow typing - don't prevent default
if (isSidebarSearchActive) {
  return; // Allow normal keyboard input
}

// Block navigation keys when not in edit mode
if (isUp || isDown || isLeft || isRight) {
  e.preventDefault();
  return;
}

return; // Allow other keys
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
          sidebarItems.forEach((i) => i.classList.remove("sidebar-focused"));
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
        sidebarItems.forEach((i) => i.classList.remove("sidebar-focused"));
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
      const favBtn = card.querySelector(".favorite-btn");
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
        const removeBtn = card.querySelector(".remove-history-btn");

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
        favBtn.click();
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
          channels.forEach((c) => c.classList.remove("channel-card-focused"));
          inVideoPlayer = true;
          inPlayPauseBtn = false;
          inAspectRatioBtn = false;
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
      const removeBtn = card.querySelector(".remove-history-btn");
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
        removeBtn.click();
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
          channels.forEach((c) => c.classList.remove("channel-card-focused"));
          inVideoPlayer = true;
          inPlayPauseBtn = false;
          inAspectRatioBtn = false;
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
          channels.forEach((c) => c.classList.remove("channel-card-focused"));
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
    inPlayPauseBtn = false;
    inAspectRatioBtn = false;
    channels.forEach((c) => c.classList.remove("channel-card-focused"));
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
  } else {
    // Normal down navigation
    const targetIndex = focusedChannelIndex + cols;
    
    // If target is beyond last card, go to last card in that column or last card overall
    if (targetIndex >= channels.length) {
      // Calculate which card in the last row aligns with current column
      const currentColumn = focusedChannelIndex % cols;
      const lastRowStart = Math.floor((channels.length - 1) / cols) * cols;
      const targetInLastRow = lastRowStart + currentColumn;
      
      // If that position exists, go there; otherwise go to last card
      if (targetInLastRow < channels.length) {
        focusedChannelIndex = targetInLastRow;
      } else {
        focusedChannelIndex = channels.length - 1;
      }
      setFocus(channels, focusedChannelIndex, "channel-card-focused");
    } else {
      // Normal move down
      focusedChannelIndex = targetIndex;
      setFocus(channels, focusedChannelIndex, "channel-card-focused");
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
          channels.forEach((c) => c.classList.remove("channel-card-focused"));
          setSidebarSearchFocus(true);
        }
        e.preventDefault();
        return;
      }

      if (isRight) {
        // Go to favorite button of current card
        inChannelGrid = false;
        inFavoriteBtn = true;
        channels.forEach((c) => c.classList.remove("channel-card-focused"));
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

    // In setTimeout(() => { ... }, 0) block, after renderChannels():

    // Menu key handler
    const menuKeyHandler = (e) => {
      const currentPage = localStorage.getItem("currentPage");
      if (currentPage !== "liveTvPage") return;

      // Handle Menu/ContextMenu key
      if (e.key === "Menu" || e.key === "ContextMenu" || e.key === "F2") {
        openSidebar("liveTvPage");
        e.preventDefault();
      }
    };

    document.addEventListener("keydown", menuKeyHandler);

    // Menu dots click handler
    const menuDots = document.querySelector(".menu-dots");
    if (menuDots) {
      menuDots.addEventListener("click", () => {
        openSidebar("liveTvPage");
      });
    }

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

            hideLoading();

    }, 100);

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
      document.removeEventListener("keydown", menuKeyHandler); // ADD THIS LINE

      const modal = document.getElementById("passwordModalOverlay");
      if (modal) {
        modal.remove();
      }

      // Dispose video player
      disposeLivePlayer();

      // Call LiveVideoJsComponent cleanup if it exists
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

        const matchingCategories = filtered.filter((c) =>
          c.category_name.toLowerCase().includes(query)
        );

        const sidebarItems = qs(".sidebar-items");
        if (sidebarItems) {
          sidebarItems.innerHTML = matchingCategories
            .map((c) => {
              const isActive = c.category_id === selectedCategoryId;
              return `
              <div class="sidebar-item ${isActive ? "sidebar-active" : ""}" 
                   data-category-id="${c.category_id}">
                <span class="sidebar-item-name">${c.category_name}</span>
                <span class="sidebar-item-count">${
                  c.channels ? c.channels.length : 0
                }</span>
              </div>
            `;
            })
            .join("");
        }
      });
    }
  }, 0);

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
