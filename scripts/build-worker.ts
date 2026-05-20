import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

async function build() {
  await esbuild.build({
    entryPoints: [path.join(ROOT, 'src', 'workers', 'spell-worker.ts')],
    outfile: path.join(ROOT, 'public', 'spell-worker.js'),
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2020',
    minify: false,
    sourcemap: false,
    plugins: [
      {
        name: 'shim-node-modules',
        setup(build) {
          build.onResolve({ filter: /^node:/ }, (args) => {
            return { path: args.path, namespace: 'shim-node' };
          });
          build.onLoad({ filter: /.*/, namespace: 'shim-node' }, () => {
            return {
              contents: `
                export const readFileSync = () => { throw new Error('fs shim'); };
                export const resolve = () => '';
                export const dirname = () => '';
                export const fileURLToPath = () => '';
                export default {};
              `,
            };
          });
        },
      },
    ],
  });
  console.log('spell-worker.js built successfully');
}

build().catch((e) => {
  console.error('Build failed:', e);
  process.exit(1);
});
