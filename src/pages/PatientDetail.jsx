import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
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

// Global apiFetch fonksiyonu kalsın
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

function timeToHm(t) {
  if (!t) return "";
  return String(t).slice(0, 5);
}

const DOCTOR_LABEL = {
  male: "Dr. Özgür",
  female: "Dr. Zehra",
};

function doctorLabel(id) {
  return DOCTOR_LABEL[id] || id || "—";
}

function splitProcedure(proc) {
  if (!proc) return { name: "", minutes: "" };
  const s = String(proc);
  const m = s.match(/\((\d+)\s*dk\)/i);
  const minutes = m ? `${m[1]} dk` : "";
  const name = s.replace(/\s*\(\d+\s*dk\)\s*/i, "").trim();
  return { name, minutes };
}

function isDevamRow(a) {
  const proc = String(a?.procedure || "").toUpperCase();
  const snap = String(a?.patientNameSnapshot || "").toUpperCase();
  return proc.includes("DEVAM") || snap === "DEVAM";
}

const UPPER_RIGHT = ["18", "17", "16", "15", "14", "13", "12", "11"];
const UPPER_LEFT = ["21", "22", "23", "24", "25", "26", "27", "28"];
const LOWER_RIGHT = ["48", "47", "46", "45", "44", "43", "42", "41"];
const LOWER_LEFT = ["31", "32", "33", "34", "35", "36", "37", "38"];
const PROCEDURES = [
  "Muayene",
  "Kanal Tedavisi",
  "Kompozit Dolgu ",
  "Diş Çekim",
  "Süt Diş Çekim",
  "Detartraj",
  "Zirkon Kaplama",
  "Porselen Kaplama",
  "Ortodontik Şeffaf Plak",
  "Kanal Yenileme(Retreatment)",
  "Cam İyonomer Dolgu",
  "Diş Beyazlatma",
  "Hareketli Protez",
  "İmplant",
  "Apikal Rezeksiyon",
  "Gece Plağı",
  "Gömülü Diş Çekimi",
  "Protez Tamiri",
  "prp/pcp Uygulaması",
  "Botox Uygulaması",
  "Mezoterapi Uygulaması",
  "Kemik Grefti",
  "Eklem Splinti",
  "sinüs lifting",
];

