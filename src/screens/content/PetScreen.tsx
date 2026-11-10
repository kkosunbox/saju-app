import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import Screen from '../../components/Screen';
import TextField from '../../components/TextField';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import BottomSheet from '../../components/BottomSheet';
import Disclaimer from '../../components/Disclaimer';
import FriendCompare from '../../components/FriendCompare';
import LoadingScreen from '../../components/LoadingScreen';
import Reveal from '../../components/Reveal';
import ShareActions from '../../components/ShareActions';
import { ShareIconButton } from '../../components/ShareCta';
import Icon from '../../components/Icon';
import SolidIcon from '../../components/SolidIcon';
import { checkBirth, fmtDate } from '../../components/BirthFields';
import { useApp } from '../../context/AppContext';
import { useSharedView } from '../../context/SharedViewContext';
import { usePremium } from '../../context/PremiumContext';
import { ApiError } from '../../api/client';
import { BodyState, LockedCard } from '../../components/premium/Kit';
import { ITEMS } from '../../services/premium/catalog';
import { usePremiumContent, useReading } from '../../services/server/premiumApi';
import { PartPending, ReadingBanner } from '../../components/premium/Reading';
import { PREVIEW_STEP_MS, PreviewStepsScreen, ReadingOpeningCard, ReadingPart, useJustOpenedFetching, useReadingSections } from '../../components/premium/ReadingGate';
import PetLetter from '../../components/premium/PetLetter';
import PetSnackBanner from '../../components/premium/PetSnackBanner';
import { PetReading, ReadingView } from '../../types/reading';
import { petApi, refreshPets, usePets } from '../../services/server/petApi';
import { petSpec } from '../../services/share/shareSpecs';
import { WEEK } from '../../services/premium/helpers';
import { parseISO, weekdayOf } from '../../utils/date';
import { User } from '../../types';
import { OwnerTitle, Pet, PetCompatibility, PetInput, PetPreview, PetSpecies, PetTraitAxis, PetTraits } from '../../types/content';
import { colors, isDark } from '../../theme/colors';
import { radius, sansW, txt } from '../../theme/typography';

/** 새 아이를 등록한 뒤 미리보기 전에 보여 주는 단계 (한 단계 0.8초) */
/** 새로 등록한 아이의 결과 전 단계 (B방식 체크리스트 화면) */
const LOADING_STEPS = (name: string, basis: string, nickname: string) => [
  { key: 'pet', label: `${name}의 ${basis} 기운 읽기`, sub: '타고난 성향을 찾았어요' },
  { key: 'me', label: `${nickname}님의 사주와 겹쳐 보기`, sub: '둘의 기운을 맞춰 봤어요' },
  { key: 'type', label: '궁합 유형 고르기', sub: '둘에게 맞는 유형을 골랐어요' },
];

const SPECIES: [PetSpecies, string][] = [['dog', '강아지'], ['cat', '고양이'], ['other', '그 외']];
const SPECIES_LABEL = Object.fromEntries(SPECIES) as Record<PetSpecies, string>;
/** 종류마다 하트를 단 아이 그림 (입력 버튼 · 저장된 상대) — 그 외는 조금 좁다 */
const PET_IMG: Record<PetSpecies, { src: number; w: number }> = {
  dog: { src: require('../../../assets/images/pet-dog.webp'), w: 24 },
  cat: { src: require('../../../assets/images/pet-cat.webp'), w: 24 },
  other: { src: require('../../../assets/images/pet-other.webp'), w: 20 },
};
const INTRO_BG = require('../../../assets/images/pet-intro-bg.webp');
const HERO_BG = require('../../../assets/images/pet-hero-bg.webp');
const HERO_PETS = require('../../../assets/images/pet-hero-pets.webp');
/** 평소 모습 4가지 — [축, 질문, [값, 라벨] 두 개] */
const TRAITS: { [A in PetTraitAxis]: [string, [NonNullable<PetTraits[A]>, string][]] } = {
  energy: ['에너지', [['active', '에너지 넘침'], ['middle', '그날그날'], ['calm', '느긋함']]],
  affection: ['애정 표현', [['clingy', '애교쟁이'], ['middle', '적당히'], ['independent', '마이웨이']]],
  courage: ['낯선 것 앞에서', [['bold', '대담함'], ['middle', '상황 따라'], ['shy', '조심성 많음']]],
  appetite: ['식성', [['foodie', '먹보'], ['middle', '보통'], ['picky', '입 짧음']]],
};
const AXES = Object.keys(TRAITS) as PetTraitAxis[];
const OLDEST = '1990-01-01';

/** 저장된 상대에 적는 나이 — 생일을 알 때만 (1살 전이면 개월) */
function ageOf(pet: Pet, today: string): string | null {
  if (!pet.birthDate) return null;
  const b = parseISO(pet.birthDate), t = parseISO(today);
  const months = (t.y - b.y) * 12 + t.m - b.m - (t.d < b.d ? 1 : 0);
  if (months >= 12) return `${Math.floor(months / 12)}살`;
  return months > 0 ? `${months}개월` : null;
}
/** 받침이 있으면 a, 없으면 b (코코와 / 별이랑 → 별과) */
const josa = (w: string, a: string, b: string) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c <= 11171 && c % 28 ? a : b; };
/**
 * 고를 수 있는 호칭 — 내 성별(프로필)과 아이 성별로 정한다. 아이 성별을 모르면 형제 호칭을 둘 다 보여 준다.
 * (서버 OWNER_TITLES와 같은 말만 쓴다)
 */
function titlesFor(me: 'male' | 'female', pet: 'male' | 'female' | null): OwnerTitle[] {
  const sibling: Record<'male' | 'female', OwnerTitle[]> = me === 'female'
    ? { male: ['누나'], female: ['언니'] }
    : { male: ['형'], female: ['오빠'] };
  return [
    me === 'female' ? '엄마' : '아빠',
    ...(pet ? sibling[pet] : [...sibling.male, ...sibling.female]),
    '집사',
  ];
}

/** 결과가 무엇으로 봤는지 — 가족이 된 날은 두 번째 생일로 적고, 짐작한 생일은 적지 않는다 */
function basisNote(name: string, basis: PetPreview['basis']): string | null {
  const [y, m, d] = basis.date.split('-').map(Number);
  if (basis.kind === 'adopted') return `${name}${josa(name, '이', '')}가 가족이 된 날${basis.estimated ? '' : `(${y}.${m}.${d})`}, 두 번째 생일의 기운으로 봤어요`;
  if (basis.estimated) return null; // 짐작한 생일은 적지 않는다
  return `${name}의 생일(${y}.${m}.${d}) 기준으로 봤어요`;
}

