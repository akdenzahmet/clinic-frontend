import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Panel.css";

const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:8080";

function getTokenFromStorage() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwt") ||
    ""
  );
}

async function apiFetch(path, { token = "" } = {}) {
  const headers = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { headers });
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

function toYmd(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Panel() {
  const [todayYmd] = useState(() => toYmd(new Date()));
  const [todayApptCount, setTodayApptCount] = useState(null);
  const [patientCount, setPatientCount] = useState(null);

  useEffect(() => {
    let alive = true;

    async function loadStats() {
      const token = getTokenFromStorage();

      // 1) Bugünkü randevu sayısı
      try {
        const appts = await apiFetch(`/api/appointments?date=${todayYmd}`, { token });
        if (alive) setTodayApptCount(Array.isArray(appts) ? appts.length : 0);
      } catch {
        if (alive) setTodayApptCount(0);
      }

      // 2) Toplam hasta sayısı 
      try {
        const data = await apiFetch(`/patients?page=0&size=1`, { token });
        const total = Number(data?.totalElements ?? 0);
        if (alive) setPatientCount(Number.isFinite(total) ? total : 0);
      } catch {
        if (alive) setPatientCount(0);
      }
    }

    loadStats();
    return () => {
      alive = false;
    };
  }, [todayYmd]);

  return (
    
    <div className="panel-root">
      <div className="panel-shell">
        {/* Header */}
        <div className="panel-head">
          <div>
            <h1 className="panel-title">Panel</h1>
            <div className="panel-sub">Yönetim ekranı • Randevu & Hasta yönetimi</div>
          </div>

          <button
            className="panel-logout"
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
          >
            Çıkış
          </button>
        </div>

        {/* Mini dashboard (stat bar) */}
        <div className="panel-stats">
          <div className="panel-stat">
            <div className="panel-statK">Bugün</div>
            <div className="panel-statV">{todayYmd}</div>
          </div>

          <div className="panel-stat">
            <div className="panel-statK">Bugünkü randevu</div>
            <div className="panel-statV">{todayApptCount === null ? "…" : todayApptCount}</div>
          </div>

          <div className="panel-stat">
            <div className="panel-statK">Toplam hasta</div>
            <div className="panel-statV">{patientCount === null ? "…" : patientCount}</div>
          </div>
        </div>

        {/* Cards */}
        <div className="panel-grid">
          <Link to="/panel/appointments" className="panel-card">
            <div className="panel-cardTop">
              <div className="panel-ico">🗓️</div>
              <div className="panel-cardTitle">Randevular</div>
            </div>

            <div className="panel-cardDesc">
              Gün / hafta görünümüyle randevuları hızlıca yönet.
            </div>

            <div className="panel-pillRow">
              <span className="panel-pill">Haftalık</span>
              <span className="panel-pill">15 dk dilim</span>
              <span className="panel-pill">Çakışma koruması</span>
            </div>

            <div className="panel-cardCta">Randevulara git →</div>
          </Link>

          <Link to="/panel/patients" className="panel-card panel-card--alt">
            <div className="panel-cardTop">
              <div className="panel-ico">👤</div>
              <div className="panel-cardTitle">Hastalar</div>
            </div>

            <div className="panel-cardDesc">
              İsim/telefon ile ara, hasta detayına ve geçmişe hızlı ulaş.
            </div>

            <div className="panel-pillRow">
              <span className="panel-pill">Arama</span>
              <span className="panel-pill">Detay sayfası</span>
              <span className="panel-pill">Geçmiş</span>
            </div>

            <div className="panel-cardCta">Hastalara git →</div>
          </Link>
        </div>

        <div className="panel-foot">
          <div className="panel-footNote">Not: Bu panel sadece giriş yapan kullanıcılar içindir.</div>
        </div>
      </div>
    </div>
  );
}
