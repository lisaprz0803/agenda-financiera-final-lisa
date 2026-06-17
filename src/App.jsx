import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Download,
  Heart,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Plus,
  Sparkles,
  TrendingDown
} from "lucide-react";
import deskCover from "../assets/desk-cover.png";

const STORAGE_KEY = "agenda_financiera_google_user";
const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre"
];

const sections = [
  {
    id: "mapa",
    label: "Mapa",
    icon: LayoutDashboard,
    title: "Mapa de la agenda",
    description: "Elige una sección o usa Siguiente para recorrer el prototipo completo."
  },
  {
    id: "ingresos",
    label: "Ingresos",
    icon: Plus,
    title: "Ingresos",
    description: "Anota tus entradas de dinero y las fechas en que esperas recibirlas."
  },
  {
    id: "pagos",
    label: "Pagos",
    icon: CheckCircle2,
    title: "Pagos del mes",
    description: "Marca lo que ya está pagado y deja a la vista lo que necesita atención."
  },
  {
    id: "presupuesto",
    label: "Presupuesto",
    icon: CircleDollarSign,
    title: "Presupuesto",
    description: "Ordena ingresos, gastos y decisiones antes de que el mes tome velocidad."
  },
  {
    id: "ahorro",
    label: "Ahorro",
    icon: PiggyBank,
    title: "Ahorro",
    description: "Visualiza tu meta y celebra cada avance pequeño sin perder la calma."
  },
  {
    id: "deudas",
    label: "Deudas",
    icon: TrendingDown,
    title: "Deudas",
    description: "Mira tus compromisos con calma y define cuál atender primero."
  },
  {
    id: "cierre",
    label: "Cierre",
    icon: Heart,
    title: "Cierre mensual",
    description: "Registra aprendizajes, logros y ajustes para el próximo ciclo."
  }
];

const quickStats = [
  { label: "Avance", value: "62%", helper: "4 secciones activas" },
  { label: "Meta", value: "$", helper: "Ahorro del mes" },
  { label: "Foco", value: "Calma", helper: "Decidir con claridad" }
];

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function normalizeEmails(config) {
  return Array.isArray(config?.allowedEmails)
    ? config.allowedEmails.map((email) => String(email).trim().toLowerCase()).filter(Boolean)
    : [];
}

function isConfigured(config) {
  const clientId = String(config?.googleClientId || "");
  const emails = normalizeEmails(config);
  return clientId && !clientId.includes("PEGA_AQUI") && emails.length > 0 && !emails.includes("tu-correo@gmail.com");
}

function decodeJwtPayload(token) {
  const payload = token.split(".")[1] || "";
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(normalized)
      .split("")
      .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
      .join("")
  );
  return JSON.parse(json);
}

function useGoogleGate() {
  const [auth, setAuth] = useState({
    ready: false,
    configured: false,
    user: null,
    message: "Preparando acceso..."
  });

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        await loadScript(`${import.meta.env.BASE_URL}auth-config.js`);
        const config = window.AGENDA_AUTH_CONFIG || {};
        const configured = isConfigured(config);

        if (!configured) {
          setAuth({
            ready: true,
            configured: false,
            user: null,
            message: "Falta configurar Google Client ID y correo autorizado."
          });
          return;
        }

        const allowedEmails = normalizeEmails(config);
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        const storedIsAllowed = stored?.email && allowedEmails.includes(String(stored.email).toLowerCase());

        if (active) {
          setAuth({
            ready: true,
            configured: true,
            user: storedIsAllowed ? stored : null,
            message: storedIsAllowed ? "" : "Inicia sesión para entrar."
          });
        }

        await loadScript("https://accounts.google.com/gsi/client");
        if (!active || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: config.googleClientId,
          callback: (response) => {
            try {
              const profile = decodeJwtPayload(response.credential);
              const email = String(profile.email || "").toLowerCase();
              if (allowedEmails.includes(email)) {
                const nextUser = {
                  email,
                  name: profile.name || email,
                  picture: profile.picture || ""
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
                setAuth({ ready: true, configured: true, user: nextUser, message: "" });
                return;
              }
              localStorage.removeItem(STORAGE_KEY);
              setAuth({
                ready: true,
                configured: true,
                user: null,
                message: "Ese correo no tiene acceso a esta agenda."
              });
            } catch {
              setAuth({
                ready: true,
                configured: true,
                user: null,
                message: "No se pudo validar el inicio de sesión. Intenta nuevamente."
              });
            }
          }
        });

        window.google.accounts.id.renderButton(document.getElementById("googleSignInButton"), {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: 280
        });
      } catch {
        if (active) {
          setAuth({
            ready: true,
            configured: false,
            user: null,
            message: "No se pudo cargar la configuración de acceso."
          });
        }
      }
    }

    init();

    return () => {
      active = false;
    };
  }, []);

  function signOut() {
    localStorage.removeItem(STORAGE_KEY);
    if (window.google?.accounts?.id) window.google.accounts.id.disableAutoSelect();
    setAuth((current) => ({ ...current, user: null, message: "Sesión cerrada." }));
  }

  return { ...auth, signOut };
}

