// == Basic config ==
const API_BASE = "https://tricky-turns-backend.onrender.com/admin"; // Update if needed

// == Elements ==
const sidebar = document.getElementById("sidebar");
const mainContent = document.getElementById("main-content");
const loginSection = document.getElementById("login-section");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("login-error");
const logoutBtn = document.getElementById("logoutBtn");

// All section IDs:
const sections = [
  "modes", "users", "leaderboard", "shop", "contests", "support", "audit"
];

// == Helper: show only one section ==
function showSection(section) {
  sections.forEach((s) => {
    const el = document.getElementById(`${s}-section`);
    if (s === section) el.classList.remove("hidden");
    else el.classList.add("hidden");
  });
}

// == Check if admin is already logged in ==
function checkAuth() {
  fetch(API_BASE + "/me", { credentials: "include" })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(data => {
      sidebar.classList.remove("hidden");
      loginSection.classList.add("hidden");
      showSection("modes"); // Default
    })
    .catch(() => {
      sidebar.classList.add("hidden");
      showSection(null);
      loginSection.classList.remove("hidden");
    });
}

// == Login submit handler ==
loginForm.onsubmit = function (e) {
  e.preventDefault();
  loginError.textContent = "";
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  fetch(API_BASE + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password })
  })
    .then(r => r.ok ? r.json() : r.json().then(err => Promise.reject(err)))
    .then(() => {
      checkAuth();
      loginForm.reset();
    })
    .catch(err => {
      loginError.textContent = err.detail || "Login failed";
    });
};

// == Logout ==
logoutBtn.onclick = function (e) {
  e.preventDefault();
  fetch(API_BASE + "/logout", {
    method: "POST",
    credentials: "include"
  })
    .finally(() => {
      sidebar.classList.add("hidden");
      showSection(null);
      loginSection.classList.remove("hidden");
    });
};

// == Sidebar navigation ==
sidebar.querySelectorAll("nav a[data-section]").forEach(link => {
  link.onclick = function (e) {
    e.preventDefault();
    sidebar.querySelectorAll("nav a").forEach(a => a.classList.remove("active"));
    link.classList.add("active");
    showSection(link.dataset.section);
    // (later: call loadSection(link.dataset.section))
  };
});

// == Initial auth check ==
checkAuth();


// ========== GAME MODES MANAGEMENT ==========

const modesSection = document.getElementById("modes-section");
const modesTbody = document.getElementById("modes-tbody");
const modesError = document.getElementById("modes-error");
const modeAddForm = document.getElementById("mode-add-form");

function loadModes() {
  modesError.textContent = "";
  modesTbody.innerHTML = `<tr><td colspan="5">Loading...</td></tr>`;
  fetch(API_BASE.replace("/admin", "/admin/game_modes"), { credentials: "include" })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(modes => {
      if (!modes.length) {
        modesTbody.innerHTML = `<tr><td colspan="5"><em>No game modes.</em></td></tr>`;
        return;
      }
      modesTbody.innerHTML = "";
      modes.forEach(mode => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><input type="text" value="${mode.name}" data-id="${mode.id}" data-field="name" /></td>
          <td><input type="text" value="${mode.description || ""}" data-id="${mode.id}" data-field="description" /></td>
          <td>
            <input type="checkbox" ${mode.is_active ? "checked" : ""} data-id="${mode.id}" data-field="is_active" />
          </td>
          <td>${new Date(mode.created_at).toLocaleString()}</td>
          <td>
            <button data-id="${mode.id}" class="save-btn">💾</button>
            <button data-id="${mode.id}" class="delete-btn" style="color:#d90429">🗑️</button>
          </td>
        `;
        modesTbody.appendChild(tr);
      });
    })
    .catch(() => {
      modesTbody.innerHTML = "";
      modesError.textContent = "Failed to load modes.";
    });
}

function saveModeField(id, field, value) {
  fetch(`${API_BASE.replace("/admin", "/admin/game_modes/")}${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ [field]: value })
  })
    .then(r => r.ok ? r.json() : r.json().then(err => Promise.reject(err)))
    .then(() => loadModes())
    .catch(() => {
      modesError.textContent = "Failed to update mode.";
    });
}

