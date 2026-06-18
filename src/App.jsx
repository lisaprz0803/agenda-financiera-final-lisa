import { useEffect, useMemo, useRef, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Download,
  Heart,
  Loader2,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  TrendingDown
} from "lucide-react";
import heroPlanner from "../assets/hero-plata.jpg";
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
    id: "mapa",
    label: "Mapa",
    icon: LayoutDashboard,
    title: "Mapa de la agenda",
    description: "Elige una sección o usa Siguiente para recorrer el prototipo completo.",
    message: "No necesitas tener todo resuelto. Solo necesitas empezar con claridad."
  },
  {
    id: "checklist",
    label: "Checklist",
    icon: CheckCircle2,
    title: "Checklist del mes",
    description: "Marca cada paso con calma y deja visible lo que ya avanzaste.",
    message: "Pequeñas acciones repetidas también construyen estabilidad."
  },
  {
    id: "ingresos",
    label: "Ingresos",
    icon: Plus,
    title: "Ingresos",
    description: "Anota tus entradas de dinero y las fechas en que esperas recibirlas.",
    message: "Este mes quiero mirar mi dinero con calma, no con miedo."
  },
  {
    id: "pagos",
    label: "Pagos",
    icon: CheckCircle2,
    title: "Pagos del mes",
    description: "Marca lo que ya está pagado y deja a la vista lo que necesita atención.",
    message: "Lo que se anota deja de dar vueltas en la cabeza."
  },
  {
    id: "presupuesto",
    label: "Presupuesto",
    icon: CircleDollarSign,
    title: "Presupuesto",
    description: "Ordena ingresos, gastos y decisiones antes de que el mes tome velocidad.",
    message: "Un presupuesto no es una restricción, es una guía para cuidarte mejor."
  },
  {
    id: "ahorro",
    label: "Ahorro",
    icon: PiggyBank,
    title: "Ahorro",
    description: "Visualiza tu meta y celebra cada avance pequeño sin perder la calma.",
    message: "Ahorrar aunque sea poco sigue siendo elegirte."
  },
  {
    id: "deudas",
    label: "Deudas",
    icon: TrendingDown,
    title: "Deudas",
    description: "Mira tus compromisos con calma y define cuál atender primero.",
    message: "Cada gasto cuenta una historia. Mirarlo con honestidad también es avanzar."
  },
  {
    id: "cierre",
    label: "Cierre",
    icon: Heart,
    title: "Cierre mensual",
    description: "Registra aprendizajes, logros y ajustes para el próximo ciclo.",
    message: "Mirar hacia atrás también te ayuda a avanzar."
  }
];

const quickStats = [
  { label: "Avance", value: "62%", helper: "7 secciones activas" },
  { label: "Meta", value: "$", helper: "Ahorro del mes" },
  { label: "Foco", value: "Calma", helper: "Decidir con claridad" }
];

const checklistItems = [
  "Revisar ingresos",
  "Registrar pagos importantes",
  "Revisar gastos diarios",
  "Separar ahorro",
  "Revisar suscripciones",
  "Hacer balance del mes",
  "Anotar pendientes",
  "Celebrar un avance"
];

const statusOptions = ["Pagado", "Pendiente", "Revisar", "Parcial"];
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
const reminderStickers = ["💸", "⚠️", "✅", "🎯", "💜", "🌸", "🧾", "🐷"];
const rowTemplates = {
  ingresos: ["", "Mensual", "", "Revisar", ""],
  pagos: ["Servicios", "", "Día 1", "", "", "", "Pendiente", "Transferencia"],
  ahorros: ["", "", "", "0%", ""],
  gastos: [new Date().toLocaleDateString("es-CL"), "", "Servicios", "", "Transferencia", ""]
};

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
  return String(auth.user?.email || "demo").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
}

