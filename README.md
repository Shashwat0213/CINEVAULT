# 🎬 CineVault

**CineVault** is a modern, cinematic Progressive Web App (PWA) designed for movie buffs and TV series enthusiasts. Track your watchlist, rate movies, write detailed reviews, and never lose track of your favorite episodes — all in one beautifully crafted, app-like experience.

![CineVault Banner](https://via.placeholder.com/1200x400/08060f/ffb800?text=CineVault+%E2%80%94+Your+Cinematic+Journey)

## ✨ Features

### 🎞️ Episode & Movie Tracking
- **TMDB Integration:** Search and fetch accurate data for both Movies and TV Series.
- **Smart Detection:** Automatically detects if the searched item is a movie or a series.
- **Status Tracking:** Mark items as *Want to Watch*, *Watching*, *Watched*, or *Dropped*.
- **Episode Tracker:** Keep track of individual episodes, rate them, and watch the series progress bar fill up.
- **Favorites & Notes:** Mark your top picks and save personal notes.
- **Confetti Celebrations:** Get a confetti blast when you finish a complete series!

### 💬 Reviews & Ratings
- **Multiple Reviews:** Write and manage multiple reviews for a single title.
- **Spoiler Toggle:** Hide or reveal spoilers with a single click.
- **5-Star Rating System:** Rate movies and individual episodes.
- **Beautiful Review Cards:** Elegantly designed cards to showcase your thoughts.

### 🎨 Visuals & Discovery
- **Cinematic UI:** Dark mode by default with smooth animations and genre-based gradient borders.
- **Backdrops & Trailers:** Auto-embedded YouTube trailers and high-res backdrop images in the modal.
- **Genre Explorer:** Discover new content by browsing specific genres.
- **Poster Wall View:** Switch to an alternative grid view for browsing.
- **Trending & Top Rated:** Stay updated with what's hot right now.

### ⚙️ Advanced & Pro Features
- **Data Portability:** Import from IMDb/Letterboxd and export your data to PDF.
- **Watch Goals:** Set yearly and monthly watch targets.
- **PWA Ready:** Install CineVault on your Android, iOS, or Desktop directly from the browser.
- **Offline Mode:** Thanks to the Service Worker, view your cached watchlist even without internet.
- **Push Notifications:** Get notified about upcoming releases and updates.
- **Multi-Language:** Hindi and English support.

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3 (Modular CSS), Vanilla JavaScript (ES6+)
- **Backend & Auth:** Firebase / Firestore
- **API:** [The Movie Database (TMDB) API](https://www.themoviedb.org/documentation/api)
- **PWA:** `manifest.json`, `service-worker.js` (Caching strategies, Offline support)
- **Design:** Custom CSS with Google Fonts (`Bebas Neue`, `Poppins`)

## 📁 Project Structure

```text
cinevault/
├── index.html              # Main entry point
├── manifest.json           # PWA configuration
├── service-worker.js       # Offline caching and background tasks
├── offline.html            # Fallback page when offline
├── icons/                  # App icons (192x192, 512x512, maskable)
├── screenshots/            # PWA store screenshots
├── styles/                 # Modular CSS files
│   ├── main.css
│   ├── themes.css
│   ├── animations.css
│   ├── watch.css
│   ├── episodes.css
│   ├── reviews.css
│   ├── visuals.css
│   ├── discovery.css
│   ├── advanced.css
│   ├── pro.css
│   ├── custom.css
│   └── ads.css
└── scripts/                # Modular JavaScript files
    ├── config.js           # API keys and config
    ├── api.js              # TMDB API calls
    ├── auth.js             # Firebase authentication
    ├── watch.js            # Watchlist logic
    ├── app.js              # Main app initialization
    ├── episodes.js         # Episode tracking logic
    ├── reviews.js          # Review system
    ├── visuals.js          # UI and visual enhancements
    ├── sounds.js           # UI sound effects
    ├── discovery.js        # Genre explorer and trending
    ├── advanced.js         # Imports and goals
    ├── pro.js              # PWA and Pro features
    ├── custom.js           # Custom themes and cursors
    ├── ads.js              # Ad integrations
    └── features.js         # Core feature toggles
