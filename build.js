import * as esbuild from 'esbuild';
import {chmod, cp, mkdir, readFile, rm, writeFile} from 'fs/promises';

await rm('dist', {recursive: true, force: true});
await mkdir('dist', {recursive: true});

await esbuild.build({
  entryPoints: ['src/cli.ts'],
  bundle: false,
  minify: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outdir: 'dist',
});

const cliCode = await readFile('dist/cli.js', 'utf-8');
const cleanedCode = cliCode.replace(/^#!.*\n/g, '');
await writeFile('dist/cli.js', '#!/usr/bin/env node\n' + cleanedCode);
await chmod('dist/cli.js', 0o755);

await cp('templates', 'dist/templates', {recursive: true});

const pkg = JSON.parse(await readFile('package.json', 'utf-8'));
delete pkg.devDependencies;
delete pkg.scripts;
delete pkg.private;
pkg.bin['create-tinybase'] = 'cli.js';
pkg.files = ['cli.js', 'templates'];
await writeFile('dist/package.json', JSON.stringify(pkg, null, 2));

console.log('✅ Built and minified CLI');
