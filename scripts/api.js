/* =========================================================
   CINEVAULT — API MODULE (Render Proxy Version)
========================================================= */

(function () {
  "use strict";

  const CFG = window.CV_CONFIG;
  if (!CFG) return;

  function sanitize(q) { return String(q || "").trim(); }
  
  function posterUrl(path, size) {
    if (!path) return "";
    return "https://image.tmdb.org/t/p/" + (size || "w500") + path;
  }

  // Ab saari calls Render ke through jayengi
  async function searchTMDB(query) {
    if (!CFG.TMDB_READY) return null;
    const q = sanitize(query);
    if (!q || q.length < 2) return null;

    // Render Proxy URL
    const url = CFG.TMDB_API_URL + "/search/multi?query=" + encodeURIComponent(q) + "&include_adult=false&language=en-US&page=1";

    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.results) return [];

      const filtered = data.results.filter(function (m) {
        return m.media_type === "movie" || m.media_type === "tv";
      });

      return filtered.slice(0, CFG.APP_CONFIG.maxResults).map(function (m) {
        const isTV = m.media_type === "tv";
        const title = isTV ? (m.name || m.original_name || "Untitled") : (m.title || m.original_title || "Untitled");
        const dateStr = isTV ? m.first_air_date : m.release_date;

        return {
          source: "tmdb",
          sourceId: "tmdb-" + m.id,
          tmdbId: m.id,
          type: isTV ? "series" : "movie",
          title: title,
          year: (dateStr || "").slice(0, 4) || "—",
          releaseDate: dateStr || "",
          poster: posterUrl(m.poster_path, "w500"),
          backdrop: posterUrl(m.backdrop_path, "w780"),
          overview: m.overview || "",
          rating: m.vote_average || 0,
          genre: "",
          runtime: 0,
          trailerUrl: ""
        };
      });
    } catch (err) {
      return null;
    }
  }

  async function searchiTunes(query) {
    const q = sanitize(query);
    if (!q || q.length < 2) return [];
    const url = "https://itunes.apple.com/search?term=" + encodeURIComponent(q) + "&media=movie&entity=movie&limit=" + CFG.APP_CONFIG.maxResults;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("iTunes HTTP " + res.status);
      const data = await res.json();
      return (data.results || []).map(function (m) {
        const poster = m.artworkUrl100 ? m.artworkUrl100.replace("100x100bb", "600x900bb") : "";
        return {
          source: "itunes", sourceId: "itunes-" + m.trackId, tmdbId: null, type: "movie",
          title: m.trackName || "Untitled", year: m.releaseDate ? m.releaseDate.slice(0, 4) : "—",
          releaseDate: m.releaseDate ? m.releaseDate.slice(0, 10) : "",
          poster: poster, backdrop: "", overview: m.longDescription || m.shortDescription || "",
          rating: 0, genre: m.primaryGenreName || "", runtime: m.trackTimeMillis ? Math.round(m.trackTimeMillis / 60000) : 0,
          trailerUrl: m.previewUrl || ""
        };
      });
    } catch (err) { return []; }
  }

  async function searchMovies(query) {
    const tmdb = await searchTMDB(query);
    if (tmdb !== null && tmdb.length > 0) return tmdb;
    return searchiTunes(query);
  }

  async function fetchTMDBDetails(tmdbId, isTV) {
    if (!CFG.TMDB_READY || !tmdbId) return null;
    const mediaType = isTV ? "tv" : "movie";
    const base = CFG.TMDB_API_URL + "/" + mediaType + "/" + tmdbId;

    try {
      const [dR, cR, vR] = await Promise.all([
        fetch(base + ""),
        fetch(base + "/credits"),
        fetch(base + "/videos")
      ]);

      const details = dR.ok ? await dR.json() : null;
      const credits = cR.ok ? await cR.json() : null;
      const videos = vR.ok ? await vR.json() : null;

      let trailerUrl = "";
      if (videos && videos.results) {
        const yt = videos.results.find(v => v.site === "YouTube" && v.type === "Trailer") || videos.results.find(v => v.site === "YouTube");
        if (yt) trailerUrl = "https://www.youtube.com/watch?v=" + yt.key;
      }

      let cast = [];
      if (credits && credits.cast) cast = credits.cast.slice(0, 8).map(c => c.name);

      let director = "";
      if (credits && credits.crew) {
        const d = credits.crew.find(c => c.job === "Director");
        if (d) director = d.name;
      }
      if (!director && details && details.created_by) director = details.created_by.map(c => c.name).join(", ");

      const genre = details && details.genres ? details.genres.map(g => g.name).join(", ") : "";
      let runtime = 0;
      if (details && details.runtime) runtime = details.runtime;
      else if (details && details.episode_run_time && details.episode_run_time[0]) runtime = details.episode_run_time[0];

      return {
        runtime: runtime, genre: genre, overview: (details && details.overview) || "",
        tmdbRating: (details && details.vote_average) || 0, trailerUrl: trailerUrl, cast: cast,
        director: director, releaseDate: (details && (details.release_date || details.first_air_date)) || "",
        totalEpisodes: details ? details.number_of_episodes : 0, totalSeasons: details ? details.number_of_seasons : 0
      };
    } catch (err) { return null; }
  }

  async function fetchSimilarMovies(tmdbId) {
    if (!CFG.TMDB_READY || !tmdbId) return [];
    try {
      const res = await fetch(CFG.TMDB_API_URL + "/movie/" + tmdbId + "/similar?language=en-US&page=1");
      if (!res.ok) return [];
      const data = await res.json();
      return (data.results || []).slice(0, 6).map(function (m) {
        return {
          tmdbId: m.id, sourceId: "tmdb-" + m.id, type: "movie", title: m.title || m.original_title || "Untitled",
          year: (m.release_date || "").slice(0, 4) || "—", releaseDate: m.release_date || "",
          poster: posterUrl(m.poster_path, "w342"), overview: m.overview || "", rating: m.vote_average || 0
        };
      });
    } catch (err) { return []; }
  }

  function buildMovieObject(result, extra, status) {
    extra = extra || {};
    const isSeries = result.type === "series" || result.type === "tv";
    const movie = {
      id: "cv-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      sourceId: result.sourceId || ("manual-" + Date.now()),
      tmdbId: result.tmdbId || null, type: isSeries ? "series" : "movie",
      title: result.title || "Untitled", year: result.year || "—", releaseDate: extra.releaseDate || result.releaseDate || "",
      poster: result.poster || "", backdrop: result.backdrop || "", overview: extra.overview || result.overview || "",
      tmdbRating: extra.tmdbRating || Number(result.rating) || 0, genre: extra.genre || result.genre || "",
      runtime: extra.runtime || result.runtime || 0, cast: extra.cast || [], director: extra.director || "",
      trailerUrl: extra.trailerUrl || result.trailerUrl || "", watchUrl: "", downloadUrl: "",
      userRating: 0, notes: "", status: status || "want", favorite: false, addedAt: Date.now(), watchedAt: null
    };

    if (isSeries) {
      const total = extra.totalEpisodes || 6;
      movie.totalEpisodes = total;
      movie.totalSeasons = extra.totalSeasons || 0;
      movie.episodes = [];
      for (let i = 1; i <= total; i++) movie.episodes.push({ number: i, watched: false, watchedAt: null, rating: 0 });
    }
    return movie;
  }

  window.CV_API = { searchMovies, searchTMDB, searchiTunes, fetchTMDBDetails, fetchSimilarMovies, buildMovieObject, posterUrl };
})();