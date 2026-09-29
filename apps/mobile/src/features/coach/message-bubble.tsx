import type { CoachMessage } from '@forge/contracts';
import { cn, Typography } from 'heroui-native';
import { View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';

// Only coach bubbles fade in: the user's optimistic bubble is swapped for the server's copy (new
// id, new cell) on success, so an entering animation would replay on a bubble already on screen.
export function MessageBubble({ message }: { message: CoachMessage }) {
  const reducedMotion = useReducedMotion();
  const fromUser = message.role === 'user';
  return (
    <Animated.View
      entering={reducedMotion || fromUser ? undefined : FadeIn.duration(220)}
      className={cn('flex-row', fromUser ? 'justify-end pl-12' : 'justify-start pr-12')}
      accessible
      accessibilityLabel={`${fromUser ? 'You' : 'Coach'}: ${message.text}`}
    >
      <View className={cn('rounded-3xl px-4 py-3', fromUser ? 'bg-accent' : 'bg-surface')}>
        <Typography
          type="body"
          className={fromUser ? 'text-accent-foreground' : 'text-surface-foreground'}
        >
          {message.text}
        </Typography>
      </View>
    </Animated.View>
  );
}
