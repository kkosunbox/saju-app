const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const compiled = ts.transpileModule(fs.readFileSync('src/utils/mascotLayout.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const moduleExports = {};
new Function('exports', compiled)(moduleExports);
const { getMascotFrame } = moduleExports;
// Bounds measured from each PNG, independently of the rendering code.
const bounds = {
  original: [360, 332, 38, 333, 310], wood: [1254, 1254, 132, 1134, 1153],
  fire: [1254, 1254, 144, 1118, 1157], earth: [1254, 1254, 137, 1139, 1086],
  metal: [1254, 1254, 130, 1135, 1104], water: [1254, 1254, 116, 1169, 1109],
};
const near = (a, b) => assert.ok(Math.abs(a - b) < 0.001, `${a} ≈ ${b}`);
test('before and after drawing have the same visible width, center and ground at all UI sizes', () => {
  for (const size of [56, 64, 88, 103]) {
    for (const [variant, [width, height, left, right, bottom]] of Object.entries(bounds)) {
      const frame = getMascotFrame(variant, size);
      near(frame.width * (right - left) / width, size * 0.89);
      near(frame.left + frame.width * ((left + right) / 2) / width, size * 0.54);
      near(frame.top + frame.height * bottom / height, size * 0.93);
      near(frame.width / frame.height, width / height);
    }
  }
});
