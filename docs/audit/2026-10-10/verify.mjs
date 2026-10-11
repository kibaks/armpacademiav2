import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { toAdminCsv } from '../../../src/utils/adminExport.ts';

const root = new URL('../../../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');
const tree = JSON.parse(fs.readFileSync(new URL('./snapshot-tree.json', import.meta.url), 'utf8'));
const checks = [];
const record = (name, evidence) => checks.push({ name, evidence });
let verified = 0;
for (const entry of tree.tree) {
  if (entry.type !== 'blob' || /^(public\/|src\/assets\/)/.test(entry.path)) continue;
  const b = fs.readFileSync(new URL(entry.path, root));
  const hash = crypto.createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');
  assert.equal(hash, entry.sha, entry.path);
  verified++;
}
record('Intégrité de la copie', { commit: tree.sha, verifiedGitBlobs: verified });

const server = read('server.ts');
const vercel = read('backend/vercelApp.ts');
const routes = source => [...source.matchAll(/app\.(get|post|patch|delete|put)\(\s*(?:\[)?\s*['"]([^'"]+)['"]/g)].map(m => `${m[1].toUpperCase()} ${m[2]}`);
const localRoutes = routes(server);
const deployedRoutes = routes(vercel);
const missing = localRoutes.filter(r => !deployedRoutes.includes(r));
assert(missing.includes('POST /api/2fa/send'));
assert(missing.includes('POST /api/cgpmp/send-credentials-email'));
assert(missing.includes('POST /api/ai/generate-animated-module'));
record('Écarts entre les deux serveurs (routers communs exclus)', { localRoutes, deployedRoutes, missingOnVercel: missing });

// Exécution de l'expression de calcul extraite du code, sans lancer une API.
const scoreExpression = vercel.match(/const score = (Math\.round\(\(correctCount[^;]+);/)[1];
const score = new Function('correctCount', 'answers', `return ${scoreExpression};`);
const results = [
  { correct: 0, answers: Array(5).fill({isCorrect:false}) },
  { correct: 0, answers: [] },
  { correct: 5, answers: Array(5).fill({isCorrect:true}) },
].map(t => ({ correct: t.correct, count: t.answers.length, returnedScore: score(t.correct, t.answers) }));
assert.equal(results[0].returnedScore, 75);
assert.equal(results[1].returnedScore, 75);
assert.equal(results[2].returnedScore, 100);
record('Score de positionnement : 0/5 et liste vide deviennent 75%', results);

const allowedUserUpdate = read('firestore.rules').split('\n').find(l => l.includes('allow update: if isOwner'));
assert(allowedUserUpdate.includes("['id', 'email', 'role', 'disabled']"));
for (const field of ['certificates', 'niveauValidation', 'placementScore', 'twoFactorEnabled']) assert(!allowedUserUpdate.includes(field));
record('Champs pédagogiques et second facteur absents des champs protégés', { rule: allowedUserUpdate.trim() });

const messageExpression = server.match(/let message = (\(req\.body\?\.message[^;]+);/)[1];
let thrown;
try { new Function('req', `return ${messageExpression};`)({body:{message:{invalid:true}}}); }
catch (e) { thrown = e.name; }
assert.equal(thrown, 'TypeError');
record('Expression du tuteur : message objet déclenche TypeError avant le try du fournisseur', { error: thrown, note: 'Expression isolée, pas test HTTP ni constat de crash en production.' });

assert.equal(toAdminCsv([['École; ARMP', '"cours"', 'une\ndeux', null]]), '\uFEFF"École; ARMP";"""cours""";"une\ndeux";""');
for (const value of ['=HYPERLINK("bad")', '+SUM(1)', '-1+2', '@SUM(1)', ' \t=SUM(1)']) assert(toAdminCsv([[value]]).startsWith('\uFEFF"\''));
record('Export CSV : validations du test existant exécutées sur la vraie fonction', { assertions: 6, passed: true });

const collision = n => 1 - Array.from({length:n}, (_,i)=>1-i/880).reduce((a,b)=>a*b,1);
record('Identifiants CGPMP : probabilité de collision sur 880 valeurs', [20,50,100].map(n=>({ requests:n, probability:collision(n) })));

const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
assert(vercel.includes("from 'ws'"));
assert(!pkg.dependencies.ws);
assert(lock.packages['node_modules/ws']);
record('ws est importé mais fourni seulement transitivement', { presentInLock:true, declaredDirectly:false });

const result = { executedAt:new Date().toISOString(), runtime:process.version, scope:'Vérifications statiques et expériences locales sans API externe, sans dépendances installées.', checks };
fs.writeFileSync(new URL('./evidence.json',import.meta.url), JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({ checks:checks.length, verifiedGitBlobs:verified, scoreResults:results, csvAssertions:6, missingOnVercel:missing },null,2));
