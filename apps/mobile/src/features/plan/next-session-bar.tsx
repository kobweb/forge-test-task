import type { PlanView } from '@forge/contracts';
import { Button, Surface, Typography } from 'heroui-native';
import { View } from 'react-native';
import { SubmitButton } from '@/components/submit-button';

interface NextSessionBarProps {
  plan: PlanView;
  onStart: () => void;
  onRestart: () => void;
  isRestarting: boolean;
}

/** The Plan screen's one primary action, pinned above the tab bar. */
export function NextSessionBar({ plan, onStart, onRestart, isRestarting }: NextSessionBarProps) {
  const next = plan.sessions.find((session) => session.id === plan.nextSessionId);

  return (
    <View className="absolute inset-x-0 bottom-0 px-5 pb-3">
      <Surface className="flex-row items-center gap-4 shadow-overlay">
        <View className="flex-1 gap-0.5">
          <Typography type="body-xs" color="muted" className="uppercase tracking-wider">
            {next ? 'Next session' : 'Plan complete'}
          </Typography>
          <Typography type="body" weight="semibold" numberOfLines={1}>
            {next
              ? `${next.title} · ${next.durationMinutes} min`
              : `${plan.completedCount} of ${plan.totalCount} sessions`}
          </Typography>
        </View>
        {next ? (
          <Button onPress={onStart}>Start</Button>
        ) : (
          <View className="min-w-32">
            <SubmitButton label="Restart plan" isPending={isRestarting} onPress={onRestart} />
          </View>
        )}
      </Surface>
    </View>
  );
}
