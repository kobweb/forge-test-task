import { useEffect } from 'react';
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

/**
 * The one-off "unlocked" motion: the card springs from 0.96 to 1, its accent border fades in
 * and the connector above it fills. With Reduce Motion on, only the fades run.
 */
export function useCelebrationMotion(active: boolean) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const glow = useSharedValue(1);
  const fill = useSharedValue(1);

  useEffect(() => {
    if (!active) return;
    glow.value = withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: 450 }));
    fill.value = withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: 350 }));
    if (!reducedMotion) {
      scale.value = withSequence(
        withTiming(0.96, { duration: 0 }),
        withSpring(1, { damping: 12, stiffness: 180 }),
      );
    }
  }, [active, reducedMotion, scale, glow, fill]);

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const borderStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const connectorStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: fill.value }] }));

  return { cardStyle, borderStyle, connectorStyle };
}
