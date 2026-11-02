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
import { petApi, refreshPets, usePets } from '../../services/server/petApi';
import { petSpec } from '../../services/share/shareSpecs';
import { WEEK } from '../../services/premium/helpers';
import { parseISO, weekdayOf } from '../../utils/date';
import { User } from '../../types';
import { Pet, PetInput, PetSpecies, PetTraitAxis, PetTraits } from '../../types/content';
import { colors, isDark } from '../../theme/colors';
import { radius, sansW, txt } from '../../theme/typography';

const SPECIES: [PetSpecies, string][] = [['dog', '강아지'], ['cat', '고양이'], ['other', '그 외']];
/** 평소 모습 4가지 — [축, 질문, [값, 라벨] 두 개] */
const TRAITS: { [A in PetTraitAxis]: [string, [NonNullable<PetTraits[A]>, string][]] } = {
  energy: ['에너지', [['active', '에너지 넘침'], ['calm', '느긋함']]],
  affection: ['애정 표현', [['clingy', '애교쟁이'], ['independent', '마이웨이']]],
  courage: ['낯선 것 앞에서', [['bold', '대담함'], ['shy', '조심성 많음']]],
  appetite: ['식성', [['foodie', '먹보'], ['picky', '입 짧음']]],
};
const AXES = Object.keys(TRAITS) as PetTraitAxis[];
const OLDEST = '1990-01-01';

const md = (iso: string) => { const p = parseISO(iso); return `${p.m}/${p.d} (${WEEK[weekdayOf(iso)]})`; };
const toDigits = (iso: string | null) => (iso ?? '').replaceAll('-', '');
/** 받침이 있으면 a, 없으면 b (코코와 / 별이랑 → 별과) */
const josa = (w: string, a: string, b: string) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c <= 11171 && c % 28 ? a : b; };
const BASIS = { birth: '생일', estimated: '짐작한 생일', adopted: '가족이 된 날' } as const;

/** 반려동물 궁합 — 아이를 등록하면 서버가 내 사주와 아이의 생일(모르면 가족이 된 날)로 본다. */
export default function PetScreen() {
  const { user: u } = useApp();
  const q = usePets();
  const [selected, setSelected] = useState<number | null>(null);
  // null: 결과 보기 · 'new': 새 아이 · Pet: 그 아이 고치기
  const [editing, setEditing] = useState<Pet | 'new' | null>(null);
  const [fresh, setFresh] = useState<number | null>(null);
  if (!u) return null;
  if (!q.data) return <LoadingScreen title="반려동물 궁합" error={q.error} onRetry={q.refetch} />;
  const pets = q.data;
  const pet = pets.find(p => p.id === selected) ?? pets[0];

  if (editing || !pet) {
    const before = editing && editing !== 'new' ? editing : null;
    return (
      <PetForm
        u={u} before={before} first={!pets.length}
        onCancel={pets.length ? () => setEditing(null) : undefined}
        onSaved={saved => { setSelected(saved.id); setFresh(before ? null : saved.id); setEditing(null); }}
      />
    );
  }
  return (
    <PetResult
      key={pet.id} u={u} pet={pet} pets={pets} revealed={fresh === pet.id}
      onPick={id => { setSelected(id); setFresh(null); }}
      onAdd={() => setEditing('new')} onEdit={() => setEditing(pet)}
      onRemoved={() => setSelected(null)}
    />
  );
}

