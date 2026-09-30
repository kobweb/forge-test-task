import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { permissionKeys, useNotificationStatus, useTrackingStatus } from '@/features/privacy/api';
import { PermissionStep, type PermissionStepContent } from '@/features/privacy/permission-step';
import { analytics, type PermissionKind } from '@/lib/analytics';
import { requestNotifications, requestTracking } from '@/lib/permissions';
import { queryClient } from '@/lib/query-client';
import { usePrivacy } from '@/stores/privacy-store';

const STEPS: Record<PermissionKind, PermissionStepContent> = {
  notifications: {
    icon: 'notifications-outline',
    title: 'Stay on track',
    body: 'Get a nudge when your next session is ready. Only about your plan, never marketing.',
    reasons: [{ icon: 'settings-outline', text: 'Change it any time in Settings' }],
    primaryLabel: 'Turn on notifications',
    secondaryLabel: 'Not now',
  },
  analytics: {
    icon: 'analytics-outline',
    title: 'Help improve Forge',
    body: 'Share which screens you open and when you finish a session. Never your name, email or coach messages.',
    reasons: [
      { icon: 'bar-chart-outline', text: 'Used only to see what helps people train' },
      { icon: 'settings-outline', text: 'Switch it off any time in Settings' },
    ],
    primaryLabel: 'Share usage data',
    secondaryLabel: 'Not now',
  },
  tracking: {
    icon: 'link-outline',
    title: 'One more choice',
    body: 'iOS will ask whether Forge may link your activity with other apps and websites. Forge works the same either way.',
    reasons: [{ icon: 'settings-outline', text: 'Change it any time in iOS Settings' }],
    primaryLabel: 'Continue',
  },
};

export default function PermissionsScreen() {
  const notifications = useNotificationStatus();
  const tracking = useTrackingStatus();
  const analyticsChoice = usePrivacy((state) => state.analytics);
  // Steps answered during this visit, "Not now" included: those are not asked twice.
  const [answered, setAnswered] = useState<PermissionKind[]>([]);
  const [isPending, setIsPending] = useState(false);

  const loaded = notifications.data !== undefined && tracking.data !== undefined;
  const upcoming: PermissionKind[] = [];
  if (loaded) {
    if (notifications.data === 'undetermined' && !answered.includes('notifications')) {
      upcoming.push('notifications');
    }
    if (analyticsChoice === 'unknown') upcoming.push('analytics');
    // Tracking is only worth asking once analytics is on; it stays in the count until then.
    if (
      Platform.OS === 'ios' &&
      tracking.data === 'undetermined' &&
      analyticsChoice !== 'denied' &&
      !answered.includes('tracking')
    ) {
      upcoming.push('tracking');
    }
  }
  const step = upcoming[0];
  const finished = loaded && step === undefined;

  useEffect(() => {
    if (finished) usePrivacy.getState().setPromptsDone();
  }, [finished]);

  useEffect(() => {
    if (step) analytics.track('permission_prompt_viewed', { kind: step });
  }, [step]);

  // Nothing to show while the statuses load or once the last step is answered: the background
  // holds for the frame or two before the step appears or the guard moves on.
  if (!step) return <View className="flex-1 bg-background" />;

  const answer = (kind: PermissionKind) => setAnswered((current) => [...current, kind]);

  const allow = async () => {
    if (step === 'analytics') {
      usePrivacy.getState().setAnalytics('granted');
      analytics.track('permission_result', { kind: 'analytics', result: 'granted' });
      answer('analytics');
      return;
    }
    setIsPending(true);
    try {
      const status =
        step === 'notifications' ? await requestNotifications() : await requestTracking();
      queryClient.setQueryData(permissionKeys[step], status);
      analytics.track('permission_result', {
        kind: step,
        result: status === 'granted' ? 'granted' : 'denied',
      });
      answer(step);
    } finally {
      setIsPending(false);
    }
  };

  const notNow = () => {
    if (step === 'analytics') {
      // A "no" is never reported: reporting it would itself be tracking.
      usePrivacy.getState().setAnalytics('denied');
    } else {
      analytics.track('permission_result', { kind: step, result: 'skipped' });
    }
    answer(step);
  };

  return (
    <PermissionStep
      {...STEPS[step]}
      progress={`Step ${answered.length + 1} of ${answered.length + upcoming.length}`}
      isPending={isPending}
      onPrimary={() => void allow()}
      onSecondary={notNow}
    />
  );
}
