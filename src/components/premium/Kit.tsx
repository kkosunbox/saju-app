/**
 * 프리미엄 콘텐츠 공용 UI 조각 — HTML 미리보기의 card/hero/tip/toc/lock 등과 1:1 대응.
 */
import React, { useEffect, useRef } from 'react';
import { Platform, ScrollView, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PressableScale from '../PressableScale';
import Card from '../Card';
import Icon from '../Icon';
import PrimaryButton from '../PrimaryButton';
import Ico from '../Ico';
import { usePremium } from '../../context/PremiumContext';
import { Item, fmtP } from '../../services/premium/catalog';
import { SrcKey } from '../../services/premium/engine';
import { analysisTheme, colors, gradients } from '../../theme/colors';
import { fonts, radius, shadow, txt } from '../../theme/typography';
import { HeadTitle } from '../SectionHeader';

export const scoreColor = (v: number) => (v >= 85 ? colors.purple : v >= 75 ? colors.purpleSoft : colors.inkMute);

/* ---------- 포인트 표시 ---------- */
export function Coin({ size = 14 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.moon, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: fonts.serif, fontSize: size * 0.62, lineHeight: size * 0.8, fontWeight: '700', color: '#3A2C10' }}>P</Text>
    </View>
  );
}

export function Pill({ children, tone = 'default', style }: { children: React.ReactNode; tone?: 'default' | 'ok' | 'care'; style?: StyleProp<ViewStyle> }) {
  const bg = tone === 'ok' ? colors.okBg : tone === 'care' ? colors.careBg : colors.lavenderSoft;
  const fg = tone === 'ok' ? colors.success : tone === 'care' ? colors.thai : colors.purple;
  return (
    <View style={[s.pill, { backgroundColor: bg }, style]}>
      {typeof children === 'string' || typeof children === 'number' ? <Text style={[s.pillText, { color: fg }]}>{children}</Text> : children}
    </View>
  );
}

/** 보유 여부에 따라 "보유" 또는 "◎ 300" */
export function PriceTag({ item }: { item: Item }) {
  const { owned } = usePremium();
  if (owned(item.key)) return <Pill tone="ok">보유</Pill>;
  return <Pill><View style={s.row4}><Coin size={12} /><Text style={s.pillText}>{item.cost}</Text></View></Pill>;
}

/** 화면 상단: 열람 중 / 미리보기 */
export function StatusBadge({ item }: { item?: Item | null }) {
  const { owned } = usePremium();
  if (!item) return <View />;
  if (owned(item.key)) {
    return <Pill tone="ok"><View style={s.row4}><Icon name="check" size={12} color={colors.success} strokeWidth={2.6} /><Text style={[s.pillText, { color: colors.success, fontSize: 11 }]}>열람 중</Text></View></Pill>;
  }
  return <Pill style={{ backgroundColor: colors.badgeBg }}><Text style={[s.pillText, { color: colors.badge, fontSize: 11 }]}>미리보기</Text></Pill>;
}

export function HeadRow({ item, caption }: { item?: Item | null; caption: string }) {
  return (
    <View style={[s.between, { marginTop: 4 }]}>
      <StatusBadge item={item} />
      <Text style={txt.caption}>{caption}</Text>
    </View>
  );
}

/* ---------- 글 ---------- */
export function SubHead({ title, caption, first }: { title: string; caption?: string; first?: boolean }) {
  return (
    <View style={{ marginTop: first ? 12 : 32, marginBottom: 12 }}>
      <HeadTitle title={title} />
      {caption ? <Text style={[txt.small, { marginTop: 3 }]}>{caption}</Text> : null}
    </View>
  );
}
export function Para({ children, mt = 6, style }: { children: React.ReactNode; mt?: number; style?: StyleProp<TextStyle> }) {
  return <Text style={[s.para, { marginTop: mt }, style]}>{children}</Text>;
}
export function Bullet({ children, color = colors.purpleSoft }: { children: React.ReactNode; color?: string }) {
  return (
    <View style={s.bullet}>
      <View style={[s.bulletDot, { backgroundColor: color }]} />
      <Text style={[s.para, { flex: 1, marginTop: 0, lineHeight: 22 }]}>{children}</Text>
    </View>
  );
}
export function Tip({ title, children, style }: { title: string; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.tip, style]}>
      <Text style={s.tipTitle}>{title}</Text>
      <Text style={s.tipText}>{children}</Text>
    </View>
  );
}
export function Divider({ my = 0 }: { my?: number }) {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.lineStrong, marginVertical: my }} />;
}
export function SoftCard({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.soft, style]}>{children}</View>;
}

