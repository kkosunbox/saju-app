import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Keyboard, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../../components/Card';
import StarAvatar from '../../components/StarAvatar';
import Icon from '../../components/Icon';
import LoadingScreen from '../../components/LoadingScreen';
import Screen from '../../components/Screen';
import TextField from '../../components/TextField';
import { useApp } from '../../context/AppContext';
import { useContentScope } from '../../context/ContentScopeContext';
import { useStarMatch } from '../../services/server/starApi';
import { forGender } from './StarOthers';
import { colors } from '../../theme/colors';
import { SCREEN_PX, txt } from '../../theme/typography';

/** 목록은 서버에서 한 번에 받아 두고, 화면에는 스크롤할 때마다 이만큼씩 더 그린다 */
const PAGE = 20;

const searchKey = (value: string) => value.normalize('NFC').toLowerCase().replace(/\s+/g, '');

export default function StarSearchScreen() {
  const { user } = useApp();
  const scope = useContentScope();
  const { bottom } = useSafeAreaInsets();
  const { data, error, refetch } = useStarMatch();
  const [query, setQuery] = useState('');
  // 남자 프로필은 여자 연예인만, 여자 프로필은 남자 연예인만
  const stars = useMemo(() => (data ? forGender(data.stars, user?.gender) : undefined), [data, user?.gender]);
  const term = searchKey(query);
  const matches = useMemo(() => (term ? stars?.filter(star => searchKey(star.name).includes(term)) : stars) ?? [], [stars, term]);
  const [limit, setLimit] = useState(PAGE);
  // 검색어가 바뀌면 처음 한 쪽부터
  useEffect(() => setLimit(PAGE), [term]);
  const shown = useMemo(() => matches.slice(0, limit), [matches, limit]);

  if (!user) return null;
  if (!data) return <LoadingScreen title="연예인 검색" error={error} onRetry={refetch} />;

  return (
    <Screen title="연예인 검색" back scroll={false} contentStyle={s.content}>
      <TextField
        value={query}
        onChangeText={setQuery}
        placeholder="연예인 이름으로 검색"
        accessibilityLabel="연예인 이름으로 검색"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
        containerStyle={s.field}
      />
      <FlatList
        data={shown}
        onEndReached={() => { if (limit < matches.length) setLimit(n => n + PAGE); }}
        onEndReachedThreshold={0.6}
        keyExtractor={star => String(star.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[s.list, { paddingBottom: Math.max(bottom, 16) }]}
        ListEmptyComponent={<Text style={s.empty}>{term ? '검색 결과가 없어요.' : '지금은 궁합을 볼 수 있는 연예인이 없어요.'}</Text>}
        renderItem={({ item: star }) => (
          <Card
            style={s.row}
            accessibilityLabel={`${star.name}, 궁합 보기`}
            onPress={() => {
              Keyboard.dismiss();
              router.push({ pathname: '/star/[id]', params: { id: String(star.id), profileId: scope?.profileId ?? undefined } });
            }}
          >
            <StarAvatar name={star.name} gender={star.gender} size={42} />
            <View style={s.name}>
              <Text style={txt.h3}>{star.name}</Text>
              {star.description ? <Text style={txt.small} numberOfLines={1}>{star.description}</Text> : null}
            </View>
            <Icon name="chevronRight" size={20} color={colors.inkMute} />
          </Card>
        )}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { paddingTop: 8 },
  field: { marginHorizontal: SCREEN_PX, marginBottom: 12 },
  list: { paddingHorizontal: SCREEN_PX, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10 },
  name: { flex: 1, minWidth: 0 },
  empty: { ...txt.small, textAlign: 'center', paddingVertical: 28 },
});
