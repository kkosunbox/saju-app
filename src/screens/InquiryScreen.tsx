import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@/navigation/compat';
import Screen from '../components/Screen';
import TextField from '../components/TextField';
import OptionChip from '../components/OptionChip';
import PrimaryButton from '../components/PrimaryButton';
import { FieldError, FieldLabel } from '../components/auth/AuthKit';
import { usePremium } from '../context/PremiumContext';
import { INQUIRY_CATEGORIES, INQUIRY_MAX, InquiryCategory, inquiryApi } from '../services/server/inquiryApi';
import { txt } from '../theme/typography';

/** 1:1 문의: 카테고리를 고르고 내용을 적어 보낸다 */
export default function InquiryScreen() {
  const nav = useNavigation();
  const { toast } = usePremium();
  const [category, setCategory] = useState<InquiryCategory | null>(null);
  const [content, setContent] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const can = !!category && content.trim().length > 0 && !busy;
  const send = async () => {
    if (!can) return;
    setBusy(true); setErr(null);
    try {
      await inquiryApi.create(category, content.trim());
      toast('문의를 보냈어요. 꼼꼼히 확인할게요');
      nav.goBack();
    } catch { setErr('문의를 보내지 못했어요. 잠시 후 다시 시도해 주세요.'); setBusy(false); }
  };

  return (
    <Screen
      title="문의하기"
      back
      footer={<PrimaryButton label={busy ? '보내는 중…' : '문의 보내기'} onPress={send} disabled={!can} />}
    >
      <Text style={[txt.title, { marginTop: 8 }]}>{'무엇이든\n편하게 알려주세요'}</Text>
      <Text style={[txt.small, { marginTop: 6 }]}>보내 주신 내용은 운영팀이 직접 읽고 확인해요.</Text>

      <View style={{ marginTop: 28 }}>
        <FieldLabel>문의 유형</FieldLabel>
        <View style={s.grid}>
          {INQUIRY_CATEGORIES.map(c => (
            <OptionChip key={c.key} compact style={s.cell} label={c.label} selected={category === c.key} onPress={() => { setCategory(c.key); setErr(null); }} />
          ))}
        </View>
      </View>

      <View style={{ marginTop: 24 }}>
        <FieldLabel>내용</FieldLabel>
        <TextField
          value={content}
          onChangeText={t => { setContent(t); setErr(null); }}
          placeholder="궁금한 점이나 불편한 점을 자세히 적어 주세요."
          multiline
          maxLength={INQUIRY_MAX}
          style={{ height: 200 }}
          invalid={!!err}
        />
        <Text style={[txt.caption, s.count]}>{content.length} / {INQUIRY_MAX}</Text>
        <FieldError>{err}</FieldError>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { flexBasis: '31%', flexGrow: 1 },
  count: { textAlign: 'right', marginTop: 6 },
});
