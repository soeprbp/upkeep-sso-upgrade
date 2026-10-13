import { access, cp, mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const standalone = path.join(root, '.next', 'standalone');
const standaloneNext = path.join(standalone, '.next');

await access(path.join(standalone, 'server.js'));
await mkdir(standaloneNext, { recursive: true });

for (const target of [path.join(standalone, 'public'), path.join(standaloneNext, 'static')]) {
  await rm(target, { recursive: true, force: true });
}

await cp(path.join(root, 'public'), path.join(standalone, 'public'), { recursive: true });
await cp(path.join(root, '.next', 'static'), path.join(standaloneNext, 'static'), { recursive: true });

// electron-builder deliberately filters folders named node_modules from extraResources.
// Stage the traced standalone runtime under a neutral name and expose it through NODE_PATH.
const nodeModules = path.join(standalone, 'node_modules');
const vendorModules = path.join(standalone, 'vendor');
await rm(vendorModules, { recursive: true, force: true });
await rename(nodeModules, vendorModules);

console.log(`Desktop server staged at ${standalone}`);
