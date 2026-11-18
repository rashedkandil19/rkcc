// Exports use the exact rows shown on screen. Money columns export in major units (EGP).
export const raw = (c, row) => { const v = row[c.k]; return v == null ? '' : c.t === 'money' ? Number(v) / 100 : v; };
const cell = v => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s) && isNaN(Number(s))) s = "'" + s; return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export const toCSV = (cols, rows) => '\ufeff' + [cols.map(c => cell(c.l)).join(','), ...rows.map(r => cols.map(c => cell(raw(c, r))).join(','))].join('\r\n');
export function download(name, content, type) {
  const url = URL.createObjectURL(content instanceof Blob ? content : new Blob([content], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export const stamp = () => new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
export const downloadCSV = (name, cols, rows) => download(`${name}-${stamp()}.csv`, toCSV(cols, rows), 'text/csv;charset=utf-8');
export const downloadJSON = (name, obj) => download(`${name}-${stamp()}.json`, JSON.stringify(obj, null, 2), 'application/json');
export const reportJSON = (cols, rows) => rows.map(r => Object.fromEntries(cols.map(c => [c.l, raw(c, r)])));

let xl;
const loadExcel = () => xl ||= new Promise((res, rej) => {
  if (window.ExcelJS) return res(window.ExcelJS);
  const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';
  s.onload = () => res(window.ExcelJS); s.onerror = () => { xl = null; rej(new Error('Could not load the Excel library. Check your internet connection.')); };
  document.head.append(s);
});
/** sheets: [{name, cols, rows}] */
export async function downloadXLSX(name, sheets) {
  const ExcelJS = await loadExcel(), wb = new ExcelJS.Workbook(), used = new Set();
  for (const s of sheets) {
    let n = s.name.replace(/[\\/?*[\]:]/g, ' ').slice(0, 28), i = 1; while (used.has(n)) n = n.slice(0, 25) + ' ' + ++i; used.add(n);
    const ws = wb.addWorksheet(n);
    ws.columns = s.cols.map(c => ({ header: c.l, key: c.k, width: Math.max(12, c.l.length + 4) }));
    ws.getRow(1).font = { bold: true };
    s.rows.forEach(r => ws.addRow(Object.fromEntries(s.cols.map(c => [c.k, typeof raw(c, r) === 'string' && /^[=+\-@]/.test(raw(c, r)) ? "'" + raw(c, r) : raw(c, r)]))));
    s.cols.forEach((c, i) => { if (c.t === 'money') ws.getColumn(i + 1).numFmt = '#,##0.00'; });
  }
  download(`${name}-${stamp()}.xlsx`, new Blob([await wb.xlsx.writeBuffer()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
}
