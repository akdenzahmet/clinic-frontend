import { useEffect, useMemo, useState } from "react";

/* 09:00–19:00 */
const START_HOUR = 9;
const END_HOUR = 19;

const VISIBLE_DAYS = 3; // ekranda 3 gün göster

function pad2(n) {
  return String(n).padStart(2, "0");
}
function toYmd(d) {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}
function ymdToParts(ymd) {
  const [y, m, d] = ymd.split("-").map((x) => Number(x));
  return { y, m, d };
}
function ymdToDate(ymd) {
  const { y, m, d } = ymdToParts(ymd);
  return new Date(y, m - 1, d);
}
function addDaysYmd(ymd, delta) {
  const d = ymdToDate(ymd);
  d.setDate(d.getDate() + delta);
  return toYmd(d);
}

function startOfWeekMonday(dateObj) {
  const d = new Date(dateObj);
  const day = d.getDay(); // 0=Paz, 1=Pzt...
  const diff = day === 0 ? -6 : 1 - day; // pazarsa pazartesiye geri git
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(dateObj, n) {
  const d = new Date(dateObj);
  d.setDate(d.getDate() + n);
  return d;
}
function toTrShortDay(dateObj) {
  const map = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  return map[dateObj.getDay()];
}
function toDisplayDdMm(ymd) {
  const { m, d } = ymdToParts(ymd);
  return `${pad2(d)}.${pad2(m)}`;
}
function timeToHm(t) {
  if (!t) return "";
  return String(t).slice(0, 5);
}

function hourOf(hm) {
  return Number(hm.slice(0, 2));
}
function buildHours() {
  const arr = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) arr.push(h);
  return arr;
}

export default function AppointmentsWeek({
  apiFetch,
  getToken,
  view,
  date,
  showToast,
  onPickDay,
  onChangeDate,
}) {

  const [loading, setLoading] = useState(false);
  const [weekMap, setWeekMap] = useState(() => new Map());

  // Haftanın 7 günü
  const weekDays = useMemo(() => {
    const base = startOfWeekMonday(ymdToDate(date));
    const list = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(base, i);
      const ymd = toYmd(d);
      list.push({ ymd, dateObj: d });
    }
    return list;
  }, [date]);

  // 3 günlük pencerede başlangıç index'i
  const [startIdx, setStartIdx] = useState(0);

  // date değişince: seçilen gün haftada hangi index'teyse onu ortala
  useEffect(() => {
    const idx = weekDays.findIndex((x) => x.ymd === date);
    const safeIdx = idx === -1 ? 0 : idx;
    let newStart = safeIdx - 1; // ortalamaya çalış
    if (newStart < 0) newStart = 0;
    if (newStart > 7 - VISIBLE_DAYS) newStart = 7 - VISIBLE_DAYS;
    setStartIdx(newStart);
  }, [date, weekDays]);

  const visibleDays = useMemo(() => {
    return weekDays.slice(startIdx, startIdx + VISIBLE_DAYS);
  }, [weekDays, startIdx]);

  const hours = useMemo(() => buildHours(), []);

  async function loadWeek() {
    setLoading(true);
    try {
      const token = getToken?.() || "";
      if (!token) {
        setWeekMap(new Map());
        showToast?.("Token yok. Önce giriş yap.", "warn");
        return;
      }

      const results = await Promise.all(
        weekDays.map(async ({ ymd }) => {
          const q = new URLSearchParams();
          q.set("date", ymd);
          if (view !== "all") q.set("doctorId", view);
          const data = await apiFetch(`/api/appointments?${q.toString()}`, { token });
          return [ymd, Array.isArray(data) ? data : []];
        })
      );

      const m = new Map();
      results.forEach(([ymd, list]) => {
        list.sort((a, b) => timeToHm(a.time).localeCompare(timeToHm(b.time)));
        m.set(ymd, list);
      });

      setWeekMap(m);
    } catch (e) {
      setWeekMap(new Map());
      const payload = e?.payload
        ? typeof e.payload === "string"
          ? e.payload
          : JSON.stringify(e.payload)
        : "";
      showToast?.(`Haftalık çekilemedi. ${payload}`, "danger");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWeek();
  }, [date, view]);

  function doctorBadge(appt) {
    if (appt.doctorId === "male") return "ap-wbadge ap-wbadge--blue";
    if (appt.doctorId === "female") return "ap-wbadge ap-wbadge--violet";
    return "ap-wbadge";
  }
  function doctorText(appt) {
    return appt.doctorId === "male" ? "Özgür" : appt.doctorId === "female" ? "Zehra" : appt.doctorId;
  }

  const canPrev = startIdx > 0;
  const canNext = startIdx < 7 - VISIBLE_DAYS;