/** 체크/주의 표시가 붙은 한 줄 */
export function ActRow({ ok = true, children, icon }: { ok?: boolean; children: React.ReactNode; icon?: 'check' | 'sparkle' | 'close' }) {
  const tone = ok ? colors.success : colors.thai;
  const name = icon ?? (ok ? 'check' : 'sparkle');
  return (
    <View style={s.actRow}>
      <View style={[s.mark, { backgroundColor: ok ? colors.okBg : colors.careBg }]}><Icon name={name} size={14} color={tone} strokeWidth={2.4} /></View>
      <Text style={{ flex: 1, fontSize: 15, lineHeight: 22, color: colors.ink }}>{children}</Text>
    </View>
  );
}

/* ---------- 4가지 관점 ---------- */
export function ViewRow({ k, children }: { k: SrcKey; children: React.ReactNode }) {
  const t = analysisTheme[k];
  return (
    <View style={s.viewRow}>
      <View style={[s.vdot, { borderColor: t.color }]}><Text style={{ fontFamily: fonts.serif, fontSize: 13, fontWeight: '600', color: t.color }}>{t.emoji}</Text></View>
      <Text style={{ flex: 1, fontSize: 14, lineHeight: 21, color: colors.ink }}>
        <Text style={{ color: t.color, fontSize: 12, fontWeight: '700' }}>{t.label}  </Text>{children}
      </Text>
    </View>
  );
}
export function ViewsCard({ views, style }: { views: Partial<Record<SrcKey, React.ReactNode>>; style?: StyleProp<ViewStyle> }) {
  const keys = (['saju', 'thai', 'mbti', 'blood'] as SrcKey[]).filter(k => views[k] !== undefined);
  return (
    <Card style={[{ paddingVertical: 8, paddingHorizontal: 16 }, style]}>
      {keys.map((k, i) => <View key={k} style={i ? s.topLine : null}><ViewRow k={k}>{views[k]}</ViewRow></View>)}
    </Card>
  );
}

/** 이모지/한자 · 라벨 · 값 목록 (개운법 표 등) */
export function InfoRows({ rows, labelWidth = 110 }: { rows: [string, string, string][]; labelWidth?: number }) {
  return (
    <Card style={{ paddingVertical: 4, paddingHorizontal: 18 }}>
      {rows.map(([e, l, v], i) => (
        <View key={l} style={[s.infoRow, i ? s.topLine : null]}>
          <Text style={[s.infoIco, { fontFamily: fonts.serif }]}>{e}</Text>
          <Text style={[txt.small, { width: labelWidth }]}>{l}</Text>
          <Text style={s.infoVal}>{v}</Text>
        </View>
      ))}
    </Card>
  );
}

/** 한자 인장 아이콘 칸 */
export function Seal({ ch, size = 36 }: { ch: string; bg?: string; size?: number; color?: string }) {
  return <Ico ch={ch} size={size} />;
}

