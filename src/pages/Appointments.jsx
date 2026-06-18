import { useEffect, useMemo, useRef, useState } from "react";
import "./Appointments.css";
import AppointmentsWeek from "./AppointmentsWeek";
import "./AppointmentsWeek.css";
import { Link } from "react-router-dom";

/* -------------------- CONFIG -------------------- */
const DOCTORS = [
  { id: "male", name: "Dr. Özgür Paşaoğlu" },
  { id: "female", name: "Dr. Zehra Akdeniz" },
];

const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:8080";

/* -------------------- HELPERS -------------------- */
function pad2(n) {
  return String(n).padStart(2, "0");
}
function toYmd(d) {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}
function toDisplayDate(ymd) {
  const [y, m, d] = String(ymd || "").split("-");
  if (!y || !m || !d) return ymd;
  return `${d}.${m}.${y}`;
}
function timeToHm(t) {
  if (!t) return "";
  return String(t).slice(0, 5);
}
function hmToMinutes(hm) {
  const [h, m] = String(hm).split(":").map(Number);
  return h * 60 + m;
}
function minutesToHm(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${pad2(h)}:${pad2(m)}`;
}
function addMinutes(hm, add) {
  return minutesToHm(hmToMinutes(hm) + add);
}
function viewLabel(view) {
  if (view === "male") return "Sadece Dr. Özgür Paşaoğlu";
  if (view === "female") return "Sadece Dr. Zehra Akdeniz";
  return "Tüm doktorlar";
}

function buildHourRows(startHour = 9, endHour = 19) {
  const rows = [];
  for (let h = startHour; h <= endHour; h++) {
    rows.push({ hour: h, label: `${pad2(h)}:00` });
  }
  return rows;
}
function subSlotsForHour(hour) {
  const base = `${pad2(hour)}:`;
  return [`${base}00`, `${base}15`, `${base}30`, `${base}45`];
}
function getTokenFromStorage() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwt") ||
    ""
  );
}

async function apiFetch(path, { method = "GET", token = "", body } = {}) {
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

/* -------------------- PAGE -------------------- */
export default function Appointments() {
  const pageTopRef = useRef(null);
  const [mode, setMode] = useState("week"); // "day" | "week"
  const [view, setView] = useState("all"); // all | male | female
  const [date, setDate] = useState(toYmd(new Date()));
  const [openHour, setOpenHour] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, type: "info", text: "" });
  const toastTimer = useRef(null);
  const [editor, setEditor] = useState({
    open: false,
    mode: "create",
    hour: null,
    hm: "",
    id: null,
    doctorId: "male",
    patientName: "",
    procedure: "",
    durationMin: 60, // ✅ yeni
    patientPhone: "",

  });

  const hours = useMemo(() => buildHourRows(9, 19), []);
  const legend = useMemo(() => {
    const m = new Map();
    for (const d of DOCTORS) m.set(d.id, d);
    return m;
  }, []);

  function showToast(text, type = "info") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ show: true, type, text });

    toastTimer.current = setTimeout(
      () => setToast({ show: false, type: "info", text: "" }),
      2600
    );
  }
  async function loadAppointments() {
    setLoading(true);
    try {
      const token = getTokenFromStorage();
      if (!token) {
        setItems([]);
        showToast("Token yok. Önce giriş yap.", "warn");
        return;
      }

      const q = new URLSearchParams();
      q.set("date", date);
      if (view !== "all") q.set("doctorId", view);

      const data = await apiFetch(`/api/appointments?${q.toString()}`, { token });
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setItems([]);
      const payload = e?.payload
        ? typeof e.payload === "string"
          ? e.payload
          : JSON.stringify(e.payload)
        : "";
      showToast(`Randevular çekilemedi. ${payload}`, "danger");
    } finally {
      setLoading(false);
    }
  }

  // sadece day modunda, günün randevularını çek
  useEffect(() => {
    if (mode !== "day") return;

    loadAppointments();
    setOpenHour(null);
    setEditor((x) => ({ ...x, open: false }));
    window.scrollTo({ top: 0, behavior: "auto" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, date, mode]);

  const apptsByTime = useMemo(() => {
    const map = new Map();
    for (const a of items) {
      const hm = timeToHm(a.time);
      map.set(`${hm}|${a.doctorId}`, a);
    }
    return map;
  }, [items]);

  function hourSummary(hourLabel) {
    const list = items
      .filter((a) => `${timeToHm(a.time).slice(0, 2)}:00` === hourLabel)
      .sort((x, y) => timeToHm(x.time).localeCompare(timeToHm(y.time)));

    if (!list.length) return "Bu saatte randevu yok";
    return list
      .map((a) => {
        const hm = timeToHm(a.time);
        const doc = legend.get(a.doctorId);
        const proc = a.procedure ? ` • ${a.procedure}` : "";
        const name = a.patientName || "";
        return `${hm} ${name}${proc} (${doc?.name || a.doctorId})`;
      })
      .join("\n");
  }

  function toggleHour(h) {
    setEditor((x) => ({ ...x, open: false }));
    setOpenHour((cur) => (cur === h ? null : h));
  }

  function openCreate(hour, hm) {
    setEditor({
      open: true,
      mode: "create",
      hour,
      hm,
      id: null,
      doctorId: view === "all" ? "male" : view,
      patientName: "",
      procedure: "",
      durationMin: 60, 
      patientPhone: "",

    });
  }

  function openEdit(hour, hm, appt) {
    setEditor({
      open: true,
      mode: "edit",
      hour,
      hm,
      id: appt.id,
      doctorId: appt.doctorId,
      patientName: appt.patientName || "",
      procedure: appt.procedure || "",
      durationMin: 15, 
      patientPhone: appt.patientPhone || "", 

    });
  }

  function closeEditor() {
    setEditor((x) => ({ ...x, open: false }));
  }

  async function saveEditor() {
    try {
      const token = getTokenFromStorage();
      if (!token) return showToast("Token yok. Önce giriş yap.", "warn");
      if (!editor.hm || !editor.patientName.trim())
        return showToast("Saat ve hasta adı zorunlu.", "warn");

      const payload = {
        doctorId: editor.doctorId,
        date,
        time: editor.hm,
        patientName: editor.patientName.trim(),
        patientPhone: editor.patientPhone?.trim() || null,
        procedure: editor.procedure.trim() || null,
      };


      if (editor.mode === "create") {
      const dur = Math.max(15, Number(editor.durationMin || 15));
      const steps = Math.max(1, Math.round(dur / 15));    
      const startHm = editor.hm; // ör: 09:00
      const times = Array.from({ length: steps }, (_, i) => addMinutes(startHm, i * 15));
      const minM = hmToMinutes("09:00");
      const maxM = hmToMinutes("19:45");
      for (const t of times) {
        const m = hmToMinutes(t);
        if (m < minM || m > maxM) {
          return showToast("Seçilen süre çalışma saatlerini aşıyor (09:00–19:45).", "warn");
        }
      }

  // UI üzerinden doluluk kontrolü yapıyoruz
  for (const t of times) {
    const key = `${t}|${editor.doctorId}`;
    if (apptsByTime.get(key)) {
      return showToast(`Bu aralık dolu: ${t}. Süreyi kısalt ya da başka saat seç.`, "warn");
    }
  }

  // 1) ilk slot normal randevu
  const firstPayload = {
    doctorId: editor.doctorId,
    date,
    time: startHm,
    patientName: editor.patientName.trim(),
    patientPhone: editor.patientPhone?.trim() || null,
    procedure: editor.procedure.trim()
      ? `${editor.procedure.trim()} (${dur} dk)`
      : `(${dur} dk)`,
  };

  await apiFetch(`/api/appointments`, { method: "POST", token, body: firstPayload });

  // 2) devam slotları
  for (let i = 1; i < times.length; i++) {
    const t = times[i];
    const contPayload = {
      doctorId: editor.doctorId,
      date,
      time: t,
      patientName: "DEVAM",
      patientPhone: editor.patientPhone?.trim() || null,
      procedure: `${startHm} → ${dur} dk`,
    };
    await apiFetch(`/api/appointments`, { method: "POST", token, body: contPayload });
  }

  showToast(`Randevu kaydedildi ✅ (${dur} dk)`, "ok");
}
 else {
        await apiFetch(`/api/appointments/${editor.id}`, {
          method: "PUT",
          token,
          body: payload,
        });
        showToast("Randevu güncellendi ✅", "ok");
      }

      closeEditor();
      await loadAppointments();
    } catch (e) {
      const payload = e?.payload
        ? typeof e.payload === "string"
          ? e.payload
          : JSON.stringify(e.payload)
        : "";
      showToast(`Kaydedilemedi. Bu saat dolu olabilir. ${payload}`, "danger");
    }
  }

  async function deleteAppt(id) {
    if (!window.confirm("Randevuyu silmek istiyor musunuz?")) return;

    try {
      const token = getTokenFromStorage();
      if (!token) return showToast("Token yok. Önce giriş yap.", "warn");

      await apiFetch(`/api/appointments/${id}`, { method: "DELETE", token });
      showToast("Silindi ✅", "ok");
      closeEditor();
      await loadAppointments();
    } catch (e) {
      const payload = e?.payload
        ? typeof e.payload === "string"
          ? e.payload
          : JSON.stringify(e.payload)
        : "";
      showToast(`Silinemedi. ${payload}`, "danger");
    }
  }

  return (
    <div ref={pageTopRef} className="appointments-root">
      <div className="appointments-shell">
        {toast.show ? (
          <div className={`ap-toast ap-toast--${toast.type}`}>{toast.text}</div>
        ) : null}

        <div className="ap-header">
          <div>
            <h2 className="ap-title">🦷 Klinik Randevu Paneli</h2>
            <div className="ap-subtitle">
              {mode === "day"
                ? `${toDisplayDate(date)} • ${viewLabel(view)}`
                : `Haftalık görünüm • ${viewLabel(view)}`}
            </div>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="ap-modeRow">
          <button
            className={`ap-modeBtn ${mode === "week" ? "is-active" : ""}`}
            onClick={() => {
              setMode("week");
              setOpenHour(null);
              setEditor((x) => ({ ...x, open: false }));
            }}
          >
            Hafta
          </button>

          <button
            className={`ap-modeBtn ${mode === "day" ? "is-active" : ""}`}
            onClick={() => setMode("day")}
          >
            Gün
          </button>
        </div>

        {/* Toolbar */}
        <div className="ap-toolbar">
          <div className="ap-field">
            <div className="ap-label">Görünüm</div>
            <select value={view} onChange={(e) => setView(e.target.value)}>
              <option value="all">Tüm doktorlar</option>
              <option value="male">Sadece Dr. Özgür Paşaoğlu</option>
              <option value="female">Sadece Dr. Zehra Akdeniz</option>
            </select>
          </div>

          <div className="ap-field">
            <div className="ap-label">Tarih</div>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          {mode === "day" ? (
            <button className="ap-btn ap-btn--primary" onClick={loadAppointments} disabled={loading}>
              {loading ? "Yükleniyor…" : "Yenile"}
            </button>
          ) : (
            <button
              className="ap-btn ap-btn--primary"
              onClick={() => showToast("Hafta görünümünde gün seç veya tarih değiştir.", "info")}
            >
              Bilgi
            </button>
          )}
        </div>

        {/* WEEK */}
        {mode === "week" ? (
          <AppointmentsWeek
            apiFetch={apiFetch}
            getToken={getTokenFromStorage}
            view={view}
            date={date}
            showToast={showToast}
            // Gün tıklanınca day moduna geçer
            onPickDate={(ymd) => {
              setDate(ymd);
              setMode("day");
              setOpenHour(null);
              setEditor((x) => ({ ...x, open: false }));
            }}
            onPickDay={(ymd) => {
              setDate(ymd);
              setMode("day");
              setOpenHour(null);
              setEditor((x) => ({ ...x, open: false }));
            }}
            // oklar / hafta değişimi: sadece date değişsin, week’de kalsın
            onChangeDate={(ymd) => {
              setDate(ymd);
            }}
          />
        ) : (
          <>
            <div className="ap-hint">
              Saatin yanındaki <b>+</b> ile 15 dk dilimlerine açılır.
            </div>

            <div className="ap-hours">
              {hours.map((r) => {
                const isOpen = openHour === r.hour;
                const hourLabel = r.label;

                return (
                  <div key={r.hour} className={`ap-hourCard ${isOpen ? "is-open" : ""}`}>
                    <div className="ap-hourTop">
                      <div className="ap-hourLabel">{hourLabel}</div>
                      <div className="ap-hourSummary">
                        {isOpen ? "15 dk seçeneklerinden birini seç" : hourSummary(hourLabel)}
                      </div>
                      <button className="ap-btn ap-btn--ghost ap-toggle" onClick={() => toggleHour(r.hour)}>
                        {isOpen ? "–" : "+"}
                      </button>
                    </div>

                    {isOpen ? (
                      <div className="ap-slotsGrid">
                        {subSlotsForHour(r.hour).map((hm) => (
                          <SlotSimple
                            key={`${date}|${r.hour}|${hm}|${view}`}
                            hour={r.hour}
                            hm={hm}
                            view={view}
                            editor={editor}
                            setEditor={setEditor}
                            apptsByTime={apptsByTime}
                            openCreate={openCreate}
                            openEdit={openEdit}
                            deleteAppt={deleteAppt}
                            closeEditor={closeEditor}
                            saveEditor={saveEditor}
                            date={date}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="ap-footerNote">
              Çakışma kontrolü backend’de: aynı <b>doktor + tarih + saat</b> doluysa kaydetmez.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* -------------------- SIMPLE SLOT -------------------- */
function SlotSimple({
  hour,
  hm,
  view,
  editor,
  setEditor,
  apptsByTime,
  openCreate,
  openEdit,
  deleteAppt,
  closeEditor,
  saveEditor,
  date,
}) {
  const isAll = view === "all";
  const male = apptsByTime.get(`${hm}|male`);
  const female = apptsByTime.get(`${hm}|female`);
  const oneAppt = !isAll ? apptsByTime.get(`${hm}|${view}`) : null;

  const isEditorHere = editor.open && editor.hour === hour && editor.hm === hm;
  const hasAny = isAll ? !!(male || female) : !!oneAppt;

  return (
    <div className={`ap-slotCard ${hasAny ? "is-filled" : "is-empty"}`}>
      <div className="ap-slotTop">
        <div className="ap-slotTimeRow">
          <div className="ap-slotTime">{hm}</div>
          {hasAny ? (
            <span className="ap-pill">DOLU</span>
          ) : (
            <span className="ap-pill ap-pill--empty">BOŞ</span>
          )}
        </div>

        <div className="ap-slotActions">
          <button className="ap-btn ap-btn--small" onClick={() => openCreate(hour, hm)}>
            Ekle
          </button>
          {isEditorHere ? (
            <button className="ap-btn ap-btn--small ap-btn--ghost" onClick={closeEditor}>
              Vazgeç
            </button>
          ) : null}
        </div>
      </div>

      <div className="ap-slotBody">
        {isAll ? (
          <>
            {male ? (
              <div className="ap-apptLine">
                <span className="ap-badge ap-badge--blue">Dr.Özgür</span>
                <span className="ap-apptText">
                  {male.patientId ? (
                    <Link className="ap-patientLink" to={`/panel/patients/${male.patientId}`}>
                      {male.patientName}
                    </Link>
                  ) : (
                    <span className="ap-patient">{male.patientName}</span>
                  )}
                  {male.procedure ? <span className="ap-proc">{male.procedure}</span> : null}
                </span>
                <span className="ap-apptBtns">
                  <button className="ap-linkBtn" onClick={() => openEdit(hour, hm, male)}>
                    Düzenle
                  </button>
                  <button className="ap-linkBtn ap-linkBtn--danger" onClick={() => deleteAppt(male.id)}>
                    Sil
                  </button>
                </span>
              </div>
            ) : null}

            {female ? (
              <div className="ap-apptLine">
                <span className="ap-badge ap-badge--alt">Dr.Zehra</span>
                <span className="ap-apptText">
                  {female.patientId ? (
                    <Link className="ap-patientLink" to={`/panel/patients/${female.patientId}`}>
                      {female.patientName}
                    </Link>
                  ) : (
                    <span className="ap-patient">{female.patientName}</span>
                  )}
                  {female.procedure ? ` • ${female.procedure}` : ""}
                </span>
                <span className="ap-apptBtns">
                  <button className="ap-linkBtn" onClick={() => openEdit(hour, hm, female)}>
                    Düzenle
                  </button>
                  <button className="ap-linkBtn ap-linkBtn--danger" onClick={() => deleteAppt(female.id)}>
                    Sil
                  </button>
                </span>
              </div>
            ) : null}

            {!male && !female ? <div className="ap-empty">Boş</div> : null}
          </>
        ) : oneAppt ? (
          <div className="ap-apptLine">
            <span className="ap-badge">{view === "male" ? "Özgür" : "Zehra"}</span>
            <span className="ap-apptText">
              {oneAppt.patientId ? (
                <Link className="ap-patientLink" to={`/panel/patients/${oneAppt.patientId}`}>
                  {oneAppt.patientName}
                </Link>
              ) : (
                <span className="ap-patient">{oneAppt.patientName}</span>
              )}
              {oneAppt.procedure ? ` • ${oneAppt.procedure}` : ""}
            </span>
            <span className="ap-apptBtns">
              <button className="ap-linkBtn" onClick={() => openEdit(hour, hm, oneAppt)}>
                Düzenle
              </button>
              <button className="ap-linkBtn ap-linkBtn--danger" onClick={() => deleteAppt(oneAppt.id)}>
                Sil
              </button>
            </span>
          </div>
        ) : (
          <div className="ap-empty">Boş</div>
        )}
      </div>

      {isEditorHere ? (
        <div className="ap-editor">
          <div className="ap-editorHead">
            <b>{toDisplayDate(date)}</b> — <b>{editor.hm}</b>{" "}
            <span className="ap-editorMode">
              ({editor.mode === "create" ? "Yeni" : "Düzenle"})
            </span>
          </div>

          <div className="ap-editorGrid">
            <label className="ap-editorField">
              <span>Doktor</span>
              <select
                value={editor.doctorId}
                onChange={(e) => setEditor((x) => ({ ...x, doctorId: e.target.value }))}
                disabled={view !== "all"}
              >
                <option value="male">Dr. Özgür</option>
                <option value="female">Dr. Zehra</option>
              </select>
            </label>

            <label className="ap-editorField">
              <span>Hasta</span>
              <input
                value={editor.patientName}
                onChange={(e) => setEditor((x) => ({ ...x, patientName: e.target.value }))}
              />
            </label>

            <label className="ap-editorField">
              <span>Telefon</span>
              <input
                value={editor.patientPhone}
                onChange={(e) => setEditor((x) => ({ ...x, patientPhone: e.target.value }))}
                placeholder="0555..."
              />
            </label>  


            <label className="ap-editorField">
              <span>İşlem</span>
              <input
                value={editor.procedure}
                onChange={(e) => setEditor((x) => ({ ...x, procedure: e.target.value }))}
              />
            </label>
            <label className="ap-editorField">
              <span>Süre</span>
              <select
                value={editor.durationMin}
                onChange={(e) => setEditor((x) => ({ ...x, durationMin: Number(e.target.value) }))}
              >
                <option value={15}>15 dk</option>
                <option value={30}>30 dk</option>
                <option value={45}>45 dk</option>
                <option value={60}>60 dk</option>
                <option value={75}>75 dk</option>
                <option value={90}>90 dk</option>
                <option value={120}>120 dk</option>
              </select>
            </label>
            <div className="ap-editorBtns">
              <button className="ap-btn ap-btn--primary" onClick={saveEditor}>
                Kaydet
              </button>
              <button className="ap-btn ap-btn--ghost" onClick={closeEditor}>
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}