import type { CoachMessage } from '@forge/contracts';
import { cn, Typography } from 'heroui-native';
import { View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';

export function MessageBubble({ message }: { message: CoachMessage }) {
  const reducedMotion = useReducedMotion();
  const fromUser = message.role === 'user';
  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeIn.duration(220)}
      className={cn('flex-row', fromUser ? 'justify-end pl-12' : 'justify-start pr-12')}
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