/* ---------- 히어로 ---------- */
export function Hero({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const flat = StyleSheet.flatten(style) ?? {};
  return (
    <View style={[{ borderRadius: radius.xl, backgroundColor: colors.heroBg, marginTop: 12 }, shadow.hero, { marginTop: flat.marginTop ?? 12 }]}>
      <View style={[{ borderRadius: radius.xl, padding: 20, overflow: 'hidden', backgroundColor: colors.heroBg }, style, { marginTop: 0 }]}>
        {/* 책력 테두리: 안쪽 가는 선 + 모서리 꺾쇠 (장식, 터치 없음) */}
        <View pointerEvents="none" style={s.heroFrame} />
        {(['tl', 'tr', 'bl', 'br'] as const).map(k => <View key={k} pointerEvents="none" style={[s.heroCorner, s[k]]} />)}
        {children}
      </View>
    </View>
  );
}
export const heroTxt = StyleSheet.create({
  eyebrow: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  summ: { fontFamily: fonts.serif, color: colors.white, fontSize: 17, lineHeight: 24, fontWeight: '600', letterSpacing: -0.4, marginTop: 4 },
  body: { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 22, marginTop: 8 },
});
export function DarkChip({ children, gold }: { children: React.ReactNode; gold?: boolean }) {
  return (
    <View style={[s.darkChip, gold && { backgroundColor: colors.moon, borderColor: colors.moon }]}>
      <Text style={{ color: gold ? '#161A27' : colors.white, fontSize: 14, fontWeight: '600' }}>{children}</Text>
    </View>
  );
}
export function HeroPill({ label, onPress }: { label: string; onPress(): void }) {
  return (
    <PressableScale onPress={onPress} style={s.lpill} scaleTo={0.95}>
      <Text style={{ color: colors.white, fontSize: 13, fontWeight: '700' }}>{label}</Text>
    </PressableScale>
  );
}

/* ---------- 가로 칩 선택 ---------- */
export function ChipSelect<T extends string | number>({ items, value, onChange }: { items: [T, string, string?][]; value: T; onChange(v: T): void }) {
  const ref = useRef<ScrollView>(null);
  const xs = useRef<Record<string, number>>({});
  const scrollTo = (k: string, animated: boolean) => {
    const x = xs.current[k];
    if (x !== undefined) ref.current?.scrollTo({ x: Math.max(0, x - 120), animated });
  };
  useEffect(() => { scrollTo(String(value), true); }, [value]);
  return (
    <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, marginTop: 12 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 2 }}>
      {items.map(([k, l, sub]) => {
        const on = String(k) === String(value);
        return (
          // 선택된 칩이 처음부터 보이도록 위치를 기억해 둔다
          <View key={String(k)} onLayout={e => { xs.current[String(k)] = e.nativeEvent.layout.x; if (on) scrollTo(String(k), false); }}>
            <PressableScale onPress={() => onChange(k)} haptic scaleTo={0.95} style={[s.ychip, on && s.ychipOn]} accessibilityState={{ selected: on }}>
              <Text style={[s.ychipText, on && { color: colors.white }]}>{l}</Text>
              {sub ? <Text style={[s.ychipSub, on && { color: 'rgba(255,255,255,0.7)' }]}>{sub}</Text> : null}
            </PressableScale>
          </View>
        );
      })}
    </ScrollView>
  );
}

export function Rank({ n, first }: { n: number; first?: boolean }) {
  return <View style={[s.rank, first && { backgroundColor: colors.navy }]}><Text style={[s.rankText, first && { color: colors.moon }]}>{n}</Text></View>;
}

/* ---------- 잠금 ---------- */
/** 무료 미리보기 밖의 영역: 흐리게 깔고 그 위에 열람 패널 */
export function LockGate({ item, children, onUnlocked }: { item: Item; children: React.ReactNode; onUnlocked?(): void }) {
  const { owned, points, openUnlock } = usePremium();
  if (owned(item.key)) return <>{children}</>;
  const blur = Platform.OS === 'web' ? ({ filter: 'blur(7px)' } as object) : null;
  return (
    <View style={s.lockWrap}>
      <View style={[s.lockBlur, blur]} pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {children}
        <LinearGradient colors={[colors.cream + '00', colors.cream]} locations={[0.25, 0.95]} style={StyleSheet.absoluteFill} />
      </View>
      <View style={s.lockPanel}>
        <Seal ch="封" size={52} />
        <Text style={[txt.h3, { marginTop: 10, textAlign: 'center' }]}>{item.title}</Text>
        <Text style={[txt.small, { marginTop: 2, textAlign: 'center' }]}>{item.desc}</Text>
        <PrimaryButton label={`${item.cost}P로 전체 보기`} icon={<Coin size={18} />} onPress={() => openUnlock(item, onUnlocked)} style={{ marginTop: 16, alignSelf: 'stretch' }} />
        <Text style={[txt.caption, { marginTop: 10, textAlign: 'center' }]}>보유 {fmtP(points)} · {item.scope}</Text>
      </View>
    </View>
  );
}

