// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Modes from "./pages/Modes";

export default function App() {
  return (
    <Router>
      <nav style={{ padding: 12 }}>
        <Link to="/">Modes</Link> | <Link to="/login">Login</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Modes />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}
