const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function load(file, imports = {}) {
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  new Function('exports', 'require', compiled)(exports, name => {
    assert.ok(name in imports, `Unexpected import: ${name}`);
    return imports[name];
  });
  return exports;
}
const data = load('src/data/sajuData.ts');
const { characterScene, characterIndex } = load('src/data/characterScene.ts', { './sajuData': data });
const colors = ['푸른', '푸른', '붉은', '붉은', '노란', '노란', '하얀', '하얀', '검은', '검은'];

test('all 60 characters resolve the same artwork index and stem background by pillar or name', () => {
  const indices = new Set();
  const palettes = new Set();
  for (let i = 0; i < 60; i++) {
    const stem = data.STEMS[i % 10];
    const branch = data.BRANCHES[i % 12];
    const pillar = stem.hanja + branch.hanja;
    const name = `${colors[i % 10]} ${branch.animal}`;
    const scene = characterScene(pillar);
    assert.equal(characterIndex(pillar), i);
    assert.equal(scene.element, stem.element);
    assert.deepEqual(scene, characterScene(undefined, name));
    assert.equal(characterIndex(undefined, name), i);
    indices.add(characterIndex(pillar));
    palettes.add(scene.palette.background);
  }
  assert.equal(indices.size, 60);
  assert.equal(palettes.size, 5);
});

test('invalid pillars do not invent scenes; valid names provide a fallback', () => {
  for (const pillar of [undefined, '', '甲丑', '甲子extra', 'unknown']) {
    assert.equal(characterScene(pillar), null);
  }
  assert.deepEqual(characterScene('invalid', '하얀 소'), characterScene('辛丑'));
  assert.deepEqual(characterScene('甲子', '하얀 소'), characterScene('甲子'));
  assert.equal(characterScene(undefined, 'unknown'), null);
});
