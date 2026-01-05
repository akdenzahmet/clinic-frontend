import { NavLink, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";
import logo from "../assets/Klinik.Logo.png";
import { getCurrentUser } from "../utils/auth";

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const me = getCurrentUser();

  const address =
    "Deniz Apartmanı, Kemerkaya, Kunduracılar Cd. No:57 Kat:2, 61200 Ortahisar/Trabzon";

  const mapsUrl =
    "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address);

  const isRandevuActive =
    pathname === "/randevular" ||
    pathname.startsWith("/panel/appointments");

  const isPanelActive =
    pathname === "/panel" ||
    pathname.startsWith("/panel/patients");

  const linkClass = (active) => "navbar-link" + (active ? " is-active" : "");

  return (
    <nav className="navbar-root">
      <div className="navbar-left">
        <div
          className="navbar-brand"
          role="link"
          tabIndex={0}
          onClick={() => navigate("/")}
          onKeyDown={(e) => {
            if (e.key === "Enter") navigate("/");
          }}
          style={{ cursor: "pointer" }}
        >
          <img className="navbar-logo" src={logo} alt="Dt. Özgür Paşaoğlu Logo" />

          <div className="navbar-brandText">
            <div className="navbar-title">Dt. Zehra Akdeniz Diş Kliniği</div>

            <div className="navbar-sub">
              <a
                className="navbar-subLink"
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                Trabzon / Ortahisar
              </a>

              <span className="navbar-dot">•</span>

              <a
                className="navbar-subLink"
                href="tel:+904623217109"
                onClick={(e) => e.stopPropagation()}
              >
                (0462) 321 71 09
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="navbar-right">
        {me && (
        <div className="nav-user">
          👋 Hoş geldin, <b>{me.username}</b>
        </div>
        )}
        {/* burada className'i pathname'e göre override ediyoruz */}
        <NavLink to="/randevular" className={() => linkClass(isRandevuActive)}>
          Randevu
        </NavLink>

        <NavLink
          to="/login"
          className={({ isActive }) => linkClass(isActive)}
        >
          Giriş
        </NavLink>
        <NavLink 
        to="/panel" 
        className={() => linkClass(isPanelActive)}>
          Panel
        </NavLink>
      </div>
    </nav>
  );
}
