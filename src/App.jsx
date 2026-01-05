import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Panel from "./pages/Panel";
import Appointments from "./pages/Appointments";
import Patients from "./pages/Patients";
import PatientDetail from "./pages/PatientDetail";

function RequireAuth({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const location = useLocation();

  return (
    <div className="app-root">
      {/* GLOBAL BACKGROUND */}
      <div className="app-bg" aria-hidden="true">
        <div className="app-blob b1" />
        <div className="app-blob b2" />
        <div className="app-blob b3" />
        <div className="app-grain" />
      </div>

      {/* CONTENT LAYER */}
      <div className="app-content">
        <Navbar />

        {/* sayfa geçişi yumuşak yaptık */}
        <div className="route-wrap" key={location.pathname}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/giris" element={<Navigate to="/login" replace />} />

            <Route
              path="/panel"
              element={
                <RequireAuth>
                  <Panel />
                </RequireAuth>
              }
            />
            <Route
              path="/panel/appointments"
              element={
                <RequireAuth>
                  <Appointments />
                </RequireAuth>
              }
            />
            <Route
              path="/panel/patients"
              element={
                <RequireAuth>
                  <Patients />
                </RequireAuth>
              }
            />
            <Route
              path="/panel/patients/:id"
              element={
                <RequireAuth>
                  <PatientDetail />
                </RequireAuth>
              }
            />

            <Route
              path="/randevular"
              element={<Navigate to="/panel/appointments" replace />}
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}
