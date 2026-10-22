import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PressableScale from './PressableScale';
import OptionChip from './OptionChip';
import TextField from './TextField';
import { CheckRow } from './auth/AuthKit';
import { colors } from '../theme/colors';
import { radius, txt } from '../theme/typography';
import { formatKoreanDate, isValidDate } from '../utils/date';

/** 생년월일·태어난 시간 입력 — 프로필과 궁합 상대 입력이 함께 쓴다 */

export type CalendarType = 'solar' | 'lunar';

/**
 * 시진 — 서버는 서울 평균태양시(KST −32분)로 시주를 정하니, 시계 기준 경계는 :30.
 * 칩을 고르면 그 시진의 가운데 시각을 보낸다. 자시는 날짜가 갈리므로 자정 전·후를 한 번 더 묻는다.
 */
export const SIJIN = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'].map((n, b) => {
  const hm = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
  const start = (b * 120 + 1410) % 1440;
  return { label: `${n}시`, range: `${hm(start)}~${hm(start + 120)}`, time: hm(b * 120 + 30) };
});
export const JASI_TIME = { before: '23:45', after: '00:30' } as const;
export type JasiSide = keyof typeof JASI_TIME;

/** 고른 시진 → 서버에 보낼 "HH:mm" (자시는 자정 전·후를 골라야 정해진다) */
export const sijinTime = (b: number, jasi: JasiSide | null) => (b === 0 ? JASI_TIME[jasi ?? 'after'] : SIJIN[b].time);

/** "HH:mm"이 칩이 보내는 시각이면 그 칩으로 되살린다 */
export function sijinOf(t: string): { sijin: number; jasi: JasiSide | null } | null {
  if (t === JASI_TIME.before || t === JASI_TIME.after) return { sijin: 0, jasi: t === JASI_TIME.before ? 'before' : 'after' };
  const b = SIJIN.findIndex(x => x.time === t);
  return b > 0 ? { sijin: b, jasi: null } : null;
}

/** 접은 줄에 보이는 시진 이름 */
export const sijinLabel = (b: number, jasi: JasiSide | null) =>
  (b === 0 ? `자시 · 자정 ${jasi === 'before' ? '전' : '후'}` : `${SIJIN[b].label} (${SIJIN[b].range})`);

/** 숫자만 받아 "1995. 03. 15" / "14:30" 모양으로 */
export const fmtDate = (v: string) => v.slice(0, 4) + (v.length > 4 ? `. ${v.slice(4, 6)}` : '') + (v.length > 6 ? `. ${v.slice(6)}` : '');
export const fmtTime = (v: string) => v.slice(0, 2) + (v.length > 2 ? `:${v.slice(2)}` : '');

/** 8자리 숫자 생년월일 확인. 음력은 날짜 범위만 보고, 실제로 있는 날인지는 서버가 확인한다 (INVALID_BIRTH_DATE) */
export function checkBirth(digits: string, calendar: CalendarType) {
  const [y, m, d] = [Number(digits.slice(0, 4)), Number(digits.slice(4, 6)), Number(digits.slice(6, 8))];
  const filled = digits.length === 8;
  const ok = filled && (calendar === 'lunar' ? y >= 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 30 : isValidDate(y, m, d));
  const iso = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  return { y, m, d, filled, ok, iso };
}

