import { Surface, Typography } from 'heroui-native';
import { useLayoutEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Icon } from '@/components/icon';
import { REVEAL_DELAY_MS } from './use-celebration-motion';

const RISE_PT = 12;
const DURATION_MS = 400;

/**
 * The card mounts under the session screen when the last completion lands in the cache, so an
 * `entering` animation would never play; instead `animate` drives a fade (and a short rise,
 * unless Reduce Motion is on) once the Plan is back in view.
 */
export function PlanCompleteCard({ animate }: { animate: boolean }) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(animate ? 0 : 1);
  const rise = useSharedValue(animate && !reducedMotion ? RISE_PT : 0);

  useLayoutEffect(() => {
    if (!animate) return;
    opacity.value = 0;
    opacity.value = withDelay(REVEAL_DELAY_MS, withTiming(1, { duration: DURATION_MS }));
    if (!reducedMotion) {
      rise.value = RISE_PT;
      rise.value = withDelay(REVEAL_DELAY_MS, withTiming(0, { duration: DURATION_MS }));
    }
  }, [animate, reducedMotion, opacity, rise]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: rise.value }],
  }));

  return (
    <Animated.View style={style}>
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
