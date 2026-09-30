import type { SessionBlock, SessionId, SessionStatus } from '@forge/contracts';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { Chip, Typography, useToast } from 'heroui-native';
import { useEffect, useEffectEvent, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ScreenState } from '@/components/screen-state';
import { SubmitButton } from '@/components/submit-button';
import { useCompleteSession, usePlan } from '@/features/plan/api';
import { CheckableBlockRow, StaticBlockRow } from '@/features/session/block-row';
import { analytics } from '@/lib/analytics';
import { usePlanCelebration } from '@/stores/celebration-store';
import { NO_TICKS, useChecklist } from '@/stores/checklist-store';

/** A cold deep link opens the session with nothing beneath it, so plain "back" has nowhere to go. */
function backToPlan() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const plan = usePlan();
  const session = plan.data?.sessions.find((candidate) => candidate.id === id);
  const sessionId = session?.id;

  // Once per session shown, with the status it had when it was opened (completing it here
  // changes the status, and that is `session_completed`, not a second open).
  const trackOpened = useEffectEvent(() => {
    if (session) {
      analytics.track('session_opened', { sessionId: session.id, status: session.status });
    }
  });
  useEffect(() => {
    if (sessionId) trackOpened();
  }, [sessionId]);

  if (!session || !plan.data) {
    return (
      <ScreenState
        icon="help-circle-outline"
        title="Session not found"
        body="It may have moved. Head back to your plan."
        actionLabel="Back to plan"
        onAction={backToPlan}
      />
    );
  }

  const next = plan.data.sessions.find((candidate) => candidate.number === session.number + 1);
  const previous = plan.data.sessions.find((candidate) => candidate.number === session.number - 1);

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-6 px-5 pb-8 pt-2">
        <View className="gap-2">
          <Typography type="body-xs" color="muted" className="uppercase tracking-wider">
            {`Session ${session.number} · ${session.durationMinutes} min`}
          </Typography>
          <Typography.Heading type="h2">{session.title}</Typography.Heading>
          <Typography type="body" color="muted">
            {session.subtitle}
          </Typography>
          <View className="flex-row">
            <StatusChip status={session.status} />
          </View>
        </View>

        {session.status === 'open' ? (
          <OpenChecklist sessionId={session.id} blocks={session.blocks} />
        ) : (
          <View className="gap-3">
            {session.blocks.map((block) => (
              <StaticBlockRow
                key={block.kind}
                block={block}
                isDone={session.status === 'completed'}
              />
            ))}
          </View>
        )}

        {session.status === 'completed' ? (
          <Typography type="body-sm" color="muted" align="center">
            Completed. Restart the plan from the Plan tab to go again.
          </Typography>
        ) : null}
        {session.status === 'locked' && previous ? (
          <Typography type="body-sm" color="muted" align="center">
            {`Unlocks after Session ${previous.number} · ${previous.title}`}
          </Typography>
        ) : null}
      </ScrollView>

      {session.status === 'open' ? (
        <CompleteBar
          sessionId={session.id}
          blockCount={session.blocks.length}
          nextTitle={next?.title}
        />
      ) : null}
    </View>
  );
}

function StatusChip({ status }: { status: SessionStatus }) {
  if (status === 'completed') {
    return (
      <Chip size="sm" variant="soft" color="success">
        Completed
      </Chip>
    );
  }
  if (status === 'open') {
    return (
      <Chip size="sm" color="accent">
        Up next
      </Chip>
    );
  }
  return (
    <Chip size="sm" variant="soft" color="default">
      Locked
    </Chip>
  );
}

function OpenChecklist({ sessionId, blocks }: { sessionId: SessionId; blocks: SessionBlock[] }) {
  const ticked = useChecklist((state) => state.ticked[sessionId] ?? NO_TICKS);
  const toggle = useChecklist((state) => state.toggle);
  return (
    <View className="gap-3">
      {blocks.map((block, index) => (
        <CheckableBlockRow
          key={block.kind}
          block={block}
          isTicked={ticked.includes(index)}
          onToggle={() => {
            void Haptics.selectionAsync();
            toggle(sessionId, index);
          }}
        />
      ))}
    </View>
  );
}

function CompleteBar({
  sessionId,
  blockCount,
  nextTitle,
}: {
  sessionId: SessionId;
  blockCount: number;
  nextTitle: string | undefined;
}) {
  const complete = useCompleteSession();
  const plan = usePlan();
  const { toast } = useToast();
  const tickedCount = useChecklist((state) => (state.ticked[sessionId] ?? NO_TICKS).length);
  const allTicked = tickedCount === blockCount;

  // A small pulse the moment the last block is ticked and the button becomes available.
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const wasAllTicked = useRef(allTicked);
  useEffect(() => {
    if (allTicked && !wasAllTicked.current && !reducedMotion) {
      scale.value = withSequence(
        withTiming(1.03, { duration: 120 }),
        withTiming(1, { duration: 160 }),
      );
    }
    wasAllTicked.current = allTicked;
  }, [allTicked, reducedMotion, scale]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const caption = !allTicked
    ? 'Tick each block as you finish it.'
    : nextTitle
      ? `Finishing unlocks ${nextTitle}.`
      : 'Finishing completes your plan.';

  // The ticks are cleared by the mutation hook itself (it outlives this screen).
  const onComplete = () =>
    complete.mutate(sessionId, {
      onSuccess: (updated) => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        usePlanCelebration
          .getState()
          .celebrate(
            updated.nextSessionId
              ? { kind: 'unlock', sessionId: updated.nextSessionId }
              : { kind: 'planComplete' },
          );
        backToPlan();
      },
      onError: (error) => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        if (error.code === 'SESSION_LOCKED') {
          toast.show({ variant: 'danger', label: 'This session is still locked.' });
          void plan.refetch();
        } else {
          toast.show({
            variant: 'danger',
            label: "Couldn't save. Check your connection and try again.",
          });
        }
      },
    });

  return (
    <View className="gap-3 border-t border-separator bg-background px-5 pb-safe-offset-3 pt-3">
      <Typography type="body-sm" color="muted" align="center">
        {caption}
      </Typography>
      <Animated.View style={pulseStyle}>
        <SubmitButton
          label="Complete session"
          isDisabled={!allTicked}
          isPending={complete.isPending}
          onPress={onComplete}
        />
      </Animated.View>
    </View>
  );
}
