import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Patients.css";

const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:8080";

function getTokenFromStorage() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwt") ||
    ""
  );
}

async function apiFetch(path, { token = "", method = "GET", body } = {}) {
  const headers = { Accept: "application/json" };
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    err.payload = json ?? text;
    throw err;
  }
  return json;
}


export default function Patients() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  async function load(search) {
    setLoading(true);
    try {
      const token = getTokenFromStorage();
      const qs = new URLSearchParams();
      if (search?.trim()) qs.set("q", search.trim());
      qs.set("page", "0");
      qs.set("size", "30");

      const data = await apiFetch(`/patients?${qs.toString()}`, { token });
      setItems(Array.isArray(data?.content) ? data.content : []);
    } catch (e) {
      setItems([]);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load("");
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => load(q), 300);
    return () => timer.current && clearTimeout(timer.current);
  }, [q]);

  return (
    <div className="patients-root pageFadeIn">
      <div className="patients-head">
        <div>
          <h2>👤 Hastalar</h2>
          <div className="patients-sub">İsim veya telefon ile ara</div>
        </div>

        <input
          className="patients-search"
          placeholder="Örn: Ahmet / 0555..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="patients-card">
        {loading ? <div className="patients-muted">Yükleniyor…</div> : null}
        {!loading && !items.length ? (
          <div className="patients-muted">Sonuç yok.</div>
        ) : null}

        <div className="patients-list">
          {items.map((p) => (
  <div key={p.id} className="patients-rowWrap">
    <Link to={`/panel/patients/${p.id}`} className="patients-row">
      <div className="patients-name">{p.fullName}</div>
      <div className="patients-phone">{p.phone}</div>
    </Link>

    <button
  className="patients-del"
  onClick={async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Hastayı silmek istiyor musunuz?")) return;

    try {
      const token = getTokenFromStorage();
      const res = await fetch(`${API_BASE}/patients/${p.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!res.ok) {
        const text = await res.text();
        let data = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = null;
        }
      
        alert(data?.message || data?.detail || text || `HTTP ${res.status}`);
        return;
      }
      
      load(q);

    } catch (err) {
      console.error(err);
      alert("Silinemedi. (Bağlantı hatası)");
    }
  }}
>
  Sil
</button>

  </div>
))}

        </div>
      </div>
    </div>
  );
}
