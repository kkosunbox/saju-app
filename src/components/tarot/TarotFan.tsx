import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View, useWindowDimensions, type GestureResponderEvent } from 'react-native';
import { Image } from 'expo-image';
import { TAROT_DECK_SIZE } from '../../data/topicTarot';
import { sansW } from '../../theme/typography';
import { useReducedMotion } from '../../utils/motion';
import { CARD_APPEAR, CARD_STAGGER, CARD_TRAVEL, FIRST_CARD_START } from './entranceMotion';
import TarotCard, { type TarotCardFace } from './TarotCard';

const BACK = require('../../../assets/tarot/topic-back.webp');
const POSITIONS = Array.from({ length: TAROT_DECK_SIZE }, (_, index) => index / (TAROT_DECK_SIZE - 1) * 2 - 1);
const RESULT_WIDTH = 104;
const FINE_POINTER = '(hover: hover) and (pointer: fine)';

function CardBack() {
  return <Image source={BACK} style={StyleSheet.absoluteFill} contentFit="fill" accessible={false} draggable={false} />;
}

export default function TarotFan({ progress }: { progress: Animated.Value }) {
  return (
    <View testID="tarot-entrance-fan" style={s.fan} pointerEvents="none" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {POSITIONS.map((position, index) => {
        const start = FIRST_CARD_START + index * CARD_STAGGER;
        const end = start + CARD_TRAVEL;
        const move = (from: number, to: number) => progress.interpolate({
          inputRange: [start, end], outputRange: [from, to], extrapolate: 'clamp',
        });
        return (
          <Animated.View key={index} style={[s.card, s.fanCard, {
            opacity: progress.interpolate({ inputRange: [start, start + CARD_APPEAR], outputRange: [0, 1], extrapolate: 'clamp' }),
            transform: [
              { translateX: move(-72, position * 109) },
              { translateY: move(-18, position * position * 38) },
              { rotate: progress.interpolate({
                inputRange: [start, end], outputRange: ['-24deg', `${position * 36}deg`], extrapolate: 'clamp',
              }) },
            ],
          }]}>
            <CardBack />
          </Animated.View>
        );
      })}
    </View>
  );
}

function needsSecondTap(event: GestureResponderEvent) {
  if (Platform.OS !== 'web') return true;
  const pointer = event.nativeEvent as unknown as PointerEvent;
  if (pointer.pointerType) return pointer.pointerType !== 'mouse';
  if (pointer.detail === 0) return false; // Keyboard and assistive-technology click.
  return !window.matchMedia(FINE_POINTER).matches;
}

/** exit 0→1: 고른 카드는 살짝 떠올라 사라지고 나머지는 가라앉으며 흩어진다 (풀이 카드로 이어지는 연출) */
export function TarotDeck({ cards, disabled, hintOpacity, exit, chosen, onChoose }: {
  cards: readonly { id: number }[];
  disabled: boolean;
  hintOpacity: Animated.AnimatedInterpolation<number> | Animated.AnimatedMultiplication;
  exit: Animated.Value;
  chosen?: number;
  onChoose: (id: number) => void;
}) {
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const [preview, setPreview] = useState<number>();
  const [hover, setHover] = useState<number>();
  const [focused, setFocused] = useState<number>();
  const raised = hover ?? focused ?? preview;
  const railWidth = Math.min(width - 8, 430);
  const cardWidth = Math.min(76, Math.round(railWidth * 0.18));
  const cardHeight = cardWidth * 1.5;
  // Leave room for the projected corners of the two 28° end cards.
  const gutter = (cardWidth * 0.883 + cardHeight * 0.47) / 2 + 2;
  const pitch = (railWidth - gutter * 2) / (TAROT_DECK_SIZE - 1);
  const rise = cardWidth * 1.02;
  const lift = cardWidth * 0.41;
  const restTop = lift + 10;

  const press = (index: number, event: GestureResponderEvent) => {
    if (needsSecondTap(event) && preview !== index) {
      setHover(undefined);
      setFocused(undefined);
      setPreview(index);
      return;
    }
    onChoose(cards[index].id);
  };

  return (
    <View style={s.deck}>
      <View style={{ width: railWidth, height: restTop + rise + cardHeight + 12, alignSelf: 'center' }}>
        {cards.map(({ id }, index) => {
          const position = POSITIONS[index];
          return (
            <DeckCard
              key={id}
              index={index}
              x={gutter + index * pitch}
              y={restTop + position * position * rise}
              width={cardWidth}
              height={cardHeight}
              liftDistance={lift}
              pitch={pitch}
              angle={position * 28}
              raised={index === raised}
              previewed={index === preview}
              exit={exit}
              chosen={chosen === cards[index].id}
              reduced={reduced}
              disabled={disabled}
              onPress={event => press(index, event)}
              onHover={setHover}
              onFocus={setFocused}
            />
          );
        })}
      </View>
      <Animated.Text accessibilityLiveRegion="polite" style={[s.deckHint, { opacity: hintOpacity }, preview !== undefined && s.previewHint]}>
        {preview !== undefined ? '한 번 더 눌러 선택하세요' : '마음이 가는 카드를 한 번 골라보세요'}
      </Animated.Text>
    </View>
  );
}

