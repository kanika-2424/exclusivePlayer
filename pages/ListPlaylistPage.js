


function ListPlaylistPage() {
  let playlistsData = JSON.parse(localStorage.getItem("playlistsData")) || [];
  let enterDownFocusIndex = null;


    // CHECK IF USER IS ALREADY LOGGED IN - Redirect to dashboard
  const isLogin = localStorage.getItem("isLogin") === "true";
  const selectedPlaylist = localStorage.getItem("selectedPlaylist");
  
  if (isLogin && selectedPlaylist) {
    console.log("✅ User already logged in, redirecting to dashboard...");
    localStorage.setItem("currentPage", "dashboard");
    Router.showPage("dashboard");
    return "";
  }

  if (playlistsData.length === 0) {
    localStorage.removeItem("currentPage");
    Router.showPage("login");
    return "";
  }

  // SET THE CURRENT PAGE - This is critical!
  localStorage.setItem("currentPage", "playlist");

  // Return the HTML immediately
  const html = `
<div class="playlistpage-container">

    <!-- Header -->
    <div class="playlistpage-header">
        <img src="/assets/logo.png" class="playlistpage-logo" />
        <div class="playlistpage-title">List users</div>

        <div class="playlistpage-add-btn playlist-add-user">
            <div class="add-icon">
                <img src="/assets/add.png" />
            </div>
        </div>
    </div>

    <!-- Cards -->
    <div class="playlistpage-grid">
        ${playlistsData
          .map(
            (p) => `
            <div class="playlist-card">
                <div class="playlist-icon-box">
                    <img src="/assets/user.png" />
                </div>

                <div class="playlist-name">${p.playlistName}</div>
                <div class="playlist-username">Username: ${p.playlistUsername}</div>
            </div>
        `
          )
          .join("")}


    </div>
    <div style=" font-size: 24px;  font-weight: bold; position : absolute; bottom: 50px; left: 50%; transform: translateX(-50%); text-align: center; margin-top: 20px; color: #ccc;">Press Enter and hold to remove playlist</div>

    <!-- Remove Playlist Modal -->
    <div class="playlist-modal hidden" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
         background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;">
        <div style="background: #2a2a2a; padding: 30px; border-radius: 10px; text-align: center; max-width: 500px;">
            <div style="font-size: 24px; font-weight: bold; margin-bottom: 20px; color: white;">Remove Playlist?</div>
            <div style="font-size: 20px; margin-bottom: 30px; color: #ccc;">Are you sure you want to remove this playlist?</div>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button class="playlist-remove-btn" style="padding: 10px 30px; background: #555; color: white; 
                        border: none; border-radius: 5px; cursor: pointer; font-size: 20px; margin-right: 10px;">Remove</button>
                <button class="playlist-cancel-btn" style="padding: 10px 30px; background: #555; color: white; 
                        border: none; border-radius: 5px; cursor: pointer; font-size: 20px;">Cancel</button>
            </div>
        </div>
 
    </div>


    <div id="loading-overlay" class="hidden"
       style="position: fixed; width: 100%; height: 100%; 
       background: rgba(0,0,0,0.8); display: flex;
       align-items: center; justify-content: center; z-index: 9999;">
        <div style="display: flex; flex-direction: column;
             align-items: center; justify-content: center; color: white;">
         
             <div class="livetv-loading-overlay" id="liveTvLoadingOverlay">
      <div class="loading-content">
        <img src="/assets/logo.png" alt="Logo" class="loading-logo" />
        <div class="spinner"></div>
        <div class="loading-text">Loading.....</div>
           <div id="loading-progress" style="font-size: 32px; font-weight: bold;">0%</div>
      </div>
    </div>
        </div>
    </div>

</div>
`;

  // After HTML is in DOM, call mount to setup JS
  setTimeout(() => {
    mountListPlaylistPage(playlistsData);
  }, 0);

  return html;
}

let isLoggingIn = false; // Add this with other variables

