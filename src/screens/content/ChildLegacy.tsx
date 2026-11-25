/**
 * 우리 아이 사주 — 구조를 바꾸기 전(v 없음)에 열어 고정된 결과와 그때 쓴 풀이.
 * 산 결과는 다시 만들지 않으므로, 예전 구조는 예전 화면 그대로 그린다.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Card from '../../components/Card';
import SolidIcon from '../../components/SolidIcon';
import { Para, Rank, SubHead, Tip } from '../../components/premium/Kit';
import { PartPending, ReadingBanner } from '../../components/premium/Reading';
import { josa } from '../../services/share/shareSpecs';
import { Element, ELEMENT_INFO, TenGodGroup } from '../../data/sajuData';
import { ChildPreview } from '../../types/premium';
import { ReadingView, Titled } from '../../types/reading';
import { colors } from '../../theme/colors';
import { radius, sansW, txt } from '../../theme/typography';

const LIKE_LINE = '#92D8FF';
const CARE_LINE = '#FFB1B1';

export interface LegacyChildReport {
  v?: undefined;
  child: {
    nickname: string; age: number; gender: 'male' | 'female'; birthTimeKnown: boolean;
    title: string; headline: string; stem: { ko: string; hanja: string }; element: Element; elementKo: string;
    animal: string; keywords: string[]; persona: string; energy: string;
  };
  talents: { group: TenGodGroup; name: string; score: number; line: string; activities: string[] }[];
  learning: { group: TenGodGroup; name: string; line: string; environment: string; praise: string };
  growth: { label: string; ages: string; now: boolean; pillar: string; group: TenGodGroup; keyword: string; line: string }[];
  thisYear: { year: number; pillar: string; group: TenGodGroup; keyword: string; line: string };
  habits: { element: Element; elementKo: string; color: { name: string; hex: string }; activity: string; food: string; place: string };
  parents: {
    title: string; nickname: string;
    stem: { ko: string; hanja: string }; element: Element; elementKo: string; animal: string;
    score: number; type: { key: string; relation: TenGodGroup; name: string; line: string };
    parentToChild: string; childToParent: string;
    points: { title: string; text: string }[];
  }[];
}

export interface LegacyChildReading {
  portrait: {
    headline: string; story: string;
    charms: Titled[];
    feelings: { scene: string; text: string }[];
    manual: { likes: string[]; dislikes: string[]; comfort: string };
  };
  talent: {
    talents: { title: string; text: string; grow: string }[];
    fields: string[]; fieldsNote: string;
    learning: { summary: string; tips: string[]; environment: string; praise: string; avoid: string };
  };
  family: {
    bonds: { title: string; summary: string; parenting: string; fit: string; friction: { title: string; text: string; tip: string } }[];
    together: string;
  };
  growth: {
    stages: { label: string; text: string; parent: string }[];
    thisYear: string;
    rhythm: { time: '아침' | '낮' | '저녁'; text: string }[];
    color: string; closing: string;
  };
}

/** 결과 데이터가 예전 구조인지 (새 구조에는 v가 있다) */
export const isLegacyChild = (R: unknown): R is LegacyChildReport =>
  !!R && typeof R === 'object' && (R as { v?: unknown }).v === undefined;

/** 예전 구조의 파트만 쓴다 — 나중에 새 정의로 쓴 파트가 섞여 오면 그 파트는 계산 결과 문장으로 채운다 */
function legacyPartsOf(parts: Partial<Record<string, unknown>> | undefined): Partial<LegacyChildReading> {
  const p = (parts ?? {}) as Partial<LegacyChildReading>;
  return {
    portrait: p.portrait && typeof p.portrait.manual?.comfort === 'string' ? p.portrait : undefined,
    talent: p.talent && typeof p.talent.learning?.avoid === 'string' ? p.talent : undefined,
    family: p.family && Array.isArray(p.family.bonds) ? p.family : undefined,
    growth: p.growth && Array.isArray(p.growth.rhythm) ? p.growth : undefined,
  };
}

