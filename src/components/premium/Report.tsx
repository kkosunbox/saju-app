/**
 * AI 종합 리포트 영역 — 목차 · 본문(생성 상태) · 계산 근거.
 * 열람 전에는 목차와 흐린 미리보기(앞 3개 섹션)만 보여준다.
 */
import React, { useEffect, useReducer, useState } from 'react';
import { LayoutAnimation, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../Icon';
import PressableScale from '../PressableScale';
import PrimaryButton from '../PrimaryButton';
import { LockGate, scoreColor } from './Kit';
import { usePremium } from '../../context/PremiumContext';
import { Item } from '../../services/premium/catalog';
import {
  Outline, ReportCtx, ReportSection, approxChars, generateReport, getGenState, loadSavedReport, outline, parseReport,
  reportAvailable, stopReport, subscribeReports,
} from '../../services/report/reportService';
import { colors } from '../../theme/colors';
import { fonts, radius, shadow, txt, sansW } from '../../theme/typography';

function useReportState(key: string) {
  const [, force] = useReducer(x => x + 1, 0);
  useEffect(() => subscribeReports(force), []);
  return getGenState(key);
}

/** **굵게** 표기만 살린 인라인 텍스트 */
function Inline({ text, style, boldColor = colors.purple }: { text: string; style: object; boldColor?: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return <Text style={style}>{parts.map((p, i) => (i % 2 ? <Text key={i} style={{ fontWeight: '700', color: boldColor }}>{p}</Text> : p))}</Text>;
}

export function RepTOC({ O, owned }: { O: Outline; owned: boolean }) {
  const all = O.parts.flat();
  return (
    <View style={s.toc}>
      <View style={s.tocHead}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>이 리포트에 담긴 내용</Text>
        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.purpleSoft }}>{all.length}개 섹션 · 약 {approxChars(all.length)} 자</Text>
      </View>
      {all.map((x, i) => (
        <View key={x[0]} style={s.tocRow}>
          <Text style={s.tocNum}>{String(i + 1).padStart(2, '0')}</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink, flex: 1 }}>{x[0]}</Text>
        </View>
      ))}
      <Text style={s.tocFoot}>사주 · 태국 점성술 · MBTI · 혈액형을 하나의 이야기로 엮은 맞춤 풀이예요{owned ? '' : ' · 구매 후 바로 작성돼요'}</Text>
    </View>
  );
}

function Num({ n }: { n: number }) {
  return (
    <View style={s.rnum}>
      <Text style={{ fontFamily: fonts.serif, color: colors.white, fontSize: 13, fontWeight: '600' }}>{String(n).padStart(2, '0')}</Text>
    </View>
  );
}

function ReportPreview({ O }: { O: Outline }) {
  return (
    <View style={s.paper}>
      {O.parts.flat().slice(0, 3).map((x, i) => (
        <View key={x[0]} style={[s.rsec, i < 2 && s.rsecLine]}>
          <View style={s.rhead}>
            <Num n={i + 1} />
            <View style={{ flex: 1 }}>
              <Text style={s.rtitle}>{x[0]}</Text>
              <Text style={s.rlead}>{x[1].slice(0, 26)}…</Text>
            </View>
          </View>
          {[92, 100, 86, 97, 64].map((w, k) => <View key={k} style={[s.ghost, { width: `${w}%` }]} />)}
        </View>
      ))}
    </View>
  );
}

