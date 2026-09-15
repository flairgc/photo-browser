import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import sharp from 'sharp';
const require = createRequire(import.meta.url);

test('warmup CLI: arbitrary working directory, both sizes, reuse, nonzero on failure', async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'photo-browser-cli-'));
  const root = path.join(temporary, 'photos');
  const cache = path.join(root, 'custom-cache');
  const command = fileURLToPath(new URL('../src/commands/warmup.ts', import.meta.url));
  try {
    await mkdir(root);
    await sharp({create:{width:300,height:200,channels:3,background:'blue'}}).gif().toFile(path.join(root,'test.gif'));
    const run = () => spawnSync(process.execPath, ['--import',pathToFileURL(require.resolve('tsx')).href,command,'--all-sizes'], {
      cwd:temporary, encoding:'utf8', timeout:30000,
      env:{...process.env,NODE_ENV:'production',BACKEND_DATA_SOURCE:'local',BACKEND_FS_ROOT:root,BACKEND_CACHE_DIR:cache},
    });
    const first = run();
    assert.equal(first.status, 0, first.stdout+first.stderr);
    assert.equal((await readdir(cache)).length, 2);
    // An invalid image inside the custom cache must not enter the collection scan.
    await writeFile(path.join(cache,'ignored.jpg'),'not an image');
    assert.equal(run().status, 0);
    await writeFile(path.join(root,'broken.jpg'),'not an image');
    const failed = run();
    assert.equal(failed.status, 1, failed.stdout+failed.stderr);
  } finally { await rm(temporary,{recursive:true,force:true}); }
});