function deleteMode(id) {
  if (!confirm("Delete this mode?")) return;
  fetch(`${API_BASE.replace("/admin", "/admin/game_modes/")}${id}`, {
    method: "DELETE",
    credentials: "include"
  })
    .then(r => r.ok ? loadModes() : r.json().then(err => Promise.reject(err)))
    .catch(() => {
      modesError.textContent = "Failed to delete mode.";
    });
}

modeAddForm.onsubmit = function(e) {
  e.preventDefault();
  const name = document.getElementById("mode-add-name").value.trim();
  const description = document.getElementById("mode-add-description").value.trim();
  const is_active = document.getElementById("mode-add-active").checked;
  fetch(API_BASE.replace("/admin", "/admin/game_modes"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description, is_active })
  })
    .then(r => r.ok ? r.json() : r.json().then(err => Promise.reject(err)))
    .then(() => {
      modeAddForm.reset();
      document.getElementById("mode-add-active").checked = true;
      loadModes();
    })
    .catch(() => {
      modesError.textContent = "Failed to add mode.";
    });
};

// Inline save/delete handlers
modesTbody.addEventListener("click", function(e) {
  if (e.target.classList.contains("save-btn")) {
    const id = e.target.dataset.id;
    const row = e.target.closest("tr");
    const name = row.querySelector('input[data-field="name"]').value.trim();
    const description = row.querySelector('input[data-field="description"]').value.trim();
    const is_active = row.querySelector('input[data-field="is_active"]').checked;
    fetch(`${API_BASE.replace("/admin", "/admin/game_modes/")}${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, is_active })
    })
      .then(r => r.ok ? r.json() : r.json().then(err => Promise.reject(err)))
      .then(() => loadModes())
      .catch(() => {
        modesError.textContent = "Failed to update mode.";
      });
  }
  if (e.target.classList.contains("delete-btn")) {
    deleteMode(e.target.dataset.id);
  }
});

// Reload when section shown
document.querySelector('a[data-section="modes"]').addEventListener("click", loadModes);


// ========== USER MANAGEMENT ==========

const usersTbody = document.getElementById("users-tbody");
const usersError = document.getElementById("users-error");
const userSearchForm = document.getElementById("user-search-form");
const userSearchInput = document.getElementById("user-search");
const userSearchReset = document.getElementById("user-search-reset");

let lastUsersData = [];

function loadUsers(search = "") {
  usersError.textContent = "";
  usersTbody.innerHTML = `<tr><td colspan="5">Loading...</td></tr>`;
  fetch(API_BASE.replace("/admin", "/admin/users"), { credentials: "include" })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(users => {
      lastUsersData = users;
      let filtered = users;
      if (search) {
        filtered = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));
      }
      if (!filtered.length) {
        usersTbody.innerHTML = `<tr><td colspan="5"><em>No users found.</em></td></tr>`;
        return;
      }
      usersTbody.innerHTML = "";
      filtered.forEach(user => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${user.username}</td>
          <td>${user.created_at ? new Date(user.created_at).toLocaleString() : "-"}</td>
          <td>${user.last_login ? new Date(user.last_login).toLocaleString() : "-"}</td>
          <td style="text-align:center">${user.is_banned ? "✅" : ""}</td>
          <td>
            <button class="ban-btn" data-username="${user.username}" style="color:${user.is_banned ? "#08a000" : "#d90429"}">
              ${user.is_banned ? "Unban" : "Ban"}
            </button>
          </td>
        `;
        usersTbody.appendChild(tr);
      });
    })
    .catch(() => {
      usersTbody.innerHTML = "";
      usersError.textContent = "Failed to load users.";
    });
}

