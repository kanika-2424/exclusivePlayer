

// async function navigateTo(pageId) {
//   // Hide all pages
//   document.querySelectorAll('.page').forEach(page => {
//     page.style.display = 'none';
//     page.innerHTML = '';
//   });
  
//   // Show requested page
//   const targetPage = document.getElementById(pageId);
//   if (targetPage) {
//     targetPage.style.display = 'block';
    
//     // Render the appropriate page
//     if (pageId === 'login-page') {
//       targetPage.innerHTML = LoginPage();
//     } else if (pageId === 'playlist-page') {
//       targetPage.innerHTML = ListPlaylistPage();
//     } else if (pageId === 'video-player') {
//       targetPage.innerHTML = VideoPlayerPage();
//     }
    
//     else if (pageId === 'dashboard-page') {
//       targetPage.innerHTML = DashboardPage();
//     } else if (pageId === 'live-tv-page') {
//       targetPage.innerHTML = LiveTvPage();
//     } else if(pageId === 'movies-page') {
//       targetPage.innerHTML = MoviesPage();
//     } else if (pageId === "movie-detail-page") {
//       // Show loading state immediately
//       targetPage.innerHTML = `
//         <div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#000;">
//           <div class="spinner"></div>
//         </div>
//       `;
//       // Then call async function (it will update the container itself)
//       await MovieDetailPage();
//     } else if (pageId === "series-page") {
//       targetPage.innerHTML = SeriesPage();
//     } else if (pageId === "series-detail-page") {
//       // Show loading state immediately
//       targetPage.innerHTML = `
//         <div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#000;">
//           <div class="spinner"></div>
//         </div>
//       `;
//       // Then call async function (it will update the container itself)
//       await SeriesDetailPage();
//     }else if (pageId === 'settings-page') {
//       targetPage.innerHTML = SettingsPage();
//     }
//   }
// }

// // Initialize app - show login page on load
// document.addEventListener('DOMContentLoaded', () => {
//   const playlistsData = JSON.parse(localStorage.getItem('playlistsData') || '[]');

//   if (playlistsData.length > 0) {
//     navigateTo('playlist-page');
//   } else {
//     navigateTo('login-page');
//   }
// });


document.addEventListener('DOMContentLoaded', () => {
  const playlistsData = JSON.parse(localStorage.getItem('playlistsData') || '[]');

  if (playlistsData.length > 0) {
    Router.showPage('playlist');
  } else {
    Router.showPage('login');
  }
});
