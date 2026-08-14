import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import { BACKUP_KEY, DATA_VERSION, createAutomaticBackup, migrateStore, readSafeStore } from "./dataSafety.js";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Download,
  Heart,
  HelpCircle,
  Loader2,
  LayoutDashboard,
  Menu,
  Pencil,
  Copy,
  Mail,
  MessageCircle,
  Search,
  Upload,
  LogOut,
  PiggyBank,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  TrendingDown
  ,X
} from "lucide-react";
import heroPlanner from "../assets/hero-plata.jpg";
import coverPiggy from "../assets/cover-piggy.jpeg";
import paymentTerminal from "../assets/payment-terminal.jpeg";
import sharedMoney from "../assets/shared-money.jpeg";
import budgetDesk from "../assets/budget-desk.jpeg";
import savingsPig from "../assets/savings-pig.jpeg";
import financePlan from "../assets/finance-plan.jpeg";
import moneyHandoff from "../assets/money-handoff.jpeg";
import cardTerminal from "../assets/card-terminal.jpeg";
import piggyCalculator from "../assets/piggy-calculator.jpeg";
import piggyPlant from "../assets/piggy-plant.jpeg";
import plannerBanner from "../assets/planner-banner-v2.jpg";
import heroCoverPremium from "../assets/hero-cover-premium.png";
import sharedBanner from "../assets/shared-banner-v2.jpg";
import monthRouteBanner from "../assets/month-route-banner.png";
import incomeBanner from "../assets/income-banner.jpg";
import paymentsBanner from "../assets/payments-banner.jpg";
import debtBanner from "../assets/debt-banner.jpg";
import dailyBanner from "../assets/daily-banner.jpg";
import calendarBanner from "../assets/calendar-banner.jpg";
import closeBanner from "../assets/close-banner.jpg";
import dailyExpensesOriginal from "../assets/daily-expenses-original.png";
import budgetDistributionOriginal from "../assets/budget-distribution-original.png";
import visualBudget from "../assets/visual-budget.svg";
import visualChecklist from "../assets/visual-checklist.svg";
import visualClose from "../assets/visual-close.svg";
import visualMap from "../assets/visual-map.svg";
import visualPayments from "../assets/visual-payments.svg";
import visualSavings from "../assets/visual-savings.svg";

const STORAGE_KEY = "agenda_financiera_google_user";
const CHECKLIST_STORAGE_KEY = "agenda_financiera_checklist";
const MONTHLY_STORE_KEY = "agenda_financiera_monthly_data";
const DEFAULT_SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const DEFAULT_SPREADSHEET_ID = "1GRYY_e_2jf9525UWyZO_gPm9_BE8dZuWf7XWwn7iMEk";
const RANGE_MAP = {
  ingresos: "Ingresos!A4:E8",
  pagos: "'Pagos Mensuales'!A4:H16",
  gastos: "'Gastos Diarios'!A4:F200",
  ahorros: "Ahorros!A4:E9"
};
const SHEET_TITLES = {
  ingresos: "Ingresos",
  pagos: "Pagos Mensuales",
  gastos: "Gastos Diarios",
  ahorros: "Ahorros"
};
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
    id: "checklist",
    label: "1. Por dónde empezar",
    icon: CheckCircle2,
    title: "Tu ruta del mes",
    description: "Mira primero qué debes completar y marca cada paso a medida que avanzas.",
    message: "No tienes que hacerlo todo hoy: sigue esta ruta, un paso a la vez."
  },
  {
    id: "configuracion",
    label: "2. Configuración",
    icon: LayoutDashboard,
    title: "Configura tu mes",
    description: "Comienza con tu nombre y decide si usarás la agenda de forma individual o compartida.",
    message: "Paso 1: primero dale un nombre a tu espacio y elige cómo organizarás el mes."
  },
  {
    id: "ingresos",
    label: "3. Ingresos",
    icon: Plus,
    title: "Ingresos",
    description: "Anota tus entradas de dinero y las fechas en que esperas recibirlas.",
    message: "Este mes quiero saber dónde se fue mi plata, sin drama."
  },
  {
    id: "pagos",
    label: "4. Pagos",
    icon: CheckCircle2,
    title: "Pagos del mes",
    description: "Marca lo que ya está pagado y deja a la vista lo que necesita atención.",
    message: "Lo que se anota deja de dar vueltas en la cabeza."
  },
  {
    id: "hogar",
    label: "5. Compartido",
    icon: Heart,
    title: "Finanzas compartidas",
    description: "Divide gastos entre una y cuatro personas y descubre quién tiene saldo pendiente o a favor.",
    message: "Compartir las cuentas también puede sentirse claro, justo y liviano."
  },
  {
    id: "deudas",
    label: "6. Deudas",
    icon: TrendingDown,
    title: "Deudas",
    description: "Mira tus compromisos con claridad y define cuál atender primero.",
    message: "Cada gasto cuenta una historia. Mirarlo con honestidad también es avanzar."
  },
  {
    id: "ahorro",
    label: "7. Ahorro",
    icon: PiggyBank,
    title: "Ahorro",
    description: "Visualiza tu meta y celebra cada avance pequeño sin perder el hilo.",
    message: "Ahorrar aunque sea poco sigue siendo elegirte."
  },
  {
    id: "gastos",
    label: "8. Gastos diarios",
    icon: TrendingDown,
    title: "Gastos diarios",
    description: "Registra supermercado, transporte, salidas y compras pequeñas durante el mes.",
    message: "Anotar sin juzgar te ayuda a entender tus hábitos y decidir mejor."
  },
  {
    id: "presupuesto",
    label: "9. Presupuesto",
    icon: CircleDollarSign,
    title: "Tu presupuesto disponible",
    description: "Revisa cuánto entra, cuánto está comprometido y cuánto te va quedando.",
    message: "Ahora que ya anotaste lo importante, puedes ver tu dinero con más claridad."
  },
  {
    id: "calendario",
    label: "10. Calendario",
    icon: CalendarDays,
    title: "Calendario y pendientes",
    description: "Revisa pagos con fecha, recordatorios y tareas que aún necesitan atención.",
    message: "Lo que tiene fecha pesa menos en la cabeza."
  },
  {
    id: "cierre",
    label: "11. Cierre",
    icon: Heart,
    title: "Cierre mensual",
    description: "Registra aprendizajes, logros y ajustes para el próximo ciclo.",
    message: "Mirar hacia atrás también te ayuda a avanzar."
  }
];

const sectionBanners = {
  checklist: { image: monthRouteBanner, alt: "Camino financiero con etapas de hogar, equilibrio, crecimiento y meta" },
  configuracion: { image: plannerBanner, alt: "Plan financiero con café, cuaderno y gráficos" },
  ingresos: { image: incomeBanner, alt: "Entrega de dinero entre dos personas" },
  pagos: { image: paymentsBanner, alt: "Terminal de pago con tarjeta, efectivo y recibo" },
  hogar: { image: sharedBanner, alt: "Una persona entregando dinero a otra" },
  deudas: { image: debtBanner, alt: "Tarjeta, dinero y terminal de pago" },
  ahorro: { image: savingsPig, alt: "Alcancía rosa sobre un plan de ahorro" },
  gastos: { image: dailyExpensesOriginal, alt: "Compras cotidianas, recibo, monedas y calculadora" },
  presupuesto: { image: budgetDistributionOriginal, alt: "Frascos pastel para distribuir el presupuesto" },
  calendario: { image: calendarBanner, alt: "Alcancía junto a plantas, monedas y gráficos" },
  cierre: { image: closeBanner, alt: "Hoja de cierre mensual con estrella y líneas de reflexión" }
};

const quickStats = [
  { label: "Avance", value: "62%", helper: "8 secciones activas" },
  { label: "Meta", value: "$", helper: "Ahorro del mes" },
  { label: "Tranquilidad", value: "Orden", helper: "Menos enredo mental" }
];

const checklistItems = [
  { id: "setup", label: "Elegir modo individual o compartido", section: "configuracion", action: "Configurar ahora" },
  { id: "income", label: "Agregar mis ingresos", section: "ingresos", action: "Agregar ingreso" },
  { id: "payments", label: "Registrar pagos importantes", section: "pagos", action: "Registrar pago" },
  { id: "debts", label: "Anotar mis deudas", section: "deudas", action: "Agregar deuda" },
  { id: "savings", label: "Crear una meta de ahorro", section: "ahorro", action: "Crear meta" },
  { id: "budget", label: "Revisar mi presupuesto disponible", section: "presupuesto", action: "Ver presupuesto" },
  { id: "expenses", label: "Registrar gastos diarios", section: "gastos", action: "Agregar gasto" },
  { id: "close", label: "Hacer el cierre del mes", section: "cierre", action: "Cerrar el mes" }
];

const statusOptions = ["Pagado", "Pendiente", "Por revisar"];
function getStatusClass(value) {
  if (value === "Pagado") return "status-paid";
  if (value === "Pendiente") return "status-pending";
  return "status-review";
}
const categoryOptions = [
  "Vivienda",
  "Servicios",
  "Supermercado",
  "Transporte",
  "Familia",
  "Familia / hijos",
  "Bebé",
  "Personal",
  "Ahorro",
  "Salud",
  "Educación",
  "Deudas",
  "Otro"
];
const categoryStickerMap = {
  Vivienda: { icon: "🏠", tone: "rose" },
  Servicios: { icon: "💡", tone: "gold" },
  Supermercado: { icon: "🛒", tone: "peach" },
  Transporte: { icon: "🚌", tone: "mint" },
  Familia: { icon: "💞", tone: "rose" },
  "Familia / hijos": { icon: "🧸", tone: "peach" },
  Bebé: { icon: "🍼", tone: "sky" },
  Personal: { icon: "✨", tone: "lilac" },
  Ahorro: { icon: "🐷", tone: "mint" },
  Salud: { icon: "🩺", tone: "sky" },
  Educación: { icon: "🎒", tone: "rose" },
  Deudas: { icon: "💳", tone: "lilac" },
  Otro: { icon: "🛍️", tone: "peach" }
};

function CategorySticker({ category, compact = false }) {
  const sticker = categoryStickerMap[category] || categoryStickerMap.Otro;
  return <span className={`category-sticker ${sticker.tone} ${compact ? "compact" : ""}`} aria-label={`Categoría ${category || "Otro"}`} title={category || "Otro"}><i>{sticker.icon}</i>{compact ? null : <b>{category || "Otro"}</b>}</span>;
}
const paymentMethodOptions = ["Transferencia", "Débito", "Crédito", "Efectivo", "Cheques", "Pago web", "Otro"];
const paymentDateOptions = [
  "Día 1",
  "Día 5",
  "Día 10",
  "Día 15",
  "Día 20",
  "Día 25",
  "Día 30",
  "Quincena",
  "Automático",
  "Variable"
];
const progressStickers = [
  { icon: "🌸", label: "Avance suave" },
  { icon: "💸", label: "Pagado a tiempo" },
  { icon: "🐷", label: "Ahorro separado" },
  { icon: "✨", label: "Logro bonito" },
  { icon: "⚠️", label: "Pendiente importante" },
  { icon: "💜", label: "Me cuidé" },
  { icon: "🎯", label: "Meta clara" }
];
const reminderStickers = ["💸", "⚠️", "✅", "💜"];
const rowTemplates = {
  ingresos: ["", new Date().toISOString().slice(0, 10), "", "Por revisar", ""],
  pagos: ["Servicios", "", new Date().toISOString().slice(0, 10), "", "", "", "Pendiente", "Transferencia"],
  ahorros: ["", "", "", "", ""],
  gastos: [new Date().toISOString().slice(0, 10), "", "Servicios", "", "Transferencia", ""]
};

const defaultHousehold = {
  mode: "individual",
  currency: "CLP",
  members: [{ id: "persona-1", name: "Persona 1" }],
  expenses: [],
  debts: [],
  closeNotes: { achievement: "", adjustment: "", worthwhile: "", intention: "" }
};

function normalizeHousehold(value) {
  const members = Array.isArray(value?.members) && value.members.length
    ? value.members.slice(0, 4).map((member, index) => ({
        id: String(member.id || `persona-${index + 1}`),
        name: member.name === undefined || member.name === null
          ? `Persona ${index + 1}`
          : String(member.name)
      }))
    : defaultHousehold.members;
  const memberIds = new Set(members.map((member) => member.id));
  const expenses = Array.isArray(value?.expenses)
    ? value.expenses.map((expense) => ({
        id: String(expense.id || `${Date.now()}-${Math.random()}`),
        concept: String(expense.concept || ""),
        category: String(expense.category || "Otro"),
        date: String(expense.date || ""),
        amount: Number(expense.amount) || 0,
        paidBy: expense.paidBy === "shared" || memberIds.has(expense.paidBy) ? expense.paidBy : members[0].id,
        status: String(expense.status || "Pendiente"),
        shares: Object.fromEntries(members.map((member) => [member.id, Number(expense.shares?.[member.id]) || 0]))
      }))
    : [];
  const debts = Array.isArray(value?.debts) ? value.debts.map((debt) => ({
    id: String(debt.id || `${Date.now()}-${Math.random()}`),
    name: String(debt.name || ""),
    total: Number(debt.total) || 0,
    installment: Number(debt.installment) || 0,
    installmentsTotal: Number(debt.installmentsTotal) || 0,
    installmentsPaid: Number(debt.installmentsPaid) || 0,
    nextDate: String(debt.nextDate || ""),
    status: statusOptions.includes(debt.status) ? debt.status : "Por revisar",
    priority: String(debt.priority || "Media")
  })) : [];
  const currency = ["CLP", "USD", "EUR", "ARS", "MXN"].includes(value?.currency) ? value.currency : "CLP";
  const closeNotes = {
    achievement: String(value?.closeNotes?.achievement || ""),
    adjustment: String(value?.closeNotes?.adjustment || ""),
    worthwhile: String(value?.closeNotes?.worthwhile || ""),
    intention: String(value?.closeNotes?.intention || "")
  };
  return { mode: value?.mode === "shared" ? "shared" : "individual", currency, members, expenses, debts, closeNotes };
}

function getHouseholdBalances(household) {
  const balances = Object.fromEntries(household.members.map((member) => [member.id, 0]));
  household.expenses.forEach((expense) => {
    const amount = Number(expense.amount) || 0;
    if (expense.paidBy === "shared") return;
    if (balances[expense.paidBy] !== undefined) balances[expense.paidBy] += amount;
    household.members.forEach((member) => {
      balances[member.id] -= Number(expense.shares?.[member.id]) || 0;
    });
  });
  return balances;
}

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

