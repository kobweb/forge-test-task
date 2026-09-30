import type { AnalyticsRecord, AnalyticsSink } from './core';

const BUFFER_LIMIT = 200;
const sent: AnalyticsRecord[] = [];

/** Stands in for a real SDK: one console line per event, and the last 200 kept in memory. */
export const mockSink: AnalyticsSink = {
  send(record) {
    sent.push(record);
    if (sent.length > BUFFER_LIMIT) sent.shift();
    console.log(`[analytics] ${record.name} ${JSON.stringify(record.props)}`);
  },
};

export function getSentRecords(): readonly AnalyticsRecord[] {
  return sent;
}