/** 예전 결과의 첫 화면(무료) — 그때처럼 궁합 점수를 보여 준다 */
export function legacyPreviewOf(R: LegacyChildReport): ChildPreview & { scores: number[] } {
  const { nickname, age, title, headline, stem, element, elementKo, animal, keywords } = R.child;
  return {
    child: { nickname, age, title, headline, stem, element, elementKo, animal, keywords, temperament: { group: R.talents[0]?.group ?? 'output', name: '' } },
    talents: R.talents.slice(0, 3).map(({ group, name }) => ({ group, name })),
    parents: R.parents.map(({ title, nickname: n, type }) => ({ title, nickname: n, type, seat: { level: 'normal', name: '' } })),
    scores: R.parents.map(p => p.score),
  };
}

/** 하루 리듬 아이콘 (Figma 28 칸 안의 그림) — 아침 · 낮 · 저녁 */
function RhythmIcon({ time, index }: { time: string; index: number }) {
  const kind = /아침|새벽/.test(time) ? 0 : /낮|오후|점심/.test(time) ? 1 : /저녁|밤/.test(time) ? 2 : Math.min(index, 2);
  if (kind === 0) {
    return (
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Path fill="#F07777" d="M21.0547 19L2.89744 18.9947C2.31872 18.9947 1.98245 18.3675 2.00071 17.9154C2.02353 17.3439 2.41509 16.8787 3.01308 16.8761L5.85289 16.864C6.15771 14.107 8.07898 11.7973 10.6971 11.1584C12.2568 10.7779 13.8747 11.0963 15.2193 11.9693C16.89 13.0529 17.9694 14.8242 18.1515 16.8613L21.0197 16.8808C21.5943 16.8845 21.9747 17.3771 21.9991 17.9144C22.0209 18.4001 21.6582 19.0005 21.0547 19Z" />
        <Path fill="#F07777" d="M6.55646 9.74309C7.08275 10.261 7.15296 11.0085 6.70109 11.5446C6.26662 12.0595 5.44208 12.1825 4.90379 11.6803C4.3655 11.1782 3.8134 10.6263 3.28652 10.0563C2.83104 9.56378 2.94866 8.72116 3.42754 8.31045C3.90642 7.89974 4.66075 7.87733 5.14983 8.35891L6.55646 9.74309Z" />
        <Path fill="#F07777" d="M13.1104 7.74735C13.1163 8.48572 12.6374 9.06395 11.9388 9.1235C11.2674 9.18038 10.5975 8.68429 10.5719 7.94857C10.5464 7.21284 10.5462 6.43224 10.5767 5.6566C10.6029 4.98629 11.2819 4.47363 11.9109 4.52184C12.54 4.57004 13.0892 5.08758 13.0945 5.77395L13.1104 7.74735Z" />
        <Path fill="#F07777" d="M19.1266 11.6319C18.638 12.131 17.8989 12.0996 17.4282 11.6761C16.9575 11.2525 16.822 10.461 17.2915 9.98245L18.8915 8.35108C19.4022 7.83025 20.2923 7.90275 20.7314 8.47675C21.0744 8.92447 21.1132 9.60421 20.7057 10.0205L19.1272 11.6319H19.1266Z" />
      </Svg>
    );
  }
  if (kind === 1) {
    const rays = ['M14 7V5', 'M14 23V21', 'M18.95 9.05L20.364 7.636', 'M7.637 20.364L9.051 18.95', 'M21 14L23 14', 'M5 14L7 14', 'M18.95 18.95L20.364 20.364', 'M7.637 7.636L9.051 9.05'];
    return (
      <Svg width={28} height={28} viewBox="0 0 28 28">
        <Circle cx={14} cy={14} r={4} fill="#FCBD51" />
        {rays.map(d => <Path key={d} d={d} stroke="#FCBD51" strokeWidth={2} strokeLinecap="round" />)}
      </Svg>
    );
  }
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28">
      <Path fill={colors.accent} d="M17 6C17.2931 6 17.4397 6 17.5799 6.04196C18.1934 6.22551 18.4787 6.931 18.1653 7.48943C18.0937 7.61708 17.8753 7.82826 17.4386 8.25062C15.935 9.70471 15 11.7429 15 14C15 16.2569 15.9349 18.2945 17.4384 19.7483C17.8759 20.1714 18.0947 20.383 18.1664 20.5108C18.4796 21.0691 18.1943 21.7743 17.5812 21.958C17.4408 22 17.2939 22 17 22C12.5817 22 9 18.4183 9 14C9 9.58172 12.5817 6 17 6Z" />
    </Svg>
  );
}

