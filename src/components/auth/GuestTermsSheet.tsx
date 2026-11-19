import React, { useRef, useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import BottomSheet from '../BottomSheet';
import PrimaryButton from '../PrimaryButton';
import TermsAgreement, { requiredAgreed, useAgreements } from './TermsAgreement';
import { getTokens } from '../../api/tokens';
import { GuestConsent } from '../../services/server/authApi';
import { txt } from '../../theme/typography';

/**
 * 첫 프로필을 저장하기 전 약관 동의 — 계정이 아직 없을 때(게스트가 될 때)만 묻는다.
 * 동의는 게스트에 저장되고, 이 게스트가 회원이 되면(가입 · 소셜 승격) 다시 묻지 않는다.
 * request(): 이미 계정이 있으면 undefined, 동의하면 GuestConsent, 시트를 닫으면 null
 */
export function useGuestTerms() {
  const [open, setOpen] = useState(false);
  const [agree, setAgree] = useAgreements();
  const resolver = useRef<((v: GuestConsent | null) => void) | null>(null);

  const done = (v: GuestConsent | null) => {
    setOpen(false);
    resolver.current?.(v);
    resolver.current = null;
  };
  const request = async (): Promise<GuestConsent | null | undefined> => {
    if (await getTokens()) return undefined;
    return new Promise(resolve => { resolver.current = resolve; setOpen(true); });
  };

  const sheet = (
    <BottomSheet visible={open} onClose={() => done(null)}>
      <Text style={txt.h2}>시작하기 전에 동의해 주세요</Text>
      <Text style={[txt.small, { marginTop: 6 }]}>입력한 정보로 사주를 풀고 운알이와 대화하려면 아래 동의가 필요해요.</Text>
      {/* 전문을 보러 가면 이번 저장은 멈춘다 — 돌아와 다시 누르면 체크한 그대로 열린다 */}
      <TermsAgreement value={agree} onChange={setAgree} onOpenDoc={doc => { done(null); router.push(`/legal/${doc}`); }} />
      <PrimaryButton label="동의하고 시작하기 →" onPress={() => done({ marketing: agree.marketing })} disabled={!requiredAgreed(agree)} style={{ marginTop: 16 }} />
    </BottomSheet>
  );
  return { request, sheet };
}
