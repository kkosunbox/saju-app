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
const scores = { totalScore: 78, love: 70, money: 70, work: 70, relationship: 70 };

test('the fortune date’s ten day stems map to the five elemental mascots', () => {
  const expected = ['wood', 'wood', 'fire', 'fire', 'earth', 'earth', 'metal', 'metal', 'water', 'water'];
  expected.forEach((element, stem) => assert.equal(getResultMascot(stem).element, element));
});
test('missing or invalid fortune day stems retain the original mascot', () => {
  [undefined, -1, 10, 1.5, NaN].forEach(stem => assert.equal(getResultMascot(stem).element, null));
});
test('unrevealed and malformed scores never imply a daily theme', () => {
  assert.equal(getResultMascot(0).accessory, null);
  [NaN, Infinity, -1, 101].forEach(totalScore => assert.equal(getResultMascot(0, { ...scores, totalScore }).accessory, null));
});
test('rest takes precedence below 60 without changing the date’s element', () => {
  assert.deepEqual(getResultMascot(4, { ...scores, totalScore: 59, love: 100 }), {
    element: 'earth', mood: 'gentle', accessory: 'cloud', label: '포근 젤리, 구름에 기대어 쉬어가요',
  });
  assert.equal(getResultMascot(4, { ...scores, totalScore: 60 }).accessory, 'star');
});
test('the strongest category chooses the prop, including exact threshold', () => {
  for (const [key, accessory] of [['love', 'heart'], ['money', 'coin'], ['work', 'pencil'], ['relationship', 'ribbon']]) {
    assert.equal(getResultMascot(2, { ...scores, [key]: 75 }).accessory, accessory);
  }
  assert.equal(getResultMascot(2, { ...scores, love: 74 }).accessory, 'star');
});
test('ties are stable and a bright expression starts at 80', () => {
  assert.equal(getResultMascot(8, { ...scores, love: 90, money: 90 }).accessory, 'heart');
  assert.equal(getResultMascot(8, { ...scores, totalScore: 79 }).mood, 'calm');
  assert.equal(getResultMascot(8, { ...scores, totalScore: 80 }).mood, 'bright');
});
