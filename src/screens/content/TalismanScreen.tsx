import React, { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../../components/Screen';
import Mascot, { Logo } from '../../components/Mascot';
import ShareActions from '../../components/ShareActions';
import { InfoRows, SubHead } from '../../components/premium/Kit';
import { useApp } from '../../context/AppContext';
import { useFreeContent } from '../../services/server/contentApi';
import LoadingScreen from '../../components/LoadingScreen';
import { formatKoreanDate } from '../../utils/date';
import { fonts, txt } from '../../theme/typography';
import { talismanSpec } from '../../services/share/shareSpecs';
import FriendCompare from '../../components/FriendCompare';

/** 부적 카드는 모드와 상관없이 밝은 노란 종이 */
const INK = '#C4402B';

/** 무료: 매일 바뀌는 오늘의 부적 */
export default function TalismanScreen() {
  const { user: u, today } = useApp();
  const card = useRef<View>(null);
  const q = useFreeContent('talisman');
  if (!u) return null;
  if (!q.data) return <LoadingScreen title="오늘의 부적" error={q.error} onRetry={q.refetch} />;
  const t = q.data;

  return (
    <Screen title="오늘의 부적" back>
      <FriendCompare route="Talisman" spec={talismanSpec(u, t)} />
      <View style={{ alignItems: 'center' }}>
        <View ref={card} collapsable={false} style={s.paperWrap}>
          <LinearGradient colors={['#FFF3B8', '#FFFBE6']} style={s.paper}>
            <Text style={s.top}>{formatKoreanDate(today)}</Text>
            <View style={s.charm}>
              <Text style={s.hanja}>{t.hanja}</Text>
            </View>
            <Text style={s.mantra}>{t.mantra}</Text>
            <View style={s.keyword}><Text style={s.keywordText}>{u.nickname} · 오늘의 {t.keyword}</Text></View>
            <Mascot name="talisman" size={56} style={s.art} />
            <View style={s.brand}><Logo height={20} color="#3A2C10" /></View>
          </LinearGradient>
        </View>
      </View>
      <ShareActions spec={talismanSpec(u, t)} />

      <SubHead title="부적과 함께하는 행운" caption="매일 자정에 새 부적으로 바뀌어요" />
      <InfoRows labelWidth={100} rows={[['色', '행운의 색', t.color], ['數', '행운의 숫자', String(t.number)], ['時', '행운의 시간', t.time.replace('~', ' – ')]]} />
      <Text style={[txt.caption, { textAlign: 'center', marginTop: 16 }]}>휴대폰 배경화면으로 저장해 두고 하루를 시작해 보세요.</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  paperWrap: { width: 260, aspectRatio: 0.62, marginTop: 4, borderRadius: 16, backgroundColor: '#FFF3B8', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  paper: { flex: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', padding: 20, overflow: 'hidden' },
  top: { position: 'absolute', top: 16, fontSize: 11, fontWeight: '600', color: '#8A6A2A' },
  charm: { width: 150, height: 150, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: INK + '55' },
  hanja: { fontFamily: fonts.serif, fontSize: 96, lineHeight: 112, fontWeight: '700', color: INK },
  mantra: { fontSize: 15, lineHeight: 22, color: '#3A2C10', textAlign: 'center', fontWeight: '700', letterSpacing: -0.5, marginTop: 18 },
  keyword: { marginTop: 10, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, borderWidth: 0.5, borderColor: INK },
  keywordText: { fontSize: 11, fontWeight: '600', color: INK },
  art: { position: 'absolute', left: 12, bottom: 10 },
  brand: { position: 'absolute', right: 14, bottom: 14 },
});
