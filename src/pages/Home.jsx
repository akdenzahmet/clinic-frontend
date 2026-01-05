import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import logo from "../assets/Klinik.Logo.png";
import klinikAmeliyathane from "../assets/Klinik.Ameliyathane.webp";
import klinikBekleme from "../assets/Klinik.BeklemeSalonu.webp";
import klinikGiris from "../assets/klinik.giriş.webp";
import klinikTabela from "../assets/Klinik.Tabela.png";
import fotoOzgur from "../assets/private/Klinik.Özgür.webp";
import fotoZehra from "../assets/private/Klinik.Zehra.jpeg";

// !HAFTALIK YAP BASINCA GÜNLER CIKSIN 

const WHATSAPP_NUMBER = "90544*******"; 
const WHATSAPP_TEXT =
  "Merhaba, Dt. Zehra Akdeniz Diş Kliniği için randevu almak istiyorum. Uygun saatler hakkında bilgi alabilir miyim?";
const WHATSAPP_URL =
  "https://wa.me/" +
  WHATSAPP_NUMBER +
  "?text=" +
  encodeURIComponent(WHATSAPP_TEXT);

const CLINIC_NAME = "Dt. Zehra Akdeniz Diş Kliniği";
const CITY = "Trabzon / Ortahisar";
const PHONE_TEXT = "(0462) 321 71 09";
const PHONE_TEL = "+9004623217109";
const ADDRESS =
  "Deniz Apartmanı, Kemerkaya, Kunduracılar Cd. No:57 Kat:2, 61200 Ortahisar/Trabzon";

const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(ADDRESS);

