// Room snapshots are data, never markup. Escape translated/fallback labels before report HTML.
export const htmlText = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
