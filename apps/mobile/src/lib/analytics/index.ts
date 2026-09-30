import { createAnalytics } from './core';
import { mockSink } from './mock-sink';

/** The app's one analytics instance. Swap `mockSink` for a real SDK's sink to go live. */
export const analytics = createAnalytics(mockSink);

export type { PaywallSource, PermissionKind, PermissionResult } from './events';
