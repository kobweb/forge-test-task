import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

function Dot({ delay }: { delay: number }) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(0.35);
  useEffect(() => {
    if (reducedMotion) return;
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(1, { duration: 320 }), withTiming(0.35, { duration: 320 })),
        -1,
      ),
    );
  }, [delay, opacity, reducedMotion]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={style} className="size-2 rounded-full bg-muted" />;
}

/** "Coach is typing" while the reply is on its way (600–1200 ms). */
export function TypingIndicator() {
  return (
    <View className="flex-row justify-start pr-12" accessible accessibilityLabel="Coach is typing">
      <View className="flex-row items-center gap-1.5 rounded-3xl bg-surface px-4 py-4">
        <Dot delay={0} />
        <Dot delay={160} />
        <Dot delay={320} />
      </View>
    </View>
  );
}
