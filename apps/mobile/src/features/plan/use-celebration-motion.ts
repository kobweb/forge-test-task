import { useLayoutEffect } from 'react';
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

/** Focus returns as the pop transition starts, so the motion waits until the Plan is in view. */
export const REVEAL_DELAY_MS = 350;

/**
 * The one-off "unlocked" motion: the card springs from 0.96 to 1, its accent border fades in
 * and the connector above it fills. With Reduce Motion on, only the fades run.
 */
export function useCelebrationMotion(active: boolean) {
  const reducedMotion = useReducedMotion();
  // Seeded at the start state when mounted mid-celebration, so no frame paints the end state.
  const scale = useSharedValue(active && !reducedMotion ? 0.96 : 1);
  const glow = useSharedValue(active ? 0 : 1);
  const fill = useSharedValue(active ? 0 : 1);

  // A layout effect, so the start values land in the same commit as the "open" render.
  useLayoutEffect(() => {
    if (!active) return;
    glow.value = 0;
    fill.value = 0;
    glow.value = withDelay(REVEAL_DELAY_MS, withTiming(1, { duration: 450 }));
    fill.value = withDelay(REVEAL_DELAY_MS, withTiming(1, { duration: 350 }));
    if (!reducedMotion) {
      scale.value = 0.96;
      scale.value = withDelay(REVEAL_DELAY_MS, withSpring(1, { damping: 12, stiffness: 180 }));
    }
  }, [active, reducedMotion, scale, glow, fill]);

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const borderStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const connectorStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: fill.value }] }));

  return { cardStyle, borderStyle, connectorStyle };
}
