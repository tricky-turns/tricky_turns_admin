// src/api/admin.ts
export const API_BASE = "https://tricky-turns-backend.onrender.com/admin";

// ---- AUTH ----
export async function adminLogin(username: string, password: string) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function adminLogout() {
  const res = await fetch(`${API_BASE}/logout`, {
    method: "POST",
    credentials: "include",
  });
  return res.ok;
}

export async function getCurrentAdmin() {
  const res = await fetch(`${API_BASE}/me`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}

// ---- GAME MODES ----
export async function fetchModes() {
  const res = await fetch(`${API_BASE}/game_modes`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch game modes");
  return res.json();
}

export async function createMode(name: string, description: string, is_active = true) {
  const res = await fetch(`${API_BASE}/game_modes`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description, is_active }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
