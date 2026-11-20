import React, { useEffect, useRef, useState } from 'react';
import { Animated, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import ResultMascot from '../ResultMascot';
import MascotShadow from '../MascotShadow';
import MascotPolish from '../MascotPolish';
import { useMascotPlay } from '../useMascotPlay';
import { getResultMascot, type MascotScores } from '../../utils/resultMascot';
import { colors } from '../../theme/colors';
import { motion, useReducedMotion, useScreenLive } from '../../utils/motion';

const SIZE = 103;
const BOX = 136;
/** 화면을 열거나 한동안 비웠다가 앱으로 돌아왔을 때 이 확률로 졸고 있다 */
const DOZE_CHANCE = 0.06;
/** 이만큼 넘게 앱을 비웠다 돌아와야 졸 수 있다 — 잠깐 나갔다 오면 깨어 있다 */
const DOZE_AWAY_MS = 10 * 60 * 1000;

/**
 * 홈의 말풍선 아래 운알이. 둥실 떠 있다.
 * 아직 안 본 날(sealed)엔 기본 모습에 안내, 누르면 onSealedPress (오늘의 운세 대화로).
 * 본 뒤엔 오늘 점수에 맞는 포즈 — 누를 때마다 튕기며 운세 공개 때의 반짝임을 다시 재생한다 (화면은 넘어가지 않는다).
 * 화면을 열었을 때 가끔 꾸벅꾸벅 졸고 있고, 누르면 깨어난다.
 */
export default function HomeMascot({ sealed, hint, scores, onSealedPress }: { sealed: boolean; hint?: string; scores?: MascotScores; onSealedPress(): void }) {
  const reduced = useReducedMotion();
  const live = useScreenLive();
  const playful = !sealed;
  const play = useMascotPlay(playful, reduced);
  const [y] = useState(() => new Animated.Value(0));

  // 이미 본 날 화면이 열릴 때만 굴린다
  const [dozing, setDozing] = useState(() => playful && Math.random() < DOZE_CHANCE);
  useEffect(() => { if (!playful) setDozing(false); }, [playful]);
  const playfulRef = useRef(playful);
  playfulRef.current = playful;
  useEffect(() => {
    let last = AppState.currentState;
    let leftAt = 0;
    const sub = AppState.addEventListener('change', next => {
      if (last === 'active' && next !== 'active') leftAt = Date.now();
      if (last !== 'active' && next === 'active' && playfulRef.current && Date.now() - leftAt > DOZE_AWAY_MS && Math.random() < DOZE_CHANCE) setDozing(true);
      last = next;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (reduced || !live) { y.setValue(0); return; }
    const a = Animated.loop(Animated.sequence([
      Animated.timing(y, { toValue: -6, duration: 1400, easing: motion.easeInOut, useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 1400, easing: motion.easeInOut, useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, [reduced, live, y]);

  const mascot = getResultMascot(scores);
  const variant = !playful ? 'original' : dozing ? 'sleepy' : mascot.pose ?? 'original';
  const press = () => {
    if (sealed) { onSealedPress(); return; }
    setDozing(false);
    play.play();
  };

  return (
    <View style={[s.wrap, { marginTop: sealed ? 32 : -4, marginBottom: sealed ? 16 : 4 }]}>
      <Pressable
        onPress={press}
        accessibilityRole="button"
        accessibilityLabel={sealed ? '운알이에게 오늘의 운세 듣기' : mascot.label}
        accessibilityHint={sealed ? '누르면 운알이와의 오늘의 운세 대화로 넘어가요' : '누르면 운알이가 튕기며 반짝여요'}
        style={s.hit}
      >
        <Animated.View style={[s.shadowBox, {
          opacity: y.interpolate({ inputRange: [-6, 0], outputRange: [0.7, 1] }),
          transform: [{ scaleX: y.interpolate({ inputRange: [-6, 0], outputRange: [0.86, 1] }) }],
        }]} pointerEvents="none">
          <MascotShadow size={SIZE} />
        </Animated.View>
        <Animated.View style={{ transform: [{ translateY: y }] }}>
          <Animated.View style={play.style}>
            <MascotPolish busy={false} reduced={reduced} size={SIZE} variant={variant} sparkleTrigger={play.sparkleTrigger}>
              <ResultMascot pose={sealed ? null : undefined} scores={sealed ? undefined : scores} dozing={dozing} size={SIZE} accessible={false} revealed={!sealed} />
            </MascotPolish>
          </Animated.View>
        </Animated.View>
      </Pressable>
      {hint ? (
        <View style={s.hint} pointerEvents="none">
          <Text style={s.hintText}>{hint}</Text>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignSelf: 'center', alignItems: 'center' },
  hit: { width: BOX, height: BOX, alignItems: 'center', justifyContent: 'center' },
  // ResultMascot과 같은 칸을 가운데에 둔다
  shadowBox: { position: 'absolute', left: (BOX - SIZE * 1.08) / 2, top: (BOX - SIZE) / 2, width: SIZE * 1.08, height: SIZE },
  hint: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.navy },
  hintText: { fontSize: 12, fontWeight: '700', color: colors.white, letterSpacing: -0.3 },
});