/** 라벨 옆 양력/음력 토글 + 8자리 생년월일 칸 + 확인 문구 (+ 음력이면 윤달) */
export function BirthDateField({ label, digits, onChange, calendar, onCalendar, leap, onLeap, autoFocus, compact }: {
  label: React.ReactNode; digits: string; onChange(v: string): void;
  calendar: CalendarType; onCalendar(c: CalendarType): void; leap: boolean; onLeap(v: boolean): void; autoFocus?: boolean;
  /** 회색 카드 안의 낮은 칸 · 작은 양력/음력 (궁합 상대 입력) */
  compact?: boolean;
}) {
  const b = checkBirth(digits, calendar);
  return (
    <>
      <View style={s.head}>
        <View style={{ flex: 1 }}>{label}</View>
        <View style={[s.seg, compact && s.segCompact]} accessibilityRole="radiogroup">
          {(['solar', 'lunar'] as const).map(c => (
            <PressableScale key={c} onPress={() => { onCalendar(c); if (c === 'solar') onLeap(false); }} scaleTo={0.96} style={[s.segItem, compact && s.segItemCompact, calendar === c && s.segOn]}
              accessibilityRole="radio" accessibilityState={{ selected: calendar === c }}>
              <Text style={[s.segText, compact && s.segTextCompact, calendar === c && { color: colors.ink }]}>{c === 'solar' ? '양력' : '음력'}</Text>
            </PressableScale>
          ))}
        </View>
      </View>
      <TextField value={fmtDate(digits)} onChangeText={t => onChange(t.replace(/\D/g, '').slice(0, 8))} placeholder="1995. 03. 15" keyboardType="number-pad" maxLength={12}
        autoFocus={autoFocus} compact={compact} style={compact ? undefined : s.bigInput} invalid={b.filled && !b.ok} accessibilityLabel={`생년월일 8자리${calendar === 'lunar' ? ', 음력' : ''}`} />
      {b.filled && !b.ok ? <Text style={s.error}>1900년 이후의 실제 날짜를 입력해 주세요.</Text>
        : b.ok ? <Text style={s.ok}>✓ {calendar === 'solar' ? formatKoreanDate(b.iso) : `음력 ${b.y}년 ${b.m}월 ${b.d}일${leap ? ' (윤달)' : ''}`}</Text>
          : null}
      {calendar === 'lunar' ? (
        <View style={{ marginTop: 8 }}>
          <CheckRow checked={leap} label="윤달이에요" onPress={() => onLeap(!leap)} />
        </View>
      ) : null}
    </>
  );
}

/** 12시진 칩 (3열) — 자시를 고르면 자정 전·후를 한 번 더 묻는다 */
export function SijinGrid({ sijin, jasi, onPick, onJasi }: { sijin: number | null; jasi: JasiSide | null; onPick(b: number): void; onJasi(side: JasiSide): void }) {
  return (
    <>
      <View style={s.grid}>
        {SIJIN.map((x, b) => (
          <OptionChip key={x.label} compact style={s.cell} label={x.label} sub={x.range} selected={sijin === b} onPress={() => onPick(b)} />
        ))}
      </View>
      {sijin === 0 ? (
        <>
          <Text style={[txt.caption, { marginTop: 12, marginBottom: 8 }]}>자시는 자정을 사이에 두고 날짜가 바뀌어요. 언제였나요?</Text>
          <View style={s.row}>
            <OptionChip compact style={{ flex: 1 }} label="자정 전" sub="23:30~24:00" selected={jasi === 'before'} onPress={() => onJasi('before')} />
            <OptionChip compact style={{ flex: 1 }} label="자정 후" sub="00:00~01:30" selected={jasi === 'after'} onPress={() => onJasi('after')} />
          </View>
        </>
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { flexGrow: 1, flexBasis: '30%' },
  bigInput: { fontSize: 20, letterSpacing: 0.5 },
  ok: { color: colors.success, fontSize: 12, fontWeight: '600', marginTop: 8 },
  error: { color: colors.danger, fontSize: 12, marginTop: 8 },
  seg: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.sm, padding: 3, gap: 2 },
  segItem: { paddingHorizontal: 14, height: 30, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.lineStrong },
  segCompact: { backgroundColor: 'transparent', padding: 0, gap: 4 },
  segItemCompact: { height: 22, paddingHorizontal: 8 },
  segTextCompact: { fontSize: 11, fontWeight: '400', letterSpacing: -0.55, color: '#999999' },
  segText: { fontSize: 13, fontWeight: '600', color: colors.inkMute },
});
