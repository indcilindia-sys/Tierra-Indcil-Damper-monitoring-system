const IST_OFFSET = 5.5 * 60 * 60 * 1000;

export function parseDateTime(date, time = '00:00:00') {
  const [day, month, year] = String(date).trim().split('-').map(Number);
  const [hour = 0, minute = 0, second = 0] = String(time).trim().split(':').map(Number);
  if (![day, month, year, hour, minute, second].every(Number.isFinite)) return null;
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second) - IST_OFFSET);
}
export function dateInputToInstant(input, end = false) {
  if (!input) return null;
  const [year, month, day] = input.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, end ? 23 : 0, end ? 59 : 0, end ? 59 : 0) - IST_OFFSET);
}
export function instantToInput(date) {
  const shifted = new Date(date.getTime() + IST_OFFSET);
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`;
}
export function formatDate(date) { return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }).format(date); }
export function formatDateKey(date) { const s = instantToInput(date); const [y,m,d] = s.split('-'); return `${d}-${m}-${y}`; }
export function formatDuration(ms = 0) { const s = Math.max(0, Math.floor(ms / 1000)); return `${String(Math.floor(s / 3600)).padStart(2,'0')}h ${String(Math.floor(s % 3600 / 60)).padStart(2,'0')}m ${String(s % 60).padStart(2,'0')}s`; }
export function dateForInput(input) { return formatDate(dateInputToInstant(input)); }
