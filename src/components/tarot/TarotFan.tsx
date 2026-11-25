import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { dealTopicCards, TAROT_HAND_SIZE } from '../../data/topicTarot';
import { useReducedMotion } from '../../utils/motion';
import TarotCard from './TarotCard';

const BACK = require('../../../assets/tarot/topic-back.webp');
const POSITIONS = Array.from({ length: TAROT_HAND_SIZE }, (_, index) => index - (TAROT_HAND_SIZE - 1) / 2);
type Card = ReturnType<typeof dealTopicCards>[number];

interface Props {
  cards?: readonly Card[];
  chosenIndex?: number;
  onChoose?: (index: number) => void;
  onReveal?: () => void;
}

export default function TarotFan({ cards, chosenIndex, onChoose, onReveal }: Props) {
  const reduced = useReducedMotion();
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = cards ? Math.min(55, (Math.min(windowWidth, 430) - 62) / TAROT_HAND_SIZE) : 43;
  const spacing = cards ? cardWidth + 5 : 34;
  const [spread] = useState(() => POSITIONS.map(() => new Animated.Value(0)));
  const [flip] = useState(() => new Animated.Value(0));
  const selected = chosenIndex === undefined ? undefined : cards?.[chosenIndex];

  useEffect(() => {
    if (reduced) {
      spread.forEach(value => value.setValue(1));
      return;
    }
    const animation = Animated.stagger(55, spread.map(value => Animated.timing(value, {
      toValue: 1,
      duration: 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
      isInteraction: false,
    })));
    animation.start();
    return () => animation.stop();
  }, [reduced, spread]);

  useEffect(() => {
    if (!selected) return;
    if (reduced) {
      flip.setValue(1);
      onReveal?.();
      return;
    }
    const animation = Animated.timing(flip, {
      toValue: 1,
      duration: 620,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => { if (finished) onReveal?.(); });
    return () => animation.stop();
  }, [flip, onReveal, reduced, selected]);

  const size = { width: cardWidth, height: cardWidth * 1.5 };
  const side = flip.interpolate({ inputRange: [0, 0.49, 0.5, 1], outputRange: [1, 1, 0, 0] });

  return (
    <View style={[s.fan, cards && s.activeFan]} pointerEvents={cards && !selected ? 'box-none' : 'none'}>
      {POSITIONS.map((position, index) => {
        // The chosen card has its own layer so it can move above the rest without changing their layout.
        const isChosen = index === chosenIndex;
        const arc = Math.abs(position) * 6;
        const angle = position * (cards ? 5 : 13);
        const offset = position * spacing;
        const progress = spread[index];
        const transform = isChosen
          ? [
              { translateX: flip.interpolate({ inputRange: [0, 0.65, 1], outputRange: [offset, 0, 0] }) },
              { translateY: flip.interpolate({ inputRange: [0, 1], outputRange: [arc, 0] }) },
              { rotate: flip.interpolate({ inputRange: [0, 0.65, 1], outputRange: [angle + 'deg', '0deg', '0deg'] }) },
              { scale: flip.interpolate({ inputRange: [0, 1], outputRange: [1, 1.65] }) },
              { scaleX: flip.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.02, 1] }) },
            ]
          : [
              { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, offset] }) },
              { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [20, arc] }) },
              { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', angle + 'deg'] }) },
            ];
        return (
          <Animated.View
            key={position}
            style={[
              s.slot,
              size,
              { marginLeft: -cardWidth / 2, transform },
              isChosen && s.chosen,
              selected && !isChosen && { opacity: flip.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 0, 0] }) },
            ]}
            accessibilityElementsHidden={!!selected || !cards}
            importantForAccessibility={selected || !cards ? 'no-hide-descendants' : 'auto'}
          >
            <View style={[s.card, size]}>
              {isChosen && selected ? <TarotCard reading={{ ...selected, orientation: 'upright' }} width={cardWidth} /> : null}
              <Animated.View style={[StyleSheet.absoluteFill, isChosen && { opacity: side }]} pointerEvents="none">
                <Image source={BACK} style={StyleSheet.absoluteFill} contentFit="fill" accessible={false} draggable={false} />
              </Animated.View>
            </View>
            {onChoose && !selected ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`타로 카드 ${index + 1}번 뽑기`}
                onPress={() => onChoose(index)}
                style={StyleSheet.absoluteFill}
              />
            ) : null}
          </Animated.View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  fan: { height: 92, width: '100%' },
  activeFan: { height: 143 },
  slot: { position: 'absolute', top: 28, left: '50%' },
  chosen: { zIndex: 1 },
  card: { backgroundColor: '#2A1730', borderColor: '#987043', borderWidth: StyleSheet.hairlineWidth, borderRadius: 6, overflow: 'hidden' },
});