/** 다른 화면에서 프리미엄 콘텐츠로 들어가는 카드 */
export function LockCard({ title, desc, item, onPress, mt = 24 }: { title: string; desc: string; item: Item; onPress(): void; mt?: number }) {
  return (
    <Card onPress={onPress} style={{ marginTop: mt }} accessibilityLabel={title}>
      <View style={s.between}><PriceTag item={item} /><Icon name="chevronRight" size={18} color={colors.inkMute} /></View>
      <Text style={[txt.h3, { marginTop: 10 }]}>{title}</Text>
      <Text style={[txt.small, { marginTop: 4 }]}>{desc}</Text>
    </Card>
  );
}

/** 잠긴 상품 소개 카드(누르면 열람 시트) */
export function PriceCard({ item, onUnlocked }: { item: Item; onUnlocked?(): void }) {
  const { openUnlock } = usePremium();
  return (
    <PressableScale onPress={() => openUnlock(item, onUnlocked)} style={s.priceCard} accessibilityLabel={`${item.title} 열기`}>
      <View style={s.between}><PriceTag item={item} /><Text style={txt.caption}>封 잠김</Text></View>
      <Text style={[txt.h3, { marginTop: 10 }]}>{item.title}</Text>
      <Text style={[txt.small, { marginTop: 4 }]}>{item.desc}</Text>
    </PressableScale>
  );
}

/* ---------- 차트 ---------- */
export function MonthBars({ months, height = 170, onPress, max = 95 }: { months: { m: number; total: number }[]; height?: number; onPress?(m: number): void; max?: number }) {
  const mx = Math.max(...months.map(x => x.total)), mn = Math.min(...months.map(x => x.total));
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height, paddingTop: 18, paddingHorizontal: 12, paddingBottom: 12 }}>
      {months.map(x => {
        const top = x.total === mx;
        const h = Math.max(8, ((x.total - mn + 4) / (mx - mn + 4)) * max);
        return (
          <PressableScale key={x.m} onPress={onPress ? () => onPress(x.m) : undefined} disabled={!onPress} scaleTo={0.92} style={s.barCol} accessibilityLabel={`${x.m}월 ${x.total}점`}>
            <Text style={[s.barScore, top && { color: colors.purple }]}>{x.total}</Text>
            <View style={{ width: '70%', height: h, borderRadius: 5, backgroundColor: top ? colors.navy : x.total === mn ? colors.line : colors.lavender }} />
            <Text style={[s.barLabel, top && { color: colors.purple, fontWeight: '700' }]}>{x.m}</Text>
          </PressableScale>
        );
      })}
    </Card>
  );
}