function mountListPlaylistPage(playlistsData) {
  // CRITICAL: Reset the login flag when mounting the page
  isLoggingIn = false;
  
  const addPlaylistBtn = document.querySelector(".playlist-add-user");

  

  let focusIndex;
  if (playlistsData.length > 0) {
    focusIndex = 0;
  } else {
    focusIndex = -1;
  }
  let removeFocus = false;
  let modalFocusIndex = -1; // Start with no focus in modal
  let modalOpen = false;
  let enterPressTimer = null;
  let enterKeyIsDown = false; // Track if Enter is still pressed
  const LONG_PRESS_DURATION = 500;

  // Get DOM elements after render
  const cardElements = Array.from(document.querySelectorAll(".playlist-card") || []);
  const modal = document.querySelector(".playlist-modal");
  const removeBtn = document.querySelector(".playlist-remove-btn");
  const cancelBtn = document.querySelector(".playlist-cancel-btn");
  const modalButtons = [removeBtn, cancelBtn];



  cardElements.forEach(card => {
  card.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };
});

if (addPlaylistBtn) {
  addPlaylistBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };
}
  // ---------- Focus helper ----------
  function updateFocus() {
    if (modalOpen) {
      modalButtons.forEach((btn, i) => {
        if (btn) btn.classList.toggle("playlist-card-focused", i === modalFocusIndex && modalFocusIndex !== -1);
      });
      return;
    }

    cardElements.forEach((card, i) => {
      if (!card) return;
      card.classList.toggle("playlist-card-focused", i === focusIndex && !removeFocus);
    });

    addPlaylistBtn.classList.toggle("playlist-card-focused", focusIndex === -1 && !removeFocus);
  }

  updateFocus();

  // ---------- Click ----------
  async function listPlaylistClick(targetIndex = null) {
      console.log("🎯 listPlaylistClick called with index:", targetIndex, "isLoggingIn:", isLoggingIn);

    if (modalOpen || isLoggingIn) {
      console.log("❌ listPlaylistClick blocked - modalOpen:", modalOpen, "isLoggingIn:", isLoggingIn);
      return;
    }

    if (targetIndex === -1) {
      // Add Playlist button - go to login page
      console.log("➕ Going to login page");
      isLoggingIn = true; // Prevent double clicks
      localStorage.removeItem("currentPage");
      ListPlaylistPage.cleanup();
      Router.showPage("login");
      return;
    }

    if (targetIndex >= 0 && targetIndex < playlistsData.length) {
      const playlist = playlistsData[targetIndex];
      if (!playlist) return;
      console.log("🔐 Starting login for:", playlist.playlistName);

      isLoggingIn = true; // Set flag before login

      try {
        const response = await loginApi("", "", playlist.playlistName, true, playlist.playlistUrl);
        console.log("✅ Login response received:", response);

        if (response) {
          localStorage.setItem("selectedPlaylist", JSON.stringify(playlist));
          ListPlaylistPage.cleanup();
          console.log("📍 Navigating to dashboard...");

          Router.showPage("dashboard");
        } else {
          isLoggingIn = false; // Reset on failure
          console.log("❌ Login returned null");

          if (window.disableKeyBlock) {
            window.disableKeyBlock();
          }
          console.log("Login failed or was cancelled");
        }
      } catch (error) {
        isLoggingIn = false; // Reset on error
        console.error("Error during login:", error);
        if (window.disableKeyBlock) {
          window.disableKeyBlock();
        }
      }
    }
  }

  // ---------- Modal ----------
  function openModal() {
    if (!modal || focusIndex < 0 || focusIndex >= cardElements.length) return;
    modal.classList.remove("hidden");
    modalOpen = true;
    modalFocusIndex = -1; // No initial focus
    enterKeyIsDown = true; // Mark that Enter is still down
    updateFocus();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.add("hidden");
    modalOpen = false;
    modalFocusIndex = -1;
    updateFocus();
  }

  function removePlaylist() {
    if (focusIndex >= 0 && focusIndex < playlistsData.length) {
      playlistsData.splice(focusIndex, 1);
      localStorage.setItem("playlistsData", JSON.stringify(playlistsData));
      
      // Adjust focus index if needed
      if (focusIndex >= playlistsData.length && playlistsData.length > 0) {
        focusIndex = playlistsData.length - 1;
      } else if (playlistsData.length === 0) {
        focusIndex = -1;
      }
      
      closeModal();
      Router.showPage("playlist");
    }
  }

  // ---------- Keyboard ----------
  function keydownHandler(e) {
    if (localStorage.getItem("currentPage") !== "playlist") return;

    const rowLength = 4;
    const totalCards = cardElements.length;

    if (modalOpen) {
      switch (e.key) {
        case "ArrowRight":
          if (modalFocusIndex === -1) modalFocusIndex = 0;
          else modalFocusIndex = (modalFocusIndex + 1) % modalButtons.length;
          updateFocus();
          e.preventDefault();
          return;
        case "ArrowLeft":
          if (modalFocusIndex === -1) modalFocusIndex = 1;
          else modalFocusIndex = (modalFocusIndex - 1 + modalButtons.length) % modalButtons.length;
          updateFocus();
          e.preventDefault();
          return;
        case "Enter":
          // Ignore Enter if it's still held from long press
          if (enterKeyIsDown) {
            e.preventDefault();
            return;
          }
          // Only execute if a button is focused
          if (modalFocusIndex === -1) {
            e.preventDefault();
            return;
          }
          modalFocusIndex === 0 ? removePlaylist() : closeModal();
          e.preventDefault();
          return;
        case "Escape":
          closeModal();
          e.preventDefault();
          return;
      }
      return;
    }

    // Handle long press on Enter key (only for playlist cards, not Add User button)
  if ((e.key === "Enter" || e.keyCode === 13) && !enterPressTimer) {
  enterDownFocusIndex = focusIndex; // 🔒 LOCK focus
  enterPressTimer = setTimeout(() => {
    if (enterDownFocusIndex >= 0) {
      openModal();
    }
    enterPressTimer = null;
  }, LONG_PRESS_DURATION);
  e.preventDefault();
  return;
}


    // Normal navigation
    switch (e.key) {
      case "ArrowRight":
        if (focusIndex >= 0 && (focusIndex + 1) % rowLength !== 0 && focusIndex < totalCards - 1) focusIndex++;
        break;
      case "ArrowLeft":
        if (focusIndex > 0 && focusIndex % rowLength !== 0) focusIndex--;
        break;
      case "ArrowDown":
        if (focusIndex === -1) focusIndex = 0;
        else if (focusIndex + rowLength < totalCards) focusIndex += rowLength;
        break;
      case "ArrowUp":
        if (focusIndex === -1) focusIndex = 0;
        else if (focusIndex < rowLength) focusIndex = -1;
        else focusIndex -= rowLength;
        break;
      case "Enter":
        // This will be handled by keyup if not long press
        break;
      default:
        return;
    }

    removeFocus = false;
    updateFocus();
    e.preventDefault();
  }

  function keyupHandler(e) {
    console.log("⬆️ keyup event:", e.key, "currentPage:", localStorage.getItem("currentPage"));

    if (localStorage.getItem("currentPage") !== "playlist") return;
    
    // Reset Enter key tracking
    if (e.key === "Enter" || e.keyCode === 13) {
      enterKeyIsDown = false;
      console.log("🔓 Enter key released, timer exists:", !!enterPressTimer);
    }
    
    if ((e.key !== "Enter" && e.keyCode !== 13) || !enterPressTimer) return;

    // Short press detected - clear timer and perform click
    clearTimeout(enterPressTimer);
    enterPressTimer = null;
    console.log("🖱️ About to call listPlaylistClick, modalOpen:", modalOpen, "isLoggingIn:", isLoggingIn, "focusIndex:", focusIndex);

    if (!modalOpen && !removeFocus && !isLoggingIn) {
const indexToClick = enterDownFocusIndex;
enterDownFocusIndex = null;

if (indexToClick !== null && indexToClick !== undefined) {
  listPlaylistClick(indexToClick);
}    }
  }

  document.addEventListener("keydown", keydownHandler);
  document.addEventListener("keyup", keyupHandler);
  if (removeBtn) removeBtn.onclick = removePlaylist;
  if (cancelBtn) cancelBtn.onclick = closeModal;
  
  // Setup Add User button click handler
  if (addPlaylistBtn) {
    addPlaylistBtn.onclick = () => {
      console.log("🆕 Add User button clicked");
      listPlaylistClick(-1);
    };
  }

  updateFocus();

  ListPlaylistPage.cleanup = function () {
    document.removeEventListener("keydown", keydownHandler);
    document.removeEventListener("keyup", keyupHandler);
    if (enterPressTimer) {
      clearTimeout(enterPressTimer);
      enterPressTimer = null;
    }
    cardElements.forEach((card) => (card.onclick = null));
    if (addPlaylistBtn) addPlaylistBtn.onclick = null;
    if (removeBtn) removeBtn.onclick = null;
    if (cancelBtn) cancelBtn.onclick = null;
  };
}