function isFirebaseConfigured(config) {
  return Boolean(config?.apiKey && config?.projectId && !String(config.apiKey).includes("PEGA_AQUI"));
}

async function getFirebaseDb() {
  await loadScript(`${import.meta.env.BASE_URL}firebase-config.js`).catch(() => {});
  const config = window.AGENDA_FIREBASE_CONFIG || {};
  if (!isFirebaseConfigured(config)) return null;
  const app = getApps().length ? getApps()[0] : initializeApp(config);
  return getFirestore(app);
}

function getMonthKey(month, year) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function getUserKey(auth) {
  return String(auth.user?.email || "piloto-nuevo").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
}

function readLocalMonth(userKey, monthKey) {
  try {
    const { data: allData } = readSafeStore(localStorage, MONTHLY_STORE_KEY);
    return allData[userKey]?.[monthKey] || null;
  } catch {
    return null;
  }
}

function writeLocalMonth(userKey, monthKey, payload) {
  try {
    const { data: allData } = readSafeStore(localStorage, MONTHLY_STORE_KEY);
    const userData = allData[userKey] || {};
    localStorage.setItem(MONTHLY_STORE_KEY, JSON.stringify({ ...allData, [userKey]: { ...userData, [monthKey]: { ...payload, dataVersion: DATA_VERSION } } }));
  } catch {
    // Local persistence is best effort.
  }
}

function removeLocalMonth(userKey, monthKey) {
  try {
    createAutomaticBackup(localStorage, MONTHLY_STORE_KEY, `antes de borrar ${monthKey}`);
    const { data: allData } = readSafeStore(localStorage, MONTHLY_STORE_KEY);
    if (allData[userKey]) delete allData[userKey][monthKey];
    localStorage.setItem(MONTHLY_STORE_KEY, JSON.stringify(allData));
  } catch {
    // Local cleanup is best effort.
  }
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
  const tokenClientRef = useRef(null);
  const configRef = useRef(null);
  const [auth, setAuth] = useState({
    ready: false,
    configured: false,
    user: null,
    accessToken: "",
    spreadsheetId: DEFAULT_SPREADSHEET_ID,
    message: "Preparando acceso..."
  });

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        await loadScript(`${import.meta.env.BASE_URL}auth-config.js`);
        const config = window.AGENDA_AUTH_CONFIG || {};
        configRef.current = config;
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
            accessToken: "",
            spreadsheetId: config.spreadsheetId || DEFAULT_SPREADSHEET_ID,
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
                setAuth({
                  ready: true,
                  configured: true,
                  user: nextUser,
                  accessToken: "",
                  spreadsheetId: config.spreadsheetId || DEFAULT_SPREADSHEET_ID,
                  message: ""
                });
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

        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: config.googleClientId,
          scope: config.sheetsScope || DEFAULT_SHEETS_SCOPE,
          callback: (response) => {
            if (response.error) {
              setAuth((current) => ({
                ...current,
                accessToken: "",
                message: "No se pudo autorizar Google Sheets."
              }));
              return;
            }
            setAuth((current) => ({
              ...current,
              accessToken: response.access_token || "",
              message: response.access_token ? "" : "No se recibió token de Google Sheets."
            }));
          }
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
    setAuth((current) => ({ ...current, user: null, accessToken: "", message: "Sesión cerrada." }));
  }

  function requestSheetsAccess() {
    if (!tokenClientRef.current) {
      setAuth((current) => ({ ...current, message: "Google Sheets aún se está preparando. Intenta nuevamente." }));
      return;
    }
    tokenClientRef.current.requestAccessToken({ prompt: auth.accessToken ? "" : "consent" });
  }

  return { ...auth, signOut, requestSheetsAccess, config: configRef.current };
}

function emptySheetData() {
  return {
    ingresos: [],
    pagos: [],
    gastos: [],
    ahorros: []
  };
}

function normalizeRows(rows = [], length = 0) {
  return rows.map((row) => Array.from({ length }, (_, index) => row[index] ?? ""));
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function findOption(value, options, fallback = "Otro") {
  const normalized = normalizeText(value);
  return options.find((option) => normalizeText(option) === normalized) || fallback;
}

function detectPaymentMethod(value) {
  const text = normalizeText(value);
  if (!text) return "Transferencia";
  if (text.includes("transfer")) return "Transferencia";
  if (text.includes("debito")) return "Débito";
  if (text.includes("credito") || text.includes("tc") || text.includes("lider")) return "Crédito";
  if (text.includes("efectivo")) return "Efectivo";
  if (text.includes("cheque")) return "Cheques";
  if (text.includes("web") || text.includes("unired")) return "Pago web";
  return findOption(value, paymentMethodOptions, "Otro");
}

function parseMoney(value) {
  const cleaned = String(value || "").replace(/[^\d-]/g, "");
  return Number(cleaned) || 0;
}

function formatMoneyEntry(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits ? new Intl.NumberFormat("es-CL").format(Number(digits)) : "";
}

function formatCurrency(value, currency) {
  const selectedCurrency = currency || (typeof localStorage !== "undefined" ? localStorage.getItem("agenda_financiera_currency") : "CLP") || "CLP";
  const numericValue = typeof value === "number" ? value : parseMoney(value);
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: selectedCurrency,
    maximumFractionDigits: 0
  }).format(numericValue || 0);
}

function getRealProgress(sheetDb) {
  const completed = [
    Boolean(sheetDb.household.members[0]?.name && sheetDb.household.members[0].name !== "Persona 1"),
    sheetDb.draft.ingresos.some((row) => parseMoney(row[2]) > 0),
    sheetDb.draft.pagos.some((row) => parseMoney(row[4] || row[3]) > 0),
    sheetDb.household.debts.length > 0,
    sheetDb.draft.ahorros.some((row) => parseMoney(row[1]) > 0),
    sheetDb.draft.ingresos.some((row) => parseMoney(row[2]) > 0) && (sheetDb.draft.pagos.length > 0 || sheetDb.draft.gastos.length > 0),
    sheetDb.draft.gastos.some((row) => parseMoney(row[3]) > 0),
    Boolean(sheetDb.reflection.trim())
  ];
  return Math.round((completed.filter(Boolean).length / completed.length) * 100);
}

function getFinancialSummary(draft) {
  const incomeTotal = draft.ingresos.reduce((sum, row) => sum + parseMoney(row[2]), 0);
  const monthlyPayments = draft.pagos.reduce((sum, row) => sum + parseMoney(row[4] || row[3]), 0);
  const dailyExpenses = draft.gastos.reduce((sum, row) => sum + parseMoney(row[3]), 0);
  const savingsTarget = draft.ahorros.reduce((sum, row) => sum + parseMoney(row[1]), 0);
  const savingsSaved = draft.ahorros.reduce((sum, row) => sum + parseMoney(row[2]), 0);
  const projectedBalance = incomeTotal - monthlyPayments - dailyExpenses - savingsSaved;
  const savingsGap = Math.max(0, savingsTarget - savingsSaved);
  const savingsProgress = savingsTarget
    ? Math.min(100, Math.round((savingsSaved / savingsTarget) * 100))
    : Number(String(draft.ahorros[0]?.[3] || "0").replace("%", "")) || 0;

  return {
    incomeTotal,
    monthlyPayments,
    dailyExpenses,
    savingsTarget,
    savingsSaved,
    savingsGap,
    savingsProgress,
    projectedBalance
  };
}

function hasMeaningfulPayment(row) {
  return Boolean(String(row?.[1] || "").trim() || parseMoney(row?.[4] || row?.[3]));
}

function getBalanceStatus(value) {
  if (value > 0) return { label: "Saldo a favor", helper: "Después de cubrir lo planificado, este dinero quedaría disponible.", tone: "positive" };
  if (value < 0) return { label: "Saldo en contra", helper: "Tus compromisos superan tus ingresos. Revisa pagos, gastos o ahorro.", tone: "negative" };
  return { label: "Saldo equilibrado", helper: "Tus ingresos y compromisos están nivelados.", tone: "neutral" };
}

function parseSheetValues(payload) {
  const ranges = payload.valueRanges || [];
  return cleanDraftData({
    ingresos: normalizeRows(ranges[0]?.values?.slice(1), 5),
    pagos: normalizeRows(ranges[1]?.values?.slice(1), 8),
    gastos: normalizeRows(ranges[2]?.values?.slice(1), 6).filter((row) => row.some(Boolean)),
    ahorros: normalizeRows(ranges[3]?.values?.slice(1), 5)
  });
}

function cleanDraftData(data = emptySheetData()) {
  return {
    ingresos: normalizeRows(data.ingresos || [], 5),
    pagos: normalizeRows(data.pagos || [], 8).filter(
      (row) => !normalizeText(row.join(" ")).includes("transferencia a mama")
    ),
    gastos: normalizeRows(data.gastos || [], 6).filter((row) => row.some(Boolean)),
    ahorros: normalizeRows(data.ahorros || [], 5)
  };
}