function RSection({ sec, n, last }: { sec: ReportSection; n: number; last: boolean }) {
  const paras: string[] = []; const pts: string[] = []; const subsList: { h: string; ps: string[] }[] = [];
  let cur: { h: string; ps: string[] } | null = null;
  for (const b of sec.blocks) {
    if (b.t === 'h') { cur = { h: b.v, ps: [] }; subsList.push(cur); continue; }
    if (b.t === 'pt') { pts.push(b.v); continue; }
    if (cur) cur.ps.push(b.v); else paras.push(b.v);
  }
  return (
    <View style={[s.rsec, !last && s.rsecLine]}>
      <View style={s.rhead}>
        <Num n={n} />
        <View style={{ flex: 1 }}>
          <Inline text={sec.title} style={s.rtitle} />
          {sec.lead ? <Inline text={sec.lead} style={s.rlead} /> : null}
        </View>
      </View>
      {paras.map((p, i) => <Inline key={i} text={p} style={[s.rp, i === 0 && { marginTop: 0 }]} />)}
      {subsList.length ? (
        <View style={{ gap: 10, marginTop: 16 }}>
          {subsList.map((x, i) => {
            const m = x.h.match(/^(.*?)\s*\((\d{2,3})\s*점?\)\s*$/);
            return (
              <View key={i} style={s.rsub}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <Inline text={m ? m[1] : x.h} style={{ fontSize: 15, fontWeight: '700', color: colors.ink, flex: 1 }} boldColor={colors.ink} />
                  {m ? <Text style={{ fontFamily: fonts.serif, fontSize: 15, fontWeight: '600', color: scoreColor(+m[2]) }}>{m[2]}</Text> : null}
                </View>
                {x.ps.map((p, k) => <Inline key={k} text={p} style={s.rsubP} />)}
              </View>
            );
          })}
        </View>
      ) : null}
      {pts.length ? (
        <View style={s.rpts}>
          <Text style={s.rptsHead}>핵심 포인트</Text>
          {pts.map((p, i) => (
            <View key={i} style={s.rpt}>
              <View style={{ marginTop: 4 }}><Icon name="check" size={14} color={colors.purple} strokeWidth={2.6} /></View>
              <Inline text={p} style={{ flex: 1, fontSize: 14.5, lineHeight: 22, fontWeight: '600', color: colors.ink }} />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Note({ title, body, children, tone = colors.purpleSoft }: { title: string; body: string; children?: React.ReactNode; tone?: string }) {
  return (
    <View style={s.note}>
      <Icon name="sparkle" size={18} color={tone} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{title}</Text>
        <Text style={{ fontSize: 13, color: colors.inkSub, marginTop: 4, lineHeight: 19 }}>{body}</Text>
        {children}
      </View>
    </View>
  );
}

function ReportBody({ rk }: { rk: ReportCtx }) {
  const { toast } = usePremium();
  const st = useReportState(rk.key);
  const O = outline(rk); const total = O.parts.flat().length;
  useEffect(() => { loadSavedReport(rk.user.id, rk.key); }, [rk.key]);
  const start = (fresh = false) => generateReport(rk, fresh, () => toast('종합 풀이가 완성됐어요'));

  if (!st || (!st.parts.some(Boolean) && st.status !== 'running')) {
    if (!reportAvailable()) {
      return <Note title="이 환경에서는 AI 종합 풀이를 쓸 수 없어요" body="AI 풀이 서버가 연결되면 종합 풀이가 작성돼요. 지금은 아래 상세 데이터를 확인해 주세요." />;
    }
    return (
      <View style={s.start}>
        <View style={s.startIco}><Icon name="sparkle" size={26} color={colors.white} filled strokeWidth={2} /></View>
        <Text style={[txt.h2, { textAlign: 'center', marginTop: 14 }]}>{rk.user.nickname}님만의 {O.title}</Text>
        <Text style={[txt.body, { textAlign: 'center', marginTop: 6 }]}>네 가지 관점을 하나로 엮어 {total}개 섹션의 풀이를 써드려요.{'\n'}처음 한 번만 1~3분 정도 걸리고, 이후엔 바로 열려요.</Text>
        <PrimaryButton label="종합 풀이 작성하기" onPress={() => start()} style={{ marginTop: 18, alignSelf: 'stretch' }} icon={<Icon name="sparkle" size={18} color={colors.white} filled strokeWidth={2} />} />
      </View>
    );
  }

  const secs = parseReport(st.parts.join('\n'));
  const running = st.status === 'running';
  const chars = st.parts.join('').replace(/\s/g, '').length;
  return (
    <>
      <View style={s.paper}>
        {secs.map((x, i) => <RSection key={i} sec={x} n={i + 1} last={i === secs.length - 1} />)}
        {running && !secs.length ? <Text style={[txt.small, { textAlign: 'center', paddingVertical: 36 }]}>• • •{'\n'}{rk.user.nickname}님의 사주 원국과 성향을 읽고 있어요</Text> : null}
      </View>
      {running ? (
        <View style={s.prog}>
          <View style={s.between}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>{secs.length ? `${secs.length}/${total} 섹션 작성 중` : '풀이 구상 중…'}</Text>
            <PressableScale onPress={() => stopReport(rk.key)} hitSlop={8}><Text style={s.link}>멈추기</Text></PressableScale>
          </View>
          <View style={s.bar}><View style={[s.barFill, { width: `${Math.max(4, (secs.length / total) * 100)}%` }]} /></View>
          <Text style={[txt.caption, { marginTop: 8 }]}>{chars ? `${chars.toLocaleString('ko-KR')}자 작성됨 · ` : ''}{st.part + 1}/{st.total}단계 · 화면을 떠나도 이어서 써요</Text>
        </View>
      ) : st.status === 'done' ? (
        <View style={[s.between, { marginTop: 12, paddingHorizontal: 4 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="check" size={14} color={colors.success} strokeWidth={2.6} />
            <Text style={{ fontSize: 13, color: colors.inkSub }}>{secs.length}개 섹션 · {chars.toLocaleString('ko-KR')}자</Text>
          </View>
          {reportAvailable() ? <PressableScale onPress={() => start(true)} hitSlop={8}><Text style={s.link}>새로 쓰기</Text></PressableScale> : null}
        </View>
      ) : (
        <Note
          title={st.status === 'stopped' ? '작성을 멈췄어요' : st.err === 'rate_limited' ? '잠시 후 다시 시도해 주세요' : '작성이 중간에 끊겼어요'}
          body={`지금까지 쓴 ${secs.length}개 섹션은 저장돼 있어요.`}
          tone="#C27A2C"
        >
          {reportAvailable() ? <PrimaryButton label="이어서 작성하기" variant="soft" onPress={() => start()} style={{ marginTop: 10 }} /> : null}
        </Note>
      )}
    </>
  );
}

/** 접었다 펴는 "계산 근거 · 상세 데이터" */
export function Basis({ children, initiallyOpen }: { children: React.ReactNode; initiallyOpen: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <View style={{ marginTop: 24 }}>
      <PressableScale onPress={() => { LayoutAnimation.easeInEaseOut(); setOpen(o => !o); }} style={s.summary} scaleTo={0.98} accessibilityState={{ expanded: open }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.inkSub }}>계산 근거 · 상세 데이터</Text>
        <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}><Icon name="chevronRight" size={16} color={colors.inkMute} /></View>
      </PressableScale>
      {open ? children : null}
    </View>
  );
}

/**
 * 프리미엄 화면의 잠금 영역.
 * 열람 전: 목차 + 흐린 미리보기 + 열람 패널 / 열람 후: 목차 + AI 리포트 + 계산 근거(아래 basis)
 */
export default function ReportArea({ rk, item, basis }: { rk: ReportCtx; item: Item; basis: React.ReactNode }) {
  const { owned } = usePremium();
  const own = owned(item.key);
  const O = outline(rk);
  // 종합 풀이 서버가 없으면: 목차·안내 없이 실제 풀이(basis)를 그대로 — 열람 전에는 흐리게 미리보기
  if (!reportAvailable()) {
    return own ? <>{basis}</> : <LockGate item={item}>{basis}</LockGate>;
  }
  return (
    <>
      <RepTOC O={O} owned={own} />
      {own ? (
        <>
          <View style={{ marginTop: 4 }}><ReportBody rk={rk} /></View>
          <Basis initiallyOpen={!reportAvailable()}>{basis}</Basis>
        </>
      ) : (
        <LockGate item={item} onUnlocked={() => { if (reportAvailable()) generateReport(rk); }}>
          <ReportPreview O={O} />
        </LockGate>
      )}
    </>
  );
}

const s = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toc: { marginTop: 16, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, paddingVertical: 18, paddingHorizontal: 20, ...shadow.card },
  tocHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.lineStrong },
  tocRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  tocNum: { width: 22, fontSize: 11, fontWeight: '800', color: colors.purpleSoft, fontVariant: ['tabular-nums'] },
  tocFoot: { fontSize: 12, color: colors.inkMute, marginTop: 12, lineHeight: 18 },
  paper: { marginTop: 16, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.line, paddingVertical: 4, paddingHorizontal: 22, ...shadow.card },
  rsec: { paddingVertical: 28 },
  rsecLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.lineStrong },
  rhead: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginBottom: 16 },
  rnum: { width: 34, height: 34, borderRadius: 8, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  rtitle: { fontFamily: fonts.display, fontSize: 19, lineHeight: 26, fontWeight: '700', letterSpacing: -0.5, color: colors.ink },
  rlead: { fontSize: 14, lineHeight: 20, color: colors.seal, fontWeight: '500', marginTop: 3 },
  rp: { ...sansW('400'), fontSize: 16, lineHeight: 27, color: colors.ink, letterSpacing: -0.3, marginTop: 14 },
  rsub: { backgroundColor: colors.cream, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 16 },
  rsubP: { ...sansW('400'), fontSize: 15, lineHeight: 24, color: colors.inkSub, marginTop: 6 },
  rpts: { marginTop: 18, backgroundColor: colors.lavenderSoft, borderLeftWidth: 3, borderLeftColor: colors.seal, borderTopLeftRadius: 4, borderBottomLeftRadius: 4, borderTopRightRadius: 12, borderBottomRightRadius: 12, paddingVertical: 14, paddingHorizontal: 16 },
  rptsHead: { fontSize: 12, fontWeight: '800', color: colors.purpleSoft, letterSpacing: 0.5, marginBottom: 6 },
  rpt: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingVertical: 4 },
  ghost: { height: 12, borderRadius: 6, backgroundColor: colors.line, marginTop: 12 },
  note: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginTop: 12, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, paddingVertical: 16, paddingHorizontal: 18 },
  start: { marginTop: 16, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1.5, borderColor: colors.lavender, paddingVertical: 28, paddingHorizontal: 22, alignItems: 'center' },
  startIco: { width: 60, height: 60, borderRadius: 14, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  prog: { marginTop: 12, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, paddingVertical: 16, paddingHorizontal: 18 },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.line, overflow: 'hidden', marginTop: 10 },
  barFill: { height: '100%', backgroundColor: colors.navy, borderRadius: 3 },
  link: { fontSize: 13, fontWeight: '600', color: colors.purpleSoft },
  summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 18, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line },
});
