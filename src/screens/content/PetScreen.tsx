import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, StyleSheet, Text, View } from 'react-native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
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
import Mascot, { Logo } from '../../components/Mascot';
import { checkBirth, fmtDate } from '../../components/BirthFields';
import { useApp } from '../../context/AppContext';
import { usePremium } from '../../context/PremiumContext';
import { ApiError } from '../../api/client';
import { BodyState, LockedCard } from '../../components/premium/Kit';
import { ITEMS } from '../../services/premium/catalog';
import { usePremiumContent, useReading } from '../../services/server/premiumApi';
import { PartPending, ProgressCard, ReadingBanner } from '../../components/premium/Reading';
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
const LOADING_STEPS = (name: string, basis: string, nickname: string) => [
  `${name}의 ${basis} 기운을 읽고 있어요`,
  `${nickname}님의 사주와 겹쳐 보고 있어요`,
  '둘의 궁합 유형을 고르고 있어요',
];
const STEP_MS = 800;

const SPECIES: [PetSpecies, string][] = [['dog', '강아지'], ['cat', '고양이'], ['other', '그 외']];
/** 평소 모습 4가지 — [축, 질문, [값, 라벨] 두 개] */
const TRAITS: { [A in PetTraitAxis]: [string, [NonNullable<PetTraits[A]>, string][]] } = {
  energy: ['에너지', [['active', '에너지 넘침'], ['middle', '그날그날'], ['calm', '느긋함']]],
  affection: ['애정 표현', [['clingy', '애교쟁이'], ['middle', '적당히'], ['independent', '마이웨이']]],
  courage: ['낯선 것 앞에서', [['bold', '대담함'], ['middle', '상황 따라'], ['shy', '조심성 많음']]],
  appetite: ['식성', [['foodie', '먹보'], ['middle', '보통'], ['picky', '입 짧음']]],
};
const AXES = Object.keys(TRAITS) as PetTraitAxis[];
const OLDEST = '1990-01-01';

