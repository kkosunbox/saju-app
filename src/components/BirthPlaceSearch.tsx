import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import PressableScale from './PressableScale';
import OptionChip from './OptionChip';
import TextField from './TextField';
import { colors } from '../theme/colors';
import { radius, txt } from '../theme/typography';
import { BirthPlace } from '../types';
import { birthPlaceApi } from '../services/server/birthPlaceApi';

const DEBOUNCE_MS = 250;
const RESULT_LIMIT = 8;
/** 비워 두면 보여 주는 자주 고르는 곳 (국내 8 + 해외 8) */
const POPULAR_LIMIT = 16;

interface Props {
  /** undefined = 아직 고르지 않음, null = 몰라요 */
  selected: BirthPlace | null | undefined;
  onPick(place: BirthPlace | null): void;
  /** 회색 카드 안의 낮은 칸 (궁합 상대 입력) */
  compact?: boolean;
  autoFocus?: boolean;
}

/**
 * 출생지 검색 — 시·군이나 도시 이름(한글·영어)을 치면 서버 목록에서 찾는다.
 * 비워 두면 자주 고르는 곳(국내 특별·광역시, 해외 주요 도시)을 칩으로 보여 준다.
 */
export default function BirthPlaceSearch({ selected, onPick, compact, autoFocus }: Props) {
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<BirthPlace[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      const q = query.trim();
      birthPlaceApi.search(q, q ? RESULT_LIMIT : POPULAR_LIMIT)
        .then(list => { if (alive) { setPlaces(list); setFailed(false); } })
        .catch(() => { if (alive) { setPlaces([]); setFailed(true); } });
    }, query ? DEBOUNCE_MS : 0);
    return () => { alive = false; clearTimeout(t); };
  }, [query]);

  const popular = !query.trim();
  return (
    <View>
      <TextField compact={compact} value={query} onChangeText={setQuery} placeholder="예: 포항, 로스앤젤레스, Seattle"
        autoFocus={autoFocus} autoCorrect={false} returnKeyType="search" accessibilityLabel="출생지 검색" />
      {places === null ? <ActivityIndicator style={{ paddingVertical: 14 }} color={colors.inkMute} /> : null}
      {popular && places?.length ? (
        <View style={s.chips}>
          {places.map(p => (
            <OptionChip key={p.id} compact label={p.name} selected={selected?.id === p.id} onPress={() => onPick(p)} style={s.chip} />
          ))}
        </View>
      ) : null}
      {!popular && places ? (
        <View style={[s.list, compact && s.compactList]}>
          {places.map(p => {
            const on = selected?.id === p.id;
            const sub = [p.englishName, p.region].filter(Boolean).join(' · ');
            return (
              <PressableScale key={p.id} onPress={() => onPick(p)} scaleTo={0.98} haptic
                style={[s.item, on && s.itemOn]} accessibilityRole="button" accessibilityState={{ selected: on }}
                accessibilityLabel={[p.name, sub].filter(Boolean).join(', ')}>
                <Text style={[s.name, on && { color: colors.white }]} numberOfLines={1}>{p.name}</Text>
                {sub ? <Text style={[s.sub, on && { color: 'rgba(255,255,255,0.72)' }]} numberOfLines={1}>{sub}</Text> : null}
              </PressableScale>
            );
          })}
          {places.length === 0 ? (
            <Text style={[txt.caption, s.empty]}>
              {failed ? '목록을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.' : '찾는 곳이 없어요. 가까운 큰 도시로 골라 주세요.'}
            </Text>
          ) : null}
        </View>
      ) : null}
      {popular && failed ? <Text style={[txt.caption, { marginTop: 8 }]}>목록을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.</Text> : null}
      <OptionChip compact label="몰라요 · 서울로 볼게요" selected={selected === null} onPress={() => onPick(null)} style={{ marginTop: 8 }} />
      <Text style={[txt.caption, { marginTop: 6 }]}>태어난 시각을 그곳 시간으로 계산해요. 해외도 도시 이름으로 찾을 수 있어요.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { paddingHorizontal: 12 },
  list: { marginTop: 8, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.lineStrong, overflow: 'hidden' },
  compactList: { borderRadius: 6, borderColor: colors.surface, backgroundColor: colors.surface },
  item: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.lineStrong },
  itemOn: { backgroundColor: colors.navy },
  name: { fontSize: 15, fontWeight: '600', color: colors.ink },
  sub: { fontSize: 12, color: colors.inkMute, marginTop: 2 },
  empty: { paddingHorizontal: 14, paddingVertical: 12 },
});
