import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CombinedFortune } from '../types';
import { categoryTheme, gradients } from '../theme/colors';
import ScoreRing from './ScoreRing';
import Stars from './Stars';
import { Crescent } from './BrandMark';

/** 인스타 스토리 비율(9:16) 공유 카드. 캡처 시에는 애니메이션 없이 최종 값으로 렌더 */
const ShareCard = forwardRef<View, { fortune: CombinedFortune; nickname: string; dateLabel: string }>(({ fortune, nickname, dateLabel }, ref) => (
  <View ref={ref} collapsable={false} style={s.wrap}>
    <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 1 }} style={s.card}>
      <View style={s.brand}><Crescent size={14} color="#FFE3A3" cut="#5A46A8" /><Text style={s.brandText}>오늘나</Text></View>
      <Text style={s.date}>{dateLabel}</Text>
      <Text style={s.title}>{nickname}님의 오늘</Text>
      <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 8 }}>
        <ScoreRing score={fortune.totalScore} size={148} animate={false} label="종합운" />
      </View>
      <Stars score={fortune.totalScore} size={15} />
      <View style={s.row}>
        {(['love', 'money', 'work'] as const).map(k => (
          <View key={k} style={s.cell}>
            <Text style={s.cellLabel}>{categoryTheme[k].emoji} {categoryTheme[k].short}</Text>
            <Text style={s.cellScore}>{fortune[k]}</Text>
          </View>
        ))}
      </View>
      <Text style={s.kwLabel}>오늘의 키워드</Text>
      <Text style={s.kw}>“{fortune.keywords[0]}”</Text>
      <View style={s.footer}><Text style={s.footerText}>오늘나에서 내 운세 확인하기</Text></View>
    </LinearGradient>
  </View>
));

export default ShareCard;

const s = StyleSheet.create({
  wrap: { width: 288, aspectRatio: 9 / 16, borderRadius: 28, overflow: 'hidden' },
  card: { flex: 1, padding: 22, alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  brandText: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: -0.4 },
  date: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 20 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 4, letterSpacing: -0.5 },
  row: { flexDirection: 'row', gap: 8, marginTop: 20 },
  cell: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, paddingVertical: 10, alignItems: 'center' },
  cellLabel: { color: 'rgba(255,255,255,0.72)', fontSize: 11 },
  cellScore: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 2 },
  kwLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 22 },
  kw: { color: '#FFE3A3', fontSize: 24, fontWeight: '800', marginTop: 4, letterSpacing: -0.6 },
  footer: { marginTop: 'auto', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
  footerText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