// Ban/Unban handler
usersTbody.addEventListener("click", function(e) {
  if (e.target.classList.contains("ban-btn")) {
    const username = e.target.dataset.username;
    const isBanned = e.target.textContent === "Unban";
    const url = isBanned
      ? API_BASE.replace("/admin", "/admin/users/unban")
      : API_BASE.replace("/admin", "/admin/users/ban");
    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username })
    })
      .then(r => r.ok ? r.json() : r.json().then(err => Promise.reject(err)))
      .then(() => loadUsers(userSearchInput.value))
      .catch(err => {
        usersError.textContent = (err && err.detail) || "Failed to update user.";
      });
  }
});

// Search form
userSearchForm.onsubmit = function(e) {
  e.preventDefault();
  loadUsers(userSearchInput.value.trim());
};

// Reset search
userSearchReset.onclick = function() {
  userSearchInput.value = "";
  loadUsers();
};

// Reload when section shown
document.querySelector('a[data-section="users"]').addEventListener("click", function() {
  loadUsers();
});




// ========== LEADERBOARD MANAGEMENT ==========

const leaderboardModeSelect = document.getElementById("leaderboard-mode-select");
const leaderboardFilterForm = document.getElementById("leaderboard-filter-form");
const leaderboardUserSearch = document.getElementById("leaderboard-user-search");
const leaderboardTbody = document.getElementById("leaderboard-tbody");
const leaderboardError = document.getElementById("leaderboard-error");
const leaderboardReset = document.getElementById("leaderboard-reset");

let allModes = [];

function fetchAllModes(cb) {
  fetch(API_BASE.replace("/admin", "/admin/game_modes"), { credentials: "include" })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(modes => {
      allModes = modes;
      if (leaderboardModeSelect) {
        leaderboardModeSelect.innerHTML = "";
        modes.forEach(mode => {
          const opt = document.createElement("option");
          opt.value = mode.id;
          opt.textContent = mode.name;
          leaderboardModeSelect.appendChild(opt);
        });
      }
      if (cb) cb(modes);
    });
}

function loadLeaderboard(modeId, username = "") {
  leaderboardError.textContent = "";
  leaderboardTbody.innerHTML = `<tr><td colspan="4">Loading...</td></tr>`;
  fetch(API_BASE.replace("/admin", "/admin/leaderboards"), { credentials: "include" })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(entries => {
      let filtered = entries;
      if (modeId) {
        filtered = filtered.filter(e => e.mode_id == modeId);
      }
      if (username) {
        filtered = filtered.filter(e => e.username.toLowerCase().includes(username.toLowerCase()));
      }
      filtered.sort((a, b) => b.score - a.score);
      leaderboardTbody.innerHTML = "";
      if (!filtered.length) {
        leaderboardTbody.innerHTML = `<tr><td colspan="4"><em>No entries found.</em></td></tr>`;
        return;
      }
      filtered.forEach((entry, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${idx + 1}</td>
          <td>${entry.username}</td>
          <td>${entry.score}</td>
          <td>${entry.achieved_at ? new Date(entry.achieved_at).toLocaleString() : "-"}</td>
        `;
        leaderboardTbody.appendChild(tr);
      });
    })
    .catch(() => {
      leaderboardTbody.innerHTML = "";
      leaderboardError.textContent = "Failed to load leaderboard.";
    });
}

leaderboardFilterForm.onsubmit = function(e) {
  e.preventDefault();
  loadLeaderboard(
    leaderboardModeSelect.value,
    leaderboardUserSearch.value.trim()
  );
};
leaderboardReset.onclick = function() {
  leaderboardUserSearch.value = "";
  loadLeaderboard(leaderboardModeSelect.value, "");
};

// ========== USER SCORE HISTORY ==========

const scoreHistoryForm = document.getElementById("score-history-form");
const historyUserSearch = document.getElementById("history-user-search");
const scoreHistoryTbody = document.getElementById("score-history-tbody");
const scoreHistoryError = document.getElementById("score-history-error");

scoreHistoryForm.onsubmit = function(e) {
  e.preventDefault();
  const username = historyUserSearch.value.trim();
  if (!username) {
    scoreHistoryError.textContent = "Enter a username.";
    return;
  }
  scoreHistoryError.textContent = "";
  scoreHistoryTbody.innerHTML = `<tr><td colspan="4">Loading...</td></tr>`;
  fetch(API_BASE.replace("/admin", `/admin/score_history?username=${encodeURIComponent(username)}`), { credentials: "include" })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(history => {
      scoreHistoryTbody.innerHTML = "";
      if (!history.length) {
        scoreHistoryTbody.innerHTML = `<tr><td colspan="4"><em>No scores found.</em></td></tr>`;
        return;
      }
      history.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${row.submitted_at ? new Date(row.submitted_at).toLocaleString() : "-"}</td>
          <td>${row.mode_id}</td>
          <td>${row.score}</td>
          <td>${row.session_id}</td>
        `;
        scoreHistoryTbody.appendChild(tr);
      });
    })
    .catch(() => {
      scoreHistoryTbody.innerHTML = "";
      scoreHistoryError.textContent = "Failed to load score history.";
    });
};

