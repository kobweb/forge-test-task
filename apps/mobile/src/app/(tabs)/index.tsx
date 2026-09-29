import * as Haptics from 'expo-haptics';
import { router, useIsFocused } from 'expo-router';
import { useThemeColor, useToast } from 'heroui-native';
import { useEffect } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenState } from '@/components/screen-state';
import { useMe } from '@/features/me/api';
import { usePlan, useResetPlan } from '@/features/plan/api';
import { NextSessionBar } from '@/features/plan/next-session-bar';
import { PlanCompleteCard } from '@/features/plan/plan-complete-card';
import { PlanHeader } from '@/features/plan/plan-header';
import { PlanSkeleton } from '@/features/plan/plan-skeleton';
import { TimelineItem } from '@/features/plan/timeline-item';
import { usePlanCelebration } from '@/stores/celebration-store';

export default function PlanScreen() {
  const plan = usePlan();
  const me = useMe();
  const resetPlan = useResetPlan();
  const { toast } = useToast();
  const refreshTint = useThemeColor('muted');
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const pending = usePlanCelebration((state) => state.pending);
  // A pending celebration plays while this screen is on screen, then is consumed. Children
  // start their animation on this render; the effect below fires the haptic and clears it.
  const celebration = isFocused && plan.data ? pending : null;

  useEffect(() => {
    if (!celebration) return;
    void (celebration.kind === 'unlock'
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    usePlanCelebration.getState().consume();
  }, [celebration]);

  if (plan.isPending) return <PlanSkeleton />;
  if (!plan.data) {
    return (
      <ScreenState
        icon="cloud-offline-outline"
        title="Can't load your plan"
        body="Check your connection and try again."
        actionLabel="Try again"
        onAction={() => void plan.refetch()}
      />
    );
  }

  const { sessions, completedCount, totalCount, nextSessionId } = plan.data;

  const restart = () =>
    resetPlan.mutate(undefined, {
      onSuccess: () => {
        toast.show({ label: 'Plan restarted', description: 'Foundation is open again.' });
        usePlanCelebration.getState().celebrate({ kind: 'unlock', sessionId: 'foundation' });
      },
      onError: (error) => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        toast.show({ variant: 'danger', label: error.message });
      },
    });

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerClassName="gap-6 px-5 pb-40 pt-safe-offset-4"
        refreshControl={
          // The scroll view runs under the status bar, so the spinner is pushed below it.
          <RefreshControl
            refreshing={plan.isRefetching}
            onRefresh={() => void plan.refetch()}
            tintColor={refreshTint}
            progressViewOffset={insets.top}
          />
        }
      >
        <PlanHeader
          displayName={me.data?.displayName ?? 'there'}
          goals={me.data?.goals ?? []}
          completedCount={completedCount}
          totalCount={totalCount}
        />
        {nextSessionId === null ? (
          <PlanCompleteCard animate={celebration?.kind === 'planComplete'} />
        ) : null}
        <View>
          {sessions.map((session, index) => (
            <TimelineItem
              key={session.id}
              session={session}
              isFirst={index === 0}
              isLast={index === sessions.length - 1}
              previousCompleted={index > 0 && sessions[index - 1].status === 'completed'}
              celebrate={celebration?.kind === 'unlock' && celebration.sessionId === session.id}
              onPress={() => router.push(`/session/${session.id}`)}
            />
          ))}
        </View>
      </ScrollView>
      <NextSessionBar
        plan={plan.data}
        onStart={() => nextSessionId && router.push(`/session/${nextSessionId}`)}
        onRestart={restart}
        isRestarting={resetPlan.isPending}
      />
    </View>
  );
}
