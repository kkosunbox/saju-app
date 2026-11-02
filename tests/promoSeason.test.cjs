const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync('src/services/promo/promos.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const parseISO = iso => { const [y, m, d] = iso.split('-').map(Number); return { y, m, d }; };
const stubs = { '../../utils/date': { parseISO }, '../premium/catalog': { ITEMS: new Proxy({}, { get: () => () => ({}) }) } };
const moduleExports = {};
new Function('exports', 'require', compiled)(moduleExports, name => stubs[name] ?? {});
const { isNewYearSeason, newYearOf, monthOf } = moduleExports;

test('the new-year season runs from November to January', () => {
  assert.equal(isNewYearSeason('2026-10-31'), false);
  assert.equal(isNewYearSeason('2026-11-01'), true);
  assert.equal(isNewYearSeason('2026-12-31'), true);
  assert.equal(isNewYearSeason('2027-01-15'), true);
  assert.equal(isNewYearSeason('2027-02-01'), false);
});
test('November and December point to next year, January to this year', () => {
  assert.equal(newYearOf('2026-11-02'), 2027);
  assert.equal(newYearOf('2026-12-31'), 2027);
  assert.equal(newYearOf('2027-01-10'), 2027);
  assert.equal(newYearOf('2026-06-01'), 2026);
});
test('from the 25th the monthly reading is next month, across the year end too', () => {
  assert.deepEqual(monthOf('2026-11-24'), { y: 2026, m: 11, next: false });
  assert.deepEqual(monthOf('2026-11-25'), { y: 2026, m: 12, next: true });
  assert.deepEqual(monthOf('2026-12-28'), { y: 2027, m: 1, next: true });
});
