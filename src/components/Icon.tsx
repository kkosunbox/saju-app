import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme/colors';

export type IconName =
  | 'home' | 'sparkle' | 'sheet' | 'heart' | 'user' | 'share' | 'chevronRight' | 'chevronLeft' | 'chevronDown' | 'bell' | 'crown'
  | 'refresh' | 'check' | 'close' | 'clock' | 'palette' | 'mail' | 'grid' | 'chat' | 'chatHeart' | 'send' | 'arrowUp' | 'download' | 'lock' | 'calendar' | 'ticket';

/** 디자인의 Icon/Outline 세트(heroicons 계열 선형 아이콘)와 같은 모양 */
const PATHS: Record<IconName, string> = {
  home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  sparkle: 'M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z',
  sheet: 'M5.5 6.5h13v13.5h-13z M5.5 10.5h13 M9 4v4 M15 4v4',
  heart: 'M12 20s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  share: 'M12 3.5v11 M7.5 8 12 3.5 16.5 8 M5 13.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5.5',
  chevronRight: 'M9 5l7 7-7 7',
  chevronLeft: 'M15 19l-7-7 7-7',
  chevronDown: 'M19 9l-7 7-7-7',
  bell: 'M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3C7.7 6.1 6 8.4 6 11v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  crown: 'M4 8l4.2 4 3.8-6 3.8 6L20 8l-1.6 10H5.6z',
  refresh: 'M4 4v5h.6m15.4 2A8 8 0 004.6 9m0 0H9m11 11v-5h-.6m0 0a8 8 0 01-15.4-2m15.4 2H15',
  check: 'M5 13l4 4L19 7',
  close: 'M6 18L18 6M6 6l12 12',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  palette: 'M12 4a8 8 0 1 0 0 16c1.2 0 1.6-1 1-1.9-.7-1 0-2.1 1.2-2.1H17a3 3 0 0 0 3-3c0-5-3.6-9-8-9z',
  grid: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
  mail: 'M3 8l7.9 5.3a2 2 0 002.2 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  chat: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
  chatHeart: 'M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z M12 13s-3-1.7-3-3.8A1.6 1.6 0 0112 8.4a1.6 1.6 0 013 .8c0 2.1-3 3.8-3 3.8z',
  send: 'M6 12L3.3 3.1A59.8 59.8 0 0121.5 12 59.8 59.8 0 013.3 20.9L6 12zm0 0h7.5',
  arrowUp: 'M12 19V5m0 0l-6 6m6-6l6 6',
  download: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
  lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  ticket: 'M4 6h16v3.5a2.5 2.5 0 000 5V18H4v-3.5a2.5 2.5 0 000-5z M15 6v2 M15 11v2 M15 16v2',
};

interface Props { name: IconName; size?: number; color?: string; filled?: boolean; strokeWidth?: number }

/** 이모지·유니코드 기호 대신 쓰는 일관된 선형 아이콘 세트 */
export default function Icon({ name, size = 22, color = colors.ink, filled = false, strokeWidth = 1.8 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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