/** 반려동물 궁합 — 아이를 등록하면 서버가 내 사주와 아이의 생일(모르면 가족이 된 날)로 본다. */
export default function PetScreen() {
  const { user: u } = useApp();
  const q = usePets();
  // 풀이 완성 알림을 눌러 오면 그 아이로 연다
  const { petId } = useLocalSearchParams<{ petId?: string }>();
  const [selected, setSelected] = useState<number | null>(petId ? Number(petId) || null : null);
  // 새 아이 등록 화면을 연 중인지
  const [adding, setAdding] = useState(false);
  const [fresh, setFresh] = useState<number | null>(null);
  // 공유 링크(/r/{token})로 열면 공유된 아이의 결과만 (목록 · 추가 · 지우기 없이)
  const sharedPet = useSharedView()?.pet;
  if (!u) return null;
  if (sharedPet) return <PetResult u={u} pet={sharedPet} pets={[sharedPet]} revealed={false} onPick={() => {}} onAdd={() => {}} onRemoved={() => {}} />;
  if (!q.data) return <LoadingScreen title="반려동물 궁합" error={q.error} onRetry={q.refetch} />;
  const pets = q.data;
  const pet = pets.find(p => p.id === selected) ?? pets[0];

  if (adding || !pet) {
    return (
      <PetForm
        u={u} pets={pets}
        onPick={id => { setSelected(id); setFresh(null); setAdding(false); }}
        onCancel={pets.length ? () => setAdding(false) : undefined}
        onSaved={saved => { setSelected(saved.id); setFresh(saved.id); setAdding(false); }}
      />
    );
  }
  return (
    <PetResult
      key={pet.id} u={u} pet={pet} pets={pets} revealed={fresh === pet.id}
      onPick={id => { setSelected(id); setFresh(null); }}
      onAdd={() => setAdding(true)}
      onRemoved={() => setSelected(null)}
    />
  );
}

/* ---------- 결과 ---------- */
function PetResult({ u, pet, pets, revealed, onPick, onAdd, onRemoved }: {
  u: User; pet: Pet; pets: Pet[]; revealed: boolean;
  onPick(id: number): void; onAdd(): void; onRemoved(): void;
}) {
  const { toast } = usePremium();
  const [confirm, setConfirm] = useState(false);
  const content = usePremiumContent<PetCompatibility>({ kind: 'pet', id: pet.id });
  // 열었으면 전체 결과, 아니면 목록의 미리보기 (윗부분은 같은 값)
  const F = content.open ? content.data?.data ?? null : null;
  const R = F ?? pet.result;
  const { reading, retry } = useReading<PetReading>(content);
  const fetching = useJustOpenedFetching(content);
  const spec = petSpec(u, pet);
  const name = pet.name;
  const shared = !!useSharedView();
  // 전체 결과를 열었으면 공유 버튼에서 전체 결과 링크도 고를 수 있다
  const petItem = ITEMS.pet(pet.id, pet.name);
  // 새로 등록한 아이는 미리보기 전에 궁합을 보는 단계를 잠깐 보여 준다 (다른 아이를 고르면 바로)
  const steps = LOADING_STEPS(name, R.basis.kind === 'adopted' ? '가족이 된 날' : '생일', u.nickname);
  // steps.length번째 한 박자는 "궁합을 다 봤어요"
  const [step, setStep] = useState(revealed ? 0 : steps.length + 1);
  const loading = step <= steps.length;
  // 단계를 다 본 뒤에만 부드럽게 나타난다 (아이를 바꿔 볼 때는 그대로)
  const Appear = revealed ? Reveal : View;
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setStep(n => n + 1), PREVIEW_STEP_MS);
    return () => clearTimeout(t);
  }, [loading, step]);
  if (loading) return <PreviewStepsScreen title="반려동물 궁합" heading={`${name}${josa(name, '과', '와')}의 궁합을 보고 있어요`} steps={steps} step={step} />;

  const remove = async () => {
    setConfirm(false);
    try {
      await petApi.remove(pet.id);
      await refreshPets();
      onRemoved();
      toast(`${name} 정보를 지웠어요`);
    } catch {
      toast('지우지 못했어요. 잠시 후 다시 시도해 주세요');
    }
  };

  const hero = (
    <View style={s.hero}>
      <Image source={HERO_BG} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} />
      <Image source={HERO_PETS} style={s.heroPets} contentFit="contain" accessible={false} />
      <Text style={s.eyebrow}>{u.nickname} x {name}</Text>
      <Text accessibilityRole="header" style={s.typeName}>{R.type.name}</Text>
      <Text style={s.typeLine}>{R.type.line}</Text>
      <Text style={s.score} accessibilityLabel={`궁합 ${R.score}점`}>{R.score}점</Text>
      <View style={s.tags}>{R.pet.keywords.map(k => <View key={k} style={s.tag}><Text style={s.tagText}>#{k}</Text></View>)}</View>
    </View>
  );

  return (
    <Screen key={`pet-${pet.id}`} title="반려동물 궁합" back contentStyle={s.content} right={<ShareIconButton item={content.open ? petItem : undefined} spec={spec} />}>
      {shared ? null : <PetSnackBanner style={s.snackTop} />}
      {shared ? null : <View style={s.petRow}>
        {pets.map(p => (
          <PressableScale key={p.id} onPress={() => onPick(p.id)} style={[s.petChip, p.id === pet.id && s.petChipOn]} scaleTo={0.95} accessibilityRole="tab" accessibilityState={{ selected: p.id === pet.id }}>
            <Text style={[s.petChipText, p.id === pet.id && { color: colors.white }]} numberOfLines={1}>{p.name}</Text>
          </PressableScale>
        ))}
        <PressableScale onPress={onAdd} style={[s.petChip, s.petAdd]} scaleTo={0.95} accessibilityLabel="반려동물 추가">
          <Text style={s.petAddText}>+추가</Text>
        </PressableScale>
      </View>}

      <Appear>
      {shared ? null : <FriendCompare route="Pet" spec={spec} />}
      {hero}
      {basisNote(name, R.basis) ? <Text style={s.basisNote}>{basisNote(name, R.basis)}</Text> : null}

      {!content.open ? (
        <>
          <LockedCard item={ITEMS.pet(pet.id, name)} />
        </>
      ) : F ? (
        <PetBody F={F} reading={reading} onRetry={retry} petId={pet.id} name={name} owner={pet.ownerTitle ?? `${u.nickname}님`} />
      ) : fetching ? (
        <ReadingOpeningCard kind="pet" />
      ) : (
        <BodyState error={content.isError} onRetry={() => content.refetch()} />
      )}

      {shared ? null : <ShareActions spec={spec} title={`${name}${josa(name, '과', '와')}의 궁합 자랑하기`} outlined marginTop={16} />}

      <View style={[s.card, { marginTop: 16 }]}>
        <Text accessibilityRole="header" style={s.cardTitle}>이 결과는 어떻게 만들었나요?</Text>
        <Text style={s.body}>아이의 생일로 년·월·일 세 기둥을 세워 타고난 기운을 보고, 내 사주의 일간·일지·띠와 겹쳐 궁합 유형을 정했어요. 생일을 모르면 가족이 된 날을 두 번째 생일로 삼아 그날의 기운으로 보고, 짐작한 생일은 날짜 대신 태어난 달의 기운으로 봐요. 태어난 시간은 쓰지 않아요. 재미로 보는 콘텐츠이고, 아이의 실제 성격은 함께 지내며 알아가는 게 가장 정확해요.</Text>
      </View>


      {shared ? null : <View style={s.manage}>
        <PressableScale onPress={() => setConfirm(true)} hitSlop={8}><Text style={s.manageLink}>{name} 지우기</Text></PressableScale>
      </View>}
      <Disclaimer compact />
      </Appear>
      <BottomSheet visible={confirm} onClose={() => setConfirm(false)}>
        <Text style={[txt.h2, { textAlign: 'center' }]}>{name} 정보를 지울까요?</Text>
        <Text style={[txt.small, { textAlign: 'center', marginTop: 8 }]}>등록한 정보와 궁합 결과가 바로 지워져요.{content.open ? '\n열어 둔 전체 결과도 다시 볼 수 없어요.' : ''}</Text>
        <PrimaryButton label="지우기" onPress={remove} style={{ marginTop: 20 }} />
        <PrimaryButton label="취소" variant="soft" onPress={() => setConfirm(false)} style={{ marginTop: 8 }} />
      </BottomSheet>
    </Screen>
  );
}

