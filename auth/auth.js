(function () {

  const API_URL = `http://${window.location.hostname}:3000/api`;

  function getToken() {
    return localStorage.getItem("naell_token");
  }

  function setToken(token) {
    localStorage.setItem("naell_token", token);
  }

  function clearToken() {
    localStorage.removeItem("naell_token");
    localStorage.removeItem("naell_user");
  }

  function getUser() {
    const raw = localStorage.getItem("naell_user");
    return raw ? JSON.parse(raw) : null;
  }

  function setUser(user) {
    localStorage.setItem("naell_user", JSON.stringify(user));
  }

  async function apiRequest(endpoint, options = {}) {
    const headers = { "Content-Type": "application/json" };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Terjadi kesalahan.");
    return data;
  }

  function createAuthModal() {
    const modal = document.createElement("div");
    modal.className = "auth-modal";
    modal.id = "authModal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="auth-backdrop" onclick="window.closeAuthModal()"></div>
      <div class="auth-dialog">
        <button class="auth-close" onclick="window.closeAuthModal()">&times;</button>

        <div class="auth-logo">N</div>
        <h2 class="auth-title">Selamat Datang di Naell Store</h2>
        <p class="auth-subtitle">Masuk atau daftar untuk melanjutkan</p>

        <div class="auth-tabs">
          <button class="auth-tab active" data-tab="login">Masuk</button>
          <button class="auth-tab" data-tab="register">Daftar</button>
        </div>

        <form class="auth-form active" id="loginForm">
          <div class="auth-field">
            <label>Username atau Email</label>
            <input type="text" name="username" required autocomplete="username">
          </div>
          <div class="auth-field">
            <label>Password</label>
            <div class="password-wrapper">
              <input type="password" name="password" id="loginPassword" required autocomplete="current-password">
              <button type="button" class="toggle-password" onclick="window.togglePassword('loginPassword', this)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>
          <button type="submit" class="auth-submit">Masuk</button>
          <div class="auth-message" id="loginMessage"></div>
        </form>

        <form class="auth-form" id="registerForm">
          <div class="auth-field">
            <label>Username</label>
            <input type="text" name="username" required minlength="3" autocomplete="username">
          </div>
          <div class="auth-field">
            <label>Email</label>
            <input type="email" name="email" required autocomplete="email">
          </div>
          <div class="auth-field">
            <label>Password (min 6 karakter)</label>
            <div class="password-wrapper">
              <input type="password" name="password" id="registerPassword" required minlength="6" autocomplete="new-password">
              <button type="button" class="toggle-password" onclick="window.togglePassword('registerPassword', this)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>
          <button type="submit" class="auth-submit">Daftar</button>
          <div class="auth-message" id="registerMessage"></div>
        </form>

        <div class="auth-user-info" id="userInfo">
          <div class="auth-avatar" id="userAvatar">?</div>
          <div class="auth-username" id="userName">-</div>
          <div class="auth-email" id="userEmail">-</div>
          <div style="background: rgba(15, 26, 44, 0.6); border: 1px solid #2c3b57; border-radius: 12px; padding: 12px 20px; margin: 15px 0; display: flex; justify-content: space-between; align-items: center; width: 100%; box-sizing: border-box;">
              <span style="color: #8292af; font-size: 13px; font-weight: 600;">Saldo Anda</span>
              <span id="modalUserBalance" style="color: #ffe36a; font-size: 16px; font-weight: 800;">Rp 0</span>
          </div>
          <button class="auth-logout" onclick="window.handleLogout()">Keluar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelectorAll(".auth-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.tab;
        modal.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        modal.querySelectorAll(".auth-form").forEach(f => f.classList.remove("active"));
        modal.querySelector(`#${target}Form`).classList.add("active");
      });
    });

    modal.querySelector("#loginForm").addEventListener("submit", handleLogin);
    modal.querySelector("#registerForm").addEventListener("submit", handleRegister);
  }

  async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector(".auth-submit");
    const msg = document.getElementById("loginMessage");

    msg.textContent = "";
    msg.className = "auth-message";
    btn.disabled = true;
    btn.textContent = "Memuat...";

    try {
      const data = await apiRequest("/login", {
        method: "POST",
        body: JSON.stringify({
          username: form.username.value.trim(),
          password: form.password.value
        })
      });

      setToken(data.token);
      setUser(data.user);
      msg.textContent = "Login berhasil!";
      msg.className = "auth-message success";

      setTimeout(() => {
        window.closeAuthModal();
        updateNavbar();
        if (typeof window.loadProducts === "function") window.loadProducts();
      }, 800);

    } catch (err) {
      msg.textContent = err.message;
      msg.className = "auth-message error";
    } finally {
      btn.disabled = false;
      btn.textContent = "Masuk";
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector(".auth-submit");
    const msg = document.getElementById("registerMessage");

    msg.textContent = "";
    msg.className = "auth-message";
    btn.disabled = true;
    btn.textContent = "Memuat...";

    try {
      const data = await apiRequest("/register", {
        method: "POST",
        body: JSON.stringify({
          username: form.username.value.trim(),
          email: form.email.value.trim(),
          password: form.password.value
        })
      });

      setToken(data.token);
      setUser(data.user);
      msg.textContent = "Pendaftaran berhasil!";
      msg.className = "auth-message success";

      setTimeout(() => {
        window.closeAuthModal();
        updateNavbar();
        if (typeof window.loadProducts === "function") window.loadProducts();
      }, 800);

    } catch (err) {
      msg.textContent = err.message;
      msg.className = "auth-message error";
    } finally {
      btn.disabled = false;
      btn.textContent = "Daftar";
    }
  }

    function handleLogout() {
    clearToken();
    window.closeAuthModal();
    updateNavbar();
    window.location.href = "index.html";
  }

  function updateNavbar() {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;

    if (window.location.pathname.includes("admin.html")) {
      return;
    }

    const existingWrapper = navbar.querySelector(".nav-actions-wrapper");
    if (existingWrapper) existingWrapper.remove();
    
    const existingGroup = navbar.querySelector(".nav-user-group");
    if (existingGroup) existingGroup.remove();
    
    const existingBtn = navbar.querySelector(".nav-auth-btn");
    if (existingBtn) existingBtn.remove();

    const user = getUser();
    const brand = navbar.querySelector(".brand");
    if (!brand) return;

    let targetElement = brand;

    if (user) {
      const userGroup = document.createElement("div");
      userGroup.className = "nav-user-group";

      const btn = document.createElement("button");
      btn.className = "nav-user-btn";
      btn.innerHTML = `
        <span class="nav-user-avatar" style="overflow: hidden; display: flex; align-items: center; justify-content: center;">
          ${user.avatar ? `<img src="${user.avatar.startsWith('/') ? user.avatar : '/' + user.avatar}" style="width: 100%; height: 100%; object-fit: cover;">` : user.username.charAt(0).toUpperCase()}
        </span>
        <span class="user-name-text">${user.username}</span>
      `;
      btn.addEventListener("click", () => {
        window.location.href = "profile.html";
      });
      userGroup.appendChild(btn);

      if (user.role === "admin") {
        const adminBtn = document.createElement("button");
        adminBtn.className = "nav-admin-btn";
        adminBtn.innerHTML = `<span class="admin-icon">⚙️</span>`;
        adminBtn.onclick = () => window.location.href = "admin.html";
        userGroup.appendChild(adminBtn);
      }

      brand.after(userGroup);
      targetElement = userGroup;
    } else {
      const btn = document.createElement("button");
      btn.className = "nav-auth-btn";
      btn.textContent = "Masuk / Daftar";
      btn.addEventListener("click", openAuthModal);
      brand.after(btn);
      targetElement = btn;
    }

    const navActionsWrapper = document.createElement("div");
    navActionsWrapper.className = "nav-actions-wrapper";
    navActionsWrapper.style.display = "flex";
    navActionsWrapper.style.alignItems = "center";
    navActionsWrapper.style.gap = "10px";

    const cartBtn = document.createElement("a");
    cartBtn.href = "javascript:void(0)";
    cartBtn.className = "nav-cart-btn";
    cartBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
      <span id="cartCount" class="cart-badge">0</span>
    `;
    cartBtn.addEventListener("click", () => {
      if (window.openCartModal) window.openCartModal();
    });
    navActionsWrapper.appendChild(cartBtn);

    if (typeof window.updateCartBadge === "function") {
      setTimeout(window.updateCartBadge, 100);
    }

    targetElement.after(navActionsWrapper);

    const mainContent = document.getElementById("mainContent");
    const lockedContent = document.getElementById("lockedContent");

    if (mainContent && lockedContent) {
      if (user) {
        mainContent.classList.remove("hide-catalog");
        lockedContent.style.display = "none";
      } else {
        mainContent.classList.add("hide-catalog");
        lockedContent.style.display = "flex";
      }
    }
  }

  function showUserInfo() {
    const user = getUser();
    if (!user) return;

    const modal = document.getElementById("authModal");
    if (!modal) return;

    modal.querySelector(".auth-tabs").style.display = "none";
    modal.querySelectorAll(".auth-form").forEach(f => f.classList.remove("active"));
    modal.querySelector(".auth-title").textContent = "Profil Anda";
    modal.querySelector(".auth-subtitle").textContent = "Kelola akun Naell Store";

    const info = modal.querySelector("#userInfo");
    info.classList.add("show");
    info.querySelector("#userAvatar").textContent = user.username.charAt(0).toUpperCase();
    info.querySelector("#userName").textContent = user.username;
    info.querySelector("#userEmail").textContent = user.email;
    
    const balanceEl = info.querySelector("#modalUserBalance");
    if (balanceEl) {
      const saldoSaatIni = user.saldo || 0; 
      balanceEl.textContent = "Rp " + saldoSaatIni.toLocaleString('id-ID');
    }
  }

  function openAuthModal() {
    const modal = document.getElementById("authModal");
    if (!modal) return;

    const user = getUser();
    if (user) {
      showUserInfo();
    } else {
      modal.querySelector(".auth-tabs").style.display = "flex";
      modal.querySelector(".auth-title").textContent = "Selamat Datang di Naell Store";
      modal.querySelector(".auth-subtitle").textContent = "Masuk atau daftar untuk melanjutkan";
      modal.querySelector("#userInfo").classList.remove("show");
      modal.querySelectorAll(".auth-form").forEach(f => f.classList.remove("active"));
      modal.querySelector("#loginForm").classList.add("active");
      modal.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
      modal.querySelector('.auth-tab[data-tab="login"]').classList.add("active");
    }

    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeAuthModal() {
    const modal = document.getElementById("authModal");
    if (!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const isPassword = input.getAttribute("type") === "password";
    
    input.setAttribute("type", isPassword ? "text" : "password");
    
    if (isPassword) {
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      `;
      btn.style.color = "#80b5ff";
    } else {
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      `;
      btn.style.color = "#8292af";
    }
  }

  window.openAuthModal = openAuthModal;
  window.closeAuthModal = closeAuthModal;
  window.handleLogout = handleLogout;
  window.getAuthUser = getUser;
  window.getAuthToken = getToken;
  window.togglePassword = togglePassword;

  document.addEventListener("DOMContentLoaded", () => {
    createAuthModal();
    updateNavbar();
  });

})();