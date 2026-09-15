import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import type { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { resolveSafePath } from '../utils/safePath.js';

export interface StorageEntry {
  name: string;
  isDirectory(): boolean;
  isFile(): boolean;
}
export interface Storage {
  identity: string;
  list(relativePath: string): Promise<StorageEntry[]>;
  read(relativePath: string): Promise<Buffer>;
  stream(relativePath: string): Promise<Readable>;
  mkdir(relativePath: string): Promise<void>;
  write(relativePath: string, data: Buffer): Promise<void>;
  close(): void | Promise<void>;
}
export class LocalStorage implements Storage {
  readonly identity: string;
  constructor(readonly root: string) { this.identity = root; }
  async list(relativePath: string) { return fs.readdir(resolveSafePath(this.root, relativePath), { withFileTypes: true }); }
  async read(relativePath: string) { return fs.readFile(resolveSafePath(this.root, relativePath)); }
  async stream(relativePath: string) {
    const fullPath = resolveSafePath(this.root, relativePath);
    await fs.access(fullPath);
    return createReadStream(fullPath);
  }
  async mkdir(relativePath: string) { await fs.mkdir(resolveSafePath(this.root, relativePath), { recursive: true }); }
  async write(relativePath: string, data: Buffer) {
    const target = resolveSafePath(this.root, relativePath);
    const temporary = `${target}.${randomUUID()}.tmp`;
    try {
      await fs.writeFile(temporary, data);
      await fs.rename(temporary, target);
    } finally { await fs.unlink(temporary).catch(() => {}); }
  }
  close() {}
}
