import { useQuery } from '@tanstack/react-query';
import { getNotificationStatus, getTrackingStatus, type PermissionStatus } from '@/lib/permissions';

export const permissionKeys = {
  notifications: ['permission', 'notifications'],
  tracking: ['permission', 'tracking'],
} as const;

// System permission statuses, read through TanStack Query so that coming back from the iOS
// Settings app refetches them with everything else (the focus wiring in query-client.ts).
export function useNotificationStatus() {
  return useQuery<PermissionStatus>({
    queryKey: permissionKeys.notifications,
    queryFn: getNotificationStatus,
  });
}

export function useTrackingStatus() {
  return useQuery<PermissionStatus>({
    queryKey: permissionKeys.tracking,
    queryFn: getTrackingStatus,
  });
}
