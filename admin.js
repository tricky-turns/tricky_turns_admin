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