function readLocalMonth(userKey, monthKey) {
  try {
    const allData = JSON.parse(localStorage.getItem(MONTHLY_STORE_KEY) || "{}");
    return allData[userKey]?.[monthKey] || null;
  } catch {
    return null;
  }
}

function writeLocalMonth(userKey, monthKey, payload) {
  try {
    const allData = JSON.parse(localStorage.getItem(MONTHLY_STORE_KEY) || "{}");
    const userData = allData[userKey] || {};
    localStorage.setItem(MONTHLY_STORE_KEY, JSON.stringify({ ...allData, [userKey]: { ...userData, [monthKey]: payload } }));
  } catch {
    // Local persistence is best effort.
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

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function getFinancialSummary(draft) {
  const incomeTotal = draft.ingresos.reduce((sum, row) => sum + parseMoney(row[2]), 0);
  const monthlyPayments = draft.pagos.reduce((sum, row) => sum + parseMoney(row[4] || row[3]), 0);
  const dailyExpenses = draft.gastos.reduce((sum, row) => sum + parseMoney(row[3]), 0);
  const savingsTarget = draft.ahorros.reduce((sum, row) => sum + parseMoney(row[1]), 0);
  const savingsSaved = draft.ahorros.reduce((sum, row) => sum + parseMoney(row[2]), 0);
  const projectedBalance = incomeTotal - monthlyPayments - dailyExpenses - savingsTarget;
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
  const [status, setStatus] = useState({
    loading: false,
    saving: false,
    loaded: false,
    message: "Mes listo para registrar tus datos.",
    error: ""
  });
  const storeRef = useRef({ db: null, ready: false });

  async function persistMonth(nextDraft = draft, nextCalendar = calendar, nextReflection = reflection) {
    const userKey = getUserKey(auth);
    const payload = {
      draft: nextDraft,
      calendar: nextCalendar,
      reflection: nextReflection,
      updatedAt: new Date().toISOString()
    };
    writeLocalMonth(userKey, monthKey, payload);
    if (!storeRef.current.ready) {
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
      if (!storeRef.current.ready) {
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
      setStatus({
        loading: false,
        saving: false,
        loaded: Boolean(payload),
        message: payload ? "Mes cargado desde Firebase/local." : "Mes nuevo listo para registrar datos.",
        error: ""
      });
    } catch {
      const payload = readLocalMonth(userKey, monthKey);
      const nextDraft = cleanDraftData(payload?.draft || emptySheetData());
      setSheetData(nextDraft);
      setDraft(nextDraft);
      setCalendar(payload?.calendar || {});
      setReflection(payload?.reflection || "");
      setStatus({
        loading: false,
        saving: false,
        loaded: Boolean(payload),
        message: "Usando respaldo local del mes.",
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
      const nextDraft = {
        ...current,
        [section]: current[section].map((row, index) =>
          index === rowIndex ? row.map((cell, cellIndex) => (cellIndex === columnIndex ? value : cell)) : row
        )
      };
      persistMonth(nextDraft);
      return nextDraft;
    });
  }

  function addRow(section, template = []) {
    setDraft((current) => {
      const nextDraft = { ...current, [section]: [...current[section], template] };
      persistMonth(nextDraft);
      return nextDraft;
    });
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

  return {
    sheetData,
    draft,
    status,
    calendar,
    reflection,
    loadData,
    updateCell,
    addRow,
    saveSection,
    appendDailyExpense,
    deleteRow,
    updateCalendarDay,
    updateReflection
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
  const paymentsDone = sheetDb.draft.pagos.filter((row) => String(row[6] || "").toLowerCase().includes("pagado")).length;
  const liveStats = [
    { label: "Ingreso base", value: formatCurrency(summary.incomeTotal), helper: "Desde hoja Ingresos" },
    { label: "Ahorro", value: `${summary.savingsProgress}%`, helper: "Meta vs. separado" },
    { label: "Saldo proyectado", value: formatCurrency(summary.projectedBalance), helper: `${paymentsDone} pagos marcados` }
  ];
  return (
    <div className="stat-strip" aria-label="Resumen">
      {(sheetDb.status.loaded ? liveStats : quickStats).map((stat) => (
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
        <img src={heroPlanner} alt="Agenda financiera con cuaderno, calculadora y alcancía" />
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
        <p className="intro">Un espacio para mirar tu dinero con más claridad, calma y confianza.</p>
        <div className="mini-note">
          Esta agenda ordena tu mes visualmente; Google Sheets guarda los números, cálculos y seguimiento.
        </div>
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

function PlannerPanel({ activeSection, onSection, auth, sheetDb, month, year }) {
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
        <div className="panel-actions">
          {!auth.accessToken ? (
            <button className="utility-button" type="button" onClick={auth.requestSheetsAccess}>
              <RefreshCw size={16} />
              Conectar Sheet
            </button>
          ) : (
            <button className="utility-button" type="button" onClick={sheetDb.loadData} disabled={sheetDb.status.loading}>
              {sheetDb.status.loading ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
              Refrescar
            </button>
          )}
          <button className="utility-button" type="button" onClick={() => window.print()}>
            <Download size={16} />
            Imprimir
          </button>
        </div>
      </header>

      <SyncBanner auth={auth} sheetDb={sheetDb} />
      <QuoteCard text={section.message} />

      <div className="panel-body">
        {activeSection === "mapa" ? <MapSection onSection={onSection} /> : null}
        {activeSection === "checklist" ? <ChecklistSection /> : null}
        {activeSection === "ingresos" ? <IncomeSection sheetDb={sheetDb} /> : null}
        {activeSection === "pagos" ? <PaymentsSection sheetDb={sheetDb} /> : null}
        {activeSection === "presupuesto" ? <BudgetSection sheetDb={sheetDb} month={month} year={year} /> : null}
        {activeSection === "ahorro" ? <SavingsSection sheetDb={sheetDb} /> : null}
        {activeSection === "deudas" ? <DebtSection sheetDb={sheetDb} /> : null}
        {activeSection === "cierre" ? <CloseSection sheetDb={sheetDb} /> : null}
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
      <span>{sheetDb.status.error || sheetDb.status.message}</span>
      {!auth.accessToken ? (
        <button type="button" onClick={auth.requestSheetsAccess}>
          Conectar Google Sheets
        </button>
      ) : null}
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

function ChecklistSection() {
  const [checked, setChecked] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CHECKLIST_STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  });

  function toggle(item) {
    setChecked((current) => {
      const next = { ...current, [item]: !current[item] };
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  const done = checklistItems.filter((item) => checked[item]).length;

  return (
    <div className="checklist-layout">
      <div className="checklist-card">
        <div className="checklist-summary">
          <strong>{done}/{checklistItems.length}</strong>
          <span>pasos completados</span>
        </div>
        <p>Marca cada paso con calma. No se trata de hacerlo perfecto, se trata de hacerlo visible.</p>
        <div className="checklist-items">
          {checklistItems.map((item) => (
            <label className={checked[item] ? "task checked" : "task"} key={item}>
              <input type="checkbox" checked={Boolean(checked[item])} onChange={() => toggle(item)} />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>
      <VisualNote
        image={visualChecklist}
        alt="Checklist financiero en tonos lila"
        title="Celebrar un avance también cuenta"
        text="Aunque sea pequeño, deja registro de lo que sí hiciste esta semana."
      />
    </div>
  );
}

function IncomeSection({ sheetDb }) {
  const rows = sheetDb.draft.ingresos.length ? sheetDb.draft.ingresos : [["", "", "", "", ""]];
  return (
    <div className="stack">
      <div className="soft-table income-table header">
        <strong>Fuente</strong>
        <strong>Tipo</strong>
        <strong>Monto mensual</strong>
        <strong>Estado</strong>
        <strong>Notas</strong>
        <strong>Eliminar</strong>
      </div>
      {rows.map((row, rowIndex) => (
        <div className="soft-table income-table" key={`${row[0]}-${rowIndex}`}>
          {row.map((cell, columnIndex) => (
            <input
              aria-label={`Ingreso fila ${rowIndex + 1} columna ${columnIndex + 1}`}
              key={columnIndex}
              value={cell}
              onChange={(event) => sheetDb.updateCell("ingresos", rowIndex, columnIndex, event.target.value)}
            />
          ))}
          <DeleteRowButton
            label={`Eliminar ingreso fila ${rowIndex + 1}`}
            disabled={sheetDb.status.saving}
            onClick={() => sheetDb.deleteRow("ingresos", rowIndex)}
          />
        </div>
      ))}
      <div className="total-card">
        <span>Fuente principal</span>
        <strong>{rows[0]?.[2] || "$"}</strong>
      </div>
      <AddRowButton label="Agregar ingreso" onClick={() => sheetDb.addRow("ingresos", rowTemplates.ingresos)} />
      <SaveButton label="Guardar ingresos" onClick={() => sheetDb.saveSection("ingresos")} saving={sheetDb.status.saving} />
    </div>
  );
}

function PaymentsSection({ sheetDb }) {
  const payments = sheetDb.draft.pagos.length ? sheetDb.draft.pagos : [["", "", "", "", "", "", "", ""]];
  const summary = getFinancialSummary(sheetDb.draft);
  return (
    <div className="stack">
      <VisualNote
        image={visualPayments}
        alt="Calendario de pagos con tarjeta, recibo y monedas"
        title="Calendario de pagos"
        text="Ten tus pagos a la vista para evitar sorpresas y decidir con más calma."
        wide
      />
      <div className="table-scroll" aria-label="Pagos mensuales">
        <div className="soft-table payments-table header">
          <strong>Categoría</strong>
          <strong>Concepto</strong>
          <strong>Fecha</strong>
          <strong>Total</strong>
          <strong>Mi parte</strong>
          <strong>Catriel</strong>
          <strong>Estado</strong>
          <strong>Forma de pago</strong>
          <strong>Eliminar</strong>
        </div>
        {payments.map((row, rowIndex) => (
          <div className="soft-table payments-table" key={`${row[1]}-${rowIndex}`}>
            {row.map((cell, columnIndex) => {
              const statusValue = statusOptions.includes(String(cell).trim()) ? String(cell).trim() : "Revisar";
              if (columnIndex === 0) {
                const categoryValue = findOption(cell, categoryOptions);
                return (
                  <select
                    aria-label={`Categoría pago fila ${rowIndex + 1}`}
                    key={columnIndex}
                    value={categoryValue}
                    onChange={(event) => sheetDb.updateCell("pagos", rowIndex, columnIndex, event.target.value)}
                  >
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                );
              }
              if (columnIndex === 6) {
                return (
                <select
                  aria-label={`Estado pago fila ${rowIndex + 1}`}
                  className={`status-select status-${statusValue.toLowerCase()}`}
                  key={columnIndex}
                  value={statusValue}
                  onChange={(event) => sheetDb.updateCell("pagos", rowIndex, columnIndex, event.target.value)}
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                );
              }
              if (columnIndex === 2) {
                const dateValue = findOption(cell, paymentDateOptions, "Variable");
                return (
                  <select
                    aria-label={`Fecha pago fila ${rowIndex + 1}`}
                    key={columnIndex}
                    value={dateValue}
                    onChange={(event) => sheetDb.updateCell("pagos", rowIndex, columnIndex, event.target.value)}
                  >
                    {paymentDateOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                );
              }
              if (columnIndex === 7) {
                const methodValue = detectPaymentMethod(cell);
                return (
                  <select
                    aria-label={`Forma de pago fila ${rowIndex + 1}`}
                    key={columnIndex}
                    value={methodValue}
                    onChange={(event) => sheetDb.updateCell("pagos", rowIndex, columnIndex, event.target.value)}
                  >
                    {paymentMethodOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                );
              }
              return (
                <input
                  aria-label={`Pago fila ${rowIndex + 1} columna ${columnIndex + 1}`}
                  key={columnIndex}
                  value={cell}
                  onChange={(event) => sheetDb.updateCell("pagos", rowIndex, columnIndex, event.target.value)}
                />
              );
            })}
            <DeleteRowButton
              label={`Eliminar pago fila ${rowIndex + 1}`}
              disabled={sheetDb.status.saving}
              onClick={() => sheetDb.deleteRow("pagos", rowIndex)}
            />
          </div>
        ))}
      </div>
      <div className="formula-note">
        <strong>Total de pagos personales:</strong> {formatCurrency(summary.monthlyPayments)}
        <span>Se calcula con la columna <strong>Mi parte</strong> y se refleja en presupuesto y proyección.</span>
      </div>
      <AddRowButton label="Agregar pago" onClick={() => sheetDb.addRow("pagos", rowTemplates.pagos)} />
      <SaveButton label="Guardar pagos" onClick={() => sheetDb.saveSection("pagos")} saving={sheetDb.status.saving} />
    </div>
  );
}

function BudgetSection({ sheetDb, month, year }) {
  const summary = getFinancialSummary(sheetDb.draft);
  const dailyExpenses = sheetDb.draft.gastos.length;
  return (
    <div className="form-grid">
      <ReadOnlyCard label="Ingresos esperados" value={formatCurrency(summary.incomeTotal)} helper="Suma de Ingresos" />
      <ReadOnlyCard label="Pagos mensuales" value={formatCurrency(summary.monthlyPayments)} helper="Suma de Mi parte" />
      <ReadOnlyCard label="Gastos diarios" value={formatCurrency(summary.dailyExpenses)} helper={`${dailyExpenses} registros`} />
      <ReadOnlyCard label="Meta de ahorro" value={formatCurrency(summary.savingsTarget)} helper="Suma de metas de Ahorros" />
      <BudgetChart summary={summary} />
      <ReadOnlyCard
        label="Saldo proyectado"
        value={formatCurrency(summary.projectedBalance)}
        helper="Ingresos - pagos - gastos - ahorro"
        wide
      />
      <ReadOnlyCard label="Falta por ahorrar" value={formatCurrency(summary.savingsGap)} helper="Meta - separado este mes" />
      <VisualNote
        image={visualBudget}
        alt="Presupuesto con gráfico y distribución de gastos"
        title="Distribuye según tus prioridades reales"
        text="Tu presupuesto puede ajustarse mes a mes. Lo importante es verlo completo."
        wide
      />
      <DailyExpenseForm onSubmit={sheetDb.appendDailyExpense} saving={sheetDb.status.saving} />
      <MonthlyCalendar sheetDb={sheetDb} month={month} year={year} />
      <DailyExpensesList sheetDb={sheetDb} />
    </div>
  );
}

function SavingsSection({ sheetDb }) {
  const rows = sheetDb.draft.ahorros.length ? sheetDb.draft.ahorros : [["", "", "", "", ""]];
  const summary = getFinancialSummary(sheetDb.draft);
  const progressNumber = summary.savingsProgress;
  const filled = Math.max(0, Math.min(10, Math.round(progressNumber / 10)));
  return (
    <div className="savings-layout">
      <div className="soft-table income-table header">
        <strong>Objetivo</strong>
        <strong>Meta mensual</strong>
        <strong>Separado este mes</strong>
        <strong>Avance</strong>
        <strong>Notas</strong>
        <strong>Eliminar</strong>
      </div>
      {rows.map((row, rowIndex) => (
        <div className="soft-table income-table" key={`${row[0]}-${rowIndex}`}>
          {row.map((cell, columnIndex) => (
            <input
              aria-label={`Ahorro fila ${rowIndex + 1} columna ${columnIndex + 1}`}
              key={columnIndex}
              value={cell}
              onChange={(event) => sheetDb.updateCell("ahorros", rowIndex, columnIndex, event.target.value)}
            />
          ))}
          <DeleteRowButton
            label={`Eliminar ahorro fila ${rowIndex + 1}`}
            disabled={sheetDb.status.saving}
            onClick={() => sheetDb.deleteRow("ahorros", rowIndex)}
          />
        </div>
      ))}
      <div className="coin-grid" aria-label="Progreso de ahorro">
        {Array.from({ length: 10 }, (_, index) => (
          <button
            className={index < filled ? "coin filled" : "coin"}
            key={index}
            type="button"
            onClick={() => sheetDb.updateCell("ahorros", 0, 3, `${(index + 1) * 10}%`)}
            aria-label={`Marcar ahorro ${index + 1}`}
          />
        ))}
      </div>
      <div className="insight-card">
        <PiggyBank size={20} />
        <span><strong>{progressNumber}%</strong> de avance calculado. Falta <strong>{formatCurrency(summary.savingsGap)}</strong>.</span>
      </div>
      <VisualNote
        image={visualSavings}
        alt="Alcancía pastel con monedas y meta de ahorro"
        title="Bloque de ahorro"
        text="Meta de ahorro, llevo ahorrado y me falta. Separar aunque sea poco también es elegirte."
      />
      <AddRowButton label="Agregar meta de ahorro" onClick={() => sheetDb.addRow("ahorros", rowTemplates.ahorros)} />
      <SaveButton label="Guardar ahorros" onClick={() => sheetDb.saveSection("ahorros")} saving={sheetDb.status.saving} />
    </div>
  );
}

function DebtSection({ sheetDb }) {
  const rows = sheetDb.draft.pagos.filter((row) =>
    ["tarjeta", "crédito", "credito", "cuota"].some((word) => String(row.join(" ")).toLowerCase().includes(word))
  );
  return (
    <div className="stack">
      <div className="soft-table header">
        <strong>Deuda</strong>
        <strong>Cuota</strong>
        <strong>Estado</strong>
      </div>
      {(rows.length ? rows : [["Sin deudas detectadas", "", ""]]).map((row, index) => (
        <div className="soft-table" key={`${row[1]}-${index}`}>
          <span>{row[1] || row[0]}</span>
          <span>{row[4] || row[3] || "$"}</span>
          <span className="pill">{row[6] || "Revisar"}</span>
        </div>
      ))}
      <Field label="Prioridad del mes" placeholder="Ej: pagar tarjeta antes del 20" wide />
    </div>
  );
}

function CloseSection({ sheetDb }) {
  const summary = getFinancialSummary(sheetDb.draft);

  function addSticker(sticker) {
    const label = `${sticker.icon} ${sticker.label}`;
    sheetDb.updateReflection(sheetDb.reflection ? `${sheetDb.reflection}\n${label}: ` : `${label}: `);
  }

  return (
    <div className="stack">
      <VisualNote
        image={visualClose}
        alt="Hoja de cierre mensual con estrella y líneas de reflexión"
        title="Haz un cierre amable"
        text="Reconoce lo que lograste, lo que aprendiste y lo que quieres mejorar."
      />
      <div className="close-summary">
        <ReadOnlyCard label="Saldo proyectado" value={formatCurrency(summary.projectedBalance)} helper="Resumen del mes" />
        <ReadOnlyCard label="Ahorro separado" value={formatCurrency(summary.savingsSaved)} helper={`${summary.savingsProgress}% de avance`} />
      </div>
      <div className="sticker-board" aria-label="Stickers de progreso">
        {progressStickers.map((sticker) => (
          <button key={sticker.label} type="button" onClick={() => addSticker(sticker)}>
            <span>{sticker.icon}</span>
            <strong>{sticker.label}</strong>
          </button>
        ))}
      </div>
      <textarea
        className="reflection"
        placeholder="Este mes me sentí..."
        value={sheetDb.reflection}
        onChange={(event) => sheetDb.updateReflection(event.target.value)}
      />
      <div className="form-grid">
        <Field label="Logro financiero" placeholder="Lo que sí funcionó" />
        <Field label="Ajuste para el próximo mes" placeholder="Algo que quiero cambiar" />
        <Field label="Un gasto que valió la pena" placeholder="Algo que disfruté o me ayudó" />
        <Field label="El próximo mes quiero" placeholder="Una intención sencilla" />
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

function BudgetChart({ summary }) {
  const items = [
    { label: "Pagos", value: summary.monthlyPayments },
    { label: "Gastos", value: summary.dailyExpenses },
    { label: "Ahorro", value: summary.savingsTarget }
  ];
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="budget-chart">
      <div>
        <span>Gráfico del mes</span>
        <strong>¿A dónde se está yendo?</strong>
      </div>
      <div className="chart-bars" aria-label="Distribución de presupuesto">
        {items.map((item) => (
          <div className="chart-row" key={item.label}>
            <span>{item.label}</span>
            <div className="chart-track">
              <i style={{ width: `${Math.max(6, (item.value / maxValue) * 100)}%` }} />
            </div>
            <strong>{formatCurrency(item.value)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthlyCalendar({ sheetDb, month, year }) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function addSticker(day, sticker) {
    const current = sheetDb.calendar[day] || "";
    sheetDb.updateCalendarDay(day, current ? `${current} ${sticker}` : sticker);
  }

  return (
    <div className="monthly-calendar wide">
      <div className="list-heading">
        <h3>Calendario mensual</h3>
        <span>{monthNames[month]} {year}</span>
      </div>
      <p>Escribe recordatorios, pagos o alertas. Cada mes queda guardado por separado.</p>
      <div className="calendar-stickers" aria-label="Stickers para recordatorios">
        {reminderStickers.map((sticker) => (
          <span key={sticker}>{sticker}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = String(index + 1);
          return (
            <div className="calendar-day" key={day}>
              <strong>{day}</strong>
              <input
                aria-label={`Recordatorio día ${day}`}
                value={sheetDb.calendar[day] || ""}
                onChange={(event) => sheetDb.updateCalendarDay(day, event.target.value)}
                placeholder="Recordatorio"
              />
              <div className="day-stickers">
                {reminderStickers.slice(0, 4).map((sticker) => (
                  <button key={sticker} type="button" onClick={() => addSticker(day, sticker)} aria-label={`Agregar ${sticker} al día ${day}`}>
                    {sticker}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DailyExpensesList({ sheetDb }) {
  const rows = sheetDb.draft.gastos;

  return (
    <div className="daily-list wide">
      <div className="list-heading">
        <h3>Gastos del mes</h3>
        <span>{rows.length} líneas registradas</span>
      </div>
      <div className="table-scroll" aria-label="Gastos diarios registrados">
        <div className="soft-table daily-table header">
          <strong>Fecha</strong>
          <strong>Concepto</strong>
          <strong>Categoría</strong>
          <strong>Monto</strong>
          <strong>Forma de pago</strong>
          <strong>Nota</strong>
          <strong>Eliminar</strong>
        </div>
        {(rows.length ? rows : [["", "Sin gastos registrados", "", "", "", ""]]).map((row, rowIndex) => (
          <div className="soft-table daily-table" key={`${row[1]}-${rowIndex}`}>
            {row.map((cell, columnIndex) => (
              <span key={columnIndex}>{cell || "-"}</span>
            ))}
            {rows.length ? (
              <DeleteRowButton
                label={`Eliminar gasto fila ${rowIndex + 1}`}
                disabled={sheetDb.status.saving}
                onClick={() => sheetDb.deleteRow("gastos", rowIndex)}
              />
            ) : (
              <span />
            )}
          </div>
        ))}
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

function AddRowButton({ label, onClick }) {
  return (
    <button className="add-row" type="button" onClick={onClick}>
      <Plus size={15} />
      {label}
    </button>
  );
}

function DailyExpenseForm({ onSubmit, saving }) {
  const today = new Date().toLocaleDateString("es-CL");
  const [expense, setExpense] = useState({
    date: today,
    concept: "",
    category: "Servicios",
    amount: "",
    method: "Transferencia",
    note: ""
  });

  function update(field, value) {
    setExpense((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    await onSubmit(expense);
    setExpense({ date: today, concept: "", category: "Servicios", amount: "", method: "Transferencia", note: "" });
  }

  return (
    <form className="daily-form wide" onSubmit={submit}>
      <h3>Agregar gasto diario</h3>
      <div className="daily-grid">
        <input value={expense.date} onChange={(event) => update("date", event.target.value)} aria-label="Fecha" />
        <input
          value={expense.concept}
          onChange={(event) => update("concept", event.target.value)}
          placeholder="Concepto"
          aria-label="Concepto"
          required
        />
        <select
          value={expense.category}
          onChange={(event) => update("category", event.target.value)}
          aria-label="Categoría"
        >
          {categoryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <input
          value={expense.amount}
          onChange={(event) => update("amount", event.target.value)}
          placeholder="$"
          aria-label="Monto"
          required
        />
        <select
          value={expense.method}
          onChange={(event) => update("method", event.target.value)}
          aria-label="Forma de pago"
        >
          {paymentMethodOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <input
          value={expense.note}
          onChange={(event) => update("note", event.target.value)}
          placeholder="Nota amable"
          aria-label="Nota amable"
        />
      </div>
      <SaveButton label="Agregar a Gastos Diarios" saving={saving} type="submit" />
    </form>
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
  const monthKey = getMonthKey(month, year);
  const sheetDb = useSheetDatabase(auth, monthKey);

  const order = useMemo(() => ["cover", ...sections.map((section) => section.id)], []);
  const topNavIds = ["pagos", "presupuesto", "ahorro", "checklist"];
  const pageIndex = order.indexOf(current);
  const activeSection = current === "cover" ? "mapa" : current;
  const progress = Math.round(((pageIndex + 1) / order.length) * 100);
  const theme = current === "cover" ? "cover" : activeSection;

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
    <div className={`app-shell theme-${theme}`}>
      <header className="topbar">
        <div className="brand">
          <Sparkles size={16} />
          ¿DÓNDE SE FUE MI PLATA?
        </div>
        <nav className="topnav" aria-label="Navegación principal">
          <button className={current === "cover" ? "active" : ""} type="button" onClick={() => setCurrent("cover")}>
            Inicio
          </button>
          {topNavIds.map((id) => sections.find((section) => section.id === id)).map((section) => (
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
          {!auth.accessToken ? (
            <button className="connect-mini" type="button" onClick={auth.requestSheetsAccess}>
              Sheet
            </button>
          ) : null}
          <span>{auth.user?.email}</span>
          <button type="button" onClick={auth.signOut} aria-label="Cerrar sesión">
            <LogOut size={15} />
          </button>
        </div>
      </header>

      <main className="workspace">
        <div className="side-visual left" aria-hidden="true">
          <img src={visualPayments} alt="" />
          <span>mirar con calma</span>
        </div>
        <div className="side-visual right" aria-hidden="true">
          <img src={visualSavings} alt="" />
          <span>avance amable</span>
        </div>
        {current === "cover" ? (
          <>
            <Cover onStart={() => setCurrent("mapa")} />
            <SyncBanner auth={auth} sheetDb={sheetDb} />
            <StatStrip sheetDb={sheetDb} />
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
            <PlannerPanel
              activeSection={activeSection}
              onSection={setCurrent}
              auth={auth}
              sheetDb={sheetDb}
              month={month}
              year={year}
            />
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
