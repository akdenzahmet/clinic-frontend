import { useEffect, useMemo, useState } from "react";
import "./Login.css";

const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:8080";

export default function Login() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function onMouseMove(e) {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width; // 0..1
    const py = (e.clientY - r.top) / r.height; // 0..1
    const dx = (px - 0.5) * 2;
    const dy = (py - 0.5) * 2;

    setTilt({ x: dx, y: dy });
  }

  function onMouseLeave() {
    setTilt({ x: 0, y: 0 });
  }

  const heroStyle = useMemo(
    () => ({
      transform: `translate3d(${tilt.x * 6}px, ${tilt.y * 6}px, 0)`,
    }),
    [tilt]
  );

  const cardStyle = useMemo(
    () => ({
      transform: `translate3d(${tilt.x * -6}px, ${tilt.y * -6}px, 0)`,
    }),
    [tilt]
  );

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        const msg = (data && (data.message || data.error)) || text || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      const token = data?.token;
      if (!token) throw new Error("Token gelmedi (backend response'u kontrol et).");
      localStorage.setItem("token", token);
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/panel";
      }, 450);
    } catch (err) {
      setError(err?.message || "Giriş başarısız.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
  document.body.classList.add("is-auth");
  return () => document.body.classList.remove("is-auth");
}, []);

  return (
    <div className={"login-root route-wrap" + (success ? " is-success" : "")}>
      {/*  Arka plan blobları */}
        <div className="login-bg" aria-hidden="true">
          <span className="login-blob b1" />
          <span className="login-blob b2" />
          <span className="login-blob b3" />
          <span className="login-grain" />
        </div>

        <div className="login-shell" onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
          <div className="login-hero" style={heroStyle}>
            <h1 className="login-heroTitle">Doktor / Asistan Paneli</h1>
            <div className="login-heroSub">Randevular, hastalar ve günlük akış tek yerden yönetilir.</div>

            <div className="login-badges">
              <span className="login-badge">🔒 Yetkili giriş</span>
              <span className="login-badge">⚡ Hızlı işlem</span>
              <span className="login-badge">🗓️ Ajanda</span>
              <span className="login-badge">👤 Hasta kartı</span>
            </div>

            
          </div>

        <div className="login-card" style={cardStyle}>
          <h2 className="login-title">Giriş</h2>
          <div className="login-muted">Lütfen kullanıcı adı ve şifrenizi girin.</div>

          {error ? <div className="login-alert">{error}</div> : null}

          <form className="login-form" onSubmit={onSubmit}>
            <div className="login-label">Kullanıcı Adı</div>
            <input
              className="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />

            <div className="login-label">Şifre</div>
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            <button className={"login-btn" + (loading ? " is-loading" : "")} type="submit" disabled={loading}>
              {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
            </button>
          </form>

          <div className="login-footnote">© Dt. Zehra Akdeniz Diş Kliniği</div>
        </div>
      </div>
    </div>
  );
}
