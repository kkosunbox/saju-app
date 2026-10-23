import React, { useId } from 'react';
import { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { MascotAccessory as Kind } from '../utils/resultMascot';

/** 작은 크기에도 읽히는 실루엣 + 젤리 본체와 같은 파스텔 명암. SVG ID는 인스턴스마다 분리한다. */
export default function MascotAccessory({ kind }: { kind: Kind }) {
  const id = `prop${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const fill = (name: string) => `url(#${id}${name})`;
  return (
    <G transform="translate(8 -1)">
      <Defs>
        <LinearGradient id={`${id}pink`} x1="0%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0" stopColor="#FFE9EE" /><Stop offset="0.35" stopColor="#F5B6CF" /><Stop offset="0.75" stopColor="#E889AF" /><Stop offset="1" stopColor="#C982AE" />
        </LinearGradient>
        <RadialGradient id={`${id}gold`} cx="32%" cy="24%" rx="80%" ry="80%">
          <Stop offset="0" stopColor="#FFF9DB" /><Stop offset="0.45" stopColor="#F6DA93" /><Stop offset="0.8" stopColor="#EBC27B" /><Stop offset="1" stopColor="#D9A46D" />
        </RadialGradient>
        <LinearGradient id={`${id}rim`} x1="15%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0" stopColor="#FFFCEB" /><Stop offset="0.4" stopColor="#F9E8B1" /><Stop offset="0.7" stopColor="#D8AD74" /><Stop offset="1" stopColor="#F8E5B4" />
        </LinearGradient>
        <LinearGradient id={`${id}lavender`} x1="10%" y1="5%" x2="90%" y2="100%">
          <Stop offset="0" stopColor="#F5EEFF" /><Stop offset="0.4" stopColor="#D8CBF0" /><Stop offset="0.8" stopColor="#B3A7D8" /><Stop offset="1" stopColor="#C8B7E3" />
        </LinearGradient>
        <LinearGradient id={`${id}cloud`} x1="20%" y1="0%" x2="75%" y2="100%">
          <Stop offset="0" stopColor="#FFFFFF" /><Stop offset="0.35" stopColor="#F0F8FF" /><Stop offset="0.75" stopColor="#D5E8F5" /><Stop offset="1" stopColor="#C5D6EE" />
        </LinearGradient>
        <LinearGradient id={`${id}wood`} x1="0%" y1="0%" x2="100%" y2="70%">
          <Stop offset="0" stopColor="#FFF3D4" /><Stop offset="0.45" stopColor="#F0D6AB" /><Stop offset="1" stopColor="#CFA684" />
        </LinearGradient>
      </Defs>
      <Ellipse cx={74} cy={90} rx={12} ry={2.5} fill="#8684AA" opacity={0.06} />
      {kind === 'heart' ? <G transform="rotate(-12 73 78)">
        <Path d="M73 91C69 88 57 81 59 73C60 65 69 64 73 71C77 64 86 65 87 73C89 81 78 88 73 91Z" fill="#C985AB" opacity={0.18} transform="translate(0 1)" />
        <Path d="M73 90C68 86 57 80 59 72C61 64 69 65 73 71C77 65 85 64 87 72C89 80 78 86 73 90Z" fill={fill('pink')} />
        <Path d="M62 74C62 70 66 68 69 71" stroke="#FFFFFF" strokeOpacity={0.65} strokeWidth={2.2} fill="none" strokeLinecap="round" />
        <Ellipse cx={63} cy={77} rx={1.1} ry={1.7} fill="#FFFFFF" opacity={0.35} />
        <Path d="M76 86Q82 82 84 77" stroke="#FAD6E5" strokeWidth={0.8} strokeOpacity={0.7} fill="none" strokeLinecap="round" />
      </G> : null}
      {kind === 'coin' ? <G transform="rotate(-14 74 78)">
        <Ellipse cx={75} cy={79} rx={11} ry={12.5} fill="#D0A16A" opacity={0.55} />
        <Ellipse cx={73.5} cy={77.5} rx={11} ry={12.5} fill={fill('rim')} />
        <Ellipse cx={73.5} cy={77.5} rx={8.5} ry={10} fill={fill('gold')} />
        <Ellipse cx={73.5} cy={77.5} rx={7.9} ry={9.4} fill="none" stroke="#FFF6D5" strokeWidth={0.5} opacity={0.8} />
        <Path d="M70.5 74H76.5M70.5 81H76.5M72 71.5L73 84M75 71.5L74 84M69.5 77H77.5" stroke="#BF955F" strokeWidth={1.1} strokeLinecap="round" opacity={0.55} />
        <Path d="M66 73Q67 68 71 67" stroke="#FFFFFF" strokeWidth={1.7} strokeLinecap="round" fill="none" opacity={0.65} />
      </G> : null}
      {kind === 'pencil' ? <G transform="rotate(29 74 77)">
        <Rect x={70} y={65} width={8} height={20} rx={1.2} fill={fill('gold')} />
        <Path d="M71 66V84M75.5 66V84" stroke="#FFF7D8" strokeWidth={0.8} opacity={0.8} />
        <Path d="M77 66V84" stroke="#CFA777" strokeWidth={1} opacity={0.55} />
        <Path d="M70 84L74 94L78 84Z" fill={fill('wood')} />
        <Path d="M72.5 90.5L74 94L75.5 90.5Q74 89.7 72.5 90.5Z" fill="#6D6E89" />
        <Rect x={70} y={60} width={8} height={7} rx={2.8} fill={fill('pink')} />
        <Rect x={69.7} y={65} width={8.6} height={3} rx={0.7} fill={fill('rim')} />
        <Path d="M72 61.5H74.5" stroke="#FFFFFF" strokeWidth={1.1} opacity={0.65} strokeLinecap="round" />
      </G> : null}
      {kind === 'ribbon' ? <G transform="rotate(10 74 78)">
        <Path d="M66 78L64 93L70 89L74 93L75 79Z" fill={fill('lavender')} />
        <Path d="M74 79L76 93L80 88L86 90L81 76Z" fill={fill('pink')} />
        <Circle cx={74} cy={75} r={11} fill={fill('lavender')} />
        <Circle cx={74} cy={75} r={8.3} fill="#EEE5FA" opacity={0.85} />
        <Circle cx={74} cy={75} r={6.9} fill={fill('gold')} />
        <Path d="M74 69.5L75.6 73L79.5 73.5L76.5 76L77.3 79.5L74 77.8L70.7 79.5L71.5 76L68.5 73.5L72.4 73Z" fill="#FFF9E4" />
        <Path d="M65.5 73Q67 67 72 66" stroke="#FFFFFF" strokeWidth={1.3} opacity={0.65} strokeLinecap="round" fill="none" />
        <Path d="M68 82L66.5 88M80 82L82 86" stroke="#F5EFFC" strokeWidth={0.7} opacity={0.6} />
      </G> : null}
      {kind === 'cloud' ? <G>
        <Path d="M56 93C46 93 45 82 52 80C49 70 64 66 69 76C78 71 86 78 83 84C91 91 81 97 74 94Z" fill={fill('cloud')} />
        <Path d="M53 80Q52 74 58 73" stroke="#FFFFFF" strokeWidth={2.1} strokeLinecap="round" fill="none" opacity={0.9} />
        <Path d="M70 78Q75 75 79 79" stroke="#FFFFFF" strokeWidth={1.3} strokeLinecap="round" fill="none" opacity={0.7} />
        <Ellipse cx={60} cy={84} rx={7} ry={4} fill="#FFFFFF" opacity={0.35} />
        <Path d="M54 91Q62 95 74 92" stroke="#C5D5EB" strokeWidth={0.7} strokeLinecap="round" fill="none" opacity={0.5} />
      </G> : null}
      {kind === 'star' ? <G transform="rotate(13 76 78)">
        <Path d="M76 64C78 73 80 75 89 78C80 81 78 83 76 93C73 83 72 81 63 78C72 75 73 73 76 64Z" fill={fill('gold')} />
        <Path d="M76 65Q75 76 64 78Q74 78 76 91Q77 80 88 78Q77 77 76 65Z" fill="#FFF6D7" opacity={0.55} />
        <Path d="M76 68Q75 74 71 76" stroke="#FFFFFF" strokeWidth={1.3} strokeLinecap="round" fill="none" opacity={0.7} />
        <Circle cx={87} cy={67} r={1.5} fill="#F2DCA4" opacity={0.65} />
        <Circle cx={64} cy={88} r={1} fill="#DDC6DC" opacity={0.7} />
      </G> : null}
    </G>
  );
}