/** 운세 달력 — 진할수록 흐름이 좋은 날, 노란 점은 최고의 날 */
export function FortuneCalendar({ days, first, today, sel, best, onSelect }: { days: { iso: string; d: number; total: number }[]; first: number; today: string; sel: string | null; best: Set<number>; onSelect(iso: string): void }) {
  const lo = Math.min(...days.map(d => d.total)), hi = Math.max(...days.map(d => d.total));
  const cells: ({ iso: string; d: number; total: number } | null)[] = [...Array(first).fill(null), ...days];
  while (cells.length % 7) cells.push(null);
  const rows: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  const mix = (t: number) => {
    // #4F5F8A를 카드색 위에 8~80% 덮은 색 (HTML color-mix와 같음)
    const a = 0.08 + t * 0.72; const base = [1, 3, 5].map(i => parseInt(colors.card.slice(i, i + 2), 16));
    const [r, g, b] = [0x4f, 0x5f, 0x8a].map((v, i) => Math.round(base[i] + (v - base[i]) * a));
    return `rgb(${r},${g},${b})`;
  };
  return (
    <View style={{ gap: 5 }}>
      <View style={s.calRow}>{['일', '월', '화', '수', '목', '금', '토'].map((w, i) => <Text key={w} style={[s.cw, i === 0 && { color: colors.seal }]}>{w}</Text>)}</View>
      {rows.map((r, ri) => (
        <View key={ri} style={s.calRow}>
          {r.map((x, ci) => {
            if (!x) return <View key={ci} style={s.cdEmpty} />;
            const t = (x.total - lo) / Math.max(hi - lo, 1);
            const dark = t > 0.55;
            return (
              <PressableScale key={x.iso} onPress={() => onSelect(x.iso)} scaleTo={0.9} style={[s.cd, { backgroundColor: mix(t) }, x.iso === today && s.cdToday, sel === x.iso && s.cdSel]} accessibilityLabel={`${x.d}일 ${x.total}점`}>
                <Text style={[s.cdD, dark && { color: colors.white }]}>{x.d}</Text>
                <Text style={[s.cdS, dark && { color: 'rgba(255,255,255,0.8)' }]}>{x.total}</Text>
                {best.has(x.d) ? <View style={s.cdDot} /> : null}
              </PressableScale>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  heroFrame: { position: 'absolute', top: 6, left: 6, right: 6, bottom: 6, borderRadius: radius.xl - 6, borderWidth: 0.6, borderColor: 'rgba(217,184,114,0.28)' },
  heroCorner: { position: 'absolute', width: 9, height: 9, borderColor: 'rgba(217,184,114,0.75)' },
  tl: { top: 10, left: 10, borderTopWidth: 1, borderLeftWidth: 1 },
  tr: { top: 10, right: 10, borderTopWidth: 1, borderRightWidth: 1 },
  bl: { bottom: 10, left: 10, borderBottomWidth: 1, borderLeftWidth: 1 },
  br: { bottom: 10, right: 10, borderBottomWidth: 1, borderRightWidth: 1 },
  row4: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.xs },
  pillText: { fontSize: 12, fontWeight: '800', color: colors.purple },
  para: { fontSize: 14.5, lineHeight: 23, color: colors.inkSub },
  bullet: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 4 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  tip: { marginTop: 12, backgroundColor: colors.lavenderSoft, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 14 },
  tipTitle: { fontSize: 12, fontWeight: '700', color: colors.purpleSoft, marginBottom: 2 },
  tipText: { fontSize: 14, lineHeight: 21, color: colors.ink },
  soft: { backgroundColor: colors.lavenderSoft, borderWidth: 1, borderColor: colors.lavender, borderRadius: radius.lg, padding: 18 },
  actRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  mark: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  viewRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 9 },
  vdot: { width: 28, height: 28, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  topLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  infoIco: { width: 24, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.purpleSoft },
  infoVal: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.ink, textAlign: 'right' },
  darkChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.xs, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  lpill: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill },
  ychip: { minWidth: 64, height: 52, paddingHorizontal: 14, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  ychipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  ychipText: { fontSize: 15, fontWeight: '700', color: colors.ink },
  ychipSub: { fontSize: 11, fontWeight: '600', color: colors.inkMute, marginTop: 1 },
  rank: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.lavenderSoft, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 14, fontWeight: '800', color: colors.purpleSoft },
  lockWrap: { marginTop: 12, minHeight: 420 },
  lockBlur: { maxHeight: 440, overflow: 'hidden', opacity: 0.5 },
  lockPanel: { position: 'absolute', left: 4, right: 4, top: 40, backgroundColor: colors.card, borderRadius: 16, paddingVertical: 24, paddingHorizontal: 20, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.lineStrong, shadowColor: '#28200A', shadowOpacity: 0.22, shadowRadius: 25, shadowOffset: { width: 0, height: 20 }, elevation: 12 },
  priceCard: { marginTop: 24, backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.lineStrong },
  barCol: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  barScore: { fontSize: 10.5, fontWeight: '700', color: colors.inkMute },
  barLabel: { fontSize: 11, color: colors.inkSub, fontWeight: '500' },
  calRow: { flexDirection: 'row', gap: 5 },
  cw: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: colors.inkMute, paddingBottom: 4 },
  cdEmpty: { flex: 1, aspectRatio: 1 },
  cd: { flex: 1, aspectRatio: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cdToday: { borderWidth: 2, borderColor: colors.seal },
  cdSel: { borderWidth: 2, borderColor: colors.purple },
  cdD: { fontFamily: fonts.serif, fontSize: 13, fontWeight: '600', color: colors.ink, lineHeight: 15 },
  cdS: { fontSize: 10, fontWeight: '600', color: colors.inkSub, lineHeight: 12 },
  cdDot: { position: 'absolute', top: 4, right: 4, width: 5, height: 5, borderRadius: 3, backgroundColor: colors.moon },
});
