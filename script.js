document.addEventListener("DOMContentLoaded", () => {

  const whatsappNumber = "6288291488858";
  let allProducts = [];
  let allCategories = [];
  let activeProductForCheckout = null;
  let cart = JSON.parse(localStorage.getItem("naell_cart")) || [];
  let allLoginLogs = [];
  let chatInterval = null;
  let currentChatUserId = null;
  let currentEditingNoteId = null;

  window.loadNotes = async function() {
    const container = document.getElementById("notesListContainer");
    if (!container) return;

    try {
      const token = localStorage.getItem("naell_token");
      const res = await fetch(`https://naell.web.id/api/notes`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();

      container.innerHTML = "";
      if (!data.notes || data.notes.length === 0) {
        container.innerHTML = '<p style="color: #8292af; text-align: center;">Belum ada catatan.</p>';
        return;
      }

      data.notes.forEach(note => {
        const div = document.createElement("div");
        div.style.cssText = "background: #0f1a2c; border: 1px solid #2c3b57; border-radius: 10px; overflow: hidden;";

        const header = document.createElement("div");
        header.style.cssText = "padding: 15px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none; transition: background 0.2s;";
        header.onmouseover = () => header.style.background = "rgba(255,255,255,0.03)";
        header.onmouseout = () => header.style.background = "transparent";
        
        header.innerHTML = `
          <div style="flex: 1; padding-right: 10px;">
            <h4 style="color: #ffe36a; margin: 0; font-size: 15px; word-break: break-word;">${note.title}</h4>
            <span style="font-size: 10px; color: ${note.is_public ? '#34d399' : '#8292af'};">
              ${note.is_public ? '🌍 Publik' : '🔒 Pribadi'}
            </span>
          </div>
          <span class="note-toggle-icon" style="color: #8292af; font-size: 20px; line-height: 1;">+</span>
        `;

        const body = document.createElement("div");
        body.style.cssText = "max-height: 0; overflow: hidden; transition: max-height 0.3s ease; background: rgba(8, 13, 24, 0.4);";
        
        const bodyContent = document.createElement("div");
        bodyContent.style.cssText = "padding: 0 15px 15px 15px;";
        bodyContent.innerHTML = `
          <div style="color: #c8d4eb; font-size: 13px; white-space: pre-wrap; margin-bottom: 15px; line-height: 1.6;">${note.content}</div>
          <div style="display: flex; gap: 10px;">
            <button onclick="event.stopPropagation(); window.editNote(${note.id}, '${note.title.replace(/'/g, "\\'")}', '${note.content.replace(/'/g, "\\'").replace(/\n/g, "\\n")}')" style="background: rgba(96, 148, 255, 0.15); color: #80b5ff; border: 1px solid rgba(96, 148, 255, 0.3); padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 700;">Edit</button>
            <button onclick="event.stopPropagation(); window.deleteNote(${note.id})" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 700;">Hapus</button>
          </div>
        `;
        body.appendChild(bodyContent);
        div.appendChild(header);
        div.appendChild(body);

        header.addEventListener("click", () => {
          const icon = header.querySelector(".note-toggle-icon");
          if (body.style.maxHeight === "0px" || body.style.maxHeight === "") {
            body.style.maxHeight = body.scrollHeight + "px";
            icon.style.transform = "rotate(180deg)";
          } else {
            body.style.maxHeight = "0px";
            icon.style.transform = "rotate(0deg)";
          }
        });

        container.appendChild(div);
      });
    } catch (err) {
      console.error("Gagal memuat catatan:", err);
    }
  };

  window.saveNote = async function() {
    const title = document.getElementById("note-title").value.trim();
    const content = document.getElementById("note-content").value.trim();
    if (!title || !content) return window.showToast("Judul dan isi wajib diisi!");

    const token = localStorage.getItem("naell_token");
    const url = currentEditingNoteId 
      ? `https://naell.web.id/api/notes/${currentEditingNoteId}` 
      : `https://naell.web.id/api/notes`;
    const method = currentEditingNoteId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ title, content })
      });

      if (res.ok) {
        window.showToast(currentEditingNoteId ? "Catatan diperbarui!" : "Catatan disimpan!", "success");
        document.getElementById("note-title").value = "";
        document.getElementById("note-content").value = "";
        currentEditingNoteId = null;
        window.loadNotes();
      } else {
        const data = await res.json();
        window.showToast(data.error, "error");
      }
    } catch (err) {
      window.showToast("Terjadi kesalahan server.", "error");
    }
  };

  window.editNote = function(id, title, content, isPublic) {
    document.getElementById("note-title").value = title;
    document.getElementById("note-content").value = content;
    document.getElementById("note-is-public").checked = isPublic === 1 || isPublic === true;
    document.getElementById("note-title").focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  
  window.deleteNote = async function(id) {
    if (!confirm("Hapus catatan ini?")) return;

    const token = localStorage.getItem("naell_token");
    try {
      const res = await fetch(`https://naell.web.id/api/notes/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        window.showToast("Catatan dihapus!", "success");
        window.loadNotes();
      }
    } catch (err) {
      window.showToast("Terjadi kesalahan server.", "error");
    }
  };

  window.showDepositForm = function() {
    const form = document.getElementById("depositFormSection");
    if (form) {
      form.style.display = "block";
      window.scrollTo({ top: form.offsetTop - 100, behavior: "smooth" });
    }
  };

  window.calculateBonus = function() {
    const amountInput = document.getElementById("depositAmount");
    const totalInput = document.getElementById("totalBalance");
    if (!amountInput || !totalInput) return;
    const amount = parseFloat(amountInput.value) || 0;
    const bonus = amount * 0.10;
    const total = amount + bonus;
    totalInput.value = total > 0 ? total.toLocaleString('id-ID') : "";
  };

  async function loadLoginLogs() {
    const tableBody = document.getElementById("loginLogsTable");
    if (!tableBody) return;
    try {
      const token = typeof window.getAuthToken === "function" ? window.getAuthToken() : null;
      if (!token) {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #ef4444;">Silakan login terlebih dahulu.</td></tr>';
        return;
      }
      const res = await fetch(`https://naell.web.id/api/users/login-logs`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      allLoginLogs = data.logs || [];
      window.filterLogs();
    } catch (err) {
      console.error("Gagal memuat log:", err);
      tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #ef4444;">Gagal memuat data.</td></tr>';
    }
  }

  window.filterLogs = function() {
    const tableBody = document.getElementById("loginLogsTable");
    const yearFilter = document.getElementById("filterYear").value;
    const searchFilter = document.getElementById("filterSearch").value.toLowerCase();
    if (!tableBody) return;

    const filtered = allLoginLogs.filter(log => {
      const logYear = new Date(log.created_at).getFullYear().toString();
      const matchesYear = yearFilter === "all" || logYear === yearFilter;
      const matchesSearch = (log.ip_address || "").toLowerCase().includes(searchFilter) || 
                            (log.user_agent || "").toLowerCase().includes(searchFilter);
      return matchesYear && matchesSearch;
    });

    document.getElementById("totalLogs").textContent = filtered.length;
    tableBody.innerHTML = "";

    if (filtered.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #8292af;">Data tidak ditemukan.</td></tr>';
      return;
    }

    filtered.forEach(log => {
      const dateObj = new Date(log.created_at);
      const dateStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) + ' ' + 
                      dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const tr = document.createElement("tr");
      tr.style.borderBottom = "1px solid #2c3b57";
      tr.innerHTML = `
        <td style="padding: 15px; font-size: 12px; color: #c8d4eb;">${dateStr}</td>
        <td style="padding: 15px; font-size: 11px; color: #8292af; max-width: 300px; word-break: break-word;">${log.user_agent || '-'}</td>
        <td style="padding: 15px; font-size: 12px; color: #c8d4eb; font-family: monospace;">${log.ip_address || '-'}</td>
      `;
      tableBody.appendChild(tr);
    });
  };

  loadLoginLogs();

  const isAdminPage = window.location.pathname.includes("admin.html");
  const isOrderPage = window.location.pathname.includes("order.html");
  const isHistoryPage = window.location.pathname.includes("riwayat.html");

  window.updateSaldoCheckoutText = function() {
    const saldoEl = document.getElementById("textSaldoCheckout");
    if (!saldoEl) return;
    const rawUser = localStorage.getItem("naell_user");
    const user = rawUser ? JSON.parse(rawUser) : null;
    if (user) {
      saldoEl.textContent = `Saldo (Rp ${(user.saldo || 0).toLocaleString('id-ID')})`;
    } else {
      saldoEl.textContent = "Saldo (Rp 0)";
    }
  };

  window.updateCartBadge = function() {
    const badge = document.getElementById("cartCount");
    if (badge) {
      badge.textContent = cart.length;
      badge.style.display = cart.length > 0 ? "flex" : "none";
    }
  };

  window.addToCart = function(product) {
    const isDuplicate = cart.find(item => item.name === product.name && item.price === product.price);
    if (isDuplicate) return window.showToast("Sudah ada di keranjang!", "error");
    
    cart.push({
      id: product.id || Date.now(), 
      name: product.name,
      price: product.price,
      duration: product.duration || "30 Hari",
      image: product.image
    });
    
    localStorage.setItem("naell_cart", JSON.stringify(cart));
    window.updateCartBadge();
    window.showToast(`${product.name} ditambahkan!`);
  };

  window.openCartModal = function() {
    const container = document.getElementById("cartItemsContainer");
    container.innerHTML = "";
    if (cart.length === 0) {
      container.innerHTML = '<div style="text-align:center; color:#8292af; padding:20px;">Keranjang masih kosong.</div>';
    } else {
      cart.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
          <img src="${item.image}" alt="${item.name}">
          <div class="cart-item-info">
            <h4>${item.name}</h4>
            <span style="display: block; font-size: 10px; color: #8292af; margin-bottom: 4px;">${item.duration}</span>
            <span>Rp${item.price.toLocaleString('id-ID')}</span>
          </div>
          <button class="cart-item-remove" onclick="window.removeFromCart(${index})">Hapus</button>
        `;
        container.appendChild(div);
      });
    }
    document.getElementById("cartModal").classList.add("show");
  };

  window.removeFromCart = function(index) {
    cart.splice(index, 1);
    localStorage.setItem("naell_cart", JSON.stringify(cart));
    updateCartBadge();
    window.openCartModal();
  };

  window.checkoutCart = function() {
    if (cart.length === 0) return window.showToast("Keranjang kosong!");
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const productNames = cart.map(item => item.name).join(", ");
    
    currentOrder.product = `Keranjang (${cart.length} item): ${productNames}`;
    currentOrder.price   = `Rp${total.toLocaleString('id-ID')}`;
    currentOrder.method  = "";
    currentOrder.code    = "NLS-" + Date.now().toString().slice(-6);

    document.getElementById("checkoutProduct").textContent = currentOrder.product;
    document.getElementById("checkoutPrice").textContent   = currentOrder.price;

    document.querySelectorAll('input[name="paymentMethod"]').forEach(input => { input.checked = false; });

    if (checkoutConfirm) checkoutConfirm.hidden = true;
    if (paymentContinue) { paymentContinue.hidden = false; paymentContinue.disabled = true; }
    if (paymentConfirm) paymentConfirm.hidden = true;

    document.getElementById("cartModal").classList.remove("show");
    paymentModal.classList.add("show");
    paymentModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    const storedMethods = JSON.parse(localStorage.getItem("naell_payment_methods")) || ["QRIS", "GoPay", "DANA"];
    const allowedMethods = ["Saldo", ...storedMethods];
    document.querySelectorAll('input[name="paymentMethod"]').forEach(input => {
      const parent = input.closest(".payment-option");
      parent.style.display = allowedMethods.includes(input.value) ? "flex" : "none";
    });
  };

  window.showToast = function(message, type = "success") {
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes("gagal") || lowerMsg.includes("error") || lowerMsg.includes("tidak") || lowerMsg.includes("habis")) {
      type = "error";
    }

    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    let icon = type === "error" ? "❌" : (type === "info" ? "ℹ️" : "✅");
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  updateCartBadge();

  window.openProductDetail = function(groupName) {
    const pGroup = allProducts.filter(p => {
      let name = p.name.split(" ")[0];
      if (p.name.toLowerCase().includes("chatgpt")) name = "ChatGPT";
      if (p.name.toLowerCase().includes("alight")) name = "Alight";
      return name === groupName;
    });
    if (pGroup.length === 0) return;
    
    const firstP = pGroup[0];
    activeProductForCheckout = firstP;

    document.getElementById("pmIcon").innerHTML = `<img src="${firstP.image}" alt="${groupName}">`;
    document.getElementById("pmTitle").textContent = `${groupName} Premium`;
    document.getElementById("pmBadge").textContent = firstP.sub_category || 'PREMIUM';
    document.getElementById("pmDesc").textContent = firstP.description || "Temukan kemudahan akses premium dengan harga terjangkau.";
    
    const pkgContainer = document.getElementById("pmPackages");
    pkgContainer.innerHTML = "";

    pGroup.forEach((p, index) => {
      const card = document.createElement("div");
      card.className = "package-card";
      card.onclick = () => {
        activeProductForCheckout = p;
        document.querySelectorAll(".package-card").forEach(c => c.style.border = "1px solid #2c3b57");
        card.style.border = "1px solid #80b5ff";
      };
      if (index === 0) card.style.border = "1px solid #80b5ff";

      const stockText = p.stock > 0 ? `Sisa Stok: ${p.stock}` : 'Stok Habis';
      const stockColor = p.stock > 0 ? '#34d399' : '#ef4444';
      const now = new Date().getTime();
      
      let flashEnd = 0;
      if (p.flash_sale_end) {
        const dateStr = p.flash_sale_end.toString().replace("T", " ");
        flashEnd = new Date(dateStr).getTime();
        if (isNaN(flashEnd)) flashEnd = 0;
      }
      
      let displayPrice = `Rp${p.price.toLocaleString('id-ID')}`;
      
      if (p.flash_sale_price > 0 && flashEnd > now) {
        displayPrice = `
          <span style="text-decoration: line-through; color: #8292af; font-size: 11px;">Rp${p.price.toLocaleString('id-ID')}</span> 
          <span style="color: #ef4444;">Rp${p.flash_sale_price.toLocaleString('id-ID')}</span>
        `;
      }

      card.innerHTML = `
        <div class="pkg-header">
          <span class="pkg-tag" style="color:${stockColor}; background:transparent; border:1px solid ${stockColor}; padding:2px 8px;">${stockText}</span>
          <span class="pkg-price">${displayPrice}</span>
        </div>
        <div class="pkg-body">
          <img src="${p.image}" alt="${p.name}">
          <div><h4>${p.name}</h4><p>${p.duration || 'Akses Instan'}</p></div>
        </div>
      `;
      pkgContainer.appendChild(card);
    });

    const liveCountEl = document.getElementById("liveCountText");
    if (liveCountEl) liveCountEl.textContent = Math.floor(Math.random() * 8) + 3;

    document.getElementById("productModal").classList.add("show");
  };

  window.buyProductFromDetail = function(p) {
    if (!paymentModal) return;
    window.updateSaldoCheckoutText();
    currentOrder.product = p.name;
    const now = new Date().getTime();
    
    let flashEnd = 0;
    if (p.flash_sale_end) {
      const dateStr = p.flash_sale_end.toString().replace("T", " ");
      flashEnd = new Date(dateStr).getTime();
      if (isNaN(flashEnd)) flashEnd = 0;
    }
    
    let finalPrice = p.price;
    if (p.flash_sale_price > 0 && flashEnd > now) finalPrice = p.flash_sale_price;
    currentOrder.price = `Rp${finalPrice.toLocaleString('id-ID')}`;
    currentOrder.method = "";
    currentOrder.code = "NLS-" + Date.now().toString().slice(-6);

    document.getElementById("checkoutProduct").textContent = currentOrder.product;
    document.getElementById("checkoutPrice").textContent = currentOrder.price;
    document.querySelectorAll('input[name="paymentMethod"]').forEach(input => { input.checked = false; });

    if (checkoutConfirm) checkoutConfirm.hidden = true;
    if (paymentContinue) { paymentContinue.hidden = false; paymentContinue.disabled = true; }
    if (paymentConfirm) paymentConfirm.hidden = true;

    paymentModal.classList.add("show");
    paymentModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    const storedMethods = JSON.parse(localStorage.getItem("naell_payment_methods")) || ["QRIS", "GoPay", "DANA"];
    const allowedMethods = ["Saldo", ...storedMethods];
    document.querySelectorAll('input[name="paymentMethod"]').forEach(input => {
      const parent = input.closest(".payment-option");
      parent.style.display = allowedMethods.includes(input.value) ? "flex" : "none";
    });
  };
    
  window.proceedToBuy = function() {
    document.getElementById("productModal").classList.remove("show");
    window.buyProductFromDetail(activeProductForCheckout);
  };

  window.addCurrentProductToCart = function() {
    if (activeProductForCheckout) window.addToCart(activeProductForCheckout);
  };

  window.shareProduct = function() {
    const productName = document.getElementById("pmTitle").textContent;
    const shareUrl = window.location.origin + "/?product=" + encodeURIComponent(productName);
    if (navigator.share) {
      navigator.share({ title: productName + ' - Naell Store', text: 'Cek produk premium ini di Naell Store!', url: shareUrl }).catch(err => console.log("Gagal membagikan:", err));
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        window.showToast("Link produk berhasil disalin!\n\n" + shareUrl);
      }).catch(() => {
        window.showToast("Gagal menyalin link. Silakan salin manual:\n" + shareUrl);
      });
    }
  };

  function updateClock() {
    const now = new Date();
    const timeEl = document.getElementById("clockTime");
    const dateEl = document.getElementById("clockDate");
    if (timeEl) timeEl.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    if (dateEl) {
      const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
      dateEl.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    }
  }
  updateClock();
  setInterval(updateClock, 1000);

  async function enterStore() {
    const welcome = document.getElementById("welcomePage");
    if (welcome) {
      sessionStorage.setItem("naell_welcome_passed", "true");
      welcome.classList.add("leaving");
      setTimeout(() => {
        document.body.classList.remove("welcome-screen");
        welcome.remove();
        window.scrollTo(0, 0);
        showNewsPopup(); 
        if (typeof window.updateNavbar === "function") window.updateNavbar();
      }, 500);
    }
  }

  window.saveAccountSettings = async function() {
    const user = typeof window.getAuthUser === "function" ? window.getAuthUser() : null;
    if (!user) return window.showToast("Silakan login terlebih dahulu.");
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;

    if (newPassword || currentPassword) {
      if (!currentPassword) return window.showToast("Kata sandi saat ini wajib diisi!");
      if (!newPassword) return window.showToast("Kata sandi baru tidak boleh kosong!");
      if (newPassword.length < 6) return window.showToast("Kata sandi baru minimal 6 karakter!");

      try {
        const res = await fetch(`https://naell.web.id/api/users/change-password`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${window.getAuthToken()}` },
          body: JSON.stringify({ currentPassword, newPassword })
        });
        const data = await res.json();
        if (res.ok) {
          window.showToast("Kata sandi berhasil diubah! Silakan login kembali.");
          if (typeof window.handleLogout === "function") window.handleLogout();
          setTimeout(() => window.location.href = "index.html", 1000);
        } else {
          window.showToast("Gagal: " + data.error);
        }
      } catch (err) {
        window.showToast("Error Jaringan: " + err.message);
      }
    } else {
      window.showToast("Tidak ada perubahan yang disimpan.");
    }
  };

  async function showNewsPopup() {
    try {
      const res = await fetch(`https://naell.web.id/api/news`);
      const data = await res.json();
      if (data.news && data.news.length > 0) {
        const modal = document.getElementById("newsModal");
        const container = document.getElementById("newsListContainer");
        container.innerHTML = "";
        const user = typeof window.getAuthUser === "function" ? window.getAuthUser() : null;
        const isAdmin = user && user.role === "admin";

        data.news.forEach(news => {
          const dateObj = new Date(news.created_at);
          const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
          const tgl = `${dateObj.getDate()} ${bulan[dateObj.getMonth()]} ${dateObj.getFullYear()} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
          const item = document.createElement("div");
          item.className = "news-item";
          item.innerHTML = `
            <div class="news-item-header">
              <span class="news-badge">Pengumuman</span>
              <span class="news-date">${tgl}</span>
              ${isAdmin ? `<button class="btn-delete-news" onclick="window.deleteNews(${news.id})">Hapus</button>` : ''}
            </div>
            <h3 class="news-title">${news.title}</h3>
            <div class="news-content">${news.content}</div>
          `;
          container.appendChild(item);
        });
        modal.classList.add("show");
      }
    } catch (err) { console.log("Gagal memuat berita:", err); }
  }

  const isWelcomePassed = sessionStorage.getItem("naell_welcome_passed");
  if (!isAdminPage && !isOrderPage && !isHistoryPage) {
    if (!isWelcomePassed) {
      document.body.classList.add("welcome-screen");
    } else {
      const welcome = document.getElementById("welcomePage");
      if (welcome) welcome.remove();
      document.body.classList.remove("welcome-screen");
    }
  }

  let currentOrder = { product: "", price: "", method: "", code: "" };
  const paymentModal    = document.getElementById("paymentModal");
  const paymentContinue = document.getElementById("paymentContinue");
  const paymentConfirm  = document.getElementById("paymentConfirm");
  const checkoutConfirm = document.getElementById("checkoutConfirm");
  const successModal    = document.getElementById("successModal");

  document.querySelectorAll('input[name="paymentMethod"]').forEach(input => {
    input.addEventListener("change", () => {
      currentOrder.method = input.value;
      if (paymentContinue) paymentContinue.disabled = false;
    });
  });

  function continueCheckout() {
    if (!currentOrder.method) return;
    document.getElementById("confirmProduct").textContent = `${currentOrder.product} (${currentOrder.price})`;
    document.getElementById("confirmMethod").textContent = currentOrder.method;
    if (checkoutConfirm) checkoutConfirm.hidden = false;
    if (paymentContinue) paymentContinue.hidden = true;
    if (paymentConfirm) paymentConfirm.hidden = false;
  }

  async function confirmCheckout() {
    const method = currentOrder.method;
    const amount = parseInt(currentOrder.price.replace(/[^0-9]/g, ''));

    if (method === "Saldo") {
      const customModal = document.getElementById("customConfirmModal");
      const amountEl = document.getElementById("customConfirmAmount");
      const confirmBtn = document.getElementById("customConfirmBtn");
      if (!customModal) return window.showToast("Sistem error: Modal konfirmasi tidak ditemukan.");

      if (amountEl) amountEl.textContent = `Rp ${amount.toLocaleString('id-ID')}`;
      customModal.style.display = "flex";

      confirmBtn.onclick = async () => {
        customModal.style.display = "none";
        try {
          const token = localStorage.getItem("naell_token");
          const res = await fetch(`https://naell.web.id/api/users/pay-with-saldo`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ amount, product: currentOrder.product, order_code: currentOrder.code })
          });
          const data = await res.json();

          if (res.ok) {
            const rawUser = localStorage.getItem("naell_user");
            if (rawUser) {
              let user = JSON.parse(rawUser);
              user.saldo = data.total_saldo;
              localStorage.setItem("naell_user", JSON.stringify(user));
            }
            cart = [];
            localStorage.setItem("naell_cart", JSON.stringify(cart));
            if (typeof window.updateCartBadge === "function") window.updateCartBadge();

            const accBox = document.getElementById("successAccountBox");
            const accData = document.getElementById("successAccountData");
            if (accBox && accData && data.account_data) {
              accBox.style.display = "block";
              accData.textContent = data.account_data;
            } else if (accBox) {
              accBox.style.display = "none";
            }

            closePaymentModal();
            if (successModal) {
              const codeEl = document.getElementById("successOrderCode");
              if (codeEl) codeEl.textContent = currentOrder.code;
              successModal.style.display = "flex";
              successModal.classList.add("show");
              document.body.classList.add("modal-open");
            }
          } else {
            if (data.error === "Saldo tidak mencukupi.") {
              document.getElementById("insufficientSaldoModal").style.display = "flex";
            } else {
              window.showToast(data.error, "error");
            }
          }
        } catch (err) {
          window.showToast("Terjadi kesalahan: " + err.message);
        }
      };
    } else {
      const message = [
        `Halo, saya ingin pesan (Kode: ${currentOrder.code}):`,
        `Produk: ${currentOrder.product}`,
        `Harga: ${currentOrder.price}`,
        `Metode pembayaran: ${currentOrder.method}`,
        "Mohon kirimkan instruksi pembayaran."
      ].join("\n");
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank");

      const token = localStorage.getItem("naell_token");
      if (token) {
        fetch(`https://naell.web.id/api/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ order_code: currentOrder.code, product: currentOrder.product, price: currentOrder.price, method: currentOrder.method })
        }).catch(err => console.warn("Gagal simpan order:", err));
      }
      cart = [];
      localStorage.setItem("naell_cart", JSON.stringify(cart));
      if (typeof window.updateCartBadge === "function") window.updateCartBadge();

      closePaymentModal();
      if (successModal) {
        const codeEl = document.getElementById("successOrderCode");
        if (codeEl) codeEl.textContent = currentOrder.code;
        successModal.classList.add("show");
        document.body.classList.add("modal-open");
      }
    }
  }

  function closePaymentModal() {
    if (!paymentModal) return;
    paymentModal.classList.remove("show");
    paymentModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function closeSuccessModal() {
    if (!successModal) return;
    successModal.classList.remove("show");
    successModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      const paymentModalEl = document.getElementById("paymentModal");
      if (paymentModalEl && paymentModalEl.classList.contains("show")) closePaymentModal();
    }
  });

  window.trackOrderByCode = async function(code) {
    try {
      const res = await fetch(`https://naell.web.id/api/orders/track/${code}`);
      const data = await res.json();
      if (!res.ok) return window.showToast("Pesanan tidak ditemukan. Pastikan kode benar.");
      const modal = document.getElementById("trackResult");
      document.getElementById("trackProduct").textContent = data.order.product;
      document.getElementById("trackCode").textContent = data.order.order_code;
      const statusEl = document.getElementById("trackStatus");
      statusEl.textContent = data.order.status;
      statusEl.className = data.order.status === "Success" ? "success" : "";
      statusEl.style.color = data.order.status === "Success" ? "#4ade80" : "#fbbf24";
      if (modal) modal.style.display = "flex";
    } catch (err) {
      window.showToast("Pesanan tidak ditemukan atau terjadi kesalahan jaringan.");
    }
  };

  window.closeTrackResult = function() {
    const modal = document.getElementById("trackResult");
    if (modal) modal.style.display = "none";
    const trackInput = document.getElementById("trackInput");
    if (trackInput) trackInput.value = "";
  };

  async function loadCategories() {
    try {
      const res = await fetch(`https://naell.web.id/api/categories`);
      const data = await res.json();
      allCategories = data.categories || [];
      if (isAdminPage) {
        renderAdminCategoryList();
        const dropdown = document.getElementById("p-category");
        if (dropdown) {
          dropdown.innerHTML = "";
          allCategories.forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat.slug;
            opt.textContent = cat.name;
            dropdown.appendChild(opt);
          });
        }
      } else {
        renderCategories(); 
      }
    } catch (err) { console.error("Gagal memuat kategori:", err); }
  }

  function renderCategories() {
    const container = document.getElementById("categoryList");
    if (!container) return;
    container.innerHTML = "";
    const allBtn = document.createElement("button");
    allBtn.className = "category active"; 
    allBtn.dataset.category = "all";
    allBtn.textContent = "Semua Produk";
    allBtn.addEventListener("click", () => {
      document.querySelectorAll(".category").forEach(item => item.classList.remove("active"));
      allBtn.classList.add("active");
      selectedCategory = "all";
      filterItems();
    });
    container.appendChild(allBtn);

    allCategories.forEach(cat => {
      const btn = document.createElement("button");
      btn.className = "category";
      btn.dataset.category = cat.slug;
      btn.textContent = cat.name;
      btn.addEventListener("click", () => {
        document.querySelectorAll(".category").forEach(item => item.classList.remove("active"));
        btn.classList.add("active");
        selectedCategory = cat.slug;
        filterItems();
      });
      container.appendChild(btn);
    });
  }

  async function loadStats() {
    try {
      const res = await fetch(`https://naell.web.id/api/stats`);
      const data = await res.json();
      const statUsers = document.getElementById("statUsers");
      const statOrders = document.getElementById("statOrders");
      const statProducts = document.getElementById("statProducts");
      if (statUsers) statUsers.textContent = data.users.toLocaleString('id-ID');
      if (statOrders) statOrders.textContent = data.orders.toLocaleString('id-ID');
      if (statProducts) statProducts.textContent = data.products.toLocaleString('id-ID');
    } catch (err) { console.log("Gagal memuat statistik:", err); }
  }

  window.confirmDeposit = function() {
    const amount = parseFloat(document.getElementById("depositAmount").value);
    if (!amount || amount < 1000) return window.showToast("Minimal deposit adalah Rp 1.000");
    const totalInput = document.getElementById("totalBalance").value;
    document.getElementById("paymentTotal").textContent = `Rp ${totalInput}`;
    document.getElementById("depositFormSection").style.display = "none";
    const instruction = document.getElementById("paymentInstruction");
    instruction.style.display = "block";
    window.scrollTo({ top: instruction.offsetTop - 100, behavior: "smooth" });
  };

  window.finishDeposit = async function() {
    const amount = parseFloat(document.getElementById("depositAmount").value);
    let user = typeof window.getAuthUser === "function" ? window.getAuthUser() : null;
    if (!user) return window.showToast("Silakan login terlebih dahulu.");
    if (!amount || amount < 1000) return window.showToast("Minimal deposit adalah Rp 1.000");

    const token = typeof window.getAuthToken === "function" ? window.getAuthToken() : null;
    try {
      const res = await fetch(`https://naell.web.id/api/users/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ amount: amount })
      });
      const data = await res.json();
      if (res.ok) {
        window.showToast("Konfirmasi diterima. Menunggu verifikasi Admin.");
        window.location.href = "riwayat-deposit.html";
      } else {
        window.showToast("Gagal: " + data.error);
      }
    } catch (err) { window.showToast("Terjadi kesalahan server."); }
  };

  window.toggleFaq = function(button) {
    const item = button.closest(".faq-item");
    const answer = item.querySelector(".faq-answer");
    if (item.classList.contains("active")) {
      item.classList.remove("active");
      answer.style.maxHeight = null;
    } else {
      document.querySelectorAll(".faq-item.active").forEach(activeItem => {
        activeItem.classList.remove("active");
        activeItem.querySelector(".faq-answer").style.maxHeight = null;
      });
      item.classList.add("active");
      answer.style.maxHeight = answer.scrollHeight + "px";
    }
  };

  window.toggleSidebar = function() {
    const sidebar = document.getElementById("adminSidebar");
    const overlay = document.getElementById("sidebarOverlay");
    if (sidebar && overlay) {
      sidebar.classList.toggle("show");
      overlay.classList.toggle("show");
      if (window.innerWidth > 768) sidebar.classList.toggle("hidden");
    }
  };

  window.showAdminTab = function(tabName) {
    document.querySelectorAll(".admin-tab").forEach(tab => tab.style.display = "none");
    document.querySelectorAll(".sidebar-menu a").forEach(link => link.classList.remove("active"));
    const targetTab = document.getElementById("tab-" + tabName);
    if (targetTab) targetTab.style.display = "block";

    document.querySelectorAll(".sidebar-menu a").forEach(link => {
      if (link.textContent.toLowerCase().includes(tabName === 'products' ? 'produk' : tabName === 'orders' ? 'pesanan' : tabName === 'news' ? 'berita' : tabName === 'reviews' ? 'ulasan' : tabName === 'settings' ? 'pengaturan' : tabName === 'deposits' ? 'deposit' : 'dasbor')) {
        link.classList.add("active");
      }
    });

    const pageTitle = document.getElementById("pageTitle");
    if (pageTitle) {
      const titles = { dashboard: "Dasbor", products: "Produk & Kategori", orders: "Pesanan Masuk", news: "Berita & Broadcast", reviews: "Ulasan Pembeli", settings: "Pengaturan Toko", deposits: "Verifikasi Deposit" };
      pageTitle.textContent = titles[tabName] || "Admin";
    }

    if (tabName === 'deposits' && typeof loadAdminDeposits === 'function') loadAdminDeposits();
    if (tabName === 'products' && typeof window.loadProductStockInfo === 'function') window.loadProductStockInfo();
    if (tabName === 'dashboard') {
      if (typeof window.loadProductStockInfo === 'function') setTimeout(window.loadProductStockInfo, 500);
      if (typeof window.loadChatMessages === 'function') setTimeout(window.loadChatMessages, 1000);
    }
    if (tabName === 'notes' && typeof window.loadNotes === 'function') window.loadNotes();

    if (window.innerWidth <= 768) {
      window.toggleSidebar();
    }
  };

  async function loadProducts() {
    try {
      const res = await fetch(`https://naell.web.id/api/products`);
      const data = await res.json();
      allProducts = data.products || [];
      const accDropdown = document.getElementById("acc-product-id");
      if (accDropdown) {
        accDropdown.innerHTML = "";
        allProducts.forEach(p => {
          const opt = document.createElement("option");
          opt.value = p.id;
          opt.textContent = p.name;
          accDropdown.appendChild(opt);
        });
      }
      if (document.getElementById("itemGrid")) renderProducts(allProducts);
      if (isAdminPage) renderAdminProductList(); else renderProducts(allProducts);
    } catch (err) { console.error("Gagal memuat produk:", err); }
  }
  
  function renderProducts(products) {
    const grid = document.getElementById("itemGrid");
    if (!grid) return;
    grid.innerHTML = "";
    const grouped = {};
    products.forEach(p => {
      let groupName = p.name.split(" ")[0];
      if (p.name.toLowerCase().includes("chatgpt")) groupName = "ChatGPT";
      if (p.name.toLowerCase().includes("alight")) groupName = "Alight";
      if (!grouped[groupName]) grouped[groupName] = [];
      grouped[groupName].push(p);
    });

    Object.keys(grouped).forEach(key => {
      const groupProducts = grouped[key];
      const firstProduct = groupProducts[0];
      const article = document.createElement("article");
      article.className = "item-card";
      article.dataset.category = firstProduct.category;
      article.dataset.name = (firstProduct.data_name || firstProduct.name).toLowerCase();
      article.onclick = () => window.openProductDetail(firstProduct.name.split(" ")[0]);

      let labelHtml = "";
      const subCat = (firstProduct.sub_category || "").toUpperCase();
      const isBundling = firstProduct.name.toLowerCase().includes("paket") || firstProduct.name.toLowerCase().includes("bundling");
      if (isBundling) labelHtml = `<span class="badge-label" style="background: linear-gradient(135deg, #a78bfa, #7c3aed); color: white; border: none;">PAKET HEMAT</span>`;
      else if (subCat.includes("OFF") || subCat.includes("%")) labelHtml = `<span class="badge-label badge-diskon">${subCat}</span>`;
      else if (subCat === "HOT") labelHtml = `<span class="badge-label badge-hot">HOT</span>`;
      else if (subCat === "AUTO") labelHtml = `<span class="badge-label badge-auto">AUTO</span>`;

      let priceHtml = `<span style="color: #ffe36a; font-weight: 800; font-size: 14px;">Rp${firstProduct.price.toLocaleString('id-ID')}</span>`;
      let timerHtml = "";
      const now = new Date().getTime();
      let flashEnd = 0;
      if (firstProduct.flash_sale_end) {
        let dateStr = firstProduct.flash_sale_end.toString().replace("T", " ");
        flashEnd = new Date(dateStr).getTime();
        if (isNaN(flashEnd)) flashEnd = 0;
      }

      if (firstProduct.flash_sale_price > 0 && flashEnd > now) {
        priceHtml = `
          <span style="color: #8292af; text-decoration: line-through; font-size: 11px; margin-right: 5px;">Rp${firstProduct.price.toLocaleString('id-ID')}</span>
          <span style="color: #ef4444; font-weight: 800; font-size: 14px;">Rp${firstProduct.flash_sale_price.toLocaleString('id-ID')}</span>
        `;
        const timeLeft = flashEnd - now;
        const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
        const seconds = Math.floor((timeLeft / 1000) % 60);
        timerHtml = `
          <div class="flash-sale-timer" data-flash-end="${flashEnd}" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; padding: 4px 8px; margin-bottom: 10px; display: inline-block;">
            <span style="color: #ef4444; font-size: 10px; font-weight: 800;">⚡ FLASH SALE: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}</span>
          </div>
        `;
      } else if (firstProduct.original_price && firstProduct.original_price > firstProduct.price) {
        priceHtml = `
          <span style="color: #8292af; text-decoration: line-through; font-size: 11px; margin-right: 5px;">Rp${firstProduct.original_price.toLocaleString('id-ID')}</span>
          <span style="color: #ffe36a; font-weight: 800; font-size: 14px;">Rp${firstProduct.price.toLocaleString('id-ID')}</span>
        `;
      }

      article.innerHTML = `
        ${labelHtml}
        <div class="thumbnail"><img src="${firstProduct.image}" alt="${firstProduct.name}"></div>
        <div class="card-content">
          <h3>${firstProduct.name.split(" ")[0]} Premium</h3>
          ${timerHtml}
          <div style="margin-bottom: 10px;">${priceHtml}</div>
          <button class="card-button">Lihat Paket</button>
        </div>
      `;
      grid.appendChild(article);
    });
    filterItems();
  }

  function renderAdminProductList() {
    const listContainer = document.getElementById("adminProductList");
    if (!listContainer) return;
    listContainer.innerHTML = "";
    if (allProducts.length === 0) {
      listContainer.innerHTML = '<div style="padding: 15px; color: #8292af; font-size: 13px; text-align: center;">Belum ada produk.</div>';
      return;
    }
    allProducts.forEach(p => {
      const div = document.createElement("div");
      div.className = "admin-product-item";
      div.innerHTML = `
        <div style="flex: 1; min-width: 0;">
          <span class="admin-product-name" style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.name}</span>
          <span style="font-size: 11px; color: #8292af;">Stok: ${p.stock}</span>
        </div>
        <div style="display: flex; gap: 5px;">
          <button onclick="window.openEditProduct(${p.id})" style="background: rgba(96, 148, 255, 0.15); color: #80b5ff; border: 1px solid rgba(96, 148, 255, 0.3); padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 700;">Edit</button>
          <button class="admin-btn-delete" onclick="window.deleteProduct(${p.id})">Hapus</button>
        </div>
      `;
      listContainer.appendChild(div);
    });
  }

  window.openEditProduct = function(id) {
    const p = allProducts.find(prod => prod.id === id);
    if (!p) return;
    document.getElementById("edit-id").value = p.id;
    document.getElementById("edit-name").value = p.name;
    document.getElementById("edit-price").value = p.price;
    document.getElementById("edit-original-price").value = p.original_price || "";
    document.getElementById("edit-stock").value = p.stock;
    document.getElementById("edit-subcategory").value = p.sub_category || "";
    document.getElementById("edit-description").value = p.description || "";
    document.getElementById("edit-flash-price").value = p.flash_sale_price || "";
    document.getElementById("edit-flash-end").value = p.flash_sale_end || "";
    document.getElementById("edit-image").value = "";
    document.getElementById("editFileName").textContent = "Pilih Gambar Baru (Opsional)";
    document.getElementById("editFileName").style.color = "#8292af";
    const preview = document.getElementById("editImagePreview");
    if (p.image) {
      preview.src = p.image;
      preview.style.display = "block";
    } else {
      preview.style.display = "none";
    }
    document.getElementById("editProductModal").style.display = "flex";
  };

  window.saveEditProduct = async function() {
    const id = document.getElementById("edit-id").value;
    const name = document.getElementById("edit-name").value;
    const price = document.getElementById("edit-price").value;
    const original_price = document.getElementById("edit-original-price").value;
    const stock = document.getElementById("edit-stock").value;
    const sub_category = document.getElementById("edit-subcategory").value;
    const description = document.getElementById("edit-description").value;
    const flash_sale_price = document.getElementById("edit-flash-price").value;
    const flash_sale_end = document.getElementById("edit-flash-end").value;
    const imageFile = document.getElementById("edit-image").files[0];
    if (!name || !price) return window.showToast("Nama dan Harga Jual wajib diisi!");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", parseInt(price));
    formData.append("original_price", parseInt(original_price) || 0);
    formData.append("stock", parseInt(stock) || 0);
    formData.append("sub_category", sub_category);
    formData.append("description", description);
    formData.append("flash_sale_price", parseInt(flash_sale_price) || 0);
    formData.append("flash_sale_end", flash_sale_end || "");
    if (imageFile) formData.append("image", imageFile);

    try {
      const res = await fetch(`https://naell.web.id/api/products/${id}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${window.getAuthToken()}` },
        body: formData
      });
      if (res.ok) {
        window.showToast("Produk berhasil diperbarui!", "success");
        document.getElementById("editProductModal").style.display = "none";
        loadProducts();
      } else {
        const errData = await res.json();
        window.showToast("Gagal memperbarui: " + errData.error, "error");
      }
    } catch (err) { window.showToast("Terjadi kesalahan server."); }
  };

  function renderAdminCategoryList() {
    const listContainer = document.getElementById("adminCategoryList");
    if (!listContainer) return;
    listContainer.innerHTML = "";
    if (allCategories.length === 0) {
      listContainer.innerHTML = '<div style="padding: 15px; color: #8292af; font-size: 13px; text-align: center;">Belum ada kategori.</div>';
      return;
    }
    allCategories.forEach(c => {
      const div = document.createElement("div");
      div.className = "admin-product-item";
      div.innerHTML = `
        <span class="admin-product-name">${c.name} (${c.slug})</span>
        <button class="admin-btn-delete" onclick="window.deleteCategory(${c.id})">Hapus</button>
      `;
      listContainer.appendChild(div);
    });
  }

  async function loadReviews() {
    try {
      const res = await fetch(`https://naell.web.id/api/reviews`);
      const data = await res.json();
      if (isAdminPage) renderAdminReviewList(data.reviews || []); else renderUserReviews(data.reviews || []);
    } catch (err) { console.log("Gagal memuat ulasan:", err); }
  }

  function renderUserReviews(reviews) {
    const section = document.getElementById("reviewsSection");
    const grid = document.getElementById("reviewsGrid");
    const formContainer = document.getElementById("reviewFormContainer");
    if (!section || !grid) return;

    section.style.display = "block";
    const user = typeof window.getAuthUser === "function" ? window.getAuthUser() : null;
    if (user) {
      formContainer.style.display = "block";
      initStarRating();
    }
    grid.innerHTML = "";
    if (reviews.length === 0) {
      grid.innerHTML = '<p style="color: #8292af; grid-column: 1/-1; text-align: center;">Belum ada ulasan.</p>';
      return;
    }
    reviews.forEach(r => {
      const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
      const div = document.createElement("div");
      div.className = "review-card";
      div.innerHTML = `
        <div class="review-stars">${stars}</div>
        <p class="review-text">"${r.comment}"</p>
        <div class="review-author">
          <span class="review-author-avatar">${r.username.charAt(0).toUpperCase()}</span>
          ${r.username}
        </div>
      `;
      grid.appendChild(div);
    });
  }

  function initStarRating() {
    const stars = document.querySelectorAll("#ratingStars span");
    let selectedRating = 0;
    stars.forEach(star => star.replaceWith(star.cloneNode(true)));
    const newStars = document.querySelectorAll("#ratingStars span");
    newStars.forEach(star => {
      star.addEventListener("click", function() {
        selectedRating = parseInt(this.dataset.val);
        newStars.forEach(s => s.classList.toggle("active", parseInt(s.dataset.val) <= selectedRating));
      });
    });
    window.getSelectedRating = () => selectedRating;
  }

  window.submitReview = async function() {
    const rating = window.getSelectedRating();
    const commentEl = document.getElementById("reviewComment");
    const comment = commentEl ? commentEl.value.trim() : "";
    if (!rating) return window.showToast("Silakan klik bintang untuk memberi rating!", "error");
    if (!comment) return window.showToast("Silakan isi komentar ulasan Anda!", "error");

    try {
      const token = typeof window.getAuthToken === "function" ? window.getAuthToken() : null;
      const res = await fetch(`https://naell.web.id/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": token ? `Bearer ${token}` : "" },
        body: JSON.stringify({ rating, comment })
      });
      if (res.ok) {
        window.showToast("Terima kasih atas ulasan Anda!", "success");
        commentEl.value = "";
        document.querySelectorAll("#ratingStars span").forEach(s => s.classList.remove("active"));
        window.getSelectedRating = () => 0;
        document.getElementById("reviewFormContainer").style.display = "none";
        loadReviews();
      } else {
        const errData = await res.json();
        window.showToast(errData.error, "error");
      }
    } catch (err) { window.showToast("Terjadi kesalahan server.", "error"); }
  };

  function renderAdminReviewList(reviews) {
    const listContainer = document.getElementById("adminReviewList");
    if (!listContainer) return;
    listContainer.innerHTML = "";
    if (reviews.length === 0) {
      listContainer.innerHTML = '<div style="padding: 15px; color: #8292af; font-size: 13px; text-align: center;">Belum ada ulasan.</div>';
      return;
    }
    reviews.forEach(r => {
      const div = document.createElement("div");
      div.className = "admin-product-item";
      div.innerHTML = `
        <div style="flex: 1;">
          <strong style="color:#fbbf24">${r.username} (${r.rating} Bintang)</strong>
          <p style="color:#c8d4eb; font-size:12px; margin-top:5px;">"${r.comment}"</p>
        </div>
        <button class="admin-btn-delete" onclick="window.deleteReview(${r.id})">Hapus</button>
      `;
      listContainer.appendChild(div);
    });
  }

  window.deleteReview = async function(id) {
    if (!confirm("Hapus ulasan ini?")) return;
    try {
      const res = await fetch(`https://naell.web.id/api/reviews/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${window.getAuthToken()}` }
      });
      if (res.ok) {
        window.showToast("Ulasan dihapus!", "success");
        loadReviews();
      } else {
        window.showToast("Gagal menghapus ulasan.", "error");
      }
    } catch (err) { window.showToast("Terjadi kesalahan server.", "error"); }
  };

  window.addCategory = async function() {
    const name = document.getElementById("cat-name").value.trim();
    const slug = document.getElementById("cat-slug").value.trim().toLowerCase().replace(/\s+/g, '-');
    if (!name || !slug) return window.showToast("Isi semua form!");
    try {
      const res = await fetch(`https://naell.web.id/api/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${window.getAuthToken()}` },
        body: JSON.stringify({ name, slug })
      });
      if (res.ok) {
        window.showToast("Kategori ditambahkan!");
        document.getElementById("cat-name").value = "";
        document.getElementById("cat-slug").value = "";
        loadCategories();
      } else {
        const errData = await res.json();
        window.showToast("Error Server: " + (errData.error || res.status));
      }
    } catch (err) { window.showToast("Error Jaringan: " + err.message); }
  };

  window.deleteCategory = async function(id) {
    if (!confirm("Hapus kategori ini? Produk dengan kategori ini mungkin tidak akan muncul di filter.")) return;
    try {
      const res = await fetch(`https://naell.web.id/api/categories/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${window.getAuthToken()}` }
      });
      if (res.ok) {
        window.showToast("Kategori dihapus!");
        loadCategories();
      } else {
        window.showToast("Gagal menghapus kategori.");
      }
    } catch (err) { window.showToast("Terjadi kesalahan server."); }
  };

  window.updateFileName = function(input) {
    const label = document.getElementById("fileName");
    if (input.files && input.files.length > 0) {
      label.textContent = input.files[0].name;
      label.style.color = "#80b5ff";
    } else {
      label.textContent = "Pilih Gambar Produk";
      label.style.color = "#8292af";
    }
  };

  window.updateEditFileName = function(input) {
    const label = document.getElementById("editFileName");
    const preview = document.getElementById("editImagePreview");
    if (input.files && input.files.length > 0) {
      label.textContent = input.files[0].name;
      label.style.color = "#80b5ff";
      const reader = new FileReader();
      reader.onload = function(e) {
        preview.src = e.target.result;
        preview.style.display = "block";
      }
      reader.readAsDataURL(input.files[0]);
    } else {
      label.textContent = "Pilih Gambar Baru (Opsional)";
      label.style.color = "#8292af";
      preview.style.display = "none";
    }
  };

  window.addNewProduct = async function() {
    const name = document.getElementById("p-name").value;
    const price = document.getElementById("p-price").value;
    const original_price = document.getElementById("p-original-price").value;
    const imageFile = document.getElementById("p-image").files[0];
    const category = document.getElementById("p-category").value;
    const stock = document.getElementById("p-stock").value;
    const sub_category = document.getElementById("p-subcategory").value;
    const description = document.getElementById("p-description").value;
    const flash_sale_price = document.getElementById("p-flash-price").value;
    const flash_sale_end = document.getElementById("p-flash-end").value;
    if (!name || !price || !imageFile) return window.showToast("Isi semua form dan pilih gambar!");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("category", category);
    formData.append("price", parseInt(price));
    formData.append("original_price", parseInt(original_price) || 0);
    formData.append("duration", "30 Hari");
    formData.append("badge", "Premium");
    formData.append("data_name", name.toLowerCase());
    formData.append("image", imageFile);
    formData.append("sub_category", sub_category);
    formData.append("stock", parseInt(stock) || 0);
    formData.append("description", description);
    formData.append("flash_sale_price", parseInt(flash_sale_price) || 0);
    formData.append("flash_sale_end", flash_sale_end || "");

    try {
      const res = await fetch(`https://naell.web.id/api/products`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${window.getAuthToken()}` },
        body: formData
      });
      if (res.ok) {
        window.showToast("Produk berhasil ditambahkan!");
        document.getElementById("p-name").value = "";
        document.getElementById("p-price").value = "";
        document.getElementById("p-original-price").value = "";
        document.getElementById("p-image").value = "";
        document.getElementById("fileName").textContent = "Pilih Gambar Produk";
        document.getElementById("fileName").style.color = "#8292af";
        loadProducts();
      } else {
        const errData = await res.json();
        window.showToast("Gagal Server: " + (errData.error || res.status));
      }
    } catch (err) { window.showToast("Error Jaringan: " + err.message); }
  };
  
  window.deleteProduct = async function(id) {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;
    try {
      const res = await fetch(`https://naell.web.id/api/products/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${window.getAuthToken()}` }
      });
      if (res.ok) {
        window.showToast("Produk berhasil dihapus!");
        loadProducts();
      } else {
        window.showToast("Gagal menghapus produk.");
      }
    } catch (err) { window.showToast("Terjadi kesalahan server."); }
  };

  window.savePaymentSettings = function() {
    const checkboxes = document.querySelectorAll(".pm-checkbox:checked");
    const selected = Array.from(checkboxes).map(cb => cb.value);
    if (selected.length === 0) return window.showToast("Pilih minimal satu metode!");
    localStorage.setItem("naell_payment_methods", JSON.stringify(selected));
    window.showToast("Pengaturan pembayaran disimpan!");
  };

  window.sendBroadcast = async function() {
    const msg = document.getElementById("broadcastMessage").value.trim();
    if (!msg) return window.showToast("Pesan tidak boleh kosong!");
    try {
      const token = typeof window.getAuthToken === "function" ? window.getAuthToken() : null;
      const res = await fetch(`https://naell.web.id/api/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": token ? `Bearer ${token}` : "" },
        body: JSON.stringify({ message: msg })
      });
      if (res.ok) {
        window.showToast("Broadcast berhasil dikirim!");
        document.getElementById("broadcastMessage").value = "";
      } else {
        const errData = await res.json();
        window.showToast("Gagal server: " + (errData.error || res.status));
      }
    } catch (err) { window.showToast("Error Jaringan/CORS: " + err.message); }
  };

  window.addNews = async function() {
    const titleEl = document.getElementById("newsTitle");
    const contentEl = document.getElementById("newsContent");
    if (!titleEl || !contentEl) return window.showToast("Form berita tidak ditemukan di HTML!");
    const title = titleEl.value.trim();
    const content = contentEl.value.trim();
    if (!title || !content) return window.showToast("Judul dan isi tidak boleh kosong!");
    try {
      const token = typeof window.getAuthToken === "function" ? window.getAuthToken() : null;
      const res = await fetch(`https://naell.web.id/api/news`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": token ? `Bearer ${token}` : "" },
        body: JSON.stringify({ title, content })
      });
      if (res.ok) {
        window.showToast("Berita berhasil dipublikasikan!");
        titleEl.value = "";
        contentEl.value = "";
      } else {
        const errData = await res.json();
        window.showToast("Gagal server: " + (errData.error || res.status));
      }
    } catch (err) { window.showToast("Error Jaringan: " + err.message); }
  };

  window.deleteNews = async function(id) {
    if (!confirm("Hapus berita ini?")) return;
    try {
      const res = await fetch(`https://naell.web.id/api/news/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${window.getAuthToken()}` }
      });
      if (res.ok) {
        window.showToast("Berita dihapus!");
        showNewsPopup(); 
      } else {
        window.showToast("Gagal menghapus berita.");
      }
    } catch (err) { window.showToast("Terjadi kesalahan server."); }
  };

  window.addProductAccounts = async function() {
    const productId = document.getElementById("acc-product-id").value;
    const rawData = document.getElementById("acc-data").value.trim();
    if (!productId || !rawData) return window.showToast("Pilih produk dan isi data akun.");
    const accounts = rawData.split("\n").filter(line => line.trim() !== "");
    try {
      const res = await fetch(`https://naell.web.id/api/admin/product-accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${window.getAuthToken()}` },
        body: JSON.stringify({ product_id: parseInt(productId), accounts })
      });
      const data = await res.json();
      if (res.ok) {
        window.showToast(data.message, "success");
        document.getElementById("acc-data").value = "";
        loadProductStockInfo();
      } else {
        window.showToast(data.error, "error");
      }
    } catch (err) { window.showToast("Terjadi kesalahan server.", "error"); }
  };

  window.loadProductStockInfo = async function() {
    const productId = document.getElementById("acc-product-id")?.value;
    if (!productId) return;
    try {
      const res = await fetch(`https://naell.web.id/api/admin/product-accounts/${productId}`, {
        headers: { "Authorization": `Bearer ${window.getAuthToken()}` }
      });
      const data = await res.json();
      const infoEl = document.getElementById("acc-stock-info");
      if (infoEl) {
        infoEl.innerHTML = `
          <strong style="color:#34d399;">Tersedia: ${data.available.length} akun</strong> | 
          <span style="color:#8292af;">Terjual: ${data.total_sold} akun</span>
        `;
      }
    } catch (err) {}
  };

  document.getElementById("acc-product-id")?.addEventListener("change", window.loadProductStockInfo);

  async function loadUserOrderHistory() {
    const listContainer = document.getElementById("userOrderHistoryList");
    if (!listContainer) return;
    try {
      const token = typeof window.getAuthToken === "function" ? window.getAuthToken() : null;
      if (!token) {
        listContainer.innerHTML = '<div style="text-align: center; color: #ef4444; padding: 20px;">Silakan login terlebih dahulu untuk melihat riwayat pesanan.</div>';
        return;
      }
      const res = await fetch(`https://naell.web.id/api/orders/history`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      listContainer.innerHTML = "";
      if (!data.orders || data.orders.length === 0) {
        listContainer.innerHTML = '<div style="text-align: center; color: #8292af; padding: 20px;">Belum ada riwayat pesanan.</div>';
        return;
      }
      data.orders.forEach(o => {
        const dateObj = new Date(o.created_at);
        const tgl = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        const isSuccess = o.status === "Success";
        const div = document.createElement("div");
        div.className = "admin-product-item";
        div.style.background = "rgba(15, 26, 44, 0.6)";
        div.style.border = "1px solid #2c3b57";
        div.style.borderRadius = "12px";
        div.style.marginBottom = "10px";
        div.style.padding = "15px";
        div.innerHTML = `
          <div style="flex: 1;">
            <span class="admin-product-name" style="font-size: 14px; font-weight: 800; color: white;">${o.product}</span>
            <div style="font-size: 11px; color: #8292af; margin-top: 6px;">
              Kode: <strong>${o.order_code}</strong> • ${tgl}
            </div>
            ${o.account_data ? `<div style="margin-top: 10px; background: rgba(52, 211, 153, 0.1); padding: 10px; border-radius: 6px; border: 1px solid #34d399;"><p style="color: #34d399; font-size: 10px; margin-bottom: 4px;">DETAIL AKUN:</p><pre style="color: white; font-size: 12px; font-family: monospace; white-space: pre-wrap; margin: 0;">${o.account_data}</pre></div>` : ''}
          </div>
          <button class="status-badge ${isSuccess ? 'status-success' : 'status-pending'}" style="cursor:default; border:none; padding: 6px 12px; font-size: 11px;">
            ${o.status}
          </button>
        `;
        listContainer.appendChild(div);
      });
    } catch (err) {
      console.error("Gagal memuat riwayat:", err);
      listContainer.innerHTML = '<div style="text-align: center; color: #ef4444; padding: 20px;">Gagal memuat data dari server.</div>';
    }
  }

  async function loadAdminOrders() {
    if (!isAdminPage) return;
    try {
      const token = typeof window.getAuthToken === "function" ? window.getAuthToken() : null;
      const res = await fetch(`https://naell.web.id/api/orders/all`, {
        headers: { "Authorization": token ? `Bearer ${token}` : "" }
      });
      const data = await res.json();
      const list = document.getElementById("adminOrderList");
      if (!list) return;
      list.innerHTML = "";
      if (!data.orders || data.orders.length === 0) {
        list.innerHTML = '<div style="padding: 15px; color: #8292af; font-size: 13px; text-align: center;">Belum ada pesanan.</div>';
        return;
      }
      data.orders.forEach(o => {
        const div = document.createElement("div");
        div.className = "admin-product-item";
        const isSuccess = o.status === "Success";
        div.innerHTML = `
          <div style="flex: 1;">
            <span class="admin-product-name">${o.product}</span>
            <div style="font-size: 11px; color: #8292af; margin-top: 4px;">${o.order_code} • ${o.username || 'User'}</div>
          </div>
          <button onclick="window.toggleOrderStatus(${o.id}, '${o.status}', '${o.product}')" class="status-badge ${isSuccess ? 'status-success' : 'status-pending'}" style="cursor:pointer; border:none;">
            ${o.status}
          </button>
        `;
        list.appendChild(div);
      });
    } catch (err) { console.log("Gagal memuat pesanan admin:", err); }
  }

  window.toggleOrderStatus = async function(id, currentStatus, productName) {
    const newStatus = currentStatus === "Pending" ? "Success" : "Pending";
    if (newStatus === "Success") {
      const product = allProducts.find(p => p.name === productName);
      if (product && product.stock <= 0) {
        window.showToast("Gagal! Stok produk ini sudah habis. Silakan tambah stok terlebih dahulu.");
        return;
      }
    }
    try {
      const token = typeof window.getAuthToken === "function" ? window.getAuthToken() : null;
      const res = await fetch(`https://naell.web.id/api/orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": token ? `Bearer ${token}` : "" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        loadAdminOrders();
        loadProducts(); 
      } else {
        window.showToast("Gagal update status.");
      }
    } catch (err) { window.showToast("Terjadi kesalahan server."); }
  };

  window.applySort = function(sortValue, btnElement) {
    const pills = document.querySelectorAll(".sort-pill");
    pills.forEach(p => p.classList.remove("active"));
    if (btnElement) btnElement.classList.add("active");
    let sortedProducts = [...allProducts];
    if (sortValue === "termurah") sortedProducts.sort((a, b) => a.price - b.price);
    else if (sortValue === "termahal") sortedProducts.sort((a, b) => b.price - a.price);
    else if (sortValue === "terbaru") sortedProducts.sort((a, b) => b.id - a.id);
    renderProducts(sortedProducts);
  };

  if (isAdminPage) {
    const activeMethods = JSON.parse(localStorage.getItem("naell_payment_methods")) || ["QRIS", "GoPay", "DANA", "Saldo"];
    document.querySelectorAll(".pm-checkbox").forEach(cb => {
      cb.checked = activeMethods.includes(cb.value);
    });
  }

  loadProducts();
  loadCategories();
  loadReviews();
  loadStats();
  loadAdminOrders();
  loadUserOrderHistory();
  if (isAdminPage) {
    setTimeout(window.loadChatMessages, 1000);
    setInterval(window.loadChatMessages, 5000);
  }

  if (isOrderPage) {
    document.body.classList.remove("welcome-screen");
    const mainContent = document.getElementById("mainContent");
    if (mainContent) mainContent.classList.remove("hide-catalog");
  }

  async function checkBroadcast() {
    if (isAdminPage) return;
    try {
      const res = await fetch(`https://naell.web.id/api/broadcast`);
      const data = await res.json();
      if (data.message) {
        const lastRead = localStorage.getItem("naell_last_broadcast");
        if (lastRead !== data.message) {
          const modal = document.getElementById("broadcastModal");
          const text = document.getElementById("broadcastText");
          if (modal && text) {
            text.textContent = data.message;
            setTimeout(() => {
              modal.classList.add("show");
              localStorage.setItem("naell_last_broadcast", data.message);
            }, 1500);
          }
        }
      }
    } catch (err) { console.log("Broadcast error:", err); }
  }
  checkBroadcast();

  window.openAdminChat = function(userId, username) {
    currentChatUserId = userId;
    document.getElementById("adminChatHeader").textContent = "Chat dengan: " + username;
    window.loadChatMessages();
  };

  window.sendAdminChatMessage = async function() {
    const input = document.getElementById("adminChatInput");
    const message = input.value.trim();
    if (!message || !currentChatUserId) return;
    const token = localStorage.getItem("naell_token");
    try {
      const res = await fetch(`https://naell.web.id/api/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ message, target_user_id: currentChatUserId })
      });
      if (res.ok) {
        input.value = "";
        window.loadChatMessages();
      }
    } catch (err) {}
  };

  window.toggleChatWidget = function() {
    const widget = document.getElementById("chatWidget");
    if (!widget) return;
    if (widget.style.display === "none" || widget.style.display === "") {
      widget.style.display = "flex";
      loadChatMessages();
      chatInterval = setInterval(loadChatMessages, 3000);
    } else {
      widget.style.display = "none";
      if (chatInterval) clearInterval(chatInterval);
    }
  };

  window.sendChatMessage = async function() {
    const input = document.getElementById("chatInput");
    if (!input) return;
    
    const message = input.value.trim();
    if (!message) return;

    const token = localStorage.getItem("naell_token");
    if (!token) return window.showToast("Silakan login dulu.", "error");

    try {
      const body = { message };
      if (currentChatUserId) body.target_user_id = currentChatUserId;

      const res = await fetch(`https://naell.web.id/api/chat/send`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        input.value = "";
        await window.loadChatMessages();
      } else {
        const data = await res.json();
        window.showToast(data.error || "Gagal mengirim pesan.", "error");
      }
    } catch (err) {
      window.showToast("Terjadi kesalahan server.", "error");
    }
  };

  async function checkUnreadChat() {
    const token = localStorage.getItem("naell_token");
    if (!token) return;
    try {
      const res = await fetch(`https://naell.web.id/api/chat/unread-count`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      const badge = document.getElementById("chatUnreadBadge");
      if (badge && data.count > 0) {
        badge.style.display = "flex";
        badge.textContent = data.count;
      } else if (badge) {
        badge.style.display = "none";
      }
    } catch (err) {}
  }

  if (window.location.pathname.includes("index.html") || window.location.pathname === "/") {
    setInterval(checkUnreadChat, 10000);
    checkUnreadChat();
  }

  const profilePath = window.location.pathname.includes("profile.html");

  if (profilePath) {
    async function loadProfileData() {
      const token = localStorage.getItem("naell_token");
      if (!token) { window.location.href = "index.html"; return; }
      try {
        const res = await fetch(`https://naell.web.id/api/users/profile-stats`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          document.getElementById("profileUsername").textContent = data.user.username;
          document.getElementById("profileEmail").textContent = data.user.email;
          document.getElementById("inputUsername").value = data.user.username;
          document.getElementById("inputEmail").value = data.user.email;
          document.getElementById("statTotalOrders").textContent = data.stats.total_orders;
          document.getElementById("statTotalSpent").textContent = "Rp " + (data.stats.total_spent || 0).toLocaleString('id-ID');
          document.getElementById("statSaldo").textContent = "Rp " + (data.user.saldo || 0).toLocaleString('id-ID');
          if (data.user.avatar) {
            document.getElementById("avatarInitial").style.display = "none";
            const imgEl = document.getElementById("avatarImage");
            imgEl.src = data.user.avatar.startsWith('/') ? data.user.avatar : '/' + data.user.avatar;
            imgEl.style.display = "block";
            document.getElementById("btnDeleteAvatar").style.display = "flex";
          } else {
            document.getElementById("avatarInitial").style.display = "block";
            document.getElementById("avatarInitial").textContent = data.user.username.charAt(0).toUpperCase();
            document.getElementById("avatarImage").style.display = "none";
            document.getElementById("btnDeleteAvatar").style.display = "none";
          }
        }
      } catch (err) { console.error(err); }
    }

    window.uploadAvatar = async function(input) {
      if (!input.files || !input.files[0]) return;
      const file = input.files[0];
      const formData = new FormData();
      formData.append("avatar", file);
      const token = localStorage.getItem("naell_token");
      try {
        const res = await fetch(`https://naell.web.id/api/users/upload-avatar`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: formData
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem("naell_user", JSON.stringify(data.user));
          const imgEl = document.getElementById("avatarImage");
          const initialEl = document.getElementById("avatarInitial");
          if (data.user.avatar) {
            imgEl.src = data.user.avatar + "?t=" + new Date().getTime();
            imgEl.style.display = "block";
            initialEl.style.display = "none";
            document.getElementById("btnDeleteAvatar").style.display = "flex";
          }
          window.showToast("Foto profil berhasil diubah!", "success");
        } else {
          window.showToast(data.error, "error");
        }
      } catch (err) { window.showToast("Terjadi kesalahan server.", "error"); }
    };

    window.deleteAvatar = async function() {
      if (!confirm("Apakah Anda yakin ingin menghapus foto profil?")) return;
      const token = localStorage.getItem("naell_token");
      try {
        const res = await fetch(`https://naell.web.id/api/users/delete-avatar`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem("naell_user", JSON.stringify(data.user));
          window.showToast("Foto profil berhasil dihapus.", "success");
          document.getElementById("avatarInitial").style.display = "block";
          document.getElementById("avatarInitial").textContent = data.user.username.charAt(0).toUpperCase();
          document.getElementById("avatarImage").style.display = "none";
          document.getElementById("btnDeleteAvatar").style.display = "none";
        } else {
          window.showToast(data.error, "error");
        }
      } catch (err) { window.showToast("Terjadi kesalahan server.", "error"); }
    };

    window.saveProfileData = async function() {
      const token = localStorage.getItem("naell_token");
      const username = document.getElementById("inputUsername").value;
      const email = document.getElementById("inputEmail").value;
      try {
        const res = await fetch(`https://naell.web.id/api/users/update-profile`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ username, email })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem("naell_user", JSON.stringify(data.user));
          window.showToast("Profil berhasil diperbarui!", "success");
          loadProfileData();
        } else {
          window.showToast(data.error, "error");
        }
      } catch (err) { window.showToast("Terjadi kesalahan server.", "error"); }
    };

    loadProfileData();
  }

  window.loadChatMessages = async function() {
    const token = localStorage.getItem("naell_token");
    if (!token) return;

    const isAdmin = window.location.pathname.includes("admin.html");

    try {
      let url = `https://naell.web.id/api/chat/messages`;
      if (currentChatUserId) url += `?user_id=${currentChatUserId}`;

      const res = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
      const data = await res.json();

      if (!res.ok) return;

      if (isAdmin && !currentChatUserId) {
        const list = document.getElementById("adminChatUserList");
        if (!list) return;

        list.innerHTML = "";
        if (data.messages.length === 0) {
          list.innerHTML = '<p style="padding: 15px; color: #8292af; font-size: 12px; text-align: center;">Belum ada pesan.</p>';
          return;
        }

        data.messages.forEach(m => {
          const div = document.createElement("div");
          div.style.cssText = "padding: 10px; border-bottom: 1px solid #2c3b57; cursor: pointer; color: white;";
          div.innerHTML = `<strong style="color: white; font-size: 13px;">${m.username}</strong><p style="color: #8292af; font-size: 11px; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.message}</p>`;
          div.onclick = () => window.openAdminChat(m.user_id, m.username);
          list.appendChild(div);
        });
        return;
      }

      const container = isAdmin ? document.getElementById("adminChatMessages") : document.getElementById("chatMessages");
      if (!container) return;

      container.innerHTML = "";
      if (data.messages.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #8292af; font-size: 12px; margin-top: 20px;">Belum ada pesan.</div>';
        return;
      }

      data.messages.forEach(m => {
        let isMyMessage = false;
        if (isAdmin) {
          isMyMessage = m.role === "admin";
        } else {
          isMyMessage = m.role === "user";
        }

        const bubble = document.createElement("div");
        bubble.style.cssText = `max-width: 80%; padding: 8px 12px; border-radius: 12px; font-size: 12px; line-height: 1.4; margin-bottom: 5px; word-wrap: break-word; ${isMyMessage ? 'align-self: flex-end; background: linear-gradient(135deg, #80b5ff, #6483f5); color: white; border-bottom-right-radius: 2px;' : 'align-self: flex-start; background: #15223a; color: #c8d4eb; border-bottom-left-radius: 2px;'}`;
        bubble.textContent = m.message;
        container.appendChild(bubble);
      });
      container.scrollTop = container.scrollHeight;

    } catch (err) {
      console.error("Chat load error:", err);
    }
  };

  setInterval(() => {
    const timers = document.querySelectorAll(".flash-sale-timer");
    const now = new Date().getTime();
    timers.forEach(timer => {
      const flashEnd = parseInt(timer.getAttribute("data-flash-end"));
      const timeLeft = flashEnd - now;
      if (timeLeft <= 0) {
        timer.innerHTML = `<span style="color: #8292af; font-size: 10px; font-weight: 800;">FLASH SALE BERAKHIR</span>`;
        loadProducts();
      } else {
        const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
        const seconds = Math.floor((timeLeft / 1000) % 60);
        timer.innerHTML = `<span style="color: #ef4444; font-size: 10px; font-weight: 800;">⚡ FLASH SALE: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}</span>`;
      }
    });
  }, 1000);

  window.enterStore         = enterStore;
  window.continueCheckout   = continueCheckout;
  window.confirmCheckout    = confirmCheckout;
  window.closePaymentModal  = closePaymentModal;
  window.closeSuccessModal  = closeSuccessModal;

  if (window.location.pathname.includes("catatan.html")) {
    window.loadNotes = async function() {
      const container = document.getElementById("notesListContainer");
      if (!container) return;

      try {
        const token = localStorage.getItem("naell_token");
        const res = await fetch(`https://naell.web.id/api/notes`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();

        container.innerHTML = "";
        if (!data.notes || data.notes.length === 0) {
          container.innerHTML = '<p style="color: #8292af; text-align: center;">Belum ada catatan.</p>';
          return;
        }

        data.notes.forEach(note => {
          const div = document.createElement("div");
          div.style.cssText = "background: #0f1a2c; border: 1px solid #2c3b57; border-radius: 10px; padding: 15px;";

          const header = document.createElement("div");
          header.style.cssText = "display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none;";
          header.innerHTML = `
            <h4 style="color: #ffe36a; margin: 0; font-size: 15px; flex: 1; padding-right: 10px; word-break: break-word;">${note.title}</h4>
            <span class="note-toggle-icon" style="color: #8292af; font-size: 20px; line-height: 1;">+</span>
          `;

          const body = document.createElement("div");
          body.style.cssText = "max-height: 0; overflow: hidden; transition: max-height 0.3s ease;";
          body.innerHTML = `
            <div style="color: #c8d4eb; font-size: 13px; white-space: pre-wrap; margin-top: 15px; line-height: 1.6; border-top: 1px solid #2c3b57; padding-top: 15px;">${note.content}</div>
            ${note.user_id === JSON.parse(localStorage.getItem("naell_user")).id 
              ? `<div style="display: flex; gap: 10px; margin-top: 15px;">
                  <button onclick="event.stopPropagation(); window.editNote(${note.id}, '${note.title.replace(/'/g, "\\'")}', '${note.content.replace(/'/g, "\\'").replace(/\n/g, "\\n")}', ${note.is_public || 0})" style="background: rgba(96, 148, 255, 0.15); color: #80b5ff; border: 1px solid rgba(96, 148, 255, 0.3); padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 700;">Edit</button>
                  <button onclick="event.stopPropagation(); window.deleteNote(${note.id})" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 700;">Hapus</button>
                </div>` 
              : ''
            }
          `;

          header.addEventListener("click", () => {
            const icon = header.querySelector(".note-toggle-icon");
            if (body.style.maxHeight === "0px" || body.style.maxHeight === "") {
              body.style.maxHeight = body.scrollHeight + "px";
              icon.textContent = "−";
            } else {
              body.style.maxHeight = "0px";
              icon.textContent = "+";
            }
          });

          div.appendChild(header);
          div.appendChild(body);
          container.appendChild(div);
        });
      } catch (err) {
        console.error("Gagal memuat catatan:", err);
      }
    };

    window.saveNote = async function() {
    const title = document.getElementById("note-title").value.trim();
    const content = document.getElementById("note-content").value.trim();
    const isPublic = document.getElementById("note-is-public").checked;
    if (!title || !content) return window.showToast("Judul dan isi wajib diisi!", "error");

    const token = localStorage.getItem("naell_token");
    try {
      const res = await fetch(`https://naell.web.id/api/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ title, content, is_public: isPublic })
      });
        if (res.ok) {
          window.showToast("Catatan disimpan!", "success");
          document.getElementById("note-title").value = "";
          document.getElementById("note-content").value = "";
          window.loadNotes();
        } else {
          window.showToast("Gagal menyimpan catatan.", "error");
        }
      } catch (err) {
        window.showToast("Terjadi kesalahan server.", "error");
      }
    };

    window.editNote = function(id, title, content) {
      document.getElementById("note-title").value = title;
      document.getElementById("note-content").value = content;
      document.getElementById("note-title").focus();
    };

    window.deleteNote = async function(id) {
      if (!confirm("Hapus catatan ini?")) return;
      const token = localStorage.getItem("naell_token");
      try {
        const res = await fetch(`https://naell.web.id/api/notes/${id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          window.showToast("Catatan dihapus!", "success");
          window.loadNotes();
        }
      } catch (err) {
        window.showToast("Terjadi kesalahan server.", "error");
      }
    };

    window.loadNotes();
  }

  if (isAdminPage) {
    setTimeout(() => {
      if (typeof window.loadChatMessages === "function") window.loadChatMessages();
    }, 1000);

    setInterval(() => {
      if (typeof window.loadChatMessages === "function") window.loadChatMessages();
    }, 5000);

    const dashLink = document.querySelector('.sidebar-menu a[onclick*="dashboard"]');
    if (dashLink) {
      dashLink.addEventListener("click", () => {
        setTimeout(() => {
          if (typeof window.loadChatMessages === "function") window.loadChatMessages();
        }, 500);
      });
    }
  }

});