const eunNeun = (w: string) => `${w}${josa(w, '은', '는')}`;
/** 흔한 한 글자 성 — 세 글자 한글 이름이 이 글자로 시작하면 성을 붙인 이름으로 본다 (서버 childCallName과 같다) */
const SURNAMES = new Set('김이박최정강조윤장임한오서신권황안송류유전홍고문양손배백허남심노하곽성차주우구민진나지엄채원천방공현함변염여추도소석선설마길연위표명기반왕금옥육인맹제모탁국어은편용예봉경사부');
/** 아이를 부르는 말: 집에서 부르듯 성을 떼고 받침이 있으면 '이'를 붙인다 (김하린 → 하린이, 서아 → 서아) */
const callOf = (w: string) => {
  const given = /^[가-힣]{3}$/.test(w) && SURNAMES.has(w[0]) ? w.slice(1) : w;
  return `${given}${josa(given, '이', '')}`;
};
const waGwa = (w: string) => `${w}${josa(w, '과', '와')}`;
/** 궁합 제목: 함께 본 보호자의 호칭대로 (아빠와의 궁합 · 엄마·아빠와의 궁합) */
const bondTitle = (titles: string[]) => titles.length ? `${waGwa(titles.join('·'))}의 궁합` : '엄마·아빠와의 궁합';

