import React, { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../../components/Screen';
import ShareActions from '../../components/ShareActions';
import { InfoRows, SubHead } from '../../components/premium/Kit';
import { useApp } from '../../context/AppContext';
import { todayTalisman } from '../../services/content/freeContent';
import { formatKoreanDate } from '../../utils/date';
import { fonts, txt } from '../../theme/typography';
import { talismanSpec } from '../../services/share/shareSpecs';
import FriendCompare from '../../components/FriendCompare';

const PAPER = '#EED9A4';
const INK = '#A5321F';

/** 무료: 매일 바뀌는 오늘의 부적 */
export default function TalismanScreen() {
  const { user: u, today } = useApp();
  const card = useRef<View>(null);
  if (!u) return null;
  const t = todayTalisman(u, today);

  return (
    <Screen title="오늘의 부적" back>
      <FriendCompare route="Talisman" spec={talismanSpec(u, today)} />
      <View style={{ alignItems: 'center' }}>
        <View ref={card} collapsable={false} style={s.paper}>
          <View style={s.frame}>
            <Text style={s.top}>{formatKoreanDate(today)}</Text>
            <Text style={s.hanja}>{t.hanja}</Text>
            <View style={s.line} />
            <Text style={s.mantra}>{t.mantra}</Text>
            <Text style={s.meta}>{u.nickname} · 오늘의 {t.keyword}</Text>
            <View style={s.stamp}><Text style={s.stampText}>운Pick</Text></View>
          </View>
        </View>
      </View>
      <ShareActions spec={talismanSpec(u, today)} />

      <SubHead title="부적과 함께하는 행운" caption="매일 자정에 새 부적으로 바뀌어요" />
      <InfoRows labelWidth={100} rows={[['色', '행운의 색', t.color], ['數', '행운의 숫자', String(t.number)], ['時', '행운의 시간', t.time.replace('~', ' – ')]]} />
      <Text style={[txt.caption, { textAlign: 'center', marginTop: 16 }]}>휴대폰 배경화면으로 저장해 두고 하루를 시작해 보세요.</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  paper: { width: 260, aspectRatio: 0.62, backgroundColor: PAPER, padding: 12, marginTop: 4, borderRadius: 4, shadowColor: '#281E0A', shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  frame: { flex: 1, borderWidth: 2, borderColor: INK, alignItems: 'center', justifyContent: 'center', padding: 16 },
  top: { position: 'absolute', top: 14, fontSize: 11, color: INK, opacity: 0.8 },
  hanja: { fontFamily: fonts.serif, fontSize: 120, lineHeight: 140, fontWeight: '700', color: INK },
  line: { width: 40, height: 2, backgroundColor: INK, marginVertical: 14, opacity: 0.7 },
  mantra: { fontFamily: fonts.serif, fontSize: 15, lineHeight: 24, color: '#3A2410', textAlign: 'center', fontWeight: '600' },
  meta: { fontSize: 11, color: INK, marginTop: 12, opacity: 0.8 },
  stamp: { position: 'absolute', bottom: 14, right: 14, borderWidth: 1.5, borderColor: INK, paddingHorizontal: 5, paddingVertical: 3, transform: [{ rotate: '-8deg' }] },
  stampText: { fontFamily: fonts.serif, fontSize: 11, color: INK, fontWeight: '700' },
});

