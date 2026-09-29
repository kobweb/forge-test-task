import { ScreenState } from '@/components/screen-state';
import { useEntitlement } from '@/features/billing/api';
import { ChatSkeleton, CoachChat } from '@/features/coach/coach-chat';
import { CoachTeaser } from '@/features/coach/coach-teaser';

export default function CoachScreen() {
  const entitlement = useEntitlement();
  if (entitlement.isPending) return <ChatSkeleton />;
  if (!entitlement.data) {
    return (
      <ScreenState
        icon="cloud-offline-outline"
        title="Can't reach your coach"
        body="Check your connection and try again."
        actionLabel="Try again"
        onAction={() => void entitlement.refetch()}
      />
    );
  }
  // The server enforces the gate too (403 PLUS_REQUIRED); this only decides what to show.
  return entitlement.data.tier === 'plus' ? <CoachChat /> : <CoachTeaser />;
}
