import type { PlanSession } from '@forge/contracts';
import { Chip, cn, PressableFeedback, Surface, Typography } from 'heroui-native';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Icon } from '@/components/icon';
import { useCelebrationMotion } from './use-celebration-motion';

interface TimelineItemProps {
  session: PlanSession;
  isFirst: boolean;
  isLast: boolean;
  previousCompleted: boolean;
  celebrate: boolean;
  onPress: () => void;
}

/** One session on the timeline: a status node on the rail, joined to its neighbours, and a card. */
export function TimelineItem({
  session,
  isFirst,
  isLast,
  previousCompleted,
  celebrate,
  onPress,
}: TimelineItemProps) {
  const { cardStyle, borderStyle, connectorStyle } = useCelebrationMotion(celebrate);
  const { status } = session;

  return (
    <View className="flex-row gap-4">
      <View className="w-8 items-center">
        <View className={cn('w-0.5 flex-1', isFirst ? 'bg-transparent' : 'bg-separator')}>
          {!isFirst && previousCompleted ? (
            <Animated.View
              style={[connectorStyle, { transformOrigin: 'top' }]}
              className="flex-1 bg-accent"
            />
          ) : null}
        </View>
        <StatusNode status={status} />
        <View
          className={cn(
            'w-0.5 flex-1',
            isLast ? 'bg-transparent' : status === 'completed' ? 'bg-accent' : 'bg-separator',
          )}
        />
      </View>

      <PressableFeedback
        onPress={onPress}
        className="flex-1 py-2"
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabelFor(session)}
      >
        <Animated.View style={cardStyle}>
          <Surface
            variant={status === 'completed' ? 'secondary' : 'default'}
            className={cn('gap-1.5', status === 'locked' && 'shadow-none')}
          >
            {status === 'open' ? (
              <Animated.View
                pointerEvents="none"
                style={borderStyle}
                className="absolute inset-0 rounded-3xl border-2 border-accent"
              />
            ) : null}
            <Typography type="body-xs" color="muted" className="uppercase tracking-wider">
              {`Session ${session.number} · ${session.durationMinutes} min`}
            </Typography>
            <Typography type="h5" color={status === 'open' ? 'default' : 'muted'}>
              {session.title}
            </Typography>
            <Typography type="body-sm" color="muted">
              {session.subtitle}
            </Typography>
            <View className="mt-2 flex-row items-center gap-1.5">
              <StatusLine session={session} />
            </View>
          </Surface>
        </Animated.View>
      </PressableFeedback>
    </View>
  );
}

function StatusNode({ status }: { status: PlanSession['status'] }) {
  if (status === 'completed') {
    return (
      <View className="size-8 items-center justify-center rounded-full bg-accent">
        <Icon name="checkmark" size={18} className="text-accent-foreground" />
      </View>
    );
  }
  if (status === 'open') {
    return (
      <View className="size-8 items-center justify-center rounded-full border-2 border-accent bg-background">
        <View className="size-3 rounded-full bg-accent" />
      </View>
    );
  }
  return (
    <View className="size-8 items-center justify-center rounded-full bg-default">
      <Icon name="lock-closed" size={14} className="text-muted" />
    </View>
  );
}

function StatusLine({ session }: { session: PlanSession }) {
  if (session.status === 'completed') {
    return (
      <>
        <Icon name="checkmark-circle" size={16} className="text-muted" />
        <Typography type="body-sm" color="muted">
          Completed
        </Typography>
      </>
    );
  }
  if (session.status === 'open') {
    return (
      <Chip size="sm" color="accent">
        Up next
      </Chip>
    );
  }
  return (
    <>
      <Icon name="lock-closed" size={14} className="text-muted" />
      <Typography type="body-sm" color="muted">
        {`Unlocks after Session ${session.number - 1}`}
      </Typography>
    </>
  );
}

function accessibilityLabelFor(session: PlanSession): string {
  const where = `Session ${session.number}, ${session.title}`;
  if (session.status === 'completed') return `${where}, completed`;
  if (session.status === 'open') return `${where}, up next`;
  return `${where}, locked. Unlocks after Session ${session.number - 1}`;
}
