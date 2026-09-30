import type { EventName, PropsOf } from './events';

export type ConsentChoice = 'unknown' | 'granted' | 'denied';

export interface AnalyticsRecord {
  name: EventName;
  props: Record<string, string | number | boolean>;
  timestamp: string;
  userId: string | null;
}

export interface AnalyticsSink {
  send(record: AnalyticsRecord): void;
}

export interface Analytics {
  track<E extends EventName>(name: E, ...props: PropsOf<E>): void;
  setConsent(choice: ConsentChoice): void;
  identify(userId: string | null): void;
  reset(): void;
}

const QUEUE_LIMIT = 100;

type QueuedRecord = Omit<AnalyticsRecord, 'userId'>;

/**
 * Strict opt-in. Until the person chooses, events wait in memory; "yes" sends them in order,
 * "no" drops them, and nothing is ever written to disk. No React Native imports, so the rules
 * are unit-tested with plain Node.
 */
export function createAnalytics(
  sink: AnalyticsSink,
  now: () => Date = () => new Date(),
): Analytics {
  let consent: ConsentChoice = 'unknown';
  let userId: string | null = null;
  let queue: QueuedRecord[] = [];

  return {
    track(name, ...props) {
      if (consent === 'denied') return;
      const record: QueuedRecord = { name, props: props[0] ?? {}, timestamp: now().toISOString() };
      if (consent === 'granted') {
        sink.send({ ...record, userId });
        return;
      }
      queue.push(record);
      if (queue.length > QUEUE_LIMIT) queue.shift();
    },

    setConsent(choice) {
      consent = choice;
      if (choice === 'unknown') return;
      // The id is stamped at send time: a queued event belongs to whoever agreed to share it.
      if (choice === 'granted') for (const record of queue) sink.send({ ...record, userId });
      queue = [];
    },

    identify(id) {
      userId = id;
    },

    reset() {
      consent = 'unknown';
      userId = null;
      queue = [];
    },
  };
}
