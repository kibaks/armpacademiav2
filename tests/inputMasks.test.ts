import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDRCPhoneMask, isValidDRCPhone, filterPersonNameMask, filterEmailMask, formatMatriculeOrRccmMask, isValidPastDate, validateCivilIdentity } from '../src/utils/inputMasks.js';

test('RDC phone mask normalizes national, international and 00-prefixed pasted numbers', () => {
  for (const raw of ['0812345678', '+243 81 234 5678', '00243812345678', '812345678']) assert.equal(formatDRCPhoneMask(raw), '+243 81 234 5678');
  assert.equal(formatDRCPhoneMask(''), '+243 ');
  assert.equal(formatDRCPhoneMask('+243 81'), '+243 81');
  assert.ok(isValidDRCPhone(formatDRCPhoneMask('0812345678')));
  assert.equal(isValidDRCPhone('+243 81 234'), false);
});
test('name masks retain accents, combining accents, apostrophes and Unicode letters', () => {
  assert.equal(filterPersonNameMask('e\u0301lodie o’neil 42×'), 'Élodie O’Neil ');
  assert.equal(filterPersonNameMask('ngũgĩ-wa-thiong’o'), 'Ngũgĩ-Wa-Thiong’O');
});
test('email mask preserves valid plus tags and apostrophes', () => {
  assert.equal(filterEmailMask(" O'NEIL+Formation@Exemple.cd "), "o'neil+formation@exemple.cd");
});
test('identifier formatting preserves complete document references', () => {
  assert.equal(formatMatriculeOrRccmMask('cd/kin/rccm/2026-b-00012345.07'), 'CD/KIN/RCCM/2026-B-00012345.07');
});
test('identity dates reject impossible and future dates, including leap years', () => {
  assert.equal(isValidPastDate('2024-02-29', '2026-10-12'), true);
  assert.equal(isValidPastDate('2025-02-29', '2026-10-12'), false);
  assert.equal(isValidPastDate('2026-10-13', '2026-10-12'), false);
  assert.equal(isValidPastDate('', '2026-10-12'), false);
});
test('identity validation requires real names and email without requiring optional data', () => {
  const identity = { nom: 'MBUYI', postnom: 'KABILA', prenom: 'Élodie', email: 'elodie+formation@example.test', civilite: '', sexe: 'F' as const, naissance: '', lieu: '', nationalite: '', etatCivil: '', piece: '' };
  assert.deepEqual(validateCivilIdentity(identity), {});
  const errors = validateCivilIdentity({ ...identity, nom: '123', email: 'a@@b.cd', naissance: '2099-02-31' });
  assert.ok(errors.nom); assert.ok(errors.email); assert.ok(errors.naissance);
});
