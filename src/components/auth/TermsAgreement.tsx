import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PressableScale from '../PressableScale';
import { CheckRow } from './AuthKit';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/typography';

export type AgreeKey = 'age' | 'terms' | 'privacy' | 'marketing';
export type Agreements = Record<AgreeKey, boolean>;
export const NO_AGREEMENTS: Agreements = { age: false, terms: false, privacy: false, marketing: false };

const AGREES: { k: AgreeKey; label: string; required: boolean }[] = [
  { k: 'age', label: '[필수] 만 14세 이상이에요', required: true },
  { k: 'terms', label: '[필수] 서비스 이용약관', required: true },
  { k: 'privacy', label: '[필수] 개인정보 수집·이용', required: true },
  { k: 'marketing', label: '[선택] 아침 운세·이벤트 알림 받기', required: false },
];
const DOC: Partial<Record<AgreeKey, string>> = {
  terms: '운세 콘텐츠는 재미와 참고를 위한 것이며 중요한 결정의 근거가 될 수 없어요. 알은 콘텐츠 열람에만 쓸 수 있어요.',
  privacy: '항목: 이메일, 닉네임, 생년월일·출생시간, 성별, MBTI, 고민 상담 글 · 목적: 맞춤 운세·상담 제공 · 보관: 회원 탈퇴 시까지 (고민 상담은 1년) · 고민 상담 글은 답변 작성을 위해 Anthropic(미국)에 전달돼요',
};

export const requiredAgreed = (a: Agreements) => AGREES.filter(x => x.required).every(x => a[x.k]);

/** 가입 약관 동의 목록 (이메일 가입 시트 · 소셜 가입 마무리 화면) */
export default function TermsAgreement({ value, onChange, onOpenDoc }: {
  value: Agreements;
  onChange: (next: Agreements) => void;
  /** 전문 보기 */
  onOpenDoc: (doc: 'terms' | 'privacy') => void;
}) {
  const [doc, setDoc] = useState<AgreeKey | null>(null);
  const allAgree = AGREES.every(a => value[a.k]);
  return (
    <>
      <PressableScale onPress={() => { const v = !allAgree; onChange({ age: v, terms: v, privacy: v, marketing: v }); }} style={[s.all, allAgree && s.allOn]} scaleTo={0.98} accessibilityRole="checkbox" accessibilityState={{ checked: allAgree }}>
        <Text style={[s.allText, allAgree && { color: colors.white }]}>{allAgree ? '✓ ' : ''}전체 동의하기</Text>
      </PressableScale>
      <View style={{ marginTop: 6 }}>
        {AGREES.map(a => (
          <CheckRow key={a.k} checked={value[a.k]} label={a.label} onPress={() => onChange({ ...value, [a.k]: !value[a.k] })} onView={DOC[a.k] ? () => setDoc(d => (d === a.k ? null : a.k)) : undefined} />
        ))}
        {doc && DOC[doc] ? (
          <View style={s.docBox}>
            <Text style={s.doc}>{DOC[doc]}</Text>
            <PressableScale onPress={() => onOpenDoc(doc === 'privacy' ? 'privacy' : 'terms')} hitSlop={8}>
              <Text style={s.docLink}>전문 보기 →</Text>
            </PressableScale>
          </View>
        ) : null}
      </View>
    </>
  );
}

const s = StyleSheet.create({
  all: { marginTop: 16, height: 52, borderRadius: radius.md, borderWidth: 1, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  allOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  allText: { fontSize: 15, fontWeight: '700', color: colors.ink },
  docBox: { marginTop: 8, padding: 12, borderRadius: 10, backgroundColor: colors.cream },
  doc: { fontSize: 12, lineHeight: 18, color: colors.inkSub },
  docLink: { fontSize: 12, fontWeight: '700', color: colors.purple, marginTop: 6 },
});
