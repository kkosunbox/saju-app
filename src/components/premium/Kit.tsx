/**
 * 프리미엄 콘텐츠 공용 UI 조각 — HTML 미리보기의 card/hero/tip/toc/lock 등과 1:1 대응.
 */
import { Image as AssetImage } from 'expo-image';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle, type ScrollViewInstance } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PressableScale from '../PressableScale';
import Card from '../Card';
import Icon from '../Icon';
import PrimaryButton from '../PrimaryButton';
import Ico from '../Ico';
import { usePremium } from '../../context/PremiumContext';
import { Item, fmtP, ro } from '../../services/premium/catalog';
import { SrcKey } from '../../types/premium';
import { analysisTheme, colors, gradients } from '../../theme/colors';
import { fonts, radius, SCREEN_PX, shadow, txt } from '../../theme/typography';
import { HeadTitle } from '../SectionHeader';
import { ART, MascotPeek } from '../Mascot';
import GradientBorder from '../GradientBorder';
import { Coin } from '../Amount';

export const scoreColor = (v: number) => (v >= 85 ? colors.purple : v >= 75 ? colors.purpleSoft : colors.inkMute);

/* ---------- 알(재화) 표시 ---------- */
export { Amount, Coin } from '../Amount';

export function Pill({ children, tone = 'default', style }: { children: React.ReactNode; tone?: 'default' | 'ok' | 'care'; style?: StyleProp<ViewStyle> }) {
  const bg = tone === 'ok' ? colors.okBg : tone === 'care' ? colors.careBg : colors.lavenderSoft;
  const fg = tone === 'ok' ? colors.success : tone === 'care' ? colors.thai : colors.purple;
  return (
    <View style={[s.pill, { backgroundColor: bg }, style]}>
      {typeof children === 'string' || typeof children === 'number' ? <Text style={[s.pillText, { color: fg }]}>{children}</Text> : children}
    </View>
  );
}

/** 남색 알약 가격 "◎ 300" — small은 '곧 오픈' 카드처럼 좁은 자리용 */
export function CostPill({ cost, small }: { cost: number; small?: boolean }) {
  return (
    <View style={[s.cost, small && s.costSmall]}>
      <Coin size={small ? 11 : 14} />
      <Text style={[s.costText, small && s.costTextSmall]}>{cost.toLocaleString('ko-KR')}</Text>
    </View>
  );
}

export const FREE_BLUE = '#00A3FF';
export const OWNED_GREEN = '#00A220';

/** 테두리만 있는 작은 태그 — 무료(파랑) · 보유(초록) */
export function LineTag({ label, color = FREE_BLUE }: { label: string; color?: string }) {
  return <View style={[s.lineTag, { borderColor: color }]}><Text style={[s.lineTagText, { color }]}>{label}</Text></View>;
}

