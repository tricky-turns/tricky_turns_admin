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
