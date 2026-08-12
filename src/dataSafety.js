export const DATA_VERSION = 2;
export const BACKUP_KEY = "agenda_financiera_automatic_backup";
export const RECOVERY_KEY = "agenda_financiera_recovery_log";

export function safeParseStore(raw) {
  if (!raw) return { data: {}, recovered: false };
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
    return { data: parsed, recovered: false };
  } catch {
    return { data: {}, recovered: true };
  }
}

export function migrateStore(data) {
  const next = { ...(data || {}) };
  Object.values(next).forEach((userMonths) => {
    if (!userMonths || typeof userMonths !== "object") return;
    Object.keys(userMonths).forEach((monthKey) => {
      const month = userMonths[monthKey];
      if (!month || typeof month !== "object") return;
      userMonths[monthKey] = { ...month, dataVersion: DATA_VERSION };
    });
  });
  return next;
}

export function createAutomaticBackup(storage, storeKey, reason = "actualización") {
  const raw = storage.getItem(storeKey);
  if (!raw) return false;
  const snapshot = { version: DATA_VERSION, reason, createdAt: new Date().toISOString(), data: raw };
  storage.setItem(BACKUP_KEY, JSON.stringify(snapshot));
  return true;
}

export function readSafeStore(storage, storeKey) {
  const current = safeParseStore(storage.getItem(storeKey));
  if (!current.recovered) return { data: migrateStore(current.data), recovered: false };
  const backup = safeParseStore(storage.getItem(BACKUP_KEY));
  try {
    const snapshot = backup.data;
    const restored = safeParseStore(snapshot?.data);
    if (!restored.recovered) {
      const data = migrateStore(restored.data);
      storage.setItem(storeKey, JSON.stringify(data));
      storage.setItem(RECOVERY_KEY, new Date().toISOString());
      return { data, recovered: true };
    }
  } catch {}
  return { data: {}, recovered: true };
}