function AuthGate({ auth }) {
  return (
    <main className="auth-page">
      <section className="auth-card" aria-label="Acceso privado">
        <img src={deskCover} alt="Papelería rosada con flores, lápiz y símbolos financieros" />
        <div className="eyebrow">
          <Sparkles size={14} />
          Acceso privado
        </div>
        <h1>Finanzas en Calma</h1>
        <p>Inicia sesión con el correo Google autorizado para entrar a tu agenda interactiva.</p>
        <div id="googleSignInButton" className="google-slot" />
        <p className="auth-message">{auth.message}</p>
        {!auth.configured && auth.ready ? (
          <div className="setup-note">
            Edita <code>public/auth-config.js</code> con tu <code>googleClientId</code> y tu correo en{" "}
            <code>allowedEmails</code>. En Google Cloud agrega <code>https://lisaprz0803.github.io</code> como
            origen autorizado.
          </div>
        ) : null}
      </section>
    </main>
  );
}

function StatStrip() {
  return (
    <div className="stat-strip" aria-label="Resumen">
      {quickStats.map((stat) => (
        <div className="stat" key={stat.label}>
          <span>{stat.label}</span>
          <strong>{stat.value}</strong>
          <small>{stat.helper}</small>
        </div>
      ))}
    </div>
  );
}

function Cover({ onStart }) {
  return (
    <section className="cover-screen">
      <div className="cover-media">
        <img src={deskCover} alt="Papelería rosada con flores, lápiz y símbolos financieros" />
      </div>
      <div className="cover-copy">
        <div className="icon-row" aria-hidden="true">
          <LayoutDashboard size={18} />
          <Sparkles size={18} />
          <Heart size={18} />
        </div>
        <h1>Finanzas en Calma</h1>
        <p className="subtitle">Agenda financiera personal</p>
        <p className="quote">Organizar tus finanzas también es una forma de cuidarte.</p>
        <p className="intro">Un espacio para mirar tu dinero con más claridad, calma y confianza.</p>
        <button className="primary-action" type="button" onClick={onStart}>
          <Sparkles size={16} />
          Comenzar
        </button>
      </div>
    </section>
  );
}

function Sidebar({ activeSection, month, year, progress, onMonth, onSection }) {
  return (
    <aside className="sidebar">
      <div className="month-card">
        <button className="round-button" type="button" onClick={() => onMonth(-1)} aria-label="Mes anterior">
          <ChevronLeft size={17} />
        </button>
        <div>
          <span>Plan mensual</span>
          <strong>
            {monthNames[month]} {year}
          </strong>
        </div>
        <button className="round-button" type="button" onClick={() => onMonth(1)} aria-label="Mes siguiente">
          <ChevronRight size={17} />
        </button>
      </div>

      <nav className="section-nav" aria-label="Secciones de agenda">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              className={activeSection === section.id ? "active" : ""}
              type="button"
              onClick={() => onSection(section.id)}
            >
              <Icon size={17} />
              {section.label}
            </button>
          );
        })}
      </nav>

      <div className="progress-card">
        <div>
          <span>Avance del prototipo</span>
          <strong>{progress}%</strong>
        </div>
        <div className="progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
    </aside>
  );
}

