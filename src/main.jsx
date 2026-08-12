import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// El piloto siempre debe abrir la versión publicada más reciente.
// Retiramos el antiguo modo offline porque podía dejar atrapada la pantalla privada.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  }).catch(() => {});
}

// Limpia solamente archivos antiguos de la aplicación; los datos financieros
// permanecen intactos en localStorage.
if ("caches" in window) {
  caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))).catch(() => {});
}
