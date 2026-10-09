import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toAdminCsv } from '../src/utils/adminExport';

test('CSV preserves French text, separators, quotes, multiline values and missing fields', () => {
  assert.equal(toAdminCsv([['École; ARMP', '"cours"', 'une\ndeux', null]]), '\uFEFF"École; ARMP";"""cours""";"une\ndeux";""');
});
test('CSV neutralizes spreadsheet formulas even after leading whitespace', () => {
  for (const value of ['=HYPERLINK("bad")', '+SUM(1)', '-1+2', '@SUM(1)', ' \t=SUM(1)']) {
    assert.ok(toAdminCsv([[value]]).startsWith('\uFEFF"\''));
  }
});