/* ---------- 결과 ---------- */
function PetResult({ u, pet, pets, revealed, onPick, onAdd, onEdit, onRemoved }: {
  u: User; pet: Pet; pets: Pet[]; revealed: boolean;
  onPick(id: number): void; onAdd(): void; onEdit(): void; onRemoved(): void;
}) {
  const { toast } = usePremium();
  const [confirm, setConfirm] = useState(false);
  const R = pet.result;
  const spec = petSpec(u, pet);
  const basis = BASIS[R.basis.estimated ? 'estimated' : R.basis.kind];
  const name = pet.name;

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

      <FriendCompare route="Pet" spec={spec} />
      {revealed ? <Reveal>{hero}</Reveal> : hero}
      <Text style={s.basisNote}>{name}의 {basis}({R.basis.date.replaceAll('-', '.')}) 기준으로 봤어요</Text>

      <Section number="01" title={`${name}의 타고난 성격`} />
      <View style={s.card}>
        <Text accessibilityRole="header" style={s.cardTitle}>{R.pet.title}</Text>
        <Text style={s.body}>{R.pet.persona}</Text>
        <View style={s.memo}>
          <Text style={s.memoLabel}>이 아이의 강점</Text>
          <Text style={s.body}>{R.pet.strength}</Text>
        </View>
        <View style={s.colorRow}>
          <View style={[s.swatch, { backgroundColor: R.pet.luckyColor.hex }]} />
          <Text style={s.body}><Text style={s.bold}>행운 컬러 {R.pet.luckyColor.name}</Text> · 장난감이나 담요 색으로 골라 보세요</Text>
        </View>
      </View>

      <Section number="02" title="사주로 본 모습 vs 실제 모습" />
      <View style={s.card}>
        {R.answered ? (
          <Text style={s.cardTitle}>{R.matched === R.answered ? '사주 그대로 자라고 있어요' : R.matched ? `고른 ${R.answered}개 중 ${R.matched}개가 사주와 같아요` : '사주와는 조금 다르게 자라고 있어요'}</Text>
        ) : (
          <Text style={s.cardTitle}>사주로 본 {name}{josa(name, '은', '는')} 이런 아이예요</Text>
        )}
        <View style={{ gap: 12, marginTop: 4 }}>
          {R.traits.map(t => (
            <View key={t.axis} style={s.traitRow}>
              <View style={s.traitHead}>
                <Text style={s.traitLabel}>{t.label}</Text>
                <View style={s.traitChips}>
                  <View style={s.sajuChip}><Text style={s.sajuChipText}>사주 · {t.saju}</Text></View>
                  {t.owner ? (
                    <View style={[s.ownerChip, t.match ? s.matchChip : null]}>
                      <Text style={[s.ownerChipText, t.match && { color: colors.white }]}>{t.match ? '✓ 같아요' : `실제 · ${t.owner}`}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <Text style={s.body}>{t.text}</Text>
            </View>
          ))}
        </View>
        {R.answered < AXES.length ? (
          <PressableScale onPress={onEdit} style={s.inlineCta} scaleTo={0.98}>
            <Text style={s.inlineCtaText}>{R.answered ? '나머지 모습도 골라서 맞춰 보기' : `${name}의 평소 모습 골라서 맞춰 보기`}</Text>
            <Icon name="chevronRight" size={14} color={colors.accent} />
          </PressableScale>
        ) : null}
      </View>

      <Section number="03" title="우리 사이" />
      <View style={{ gap: 12 }}>
        <View style={s.card}>
          <Text style={s.memoLabel}>{name}에게 나는</Text>
          <Text style={s.body}>{R.meToPet}</Text>
          <Text style={[s.memoLabel, { marginTop: 12 }]}>나에게 {name}{josa(name, '은', '는')}</Text>
          <Text style={s.body}>{R.petToMe}</Text>
        </View>
        {R.points.map(p => (
          <View key={p.kind} style={[s.card, p.kind === 'fill' && s.fill]}>
            <Text style={s.cardTitle}>{p.title}</Text>
            <Text style={s.body}>{p.text}</Text>
          </View>
        ))}
      </View>

      <Section number="04" title="함께하면 좋은 것" />
      <View style={s.card}>
        <Text style={s.cardTitle}>{name}{josa(name, '이', '')}가 좋아할 놀이</Text>
        {R.play.map((p, i) => <Text key={p} style={s.listItem}>{i + 1}. {p}</Text>)}
        {R.goodDays.length ? (
          <>
            <Text style={[s.cardTitle, { marginTop: 16 }]}>함께 놀기 좋은 날</Text>
            <View style={s.days}>{R.goodDays.map(d => <View key={d} style={s.day}><Text style={s.dayText}>{md(d)}</Text></View>)}</View>
          </>
        ) : null}
      </View>
      <View style={[s.card, { marginTop: 12 }]}>
        <Text style={s.cardTitle}>이렇게 챙겨 주세요</Text>
        <Text style={s.body}>{R.pet.care}</Text>
        <Text style={s.note}>성향을 바탕으로 한 생활 팁이에요. 건강이 걱정되면 꼭 수의사 선생님과 상담해 주세요.</Text>
      </View>

      <ShareActions spec={spec} title={`${name}${josa(name, '과', '와')}의 궁합 자랑하기`} outlined marginTop={16} />

      <View style={[s.card, { marginTop: 16 }]}>
        <Text accessibilityRole="header" style={s.cardTitle}>이 결과는 어떻게 만들었나요?</Text>
        <Text style={s.body}>아이의 생일(모르면 가족이 된 날)로 년·월·일 세 기둥을 세워 타고난 기운을 보고, 내 사주의 일간·일지·띠와 겹쳐 궁합 유형을 정했어요. 태어난 시간은 쓰지 않아요. 재미로 보는 콘텐츠이고, 아이의 실제 성격은 함께 지내며 알아가는 게 가장 정확해요.</Text>
      </View>

      <View style={s.manage}>
        <PressableScale onPress={onEdit} hitSlop={8}><Text style={s.manageLink}>{name} 정보 고치기</Text></PressableScale>
        <Text style={s.manageDot}>·</Text>
        <PressableScale onPress={() => setConfirm(true)} hitSlop={8}><Text style={s.manageLink}>{name} 지우기</Text></PressableScale>
      </View>
      <Disclaimer compact />
      <BottomSheet visible={confirm} onClose={() => setConfirm(false)}>
        <Text style={[txt.h2, { textAlign: 'center' }]}>{name} 정보를 지울까요?</Text>
        <Text style={[txt.small, { textAlign: 'center', marginTop: 8 }]}>등록한 정보와 궁합 결과가 바로 지워져요.</Text>
        <PrimaryButton label="지우기" onPress={remove} style={{ marginTop: 20 }} />
        <PrimaryButton label="취소" variant="soft" onPress={() => setConfirm(false)} style={{ marginTop: 8 }} />
      </BottomSheet>
    </Screen>
  );
}

/* ---------- 입력 ---------- */
function PetForm({ u, before, first, onCancel, onSaved }: {
  u: User; before: Pet | null; first: boolean; onCancel?(): void; onSaved(pet: Pet): void;
}) {
  const { today } = useApp();
  const { toast } = usePremium();
  const [name, setName] = useState(before?.name ?? '');
  const [species, setSpecies] = useState<PetSpecies | null>(before?.species ?? null);
  // 생일을 아는지 — 모르면 가족이 된 날로 본다
  const [knowsBirth, setKnowsBirth] = useState<boolean | null>(before ? !!before.birthDate : null);
  const [birth, setBirth] = useState(toDigits(before?.birthDate ?? null));
  const [estimated, setEstimated] = useState(before?.birthDateIsEstimated ?? false);
  const [adopted, setAdopted] = useState(toDigits(before?.adoptedDate ?? null));
  const [gender, setGender] = useState<'male' | 'female' | null>(before?.gender ?? null);
  const [traits, setTraits] = useState<PetTraits>(before?.traits ?? {});
  const [busy, setBusy] = useState(false);

  const check = (digits: string) => {
    const b = checkBirth(digits, 'solar');
    return { ...b, ok: b.ok && b.iso >= OLDEST && b.iso <= today };
  };
  const b = check(birth), a = check(adopted);
  const birthOk = knowsBirth === true && b.ok;
  // 가족이 된 날은 생일을 알면 선택, 모르면 필수
  const adoptedOk = adopted ? a.ok && (!birthOk || a.iso >= b.iso) : knowsBirth === true;
  const dateOk = knowsBirth === true ? birthOk && adoptedOk : knowsBirth === false && a.ok;
  const ok = !!name.trim() && !!species && dateOk;
  const missing = [
    !name.trim() && '이름',
    !species && '어떤 아이',
    knowsBirth === null ? '생일을 아는지' : !dateOk && (knowsBirth ? '생일' : '가족이 된 날'),
  ].filter(Boolean) as string[];
  const started = !!name.trim() || !!species || knowsBirth !== null;
  useEffect(() => { if (b.ok || a.ok) Keyboard.dismiss(); }, [b.ok, a.ok]);

  const save = async () => {
    if (!ok || busy) return;
    const input: PetInput = {
      name: name.trim(), species: species!, gender,
      birthDate: knowsBirth ? b.iso : null,
      birthDateIsEstimated: !!knowsBirth && estimated,
      adoptedDate: adopted && a.ok ? a.iso : null,
      traits,
    };
    setBusy(true);
    try {
      const saved = before ? await petApi.update(before.id, input) : await petApi.create(input);
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
          <PrimaryButton label={busy ? '보는 중…' : before ? '고친 정보로 다시 보기' : '궁합 보기'} onPress={save} disabled={!ok || busy} />
        </>
      )}
    >
      {first ? (
        <>
          <View style={s.introMeta}><Text style={s.kicker}>우리 집 반려동물</Text><Text style={txt.caption}>무료 · 여러 마리 등록 가능</Text></View>
          <View style={s.introHead}>
            <Text style={s.introTitle}>댕냥이와 나,{'\n'}어떤 사이일까?</Text>
            <Mascot name="soon-pet" size={72} />
          </View>
          <Text style={s.introBody}>{u.nickname}님의 사주와 아이의 생일로 타고난 성격, 둘의 궁합 유형, 함께하면 좋은 놀이까지 알려 드려요. 생일을 몰라도 가족이 된 날로 볼 수 있어요.</Text>
        </>
      ) : (
        <Text style={[s.introTitle, { fontSize: 22, lineHeight: 30, marginTop: 12 }]}>{before ? `${before.name} 정보 고치기` : '새 아이 등록하기'}</Text>
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
            <Pick label="몰라요" selected={knowsBirth === false} onPress={() => { setKnowsBirth(false); setEstimated(false); }} />
          </View>
          {knowsBirth === false ? <Text style={[txt.small, { marginTop: 8 }]}>괜찮아요. 가족이 된 날의 기운으로 둘의 인연을 볼게요.</Text> : null}
        </View>

        {knowsBirth === true ? (
          <View>
            <Label>생일 (양력)</Label>
            <DateField digits={birth} onChange={setBirth} label="생일" check={b} />
            <PressableScale onPress={() => setEstimated(v => !v)} style={s.checkRow} accessibilityRole="checkbox" accessibilityState={{ checked: estimated }}>
              <View style={[s.checkBox, estimated && s.checkOn]}>{estimated ? <Icon name="check" size={12} color={colors.white} /> : null}</View>
              <Text style={s.checkText}>정확하지 않아요 (대략 짐작한 날짜예요)</Text>
            </PressableScale>
          </View>
        ) : null}

        {knowsBirth !== null ? (
          <View>
            <Label>{knowsBirth ? '가족이 된 날 (선택)' : '가족이 된 날'}</Label>
            <DateField digits={adopted} onChange={setAdopted} label="가족이 된 날" check={a} />
            {adopted && a.ok && birthOk && a.iso < b.iso ? <Text style={s.error}>생일보다 앞선 날이에요.</Text> : null}
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
          <Label>평소 모습 (선택)</Label>
          <Text style={[txt.small, { marginTop: -4, marginBottom: 10 }]}>고르면 사주로 본 모습과 얼마나 같은지 맞춰 봐요.</Text>
          <View style={{ gap: 10 }}>
            {AXES.map(axis => (
              <View key={axis} style={s.traitPick}>
                <Text style={s.traitPickLabel}>{TRAITS[axis][0]}</Text>
                <View style={[s.row, { flex: 1 }]}>
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
  traitPick: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  traitPickLabel: { ...sansW('600'), width: 84, fontSize: 13, letterSpacing: -0.5, color: colors.inkSub },
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
  traitRow: { gap: 6 },
  traitHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  traitLabel: { ...sansW('700'), fontSize: 14, letterSpacing: -0.56, color: INK },
  traitChips: { flexDirection: 'row', gap: 6 },
  sajuChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.surface },
  sajuChipText: { ...sansW('600'), fontSize: 11, color: colors.inkSub },
  ownerChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.lineStrong },
  matchChip: { backgroundColor: colors.accent, borderColor: colors.accent },
  ownerChipText: { ...sansW('600'), fontSize: 11, color: colors.inkSub },
  inlineCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 16, paddingVertical: 10, borderRadius: 6, backgroundColor: colors.surface },
  inlineCtaText: { ...sansW('600'), fontSize: 13, letterSpacing: -0.5, color: colors.accent },
  listItem: { ...sansW('400'), fontSize: 13, lineHeight: 22, letterSpacing: -0.65, color: INK, ...TIGHT },
  days: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  day: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: colors.surface },
  dayText: { ...sansW('600'), fontSize: 13, color: INK, fontVariant: ['tabular-nums'] },
  note: { ...sansW('400'), fontSize: 12, lineHeight: 17, letterSpacing: -0.6, color: colors.inkMute, marginTop: 8, ...TIGHT },
  manage: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24 },
  manageLink: { ...sansW('700'), fontSize: 12, lineHeight: 20, letterSpacing: -0.48, color: colors.inkMute, textDecorationLine: 'underline' },
  manageDot: { color: colors.inkMute },
});
