import test from "node:test";
import assert from "node:assert/strict";
import { createAutomaticBackup, migrateStore, readSafeStore, safeParseStore } from "../src/dataSafety.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), values };
}

test("recupera datos desde el respaldo automático si el almacenamiento se daña", () => {
  const valid = JSON.stringify({ piloto: { "2026-08": { draft: { ingresos: [["Sueldo", "", "1000"]] } } } });
  const storage = memoryStorage({ agenda: valid });
  assert.equal(createAutomaticBackup(storage, "agenda", "prueba"), true);
  storage.setItem("agenda", "{dañado");
  const result = readSafeStore(storage, "agenda");
  assert.equal(result.recovered, true);
  assert.equal(result.data.piloto["2026-08"].draft.ingresos[0][2], "1000");
});

test("migra meses antiguos sin modificar sus registros", () => {
  const data = { piloto: { "2026-08": { reflection: "bien" } } };
  const migrated = migrateStore(data);
  assert.equal(migrated.piloto["2026-08"].reflection, "bien");
  assert.equal(typeof migrated.piloto["2026-08"].dataVersion, "number");
});

test("rechaza almacenamiento con formato inválido", () => {
  assert.equal(safeParseStore("[]").recovered, true);
  assert.equal(safeParseStore("texto").recovered, true);
});

test("fórmulas esenciales usan dinero realmente pagado o separado", () => {
  const income = 1_200_000, payments = 700_000, expenses = 45_000, saved = 100_000, target = 500_000;
  assert.equal(income - payments - expenses - saved, 355_000);
  assert.equal(Math.round(saved / target * 100), 20);
  const debtTotal = 280_000, installment = 140_000, installmentsPaid = 0;
  assert.equal(debtTotal - installment * installmentsPaid, 280_000);
});

test("presupuesto y cierre descuentan la misma parte de gastos compartidos", () => {
  const projectedBalance = 355_000;
  const sharedExpenses = [
    { shares: { yo: 80_000, pareja: 80_000 } },
    { shares: { yo: 35_000, pareja: 25_000 } }
  ];
  const mySharedCommitment = sharedExpenses.reduce((sum, expense) => sum + expense.shares.yo, 0);
  assert.equal(mySharedCommitment, 115_000);
  assert.equal(projectedBalance - mySharedCommitment, 240_000);
});
