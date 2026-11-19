import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@/navigation/compat';
import BottomSheet from './BottomSheet';
import InvitePicker from './InvitePicker';
import { PendingInvite, clearPendingInvite, getPendingInvite, savePendingInvite } from '../services/share/linkShare';

/**
 * 궁합 초대 링크로 들어와 프로필을 넣으러 갔다 온 경우(auto), 첫 화면에 오면 궁합 보기 안내를 한 번 연다 — 수락하거나 버리거나.
 * visible: 안내가 열려 있는 동안 다른 시트(환영 보너스 등)를 미루는 데 쓴다
 */
export function usePendingInviteSheet(): { visible: boolean; sheet: React.ReactNode } {
  const [invite, setInvite] = useState<PendingInvite | null>(null);
  const [visible, setVisible] = useState(false);
  useFocusEffect(useCallback(() => {
    getPendingInvite().then(inv => {
      if (!inv?.auto) return;
      setInvite(inv);
      setVisible(true);
      savePendingInvite({ ...inv, auto: false });
    });
  }, []));
  const close = () => { setVisible(false); setInvite(null); };
  const decline = () => { clearPendingInvite(); close(); };
  const sheet = invite ? (
    <BottomSheet visible={visible} onClose={decline}>
      <InvitePicker invite={invite} onDone={close} onDecline={decline} />
    </BottomSheet>
  ) : null;
  return { visible, sheet };
}
