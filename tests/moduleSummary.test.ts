import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { buildModuleSummary } from '../src/utils/moduleSummary';
import type { CourseModule } from '../src/types';

test('summary preserves conditions and covers every chapter without generic promises', () => {
  const course = { id: 'test', title: 'Paiements', description: 'Le paiement doit être justifié.', lessons: [
    { title: 'Pièces de paiement', content: '[Scène: ledger] Vérifier : Le paiement est possible si les pièces exigées sont réunies. La condition reste applicable.\n\n[Scène: inspection] Contrôler : La réception ne vaut pas paiement.' },
    { title: 'Réserves', content: '[Scène: delivery] À retenir : Les réserves doivent être suivies.' },
  ] } as CourseModule;
  const summary = buildModuleSummary(course);
  assert.equal(summary.length, 2);
  assert.match(summary[0].spoken, /si les pièces exigées sont réunies/);
  assert.match(summary[0].spoken, /ne vaut pas paiement/);
  assert.ok(!summary[0].spoken.includes('[Scène:'));
  assert.notEqual(summary[0].caption, summary[1].caption);
});

test('all catalogue modules have a concise recap and narration for every chapter', async () => {
  const bundle = await build({ stdin: { contents: "export { COURSES_DATA } from './src/data/coursesData';", resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm', platform: 'node', loader: { '.jpg': 'dataurl', '.png': 'dataurl' } });
  const { COURSES_DATA } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
  for (const course of COURSES_DATA as CourseModule[]) {
    const summary = buildModuleSummary(course);
    assert.equal(summary.length, course.lessons.length, course.id);
    for (const chapter of summary) {
      assert.ok(chapter.spoken.trim(), course.id);
      assert.ok(chapter.caption.trim(), course.id);
      assert.ok(chapter.caption.length <= 96, course.id);
      assert.ok(chapter.caption.split(/\s+/).length <= 12, course.id);
      assert.ok(!/modèles officiels prêts|ANO DGCMP obligatoire/.test(chapter.spoken), course.id);
    }
  }
});
