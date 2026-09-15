import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const temporary = await mkdtemp(path.join(tmpdir(), 'photo-browser-test-'));
const root = path.join(temporary, 'photos');
await mkdir(root);
Object.assign(process.env, {
  NODE_ENV: 'production', BACKEND_DATA_SOURCE: 'local', BACKEND_FS_ROOT: root,
  BACKEND_CACHE_DIR: process.argv.includes('--external') ? path.join(temporary, 'cache') : '',
  BACKEND_CACHE_WARMUP: 'false',
});
try {
  const { buildApp } = await import('../src/app.js');
  const { warmupImageCache } = await import('../src/services/imageCacheWarmup.service.js');
  await mkdir(path.join(root, 'album'));
  await sharp({ create: { width: 500, height: 250, channels: 3, background: 'red' } }).jpeg().toFile(path.join(root, 'album', 'one.jpg'));
  await writeFile(path.join(root, 'album', 'one.arw'), 'raw-content');
  const app = buildApp();
  try {
    assert.equal((await app.inject('/api/hi')).statusCode, 200);
    assert.deepEqual(await readdir(root), ['album']); // No eager cache creation.
    const listing = (await app.inject('/api/fs/dir?path=album')).json();
    assert.equal(listing.content.find((e: {name: string}) => e.name === 'one.jpg').rawPath, 'album/one.arw');
    const preview = await app.inject('/api/image/preview?path=album/one.jpg&size=small');
    assert.equal(preview.statusCode, 200);
    assert.equal((await sharp(preview.rawPayload).metadata()).width, 200);
    const cacheDir = process.env.BACKEND_CACHE_DIR || path.join(root, '.cache_photo_browser_app');
    assert.equal((await readdir(cacheDir)).length, 1);
    await warmupImageCache(root, ['small', 'big']);
    assert.equal((await readdir(cacheDir)).length, 2);
    assert.equal((await app.inject('/api/image/file?path=album/one.arw')).body, 'raw-content');
    assert.equal((await app.inject('/api/image/exif?path=album/one.jpg')).body, 'null');
    const zip = await app.inject({method:'POST',url:'/api/fs/zip',payload:{paths:['album/one.jpg'],raw:true}});
    assert.equal(zip.statusCode, 200);
    assert.equal(zip.rawPayload.subarray(0,2).toString(), 'PK');
    assert.ok(zip.rawPayload.includes(Buffer.from('one.arw')));
    assert.equal((await app.inject({method:'POST',url:'/api/fs/zip',payload:{paths:['../escape']}})).statusCode, 400);
    assert.ok(!(await app.inject('/api/fs/dir')).json().content.some((e: {name: string}) => e.name.startsWith('.cache')));
    await rm(path.join(root, 'album', 'one.jpg'));
    const cached = await app.inject('/api/image/preview?path=album/one.jpg&size=small');
    assert.deepEqual(cached.rawPayload, preview.rawPayload);
  } finally { await app.close(); }
} finally { await rm(temporary, {recursive:true,force:true}); }