function PlannerPanel({ activeSection, onSection }) {
  const section = sections.find((item) => item.id === activeSection);
  const Icon = section.icon;

  return (
    <article className="planner-panel">
      <header className="panel-header">
        <div className="title-lockup">
          <div className="title-icon">
            <Icon size={22} />
          </div>
          <div>
            <h2>{section.title}</h2>
            <p>{section.description}</p>
          </div>
        </div>
        <button className="utility-button" type="button" onClick={() => window.print()}>
          <Download size={16} />
          Imprimir
        </button>
      </header>

      <div className="panel-body">
        {activeSection === "mapa" ? <MapSection onSection={onSection} /> : null}
        {activeSection === "ingresos" ? <IncomeSection /> : null}
        {activeSection === "pagos" ? <PaymentsSection /> : null}
        {activeSection === "presupuesto" ? <BudgetSection /> : null}
        {activeSection === "ahorro" ? <SavingsSection /> : null}
        {activeSection === "deudas" ? <DebtSection /> : null}
        {activeSection === "cierre" ? <CloseSection /> : null}
      </div>
    </article>
  );
}

function MapSection({ onSection }) {
  return (
    <div className="tile-grid">
      {sections.slice(1).map((section) => {
        const Icon = section.icon;
        return (
          <button className="feature-tile" key={section.id} type="button" onClick={() => onSection(section.id)}>
            <span>
              <Icon size={24} />
            </span>
            <strong>{section.label}</strong>
            <p>{section.description}</p>
          </button>
        );
      })}
    </div>
  );
}

function IncomeSection() {
  const rows = ["Sueldo / honorarios", "Ventas / servicios", "Ingreso extra"];
  return (
    <div className="stack">
      <div className="soft-table header">
        <strong>Fuente</strong>
        <strong>Monto</strong>
        <strong>Fecha</strong>
      </div>
      {rows.map((row, index) => (
        <div className="soft-table" key={row}>
          <span>{row}</span>
          <input aria-label={`Monto ${row}`} placeholder="$" inputMode="decimal" />
          <input aria-label={`Fecha ${row}`} placeholder={index === 0 ? "05" : "--"} />
        </div>
      ))}
      <div className="total-card">
        <span>Total estimado</span>
        <strong>$</strong>
      </div>
    </div>
  );
}

function PaymentsSection() {
  const payments = ["Arriendo / dividendo", "Luz, agua y gas", "Internet y teléfono", "Tarjetas / créditos", "Otros compromisos"];
  return (
    <div className="stack">
      {payments.map((payment, index) => (
        <label className="check-row" key={payment}>
          <input type="checkbox" defaultChecked={index === 0} />
          <span>{payment}</span>
          <input aria-label={`Monto ${payment}`} placeholder="$" inputMode="decimal" />
        </label>
      ))}
    </div>
  );
}

function BudgetSection() {
  return (
    <div className="form-grid">
      <Field label="Ingresos esperados" placeholder="$" />
      <Field label="Gastos fijos" placeholder="$" />
      <Field label="Gastos variables" placeholder="$" />
      <Field label="Meta del mes" placeholder="Ej: ahorrar 10%" />
      <Field label="Notas importantes" placeholder="Recordatorios, fechas o decisiones" wide />
    </div>
  );
}

function SavingsSection() {
  const [filled, setFilled] = useState(4);
  return (
    <div className="savings-layout">
      <Field label="Objetivo de ahorro" placeholder="Ej: fondo de emergencia" wide />
      <div className="coin-grid" aria-label="Progreso de ahorro">
        {Array.from({ length: 10 }, (_, index) => (
          <button
            className={index < filled ? "coin filled" : "coin"}
            key={index}
            type="button"
            onClick={() => setFilled(index + 1)}
            aria-label={`Marcar ahorro ${index + 1}`}
          />
        ))}
      </div>
      <div className="insight-card">
        <PiggyBank size={20} />
        <span>{filled * 10}% de avance visual</span>
      </div>
    </div>
  );
}

