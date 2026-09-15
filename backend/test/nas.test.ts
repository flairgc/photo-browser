import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { Client } from '@awo00/smb2';
import { NasStorage } from '../src/services/nasStorage.js';
const require = createRequire(import.meta.url);
const Directory = require('@awo00/smb2/dist/client/Directory.js').default;
const File = require('@awo00/smb2/dist/client/File.js').default;
const options = {host:'192.0.2.1',share:'photos',path:'Family',username:'reader',password:'secret',domain:'',port:445};

test('SMB adapter: pagination, cache paths, cleanup, sanitized errors', async () => {
  const calls: string[] = [];
  const tree = {
    createDirectory: async (p: string) => { calls.push(`mkdir:${p}`); throw {header:{status:0xc0000035}}; },
    createFile: async (p: string) => { calls.push(`write:${p}`); },
    renameFile: async (_p: string, target: string) => { calls.push(`rename:${target}`); },
  };
  mock.method(Client.prototype, 'authenticate', async () => ({connectTree:async (share: string) => {
    assert.equal(share, 'photos'); return tree;
  }}));
  mock.method(Directory.prototype, 'open', async (p: string) => calls.push(`open:${p}`));
  let page = 0;
  mock.method(Directory.prototype, 'read', async () => {
    if (page++ === 2) throw {header:{status:0x80000006}};
    return [{filename:`./page${page}.jpg`,type:'File',fileAttributes:[]}];
  });
  mock.method(Directory.prototype, 'close', async () => calls.push('close-dir'));
  mock.method(File.prototype, 'open', async (p: string) => calls.push(`file:${p}`));
  mock.method(File.prototype, 'read', async () => { throw {header:{status:0xc0000034},request:{password:'secret'}}; });
  mock.method(File.prototype, 'close', async () => calls.push('close-file'));
  try {
    const nas = new NasStorage(options);
    assert.deepEqual((await nas.list('album')).map(e => e.name), ['page1.jpg','page2.jpg']);
    assert.ok(calls.includes('open:./Family/album'));
    assert.ok(calls.includes('close-dir'));
    await assert.rejects(nas.read('missing.jpg'), (error: NodeJS.ErrnoException) => {
      assert.equal(error.code, 'ENOENT');
      assert.ok(!JSON.stringify(error).includes('secret'));
      return true;
    });
    assert.ok(calls.includes('close-file'));
    await nas.mkdir('.cache_photo_browser_app');
    assert.deepEqual(calls.filter(c => c.startsWith('mkdir:')), ['mkdir:./Family/.cache_photo_browser_app']);
    await nas.write('.cache_photo_browser_app/key.bin', Buffer.from('preview'));
    assert.ok(calls.includes('rename:Family\\.cache_photo_browser_app\\key.bin'));
    assert.match(calls.find(c => c.startsWith('write:'))!, /key\.bin\..+\.tmp$/);
    await assert.rejects(nas.list('../outside'));
    assert.equal(nas.identity, 'smb://192.0.2.1:445/photos/Family');
    const rootNas = new NasStorage({...options, path:''});
    await rootNas.mkdir('.cache_photo_browser_app');
    await rootNas.write('.cache_photo_browser_app/key.bin', Buffer.from('preview'));
    assert.ok(calls.includes('mkdir:./.cache_photo_browser_app'));
    assert.ok(calls.includes('rename:.cache_photo_browser_app\\key.bin'));
    await assert.rejects(rootNas.read('.cache_photo_browser_app/missing.bin'));
    assert.ok(calls.includes('file:./.cache_photo_browser_app/missing.bin'));
  } finally { mock.restoreAll(); }
});