function DeckCard({ index, x, y, width, height, liftDistance, pitch, angle, raised, previewed, exit, chosen, reduced, disabled, onPress, onHover, onFocus }: {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  liftDistance: number;
  pitch: number;
  angle: number;
  raised: boolean;
  previewed: boolean;
  exit: Animated.Value;
  chosen: boolean;
  reduced: boolean;
  disabled: boolean;
  onPress: (event: GestureResponderEvent) => void;
  onHover: (value: number | undefined) => void;
  onFocus: (value: number | undefined) => void;
}) {
  const [lift] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduced) {
      lift.setValue(raised || chosen ? 1 : 0);
      return;
    }
    const move = Animated.spring(lift, {
      toValue: raised || chosen ? 1 : 0, speed: 24, bounciness: 6, useNativeDriver: true, isInteraction: false,
    });
    move.start();
    return () => move.stop();
  }, [chosen, lift, raised, reduced]);

  return (
    <>
      {/* Exit runs on the JS driver with the deck's other fades, the lift on the native one, so they stay on separate views. */}
      <Animated.View pointerEvents="none" style={[s.deckCard, (raised || chosen) && s.raisedSlot, {
        left: x - width / 2,
        top: y, width, height,
        opacity: chosen
          ? exit.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1, 0] })
          : exit.interpolate({ inputRange: [0, 0.55], outputRange: [1, 0], extrapolate: 'clamp' }),
        transform: chosen
          ? [
            { translateY: exit.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) },
            { scale: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) },
          ]
          : [{ translateY: exit.interpolate({ inputRange: [0, 0.6], outputRange: [0, 14], extrapolate: 'clamp' }) }],
      }]}>
        <Animated.View style={[s.card, s.fill, (raised || chosen) && s.raisedCard, {
          transform: [
            { translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -liftDistance] }) },
            { rotate: lift.interpolate({ inputRange: [0, 1], outputRange: [`${angle}deg`, `${angle * 0.25}deg`] }) },
            { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
          ],
        }]}>
          <CardBack />
        </Animated.View>
      </Animated.View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`타로 카드 ${index + 1}번 뽑기`}
        accessibilityHint={previewed ? '한 번 더 눌러 선택' : undefined}
        accessibilityState={{ selected: previewed }}
        disabled={disabled}
        onPress={onPress}
        onHoverIn={() => onHover(index)}
        onHoverOut={() => onHover(undefined)}
        onFocus={() => { if (Platform.OS === 'web' && document.activeElement?.matches(':focus-visible')) onFocus(index); }}
        onBlur={() => onFocus(undefined)}
        style={[s.hit, { left: x - pitch / 2, width: pitch, top: y - liftDistance, height: height + liftDistance + 6 }]}
      />
      {previewed && raised ? (
        // The raised top is wide enough to tap again even on the smallest screen.
        <Pressable
          aria-hidden accessible={false} focusable={false} tabIndex={-1}
          disabled={disabled} onPress={onPress}
          style={[s.confirmHit, { left: x - width / 2, width, top: y - liftDistance - 3, height: liftDistance + 3 }]}
        />
      ) : null}
    </>
  );
}