/** 보유 여부에 따라 "보유" 또는 "◎ 300" */
export function PriceTag({ item, small }: { item: Item; small?: boolean }) {
  const { owned } = usePremium();
  if (owned(item.key)) return <LineTag label="보유" color={OWNED_GREEN} />;
  return <CostPill cost={item.cost} small={small} />;
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
export function SubHead({ title, caption, first, variant = 'default' }: { title: string; caption?: string; first?: boolean; variant?: 'default' | 'figma' }) {
  return (
    <View style={{ marginTop: first ? 12 : 32, marginBottom: 16 }}>
      <HeadTitle title={title} caption={caption} variant={variant} />
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
export function ActRow({ ok = true, children, icon, variant = 'default' }: { ok?: boolean; children: React.ReactNode; icon?: 'check' | 'sparkle' | 'close'; variant?: 'default' | 'figma' }) {
  const signal = icon === 'sparkle';
  const source = signal ? require('../../../assets/compatibility/signal.svg')
    : ok ? require('../../../assets/compatibility/check.svg')
    : require('../../../assets/compatibility/caution.svg');
  const size = signal ? 20 : 22;
  return (
    <View style={s.actRow}>
      {variant === 'figma' ? (
        // 아이콘만 교체한다. 원래 24px 칸을 유지해야 본문 시작점과 줄바꿈이 움직이지 않는다.
        <View style={[s.mark, { flexShrink: 0 }]}>
          <AssetImage source={source} style={{ width: size, height: size }} contentFit="contain" accessible={false} />
        </View>
      ) : (
        <View style={[s.mark, { backgroundColor: ok ? colors.okBg : colors.careBg }]}><Icon name={icon ?? (ok ? 'check' : 'sparkle')} size={14} color={ok ? colors.success : colors.thai} strokeWidth={2.4} /></View>
      )}
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
        {/* 오른쪽 끝에서 들여다보는 마스코트 (장식, 터치 없음) — 카드 높이가 화면마다 달라 아래에 붙인다. 내 알(높이 114)에서 Figma 위치(위에서 23)와 같다 */}
        <MascotPeek width={109} bottom={-40} opacity={0.2} />
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
  const ref = useRef<ScrollViewInstance>(null);
  const xs = useRef<Record<string, number>>({});
  const scrollTo = (k: string, animated: boolean) => {
    const x = xs.current[k];
    if (x !== undefined) ref.current?.scrollTo({ x: Math.max(0, x - 120), animated });
  };
  useEffect(() => { scrollTo(String(value), true); }, [value]);
  return (
    <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -SCREEN_PX, marginTop: 12 }} contentContainerStyle={{ paddingHorizontal: SCREEN_PX, gap: 8, paddingVertical: 2 }}>
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
  return <View style={[s.rank, first && { backgroundColor: colors.navy }]}><Text style={[s.rankText, first && { color: colors.white }]}>{n}</Text></View>;
}

/* ---------- 잠금 ---------- */
/** 잠긴 본문 자리에 까는 가짜 줄 — 유료 내용은 열기 전에는 서버에서 받지 않는다 */
function GhostBody() {
  const line = (w: `${number}%`, i: number) => <View key={i} style={[s.ghostLine, { width: w }]} />;
  return (
    <View style={{ gap: 14 }}>
      {[0, 1, 2].map(k => (
        <View key={k}>
          <View style={s.ghostHead} />
          <View style={s.ghostCard}>{(['92%', '100%', '84%', '96%', '60%'] as const).map(line)}</View>
        </View>
      ))}
    </View>
  );
}

/** 잠긴 본문: 가짜 줄을 흐리게 깔고 그 위에 열람 패널. 열려 있으면 children(본문) */
export function LockGate({ item, children, onUnlocked }: { item: Item; children?: React.ReactNode; onUnlocked?(): void }) {
  const { owned, points, openUnlock } = usePremium();
  if (owned(item.key)) return <>{children}</>;
  const blur = Platform.OS === 'web' ? ({ filter: 'blur(3px)' } as object) : null;
  return (
    <View style={s.lockWrap}>
      <View style={[s.lockBlur, blur]} pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <GhostBody />
        <LinearGradient colors={[colors.cream + '00', colors.cream]} locations={[0.25, 0.95]} style={StyleSheet.absoluteFill} />
      </View>
      <View style={s.lockPanel}>
        <View style={s.lockIco}><Icon name="lock" size={26} color={colors.accent} strokeWidth={1.8} /></View>
        <Text style={[txt.h3, { marginTop: 10, textAlign: 'center' }]}>{item.title}</Text>
        <Text style={[txt.small, { marginTop: 2, textAlign: 'center' }]}>{item.desc}</Text>
        <PrimaryButton label={`${item.cost}${ro(item.cost)} 전체 보기`} icon={<Coin size={18} />} onPress={() => openUnlock(item, onUnlocked)} style={{ marginTop: 16, alignSelf: 'stretch' }} />
        <Text style={[txt.caption, { marginTop: 10, textAlign: 'center' }]}>보유 {fmtP(points)} · {item.scope}</Text>
      </View>
    </View>
  );
}

/** 열람한 본문을 서버에서 받는 중이거나 받지 못했을 때 */
export function BodyState({ error, onRetry }: { error?: boolean; onRetry?(): void }) {
  return (
    <View style={s.bodyState}>
      {error ? (
        <>
          <Text style={[txt.body, { textAlign: 'center' }]}>내용을 불러오지 못했어요.</Text>
          {onRetry ? <PrimaryButton label="다시 불러오기" variant="soft" onPress={onRetry} style={{ marginTop: 12, alignSelf: 'stretch' }} /> : null}
        </>
      ) : (
        <>
          <ActivityIndicator color={colors.purple} />
          <Text style={[txt.small, { marginTop: 10 }]}>풀이를 불러오고 있어요</Text>
        </>
      )}
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
      <View style={s.between}><PriceTag item={item} /><View style={s.row4}><Icon name="lock" size={13} color={colors.inkMute} /><Text style={txt.caption}>잠김</Text></View></View>
      <Text style={[txt.h3, { marginTop: 10 }]}>{item.title}</Text>
      <Text style={[txt.small, { marginTop: 4 }]}>{item.desc}</Text>
    </PressableScale>
  );
}

/** 잠긴 리포트 카드 (궁합 결과 아래) — 하늘색 테두리 · 마스코트 · 남색 "◎150으로 전부 열기" */
export function LockedCard({ item, onUnlocked }: { item: Item; onUnlocked?(): void }) {
  const { openUnlock } = usePremium();
  return (
    <GradientBorder width={1.5} outer={{ marginTop: 24 }} style={{ padding: 16 }}>
      <Image source={ART.crush} style={s.lockedArt} resizeMode="contain" />
      <View style={s.between}>
        <Text style={s.lockedTitle}>{item.title}</Text>
        <View style={s.lockedChip}><Icon name="lock" size={12} color={FREE_BLUE} strokeWidth={2} /><Text style={s.lockedChipText}>잠김</Text></View>
      </View>
      <Text style={s.lockedDesc}>{item.desc}</Text>
      <PressableScale onPress={() => openUnlock(item, onUnlocked)} style={s.lockedBtn} scaleTo={0.98} accessibilityLabel={`${item.title} ${item.cost}알로 열기`}>
        <Coin size={14} />
        <Text style={s.lockedBtnText}>{item.cost.toLocaleString('ko-KR')}으로 전부 열기</Text>
      </PressableScale>
    </GradientBorder>
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
            <View style={{ width: '70%', height: h, borderRadius: 5, backgroundColor: top ? colors.accent : x.total === mn ? colors.line : colors.lavender }} />
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
    // 하늘색(#15ABFE)을 카드색 위에 8~80% 덮은 색 (HTML color-mix와 같음)
    const a = 0.08 + t * 0.72; const base = [1, 3, 5].map(i => parseInt(colors.card.slice(i, i + 2), 16));
    const [r, g, b] = [0x15, 0xab, 0xfe].map((v, i) => Math.round(base[i] + (v - base[i]) * a));
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
  row4: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill },
  pillText: { fontSize: 12, fontWeight: '800', color: colors.purple },
  cost: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 5, paddingRight: 8, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.heroBg },
  costSmall: { gap: 2, paddingRight: 6, paddingVertical: 2 },
  costText: { fontSize: 12, lineHeight: 16, fontWeight: '700', color: colors.white },
  costTextSmall: { fontSize: 10, lineHeight: 14 },
  // 0.5px 테두리와 줄높이 없는 글자는 iOS 사파리에서 아래가 잘려서 1px 테두리 · 줄높이를 정하고 전체를 옅게 한다
  lineTag: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 5, borderWidth: 1, opacity: 0.85 },
  lineTagText: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
  para: { fontSize: 14.5, lineHeight: 23, color: colors.inkSub },
  bullet: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 4 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  tip: { marginTop: 12, backgroundColor: colors.accentSoft, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 14 },
  tipTitle: { fontSize: 12, fontWeight: '700', color: colors.purpleSoft, marginBottom: 2 },
  tipText: { fontSize: 14, lineHeight: 21, color: colors.ink },
  soft: { backgroundColor: colors.accentSoft, borderRadius: radius.lg, padding: 18 },
  actRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  mark: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  viewRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 9 },
  vdot: { width: 28, height: 28, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  topLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  infoIco: { width: 24, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.purpleSoft },
  infoVal: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.ink, textAlign: 'right' },
  darkChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  lpill: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill },
  ychip: { minWidth: 64, height: 52, paddingHorizontal: 14, borderRadius: radius.lg, backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  ychipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  ychipText: { fontSize: 15, fontWeight: '700', color: colors.ink },
  ychipSub: { fontSize: 11, fontWeight: '600', color: colors.inkMute, marginTop: 1 },
  rank: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 14, fontWeight: '800', color: colors.purpleSoft },
  lockWrap: { marginTop: 12, minHeight: 420 },
  lockIco: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  bodyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 16 },
  ghostHead: { width: '40%', height: 16, borderRadius: 8, backgroundColor: colors.lineStrong, marginTop: 20, marginBottom: 12 },
  ghostCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, gap: 10 },
  ghostLine: { height: 11, borderRadius: 6, backgroundColor: colors.line },
  lockBlur: { maxHeight: 440, overflow: 'hidden', opacity: 0.5 },
  lockPanel: { position: 'absolute', left: 4, right: 4, top: 40, backgroundColor: colors.cream, borderRadius: radius.lg, paddingVertical: 24, paddingHorizontal: 20, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.lineStrong, shadowColor: '#28200A', shadowOpacity: 0.22, shadowRadius: 25, shadowOffset: { width: 0, height: 20 }, elevation: 12 },
  lockedArt: { position: 'absolute', right: 0, bottom: 0, width: 112, height: 137, opacity: 0.55 },
  lockedTitle: { flexShrink: 1, fontSize: 16, lineHeight: 18, fontWeight: '700', letterSpacing: -0.8, color: FREE_BLUE },
  lockedChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4, paddingVertical: 2, borderRadius: radius.xs, backgroundColor: colors.accentSoft },
  lockedChipText: { fontSize: 12, fontWeight: '600', color: FREE_BLUE, opacity: 0.8 },
  lockedDesc: { marginTop: 8, fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.ink },
  lockedBtn: { marginTop: 12, marginHorizontal: -4, height: 40, borderRadius: radius.sm, backgroundColor: colors.navy, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  lockedBtnText: { fontSize: 14, fontWeight: '500', color: colors.white },
  priceCard: { marginTop: 24, backgroundColor: colors.cream, borderRadius: radius.lg, padding: 18, borderWidth: 1, borderColor: colors.accent },
  barCol: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  barScore: { fontSize: 10.5, fontWeight: '700', color: colors.inkMute },
  barLabel: { fontSize: 11, color: colors.inkSub, fontWeight: '500' },
  calRow: { flexDirection: 'row', gap: 5 },
  cw: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: colors.inkMute, paddingBottom: 4 },
  cdEmpty: { flex: 1, aspectRatio: 1 },
  cd: { flex: 1, aspectRatio: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cdToday: { borderWidth: 2, borderColor: colors.accent },
  cdSel: { borderWidth: 2, borderColor: colors.ink },
  cdD: { fontFamily: fonts.serif, fontSize: 13, fontWeight: '600', color: colors.ink, lineHeight: 15 },
  cdS: { fontSize: 10, fontWeight: '600', color: colors.inkSub, lineHeight: 12 },
  cdDot: { position: 'absolute', top: 4, right: 4, width: 5, height: 5, borderRadius: 3, backgroundColor: colors.moon },
});
