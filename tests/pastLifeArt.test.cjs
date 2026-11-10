const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(file, resolve) {
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  new Function('exports', 'require', compiled)(exports, resolve);
  return exports;
}
const { resolvePastLifeArt } = load('src/data/pastLifeArt.ts', name => path.resolve('src/data', name));
const { pastLifeSpec } = load('src/services/share/shareSpecs.ts', name =>
  name === './shareCopy' ? { carriedTalent: value => value } : {});
const roles = [
  '의원', '서당 훈장', '약초꾼', '사서', '궁중 화원', '떠돌이 광대', '등불 장인', '조향사',
  '큰 객주의 상인', '도자기 장인', '여관 주인', '지도 제작자', '호위 무사', '대장장이',
  '보석 세공사', '왕실 기록관', '밤하늘을 읽던 점성가', '떠돌이 시인', '뱃사공', '꿈을 풀던 해몽가',
];
const korean = ['고려의 개경', '조선의 한양', '신라의 서라벌', '백제의 사비성', '발해의 상경성'];
const foreign = ['송나라의 항저우', '르네상스의 피렌체', '고대 이집트의 테베', '에도 시대의 교토', '빅토리아 시대의 런던', '고대 그리스의 아테네', '실크로드의 사마르칸트'];
const aliases = { '서당 훈장': '학당 선생', '궁중 화원': '궁정 화가', '큰 객주의 상인': '큰 상단의 상인' };

test('all 20 occupations resolve distinct bundled artwork in every server era', () => {
  const sources = new Set();
  for (const [eras, variant] of [[korean, 'korean'], [foreign, 'foreign']]) {
    for (const [i, role] of roles.entries()) {
      for (const era of eras) {
        const result = resolvePastLifeArt({ role, era });
        assert.ok(result.key.startsWith(`${variant}/`));
        assert.ok(result.source.includes(`/past-life/${variant}/${String(i + 1).padStart(2, '0')}-`));
        assert.ok(fs.existsSync(result.source));
        sources.add(result.source);
      }
    }
  }
  assert.equal(sources.size, 40);
  let total = 0;
  for (const source of sources) {
    const size = fs.statSync(source).size;
    assert.ok(size < 32 * 1024, `${source} exceeds per-image budget`);
    total += size;
  }
  assert.ok(total < 900 * 1024, 'the whole collection must stay below 900 KiB');
});

test('foreign aliases and legacy results choose the corresponding occupation', () => {
  for (const [role, alias] of Object.entries(aliases)) {
    assert.deepEqual(resolvePastLifeArt({ role: alias, era: foreign[0] }), resolvePastLifeArt({ role, era: foreign[0] }));
    assert.deepEqual(resolvePastLifeArt({ role: alias, era: '' }), resolvePastLifeArt({ role, era: foreign[0] }));
  }
  assert.deepEqual(resolvePastLifeArt({ role: ' 의원 ', era: ' 조선 시대 ' }), resolvePastLifeArt({ role: '의원', era: korean[1] }));
  assert.deepEqual(resolvePastLifeArt({ role: '의원', era: '' }), resolvePastLifeArt({ role: '의원', era: korean[1] }));
  for (const role of ['', '알 수 없는 직업', 'toString', 'constructor']) {
    assert.equal(resolvePastLifeArt({ role, era: foreign[0] }).key, 'original');
  }
});

test('share specs retain era and role so the card resolves the same image as the result', () => {
  for (const era of [...korean, ...foreign]) {
    for (const canonical of roles) {
      const role = foreign.includes(era) ? aliases[canonical] ?? canonical : canonical;
      const result = { role, era, title: `${era}의 ${role}`, scene: '기억 속 장면', carried: '관찰력', bond: '쥐띠' };
      const spec = pastLifeSpec({ nickname: '테스트' }, result);
      assert.deepEqual(spec.pastLife, { role, era });
      assert.deepEqual(resolvePastLifeArt(spec.pastLife), resolvePastLifeArt(result));
    }
  }
});
