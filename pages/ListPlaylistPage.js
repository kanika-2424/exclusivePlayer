

function ListPlaylistPage() {
  let playlistsData = JSON.parse(localStorage.getItem("playlistsData")) || [];

  if (playlistsData.length === 0) {
    localStorage.removeItem("currentPage");
    Router.showPage("login");
    return "";
  }

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

     <div id="loading-overlay" class="hidden"
       style="position: fixed; width: 100%; height: 100%; 
       background: rgba(0,0,0,0.8); display: flex;
       align-items: center; justify-content: center; z-index: 9999;">
    <div style="display: flex; flex-direction: column;
         align-items: center; justify-content: center; color: white;">
      <div class="spinner"></div>


      <div style="font-size: 24px; font-weight: bold; margin: 10px 0;">Loading...</div>
      <div id="loading-progress" style="font-size: 32px; font-weight: bold;">0%</div>
    </div>


  </div>


</div>
`;

  // After HTML is in DOM, call mount to setup JS
  setTimeout(() => {mountListPlaylistPage(playlistsData) 
  const addPlaylistBtn = document.querySelector(".playlist-add-user");

if (addPlaylistBtn) {
  addPlaylistBtn.onclick = () => {
    localStorage.removeItem("currentPage");
    ListPlaylistPage.cleanup();
    Router.showPage("login");
  };
}

  }, 0);

  return html;
}

function mountListPlaylistPage(playlistsData) {
  const addPlaylistBtn = document.querySelector(".playlist-add-user");

 let focusIndex;
if (playlistsData.length > 0) {
  focusIndex = 0;
} else {
  focusIndex = -1;
}
  let removeFocus = false;
  let modalFocusIndex = 0;
  let modalOpen = false;
  let enterPressTimer = null;
  const LONG_PRESS_DURATION = 500;

  // Get DOM elements after render
  const cardElements = Array.from(document.querySelectorAll(".playlist-card") || []);
  const modal = document.querySelector(".playlist-modal");
  const removeBtn = document.querySelector(".playlist-remove-btn");
  const cancelBtn = document.querySelector(".playlist-cancel-btn");
  const modalButtons = [removeBtn, cancelBtn];


  // ---------- Focus helper ----------
  function updateFocus() {
    if (modalOpen) {
      modalButtons.forEach((btn, i) => {
        if (btn) btn.classList.toggle("playlist-card-focused", i === modalFocusIndex);
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
function listPlaylistClick(targetIndex = null) {
  if (localStorage.getItem("currentPage") !== "playlist" || modalOpen) return;

  if (targetIndex === -1) {
    // Add Playlist button or logout
    localStorage.removeItem("currentPage");
    ListPlaylistPage.cleanup();
    Router.showPage("login");
    return;
  }

  if (targetIndex >= 0 && targetIndex < playlistsData.length) {
    const playlist = playlistsData[targetIndex];
    if (!playlist) return;

    loginApi("", "", playlist.playlistName, true, playlist.playlistUrl)
      .then((response) => {
        if (response) {
          // Save selected playlist
          localStorage.setItem("selectedPlaylist", JSON.stringify(playlist));
          
          // Cleanup current page
          ListPlaylistPage.cleanup();

          // ✅ Navigate to dashboard for this user
          Router.showPage("dashboard");
        }
      });
  }
}


  // ---------- Modal ----------
  function openModal() {
    if (!modal || focusIndex < 0 || focusIndex >= cardElements.length) return;
    modal.classList.remove("hidden");
    modalOpen = true;
    modalFocusIndex = 0;
    updateFocus();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.add("hidden");
    modalOpen = false;
    updateFocus();
  }

  function removePlaylist() {
    if (focusIndex >= 0 && focusIndex < playlistsData.length) {
      playlistsData.splice(focusIndex, 1);
      localStorage.setItem("playlistsData", JSON.stringify(playlistsData));
      Router.showPage("playlist");
    }

    if (playlistsData.length === 0) {
      focusIndex = -1;
      removeFocus = false;
    }

    closeModal();
  }

  // ---------- Keyboard ----------
  function keydownHandler(e) {
    if (localStorage.getItem("currentPage") !== "playlist") return;

    const rowLength = 4;
    const totalCards = cardElements.length;

    if (modalOpen) {
      switch (e.key) {
        case "ArrowRight":
          modalFocusIndex = (modalFocusIndex + 1) % modalButtons.length;
          updateFocus();
          e.preventDefault();
          return;
        case "ArrowLeft":
          modalFocusIndex = (modalFocusIndex - 1 + modalButtons.length) % modalButtons.length;
          updateFocus();
          e.preventDefault();
          return;
        case "Enter":
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
        if (focusIndex === -1) addPlaylistBtn.click();
        else listPlaylistClick(focusIndex);
        break;
      default:
        return;
    }

    removeFocus = false;
    updateFocus();
    e.preventDefault();
  }

  function keyupHandler(e) {
    if (localStorage.getItem("currentPage") !== "playlist") return;
    if ((e.key !== "Enter" && e.keyCode !== 13) || !enterPressTimer) return;

    clearTimeout(enterPressTimer);
    enterPressTimer = null;

    if (!modalOpen && !removeFocus) listPlaylistClick(focusIndex);
  }

  document.addEventListener("keydown", keydownHandler);
  document.addEventListener("keyup", keyupHandler);
  if (removeBtn) removeBtn.onclick = removePlaylist;
  if (cancelBtn) cancelBtn.onclick = closeModal;

  updateFocus();

  ListPlaylistPage.cleanup = function () {
    document.removeEventListener("keydown", keydownHandler);
    document.removeEventListener("keyup", keyupHandler);
    cardElements.forEach((card) => (card.onclick = null));
    if (addPlaylistBtn) addPlaylistBtn.onclick = null;
    if (removeBtn) removeBtn.onclick = null;
    if (cancelBtn) cancelBtn.onclick = null;
  };
}