const md = (iso: string) => { const p = parseISO(iso); return `${p.m}/${p.d} (${WEEK[weekdayOf(iso)]})`; };
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
  const [selected, setSelected] = useState<number | null>(null);
  // 새 아이 등록 화면을 연 중인지
  const [adding, setAdding] = useState(false);
  const [fresh, setFresh] = useState<number | null>(null);
  if (!u) return null;
  if (!q.data) return <LoadingScreen title="반려동물 궁합" error={q.error} onRetry={q.refetch} />;
  const pets = q.data;
  const pet = pets.find(p => p.id === selected) ?? pets[0];

  if (adding || !pet) {
    return (
      <PetForm
        u={u} first={!pets.length}
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
  const spec = petSpec(u, pet);
  const name = pet.name;
  // 새로 등록한 아이는 미리보기 전에 궁합을 보는 단계를 잠깐 보여 준다 (다른 아이를 고르면 바로)
  const steps = LOADING_STEPS(name, R.basis.kind === 'adopted' ? '가족이 된 날' : '생일', u.nickname);
  const [step, setStep] = useState(revealed ? 0 : steps.length);
  const loading = step < steps.length;
  // 단계를 다 본 뒤에만 부드럽게 나타난다 (아이를 바꿔 볼 때는 그대로)
  const Appear = revealed ? Reveal : View;
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setStep(n => n + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [loading, step]);

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
      <View style={s.heroLogo}><Logo height={LOGO_H} /></View>
      <Mascot name="soon-pet" size={78} />
      <Text style={s.eyebrow}>{u.nickname} × {name}</Text>
      <Text accessibilityRole="header" style={s.typeName}>{R.type.name}</Text>
      <Text style={s.typeLine}>{R.type.line}</Text>
      <View style={s.scoreChip} accessible accessibilityLabel={`궁합 ${R.score}점`}>
        <Text style={s.scoreValue}>{R.score}</Text><Text style={s.scoreUnit}>점</Text>
      </View>
      <View style={s.tags}>{R.pet.keywords.map(k => <View key={k} style={s.tag}><Text style={s.tagText}>#{k}</Text></View>)}</View>
    </View>
  );

  return (
    <Screen key={`pet-${pet.id}`} title="반려동물 궁합" back contentStyle={s.content} right={<ShareIconButton spec={spec} />}>
      <PetSnackBanner style={s.snackTop} />
      <View style={s.petRow}>
        {pets.map(p => (
          <PressableScale key={p.id} onPress={() => onPick(p.id)} style={[s.petChip, p.id === pet.id && s.petChipOn]} scaleTo={0.95} accessibilityRole="tab" accessibilityState={{ selected: p.id === pet.id }}>
            <Text style={[s.petChipText, p.id === pet.id && { color: colors.white }]} numberOfLines={1}>{p.name}</Text>
          </PressableScale>
        ))}
        <PressableScale onPress={onAdd} style={[s.petChip, s.petAdd]} scaleTo={0.95} accessibilityLabel="반려동물 추가">
          <Text style={[s.petChipText, { color: colors.accent }]}>+ 추가</Text>
        </PressableScale>
      </View>

      {loading ? (
        <ProgressCard title="궁합을 보고 있어요" done={step} total={steps.length} note={steps[step]} />
      ) : (
      <Appear>
      <FriendCompare route="Pet" spec={spec} />
      {hero}
      {basisNote(name, R.basis) ? <Text style={s.basisNote}>{basisNote(name, R.basis)}</Text> : null}

      <Section number="01" title={`${name}의 타고난 성격`} />
      <View style={s.card}>
        <Text accessibilityRole="header" style={s.cardTitle}>{R.pet.title}</Text>
        <Text style={s.body}>{R.pet.persona}</Text>
        {F ? (
          <>
            <View style={s.memo}>
              <Text style={s.memoLabel}>이 아이의 강점</Text>
              <Text style={s.body}>{F.pet.strength}</Text>
            </View>
          </>
        ) : null}
      </View>

      {!content.open ? (
        <>
          <LockedCard item={ITEMS.pet(pet.id, name)} />
        </>
      ) : F ? (
        <PetBody F={F} reading={reading} onRetry={retry} petId={pet.id} name={name} owner={pet.ownerTitle ?? `${u.nickname}님`} />
      ) : (
        <BodyState error={content.isError} onRetry={() => content.refetch()} />
      )}

      <ShareActions spec={spec} title={`${name}${josa(name, '과', '와')}의 궁합 자랑하기`} outlined marginTop={16} />

      <View style={[s.card, { marginTop: 16 }]}>
        <Text accessibilityRole="header" style={s.cardTitle}>이 결과는 어떻게 만들었나요?</Text>
        <Text style={s.body}>아이의 생일로 년·월·일 세 기둥을 세워 타고난 기운을 보고, 내 사주의 일간·일지·띠와 겹쳐 궁합 유형을 정했어요. 생일을 모르면 가족이 된 날을 두 번째 생일로 삼아 그날의 기운으로 보고, 짐작한 생일은 날짜 대신 태어난 달의 기운으로 봐요. 태어난 시간은 쓰지 않아요. 재미로 보는 콘텐츠이고, 아이의 실제 성격은 함께 지내며 알아가는 게 가장 정확해요.</Text>
      </View>


      <View style={s.manage}>
        <PressableScale onPress={() => setConfirm(true)} hitSlop={8}><Text style={s.manageLink}>{name} 지우기</Text></PressableScale>
      </View>
      <Disclaimer compact />
      </Appear>
      )}
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
  const ga = `${name}${josa(name, '이', '')}가`;
  return (
    <>
      <View style={{ marginTop: 16 }}><ReadingBanner reading={reading} onRetry={onRetry} /></View>

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

      {portrait?.manual || writing ? (
        <>
          <Section number="03" title={`${name} 사용 설명서`} />
          <View style={s.card}>
            {portrait?.manual ? <PetManual m={portrait.manual} name={name} /> : pending(6)}
          </View>
        </>
      ) : null}

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

      <Section number="05" title="함께하는 하루" />
      <View style={{ gap: 12 }}>
        {days ? (
          <View style={s.card}>
            <View style={{ gap: 12 }}>
              {days.routine.map(r => (
                <View key={r.time} style={s.routineRow}>
                  <View style={s.routineTime}><Text style={s.routineTimeText}>{r.time}</Text></View>
                  <Text style={[s.body, { flex: 1 }]}>{r.text}</Text>
                </View>
              ))}
            </View>
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
          {F.goodDays.length ? (
            <>
              <Text style={[s.cardTitle, { marginTop: 16 }]}>함께 놀기 좋은 날</Text>
              <View style={s.days}>{F.goodDays.map(d => <View key={d} style={s.day}><Text style={s.dayText}>{md(d)}</Text></View>)}</View>
            </>
          ) : null}
        </View>
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

      {bond || writing ? (
        <>
          <Section number="06" title={`${ga} 보내는 편지`} />
          <PetLetter petId={petId} name={name} owner={owner} letter={bond?.letter ?? null} />
          {days ? <Text style={s.closing}>{days.closing}</Text> : null}
        </>
      ) : null}
    </>
  );
}

/* ---------- 입력 ---------- */
/** 새 아이 등록 — 한 번 등록하면 고치지 않는다 (지우고 다시 등록) */
function PetForm({ u, first, onCancel, onSaved }: {
  u: User; first: boolean; onCancel?(): void; onSaved(pet: Pet): void;
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
  const ok = !!name.trim() && !!species && dateOk;
  const missing = [
    !name.trim() && '이름',
    !species && '어떤 아이',
    knowsBirth === null ? '생일을 아는지' : !dateOk && (knowsBirth ? '생일' : '가족이 된 날'),
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
      {first ? (
        <>
          <View style={s.introMeta}><Text style={s.kicker}>우리 집 반려동물</Text><Text style={txt.caption}>미리보기 무료 · 여러 마리 등록 가능</Text></View>
          <View style={s.introHead}>
            <Text style={s.introTitle}>댕냥이와 나,{'\n'}어떤 사이일까?</Text>
            <Mascot name="soon-pet" size={72} />
          </View>
          <Text style={s.introBody}>{u.nickname}님의 사주와 아이의 생일로 타고난 성격, 둘의 궁합 유형, 함께하면 좋은 놀이까지 알려 드려요. 생일을 몰라도 괜찮아요. 우리 집에 온 날, 두 번째 생일로 볼 수 있어요.</Text>
        </>
      ) : (
        <Text style={[s.introTitle, { fontSize: 22, lineHeight: 30, marginTop: 12 }]}>새 아이 등록하기</Text>
      )}

      <Card style={s.form}>
        <View>
          <Label>이름</Label>
          <TextField compact value={name} onChangeText={setName} placeholder="아이 이름" maxLength={20} />
        </View>

        <View>
          <Label>어떤 아이인가요?</Label>
          <View style={s.row}>{SPECIES.map(([k, l]) => <Pick key={k} label={l} selected={species === k} onPress={() => setSpecies(k)} />)}</View>
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
          <Label>성별 (선택)</Label>
          <View style={s.row}>
            <Pick label="남아" selected={gender === 'male'} onPress={() => setGender(g => (g === 'male' ? null : 'male'))} />
            <Pick label="여아" selected={gender === 'female'} onPress={() => setGender(g => (g === 'female' ? null : 'female'))} />
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
          <Text style={[txt.small, { marginTop: -4, marginBottom: 10 }]}>알려 주시면 {name.trim() || '우리 아이'}에게 더 꼭 맞는 풀이를 볼 수 있어요.</Text>
          <View style={{ gap: 10 }}>
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
      </Card>
      <Disclaimer compact />
    </Screen>
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
function Pick({ label, selected, onPress }: { label: string; selected: boolean; onPress(): void }) {
  return (
    <PressableScale onPress={onPress} haptic scaleTo={0.95} style={[s.pick, selected && s.pickOn]} accessibilityRole="radio" accessibilityState={{ selected }}>
      <Text style={[s.pickText, selected && { color: '#EDEDED' }]}>{label}</Text>
    </PressableScale>
  );
}

/** 사용 설명서 — 좋아하는 것·싫어하는 것은 칩으로, 신호와 칭찬법은 짧은 줄로 */
function PetManual({ m, name }: { m: NonNullable<PetReading['portrait']['manual']>; name: string }) {
  const chips = (list: string[], tone: 'like' | 'dislike') => (
    <View style={s.chips}>{list.map(x => <View key={x} style={[s.chip, tone === 'dislike' && s.chipOff]}><Text style={s.chipText}>{x}</Text></View>)}</View>
  );
  const lines = (list: string[]) => list.map(x => <Text key={x} style={s.listItem}>· {x}</Text>);
  return (
    <View style={{ gap: 14 }}>
      <View><Text style={s.memoLabel}>좋아해요</Text>{chips(m.likes, 'like')}</View>
      <View><Text style={s.memoLabel}>싫어해요</Text>{chips(m.dislikes, 'dislike')}</View>
      <View><Text style={s.memoLabel}>기분 좋을 때 이런 모습</Text>{lines(m.happy)}</View>
      <View><Text style={s.memoLabel}>마음이 불편할 때 이런 모습</Text>{lines(m.stressed)}</View>
      <View style={s.memo}><Text style={s.memoLabel}>{name}에게 잘 통하는 칭찬</Text><Text style={s.body}>{m.praise}</Text></View>
    </View>
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
const LOGO_H = 36 / 65 * 55;
const TIGHT = Platform.OS === 'android' ? { includeFontPadding: false } : {};
const s = StyleSheet.create({
  // 입력
  introMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  kicker: { ...sansW('600'), color: colors.inkMute, fontSize: 12, letterSpacing: 1.2 },
  introHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 20 },
  introTitle: { ...txt.title, fontSize: 29, lineHeight: 40 },
  introBody: { ...txt.body, fontSize: 15, lineHeight: 25, marginTop: 14 },
  form: { gap: 16, padding: 16, marginTop: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '600', letterSpacing: -0.56, color: colors.ink, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  pick: { flex: 1, height: 36, borderRadius: 5, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  pickOn: { backgroundColor: colors.navy },
  pickText: { fontSize: 13, fontWeight: '600', letterSpacing: -0.26, color: colors.ink },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  checkBox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  checkText: { ...sansW('500'), fontSize: 13, letterSpacing: -0.4, color: colors.ink },
  traitPick: { gap: 6 },
  traitPickLabel: { ...sansW('600'), fontSize: 13, letterSpacing: -0.5, color: colors.inkSub },
  error: { ...sansW('400'), color: colors.danger, fontSize: 12, marginTop: 6 },

  // 결과
  content: { paddingTop: 0, paddingBottom: 60 },
  petRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 16 },
  petChip: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 32, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.card, maxWidth: 140 },
  petChipOn: { backgroundColor: colors.navy },
  petAdd: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.accent, borderStyle: 'dashed' },
  petChipText: { ...sansW('600'), fontSize: 13, letterSpacing: -0.4, color: colors.ink },
  hero: { borderRadius: radius.lg, overflow: 'hidden', alignItems: 'center', paddingTop: 40, paddingBottom: 24, paddingHorizontal: 16, backgroundColor: '#1F2547' },
  heroLogo: { position: 'absolute', left: 16, top: 12 },
  eyebrow: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: '#DDDDDD', marginTop: 10, textAlign: 'center', ...TIGHT },
  typeName: { ...sansW('700'), fontSize: 24, lineHeight: 30, letterSpacing: -1.2, color: colors.white, marginTop: 6, textAlign: 'center', ...TIGHT },
  typeLine: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: CHIP, marginTop: 6, textAlign: 'center', ...TIGHT },
  scoreChip: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: 14, paddingHorizontal: 14, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.12)' },
  scoreValue: { ...sansW('700'), fontSize: 22, lineHeight: 28, letterSpacing: -0.8, color: colors.white, fontVariant: ['tabular-nums'], ...TIGHT },
  scoreUnit: { ...sansW('600'), fontSize: 13, color: colors.white, ...TIGHT },
  tags: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, borderWidth: 0.5, borderColor: CHIP },
  tagText: { ...sansW('600'), fontSize: 12, lineHeight: 15, color: CHIP, opacity: 0.85, ...TIGHT },
  basisNote: { ...txt.caption, textAlign: 'center', marginTop: 10 },

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
  titleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  titleCell: { flexBasis: '30%', flexGrow: 1, flexDirection: 'row' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.surface },
  chipOff: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.lineStrong },
  chipText: { ...sansW('600'), fontSize: 12, color: INK },
  inlineCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 16, paddingVertical: 10, borderRadius: 6, backgroundColor: colors.surface },
  inlineCtaText: { ...sansW('600'), fontSize: 13, letterSpacing: -0.5, color: colors.accent },
  listItem: { ...sansW('400'), fontSize: 13, lineHeight: 22, letterSpacing: -0.65, color: INK, ...TIGHT },
  days: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  day: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: colors.surface },
  dayText: { ...sansW('600'), fontSize: 13, color: INK, fontVariant: ['tabular-nums'] },
  note: { ...sansW('400'), fontSize: 12, lineHeight: 17, letterSpacing: -0.6, color: colors.inkMute, marginTop: 8, ...TIGHT },
  routineRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  routineTime: { width: 40, paddingVertical: 2, borderRadius: 4, alignItems: 'center', backgroundColor: colors.surface },
  routineTimeText: { ...sansW('700'), fontSize: 12, color: colors.accent },
  closing: { ...sansW('600'), fontSize: 14, lineHeight: 21, letterSpacing: -0.5, color: INK, textAlign: 'center', marginTop: 20, paddingHorizontal: 12 },
  // 광고 배너는 화면 맨 위 — 아래 내용과 16 띄운다
  snackTop: { marginTop: 4, marginBottom: 16 },
  manage: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24 },
  manageLink: { ...sansW('700'), fontSize: 12, lineHeight: 20, letterSpacing: -0.48, color: colors.inkMute, textDecorationLine: 'underline' },
  manageDot: { color: colors.inkMute },
});
