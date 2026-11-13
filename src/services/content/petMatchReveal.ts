import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PREVIEW_STEP_MS } from '../../components/premium/ReadingGate';
import { deviceKey } from '../storage/storageService';

/** 이 기기에서 연출을 끝까지 본 조합. 계정 · 프로필 버전 · 아이별로 따로 기억한다. */
const seen = new Set<string>();

/** 호출하는 결과 화면은 matchKey가 바뀔 때 다시 마운트한다. null은 공유 · 이전 풀이. */
export function usePetMatchReveal(matchKey: string | null, stepCount: number) {
  const [step, setStep] = useState<number | null>(() =>
    matchKey === null || seen.has(matchKey) ? stepCount + 1 : null,
  );
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (matchKey === null || seen.has(matchKey)) return;
    let live = true;
    AsyncStorage.getItem(deviceKey(`petMatch:${matchKey}`))
      .catch(() => null)
      .then(value => {
        if (!live) return;
        if (value === '1') seen.add(matchKey);
        setRevealed(value !== '1');
        setStep(value === '1' ? stepCount + 1 : 0);
      });
    return () => { live = false; };
  }, [matchKey, stepCount]);

  useEffect(() => {
    if (matchKey === null || step === null || step > stepCount) return;
    const timer = setTimeout(() => {
      if (step === stepCount) {
        seen.add(matchKey);
        void AsyncStorage.setItem(deviceKey(`petMatch:${matchKey}`), '1').catch(() => {});
      }
      setStep(step + 1);
    }, PREVIEW_STEP_MS);
    return () => clearTimeout(timer);
  }, [matchKey, step, stepCount]);

  return { step, revealed };
}
