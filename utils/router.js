


const Router = {
  currentPage: null,
  _isNavigating: false, // ✅ Add this property

  

  async showPage(pageName) {
    console.log("🔄 Router.showPage called with:", pageName);
    
    
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
      page.style.display = 'none';
      page.innerHTML = ''; // Clear content
    });

    // Cleanup previous page if exists
    if (this.currentPage && window[this.currentPage + 'Page']?.cleanup) {
      console.log("🧹 Cleaning up:", this.currentPage);
      window[this.currentPage + 'Page'].cleanup();
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
      case 'playlist-page':
        pageElement = document.getElementById('playlist-page');
        pageElement.innerHTML = ListPlaylistPage();
        this.currentPage = 'Playlist';
        localStorage.setItem('currentPage', 'playlist');
        break;

        
      case 'dashboard':
      case 'dashboard-page':
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
    // Try to create it if it doesn't exist
    pageElement = document.createElement('div');
    pageElement.id = 'video-player';
    pageElement.className = 'page';
    document.getElementById('app')?.appendChild(pageElement);
  }
  
  // Generate video player HTML
  const videoPlayerHTML = VideoJsPlayer();
  console.log("📝 Video player HTML generated");
  
  // Insert HTML into page
  pageElement.innerHTML = videoPlayerHTML;
  console.log("✅ Video player HTML inserted");
  
  this.currentPage = 'VideoJsPlayer';
  localStorage.setItem('currentPage', 'videojsPlayer');
  
  // Wait a bit for DOM to be ready, then verify video element exists
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
        // Show loading state
        pageElement.innerHTML = `
          <div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#000;">
            <div class="spinner"></div>
          </div>
        `;
        pageElement.style.display = 'block';
        // Call async function
        await MovieDetailPage();
        this.currentPage = 'MovieDetail';
        localStorage.setItem('currentPage', 'moviesDetailPage');
        return; // Early return since page is already shown
        
      case 'series':
      case 'series-page':
      case 'seriesPage':
        case 'seriesDetail':
        pageElement = document.getElementById('series-page');
        pageElement.innerHTML = SeriesPage();
        this.currentPage = 'Series';
        localStorage.setItem('currentPage', 'seriesPage');
        break;


        

      case 'series-detail':
      case 'series-detail-page':
      case 'seriesDetailPage':
        pageElement = document.getElementById('series-detail-page');
        // Show loading state
        pageElement.innerHTML = `
          <div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#000;">
            <div class="spinner"></div>
          </div>
        `;
        pageElement.style.display = 'block';
        // Call async function
        await SeriesDetailPage();
        this.currentPage = 'SeriesDetail';
        localStorage.setItem('currentPage', 'seriesDetailPage');
        return; // Early return since page is already shown
    default:
    console.warn('❌ Unknown page:', pageName);

    // Check if any playlists exist
    const playlistsData = JSON.parse(localStorage.getItem('playlistsData') || '[]');
    if (playlistsData.length > 0) {
        // Show playlist page if users exist
        pageElement = document.getElementById('playlist-page');
        if (pageElement) {
            pageElement.innerHTML = ListPlaylistPage(); // or ListPlaylistPage()
            this.currentPage = 'Playlist';
            localStorage.setItem('currentPage', 'playlist');
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


    case 'settings':
      case 'settings-page':
        pageElement = document.getElementById('settings-page');
        pageElement.innerHTML = SettingsPage();
        this.currentPage = 'Settings';
        localStorage.setItem('currentPage', 'settingsPage');
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

  };
  
  const normalizedPage = pageMap[pageName] || pageName;
  await Router.showPage(normalizedPage);
}