/** 예전 구조로 고정된 결과(구매 당시 그대로) — 예전 화면 그대로 그린다 */
export function LegacyChildBody({ R, reading, onRetry }: { R: LegacyChildReport; reading: ReadingView<LegacyChildReading> | null; onRetry(): void }) {
  const writing = reading?.status === 'writing';
  const parts = legacyPartsOf(reading?.parts);
  const { portrait, talent, family, growth } = parts;
  const pending = (lines = 3) => <PartPending writing={writing} lines={lines} />;
  const name = R.child.nickname;
  const habitColor = R.habits.color;
  return (
    <>
      <View style={{ marginTop: 16 }}><ReadingBanner reading={reading} onRetry={onRetry} /></View>

      <SubHead title={`01 · ${callOf(name)}의 타고난 기질`} caption={R.child.title} />
      <Card>
        {portrait ? (
          <>
            <Text style={txt.h3}>{portrait.headline}</Text>
            <Para>{portrait.story}</Para>
          </>
        ) : writing ? pending(5) : <Para mt={0}>{R.child.persona}</Para>}
        <View style={s.memo}>
          <Text style={s.memoLabel}>기운의 크기</Text>
          <Para mt={4}>{R.child.energy}</Para>
        </View>
      </Card>
      {portrait ? (
        <View style={{ gap: 10, marginTop: 10 }}>
          {portrait.charms.map(c => <Card key={c.title}><Text style={txt.h3}>{c.title}</Text><Para>{c.text}</Para></Card>)}
          <Card>
            <Text style={txt.h3}>이럴 때 {callOf(name)}의 마음</Text>
            {portrait.feelings.map(f => (
              <View key={f.scene} style={{ marginTop: 12 }}>
                <Text style={s.label}>{f.scene}</Text>
                <Para mt={4}>{f.text}</Para>
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      <SubHead title={`02 · ${waGwa(callOf(name))} 잘 지내는 법`} />
      {portrait ? (
        <>
          <View style={s.manualRow}>
            {([['좋아해요', portrait.manual.likes, LIKE_LINE], ['힘들어해요', portrait.manual.dislikes, CARE_LINE]] as const).map(([title, items, line], i) => (
              <View key={title} style={[s.manualCard, { borderColor: line }]} accessible accessibilityLabel={`${i ? '힘들어하기 쉬운 것' : '좋아하기 쉬운 것'}: ${items.join(', ')}`}>
                <View style={s.manualHead}>
                  <SolidIcon name={i ? 'dismissCircle' : 'favorite'} size={24} color={i ? colors.danger : colors.accent} />
                  <Text style={s.manualTitle}>{title}</Text>
                </View>
                <View style={s.manualItems}>{items.map(t => <Text key={t} style={s.manualItem}>{t}</Text>)}</View>
              </View>
            ))}
          </View>
          <View style={s.comfort}>
            <View style={s.manualHead}>
              <SolidIcon name="book" size={20} color={colors.accent} />
              <Text style={s.manualTitle}>속상할 때 다독이는 법</Text>
            </View>
            <Text style={s.comfortText}>{portrait.manual.comfort}</Text>
          </View>
        </>
      ) : <Card>{pending(5)}</Card>}

      <SubHead title="03 · 타고난 재능" caption="사주 속 다섯 가지 힘" />
      <Card style={{ gap: 12 }}>
        {R.talents.map((t, i) => (
          <View key={t.group}>
            <View style={s.barHead}>
              <Text style={[txt.bodyStrong, i < 3 ? null : { color: colors.inkMute }]}>{t.name}</Text>
              <Text style={[txt.caption, i === 0 && { color: colors.accent }]}>{t.score}</Text>
            </View>
            <View style={s.barTrack}><View style={[s.barFill, { width: `${t.score}%` }, i >= 3 && { backgroundColor: colors.lineStrong }]} /></View>
          </View>
        ))}
      </Card>
      <View style={{ gap: 10, marginTop: 10 }}>
        {R.talents.slice(0, 3).map((t, i) => {
          const w = talent?.talents[i];
          return (
            <Card key={t.group}>
              <View style={s.talentRow}><Rank n={i + 1} first={i === 0} /><Text style={[txt.h3, { flex: 1 }]}>{t.name}</Text></View>
              {w ? <Para>{w.text}</Para> : writing ? pending(3) : <Para>{t.line}</Para>}
              <View style={s.memo}>
                <Text style={s.memoLabel}>키워 주는 법</Text>
                <Para mt={4}>{w ? w.grow : t.activities.slice(0, 3).join(' · ')}</Para>
              </View>
            </Card>
          );
        })}
      </View>

      <SubHead title="04 · 맞는 공부 방식" caption={`${R.learning.name} 아이`} />
      <Card>
        <Text style={txt.h3}>{R.learning.name}</Text>
        {talent ? (
          <>
            <Para>{talent.learning.summary}</Para>
            <View style={s.tips}>
              {talent.learning.tips.map((t, i) => (
                <View key={t} style={[s.tipRow, i ? s.tipLine : null]}>
                  <View style={s.tipNum}><Text style={s.tipNumText}>{i + 1}</Text></View>
                  <Text style={s.tipText}>{t}</Text>
                </View>
              ))}
            </View>
            <Text style={[s.label, { marginTop: 14 }]}>집중이 잘 되는 환경</Text>
            <Para mt={4}>{talent.learning.environment}</Para>
            <Text style={[s.label, { marginTop: 14 }]}>잘 통하는 칭찬</Text>
            <Para mt={4}>{talent.learning.praise}</Para>
            <View style={s.avoid}>
              <Text style={s.label}>이런 말은 아껴 주세요</Text>
              <Para mt={4}>{talent.learning.avoid}</Para>
            </View>
          </>
        ) : writing ? pending(6) : (
          <>
            <Para>{R.learning.line}</Para>
            <Text style={[s.label, { marginTop: 14 }]}>집중이 잘 되는 환경</Text>
            <Para mt={4}>{R.learning.environment}</Para>
            <Text style={[s.label, { marginTop: 14 }]}>잘 통하는 칭찬</Text>
            <Para mt={4}>{R.learning.praise}</Para>
          </>
        )}
      </Card>
      {talent ? (
        <>
          <SubHead title="05 · 재능이 이어지기 쉬운 분야" caption="정해진 길이 아닌, 넓혀 볼 방향" />
          <Card>
            <View style={s.wrap}>{talent.fields.map(f => <Text key={f} style={s.pill}>{f}</Text>)}</View>
            <Para mt={12}>{talent.fieldsNote}</Para>
          </Card>
        </>
      ) : null}

      {R.parents.length ? (
        <>
          <SubHead title={`06 · ${bondTitle(R.parents.map(p => p.title))}`} />
          <View style={{ gap: 10 }}>
            {R.parents.map((p, i) => {
              const w = family?.bonds[i];
              return (
                <Card key={i}>
                  <View style={s.bondHead}>
                    <View style={{ flex: 1 }}>
                      <Text style={txt.caption}>{p.title} · {p.stem.ko}{p.elementKo}({ELEMENT_INFO[p.element].hanja}) × {name} · {R.child.stem.ko}{R.child.elementKo}</Text>
                      <Text style={[txt.h3, { marginTop: 2 }]}>{p.type.name}</Text>
                    </View>
                    <Text style={s.score}>{p.score}<Text style={s.scoreUnit}>점</Text></Text>
                  </View>
                  <View style={s.grid}>
                    <View style={s.cell}><Text style={txt.caption}>{callOf(name)}에게 {eunNeun(p.title)}</Text><Text style={s.cellText}>{p.parentToChild}</Text></View>
                    <View style={s.cell}><Text style={txt.caption}>{p.title}에게 {eunNeun(callOf(name))}</Text><Text style={s.cellText}>{p.childToParent}</Text></View>
                  </View>
                  {w ? (
                    <>
                      <Para mt={12}>{w.summary}</Para>
                      <Text style={[s.label, { marginTop: 14 }]}>{p.title}의 키우는 모습</Text>
                      <Para mt={4}>{w.parenting}</Para>
                      <Text style={[s.label, { marginTop: 14 }]}>호흡이 척척 맞는 순간</Text>
                      <Para mt={4}>{w.fit}</Para>
                      <View style={s.avoid}>
                        <Text style={s.label}>{w.friction.title}</Text>
                        <Para mt={4}>{w.friction.text}</Para>
                        <Para mt={6} style={{ color: colors.ink }}>{w.friction.tip}</Para>
                      </View>
                    </>
                  ) : writing ? <View style={{ marginTop: 12 }}>{pending(4)}</View> : (
                    <View style={{ marginTop: 12, gap: 8 }}>{p.points.map(x => <View key={x.title}><Text style={s.label}>{x.title}</Text><Para mt={2}>{x.text}</Para></View>)}</View>
                  )}
                </Card>
              );
            })}
          </View>
          {family ? <Tip title={R.parents.length === 2 ? '둘이 함께 키울 때' : '함께 자라는 법'} style={{ marginTop: 10 }}>{family.together}</Tip> : null}
        </>
      ) : null}

      <SubHead title="07 · 자라는 시기별 흐름" caption="10년마다 바뀌는 대운으로" />
      <Card style={{ paddingVertical: 4 }}>
        {R.growth.map((g, i) => {
          const w = growth?.stages[i];
          return (
            <View key={g.label} style={[s.stage, i ? s.line : null]}>
              <View style={s.stageHead}>
                <Text style={txt.h3}>{g.label}</Text>
                <Text style={txt.caption}>{g.ages} · {g.pillar.split('(')[0]}</Text>
                {g.now ? <Text style={s.now}>지금</Text> : null}
              </View>
              <Text style={[txt.bodyStrong, { marginTop: 4, color: colors.accent }]}>{g.keyword}</Text>
              <Para mt={4}>{w ? w.text : g.line}</Para>
              {w ? <Text style={[txt.small, { marginTop: 6 }]}>{w.parent}</Text> : null}
            </View>
          );
        })}
      </Card>

      <SubHead title={`08 · ${R.thisYear.year}년의 ${callOf(name)}`} caption={R.thisYear.keyword} />
      <Card>{growth ? <Para mt={0}>{growth.thisYear}</Para> : writing ? pending(3) : <Para mt={0}>{R.thisYear.line}</Para>}</Card>

      <SubHead title="09 · 하루 리듬과 행운 색" caption={`${callOf(name)}에게 필요한 ${R.habits.elementKo}의 기운`} />
      {growth ? (
        <View style={s.rhythmBox}>
          {growth.rhythm.map((r, i) => (
            <View key={r.time} style={s.rhythmRow}>
              {i < growth.rhythm.length - 1 ? <View style={s.rhythmRail} /> : null}
              <View style={s.rhythmTile}><RhythmIcon time={r.time} index={i} /></View>
              <View style={s.rhythmBody}>
                <Text style={s.rhythmTime}>{r.time}</Text>
                <Text style={s.rhythmText}>{r.text}</Text>
              </View>
            </View>
          ))}
          <View style={s.luckyColor}>
            <View style={s.manualHead}>
              <View style={[s.luckyDot, { backgroundColor: habitColor.hex }]} />
              <Text style={s.luckyName}>{habitColor.name}</Text>
            </View>
            <Text style={s.rhythmText}>{growth.color}</Text>
          </View>
        </View>
      ) : <Card>
        {writing ? pending(4) : (
          <>
            <Text style={s.label}>함께하면 좋은 것</Text><Para mt={4}>{R.habits.activity}</Para>
            <Text style={[s.label, { marginTop: 12 }]}>어울리는 곳</Text><Para mt={4}>{R.habits.place}</Para>
          </>
        )}
        <View style={s.colorRow}>
          <View style={[s.swatch, { backgroundColor: habitColor.hex }]} />
          <View style={{ flex: 1 }}>
            <Text style={txt.bodyStrong}>{habitColor.name}</Text>
            <Text style={txt.small}>방 소품이나 옷, 학용품에 이 색을 더해 주세요.</Text>
          </View>
        </View>
      </Card>}
      <Tip title="기억해 두세요" style={{ marginTop: 16 }}>{growth?.closing ?? '사주는 타고난 경향일 뿐이에요. 아이는 믿어 주는 어른 곁에서 가장 잘 자라요.'}</Tip>
    </>
  );
}

const s = StyleSheet.create({
  memoLabel: { ...sansW('700'), fontSize: 12, lineHeight: 18, letterSpacing: -0.6, color: colors.accent },
  manualRow: { flexDirection: 'row', gap: 12 },
  manualCard: { flex: 1, minHeight: 131, padding: 16, borderRadius: 12, borderWidth: 1, backgroundColor: colors.cream },
  manualHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  manualTitle: { ...sansW('700'), fontSize: 14, lineHeight: 17, letterSpacing: -0.56, color: colors.ink, flexShrink: 1 },
  manualItems: { marginTop: 9, gap: 6 },
  manualItem: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.ink },
  comfort: { marginTop: 16, padding: 16, borderRadius: 8, backgroundColor: colors.card },
  comfortText: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.ink, marginTop: 6 },
  tips: { marginTop: 12, borderRadius: 12, backgroundColor: colors.surface },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, minHeight: 56 },
  tipLine: { borderTopWidth: 1, borderTopColor: colors.line },
  tipNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  tipNumText: { ...sansW('700'), fontSize: 13, lineHeight: 16, letterSpacing: -0.52, color: '#FFFFFF' },
  tipText: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.ink, flex: 1 },
  rhythmBox: { padding: 14, paddingBottom: 16, borderRadius: 8, backgroundColor: colors.card, gap: 6 },
  rhythmRow: { flexDirection: 'row', gap: 8 },
  rhythmRail: { position: 'absolute', left: 13, top: 28, bottom: -6, width: 2, backgroundColor: colors.surface },
  rhythmTile: { width: 28, height: 28, borderRadius: 6, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  rhythmBody: { flex: 1, paddingTop: 6, paddingRight: 2 },
  rhythmText: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.ink, marginTop: 6 },
  luckyColor: { marginTop: 12, marginHorizontal: 2, padding: 12, borderRadius: 6, backgroundColor: colors.surface },
  luckyDot: { width: 16, height: 16, borderRadius: 8 },
  luckyName: { ...sansW('600'), fontSize: 13, lineHeight: 16, letterSpacing: -0.65, color: colors.ink },
  talentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bondHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  score: { ...sansW('700'), fontSize: 24, lineHeight: 29, letterSpacing: -1.2, color: colors.accent },
  scoreUnit: { ...sansW('600'), fontSize: 13, color: colors.accent },
  memo: { marginTop: 14, padding: 12, borderRadius: radius.md, backgroundColor: colors.surface },
  label: { fontSize: 12, fontWeight: '700', color: colors.inkSub },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  pill: { ...sansW('600'), fontSize: 12, lineHeight: 14, color: colors.ink, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 30, backgroundColor: colors.surface, overflow: 'hidden' },
  barHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: colors.surface, marginTop: 6, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3, backgroundColor: colors.accent },
  avoid: { marginTop: 14, padding: 12, borderRadius: radius.md, backgroundColor: colors.surface },
  grid: { flexDirection: 'row', gap: 8, marginTop: 12 },
  cell: { flex: 1, padding: 12, borderRadius: radius.md, backgroundColor: colors.surface, gap: 4 },
  cellText: { ...sansW('600'), fontSize: 13, lineHeight: 19, color: colors.ink },
  stage: { paddingVertical: 14 },
  stageHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  now: { ...sansW('700'), fontSize: 11, color: colors.white, backgroundColor: colors.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  line: { borderTopWidth: 1, borderTopColor: colors.line },
  rhythmTime: { ...sansW('700'), fontSize: 14, lineHeight: 17, letterSpacing: -0.56, color: colors.ink },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, padding: 12, borderRadius: radius.md, backgroundColor: colors.surface },
  swatch: { width: 32, height: 32, borderRadius: 16 },
});
