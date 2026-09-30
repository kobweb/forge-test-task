import { ListGroup, SkeletonGroup, Switch } from 'heroui-native';
import { useState } from 'react';
import { analytics, type PermissionKind } from '@/lib/analytics';
import {
  openSystemSettings,
  requestNotifications,
  requestTracking,
  type PermissionStatus,
} from '@/lib/permissions';
import { queryClient } from '@/lib/query-client';
import { usePrivacy } from '@/stores/privacy-store';
import { permissionKeys, useNotificationStatus, useTrackingStatus } from './api';

const NOTIFICATION_LABELS: Record<PermissionStatus, string> = {
  granted: 'On',
  denied: 'Off',
  undetermined: 'Not set',
  unavailable: 'Unavailable',
};

const TRACKING_LABELS: Record<PermissionStatus, string> = {
  granted: 'Allowed',
  denied: 'Not allowed',
  undetermined: 'Not set',
  unavailable: 'Unavailable',
};

export function NotificationsRow() {
  const status = useNotificationStatus();
  return (
    <SystemPermissionRow
      kind="notifications"
      title="Notifications"
      status={status.data}
      labels={NOTIFICATION_LABELS}
      request={requestNotifications}
    />
  );
}

/** iOS only: render it behind a `Platform.OS === 'ios'` check. */
export function TrackingRow() {
  const status = useTrackingStatus();
  return (
    <SystemPermissionRow
      kind="tracking"
      title="Tracking"
      status={status.data}
      labels={TRACKING_LABELS}
      request={requestTracking}
    />
  );
}

interface SystemPermissionRowProps {
  kind: Exclude<PermissionKind, 'analytics'>;
  title: string;
  status: PermissionStatus | undefined;
  labels: Record<PermissionStatus, string>;
  request: () => Promise<PermissionStatus>;
}

// iOS asks once. While the answer is still open the row asks; after that only the system
// Settings app can change it, so the row opens that instead.
function SystemPermissionRow({ kind, title, status, labels, request }: SystemPermissionRowProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  // Until the status is known the row shows a skeleton, never a guessed value.
  if (status === undefined) {
    return (
      <ListGroup.Item accessible accessibilityLabel={`Checking ${title.toLowerCase()}`}>
        <ListGroup.ItemContent>
          <SkeletonGroup isLoading isSkeletonOnly className="gap-2">
            <SkeletonGroup.Item className="h-5 w-1/3 rounded-md" />
            <SkeletonGroup.Item className="h-4 w-1/4 rounded-md" />
          </SkeletonGroup>
        </ListGroup.ItemContent>
      </ListGroup.Item>
    );
  }

  if (status === 'unavailable') {
    return (
      <ListGroup.Item>
        <ListGroup.ItemContent>
          <ListGroup.ItemTitle>{title}</ListGroup.ItemTitle>
          <ListGroup.ItemDescription>{labels.unavailable}</ListGroup.ItemDescription>
        </ListGroup.ItemContent>
      </ListGroup.Item>
    );
  }

  const onPress = async () => {
    if (status !== 'undetermined') {
      await openSystemSettings();
      return;
    }
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      const result = await request();
      queryClient.setQueryData(permissionKeys[kind], result);
      analytics.track('permission_result', {
        kind,
        result: result === 'granted' ? 'granted' : 'denied',
      });
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <ListGroup.Item accessibilityRole="button" onPress={() => void onPress()}>
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle>{title}</ListGroup.ItemTitle>
        <ListGroup.ItemDescription>{labels[status]}</ListGroup.ItemDescription>
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix />
    </ListGroup.Item>
  );
}

export function AnalyticsRow() {
  const isOn = usePrivacy((state) => state.analytics === 'granted');

  const toggle = (next: boolean) => {
    usePrivacy.getState().setAnalytics(next ? 'granted' : 'denied');
    // Only a "yes" is reported: once it is off, nothing is sent, including the fact it is off.
    if (next) analytics.track('permission_result', { kind: 'analytics', result: 'granted' });
  };

  return (
    <ListGroup.Item>
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle>Usage analytics</ListGroup.ItemTitle>
        <ListGroup.ItemDescription>
          {isOn ? 'Sharing screens opened and sessions finished' : 'Off'}
        </ListGroup.ItemDescription>
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix>
        <Switch isSelected={isOn} onSelectedChange={toggle} accessibilityLabel="Usage analytics" />
      </ListGroup.ItemSuffix>
    </ListGroup.Item>
  );
}
