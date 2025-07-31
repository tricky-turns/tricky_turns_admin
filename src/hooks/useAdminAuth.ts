// src/hooks/useAdminAuth.ts
import { useState, useEffect } from "react";
import { getCurrentAdmin, adminLogin, adminLogout } from "../api/admin";

export function useAdminAuth() {
  const [admin, setAdmin] = useState<{ admin: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentAdmin()
      .then(setAdmin)
      .catch(() => setAdmin(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    await adminLogin(username, password);
    const user = await getCurrentAdmin();
    setAdmin(user);
  };

  const logout = async () => {
    await adminLogout();
    setAdmin(null);
  };

  return { admin, loading, login, logout };
}
