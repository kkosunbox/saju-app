import { RefObject } from 'react';
import type { ViewInstance } from 'react-native';
import { useApp } from '../../context/AppContext';
import { usePremium } from '../../context/PremiumContext';
import { ShareSpec } from './shareSpecs';
import { resultUrl, shareLink } from './linkShare';
import { WebCard, shareCardImage } from '../shareService';

/** 링크 대신 이미지로 보낼 결과 (예: 오늘의 부적) — prepared는 웹에서 미리 그려 둔 이미지 */
export interface ShareImage { ref: RefObject<ViewInstance | null>; aspectRatio?: number; prepared?: () => WebCard | null }

/**
 * 공유 동작 모음 — 링크에는 내 결과 한 줄을 담아 친구가 열면 나란히 비교되게 하고,
 * 공유가 끝나면 공유 보상(+10알)을 준다.
 */
export function useShare() {
  const { user } = useApp();
  const { rewardShare, toast } = usePremium();
  const urlOf = (spec: ShareSpec) => resultUrl({ c: spec.route, k: spec.kind, n: user?.nickname ?? '친구', h: spec.short });
  const sendLink = async (spec: ShareSpec) => {
    const r = await shareLink(spec.text, urlOf(spec));
    if (r === 'cancelled') return r;
    if (r === 'copied') toast('링크를 복사했어요. 친구에게 붙여 넣어 보내세요');
    void rewardShare(spec.file);
    return r;
  };
  /** 이미지에 문구·링크를 붙여 보낸다. 이미지 공유가 안 되는 브라우저(데스크톱 등)는 링크로 보낸다. */
  const sendImage = async (spec: ShareSpec, image: ShareImage) => {
    const r = await shareCardImage(image.ref, { file: spec.file, text: spec.text, url: urlOf(spec), mode: 'share', fallback: 'none', aspectRatio: image.aspectRatio, prepared: image.prepared?.() });
    if (r === 'unsupported') return sendLink(spec);
    if (r === 'shared' || r === 'saved') void rewardShare(spec.file);
    return r;
  };
  return { sendLink, sendImage, urlOf, reward: (spec: ShareSpec) => rewardShare(spec.file) };
}
