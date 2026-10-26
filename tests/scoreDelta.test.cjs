const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync('src/utils/scoreDelta.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const moduleExports = {};
new Function('exports', compiled)(moduleExports);
const { scoreDelta, scoreDeltaLabel } = moduleExports;

test('any difference is shown with its sign, even one point', () => {
  assert.equal(scoreDelta(80, 77), 3);
  assert.equal(scoreDelta(70, 72), -2);
  assert.equal(scoreDelta(80, 79), 1);
  assert.equal(scoreDelta(80, 81), -1);
});
test('no change stays hidden', () => {
  assert.equal(scoreDelta(80, 80), null);
});
test('fortunes without yesterday scores show nothing', () => {
  [undefined, null].forEach(before => {
    assert.equal(scoreDelta(80, before), null);
    assert.equal(scoreDeltaLabel(80, before), '');
  });
});
test('the screen reader label says how far it moved', () => {
  assert.equal(scoreDeltaLabel(80, 75), ' 어제보다 5점 올랐어요');
  assert.equal(scoreDeltaLabel(60, 64), ' 어제보다 4점 내렸어요');
});
