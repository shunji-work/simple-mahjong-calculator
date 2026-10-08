/**
 * 対局日時をローカル時刻で表示用に整形する。
 * withYear=true: "YYYY/MM/DD HH:mm"、false: "MM/DD HH:mm"
 */
export function formatPlayedAt(iso: string, { withYear = true }: { withYear?: boolean } = {}): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const time = `${mm}/${dd} ${hh}:${mi}`;
  return withYear ? `${yyyy}/${time}` : time;
}
