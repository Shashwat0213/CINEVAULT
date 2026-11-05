/* =========================================================
   CINEVAULT — CONFIG
========================================================= */

// ❌ YAHAN SE API KEY HATA DI HAI (Ab ye Render par hai)
const TMDB_KEY = "SECURED_ON_RENDER";

// ✅ RENDER BACKEND URL (Apna Render URL yahan daalein)
const TMDB_API_URL = "https://cinevault-api.onrender.com/api/tmdb"; 
// (Agar aapka render URL alag hai, toh use yahan replace kar dein)

// Firebase Configuration (Yeh public hota hai, isme koi dikkat nahi)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBXbtBNAie8rAWEOYqJ6Ff5--F_2pZhXG4",
  authDomain: "cinevault-bd449.firebaseapp.com",
  projectId: "cinevault-bd449",
  storageBucket: "cinevault-bd449.firebasestorage.app",
  messagingSenderId: "974050580946",
  appId: "1:974050580946:web:62c6a55ea7f077618cd00b"
};

const STORAGE_KEYS = {
  VAULT: "cv_vault_v4",
  COLLECTIONS: "cv_collections_v4",
  ACHIEVEMENTS: "cv_achievements_v4",
  THEME: "cv_theme_v4",
  MODE: "cv_mode_v4",
  WATCH_HISTORY: "cv_watch_history_v4"
};

const STATUS_OPTIONS = {
  want:     { label: "🎯 Want",     icon: "🎯" },
  watching: { label: "▶️ Watching", icon: "▶️" },
  watched:  { label: "✅ Watched",  icon: "✅" },
  dropped:  { label: "⏸️ Dropped",  icon: "⏸️" }
};

const ACHIEVEMENTS_LIST = [
  { id: "first_movie",     name: "First Steps",           icon: "🎬", desc: "Add your first movie",         check: v => v.length >= 1 },
  { id: "first_watch",     name: "Lights, Camera, Action",icon: "🎥", desc: "Mark first movie as watched",  check: v => v.filter(m => m.status === "watched").length >= 1 },
  { id: "ten_movies",      name: "Getting Started",       icon: "📽️", desc: "Add 10 movies",                check: v => v.length >= 10 },
  { id: "fifty_movies",    name: "Cinephile",             icon: "🎞️", desc: "Add 50 movies",                check: v => v.length >= 50 },
  { id: "hundred_movies",  name: "Century Club",          icon: "💯", desc: "Add 100 movies",               check: v => v.length >= 100 },
  { id: "ten_watched",     name: "Regular Viewer",        icon: "🍿", desc: "Watch 10 movies",              check: v => v.filter(m => m.status === "watched").length >= 10 },
  { id: "fifty_watched",   name: "Movie Buff",            icon: "🏅", desc: "Watch 50 movies",              check: v => v.filter(m => m.status === "watched").length >= 50 },
  { id: "hundred_watched", name: "Legend",                icon: "👑", desc: "Watch 100 movies",             check: v => v.filter(m => m.status === "watched").length >= 100 },
  { id: "first_favorite",  name: "Love at First Sight",   icon: "❤️", desc: "Favorite a movie",             check: v => v.filter(m => m.favorite).length >= 1 },
  { id: "ten_favorites",   name: "Heart Collector",       icon: "💖", desc: "Favorite 10 movies",           check: v => v.filter(m => m.favorite).length >= 10 },
  { id: "hundred_hours",   name: "Marathon Runner",       icon: "⏱️", desc: "Watch 100 hours",              check: v => v.filter(m => m.status === "watched").reduce((s, m) => s + (m.runtime || 120), 0) >= 6000 },
  { id: "five_star",       name: "Perfectionist",         icon: "⭐", desc: "Give a movie 5 stars",         check: v => v.some(m => m.userRating === 5) },
  { id: "critic",          name: "The Critic",            icon: "📝", desc: "Rate 25 movies",               check: v => v.filter(m => m.userRating > 0).length >= 25 },
  { id: "collector",       name: "Collection Curator",    icon: "📚", desc: "Create a collection",          check: () => {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.COLLECTIONS) || "[]").length >= 1; }
      catch(e) { return false; }
    }
  },
  { id: "reviewer",        name: "The Reviewer",          icon: "✍️", desc: "Add notes to 10 movies",       check: v => v.filter(m => m.notes && m.notes.length > 0).length >= 10 }
];

const APP_CONFIG = {
  name: "CineVault",
  version: "5.0.0",
  searchDebounce: 350,
  cloudSaveDebounce: 1200,
  maxResults: 12,
  toastDuration: 2400
};

const FIREBASE_READY = (
  FIREBASE_CONFIG.apiKey &&
  !FIREBASE_CONFIG.apiKey.startsWith("YOUR_") &&
  FIREBASE_CONFIG.projectId &&
  !FIREBASE_CONFIG.projectId.startsWith("YOUR_")
);

// TMDB_READY ab true rahega kyunki backend URL set hai
const TMDB_READY = true; 

const CV = {
  vault: [],
  collections: [],
  achievements: {},
  watchHistory: {},

  currentFilter: "all",
  currentSort: "recent",
  currentQuery: "",
  searchResults: [],
  highlightIdx: -1,
  searchTimeout: null,
  modalId: null,
  editingId: null,
  addToCollectionMovieId: null,

  advancedFilters: {
    genre: "",
    minYear: null,
    maxYear: null,
    minRating: null,
    runtime: ""
  },

  firebaseAuth: null,
  firebaseDb: null,
  firebaseModules: null,
  currentUser: null,
  cloudSaveTimer: null,
  toastTimer: null
};

window.CV = CV;
window.CV_CONFIG = {
  TMDB_KEY,
  TMDB_API_URL,
  FIREBASE_CONFIG,
  STORAGE_KEYS,
  STATUS_OPTIONS,
  ACHIEVEMENTS_LIST,
  APP_CONFIG,
  FIREBASE_READY,
  TMDB_READY
};