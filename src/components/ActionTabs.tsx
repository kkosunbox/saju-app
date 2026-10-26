import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Segmented from './Segmented';
import Icon from './Icon';
import Mascot from './Mascot';
import PressableScale from './PressableScale';
import { colors, isDark } from '../theme/colors';
import { ACTION_NOTE } from '../data/keywords';
import { sansW } from '../theme/typography';
import { haptic } from '../utils/haptic';
import { useActionChecks } from '../services/content/actionChecks';

/** 하면 좋은 것을 모두 해낸 날 마스코트가 건네는 칭찬 */
const PRAISE = '작은 실천이 쌓여 내일의 운이 돼요';

const FIGMA_ACCENT = isDark ? colors.accent : '#1DADFE';

/**
 * 해야 할 것 / 피할 것을 한 번에 하나만 — 행동마다 다정한 한마디를 "행동 — 한마디"로.
 * 하면 좋은 것은 눌러서 체크하고, 모두 체크하면 마스코트가 칭찬해 준다.
 */
export default function ActionTabs({ good, avoid, variant = 'default' }: { good: string[]; avoid: string[]; variant?: 'default' | 'figma' }) {
  const [tab, setTab] = useState<'good' | 'avoid'>('good');
  const { ready, done, toggle } = useActionChecks();
  const list = tab === 'good' ? good : avoid;
  const isGood = tab === 'good';
  const allDone = ready && good.length > 0 && good.every(x => done.includes(x));

  const onToggle = (item: string) => {
    const willFinish = !done.includes(item) && good.every(x => x === item || done.includes(x));
    if (willFinish) haptic.done(); else haptic.tick();
    toggle(item);
  };

  return (
    <View>
      <Segmented<'good' | 'avoid'> options={[{ key: 'good', label: '하면 좋은 것' }, { key: 'avoid', label: '피하면 좋은 것' }]} value={tab} onChange={setTab} variant={variant} />
      {isGood && good.length > 0 ? (
        <View style={s.hint}>
          <Icon name="check" size={12} color={variant === 'figma' ? FIGMA_ACCENT : colors.accent} strokeWidth={3} />
          <Text style={s.hintText}>{allDone ? '오늘 할 일을 모두 체크했어요' : '해낸 일은 눌러서 체크해 보세요'}</Text>
          <Text style={[s.hintCount, { color: variant === 'figma' ? FIGMA_ACCENT : colors.accent }]}>{good.filter(x => done.includes(x)).length}/{good.length}</Text>
        </View>
      ) : null}
      <View style={[s.list, variant === 'figma' && s.figmaList, isGood && good.length > 0 && s.listAfterHint]}>
        {list.map(item => {
          const text = (
            <Text style={[s.item, variant === 'figma' && s.figmaItem]}>
              {item}
              {ACTION_NOTE[item] ? <Text style={variant === 'figma' ? undefined : s.note}> — {ACTION_NOTE[item]}</Text> : null}
            </Text>
          );
          if (!isGood) {
            return (
              <View key={item} style={[s.row, variant === 'figma' && s.figmaRow]}>
                <View style={[s.mark, variant === 'figma' && s.figmaMark, { backgroundColor: colors.loveBg }]}>
                  <Icon name="close" size={12} color={colors.love} strokeWidth={3} />
                </View>
                {text}
              </View>
            );
          }
          const checked = done.includes(item);
          return (
            <PressableScale
              key={item}
              onPress={() => onToggle(item)}
              scaleTo={0.98}
              style={[s.row, variant === 'figma' && s.figmaRow]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              accessibilityLabel={item}
              accessibilityHint={checked ? '누르면 체크를 풀어요' : '해냈다면 눌러서 체크해요'}
            >
              <CheckMark checked={checked} figma={variant === 'figma'} />
              <View style={[s.itemWrap, checked && s.itemDone]}>{text}</View>
            </PressableScale>
          );
        })}
      </View>
      {isGood && allDone ? <Praise text={PRAISE} /> : null}
    </View>
  );
}

function CheckMark({ checked, figma }: { checked: boolean; figma: boolean }) {
  const accent = figma ? FIGMA_ACCENT : colors.accent;
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" style={figma ? s.figmaMark : s.svgMark}>
      {checked
        ? <Circle cx={9} cy={9} r={9} fill={accent} />
        : <Circle cx={9} cy={9} r={8.25} fill={colors.surface} stroke={accent} strokeWidth={1.5} />}
      {checked ? <Path d="M5.15385 8.95897L7.44309 11.2012C7.83621 11.5863 8.46658 11.5814 8.85364 11.1902L13 7" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" fill="none" /> : null}
    </Svg>
  );
}

/** 마지막 체크 순간 통 튀어 오르며 나타나는 마스코트 칭찬 */
function Praise({ text }: { text: string }) {
  const [pop] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }).start();
  }, [pop]);
  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  return (
    <Animated.View style={[s.praise, { opacity: pop, transform: [{ scale }] }]} accessibilityLiveRegion="polite" accessible accessibilityLabel={`마스코트의 칭찬: ${text}`}>
      <Mascot size={52} />
      <View style={s.bubble}>
        <Text style={s.praiseTitle}>모두 해냈어요!</Text>
        <Text style={s.praiseText}>{text}</Text>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  list: { gap: 12, marginTop: 16, paddingHorizontal: 4 },
  figmaList: { gap: 0 },
  listAfterHint: { marginTop: 10 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, paddingHorizontal: 4 },
  hintText: { ...sansW('500'), flex: 1, fontSize: 12, lineHeight: 18, letterSpacing: -0.4, color: colors.inkSub },
  hintCount: { ...sansW('700'), fontSize: 12, lineHeight: 18, letterSpacing: -0.2 },
  figmaRow: { gap: 8 },
  figmaMark: { marginTop: 6 },
  svgMark: { marginTop: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  mark: { marginTop: 1, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  itemWrap: { flex: 1 },
  itemDone: { opacity: 0.5 },
  item: { flex: 1, fontSize: 13, lineHeight: 20, color: colors.ink, fontWeight: '600', letterSpacing: -0.5 },
  note: { fontWeight: '500', color: colors.inkSub },
  figmaItem: { ...sansW('600'), fontSize: 12, lineHeight: 32, letterSpacing: -0.48, color: isDark ? colors.ink : '#000000', includeFontPadding: false },
  praise: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, padding: 14, borderRadius: 16, backgroundColor: colors.accentSoft },
  bubble: { flex: 1, gap: 2 },
  praiseTitle: { ...sansW('700'), fontSize: 14, lineHeight: 20, letterSpacing: -0.5, color: colors.ink },
  praiseText: { ...sansW('500'), fontSize: 12, lineHeight: 18, letterSpacing: -0.4, color: colors.inkSub },
});