const REVEAL_DURATION = 1180;
const REVEAL_EASE = Easing.bezier(0.65, 0, 0.35, 1);

/** 뒷면으로 떠올라 → 입체로 한 바퀴 반 뒤집히며 앞면 → 살짝 내려앉는다 */
export function TarotReveal({ card, animate, onFinished }: { card: TarotCardFace; animate: boolean; onFinished: () => void }) {
  const reduced = useReducedMotion();
  const [flip] = useState(() => new Animated.Value(animate ? 0 : 1));

  useEffect(() => {
    if (reduced || !animate) {
      flip.setValue(1);
      onFinished();
      return;
    }
    const animation = Animated.timing(flip, {
      toValue: 1,
      duration: REVEAL_DURATION,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => { if (finished) onFinished(); });
    return () => animation.stop();
  }, [animate, flip, onFinished, reduced]);

  const arrive = flip.interpolate({ inputRange: [0, 0.28], outputRange: [0, 1], extrapolate: 'clamp', easing: Easing.out(Easing.cubic) });
  const turn = flip.interpolate({ inputRange: [0.3, 0.84], outputRange: [0, 1], extrapolate: 'clamp', easing: REVEAL_EASE });

  return (
    <Animated.View style={[s.revealCard, {
      opacity: arrive,
      transform: [
        { translateY: arrive.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) },
        { scale: flip.interpolate({
          inputRange: [0, 0.28, 0.57, 0.9, 1], outputRange: [0.9, 1, 1.07, 0.995, 1], extrapolate: 'clamp',
        }) },
      ],
    }]}>
      <Animated.View pointerEvents="none" style={[s.revealGlow, {
        opacity: flip.interpolate({ inputRange: [0, 0.5, 0.78, 1], outputRange: [0, 0, 0.95, 0.5] }),
        transform: [{ scale: flip.interpolate({ inputRange: [0.5, 0.8, 1], outputRange: [0.86, 1.08, 1], extrapolate: 'clamp' }) }],
      }]} />
      <Animated.View style={[s.card, s.fill, {
        opacity: turn.interpolate({ inputRange: [0, 0.5, 0.5001, 1], outputRange: [0, 0, 1, 1] }),
        transform: [{ perspective: 900 }, { rotateY: turn.interpolate({ inputRange: [0, 1], outputRange: ['-180deg', '0deg'] }) }],
      }]}>
        <TarotCard reading={card} width={RESULT_WIDTH} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[s.card, s.fill, {
        opacity: turn.interpolate({ inputRange: [0, 0.5, 0.5001, 1], outputRange: [1, 1, 0, 0] }),
        transform: [{ perspective: 900 }, { rotateY: turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }],
      }]}>
        <CardBack />
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  fan: { height: 113, width: '100%' },
  card: { backgroundColor: '#2A1730', borderColor: '#987043', borderWidth: StyleSheet.hairlineWidth, borderRadius: 6, overflow: 'hidden' },
  fanCard: { position: 'absolute', top: 12, left: '50%', width: 48, height: 72, marginLeft: -24 },
  deck: { marginTop: 3 },
  deckCard: { position: 'absolute' },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  raisedSlot: { zIndex: 1 },
  raisedCard: { borderColor: '#FFE0A5', borderWidth: 1.5 },
  hit: { position: 'absolute', zIndex: 2 },
  confirmHit: { position: 'absolute', zIndex: 3 },
  deckHint: { ...sansW('500'), color: '#CFC0D4', minHeight: 24, marginHorizontal: 16, textAlign: 'center', fontSize: 13, lineHeight: 20 },
  previewHint: { ...sansW('700'), color: '#FFE0A5' },
  revealCard: { width: RESULT_WIDTH, height: RESULT_WIDTH * 1.5, marginTop: 16, marginBottom: 12, alignSelf: 'center' },
  revealGlow: { position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, borderRadius: 12, backgroundColor: 'rgba(233,191,131,0.06)', boxShadow: '0 0 34px 6px rgba(233,191,131,0.42)' },
});