export default function Home() {
  const [lightbox, setLightbox] = useState(null); // {src, title} veya null

  return (
    <div className="home-root">
      <div className="home-shell">
        {/* HERO */}
        <section className="home-hero">
          <div className="home-heroLeft">
            <div className="home-kicker">
              <span className="home-tooth">🦷</span>
              <span>{CITY}</span>
            </div>

            <h1 className="home-title">{CLINIC_NAME}</h1>
            <p className="home-subtitle">
              Modern teknoloji, yumuşak yaklaşım. Konforlu bir klinik deneyimiyle sağlıklı gülüşler.
            </p>

            <div className="home-ctaRow">
              <a
              className="home-btn home-btnPrimary"
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
            >
              Randevu Al
            </a> 
              <a className="home-btn home-btnGhost" href={`tel:${PHONE_TEL}`}>
                {PHONE_TEXT}
              </a>      
            </div>

            <div className="home-badgesRow">
              <span className="home-pill">Aynı gün randevu</span>
              <span className="home-pill">Ağrısız yaklaşım</span>
              <span className="home-pill">Güler yüz</span>
            </div>
          </div>

          <div className="home-heroRight">
            <div className="home-heroCard">
              <div
                className="home-heroImage"
                aria-hidden="true"
                style={{
                  display: "grid",
                  placeItems: "center",
                  padding: 18,
                }}
              >
                <img
                  src={logo}
                  alt={`${CLINIC_NAME} logo`}
                  style={{
                    width: 200,
                    height: "auto",
                    borderRadius: 14,
                    boxShadow: "0 16px 45px rgba(0,0,0,0.30)",
                    background: "rgba(255,255,255,0.95)",
                    padding: 10,
                  }}
                />
              </div>

              <div className="home-heroCardText">
                <div className="home-heroCardTitle">Hızlı Bilgi</div>

                <div className="home-heroCardLine">
                  <span className="home-dot" /> {CITY}
                </div>

                <div className="home-heroCardLine">
                  <span className="home-dot" /> Telefon:{" "}
                  <a
                    href={`tel:${PHONE_TEL}`}
                    style={{ color: "inherit", textDecoration: "none", fontWeight: 900 }}
                  >
                    {PHONE_TEXT}
                  </a>
                </div>

                <div className="home-heroCardLine">
                  <span className="home-dot" /> Adres:{" "}
                  <a
                    href={MAPS_URL}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "inherit", textDecoration: "underline" }}
                    title="Google Maps'te aç"
                  >
                    Haritada aç
                  </a>
                </div>

                <div className="home-heroCardLine">
                  <span className="home-dot" /> Online randevu: Panel → Randevular
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section className="home-section">
          <div className="home-sectionTop">
            <h2 className="home-h2">Hizmetler</h2>
            <p className="home-muted">Sık yapılan işlemler</p>
          </div>

          <div className="home-grid">
            <ServiceCard title="Dolgu" desc="Hızlı ve konforlu dolgu uygulamaları." />
            <ServiceCard title="Kanal Tedavisi" desc="Ağrıyı azaltan modern yöntemler." />
            <ServiceCard title="İmplant" desc="Uzun ömürlü ve estetik çözümler." />
            <ServiceCard title="Diş Taşı Temizliği" desc="Düzenli bakım ile sağlıklı diş etleri." />
            <ServiceCard title="Beyazlatma" desc="Daha parlak ve doğal bir gülüş." />
            <ServiceCard title="Çocuk Diş" desc="Çocuklara uygun, yumuşak yaklaşım." />
          </div>
        </section>

        {/* DOCTORS */}
        <section className="home-section">
          <div className="home-sectionTop">
            <h2 className="home-h2">Hekimler</h2>
            <p className="home-muted">Güven ve deneyim</p>
          </div>

          <div className="home-docGrid">
            <DoctorCard name="Dt. Zehra Akdeniz" role="Genel diş hekimi" accent="violet" photo={fotoZehra}/>
            <DoctorCard name="Dt. Özgür Paşaoğlu" role="Genel diş hekimi" accent="blue" photo={fotoOzgur}/>
          </div>
        </section>

        {/* Neden biz yeri */}
        <section className="home-section">
          <div className="home-sectionTop">
            <h2 className="home-h2">Neden Biz?</h2>
            <p className="home-muted">Öne çıkan özelliklerimiz</p>
          </div>
          <div className="home-whyGrid">
            <WhyCard title="Modern Teknoloji" desc="Güncel cihazlarla daha konforlu işlem." />
            <WhyCard title="Yumuşak Yaklaşım" desc="Korkuyu azaltan sakin bir klinik deneyimi." />
            <WhyCard title="Şeffaf Bilgilendirme" desc="İşlem ve süreçler net ve anlaşılır." />
          </div>
        </section>

        {/* Klinik yeri Fotolar vs */}
        <section className="home-section">
          <div className="home-sectionTop">
            <h2 className="home-h2">Kliniğimiz</h2>
            <p className="home-muted">Ortamdan kareler</p>
          </div>

          <div className="home-gallery">
            <GalleryItem
              src={klinikAmeliyathane}
              title="Muayene Odası"
              onOpen={setLightbox}
            />
            <GalleryItem
              src={klinikBekleme}
              title="Bekleme Salonu"
              onOpen={setLightbox}
            />
            <GalleryItem
              src={klinikGiris}
              title="Klinik Girişi"
              onOpen={setLightbox}
            />
            <GalleryItem
              src={klinikTabela}
              title="Tabela"
              onOpen={setLightbox}
            />
          </div>
        </section>

           
        {/* İletişim  */}
        <section className="home-contact">
          <div className="home-contactLeft">
            <h3 className="home-h3">Randevu Al / İletişim</h3>
            <p className="home-muted">
              Şikâyetin varsa randevu oluşturmadan önce de arayıp bilgi alabilirsin.
            </p>

            <div className="home-contactRows">
              <div className="home-contactRow">
                <span className="home-contactLabel">Telefon</span>
                <a className="home-contactValue" href={`tel:${PHONE_TEL}`}>
                  {PHONE_TEXT}
                </a>
              </div>

              <div className="home-contactRow">
                <span className="home-contactLabel">Adres</span>
                <a
                  className="home-contactValue"
                  href={MAPS_URL}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: "underline" }}
                >
                  {ADDRESS}
                </a>
              </div>
            </div>

            <div className="home-ctaRow" style={{ marginTop: 14 }}>
               <a className="home-btn home-btnPrimary" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
                 WhatsApp’tan Randevu Al
               </a>
               <a className="home-btn home-btnGhost" href={`tel:${PHONE_TEL}`}>
                 Hemen Ara
               </a>
              </div>

          </div>

          <div className="home-contactRight">
            <div className="home-mapBox">
              <iframe
                title="Dt. Zehra Akdeniz Diş Kliniği Harita"
                src="https://www.google.com/maps?q=41.00616181234843,39.7290699894344&z=17&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a
                className="home-mapRouteBtn"
                href="https://www.google.com/maps/dir/?api=1&destination=41.00616181234843,39.7290699894344"
                target="_blank"
                rel="noreferrer"
              >
                📍 Google Maps’te Yol Tarifi Al
              </a>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="home-footer">
          <div className="home-footerLeft">
            <div className="home-footerBrand">🦷 {CLINIC_NAME}</div>
            <div className="home-footerMuted">
              {CITY} • {PHONE_TEXT}
            </div>
          </div>
        </footer>
        {/* LIGHTBOX */}
      {lightbox && (
        <div
          className="home-lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(null)}
        >
    <div className="home-lightboxInner" onClick={(e) => e.stopPropagation()}>
      <button
        className="home-lightboxClose"
        onClick={() => setLightbox(null)}
        aria-label="Kapat"
        type="button"
      >
        ✕
      </button>

      <img src={lightbox.src} alt={lightbox.title} />
      <div className="home-lightboxCap">{lightbox.title}</div>
    </div>
  </div>
)}

      </div>
    </div>
  );
}

function ServiceCard({ title, desc }) {
  return (
    <div className="home-card">
      <div className="home-cardTitle">{title}</div>
      <div className="home-cardDesc">{desc}</div>
    </div>
  );
}

function DoctorCard({ name, role, accent, photo }) {
  return (
    <div className={`home-docCard home-docCard--${accent}`}>
      <div className="home-docTop">
        {photo ? (
  <img className="home-avatarImg" src={photo} alt={name} />
) : (
  <div className="home-avatar" aria-hidden="true" />
)}

        <div>
          <div className="home-docName">{name}</div>
          <div className="home-docRole">{role}</div>
        </div>
      </div>

      <div className="home-docMeta">
        <span className="home-docChip">Online randevu açık</span>
        <span className="home-docChip">Nazik yaklaşım</span>
      </div>
    </div>
  );
}

function WhyCard({ title, desc }) {
  return (
    <div className="home-whyCard">
      <div className="home-whyTitle">{title}</div>
      <div className="home-whyDesc">{desc}</div>
    </div>
  );
}
function GalleryItem({ src, title, onOpen }) {
  return (
    <button
      type="button"
      className="home-galleryItem"
      onClick={() => onOpen?.({ src, title })}
      title="Büyüt"
    >
      <img src={src} alt={title} loading="lazy" />
      <div className="home-galleryCap">{title}</div>
    </button>
  );
}
