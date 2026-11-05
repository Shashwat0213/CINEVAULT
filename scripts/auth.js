/* =========================================================
   CINEVAULT — AUTH MODULE
   Firebase Authentication + Cloud Sync
========================================================= */

(function () {
  "use strict";

  const CFG = window.CV_CONFIG;
  const state = window.CV;

  if (!CFG || !state) {
    console.error("❌ config.js not loaded before auth.js");
    return;
  }

  const $ = function (id) { return document.getElementById(id); };

  /* ============ HELPERS ============ */
  function setAuthMessage(msg, isError) {
    const el = $("authMessage");
    if (el) {
      el.textContent = msg || "";
      el.style.color = isError ? "#ff9b9b" : "#22c55e";
    }
  }

  function setCloudStatus(text, statusType) {
    const el = $("cloudStatus");
    if (!el) return;
    el.textContent = text;
    el.classList.add("on");
    if (statusType === "ok") el.style.color = "#22c55e";
    else if (statusType === "error") el.style.color = "#ff7b7b";
    else el.style.color = "#ffffff";
  }

  /* =========================================================
     INIT FIREBASE
  ========================================================= */
  async function initFirebase() {
    if (!CFG.FIREBASE_READY) {
      console.warn("⚠️ Firebase not configured — running in local mode");
      setCloudStatus("☁ Local mode");
      return;
    }

    try {
      const appMod = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js");
      const authMod = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js");
      const dbMod = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js");

      const app = appMod.initializeApp(CFG.FIREBASE_CONFIG);
      state.firebaseAuth = authMod.getAuth(app);
      state.firebaseDb = dbMod.getFirestore(app);
      state.firebaseModules = { appMod, authMod, dbMod };

      // Keep session persistent
      try {
        await authMod.setPersistence(state.firebaseAuth, authMod.browserLocalPersistence);
      } catch (e) { /* ignore */ }

      // Auth state listener
      authMod.onAuthStateChanged(state.firebaseAuth, async function (user) {
        state.currentUser = user;
        window.CV_USER = user; // Global check for silent button
        await handleAuthState(user);
        window.dispatchEvent(new Event('authStateChanged')); // Notify UI
      });

      console.log("🔥 Firebase initialized");
      setCloudStatus("☁ Cloud ready", "ok");
    } catch (err) {
      console.error("Firebase init failed:", err);
      setCloudStatus("☁ Cloud off — using local", "error");
    }
  }

  /* =========================================================
     HANDLE AUTH STATE
  ========================================================= */
  async function handleAuthState(user) {
    const userBox = $("authUserBox");
    const loginBtn = $("authOpenBtn");

    if (user) {
      const name = user.displayName || (user.email || "User").split("@")[0];

      if (userBox) userBox.classList.add("on");
      if (userBox) userBox.style.display = "flex";
      if (loginBtn) loginBtn.style.display = "none";

      const nameEl = $("authUserName");
      const avatar = $("authAvatar");
      const status = $("authStatus");

      if (nameEl) nameEl.textContent = name;
      if (status) {
        status.textContent = "☁ Synced";
        status.classList.add("ok");
      }

      if (avatar) {
        if (user.photoURL) {
          avatar.innerHTML = '<img src="' + user.photoURL + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">';
        } else {
          avatar.textContent = name.charAt(0).toUpperCase();
        }
      }

      // Load vault from cloud
      setCloudStatus("☁ Loading vault…");
      await loadCloudVault();
      setCloudStatus("☁ Synced", "ok");
    } else {
      if (userBox) userBox.classList.remove("on");
      if (userBox) userBox.style.display = "none";
      if (loginBtn) loginBtn.style.display = "inline-block";

      const status = $("authStatus");
      if (status) {
        status.textContent = "Local";
        status.classList.remove("ok");
      }

      setCloudStatus("☁ Local mode");
    }
  }

  /* =========================================================
     LOAD VAULT FROM CLOUD
  ========================================================= */
  async function loadCloudVault() {
    if (!state.currentUser || !state.firebaseDb || !state.firebaseModules) return;

    try {
      const { dbMod } = state.firebaseModules;
      const ref = dbMod.doc(state.firebaseDb, "users", state.currentUser.uid, "data", "vault");
      const snap = await dbMod.getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.movies) && data.movies.length > 0) {
          if (data.movies.length >= state.vault.length) {
            state.vault = data.movies;
            saveLocal();
            if (window.CV_APP && window.CV_APP.renderAll) window.CV_APP.renderAll();
            if (window.CV_APP && window.CV_APP.toast) window.CV_APP.toast("✓ Vault synced from cloud");
          } else {
            await saveCloudVault();
          }
        } else {
          await saveCloudVault();
        }
      } else {
        await saveCloudVault();
      }
    } catch (err) {
      console.error("Cloud load failed:", err);
      setCloudStatus("☁ Load failed", "error");
    }
  }

  /* =========================================================
     SAVE VAULT TO CLOUD
  ========================================================= */
  async function saveCloudVault() {
    if (!state.currentUser || !state.firebaseDb || !state.firebaseModules) return;

    try {
      const { dbMod } = state.firebaseModules;
      const ref = dbMod.doc(state.firebaseDb, "users", state.currentUser.uid, "data", "vault");

      await dbMod.setDoc(ref, {
        movies: state.vault,
        updatedAt: dbMod.serverTimestamp()
      }, { merge: true });

      setCloudStatus("☁ Synced", "ok");
    } catch (err) {
      console.error("Cloud save failed:", err);
      setCloudStatus("☁ Save failed", "error");
    }
  }

  function scheduleCloudSave() {
    if (!state.currentUser) return;
    clearTimeout(state.cloudSaveTimer);
    state.cloudSaveTimer = setTimeout(saveCloudVault, CFG.APP_CONFIG.cloudSaveDebounce);
  }

  function saveLocal() {
    try {
      localStorage.setItem(CFG.STORAGE_KEYS.VAULT, JSON.stringify(state.vault));
    } catch (e) { /* ignore */ }
  }

  /* =========================================================
     EMAIL / PASSWORD SUBMIT (GATEWAY FORM)
  ========================================================= */
  async function handleGatewayAuth(isLoginMode) {
    if (!state.firebaseAuth) {
      if(window.CV_APP) window.CV_APP.toast("Auth system loading. Please wait...", true);
      return;
    }

    const email = $("gatewayEmail").value.trim();
    const password = $("gatewayPassword").value;
    const name = $("gatewayName") ? $("gatewayName").value.trim() : "";

    if (!email || !password) {
      if(window.CV_APP) window.CV_APP.toast("Please enter email and password.", true);
      return;
    }

    const submitBtn = $("gatewaySubmitBtn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Please wait...";
    }

    try {
      const { authMod, dbMod } = state.firebaseModules;

      if (isLoginMode) {
        await authMod.signInWithEmailAndPassword(state.firebaseAuth, email, password);
        if(window.CV_APP) window.CV_APP.toast("✓ Logged in!");
      } else {
        const cred = await authMod.createUserWithEmailAndPassword(state.firebaseAuth, email, password);
        if (name) await authMod.updateProfile(cred.user, { displayName: name });
        
        await dbMod.setDoc(
          dbMod.doc(state.firebaseDb, "users", cred.user.uid),
          {
            uid: cred.user.uid,
            email: email,
            displayName: name || email.split("@")[0],
            role: "user",
            createdAt: dbMod.serverTimestamp()
          },
          { merge: true }
        );
        if(window.CV_APP) window.CV_APP.toast("✓ Account created!");
      }

      setTimeout(() => { window.location.reload(); }, 800);
    } catch (err) {
      const msgs = {
        "auth/invalid-credential": "Email or password is incorrect.",
        "auth/email-already-in-use": "Email already registered. Try login.",
        "auth/weak-password": "Password must be at least 6 characters.",
        "auth/invalid-email": "Please enter a valid email."
      };
      if(window.CV_APP) window.CV_APP.toast(msgs[err.code] || err.message, true);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = isLoginMode ? "Login" : "Sign Up";
      }
    }
  }

  /* =========================================================
     GOOGLE SIGN-IN (GATEWAY FORM)
  ========================================================= */
  async function handleGatewayGoogleAuth() {
    if (!state.firebaseAuth) {
      if(window.CV_APP) window.CV_APP.toast("Auth system loading. Please wait...", true);
      return;
    }

    const btn = $("gatewayGoogleBtn");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = "Opening...";
    }

    try {
      const { authMod, dbMod } = state.firebaseModules;
      const provider = new authMod.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await authMod.signInWithPopup(state.firebaseAuth, provider);
      const user = result.user;

      await dbMod.setDoc(
        dbMod.doc(state.firebaseDb, "users", user.uid),
        {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "",
          photoURL: user.photoURL || "",
          role: "user",
          updatedAt: dbMod.serverTimestamp()
        },
        { merge: true }
      );

      if(window.CV_APP) window.CV_APP.toast("✓ Signed in with Google!");
      setTimeout(() => { window.location.reload(); }, 800);
    } catch (err) {
      if(window.CV_APP) window.CV_APP.toast("❌ " + err.message.replace("Firebase: ", ""), true);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg> Continue with Google';
      }
    }
  }

  /* =========================================================
     LOGOUT
  ========================================================= */
  async function handleLogout() {
    if (!state.firebaseAuth) return;
    try {
      await state.firebaseModules.authMod.signOut(state.firebaseAuth);
      if (window.CV_APP && window.CV_APP.toast) window.CV_APP.toast("Logged out");
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  /* =========================================================
     BIND UI (Gateway + Old Modals)
  ========================================================= */
  function bindAuthUI() {
    // Gateway Form Submit
    const gatewaySubmit = $("gatewaySubmitBtn");
    if (gatewaySubmit) {
      gatewaySubmit.addEventListener('click', () => {
        const isLogin = gatewaySubmit.textContent.toLowerCase().includes("login");
        handleGatewayAuth(isLogin);
      });
    }

    // Gateway Google Button
    const gatewayGoogle = $("gatewayGoogleBtn");
    if (gatewayGoogle) {
      gatewayGoogle.addEventListener('click', handleGatewayGoogleAuth);
    }

    // Old Modal Bindings (Just in case)
    const openBtn = $("authOpenBtn");
    if (openBtn) openBtn.addEventListener("click", openAuth);
    
    const closeBtn = $("authCloseBtn");
    if (closeBtn) closeBtn.addEventListener("click", closeAuth);

    const form = $("authForm");
    if (form) form.addEventListener("submit", handleAuthSubmit);

    const googleBtn = $("googleSignInBtn");
    if (googleBtn) googleBtn.addEventListener("click", handleGoogleSignIn);

    const logoutBtn = $("authLogoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
  }

  // Old modal functions (kept for compatibility)
  function openAuth() {
    const overlay = $("authOverlay");
    if (overlay) { overlay.classList.add("open"); overlay.setAttribute("aria-hidden", "false"); }
  }
  function closeAuth() {
    const overlay = $("authOverlay");
    if (overlay) { overlay.classList.remove("open"); overlay.setAttribute("aria-hidden", "true"); }
  }
  async function handleAuthSubmit(event) {
    event.preventDefault();
    // Fallback to gateway handler if old form is used
    handleGatewayAuth(false); 
  }
  async function handleGoogleSignIn() {
    handleGatewayGoogleAuth();
  }

  /* =========================================================
     EXPORTS
  ========================================================== */
  window.CV_AUTH = {
    init: initFirebase,
    bindUI: bindAuthUI,
    openAuth,
    closeAuth,
    saveCloudVault,
    loadCloudVault,
    scheduleCloudSave,
    handleLogout
  };

  // Auto Init
  initFirebase();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindAuthUI);
  } else {
    bindAuthUI();
  }

  console.log("🎬 CineVault Auth module loaded");

})();