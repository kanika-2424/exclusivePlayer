function MovieDetailPage() {
  // Movie data - replace with API data
  const movieData = {
    id: 1,
    title: "Movie Name",
    rating: 5.9,
    duration: "2h 35min",
    releaseDate: "2025-12-14",
    director: "James Cameron",
    genres: ["Science-Fiction", "Adventure", "Action"],
    description: "Emphasize the emotional depth, character development, and the impactful moments that drive the narrative.",
    posterImage: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
    isFavorite: false,
    cast: [
      { id: 1, name: "Robert Downey Jr.", image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg" },
      { id: 2, name: "Chris Evans", image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg" },
      { id: 3, name: "Scarlett Johansson", image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg" },
      { id: 4, name: "Chris Hemsworth", image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg" },
      { id: 5, name: "Chris Evans", image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg" },
      { id: 6, name: "Scarlett Johansson", image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg" },
      { id: 7, name: "Chris Hemsworth", image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg" },
      { id: 8, name: "Paulo He", image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg" }
    ]
  };

  // Remote navigation state
  let currentSection = "header"; // "header", "poster", "buttons", "description", "cast"
  let currentFocusIndex = 0;
  let castCards = [];

  setTimeout(() => {
    // Get all cast cards
    castCards = Array.from(document.querySelectorAll(".cast-card"));

    // Set initial focus on Play Now button
    currentSection = "buttons";
    currentFocusIndex = 0;
    setFocusOnButton(0);

    // Remote navigation event listener
    document.addEventListener("keydown", handleRemoteNavigation);

    // Heart icon click for favorite
    const heartIcon = document.querySelector(".favorite-heart");
    if (heartIcon) {
      heartIcon.addEventListener("click", () => {
        heartIcon.classList.toggle("active");
        movieData.isFavorite = !movieData.isFavorite;
      });
    }
  }, 0);

  // Handle remote navigation
  function handleRemoteNavigation(e) {
    const buttons = Array.from(document.querySelectorAll(".action-button"));
    const castCards = Array.from(document.querySelectorAll(".cast-card"));

    switch(e.key) {
      case "ArrowRight":
        e.preventDefault();
        
        if (currentSection === "buttons") {
          // Move to next button
          if (currentFocusIndex < buttons.length - 1) {
            currentFocusIndex++;
            setFocusOnButton(currentFocusIndex);
          }
        } else if (currentSection === "cast") {
          // Move to next cast member
          if (currentFocusIndex < castCards.length - 1) {
            currentFocusIndex++;
            setFocusOnCast(currentFocusIndex);
          }
        }
        break;

      case "ArrowLeft":
        e.preventDefault();
        
        if (currentSection === "buttons") {
          // Move to previous button
          if (currentFocusIndex > 0) {
            currentFocusIndex--;
            setFocusOnButton(currentFocusIndex);
          }
        } else if (currentSection === "cast") {
          // Move to previous cast member
          if (currentFocusIndex > 0) {
            currentFocusIndex--;
            setFocusOnCast(currentFocusIndex);
          }
        }
        break;

      case "ArrowDown":
        e.preventDefault();
        
        if (currentSection === "buttons") {
          // Go to cast section
          currentSection = "cast";
          currentFocusIndex = 0;
          setFocusOnCast(0);
        } else if (currentSection === "cast") {
          // Can't go further down
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        
        if (currentSection === "buttons") {
          // Go to header search
          currentSection = "header";
          setFocusOnHeaderSearch();
        } else if (currentSection === "cast") {
          // Go back to buttons
          currentSection = "buttons";
          currentFocusIndex = 0;
          setFocusOnButton(0);
        }
        break;

      case "Enter":
        e.preventDefault();
        
        if (currentSection === "buttons") {
          // Trigger button click
          if (buttons[currentFocusIndex]) {
            buttons[currentFocusIndex].click();
            console.log("Button clicked:", currentFocusIndex);
          }
        } else if (currentSection === "cast") {
          // Trigger cast card click
          if (castCards[currentFocusIndex]) {
            castCards[currentFocusIndex].click();
            console.log("Cast selected:", currentFocusIndex);
          }
        }
        break;
    }
  }

  // Set focus on button
  function setFocusOnButton(index) {
    removeAllFocus();
    currentSection = "buttons";

    const buttons = Array.from(document.querySelectorAll(".action-button"));
    if (buttons[index]) {
      buttons[index].classList.add("focused");
      buttons[index].scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center"
      });
    }
  }

  // Set focus on cast card
  function setFocusOnCast(index) {
    removeAllFocus();
    currentSection = "cast";

    const castCards = Array.from(document.querySelectorAll(".cast-card"));
    if (castCards[index]) {
      castCards[index].classList.add("focused");
      castCards[index].scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest"
      });
    }
  }

  // Set focus on header search
  function setFocusOnHeaderSearch() {
    removeAllFocus();
    currentSection = "header";

    const headerSearchContainer = document.querySelector(".search-container");
    if (headerSearchContainer) {
      headerSearchContainer.classList.add("search-focused");
      headerSearchContainer.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  }

  // Remove all focus states
  function removeAllFocus() {
    const buttons = document.querySelectorAll(".action-button");
    buttons.forEach(btn => btn.classList.remove("focused"));

    const castCards = document.querySelectorAll(".cast-card");
    castCards.forEach(card => card.classList.remove("focused"));

    const headerSearchContainer = document.querySelector(".search-container");
    if (headerSearchContainer) {
      headerSearchContainer.classList.remove("search-focused");
    }
  }

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

  // Format genres
  const genresText = movieData.genres.join(" / ");

  return `
<div class="livetv-main-container">
  <header class="livetv-header">
    <div class="header-left">
      <img src="/assets/logo.png" class="app-logo" />
      <div class="">
        <span class="current-time">${time}</span>
        <span class="current-date">${date}</span>
      </div>
    </div>

    <div class="live-indicator">
      <span class="current-time">${movieData.title}</span>
    </div>

    <div class="header-right">
      <div class="search-container">
        <div class="search-icon">
          <img src="/assets/search.svg" />
        </div>
        <input type="text" class="search-input" placeholder="Search Movie" />
      </div>
      <div class="menu-dots">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      </div>
    </div>
  </header>

  <div class="movie-detail-content">
    <!-- Left: Poster -->
    <div class="poster-section">
      <div class="poster-container">
        <img src="${movieData.posterImage}" alt="${movieData.title}" class="poster-image" />
        <div class="rating-badge">
        <span class="star-icon">  <img src="/assets/star.svg" class="star-icon" />  </span>
      
        ${movieData.rating}</div>
      </div>
    </div>

    <!-- Right: Details -->
    <div class="details-section">
      <div class="movie-header">
        <h1 class="movie-title">${movieData.title}</h1>
        <div class="favorite-heart"><img src="/assets/heart.svg" /></div>
      </div>

      <div class="movie-meta">
        <span class="duration">${movieData.duration}</span>
        <span class="separator">•</span>
        <span class="release-date">${movieData.releaseDate}</span>
      </div>

      <div class="movie-info">
        <p class="info-row">
          <span class="label">Directed By :</span>
          <span class="value">${movieData.director}</span>
        </p>
        <p class="info-row">
          <span class="label">Genre :</span>
          <span class="value">${genresText}</span>
        </p>
      </div>

      <p class="movie-description">${movieData.description}</p>

      <div class="action-buttons">
        <button class="action-button play-button">
          <span class="play-icon">▶</span>
          <span>Play Now</span>
        </button>
        <button class="action-button trailer-button">Watch Trailer</button>
      </div>
    </div>
  </div>

  <!-- Cast & Crew Section -->
  <div class="cast-section">
    <h2 class="cast-title">Cast & Crew</h2>
    <div class="cast-grid">
      ${movieData.cast.map((member, index) => `
        <div class="cast-card" data-index="${index}">
          <img src="${member.image}" alt="${member.name}" class="cast-image" />
          <p class="cast-name">${member.name}</p>
        </div>
      `).join("")}
    </div>
  </div>
</div>
`;
}