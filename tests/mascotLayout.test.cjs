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
  original: [360, 332, 38, 333, 310], crown: [1188, 1184, 120, 1112, 1160],
  hearts: [1188, 1184, 68, 1044, 1112], clover: [1184, 1184, 96, 1136, 1128],
  checklist: [1184, 1184, 80, 1084, 1010], breeze: [1184, 1184, 124, 972, 1020],
  question: [1184, 1184, 124, 1104, 1028], rain: [1184, 1184, 128, 1040, 1028],
  sleepy: [1184, 1184, 100, 1036, 1008],
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
