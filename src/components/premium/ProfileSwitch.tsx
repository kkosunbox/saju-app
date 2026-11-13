/**
 * 콘텐츠 화면 왼쪽 위의 "누구 것을 보나" — 이름을 누르면 프로필을 고른다.
 * 프로필 정보를 고치기 전에 본 풀이는 그 프로필 아래에 함께 보여 준다 (프로필을 지우면 같이 지워진다).
 * 공유 화면 · 콘텐츠 화면 밖에서는 그리지 않는다.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import BottomSheet from '../BottomSheet';
import Icon from '../Icon';
import PressableScale from '../PressableScale';
import { useApp } from '../../context/AppContext';
import { useContentScope } from '../../context/ContentScopeContext';
import { usePremium } from '../../context/PremiumContext';
import { useSharedView } from '../../context/SharedViewContext';
import { RELATIONSHIP_LABEL } from '../../types';
import { Entitlement } from '../../services/server/pointsApi';
import { colors } from '../../theme/colors';
import { radius, txt } from '../../theme/typography';

const dot = (iso: string) => iso.replace(/-/g, '.');

/** 이전 풀이 영역의 최대 높이 (넘으면 그 안에서 스크롤) · 한 번에 그리는 개수 */
const OLDER_MAX_HEIGHT = 168;
const OLDER_PAGE = 10;

/**
 * 한 프로필의 이전 풀이 — 많아지면 정해진 높이 안에서 스크롤하고, 끝에 닿을 때마다 다음 묶음을 더 그린다.
 * 목록 자체는 열람권 목록(GET /premium/unlocks)에 이미 다 들어 있어 따로 불러오지 않는다.
 */
function OlderList({ older, viewingId, onPick }: { older: Entitlement[]; viewingId: number | null; onPick(e: Entitlement): void }) {
  const [shown, setShown] = useState(OLDER_PAGE);
  // 아래에 더 있으면 끝을 흐리게 해서 스크롤된다는 걸 알린다 (스크롤 막대는 숨긴다)
  const [atEnd, setAtEnd] = useState(older.length <= 4);
  return (
    <View>
      <ScrollView
        style={{ maxHeight: OLDER_MAX_HEIGHT }}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={100}
        onScroll={({ nativeEvent: { layoutMeasurement, contentOffset, contentSize } }) => {
          const bottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
          if (bottom && shown < older.length) setShown(n => n + OLDER_PAGE);
          setAtEnd(bottom && shown >= older.length);
        }}
      >
        {older.slice(0, shown).map(e => {
          const on = viewingId === e.id;
          return (
            <PressableScale key={e.id} onPress={() => onPick(e)} style={s.sub} scaleTo={0.98} accessibilityState={{ selected: on }}>
              <Text style={[txt.caption, { flex: 1 }, on && { color: colors.ink }]}>이전 풀이{e.openedOn ? ` · ${dot(e.openedOn)}` : ''}</Text>
              {on ? <Icon name="check" size={16} color={colors.ink} strokeWidth={2.4} /> : <Icon name="chevronRight" size={14} color={colors.inkMute} />}
            </PressableScale>
          );
        })}
      </ScrollView>
      {atEnd ? null : <LinearGradient pointerEvents="none" colors={[colors.card + '00', colors.card]} style={s.fade} />}
    </View>
  );
}

export default function ProfileSwitch({ contentKey, style }: { contentKey?: string; style?: object }) {
  const scope = useContentScope();
  const shared = useSharedView();
  const { profiles } = useApp();
  const { records } = usePremium();
  const [open, setOpen] = useState(false);
  if (!scope || shared) return null;
  const viewing = scope.entitlement;
  const name = scope.profile?.nickname ?? '';
  const close = () => setOpen(false);

  return (
    <>
      <PressableScale onPress={() => setOpen(true)} style={[s.chip, style]} scaleTo={0.97} accessibilityLabel={`${name}님 것을 보는 중, 다른 프로필 고르기`}>
        <Text style={s.chipText} numberOfLines={1}>{name}님{viewing ? ' · 이전 풀이' : ''}</Text>
        <Icon name="chevronDown" size={12} color={colors.purpleSoft} strokeWidth={2.2} />
      </PressableScale>
      <BottomSheet visible={open} onClose={close}>
        <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
          <Text style={txt.h2}>누구 것을 볼까요?</Text>
          <View style={s.list}>
            {profiles.map(p => {
              const selected = !viewing && p.profileId === scope.profileId;
              // 이 프로필의 정보를 고치기 전에 본 풀이 (지금 정보로 연 것은 프로필을 고르면 나온다)
              const older = contentKey ? records(contentKey, p.profileId).filter(e => !e.current) : [];
              return (
                <View key={p.profileId} style={[s.group, (selected || older.some(e => e.id === viewing?.id)) && s.groupOn]}>
                  <PressableScale onPress={() => { scope.selectProfile(p.profileId!); close(); }} style={s.row} scaleTo={0.98} accessibilityState={{ selected }}>
                    <View style={{ flex: 1 }}>
                      <Text style={txt.bodyStrong}>{p.nickname}{p.isPrimary ? '  · 대표' : ''}</Text>
                      <Text style={txt.caption}>{RELATIONSHIP_LABEL[p.relationship ?? 'other']} · {dot(p.birthDateInput ?? p.birthDate)}{p.calendarType === 'lunar' ? ' (음력)' : ''}</Text>
                    </View>
                    {selected ? <Icon name="check" size={18} color={colors.ink} strokeWidth={2.4} /> : null}
                  </PressableScale>
                  {older.length ? (
                    <OlderList older={older} viewingId={viewing?.id ?? null} onPick={e => { scope.selectEntitlement(e); close(); }} />
                  ) : null}
                </View>
              );
            })}
          </View>
          <PressableScale onPress={() => { close(); scope.expectNewProfile(); router.push('/profiles/new'); }} style={s.add} scaleTo={0.98} accessibilityRole="button" accessibilityLabel="프로필 추가하기">
            <Text style={s.addText}>+ 프로필 추가하기</Text>
          </PressableScale>
        </ScrollView>
      </BottomSheet>
    </>
  );
}

const s = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.lavenderSoft, maxWidth: '60%',
  },
  chipText: { ...txt.caption, fontSize: 12, color: colors.purpleSoft, flexShrink: 1 },
  list: { marginTop: 12, gap: 8 },
  group: { borderRadius: radius.lg, backgroundColor: colors.card, overflow: 'hidden', borderWidth: 1.5, borderColor: 'transparent' },
  groupOn: { borderColor: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  add: { marginTop: 10, height: 48, borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  addText: { ...txt.small, color: colors.ink },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 28 },
  sub: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line },
});
