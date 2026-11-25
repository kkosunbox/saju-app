import React, { useCallback, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import Screen, { TalkEnd } from '../../components/Screen';
import Card from '../../components/Card';
import Disclaimer from '../../components/Disclaimer';
import BottomSheet from '../../components/BottomSheet';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import Icon from '../../components/Icon';
import SolidIcon from '../../components/SolidIcon';
import FriendCompare from '../../components/FriendCompare';
import LoadingScreen from '../../components/LoadingScreen';
import ShareCta, { ShareIconButton } from '../../components/ShareCta';
import ProfileForm from '../../components/profile/ProfileForm';
import { BodyState, LockGate, Para, Rank, SubHead, Tip } from '../../components/premium/Kit';
import { PartPending, ReadingBanner } from '../../components/premium/Reading';
import { PREVIEW_STEPS, PreviewMakingCard, PreviewReveal, usePreviewMaking } from '../../components/premium/PreviewMaking';
import { ReadingReveal, ReadingStepsScreen, useReadingGate } from '../../components/premium/ReadingGate';
import { useApp } from '../../context/AppContext';
import { usePremium } from '../../context/PremiumContext';
import { useSharedArg, useSharedView } from '../../context/SharedViewContext';
import { ApiError } from '../../api/client';
import { ITEMS } from '../../services/premium/catalog';
import { usePremiumContent, useReading } from '../../services/server/premiumApi';
import { contentChatSource } from '../../services/server/consultApi';
import { ChildMemberInput, childApi, refreshChildSets, useChildSets } from '../../services/server/childApi';
import { inputOf, ProfileInput } from '../../services/server/profileApi';
import { childSpec, josa } from '../../services/share/shareSpecs';
import { ELEMENT_INFO } from '../../data/sajuData';
import { ChildLevel, ChildPreview, ChildReport, ChildSet } from '../../types/premium';
import { isLegacyChild, LegacyChildBody, LegacyChildReading, LegacyChildReport, legacyPreviewOf } from './ChildLegacy';
import { ChildReading, ReadingView } from '../../types/reading';
import { RELATIONSHIP_LABEL, User } from '../../types';
import { colors } from '../../theme/colors';
import { radius, sansW, txt } from '../../theme/typography';

/** 입력 화면 위 배너 · 결과 첫 카드 배경 (아기 그림까지 한 장, Figma 그대로) */
const INTRO_ART = require('../../../assets/images/child-intro.webp');
const HERO_ART = require('../../../assets/images/child-hero.webp');
/** Figma 우리 아이 사주 전용 색 */
const LIKE_LINE = '#92D8FF';
const CARE_LINE = '#FFB1B1';
const HERO_INK = '#000000';
const HERO_SUB = '#555555';
const HERO_TITLE = '#00A4FF';
const TAG_INK = '#003A5A';
const BOND_SUB = '#B7B7B7';
const INTRO_SUB = '#666666';

/** 열어 본 결과에서 첫 화면(무료)에 그리는 부분 — 서버 childPreviewOf와 같다 */
function previewOf(R: ChildReport): ChildPreview {
  const { nickname, age, title, headline, stem, element, elementKo, animal, keywords, temperament } = R.child;
  return {
    child: { nickname, age, title, headline, stem, element, elementKo, animal, keywords, temperament: { group: temperament.group, name: temperament.name } },
    talents: R.talents.slice(0, 3).map(({ group, name }) => ({ group, name })),
    parents: R.parents.map(({ title, nickname: n, type, seat }) => ({ title, nickname: n, type, seat: { level: seat.level, name: seat.name } })),
  };
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
const dot = (iso: string) => iso.replace(/-/g, '.');
/** 결과를 만든 방법 — 예전 구조로 고정된 결과에는 그때의 설명 */
const METHOD = '아이의 생년월일시로 네 기둥을 세워, 일간이 그리는 타고난 바탕과 사주에서 가장 강한 십성이 그리는 기질 유형을 겹쳐 봤어요. 훈육·친구·감정은 그 기질과 일간, 기운의 크기로 읽었어요. 엄마·아빠와의 사이는 아이 사주 속 엄마(인성)·아빠(재성)의 자리와 부모 사주 속 아이(엄마는 식상, 아빠는 관성)의 자리, 두 사람의 일간과 일지로 봤어요. 자라는 흐름은 실제로 대운이 바뀌는 나이로 나눴어요. 사주는 타고난 경향일 뿐이고, 아이는 사랑과 경험 속에서 얼마든지 새롭게 자라요.';
const LEGACY_METHOD = '아이의 생년월일시로 네 기둥을 세워 타고난 기운과 오행의 균형, 십성의 힘을 보고, 엄마·아빠의 일간·일지·띠와 겹쳐 궁합 유형을 정했어요. 자라는 시기는 10년마다 바뀌는 대운으로 봤어요. 사주는 타고난 경향일 뿐이고, 아이는 사랑과 경험 속에서 얼마든지 새롭게 자라요.';

/**
 * 프리미엄: 우리 아이 사주 — 아이와 엄마 · 아빠를 한 가족으로 묶어 등록하고(고칠 수 없다), 가족마다 따로 연다.
 * 첫 화면(아이 한 줄 · 재능 TOP 3 이름 · 엄마·아빠와의 궁합 유형)은 무료, 나머지는 잠금.
 */
export default function ChildScreen() {
  const shared = useSharedView();
  const sharedArg = useSharedArg();
  const q = useChildSets();
  // 풀이 완성 알림 · 보유 목록에서 오면 그 가족으로 연다
  const { childId } = useLocalSearchParams<{ childId?: string }>();
  const [selected, setSelected] = useState<number | null>(childId ? Number(childId) || null : null);
  const [adding, setAdding] = useState(false);
  if (shared) {
    const id = Number(sharedArg);
    return <ChildResult id={id} sets={[]} />;
  }
  if (!q.data) return <LoadingScreen title="우리 아이 사주" error={q.error} onRetry={q.refetch} />;
  const sets = q.data;
  const set = sets.find(x => x.id === selected) ?? sets[0];
  if (adding || !set) {
    return (
      <ChildForm
        onCancel={sets.length ? () => setAdding(false) : undefined}
        onSaved={saved => { setSelected(saved.id); setAdding(false); }}
      />
    );
  }
  return (
    <ChildResult
      key={set.id} id={set.id} set={set} sets={sets}
      onPick={setSelected} onAdd={() => setAdding(true)} onRemoved={() => setSelected(null)}
    />
  );
}

/* ---------- 등록 ---------- */

type Slot = 'child' | 'parent1' | 'parent2';
const SLOT_LABEL: Record<Slot, string> = { child: '아이 정보', parent1: '함께 볼 보호자', parent2: '함께 볼 보호자 2' };
type Pick = { kind: 'profile'; profile: User } | { kind: 'manual'; input: ProfileInput };
type ProfileSource = { profile: User; revision: number };

const birthLine = (calendarType: 'solar' | 'lunar', birthDate: string, birthTime: string | null) =>
  `${dot(birthDate)}${calendarType === 'lunar' ? ' (음력)' : ''}${birthTime ? ` ${birthTime}` : ''}`;
const ignoreSubmit = async () => {};
const ignoreClose = () => {};

/** 공통 프로필 필드를 그대로 사용해 입력값과 유효 여부를 전달한다. */
function ChildMemberFields({ slot, initial, onChange }: { slot: Slot; initial?: User; onChange(slot: Slot, input: ProfileInput | null): void }) {
  const change = useCallback((input: ProfileInput | null) => onChange(slot, input), [slot, onChange]);
  return <ProfileForm inline initial={initial} subject={slot === 'child' ? 'child' : 'adult'} title="" hint="" onSubmit={ignoreSubmit} onClose={ignoreClose} onInputChange={change} />;
}

/** 아이부터 입력하고, 보호자는 필요한 만큼(최대 두 명) 이어서 입력한다. */
function ChildForm({ onCancel, onSaved }: { onCancel?(): void; onSaved(set: ChildSet): void }) {
  const { profiles, refreshProfiles } = useApp();
  const { toast } = usePremium();
  const [picks, setPicks] = useState<Partial<Record<Slot, Pick>>>({});
  const [sources, setSources] = useState<Partial<Record<Slot, ProfileSource>>>({});
  const [saveProfiles, setSaveProfiles] = useState<Record<Slot, boolean>>({ child: false, parent1: false, parent2: false });
  const [secondParent, setSecondParent] = useState(false);
  const [active, setActive] = useState<Slot>('child');
  const [choosing, setChoosing] = useState<Slot | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const change = useCallback((slot: Slot, input: ProfileInput | null) => {
    const source = sources[slot]?.profile;
    const unchanged = source && input && JSON.stringify(input) === JSON.stringify(inputOf(source));
    setPicks(p => ({ ...p, [slot]: !input ? undefined : unchanged ? { kind: 'profile', profile: source } : { kind: 'manual', input } }));
  }, [sources]);
  const usedIds = Object.entries(sources).flatMap(([slot, source]) => slot !== choosing && source ? [source.profile.profileId] : []);
  const available = profiles.filter(p => p.profileId != null && !usedIds.includes(p.profileId));
  const ready = !!picks.child && !!picks.parent1 && (!secondParent || !!picks.parent2);

  const save = async () => {
    if (!ready || saving) return;
    setSaving(true);
    setError(null);
    const member = (slot: Slot): ChildMemberInput => {
      const p = picks[slot]!;
      return p.kind === 'profile' ? { profileId: p.profile.profileId! } : { profile: p.input, saveToProfiles: saveProfiles[slot] };
    };
    try {
      const saved = await childApi.create({
        child: member('child'),
        parents: [member('parent1'), ...(secondParent ? [member('parent2')] : [])],
      });
      if (Object.entries(picks).some(([slot, p]) => p?.kind === 'manual' && saveProfiles[slot as Slot])) await refreshProfiles();
      await refreshChildSets();
      toast(`${saved.child.nickname}의 정보를 등록했어요`);
      onSaved(saved);
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : '';
      setError(code === 'INVALID_BIRTH_DATE' ? '없는 날짜가 있어요. 음력이면 윤달 여부도 확인해 주세요.' : '등록하지 못했어요. 잠시 뒤 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  const goTo = (slot: Slot) => { Keyboard.dismiss(); setActive(slot); setError(null); };
  const removeSecond = () => {
    setSecondParent(false);
    setPicks(p => ({ ...p, parent2: undefined }));
    setSources(p => ({ ...p, parent2: undefined }));
    setSaveProfiles(p => ({ ...p, parent2: false }));
    goTo('parent1');
  };
  const slots: Slot[] = ['child', 'parent1', ...(secondParent ? ['parent2' as const] : [])];
  const label = active === 'child' ? '다음' : saving ? '준비하는 중…' : '우리 아이 사주 보기';
  const next = () => active === 'child' ? goTo('parent1') : save();

  return (
    <Screen title="우리 아이 사주" back={!onCancel} onBack={active === 'child' ? onCancel : () => goTo(active === 'parent2' ? 'parent1' : 'child')}
      footer={<PrimaryButton label={label} onPress={next} disabled={saving || (active === 'child' ? !picks.child : !ready)} />}>
      <View style={s.formIntro}>
        <Image source={INTRO_ART} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} />
        <Text accessibilityRole="header" style={s.introTitle}>{active === 'child' ? '우리 아이는\n어떤 빛을 품었을까?' : '우리 아이와 나는\n어떤 사이일까?'}</Text>
        <Text style={s.introBody}>{active === 'child' ? '타고난 기질과 재능,\n아이만의 빛을 발견해 보세요.' : '서로를 더 잘 이해하는 힌트,\n아이와 나의 사주에서 찾아볼까요?'}</Text>
      </View>
      {active !== 'child' || picks.parent1 ? <View style={s.memberTabs}>
        {slots.filter(slot => slot === 'child' || active !== 'child' || picks[slot]).map(slot => {
          const p = picks[slot];
          const name = p?.kind === 'profile' ? p.profile.nickname : p?.input.nickname;
          return (
            <View key={slot} style={[s.memberTab, active === slot && s.memberTabActive]}>
              <PressableScale onPress={() => goTo(slot)} disabled={saving || (slot !== 'child' && !picks.child)} style={[s.memberTabSelect, slot === 'parent2' && s.memberTabWithRemove]} accessibilityRole="button" accessibilityState={{ selected: active === slot }}>
                {p ? <Icon name="check" size={12} color={colors.inkSub} /> : null}
                <Text style={active === slot ? txt.bodyStrong : txt.small} numberOfLines={1}>{slot === 'child' ? name || '아이' : name || (slot === 'parent1' ? '보호자' : '보호자 2')}</Text>
              </PressableScale>
              {slot === 'parent2' ? (
                <PressableScale onPress={removeSecond} disabled={saving} style={s.removeParent} hitSlop={{ top: 2, bottom: 2, right: 20 }} scaleTo={0.9} accessibilityRole="button" accessibilityLabel="두 번째 보호자 제외" accessibilityHint="추가한 두 번째 보호자 입력란을 없애요">
                  <Icon name="close" size={13} color={colors.inkMute} strokeWidth={1.8} />
                </PressableScale>
              ) : null}
            </View>
          );
        })}
      </View> : null}
      <View pointerEvents={saving ? 'none' : 'auto'}>
        {slots.map(slot => {
          return (
            <View key={slot} style={active !== slot ? s.hiddenMember : undefined}>
              <View style={s.slotHead}>
                <Text style={s.formStep}>{slot === 'child' ? '01' : '02'}</Text>
                <Text accessibilityRole="header" style={s.formSectionLabel}>{slot === 'child' ? '우리 아이 알아보기' : slot === 'parent1' ? '아이와 함께 볼 분' : '한 분 더 함께 볼게요'}</Text>
                <PressableScale onPress={() => { Keyboard.dismiss(); setChoosing(slot); }} style={s.importAction} hitSlop={4} accessibilityRole="button" accessibilityLabel={`${SLOT_LABEL[slot]} 프로필에서 불러오기`}>
                  <Text style={s.importLabel}>프로필에서 불러오기</Text>
                  <Icon name="chevronRight" size={20} color={colors.inkMute} strokeWidth={2} />
                </PressableScale>
              </View>
              <View style={s.memberForm}>
                <ChildMemberFields key={sources[slot]?.revision ?? 0} slot={slot} initial={sources[slot]?.profile} onChange={change} />
                {picks[slot]?.kind !== 'profile' ? <PressableScale onPress={() => setSaveProfiles(p => ({ ...p, [slot]: !p[slot] }))} style={s.check} scaleTo={0.98} hitSlop={12} accessibilityRole="checkbox" accessibilityLabel="프로필에도 등록" accessibilityState={{ checked: saveProfiles[slot] }}>
                  <View style={[s.box, saveProfiles[slot] && s.boxOn]}>{saveProfiles[slot] ? <Icon name="check" size={13} color={colors.white} strokeWidth={2.6} /> : null}</View>
                  <Text style={s.checkLabel}>프로필에도 등록</Text>
                </PressableScale> : null}
              </View>
            </View>
          );
        })}
        {active === 'parent1' && !secondParent && picks.parent1 ? (
          <PressableScale onPress={() => { setSecondParent(true); goTo('parent2'); }} style={s.addParent} scaleTo={0.98} accessibilityRole="button" accessibilityLabel="보호자 한 명 더 추가, 선택 사항">
            <View style={s.addParentIcon}><Icon name="plus" size={16} color={colors.purpleSoft} strokeWidth={1.8} /></View>
            <Text style={s.addParentLabel}>보호자 한 명 더 추가</Text>
            <Text style={s.addParentOptional}>선택</Text>
          </PressableScale>
        ) : null}
      </View>
      {active !== 'child' ? <Text style={[txt.caption, { marginTop: 14 }]}>풀이를 시작하면 입력 정보를 바꿀 수 없어요.</Text> : null}
      {error ? <Text accessibilityRole="alert" style={[txt.small, { color: colors.danger, marginTop: 8 }]}>{error}</Text> : null}

      <BottomSheet visible={!!choosing} onClose={() => setChoosing(null)}>
        <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={txt.h2}>내 프로필에서 불러오기</Text>
          {!available.length ? <Text style={[txt.caption, { marginTop: 16 }]}>불러올 프로필이 없어요. 입력란에서 바로 등록해 주세요.</Text> : null}
          <View style={{ gap: 8, marginTop: 14 }}>
            {available.map(p => (
              <PressableScale key={p.profileId} onPress={() => {
                if (choosing) {
                  setSources(current => ({ ...current, [choosing]: { profile: p, revision: (current[choosing]?.revision ?? 0) + 1 } }));
                  setPicks(current => ({ ...current, [choosing]: { kind: 'profile', profile: p } }));
                  setSaveProfiles(current => ({ ...current, [choosing]: false }));
                  setError(null);
                }
                setChoosing(null);
              }} style={s.parentRow} scaleTo={0.98} accessibilityRole="button">
                <View style={{ flex: 1 }}>
                  <Text style={txt.bodyStrong}>{p.nickname}{p.isPrimary ? '  · 대표' : ''}</Text>
                  <Text style={txt.caption}>{RELATIONSHIP_LABEL[p.relationship ?? 'other']} · {birthLine(p.calendarType ?? 'solar', p.birthDateInput ?? p.birthDate, p.birthTime)}</Text>
                </View>
                <Icon name="chevronRight" size={14} color={colors.inkMute} />
              </PressableScale>
            ))}
          </View>
        </ScrollView>
      </BottomSheet>
    </Screen>
  );
}

/* ---------- 결과 ---------- */

function ChildResult({ id, set, sets, onPick, onAdd, onRemoved }: {
  id: number; set?: ChildSet; sets: ChildSet[]; onPick?(id: number): void; onAdd?(): void; onRemoved?(): void;
}) {
  const shared = !!useSharedView();
  const { toast } = usePremium();
  const [confirm, setConfirm] = useState(false);
  const content = usePremiumContent<ChildReport | LegacyChildReport>({ kind: 'child', id });
  const { reading, retry } = useReading<ChildReading>(content);
  const gate = useReadingGate(content.open ? reading : null, content);
  // 미리보기는 가족 목록에 이미 들어 있다 — 처음 볼 때만 만드는 단계를 짧게 보여 준다
  const making = usePreviewMaking(`child:${id}`, !!set, !content.open && !!set, PREVIEW_STEPS.child.length);
  const R = content.data?.data;
  // 구조를 바꾸기 전에 열어 고정된 결과는 다시 만들지 않는다 — 예전 화면 그대로
  const legacy = R && isLegacyChild(R) ? legacyPreviewOf(R) : null;
  const sum: ChildPreview | undefined = legacy ?? (R && !isLegacyChild(R) ? previewOf(R) : set?.result);
  const name = sum?.child.nickname ?? set?.child.nickname ?? '';
  const item = ITEMS.child(id, name);
  if (content.open && gate.show) return <ReadingStepsScreen title="우리 아이 사주" kind="child" reading={reading} />;

  const setRow = shared ? null : (
    <View style={s.kidRow}>
      {sets.map(k => {
        const on = k.id === id;
        return (
          <PressableScale key={k.id} onPress={() => onPick?.(k.id)} style={[s.kid, on && s.kidOn]} scaleTo={0.95} accessibilityRole="tab" accessibilityState={{ selected: on }}>
            <Text style={[s.kidText, on && { color: colors.white }]} numberOfLines={1}>{k.child.nickname}</Text>
          </PressableScale>
        );
      })}
      <PressableScale onPress={onAdd} style={[s.kid, s.kidAdd]} scaleTo={0.95} accessibilityLabel="아이 추가">
        <Text style={s.kidAddText}>+추가</Text>
      </PressableScale>
    </View>
  );

  if (making.making && !content.open) {
    return (
      <Screen title="우리 아이 사주" back>
        {setRow}
        <PreviewMakingCard gate={making} steps={PREVIEW_STEPS.child} title={`${eunNeun(callOf(name))} 어떤 아이일까요?`} />
      </Screen>
    );
  }
  if (!sum) return content.isError ? <Screen title="우리 아이 사주" back><BodyState error onRetry={() => content.refetch()} /></Screen> : <LoadingScreen title="우리 아이 사주" />;
  const spec = childSpec(sum);
  const el = ELEMENT_INFO[sum.child.element];
  // 호칭이 이름이면(두 보호자의 성별이 같을 때) 이름만

  const remove = async () => {
    setConfirm(false);
    await childApi.remove(id);
    await refreshChildSets();
    toast(`${name} 가족을 지웠어요`);
    onRemoved?.();
  };

  return (
    <Screen talk={content.open ? contentChatSource(content.key, item.title, content.data?.entitlementId) : undefined} title="우리 아이 사주" back right={<ShareIconButton item={content.open ? item : undefined} spec={spec} />}>
      {shared ? null : <FriendCompare route="Child" spec={spec} />}
      {setRow}
      <PreviewReveal gate={making}>
        <View style={s.hero}>
          <Image source={HERO_ART} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="right bottom" accessible={false} />
          <Text style={s.heroEyebrow}>{sum.child.age ? `${sum.child.age}살 ` : ''}{eunNeun(callOf(name))}</Text>
          <Text accessibilityRole="header" style={s.heroHeadline}>{sum.child.headline}</Text>
          <Text style={s.heroTitle}>{sum.child.title}</Text>
          <View style={s.chips}>
            {sum.child.temperament.name ? (
              <>
                <View style={[s.chip, s.chipDark]}><Text style={s.chipDarkText}>{sum.child.temperament.name}</Text></View>
                <View style={[s.chip, s.chipLight]}><Text style={s.chipLightText}>{el.ko}({el.hanja}) · {sum.child.animal}띠</Text></View>
              </>
            ) : (
              <>
                <View style={[s.chip, s.chipDark]}><Text style={s.chipDarkText}>{el.ko}({el.hanja})의 기운</Text></View>
                <View style={[s.chip, s.chipLight]}><Text style={s.chipLightText}>{sum.child.animal}띠</Text></View>
              </>
            )}
          </View>
          <View style={s.tags}>{sum.child.keywords.map(k => <View key={k} style={s.tag}><Text style={s.tagText}>#{k}</Text></View>)}</View>
        </View>

        <SubHead title={`${callOf(name)}의 타고난 재능 TOP 3`} caption="사주 속 가장 강한 힘" />
        <Card style={{ gap: 12 }}>
          {sum.talents.map((t, i) => (
            <View key={t.group} style={s.talentRow}>
              <Rank n={i + 1} first={i === 0} />
              <Text style={[txt.h3, { flex: 1 }]}>{t.name}</Text>
            </View>
          ))}
        </Card>

        <SubHead title={bondTitle(sum.parents.map(p => p.title))} />
        <View style={{ gap: 10 }}>
          {sum.parents.map((p, i) => (
            <View key={i} style={s.bondCard}>
              <Text style={[s.bondSub, legacy && s.bondSubScored]}>{p.title === p.nickname ? p.nickname : `${p.title} · ${p.nickname}`} × {name}</Text>
              {legacy ? <Text style={[s.score, s.bondScore]} accessibilityLabel={`궁합 ${legacy.scores[i]}점`}>{legacy.scores[i]}<Text style={s.bondScoreUnit}>점</Text></Text> : null}
              <View style={s.bondName}>
                <SolidIcon name="favorite" size={20} color={colors.accent} />
                <Text style={s.bondNameText}>{p.type.name}</Text>
              </View>
              <Text style={s.bondLine}>{p.type.line}</Text>
              {p.seat.name ? <View style={s.bondSeat}>
                <Text style={s.bondSeatLabel}>{callOf(name)} 사주 속 {p.title}의 자리</Text>
                <Text style={s.bondSeatName}>{p.seat.name}</Text>
              </View> : null}
            </View>
          ))}
        </View>
      </PreviewReveal>

      {!content.open ? <View style={{ marginTop: 16 }}><LockGate item={item} /></View>
        : R ? <ReadingReveal on={gate.appeared}>{isLegacyChild(R)
          ? <LegacyChildBody R={R} reading={reading as unknown as ReadingView<LegacyChildReading> | null} onRetry={retry} />
          : <ChildBody R={R} reading={reading} onRetry={retry} />}</ReadingReveal>
        : <BodyState error={content.isError} onRetry={() => content.refetch()} />}

      {/* 운알이 알림은 풀이를 다 읽은 여기서 (아래 공유·배너까지 내려가지 않아도) */}
      <TalkEnd />
      <Card style={{ marginTop: 32 }}>
        <Text style={txt.h3}>이 결과는 어떻게 만들었나요?</Text>
        <Para>{legacy ? LEGACY_METHOD : METHOD}</Para>
      </Card>
      <ShareCta item={item} spec={spec} />
      {shared ? null : (
        <View style={s.manage}>
          <PressableScale onPress={() => setConfirm(true)} hitSlop={8}><Text style={s.link}>{name} 가족 지우기</Text></PressableScale>
        </View>
      )}
      <Disclaimer compact />
      <BottomSheet visible={confirm} onClose={() => setConfirm(false)}>
        <Text style={[txt.h2, { textAlign: 'center' }]}>{name} 가족을 지울까요?</Text>
        <Text style={[txt.small, { textAlign: 'center', marginTop: 8 }]}>등록한 가족과 결과가 바로 지워져요. 불러온 프로필은 그대로예요.{content.open ? '\n열어 둔 전체 결과도 다시 볼 수 없어요.' : ''}</Text>
        <PrimaryButton label="지우기" onPress={remove} style={{ marginTop: 20 }} />
        <PrimaryButton label="취소" variant="soft" onPress={() => setConfirm(false)} style={{ marginTop: 8 }} />
      </BottomSheet>
    </Screen>
  );
}

/** 계산 결과는 서버, 글은 AI 풀이. 쓰지 못한 파트는 계산 결과의 문장으로 채운다 */
function ChildBody({ R, reading, onRetry }: { R: ChildReport; reading: ReadingView<ChildReading> | null; onRetry(): void }) {
  const writing = reading?.status === 'writing';
  const { portrait, talent, parenting, family, growth } = reading?.parts ?? {};
  const pending = (lines = 3) => <PartPending writing={writing} lines={lines} />;
  const name = R.child.nickname;
  const call = callOf(name);
  const T = R.child.temperament;
  const P = R.parenting;
  const needColor = R.needs.color;
  // 돌 무렵 아기는 혼내기보다 알려 주는 때, 성인 자녀는 부딪힐 때
  const disciplineLabel = R.child.age <= 2 ? '안 되는 걸 알려 줄 때' : R.child.age >= 20 ? '부딪힐 때' : '혼낼 때';
  return (
    <>
      <View style={{ marginTop: 16 }}><ReadingBanner reading={reading} onRetry={onRetry} /></View>

      <SubHead title={`01 · ${call}의 타고난 기질`} caption={R.child.title} />
      <View style={s.typeCard}>
        <Text style={s.typeEyebrow}>사주에서 가장 강한 힘이 그리는 아이</Text>
        <Text style={s.typeName}>{T.name}</Text>
        <Text style={s.typeLine}>{T.line}</Text>
      </View>
      <Card style={{ marginTop: 10 }}>
        {portrait ? (
          <>
            <Text style={txt.h3}>{portrait.headline}</Text>
            <Para>{portrait.story}</Para>
          </>
        ) : writing ? pending(5) : <Para mt={0}>{R.child.persona}</Para>}
        <View style={s.memo}>
          <Text style={s.memoLabel}>{call}에게 필요한 어른</Text>
          <Para mt={4}>{portrait ? portrait.need : `${T.need}이에요.`}</Para>
        </View>
        <View style={s.memo}>
          <Text style={s.memoLabel}>기운의 크기 · {R.child.energy.name}</Text>
          <Para mt={4}>{R.child.energy.line}</Para>
        </View>
        {R.child.light ? (
          <View style={s.memo}>
            <Text style={s.memoLabel}>천천히 자라는 부분 · {R.child.light.name}</Text>
            <Para mt={4}>{portrait?.lightSide ?? R.child.light.line}</Para>
          </View>
        ) : null}
      </Card>
      {portrait ? (
        <View style={{ gap: 10, marginTop: 10 }}>
          {portrait.charms.map(c => <Card key={c.title}><Text style={txt.h3}>{c.title}</Text><Para>{c.text}</Para></Card>)}
          <Card>
            <Text style={txt.h3}>이럴 때 {call}의 마음</Text>
            {portrait.feelings.map(f => (
              <View key={f.scene} style={{ marginTop: 12 }}>
                <Text style={s.label}>{f.scene}</Text>
                <Para mt={4}>{f.text}</Para>
              </View>
            ))}
          </Card>
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
        </View>
      ) : null}

      <SubHead title="02 · 타고난 재능" caption="사주 속 다섯 가지 힘" />
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
      {talent ? (
        <Card style={{ marginTop: 10 }}>
          <Text style={txt.h3}>재능이 이어지기 쉬운 분야</Text>
          <View style={s.wrap}>{talent.fields.map(f => <Text key={f} style={s.pill}>{f}</Text>)}</View>
          <Para mt={12}>{talent.fieldsNote}</Para>
        </Card>
      ) : null}

      <SubHead title="03 · 맞는 공부 방식" caption={R.learning.name} />
      <Card>
        <Text style={txt.h3}>{R.learning.name}</Text>
        {talent ? (
          <>
            <Para>{talent.learning.summary}</Para>
            <NumberedTips tips={talent.learning.tips} />
            <Text style={[s.label, { marginTop: 14 }]}>집중이 잘 되는 환경</Text>
            <Para mt={4}>{talent.learning.environment}</Para>
            <Text style={[s.label, { marginTop: 14 }]}>잘 통하는 칭찬</Text>
            <Para mt={4}>{talent.learning.praise}</Para>
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

      <SubHead title={`04 · ${waGwa(call)} 지내는 법`} caption="훈육 · 친구 · 마음" />
      <Card>
        <Text style={s.label}>{disciplineLabel}</Text>
        <Text style={[txt.h3, { marginTop: 2 }]}>{P.discipline.name}</Text>
        {parenting ? (
          <>
            <Para>{parenting.discipline.summary}</Para>
            <NumberedTips tips={parenting.discipline.steps} />
            <View style={s.avoid}>
              <Text style={s.label}>이런 말은 아껴 주세요</Text>
              <Para mt={4}>{parenting.discipline.avoid}</Para>
            </View>
          </>
        ) : writing ? <View style={{ marginTop: 8 }}>{pending(5)}</View> : (
          <>
            <Para>{P.discipline.line}</Para>
            <NumberedTips tips={P.discipline.works} />
            <View style={s.avoid}>
              <Text style={s.label}>이런 말은 아껴 주세요</Text>
              <Para mt={4}>{P.discipline.avoid}</Para>
            </View>
          </>
        )}
      </Card>
      <Card style={{ marginTop: 10 }}>
        <Text style={s.label}>친구와 어울릴 때</Text>
        <Text style={[txt.h3, { marginTop: 2 }]}>{P.friends.name}</Text>
        {parenting ? (
          <>
            <Para>{parenting.friends.summary}</Para>
            <View style={s.memo}><Text style={s.memoLabel}>이렇게 도와주세요</Text><Para mt={4}>{parenting.friends.tip}</Para></View>
          </>
        ) : writing ? <View style={{ marginTop: 8 }}>{pending(3)}</View> : <Para>{P.friends.line}</Para>}
      </Card>
      <View style={s.comfort}>
        <Text style={s.label}>속상할 때</Text>
        <Text style={[txt.h3, { marginTop: 2 }]}>{P.emotion.name}</Text>
        {parenting ? (
          <>
            <Text style={s.comfortText}>{parenting.emotion.summary}</Text>
            <View style={[s.manualHead, { marginTop: 14 }]}>
              <SolidIcon name="book" size={20} color={colors.accent} />
              <Text style={s.manualTitle}>다독이는 법</Text>
            </View>
            <Text style={s.comfortText}>{parenting.emotion.comfort}</Text>
            <Text style={[s.label, { marginTop: 14 }]}>마음이 무겁다는 신호</Text>
            <Text style={s.comfortText}>{parenting.emotion.signal}</Text>
          </>
        ) : writing ? <View style={{ marginTop: 8 }}>{pending(4)}</View> : (
          <>
            <Text style={s.comfortText}>{P.emotion.line}</Text>
            <Text style={s.comfortText}>{P.emotion.lean}</Text>
          </>
        )}
      </View>

      {R.parents.length ? (
        <>
          <SubHead title={`05 · ${bondTitle(R.parents.map(p => p.title))}`} caption="서로의 사주 속 자리로" />
          <View style={{ gap: 10 }}>
            {R.parents.map((p, i) => {
              const w = family?.bonds[i];
              return (
                <Card key={i}>
                  <Text style={txt.caption}>{p.title} · {p.stem.ko}{p.elementKo}({ELEMENT_INFO[p.element].hanja}) × {call} · {R.child.stem.ko}{R.child.elementKo}</Text>
                  <Text style={[txt.h3, { marginTop: 2 }]}>{p.type.name}</Text>
                  <Text style={[txt.small, { marginTop: 2 }]}>{p.type.line}</Text>
                  <View style={s.grid}>
                    <View style={s.cell}>
                      <Text style={txt.caption}>{call} 사주 속 {p.title}의 자리</Text>
                      <Text style={s.cellText}>{p.seat.name}</Text>
                      <LevelDots level={p.seat.level} />
                    </View>
                    <View style={s.cell}>
                      <Text style={txt.caption}>{p.title} 사주 속 {call}의 자리</Text>
                      <Text style={s.cellText}>{p.heart.name}</Text>
                      <LevelDots level={p.heart.level} />
                    </View>
                  </View>
                  {w ? (
                    <>
                      <Para mt={12}>{w.summary}</Para>
                      <Text style={[s.label, { marginTop: 14 }]}>{call}에게 {eunNeun(p.title)}</Text>
                      <Para mt={4}>{w.seat}</Para>
                      <Text style={[s.label, { marginTop: 14 }]}>{p.title}의 키우는 모습</Text>
                      <Para mt={4}>{w.parenting}</Para>
                      <Text style={[s.label, { marginTop: 14 }]}>호흡이 척척 맞는 순간</Text>
                      <Para mt={4}>{w.fit}</Para>
                      <View style={s.avoid}>
                        <Text style={s.label}>{w.friction.title}</Text>
                        <Para mt={4}>{w.friction.text}</Para>
                        <Para mt={6} style={{ color: colors.ink }}>{w.friction.tip}</Para>
                      </View>
                      <View style={s.memo}>
                        <Text style={s.memoLabel}>둘만의 작은 습관</Text>
                        <Para mt={4}>{w.ritual}</Para>
                      </View>
                    </>
                  ) : writing ? <View style={{ marginTop: 12 }}>{pending(4)}</View> : (
                    <View style={{ marginTop: 12, gap: 10 }}>
                      <Para mt={0}>{p.seat.line}</Para>
                      <Para mt={0}>{p.heart.line}</Para>
                      <View><Text style={s.label}>{p.rhythm.name}</Text><Para mt={2}>{p.rhythm.line}</Para></View>
                    </View>
                  )}
                  <View style={[s.grid, { marginTop: 14 }]}>
                    <View style={s.cell}><Text style={txt.caption}>{call}에게 {eunNeun(p.title)}</Text><Text style={s.cellText}>{p.parentToChild}</Text></View>
                    <View style={s.cell}><Text style={txt.caption}>{p.title}에게 {eunNeun(call)}</Text><Text style={s.cellText}>{p.childToParent}</Text></View>
                  </View>
                </Card>
              );
            })}
          </View>
          {family ? <Tip title={R.parents.length === 2 ? '둘이 함께 키울 때' : '함께 자라는 법'} style={{ marginTop: 10 }}>{family.together}</Tip> : null}
        </>
      ) : null}

      <SubHead title={`06 · ${call}의 자라는 흐름`} caption="10년마다 바뀌는 대운으로" />
      <Card style={{ paddingVertical: 4 }}>
        {R.growth.map((g, i) => {
          const w = growth?.stages[i];
          return (
            <View key={g.label} style={[s.stage, i ? s.line : null]}>
              <View style={s.stageHead}>
                <Text style={txt.h3}>{g.years.replace('년', '')}</Text>
                {g.now ? <Text style={s.now}>지금</Text> : null}
                {g.shake ? <Text style={s.shake}>변화가 큰 때</Text> : null}
              </View>
              <Text style={[txt.caption, { marginTop: 2 }]}>{[g.ages, g.school, g.label].filter(Boolean).join(' · ')}</Text>
              <Text style={[txt.bodyStrong, { marginTop: 6, color: colors.accent }]}>{g.keyword}</Text>
              <Para mt={4}>{w ? w.text : g.line}</Para>
              {w ? <Text style={[txt.small, { marginTop: 6 }]}>{w.parent}</Text> : null}
            </View>
          );
        })}
      </Card>
      {R.puberty ? (
        <Card style={{ marginTop: 10 }}>
          <Text style={s.label}>사춘기 · {R.puberty.years}</Text>
          <Text style={[txt.h3, { marginTop: 2 }]}>{R.puberty.name}</Text>
          {growth?.puberty ? <Para>{growth.puberty}</Para> : writing ? <View style={{ marginTop: 8 }}>{pending(3)}</View> : <Para>{R.puberty.line}</Para>}
        </Card>
      ) : null}
      {R.milestones.length ? (
        <Card style={{ marginTop: 10, paddingVertical: 4 }}>
          {R.milestones.map((m, i) => (
            <View key={m.label} style={[s.stage, i ? s.line : null]}>
              <View style={s.stageHead}>
                <Text style={txt.h3}>{m.year}년</Text>
                <Text style={txt.caption}>{m.label}</Text>
              </View>
              <Para mt={4}>{growth?.milestones[i]?.text ?? m.line}</Para>
            </View>
          ))}
        </Card>
      ) : null}

      <SubHead title={`07 · ${R.thisYear.year}년의 ${call}`} caption={R.thisYear.keyword} />
      <Card>
        {growth ? <Para mt={0}>{growth.thisYear}</Para> : writing ? pending(3) : (
          <>
            <Para mt={0}>{R.thisYear.line}</Para>
            {R.thisYear.branchLine ? <Para>{R.thisYear.branchLine}</Para> : null}
          </>
        )}
      </Card>

      <SubHead title={`08 · ${call}에게 필요한 기운`} caption={`${R.needs.elementKo}의 기운`} />
      <Card>
        {growth ? <Para mt={0}>{growth.needs}</Para> : writing ? pending(2) : (
          <>
            <Text style={s.label}>함께하면 좋은 놀이</Text><Para mt={4}>{R.needs.activity}</Para>
            <Text style={[s.label, { marginTop: 12 }]}>어울리는 곳</Text><Para mt={4}>{R.needs.place}</Para>
          </>
        )}
        <View style={s.colorRow}>
          <View style={[s.swatch, { backgroundColor: needColor.hex }]} />
          <View style={{ flex: 1 }}>
            <Text style={txt.bodyStrong}>{needColor.name}</Text>
            <Text style={txt.small}>방 소품이나 옷, 학용품에 이 색을 더해 주세요.</Text>
          </View>
        </View>
      </Card>
      <Tip title="기억해 두세요" style={{ marginTop: 16 }}>{growth?.closing ?? '사주는 타고난 경향일 뿐이에요. 아이는 믿어 주는 어른 곁에서 가장 잘 자라요.'}</Tip>
    </>
  );
}

/** 흰 칸 안 번호 목록 (공부 방법 · 혼낼 때 순서) */
function NumberedTips({ tips }: { tips: readonly string[] }) {
  return (
    <View style={s.tips}>
      {tips.map((t, i) => (
        <View key={t} style={[s.tipRow, i ? s.tipLine : null]}>
          <View style={s.tipNum}><Text style={s.tipNumText}>{i + 1}</Text></View>
          <Text style={s.tipText}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

const LEVEL_WORD: Record<ChildLevel, string> = { strong: '넉넉해요', normal: '알맞아요', light: '가벼워요' };
const LEVEL_DOTS: Record<ChildLevel, number> = { strong: 3, normal: 2, light: 1 };
/** 사주 속 자리의 크기 — 점 세 칸 */
function LevelDots({ level }: { level: ChildLevel }) {
  return (
    <View style={s.dots} accessible accessibilityLabel={`자리가 ${LEVEL_WORD[level]}`}>
      {[0, 1, 2].map(i => <View key={i} style={[s.dot, i < LEVEL_DOTS[level] && s.dotOn]} />)}
      <Text style={s.dotText}>{LEVEL_WORD[level]}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  // 결과 첫 카드 (Figma 327×282, 안쪽 28/24, 줄 사이 10)
  hero: { minHeight: 282, marginTop: 12, paddingTop: 28, paddingBottom: 24, paddingHorizontal: 24, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.accentSoft, gap: 10 },
  heroEyebrow: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: HERO_SUB },
  heroHeadline: { ...sansW('700'), fontSize: 22, lineHeight: 29, letterSpacing: -1.1, color: HERO_INK, maxWidth: 220 },
  heroTitle: { ...sansW('700'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: HERO_TITLE, maxWidth: 200 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, maxWidth: 220 },
  chip: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: 30 },
  chipDark: { backgroundColor: HERO_INK },
  chipDarkText: { ...sansW('700'), fontSize: 14, lineHeight: 17, color: '#FFFFFF' },
  chipLight: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E2E2', paddingVertical: 6 },
  chipLightText: { ...sansW('500'), fontSize: 14, lineHeight: 17, color: HERO_INK, opacity: 0.8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, maxWidth: 220 },
  tag: { paddingVertical: 2, paddingHorizontal: 4, borderRadius: 5, borderWidth: 0.5, borderColor: TAG_INK },
  tagText: { ...sansW('600'), fontSize: 12, lineHeight: 15, color: TAG_INK, opacity: 0.8 },
  // 미리보기 궁합 카드 (Figma 먹남색 카드)
  bondCard: { paddingTop: 12, paddingBottom: 16, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#1D212D' },
  bondSub: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: BOND_SUB, paddingRight: 56 },
  bondSubScored: { paddingRight: 56 },
  bondScore: { position: 'absolute', top: 12, right: 16 },
  bondScoreUnit: { ...sansW('700'), fontSize: 14, color: colors.accent },
  score: { ...sansW('700'), fontSize: 24, lineHeight: 29, letterSpacing: -1.2, color: colors.accent },
  bondName: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  bondNameText: { ...sansW('700'), fontSize: 14, lineHeight: 17, letterSpacing: -0.56, color: '#FFFFFF', flexShrink: 1 },
  bondLine: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: '#FFFFFF', marginTop: 2 },
  bondSeat: { marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#3A3F4D' },
  bondSeatLabel: { ...sansW('400'), fontSize: 12, lineHeight: 16, letterSpacing: -0.6, color: BOND_SUB },
  bondSeatName: { ...sansW('700'), fontSize: 14, lineHeight: 18, letterSpacing: -0.56, color: colors.accent, marginTop: 2 },
  // 01 기질 유형 카드
  typeCard: { padding: 16, borderRadius: 12, backgroundColor: colors.accentSoft },
  typeEyebrow: { ...sansW('500'), fontSize: 12, lineHeight: 16, letterSpacing: -0.6, color: HERO_SUB },
  typeName: { ...sansW('700'), fontSize: 20, lineHeight: 26, letterSpacing: -1, color: HERO_INK, marginTop: 4 },
  typeLine: { ...sansW('400'), fontSize: 13, lineHeight: 19, letterSpacing: -0.65, color: HERO_INK, marginTop: 6 },
  // 05 사주 속 자리 크기
  dots: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.lineStrong },
  dotOn: { backgroundColor: colors.accent },
  dotText: { ...sansW('500'), fontSize: 11, lineHeight: 14, color: colors.inkSub, marginLeft: 4 },
  shake: { ...sansW('700'), fontSize: 11, color: colors.accent, borderWidth: 1, borderColor: colors.accent, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, overflow: 'hidden' },
  memoLabel: { ...sansW('700'), fontSize: 12, lineHeight: 18, letterSpacing: -0.6, color: colors.accent },
  // 01 좋아해요 · 힘들어해요
  manualRow: { flexDirection: 'row', gap: 12 },
  manualCard: { flex: 1, minHeight: 131, padding: 16, borderRadius: 12, borderWidth: 1, backgroundColor: colors.cream },
  manualHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  manualTitle: { ...sansW('700'), fontSize: 14, lineHeight: 17, letterSpacing: -0.56, color: colors.ink, flexShrink: 1 },
  manualItems: { marginTop: 9, gap: 6 },
  manualItem: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.ink },
  comfort: { marginTop: 16, padding: 16, borderRadius: 8, backgroundColor: colors.card },
  comfortText: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.ink, marginTop: 6 },
  // 04 공부 방식 팁 (흰 칸 안 번호 목록)
  tips: { marginTop: 12, borderRadius: 12, backgroundColor: colors.surface },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, minHeight: 56 },
  tipLine: { borderTopWidth: 1, borderTopColor: colors.line },
  tipNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  tipNumText: { ...sansW('700'), fontSize: 13, lineHeight: 16, letterSpacing: -0.52, color: '#FFFFFF' },
  tipText: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.ink, flex: 1 },
  kidRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  kid: { paddingHorizontal: 14, height: 32, borderRadius: radius.pill, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', maxWidth: 140 },
  kidOn: { backgroundColor: colors.navy },
  kidText: { ...sansW('600'), fontSize: 13, color: colors.ink },
  kidAdd: { backgroundColor: 'transparent', borderWidth: 1, borderStyle: 'dashed', borderColor: colors.lineStrong },
  kidAddText: { ...sansW('600'), fontSize: 13, color: colors.inkSub },
  talentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pickParents: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, marginTop: 10, paddingVertical: 8 },
  pickParentsText: { ...txt.small, color: colors.inkSub },
  parentRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1.5, borderColor: 'transparent' },
  parentRowOn: { borderColor: colors.ink },
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
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, padding: 12, borderRadius: radius.md, backgroundColor: colors.surface },
  swatch: { width: 32, height: 32, borderRadius: 16 },
  slotHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 31, marginBottom: 11, flexWrap: 'wrap' },
  formIntro: { minHeight: 142, padding: 20, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.accentSoft },
  introTitle: { ...sansW('800'), fontSize: 20, lineHeight: 24, letterSpacing: -0.8, color: HERO_INK, maxWidth: '66%' },
  introBody: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: INTRO_SUB, marginTop: 11, maxWidth: '62%' },
  formStep: { ...sansW('600'), fontSize: 18, lineHeight: 22, color: colors.accent },
  formSectionLabel: { ...sansW('600'), fontSize: 18, lineHeight: 22, color: colors.ink, flexGrow: 1 },
  memberForm: { padding: 16, borderRadius: 12, backgroundColor: colors.card },
  importAction: { minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: 4 },
  importLabel: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.inkMute },
  memberTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  memberTab: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.sm, flexShrink: 1, backgroundColor: colors.card },
  memberTabSelect: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 40, paddingHorizontal: 10, flexShrink: 1 },
  memberTabWithRemove: { paddingRight: 0 },
  memberTabActive: { backgroundColor: colors.accentSoft },
  hiddenMember: { display: 'none' },
  removeParent: { width: 24, height: 40, marginRight: 2, alignItems: 'center', justifyContent: 'center' },
  addParent: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, marginTop: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.lineStrong, borderRadius: 12 },
  addParentIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  addParentLabel: { ...sansW('500'), fontSize: 14, lineHeight: 20, letterSpacing: -0.4, color: colors.inkSub, flex: 1 },
  addParentOptional: { ...sansW('400'), fontSize: 12, lineHeight: 18, color: colors.inkMute },
  link: { ...txt.small, color: colors.inkSub },
  check: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, alignSelf: 'flex-start' },
  checkLabel: { ...sansW('500'), fontSize: 13, lineHeight: 16, color: colors.inkMute },
  box: { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, borderColor: colors.lineStrong, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  manage: { alignItems: 'center', marginTop: 20 },
});