export default function PatientDetail() {
  const { id } = useParams();
  const [edit, setEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const [patient, setPatient] = useState(null);
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [tooths, setTooths] = useState([]);
  const [toothLoading, setToothLoading] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState("");
  const [selectedProc, setSelectedProc] = useState(PROCEDURES[0]);
  const [customProc, setCustomProc] = useState("");

  const toothByCode = useMemo(() => {
    const map = {};
    for (const t of tooths) {
      const code = String(t.toothCode || "");
      if (!map[code]) map[code] = [];
      map[code].push(t);
    }
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    });
    return map;
  }, [tooths]);

  function toothStatus(code) {
  const list = toothByCode[code] || [];
  const total = list.length;
  const doneCount = list.filter((x) => x.done === true).length;
  const waitingCount = total - doneCount;

  const ratio = total ? doneCount / total : 0;

  let tone = "none"; // gri
  if (total > 0 && doneCount === total) tone = "done"; // yeşil
  else if (total > 0 && waitingCount > 0) tone = "mixed"; // sarı

  return { has: total > 0, total, doneCount, waitingCount, ratio, tone };
}


  async function loadToothTreatments() {
    setToothLoading(true);
    try {
      const token = getTokenFromStorage();
      const list = await apiFetch(`/patients/${id}/tooth-treatments`, { token });
      setTooths(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      setTooths([]);
    } finally {
      setToothLoading(false);
    }
  }

  async function addToothTreatment() {
    const toothCode = String(selectedTooth || "").trim();
    const procedure =
      selectedProc === "__custom__"
        ? String(customProc || "").trim()
        : String(selectedProc || "").trim();

    if (!toothCode) { alert("Önce bir diş seç."); return; }
    if (!procedure) { alert("Müdahale seç (veya özel yaz)."); return; }

    try {
      const token = getTokenFromStorage();
      await apiFetch(`/patients/${id}/tooth-treatments`, {
        token,
        method: "POST",
        body: { toothCode, procedure },
      });
      setCustomProc("");
      await loadToothTreatments();
    } catch (e) {
      console.error(e);
      alert("Ekleme başarısız.");
    }
  }

  // BU FONKSİYONU GÜNCELLEDİK 
  async function toggleDone(tid, done) {
  try {
    const token = getTokenFromStorage();
    await apiFetch(`/patients/${id}/tooth-treatments/${tid}/done`, {
      token,
      method: "PUT",
      body: { done },
    });

    const tidN = Number(tid);

    setTooths((prev) =>
      prev.map((t) => (Number(t.id) === tidN ? { ...t, done } : t))
    );
  } catch (e) {
    console.error(e);
    alert("Güncelleme başarısız oldu.");
  }
}


  // ESKİ deleteTooth FONKSİYONUNU BURAYA TAŞIDIK
  async function deleteTreatment(tid) {
  if (!window.confirm("Bu kaydı silmek istiyor musun?")) return;

  try {
    const token = getTokenFromStorage();
    await apiFetch(`/patients/${id}/tooth-treatments/${tid}`, {
      token,
      method: "DELETE",
    });

    const tidN = Number(tid);

    setTooths((prev) => prev.filter((t) => Number(t.id) !== tidN));
  } catch (e) {
    console.error(e);
    alert("Silme işlemi başarısız oldu.");
  }
}


  async function loadAll() {
    setLoading(true);
    try {
      const token = getTokenFromStorage();
      const p = await apiFetch(`/patients/${id}`, { token });
      const a = await apiFetch(`/patients/${id}/appointments?page=0&size=50`, { token });

      setPatient(p);
      setEditName(p?.fullName || "");
      setEditPhone(p?.phone || "");
      setEditNotes(p?.notes || "");

      const list = Array.isArray(a?.content) ? a.content : [];
      const cleaned = list.filter((x) => !isDevamRow(x));
      setAppts(cleaned);
      await loadToothTreatments();
    } catch (e) {
      console.error(e);
      setPatient(null);
      setAppts([]);
      setTooths([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [id]);

  const selectedList = selectedTooth ? toothByCode[selectedTooth] || [] : [];
const allTreatments = useMemo(() => {
  // tooths zaten tüm kayıtlar
  return [...tooths].sort((a, b) => Number(a.toothCode) - Number(b.toothCode));
}, [tooths]);

const summary = useMemo(() => {
  const byTooth = {};
  for (const t of tooths) {
    const code = String(t.toothCode);
    if (!byTooth[code]) byTooth[code] = { code, items: [], done: 0, pending: 0 };
    byTooth[code].items.push(t);
    if (t.done) byTooth[code].done += 1;
    else byTooth[code].pending += 1;
  }

  const teeth = Object.values(byTooth).sort((a, b) => Number(a.code) - Number(b.code));

  const total = tooths.length;
  const doneTotal = tooths.filter(x => x.done).length;
  const pendingTotal = total - doneTotal;

  return { teeth, total, doneTotal, pendingTotal };
}, [tooths]);

  const ToothBtn = ({ code }) => {
  const st = toothStatus(code);
  const active = selectedTooth === code;

  return (
    <button
      type="button"
      className={
        "tooth-btn" +
        (active ? " is-active" : "") +
        (st.has ? " has" : "") +
        (st.tone === "done" ? " is-done" : "")
      }
      onClick={() => setSelectedTooth(code)}
      title={`Diş ${code}`}
    >
      <div className="tooth-code">{code}</div>

      {st.has && (
        <>
          {/* NET SAYI GÖSTERİMİ */}
          <div className="tooth-count">
            {st.doneCount}/{st.total}
          </div>

          {/* PROGRESS BAR */}
          <div className={`tooth-progress ${st.tone}`}>
            <div
              className="tooth-progressFill"
              style={{ width: `${Math.round(st.ratio * 100)}%` }}
            />
          </div>
        </>
      )}
    </button>
  );
};


  return (
    <div className="patients-root">
      <div className="patients-head">
        <div>
          <h2>🧾 Hasta Detayı</h2>
          <div className="patients-sub">
            <Link to="/panel/patients">← Hastalara dön</Link>
          </div>
        </div>
        <button className="patients-btn" onClick={loadAll} disabled={loading}>
          {loading ? "Yükleniyor…" : "Yenile"}
        </button>
      </div>

      <div className="patients-card">
        {!patient ? (
          <div className="patients-muted">Hasta bulunamadı.</div>
        ) : (
          <>
            <div className="patient-top">
              <div className="patient-kv">
                <div className="k">Ad Soyad</div>
                {edit ? (
                  <input
                    className="patients-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                ) : (
                  <div className="v">{patient.fullName}</div>
                )}
              </div>

              <div className="patient-kv">
                <div className="k">Telefon</div>
                {edit ? (
                  <input
                    className="patients-input"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                ) : (
                  <div className="v">{patient.phone}</div>
                )}
              </div>

              <div className="patient-actions">
                {!edit ? (
                  <button className="patients-btn" onClick={() => setEdit(true)}>
                    Düzenle
                  </button>
                ) : (
                  <>
                    <button
                      className="patients-btn"
                      onClick={async () => {
                        const token = getTokenFromStorage();
                        await apiFetch(`/patients/${id}`, {
                          token,
                          method: "PUT",
                          body: {
                            fullName: editName,
                            phone: editPhone,
                            notes: editNotes,
                          },
                        });
                        setEdit(false);
                        loadAll();
                      }}
                    >
                      Kaydet
                    </button>
                    <button
                      className="patients-btn patients-btn--ghost"
                      onClick={() => {
                        setEdit(false);
                        setEditName(patient.fullName || "");
                        setEditPhone(patient.phone || "");
                        setEditNotes(patient.notes || "");
                      }}
                    >
                      İptal
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="tooth-box">
              <div className="tooth-head">
                <div className="tooth-title">🦷 Diş Şeması</div>
                <button
                  className="patients-btn patients-btn--ghost"
                  onClick={loadToothTreatments}
                  disabled={toothLoading}
                  type="button"
                >
                  {toothLoading ? "Yükleniyor…" : "Yenile"}
                </button>
              </div>

              <div className="tooth-layout">
                <div className="tooth-grid">
                  <div className="tooth-row">
                    {UPPER_RIGHT.map((c) => (
                      <ToothBtn key={c} code={c} />
                    ))}
                    <div className="tooth-gap" />
                    {UPPER_LEFT.map((c) => (
                      <ToothBtn key={c} code={c} />
                    ))}
                  </div>
                  
                  <div className="tooth-row">
                    {LOWER_RIGHT.map((c) => (
                      <ToothBtn key={c} code={c} />
                    ))}
                    <div className="tooth-gap" />
                    {LOWER_LEFT.map((c) => (
                      <ToothBtn key={c} code={c} />
                    ))}
                  </div>
                </div>
                  
                <div className="tooth-panel">
              {/* SOL: FORM */}
              <div className="tooth-form">
                <div className="tooth-formLabel">
                  Seçili diş: <b>{selectedTooth || "—"}</b>
                </div>

                <select
                  className="patients-input"
                  value={selectedProc}
                  onChange={(e) => setSelectedProc(e.target.value)}
                >
                  {PROCEDURES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                  <option value="__custom__">Özel...</option>
                </select>

                {selectedProc === "__custom__" ? (
                  <input
                    className="patients-input"
                    placeholder="Özel müdahale yaz…"
                    value={customProc}
                    onChange={(e) => setCustomProc(e.target.value)}
                  />
                ) : null            }

                <div className="tooth-formBtns">
                  <button className="patients-btn" type="button" onClick={addToothTreatment}>
                    Ekle
                  </button>

                  <button
                    className="patients-btn patients-btn--ghost"
                    type="button"
                    onClick={() => {
                      setSelectedTooth("");
                      setSelectedProc(PROCEDURES[0]);
                      setCustomProc("");
                    }}
                  >
                    Temizle
                  </button>
                </div>
                {selectedTooth && (
              <div className="tooth-miniSummary">
                <div className="mini-title">🦷 Diş {selectedTooth} Özeti</div>

                <div className="mini-stats">
                  <div className="mini-pill ok">
                    ✓ {selectedList.filter(x => x.done).length} tamamlandı
                  </div>
                  <div className="mini-pill wait">
                    ⏳ {selectedList.filter(x => !x.done).length} bekliyor
                  </div>
                </div>

                {selectedList[0] && (
                  <div className="mini-last">
                    <b>Son işlem:</b> {selectedList[0].procedure}
                    <span className="mini-lastStatus">
                      {selectedList[0].done ? "✓ tamamlandı" : "⏳ bekliyor"}
                    </span>
                  </div>
                )}
              </div>
            )           }

              </div>

              {/* ORTA: KAYITLAR */}
              <div className="tooth-list">
                <div className="tooth-listTitle">
                  Kayıtlar {selectedTooth ? `(${selectedTooth})` : ""}
                </div>

                {!selectedTooth ? (
                  <div className="patients-muted">Bir diş seçince burada kayıtlar görünecek.</div>
                ) : !selectedList.length ? (
                  <div className="patients-muted">Bu dişe kayıt yok.</div>
                ) : (
                  <div className="tooth-items">
                    {selectedList.map((t) => (
                      <div key={t.id} className={"tooth-item" + (t.done ? " done" : "")}>
                        <div className="tooth-itemMain">
                          <div className="tooth-itemProc">{t.procedure}</div>
                          <div className="tooth-itemMeta">
                            {t.done ? "✓ tamamlandı" : "⏳ bekliyor"}{" "}
                            <span className="tooth-itemSep">•</span> #{t.id}
                          </div>
                        </div>

                        <div className="tooth-itemBtns">
                          <button
                            className="tooth-miniBtn"
                            type="button"
                            onClick={() => toggleDone(t.id, !t.done)}
                          >
                            {t.done ? "Geri al" : "Tamamlandı"}
                          </button>

                          <button
                            className="tooth-miniBtn danger"
                            type="button"
                            onClick={() => deleteTreatment(t.id)}
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SAĞ: GENEL ÖZET */}
              <div className="tooth-summary">
                <div className="tooth-summaryTitle">📌 Genel Özet</div>
                <div className="tooth-summaryStats">
                  <div className="sum-pill">Toplam: <b>{summary.total}</b></div>
                  <div className="sum-pill ok">Tamamlandı: <b>{summary.doneTotal}</b></div>
                  <div className="sum-pill wait">Bekliyor: <b>{summary.pendingTotal}</b></div>
                </div           >

                {!summary.teeth.length ? (
                  <div className="patients-muted">Henüz hiç diş kaydı yok.</div>
                ) : (
                  <div className="tooth-summaryList">
                    {summary.teeth.map((x) => (
                      <button
                        key={x.code}
                        type="button"
                        className={"tooth-summaryRow" + (selectedTooth === x.code ? " is-active" : "")}
                        onClick={() => setSelectedTooth(x.code)}
                        title={`Diş ${x.code} kayıtlarını aç`}
                      >
                        <div className="ts-left">
                          <div className="ts-code">Diş {x.code}</div>
                          <div className="ts-mini">
                            {x.done} ✓ tamamlandı • {x.pending} ⏳ bekliyor
                          </div>
                        </div>

                        <div className="ts-right">
                          <span className={"ts-badge " + (x.pending ? "wait" : "ok")}>
                            {x.pending ? "Bekliyor" : "Tamamlandı"}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

              </div>
            </div>

            <div className="patient-notesBox">
              <div className="patient-notesTitle">📝 Notlar</div>
              {edit ? (
                <textarea
                  className="patient-notesTextarea"
                  rows={5}
                  placeholder="Örn: Kullanılan ilaçlar, alerji, dikkat edilecek notlar…"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              ) : (
                <div className="patient-notesText">
                  {patient.notes?.trim() ? patient.notes : "Henüz not yok."}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="patients-card">
        <div className="patients-sectionTitle">📅 Randevu Geçmişi</div>

        {!appts.length ? (
          <div className="patients-muted">Kayıt yok.</div>
        ) : (
          <div className="appts-list">
            {appts.map((a) => {
              const proc = splitProcedure(a.procedure);
              return (
                <div key={a.id} className="appts-row">
                  <div className="appts-left">
                    <div className="appts-dt">
                      {a.date} • {timeToHm(a.time)}
                    </div>
                    <div className="appts-meta">
                      <span className="pill pill-doc">{doctorLabel(a.doctorId)}</span>
                      {proc.name ? <span className="pill pill-proc">{proc.name}</span> : null}
                      {proc.minutes ? <span className="pill pill-time">{proc.minutes}</span> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}