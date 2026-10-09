// Quote every cell and neutralize spreadsheet formulas in user-controlled values.
export function toAdminCsv(rows: unknown[][]): string {
  return '\uFEFF' + rows.map(row => row.map(value => {
    let text = String(value ?? '');
    if (/^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }).join(';')).join('\r\n');
}

export function downloadAdminCsv(name: string, rows: unknown[][]): void {
  const url = URL.createObjectURL(new Blob([toAdminCsv(rows)], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url; link.download = name;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
