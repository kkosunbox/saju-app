const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
// Compile the pure selection module without a test runner dependency.
const source = fs.readFileSync('src/utils/resultMascot.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const moduleExports = {};
new Function('exports', compiled)(moduleExports);
const { getResultMascot } = moduleExports;
const scores = { totalScore: 75, love: 70, money: 70, work: 70, relationship: 70 };
const pose = s => getResultMascot(s).pose;

test('unrevealed and malformed scores keep the original mascot', () => {
  assert.deepEqual(getResultMascot(), { pose: null, label: '무지개 젤리' });
  [NaN, Infinity, -1, 101].forEach(totalScore => assert.equal(pose({ ...scores, totalScore }), null));
});
test('the total chooses crown, question and rain at their exact thresholds', () => {
  assert.equal(pose({ ...scores, totalScore: 85 }), 'crown');
  assert.equal(pose({ ...scores, totalScore: 84 }), 'breeze');
  assert.equal(pose({ ...scores, totalScore: 66 }), 'breeze');
  assert.equal(pose({ ...scores, totalScore: 65, love: 100 }), 'question');
  assert.equal(pose({ ...scores, totalScore: 60 }), 'question');
  assert.equal(pose({ ...scores, totalScore: 59, love: 100 }), 'rain');
});
test('a standout category chooses its pose, including exact threshold', () => {
  for (const [key, expected] of [['love', 'hearts'], ['money', 'clover'], ['work', 'checklist'], ['relationship', 'hearts']]) {
    assert.equal(pose({ ...scores, [key]: 80 }), expected);
  }
  assert.equal(pose({ ...scores, love: 79 }), 'breeze');
});
test('ties are stable and sleepy is never chosen by score', () => {
  assert.equal(pose({ ...scores, money: 90, work: 90 }), 'clover');
  for (let total = 0; total <= 100; total++) assert.notEqual(pose({ ...scores, totalScore: total, love: total }), 'sleepy');
});
