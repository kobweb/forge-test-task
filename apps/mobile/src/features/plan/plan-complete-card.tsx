import { Surface, Typography } from 'heroui-native';
import { View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { Icon } from '@/components/icon';

export function PlanCompleteCard({ animate }: { animate: boolean }) {
  const reducedMotion = useReducedMotion();
  return (
    <Animated.View entering={animate && !reducedMotion ? FadeInDown.duration(400) : undefined}>
      <Surface variant="secondary" className="flex-row items-center gap-4">
        <View className="size-11 items-center justify-center rounded-full bg-success">
          <Icon name="trophy" size={22} className="text-success-foreground" />
        </View>
        <View className="flex-1 gap-0.5">
          <Typography type="h6">Plan complete</Typography>
          <Typography type="body-sm" color="muted">
            All three sessions done. Run it back to lock in the habit.
          </Typography>
        </View>
      </Surface>
    </Animated.View>
  );
}
