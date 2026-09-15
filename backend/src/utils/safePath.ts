import path from 'node:path';

export function normalizeRelativePath(userPath = ''): string {
  if (typeof userPath !== 'string' || /[\x00:]/.test(userPath)) throw new Error('Invalid path');
  const normalized = userPath.replace(/\\/g, '/');
  if (normalized.startsWith('/') || normalized.split('/').includes('..')) throw new Error('Access denied');
  return normalized.split('/').filter(part => part && part !== '.').join('/');
}
export function resolveSafePath(root: string, userPath = '') {
  return path.resolve(root, normalizeRelativePath(userPath));
}
