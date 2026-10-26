import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BottomSheet from './BottomSheet';
import Mascot from './Mascot';
import { Amount } from './Amount';
import PrimaryButton from './PrimaryButton';
import { usePremium } from '../context/PremiumContext';
import { fmtP } from '../services/premium/catalog';
import { colors } from '../theme/colors';
import { radius, txt } from '../theme/typography';

/** 가입하고 처음 메인에 오면 가입 축하 알을 받았다고 한 번 알려 준다. hidden: 다른 시트가 떠 있는 동안 미룬다 */
export default function WelcomeBonusSheet({ hidden }: { hidden?: boolean }) {
  const { welcomeBonus, points, dismissWelcomeBonus } = usePremium();
  return (
    <BottomSheet visible={welcomeBonus > 0 && !hidden} onClose={dismissWelcomeBonus}>
      <View style={s.body}>
        <Mascot name="coin" size={96} />
        <Text style={[txt.caption, s.center, { marginTop: 8 }]}>가입 선물</Text>
        <Text style={[txt.h2, s.center, { marginTop: 4 }]}>가입 축하 {fmtP(welcomeBonus)}을 드렸어요</Text>
        <Text style={[txt.small, s.center, { marginTop: 4 }]}>궁금한 풀이를 열 때 써 보세요{'\n'}받은 알은 1년 동안 쓸 수 있어요</Text>
        <View style={s.box}>
          <Text style={txt.small}>지금 보유한 알</Text>
          <Amount value={points} size={15} style={s.val} />
        </View>
      </View>
      <PrimaryButton label="고마워요" onPress={dismissWelcomeBonus} />
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  body: { alignItems: 'center' },
  center: { textAlign: 'center' },
  box: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.cream, borderRadius: radius.lg, padding: 16, marginTop: 18, marginBottom: 14 },
  val: { fontSize: 15, fontWeight: '700', color: colors.purple },
});
