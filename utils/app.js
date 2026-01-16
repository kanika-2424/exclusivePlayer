
document.addEventListener("DOMContentLoaded", () => {
  // ✅ Set flag to indicate DOMContentLoaded has run
  window._domContentLoaded = true;

  // ✅ FIX: If user is logged in, DO NOT route here.
  // Let main.js handle the loader and session restore.
  const isLogin = localStorage.getItem("isLogin") === "true";
  const selectedPlaylist = localStorage.getItem("selectedPlaylist");

  if (isLogin && selectedPlaylist) {
    console.log(
      "🛑 User logged in - app.js waiting for main.js loader sequence"
    );
    return;
  }

  const playlistsData = JSON.parse(
    localStorage.getItem("playlistsData") || "[]"
  );

  if (playlistsData.length > 0) {
    Router.showPage("playlist");
  } else {
    Router.showPage("login");
  }
});
