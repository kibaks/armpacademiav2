import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';
const result = await build({ entryPoints: ['src/data/coursesData.ts'], bundle: true, format: 'esm', platform: 'node', write: false, loader: { '.jpg': 'empty' } });
const { COURSES_DATA } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
await writeFile('backend/courseBank.json', JSON.stringify(COURSES_DATA.map(({ id, code, title, quiz }) => ({ id, code, title, quiz })), null, 2) + '\n');
