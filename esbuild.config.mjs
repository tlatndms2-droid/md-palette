import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
const { version } = JSON.parse(await readFile('manifest.json', 'utf8'));

await build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: ['obsidian', 'electron'],
  format: 'cjs',
  target: 'es2022',
  outfile: 'main.js',
  logLevel: 'info',
  banner: { js: `/* MD Palette ${version} */` }
});
