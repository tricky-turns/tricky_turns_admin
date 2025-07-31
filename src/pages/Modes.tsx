// src/pages/Modes.tsx
import React, { useState, useEffect } from "react";
import { fetchModes, createMode } from "../api/admin";
import { useAdminAuth } from "../hooks/useAdminAuth";

type Mode = {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
};

export default function Modes() {
  const { admin, loading } = useAdminAuth();
  const [modes, setModes] = useState<Mode[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!admin) return;
    fetchModes().then(setModes).catch(() => setModes([]));
  }, [admin]);

  if (loading) return <div>Loading...</div>;
  if (!admin) return <div>Not authenticated</div>;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createMode(name, description);
      setModes(await fetchModes());
      setName("");
      setDescription("");
    } catch (err) {
      setError("Failed to create mode.");
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      <h2>Game Modes</h2>
      <form onSubmit={handleCreate} style={{ marginBottom: 24 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Mode name" required />
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />
        <button type="submit">Create Mode</button>
        {error && <span style={{ color: "red", marginLeft: 16 }}>{error}</span>}
      </form>
      <table border={1} cellPadding={8}>
        <thead>
          <tr>
            <th>Name</th><th>Description</th><th>Active?</th><th>Created</th>
          </tr>
        </thead>
        <tbody>
          {modes.map(m => (
            <tr key={m.id}>
              <td>{m.name}</td>
              <td>{m.description}</td>
              <td>{m.is_active ? "Yes" : "No"}</td>
              <td>{new Date(m.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