// Load when section is shown
document.querySelector('a[data-section="leaderboard"]').addEventListener("click", function() {
  fetchAllModes(function(modes) {
    if (modes && modes.length) {
      leaderboardModeSelect.value = modes[0].id;
      loadLeaderboard(modes[0].id, "");
    }
  });
});


// ========== SHOP ITEMS MANAGEMENT ==========

const shopTbody = document.getElementById("shop-tbody");
const shopError = document.getElementById("shop-error");
const shopAddForm = document.getElementById("shop-add-form");

function loadShopItems() {
  shopError.textContent = "";
  shopTbody.innerHTML = `<tr><td colspan="6">Loading...</td></tr>`;
  fetch(API_BASE.replace("/admin", "/admin/shop/items"), { credentials: "include" })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(items => {
      shopTbody.innerHTML = "";
      if (!items.length) {
        shopTbody.innerHTML = `<tr><td colspan="6"><em>No shop items.</em></td></tr>`;
        return;
      }
      items.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><input type="text" value="${item.name}" data-id="${item.id}" data-field="name" /></td>
          <td><input type="text" value="${item.description || ""}" data-id="${item.id}" data-field="description" /></td>
          <td><input type="number" value="${item.price}" min="0" step="0.01" data-id="${item.id}" data-field="price" style="width:90px;" /></td>
          <td><input type="text" value="${item.type || ""}" data-id="${item.id}" data-field="type" style="width:90px;" /></td>
          <td>
            <input type="checkbox" ${item.is_active ? "checked" : ""} data-id="${item.id}" data-field="is_active" />
          </td>
          <td>
            <button data-id="${item.id}" class="shop-save-btn">💾</button>
            <button data-id="${item.id}" class="shop-delete-btn" style="color:#d90429">🗑️</button>
          </td>
        `;
        shopTbody.appendChild(tr);
      });
    })
    .catch(() => {
      shopTbody.innerHTML = "";
      shopError.textContent = "Failed to load shop items.";
    });
}

function saveShopItem(id, fields) {
  fetch(`${API_BASE.replace("/admin", "/admin/shop/items/")}${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields)
  })
    .then(r => r.ok ? r.json() : r.json().then(err => Promise.reject(err)))
    .then(() => loadShopItems())
    .catch(() => {
      shopError.textContent = "Failed to update item.";
    });
}

