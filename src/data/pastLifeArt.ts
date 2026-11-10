import type { PastLife } from '../types/content';

// 40 transparent 384px WebPs; full-resolution artwork stays outside the app bundle.
const ART = {
  '의원': {
    korean: require('../../assets/images/past-life/korean/01-physician.webp'),
    foreign: require('../../assets/images/past-life/foreign/01-physician.webp'),
  },
  '서당 훈장': {
    korean: require('../../assets/images/past-life/korean/02-teacher.webp'),
    foreign: require('../../assets/images/past-life/foreign/02-teacher.webp'),
  },
  '약초꾼': {
    korean: require('../../assets/images/past-life/korean/03-herbalist.webp'),
    foreign: require('../../assets/images/past-life/foreign/03-herbalist.webp'),
  },
  '사서': {
    korean: require('../../assets/images/past-life/korean/04-librarian.webp'),
    foreign: require('../../assets/images/past-life/foreign/04-librarian.webp'),
  },
  '궁중 화원': {
    korean: require('../../assets/images/past-life/korean/05-court-painter.webp'),
    foreign: require('../../assets/images/past-life/foreign/05-court-painter.webp'),
  },
  '떠돌이 광대': {
    korean: require('../../assets/images/past-life/korean/06-wandering-performer.webp'),
    foreign: require('../../assets/images/past-life/foreign/06-wandering-performer.webp'),
  },
  '등불 장인': {
    korean: require('../../assets/images/past-life/korean/07-lantern-maker.webp'),
    foreign: require('../../assets/images/past-life/foreign/07-lantern-maker.webp'),
  },
  '조향사': {
    korean: require('../../assets/images/past-life/korean/08-perfumer.webp'),
    foreign: require('../../assets/images/past-life/foreign/08-perfumer.webp'),
  },
  '큰 객주의 상인': {
    korean: require('../../assets/images/past-life/korean/09-merchant.webp'),
    foreign: require('../../assets/images/past-life/foreign/09-merchant.webp'),
  },
  '도자기 장인': {
    korean: require('../../assets/images/past-life/korean/10-potter.webp'),
    foreign: require('../../assets/images/past-life/foreign/10-potter.webp'),
  },
  '여관 주인': {
    korean: require('../../assets/images/past-life/korean/11-innkeeper.webp'),
    foreign: require('../../assets/images/past-life/foreign/11-innkeeper.webp'),
  },
  '지도 제작자': {
    korean: require('../../assets/images/past-life/korean/12-cartographer.webp'),
    foreign: require('../../assets/images/past-life/foreign/12-cartographer.webp'),
  },
  '호위 무사': {
    korean: require('../../assets/images/past-life/korean/13-bodyguard.webp'),
    foreign: require('../../assets/images/past-life/foreign/13-bodyguard.webp'),
  },
  '대장장이': {
    korean: require('../../assets/images/past-life/korean/14-blacksmith.webp'),
    foreign: require('../../assets/images/past-life/foreign/14-blacksmith.webp'),
  },
  '보석 세공사': {
    korean: require('../../assets/images/past-life/korean/15-jeweler.webp'),
    foreign: require('../../assets/images/past-life/foreign/15-jeweler.webp'),
  },
  '왕실 기록관': {
    korean: require('../../assets/images/past-life/korean/16-royal-archivist.webp'),
    foreign: require('../../assets/images/past-life/foreign/16-royal-archivist.webp'),
  },
  '밤하늘을 읽던 점성가': {
    korean: require('../../assets/images/past-life/korean/17-astrologer.webp'),
    foreign: require('../../assets/images/past-life/foreign/17-astrologer.webp'),
  },
  '떠돌이 시인': {
    korean: require('../../assets/images/past-life/korean/18-wandering-poet.webp'),
    foreign: require('../../assets/images/past-life/foreign/18-wandering-poet.webp'),
  },
  '뱃사공': {
    korean: require('../../assets/images/past-life/korean/19-boatman.webp'),
    foreign: require('../../assets/images/past-life/foreign/19-boatman.webp'),
  },
  '꿈을 풀던 해몽가': {
    korean: require('../../assets/images/past-life/korean/20-dream-interpreter.webp'),
    foreign: require('../../assets/images/past-life/foreign/20-dream-interpreter.webp'),
  },
};

const FOREIGN_ROLE: Record<string, keyof typeof ART> = {
  '학당 선생': '서당 훈장',
  '궁정 화가': '궁중 화원',
  '큰 상단의 상인': '큰 객주의 상인',
};

/** Same five Korean dynasties as the server's era selection. Aliases also cover old results without an era. */
export function resolvePastLifeArt(result: Pick<PastLife, 'role' | 'era'>): { key: string; source: number } {
  const name = result.role.trim();
  const role = FOREIGN_ROLE[name] ?? name;
  if (!Object.prototype.hasOwnProperty.call(ART, role)) {
    return { key: 'original', source: require('../../assets/images/mascot.png') };
  }
  const era = result.era.trim();
  const variant = era ? (/^(고려|조선|신라|백제|발해)(?:의|\s|$)/.test(era) ? 'korean' : 'foreign')
    : Object.prototype.hasOwnProperty.call(FOREIGN_ROLE, name) ? 'foreign' : 'korean';
  return { key: `${variant}/${role}`, source: ART[role as keyof typeof ART][variant] };
}
