const Router = {
  currentPage: null,
  _isNavigating: false,

  async showPage(pageName) {
    console.log("🔄 Router.showPage called with:", pageName);
    
    // ✅ CHECK: If user is logged in and trying to go to playlist, redirect to dashboard instead
    const isLogin = localStorage.getItem('isLogin') === 'true';
    const selectedPlaylist = localStorage.getItem('selectedPlaylist');
    
    if (isLogin && selectedPlaylist && (pageName === 'playlist' || pageName === 'playlist-page')) {
      console.log("🔀 User logged in, redirecting playlist → dashboard");
      pageName = 'dashboard';
    }
    
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
      page.style.display = 'none';
      page.innerHTML = ''; // Clear content
    });

    // Cleanup previous page if exists
    if (this.currentPage) {
      const pageModule = window[this.currentPage + 'Page'];
      if (pageModule && typeof pageModule.cleanup === "function") {
        console.log("🧹 Cleaning up:", this.currentPage);
        pageModule.cleanup();
      }
    }

    // Show and render the requested page
    let pageElement;
    
    switch(pageName) {
      case 'login':
      case 'login-page':
        pageElement = document.getElementById('login-page');
        pageElement.innerHTML = LoginPage();
        this.currentPage = 'Login';
        localStorage.setItem('currentPage', 'login');
        break;
        
      case 'playlist-page':
      case 'playlist':
        // ✅ Don't render playlist if we're in initial load state OR if user is logged in
        if (localStorage.getItem("isLoading") === "true") {
          console.log("⏸️ Blocking playlist navigation during initial load");
          return;
        }
        pageElement = document.getElementById('playlist-page');
        pageElement.innerHTML = ListPlaylistPage();
        this.currentPage = 'Playlist';
        localStorage.setItem('currentPage', 'playlist');
        break;
        
      case 'dashboard':
      case 'dashboard-page':
        // ✅ Don't render dashboard if still loading
        if (localStorage.getItem("isLoading") === "true") {
          console.log("⏳ Still loading, skipping dashboard render");
          return;
        }
        pageElement = document.getElementById('dashboard-page');
        pageElement.innerHTML = DashboardPage();
        this.currentPage = 'Dashboard';
        localStorage.setItem('currentPage', 'dashboard');
        break;
        
      case 'live-tv':
      case 'liveTv':
      case 'live-tv-page':
      case 'liveTvPage':
        pageElement = document.getElementById('live-tv-page');
        pageElement.innerHTML = LiveTvPage();
        this.currentPage = 'LiveTv';
        localStorage.setItem('currentPage', 'liveTvPage');
        break;

      case 'movies':
      case 'movies-page':
      case 'moviesPage':
        pageElement = document.getElementById('movies-page');
        pageElement.innerHTML = MoviesPage();
        this.currentPage = 'Movies';
        localStorage.setItem('currentPage', 'moviesPage');
        break;

      case 'video-player':
      case 'video-player-page':
      case 'videoPlayerPage':
      case 'videoJsPlayer':
        console.log("🎬 Loading video player page");
        
        pageElement = document.getElementById('video-player');
        
        if (!pageElement) {
          console.error("❌ video-player element not found in DOM!");
          pageElement = document.createElement('div');
          pageElement.id = 'video-player';
          pageElement.className = 'page';
          document.getElementById('app').appendChild(pageElement);
        }
        
        const videoPlayerHTML = VideoJsPlayer();
        console.log("📝 Video player HTML generated");
        
        pageElement.innerHTML = videoPlayerHTML;
        console.log("✅ Video player HTML inserted");
        
        this.currentPage = 'VideoJsPlayer';
        localStorage.setItem('currentPage', 'videojsPlayer');
        
        setTimeout(() => {
          const videoEl = document.getElementById('videojs-player-tag');
          if (videoEl) {
            console.log("✅ Video element confirmed in DOM");
          } else {
            console.error("❌ Video element NOT in DOM after 100ms");
          }
        }, 100);
        
        break;

      case 'movie-detail':
      case 'movie-detail-page':
      case 'movieDetailPage':
      case 'movieDetail':
        pageElement = document.getElementById('movie-detail-page');
        pageElement.innerHTML = `
          <div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#000;">
            <div class="spinner"></div>
          </div>
        `;
        pageElement.style.display = 'block';
        await MovieDetailPage();
        this.currentPage = 'MovieDetail';
        localStorage.setItem('currentPage', 'moviesDetailPage');
        return;
        
      case 'series':
      case 'series-page':
      case 'seriesPage':
        pageElement = document.getElementById('series-page');
        pageElement.innerHTML = SeriesPage();
        this.currentPage = 'Series';
        localStorage.setItem('currentPage', 'seriesPage');
        break;

      case 'series-detail':
      case 'series-detail-page':
      case 'seriesDetailPage':
      case 'seriesDetail':
        pageElement = document.getElementById('series-detail-page');
        pageElement.innerHTML = `
          <div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#000;">
            <div class="spinner"></div>
          </div>
        `;
        pageElement.style.display = 'block';
        await SeriesDetailPage();
        this.currentPage = 'SeriesDetail';
        localStorage.setItem('currentPage', 'seriesDetailPage');
        return;

      case 'settings':
      case 'settings-page':
        pageElement = document.getElementById('settings-page');
        pageElement.innerHTML = SettingsPage();
        this.currentPage = 'Settings';
        localStorage.setItem('currentPage', 'settingsPage');
        break;

      case 'account-page':
        pageElement = document.getElementById('account-page');
        pageElement.innerHTML = AccountPage();
        this.currentPage = 'AccountPage';
        localStorage.setItem('currentPage', 'accountPage');
        break;

      default:
        console.warn('❌ Unknown page:', pageName);

        // Check if any playlists exist
        const playlistsData = JSON.parse(localStorage.getItem('playlistsData') || '[]');
        if (playlistsData.length > 0) {
          // ✅ Check if user is logged in before showing playlist
          if (isLogin && selectedPlaylist) {
            pageElement = document.getElementById('dashboard-page');
            if (pageElement) {
              pageElement.innerHTML = DashboardPage();
              this.currentPage = 'Dashboard';
              localStorage.setItem('currentPage', 'dashboard');
            }
          } else {
            // Show playlist page if not logged in
            pageElement = document.getElementById('playlist-page');
            if (pageElement) {
              pageElement.innerHTML = ListPlaylistPage();
              this.currentPage = 'Playlist';
              localStorage.setItem('currentPage', 'playlist');
            }
          }
        } else {
          // fallback to login if no users
          pageElement = document.getElementById('login-page');
          if (pageElement) {
            pageElement.innerHTML = LoginPage();
            this.currentPage = 'Login';
            localStorage.setItem('currentPage', 'login');
          }
        }
        break;
    }

    if (pageElement) {
      pageElement.style.display = 'block';
      console.log("✅ Page shown:", pageName);
    } else {
      console.error("❌ Page element not found for:", pageName);
    }
  }
};

// Global navigation helper
async function navigateTo(pageName) {
  console.log("🧭 navigateTo called with:", pageName);
  
  // Normalize page names
  const pageMap = {
    'login-page': 'login',
    'dashboard-page': 'dashboard',
    'live-tv-page': 'live-tv',
    'liveTvPage': 'live-tv',
    'movies-page': 'movies',
    'moviesPage': 'movies',
    'movie-detail-page': 'movie-detail',
    'movieDetailPage': 'movie-detail',
    'series-page': 'series',
    'seriesPage': 'series',
    'series-detail-page': 'series-detail',
    'seriesDetailPage': 'series-detail',
    'video-player': 'video-player',
    'account-page': 'account-page'
  };
  
  const normalizedPage = pageMap[pageName] || pageName;
  await Router.showPage(normalizedPage);
}