/**
 * 알로 연 뒤에 보이는 나머지 — 풀이(이 아이 이야기와 사용 설명서 · 우리 사이와 편지 · 함께하는 일상)와 계산 결과.
 * 풀이가 쓰이는 동안은 자리만 잡아 두고, 쓰지 못하면 계산 결과의 문장으로 채운다.
 */
function PetBody({ F, reading, onRetry, petId, name, owner }: {
  F: PetCompatibility; reading: ReadingView<PetReading> | null; onRetry(): void; petId: number; name: string; owner: string;
}) {
  const writing = reading?.status === 'writing';
  const { portrait, bond, days } = reading?.parts ?? {};
  const pending = (lines = 3) => <PartPending writing={writing} lines={lines} />;
  // C방식: 아직 안 쓴 파트의 섹션은 숨기고 그 자리에 로딩 카드 하나
  const S = useReadingSections(reading, 'pet');
  const ga = `${name}${josa(name, '이', '')}가`;
  return (
    <>
      <View style={{ marginTop: 16 }}><ReadingBanner reading={reading} onRetry={onRetry} /></View>

      <ReadingPart s={S} part="portrait" lead>
      {/* 타고난 성격은 무료 미리보기에서 빼고, 연 뒤에 이야기와 함께 보여 준다 */}
      <Section number="01" title={`${name}의 타고난 성격`} />
      <View style={s.card}>
        <Text accessibilityRole="header" style={s.cardTitle}>{F.pet.title}</Text>
        <Text style={s.body}>{F.pet.persona}</Text>
        <View style={s.memo}>
          <Text style={s.memoLabel}>이 아이의 강점</Text>
          <Text style={s.body}>{F.pet.strength}</Text>
        </View>
      </View>

      <Section number="02" title={`${name} 이야기`} />
      <View style={s.card}>
        {portrait ? (
          <>
            <Text style={s.cardTitle}>{portrait.headline}</Text>
            <Text style={s.body}>{portrait.story}</Text>
          </>
        ) : writing ? pending(5) : <Text style={s.body}>{F.pet.persona}</Text>}
      </View>
      {portrait ? (
        <View style={{ gap: 12, marginTop: 12 }}>
          {portrait.charms.map(c => (
            <View key={c.title} style={s.card}>
              <Text style={s.cardTitle}>{c.title}</Text>
              <Text style={s.body}>{c.text}</Text>
            </View>
          ))}
          <View style={s.card}>
            <Text style={s.cardTitle}>이럴 때 {name}의 마음</Text>
            <View style={{ gap: 12 }}>
              {portrait.feelings.map(f => (
                <View key={f.scene}>
                  <Text style={s.memoLabel}>{f.scene}</Text>
                  <Text style={s.body}>{f.text}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : null}

      {portrait?.manual ? (
        <>
          <Section number="03" title={`${name} 사용 설명서`} />
          <PetManual m={portrait.manual} name={name} />
        </>
      ) : null}
      </ReadingPart>

      <ReadingPart s={S} part="bond" lead>
      <Section number="04" title="우리 사이" />
      <View style={{ gap: 12 }}>
        <View style={s.card}>
          {bond ? (
            <>
              <Text style={s.body}>{bond.summary}</Text>
              <Text style={[s.memoLabel, { marginTop: 14 }]}>보호자로서의 나</Text>
              <Text style={s.body}>{bond.owner}</Text>
              <Text style={[s.memoLabel, { marginTop: 14 }]}>{name}에게 나는</Text>
              <Text style={s.body}>{bond.forPet}</Text>
              <Text style={[s.memoLabel, { marginTop: 14 }]}>호흡이 척척 맞는 순간</Text>
              <Text style={s.body}>{bond.fit}</Text>
            </>
          ) : writing ? pending(6) : (
            <>
              <Text style={s.memoLabel}>{name}에게 나는</Text>
              <Text style={s.body}>{F.meToPet}</Text>
              <Text style={[s.memoLabel, { marginTop: 12 }]}>나에게 {name}{josa(name, '은', '는')}</Text>
              <Text style={s.body}>{F.petToMe}</Text>
            </>
          )}
        </View>
        {bond ? (
          <View style={[s.card, s.fill]}>
            <Text style={s.cardTitle}>{bond.friction.title}</Text>
            <Text style={s.body}>{bond.friction.text}</Text>
            <Text style={[s.body, s.bold, { marginTop: 8 }]}>{bond.friction.tip}</Text>
          </View>
        ) : null}
        {F.points.map(p => (
          <View key={p.kind} style={[s.card, p.kind === 'fill' && s.fill]}>
            <Text style={s.cardTitle}>{p.title}</Text>
            <Text style={s.body}>{p.text}</Text>
          </View>
        ))}
      </View>

      </ReadingPart>

      <ReadingPart s={S} part="days" lead>
      <Section number="05" title="함께하는 하루" />
      <View style={{ gap: 12 }}>
        {days ? (
          <View style={s.routine}>
            {days.routine.map((r, i) => {
              const last = i === days.routine.length - 1;
              return (
                <View key={r.time} style={[s.routineRow, !last && { paddingBottom: 7 }]}>
                  {/* 왼쪽 레일 — 아이콘 칸을 흰 줄로 잇는다 */}
                  <View style={s.routineRail}>
                    <TimeIcon time={r.time} />
                    {!last ? <View style={s.railLine} /> : null}
                  </View>
                  <View style={s.routineCopy}>
                    <Text style={s.routineTime}>{r.time}</Text>
                    <Text style={s.routineText}>{r.text}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
        <View style={s.card}>
          <Text style={s.cardTitle}>{ga} 좋아할 놀이</Text>
          {days ? (
            <View style={{ gap: 10 }}>
              {days.play.map(p => (
                <View key={p.title}>
                  <Text style={[s.body, s.bold]}>{p.title}</Text>
                  <Text style={s.body}>{p.text}</Text>
                </View>
              ))}
            </View>
          ) : writing ? pending(4) : F.play.map((p, i) => <Text key={p} style={s.listItem}>{i + 1}. {p}</Text>)}
        </View>
        {F.goodDays.length ? (
          <View style={s.goodDays}>
            <Text accessibilityRole="header" style={s.goodTitle}>함께 놀기 좋은 날</Text>
            <View style={s.days}>
              {F.goodDays.map(d => {
                const p = parseISO(d);
                return (
                  <View key={d} style={s.day}>
                    <Text style={s.dayDate}>{p.m}/{p.d}</Text>
                    <Text style={s.dayWeek}>{WEEK[weekdayOf(d)]}요일</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}
        <View style={s.card}>
          <Text style={s.cardTitle}>계절마다 이렇게 챙겨 주세요</Text>
          {days ? (
            <View style={{ gap: 10 }}>
              {days.seasons.map(x => (
                <View key={x.season}>
                  <Text style={s.memoLabel}>{x.season}</Text>
                  <Text style={s.body}>{x.text}</Text>
                </View>
              ))}
            </View>
          ) : writing ? pending(4) : <Text style={s.body}>{F.pet.care}</Text>}
          <Text style={s.note}>성향을 바탕으로 한 생활 팁이에요. 건강이 걱정되면 꼭 수의사 선생님과 상담해 주세요.</Text>
        </View>
        {days ? (
          <View style={s.card}>
            <View style={s.colorRow}>
              <View style={[s.swatch, { backgroundColor: F.pet.luckyColor.hex }]} />
              <Text style={[s.body, s.bold]}>행운 컬러 {F.pet.luckyColor.name}</Text>
            </View>
            <Text style={[s.body, { marginTop: 6 }]}>{days.color}</Text>
          </View>
        ) : null}
      </View>

      </ReadingPart>

      <ReadingPart s={S} part="bond">
      {bond || writing ? (
        <>
          <Section number="06" title={`${ga} 보내는 편지`} />
          <PetLetter petId={petId} name={name} owner={owner} letter={bond?.letter ?? null} />
          {days ? <Text style={s.closing}>{days.closing}</Text> : null}
        </>
      ) : null}
      </ReadingPart>
    </>
  );
}

/* ---------- 입력 ---------- */
/** 새 아이 등록 — 한 번 등록하면 고치지 않는다 (지우고 다시 등록) */
function PetForm({ u, pets, onPick, onCancel, onSaved }: {
  u: User; pets: Pet[]; onPick(id: number): void; onCancel?(): void; onSaved(pet: Pet): void;
}) {
  const { today } = useApp();
  const { toast } = usePremium();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<PetSpecies | null>(null);
  // 생일을 아는지 — 알면 생일로, 모르면 가족이 된 날로 본다 (둘 중 하나만 받는다)
  const [knowsBirth, setKnowsBirth] = useState<boolean | null>(null);
  const [date, setDate] = useState('');
  const [estimated, setEstimated] = useState(false);
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [traits, setTraits] = useState<PetTraits>({});
  const [title, setTitle] = useState<OwnerTitle | null>(null);
  const titles = titlesFor(u.gender, gender);
  // 고르지 않았거나 아이 성별을 바꿔 목록에서 빠지면 엄마·아빠로 둔다
  const ownerTitle = title && titles.includes(title) ? title : titles[0];
  const [busy, setBusy] = useState(false);

  const check = (digits: string) => {
    const b = checkBirth(digits, 'solar');
    return { ...b, ok: b.ok && b.iso >= OLDEST && b.iso <= today };
  };
  const d = check(date);
  const dateOk = knowsBirth !== null && d.ok;
  const ok = !!name.trim() && !!species && dateOk && !!gender;
  const missing = [
    !name.trim() && '이름',
    !species && '어떤 아이',
    knowsBirth === null ? '생일을 아는지' : !dateOk && (knowsBirth ? '생일' : '가족이 된 날'),
    !gender && '성별',
  ].filter(Boolean) as string[];
  const started = !!name.trim() || !!species || knowsBirth !== null;
  useEffect(() => { if (d.ok) Keyboard.dismiss(); }, [d.ok]);

  const save = async () => {
    if (!ok || busy) return;
    const input: PetInput = {
      name: name.trim(), species: species!, gender,
      birthDate: knowsBirth ? d.iso : null,
      birthDateIsEstimated: !!knowsBirth && estimated,
      adoptedDate: knowsBirth ? null : d.iso,
      adoptedDateIsEstimated: !knowsBirth && estimated,
      traits,
      ownerTitle,
    };
    setBusy(true);
    try {
      const saved = await petApi.create(input);
      await refreshPets();
      onSaved(saved);
    } catch (e) {
      toast(e instanceof ApiError && e.code === 'INVALID_BIRTH_DATE' ? '날짜를 다시 확인해 주세요'
        : e instanceof ApiError && e.code === 'BAD_REQUEST' ? '반려동물은 10마리까지 등록할 수 있어요'
          : '저장하지 못했어요. 잠시 후 다시 시도해 주세요');
    } finally {
      setBusy(false);
    }
  };

  const pickTrait = <A extends PetTraitAxis>(axis: A, value: NonNullable<PetTraits[A]>) =>
    setTraits(t => {
      const next = { ...t };
      if (next[axis] === value) delete next[axis];
      else next[axis] = value;
      return next;
    });

  return (
    <Screen
      title="반려동물 궁합" back={!onCancel} onBack={onCancel}
      footer={(
        <>
          {started && missing.length ? <Text style={[txt.caption, { textAlign: 'center', marginBottom: 8 }]}>남은 칸 · {missing.join(', ')}</Text> : null}
          <PrimaryButton label={busy ? '보는 중…' : '궁합 보기'} onPress={save} disabled={!ok || busy} />
        </>
      )}
    >
      <PetSnackBanner style={s.snackTop} />
      {/* 소개 배너 (Figma 374:1288) — 327×142 그림 위 제목·설명 */}
      <View style={s.intro}>
        <Image source={INTRO_BG} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} />
        <Text accessibilityRole="header" style={s.introTitle}>댕냥이와 나, 어떤 사이일까?</Text>
        <Text style={s.introBody}>{u.nickname}님의 사주와 아이의 생일로 타고난 성격, 둘의 궁합 유형, 함께하면 좋은 놀이까지 알려 드려요.</Text>
      </View>

      {pets.length ? (
        <>
          <View style={s.blockHead}>
            <Text accessibilityRole="header" style={s.blockTitle}>저장된 상대</Text>
            <View style={s.blockBar} />
            <Text style={s.blockSub}>여러 마리 등록 가능해요</Text>
          </View>
          <View style={{ gap: 16 }}>{pets.map(p => <SavedPet key={p.id} pet={p} today={today} onPress={() => onPick(p.id)} />)}</View>
        </>
      ) : null}

      <View style={[s.blockHead, { marginBottom: 12 }]}>
        <Text accessibilityRole="header" style={s.blockTitle}>반려동물과 궁합 보기</Text>
      </View>
      <View style={s.form}>
        <View>
          <Label>이름</Label>
          <TextField compact value={name} onChangeText={setName} placeholder="이름 또는 닉네임" maxLength={20} />
        </View>

        <View>
          <Label>어떤 아이인가요?</Label>
          <View style={s.row}>{SPECIES.map(([k, l]) => <Pick key={k} label={l} icon={k} selected={species === k} onPress={() => setSpecies(k)} />)}</View>
        </View>

        <View>
          <Label>생일을 알고 있나요?</Label>
          <View style={s.row}>
            <Pick label="알아요" selected={knowsBirth === true} onPress={() => setKnowsBirth(true)} />
            <Pick label="몰라요" selected={knowsBirth === false} onPress={() => setKnowsBirth(false)} />
          </View>
          {knowsBirth === false ? <Text style={[txt.small, { marginTop: 8 }]}>괜찮아요. 가족이 된 날은 이 아이의 두 번째 생일이에요. 처음 함께한 그날의 기운으로 둘의 인연을 볼게요.</Text> : null}
        </View>

        {knowsBirth !== null ? (
          <View>
            <Label>{knowsBirth ? '생일 (양력)' : '가족이 된 날'}</Label>
            <DateField digits={date} onChange={setDate} label={knowsBirth ? '생일' : '가족이 된 날'} check={d} />
            <PressableScale onPress={() => setEstimated(v => !v)} style={s.checkRow} accessibilityRole="checkbox" accessibilityState={{ checked: estimated }}>
              <View style={[s.checkBox, estimated && s.checkOn]}>{estimated ? <Icon name="check" size={12} color={colors.white} /> : null}</View>
              <Text style={s.checkText}>정확한 날짜는 몰라요 (대략 짐작한 날짜예요)</Text>
            </PressableScale>
            {estimated ? <Text style={[txt.small, { marginTop: 8 }]}>짐작한 날짜는 하루하루의 기운 대신 그달의 기운으로 봐요. 며칠 차이로는 결과가 달라지지 않으니, 달만 맞으면 충분해요.</Text> : null}
          </View>
        ) : null}

        <View>
          <Label>성별</Label>
          <View style={s.row}>
            <Pick label="남아" selected={gender === 'male'} onPress={() => setGender('male')} />
            <Pick label="여아" selected={gender === 'female'} onPress={() => setGender('female')} />
          </View>
        </View>

        <View>
          <Label>아이가 나를 부르는 말</Label>
          <View style={s.titleGrid}>
            {titles.map(t => <View key={t} style={s.titleCell}><Pick label={t} selected={ownerTitle === t} onPress={() => setTitle(t)} /></View>)}
          </View>
        </View>

        <View>
          <Label>평소 모습 (선택)</Label>
          <Text style={s.traitHelp}>알려 주시면 {name.trim() || '우리 아이'}에게 더 꼭 맞는 풀이를 볼 수 있어요.</Text>
          <View style={{ gap: 12 }}>
            {AXES.map(axis => (
              <View key={axis} style={s.traitPick}>
                <Text style={s.traitPickLabel}>{TRAITS[axis][0]}</Text>
                <View style={s.row}>
                  {TRAITS[axis][1].map(([v, l]) => (
                    <Pick key={v} label={l} selected={traits[axis] === v} onPress={() => pickTrait(axis, v as never)} />
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
      <Disclaimer compact mt={16} />
    </Screen>
  );
}

/** 저장된 상대 한 줄 (Figma 367:2765) — 누르면 그 아이의 결과로 */
function SavedPet({ pet, today, onPress }: { pet: Pet; today: string; onPress(): void }) {
  const meta = [SPECIES_LABEL[pet.species], ageOf(pet, today), pet.gender && (pet.gender === 'male' ? '남아' : '여아')].filter(Boolean).join(' · ');
  return (
    <PressableScale onPress={onPress} scaleTo={0.98} style={s.saved} accessibilityRole="button" accessibilityLabel={`${pet.name}, ${meta}, 궁합 ${pet.result.score}점`}>
      <View style={s.avatar}><Image source={PET_IMG[pet.species].src} style={s.avatarImg} contentFit="contain" accessible={false} /></View>
      <View style={s.savedCopy}>
        <Text style={s.savedName} numberOfLines={1}>{pet.name}</Text>
        <Text style={s.savedMeta} numberOfLines={1}>{meta}</Text>
      </View>
      <Text style={s.savedScore}>{pet.result.score}</Text>
      <View style={s.savedChev}><Icon name="chevronRight" size={20} strokeWidth={2.4} color={colors.inkMute} /></View>
    </PressableScale>
  );
}

function DateField({ digits, onChange, label, check }: { digits: string; onChange(v: string): void; label: string; check: { filled: boolean; ok: boolean } }) {
  return (
    <>
      <TextField compact value={fmtDate(digits)} onChangeText={t => onChange(t.replace(/\D/g, '').slice(0, 8))} placeholder="2021. 04. 10"
        keyboardType="number-pad" maxLength={12} invalid={check.filled && !check.ok} accessibilityLabel={`${label} 8자리`} />
      {check.filled && !check.ok ? <Text style={s.error}>1990년부터 오늘까지의 실제 날짜를 입력해 주세요.</Text> : null}
    </>
  );
}

function Label({ children }: { children: string }) {
  return <Text style={s.fieldLabel}>{children}</Text>;
}

/** 낮은 선택 버튼 — 고르면 남색 */
function Pick({ label, icon, selected, onPress }: { label: string; icon?: PetSpecies; selected: boolean; onPress(): void }) {
  return (
    <PressableScale onPress={onPress} haptic scaleTo={0.95} style={[s.pick, selected && s.pickOn]} accessibilityRole="radio" accessibilityState={{ selected }}>
      {icon ? <Image source={PET_IMG[icon].src} style={{ width: PET_IMG[icon].w, height: 22 }} contentFit="contain" accessible={false} /> : null}
      <Text style={[s.pickText, selected && { color: '#EDEDED' }]}>{label}</Text>
    </PressableScale>
  );
}

/** 사용 설명서 (Figma 384:2420~) — 좋아해요·싫어해요는 나란한 두 칸, 신호와 칭찬법은 책 아이콘을 단 회색 칸 */
function PetManual({ m, name }: { m: NonNullable<PetReading['portrait']['manual']>; name: string }) {
  return (
    <View style={{ gap: 16 }}>
      <View style={s.likeRow}>
        <LikeCard tone="like" items={m.likes} />
        <LikeCard tone="dislike" items={m.dislikes} />
      </View>
      <ManualCard title="기분이 좋을 때 이런 모습">{m.happy.map(x => <Text key={x} style={s.manualText}>· {x}</Text>)}</ManualCard>
      <ManualCard title="마음이 불편할 때 이런 모습">{m.stressed.map(x => <Text key={x} style={s.manualText}>· {x}</Text>)}</ManualCard>
      <ManualCard title={`${name}에게 잘 통하는 칭찬`}><Text style={s.manualText}>{m.praise}</Text></ManualCard>
    </View>
  );
}

function LikeCard({ tone, items }: { tone: 'like' | 'dislike'; items: string[] }) {
  const like = tone === 'like';
  return (
    <View style={[s.likeCard, { borderColor: like ? LIKE_LINE : DISLIKE_LINE }]}>
      <View style={s.likeHead}>
        {like ? <LikeIcon /> : <DislikeIcon />}
        <Text accessibilityRole="header" style={s.manualTitle}>{like ? '좋아해요' : '싫어해요'}</Text>
      </View>
      <View style={s.likeList}>{items.map(x => <Text key={x} style={s.likeItem}>{x}</Text>)}</View>
    </View>
  );
}

function ManualCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.manualCard}>
      <View style={s.manualHead}>
        {/* 아이콘(20)은 제목 줄(17)보다 위 1 · 아래 2 삐져나온다 */}
        <View style={{ marginTop: -1, marginBottom: -2 }}><SolidIcon name="book" size={20} color={colors.accent} /></View>
        <Text accessibilityRole="header" style={s.manualTitle}>{title}</Text>
      </View>
      <View style={{ marginTop: 6 }}>{children}</View>
    </View>
  );
}

/* Figma 아이콘 (Favorite_fill · Dell_fill · Sun_fill · Moon_fill) — 경로는 Figma SVG 그대로 */
function LikeIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M4.45067 13.9082L11.4033 20.4395C11.6428 20.6644 11.7625 20.7769 11.9037 20.8046C11.9673 20.8171 12.0327 20.8171 12.0963 20.8046C12.2375 20.7769 12.3572 20.6644 12.5967 20.4395L19.5493 13.9082C21.5055 12.0706 21.743 9.0466 20.0978 6.92607L19.7885 6.52734C17.8203 3.99058 13.8696 4.41601 12.4867 7.31365C12.2913 7.72296 11.7087 7.72296 11.5133 7.31365C10.1304 4.41601 6.17972 3.99058 4.21154 6.52735L3.90219 6.92607C2.25695 9.0466 2.4945 12.0706 4.45067 13.9082Z"
        fill={colors.accent} stroke={colors.accent} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
function DislikeIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3ZM16.707 7.29297C16.3166 6.9025 15.6835 6.90261 15.293 7.29297L12 10.5859L8.70703 7.29297C8.31649 6.90261 7.68344 6.9025 7.29297 7.29297C6.9025 7.68344 6.90261 8.31649 7.29297 8.70703L10.5859 12L7.29297 15.293C6.90244 15.6835 6.90244 16.3165 7.29297 16.707C7.68349 17.0976 8.31651 17.0976 8.70703 16.707L12 13.4141L15.293 16.707C15.6835 17.0976 16.3165 17.0976 16.707 16.707C17.0976 16.3165 17.0976 15.6835 16.707 15.293L13.4141 12L16.707 8.70703C17.0974 8.31649 17.0975 7.68344 16.707 7.29297Z"
        fill={colors.danger} />
    </Svg>
  );
}
/** 하루 타임라인의 28 흰 칸 — 아침(해돋이) · 낮(해) · 저녁(달) */
function TimeIcon({ time }: { time: '아침' | '낮' | '저녁' }) {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28">
      <Rect width={28} height={28} rx={6} fill={RAIL} />
      {time === '아침' ? (
        <>
          <Path transform="translate(2 2)" fill="#F07777" d="M21.0547 19L2.89744 18.9947C2.31872 18.9947 1.98245 18.3675 2.00071 17.9154C2.02353 17.3439 2.41509 16.8787 3.01308 16.8761L5.85289 16.864C6.15771 14.107 8.07898 11.7973 10.6971 11.1584C12.2568 10.7779 13.8747 11.0963 15.2193 11.9693C16.89 13.0529 17.9694 14.8242 18.1515 16.8613L21.0197 16.8808C21.5943 16.8845 21.9747 17.3771 21.9991 17.9144C22.0209 18.4001 21.6582 19.0005 21.0547 19Z" />
          <Path transform="translate(2 2)" fill="#F07777" d="M6.55646 9.74309C7.08275 10.261 7.15296 11.0085 6.70109 11.5446C6.26662 12.0595 5.44208 12.1825 4.90379 11.6803C4.3655 11.1782 3.8134 10.6263 3.28652 10.0563C2.83104 9.56378 2.94866 8.72116 3.42754 8.31045C3.90642 7.89974 4.66075 7.87733 5.14983 8.35891L6.55646 9.74309Z" />
          <Path transform="translate(2 2)" fill="#F07777" d="M13.1104 7.74735C13.1163 8.48572 12.6374 9.06395 11.9388 9.1235C11.2674 9.18038 10.5975 8.68429 10.5719 7.94857C10.5464 7.21284 10.5462 6.43224 10.5767 5.6566C10.6029 4.98629 11.2819 4.47363 11.9109 4.52184C12.54 4.57004 13.0892 5.08758 13.0945 5.77395L13.1104 7.74735Z" />
          <Path transform="translate(2 2)" fill="#F07777" d="M19.1266 11.6319C18.638 12.131 17.8989 12.0996 17.4282 11.6761C16.9575 11.2525 16.822 10.461 17.2915 9.98245L18.8915 8.35108C19.4022 7.83025 20.2923 7.90275 20.7314 8.47675C21.0744 8.92447 21.1132 9.60421 20.7057 10.0205L19.1272 11.6319H19.1266Z" />
        </>
      ) : time === '낮' ? (
        <>
          <Circle cx={14} cy={14} r={4} fill="#FCBD51" />
          <Path d="M14 7V5M14 23V21M18.95 9.04996L20.3643 7.63574M7.63608 20.3644L9.05029 18.9502M21 14L23 14M5 14L7 14M18.95 18.95L20.3643 20.3643M7.63608 7.63559L9.05029 9.0498"
            stroke="#FCBD51" strokeWidth={2} strokeLinecap="round" />
        </>
      ) : (
        <Path fill={colors.accent} d="M17 6C17.2931 6 17.4397 6 17.5799 6.04196C18.1934 6.22551 18.4787 6.931 18.1653 7.48943C18.0937 7.61708 17.8753 7.82826 17.4386 8.25062C15.935 9.70471 15 11.7429 15 14C15 16.2569 15.9349 18.2945 17.4384 19.7483C17.8759 20.1714 18.0947 20.383 18.1664 20.5108C18.4796 21.0691 18.1943 21.7743 17.5812 21.958C17.4408 22 17.2939 22 17 22C12.5817 22 9 18.4183 9 14C9 9.58172 12.5817 6 17 6Z" />
      )}
    </Svg>
  );
}

/** 결과의 장 제목 — 하늘색 번호 + 제목 (전생 테스트와 같은 결) */
function Section({ number, title }: { number: string; title: string }) {
  return (
    <View style={s.section}>
      <Text style={[s.sectionText, s.sectionNumber]}>{number}</Text>
      <Text accessibilityRole="header" style={s.sectionText}>{title}</Text>
    </View>
  );
}

const INK = isDark ? colors.ink : '#000000';
const CHIP = '#FFF386';
const RAIL = isDark ? colors.surface : colors.white; // 타임라인 아이콘 칸·레일
const LIKE_LINE = '#92D8FF';
const DISLIKE_LINE = '#FFB1B1';
const DAY_BG = isDark ? colors.card : '#FFE7E7';
const DAY_INK = '#DD2828';
const NOTE = isDark ? colors.inkMute : '#838383';
const TIGHT = Platform.OS === 'android' ? { includeFontPadding: false } : {};
const s = StyleSheet.create({
  // 입력 — 소개 배너 327×142 · 제목 20/800 (위·왼 20) · 설명 13/500 (제목 아래 16)
  // 설명 폭은 Figma 162지만 낱말 단위로 줄이 나뉘면 4줄이 돼, 3줄로 나오게 186 (웹 172부터 3줄 + 기기 글꼴 여유)
  intro: { height: 142, padding: 20, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1B1F5C' },
  introTitle: { ...sansW('800'), fontSize: 20, lineHeight: 24, letterSpacing: -0.8, color: colors.white, ...TIGHT },
  introBody: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: '#DDDDDD', width: 186, marginTop: 16, ...TIGHT },
  // 블록 제목 18/600 — 위 블록과 32, 아래 16 (폼 앞은 12)
  blockHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 32, marginBottom: 16 },
  blockTitle: { ...sansW('600'), fontSize: 18, lineHeight: 21, color: INK, ...TIGHT },
  blockBar: { width: 1, height: 14, backgroundColor: '#999999' },
  blockSub: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.inkMute, flexShrink: 1, ...TIGHT },
  // 저장된 상대 327×64 · 그림 원 40 (위·왼 12) · 이름 14/700 · 정보 13/400 · 점수 20/600 빨강 · 화살표 칸 28 (오른쪽 16)
  saved: { flexDirection: 'row', alignItems: 'center', height: 64, paddingLeft: 12, paddingRight: 16, gap: 8, borderRadius: 12, backgroundColor: colors.card },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 32, height: 29 },
  savedCopy: { flex: 1, gap: 4 },
  savedName: { ...sansW('700'), fontSize: 14, lineHeight: 17, letterSpacing: -0.56, color: colors.ink, ...TIGHT },
  savedMeta: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: INK, ...TIGHT },
  savedScore: { ...sansW('600'), fontSize: 20, lineHeight: 24, letterSpacing: -0.8, color: colors.danger, fontVariant: ['tabular-nums'], ...TIGHT },
  savedChev: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  // 폼 — 회색 칸 (둘레 16) · 항목 사이 16 · 제목 아래 8 · 버튼 사이 12
  form: { gap: 16, padding: 16, borderRadius: 12, backgroundColor: colors.card },
  fieldLabel: { ...sansW('600'), fontSize: 14, lineHeight: 17, letterSpacing: -0.56, color: colors.ink, marginBottom: 8, ...TIGHT },
  row: { flexDirection: 'row', gap: 12 },
  pick: { flex: 1, flexDirection: 'row', gap: 4, height: 36, borderRadius: 5, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  pickOn: { backgroundColor: colors.navy },
  pickText: { ...sansW('600'), fontSize: 13, letterSpacing: -0.26, color: colors.ink },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  checkBox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  checkText: { ...sansW('500'), fontSize: 13, letterSpacing: -0.4, color: colors.ink },
  // 평소 모습 — 설명은 제목 아래 4 · 첫 질문까지 16 · 질문과 버튼 사이 8 · 질문 묶음 사이 12
  traitHelp: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.inkMute, marginTop: -4, marginBottom: 16, ...TIGHT },
  traitPick: { gap: 8 },
  traitPickLabel: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: isDark ? colors.inkSub : '#555555', ...TIGHT },
  error: { ...sansW('400'), color: colors.danger, fontSize: 12, marginTop: 6 },

  // 결과
  content: { paddingTop: 0, paddingBottom: 60 },
  // 아이 칩 — 높이 32 · 좌우 16 · 고른 칩은 검정, 추가는 하늘색 점선
  petRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  petChip: { height: 32, paddingHorizontal: 16, borderRadius: 30, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', maxWidth: 140 },
  petChipOn: { backgroundColor: isDark ? colors.navy : '#000000' },
  petAdd: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.accent, borderStyle: 'dashed' },
  petChipText: { ...sansW('500'), fontSize: 14, lineHeight: 17, color: colors.ink, ...TIGHT },
  petAddText: { ...sansW('700'), fontSize: 14, lineHeight: 17, color: colors.accent, opacity: 0.8, ...TIGHT },
  // 히어로 327×300 — 그림 136×97 (위 33) · 글줄 사이 10 · 키워드 칩까지 13 · 아래 22
  hero: { minHeight: 300, borderRadius: radius.lg, overflow: 'hidden', alignItems: 'center', paddingTop: 33, paddingBottom: 21, paddingHorizontal: 16, backgroundColor: '#1E1838' },
  heroPets: { width: 136, height: 97 },
  eyebrow: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: '#DDDDDD', textAlign: 'center', ...TIGHT },
  typeName: { ...sansW('700'), fontSize: 24, lineHeight: 24, letterSpacing: -1.2, color: colors.white, marginTop: 7, textAlign: 'center', ...TIGHT },
  typeLine: { ...sansW('700'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: CHIP, marginTop: 7, textAlign: 'center', ...TIGHT },
  score: { ...sansW('700'), fontSize: 32, lineHeight: 32, letterSpacing: -1.6, color: colors.white, marginTop: 10, textAlign: 'center', fontVariant: ['tabular-nums'], ...TIGHT },
  tags: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 13, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 4, paddingVertical: 2, borderRadius: 5, borderWidth: 0.5, borderColor: CHIP },
  tagText: { ...sansW('600'), fontSize: 12, lineHeight: 15, color: CHIP, opacity: 0.8, ...TIGHT },
  basisNote: { ...sansW('500'), fontSize: 12, lineHeight: 17, letterSpacing: -0.48, color: NOTE, textAlign: 'center', marginTop: 12, ...TIGHT },

  section: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 32, marginBottom: 16 },
  sectionText: { ...sansW('600'), fontSize: 18, lineHeight: 21, letterSpacing: -0.9, color: INK, flexShrink: 1, ...TIGHT },
  sectionNumber: { color: colors.accent, flexShrink: 0 },
  card: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.card },
  fill: { backgroundColor: isDark ? colors.moneyBg : '#FFFAF1' },
  cardTitle: { ...sansW('600'), fontSize: 16, lineHeight: 20, letterSpacing: -0.8, color: INK, marginBottom: 8, ...TIGHT },
  body: { ...sansW('400'), fontSize: 13, lineHeight: 19, letterSpacing: -0.65, color: INK, ...TIGHT },
  bold: { ...sansW('700') },
  memo: { marginTop: 12, padding: 12, borderRadius: 6, backgroundColor: colors.surface, gap: 4 },
  memoLabel: { ...sansW('600'), fontSize: 13, lineHeight: 16, letterSpacing: -0.65, color: colors.accent, marginBottom: 4, ...TIGHT },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  swatch: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: colors.line },
  // 부르는 말 — 두 칸씩
  titleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  titleCell: { flexBasis: '40%', flexGrow: 1, flexDirection: 'row' },
  // 사용 설명서 — 좋아해요·싫어해요 흰 칸 (선 1 · 둥근 12 · 둘레 16) · 머리 아이콘 24 + 8 · 목록 줄 사이 6
  likeRow: { flexDirection: 'row', gap: 13 },
  likeCard: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, backgroundColor: colors.surface },
  likeHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  likeList: { gap: 6, marginTop: 9 },
  likeItem: { ...sansW('500'), fontSize: 12, lineHeight: 18, letterSpacing: -1.2, color: INK, ...TIGHT },
  // 신호·칭찬 칸 — 회색 둥근 8 · 둘레 16 · 책 아이콘 20 + 8 · 본문 13/400 줄 22
  manualCard: { padding: 16, borderRadius: 8, backgroundColor: colors.card },
  manualHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  manualTitle: { ...sansW('700'), fontSize: 14, lineHeight: 17, letterSpacing: -0.56, color: colors.ink, flexShrink: 1, ...TIGHT },
  manualText: { ...sansW('400'), fontSize: 13, lineHeight: 22, letterSpacing: -0.65, color: INK, ...TIGHT },
  listItem: { ...sansW('400'), fontSize: 13, lineHeight: 22, letterSpacing: -0.65, color: INK, ...TIGHT },
  // 함께 놀기 좋은 날 — 위 카드와 24, 아래 카드와 16 (바깥 gap 12 포함) · 칸 98×63 분홍 · 날짜 18/700 빨강 · 요일 13/400
  goodDays: { marginTop: 12, marginBottom: 4 },
  goodTitle: { ...sansW('600'), fontSize: 18, lineHeight: 21, letterSpacing: -0.72, color: INK, ...TIGHT },
  days: { flexDirection: 'row', gap: 16, marginTop: 16 },
  day: { flex: 1, height: 63, paddingTop: 12, borderRadius: 12, alignItems: 'center', backgroundColor: DAY_BG },
  dayDate: { ...sansW('700'), fontSize: 18, lineHeight: 21, letterSpacing: -0.72, color: DAY_INK, fontVariant: ['tabular-nums'], ...TIGHT },
  dayWeek: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.inkMute, ...TIGHT },
  note: { ...sansW('400'), fontSize: 12, lineHeight: 17, letterSpacing: -0.6, color: colors.inkMute, marginTop: 8, ...TIGHT },
  // 하루 타임라인 — 회색 둥근 8 · 아이콘 칸 28 (위·왼 14) · 글은 칸 오른쪽 8 · 흰 레일 2
  routine: { paddingTop: 14, paddingLeft: 14, paddingRight: 16, paddingBottom: 16, borderRadius: 8, backgroundColor: colors.card },
  routineRow: { flexDirection: 'row', gap: 8 },
  routineRail: { width: 28, alignItems: 'center' },
  railLine: { flex: 1, width: 2, backgroundColor: RAIL },
  routineCopy: { flex: 1, paddingTop: 5 },
  routineTime: { ...sansW('700'), fontSize: 14, lineHeight: 17, letterSpacing: -0.56, color: colors.ink, ...TIGHT },
  routineText: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: INK, marginTop: 6, ...TIGHT },
  closing: { ...sansW('600'), fontSize: 14, lineHeight: 21, letterSpacing: -0.5, color: INK, textAlign: 'center', marginTop: 20, paddingHorizontal: 12 },
  // 광고 배너는 화면 맨 위 — 아래 내용과 16 띄운다
  snackTop: { marginTop: 4, marginBottom: 16 },
  manage: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24 },
  manageLink: { ...sansW('700'), fontSize: 12, lineHeight: 20, letterSpacing: -0.48, color: colors.inkMute, textDecorationLine: 'underline' },
});
