// function navigateTo(pageId) {
//   document.querySelectorAll(".page").forEach(p => p.style.display = "none");
//   document.getElementById(pageId).style.display = "block";
// }


// Simple Router for Page Navigation
const Router = {
  currentPage: null,

  showPage(pageName) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
      page.style.display = 'none';
      page.innerHTML = ''; // Clear content
    });

    // Cleanup previous page if exists
    if (this.currentPage && window[this.currentPage + 'Page']?.cleanup) {
      window[this.currentPage + 'Page'].cleanup();
    }

    // Show and render the requested page
    let pageElement, pageContent;
    
    switch(pageName) {
      case 'login':
        pageElement = document.getElementById('login-page');
        pageContent = LoginPage();
        this.currentPage = 'Login';
        break;
        
      case 'dashboard':
        pageElement = document.getElementById('dashboard-page');
        pageContent = DashboardPage();
        this.currentPage = 'Dashboard';
        break;
        
      case 'live-tv':
      case 'liveTv':
      case 'live-tv-page':
        pageElement = document.getElementById('live-tv-page');
        pageContent = LiveTvPage();
        this.currentPage = 'LiveTv';
        break;



      case "movies":
      case "movies-page":
      case "moviesPage":
        pageElement = document.getElementById("movies-page");
        pageContent = MoviesPage();   // <-- IMPORTANT FIX
        this.currentPage = "Movies";
        break;


        case "movie-detail":
case "movie-detail-page":
case "movieDetailPage":
  pageElement = document.getElementById("movie-detail-page");
  pageContent = MovieDetailPage();   // your function
  this.currentPage = "MovieDetailPage";
  break;


  
        
      default:
        console.error('Unknown page:', pageName);
        return;
    }

    if (pageElement) {
      pageElement.innerHTML = pageContent;
      pageElement.style.display = 'block';
    }
  }
};

// Global navigation helper
function navigateTo(pageName) {
  // Normalize page names
  const pageMap = {
    'login-page': 'login',
    'dashboard-page': 'dashboard',
    'live-tv-page': 'live-tv',
    'liveTvPage': 'live-tv'
  };
  
  const normalizedPage = pageMap[pageName] || pageName;
  Router.showPage(normalizedPage);
}