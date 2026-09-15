import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { normalizeRelativePath } from '../src/utils/safePath.js';

for (const mode of ['default', 'external']) {
  test(`local API and cache: ${mode}`, () => {
    const result = spawnSync(process.execPath, ['--import', 'tsx', fileURLToPath(new URL('./local.fixture.ts', import.meta.url)), ...(mode === 'external' ? ['--external'] : [])], {encoding:'utf8',timeout:30000});
    assert.equal(result.status, 0, result.stdout + result.stderr);
  });
}
test('rejects traversal, absolute paths and Windows drive/stream paths', () => {
  for (const value of ['../photos-other/a','a/../../b','/etc/passwd','C:\\secret','\\\\host\\share','a:stream','a\0b']) {
    assert.throws(() => normalizeRelativePath(value), value);
  }
  assert.equal(normalizeRelativePath('album\\one.jpg'), 'album/one.jpg');
});
