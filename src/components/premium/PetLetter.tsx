import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PressableScale from '../PressableScale';
import Reveal from '../Reveal';
import SolidIcon from '../SolidIcon';
import { deviceKey } from '../../services/storage/storageService';
import { useSharedView } from '../../context/SharedViewContext';
import { colors, isDark } from '../../theme/colors';
import { radius, sansW } from '../../theme/typography';

/**
 * 열어 본 편지 (기기마다, 아이마다): 연 편지의 첫머리를 저장해, 편지가 새로 쓰이면(이름·호칭을 바꾸면) 봉투부터 다시 보인다.
 * 기기를 바꾸면 봉투부터 다시 보여도 괜찮다
 */
const KEY = (petId: number) => deviceKey(`pet-letter:${petId}`);
const LINE_H = 28;
const stampOf = (letter: string) => letter.slice(0, 40);

/**
 * 편지 본문을 문단으로 나눈다. 문단 사이는 빈 줄 하나(줄 노트 한 칸)로 띄운다.
 * 줄바꿈 없이 이어 쓴 예전 편지는 문장을 2~3개씩 묶어 나눈다.
 */
export function paragraphsOf(letter: string): string[] {
  const lines = letter.split(/\n+/).map(l => l.trim()).filter(Boolean);
  if (lines.length > 1) return lines;
  const sentences = (letter.match(/[^.!?~]+[.!?~]+["')]*\s*|[^.!?~]+$/g) ?? []).map(t => t.trim()).filter(Boolean);
  if (sentences.length < 4) return [letter.trim()];
  const size = Math.ceil(sentences.length / Math.ceil(sentences.length / 3));
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i += size) out.push(sentences.slice(i, i + size).join(' '));
  return out;
}

/**
 * 아이가 보내는 편지 — 처음엔 봉투로 닫혀 있고, 열면 줄 노트 편지지에 펼쳐진다.
 * owner는 받는 사람으로 적을 말 (고른 호칭, 없으면 닉네임님). letter가 없으면(쓰는 중) 봉투만 보이고 열 수 없다.
 */
export default function PetLetter({ petId, name, owner, letter }: { petId: number; name: string; owner: string; letter: string | null }) {
  // null: 아직 읽는 중 (깜빡임 없이 봉투·편지 중 하나만 그린다)
  const [opened, setOpened] = useState<boolean | null>(null);
  const [justOpened, setJustOpened] = useState(false);
  // 공유 링크로 연 화면은 봉투 없이 편지를 펼쳐 둔다 (인쇄 · PDF에도 그대로 담기게)
  const shared = !!useSharedView();
  useEffect(() => {
    let live = true;
    AsyncStorage.getItem(KEY(petId)).then(v => live && setOpened(!!letter && v === stampOf(letter))).catch(() => live && setOpened(false));
    return () => { live = false; };
  }, [petId, letter]);
  if (shared && letter) return <Paper name={name} owner={owner} letter={letter} />;
  if (opened === null) return null;

  if (!opened || !letter) {
    const open = () => {
      if (!letter) return;
      setOpened(true);
      setJustOpened(true);
      AsyncStorage.setItem(KEY(petId), stampOf(letter)).catch(() => {});
    };
    return <Envelope name={name} ready={!!letter} onOpen={open} />;
  }
  const paper = <Paper name={name} owner={owner} letter={letter} />;
  return justOpened ? <Reveal>{paper}</Reveal> : paper;
}

function Envelope({ name, ready, onOpen }: { name: string; ready: boolean; onOpen(): void }) {
  const [w, setW] = useState(0);
  return (
    <PressableScale onPress={onOpen} disabled={!ready} scaleTo={0.98} style={s.envelope}
      accessibilityRole="button" accessibilityLabel={ready ? `${name}의 편지 열어보기` : '편지를 쓰고 있어요'}>
      <View onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)} style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* 봉투 덮개 — 위에서 가운데로 내려오는 삼각형 */}
        {w ? <View style={[s.flap, { borderLeftWidth: w / 2, borderRightWidth: w / 2 }]} /> : null}
      </View>
      <View style={s.seal}><SolidIcon name="heart" size={18} color={colors.white} /></View>
      <Text style={s.envTitle}>{name}의 편지가 도착했어요</Text>
      <Text style={s.envSub}>{ready ? '봉투를 열면 이 아이의 마음이 담겨 있어요' : '편지를 쓰고 있어요. 조금만 기다려 주세요'}</Text>
      {ready ? <View style={s.openBtn}><Text style={s.openText}>편지 열어보기</Text></View> : null}
    </PressableScale>
  );
}

function Paper({ name, owner, letter }: { name: string; owner: string; letter: string }) {
  const [h, setH] = useState(0);
  return (
    <View style={s.paper}>
      <Text style={s.to}>To. {owner}</Text>
      <View onLayout={e => setH(e.nativeEvent.layout.height)}>
        {/* 줄 노트 — 글줄 높이마다 옅은 선 */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {Array.from({ length: Math.ceil(h / LINE_H) }, (_, i) => <View key={i} style={[s.rule, { top: (i + 1) * LINE_H - 4 }]} />)}
        </View>
        <Text style={s.body}>{paragraphsOf(letter).join('\n\n')}</Text>
      </View>
      <Text style={s.from}>From. {name}</Text>
    </View>
  );
}

const PAPER = isDark ? '#2B2A26' : '#FFFDF6';
const KRAFT = isDark ? colors.moneyBg : '#FBEFD9';
const FLAP = isDark ? '#3A3226' : '#F4E1BE';
const RULE = isDark ? '#3B3933' : '#EFE5D0';
const INK = isDark ? colors.ink : '#3A3228';
const TIGHT = Platform.OS === 'android' ? { includeFontPadding: false } : {};
const s = StyleSheet.create({
  envelope: { alignItems: 'center', paddingTop: 56, paddingBottom: 22, paddingHorizontal: 20, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: KRAFT, borderWidth: 1, borderColor: FLAP },
  flap: { width: 0, height: 0, borderTopWidth: 64, borderTopColor: FLAP, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  seal: { width: 44, height: 44, borderRadius: 22, marginTop: -28, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8735A', borderWidth: 3, borderColor: KRAFT },
  envTitle: { ...sansW('700'), fontSize: 16, lineHeight: 21, letterSpacing: -0.6, color: INK, marginTop: 14, textAlign: 'center', ...TIGHT },
  envSub: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.5, color: colors.inkMute, marginTop: 6, textAlign: 'center', ...TIGHT },
  openBtn: { marginTop: 16, paddingHorizontal: 20, height: 38, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy },
  openText: { ...sansW('600'), fontSize: 14, color: colors.white, letterSpacing: -0.3 },
  paper: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 18, borderRadius: radius.lg, backgroundColor: PAPER, borderWidth: 1, borderColor: RULE,
    shadowColor: '#8A6A3A', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  to: { ...sansW('600'), fontSize: 14, lineHeight: LINE_H, color: INK, letterSpacing: -0.4 },
  rule: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: RULE },
  body: { ...sansW('400'), fontSize: 15, lineHeight: LINE_H, letterSpacing: -0.4, color: INK },
  from: { ...sansW('600'), fontSize: 14, lineHeight: LINE_H, color: INK, letterSpacing: -0.4, textAlign: 'right', marginTop: 8 },
});
