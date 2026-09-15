import { Client } from '@awo00/smb2';
import { createRequire } from 'node:module';
import { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { normalizeRelativePath } from '../utils/safePath.js';
import type { Storage } from './storage.js';

// The library's high-level readers don't close handles on failure, and its
// readDirectory reads only one SMB page. Use handles with explicit cleanup.
const require = createRequire(import.meta.url);
const File = require('@awo00/smb2/dist/client/File.js').default as typeof import('@awo00/smb2/dist/client/File.js').default;
const Directory = require('@awo00/smb2/dist/client/Directory.js').default as typeof import('@awo00/smb2/dist/client/Directory.js').default;
type Tree = Awaited<ReturnType<Awaited<ReturnType<Client['authenticate']>>['connectTree']>>;
export interface NasOptions {
  host: string; share: string; path: string; username: string; password: string;
  domain: string; port: number;
}
function status(error: unknown): number | undefined {
  return (error as { header?: { status?: number } })?.header?.status;
}
function storageError(error: unknown): Error {
  const code = status(error);
  if (code === undefined) return error instanceof Error ? error : new Error('SMB operation failed');
  // Do not expose protocol response objects containing authentication packets.
  const result = new Error(`SMB error 0x${code.toString(16)}`) as NodeJS.ErrnoException;
  if (code === 0xc0000034 || code === 0xc000003a || code === 0xc000000f) result.code = 'ENOENT';
  if (code === 0xc0000022) result.code = 'EACCES';
  return result;
}
export class NasClient extends Client {
  override onResponse(response: Parameters<Client['onResponse']>[0]) {
    // STATUS_PENDING is an interim reply for asynchronous NAS I/O. Resolving
    // it as file data can corrupt a chunk; keep waiting for the final response.
    if (response.header.status === 0x00000103) return;
    super.onResponse(response);
  }
  override async send(request: Parameters<Client['send']>[0]) {
    try { return await super.send(request); }
    finally {
      const id = request.header.messageId!;
      clearTimeout(this.requestTimeoutIdMap.get(id));
      this.requestTimeoutIdMap.delete(id);
      this.responseCallbackMap.delete(id);
    }
  }
}
export class NasStorage implements Storage {
  readonly identity: string;
  private client?: Client;
  private connection?: Promise<Tree>;
  private readonly root: string;
  constructor(private readonly options: NasOptions) {
    this.root = normalizeRelativePath(options.path);
    if (/[\\/:]/.test(options.share)) throw new Error('BACKEND_NAS_SHARE must be a share name, without folders');
    this.identity = `smb://${options.host}:${options.port}/${options.share}/${this.root}`;
  }
  private remote(relativePath: string) {
    const value = [this.root, normalizeRelativePath(relativePath)].filter(Boolean).join('/');
    // The library removes a leading dot unconditionally. An explicit ./ prefix
    // preserves dot-prefixed names such as .cache_photo_browser_app.
    return value ? `./${value}` : '';
  }
  private async tree(): Promise<Tree> {
    if (this.connection && this.client?.connected) return this.connection;
    if (this.connection && !this.client?.socket?.destroyed) return this.connection;
    const client = new NasClient(this.options.host, { port: this.options.port, connectTimeout: 10000, requestTimeout: 30000 });
    this.client = client;
    this.connection = (async () => {
      try {
        const session = await client.authenticate(this.options);
        return await session.connectTree(this.options.share);
      } catch (error) {
        clearTimeout(client.connectTimeoutId);
        client.socket?.destroy();
        this.connection = undefined;
        throw storageError(error);
      }
    })();
    return this.connection;
  }
  async list(relativePath: string) {
    const remote = this.remote(relativePath);
    const directory = new Directory(await this.tree());
    try {
      await directory.open(remote);
      const entries = [];
      while (true) {
        try {
          const page = await directory.read();
          entries.push(...page);
        } catch (error) {
          if (status(error) === 0x80000006) break; // STATUS_NO_MORE_FILES
          throw error;
        }
      }
      return entries.filter(e => !e.fileAttributes.includes('ReparsePoint')).map(e => ({
        name: normalizeRelativePath(e.filename), isDirectory: () => e.type === 'Directory', isFile: () => e.type === 'File',
      }));
    } catch (error) { throw storageError(error); }
    finally { await directory.close().catch(() => {}); }
  }
  async read(relativePath: string) {
    const file = new File(await this.tree());
    try { await file.open(this.remote(relativePath)); return await file.read(); }
    catch (error) { throw storageError(error); }
    finally { await file.close().catch(() => {}); }
  }
  async stream(relativePath: string) {
    const file = new File(await this.tree());
    try { await file.open(this.remote(relativePath)); }
    catch (error) { throw storageError(error); }
    return Readable.from((async function* () {
      try { for await (const chunk of file.createReadStream()) yield chunk; }
      catch (error) { throw storageError(error); }
      finally { await file.close().catch(() => {}); }
    })());
  }
  async mkdir(relativePath: string) {
    const tree = await this.tree();
    let current = this.root;
    for (const part of normalizeRelativePath(relativePath).split('/').filter(Boolean)) {
      current = current ? `${current}/${part}` : part;
      try { await tree.createDirectory(`./${current}`); }
      catch (error) { if (status(error) !== 0xc0000035) throw storageError(error); }
    }
  }
  async write(relativePath: string, data: Buffer) {
    const tree = await this.tree();
    const target = this.remote(relativePath);
    const temporary = `${target}.${randomUUID()}.tmp`;
    try {
      await tree.createFile(temporary, data);
      // File.rename expects the SMB wire path; unlike open it does not normalize separators.
      await tree.renameFile(temporary, target.replace(/^\.\//, '').replace(/\//g, '\\'));
    } catch (error) {
      await tree.removeFile(temporary).catch(() => {});
      throw storageError(error);
    }
  }
  async close() {
    const client = this.client;
    this.connection = undefined;
    this.client = undefined;
    if (client) {
      try { await client.close(); } finally {
        clearTimeout(client.connectTimeoutId);
        for (const timer of client.requestTimeoutIdMap.values()) clearTimeout(timer);
        client.requestTimeoutIdMap.clear();
        client.socket?.destroy();
      }
    }
  }
}