function goPrevWeek() {
  onChangeDate?.(addDaysYmd(date, -7));
}

function goNextWeek() {
  onChangeDate?.(addDaysYmd(date, +7));
}


  function goPrev() {
    if (!canPrev) return;
    setStartIdx((x) => Math.max(0, x - 1));
  }
  function goNext() {
    if (!canNext) return;
    setStartIdx((x) => Math.min(7 - VISIBLE_DAYS, x + 1));
  }

  return (
    <section className="ap-week">
      <div className="ap-weekTop">
        <div className="ap-weekTopRow">
          <div>
            <div className="ap-weekTitle">Haftalık Takvim</div>
            <div className="ap-weekHint">
              Gün kutusuna tıkla → otomatik <b>“Gün”</b> görünümüne geçer.
            </div>
            {loading ? <div className="ap-weekLoading">Yükleniyor…</div> : null}
          </div>

          <div className="ap-weekNav" aria-label="Hafta kaydır">
            <button
              type="button"
              className="ap-weekArrow"
              onClick={goPrevWeek}
              title="Önceki hafta"
            >
              «
            </button>

            <button
              type="button"
              className={`ap-weekArrow ${!canPrev ? "is-disabled" : ""}`}
              onClick={goPrev}
              disabled={!canPrev}
              title="Sola kaydır"
            >
              ‹
            </button>

            <div className="ap-weekRange">
              {visibleDays[0]?.ymd ? toDisplayDdMm(visibleDays[0].ymd) : ""}
              {"  "}–{"  "}
              {visibleDays[visibleDays.length - 1]?.ymd
                ? toDisplayDdMm(visibleDays[visibleDays.length - 1].ymd)
                : ""}
            </div>
              
            <button
              type="button"
              className={`ap-weekArrow ${!canNext ? "is-disabled" : ""}`}
              onClick={goNext}
              disabled={!canNext}
              title="Sağa kaydır"
            >
              ›
            </button>
              
            <button
              type="button"
              className="ap-weekArrow"
              onClick={goNextWeek}
              title="Sonraki hafta"
            >
              »
            </button>
          </div>

        </div>
      </div>

      {/* Sadece 3 gün */}
      <div className="ap-weekGrid ap-weekGrid--3">
        {visibleDays.map(({ ymd, dateObj }) => {
          const list = weekMap.get(ymd) || [];
          const count = list.length;

          const byHour = new Map();
          for (const h of hours) byHour.set(h, []);
          for (const a of list) {
            const hm = timeToHm(a.time);
            const h = hourOf(hm);
            if (h >= START_HOUR && h <= END_HOUR) byHour.get(h).push(a);
          }

          return (
              <button
                key={ymd}
                className="ap-dayCard"
                onClick={() => {
                // ikisi de varsa ikisini de çağır, yoksa olanı çağır
                if (onPickDay) onPickDay(ymd);
                if (onPickDate) onPickDate(ymd);
              }}
                type="button"
                title={`${ymd} detayına git`}
              >
              <div className="ap-dayHead">
                <div className="ap-dayLeft">
                  <div className="ap-dayName">{toTrShortDay(dateObj)}</div>
                  <div className="ap-dayDate">{toDisplayDdMm(ymd)}</div>
                </div>

                <div className={`ap-dayCount ${count ? "has" : ""}`}>
                  {count ? `${count} randevu` : "Boş"}
                </div>
              </div>

              <div className="ap-dayBody">
                {hours.map((h) => {
                  const hourItems = byHour.get(h) || [];
                  return (
                    <div key={h} className="ap-hourRow">
                      <div className="ap-hourLabel">{pad2(h)}:00</div>

                      <div className="ap-hourItems">
                        {hourItems.length ? (
                          hourItems.map((a) => (
                            <div key={a.id} className="ap-wAppt">
                              <div className="ap-wApptTop">
                                <span className="ap-wTime">{timeToHm(a.time)}</span>
                                <span className={doctorBadge(a)}>{doctorText(a)}</span>
                              </div>
                              <div className="ap-wMain">
                                <span className="ap-wPatient">{a.patientName || "-"}</span>
                                {a.procedure ? <span className="ap-wProc">• {a.procedure}</span> : null}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="ap-hourEmpty">—</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="ap-dayFoot">Detay için tıkla</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
