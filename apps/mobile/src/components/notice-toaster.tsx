import { useToast } from 'heroui-native';
import { useEffect } from 'react';
import { subscribeToNotices } from '@/lib/notices';

/** Shows notices published outside React (session expiry, account deletion) as toasts. */
export function NoticeToaster() {
  const { toast } = useToast();
  useEffect(() => subscribeToNotices((message) => toast.show({ label: message })), [toast]);
  return null;
}
