import { GOOGLE_SCRIPT_URL } from '../config/config';

export async function fetchMachineEvents(signal) {
  const url = new URL(GOOGLE_SCRIPT_URL);
  url.searchParams.set('action', 'read');
  const response = await fetch(url, { signal, cache: 'no-store' });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  const payload = await response.json();
  if (!payload?.success || !Array.isArray(payload.data)) throw new Error(payload?.error || 'Unexpected response from Google Sheets');
  return payload.data;
}
