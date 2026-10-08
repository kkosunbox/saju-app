import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export type IconName = 'home' | 'sparkle' | 'heart' | 'user' | 'share' | 'chevronRight' | 'chevronLeft' | 'bell' | 'crown' | 'refresh' | 'check' | 'close' | 'clock' | 'palette';

const PATHS: Record<IconName, string> = {
  home: 'M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z',
  sparkle: 'M12 3c.7 4.6 3.4 7.3 8 8-4.6.7-7.3 3.4-8 8-.7-4.6-3.4-7.3-8-8 4.6-.7 7.3-3.4 8-8z',
  heart: 'M12 20s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z',
  user: 'M5 20c1-3.7 3.8-5.6 7-5.6s6 1.9 7 5.6',
  share: 'M12 3.5v11 M7.5 8 12 3.5 16.5 8 M5 13.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5.5',
  chevronRight: 'M9.5 6l6 6-6 6',
  chevronLeft: 'M14.5 6l-6 6 6 6',
  bell: 'M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z M10 20.5a2 2 0 0 0 4 0',
  crown: 'M4 8l4.2 4 3.8-6 3.8 6L20 8l-1.6 10H5.6z',
  refresh: 'M19.5 11A7.5 7.5 0 1 0 17.3 16.3 M19.5 5v6h-6',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  close: 'M6 6l12 12 M18 6 6 18',
  clock: 'M12 7.5V12l3 2',
  palette: 'M12 4a8 8 0 1 0 0 16c1.2 0 1.6-1 1-1.9-.7-1 0-2.1 1.2-2.1H17a3 3 0 0 0 3-3c0-5-3.6-9-8-9z',
};

interface Props { name: IconName; size?: number; color?: string; filled?: boolean; strokeWidth?: number }

/** 이모지·유니코드 기호 대신 쓰는 일관된 선형 아이콘 세트 */
export default function Icon({ name, size = 22, color = '#1C1530', filled = false, strokeWidth = 1.8 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === 'user' && <Circle cx={12} cy={8.2} r={3.6} stroke={color} strokeWidth={strokeWidth} fill={filled ? color : 'none'} fillOpacity={0.18} />}
      {name === 'clock' && <Circle cx={12} cy={12} r={8.5} stroke={color} strokeWidth={strokeWidth} />}
      <Path
        d={PATHS[name]}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? color : 'none'}
        fillOpacity={filled ? 0.18 : 0}
      />
    </Svg>
  );
}
