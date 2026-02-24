function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function exportTimestamp(d = new Date()): string {
  const yy = pad2(d.getFullYear() % 100);
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const min = pad2(d.getMinutes());
  return `${yy}-${mm}-${dd}_${hh}-${min}`;
}

function sanitizeBaseName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned || 'book';
}

export function buildExportBaseName(name: string, now = new Date()): string {
  return `${sanitizeBaseName(name)}_${exportTimestamp(now)}`;
}