function DebtSection() {
  const rows = ["Tarjeta principal", "Crédito / préstamo", "Compra en cuotas"];
  return (
    <div className="stack">
      <div className="soft-table header">
        <strong>Deuda</strong>
        <strong>Cuota</strong>
        <strong>Estado</strong>
      </div>
      {rows.map((row) => (
        <div className="soft-table" key={row}>
          <span>{row}</span>
          <input aria-label={`Cuota ${row}`} placeholder="$" inputMode="decimal" />
          <span className="pill">Revisar</span>
        </div>
      ))}
      <Field label="Prioridad del mes" placeholder="Ej: pagar tarjeta antes del 20" wide />
    </div>
  );
}

function CloseSection() {
  return (
    <div className="stack">
      <textarea className="reflection" placeholder="Este mes me sentí..." />
      <div className="form-grid">
        <Field label="Logro financiero" placeholder="Lo que sí funcionó" />
        <Field label="Ajuste para el próximo mes" placeholder="Algo que quiero cambiar" />
      </div>
    </div>
  );
}

function Field({ label, placeholder, wide = false }) {
  return (
    <label className={wide ? "field wide" : "field"}>
      <span>{label}</span>
      <input placeholder={placeholder} />
    </label>
  );
}

function AppShell({ auth }) {
  const [current, setCurrent] = useState("cover");
  const [month, setMonth] = useState(5);
  const [year, setYear] = useState(2026);

  const order = useMemo(() => ["cover", ...sections.map((section) => section.id)], []);
  const pageIndex = order.indexOf(current);
  const activeSection = current === "cover" ? "mapa" : current;
  const progress = Math.round(((pageIndex + 1) / order.length) * 100);

  function changeMonth(delta) {
    setMonth((value) => {
      const next = value + delta;
      if (next < 0) {
        setYear((currentYear) => currentYear - 1);
        return 11;
      }
      if (next > 11) {
        setYear((currentYear) => currentYear + 1);
        return 0;
      }
      return next;
    });
  }

  function move(delta) {
    const nextIndex = Math.max(0, Math.min(order.length - 1, pageIndex + delta));
    setCurrent(order[nextIndex]);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <Sparkles size={16} />
          Finanzas en Calma
        </div>
        <nav className="topnav" aria-label="Navegación principal">
          <button className={current === "cover" ? "active" : ""} type="button" onClick={() => setCurrent("cover")}>
            Inicio
          </button>
          {sections.slice(2, 5).map((section) => (
            <button
              className={current === section.id ? "active" : ""}
              key={section.id}
              type="button"
              onClick={() => setCurrent(section.id)}
            >
              {section.label}
            </button>
          ))}
          <button className={current === "cierre" ? "active" : ""} type="button" onClick={() => setCurrent("cierre")}>
            Cierre
          </button>
        </nav>
        <div className="session">
          <span>{auth.user?.email}</span>
          <button type="button" onClick={auth.signOut} aria-label="Cerrar sesión">
            <LogOut size={15} />
          </button>
        </div>
      </header>

      <main className="workspace">
        {current === "cover" ? (
          <>
            <Cover onStart={() => setCurrent("mapa")} />
            <StatStrip />
          </>
        ) : (
          <section className="planner-grid">
            <Sidebar
              activeSection={activeSection}
              month={month}
              year={year}
              progress={progress}
              onMonth={changeMonth}
              onSection={setCurrent}
            />
            <PlannerPanel activeSection={activeSection} onSection={setCurrent} />
          </section>
        )}
      </main>

      <footer className="pager">
        <button type="button" onClick={() => move(-1)}>
          <ArrowLeft size={15} />
          Anterior
        </button>
        <span>
          {pageIndex + 1} / {order.length}
        </span>
        <button type="button" onClick={() => move(1)}>
          Siguiente
          <ArrowRight size={15} />
        </button>
      </footer>
    </div>
  );
}

export default function App() {
  const auth = useGoogleGate();

  if (!auth.user) {
    return <AuthGate auth={auth} />;
  }

  return <AppShell auth={auth} />;
}
