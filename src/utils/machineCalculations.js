import { parseDateTime, dateInputToInstant, formatDateKey } from './dateUtils';

export function displayStatus(status) {
  return status === 'ON' ? 'Open' : status === 'OFF' ? 'Close' : status;
}

export function normalizeEvents(rows) {
  return rows.map((row, index) => ({ ...row, status: String(row.status).trim().toUpperCase(), at: parseDateTime(row.date, row.time), index })).filter(x => x.at && (x.status === 'ON' || x.status === 'OFF')).sort((a,b) => a.at - b.at || a.index - b.index);
}
export function machineStateAt(events, point) {
  let state = 'OFF'; for (const event of events) { if (event.at > point) break; state = event.status; } return state;
}
export function buildPeriods(events, rangeStart, rangeEnd) {
  if (!rangeStart || !rangeEnd || rangeEnd < rangeStart) return [];
  let state = machineStateAt(events, rangeStart), cursor = rangeStart, periods = [];
  for (const event of events) {
    if (event.at <= rangeStart || event.at > rangeEnd) continue;
    if (event.at > cursor) periods.push({ start: cursor, end: event.at, status: state });
    cursor = event.at; state = event.status;
  }
  if (cursor < rangeEnd) periods.push({ start: cursor, end: rangeEnd, status: state });
  return periods;
}
export function openingCount(events, start, end) {
  let previous = machineStateAt(events, start); let count = 0;
  for (const event of events) { if (event.at <= start || event.at > end) continue; if (previous === 'OFF' && event.status === 'ON') count++; previous = event.status; }
  return count;
}
export function totalOn(periods) {
  return periods
    .filter(period => period.status === 'ON')
    .reduce((sum, period) => sum + (Number(period.end) - Number(period.start)), 0);
}
export function calculateReport(events, from, to, now = new Date()) {
  const start = dateInputToInstant(from), end = dateInputToInstant(to, true);
  const accountingEnd = end < now ? end : now;
  const periods = buildPeriods(events, start, accountingEnd), onTime = totalOn(periods);
  const dates = []; for (let d = new Date(start); d <= accountingEnd; d = new Date(d.getTime() + 86400000)) dates.push(new Date(d));
  const daily = dates.map(day => { const dayEnd = new Date(day.getTime() + 86400000 - 1000); const next = dayEnd < accountingEnd ? dayEnd : accountingEnd; const ps = buildPeriods(events, day, next); return { date: formatDateKey(day), openTime: totalOn(ps), openCount: openingCount(events, day, next), periods: ps.filter(p=>p.status==='ON').length }; });
  const monthly = Object.values(daily.reduce((all, day) => { const key = day.date.slice(3); all[key] ||= { month: key, openTime: 0, openCount: 0 }; all[key].openTime += day.openTime; all[key].openCount += day.openCount; return all; }, {}));
  let priorState = machineStateAt(events, start);
  const history = events.filter(e => e.at >= start && e.at <= accountingEnd).map(event => {
    const isOpening = priorState === 'OFF' && event.status === 'ON';
    priorState = event.status;
    const closeEvent = isOpening ? events.find(next => next.at > event.at && next.status === 'OFF') : null;
    const periodEnd = closeEvent?.at || accountingEnd;
    const duration = isOpening ? Math.max(0, Math.min(periodEnd, accountingEnd) - event.at) : 0;
    const cumulativePoint = isOpening ? Math.min(periodEnd, accountingEnd) : event.at;
    const cumulative = totalOn(buildPeriods(events, start, cumulativePoint));
    return { ...event, duration, cumulative, openCount: openingCount(events, start, event.at) };
  });
  return { start, end, periods, onTime, openCount: openingCount(events, start, accountingEnd), daily, monthly, history };
}