function deleteShopItem(id) {
  if (!confirm("Delete this shop item?")) return;
  fetch(`${API_BASE.replace("/admin", "/admin/shop/items/")}${id}`, {
    method: "DELETE",
    credentials: "include"
  })
    .then(r => r.ok ? loadShopItems() : r.json().then(err => Promise.reject(err)))
    .catch(() => {
      shopError.textContent = "Failed to delete item.";
    });
}

shopAddForm.onsubmit = function(e) {
  e.preventDefault();
  const name = document.getElementById("shop-add-name").value.trim();
  const description = document.getElementById("shop-add-description").value.trim();
  const price = parseFloat(document.getElementById("shop-add-price").value);
  const type = document.getElementById("shop-add-type").value.trim();
  const is_active = document.getElementById("shop-add-active").checked;
  fetch(API_BASE.replace("/admin", "/admin/shop/items"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description, price, type, is_active })
  })
    .then(r => r.ok ? r.json() : r.json().then(err => Promise.reject(err)))
    .then(() => {
      shopAddForm.reset();
      document.getElementById("shop-add-active").checked = true;
      loadShopItems();
    })
    .catch(err => {
      shopError.textContent = err.detail || "Failed to add item.";
    });
};

// Inline save/delete handlers
shopTbody.addEventListener("click", function(e) {
  if (e.target.classList.contains("shop-save-btn")) {
    const id = e.target.dataset.id;
    const row = e.target.closest("tr");
    const name = row.querySelector('input[data-field="name"]').value.trim();
    const description = row.querySelector('input[data-field="description"]').value.trim();
    const price = parseFloat(row.querySelector('input[data-field="price"]').value);
    const type = row.querySelector('input[data-field="type"]').value.trim();
    const is_active = row.querySelector('input[data-field="is_active"]').checked;
    saveShopItem(id, { name, description, price, type, is_active });
  }
  if (e.target.classList.contains("shop-delete-btn")) {
    deleteShopItem(e.target.dataset.id);
  }
});

// Reload when section shown
document.querySelector('a[data-section="shop"]').addEventListener("click", loadShopItems);

// ========== PURCHASES MANAGEMENT ==========

const purchasesTbody = document.getElementById("purchases-tbody");
const purchaseError = document.getElementById("purchase-error");
const purchaseSearchForm = document.getElementById("purchase-search-form");
const purchaseUserSearch = document.getElementById("purchase-user-search");
const purchaseSearchReset = document.getElementById("purchase-search-reset");

function loadPurchases(username = "") {
  purchaseError.textContent = "";
  purchasesTbody.innerHTML = `<tr><td colspan="6">Loading...</td></tr>`;
  let url = API_BASE.replace("/admin", "/admin/purchases");
  fetch(url, { credentials: "include" })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(data => {
      let filtered = data;
      if (username) {
        filtered = filtered.filter(p => p.username.toLowerCase().includes(username.toLowerCase()));
      }
      purchasesTbody.innerHTML = "";
      if (!filtered.length) {
        purchasesTbody.innerHTML = `<tr><td colspan="6"><em>No purchases.</em></td></tr>`;
        return;
      }
      filtered.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${row.username}</td>
          <td>${row.item_id}</td>
          <td>${row.amount}</td>
          <td>${row.status}</td>
          <td>${row.purchased_at ? new Date(row.purchased_at).toLocaleString() : "-"}</td>
          <td>${row.tx_hash || ""}</td>
        `;
        purchasesTbody.appendChild(tr);
      });
    })
    .catch(() => {
      purchasesTbody.innerHTML = "";
      purchaseError.textContent = "Failed to load purchases.";
    });
}

purchaseSearchForm.onsubmit = function(e) {
  e.preventDefault();
  loadPurchases(purchaseUserSearch.value.trim());
};

purchaseSearchReset.onclick = function() {
  purchaseUserSearch.value = "";
  loadPurchases();
};

// Reload purchases when shop section is shown
document.querySelector('a[data-section="shop"]').addEventListener("click", function() {
  loadPurchases();
});