async function sheetsRequest({ accessToken, spreadsheetId, path, method = "GET", body }) {
  const separator = path.startsWith(":") || path.startsWith("?") ? "" : "/";
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}${separator}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Google Sheets respondió ${response.status}`);
  }

  return response.json();
}

function useSheetDatabase(auth, monthKey) {
  const [sheetData, setSheetData] = useState(emptySheetData);
  const [draft, setDraft] = useState(emptySheetData);
  const [calendar, setCalendar] = useState({});
  const [reflection, setReflection] = useState("");
  const [household, setHousehold] = useState(defaultHousehold);
  const [status, setStatus] = useState({
    loading: false,
    saving: false,
    loaded: false,
    message: "Mes listo para registrar tus datos.",
    error: ""
  });
  const storeRef = useRef({ db: null, ready: false });

  async function persistMonth(
    nextDraft = draft,
    nextCalendar = calendar,
    nextReflection = reflection,
    nextHousehold = household
  ) {
    const userKey = getUserKey(auth);
    const payload = {
      draft: nextDraft,
      calendar: nextCalendar,
      reflection: nextReflection,
      household: nextHousehold,
      updatedAt: new Date().toISOString()
    };
    writeLocalMonth(userKey, monthKey, payload);
    if (auth.user?.email && !storeRef.current.ready) {
      storeRef.current.db = await getFirebaseDb();
      storeRef.current.ready = true;
    }
    if (storeRef.current.db) {
      await setDoc(doc(storeRef.current.db, "agendaUsers", userKey, "months", monthKey), payload, { merge: true });
    }
  }

  async function loadMonthData() {
    const userKey = getUserKey(auth);
    setStatus((current) => ({ ...current, loading: true, error: "", message: "Cargando mes..." }));
    try {
      if (auth.user?.email && !storeRef.current.ready) {
        storeRef.current.db = await getFirebaseDb();
        storeRef.current.ready = true;
      }
      let payload = null;
      if (storeRef.current.db) {
        const snapshot = await getDoc(doc(storeRef.current.db, "agendaUsers", userKey, "months", monthKey));
        payload = snapshot.exists() ? snapshot.data() : null;
      }
      payload = payload || readLocalMonth(userKey, monthKey);
      const nextDraft = cleanDraftData(payload?.draft || emptySheetData());
      setSheetData(nextDraft);
      setDraft(nextDraft);
      setCalendar(payload?.calendar || {});
      setReflection(payload?.reflection || "");
      setHousehold(normalizeHousehold(payload?.household || defaultHousehold));
      setStatus({
        loading: false,
        saving: false,
        loaded: Boolean(payload),
        message: payload ? "Tu mes está listo y tus cambios están guardados." : "Mes nuevo listo para registrar datos.",
        error: ""
      });
    } catch {
      const payload = readLocalMonth(userKey, monthKey);
      const nextDraft = cleanDraftData(payload?.draft || emptySheetData());
      setSheetData(nextDraft);
      setDraft(nextDraft);
      setCalendar(payload?.calendar || {});
      setReflection(payload?.reflection || "");
      setHousehold(normalizeHousehold(payload?.household || defaultHousehold));
      setStatus({
        loading: false,
        saving: false,
        loaded: Boolean(payload),
        message: "Tu mes está listo y tus cambios están guardados.",
        error: ""
      });
    }
  }

  async function loadData() {
    if (!auth.accessToken) {
      setStatus((current) => ({ ...current, message: "Primero conecta Google Sheets si quieres importar desde la hoja.", error: "" }));
      return;
    }

    setStatus((current) => ({ ...current, loading: true, error: "", message: "Importando datos desde Google Sheets..." }));
    try {
      const params = Object.values(RANGE_MAP)
        .map((range) => `ranges=${encodeURIComponent(range)}`)
        .join("&");
      const payload = await sheetsRequest({
        accessToken: auth.accessToken,
        spreadsheetId: auth.spreadsheetId,
        path: `values:batchGet?${params}&valueRenderOption=FORMATTED_VALUE`
      });
      const nextData = parseSheetValues(payload);
      setSheetData(nextData);
      setDraft(nextData);
      await persistMonth(nextData, calendar, reflection);
      setStatus({
        loading: false,
        saving: false,
        loaded: true,
        message: "Datos importados y guardados para este mes.",
        error: ""
      });
    } catch (error) {
      setStatus({
        loading: false,
        saving: false,
        loaded: false,
        message: "No se pudieron cargar los datos.",
        error: "Revisa permisos de Sheets o vuelve a conectar la cuenta."
      });
    }
  }

  useEffect(() => {
    loadMonthData();
  }, [auth.user?.email, monthKey]);

  function updateCell(section, rowIndex, columnIndex, value) {
    setDraft((current) => {
      const existingRows = [...(current[section] || [])];
      while (existingRows.length <= rowIndex) {
        existingRows.push([...(rowTemplates[section] || [])]);
      }
      const nextDraft = {
        ...current,
        [section]: existingRows.map((row, index) =>
          index === rowIndex ? row.map((cell, cellIndex) => (cellIndex === columnIndex ? value : cell)) : row
        )
      };
      persistMonth(nextDraft);
      return nextDraft;
    });
    setStatus((current) => ({ ...current, loaded: true, message: "Cambios guardados automáticamente.", error: "" }));
  }

  function addRow(section, template = []) {
    setDraft((current) => {
      const nextDraft = { ...current, [section]: [...current[section], template] };
      persistMonth(nextDraft);
      return nextDraft;
    });
    setStatus((current) => ({ ...current, loaded: true, message: "Nueva línea agregada y guardada.", error: "" }));
  }

  function removeLocalRow(section, rowIndex) {
    setDraft((current) => {
      const nextDraft = {
        ...current,
        [section]: current[section].filter((_, index) => index !== rowIndex)
      };
      persistMonth(nextDraft);
      return nextDraft;
    });
  }

  async function getSheetId(section) {
    const title = SHEET_TITLES[section];
    const payload = await sheetsRequest({
      accessToken: auth.accessToken,
      spreadsheetId: auth.spreadsheetId,
      path: "?fields=sheets(properties(sheetId,title))"
    });
    return payload.sheets?.find((sheet) => sheet.properties?.title === title)?.properties?.sheetId;
  }

  async function deleteRow(section, rowIndex) {
    if (!auth.accessToken) {
      removeLocalRow(section, rowIndex);
      return;
    }

    setStatus((current) => ({ ...current, saving: true, error: "", message: "Eliminando línea en Google Sheets..." }));
    try {
      const sheetId = await getSheetId(section);
      if (sheetId === undefined) throw new Error("No se encontró la hoja.");
      await sheetsRequest({
        accessToken: auth.accessToken,
        spreadsheetId: auth.spreadsheetId,
        path: ":batchUpdate",
        method: "POST",
        body: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: "ROWS",
                  startIndex: 4 + rowIndex,
                  endIndex: 5 + rowIndex
                }
              }
            }
          ]
        }
      });
      await loadData();
      persistMonth();
      setStatus((current) => ({
        ...current,
        saving: false,
        loaded: true,
        message: "Línea eliminada en Google Sheets.",
        error: ""
      }));
    } catch {
      setStatus((current) => ({
        ...current,
        saving: false,
        error: "No se pudo eliminar la línea. Revisa permisos de Sheets e intenta otra vez.",
        message: "Error al eliminar."
      }));
    }
  }

  async function saveRange(section, range, values) {
    await sheetsRequest({
      accessToken: auth.accessToken,
      spreadsheetId: auth.spreadsheetId,
      path: `values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
      method: "PUT",
      body: { values }
    });
    setSheetData((current) => ({ ...current, [section]: values }));
  }

  async function saveSection(section) {
    if (!auth.accessToken) {
      await persistMonth();
      setStatus((current) => ({ ...current, loaded: true, message: "Cambios guardados para este mes.", error: "" }));
      return;
    }
    setStatus((current) => ({ ...current, saving: true, error: "", message: "Guardando en Google Sheets..." }));
    try {
      const rangeBySection = {
        ingresos: "Ingresos!A5:E8",
        pagos: "'Pagos Mensuales'!A5:H16",
        ahorros: "Ahorros!A5:E9"
      };
      await saveRange(section, rangeBySection[section], draft[section]);
      await persistMonth();
      setStatus((current) => ({
        ...current,
        saving: false,
        loaded: true,
        message: "Cambios guardados en Google Sheets.",
        error: ""
      }));
    } catch {
      setStatus((current) => ({
        ...current,
        saving: false,
        error: "No se pudo guardar. Vuelve a conectar Google Sheets e intenta otra vez.",
        message: "Error al guardar."
      }));
    }
  }

  async function appendDailyExpense(expense) {
    const values = [[expense.date, expense.concept, expense.category, expense.amount, expense.method, expense.note]];
    if (!auth.accessToken) {
      setDraft((current) => {
        const nextDraft = { ...current, gastos: [...current.gastos, values[0]] };
        persistMonth(nextDraft);
        return nextDraft;
      });
      setStatus((current) => ({ ...current, loaded: true, message: "Gasto agregado para este mes.", error: "" }));
      return;
    }
    setStatus((current) => ({ ...current, saving: true, error: "", message: "Agregando gasto diario..." }));
    try {
      await sheetsRequest({
        accessToken: auth.accessToken,
        spreadsheetId: auth.spreadsheetId,
        path: `values/${encodeURIComponent("'Gastos Diarios'!A5:F5")}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        method: "POST",
        body: { values }
      });
      await loadData();
      persistMonth();
      setStatus((current) => ({
        ...current,
        saving: false,
        loaded: true,
        message: "Gasto agregado en Google Sheets.",
        error: ""
      }));
    } catch {
      setStatus((current) => ({
        ...current,
        saving: false,
        error: "No se pudo agregar el gasto.",
        message: "Error al guardar."
      }));
    }
  }

  function updateCalendarDay(day, value) {
    const nextCalendar = { ...calendar, [day]: value };
    setCalendar(nextCalendar);
    persistMonth(draft, nextCalendar, reflection);
  }

  function updateReflection(value) {
    setReflection(value);
    persistMonth(draft, calendar, value);
  }

  function updateHousehold(updater) {
    setHousehold((current) => {
      const nextHousehold = normalizeHousehold(typeof updater === "function" ? updater(current) : updater);
      persistMonth(draft, calendar, reflection, nextHousehold);
      return nextHousehold;
    });
    setStatus((current) => ({ ...current, loaded: true, message: "Cambios guardados automáticamente.", error: "" }));
  }

  async function copyPlanToNextMonth() {
    const [yearText, monthText] = monthKey.split("-");
    const nextDate = new Date(Number(yearText), Number(monthText), 1);
    const nextKey = getMonthKey(nextDate.getMonth(), nextDate.getFullYear());
    const userKey = getUserKey(auth);
    const existing = readLocalMonth(userKey, nextKey) || {};
    const nextDraft = cleanDraftData({
      ...(existing.draft || emptySheetData()),
      pagos: draft.pagos.filter(hasMeaningfulPayment).map((row) => [...row.slice(0, 2), "", ...row.slice(3, 6), "Pendiente", row[7]]),
      ahorros: draft.ahorros.filter((row) => row[0] || parseMoney(row[1])).map((row) => [row[0], row[1], "", row[3], row[4]])
    });
    writeLocalMonth(userKey, nextKey, { ...existing, draft: nextDraft, household: existing.household || household, calendar: existing.calendar || {}, reflection: existing.reflection || "", updatedAt: new Date().toISOString() });
    setStatus((current) => ({ ...current, message: `Pagos y metas copiados a ${monthNames[nextDate.getMonth()]} ${nextDate.getFullYear()}.`, error: "" }));
  }

  async function importBackup(file) {
    try {
      const payload = JSON.parse(await file.text());
      if (!payload || typeof payload !== "object") throw new Error("invalid");
      createAutomaticBackup(localStorage, MONTHLY_STORE_KEY, "antes de importar un respaldo");
      localStorage.setItem(MONTHLY_STORE_KEY, JSON.stringify(migrateStore(payload)));
      localStorage.removeItem(`agenda_financiera_demo_${monthKey}`);
      await loadMonthData();
      setStatus((current) => ({ ...current, message: "Respaldo importado correctamente.", error: "" }));
    } catch {
      setStatus((current) => ({ ...current, error: "No se pudo importar ese archivo de respaldo.", message: "" }));
    }
  }

  async function resetMonth() {
    const nextDraft = emptySheetData();
    const nextHousehold = normalizeHousehold(defaultHousehold);
    removeLocalMonth(getUserKey(auth), monthKey);
    setDraft(nextDraft);
    setSheetData(nextDraft);
    setCalendar({});
    setReflection("");
    setHousehold(nextHousehold);
    localStorage.removeItem(CHECKLIST_STORAGE_KEY);
    localStorage.removeItem(`agenda_financiera_demo_${monthKey}`);
    await persistMonth(nextDraft, {}, "", nextHousehold);
    setStatus((current) => ({ ...current, loaded: false, message: "Mes reiniciado. Ya puedes comenzar desde cero.", error: "" }));
  }

  async function loadExampleData() {
    const today = new Date().toISOString().slice(0, 10);
    const nextDraft = cleanDraftData({
      ingresos: [["Sueldo", today, "1200000", "Pagado", "Ejemplo"]],
      pagos: [["Vivienda", "Arriendo", today, "", "420000", "", "Pendiente", "Transferencia"]],
      gastos: [[today, "Supermercado", "Supermercado", "45000", "Débito", "Ejemplo"]],
      ahorros: [["Fondo de emergencia", "150000", "50000", today, "Ejemplo"]]
    });
    const nextHousehold = normalizeHousehold({ ...household, debts: [{ id: `${Date.now()}`, name: "Tarjeta", total: 300000, installment: 50000, installmentsTotal: 6, installmentsPaid: 2, nextDate: today, status: "Pendiente", priority: "Alta" }] });
    setDraft(nextDraft);
    setSheetData(nextDraft);
    setHousehold(nextHousehold);
    localStorage.setItem(`agenda_financiera_demo_${monthKey}`, "true");
    await persistMonth(nextDraft, calendar, reflection, nextHousehold);
    setStatus((current) => ({ ...current, loaded: true, message: "Datos de ejemplo cargados. Puedes reemplazarlos o reiniciar el mes.", error: "" }));
  }

  return {
    sheetData,
    draft,
    status,
    calendar,
    reflection,
    household,
    loadData,
    updateCell,
    addRow,
    saveSection,
    appendDailyExpense,
    deleteRow,
    updateCalendarDay,
    updateReflection,
    updateHousehold,
    resetMonth,
    loadExampleData,
    copyPlanToNextMonth,
    importBackup
  };
}

function AuthGate({ auth }) {
  return (
    <main className="auth-page">
      <section className="auth-card" aria-label="Acceso privado">
        <img src={heroPlanner} alt="Agenda financiera con cuaderno, calculadora y alcancía" />
        <div className="eyebrow">
          <Sparkles size={14} />
          Acceso privado
        </div>
        <h1>¿DÓNDE SE FUE MI PLATA?</h1>
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

function StatStrip({ sheetDb }) {
  const summary = getFinancialSummary(sheetDb.draft);
  const balanceStatus = getBalanceStatus(summary.projectedBalance);
  const hasData = summary.incomeTotal || summary.monthlyPayments || summary.dailyExpenses || summary.savingsTarget;
  const upcomingPayments = sheetDb.draft.pagos.filter((row) => hasMeaningfulPayment(row) && row[2] && row[6] !== "Pagado").sort((a, b) => String(a[2]).localeCompare(String(b[2]))).slice(0, 3);
  const liveStats = [
    { label: "Ingresos", value: formatCurrency(summary.incomeTotal), helper: "Ingresos registrados" },
    { label: "Ahorro", value: `${summary.savingsProgress}%`, helper: "Meta vs. separado" },
    { label: balanceStatus.label, value: formatCurrency(summary.projectedBalance), helper: balanceStatus.helper }
  ];
  if (!hasData) return <div className="empty-home"><div><Sparkles size={22} /><strong>Tu agenda está lista</strong><span>Comienza agregando tu primer ingreso. Todo se guardará automáticamente.</span></div><small>1. Elige tu modo · 2. Agrega ingresos · 3. Registra pagos</small></div>;
  return (
    <div className="home-summary-wrap"><div className="stat-strip" aria-label="Resumen">
      {(sheetDb.status.loaded ? liveStats : quickStats).map((stat) => (
        <div className="stat" key={stat.label}>
          <span>{stat.label}</span>
          <strong>{stat.value}</strong>
          <small>{stat.helper}</small>
        </div>
      ))}
    </div>{upcomingPayments.length ? <section className="home-upcoming"><div><CalendarDays size={20} /><strong>Pagos que vencen pronto</strong></div>{upcomingPayments.map((row, index) => <span key={`${row[1]}-${index}`}><b>{row[1]}</b><em>{new Date(`${row[2]}T12:00:00`).toLocaleDateString("es-CL", { day: "2-digit", month: "short" })}</em><strong>{formatCurrency(row[4] || row[3])}</strong></span>)}</section> : null}</div>
  );
}

function Cover({ onStart }) {
  return (
    <section className="cover-screen page-transition">
      <div className="cover-media">
        <img src={heroCoverPremium} alt="Agenda financiera, alcancía, sobres de presupuesto, calculadora y monedas en tonos pastel" />
      </div>
      <div className="cover-copy">
        <div className="icon-row" aria-hidden="true">
          <LayoutDashboard size={18} />
          <Sparkles size={18} />
          <Heart size={18} />
        </div>
        <h1>¿DÓNDE SE FUE MI PLATA?</h1>
        <p className="subtitle">Agenda interactiva para darle forma a tu dinero.</p>
        <p className="quote">Organizar tus finanzas también es una forma de cuidarte.</p>
        <button className="primary-action" type="button" onClick={onStart}>
          <CheckCircle2 size={16} />
          Ver por dónde empezar
        </button>
        <small className="cover-reassurance">No necesitas saber de finanzas. La agenda te guía paso a paso.</small>
        <div className="onboarding-steps"><span><b>1</b> Elige tu modo</span><span><b>2</b> Registra lo importante</span><span><b>3</b> Mira cuánto te queda</span></div>
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
          <span>Avance del mes</span>
          <strong>{progress}%</strong>
        </div>
        <div className="progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
    </aside>
  );
}

function PlannerPanel({ activeSection, onSection, auth, sheetDb, month, year, onPrepareNextMonth }) {
  const section = sections.find((item) => item.id === activeSection);
  const Icon = section.icon;
  const banner = sectionBanners[activeSection];

  function continueToIncome() {
    onSection("ingresos");
    window.setTimeout(() => document.querySelector(".floating-add-action")?.click(), 120);
  }

  return (
    <article className="planner-panel page-transition">
      <div className="planner-section-banner">
        <img src={banner.image} alt={banner.alt} />
      </div>
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
      </header>

      <SyncBanner auth={auth} sheetDb={sheetDb} />
      <QuoteCard text={section.message} />

      <div className="panel-body">
        {activeSection === "configuracion" ? <SetupSection sheetDb={sheetDb} onContinue={continueToIncome} month={month} year={year} /> : null}
        {activeSection === "calendario" ? (
          <div className="stack">
            <VisualNote
              image={calendarBanner}
              alt="Alcancía junto a plantas, monedas y gráficos"
              title="Ponle fecha a lo importante"
              text="Tus pagos registrados aparecerán aquí para que puedas anticiparte con calma."
              wide
            />
            <MonthlyCalendar sheetDb={sheetDb} month={month} year={year} onSection={onSection} />
          </div>
        ) : null}
        {activeSection === "checklist" ? <ChecklistSection sheetDb={sheetDb} onSection={onSection} /> : null}
        {activeSection === "ingresos" ? <IncomeSection sheetDb={sheetDb} /> : null}
        {activeSection === "pagos" ? <PaymentsSection sheetDb={sheetDb} /> : null}
        {activeSection === "hogar" ? <HouseholdSection sheetDb={sheetDb} month={month} year={year} /> : null}
        {activeSection === "presupuesto" ? <BudgetSection sheetDb={sheetDb} month={month} year={year} /> : null}
        {activeSection === "gastos" ? <DailySpendingSection sheetDb={sheetDb} /> : null}
        {activeSection === "ahorro" ? <SavingsSection sheetDb={sheetDb} /> : null}
        {activeSection === "deudas" ? <DebtSection sheetDb={sheetDb} /> : null}
        {activeSection === "cierre" ? <CloseSection sheetDb={sheetDb} onPrepareNextMonth={onPrepareNextMonth} /> : null}
      </div>
    </article>
  );
}

function QuoteCard({ text }) {
  return (
    <div className="quote-card">
      <Sparkles size={16} />
      <span>{text}</span>
    </div>
  );
}

function SyncBanner({ auth, sheetDb }) {
  return (
    <div className={sheetDb.status.error ? "sync-banner error" : "sync-banner"}>
      <span>{sheetDb.status.error || (sheetDb.status.message && !sheetDb.status.message.includes("Google") ? `✓ ${sheetDb.status.message}` : "✓ Guardado automáticamente en este dispositivo.")}</span>
    </div>
  );
}

function MapSection({ onSection }) {
  return (
    <div className="map-layout">
      <div className="month-intention">
        <img src={visualMap} alt="Vista mensual con notas, gráfico e intención financiera" />
        <div>
          <span>Vista del mes</span>
          <strong>Elige una intención sencilla.</strong>
          <p>Ordenar un poco también cuenta. Usa este mapa para moverte por tu agenda sin perder el hilo.</p>
        </div>
      </div>
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
    </div>
  );
}

function SetupSection({ sheetDb, onContinue, month, year }) {
  const members = sheetDb.household.members;
  const backupInputRef = useRef(null);
  const [backupMessage, setBackupMessage] = useState("");
  const demoMode = localStorage.getItem(`agenda_financiera_demo_${getMonthKey(month, year)}`) === "true";
  const automaticBackup = (() => { try { return JSON.parse(localStorage.getItem(BACKUP_KEY) || "null"); } catch { return null; } })();

  function selectMode(mode) {
    sheetDb.updateHousehold((current) => ({
      ...current,
      mode,
      members: mode === "shared" && current.members.length === 1
        ? [...current.members, { id: `persona-${Date.now()}`, name: "Persona 2" }]
        : current.members
    }));
  }

  function selectCurrency(currency) {
    localStorage.setItem("agenda_financiera_currency", currency);
    sheetDb.updateHousehold((current) => ({ ...current, currency }));
  }

  function confirmReset() {
    if (window.confirm(`¿Quieres borrar solamente ${monthNames[month]} ${year}? Tus otros meses no se modificarán. Esta acción no se puede deshacer.`)) sheetDb.resetMonth();
  }

  function exportBackup() {
    const data = localStorage.getItem(MONTHLY_STORE_KEY) || "{}";
    const blob = new Blob([data], { type: "application/octet-stream" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `respaldo-agenda-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    setBackupMessage("✓ Respaldo preparado. Busca el archivo en la carpeta Descargas.");
  }

  async function copyBackup() {
    try {
      await navigator.clipboard.writeText(localStorage.getItem(MONTHLY_STORE_KEY) || "{}");
      setBackupMessage("✓ Respaldo copiado. Puedes pegarlo y guardarlo en una nota segura.");
    } catch {
      setBackupMessage("No se pudo copiar. Usa Descargar respaldo desde Chrome o Safari.");
    }
  }

  function renameMember(id, name) {
    sheetDb.updateHousehold((current) => ({
      ...current,
      members: current.members.map((member) => member.id === id ? { ...member, name } : member)
    }));
  }

  function addMember() {
    if (members.length >= 4) return;
    const id = `persona-${Date.now()}`;
    sheetDb.updateHousehold((current) => ({
      ...current,
      members: [...current.members, { id, name: `Persona ${current.members.length + 1}` }]
    }));
  }

  function removeMember(id) {
    if (members.length === 1) return;
    sheetDb.updateHousehold((current) => ({
      ...current,
      mode: current.members.length <= 2 ? "individual" : current.mode,
      members: current.members.filter((member) => member.id !== id),
      expenses: current.expenses.filter((expense) => expense.paidBy !== id)
    }));
  }

  return (
    <div className="setup-flow">
      <div className="step-badge">Paso 2 de 11</div>
      <VisualNote
        image={plannerBanner}
        alt="Plan financiero con café, cuaderno y gráficos"
        title="Empieza con una vista clara"
        text="Primero configura tu espacio; después la agenda te acompañará paso a paso."
        wide
      />
      <div className="setup-card">
        <h3>¿Cómo quieres organizarte?</h3>
        <p>Elige una opción. Puedes cambiarla más adelante sin perder información.</p>
        <div className="mode-selector">
          <button className={sheetDb.household.mode === "individual" ? "mode-card active" : "mode-card"} type="button" onClick={() => selectMode("individual")}>
            <CircleDollarSign size={24} /><strong>Modo individual</strong><span>Solo mis ingresos, pagos y gastos.</span>
          </button>
          <button className={sheetDb.household.mode === "shared" ? "mode-card active" : "mode-card"} type="button" onClick={() => selectMode("shared")}>
            <Heart size={24} /><strong>Modo compartido</strong><span>Dividir cuentas entre 2 a 4 personas.</span>
          </button>
        </div>
      </div>
      <div className="setup-card">
        <h3>{sheetDb.household.mode === "shared" ? "¿Quiénes comparten gastos?" : "¿Cómo te llamas?"}</h3>
        <div className="member-grid">
          {members.map((member, index) => (
            <label className="member-field" key={member.id}>
              <span>{index === 0 ? "Tu nombre" : `Persona ${index + 1}`}</span>
              <input value={member.name} onChange={(event) => renameMember(member.id, event.target.value)} placeholder="Escribe un nombre" />
              {members.length > 1 ? <button type="button" onClick={() => removeMember(member.id)} aria-label={`Eliminar ${member.name}`}><Trash2 size={14} /></button> : null}
            </label>
          ))}
        </div>
        {sheetDb.household.mode === "shared" ? <button className="add-row" type="button" onClick={addMember} disabled={members.length >= 4}><Plus size={15} /> Agregar persona</button> : null}
      </div>
      <div className="setup-note-card">
        <strong>{sheetDb.household.mode === "individual" ? "Modo individual" : `Modo compartido · ${members.length} personas`}</strong>
        <span>Puedes cambiar esto más adelante sin perder tus registros.</span>
      </div>
      <div className="setup-card settings-card">
        <h3>Preferencias de tu agenda</h3>
        {demoMode ? <div className="demo-active-banner"><Sparkles size={18} /><div><strong>Estás usando datos de prueba</strong><span>Puedes recorrer la agenda sin confundirlos con tus finanzas reales.</span></div></div> : null}
        <label className="currency-field"><span>Moneda</span><select value={sheetDb.household.currency || "CLP"} onChange={(event) => selectCurrency(event.target.value)}><option value="CLP">Peso chileno (CLP)</option><option value="USD">Dólar (USD)</option><option value="EUR">Euro (EUR)</option><option value="ARS">Peso argentino (ARS)</option><option value="MXN">Peso mexicano (MXN)</option></select></label>
        <div className="pilot-mode-card"><Sparkles size={19} /><div><strong>¿Solo quieres probarla?</strong><span>Carga información ficticia para recorrer todas las secciones. Podrás borrarla después.</span></div><button type="button" className="add-row" onClick={sheetDb.loadExampleData}>Usar datos de prueba</button></div>
        <div className="data-actions"><button type="button" className="danger-action" onClick={confirmReset}><Trash2 size={15} /> Borrar {monthNames[month]} {year} y comenzar de cero</button></div>
        <div className="backup-actions"><button type="button" className="add-row" onClick={exportBackup}><Download size={15} /> Descargar respaldo</button><button type="button" className="add-row" onClick={copyBackup}><Copy size={15} /> Copiar respaldo</button><button type="button" className="add-row" onClick={() => backupInputRef.current?.click()}><Upload size={15} /> Importar respaldo</button><input ref={backupInputRef} hidden type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) { sheetDb.importBackup(file); setBackupMessage(`✓ Archivo ${file.name} seleccionado para importar.`); } event.target.value = ""; }} /></div>
        {backupMessage ? <div className="backup-message" role="status">{backupMessage}</div> : null}
        {automaticBackup?.createdAt ? <div className="automatic-backup-note"><CheckCircle2 size={16} /><span>Respaldo de seguridad automático: {new Date(automaticBackup.createdAt).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" })}</span></div> : null}
        <small>Tus datos se guardan en este dispositivo. Guarda el archivo de respaldo sin modificarlo. El botón para comenzar de cero borra únicamente el mes indicado.</small>
      </div>
      <button className="primary-action" type="button" onClick={onContinue}>Continuar con mis ingresos <ArrowRight size={16} /></button>
    </div>
  );
}

function ChecklistSection({ sheetDb, onSection }) {
  const [checked, setChecked] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CHECKLIST_STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  });

  function toggle(item) {
    setChecked((current) => {
      const next = { ...current, [item.id]: !current[item.id] };
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  const automatic = {
    setup: Boolean(sheetDb.household.members[0]?.name && sheetDb.household.members[0].name !== "Persona 1"),
    income: sheetDb.draft.ingresos.some((row) => parseMoney(row[2]) > 0),
    payments: sheetDb.draft.pagos.some((row) => parseMoney(row[4] || row[3]) > 0),
    debts: sheetDb.household.debts.length > 0,
    savings: sheetDb.draft.ahorros.some((row) => parseMoney(row[1]) > 0),
    budget: Boolean(checked.budget),
    expenses: sheetDb.draft.gastos.length > 0,
    close: Boolean(sheetDb.reflection.trim() || checked.close)
  };
  const isDone = (item) => Boolean(automatic[item.id] || checked[item.id]);
  const done = checklistItems.filter(isDone).length;

  function openChecklistAction(item) {
    if (item.id === "budget") toggle(item);
    onSection(item.section);
    if (["income", "payments", "debts", "savings", "expenses"].includes(item.id)) {
      window.setTimeout(() => document.querySelector(".floating-add-action")?.click(), 120);
    }
  }

  return (
    <div className="checklist-page stack">
      <VisualNote
        image={monthRouteBanner}
        alt="Camino financiero con etapas de hogar, equilibrio, crecimiento y meta"
        title="Tu ruta del mes, paso a paso"
        text="Empieza por lo esencial y avanza a tu ritmo. Cada etapa te acerca a una meta más clara."
        wide
      />
      <div className="checklist-layout">
      <div className="checklist-card">
        <div className="checklist-summary">
          <strong>{done}/{checklistItems.length}</strong>
          <span>pasos completados</span>
        </div>
        <p>Marca cada paso sin presión. No se trata de hacerlo perfecto, se trata de hacerlo visible.</p>
        <div className="checklist-items">
          {checklistItems.map((item) => (
            <div className={isDone(item) ? "task checked" : "task"} key={item.id}>
              <input aria-label={`Marcar ${item.label}`} type="checkbox" checked={isDone(item)} onChange={() => toggle(item)} />
              <span>{item.label}</span>
              <button type="button" onClick={() => openChecklistAction(item)}>{isDone(item) ? "Revisar" : item.action}<ArrowRight size={14} /></button>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}

function IncomeSection({ sheetDb }) {
  const rows = sheetDb.draft.ingresos;
  const [newRowIndex, setNewRowIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  function addIncome() {
    const nextIndex = sheetDb.draft.ingresos.length;
    sheetDb.addRow("ingresos", rowTemplates.ingresos);
    setNewRowIndex(nextIndex);
    setEditingIndex(nextIndex);
    window.setTimeout(() => document.querySelectorAll(".simple-entry-card").item(document.querySelectorAll(".simple-entry-card").length - 1)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }
  return (
    <div className="stack">
      <VisualNote
        image={incomeBanner}
        alt="Entrega de dinero entre dos personas"
        title="Todo comienza por lo que entra"
        text="Registra tu sueldo y cualquier ingreso adicional antes de organizar tus compromisos."
        wide
      />
      <div className="section-action-row"><div><strong>Mis ingresos</strong><span>Completa solo estos cinco datos.</span></div></div>
      {rows.map((row, rowIndex) => (
        <div className="simple-entry-card" key={`ingreso-${rowIndex}`}>
          <div className="entry-card-heading"><strong><CircleDollarSign size={18} /> {row[0] || `Ingreso ${rowIndex + 1}`} {row[2] ? `· ${formatCurrency(parseMoney(row[2]))}` : ""}</strong>{editingIndex !== rowIndex ? <button className="edit-entry" type="button" onClick={() => setEditingIndex(rowIndex)}>Editar</button> : null}</div>
          {editingIndex === rowIndex ? <>
          <div className="simple-entry-grid">
            <label><span>Fuente</span><input value={row[0]} placeholder="Ej: sueldo" onChange={(e) => sheetDb.updateCell("ingresos", rowIndex, 0, e.target.value)} /></label>
            <label><span>Fecha en que lo recibes</span><input type="date" value={row[1]} onChange={(e) => sheetDb.updateCell("ingresos", rowIndex, 1, e.target.value)} /></label>
            <label><span>Monto</span><input inputMode="numeric" value={row[2]} placeholder="$" onChange={(e) => sheetDb.updateCell("ingresos", rowIndex, 2, formatMoneyEntry(e.target.value))} /></label>
            <label><span>Estado</span><select className={`status-select ${getStatusClass(statusOptions.includes(row[3]) ? row[3] : "Por revisar")}`} value={statusOptions.includes(row[3]) ? row[3] : "Por revisar"} onChange={(e) => sheetDb.updateCell("ingresos", rowIndex, 3, e.target.value)}>{statusOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label className="wide"><span>Nota opcional</span><input value={row[4]} placeholder="Ej: pago variable" onChange={(e) => sheetDb.updateCell("ingresos", rowIndex, 4, e.target.value)} /></label>
          </div>
          <DeleteRowButton
            label={`Eliminar ingreso fila ${rowIndex + 1}`}
            disabled={sheetDb.status.saving}
            onClick={() => sheetDb.deleteRow("ingresos", rowIndex)}
          />
          {rowIndex === newRowIndex ? <button className="cancel-entry" type="button" onClick={() => { sheetDb.deleteRow("ingresos", rowIndex); setNewRowIndex(null); setEditingIndex(null); }}>Cancelar y eliminar este registro</button> : null}
          <FinishEditButton onClick={() => { setEditingIndex(null); setNewRowIndex(null); }} />
          </> : <div className="saved-entry-summary"><span>{row[1] || "Sin fecha"}</span><span className={`pill ${getStatusClass(row[3] || "Por revisar")}`}>{row[3] || "Por revisar"}</span></div>}
        </div>
      ))}
      {!rows.length ? <div className="empty-state compact-empty">Todavía no hay ingresos. Presiona “Agregar ingreso” cuando quieras comenzar.</div> : null}
      <div className="total-card">
        <span>Total de ingresos</span>
        <strong>{formatCurrency(getFinancialSummary(sheetDb.draft).incomeTotal)}</strong>
      </div>
      {editingIndex === null ? <FloatingAddButton label="Agregar ingreso" onClick={addIncome} /> : null}
    </div>
  );
}

function PaymentsSection({ sheetDb }) {
  const payments = sheetDb.draft.pagos;
  const [newRowIndex, setNewRowIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const summary = getFinancialSummary(sheetDb.draft);
  function addPayment() {
    const nextIndex = sheetDb.draft.pagos.length;
    sheetDb.addRow("pagos", rowTemplates.pagos);
    setNewRowIndex(nextIndex);
    setEditingIndex(nextIndex);
    window.setTimeout(() => document.querySelectorAll(".simple-entry-card").item(document.querySelectorAll(".simple-entry-card").length - 1)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }
  return (
    <div className="stack">
      <VisualNote
        image={paymentsBanner}
        alt="Terminal de pago con tarjeta, efectivo y recibo"
        title="Calendario de pagos"
        text="Ten tus pagos a la vista para evitar sorpresas y decidir con menos enredo."
        wide
      />
      <div className="section-action-row"><div><strong>Mis pagos</strong><span>La fecha aparecerá automáticamente en el calendario.</span></div></div>
        {payments.map((row, rowIndex) => (
          <div className="simple-entry-card" key={`pago-${rowIndex}`}>
            <div className="entry-card-heading"><strong><CheckCircle2 size={18} /> {row[1] || `Pago ${rowIndex + 1}`} {row[4] || row[3] ? `· ${formatCurrency(parseMoney(row[4] || row[3]))}` : ""}</strong><div><CategorySticker category={findOption(row[0], categoryOptions)} />{editingIndex !== rowIndex ? <button className="edit-entry" type="button" onClick={() => setEditingIndex(rowIndex)}>Editar</button> : null}</div></div>
            {editingIndex === rowIndex ? <>
            <div className="simple-entry-grid">
              <label><span>Categoría</span><select value={findOption(row[0], categoryOptions)} onChange={(e) => sheetDb.updateCell("pagos", rowIndex, 0, e.target.value)}>{categoryOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label><span>Qué debes pagar</span><input value={row[1]} placeholder="Ej: arriendo" onChange={(e) => sheetDb.updateCell("pagos", rowIndex, 1, e.target.value)} /></label>
              <label><span>Fecha de pago</span><input type="date" value={row[2]} onChange={(e) => sheetDb.updateCell("pagos", rowIndex, 2, e.target.value)} /></label>
              <label><span>Monto que pagarás</span><input inputMode="numeric" value={row[4] || row[3]} placeholder="$" onChange={(e) => sheetDb.updateCell("pagos", rowIndex, 4, formatMoneyEntry(e.target.value))} /></label>
              <label><span>Estado</span><select className={`status-select ${getStatusClass(statusOptions.includes(row[6]) ? row[6] : "Por revisar")}`} value={statusOptions.includes(row[6]) ? row[6] : "Por revisar"} onChange={(e) => sheetDb.updateCell("pagos", rowIndex, 6, e.target.value)}>{statusOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label><span>Forma de pago</span><select value={detectPaymentMethod(row[7])} onChange={(e) => sheetDb.updateCell("pagos", rowIndex, 7, e.target.value)}>{paymentMethodOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
            </div>
            <DeleteRowButton
              label={`Eliminar pago fila ${rowIndex + 1}`}
              disabled={sheetDb.status.saving}
              onClick={() => sheetDb.deleteRow("pagos", rowIndex)}
            />
            <button className="duplicate-row" type="button" onClick={() => sheetDb.addRow("pagos", [...row])}><Copy size={15} /> Duplicar este pago</button>
            {rowIndex === newRowIndex ? <button className="cancel-entry" type="button" onClick={() => { sheetDb.deleteRow("pagos", rowIndex); setNewRowIndex(null); setEditingIndex(null); }}>Cancelar y eliminar este registro</button> : null}
            <FinishEditButton onClick={() => { setEditingIndex(null); setNewRowIndex(null); }} />
            </> : <div className="saved-entry-summary"><span>{row[2] || "Sin fecha"}</span><span className={`pill ${getStatusClass(row[6] || "Por revisar")}`}>{row[6] || "Por revisar"}</span></div>}
          </div>
        ))}
      {!payments.length ? <div className="empty-state compact-empty">Todavía no hay pagos. Las casillas aparecerán cuando presiones “Agregar pago”.</div> : null}
      <div className="formula-note">
        <strong>Total de pagos personales:</strong> {formatCurrency(summary.monthlyPayments)}
        <span>Se calcula con la columna <strong>Mi parte</strong> y se refleja en presupuesto y proyección.</span>
      </div>
      {editingIndex === null ? <FloatingAddButton label="Agregar pago" onClick={addPayment} /> : null}
    </div>
  );
}

function HouseholdSection({ sheetDb, month, year }) {
  const { household } = sheetDb;
  const balances = getHouseholdBalances(household);
  const [form, setForm] = useState({
    concept: "",
    category: "Vivienda",
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    paidBy: household.members[0]?.id || "",
    paymentMode: "one",
    splitMode: "equal"
  });
  const [formOpen, setFormOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    if (!household.members.some((member) => member.id === form.paidBy)) {
      setForm((current) => ({ ...current, paidBy: household.members[0]?.id || "" }));
    }
  }, [household.members, form.paidBy]);

  function addMember() {
    if (household.members.length >= 4) return;
    const id = `persona-${Date.now()}`;
    sheetDb.updateHousehold((current) => ({
      ...current,
      members: [...current.members, { id, name: `Persona ${current.members.length + 1}` }]
    }));
  }

  function renameMember(id, name) {
    sheetDb.updateHousehold((current) => ({
      ...current,
      members: current.members.map((member) => member.id === id ? { ...member, name } : member)
    }));
  }

  function removeMember(id) {
    if (household.members.length === 1) return;
    sheetDb.updateHousehold((current) => ({
      ...current,
      mode: current.members.length <= 2 ? "individual" : current.mode,
      members: current.members.filter((member) => member.id !== id),
      expenses: current.expenses.filter((expense) => expense.paidBy !== id)
    }));
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submitExpense(event) {
    event.preventDefault();
    const amount = parseMoney(form.amount);
    if (!amount || !form.concept.trim()) return;
    const share = Math.round(amount / household.members.length);
    const shares = {};
    let assigned = 0;
    household.members.forEach((member, index) => {
      const value = index === household.members.length - 1 ? amount - assigned : share;
      shares[member.id] = value;
      assigned += value;
    });
    sheetDb.updateHousehold((current) => ({
      ...current,
      expenses: [...current.expenses, {
        id: `${Date.now()}`,
        concept: form.concept.trim(),
        category: form.category,
        date: form.date,
        amount,
        paidBy: form.paymentMode === "shared" ? "shared" : form.paidBy,
        status: "Pendiente",
        shares
      }]
    }));
    setForm((current) => ({ ...current, concept: "", amount: "" }));
    setFormOpen(false);
  }

  function updateShare(expenseId, memberId, value) {
    sheetDb.updateHousehold((current) => ({
      ...current,
      expenses: current.expenses.map((expense) => expense.id === expenseId
        ? { ...expense, shares: { ...expense.shares, [memberId]: parseMoney(value) } }
        : expense)
    }));
  }

  function removeExpense(expenseId) {
    sheetDb.updateHousehold((current) => ({
      ...current,
      expenses: current.expenses.filter((expense) => expense.id !== expenseId)
    }));
  }

  function updateExpenseStatus(expenseId, status) {
    sheetDb.updateHousehold((current) => ({ ...current, expenses: current.expenses.map((expense) => expense.id === expenseId ? { ...expense, status } : expense) }));
  }

  function updateExpensePayer(expenseId, paidBy) {
    sheetDb.updateHousehold((current) => ({
      ...current,
      expenses: current.expenses.map((expense) => expense.id === expenseId ? { ...expense, paidBy } : expense)
    }));
  }

  function markEveryonePaidTheirShare() {
    sheetDb.updateHousehold((current) => ({
      ...current,
      expenses: current.expenses.map((expense) => ({ ...expense, paidBy: "shared", status: "Pagado" }))
    }));
  }

  const householdTotal = household.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const pendingExpenses = household.expenses.filter((expense) => expense.status !== "Pagado");
  const memberTotals = Object.fromEntries(household.members.map((member) => [member.id, household.expenses.reduce((sum, expense) => sum + (Number(expense.shares?.[member.id]) || 0), 0)]));
  const previewAmount = parseMoney(form.amount);
  const previewShare = household.members.length ? Math.round(previewAmount / household.members.length) : 0;

  const sharedSummaryText = [
    `Resumen compartido — ${monthNames[month]} ${year}`,
    `Gastos totales: ${formatCurrency(householdTotal)}`,
    ...household.members.map((member) => `${member.name}: ${formatCurrency(memberTotals[member.id])}`),
    pendingExpenses.length ? `Pendientes (${pendingExpenses.length}):` : "Pendientes: ninguno",
    ...pendingExpenses.map((expense) => `• ${expense.concept}: ${formatCurrency(expense.amount)}${expense.date ? ` — ${expense.date}` : ""} (${expense.status})`),
    household.members.some((member) => balances[member.id] < 0)
      ? "Estado: una persona adelantó más; revisen juntos si corresponde hacer un ajuste."
      : "Estado: cada persona cubrió su parte; no hay ajustes pendientes."
  ].join("\n");

  async function copySharedSummary() {
    try {
      await navigator.clipboard.writeText(sharedSummaryText);
      setShareMessage("✓ Resumen copiado. Ya puedes pegarlo donde quieras.");
    } catch {
      setShareMessage("No se pudo copiar automáticamente. Selecciona el texto del resumen y cópialo.");
    }
  }

  function shareByWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(sharedSummaryText)}`, "_blank", "noopener,noreferrer");
  }

  function shareByEmail() {
    window.location.href = `mailto:?subject=${encodeURIComponent(`Resumen compartido — ${monthNames[month]} ${year}`)}&body=${encodeURIComponent(sharedSummaryText)}`;
  }

  return (
    <div className="stack household-section">
      <VisualNote
        image={sharedBanner}
        alt="Una persona entregando dinero a otra"
        title="Cuentas claras entre personas"
        text="Registra quién pagó y deja que la agenda calcule cuánto corresponde a cada integrante."
        wide
      />
      <div className="mode-selector compact">
        <button className={household.mode === "individual" ? "mode-card active" : "mode-card"} type="button" onClick={() => sheetDb.updateHousehold((current) => ({ ...current, mode: "individual" }))}><CircleDollarSign size={21} /><strong>Individual</strong><span>Solo mis cuentas</span></button>
        <button className={household.mode === "shared" ? "mode-card active" : "mode-card"} type="button" onClick={() => sheetDb.updateHousehold((current) => ({ ...current, mode: "shared", members: current.members.length === 1 ? [...current.members, { id: `persona-${Date.now()}`, name: "Persona 2" }] : current.members }))}><Heart size={21} /><strong>Compartido</strong><span>Dividir gastos</span></button>
      </div>
      {household.mode === "individual" ? <div className="empty-state mode-empty"><Heart size={24} /><strong>Estás usando el modo individual</strong><span>Elige “Compartido” arriba cuando quieras dividir un gasto con otra persona.</span></div> : <>
      <div className="household-summary">
        <ReadOnlyCard label="Gastos compartidos" value={formatCurrency(householdTotal)} helper={`${household.expenses.length} movimientos`} />
        {household.members.map((member) => (
          <div className={`balance-card ${balances[member.id] >= 0 ? "positive" : "negative"}`} key={member.id}>
            <span>{member.name}</span>
            <strong>{formatCurrency(Math.abs(balances[member.id]))}</strong>
            <small>{balances[member.id] > 0 ? "adelantó de más" : balances[member.id] < 0 ? "falta cubrir" : "al día"}</small>
          </div>
        ))}
      </div>
      {household.expenses.length ? <div className="settlement-guide"><div><strong>¿Cómo quedaron las cuentas?</strong></div>{household.members.some((member) => balances[member.id] < 0) ? <><span>Según quién registró el pago, una persona adelantó más dinero que la otra.</span><button className="settled-together-button" type="button" onClick={markEveryonePaidTheirShare}><CheckCircle2 size={17} /> Cada uno ya pagó su parte</button><small>Presiona aquí si tú y Catriel pagaron al mismo tiempo o cada uno cubrió lo suyo.</small></> : <span className="settlement-ok">✓ Cada persona cubrió su parte. No hay ajustes pendientes.</span>}</div> : null}

      <section className="member-card">
        <div className="list-heading">
          <div><h3>1. ¿Entre quiénes se divide?</h3><p>Escribe tu nombre y el de tu pareja. Puedes agregar hasta cuatro personas.</p></div>
          <button className="add-row" type="button" onClick={addMember} disabled={household.members.length >= 4}>
            <Plus size={15} /> Agregar persona
          </button>
        </div>
        <div className="member-grid">
          {household.members.map((member, index) => (
            <label className="member-field" key={member.id}>
              <span>Persona {index + 1}</span>
              <input value={member.name} onChange={(event) => renameMember(member.id, event.target.value)} />
              {household.members.length > 1 ? (
                <button type="button" onClick={() => removeMember(member.id)} aria-label={`Eliminar a ${member.name}`}>
                  <Trash2 size={14} />
                </button>
              ) : null}
            </label>
          ))}
        </div>
      </section>

      {formOpen ? <form className="shared-expense-form entry-form-reveal" onSubmit={submitExpense}>
        <div className="list-heading"><div><h3>2. Agrega el gasto</h3><p>Completa estos datos. La agenda dividirá el monto automáticamente.</p></div></div>
        <div className="shared-form-grid">
          <label><span>Fecha</span><input type="date" value={form.date} onChange={(event) => updateForm("date", event.target.value)} /></label>
          <label><span>¿Qué pagaron?</span><input value={form.concept} onChange={(event) => updateForm("concept", event.target.value)} placeholder="Ej: supermercado" required /></label>
          <label><span>Categoría</span><select value={form.category} onChange={(event) => updateForm("category", event.target.value)}>
            {categoryOptions.map((option) => <option key={option}>{option}</option>)}
          </select></label>
          <label><span>Monto total</span><input value={form.amount} onChange={(event) => updateForm("amount", formatMoneyEntry(event.target.value))} placeholder="Ej: 100.000" inputMode="numeric" required /></label>
          <label><span>¿Cómo lo pagaron?</span><select value={form.paymentMode} onChange={(event) => updateForm("paymentMode", event.target.value)}>
            <option value="one">Una persona pagó todo</option>
            <option value="shared">Cada persona pagó su parte</option>
          </select></label>
          {form.paymentMode === "one" ? <label><span>¿Quién pagó todo?</span><select value={form.paidBy} onChange={(event) => updateForm("paidBy", event.target.value)}>
            {household.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
          </select></label> : <div className="paid-together-note"><CheckCircle2 size={18} /><span>No se calculará ninguna transferencia: quedará registrado que cada persona pagó su parte.</span></div>}
        </div>
        {household.members.length < 2 ? (
          <div className="shared-help">Primero presiona <strong>Agregar persona</strong> y escribe el nombre de tu pareja.</div>
        ) : previewAmount ? (
          <div className="split-preview">
            <span>{form.paymentMode === "shared" ? "Cada persona pagará esta parte:" : "Así quedará dividido:"}</span>
            <div>{household.members.map((member, index) => <strong key={member.id}>{member.name}: {formatCurrency(index === household.members.length - 1 ? previewAmount - previewShare * (household.members.length - 1) : previewShare)}</strong>)}</div>
          </div>
        ) : null}
        <button className="shared-submit" type="submit" disabled={household.members.length < 2 || !previewAmount || !form.concept.trim()}>
          <Plus size={18} /> Dividir y agregar gasto
        </button>
        <button className="cancel-entry" type="button" onClick={() => setFormOpen(false)}>Cancelar</button>
      </form> : null}

      <div className="shared-list">
        <div className="list-heading"><div><h3>3. Resultado del reparto</h3><p>Aquí verás tu parte y la de cada persona. Puedes corregir los montos si no es mitad y mitad.</p></div></div>
        {household.expenses.length ? household.expenses.map((expense) => {
          const payer = household.members.find((member) => member.id === expense.paidBy);
          const shareTotal = Object.values(expense.shares).reduce((sum, value) => sum + Number(value || 0), 0);
          return (
            <article className="shared-row" key={expense.id}>
              <div className="shared-row-head">
                <div className="shared-concept"><CategorySticker category={expense.category} compact /><div><strong>{expense.concept}</strong><span>{expense.date} · {expense.category}</span></div></div>
                <div><strong>{formatCurrency(expense.amount)}</strong><span>{expense.paidBy === "shared" ? "Pagaron entre todos" : `Pagó ${payer?.name || "—"}`}</span></div>
                <label className="shared-status"><span>¿Cómo se pagó?</span><select value={expense.paidBy} onChange={(event) => updateExpensePayer(expense.id, event.target.value)}><option value="shared">Cada uno pagó su parte</option>{household.members.map((member) => <option key={member.id} value={member.id}>{member.name} pagó todo</option>)}</select></label>
                <label className="shared-status"><span>Estado</span><select className={`status-select ${getStatusClass(statusOptions.includes(expense.status) ? expense.status : "Por revisar")}`} value={statusOptions.includes(expense.status) ? expense.status : "Por revisar"} onChange={(event) => updateExpenseStatus(expense.id, event.target.value)}>{statusOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
                <button className="delete-row" type="button" onClick={() => removeExpense(expense.id)} aria-label={`Eliminar ${expense.concept}`}><Trash2 size={15} /></button>
              </div>
              <div className="share-grid">
                {household.members.map((member) => (
                  <label key={member.id}><span>{member.name}</span><input value={expense.shares[member.id] || ""} onChange={(event) => updateShare(expense.id, member.id, event.target.value)} inputMode="numeric" /></label>
                ))}
              </div>
              <small className={shareTotal === expense.amount ? "share-ok" : "share-warning"}>
                {shareTotal === expense.amount ? "✓ Reparto completo" : `Faltan por repartir ${formatCurrency(expense.amount - shareTotal)}`}
              </small>
            </article>
          );
        }) : <div className="empty-state">Todavía no hay gastos compartidos. Agrega el primero para ver los saldos.</div>}
      </div>
      {household.expenses.length ? <section className="share-summary-card">
        <div className="list-heading"><div><h3><Heart size={19} /> Compartir resumen del mes</h3><p>Revisa la información y envíala sin guardar correos ni teléfonos.</p></div><button className="toggle-share-summary" type="button" onClick={() => setShareOpen((value) => !value)}>{shareOpen ? "Ocultar" : "Ver resumen"}</button></div>
        {shareOpen ? <div className="share-summary-content entry-form-reveal">
          <pre>{sharedSummaryText}</pre>
          <div className="share-summary-actions">
            <button className="share-whatsapp" type="button" onClick={shareByWhatsApp}><MessageCircle size={17} /> WhatsApp</button>
            <button className="share-email" type="button" onClick={shareByEmail}><Mail size={17} /> Correo</button>
            <button type="button" onClick={copySharedSummary}><Copy size={17} /> Copiar</button>
            <button type="button" onClick={() => window.print()}><Download size={17} /> Imprimir / guardar PDF</button>
          </div>
          {shareMessage ? <div className="inline-success" role="status">{shareMessage}</div> : null}
        </div> : null}
      </section> : null}
      {!formOpen ? <FloatingAddButton label="Agregar gasto compartido" onClick={() => setFormOpen(true)} /> : null}
      </>}
    </div>
  );
}

function BudgetSection({ sheetDb }) {
  const summary = getFinancialSummary(sheetDb.draft);
  const dailyExpenses = sheetDb.draft.gastos.length;
  const personalMember = sheetDb.household.members[0];
  const sharedCommitment = sheetDb.household.expenses.reduce(
    (sum, expense) => sum + (Number(expense.shares?.[personalMember?.id]) || 0),
    0
  );
  const adjustedProjectedBalance = summary.projectedBalance - sharedCommitment;
  const receivedIncome = sheetDb.draft.ingresos.filter((row) => row[3] === "Pagado").reduce((sum, row) => sum + parseMoney(row[2]), 0);
  const paidPayments = sheetDb.draft.pagos.filter((row) => row[6] === "Pagado").reduce((sum, row) => sum + parseMoney(row[4] || row[3]), 0);
  const availableToday = receivedIncome - paidPayments - summary.dailyExpenses - summary.savingsSaved;
  const balanceStatus = getBalanceStatus(adjustedProjectedBalance);
  return (
    <div className="form-grid">
      <VisualNote
        image={budgetDistributionOriginal}
        alt="Frascos pastel para distribuir vivienda, comida, transporte, ahorro y ocio"
        title="Distribuye según tus prioridades reales"
        text="Tu presupuesto puede ajustarse mes a mes. Lo importante es verlo completo."
        wide
      />
      <ReadOnlyCard label="Ingresos esperados" value={formatCurrency(summary.incomeTotal)} helper="Todo el dinero que esperas recibir" />
      <ReadOnlyCard label="Pagos mensuales" value={formatCurrency(summary.monthlyPayments)} helper="Total que te corresponde pagar" />
      <ReadOnlyCard label="Gastos diarios" value={formatCurrency(summary.dailyExpenses)} helper={`${dailyExpenses} registros`} />
      <ReadOnlyCard label="Meta de ahorro" value={formatCurrency(summary.savingsTarget)} helper="Todo lo que quieres separar este mes" />
      <ReadOnlyCard
        label={`Tu parte compartida · ${personalMember?.name || "Yo"}`}
        value={formatCurrency(sharedCommitment)}
        helper={sharedCommitment ? "Suma de los montos que te asignaron en Compartido" : "No tienes montos asignados en Compartido durante este mes"}
      />
      <BudgetChart summary={summary} />
      <ReadOnlyCard
        label={balanceStatus.label}
        value={formatCurrency(adjustedProjectedBalance)}
        helper={balanceStatus.helper}
        wide
      />
      <HelpTip text="Este resultado mira todo el mes: ingresos esperados menos pagos, gastos, el ahorro que ya separaste y tu parte compartida. La meta completa no se descuenta hasta que realmente la ahorras." />
      <ReadOnlyCard label="Disponible hoy" value={formatCurrency(availableToday)} helper="Dinero realmente disponible en este momento" wide />
      <HelpTip text="Cuenta solamente el dinero que ya recibiste y descuenta lo que ya pagaste, gastaste o separaste." />
      <ReadOnlyCard label="Falta por ahorrar" value={formatCurrency(summary.savingsGap)} helper="Lo que todavía falta para completar tu meta" />
    </div>
  );
}

function DailySpendingSection({ sheetDb }) {
  const summary = getFinancialSummary(sheetDb.draft);
  const [formOpen, setFormOpen] = useState(false);
  return (
    <div className="form-grid">
      <VisualNote
        image={dailyExpensesOriginal}
        alt="Canasta de compras con recibo, transporte, café, monedas y calculadora"
        title="Los gastos pequeños también cuentan"
        text="Anótalos sin culpa para entender el ritmo real de tu mes."
        wide
      />
      <ReadOnlyCard label="Gastado hasta ahora" value={formatCurrency(summary.dailyExpenses)} helper={`${sheetDb.draft.gastos.length} movimientos registrados`} wide />
      <DailyExpensesList sheetDb={sheetDb} />
      {formOpen ? <DailyExpenseForm onSubmit={async (expense) => { await sheetDb.appendDailyExpense(expense); setFormOpen(false); }} saving={sheetDb.status.saving} onCancel={() => setFormOpen(false)} /> : null}
      {!formOpen ? <FloatingAddButton label="Agregar gasto" onClick={() => setFormOpen(true)} /> : null}
    </div>
  );
}

function SavingsSection({ sheetDb }) {
  const rows = sheetDb.draft.ahorros;
  const [newRowIndex, setNewRowIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const summary = getFinancialSummary(sheetDb.draft);
  const progressNumber = summary.savingsProgress;
  function addSavingsGoal() {
    const nextIndex = sheetDb.draft.ahorros.length;
    sheetDb.addRow("ahorros", rowTemplates.ahorros);
    setNewRowIndex(nextIndex);
    setEditingIndex(nextIndex);
    window.setTimeout(() => document.querySelectorAll(".simple-entry-card").item(document.querySelectorAll(".simple-entry-card").length - 1)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }
  return (
    <div className="savings-layout">
      <div className="section-action-row featured"><div><strong><PiggyBank size={19} /> Mis metas</strong><span>Primero agrega una meta; el cerdito hará el cálculo.</span></div></div>
      {rows.map((row, rowIndex) => (
        <div className="simple-entry-card" key={`ahorro-${rowIndex}`}>
          <div className="entry-card-heading"><strong><PiggyBank size={18} /> {row[0] || `Meta ${rowIndex + 1}`} {row[1] ? `· ${formatCurrency(parseMoney(row[1]))}` : ""}</strong>{editingIndex !== rowIndex ? <button className="edit-entry" type="button" onClick={() => setEditingIndex(rowIndex)}>Editar</button> : null}</div>
          {editingIndex === rowIndex ? <>
          <div className="simple-entry-grid">
            <label><span>¿Para qué ahorras?</span><input value={row[0]} placeholder="Ej: vacaciones" onChange={(e) => sheetDb.updateCell("ahorros", rowIndex, 0, e.target.value)} /></label>
            <label><span>Meta de este mes</span><input inputMode="numeric" value={row[1]} placeholder="$" onChange={(e) => sheetDb.updateCell("ahorros", rowIndex, 1, formatMoneyEntry(e.target.value))} /></label>
            <label><span>¿Cuánto separaste?</span><input inputMode="numeric" value={row[2]} placeholder="$" onChange={(e) => sheetDb.updateCell("ahorros", rowIndex, 2, formatMoneyEntry(e.target.value))} /></label>
            <label><span>Fecha meta</span><input type="date" value={row[3]} onChange={(e) => sheetDb.updateCell("ahorros", rowIndex, 3, e.target.value)} /></label>
            <label className="wide"><span>Nota opcional</span><input value={row[4]} placeholder="Ej: separar al recibir el sueldo" onChange={(e) => sheetDb.updateCell("ahorros", rowIndex, 4, e.target.value)} /></label>
          </div>
          <DeleteRowButton
            label={`Eliminar ahorro fila ${rowIndex + 1}`}
            disabled={sheetDb.status.saving}
            onClick={() => sheetDb.deleteRow("ahorros", rowIndex)}
          />
          {rowIndex === newRowIndex ? <button className="cancel-entry" type="button" onClick={() => { sheetDb.deleteRow("ahorros", rowIndex); setNewRowIndex(null); setEditingIndex(null); }}>Cancelar y eliminar este registro</button> : null}
          <FinishEditButton onClick={() => { setEditingIndex(null); setNewRowIndex(null); }} />
          </> : <div className="saved-entry-summary"><span>Ahorrado: {formatCurrency(parseMoney(row[2]))}</span><span>{row[3] || "Sin fecha meta"}</span></div>}
        </div>
      ))}
      {!rows.length ? <div className="empty-state compact-empty">Aún no tienes metas. Las casillas aparecerán al presionar “Agregar meta de ahorro”.</div> : null}
      <div className="piggy-how"><strong>¿Cómo se llena?</strong><span>1. Escribe tu meta. 2. Escribe cuánto separaste. 3. El cerdito calcula automáticamente: separado ÷ meta.</span></div>
      <PiggySavingsProgress progress={progressNumber} saved={summary.savingsSaved} target={summary.savingsTarget} />
      {editingIndex === null ? <FloatingAddButton label="Agregar meta" onClick={addSavingsGoal} /> : null}
    </div>
  );
}

function PiggySavingsProgress({ progress, saved, target }) {
  const safeProgress = Math.max(0, Math.min(100, Number(progress) || 0));
  return (
    <section className="piggy-progress-card" aria-label={`Progreso de ahorro ${safeProgress}%`}>
      <div className="piggy-copy">
        <span>{target ? "Tu cerdito se llena automáticamente" : "Escribe una meta para comenzar"}</span>
        <strong>{safeProgress}%</strong>
        <p>{target ? `${formatCurrency(saved)} ÷ ${formatCurrency(target)} = ${safeProgress}%` : "Todavía está vacío porque no hay una meta ingresada."}</p>
        <div className="piggy-linear"><i style={{ width: `${safeProgress}%` }} /></div>
        <small>{target ? `Te faltan ${formatCurrency(Math.max(0, target - saved))}` : "Agrega tu meta arriba"}</small>
      </div>
      <div className="piggy-scene" aria-hidden="true">
        <div className="piggy-tail" />
        <div className="piggy-body">
          <div className="piggy-fill" style={{ height: `${safeProgress}%` }} />
          <div className="piggy-ear left" />
          <div className="piggy-ear right" />
          <div className="piggy-eye left" />
          <div className="piggy-eye right" />
          <div className="piggy-snout"><i /><i /></div>
          <div className="piggy-smile" />
        </div>
        <div className="piggy-leg left" />
        <div className="piggy-leg right" />
      </div>
      <div className="piggy-scale"><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div>
    </section>
  );
}

function DebtSection({ sheetDb }) {
  const [form, setForm] = useState({ name: "", total: "", installment: "", installmentsTotal: "", installmentsPaid: "", nextDate: new Date().toISOString().slice(0, 10), status: "Por revisar", priority: "Media" });
  const debts = sheetDb.household.debts || [];
  const [formOpen, setFormOpen] = useState(false);
  function update(field, value) { setForm((current) => ({ ...current, [field]: value })); }
  function submit(event) {
    event.preventDefault();
    if (!form.name.trim() || !parseMoney(form.total)) return;
    sheetDb.updateHousehold((current) => ({ ...current, debts: [...(current.debts || []), { ...form, id: `${Date.now()}`, name: form.name.trim(), total: parseMoney(form.total), installment: parseMoney(form.installment), installmentsTotal: Number(form.installmentsTotal) || 0, installmentsPaid: Number(form.installmentsPaid) || 0 }] }));
    setForm((current) => ({ ...current, name: "", total: "", installment: "", installmentsTotal: "", installmentsPaid: "" }));
    setFormOpen(false);
  }
  function removeDebt(id) { sheetDb.updateHousehold((current) => ({ ...current, debts: current.debts.filter((debt) => debt.id !== id) })); }
  return (
    <div className="stack">
      <VisualNote
        image={debtBanner}
        alt="Tarjeta, dinero y terminal de pago"
        title="Mira tus compromisos de frente"
        text="Ordenar cuotas y saldos pendientes te ayuda a decidir cuál atender primero."
        wide
      />
      {formOpen ? <form className="simple-entry-card entry-form-reveal" onSubmit={submit}>
        <div className="entry-card-heading"><strong><TrendingDown size={18} /> Agregar deuda</strong></div>
        <div className="simple-entry-grid debt-grid">
          <label><span>Nombre</span><input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Ej: tarjeta de crédito" required /></label>
          <label><span>Saldo total</span><input inputMode="numeric" value={form.total} onChange={(e) => update("total", formatMoneyEntry(e.target.value))} placeholder="$" required /></label>
          <label><span>Valor de la cuota</span><input inputMode="numeric" value={form.installment} onChange={(e) => update("installment", formatMoneyEntry(e.target.value))} placeholder="$" /></label>
          <label><span>Cuotas totales</span><input type="number" min="0" value={form.installmentsTotal} onChange={(e) => update("installmentsTotal", e.target.value)} placeholder="12" /></label>
          <label><span>Cuotas pagadas</span><input type="number" min="0" value={form.installmentsPaid} onChange={(e) => update("installmentsPaid", e.target.value)} placeholder="3" /></label>
          <label><span>Próximo pago</span><input type="date" value={form.nextDate} onChange={(e) => update("nextDate", e.target.value)} /></label>
          <label><span>Estado</span><select className={`status-select ${getStatusClass(form.status)}`} value={form.status} onChange={(e) => update("status", e.target.value)}>{statusOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label><span>Prioridad</span><select value={form.priority} onChange={(e) => update("priority", e.target.value)}><option>Alta</option><option>Media</option><option>Baja</option></select></label>
        </div>
        <button className="shared-submit" type="submit"><Plus size={17} /> Agregar deuda</button>
        <button className="cancel-entry" type="button" onClick={() => setFormOpen(false)}>Cancelar</button>
      </form> : null}
      <div className="debt-list">
        {debts.length ? debts.map((debt) => {
          const percent = debt.installmentsTotal ? Math.min(100, Math.round((debt.installmentsPaid / debt.installmentsTotal) * 100)) : 0;
          const paidAmount = debt.installment * debt.installmentsPaid;
          const remaining = Math.max(0, debt.total - paidAmount);
          return <article className="debt-card" key={debt.id}><div><span>{debt.priority} prioridad</span><strong>{debt.name}</strong><small>Próximo pago: {debt.nextDate || "Sin fecha"}</small></div><div><strong>{formatCurrency(remaining)}</strong><small>Saldo pendiente · cuota {formatCurrency(debt.installment)}</small></div><div className="debt-progress"><span>Pagado hasta hoy: {formatCurrency(paidAmount)} · {debt.installmentsPaid} de {debt.installmentsTotal || "—"} cuotas</span><i><b style={{ width: `${percent}%` }} /></i></div><span className={`pill ${getStatusClass(debt.status)}`}>{debt.status}</span><button className="delete-row" type="button" onClick={() => removeDebt(debt.id)} aria-label={`Eliminar ${debt.name}`}><Trash2 size={15} /></button></article>;
        }) : <div className="empty-state">No tienes deudas registradas. Si no tienes ninguna, ¡también es un logro!</div>}
      </div>
      {!formOpen ? <FloatingAddButton label="Agregar deuda" onClick={() => setFormOpen(true)} /> : null}
    </div>
  );
}

function CloseSection({ sheetDb, onPrepareNextMonth }) {
  const [preparingNextMonth, setPreparingNextMonth] = useState(false);
  const summary = getFinancialSummary(sheetDb.draft);
  const personalMember = sheetDb.household.members[0];
  const sharedCommitment = sheetDb.household.expenses.reduce(
    (sum, expense) => sum + (Number(expense.shares?.[personalMember?.id]) || 0),
    0
  );
  const finalProjectedBalance = summary.projectedBalance - sharedCommitment;
  const balanceStatus = getBalanceStatus(finalProjectedBalance);
  const paidCount = sheetDb.draft.pagos.filter((row) => hasMeaningfulPayment(row) && row[6] === "Pagado").length;
  const pendingCount = sheetDb.draft.pagos.filter((row) => hasMeaningfulPayment(row) && row[6] === "Pendiente").length;
  const closingMessage = finalProjectedBalance >= 0
    ? "Terminaste con margen. Decide cuánto quieres proteger para el próximo mes."
    : "No es un fracaso: ya sabes exactamente cuánto necesitas ajustar el próximo mes.";
  const nextStep = pendingCount
    ? `Revisar ${pendingCount} ${pendingCount === 1 ? "pago pendiente" : "pagos pendientes"}`
    : summary.savingsProgress < 100
      ? `Completar el ${Math.max(0, 100 - summary.savingsProgress)}% que falta de tu meta`
      : "Comenzar el próximo mes con tus pagos y ahorro organizados";

  async function prepareNextMonth() {
    if (preparingNextMonth) return;
    setPreparingNextMonth(true);
    try {
      await sheetDb.copyPlanToNextMonth();
      onPrepareNextMonth();
    } finally {
      setPreparingNextMonth(false);
    }
  }

  function updateCloseNote(field, value) {
    sheetDb.updateHousehold((current) => ({
      ...current,
      closeNotes: { ...current.closeNotes, [field]: value }
    }));
  }

  return (
    <div className="stack close-page">
      <VisualNote
        image={closeBanner}
        alt="Hoja de cierre mensual con estrella y líneas de reflexión"
        title="Haz un cierre amable"
        text="Reconoce lo que lograste, lo que aprendiste y lo que quieres mejorar."
        wide
      />
      <div className="closing-intro"><span>✨ Tu mes en una mirada</span><strong>{closingMessage}</strong></div>
      <section className={`closing-dashboard ${balanceStatus.tone}`}>
        <div className="closing-balance"><span>Resultado del mes</span><strong>{balanceStatus.label}</strong><b>{formatCurrency(finalProjectedBalance)}</b><p>{balanceStatus.helper}</p>{sharedCommitment ? <small>Incluye tu parte de gastos compartidos: {formatCurrency(sharedCommitment)}</small> : null}</div>
        <div className="closing-metrics"><div><CheckCircle2 size={20} /><strong>{paidCount}</strong><span>pagos completados</span></div><div><CalendarDays size={20} /><strong>{pendingCount}</strong><span>pagos pendientes</span></div><div><PiggyBank size={20} /><strong>{summary.savingsProgress}%</strong><span>de tu meta ahorrada</span></div></div>
        <div className="closing-savings"><span>Ahorro separado</span><strong>{formatCurrency(summary.savingsSaved)}</strong><i><b style={{ width: `${summary.savingsProgress}%` }} /></i></div>
      </section>
      <section className="next-step-card"><span>Tu siguiente paso recomendado</span><strong>{nextStep}</strong><small>Una sola acción clara para comenzar con menos presión.</small></section>
      <div className="closing-section-title"><span>🌷</span><div><strong>¿Qué te dejó este mes?</strong><small>Escribe con libertad; no necesitas completar todo.</small></div></div>
      <label className="reflection-block"><span>¿Cómo me sentí este mes?</span><textarea
        className="reflection"
        placeholder="Escribe cómo te sentiste con tu dinero, sin juzgarte..."
        value={sheetDb.reflection}
        onChange={(event) => sheetDb.updateReflection(event.target.value)}
      /></label>
      <div className="form-grid">
        <Field label="Logro financiero" placeholder="Lo que sí funcionó" value={sheetDb.household.closeNotes?.achievement || ""} onChange={(value) => updateCloseNote("achievement", value)} />
        <Field label="Ajuste para el próximo mes" placeholder="Algo que quiero cambiar" value={sheetDb.household.closeNotes?.adjustment || ""} onChange={(value) => updateCloseNote("adjustment", value)} />
        <Field label="Un gasto que valió la pena" placeholder="Algo que disfruté o me ayudó" value={sheetDb.household.closeNotes?.worthwhile || ""} onChange={(value) => updateCloseNote("worthwhile", value)} />
        <Field label="El próximo mes quiero" placeholder="Una intención sencilla" value={sheetDb.household.closeNotes?.intention || ""} onChange={(value) => updateCloseNote("intention", value)} />
      </div>
      <div className="closing-actions">
        <button className="copy-next-action" type="button" onClick={prepareNextMonth} disabled={preparingNextMonth}>{preparingNextMonth ? <Loader2 className="spin" size={17} /> : <Copy size={17} />} {preparingNextMonth ? "Preparando…" : "Preparar el mes siguiente"}</button>
        <div className="pdf-action-wrap"><button className="export-action" type="button" onClick={() => window.print()}><Download size={17} /> Guardar mi cierre como PDF</button><small>En la ventana que se abre, elige “Guardar como PDF”.</small></div>
      </div>
    </div>
  );
}

function VisualNote({ image, alt, title, text, wide = false }) {
  return (
    <div className={wide ? "visual-note wide" : "visual-note"}>
      <img src={image} alt={alt} />
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}

function SaveButton({ label, onClick, saving, type = "button" }) {
  return (
    <button className="primary-action save-action" type={type} onClick={onClick} disabled={saving}>
      {saving ? <Loader2 className="spin" size={16} /> : <Save size={16} />}
      {label}
    </button>
  );
}

function ReadOnlyCard({ label, value, helper, wide = false }) {
  return (
    <div className={wide ? "field readonly wide" : "field readonly"}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </div>
  );
}

function HelpTip({ text }) {
  return <details className="help-tip"><summary><HelpCircle size={16} /> ¿Qué significa?</summary><p>{text}</p></details>;
}

function BudgetChart({ summary }) {
  const items = [
    { label: "Pagos", icon: "🏠", value: summary.monthlyPayments, tone: "rose" },
    { label: "Gastos", icon: "🛍️", value: summary.dailyExpenses, tone: "peach" },
    { label: "Ahorro", icon: "🐷", value: summary.savingsTarget, tone: "mint" }
  ];
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="budget-chart">
      <div className="budget-chart-heading">
        <span>Tu dinero en una mirada</span>
        <strong>Así se distribuye tu mes</strong>
        <small>Cada color muestra qué parte de tus compromisos corresponde a pagos, gastos y ahorro.</small>
      </div>
      <div className="chart-bars" aria-label="Distribución de presupuesto">
        {items.map((item) => {
          const percent = total ? Math.round((item.value / total) * 100) : 0;
          return <div className={`chart-row ${item.tone}`} key={item.label}>
            <span className="chart-icon">{item.icon}</span>
            <div className="chart-name"><strong>{item.label}</strong><small>{percent}% del total</small></div>
            <div className="chart-track">
              <i style={{ width: `${percent}%` }} />
            </div>
            <strong>{formatCurrency(item.value)}</strong>
          </div>;
        })}
      </div>
      <div className="chart-total"><span>Total organizado</span><strong>{formatCurrency(total)}</strong></div>
    </div>
  );
}

function MonthlyCalendar({ sheetDb, month, year, onSection }) {
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const scheduledPayments = sheetDb.draft.pagos
    .filter((row) => String(row[2] || "").startsWith(monthPrefix) && row[1])
    .sort((a, b) => String(a[2]).localeCompare(String(b[2])));

  return (
    <div className="monthly-calendar wide">
      <div className="list-heading">
        <h3>Calendario mensual</h3>
        <span>{monthNames[month]} {year}</span>
      </div>
      <p>No tienes que volver a escribir nada aquí: las fechas que eliges en “Pagos” aparecen automáticamente.</p>
      <div className="payment-agenda">
        <div className="list-heading"><div><h3><CalendarDays size={19} /> Próximos pagos</h3><p>{scheduledPayments.length ? `${scheduledPayments.length} pagos programados` : "Todavía no hay pagos con fecha este mes."}</p></div></div>
        {scheduledPayments.map((row, index) => { const status = statusOptions.includes(row[6]) ? row[6] : "Por revisar"; return <div className={`agenda-item ${getStatusClass(status)}`} key={`${row[2]}-${row[1]}-${index}`}><span>{new Date(`${row[2]}T12:00:00`).toLocaleDateString("es-CL", { day: "2-digit", month: "short" })}</span><strong>{row[1]}</strong><em>{formatCurrency(row[4] || row[3])}</em><small>{status}</small></div>; })}
        {!scheduledPayments.length ? <button className="calendar-empty-action" type="button" onClick={() => onSection("pagos")}><Plus size={16} /> Agregar un pago con fecha</button> : null}
      </div>
      {scheduledPayments.length ? <button className="toggle-calendar" type="button" onClick={() => setShowFullCalendar((value) => !value)}><CalendarDays size={16} /> {showFullCalendar ? "Ocultar calendario completo" : "Ver calendario completo"}</button> : null}
      {showFullCalendar && scheduledPayments.length ? <div className="calendar-shell simple">
        <div className="calendar-grid" aria-label={`Días de ${monthNames[month]} ${year}`}>
          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = String(index + 1);
            const dateKey = `${monthPrefix}-${day.padStart(2, "0")}`;
            const scheduledRows = sheetDb.draft.pagos.filter((row) => row[2] === dateKey && row[1]);
            const scheduled = scheduledRows.map((row) => row[1]);
            const dayStatus = scheduledRows.some((row) => row[6] === "Pendiente") ? "Pendiente" : scheduledRows.some((row) => row[6] === "Por revisar") ? "Por revisar" : scheduledRows.length ? "Pagado" : "";
            const manualNote = sheetDb.calendar[day] || "";
            const note = [manualNote, ...scheduled].filter(Boolean).join(" · ");
            return (
              <div
                className={note ? `calendar-day has-payment ${getStatusClass(dayStatus || "Por revisar")}` : "calendar-day"}
                key={day}
                aria-label={`Día ${day}${note ? `: ${note}` : ""}`}
              >
                <strong>{day}</strong>
                {note ? <span className="day-dot" /> : null}
                <small>{note || "Libre"}</small>
              </div>
            );
          })}
        </div>
      </div> : null}
    </div>
  );
}

function DailyExpensesList({ sheetDb }) {
  const rows = sheetDb.draft.gastos;
  const [filter, setFilter] = useState("Todas");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const visibleRows = rows.map((row, index) => ({ row, index })).filter(({ row }) => (filter === "Todas" || row[2] === filter) && (!search.trim() || normalizeText(row.join(" ")).includes(normalizeText(search))));

  return (
    <div className="daily-list wide">
      <div className="list-heading">
        <h3>Gastos del mes</h3>
        <div className="expense-filters"><label className="search-field"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar gasto" aria-label="Buscar gasto" /></label><label className="filter-field"><span>Filtrar</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option>Todas</option>{categoryOptions.map((option) => <option key={option}>{option}</option>)}</select></label></div>
      </div>
      <div className="expense-card-list" aria-label="Gastos diarios registrados">
        {visibleRows.length ? visibleRows.map(({ row, index: rowIndex }) => (
          <article className="expense-row-card" key={`${row[1]}-${rowIndex}`}>
            {editing?.index === rowIndex ? <div className="simple-entry-grid compact-edit">
              <label><span>Fecha</span><input type="date" value={row[0]} onChange={(e) => sheetDb.updateCell("gastos", rowIndex, 0, e.target.value)} /></label>
              <label><span>Concepto</span><input value={row[1]} onChange={(e) => sheetDb.updateCell("gastos", rowIndex, 1, e.target.value)} /></label>
              <label><span>Categoría</span><select value={findOption(row[2], categoryOptions)} onChange={(e) => sheetDb.updateCell("gastos", rowIndex, 2, e.target.value)}>{categoryOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label><span>Monto</span><input inputMode="numeric" value={row[3]} onChange={(e) => sheetDb.updateCell("gastos", rowIndex, 3, formatMoneyEntry(e.target.value))} /></label>
            </div> : <div className="expense-main with-sticker"><CategorySticker category={row[2]} compact /><div><span>{row[0]}</span><strong>{row[1]}</strong><small>{row[2]} · {row[4]}</small></div></div>}
            <strong className="expense-amount">{formatCurrency(row[3])}</strong>
            <div className="row-actions">{editing?.index === rowIndex ? <><button className="finish-edit" type="button" onClick={() => setEditing(null)} aria-label={`Guardar cambios de ${row[1]}`} title="Guardar cambios"><Save size={15} /></button><button className="cancel-edit" type="button" onClick={() => { editing.original.forEach((value, columnIndex) => sheetDb.updateCell("gastos", rowIndex, columnIndex, value)); setEditing(null); }} aria-label={`Cancelar edición de ${row[1]}`} title="Cancelar edición"><X size={15} /></button></> : <button type="button" onClick={() => setEditing({ index: rowIndex, original: [...row] })} aria-label={`Editar ${row[1]}`}><Pencil size={15} /></button>}<DeleteRowButton label={`Eliminar gasto fila ${rowIndex + 1}`} disabled={sheetDb.status.saving} onClick={() => sheetDb.deleteRow("gastos", rowIndex)} /></div>
          </article>
        )) : <div className="empty-state">No hay gastos para este filtro.</div>}
      </div>
    </div>
  );
}

function DeleteRowButton({ label, onClick, disabled }) {
  return (
    <button className="delete-row" type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label}>
      <Trash2 size={15} />
    </button>
  );
}

function FinishEditButton({ onClick }) {
  return <button className="finish-entry" type="button" onClick={onClick}><CheckCircle2 size={18} /> Listo, terminar</button>;
}

function AddRowButton({ label, onClick }) {
  return (
    <button className="add-row" type="button" onClick={onClick}>
      <Plus size={15} />
      {label}
    </button>
  );
}

function AddBottomButton({ label, onClick }) {
  return <button className="add-bottom-action" type="button" onClick={onClick}><Plus size={18} /> {label}</button>;
}

function FloatingAddButton({ label, onClick }) {
  return <button className="floating-add-action" type="button" onClick={onClick}><Plus size={19} /> {label}</button>;
}

function DailyExpenseForm({ onSubmit, saving, onCancel }) {
  const today = new Date().toISOString().slice(0, 10);
  const [expense, setExpense] = useState({
    date: today,
    concept: "",
    category: "Servicios",
    amount: "",
    method: "Transferencia",
    note: ""
  });
  const [success, setSuccess] = useState("");

  function update(field, value) {
    setExpense((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    await onSubmit(expense);
    setExpense({ date: today, concept: "", category: "Servicios", amount: "", method: "Transferencia", note: "" });
    setSuccess("✓ Gasto agregado correctamente.");
    window.setTimeout(() => setSuccess(""), 3000);
  }

  return (
    <form className="daily-form wide" onSubmit={submit}>
      <h3>Agregar gasto diario</h3>
      <p>Completa los datos básicos; la agenda actualizará tu saldo automáticamente.</p>
      <div className="simple-entry-grid">
        <label><span>Fecha</span><input type="date" value={expense.date} onChange={(event) => update("date", event.target.value)} aria-label="Fecha" /></label>
        <label><span>¿En qué gastaste?</span><input
          value={expense.concept}
          onChange={(event) => update("concept", event.target.value)}
          placeholder="Concepto"
          aria-label="Concepto"
          required
        /></label>
        <label><span>Categoría</span><select
          value={expense.category}
          onChange={(event) => update("category", event.target.value)}
          aria-label="Categoría"
        >
          {categoryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select></label>
        <label><span>Monto</span><input
          value={expense.amount}
          onChange={(event) => update("amount", formatMoneyEntry(event.target.value))}
          placeholder="$"
          aria-label="Monto"
          required
        /></label>
        <label><span>Forma de pago</span><select
          value={expense.method}
          onChange={(event) => update("method", event.target.value)}
          aria-label="Forma de pago"
        >
          {paymentMethodOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select></label>
        <label><span>Nota opcional</span><input
          value={expense.note}
          onChange={(event) => update("note", event.target.value)}
          placeholder="Nota amable"
          aria-label="Nota amable"
        /></label>
      </div>
      <SaveButton label="Agregar gasto" saving={saving} type="submit" />
      <button className="cancel-entry" type="button" onClick={onCancel}>Cancelar</button>
      {success ? <div className="inline-success" role="status">{success}</div> : null}
    </form>
  );
}

function Field({ label, placeholder, wide = false, value, onChange }) {
  return (
    <label className={wide ? "field wide" : "field"}>
      <span>{label}</span>
      <input placeholder={placeholder} value={value} onChange={(event) => onChange?.(event.target.value)} />
    </label>
  );
}

function AppShell({ auth }) {
  const [current, setCurrent] = useState("cover");
  const [menuOpen, setMenuOpen] = useState(false);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const monthKey = getMonthKey(month, year);
  const sheetDb = useSheetDatabase(auth, monthKey);
  useEffect(() => {
    localStorage.setItem("agenda_financiera_currency", sheetDb.household.currency || "CLP");
  }, [sheetDb.household.currency]);

  const order = useMemo(() => ["cover", ...sections.map((section) => section.id)], []);
  const topNavItems = [
    { id: "calendario", label: "Calendario" },
    { id: "hogar", label: "Compartido" },
    { id: "presupuesto", label: "Resumen" },
    { id: "cierre", label: "Cierre" }
  ];
  const pageIndex = order.indexOf(current);
  const activeSection = current === "cover" ? "checklist" : current;
  const progress = getRealProgress(sheetDb);
  const theme = current === "cover" ? "cover" : activeSection;

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [current]);

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

  function openPreparedNextMonth() {
    const nextDate = new Date(year, month + 1, 1);
    setYear(nextDate.getFullYear());
    setMonth(nextDate.getMonth());
    setCurrent("checklist");
    setMenuOpen(false);
    window.setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: "smooth" }), 40);
  }

  function move(delta) {
    const nextIndex = Math.max(0, Math.min(order.length - 1, pageIndex + delta));
    setCurrent(order[nextIndex]);
  }

  function goTo(section) {
    setCurrent(section);
    setMenuOpen(false);
  }

  function goToQuickExpense() {
    setCurrent("gastos");
    setMenuOpen(false);
    window.setTimeout(() => document.querySelector(".floating-add-action")?.click(), 120);
  }

  return (
    <div className={`app-shell theme-${theme}`}>
      <div className="page-transition-flourish" key={`flourish-${current}`} aria-hidden="true"><span>✦</span></div>
      <header className="topbar">
        <div className="brand">
          <Sparkles size={16} />
          ¿DÓNDE SE FUE MI PLATA?
          <small>v23</small>
        </div>
        <nav className="topnav" aria-label="Navegación principal">
          <button className={current === "cover" ? "active" : ""} type="button" onClick={() => setCurrent("cover")}>
            Inicio
          </button>
          {topNavItems.map((section) => (
            <button
              className={current === section.id ? "active" : ""}
              key={section.id}
              type="button"
              onClick={() => setCurrent(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>
        <div className="session"><span>Mi agenda</span></div>
        <button className="mobile-menu-button" type="button" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
      </header>

      <main className="workspace">
        <div className="side-visual left" aria-hidden="true">
          <img src={visualPayments} alt="" />
          <span>seguir la pista</span>
        </div>
        <div className="side-visual right" aria-hidden="true">
          <img src={visualSavings} alt="" />
          <span>avance amable</span>
        </div>
        {current === "cover" && menuOpen ? <section className="planner-grid mobile-menu-open cover-mobile-menu"><button className="menu-backdrop" type="button" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú" /><Sidebar activeSection={activeSection} month={month} year={year} progress={progress} onMonth={changeMonth} onSection={goTo} /></section> : null}
        {current === "cover" ? (
          <>
            <Cover onStart={() => setCurrent("checklist")} />
            <SyncBanner auth={auth} sheetDb={sheetDb} />
            <StatStrip sheetDb={sheetDb} />
          </>
        ) : (
          <section className={menuOpen ? "planner-grid mobile-menu-open" : "planner-grid"}>
            {menuOpen ? <button className="menu-backdrop" type="button" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú" /> : null}
            <Sidebar
              activeSection={activeSection}
              month={month}
              year={year}
              progress={progress}
              onMonth={changeMonth}
              onSection={goTo}
            />
            <PlannerPanel
              key={activeSection}
              activeSection={activeSection}
              onSection={goTo}
              auth={auth}
              sheetDb={sheetDb}
              month={month}
              year={year}
              onPrepareNextMonth={openPreparedNextMonth}
            />
          </section>
        )}
      </main>

      <footer className="pager">
        {pageIndex > 0 ? <button type="button" onClick={() => move(-1)}>
          <ArrowLeft size={15} />
          Anterior
        </button> : <span />}
        <span>
          {pageIndex + 1} / {order.length}
        </span>
        {pageIndex < order.length - 1 ? <button type="button" onClick={() => move(1)}>
          Siguiente
          <ArrowRight size={15} />
        </button> : <span />}
      </footer>
      <nav className={`mobile-bottom-nav mobile-step-nav ${pageIndex === 0 ? "first-page" : ""} ${pageIndex === order.length - 1 ? "last-page" : ""}`} aria-label="Navegación entre páginas">
        {pageIndex > 0 ? <button className="nav-step" type="button" onClick={() => move(-1)}><ArrowLeft size={18} /><span>Anterior</span></button> : null}
        {pageIndex < order.length - 1 ? <button className="nav-step" type="button" onClick={() => move(1)}><ArrowRight size={18} /><span>Siguiente</span></button> : null}
      </nav>
    </div>
  );
}

export default function App() {
  const auth = { user: null, accessToken: "", spreadsheetId: "", signOut() {}, requestSheetsAccess() {} };
  return <AppShell auth={auth} />;
}
